/**
 * Token utility functions for authentication
 */

import { auth } from './firebase';

/**
 * Get the current Firebase ID token
 * @returns {Promise<string|null>} The ID token or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('No current user found');
      return null;
    }
    
    // Force refresh to ensure we have the latest token
    const token = await currentUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Get the token from localStorage (for client-side use)
 * @returns {string|null} The token or null if not found
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Check if a token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if the token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const { exp } = JSON.parse(jsonPayload);
    const expired = Date.now() >= exp * 1000;
    
    return expired;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if there's an error
  }
}
