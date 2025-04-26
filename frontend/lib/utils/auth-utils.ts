/**
 * Utility functions for handling authentication
 */
import { User } from '../../app/types/user';

/**
 * Type guard to check if a value is a User
 * @param value - The value to check
 * @returns True if the value is a User
 */
export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'uid' in value &&
    typeof (value as any).uid === 'string'
  );
}

/**
 * Type guard to check if a value is an auth result
 * @param value - The value to check
 * @returns True if the value is an auth result
 */
export function isAuthResult(value: unknown): value is { success: boolean; user?: User; message?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  );
}

/**
 * Type guard to check if a value is a successful auth result
 * @param value - The value to check
 * @returns True if the value is a successful auth result
 */
export function isSuccessfulAuthResult(
  value: unknown
): value is { success: true; user: User; message?: string } {
  return (
    isAuthResult(value) &&
    value.success === true &&
    'user' in value &&
    isUser(value.user)
  );
}

/**
 * Type guard to check if a value is a failed auth result
 * @param value - The value to check
 * @returns True if the value is a failed auth result
 */
export function isFailedAuthResult(
  value: unknown
): value is { success: false; message: string } {
  return (
    isAuthResult(value) &&
    value.success === false &&
    'message' in value &&
    typeof (value as any).message === 'string'
  );
}

/**
 * Type guard to check if a value is a network error auth result
 * @param value - The value to check
 * @returns True if the value is a network error auth result
 */
export function isNetworkErrorAuthResult(
  value: unknown
): value is { success: false; networkError: true; message: string } {
  return (
    isFailedAuthResult(value) &&
    'networkError' in value &&
    (value as any).networkError === true
  );
}

/**
 * Type guard to check if a value is a new user auth result
 * @param value - The value to check
 * @returns True if the value is a new user auth result
 */
export function isNewUserAuthResult(
  value: unknown
): value is { success: true; newUser: true; user: User; message?: string } {
  return (
    isSuccessfulAuthResult(value) &&
    'newUser' in value &&
    (value as any).newUser === true
  );
}
