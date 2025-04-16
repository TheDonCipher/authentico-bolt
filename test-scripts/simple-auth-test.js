/**
 * Simple Authentication Test Script
 * 
 * This script tests the basic authentication functionality of the Authentico application.
 */

const axios = require('axios');
const { ethers } = require('ethers');

// Create a random wallet for testing
const wallet = ethers.Wallet.createRandom();
console.log(`Using wallet address: ${wallet.address}`);

// Configuration
const apiUrl = 'http://localhost:3000/api';

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
      return response.data.token;
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
async function testGetCurrentUser(token) {
  console.log('\n=== Testing Get Current User ===');
  
  try {
    console.log('Getting current user info');
    const response = await axios.get(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
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
  console.log('Starting Simple Authentication Tests');
  console.log('===================================');
  
  // Test registration
  const registrationSuccess = await testRegistration();
  
  // Test login
  const token = registrationSuccess ? await testLogin() : null;
  
  // Test get current user
  if (token) {
    await testGetCurrentUser(token);
  } else {
    console.log('\n⏭️ Skipping Get Current User test (no token)');
  }
  
  console.log('\n===================================');
  console.log('Simple Authentication Tests Complete');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});
