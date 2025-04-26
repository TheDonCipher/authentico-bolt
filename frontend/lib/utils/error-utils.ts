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
 * Type guard to check if an error has a response property
 * @param error - The error to check
 * @returns True if the error has a response property
 */
export function hasResponse(error: unknown): error is { response: unknown } {
  return typeof error === 'object' && error !== null && 'response' in error;
}

/**
 * Type guard to check if an error has a message property
 * @param error - The error to check
 * @returns True if the error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string';
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
 * Get the response from an error
 * @param error - The error to get the response from
 * @returns The response or an empty object
 */
export function getErrorResponse(error: unknown): Record<string, any> {
  if (hasResponse(error)) {
    return error.response as Record<string, any> || {};
  }
  
  return {};
}
