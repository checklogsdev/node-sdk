const CheckLogsClient = require('./client');

/**
 * CheckLogs Logger
 * Enhanced logging client with additional features
 */
class CheckLogsLogger extends CheckLogsClient {
  /**
   * Create a new CheckLogs logger
   * @param {string} apiKey - Your application API key
   * @param {Object} options - Configuration options
   * @param {string} [options.source] - Default source for all logs
   * @param {number} [options.user_id] - Default user ID for all logs
   * @param {Object} [options.defaultContext] - Default context merged with all logs
   * @param {boolean} [options.silent=false] - Suppress console output
   * @param {boolean} [options.consoleOutput=true] - Also output to console
   * @param {Array<string>} [options.enabledLevels] - Only log these levels
   * @param {boolean} [options.includeTimestamp=true] - Include timestamp in context
   * @param {boolean} [options.includeHostname=true] - Include hostname in context
   */
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    
    this.defaultSource = options.source || null;
    this.defaultUserId = options.user_id || null;
    this.defaultContext = options.defaultContext || {};
    this.silent = options.silent || false;
    this.consoleOutput = options.consoleOutput !== false;
    this.enabledLevels = options.enabledLevels || ['info', 'warning', 'error', 'critical', 'debug'];
    this.includeTimestamp = options.includeTimestamp !== false;
    this.includeHostname = options.includeHostname !== false;
    
