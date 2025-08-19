/**
 * CheckLogs Error Classes - ES Module version
 * Custom error types for the CheckLogs SDK
 */

/**
 * Base CheckLogs error class
 */
export class CheckLogsError extends Error {
  constructor(message, code = null, details = null) {
    super(message);
    this.name = 'CheckLogsError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CheckLogsError);
    }
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Validation error - thrown when input validation fails
 */
export class ValidationError extends CheckLogsError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field
    };
  }
}

/**
 * API error - thrown when the CheckLogs API returns an error
 */
export class ApiError extends CheckLogsError {
  constructor(message, statusCode = null, errorCode = null, response = null) {
    super(message, errorCode);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }

  /**
   * Check if error is due to authentication issues
   * @returns {boolean} True if authentication error
   */
  isAuthError() {
    return this.statusCode === 401 || this.code === 'INVALID_API_KEY';
  }

  /**
   * Check if error is due to rate limiting
   * @returns {boolean} True if rate limit error
   */
  isRateLimitError() {
    return this.statusCode === 429 || this.code === 'RATE_LIMIT_EXCEEDED';
  }

  /**
   * Check if error is a server error
   * @returns {boolean} True if server error (5xx)
   */
  isServerError() {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Check if error is a client error
   * @returns {boolean} True if client error (4xx)
   */
  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      response: this.response
    };
  }
}

/**
 * Network error - thrown when network requests fail
 */
export class NetworkError extends CheckLogsError {
  constructor(message, originalError = null) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    this.originalError = originalError;
  }

  /**
   * Check if error is due to timeout
   * @returns {boolean} True if timeout error
   */
  isTimeoutError() {
    return this.originalError && 
           (this.originalError.code === 'ECONNABORTED' || 
            this.originalError.message.includes('timeout'));
  }

  /**
   * Check if error is due to connection issues
   * @returns {boolean} True if connection error
   */
  isConnectionError() {
    return this.originalError && 
           (this.originalError.code === 'ECONNREFUSED' || 
            this.originalError.code === 'ENOTFOUND' ||
            this.originalError.code === 'ECONNRESET');
  }

  toJSON() {
    return {
      ...super.toJSON(),
      originalError: this.originalError ? {
        message: this.originalError.message,
        code: this.originalError.code,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Create appropriate error from axios error
 * @param {Error} axiosError - Axios error object
 * @returns {CheckLogsError} Appropriate CheckLogs error
 */
export function createErrorFromAxios(axiosError) {
  if (axiosError.response) {
    // API returned an error response
    const { status, data } = axiosError.response;
    const message = data?.error?.message || data?.message || 'API request failed';
    const errorCode = data?.error?.code || null;
    
    return new ApiError(message, status, errorCode, data);
  } else if (axiosError.request) {
    // Network error
    return new NetworkError('Network request failed', axiosError);
  } else {
    // Other error
    return new NetworkError('Request setup failed', axiosError);
  }
}

/**
 * Error handler utility function
 * @param {Function} fn - Function to wrap
 * @returns {Function} Wrapped function with error handling
 */
export function withErrorHandling(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof CheckLogsError) {
        throw error;
      }
      
      // Convert unknown errors to CheckLogs errors
      if (error.isAxiosError) {
        throw createErrorFromAxios(error);
      }
      
      throw new CheckLogsError(error.message, 'UNKNOWN_ERROR', { originalError: error });
    }
  };
}