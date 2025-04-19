import { auth } from './firebase';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  setAuthCookie,
  setUserDataCookie,
  clearAuthCookies,
} from './auth-cookies';

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

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      console.log('Login API response status:', response.status);
      const data = await response.json();
      console.log('Login API response data:', data);

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
          await fetch('/api/auth/set-cookies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: idToken,
              userData: data.user,
            }),
          });
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
      if (
        fetchError.message === 'Failed to fetch' ||
        fetchError.name === 'TypeError'
      ) {
        console.error('Network error during login:', fetchError);
        return {
          success: false,
          networkError: true,
          message:
            'Network error. API server may be offline. Please try again later.',
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

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, userType, userData }),
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 409) {
        throw new Error(
          'This wallet address is already registered. Please sign in instead.'
        );
      }
      throw new Error(data.error || 'Registration failed');
    }

    // After registration, log the user in
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });

    const loginData = await loginResponse.json();

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
        await fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: idToken,
            userData: loginData.user,
          }),
        });
      } catch (cookieError) {
        console.error('Error setting auth cookies:', cookieError);
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
        const userData = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json());

        if (userData) {
          await fetch('/api/auth/set-cookies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              userData,
            }),
          });
        }
      } catch (cookieError) {
        console.error('Error setting auth cookies:', cookieError);
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
      await fetch('/api/auth/clear-cookies', {
        method: 'POST',
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
