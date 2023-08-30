const service = require('./MappingService');
const productsData = require('./ProductsService.spec.data');
const ProductsService = require('./ProductsService');
const categoriesData = require('./CategoriesService.spec.data');
const CategoriesService = require('./CategoriesService');
const contentPagesData = require('./ContentService.spec.data');
const ContentPagesService = require('./ContentService');

jest.mock('../../src/service/ProductsService');
jest.mock('../../src/service/CategoriesService');
jest.mock('../../src/service/ContentService');

describe('MappingService', () => {
    describe('storefrontUrlGet', () => {
        it('returns the storefront url for a product', async () => {
            const type = 'product';
            const id = productsData.fetchProducts.products[0].id;
            const lang = 'EN';
            const url = 'URL';
            ProductsService.getProductUrl.mockResolvedValue({ url });

            const result = await service.storefrontUrlGet(type, id, lang);

            expect(result).toEqual({ url });
            expect(ProductsService.getProductUrl.mock.calls[0][0]).toEqual(id);
        });
        it('returns the storefront url for a category', async () => {
            const type = 'category';
            const id = categoriesData.categoriesGet.categories[0].id;
            const lang = 'EN';
            const url = 'URL';
            CategoriesService.getCategoryUrl.mockResolvedValue({ url });

            const result = await service.storefrontUrlGet(type, id, lang);

            expect(result).toEqual({ url });
            expect(CategoriesService.getCategoryUrl.mock.calls[0][0]).toEqual(id);
        });
        it('returns the storefront url for a content page', async () => {
            const type = 'content';
            const id = contentPagesData.contentPagesGet.response[0].id;
            const lang = 'EN';
            const url = 'URL';
            ContentPagesService.getContentUrl.mockResolvedValue({ url });

            const result = await service.storefrontUrlGet(type, id, lang);

            expect(result).toEqual({ url });
            expect(ContentPagesService.getContentUrl.mock.calls[0][0]).toEqual(id);
        });
    });
    describe('lookupUrlGet', () => {
        it('returns the identifier for a storefront URL for products', async () => {
            const identifier = {
                type: 'product',
                id: '123'
            };
            const url = `https://mycommerce.com/catalog/p/${identifier.id}`;

            const result = await service.lookupUrlGet(url);

            expect(result).toEqual(identifier);
        });
        it('returns the identifier for a storefront URL for categories', async () => {
            const identifier = {
                type: 'category',
                id: '123'
            };
            const url = `https://mycommerce.com/catalog/categories/${identifier.id}`;

            const result = await service.lookupUrlGet(url);

            expect(result).toEqual(identifier);
        });
        it('returns the identifier for a storefront URL for content pages', async () => {
            const identifier = {
                type: 'content',
                id: '123'
            };
            const url = `https://mycommerce.com/catalog/-/${identifier.id}`;
            ContentPagesService.getContentIdByUrl.mockResolvedValue(identifier);

            const result = await service.lookupUrlGet(url);

            expect(result).toEqual(identifier);
            expect(ContentPagesService.getContentIdByUrl.mock.calls[0][0]).toEqual(url);
        });
    });
});
