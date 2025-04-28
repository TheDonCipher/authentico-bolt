/**
 * CSRF protection utility for Authentico
 * This library provides CSRF token generation, validation, and management
 * to protect against Cross-Site Request Forgery attacks.
 */

// CSRF configuration
const CSRF_CONFIG = {
  tokenName: 'XSRF-TOKEN', // Match the backend cookie name
  headerName: 'x-xsrf-token', // Match the backend header name (lowercase for consistency)
  cookieOptions:
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'path=/; secure; samesite=lax'
      : 'path=/; secure; samesite=none',
  tokenLength: 64,
};

/**
 * Generate a secure random CSRF token
 * @returns A secure random token
 */
export const generateToken = (): string => {
  try {
    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Use crypto.getRandomValues() as fallback
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buffer = new Uint8Array(CSRF_CONFIG.tokenLength / 2);
      crypto.getRandomValues(buffer);
      return Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Last resort fallback (less secure)
    console.warn(
      'Secure random generation not available, using fallback method'
    );
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)
    );
  } catch (error) {
    console.error('CSRF token generation error:', error);
    // Simple fallback
    return (
      'csrf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
    );
  }
};

/**
 * Validate a CSRF token against the stored token
 * @param token The token to validate
 * @param storedToken The stored token to validate against
 * @returns True if the token is valid, false otherwise
 */
export const validateToken = (
  token: string | null | undefined,
  storedToken: string | null | undefined
): boolean => {
  if (!token || !storedToken) {
    console.error('CSRF validation failed: Missing token or stored token');
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  if (token.length !== storedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Set a CSRF token cookie
 * @param token The token to set
 * @param maxAge Cookie max age in seconds (default: 1 hour)
 */
export const setTokenCookie = (token: string, maxAge: number = 3600): void => {
  try {
    document.cookie = `${CSRF_CONFIG.tokenName}=${token}; ${CSRF_CONFIG.cookieOptions}; max-age=${maxAge}`;
  } catch (error) {
    console.error('CSRF token cookie setting error:', error);
  }
};

/**
 * Get the CSRF token from cookies
 * @returns The CSRF token or null if not found
 */
export const getTokenFromCookie = (): string | null => {
  try {
    const cookies = document.cookie.split(';');

    // First try to get the token using our configured name
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_CONFIG.tokenName) {
        return value;
      }
    }

    // If not found, try to get the token using the backend's cookie name
    // This is a fallback in case the backend sets a different cookie name
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        console.log('Found backend CSRF token:', value);
        return value;
      }
    }

    return null;
  } catch (error) {
    console.error('CSRF token cookie retrieval error:', error);
    return null;
  }
};

/**
 * Add a CSRF token to request headers
 * @param headers The headers object to add the token to
 * @returns The headers object with the CSRF token added
 */
export const addTokenToHeaders = (
  headers: Record<string, string> = {}
): Record<string, string> => {
  try {
    const token = getTokenFromCookie();

    if (token) {
      return {
        ...headers,
        [CSRF_CONFIG.headerName]: token,
      };
    }

    return headers;
  } catch (error) {
    console.error('CSRF token header addition error:', error);
    return headers;
  }
};

/**
 * Initialize CSRF protection
 * Generates a new token and sets it in a cookie
 * @returns The generated token or null if initialization fails
 */
export const initCsrfProtection = (): string | null => {
  try {
    // Generate a new token
    const token = generateToken();

    // Set the token in a cookie
    setTokenCookie(token);

    return token;
  } catch (error) {
    console.error('CSRF protection initialization error:', error);
    return null;
  }
};

/**
 * Refresh the CSRF token
 * Generates a new token and updates the cookie
 * @returns The new token or null if refresh fails
 */
export const refreshCsrfToken = (): string | null => {
  try {
    return initCsrfProtection();
  } catch (error) {
    console.error('CSRF token refresh error:', error);
    return null;
  }
};

/**
 * Create a CSRF-protected fetch function
 * @returns A fetch function that automatically adds CSRF tokens to requests
 */
export const createCsrfFetch = () => {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    try {
      // Get the CSRF token
      const token = getTokenFromCookie();

      if (!token) {
        // If no token exists, initialize CSRF protection
        initCsrfProtection();
      }

      // Add CSRF token to headers
      const headers = {
        ...(options.headers || {}),
        [CSRF_CONFIG.headerName]: getTokenFromCookie() || '',
      };

      // Make the request with the CSRF token
      return fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      console.error('CSRF-protected fetch error:', error);
      throw error;
    }
  };
};
