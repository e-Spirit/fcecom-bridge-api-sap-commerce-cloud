const axios = require('axios');
const oauth = require('axios-oauth-client');
const tokenInterceptor = require('axios-token-interceptor');
const logger = require('./logger');
const errorMapper = require('./error-mapper');

const LOGGING_NAME = 'http-client';

const {
    OAUTH_TOKEN_URL: url,
    CLIENT_ID: client_id,
    CLIENT_SECRET: client_secret,
    API_USERNAME: username,
    API_PASSWORD: password,
    AIR_KEY: airKey
} = process.env;

const getOwnerCredentials = oauth.client(axios.create(), { url, grant_type: 'password', client_id, client_secret, username, password });

const { OCC_BASE_URL, CMS_BASE_URL, BASE_SITE_ID, OCC_PATH, CMS_PATH } = process.env;

const createClient = (baseURL) => {
    const client = axios.create({ baseURL: baseURL });
    client.interceptors.request.use(oauth.interceptor(tokenInterceptor, getOwnerCredentials));
    client.interceptors.request.use((config) => {
        if (airKey) {
            config.headers['Application-Interface-Key'] = airKey;
        }
        return config;
    });

    client.interceptors.response.use(
        (response) => {
            logger.logInfo(
                LOGGING_NAME,
                `↳ Received response ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} ${response.statusText}`
            );
            return response;
        },
        (error) => {
            const { message, response } = error;
            const data = response?.data || message;
            const status = response?.status || 500;
            if (response) {
                if (response.data?.error === 'invalid_grant') {
                    return Promise.reject({ error: true, data: response?.data?.error_description, status: 401 });
                }
                if (response.data?.errors[0]?.type === 'UnknownIdentifierError') {
                    // Treat invalid categories as successes
                    return response;
                }

                logger.logError(
                    LOGGING_NAME,
                    `↳ Received response ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} ${
                        response.statusText
                    } ${message} ${JSON.stringify(data, null, 2)}`
                );
                errorMapper.mapErrors(response);
            } else {
                logger.logError(LOGGING_NAME, `↳ ${message}`);
            }

            return Promise.reject({ error: true, data, status });
        }
    );
    return client;
};

const occClient = createClient(OCC_BASE_URL);
const cmsClient = OCC_BASE_URL === CMS_BASE_URL ? occClient : createClient(CMS_BASE_URL);

module.exports = { occClient, cmsClient };
module.exports.constants = {
    FULL_OCC_PATH: OCC_PATH + BASE_SITE_ID,
    FULL_CMS_PATH: CMS_PATH + BASE_SITE_ID
};
