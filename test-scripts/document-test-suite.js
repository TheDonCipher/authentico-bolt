/**
 * Document Management Test Suite for Authentico
 *
 * This script tests all aspects of document management:
 * - Document upload and encryption
 * - IPFS storage via Pinata
 * - Blockchain anchoring
 * - Document status transitions
 * - Document verification by organizations
 *
 * Usage: node test-scripts/document-test-suite.js [environment]
 * Example: node test-scripts/document-test-suite.js development
 */

const axios = require('axios');
const { ethers } = require('ethers');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const crypto = require('crypto');

// Load environment variables based on command line argument
const environment = process.argv[2] || 'development';
const envFile = `.env.${environment}`;
console.log(`Loading environment from ${envFile}`);
dotenv.config({ path: envFile });

// Configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  testWalletPrivateKey: process.env.TEST_WALLET_PRIVATE_KEY,
  testFilePath: path.join(__dirname, 'test-document.pdf'),
  testFileSize: 1024 * 1024, // 1MB
  verifyingOrgId: process.env.TEST_VERIFYING_ORG_ID,
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

// Helper function to run a test and track results
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
      console.error(
        `   Response: ${JSON.stringify(error.response.data, null, 2)}`
      );
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

// Test user login
async function testUserLogin() {
  const loginData = {
    walletAddress: wallet.address,
  };

  console.log(`   Logging in with wallet: ${wallet.address}`);

  try {
    // Use backend API route directly
    const response = await axios.post(`${config.apiUrl}/auth/login`, loginData);

    if (response.data.token) {
      console.log(
        `   Login successful, custom token received from backend API`
      );

      // Exchange the custom token for an ID token
      console.log(`   Exchanging custom token for ID token...`);
      try {
        const exchangeResponse = await axios.post(
          `${config.apiUrl}/tokens/exchange`,
          { customToken: response.data.token }
        );

        if (exchangeResponse.data.idToken) {
          console.log(`   Token exchange successful, ID token received`);
          return {
            ...response.data,
            token: exchangeResponse.data.idToken,
          };
        } else {
          throw new Error(
            'Token exchange response did not contain an ID token'
          );
        }
      } catch (exchangeError) {
        console.error(`   Token exchange failed: ${exchangeError.message}`);
        throw new Error(
          'Token exchange failed: ' +
            (exchangeError.response?.data?.message || exchangeError.message)
        );
      }
    } else {
      throw new Error('Login response did not contain a token');
    }
  } catch (error) {
    console.error('   Login failed:', error.message);
    throw new Error(
      'Login failed: ' + (error.response?.data?.message || error.message)
    );
  }
}

// Test getting verified organizations
async function testGetVerifiedOrganizations(authToken) {
  console.log('   Getting list of verified organizations');

  const response = await axios.get(`${config.apiUrl}/organizations/verified`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!Array.isArray(response.data)) {
    throw new Error('Failed to get verified organizations');
  }

  console.log(`   Found ${response.data.length} verified organizations`);

  // If no verifying org ID is provided in config, use the first one from the list
  if (!config.verifyingOrgId && response.data.length > 0) {
    config.verifyingOrgId = response.data[0].id;
    console.log(`   Using organization ID: ${config.verifyingOrgId}`);
  }

  return response.data;
}

