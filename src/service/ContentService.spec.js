const httpClient = require('../utils/http-client');
const service = require('./ContentService');
const data = require('./ContentPagesService.spec.data'); /* same as before (the shop responses dont change) */

const testTemplateMap = {
  content: "resultTemplate"
}

jest.mock('../../src/utils/http-client');
jest.mock('../resources/FStoSAPTemplateMapping.json', () => testTemplateMap)

describe('ContentService', () => {
  httpClient.constants.FULL_CMS_PATH = 'FULL_PATH';

  describe('contentGet', () => {
    it('should fetch all ContentPages if no contentIds are provided', async () => {
      const testStatusCode = 200;
      const expectedHasNextValue = false;

      httpClient.get.mockResolvedValue({ data: data.contentPagesGet, status: testStatusCode });

      const result = await service.contentGet( 'testPage', 'EN' );

      result.content.forEach((page) => {
        expect(page.id).toBeDefined();
      });
      expect(result.total).toEqual(data.contentPagesGet.pagination.totalCount);
      expect(result.hasNext).toEqual(expectedHasNextValue);
    });
  });
  describe('contentContentIdsGet', () => {
    it('should fetch specific content  by Id', async () => {
      const testPage1 = data.contentPagesGet.response[0];
      const testPage2 = data.contentPagesGet.response[1];
      const testContentIds = [testPage1.uuid, testPage2.uuid];
      httpClient.get.mockResolvedValueOnce({ data: testPage1, status: 200 }).mockResolvedValue({ data: testPage2, status: 200 });

      const result = await service.contentContentIdsGet(testContentIds);

      result.content.forEach((page) => {
        expect(page.id).toBeDefined();
      });
      expect(result.total).toEqual(2);
    });
  });
  describe('getContentUrl', () => {
    const testPage = data.contentPagesGet.response[0];
    const testContentId = testPage.uuid;
    const testLang = 'EN';
    it('returns the URL of the Content Object', async () => {
      httpClient.get.mockResolvedValue({ data: testPage, status: 200 });

      const result = await service.getContentUrl(testContentId, testLang);

      expect(result).toEqual({ url: testPage.label });
    });
  });
  describe('contentContentIdDelete', () => {
    it('should remove the page', async () => {
      const testLang = 'EN';
      const testContentId = '123';

      await service.contentContentIdDelete(testContentId, testLang);

      expect(httpClient.delete.mock.calls[0][0]).toEqual(`${httpClient.constants.FULL_CMS_PATH}/cmsitems/${testContentId}`);
    });
  });
  describe('contentPost', () => {
    const defaultLang = process.env.DEFAULT_LANG;

    const testRequestBody = {
      template: 'content',
      released: true,
      pageUid: 'testpage',
      label: {
        en : 'TestPage en',
        de : 'TestPage de',
      },
      path: {
        en : 'testpage-en',
        de : 'testpage-de',
      },
    };
    it('should add the page', async () => {
      const createPagePayloadResponse = { data: { uuid: '123' }, status: 201 };
      httpClient.post.mockResolvedValue(createPagePayloadResponse);

      await service.contentPost(testRequestBody);

      expect(httpClient.post.mock.calls[0][0]).toEqual(`${httpClient.constants.FULL_CMS_PATH}/cmsitems`);
      expect(httpClient.post.mock.calls[0][1].uid).toEqual(testRequestBody.pageUid);
      expect(httpClient.post.mock.calls[0][1].masterTemplate).toEqual(testTemplateMap[testRequestBody.template]);
      expect(httpClient.post.mock.calls[0][1].approvalStatus).toEqual('APPROVED');
      expect(httpClient.post.mock.calls[0][1].pageStatus).toEqual('ACTIVE');
      expect(httpClient.post.mock.calls[0][1].label).toEqual(testRequestBody.path[defaultLang]);
      expect(httpClient.post.mock.calls[0][1].name).toEqual(testRequestBody.label[defaultLang]);
      expect(httpClient.post.mock.calls[0][1].title).toEqual(testRequestBody.label);
    });
  });
  describe('contentContentIdPut', () => {
    const defaultLang = process.env.DEFAULT_LANG;

    const testContentId = '123';
    const testRequestBody = {
        template: 'content',
        released: true,
        pageUid: 'testpage',
        label: {
          en : 'TestPage en',
          de : 'TestPage de',
        },
        path: {
          en : 'testpage-en',
          de : 'testpage-de',
        },
    };
    it('should update the page', async () => {
      const createPagePayloadResponse = { data: { uuid: testContentId }, status: 201 };
      httpClient.put.mockResolvedValue(createPagePayloadResponse);

      await service.contentContentIdPut(testRequestBody, testContentId);

      expect(httpClient.put.mock.calls[0][0]).toEqual(`${httpClient.constants.FULL_CMS_PATH}/cmsitems/${testContentId}`);
      expect(httpClient.put.mock.calls[0][1].uuid).toEqual(testContentId);
      expect(httpClient.put.mock.calls[0][1].uid).toEqual(testRequestBody.pageUid);
      expect(httpClient.put.mock.calls[0][1].masterTemplate).toEqual(testTemplateMap[testRequestBody.template]);
      expect(httpClient.put.mock.calls[0][1].approvalStatus).toEqual('APPROVED');
      expect(httpClient.put.mock.calls[0][1].pageStatus).toEqual('ACTIVE');
      expect(httpClient.put.mock.calls[0][1].label).toEqual(testRequestBody.path[defaultLang]);
      expect(httpClient.put.mock.calls[0][1].name).toEqual(testRequestBody.label[defaultLang]);
      expect(httpClient.put.mock.calls[0][1].title).toEqual(testRequestBody.label);
    });
  });
});
