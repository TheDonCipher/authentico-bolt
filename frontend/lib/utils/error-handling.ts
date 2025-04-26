/**
 * Utility functions for handling errors
 */

/**
 * Type guard to check if an error is an Error object
 * @param error - The error to check
 * @returns True if the error is an Error object
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if an error has a message property
 * @param error - The error to check
 * @returns True if the error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

/**
 * Get the error message from an unknown error
 * @param error - The error to get the message from
 * @param fallback - The fallback message to use if the error doesn't have a message
 * @returns The error message
 */
export function getErrorMessage(error: unknown, fallback = 'An unknown error occurred'): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (hasMessage(error)) {
    return error.message;
  }
  
  return fallback;
}

/**
 * Log an error to the console
 * @param error - The error to log
 * @param context - The context in which the error occurred
 */
export function logError(error: unknown, context = 'Error'): void {
  const message = getErrorMessage(error);
  console.error(`${context}: ${message}`);
  
  if (isError(error) && error.stack) {
    console.error(error.stack);
  }
}

/**
 * Create a standardized error response
 * @param error - The error to create a response for
 * @param fallbackMessage - The fallback message to use if the error doesn't have a message
 * @returns The error response
 */
export function createErrorResponse(error: unknown, fallbackMessage = 'An error occurred'): { 
  success: false; 
  error: string; 
  details?: any;
} {
  const message = getErrorMessage(error, fallbackMessage);
  
  return {
    success: false,
    error: message,
    details: isError(error) ? error : undefined
  };
}
