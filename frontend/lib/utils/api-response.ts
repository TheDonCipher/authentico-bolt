/**
 * Utility functions for handling API responses
 */
import { NextResponse } from 'next/server';
import { getErrorMessage } from './error-handling';

/**
 * Create a success response
 * @param data - The data to include in the response
 * @param status - The HTTP status code
 * @returns The success response
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create an error response
 * @param error - The error to include in the response
 * @param status - The HTTP status code
 * @returns The error response
 */
export function createErrorResponse(error: unknown, status = 500): NextResponse {
  const message = getErrorMessage(error, 'An unknown error occurred');
  
  return NextResponse.json(
    {
      error: typeof error === 'string' ? error : 'ERROR',
      message,
      details: error instanceof Error ? error.stack : undefined,
    },
    { status }
  );
}

/**
 * Create an unauthorized response
 * @param message - The error message
 * @returns The unauthorized response
 */
export function createUnauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    {
      error: 'UNAUTHORIZED',
      message,
    },
    { status: 401 }
  );
}

/**
 * Create a forbidden response
 * @param message - The error message
 * @returns The forbidden response
 */
export function createForbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message,
    },
    { status: 403 }
  );
}

/**
 * Create a not found response
 * @param message - The error message
 * @returns The not found response
 */
export function createNotFoundResponse(message = 'Not found'): NextResponse {
  return NextResponse.json(
    {
      error: 'NOT_FOUND',
      message,
    },
    { status: 404 }
  );
}

/**
 * Create a bad request response
 * @param message - The error message
 * @returns The bad request response
 */
export function createBadRequestResponse(message = 'Bad request'): NextResponse {
  return NextResponse.json(
    {
      error: 'BAD_REQUEST',
      message,
    },
    { status: 400 }
  );
}
