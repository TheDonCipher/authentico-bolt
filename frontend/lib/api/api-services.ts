/**
 * API Services for Authentico
 *
 * This file contains implementations of the service interfaces used by the API client.
 */

import { getAuthToken as getToken } from '../token-util';
import * as csrfProtection from '../csrf-protection';
import * as rateLimit from '../rate-limit';
import { validateUrl as validateUrlFn } from '../validation-util';
import { handleApiError as handleError } from '../error-handler';
import {
  IAuthService,
  ICsrfProtectionService,
  IRateLimitService,
  IValidationService,
  IErrorHandlerService,
} from './api-interfaces';

/**
 * Authentication service implementation
 */
export class AuthService implements IAuthService {
  /**
   * Get the authentication token
   * @returns Promise with the token or null if not authenticated
   */
  async getAuthToken(): Promise<string | null> {
    return getToken();
  }
}

/**
 * CSRF protection service implementation
 */
export class CsrfProtectionService implements ICsrfProtectionService {
  /**
   * Add CSRF token to request headers
   * @param headers The existing headers
   * @returns Headers with CSRF token added
   */
  addTokenToHeaders(headers: Record<string, string>): Record<string, string> {
    return csrfProtection.addTokenToHeaders(headers);
  }

  /**
   * Refresh the CSRF token
   * @returns The new CSRF token
   */
  refreshCsrfToken(): string {
    const token = csrfProtection.refreshCsrfToken();
    return token || '';
  }
}

/**
 * Rate limiting service implementation
 */
export class RateLimitService implements IRateLimitService {
  /**
   * Check if a request should be rate limited
   * @param endpoint The endpoint to check
   * @returns Rate limit information
   */
  shouldRateLimit(endpoint: string): {
    limited: boolean;
    message: string;
    remainingRequests: number;
    resetTime: number;
  } {
    return rateLimit.shouldRateLimit(endpoint);
  }

  /**
   * Record a request for rate limiting
   * @param endpoint The endpoint to record
   */
  recordRequest(endpoint: string): void {
    rateLimit.recordRequest(endpoint);
  }
}

/**
 * Validation service implementation
 */
export class ValidationService implements IValidationService {
  /**
   * Validate a URL
   * @param url The URL to validate
   * @returns True if valid, false otherwise
   */
  validateUrl(url: string): boolean {
    return validateUrlFn(url);
  }
}

/**
 * Error handling service implementation
 */
export class ErrorHandlerService implements IErrorHandlerService {
  /**
   * Handle API errors
   * @param error The error to handle
   * @param context Context information for the error
   * @returns Promise that rejects with the error
   */
  handleApiError<T>(error: any, context: string): Promise<T> {
    return handleError(error, context);
  }
}
