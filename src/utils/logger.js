const { createLogger } = require('fcecom-bridge-commons');

const { LOG_LEVEL } = process.env;
const logger = createLogger(LOG_LEVEL);

module.exports = logger;
