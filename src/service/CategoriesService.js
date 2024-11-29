const httpClient = require('../utils/http-client');
const logger = require('../utils/logger');

const LOGGING_NAME = 'CategoriesService';

const { CATALOG_ID, CATALOG_VERSION, DEFAULT_LANG } = process.env;
// Map to cache category IDs in order to resolve their URLs later
const idCache = new Map();

const LIMIT = 20;

/**
 * This method recursively creates a nested tree structure for the given categories.
 *
 * @param {any[]} categories The arrays of categories to work with.
 */
const buildCategoryTree = (categories) =>
    categories.map(({ id, name: label, subcategories = [] }) => {
        const children = buildCategoryTree(subcategories);
        return { id, label, ...(children.length && { children }) };
    });

const getRelevantCategories = (categories, parentId, getTree) => {
    if (parentId) {
        let result;
        for (const category of categories) {
            if (category.id === parentId) {
                const relevantCategories = category.subcategories || [];
                result = getTree ? buildCategoryTree(relevantCategories) : getCategoryList(relevantCategories);
            }
            result = getRelevantCategories(category.subcategories, parentId, getTree) || result;
        }
        return result;
    } else {
        return getTree ? buildCategoryTree(categories) : getCategoryList(categories);
    }
};

/**
 * This Method traverses through the Category tree and builds fills the idCache with data
 *
 * @param {any[]} categories: the categories
 */
const buildCache = (categories) =>
    categories.forEach(({ id, url, subcategories }) => {
        idCache.set(id, url);
        idCache.set(url, id);
        buildCache(subcategories);
    });

/**
 * This method fetches all categories and returns them as a nested structure.
 * @see SwaggerUI {@link http://localhost:3000/api/#/categories/get_categories}
 *
 * @param {string} lang the language used for the request
 * @param {boolean} getTree flag to decide if a Category List or the Category Tree is retrieved
 * @param {string} parentId a filter attribute to filter the Category tree
 * @return Promise<*> The category tree.
 */
const fetchCategories = async (lang = DEFAULT_LANG, parentId, getTree = false) => {
    logger.logDebug(LOGGING_NAME, `Performing GET request to /catalogs/ with parameters ${CATALOG_ID}/${CATALOG_VERSION}?lang=${lang}`);

    let { data: { categories = [] } = {}, status } = await httpClient.occClient.get(
        httpClient.constants.FULL_OCC_PATH + `/catalogs/${CATALOG_ID}/${CATALOG_VERSION}?lang=${lang}`
    );
    categories = categories.filter(({ name }) => !!name);
    buildCache(categories);
    return {
        status,
        data: getRelevantCategories(categories, parentId, getTree) || [],
        total: categories.length
    };
};

/**
 * This method fetches all categories provided via the categoryIds comma seperated string.
 * @see SwaggerUI {@link http://localhost:3000/api/#/categories/get_categories}
 *
 * @param {string[]} categoryIds a comma seperated string to represent the categoryIds (e.G. id1,id2)
 * @param {string} lang the language used for the request
 */
const fetchCategoriesByIds = async ({ categoryIds, lang = DEFAULT_LANG }) => {
    let hasError = false;
    let lastError;
    let categories = await Promise.all(
        categoryIds.map(async (categoryId) => {
            logger.logDebug(
                LOGGING_NAME,
                `Performing GET request to /catalogs/ with parameters ${CATALOG_ID}/${CATALOG_VERSION}/categories/${categoryId}?lang=${lang}`
            );

            try {
                const { data, status } = await httpClient.occClient.get(
                    httpClient.constants.FULL_OCC_PATH +
                        `/catalogs/${CATALOG_ID}/${CATALOG_VERSION}/categories/${categoryId}?${new URLSearchParams({ lang })}`
                );
                return data;
            } catch (error) {
                hasError = true;
                lastError = error;
                return { errors: true };
            }
        })
    );

    if (hasError) {
        return Promise.reject(lastError);
    }

    categories = categories
        .filter((category) => !category.errors)
        .map((category) => {
            return { id: category.id, label: category.name };
        });

    return { categories, status: 200 };
};

