/**
 * Verify Links Testing Script
 * 
 * This script tests the verify links by making requests to both the frontend and backend
 * endpoints to ensure they're working correctly.
 */

const axios = require('axios');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get environment variables or use defaults
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Function to test the frontend verify API endpoint
async function testFrontendVerifyApi(documentId) {
  try {
    console.log(`Testing frontend verify API endpoint for document ID: ${documentId}`);
    console.log(`URL: ${FRONTEND_URL}/api/verify/${documentId}`);
    
    const response = await axios.get(`${FRONTEND_URL}/api/verify/${documentId}`, {
      timeout: 10000,
      headers: {
        'x-test-source': 'verify-links-test-script'
      }
    });
    
    console.log('✅ Frontend API response status:', response.status);
    console.log('Frontend API response data:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error testing frontend verify API endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Function to test the backend verify endpoint
async function testBackendVerifyApi(documentId) {
  try {
    console.log(`Testing backend verify endpoint for document ID: ${documentId}`);
    console.log(`URL: ${BACKEND_URL}/api/verify/${documentId}`);
    
    const response = await axios.get(`${BACKEND_URL}/api/verify/${documentId}`, {
      timeout: 10000,
      headers: {
        'x-test-source': 'verify-links-test-script'
      }
    });
    
    console.log('✅ Backend API response status:', response.status);
    console.log('Backend API response data:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error testing backend verify endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Main function to run the tests
async function runTests() {
  console.log('=== Verify Links Testing Script ===');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  
  rl.question('\nEnter a document ID to test (or press Enter to use a test ID): ', async (documentId) => {
    // Use a default test ID if none provided
    const testId = documentId || 'test-document-id';
    
    console.log('\n=== Testing Frontend Verify API ===');
    const frontendResult = await testFrontendVerifyApi(testId);
    
    console.log('\n=== Testing Backend Verify API ===');
    const backendResult = await testBackendVerifyApi(testId);
    
    console.log('\n=== Test Results ===');
    console.log(`Frontend Verify API: ${frontendResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Backend Verify API: ${backendResult ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!frontendResult || !backendResult) {
      console.log('\n⚠️ Some tests failed. Please check the error messages above.');
      console.log('\nTroubleshooting tips:');
      console.log('1. Make sure both the frontend and backend servers are running');
      console.log('2. Check that the document ID exists in the database');
      console.log('3. Verify that the API URLs are correct');
      console.log('4. Check the server logs for more detailed error messages');
      console.log('5. Ensure that the Next.js configuration is set up correctly (no static export)');
      console.log('6. Verify that environment variables are set correctly');
    } else {
      console.log('\n🎉 All tests passed! The verify links are working correctly.');
    }
    
    rl.close();
  });
}

// Run the tests
runTests();
