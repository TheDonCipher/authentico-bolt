/**
 * HTTP Client for Authentico
 *
 * This file contains the implementation of the HTTP client using Axios.
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { IHttpClient } from './api-interfaces';

/**
 * HTTP Client implementation using Axios
 */
export class HttpClient implements IHttpClient {
  private axiosInstance: AxiosInstance;
  public defaults: {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
  };

  /**
   * Create a new HTTP client
   * @param baseURL Base URL for all requests
   * @param timeout Timeout in milliseconds
   * @param headers Default headers for all requests
   */
  constructor(
    baseURL: string = '', // Use empty base URL for frontend API routes
    timeout: number = 30000,
    headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
  ) {
    console.log(
      `HttpClient initialized with empty baseURL for frontend API routes`
    );
    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers,
    });

    // Initialize defaults property
    this.defaults = {
      baseURL,
      timeout,
      headers,
    };
  }

  /**
   * Make a GET request
   * @param url The URL to request
   * @param config Additional configuration
   * @returns Promise with the response
   */
  get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

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
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

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
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  /**
   * Make a DELETE request
   * @param url The URL to request
   * @param config Additional configuration
   * @returns Promise with the response
   */
  delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }

  /**
   * Add request interceptor
   * @param onFulfilled Function to call when request is fulfilled
   * @param onRejected Function to call when request is rejected
   * @returns ID of the interceptor
   */
  addRequestInterceptor(
    onFulfilled?: (
      config: InternalAxiosRequestConfig
    ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>,
    onRejected?: (error: any) => any
  ): number {
    return this.axiosInstance.interceptors.request.use(onFulfilled, onRejected);
  }

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
  ): number {
    return this.axiosInstance.interceptors.response.use(
      onFulfilled,
      onRejected
    );
  }

  /**
   * Get the underlying Axios instance
   * @returns The Axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
