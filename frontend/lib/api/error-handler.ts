/**
 * Error Handler for Authentico API
 * 
 * This file contains functions for handling API errors.
 */

import { AxiosError } from 'axios';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  CsrfError,
  NetworkError,
  RateLimitError,
  ServerError,
  TimeoutError,
  ValidationError,
} from './error-types';

// Import toast notifications if available
let toast: any;
try {
  toast = require('react-hot-toast');
} catch (error) {
  // Toast not available, use console instead
  toast = {
    error: (message: string) => console.error(message),
    success: (message: string) => console.log(message),
  };
}

/**
 * Handle API errors
 * @param error The error to handle
 * @param context Context information for the error
 * @returns Promise that rejects with the error
 */
export async function handleApiError<T>(error: any, context: string): Promise<T> {
  // Log the error
  console.error(`API Error in ${context}:`, error);
  
  // Convert the error to a specific type
  const apiError = convertToApiError(error, context);
  
  // Show a toast notification
  showErrorNotification(apiError);
  
  // Return a rejected promise with the error
  return Promise.reject(apiError);
}

/**
 * Convert an error to a specific API error type
 * @param error The error to convert
 * @param context Context information for the error
 * @returns The converted error
 */
export function convertToApiError(error: any, context: string): ApiError {
  // If it's already an ApiError, return it
  if (error instanceof ApiError) {
    return error;
  }
  
  // If it's an Axios error, convert it
  if (error.isAxiosError) {
    return convertAxiosError(error as AxiosError, context);
  }
  
  // If it's a specific error type, convert it
  if (error.name === 'ValidationError') {
    return new ValidationError(error.message, {
      originalError: error,
    });
  }
  
  if (error.name === 'RateLimitError') {
    return new RateLimitError(error.message, {
      originalError: error,
      resetTime: error.resetTime,
      remainingRequests: error.remainingRequests,
    });
  }
  
  // If it's a network error, convert it
  if (error.message && error.message.includes('Network Error')) {
    return new NetworkError('Network error. Please check your connection and try again.', {
      originalError: error,
    });
  }
  
  // If it's a timeout error, convert it
  if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
    return new TimeoutError('Request timed out. Please try again later.', {
      originalError: error,
    });
  }
  
  // Default to a generic API error
  return new ApiError(error.message || 'An unknown error occurred', {
    originalError: error,
  });
}

/**
 * Convert an Axios error to a specific API error type
 * @param error The Axios error to convert
 * @param context Context information for the error
 * @returns The converted error
 */
export function convertAxiosError(error: AxiosError, context: string): ApiError {
  // Get the response data
  const responseData = error.response?.data as any;
  
  // Get the error message
  const errorMessage = responseData?.message || responseData?.error || error.message || 'An unknown error occurred';
  
  // Get the status code
  const status = error.response?.status;
  
  // Convert based on status code
  if (status === 401) {
    return new AuthenticationError(errorMessage, {
      status,
      data: responseData,
      originalError: error,
    });
  }
  
  if (status === 403) {
    // Check if it's a CSRF error
    if (responseData?.error === 'CSRF token validation failed') {
      return new CsrfError(errorMessage, {
        status,
        data: responseData,
        originalError: error,
      });
    }
    
    return new AuthorizationError(errorMessage, {
      status,
      data: responseData,
      originalError: error,
    });
  }
  
  if (status === 400) {
    return new ValidationError(errorMessage, {
      status,
      data: responseData,
      originalError: error,
    });
  }
  
  if (status === 429) {
    return new RateLimitError(errorMessage, {
      status,
      data: responseData,
      originalError: error,
      resetTime: responseData?.resetTime,
      remainingRequests: responseData?.remainingRequests,
    });
  }
  
  if (status && status >= 500) {
    return new ServerError(errorMessage, {
      status,
      data: responseData,
      originalError: error,
    });
  }
  
  if (error.code === 'ECONNABORTED') {
    return new TimeoutError(errorMessage, {
      originalError: error,
    });
  }
  
  if (!error.response) {
    return new NetworkError(errorMessage, {
      originalError: error,
    });
  }
  
  // Default to a generic API error
  return new ApiError(errorMessage, {
    status,
    data: responseData,
    originalError: error,
  });
}

/**
 * Show an error notification
 * @param error The error to show
 */
export function showErrorNotification(error: ApiError): void {
  // Get a user-friendly message
  const message = getUserFriendlyMessage(error);
  
  // Show a toast notification
  toast.error(message);
}

/**
 * Get a user-friendly error message
 * @param error The error to get a message for
 * @returns A user-friendly message
 */
export function getUserFriendlyMessage(error: ApiError): string {
  // Authentication errors
  if (error instanceof AuthenticationError) {
    return 'You need to be logged in to perform this action. Please log in and try again.';
  }
  
  // Authorization errors
  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action.';
  }
  
  // Validation errors
  if (error instanceof ValidationError) {
    return error.message || 'Please check your input and try again.';
  }
  
  // Rate limit errors
  if (error instanceof RateLimitError) {
    const resetTime = error.resetTime ? new Date(error.resetTime).toLocaleTimeString() : 'a few minutes';
    return `Too many requests. Please try again after ${resetTime}.`;
  }
  
  // Network errors
  if (error instanceof NetworkError) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Server errors
  if (error instanceof ServerError) {
    return 'Server error. Please try again later.';
  }
  
  // Timeout errors
  if (error instanceof TimeoutError) {
    return 'Request timed out. Please try again later.';
  }
  
  // CSRF errors
  if (error instanceof CsrfError) {
    return 'Security token expired. Please refresh the page and try again.';
  }
  
  // Default message
  return error.message || 'An unknown error occurred. Please try again.';
}
