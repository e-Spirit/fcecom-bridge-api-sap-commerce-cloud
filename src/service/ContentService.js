const httpClient = require('../utils/http-client');
const templateMap = require('../resources/FStoSAPTemplateMapping.json');
const logger = require('../utils/logger');

const LOGGING_NAME = 'ContentService';

const { CONTENT_CATALOG_ID, CONTENT_CATALOG_VERSION, DEFAULT_LANG } = process.env;

/**
 * Converts page Data from the SAP Commerce Page response to the response body from the Bridge
 * @param {*} page the SAP Commerce Page as responded by the CMSWebservices API
 * @param {string} lang the language of the request
 * @return {{extract: string, id: string, label:string}} the converted/simplified page as used by FirstSpirit
 */
const createContentPageResponseBody = (page, lang = DEFAULT_LANG) => {
    return {
        id: page.uuid,
        label: page.title[lang.toLowerCase()],
        extract: page.label
    };
};

/**
 * Converts Page Data received by the Bridge API and converts it into an Page object needed by the SAP Commerce CMSWebservices API
 * @param requestBody the body of the request as received by the Bridge API call
 * @param uuid the uuid of the pageItem, passed as path parameter in the Bridge API call
 * @return {{catalogVersion: string, approvalStatus: (string), uid, pageStatus: (string), defaultPage: boolean, itemtype: string, masterTemplate: string, name, label, title: {[p: string]: *}, uuid: undefined, homepage: boolean}}
 */
const createContentPageRequestBody = (requestBody, uuid) => {
    return {
        uuid: uuid,
        uid: requestBody.pageUid,
        itemtype: 'ContentPage',
        catalogVersion: `${CONTENT_CATALOG_ID}/${CONTENT_CATALOG_VERSION}`,
        masterTemplate: templateMap[requestBody.template],
        // See https://help.sap.com/doc/02d5152884b34821a06408495ba0b771/1905/en-US/de/hybris/platform/cms2/enums/package-summary.html for ENUM values
        approvalStatus: requestBody.released ? 'APPROVED' : 'UNAPPROVED',
        pageStatus: requestBody.released ? 'ACTIVE' : 'DELETED',
        defaultPage: true,
        homepage: false,
        label: requestBody.path[DEFAULT_LANG.toLowerCase()],
        name: requestBody.label[DEFAULT_LANG.toLowerCase()],
        title: requestBody.label
    };
};

/**
 * Retrieves CMSItems from the SAP Commerce CMSWebservices api via ID
 * @param {string} pageId The Id of the Page to retrieve
 * @param {string} lang the Language to be used for the call
 * @return {Promise<AxiosResponse<any>>} The Page found in SAP Commerce
 */
const fetchContentPageById = async (pageId, lang) => {
    const params = `${pageId}?lang=${lang}&pageSize=500&currentPage=0`;

    logger.logDebug(LOGGING_NAME, `Performing GET request to /cmsitems/ with parameters ${params}`);

    return await httpClient.cmsClient.get(httpClient.constants.FULL_CMS_PATH + `/cmsitems/${params}`);
};

/**
 * Fetches the Content Pages from SAP Commerce with option to retrieve them by keyword search or by Page IDs.
 * Also includes Pagination
 * @param {string[]} contentIds the Ids of the requested Pages, as a comma seperated string
 * @param {number} page the page that is to be requested (relevant for the pagination) (default: 1)
 * @param {string} keyword the keyword used to filter the items and refine the search
 * @param {string} lang the Language to be used for the call
 * @return {Promise<{total: number, pages: *, hasNext: boolean, responseStatus: number}>} The Pages found in SAP Commerce
 */
const fetchContentPages = async ({ contentIds, page = 1, q: keyword, lang }) => {
    let { pages = [], total = 0, hasNext = false, responseStatus = 200 } = {};

    if (contentIds) {
        pages = await Promise.all(
            contentIds.map(async (pageId) => {
                try {
                    const { data } = await fetchContentPageById(pageId, lang);
                    return data;
                } catch (error) {
                    return { errors: true };
                }
            })
        );
        pages = pages
            .map((page) => createContentPageResponseBody(page, lang))
            .filter((pageItem) => {
                return !!pageItem.id;
            });
        total = pages.length;
    } else {
        let pageSize = 20;
        let params = new URLSearchParams({
            catalogId: CONTENT_CATALOG_ID,
            catalogVersion: CONTENT_CATALOG_VERSION,
            currentPage: page - 1,
            pageSize: pageSize,
            typeCode: 'ContentPage',
            lang
        });
        if (keyword) params.append('mask', keyword);

        logger.logDebug(LOGGING_NAME, `Performing GET request to /cmsitems with parameters ${params}`);

        const { data, status } = await httpClient.cmsClient.get(httpClient.constants.FULL_CMS_PATH + `/cmsitems?${params}`);
        pages = data.response?.map((page) => createContentPageResponseBody(page, lang));
        responseStatus = status;
        total = data.pagination?.totalCount;
        hasNext = data.pagination?.totalCount > page * pageSize || false;
    }

    return { pages, total, hasNext, responseStatus };
};

