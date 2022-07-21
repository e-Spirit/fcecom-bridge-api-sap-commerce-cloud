const httpClient = require('../utils/http-client');

const { MEDIA_CDN_URL } = process.env;

/**
 * This method fetches all products and transforms them into the internal model.
 *
 * @param { page = 1, productIds, categoryId, q: keyword } The parameters to use.
 * @return The fetched products.
 */
const fetchProducts = async ({ page = 1, productIds, categoryId, q: keyword }) => {
    const fields = 'code,name,url,images(format,url)';
    let { products = [], total = 0, hasNext = false, responseStatus = 200 } = {};

    if (productIds) {
        products = await Promise.all(
            productIds.map(async (productId) => {
                const { data } = await httpClient.get(
                    httpClient.constants.FULL_OCC_PATH + `/products/${productId}?${new URLSearchParams({ fields })}`
                );
                return data;
            })
        );
        products = products.filter((product) => !product.errors);
        total = products?.length;
    } else {
        const query = `${keyword || ''}:relevance${categoryId ? `:category:${categoryId}` : ''}`;
        const { data, status } = await httpClient.get(
            httpClient.constants.FULL_OCC_PATH +
                `/products/search?${new URLSearchParams({ query, fields: `products(${fields})`, currentPage: page - 1 })}`
        );
        products = data.products || [];
        responseStatus = status;
        total = data.pagination?.totalResults || 0;
        hasNext = page < data.pagination?.totalPages || false;
    }

    products = products.map(({ code: id, name: label, images = [], url }) => {
        const { thumbnail, product: image } = images.reduce(
            (map, { format, url }) => Object.assign(map, { [format]: MEDIA_CDN_URL + url }),
            {}
        );
        return { id, label, extract: url, thumbnail, image };
    });

    return { products, total, hasNext, responseStatus };
};

/**
 * This method returns the URL for the given product.
 *
 * @param {number} productId The ID of the product to get the URL for.
 * @return {string} The URL of the given product.
 */
const getProductUrl = async (productId) => {
    const { data } = await httpClient.get(
        httpClient.constants.FULL_OCC_PATH + `/products/${productId}?${new URLSearchParams({ fields: 'url' })}`
    );
    return { url: data.url };
};

/**
 * This method fetches all products and transforms them into the internal model.
 *
 * @param {number} [categoryId] ID of the category to get products from.
 * @param {string} [keyword] Keyword to filter the products by.
 * @param {string} [lang] Language of the request.
 * @param {number} [page=1] Number of the page to retrieve.
 * @return The fetched products.
 */
const productsGet = async (categoryId, keyword, lang, page = 1) => {
    const { products, total, hasNext, responseStatus } = await fetchProducts({ page, categoryId, q: keyword });

    return { products, total, hasNext };
};

/**
 * This method fetches the data for the products with the given IDs.
 * @see SwaggerUI {@link http://localhost:3000/api/#/Products/productsProductIdsGet}
 *
 * @param {string[]} [productIds] IDs of the categories to get.
 * @return Promise<{ hasNext: boolean, total: number, products: any[]}> The category data.
 */
const productsProductIdsGet = async (productIds) => {
    const { products } = await fetchProducts({ productIds });

    return { products, total: products.length, hasNext: false };
};

module.exports = {
    productsProductIdsGet,
    productsGet,
    getProductUrl
};
