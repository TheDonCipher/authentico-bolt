/**
 * Combined Authentication and Document Upload Test Script
 *
 * This script tests the core functionality of the Authentico application:
 * 1. User authentication with wallet-based login
 * 2. Document upload to IPFS via Pinata
 * 3. Document status verification
 *
 * Usage: node test-scripts/combined-test.js [environment]
 * Example: node test-scripts/combined-test.js development
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const FormData = require('form-data');
const dotenv = require('dotenv');
const crypto = require('crypto');

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
  testFileSize: 1024 * 1024, // 1MB
  verifyingOrgId: process.env.TEST_VERIFYING_ORG_ID || 'test-org-id',
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
async function testUserRegistration(userType = 'individual') {
  const userData = {
    walletAddress: wallet.address,
    userType,
    userData: {
      name: `Test ${userType === 'individual' ? 'User' : 'Organization'}`,
      ...(userType === 'organization' && {
        organizationName: 'Test Organization',
      }),
    },
  };

  console.log(`   Registering ${userType} user with wallet: ${wallet.address}`);

  try {
    // Use the frontend API route instead of the backend route
    const frontendApiUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
    const response = await axios.post(
      `${frontendApiUrl}/api/auth/register`,
      userData
    );

    if (!response.data.success) {
      throw new Error(
        'Registration failed: ' + (response.data.message || 'Unknown error')
      );
    }

    console.log(`   ${userType} user registered successfully`);
    return response.data;
  } catch (error) {
    // If registration fails because user already exists, that's okay
    if (error.response && error.response.status === 409) {
      console.log('   User already exists, proceeding with login');
      return { success: true, message: 'User already exists' };
    }
    throw error;
  }
}

// Test user login
async function testUserLogin() {
  const loginData = {
    walletAddress: wallet.address,
  };

  console.log(`   Logging in with wallet: ${wallet.address}`);

  try {
    // Use the frontend API route instead of the backend route
    const frontendApiUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
    const response = await axios.post(
      `${frontendApiUrl}/api/auth/login`,
      loginData
    );

    if (!response.data.token) {
      throw new Error(
        'Login failed: ' + (response.data.message || 'Unknown error')
      );
    }

    console.log('   User logged in successfully');
    console.log('   Token received successfully');
    return response.data;
  } catch (error) {
    console.error('   Login error details:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error(
        '   Response data:',
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}

// Create a test document
function createTestDocument() {
  console.log('Creating test document...');

  // Create a much smaller test document (100KB instead of 1MB)
  const header = '%PDF-1.5\n';
  const randomContent = crypto.randomBytes(100 * 1024).toString('hex'); // 100KB
  const footer = '\n%%EOF';

  const content = header + randomContent + footer;

  fs.writeFileSync(config.testFilePath, content);
  console.log(
    `   Created test document at ${config.testFilePath} (${content.length} bytes)`
  );

  return {
    path: config.testFilePath,
    size: content.length,
    hash: crypto.createHash('sha256').update(content).digest('hex'),
  };
}

// Test document upload
async function testDocumentUpload(authToken, documentInfo) {
  if (!authToken) {
    throw new Error('Authentication token is required');
  }

  const formData = new FormData();
  formData.append('document_file', fs.createReadStream(documentInfo.path));
  formData.append('documentName', 'Test Document');
  formData.append('documentType', 'Identity');
  formData.append('verifyingOrgId', config.verifyingOrgId);

  try {
    console.log('   Uploading document...');
    console.log('   Using API URL:', config.apiUrl);
    console.log('   Document size:', documentInfo.size, 'bytes');
    console.log(
      '   Document hash:',
      documentInfo.hash.substring(0, 10) + '...'
    );

    // Use the backend API route directly
    console.log('   Sending request to backend API...');
    const response = await axios.post(
      `${config.apiUrl}/documents/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`,
        },
        // Add timeout and maxBodyLength/maxContentLength options
        timeout: 30000, // 30 seconds
        maxBodyLength: 5 * 1024 * 1024, // 5MB
        maxContentLength: 5 * 1024 * 1024, // 5MB
      }
    );
    console.log('   Backend API response received');

    if (!response.data.documentId) {
      throw new Error('Document upload failed: No document ID returned');
    }

    console.log(
      '   Document uploaded successfully with ID:',
      response.data.documentId
    );
    console.log('   Document status:', response.data.status);
    return response.data;
  } catch (error) {
    console.error('   Upload error details:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error(
        '   Response data:',
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}

// Test document status
async function testDocumentStatus(authToken, documentId) {
  if (!authToken || !documentId) {
    throw new Error('Authentication token and document ID are required');
  }

  try {
    console.log('   Checking document status...');
    // Use the backend API route directly
    const response = await axios.get(
      `${config.apiUrl}/documents/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.data) {
      throw new Error('Failed to get document status');
    }

    console.log(`   Document status: ${response.data.status}`);
    if (response.data.transactionHash) {
      console.log(
        `   Transaction hash: ${response.data.transactionHash.substring(
          0,
          10
        )}...`
      );
    }
    return response.data;
  } catch (error) {
    console.error('   Status check error details:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error(
        '   Response data:',
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('Starting Combined Authentication and Document Upload Tests');
  console.log('=======================================================');

  let authToken;
  let documentInfo;
  let documentId;

  // Test user registration
  await runTest('User Registration', async () => {
    await testUserRegistration('individual');
  });

  // Test user login
  const loginSuccess = await runTest('User Login', async () => {
    const loginResult = await testUserLogin();
    console.log('   Custom token received, will use for authentication');
    authToken = loginResult.token;

    // Note: In a real client application, you would exchange this custom token
    // for an ID token using Firebase client SDK's signInWithCustomToken() method.
    // For testing purposes, we'll use the custom token directly since we've updated
    // the backend to handle both token types.
  });

  // Skip document tests if login failed
  if (!loginSuccess) {
    skipTest('Create Test Document', 'Login failed');
    skipTest('Document Upload', 'Login failed');
    skipTest('Document Status', 'Login failed');
  } else {
    // Create test document
    const documentCreated = await runTest('Create Test Document', async () => {
      documentInfo = createTestDocument();
    });

    // Skip document upload if document creation failed
    if (!documentCreated) {
      skipTest('Document Upload', 'Failed to create test document');
      skipTest('Document Status', 'Failed to create test document');
    } else {
      // Test document upload
      const uploadSuccess = await runTest('Document Upload', async () => {
        const uploadResult = await testDocumentUpload(authToken, documentInfo);
        documentId = uploadResult.documentId;
      });

      // Skip document status if upload failed
      if (!uploadSuccess) {
        skipTest('Document Status', 'Document upload failed');
      } else {
        // Test document status
        await runTest('Document Status', async () => {
          await testDocumentStatus(authToken, documentId);
        });
      }
    }
  }

  // Print test summary
  console.log('\n=======================================================');
  console.log('Test Summary:');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  console.log('=======================================================');

  // Return non-zero exit code if any tests failed
  if (testResults.failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});