    // Queue for failed logs to retry
    this.retryQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    
    // Get hostname if available
    this.hostname = this._getHostname();
  }

  /**
   * Get hostname for logging context
   * @returns {string} Hostname or 'unknown'
   */
  _getHostname() {
    try {
      if (typeof require !== 'undefined') {
        const os = require('os');
        return os.hostname();
      }
    } catch (error) {
      // Ignore errors
    }
    return 'unknown';
  }

  /**
   * Build enhanced context with metadata
   * @param {Object} userContext - User provided context
   * @returns {Object} Enhanced context
   */
  _buildContext(userContext = {}) {
    const context = { ...this.defaultContext, ...userContext };
    
    if (this.includeTimestamp) {
      context._timestamp = new Date().toISOString();
    }
    
    if (this.includeHostname) {
      context._hostname = this.hostname;
    }
    
    // Add Node.js process information
    if (typeof process !== 'undefined') {
      context._process = {
        pid: process.pid,
        version: process.version,
        platform: process.platform
      };
    }
    
    return context;
  }

  /**
   * Output to console if enabled
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Log context
   */
  _consoleLog(level, message, context) {
    if (!this.consoleOutput || this.silent) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
      case 'critical':
        console.error(logMessage, context || '');
        break;
      case 'warning':
        console.warn(logMessage, context || '');
        break;
      case 'debug':
        console.debug(logMessage, context || '');
        break;
      default:
        console.log(logMessage, context || '');
    }
  }

  /**
   * Enhanced log method with retry logic
   * @param {Object} logData - Log data
   * @param {number} [retryCount=0] - Current retry attempt
   * @returns {Promise<Object>} API response
   */
  async log(logData, retryCount = 0) {
    // Check if level is enabled
    if (!this.enabledLevels.includes(logData.level || 'info')) {
      return { skipped: true, reason: 'level_disabled' };
    }
    
    const enhancedData = {
      message: logData.message,
      level: logData.level || 'info',
      context: this._buildContext(logData.context),
      source: logData.source || this.defaultSource,
      user_id: logData.user_id || this.defaultUserId
    };
    
    // Console output
    this._consoleLog(enhancedData.level, enhancedData.message, enhancedData.context);
    
    try {
      const result = await super.log(enhancedData);
      
      // If successful and this was a retry, remove from queue
      if (retryCount > 0) {
        this._removeFromRetryQueue(logData);
      }
      
      return result;
    } catch (error) {
      // Add to retry queue if not already there and under max retries
      if (retryCount < this.maxRetries) {
        this._addToRetryQueue(logData, retryCount);
        
        // Schedule retry
        setTimeout(() => {
          this.log(logData, retryCount + 1).catch(() => {
            // Silent fail for retries
          });
        }, this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      }
      
      if (!this.silent) {
        console.error(`Failed to send log to CheckLogs (attempt ${retryCount + 1}):`, error.message);
      }
      
      throw error;
    }
  }

  /**
   * Add log to retry queue
   * @param {Object} logData - Log data
   * @param {number} retryCount - Current retry count
   */
  _addToRetryQueue(logData, retryCount) {
    const existing = this.retryQueue.find(item => 
      item.logData.message === logData.message && 
      item.logData.level === logData.level
    );
    
    if (!existing) {
      this.retryQueue.push({
        logData: { ...logData },
        retryCount: retryCount + 1,
        addedAt: Date.now()
      });
    }
  }

  /**
   * Remove log from retry queue
   * @param {Object} logData - Log data
   */
  _removeFromRetryQueue(logData) {
    this.retryQueue = this.retryQueue.filter(item =>
      !(item.logData.message === logData.message && 
        item.logData.level === logData.level)
    );
  }

  /**
   * Get retry queue status
   * @returns {Object} Retry queue information
   */
  getRetryQueueStatus() {
    return {
      count: this.retryQueue.length,
      items: this.retryQueue.map(item => ({
        message: item.logData.message,
        level: item.logData.level,
        retryCount: item.retryCount,
        addedAt: new Date(item.addedAt).toISOString()
      }))
    };
  }

  /**
   * Clear retry queue
   */
  clearRetryQueue() {
    this.retryQueue = [];
  }

  /**
   * Create a child logger with additional default context
   * @param {Object} additionalContext - Additional context to merge
   * @param {Object} additionalOptions - Additional options to merge
   * @returns {CheckLogsLogger} Child logger instance
   */
  child(additionalContext = {}, additionalOptions = {}) {
    const mergedContext = { ...this.defaultContext, ...additionalContext };
    const mergedOptions = {
      source: this.defaultSource,
      user_id: this.defaultUserId,
      defaultContext: mergedContext,
      silent: this.silent,
      consoleOutput: this.consoleOutput,
      enabledLevels: this.enabledLevels,
      includeTimestamp: this.includeTimestamp,
      includeHostname: this.includeHostname,
      ...additionalOptions
    };
    
    return new CheckLogsLogger(this.apiKey, mergedOptions);
  }

  /**
   * Enable or disable specific log levels
   * @param {Array<string>} levels - Levels to enable
   */
  setEnabledLevels(levels) {
    this.enabledLevels = levels;
  }

  /**
   * Enable console output
   */
  enableConsole() {
    this.consoleOutput = true;
  }

  /**
   * Disable console output
   */
  disableConsole() {
    this.consoleOutput = false;
  }

  /**
   * Enable silent mode (no console output or errors)
   */
  enableSilent() {
    this.silent = true;
    this.consoleOutput = false;
  }

  /**
   * Disable silent mode
   */
  disableSilent() {
    this.silent = false;
  }

  /**
   * Log with timing information
   * @param {string} label - Timer label
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {string} level - Log level
   * @returns {Function} End timer function
   */
  time(label, message, context = {}, level = 'info') {
    const startTime = Date.now();
    
    this.log({
      message: `${message} [TIMER START]`,
      level,
      context: { ...context, _timer_label: label, _timer_start: startTime }
    }).catch(() => {});
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.log({
        message: `${message} [TIMER END]`,
        level,
        context: { 
          ...context, 
          _timer_label: label, 
          _timer_start: startTime,
          _timer_end: endTime,
          _timer_duration_ms: duration
        }
      }).catch(() => {});
      
      return duration;
    };
  }

  /**
   * Flush all pending logs (wait for retry queue to clear)
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise<boolean>} True if all logs flushed, false if timeout
   */
  async flush(timeout = 30000) {
    const startTime = Date.now();
    
    while (this.retryQueue.length > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return this.retryQueue.length === 0;
  }
}

module.exports = CheckLogsLogger;