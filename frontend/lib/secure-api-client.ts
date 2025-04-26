/**
 * Secure API client for Authentico
 * This library provides a secure API client with proper error handling,
 * authentication, CSRF protection, and rate limiting.
 *
 * @deprecated This file is being refactored to use a more modular approach.
 * The implementation is being moved to lib/api/secure-api-client.ts.
 */

import { AxiosRequestConfig } from 'axios';
import secureApiClient from './api/secure-api-client';

/**
 * Make a secure GET request
 * @param url The URL to request
 * @param config Additional axios config
 * @returns Promise with the response data
 */
export const get = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return secureApiClient.get<T>(url, config);
};

/**
 * Make a secure POST request
 * @param url The URL to request
 * @param data The data to send
 * @param config Additional axios config
 * @returns Promise with the response data
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  return secureApiClient.post<T>(url, data, config);
};

/**
 * Make a secure PUT request
 * @param url The URL to request
 * @param data The data to send
 * @param config Additional axios config
 * @returns Promise with the response data
 */
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  return secureApiClient.put<T>(url, data, config);
};

/**
 * Make a secure DELETE request
 * @param url The URL to request
 * @param config Additional axios config
 * @returns Promise with the response data
 */
export const del = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return secureApiClient.delete<T>(url, config);
};

/**
 * Upload a file securely
 * @param url The URL to upload to
 * @param formData The form data with the file
 * @param onUploadProgress Progress callback
 * @param customHeaders Optional custom headers to include in the request
 * @returns Promise with the response data
 */
export const uploadFile = async <T = any>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void,
  customHeaders?: Record<string, string>
): Promise<T> => {
  return secureApiClient.uploadFile<T>(
    url,
    formData,
    onUploadProgress,
    customHeaders
  );
};

// For backward compatibility
export default {
  get,
  post,
  put,
  delete: del,
  uploadFile,
};
