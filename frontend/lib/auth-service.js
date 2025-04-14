import { auth } from './firebase';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });

    const data = await response.json();

    if (response.ok) {
      // Sign in with the custom token from Firebase
      await signInWithCustomToken(auth, data.token);
      return { success: true, user: data.user };
    } else if (data.error === 'NEW_USER') {
      return {
        success: false,
        newUser: true,
        message: 'Please register to continue',
      };
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error(
        'Network error. Please check your connection and try again.'
      );
    }
    throw error;
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
      await signInWithCustomToken(auth, loginData.token);
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
      const token = await currentUser.getIdToken();
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
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
};

export { loginWithWallet, registerUser, getUserData, signOutUser };
