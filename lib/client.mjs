import axios from 'axios';
import { ApiError, NetworkError, ValidationError } from './errors.mjs';
import CheckLogsStats from './stats.mjs';

/**
 * CheckLogs API Client - ES Module version
 * Main client for interacting with the CheckLogs API
 */
export default class CheckLogsClient {
  /**
   * Create a new CheckLogs client
   * @param {string} apiKey - Your application API key
   * @param {Object} options - Configuration options
   * @param {number} options.timeout - Request timeout in milliseconds (default: 5000)
   * @param {boolean} options.validatePayload - Validate payload before sending (default: true)
   */
  constructor(apiKey, options = {}) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new ValidationError('API key is required and must be a string');
    }

    this.apiKey = apiKey;
    this.baseURL = 'http://localhost/checklogs/webiste/api/logs.php';
    this.timeout = options.timeout || 5000;
    this.validatePayload = options.validatePayload !== false;

    // Create axios instance
    this.httpClient = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': '@checklogs/node-sdk/1.0.0'
      }
    });

    // Create stats instance
    this.stats = new CheckLogsStats(this);
  }

  /**
   * Validate log data before sending
   * @param {Object} logData - Log data to validate
   * @throws {ValidationError} If validation fails
   */
  _validateLogData(logData) {
    if (!this.validatePayload) return;

    if (!logData.message || typeof logData.message !== 'string') {
      throw new ValidationError('message is required and must be a string');
    }

    if (logData.message.length > 1024) {
      throw new ValidationError('message must be 1024 characters or less');
    }

    if (logData.level && !['info', 'warning', 'error', 'critical', 'debug'].includes(logData.level)) {
      throw new ValidationError('level must be one of: info, warning, error, critical, debug');
    }

    if (logData.source && logData.source.length > 100) {
      throw new ValidationError('source must be 100 characters or less');
    }

    if (logData.context && typeof logData.context !== 'object') {
      throw new ValidationError('context must be an object');
    }

    if (logData.user_id && typeof logData.user_id !== 'number') {
      throw new ValidationError('user_id must be a number');
    }
  }

  /**
   * Handle HTTP errors and convert to CheckLogs errors
   * @param {Error} error - Axios error
   * @throws {ApiError|NetworkError}
   */
  _handleError(error) {
    if (error.response) {
      // API returned an error response
      const { status, data } = error.response;
      const message = data?.error?.message || data?.message || 'API request failed';
      const errorCode = data?.error?.code || null;
      
      throw new ApiError(message, status, errorCode, data);
    } else if (error.request) {
      // Network error
      throw new NetworkError('Network request failed', error);
    } else {
      // Other error
      throw new NetworkError('Request setup failed', error);
    }
  }

  /**
   * Send a log entry to CheckLogs
   * @param {Object} logData - Log data
   * @param {string} logData.message - Log message (required)
   * @param {string} [logData.level='info'] - Log level (info, warning, error, critical, debug)
   * @param {Object} [logData.context] - Additional context data
   * @param {string} [logData.source] - Source of the log
   * @param {number} [logData.user_id] - User ID associated with the log
   * @returns {Promise<Object>} API response
   */
  async log(logData) {
    try {
      this._validateLogData(logData);

      const response = await this.httpClient.post(this.baseURL, {
        message: logData.message,
        level: logData.level || 'info',
        context: logData.context || null,
        source: logData.source || null,
        user_id: logData.user_id || null
      });

      return response.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this._handleError(error);
    }
  }

  /**
   * Retrieve logs from CheckLogs
   * @param {Object} options - Query options
   * @param {number} [options.limit=100] - Number of logs to retrieve (max 1000)
   * @param {number} [options.offset=0] - Number of logs to skip
   * @param {string} [options.level] - Filter by log level
   * @param {string} [options.since] - Filter logs since this date (ISO string)
   * @param {string} [options.until] - Filter logs until this date (ISO string)
   * @returns {Promise<Object>} API response with logs and pagination
   */
  async getLogs(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.limit !== undefined) {
        params.append('limit', Math.min(options.limit, 1000).toString());
      }
      
      if (options.offset !== undefined) {
        params.append('offset', Math.max(options.offset, 0).toString());
      }
      
      if (options.level) {
        params.append('level', options.level);
      }
      
      if (options.since) {
        params.append('since', options.since);
      }
      
      if (options.until) {
        params.append('until', options.until);
      }

      const url = params.toString() ? `${this.baseURL}?${params.toString()}` : this.baseURL;
      const response = await this.httpClient.get(url);

      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Convenience method to log info level messages
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} API response
   */
  async info(message, context = null, options = {}) {
    return this.log({
      message,
      level: 'info',
      context,
      ...options
    });
  }

  /**
   * Convenience method to log warning level messages
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} API response
   */
  async warning(message, context = null, options = {}) {
    return this.log({
      message,
      level: 'warning',
      context,
      ...options
    });
  }

  /**
   * Convenience method to log error level messages
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} API response
   */
  async error(message, context = null, options = {}) {
    return this.log({
      message,
      level: 'error',
      context,
      ...options
    });
  }

  /**
   * Convenience method to log critical level messages
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} API response
   */
  async critical(message, context = null, options = {}) {
    return this.log({
      message,
      level: 'critical',
      context,
      ...options
    });
  }

  /**
   * Convenience method to log debug level messages
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} API response
   */
  async debug(message, context = null, options = {}) {
    return this.log({
      message,
      level: 'debug',
      context,
      ...options
    });
  }
}