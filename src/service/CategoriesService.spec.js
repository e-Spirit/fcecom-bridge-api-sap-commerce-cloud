const httpClient = require('../utils/http-client');
const data = require('./CategoriesService.spec.data');
const service = require('./CategoriesService');

jest.mock('../../src/utils/http-client');

describe('CategoriesService', () => {
    const testLang = 'EN';
    const testCategory = data.categoriesGet.categories[0];
    httpClient.constants.FULL_OCC_PATH = 'path/to/OCC';

    describe('getCategoryUrl', () => {
        it('returns the URL of the given category', async () => {
            httpClient.get.mockResolvedValue({ data: data.categoriesGet, status: 200 });

            const result = await service.getCategoryUrl(testCategory.id, testLang);

            expect(result).toEqual({ url: testCategory.url });
            expect(httpClient.get.mock.calls[0][0]).toEqual('path/to/OCC/catalogs/catalog_id/catalog_version?lang=EN');
        });
        it('returns null if the given category is invalid', async () => {
            console.error = jest.fn();
            httpClient.get.mockResolvedValue({ data: data.categoriesGet });

            const result = await service.getCategoryUrl('-999', testLang);

            expect(result).toEqual(null);
            expect(console.error).toHaveBeenCalled();
        });
    });
    describe('fetchCategories', () => {
        it('returns the categories as tree', async () => {
            process.env = {
                CATALOG_ID: 'catalog_id',
                CATALOG_VERSION: 'catalog_version'
            };

            httpClient.get.mockResolvedValue({ data: data.categoriesGet, status: 200 });

            const result = await service.fetchCategories(testLang, undefined, true);

            expect(httpClient.get.mock.calls[0][0]).toEqual('path/to/OCC/catalogs/catalog_id/catalog_version?lang=EN');
            expect(result).toEqual(data.buildCategoryTreeResult);
        });
        it('returns the categories as list', async () => {
            httpClient.get.mockResolvedValue({ data: data.categoriesGet, status: 200 });

            const result = await service.fetchCategories(testLang);

            expect(httpClient.get.mock.calls[0][0]).toEqual('path/to/OCC/catalogs/catalog_id/catalog_version?lang=EN');
            expect(result).toEqual(data.categoriesGetResult);
        });
    });
    describe('buildCategoryTree', () => {
        it('converts the categories tree to the one required for further manipulations', () => {
            const result = service.buildCategoryTree(data.categoriesGet.categories);

            expect(result[0].id).toEqual(data.buildCategoryTreeResult.data[0].id);
            expect(result[1].id).toEqual(data.buildCategoryTreeResult.data[1].id);
            expect(result[0].children[0].id).toEqual(data.buildCategoryTreeResult.data[0].children[0].id);
            expect(result[0].children[1].id).toEqual(data.buildCategoryTreeResult.data[0].children[1].id);
            expect(result[2].id).toEqual(data.buildCategoryTreeResult.data[2].id);
        });
    });
    describe('getCategoryList', () => {
        it('converts the categories tree to a flat array', async () => {
            const result = service.getCategoryList(data.categoriesGet.categories);

            expect(result[0].children).toBeUndefined();
            expect(result[1].children).toBeUndefined();
            expect(result[3].children).toBeUndefined();
            expect(result[5].children).toBeUndefined();
        });
    });
    describe('getCategoriesById', () => {
        it('fetches Categories data based on provided ids', async () => {
            const testCategory1 = data.categoriesGet.categories[0];
            const testCategory2 = data.categoriesGet.categories[1];
            const testCategoryIds = [testCategory1.id, testCategory2.id];
            httpClient.get.mockResolvedValueOnce({ data: testCategory1 }).mockResolvedValue({ data: testCategory2 });

            const result = await service.fetchCategoriesByIds({ categoryIds: testCategoryIds, lang: 'EN' });

            result.categories.forEach((category) => {
                expect(category.id).toBeDefined();
            });
        });
    });
    describe('getRelevantCategories', () => {
        it('retrieves the relevant Subtree', () => {
            const testCategory = data.categoriesGet.categories[0].subcategories[1];
            const testParentId = testCategory.id;

            const result = service.getRelevantCategories(data.categoriesGet.categories, testParentId, true);

            const expectedResult = data.buildCategoryTreeResult.data[0].children[1].children;

            expect(result).toEqual(expectedResult);
            for (const category of result) {
                expect(result.children).toBeUndefined(); // deepest level of tree
            }
        });
        it('returns undefined when category does not exist', () => {
            const testParentId = 'not_found';

            const result = service.getRelevantCategories(data.categoriesGet.categories, testParentId, true);

            expect(result).toEqual(undefined);
        });
        it('returns entire tree when parentId is ommited', () => {
            const result = service.getRelevantCategories(data.categoriesGet.categories, undefined, true);

            expect(result.length).toEqual(data.categoriesGet.categories.length);
            expect(result).toEqual(data.buildCategoryTreeResult.data);
        });
    });

    describe('categoriesGet', () => {
        it('returns the categories as list (no parent ID, no pagination)', async () => {
            httpClient.get.mockResolvedValue({ data: data.categoriesGet.categories });

            const result = await service.categoriesGet();

            expect(httpClient.get.mock.calls[0][0]).toEqual('path/to/OCC/catalogs/catalog_id/catalog_version?lang=undefined');
            expect(result.categories.length).toEqual(data.categoriesGet.categories.length);
            for (let i = 0; i < data.categoriesGet.categories.length; i++) {
                // Check if every category from the test data set is present in the result (ignore ordering)
                expect(result.categories.findIndex((category) => category.id === data.categoriesGet.categories[i].id) !== -1).toEqual(true);
            }
            expect(result.hasNext).toEqual(false);
            expect(result.total).toEqual(data.categoriesGet.categories.length);
        });
        it('returns the categories as list (with parent ID)', async () => {
            httpClient.get.mockResolvedValue({ data: data.categoriesGet.categories });

            const result = await service.categoriesGet(data.categoriesGet.categories[0].id);

            expect(httpClient.get.mock.calls[0][0]).toEqual('path/to/OCC/catalogs/catalog_id/catalog_version?lang=undefined');
            expect(result.categories.length).toEqual(3);
            expect(result.categories[0].id).toEqual('18');
            expect(result.categories[1].id).toEqual('20');
            expect(result.categories[2].id).toEqual('23');
        });
        it('returns the categories as list (with pagination)', async () => {
            httpClient.get.mockResolvedValue({ data: data.categoriesGet.categories });

            const result = await service.categoriesGet(0, 'EN', 123);

            expect(httpClient.get.mock.calls[0][0]).toEqual('path/to/OCC/catalogs/catalog_id/catalog_version?lang=EN');
            expect(result.categories.length).toEqual(0);
            expect(result.hasNext).toEqual(false);
            expect(result.total).toEqual(data.categoriesGet.categories.length);
        });
    });
    describe('categoryTreeGet', () => {
        it('returns the categories as tree (no parent ID)', async () => {
            httpClient.get.mockResolvedValue({ data: data.categoriesGet, status: 200 });

            const result = await service.categoryTreeGet();

            expect(httpClient.get.mock.calls[0][0]).toEqual('path/to/OCC/catalogs/catalog_id/catalog_version?lang=undefined');
            expect(result.categorytree[0].id).toEqual('18');
            expect(result.categorytree[0].children[0].id).toEqual('19');
            expect(result.categorytree[0].children[1].id).toEqual('21');
            expect(result.categorytree[0].children[1].children[0].id).toEqual('212');
            expect(result.categorytree[1].id).toEqual('20');
            expect(result.categorytree[2].id).toEqual('23');
            expect(result.hasNext).toEqual(false);
            expect(result.total).toEqual(data.categoriesGet.categories.length);
        });
        it('returns the categories as tree (with parent ID)', async () => {
            httpClient.get.mockResolvedValue({ data: data.categoriesGet, status: 200 });

            const result = await service.categoryTreeGet(data.categoriesGet.categories[0].id);

            expect(httpClient.get.mock.calls[0][0]).toEqual('path/to/OCC/catalogs/catalog_id/catalog_version?lang=undefined');
            expect(result.categorytree[0].id).toEqual('19');
            expect(result.categorytree[1].id).toEqual('21');
            expect(result.categorytree[1].children[0].id).toEqual('212');
            expect(result.hasNext).toEqual(false);
            expect(result.total).toEqual(data.categoriesGet.categories.length);
        });
        it('returns the categories as tree (with parent ID from level 2)', async () => {
            httpClient.get.mockResolvedValue({ data: data.categoriesGet, status: 200 });

            const result = await service.categoryTreeGet('21');

            expect(httpClient.get.mock.calls[0][0]).toEqual('path/to/OCC/catalogs/catalog_id/catalog_version?lang=undefined');
            expect(result.categorytree[0].id).toEqual('212');
            expect(result.categorytree[0].children[0].id).toEqual('2121');
            expect(result.hasNext).toEqual(false);
            expect(result.total).toEqual(data.categoriesGet.categories.length);
        });
    });

    describe('categoriesCategoryIdsGet', () => {
        it('returns the categories pages with the given IDs', async () => {
            const categoryIds = [data.categoriesGet.categories[0].id, -999];
            const testCategory1 = data.categoriesGet.categories[0];
            httpClient.get.mockResolvedValueOnce({ data: testCategory1 }).mockResolvedValue({ data: { errors: true } });

            const result = await service.categoriesCategoryIdsGet(categoryIds);

            expect(result.categories.length).toEqual(1);
            expect(result.categories[0].id).toEqual(categoryIds[0]);
            expect(result.total).toEqual(1);
        });
    });
});
