const httpClient = require('../utils/http-client');
const service = require('./ContentPagesService');
const data = require('./ContentPagesService.spec.data');

jest.mock('../../src/utils/http-client');

describe('ContentPagesService', () => {
    httpClient.constants.FULL_CMS_PATH = 'FULL_PATH';

    describe('contentPagesGet', () => {
        it('should fetch all ContentPages if no contentIds are provided', async () => {
            const testStatusCode = 200;
            const expectedHasNextValue = false;

            httpClient.get.mockResolvedValue({ data: data.contentPagesGet, status: testStatusCode });

            const result = await service.contentPagesGet({ q: 'testPage', lang: 'EN' });

            result.contentPages.forEach((page) => {
                expect(page.id).toBeDefined();
            });
            expect(result.total).toEqual(data.contentPagesGet.pagination.totalCount);
            expect(result.hasNext).toEqual(expectedHasNextValue);
        });
    });
    describe('contentPagesContentIdsGet', () => {
        it('should fetch specific content Pages by Id', async () => {
            const testPage1 = data.contentPagesGet.response[0];
            const testPage2 = data.contentPagesGet.response[1];
            const testContentIds = [testPage1.uuid, testPage2.uuid];
            httpClient.get.mockResolvedValueOnce({ data: testPage1 }).mockResolvedValue({ data: testPage2 });

            const result = await service.contentPagesContentIdsGet(testContentIds);

            result.contentPages.forEach((page) => {
                expect(page.id).toBeDefined();
            });
            expect(result.total).toEqual(2);
        });
    });
    describe('getContentUrl', () => {
        it('', async () => {
            const testPage = data.contentPagesGet.response[0];
            const testContentId = testPage.uuid;
            const testLang = 'EN';
            httpClient.get.mockResolvedValue({ data: testPage });

            const result = await service.getContentUrl(testContentId, testLang);

            expect(result).toEqual({ url: testPage.label });
        });
    });
    describe('contentPagesContentIdDelete', () => {
        it('should remove the page', async () => {
            const testLang = 'EN';
            const testContentId = '123';

            await service.contentPagesContentIdDelete(testLang, testContentId);

            expect(httpClient.delete.mock.calls[0][0]).toEqual(`${httpClient.constants.FULL_CMS_PATH}/cmsitems/${testContentId}`);
        });
    });
    describe('contentPagesPost', () => {
        it('should add the page', async () => {
            const testLang = 'EN';
            const testRequestBody = data.requestBody;
            const createPagePayloadResponse = { data: { uuid: '123' }, status: 201 };
            httpClient.post.mockResolvedValue(createPagePayloadResponse);

            await service.contentPagesPost(testRequestBody, testLang);

            expect(httpClient.post.mock.calls[0][0]).toEqual(`${httpClient.constants.FULL_CMS_PATH}/cmsitems`);
            expect(httpClient.post.mock.calls[0][1].uid).toEqual(testRequestBody.pageUid);
            expect(httpClient.post.mock.calls[0][1].masterTemplate).toEqual(testRequestBody.template);
            expect(httpClient.post.mock.calls[0][1].approvalStatus).toEqual('APPROVED');
            expect(httpClient.post.mock.calls[0][1].pageStatus).toEqual('ACTIVE');
            expect(httpClient.post.mock.calls[0][1].label).toEqual(testRequestBody.label);
            expect(httpClient.post.mock.calls[0][1].name).toEqual(testRequestBody.label);
            expect(httpClient.post.mock.calls[0][1].title[testLang.toLowerCase()]).toEqual(testRequestBody.label);
        });
    });
    describe('contentPagesContentIdPut', () => {
        it('should update the page', async () => {
            const testContentId = '123';
            const testLang = 'EN';
            const testRequestBody = data.requestBody;
            const createPagePayloadResponse = { data: { uuid: testContentId }, status: 201 };
            httpClient.put.mockResolvedValue(createPagePayloadResponse);

            await service.contentPagesContentIdPut(testRequestBody, testLang, testContentId);

            expect(httpClient.put.mock.calls[0][0]).toEqual(`${httpClient.constants.FULL_CMS_PATH}/cmsitems/${testContentId}`);
            expect(httpClient.put.mock.calls[0][1].uuid).toEqual(testContentId);
            expect(httpClient.put.mock.calls[0][1].uid).toEqual(testRequestBody.pageUid);
            expect(httpClient.put.mock.calls[0][1].masterTemplate).toEqual(testRequestBody.template);
            expect(httpClient.put.mock.calls[0][1].approvalStatus).toEqual('APPROVED');
            expect(httpClient.put.mock.calls[0][1].pageStatus).toEqual('ACTIVE');
            expect(httpClient.put.mock.calls[0][1].label).toEqual(testRequestBody.label);
            expect(httpClient.put.mock.calls[0][1].name).toEqual(testRequestBody.label);
            expect(httpClient.put.mock.calls[0][1].title[testLang.toLowerCase()]).toEqual(testRequestBody.label);
        });
    });
});
