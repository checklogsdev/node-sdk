/**
 * @checklogs/node-sdk
 * Official Node.js SDK for CheckLogs.dev
 */

// Correct import syntax for ES modules with default exports
const CheckLogsClient = require('./lib/client.mjs').default;
const CheckLogsLogger = require('./lib/logger.mjs').default;
const CheckLogsStats = require('./lib/stats.mjs').default;

// Named exports from errors.mjs
const { CheckLogsError, ValidationError, ApiError, NetworkError } = require('./lib/errors.mjs');

/**
 * Create a new CheckLogs client instance
 * @param {string} apiKey - Your application API key
 * @param {Object} options - Optional configuration
 * @returns {CheckLogsClient} CheckLogs client instance
 */
function createClient(apiKey, options = {}) {
  return new CheckLogsClient(apiKey, options);
}

/**
 * Create a new CheckLogs logger instance
 * @param {string} apiKey - Your application API key
 * @param {Object} options - Optional configuration
 * @returns {CheckLogsLogger} CheckLogs logger instance
 */
function createLogger(apiKey, options = {}) {
  return new CheckLogsLogger(apiKey, options);
}

module.exports = {
  // Main classes
  CheckLogsClient,
  CheckLogsLogger,
  CheckLogsStats,
  
  // Error classes
  CheckLogsError,
  ValidationError,
  ApiError,
  NetworkError,
  
  // Factory functions
  createClient,
  createLogger,
  
  // Default export for convenience
  default: createClient
};