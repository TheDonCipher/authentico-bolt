import { auth } from './firebase';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  setAuthCookie,
  setUserDataCookie,
  clearAuthCookies,
} from './auth-cookies';
import {
  getTokenFromCookie,
  initCsrfProtection,
  addTokenToHeaders,
} from './csrf-protection';
import { API_ENDPOINTS } from './constants';

/**
 * Attempts to login with a wallet address
 * @param {string} walletAddress - The user's wallet address
 * @returns {Promise<Object>} - Result object with success status and user data or error
 */
const loginWithWallet = async (walletAddress) => {
  try {
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new Error('Invalid wallet address format');
    }

    try {
      console.log('Attempting to login with wallet address:', walletAddress);

      // First, get a CSRF token from the backend or generate one client-side
      console.log('Fetching CSRF token for login...');
      try {
        // Set a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const csrfResponse = await fetch(API_ENDPOINTS.AUTH.CSRF_TOKEN, {
          method: 'GET',
          credentials: 'include', // Include cookies in the request
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!csrfResponse.ok) {
          console.warn(
            'Failed to get CSRF token from backend, using client-side fallback'
          );
          // Generate a client-side token as fallback
          const token = initCsrfProtection();
          console.log(
            'Generated client-side CSRF token for login:',
            token ? 'Success' : 'Failed'
          );
        } else {
          const data = await csrfResponse.json();
          console.log(
            `Successfully fetched CSRF token from ${data.source || 'server'}`
          );

          // Check if we need to show a backend connectivity warning
          if (data.source === 'client-side') {
            console.warn(
              'Backend API server appears to be offline. Using client-side CSRF token generation.'
            );
          }
        }
      } catch (csrfError) {
        console.error('Error fetching CSRF token:', csrfError);

        // Check if this was a timeout/abort error
        if (csrfError.name === 'AbortError') {
          console.warn('CSRF token request timed out. Backend may be offline.');
        }

        // Generate a client-side token as fallback
        const token = initCsrfProtection();
        console.log(
          'Generated client-side CSRF token after error:',
          token ? 'Success' : 'Failed'
        );
      }

      // Get CSRF token from cookie (should be set by the backend or client-side fallback)
      let csrfToken = getTokenFromCookie();
      if (!csrfToken) {
        console.error('No CSRF token found in cookie, generating one now');
        // Last resort - generate a token and try again
        csrfToken = initCsrfProtection();
        if (!csrfToken) {
          console.error('Failed to generate CSRF token as last resort');
          throw new Error('Could not generate CSRF token');
        }
      }
      console.log('Using CSRF token for login:', csrfToken);

      // Add CSRF token to headers
      const headers = addTokenToHeaders({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      });
      console.log('Request headers:', headers);

      // Add cache-busting parameter to prevent caching issues
      const cacheBuster = `?_=${Date.now()}`;
      const response = await fetch(`/api/auth/login${cacheBuster}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          walletAddress,
          _csrf: csrfToken, // Explicitly include CSRF token in the body
        }),
        credentials: 'include', // Include cookies in the request
      });

      console.log('Login API response status:', response.status);

      // Safely parse JSON response
      let data;
      try {
        const text = await response.text();
        console.log('Login API raw response:', text);
        data = text ? JSON.parse(text) : {};
        console.log('Login API parsed data:', data);
      } catch (parseError) {
        console.error('Error parsing login response:', parseError);
        return {
          success: false,
          parseError: true,
          message: 'Error parsing server response. Please try again later.',
        };
      }

      if (response.ok) {
        console.log('Login API response OK, signing in with custom token');
        // Sign in with the custom token from Firebase
        const userCredential = await signInWithCustomToken(auth, data.token);
        console.log('Successfully signed in with custom token');

        // Get the ID token from the user credential
        const idToken = await userCredential.user.getIdToken();
        console.log('Successfully obtained ID token for API calls');

        // Store the ID token and user data in localStorage for client-side access
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('userData', JSON.stringify(data.user));

        // Set cookies for server-side access
        try {
          console.log('Setting auth cookies with token and user data');
          // Add CSRF token to headers
          const cookieHeaders = addTokenToHeaders({
            'Content-Type': 'application/json',
          });
          console.log('Cookie request headers:', cookieHeaders);

          const cookieResponse = await fetch('/api/auth/set-cookies', {
            method: 'POST',
            headers: cookieHeaders,
            body: JSON.stringify({
              token: idToken,
              userData: data.user,
            }),
            credentials: 'include', // Include cookies in the request
          });

          if (!cookieResponse.ok) {
            const errorData = await cookieResponse.json();
            console.error('Error setting auth cookies:', errorData);
          } else {
            console.log('Auth cookies set successfully');
          }
        } catch (cookieError) {
          console.error('Error setting auth cookies:', cookieError);
          // Continue even if cookie setting fails
        }

        return {
          success: true,
          user: data.user,
          message: 'Sign in successful!',
        };
      } else if (data.error === 'NEW_USER') {
        console.log('Login API indicates new user');
        return {
          success: false,
          newUser: true,
          message: 'This wallet is not registered yet. Please register first.',
        };
      } else if (
        data.error === 'FIREBASE_AUTH_ERROR' ||
        data.error === 'TOKEN_CREATION_ERROR'
      ) {
        console.log('Firebase authentication error detected:', data.error);
        return {
          success: false,
          firebaseAuthError: true,
          message:
            data.message ||
            'Firebase authentication error. Please try again later.',
        };
      } else {
        console.error('Login API error:', data.error, data.message);
        throw new Error(
          data.error || 'Authentication failed. Please try again.'
        );
      }
    } catch (fetchError) {
      // Handle network errors specifically
      console.error('Fetch error during login:', fetchError);

      if (
        fetchError.message === 'Failed to fetch' ||
        fetchError.name === 'TypeError' ||
        fetchError.message.includes('NetworkError') ||
        fetchError.message.includes('network') ||
        fetchError.message.includes('timeout') ||
        fetchError.name === 'AbortError'
      ) {
        console.warn('Network error during login. Backend API may be offline.');

        // Try to continue with client-side authentication if possible
        // This is a fallback mechanism when the backend is down
        try {
          // Check if we have a wallet address and can authenticate locally
          if (walletAddress) {
            console.log(
              'Attempting local wallet authentication as fallback...'
            );

            // For now, we'll just return a partial success with limited functionality
            return {
              success: false,
              networkError: true,
              backendOffline: true,
              message:
                'Backend API server appears to be offline. Some features may be limited until connectivity is restored.',
              details: fetchError.message,
            };
          }
        } catch (fallbackError) {
          console.error('Error in fallback authentication:', fallbackError);
        }

        return {
          success: false,
          networkError: true,
          message:
            'Network error. API server may be offline or experiencing high load. Please try again later.',
          details: fetchError.message,
        };
      }

      // Handle SyntaxError from JSON parsing
      if (fetchError.name === 'SyntaxError') {
        return {
          success: false,
          parseError: true,
          message: 'Error parsing server response. Please try again later.',
          details: fetchError.message,
        };
      }

      throw fetchError; // Re-throw other errors to be handled by the outer catch
    }
  } catch (error) {
    console.error('Login error:', error);
    // Provide more specific error messages for common errors
    if (error.message.includes('wallet')) {
      throw new Error(error.message); // Pass through wallet-related errors
    } else {
      throw new Error('Authentication failed. Please try again.');
    }
  }
};

/**
 * Registers a new user
 * @param {string} walletAddress - The user's wallet address
 * @param {string} userType - Either 'individual' or 'organization'
 * @param {Object} userData - User data like name, email, etc.
 * @returns {Promise<Object>} - Result object with success status
 */
const registerUser = async (walletAddress, userType, userData) => {
  try {
    // Validate inputs
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    if (!userType || !['individual', 'organization'].includes(userType)) {
      throw new Error(
        'Valid user type is required (individual or organization)'
      );
    }

    if (!userData || !userData.name) {
      throw new Error('Name is required');
    }

    if (userType === 'organization' && !userData.organizationName) {
      throw new Error('Organization name is required');
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new Error('Invalid wallet address format');
    }

    console.log('Registering user with wallet address:', walletAddress);

    // First, get a CSRF token from the backend
    console.log('Fetching CSRF token from backend for registration...');
    try {
      const csrfResponse = await fetch(API_ENDPOINTS.AUTH.CSRF_TOKEN, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (!csrfResponse.ok) {
        console.error(
          'Failed to get CSRF token from backend for registration:',
          await csrfResponse.text()
        );
        throw new Error('Failed to get CSRF token for registration');
      }

      console.log(
        'Successfully fetched CSRF token from backend for registration'
      );
    } catch (csrfError) {
      console.error('Error fetching CSRF token for registration:', csrfError);
      throw new Error(
        'Failed to get CSRF token for registration: ' + csrfError.message
      );
    }

    // Get CSRF token from cookie (should be set by the backend now)
    let csrfToken = getTokenFromCookie();
    if (!csrfToken) {
      console.error(
        'No CSRF token found in cookie after fetching from backend for registration'
      );
      throw new Error('CSRF token not found for registration');
    }
    console.log('Using CSRF token from backend for registration:', csrfToken);

    // Add CSRF token to headers
    const headers = addTokenToHeaders({ 'Content-Type': 'application/json' });
    console.log('Registration request headers:', headers);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers,
      body: JSON.stringify({ walletAddress, userType, userData }),
      credentials: 'include', // Include cookies in the request
    });

    console.log('Register API response status:', response.status);

    // Safely parse JSON response
    let data;
    try {
      const text = await response.text();
      console.log('Register API raw response:', text);
      data = text ? JSON.parse(text) : {};
      console.log('Register API parsed data:', data);
    } catch (parseError) {
      console.error('Error parsing register response:', parseError);
      throw new Error('Error parsing server response. Please try again later.');
    }
    if (!response.ok) {
      if (response.status === 409) {
        throw new Error(
          'This wallet address is already registered. Please sign in instead.'
        );
      }
      throw new Error(data.error || 'Registration failed');
    }

    // After registration, log the user in
    console.log(
      'Logging in after registration with wallet address:',
      walletAddress
    );

    // First, get a CSRF token from the backend for post-registration login
    console.log(
      'Fetching CSRF token from backend for post-registration login...'
    );
    try {
      const csrfResponse = await fetch(API_ENDPOINTS.AUTH.CSRF_TOKEN, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (!csrfResponse.ok) {
        console.error(
          'Failed to get CSRF token from backend for post-registration login:',
          await csrfResponse.text()
        );
        throw new Error('Failed to get CSRF token for post-registration login');
      }

      console.log(
        'Successfully fetched CSRF token from backend for post-registration login'
      );
    } catch (csrfError) {
      console.error(
        'Error fetching CSRF token for post-registration login:',
        csrfError
      );
      throw new Error(
        'Failed to get CSRF token for post-registration login: ' +
          csrfError.message
      );
    }

    // Get CSRF token from cookie (should be set by the backend now)
    let loginCsrfToken = getTokenFromCookie();
    if (!loginCsrfToken) {
      console.error(
        'No CSRF token found in cookie after fetching from backend for post-registration login'
      );
      throw new Error('CSRF token not found for post-registration login');
    }
    console.log(
      'Using CSRF token from backend for post-registration login:',
      loginCsrfToken
    );

    // Add CSRF token to headers
    const loginHeaders = addTokenToHeaders({
      'Content-Type': 'application/json',
    });
    console.log('Post-registration login request headers:', loginHeaders);

    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: loginHeaders,
      body: JSON.stringify({ walletAddress }),
      credentials: 'include', // Include cookies in the request
    });

    console.log(
      'Login after register API response status:',
      loginResponse.status
    );

    // Safely parse JSON response
    let loginData;
    try {
      const text = await loginResponse.text();
      console.log('Login after register API raw response:', text);
      loginData = text ? JSON.parse(text) : {};
      console.log('Login after register API parsed data:', loginData);
    } catch (parseError) {
      console.error('Error parsing login after register response:', parseError);
      throw new Error(
        'Error parsing server response after registration. Please try again later.'
      );
    }

    if (loginResponse.ok) {
      const userCredential = await signInWithCustomToken(auth, loginData.token);

      // Get the ID token from the user credential
      const idToken = await userCredential.user.getIdToken();
      console.log('Successfully obtained ID token after registration');

      // Store the ID token and user data in localStorage for client-side access
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('userData', JSON.stringify(loginData.user));

      // Set cookies for server-side access
      try {
        console.log('Setting auth cookies after registration');
        // Add CSRF token to headers
        const cookieHeaders = addTokenToHeaders({
          'Content-Type': 'application/json',
        });
        console.log('Post-registration cookie request headers:', cookieHeaders);

        const cookieResponse = await fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: cookieHeaders,
          body: JSON.stringify({
            token: idToken,
            userData: loginData.user,
          }),
          credentials: 'include', // Include cookies in the request
        });

        if (!cookieResponse.ok) {
          const errorData = await cookieResponse.json();
          console.error(
            'Error setting auth cookies after registration:',
            errorData
          );
        } else {
          console.log('Auth cookies set successfully after registration');
        }
      } catch (cookieError) {
        console.error(
          'Error setting auth cookies after registration:',
          cookieError
        );
        // Continue even if cookie setting fails
      }

      return {
        success: true,
        user: loginData.user,
        message: 'Registration successful!',
      };
    } else {
      throw new Error('Error signing in after registration');
    }
  } catch (error) {
    console.error('Registration Error', error);
    if (error.message === 'Failed to fetch') {
      throw new Error(
        'Network error. Please check your connection and try again.'
      );
    }
    throw error;
  }
};

/**
 * Gets the current user's data
 * @returns {Promise<Object>} - User data
 */
const getUserData = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is signed in');
    }

    try {
      // Get a fresh ID token
      const token = await currentUser.getIdToken(true); // Force refresh

      // Store the fresh token in localStorage
      localStorage.setItem('authToken', token);

      // Set cookies for server-side access
      try {
        console.log('Fetching user data for cookie update');
        const userDataResponse = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userDataResponse.ok) {
          console.error(
            'Error fetching user data for cookies:',
            userDataResponse.status
          );
        } else {
          const userData = await userDataResponse.json();
          console.log('User data fetched successfully for cookie update');

          if (userData) {
            console.log('Setting auth cookies in getUserData');
            // Add CSRF token to headers
            const cookieHeaders = addTokenToHeaders({
              'Content-Type': 'application/json',
            });
            console.log('getUserData cookie request headers:', cookieHeaders);

            const cookieResponse = await fetch('/api/auth/set-cookies', {
              method: 'POST',
              headers: cookieHeaders,
              body: JSON.stringify({
                token,
                userData,
              }),
              credentials: 'include', // Include cookies in the request
            });

            if (!cookieResponse.ok) {
              const errorData = await cookieResponse.json();
              console.error(
                'Error setting auth cookies in getUserData:',
                errorData
              );
            } else {
              console.log('Auth cookies set successfully in getUserData');
            }
          }
        }
      } catch (cookieError) {
        console.error(
          'Error setting auth cookies in getUserData:',
          cookieError
        );
        // Continue even if cookie setting fails
      }

      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          // User exists in Firebase Auth but not in Firestore
          // This is an inconsistent state that should be handled
          await signOut(auth); // Sign out the user
          throw new Error('User account is incomplete. Please register again.');
        }
        throw new Error(data.error || 'Failed to fetch user data');
      }

      // Store user data in localStorage for client-side access
      localStorage.setItem('userData', JSON.stringify(data));

      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error(
          'Network error. Please check your connection and try again.'
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

/**
 * Signs out the current user
 * @returns {Promise<void>}
 */
const signOutUser = async () => {
  try {
    // Clear Firebase auth state
    await signOut(auth);

    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');

    // Clear cookies
    try {
      // Add CSRF token to headers
      const headers = addTokenToHeaders();
      console.log('Logout cookie request headers:', headers);

      await fetch('/api/auth/clear-cookies', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies in the request
      });
    } catch (cookieError) {
      console.error('Error clearing auth cookies:', cookieError);
      // Continue even if cookie clearing fails
    }
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
};

export { loginWithWallet, registerUser, getUserData, signOutUser };
