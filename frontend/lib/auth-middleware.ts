import { NextRequest, NextResponse } from 'next/server';
import { auth } from './firebase-admin-server';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Interface for successful authentication result
 */
export interface AuthSuccess {
  success: true;
  uid: string;
  decodedToken: DecodedIdToken;
}

/**
 * Interface for failed authentication result
 */
export interface AuthFailure {
  success: false;
  error: string;
  status: number;
}

/**
 * Type for authentication result
 */
export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Type guard to check if auth result is successful
 */
export function isAuthSuccess(result: AuthResult): result is AuthSuccess {
  return result.success === true;
}

/**
 * Middleware to verify authentication tokens
 * This can be used in API routes to protect endpoints
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No token provided',
        status: 401,
      };
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];

    // Check if token is blacklisted
    if (global.tokenBlacklist && global.tokenBlacklist.has(token)) {
      return {
        success: false,
        error: 'Token has been revoked',
        status: 401,
      };
    }

    try {
      // Verify the token
      const decodedToken = await auth.verifyIdToken(token);
      return {
        success: true,
        uid: decodedToken.uid,
        decodedToken,
      };
    } catch (error: any) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: error.message || 'Invalid token',
        status: 401,
      };
    }
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: error.message || 'Authentication error',
      status: 500,
    };
  }
}
