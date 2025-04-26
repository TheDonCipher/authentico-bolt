/**
 * API Interfaces for Authentico
 *
 * This file contains interfaces for the API client and related components.
 * These interfaces make it easier to test and mock the API client.
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Interface for authentication service
 */
export interface IAuthService {
  /**
   * Get the authentication token
   * @returns Promise with the token or null if not authenticated
   */
  getAuthToken(): Promise<string | null>;
}

/**
 * Interface for CSRF protection service
 */
export interface ICsrfProtectionService {
  /**
   * Add CSRF token to request headers
   * @param headers The existing headers
   * @returns Headers with CSRF token added
   */
  addTokenToHeaders(headers: Record<string, string>): Record<string, string>;

  /**
   * Refresh the CSRF token
   * @returns The new CSRF token
   */
  refreshCsrfToken(): string;
}

/**
 * Interface for rate limiting service
 */
export interface IRateLimitService {
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
  };

  /**
   * Record a request for rate limiting
   * @param endpoint The endpoint to record
   */
  recordRequest(endpoint: string): void;
}

/**
 * Interface for validation service
 */
export interface IValidationService {
  /**
   * Validate a URL
   * @param url The URL to validate
   * @returns True if valid, false otherwise
   */
  validateUrl(url: string): boolean;
}

/**
 * Interface for error handling service
 */
export interface IErrorHandlerService {
  /**
   * Handle API errors
   * @param error The error to handle
   * @param context Context information for the error
   * @returns Promise that rejects with the error
   */
  handleApiError<T>(error: any, context: string): Promise<T>;
}

/**
 * Interface for HTTP client
 */
export interface IHttpClient {
  /**
   * Default configuration for the HTTP client
   */
  defaults: {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
  };

  /**
   * Make a GET request
   * @param url The URL to request
   * @param config Additional configuration
   * @returns Promise with the response
   */
  get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>>;

  /**
   * Make a POST request
   * @param url The URL to request
   * @param data The data to send
   * @param config Additional configuration
   * @returns Promise with the response
   */
  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>>;

  /**
   * Make a PUT request
   * @param url The URL to request
   * @param data The data to send
   * @param config Additional configuration
   * @returns Promise with the response
   */
  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>>;

  /**
   * Make a DELETE request
   * @param url The URL to request
   * @param config Additional configuration
   * @returns Promise with the response
   */
  delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>>;

  /**
   * Add request interceptor
   * @param onFulfilled Function to call when request is fulfilled
   * @param onRejected Function to call when request is rejected
   * @returns ID of the interceptor
   */
  addRequestInterceptor(
    onFulfilled?: (
      config: AxiosRequestConfig
    ) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
    onRejected?: (error: any) => any
  ): number;

  /**
   * Add response interceptor
   * @param onFulfilled Function to call when response is fulfilled
   * @param onRejected Function to call when response is rejected
   * @returns ID of the interceptor
   */
  addResponseInterceptor(
    onFulfilled?: (
      response: AxiosResponse
    ) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: any) => any
  ): number;
}

/**
 * Interface for API client
 */
export interface IApiClient {
  /**
   * Make a GET request
   * @param url The URL to request
   * @param config Additional configuration
   * @returns Promise with the response data
   */
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;

  /**
   * Make a POST request
   * @param url The URL to request
   * @param data The data to send
   * @param config Additional configuration
   * @returns Promise with the response data
   */
  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T>;

  /**
   * Make a PUT request
   * @param url The URL to request
   * @param data The data to send
   * @param config Additional configuration
   * @returns Promise with the response data
   */
  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T>;

  /**
   * Make a DELETE request
   * @param url The URL to request
   * @param config Additional configuration
   * @returns Promise with the response data
   */
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;

  /**
   * Upload a file
   * @param url The URL to upload to
   * @param formData The form data with the file
   * @param onUploadProgress Progress callback
   * @returns Promise with the response data
   */
  uploadFile<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T>;
}
