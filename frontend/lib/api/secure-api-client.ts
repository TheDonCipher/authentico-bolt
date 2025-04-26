/**
 * Secure API Client for Authentico
 *
 * This file contains the implementation of the secure API client with proper error handling,
 * authentication, CSRF protection, and rate limiting.
 */

import { AxiosError, AxiosRequestConfig } from 'axios';
import {
  IApiClient,
  IAuthService,
  ICsrfProtectionService,
  IErrorHandlerService,
  IHttpClient,
  IRateLimitService,
  IValidationService,
} from './api-interfaces';
import { HttpClient } from './http-client';
import {
  AuthService,
  CsrfProtectionService,
  ErrorHandlerService,
  RateLimitService,
  ValidationService,
} from './api-services';

/**
 * Secure API Client implementation
 */
export class SecureApiClient implements IApiClient {
  private httpClient: IHttpClient;
  private authService: IAuthService;
  private csrfProtectionService: ICsrfProtectionService;
  private rateLimitService: IRateLimitService;
  private validationService: IValidationService;
  private errorHandlerService: IErrorHandlerService;

  /**
   * Create a new secure API client
   * @param httpClient HTTP client to use
   * @param authService Authentication service to use
   * @param csrfProtectionService CSRF protection service to use
   * @param rateLimitService Rate limiting service to use
   * @param validationService Validation service to use
   * @param errorHandlerService Error handling service to use
   */
  constructor(
    httpClient: IHttpClient = new HttpClient(),
    authService: IAuthService = new AuthService(),
    csrfProtectionService: ICsrfProtectionService = new CsrfProtectionService(),
    rateLimitService: IRateLimitService = new RateLimitService(),
    validationService: IValidationService = new ValidationService(),
    errorHandlerService: IErrorHandlerService = new ErrorHandlerService()
  ) {
    this.httpClient = httpClient;
    this.authService = authService;
    this.csrfProtectionService = csrfProtectionService;
    this.rateLimitService = rateLimitService;
    this.validationService = validationService;
    this.errorHandlerService = errorHandlerService;

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Add request interceptor for authentication, CSRF protection, and rate limiting
    this.httpClient.addRequestInterceptor(
      async (config) => {
        try {
          // Get the endpoint from the URL
          const endpoint = config.url || '';

          // Check rate limit
          const rateLimitResult =
            this.rateLimitService.shouldRateLimit(endpoint);
          if (rateLimitResult.limited) {
            return Promise.reject({
              name: 'RateLimitError',
              message: rateLimitResult.message,
              config,
              isAxiosError: true,
            });
          }

          // Record the request for rate limiting
          this.rateLimitService.recordRequest(endpoint);

          // Add authentication token
          const token = await this.authService.getAuthToken();
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }

          // Add CSRF token
          config.headers = {
            ...config.headers,
            ...this.csrfProtectionService.addTokenToHeaders(
              config.headers as Record<string, string>
            ),
          };

          // Validate URL
          if (
            config.url &&
            config.baseURL &&
            !this.validationService.validateUrl(config.baseURL + config.url)
          ) {
            return Promise.reject({
              name: 'ValidationError',
              message: 'Invalid URL',
              config,
              isAxiosError: true,
            });
          }

          return config;
        } catch (error) {
          console.error('Request interceptor error:', error);
          return Promise.reject(error);
        }
      },
      (error) => {
        console.error('Request interceptor rejection:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.httpClient.addResponseInterceptor(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        try {
          // Handle specific error types
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error Response:', {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers,
              url: error.config?.url,
            });

            // Handle authentication errors
            if (error.response.status === 401) {
              // Clear token or redirect to login
              console.warn('Authentication error, redirecting to login');
              // This could trigger a redirect or token refresh
            }

            // Handle CSRF errors
            if (
              error.response.status === 403 &&
              error.response.data &&
              (error.response.data as any).error ===
                'CSRF token validation failed'
            ) {
              // Refresh CSRF token
              this.csrfProtectionService.refreshCsrfToken();
            }

            // Handle rate limiting
            if (error.response.status === 429) {
              console.warn(
                'Rate limit exceeded:',
                (error.response.data as any).message
              );
            }

            return Promise.reject(error);
          } else if (error.request) {
            // The request was made but no response was received
            console.error('API No Response:', {
              url: error.config?.url,
              method: error.config?.method,
              baseURL: error.config?.baseURL,
              timeout: error.config?.timeout,
            });

            // Try to determine if it's a timeout issue
            const isTimeout =
              error.message && error.message.includes('timeout');
            const isNetworkError =
              error.message &&
              (error.message.includes('Network Error') ||
                error.message.includes('network') ||
                !navigator.onLine);

            let errorMessage =
              'No response from server. Please check your connection and try again.';

            if (isTimeout) {
              errorMessage =
                'Request timed out. The server is taking too long to respond.';
            } else if (isNetworkError) {
              errorMessage =
                'Network error. Please check your internet connection and try again.';
            }

            // Log additional details for debugging
            console.error('Connection details:', {
              navigator:
                typeof navigator !== 'undefined'
                  ? {
                      onLine: navigator.onLine,
                      userAgent: navigator.userAgent,
                    }
                  : 'Not available',
              timeout: error.config?.timeout || 'Not set',
            });

            return Promise.reject({
              ...error,
              message: errorMessage,
              isTimeout,
              isNetworkError,
            });
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error('API Request Setup Error:', {
              message: error.message,
              url: error.config?.url,
            });

            return Promise.reject(error);
          }
        } catch (interceptorError) {
          console.error('Response interceptor error:', interceptorError);
          return Promise.reject(error);
        }
      }
    );
  }

  /**
   * Make a GET request
   * @param url The URL to request
   * @param config Additional configuration
   * @returns Promise with the response data
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`Making GET request to ${url}`, { config });

      // Set a reasonable default timeout if not specified
      const configWithDefaults = {
        ...config,
        timeout: config?.timeout || 15000, // 15 seconds default timeout
      };

      try {
        const response = await this.httpClient.get<T>(url, configWithDefaults);
        console.log(`Successful GET response from ${url}`, {
          status: response.status,
        });
        return response.data;
      } catch (axiosError: any) {
        // Check if this is a timeout error
        if (axiosError.code === 'ECONNABORTED') {
          console.error(
            `API No Response: ${JSON.stringify({
              url,
              method: 'get',
              baseURL: this.httpClient.defaults.baseURL || '',
              timeout: configWithDefaults.timeout,
            })}`
          );

          // Log connection details for debugging
          console.error(
            `Connection details: ${JSON.stringify({
              navigator:
                typeof navigator !== 'undefined'
                  ? {
                      onLine: navigator.onLine,
                      userAgent: navigator.userAgent,
                    }
                  : {},
              timeout: configWithDefaults.timeout,
            })}`
          );

          throw new Error(
            'Request timed out. The server is taking too long to respond.'
          );
        }

        // Check if we need to refresh the CSRF token and retry
        if (
          axiosError.response?.status === 403 &&
          axiosError.response?.data?.error === 'CSRF token validation failed'
        ) {
          console.log(
            `CSRF token validation failed for ${url}, refreshing token and retrying...`
          );

          // Refresh the CSRF token
          await this.csrfProtectionService.refreshCsrfToken();

          // Wait a moment for the token to be set
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Retry the request with the new token
          const retryResponse = await this.httpClient.get<T>(url, {
            ...configWithDefaults,
            headers: {
              ...configWithDefaults?.headers,
              ...this.csrfProtectionService.addTokenToHeaders(
                (configWithDefaults?.headers || {}) as Record<string, string>
              ),
            },
          });

          console.log(
            `Successful retry GET response from ${url} after CSRF refresh`,
            {
              status: retryResponse.status,
            }
          );

          return retryResponse.data;
        }

        // If not a CSRF issue or retry failed, rethrow
        throw axiosError;
      }
    } catch (error) {
      console.error(`Error in GET request to ${url}:`, error);
      return this.errorHandlerService.handleApiError(error, `GET ${url}`);
    }
  }

  /**
   * Make a POST request
   * @param url The URL to request
   * @param data The data to send
   * @param config Additional configuration
   * @returns Promise with the response data
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.httpClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      return this.errorHandlerService.handleApiError(error, `POST ${url}`);
    }
  }

  /**
   * Make a PUT request
   * @param url The URL to request
   * @param data The data to send
   * @param config Additional configuration
   * @returns Promise with the response data
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.httpClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      return this.errorHandlerService.handleApiError(error, `PUT ${url}`);
    }
  }

  /**
   * Make a DELETE request
   * @param url The URL to request
   * @param config Additional configuration
   * @returns Promise with the response data
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.httpClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      return this.errorHandlerService.handleApiError(error, `DELETE ${url}`);
    }
  }

  /**
   * Upload a file
   * @param url The URL to upload to
   * @param formData The form data with the file
   * @param onUploadProgress Progress callback
   * @param customHeaders Optional custom headers to include in the request
   * @returns Promise with the response data
   */
  async uploadFile<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    try {
      // Get authentication token
      const token = await this.authService.getAuthToken();

      // Create config with progress tracking
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onUploadProgress(percentCompleted);
          }
        },
      };

      // Add authentication token
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // Add CSRF token
      config.headers = {
        ...config.headers,
        ...this.csrfProtectionService.addTokenToHeaders(
          config.headers as Record<string, string>
        ),
        // Add custom headers if provided
        ...(customHeaders || {}),
      };

      // Log custom headers if provided
      if (customHeaders && Object.keys(customHeaders).length > 0) {
        console.log('Using custom headers for upload:', customHeaders);
      }

      // Log CSRF token status for debugging
      console.log(
        'CSRF token header added:',
        config.headers['x-xsrf-token'] ? 'Yes' : 'No'
      );

      // If no CSRF token is found, try to refresh it
      if (!config.headers['x-xsrf-token']) {
        console.log('No CSRF token in headers, refreshing...');
        this.csrfProtectionService.refreshCsrfToken();

        // Add the refreshed token to headers
        config.headers = {
          ...config.headers,
          ...this.csrfProtectionService.addTokenToHeaders(
            config.headers as Record<string, string>
          ),
        };

        console.log(
          'After refresh, CSRF token header added:',
          config.headers['x-xsrf-token'] ? 'Yes' : 'No'
        );
      }

      // Make the request
      const response = await this.httpClient.post<T>(url, formData, config);
      return response.data;
    } catch (error: any) {
      // Check if the error is related to CSRF token validation
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data &&
        error.response.data.error === 'CSRF token validation failed'
      ) {
        console.log(
          'CSRF token validation failed, refreshing token and retrying...'
        );

        // Refresh the CSRF token
        this.csrfProtectionService.refreshCsrfToken();

        // Wait a moment for the token to be set
        await new Promise((resolve) => setTimeout(resolve, 500));

        try {
          // Create a new config with the refreshed token
          const newConfig: AxiosRequestConfig = {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onUploadProgress
              ? (progressEvent: any) => {
                  if (progressEvent.total) {
                    const percentCompleted = Math.round(
                      (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onUploadProgress(percentCompleted);
                  }
                }
              : undefined,
          };

          // Add authentication token
          const authToken = await this.authService.getAuthToken();
          if (authToken) {
            newConfig.headers = {
              ...newConfig.headers,
              Authorization: `Bearer ${authToken}`,
            };
          }

          // Add the refreshed CSRF token
          newConfig.headers = {
            ...newConfig.headers,
            ...this.csrfProtectionService.addTokenToHeaders(
              newConfig.headers as Record<string, string>
            ),
            // Add custom headers if provided
            ...(customHeaders || {}),
          };

          // Log custom headers if provided
          if (customHeaders && Object.keys(customHeaders).length > 0) {
            console.log(
              'Using custom headers for retry upload:',
              customHeaders
            );
          }

          console.log('Retrying with new CSRF token...');

          // Retry the request with the new token
          const retryResponse = await this.httpClient.post<T>(
            url,
            formData,
            newConfig
          );
          return retryResponse.data;
        } catch (retryError) {
          console.error('Retry after CSRF token refresh failed:', retryError);
          return this.errorHandlerService.handleApiError(
            retryError,
            `UPLOAD ${url} (retry)`
          );
        }
      }

      return this.errorHandlerService.handleApiError(error, `UPLOAD ${url}`);
    }
  }
}

// Create a default instance of the secure API client
const secureApiClient = new SecureApiClient();

// Export the default instance and the class methods
export const { get, post, put, delete: del, uploadFile } = secureApiClient;
export default secureApiClient;
