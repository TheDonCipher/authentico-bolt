/**
 * Error Types for Authentico API
 * 
 * This file contains custom error types for the Authentico API.
 */

/**
 * Base class for all API errors
 */
export class ApiError extends Error {
  /**
   * HTTP status code
   */
  status?: number;
  
  /**
   * Error code
   */
  code?: string;
  
  /**
   * Additional error data
   */
  data?: any;
  
  /**
   * Original error
   */
  originalError?: any;
  
  /**
   * Create a new API error
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    status?: number;
    code?: string;
    data?: any;
    originalError?: any;
  } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.data = options.data;
    this.originalError = options.originalError;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends ApiError {
  /**
   * Create a new authentication error
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    status?: number;
    code?: string;
    data?: any;
    originalError?: any;
  } = {}) {
    super(message, {
      status: options.status || 401,
      code: options.code || 'AUTHENTICATION_ERROR',
      data: options.data,
      originalError: options.originalError,
    });
    this.name = 'AuthenticationError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends ApiError {
  /**
   * Create a new authorization error
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    status?: number;
    code?: string;
    data?: any;
    originalError?: any;
  } = {}) {
    super(message, {
      status: options.status || 403,
      code: options.code || 'AUTHORIZATION_ERROR',
      data: options.data,
      originalError: options.originalError,
    });
    this.name = 'AuthorizationError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Validation error
 */
export class ValidationError extends ApiError {
  /**
   * Create a new validation error
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    status?: number;
    code?: string;
    data?: any;
    originalError?: any;
  } = {}) {
    super(message, {
      status: options.status || 400,
      code: options.code || 'VALIDATION_ERROR',
      data: options.data,
      originalError: options.originalError,
    });
    this.name = 'ValidationError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends ApiError {
  /**
   * Time when the rate limit will reset
   */
  resetTime?: number;
  
  /**
   * Number of remaining requests
   */
  remainingRequests?: number;
  
  /**
   * Create a new rate limit error
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    status?: number;
    code?: string;
    data?: any;
    originalError?: any;
    resetTime?: number;
    remainingRequests?: number;
  } = {}) {
    super(message, {
      status: options.status || 429,
      code: options.code || 'RATE_LIMIT_ERROR',
      data: options.data,
      originalError: options.originalError,
    });
    this.name = 'RateLimitError';
    this.resetTime = options.resetTime;
    this.remainingRequests = options.remainingRequests;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Network error
 */
export class NetworkError extends ApiError {
  /**
   * Create a new network error
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    status?: number;
    code?: string;
    data?: any;
    originalError?: any;
  } = {}) {
    super(message, {
      status: options.status || 0,
      code: options.code || 'NETWORK_ERROR',
      data: options.data,
      originalError: options.originalError,
    });
    this.name = 'NetworkError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Server error
 */
export class ServerError extends ApiError {
  /**
   * Create a new server error
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    status?: number;
    code?: string;
    data?: any;
    originalError?: any;
  } = {}) {
    super(message, {
      status: options.status || 500,
      code: options.code || 'SERVER_ERROR',
      data: options.data,
      originalError: options.originalError,
    });
    this.name = 'ServerError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends ApiError {
  /**
   * Create a new timeout error
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    status?: number;
    code?: string;
    data?: any;
    originalError?: any;
  } = {}) {
    super(message, {
      status: options.status || 408,
      code: options.code || 'TIMEOUT_ERROR',
      data: options.data,
      originalError: options.originalError,
    });
    this.name = 'TimeoutError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * CSRF error
 */
export class CsrfError extends ApiError {
  /**
   * Create a new CSRF error
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    status?: number;
    code?: string;
    data?: any;
    originalError?: any;
  } = {}) {
    super(message, {
      status: options.status || 403,
      code: options.code || 'CSRF_ERROR',
      data: options.data,
      originalError: options.originalError,
    });
    this.name = 'CsrfError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, CsrfError.prototype);
  }
}
