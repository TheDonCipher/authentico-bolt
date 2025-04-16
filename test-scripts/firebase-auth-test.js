/**
 * Firebase Authentication Test Script
 *
 * This script tests the authentication functionality using the Firebase client SDK.
 */

const axios = require('axios');
const { ethers } = require('ethers');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken, signOut } = require('firebase/auth');

// Create a random wallet for testing
const wallet = ethers.Wallet.createRandom();
console.log(`Using wallet address: ${wallet.address}`);

// Configuration
const apiUrl = 'http://localhost:3000/api';

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyAvxovIhlBmtmiLMT8-WcXpybq7MuJFN4A',
  authDomain: 'authentico-backend.firebaseapp.com',
  projectId: 'authentico-backend',
  storageBucket: 'authentico-backend.firebasestorage.app',
  messagingSenderId: '848880789142',
  appId: '1:848880789142:web:e955ddd9261224206384b7',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Test user registration
async function testRegistration() {
  console.log('\n=== Testing Registration ===');

  const userData = {
    walletAddress: wallet.address,
    userType: 'individual',
    userData: {
      name: 'Test User',
    },
  };

  try {
    console.log(`Registering user with wallet: ${wallet.address}`);
    const response = await axios.post(`${apiUrl}/auth/register`, userData);

    console.log('Registration response:', response.data);

    if (response.data.success) {
      console.log('✅ Registration successful');
      return true;
    } else {
      console.log('❌ Registration failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Test user login
async function testLogin() {
  console.log('\n=== Testing Login ===');

  const loginData = {
    walletAddress: wallet.address,
  };

  try {
    console.log(`Logging in with wallet: ${wallet.address}`);
    const response = await axios.post(`${apiUrl}/auth/login`, loginData);

    console.log('Login response:', response.data);

    if (response.data.token) {
      console.log('✅ Login successful');

      // Sign in with the custom token
      console.log('Signing in with custom token...');
      await signInWithCustomToken(auth, response.data.token);
      console.log('✅ Firebase sign in successful');

      // Get the ID token
      const idToken = await auth.currentUser.getIdToken();
      console.log('✅ ID token retrieved');

      return idToken;
    } else {
      console.log('❌ Login failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Test getting current user
async function testGetCurrentUser(idToken) {
  console.log('\n=== Testing Get Current User ===');

  try {
    console.log('Getting current user info');
    const response = await axios.get(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    console.log('User info response:', response.data);

    if (response.data && response.data.uid) {
      console.log('✅ Get current user successful');
      return true;
    } else {
      console.log('❌ Get current user failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Get current user error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Main function
async function runTests() {
  console.log('Starting Firebase Authentication Tests');
  console.log('=====================================');

  // Test registration
  const registrationSuccess = await testRegistration();

  // Test login
  const idToken = registrationSuccess ? await testLogin() : null;

  // Test get current user
  if (idToken) {
    await testGetCurrentUser(idToken);
  } else {
    console.log('\n⏭️ Skipping Get Current User test (no ID token)');
  }

  // Sign out
  await signOut(auth);
  console.log('\n✅ Signed out successfully');

  console.log('\n=====================================');
  console.log('Firebase Authentication Tests Complete');
}

// Run the tests
runTests().catch((error) => {
  console.error('Error running tests:', error);
});
