/**
 * CSRF Token Test Script
 * 
 * This script tests the CSRF token functionality in the Authentico application.
 * It makes requests to the backend API to verify that CSRF tokens are properly
 * generated and validated.
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'https://authentico-backend.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://authentico-demov2.vercel.app';

// Test functions
async function testCsrfTokenGeneration() {
  console.log('Testing CSRF token generation...');
  
  try {
    // Make a request to the CSRF token endpoint
    const response = await axios.get(`${API_URL}/api/auth/csrf-token`, {
      withCredentials: true,
    });
    
    console.log('CSRF token response:', response.status, response.data);
    console.log('CSRF token cookies:', response.headers['set-cookie']);
    
    return {
      success: true,
      cookies: response.headers['set-cookie'],
      data: response.data,
    };
  } catch (error) {
    console.error('CSRF token generation error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testCsrfTokenValidation(cookies) {
  console.log('Testing CSRF token validation...');
  
  if (!cookies || !cookies.length) {
    console.error('No cookies provided for CSRF token validation test');
    return {
      success: false,
      error: 'No cookies provided',
    };
  }
  
  try {
    // Extract the CSRF token from cookies
    const csrfCookie = cookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
    if (!csrfCookie) {
      console.error('No CSRF token found in cookies');
      return {
        success: false,
        error: 'No CSRF token found in cookies',
      };
    }
    
    const csrfToken = csrfCookie.split(';')[0].split('=')[1];
    console.log('Extracted CSRF token:', csrfToken);
    
    // Make a POST request with the CSRF token
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { walletAddress: '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c', _csrf: csrfToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
          'Cookie': cookies.join('; '),
        },
        withCredentials: true,
      }
    );
    
    console.log('CSRF validation response:', response.status, response.data);
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('CSRF token validation error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testFrontendCsrfToken() {
  console.log('Testing frontend CSRF token endpoint...');
  
  try {
    // Make a request to the frontend CSRF token endpoint
    const response = await axios.get(`${FRONTEND_URL}/api/auth/csrf-token`, {
      withCredentials: true,
    });
    
    console.log('Frontend CSRF token response:', response.status, response.data);
    console.log('Frontend CSRF token cookies:', response.headers['set-cookie']);
    
    return {
      success: true,
      cookies: response.headers['set-cookie'],
      data: response.data,
    };
  } catch (error) {
    console.error('Frontend CSRF token error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the tests
async function runTests() {
  console.log('=== CSRF Token Tests ===');
  console.log('API URL:', API_URL);
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('========================');
  
  // Test backend CSRF token generation
  const backendResult = await testCsrfTokenGeneration();
  console.log('\nBackend CSRF token generation result:', backendResult.success ? 'SUCCESS' : 'FAILURE');
  
  // Test frontend CSRF token endpoint
  const frontendResult = await testFrontendCsrfToken();
  console.log('\nFrontend CSRF token endpoint result:', frontendResult.success ? 'SUCCESS' : 'FAILURE');
  
  // Test CSRF token validation if generation was successful
  if (backendResult.success && backendResult.cookies) {
    const validationResult = await testCsrfTokenValidation(backendResult.cookies);
    console.log('\nCSRF token validation result:', validationResult.success ? 'SUCCESS' : 'FAILURE');
  }
  
  console.log('\n=== Tests Complete ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
