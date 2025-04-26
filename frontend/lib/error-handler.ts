/**
 * Error handling utility for Authentico
 * This library provides comprehensive error handling with
 * proper logging and user feedback mechanisms.
 */

import { ValidationError } from './api/error-types';

// Define error types
export interface AppError extends Error {
  code?: string;
  details?: any;
  userMessage?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// Error codes and messages
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: {
    code: 'AUTH_REQUIRED',
    message: 'Authentication is required to access this resource',
    userMessage: 'Please sign in to continue',
    severity: 'warning',
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid authentication credentials',
    userMessage: 'Invalid credentials. Please try again',
    severity: 'warning',
  },
  WALLET_CONNECTION_FAILED: {
    code: 'WALLET_CONNECTION_FAILED',
    message: 'Failed to connect to wallet',
    userMessage: 'Could not connect to your wallet. Please try again',
    severity: 'error',
  },

  // Authorization errors
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'User is not authorized to access this resource',
    userMessage: 'You do not have permission to access this resource',
    severity: 'warning',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Access to this resource is forbidden',
    userMessage: 'Access denied',
    severity: 'warning',
  },

  // Validation errors
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Input validation failed',
    userMessage: 'Please check your input and try again',
    severity: 'warning',
  },
  INVALID_FILE_TYPE: {
    code: 'INVALID_FILE_TYPE',
    message: 'Invalid file type',
    userMessage: 'The file type is not supported. Please upload a valid file',
    severity: 'warning',
  },
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: 'File size exceeds the limit',
    userMessage: 'The file is too large. Please upload a smaller file',
    severity: 'warning',
  },

  // API errors
  API_ERROR: {
    code: 'API_ERROR',
    message: 'API request failed',
    userMessage: 'Something went wrong. Please try again later',
    severity: 'error',
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network request failed',
    userMessage: 'Network error. Please check your connection and try again',
    severity: 'error',
  },
  TIMEOUT_ERROR: {
    code: 'TIMEOUT_ERROR',
    message: 'Request timed out',
    userMessage: 'The request timed out. Please try again later',
    severity: 'error',
  },

  // Rate limiting errors
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests',
    userMessage: 'Too many requests. Please try again later',
    severity: 'warning',
  },

  // Storage errors
  STORAGE_ERROR: {
    code: 'STORAGE_ERROR',
    message: 'Storage operation failed',
    userMessage: 'Failed to store data. Please try again later',
    severity: 'error',
  },

  // Document errors
  DOCUMENT_NOT_FOUND: {
    code: 'DOCUMENT_NOT_FOUND',
    message: 'Document not found',
    userMessage: 'The requested document could not be found',
    severity: 'warning',
  },
  DOCUMENT_UPLOAD_FAILED: {
    code: 'DOCUMENT_UPLOAD_FAILED',
    message: 'Document upload failed',
    userMessage: 'Failed to upload document. Please try again',
    severity: 'error',
  },

  // Blockchain errors
  BLOCKCHAIN_ERROR: {
    code: 'BLOCKCHAIN_ERROR',
    message: 'Blockchain operation failed',
    userMessage: 'Blockchain operation failed. Please try again later',
    severity: 'error',
  },

  // Unknown error
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    userMessage: 'Something went wrong. Please try again later',
    severity: 'error',
  },
} as const;

/**
 * Create an application error with proper structure
 * @param code Error code or predefined error
 * @param message Error message (optional, will use default if not provided)
 * @param details Additional error details (optional)
 * @returns Structured application error
 */
export const createError = (
  code: keyof typeof ERROR_CODES | string,
  message?: string,
  details?: any
): AppError => {
  try {
    // Check if code is a predefined error
    const predefinedError =
      typeof code === 'string' && ERROR_CODES[code as keyof typeof ERROR_CODES];

    const error = new Error(
      message ||
        (predefinedError ? predefinedError.message : 'An error occurred')
    ) as AppError;

    error.name = 'AppError';
    error.code = predefinedError ? predefinedError.code : code;
    error.userMessage = predefinedError ? predefinedError.userMessage : message;
    error.severity = predefinedError
      ? (predefinedError.severity as any)
      : 'error';

    if (details) {
      error.details = details;
    }

    return error;
  } catch (e) {
    console.error('Error creation failed:', e);
    // Fallback to basic error
    const fallbackError = new Error('An error occurred') as AppError;
    fallbackError.code = 'UNKNOWN_ERROR';
    fallbackError.userMessage = 'Something went wrong. Please try again later';
    fallbackError.severity = 'error';
    return fallbackError;
  }
};

