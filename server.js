require('dotenv').config();
const { BridgeCore } = require('fcecom-bridge-commons');
const path = require('path');
const logger = require('./src/utils/logger');

const LOGGING_NAME = 'server';

const { BRIDGE_AUTH_USERNAME, BRIDGE_AUTH_PASSWORD, CONN_MODE, SSL_KEY, SSL_CERT, LOG_LEVEL, DEFAULT_LANG } = process.env;

const port = process.env.NODE_PORT || process.env.PORT || 3000;

if (!DEFAULT_LANG) {
    logger.logError(LOGGING_NAME, 'Please set a default language that should match the SAP Commerce Cloud master language.');
    process.exit(1);
}

BridgeCore({
    username: BRIDGE_AUTH_USERNAME,
    password: BRIDGE_AUTH_PASSWORD,
    servicesDir: path.join(process.cwd(), './src/service'),
    port: port,
    logLevel: LOG_LEVEL,
    features: {
        contentPages: true,
        categoryTree: true
    },
    useSsl: CONN_MODE === 'HTTPS',
    sslCert: SSL_CERT,
    sslKey: SSL_KEY
});
