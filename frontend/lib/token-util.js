/**
 * Token utility functions for API calls
 */
import { auth } from './firebase';

/**
 * Gets the current auth token for API calls
 * Always tries to get a fresh ID token from Firebase Auth
 * @returns {Promise<string|null>} The auth token or null if not available
 */
export const getAuthToken = async () => {
  try {
    // Get the current user from Firebase Auth
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Always get a fresh ID token
        const token = await currentUser.getIdToken(true); // Force refresh

        // Store it in localStorage for future use
        localStorage.setItem('authToken', token);

        return token;
      } catch (e) {
        // Silent error - token will be null
      }
    }

    // If we still don't have a token, return null
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Gets the authorization headers for API calls
 * @returns {Promise<Object>} The headers object with Authorization header if token is available
 */
export const getAuthHeaders = async () => {
  const token = await getAuthToken();

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Adds authorization header to existing headers object
 * @param {Object} headers - Existing headers object
 * @returns {Promise<Object>} The headers object with Authorization header if token is available
 */
export const addAuthHeader = async (headers = {}) => {
  const token = await getAuthToken();

  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return headers;
};
