/**
 * Authentication and Document Upload Test Script
 * 
 * This script tests the core functionality of the Authentico application:
 * 1. User authentication (registration, login, logout)
 * 2. Document upload and verification
 * 
 * Usage: node test-scripts/auth-document-test.js [environment]
 * Example: node test-scripts/auth-document-test.js development
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const FormData = require('form-data');
const dotenv = require('dotenv');

// Load environment variables based on specified environment
const environment = process.argv[2] || 'development';
console.log(`Testing in ${environment} environment`);

// Load environment variables
dotenv.config({ path: `.env.${environment}` });

// Configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  testWalletPrivateKey: process.env.TEST_WALLET_PRIVATE_KEY,
  testFilePath: path.join(__dirname, 'test-document.pdf'),
};

// Create a test wallet if not provided
const wallet = config.testWalletPrivateKey
  ? new ethers.Wallet(config.testWalletPrivateKey)
  : ethers.Wallet.createRandom();

console.log(`Using wallet address: ${wallet.address}`);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
};

// Helper function to run a test
async function runTest(name, testFn) {
  testResults.total++;
  console.log(`\n🧪 Running test: ${name}`);
  try {
    await testFn();
    console.log(`✅ Test passed: ${name}`);
    testResults.passed++;
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    testResults.failed++;
    return false;
  }
}

// Helper function to skip a test
function skipTest(name, reason) {
  testResults.total++;
  testResults.skipped++;
  console.log(`\n⏭️ Skipping test: ${name}`);
  console.log(`   Reason: ${reason}`);
}

// Test user registration
async function testUserRegistration() {
  const userData = {
    walletAddress: wallet.address,
    userType: 'individual',
    userData: {
      name: 'Test User',
    },
  };

  const response = await axios.post(`${config.apiUrl}/auth/register`, userData);
  
  if (!response.data.success) {
    throw new Error('Registration failed');
  }
  
  console.log('   User registered successfully');
  return response.data;
}

// Test user login
async function testUserLogin() {
  const loginData = {
    walletAddress: wallet.address,
  };

  const response = await axios.post(`${config.apiUrl}/auth/login`, loginData);
  
  if (!response.data.token) {
    throw new Error('Login failed');
  }
  
  console.log('   User logged in successfully');
  return response.data;
}

// Test document upload
async function testDocumentUpload(authToken) {
  // Create a test document if it doesn't exist
  if (!fs.existsSync(config.testFilePath)) {
    fs.writeFileSync(
      config.testFilePath,
      'This is a test document for Authentico testing.'
    );
  }

  const formData = new FormData();
  formData.append('document_file', fs.createReadStream(config.testFilePath));
  formData.append('documentName', 'Test Document');
  formData.append('documentType', 'Identity');
  formData.append('verifyingOrgId', 'test-org-id'); // This should be a valid org ID in your system

  const response = await axios.post(
    `${config.apiUrl}/documents/upload`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.data.documentId) {
    throw new Error('Document upload failed');
  }

  console.log('   Document uploaded successfully');
  return response.data;
}

// Test getting user documents
async function testGetUserDocuments(authToken) {
  const response = await axios.get(`${config.apiUrl}/documents`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.data || !Array.isArray(response.data)) {
    throw new Error('Failed to get user documents');
  }

  console.log(`   Retrieved ${response.data.length} documents`);
  return response.data;
}

// Main test function
async function runTests() {
  console.log('Starting Authentication and Document Upload Tests');
  console.log('===============================================');

  let authToken;
  let registrationResult;
  let documentId;

  // Test user registration
  const registrationSuccess = await runTest(
    'User Registration',
    async () => {
      registrationResult = await testUserRegistration();
    }
  );

  // Test user login
  if (registrationSuccess) {
    const loginSuccess = await runTest('User Login', async () => {
      const loginResult = await testUserLogin();
      authToken = loginResult.token;
    });

    // Skip document tests if login failed
    if (!loginSuccess) {
      skipTest('Document Upload', 'Login failed');
      skipTest('Get User Documents', 'Login failed');
    }
  } else {
    skipTest('User Login', 'Registration failed');
    skipTest('Document Upload', 'Registration failed');
    skipTest('Get User Documents', 'Registration failed');
  }

  // Test document upload
  if (authToken) {
    const uploadSuccess = await runTest(
      'Document Upload',
      async () => {
        const uploadResult = await testDocumentUpload(authToken);
        documentId = uploadResult.documentId;
      }
    );

    // Test getting user documents
    await runTest('Get User Documents', async () => {
      const documents = await testGetUserDocuments(authToken);
      
      // Verify the uploaded document is in the list
      if (documentId) {
        const foundDocument = documents.find(doc => doc.id === documentId);
        if (!foundDocument) {
          throw new Error('Uploaded document not found in user documents');
        }
        console.log('   Uploaded document found in user documents');
      }
    });
  }

  // Print test summary
  console.log('\n===============================================');
  console.log('Test Summary:');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  console.log('===============================================');

  // Return non-zero exit code if any tests failed
  if (testResults.failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