// Test document upload
async function testDocumentUpload(authToken) {
  console.log('   Testing document upload');

  // Create test document
  const testDoc = createTestDocument();

  // Check if we have a verifying organization
  if (!config.verifyingOrgId) {
    console.log('   No verifying organization ID provided, using test-org-id');
    config.verifyingOrgId = 'test-org-id';
  }

  // Create a small test document file (less than 5KB)
  const smallTestFilePath = path.join(__dirname, 'tiny-test-document.pdf');
  const header = '%PDF-1.5\n';
  const smallContent = crypto.randomBytes(2000).toString('hex');
  const footer = '\n%%EOF';
  const smallFileContent = header + smallContent + footer;
  fs.writeFileSync(smallTestFilePath, smallFileContent);
  console.log(
    `   Created small test document at ${smallTestFilePath} (${smallFileContent.length} bytes)`
  );

  console.log('   Uploading document using FormData...');

  // Create form data
  const formData = new FormData();
  formData.append('document_file', fs.createReadStream(smallTestFilePath));
  formData.append('documentName', `Test Document ${Date.now()}`);
  formData.append('documentType', 'Identity');
  formData.append('verifyingOrgId', config.verifyingOrgId);

  // Upload using axios with FormData
  const response = await axios.post(
    `${config.apiUrl}/documents/upload`,
    formData,
    {
      headers: {
        // Let axios set the Content-Type header with boundary
        Authorization: `Bearer ${authToken}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  if (!response.data.documentId) {
    throw new Error('Document upload failed: No document ID returned');
  }

  console.log(
    `   Document uploaded successfully with ID: ${response.data.documentId}`
  );
  console.log(`   Document status: ${response.data.status}`);

  return {
    documentId: response.data.documentId,
    status: response.data.status,
    originalHash: testDoc.hash,
  };
}

// Test getting document details
async function testGetDocumentDetails(authToken, documentId) {
  console.log(`   Getting details for document: ${documentId}`);

  const response = await axios.get(`${config.apiUrl}/documents/${documentId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.data.documentId) {
    throw new Error('Failed to get document details');
  }

  console.log(`   Document details retrieved successfully`);
  console.log(`   Current status: ${response.data.status}`);

  return response.data;
}

// Test getting document list
async function testGetDocumentList(authToken) {
  console.log('   Getting list of user documents');

  const response = await axios.get(`${config.apiUrl}/documents`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!Array.isArray(response.data)) {
    throw new Error('Failed to get document list');
  }

  console.log(`   Found ${response.data.length} documents`);
  return response.data;
}

// Test document download
async function testDocumentDownload(authToken, documentId) {
  console.log(`   Testing download for document: ${documentId}`);

  const response = await axios.get(
    `${config.apiUrl}/documents/${documentId}/download`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      responseType: 'arraybuffer',
    }
  );

  if (!response.data) {
    throw new Error('Document download failed');
  }

  const downloadPath = path.join(__dirname, `downloaded-${documentId}.pdf`);
  fs.writeFileSync(downloadPath, response.data);

  console.log(`   Document downloaded successfully to: ${downloadPath}`);

  // Calculate hash of downloaded file
  const downloadedHash = crypto
    .createHash('sha256')
    .update(response.data)
    .digest('hex');

  console.log(`   Downloaded document hash: ${downloadedHash}`);

  return {
    path: downloadPath,
    hash: downloadedHash,
  };
}

// Test document verification (for organization users)
async function testDocumentVerification(
  authToken,
  documentId,
  status = 'Verified'
) {
  console.log(`   Testing document verification: ${documentId} -> ${status}`);

  const verificationData = {
    status,
    rejectionReason: status === 'Rejected' ? 'Test rejection reason' : null,
  };

  const response = await axios.post(
    `${config.apiUrl}/documents/${documentId}/verify`,
    verificationData,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (response.data.success === false) {
    throw new Error(
      'Document verification failed: ' +
        (response.data.message || 'Unknown error')
    );
  }

  console.log(`   Document verification successful: ${status}`);
  return response.data;
}

// Test document status polling
async function testDocumentStatusPolling(
  authToken,
  documentId,
  targetStatus,
  maxAttempts = 10
) {
  console.log(`   Polling for document status: ${targetStatus}`);

  let attempts = 0;
  let currentStatus = '';

  while (attempts < maxAttempts) {
    attempts++;

    // Wait 2 seconds between attempts
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Get document details
      const docDetails = await testGetDocumentDetails(authToken, documentId);
      currentStatus = docDetails.status;

      console.log(`   Attempt ${attempts}: Current status = ${currentStatus}`);

      if (currentStatus === targetStatus) {
        console.log(`   Status reached: ${targetStatus}`);
        return docDetails;
      }

      // If we reach a terminal state that's not our target, break
      if (
        currentStatus === 'Verified' ||
        currentStatus === 'Rejected' ||
        currentStatus === 'Failed' ||
        currentStatus === 'Blockchain Failed' ||
        currentStatus === 'Verification Failed'
      ) {
        throw new Error(
          `Document reached terminal state ${currentStatus} instead of ${targetStatus}`
        );
      }
    } catch (error) {
      console.log(`   Error getting document status: ${error.message}`);
      // Continue to next attempt
    }
  }

  throw new Error(
    `Timed out waiting for status ${targetStatus}. Last status: ${currentStatus}`
  );
}

// Main test function
async function runTests() {
  console.log('Starting Document Management Tests');
  console.log('==================================');
  console.log(`Environment: ${environment}`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log('==================================');

  let authToken;
  let documentId;
  let originalHash;
  let isOrgUser = false;

  // Test user login
  const loginSuccess = await runTest('User Login', async () => {
    const loginResult = await testUserLogin();
    authToken = loginResult.token;

    // Check if this is an organization user
    if (loginResult.userType === 'organization') {
      isOrgUser = true;
      console.log('   Logged in as organization user');
    }
  });

  // Skip remaining tests if login failed
  if (!loginSuccess) {
    skipTest('Get Verified Organizations', 'Login failed');
    skipTest('Document Upload', 'Login failed');
    skipTest('Get Document List', 'Login failed');
    skipTest('Get Document Details', 'Login failed');
    skipTest('Document Status Polling', 'Login failed');
    skipTest('Document Download', 'Login failed');
    skipTest('Document Verification', 'Login failed');
  } else {
    // Test getting verified organizations
    await runTest('Get Verified Organizations', async () => {
      await testGetVerifiedOrganizations(authToken);
    });

    // Test document upload (only for individual users)
    if (!isOrgUser) {
      const uploadSuccess = await runTest('Document Upload', async () => {
        const uploadResult = await testDocumentUpload(authToken);
        documentId = uploadResult.documentId;
        originalHash = uploadResult.originalHash;
      });

      if (!uploadSuccess) {
        skipTest('Get Document List', 'Document upload failed');
        skipTest('Get Document Details', 'Document upload failed');
        skipTest('Document Status Polling', 'Document upload failed');
        skipTest('Document Download', 'Document upload failed');
      } else {
        // Test getting document list
        await runTest('Get Document List', async () => {
          await testGetDocumentList(authToken);
        });

        // Test getting document details
        await runTest('Get Document Details', async () => {
          await testGetDocumentDetails(authToken, documentId);
        });

        // Test document status polling
        await runTest('Document Status Polling', async () => {
          await testDocumentStatusPolling(
            authToken,
            documentId,
            'Pending Verification',
            15 // Increase max attempts for blockchain confirmation
          );
        });

        // Test document download
        await runTest('Document Download', async () => {
          const downloadResult = await testDocumentDownload(
            authToken,
            documentId
          );

          // Verify hash matches original
          if (downloadResult.hash !== originalHash) {
            throw new Error('Downloaded document hash does not match original');
          }
          console.log('   Hash verification successful');
        });
      }
    } else {
      skipTest('Document Upload', 'Organization users cannot upload documents');
      skipTest('Get Document List', 'Skipping for organization user');
      skipTest('Get Document Details', 'Skipping for organization user');
      skipTest('Document Status Polling', 'Skipping for organization user');
      skipTest('Document Download', 'Skipping for organization user');

      // For organization users, test document verification
      // First, we need to get a document that needs verification
      let pendingDocuments = [];

      await runTest('Get Pending Verification Documents', async () => {
        // Get documents pending verification for this organization
        const response = await axios.get(
          `${config.apiUrl}/documents/pending-verification`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!Array.isArray(response.data)) {
          throw new Error('Failed to get pending verification documents');
        }

        pendingDocuments = response.data;
        console.log(
          `   Found ${pendingDocuments.length} documents pending verification`
        );

        if (pendingDocuments.length === 0) {
          throw new Error('No documents pending verification found');
        }

        // Use the first pending document
        documentId = pendingDocuments[0].documentId;
      });

      if (pendingDocuments.length > 0) {
        // Test document verification
        await runTest('Document Verification', async () => {
          await testDocumentVerification(authToken, documentId, 'Verified');
        });

        // Test document status after verification
        await runTest('Verify Document Status After Verification', async () => {
          await testDocumentStatusPolling(authToken, documentId, 'Verified');
        });
      } else {
        skipTest('Document Verification', 'No pending documents found');
        skipTest(
          'Verify Document Status After Verification',
          'No pending documents found'
        );
      }
    }
  }

  // Clean up test files
  try {
    if (fs.existsSync(config.testFilePath)) {
      fs.unlinkSync(config.testFilePath);
      console.log(`\nRemoved test file: ${config.testFilePath}`);
    }

    const downloadedFiles = fs
      .readdirSync(__dirname)
      .filter((file) => file.startsWith('downloaded-'));
    downloadedFiles.forEach((file) => {
      fs.unlinkSync(path.join(__dirname, file));
      console.log(`Removed downloaded file: ${file}`);
    });
  } catch (error) {
    console.error('Error cleaning up test files:', error);
  }

  // Print test results
  console.log('\n==================================');
  console.log('Document Management Test Results');
  console.log('==================================');
  console.log(`Total tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  console.log('==================================');

  // Return non-zero exit code if any tests failed
  if (testResults.failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
