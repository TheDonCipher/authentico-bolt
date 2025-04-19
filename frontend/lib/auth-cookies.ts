/**
 * Client-side cookie utilities
 *
 * These functions are meant to be used in client components.
 * For server components, use auth-cookies-server.ts instead.
 */

// Function to set auth token in cookies (client-side)
export function setAuthCookie(token: string) {
  // In client components, we use the API route to set cookies
  // This is handled in auth-service.js via fetch calls to /api/auth/set-cookies
  console.log('Client-side cookie setting is handled via API routes');
}

// Function to set user data in cookies (client-side)
export function setUserDataCookie(userData: any) {
  // In client components, we use the API route to set cookies
  // This is handled in auth-service.js via fetch calls to /api/auth/set-cookies
  console.log('Client-side cookie setting is handled via API routes');
}

// Function to clear auth cookies (client-side)
export function clearAuthCookies() {
  // In client components, we use the API route to clear cookies
  // This is handled in auth-service.js via fetch calls to /api/auth/clear-cookies
  console.log('Client-side cookie clearing is handled via API routes');
}

// Function to get auth token from cookies (client-side)
export function getAuthCookie() {
  // In client components, we use localStorage instead of cookies
  // This is because httpOnly cookies are not accessible from client-side JavaScript
  return localStorage.getItem('authToken');
}

// Function to get user data from cookies (client-side)
export function getUserDataCookie() {
  const userDataString = localStorage.getItem('userData');
  if (userDataString) {
    try {
      return JSON.parse(userDataString);
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  }
  return null;
}