/**
 * Fetches a Content Page based on its Id and returns its URL
 * @param {string} contentId the Id of the Content Page whose URL is requested
 * @param {string} lang the language used for the API Call
 * @return {{url: string}} The URL of the given product, null if given ID is invalid.
 */
const getContentUrl = async (contentId, lang) => {
    const { content } = await contentContentIdsGet([contentId], lang);
    return content.length > 0 ? { url: content[0].extract } : '';
};

/**
 * Fetches a Content Page based on its URL and returns its type and Id
 * @param {string} url the URL of the Content Page whose Id is requested
 * @param {string} lang the language used for the API Call
 * @return {Promise<string>} The identifier of the given page.
 */
const getContentIdByUrl = async (url, lang = 'en') => {
    let params = new URLSearchParams({
        catalogId: CONTENT_CATALOG_ID,
        catalogVersion: CONTENT_CATALOG_VERSION,
        currentPage: 0,
        pageSize: 1,
        typeCode: 'ContentPage',
        lang,
        itemSearchParams: `label:${url}`
    });

    logger.logDebug(LOGGING_NAME, `Performing GET request to /cmsitems with parameters ${params}`);

    const { data } = await httpClient.cmsClient.get(httpClient.constants.FULL_CMS_PATH + `/cmsitems?${params}`);
    const contentPage = data.response[0];
    return {
        type: 'content',
        id: contentPage.uuid
    };
};

/**
 * This method returns all content pages.
 * Will also update the cache with the latest values.
 *
 * @param {string} query Query string to search pages for.
 * @param {string} [lang] Language of the request.
 * @param {number} [page=1] Number of the page to retrieve.
 * @return An array containing all content pages.
 */
const contentGet = async (query, lang, page) => {
    const { pages: content, hasNext, total } = await fetchContentPages({ page, q: query, lang });

    return { content, total, hasNext };
};

/**
 * This method returns the content pages with the given IDs.
 * Will ignore invalid IDs.
 *
 * @param {number[]} contentIds Array of IDs of content pages to get.
 * @param {string} [lang] Language of the request.
 * @return {[*]} The content pages for the given IDs.
 */
const contentContentIdsGet = async (contentIds, lang) => {
    const { pages } = await fetchContentPages({ contentIds, lang });

    return {
        content: pages,
        total: pages.length,
        hasNext: false
    };
};

/**
 * This method creates a page using the SAP API.
 *
 * @param {object} payload Payload created using `createPagePayload`.
 * @return {*} The response data received from the SAP API.
 */
const contentPost = async (payload) => {
    const cmsItemBody = createContentPageRequestBody(payload);

    logger.logDebug(LOGGING_NAME, `Performing POST request to /cmsitems with body ${JSON.stringify(cmsItemBody)}`);

    const { data } = await httpClient.cmsClient.post(httpClient.constants.FULL_CMS_PATH + `/cmsitems`, cmsItemBody);

    return data.uuid ? { id: data.uuid } : data;
};

/**
 * This method moves or renames a page using the SAP API.
 *
 * @param {number} contentId ID of the page to move or rename.
 * @param {object} payload Payload created using `createPagePayload` containing the new values.
 */
const contentContentIdPut = async (payload, contentId) => {
    const cmsItemBody = createContentPageRequestBody(payload, contentId);

    logger.logDebug(
        LOGGING_NAME,
        `Performing PUT request to /cmsitems/ with parameters ${contentId} and body ${JSON.stringify(cmsItemBody)}`
    );

    const { data } = await httpClient.cmsClient.put(httpClient.constants.FULL_CMS_PATH + `/cmsitems/` + contentId, cmsItemBody);

    const responseBody = data.uuid ? { id: data.uuid } : data;

    return responseBody;
};

/**
 * This method deletes the page with the given ID.
 *
 * @param {number} contentId ID of the page to delete.
 */
const contentContentIdDelete = async (contentId) => {
    logger.logDebug(LOGGING_NAME, `Performing DELETE request to /cmsitems/ with parameters ${contentId}`);

    await httpClient.cmsClient.delete(httpClient.constants.FULL_CMS_PATH + `/cmsitems/` + contentId);
};

module.exports = {
    contentContentIdsGet,
    getContentUrl,
    getContentIdByUrl,
    contentGet,
    contentPost,
    contentContentIdPut,
    contentContentIdDelete
};
