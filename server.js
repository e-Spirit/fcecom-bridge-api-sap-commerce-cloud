require('dotenv').config();
const { BridgeCore } = require('fcecom-bridge-commons');
const path = require('path');

const { BRIDGE_AUTH_USERNAME, BRIDGE_AUTH_PASSWORD, CONN_MODE, SSL_KEY, SSL_CERT, LOG_LEVEL } = process.env;

const port = process.env.NODE_PORT || process.env.PORT || 3000;

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