/**
 * Handle an error with proper logging and return user-friendly message
 * @param error The error to handle
 * @param context Additional context for the error
 * @returns User-friendly error message
 */
export const handleError = (
  error: any,
  context: string = 'Application Error'
): ToastMessage => {
  try {
    // Log the error with context
    console.error(`${context}:`, error);

    // Log additional details for Axios errors
    if (error && error.isAxiosError) {
      console.error('Axios error details:');
      console.error('- Status:', error.response?.status);
      console.error('- Status text:', error.response?.statusText);
      console.error('- URL:', error.config?.url);
      console.error('- Method:', error.config?.method);
      console.error('- Response data:', error.response?.data);

      // Handle specific HTTP status codes
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          return {
            type: 'error',
            message: `Resource not found: ${
              error.config?.url || 'Unknown URL'
            }`,
          };
        } else if (status === 401) {
          return {
            type: 'warning',
            message: 'Authentication required. Please sign in again.',
          };
        } else if (status === 403) {
          return {
            type: 'warning',
            message: 'You do not have permission to access this resource.',
          };
        } else if (status === 429) {
          return {
            type: 'warning',
            message: 'Too many requests. Please try again later.',
          };
        }
      }
    }

    // If it's already an AppError, use its properties
    if (error && error.code && error.userMessage) {
      return {
        type:
          error.severity === 'critical' || error.severity === 'error'
            ? 'error'
            : error.severity === 'warning'
            ? 'warning'
            : 'info',
        message: error.userMessage,
      };
    }

    // Handle specific error types
    if (error && error.name === 'ValidationError') {
      return {
        type: 'warning',
        message: error.message || 'Please check your input and try again',
      };
    }

    if (error && error.name === 'RateLimitError') {
      return {
        type: 'warning',
        message: error.message || 'Too many requests. Please try again later',
      };
    }

    if (error && error.name === 'NetworkError') {
      return {
        type: 'error',
        message: 'Network error. Please check your connection and try again',
      };
    }

    if (error && error.name === 'TimeoutError') {
      return {
        type: 'error',
        message: 'The request timed out. Please try again later',
      };
    }

    // For unknown errors, provide a generic message
    return {
      type: 'error',
      message:
        error && error.message
          ? error.message
          : 'Something went wrong. Please try again later',
    };
  } catch (e) {
    console.error('Error handling failed:', e);
    // Fallback to generic error message
    return {
      type: 'error',
      message: 'Something went wrong. Please try again later',
    };
  }
};

/**
 * Format validation errors for display
 * @param errors Array of validation errors
 * @returns Formatted error message
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  try {
    if (!errors || errors.length === 0) {
      return '';
    }

    return errors.map((error) => error.message).join('\n');
  } catch (e) {
    console.error('Error formatting validation errors:', e);
    return 'Validation failed. Please check your input and try again.';
  }
};

/**
 * Create a toast message for user feedback
 * @param type Message type
 * @param message Message content
 * @param duration Message duration in milliseconds
 * @returns Toast message object
 */
export const createToast = (
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  duration: number = 5000
): ToastMessage => {
  return {
    type,
    message,
    duration,
  };
};

/**
 * Handle API response errors
 * @param response Fetch API response
 * @param context Additional context for the error
 * @returns Rejected promise with structured error
 */
export const handleApiError = async (
  response: Response,
  context: string = 'API Error'
): Promise<never> => {
  try {
    // Try to parse error response as JSON
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: 'Unknown error' };
    }

    // Map HTTP status codes to error codes
    let errorCode: keyof typeof ERROR_CODES;
    switch (response.status) {
      case 400:
        errorCode = 'VALIDATION_ERROR';
        break;
      case 401:
        errorCode = 'AUTH_REQUIRED';
        break;
      case 403:
        errorCode = 'UNAUTHORIZED';
        break;
      case 404:
        errorCode = 'DOCUMENT_NOT_FOUND';
        break;
      case 413:
        errorCode = 'FILE_TOO_LARGE';
        break;
      case 429:
        errorCode = 'RATE_LIMITED';
        break;
      default:
        errorCode = 'API_ERROR';
    }

    // Create structured error
    const error = createError(
      errorCode,
      errorData.message || ERROR_CODES[errorCode].message,
      errorData
    );

    // Log the error
    console.error(`${context} (${response.status}):`, errorData);

    throw error;
  } catch (e) {
    console.error('API error handling failed:', e);
    throw e;
  }
};
