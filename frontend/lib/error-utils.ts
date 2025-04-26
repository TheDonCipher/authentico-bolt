/**
 * Utility functions for error handling
 */

/**
 * Safely extracts error message from any error object
 * @param error - The error object
 * @returns A string representation of the error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    // Try to access common error properties
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    
    if ('response' in error && typeof (error as any).response === 'object' && (error as any).response !== null) {
      const response = (error as any).response;
      
      if ('data' in response && typeof response.data === 'object' && response.data !== null) {
        if ('message' in response.data && typeof response.data.message === 'string') {
          return response.data.message;
        }
        if ('error' in response.data && typeof response.data.error === 'string') {
          return response.data.error;
        }
      }
      
      if ('statusText' in response && typeof response.statusText === 'string') {
        return response.statusText;
      }
    }
    
    // If we can't find a message, stringify the object
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error object';
    }
  }
  
  // For primitive types or null/undefined
  return String(error);
}

/**
 * Safely extracts response data from an error object
 * @param error - The error object
 * @returns The response object or an empty object if not found
 */
export function getErrorResponse(error: unknown): Record<string, any> {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as any).response || {};
  }
  return {};
}

/**
 * Type guard to check if an object is an Error
 * @param error - The object to check
 * @returns True if the object is an Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
