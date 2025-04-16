/**
 * Document Upload Test Script
 *
 * This script tests the document upload functionality of the Authentico application,
 * including encryption, IPFS storage, and blockchain anchoring.
 *
 * Usage: node test-scripts/document-upload-test.js [environment]
 * Example: node test-scripts/document-upload-test.js development
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const dotenv = require('dotenv');
const { ethers } = require('ethers');
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
  testFileSize: 1024 * 10, // 10KB
  authToken: process.env.TEST_AUTH_TOKEN,
  verifyingOrgId: process.env.TEST_VERIFYING_ORG_ID || 'test-org-id',
};

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

// Create a test document file
function createTestDocument() {
  console.log('Creating test document...');

  // Create a random PDF-like content
  const header = '%PDF-1.5\n';
  const randomContent = crypto.randomBytes(config.testFileSize).toString('hex');
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

  // Read the file content
  const fileContent = fs.readFileSync(documentInfo.path);

  // Create a form data object
  const formData = new FormData();
  formData.append('document_file', fileContent, {
    filename: 'test-document.pdf',
    contentType: 'application/pdf',
  });
  formData.append('documentName', 'Test Document');
  formData.append('documentType', 'identity');
  formData.append('verifyingOrgId', config.verifyingOrgId);

  try {
    console.log('   Uploading document...');
    console.log('   Using API URL:', config.apiUrl);
    console.log('   Document size:', documentInfo.size, 'bytes');
    console.log(
      '   Document hash:',
      documentInfo.hash.substring(0, 10) + '...'
    );

    // Use the frontend API route instead of the backend route directly
    const frontendApiUrl = config.apiUrl.replace('/api', '');
    const response = await axios.post(
      `${frontendApiUrl}/api/documents/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

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
    // Use the frontend API route instead of the backend route directly
    const frontendApiUrl = config.apiUrl.replace('/api', '');
    const response = await axios.get(
      `${frontendApiUrl}/api/documents/${documentId}`,
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

// Test document blockchain status
async function testBlockchainStatus(documentData) {
  if (!documentData || !documentData.transactionHash) {
    throw new Error('Document data with transaction hash is required');
  }

  // Create a provider using the RPC URL
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL
  );

  console.log('   Checking blockchain transaction...');
  const transaction = await provider.getTransaction(
    documentData.transactionHash
  );

  if (!transaction) {
    throw new Error('Transaction not found on blockchain');
  }

  console.log(`   Transaction found: ${transaction.hash}`);
  console.log(`   Block number: ${transaction.blockNumber}`);

  // Check if transaction is confirmed
  if (transaction.confirmations > 0) {
    console.log(
      `   Transaction confirmed with ${transaction.confirmations} confirmations`
    );
  } else {
    console.log('   Transaction is pending confirmation');
  }

  return transaction;
}

// Wait for document status to change
async function waitForDocumentStatus(
  authToken,
  documentId,
  targetStatus,
  maxWaitTimeMs = 60000
) {
  console.log(
    `   Waiting for document status to change to "${targetStatus}"...`
  );

  const startTime = Date.now();
  let currentStatus = '';

  while (Date.now() - startTime < maxWaitTimeMs) {
    try {
      const documentData = await testDocumentStatus(authToken, documentId);
      currentStatus = documentData.status;

      if (currentStatus === targetStatus) {
        console.log(
          `   Document status changed to "${targetStatus}" after ${Math.round(
            (Date.now() - startTime) / 1000
          )} seconds`
        );
        return documentData;
      }

      // Wait 5 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`   Error checking document status: ${error.message}`);
      // Continue waiting
    }
  }

  throw new Error(
    `Timeout waiting for document status to change to "${targetStatus}". Current status: "${currentStatus}"`
  );
}

// Login and get auth token
async function getAuthToken() {
  console.log('   Authenticating with wallet...');

  // Create a test wallet if not provided
  const wallet = config.testWalletPrivateKey
    ? new ethers.Wallet(config.testWalletPrivateKey)
    : ethers.Wallet.createRandom();

  console.log(`   Using wallet address: ${wallet.address}`);

  try {
    // Register the user if needed
    const frontendApiUrl = config.apiUrl.replace('/api', '');
    try {
      await axios.post(`${frontendApiUrl}/api/auth/register`, {
        walletAddress: wallet.address,
        userType: 'individual',
        userData: {
          name: 'Test User',
        },
      });
      console.log('   User registered successfully');
    } catch (error) {
      // If registration fails because user already exists, that's okay
      if (error.response && error.response.status === 409) {
        console.log('   User already exists, proceeding with login');
      } else {
        throw error;
      }
    }

    // Login with wallet
    const loginResponse = await axios.post(`${frontendApiUrl}/api/auth/login`, {
      walletAddress: wallet.address,
    });

    if (!loginResponse.data.token) {
      throw new Error('Login failed: No token received');
    }

    console.log('   Login successful, custom token received');

    // Exchange custom token for ID token
    const exchangeResponse = await axios.post(
      `${config.apiUrl}/tokens/exchange`,
      { customToken: loginResponse.data.token }
    );

    if (!exchangeResponse.data.idToken) {
      throw new Error('Failed to exchange custom token for ID token');
    }

    console.log('   ID token received successfully');
    return exchangeResponse.data.idToken;
  } catch (error) {
    console.error('   Authentication error:', error.message);
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
  console.log('Starting Document Upload Tests');
  console.log('=============================');

  // Get auth token
  let authToken;
  try {
    // Always get a fresh token
    authToken = await getAuthToken();
    console.log('Authentication successful');
  } catch (error) {
    console.error('❌ Failed to authenticate:', error.message);
    process.exit(1);
  }

  let documentInfo;
  let uploadResult;

  // Create test document
  await runTest('Create Test Document', async () => {
    documentInfo = createTestDocument();
  });

  // Test document upload
  if (documentInfo) {
    const uploadSuccess = await runTest('Document Upload', async () => {
      uploadResult = await testDocumentUpload(authToken, documentInfo);
    });

    // Skip status tests if upload failed
    if (!uploadSuccess) {
      skipTest('Document Status', 'Upload failed');
      skipTest('Blockchain Status', 'Upload failed');
    }
  } else {
    skipTest('Document Upload', 'Failed to create test document');
    skipTest('Document Status', 'Failed to create test document');
    skipTest('Blockchain Status', 'Failed to create test document');
  }

  // Test document status
  let documentData;
  if (uploadResult && uploadResult.documentId) {
    const statusSuccess = await runTest('Document Status', async () => {
      documentData = await testDocumentStatus(
        authToken,
        uploadResult.documentId
      );
    });

    // Wait for blockchain submission
    if (statusSuccess) {
      try {
        console.log('   Waiting for blockchain submission...');
        documentData = await waitForDocumentStatus(
          authToken,
          uploadResult.documentId,
          'Pending Verification',
          120000 // 2 minutes
        );

        // Test blockchain status
        if (documentData && documentData.transactionHash) {
          await runTest('Blockchain Status', async () => {
            await testBlockchainStatus(documentData);
          });
        } else {
          skipTest('Blockchain Status', 'No transaction hash available');
        }
      } catch (error) {
        console.error(
          `   Error waiting for blockchain submission: ${error.message}`
        );
        skipTest(
          'Blockchain Status',
          'Timeout waiting for blockchain submission'
        );
      }
    } else {
      skipTest('Blockchain Status', 'Failed to get document status');
    }
  }

  // Print test summary
  console.log('\n=============================');
  console.log('Test Summary:');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  console.log('=============================');

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