/**
 * This method returns the URL for the category with the given ID.
 *
 * @param {string} categoryId ID of the category to get the URL for.
 * @param {string} lang the language to get the URL for.
 * @return {Promise<string>} The URL of the category, null if given ID is invalid.
 */
const getCategoryUrl = async (categoryId, lang) => {
    idCache.size || (await fetchCategories(lang, true));
    if (idCache.has(categoryId)) {
        return { url: idCache.get(categoryId) };
    } else {
        logger.logError(LOGGING_NAME, 'Invalid categoryId passed', categoryId);
        return null;
    }
};

/**
 * This Method returns the passed Categories in a flat list
 * @param {{id: string, name: string, subcategories: *[]}[]} categories
 * @return {{id: string, name: string, subcategories: *[]}[]}
 */
const getCategoryList = (categories) => {
    let resultList = [];
    for (const category of categories) {
        resultList.push({ id: category.id, label: category.name });
        if (category.subcategories && category.subcategories.length) resultList.push(...getCategoryList(category.subcategories));
    }
    return resultList;
};

/**
 * This method filters categories by their label based on the given keyword.
 * @param {string} keyword Keyword to filter the categories by.
 * @param {any[]} categories Categories to filter.
 * @return {any[]} Filtered categories.
 */
const filterCategories = (keyword, categories) => {
    const query = keyword.toLowerCase();
    return categories.filter((category) => category.label?.toLowerCase().includes(query));
};

/**
 * Recursively counts the total number of categories in a category tree structure.
 * @param {any[]} tree Category tree.
 * @returns {number} Total count of all categories including nested children.
 */
const countCategories = (tree) =>
    tree.reduce((count, { children = [] }) => count + 1 + countCategories(children), 0);

/**
 * This method fetches all categories and returns them as a flat list structure.
 * @see SwaggerUI {@link http://localhost:3000/api/#/categories/get_categories}
 *
 * @param {number} [parentId] ID of the parent category to filter categories by.
 * @param {string} [keyword] Keyword to filter the categories by.
 * @param {string} [lang] Language of the request.
 * @param {number} [page=1] Number of the page to retrieve.
 * @return Promise<{ hasNext: boolean, total: number, categories: any[]}> The category tree.
 */
const categoriesGet = async (parentId, keyword, lang, page = 1) => {
    let { data } = await fetchCategories(lang, parentId, false);

    if (keyword) {
        data = filterCategories(keyword, data);
    }

    const total = data.length;
    const pageSize = LIMIT;
    const hasNext = page * pageSize <= total;
    const start = pageSize * (page - 1);
    const end = pageSize * page;
    const categories = data.slice(start, end);

    return { categories, total, hasNext };
};

/**
 * This method fetches all categories and returns them as a nested structure.
 * @see SwaggerUI {@link http://localhost:3000/api/#/categories/get_categories}
 *
 * @param {number | string} [parentId] ID of the parent category to filter categories by.
 * @param {string} [lang] Language of the request.
 * @return Promise<{ total: number, categories: any[]}> The category tree.
 */
const categoryTreeGet = async (parentId, lang) => {
    const { data } = await fetchCategories(lang, parentId, true);
    const total = countCategories(data);

    return { categorytree: data, total };
};

/**
 * This method fetches the data for the categories with the given IDs.
 * @see SwaggerUI {@link http://localhost:3000/api/#/Categories/categoriesCategoryIdsGet}
 *
 * @param {string[]} [categoryIds] IDs of the categories to get.
 * @param {string} [lang] Language of the request.
 * @return Promise<{ hasNext: boolean, total: number, categories: any[]}> The category data.
 */
const categoriesCategoryIdsGet = async (categoryIds, lang) => {
    const { categories } = await fetchCategoriesByIds({ categoryIds, lang });

    return { categories, total: categories.length, hasNext: false };
};

module.exports = {
    buildCategoryTree,
    fetchCategories,
    fetchCategoriesByIds,
    getRelevantCategories,
    getCategoryUrl,
    getCategoryList,
    categoriesGet,
    categoryTreeGet,
    categoriesCategoryIdsGet
};
