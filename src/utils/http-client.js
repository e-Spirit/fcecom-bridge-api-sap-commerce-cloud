const axios = require('axios');
const oauth = require('axios-oauth-client');
const tokenInterceptor = require('axios-token-interceptor');
const logger = require('./logger');
const errorMapper = require('./error-mapper');

const {
    OAUTH_TOKEN_URL: url,
    CLIENT_ID: client_id,
    CLIENT_SECRET: client_secret,
    API_USERNAME: username,
    API_PASSWORD: password,
    AIR_KEY: airKey
} = process.env;
const getOwnerCredentials = oauth.client(axios.create(), { url, grant_type: 'password', client_id, client_secret, username, password });

const { BASE_URL, BASE_SITE_ID, OCC_PATH, CMS_PATH } = process.env;
const client = axios.create({ baseURL: BASE_URL });
client.interceptors.request.use(oauth.interceptor(tokenInterceptor, getOwnerCredentials));
client.interceptors.request.use((config) => {
    if (airKey) {
        config.headers['Application-Interface-Key'] = airKey;
    }
    return config;
});

let lastError;

client.interceptors.response.use(
    (response) => {
        logger.logInfo(` ↳ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} ${response.statusText}`);
        return response;
    },
    (error) => {
        const { message, response } = (lastError = error);
        const data = response?.data || message;
        const status = response?.status || 500;
        if (response) {
            logger.logError(
                ` ↳ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} ${
                    response.statusText
                }\n   ${message}\n   ${JSON.stringify(data, null, 2)}`
            );
            errorMapper.mapErrors(response);
        } else {
            logger.logError(` ↳ ${message}`);
        }

        return Promise.reject({ error: true, data, status });
    }
);

module.exports = client;
module.exports.getLastError = () => lastError;
module.exports.constants = {
    FULL_OCC_PATH: OCC_PATH + BASE_SITE_ID,
    FULL_CMS_PATH: CMS_PATH + BASE_SITE_ID
};
