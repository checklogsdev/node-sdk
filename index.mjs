/**
 * @checklogs/node-sdk - ES Module version
 * Official Node.js SDK for CheckLogs.dev
 */

import CheckLogsClient from './lib/client.mjs';
import CheckLogsLogger from './lib/logger.mjs';
import CheckLogsStats from './lib/stats.mjs';
import { CheckLogsError, ValidationError, ApiError, NetworkError } from './lib/errors.mjs';

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

// Named exports
export {
  CheckLogsClient,
  CheckLogsLogger,
  CheckLogsStats,
  CheckLogsError,
  ValidationError,
  ApiError,
  NetworkError,
  createClient,
  createLogger
};

// Default export for convenience
export default createClient;