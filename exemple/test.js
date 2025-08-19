const { createLogger } = require('../src/main');

// Create a logger instance
const logger = createLogger('0e78815d69603a88d111c02e03143cf2e4dc5d4aaf9821d9cec41fe738ce7d56');

// Log messages
await logger.info('Application started');
await logger.error('Something went wrong', { error_code: 500 });