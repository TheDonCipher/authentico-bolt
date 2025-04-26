/**
 * Types for authentication-related functionality
 */
import { User } from './user';

/**
 * Base interface for authentication results
 */
export interface AuthResultBase {
  success: boolean;
  message?: string;
}

/**
 * Interface for successful authentication results
 */
export interface SuccessfulAuthResult extends AuthResultBase {
  success: true;
  user: User;
  message?: string;
}

/**
 * Interface for successful authentication results with a new user
 */
export interface NewUserAuthResult extends SuccessfulAuthResult {
  newUser: true;
}

/**
 * Interface for failed authentication results
 */
export interface FailedAuthResult extends AuthResultBase {
  success: false;
  message: string;
  newUser?: boolean;
}

/**
 * Interface for network error authentication results
 */
export interface NetworkErrorAuthResult extends FailedAuthResult {
  networkError: true;
}

/**
 * Union type for all authentication results
 */
export type AuthResult =
  | SuccessfulAuthResult
  | NewUserAuthResult
  | FailedAuthResult
  | NetworkErrorAuthResult;

/**
 * Type guard to check if a value is a successful auth result
 */
export function isSuccessfulAuthResult(
  result: AuthResult
): result is SuccessfulAuthResult {
  return result.success === true;
}

/**
 * Type guard to check if a value is a new user auth result
 */
export function isNewUserAuthResult(
  result: AuthResult
): result is NewUserAuthResult {
  return (
    result.success === true && 'newUser' in result && result.newUser === true
  );
}

/**
 * Type guard to check if a value is a failed auth result
 */
export function isFailedAuthResult(
  result: AuthResult
): result is FailedAuthResult {
  return result.success === false;
}

/**
 * Type guard to check if a value is a network error auth result
 */
export function isNetworkErrorAuthResult(
  result: AuthResult
): result is NetworkErrorAuthResult {
  return (
    result.success === false &&
    'networkError' in result &&
    result.networkError === true
  );
}
