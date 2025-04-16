/**
 * End-to-End Test Suite for Authentico
 *
 * This script tests a complete end-to-end flow:
 * 1. Individual user registration and login
 * 2. Organization application submission
 * 3. Admin approval of organization
 * 4. Organization login
 * 5. Individual user document upload
 * 6. Organization verification of document
 * 7. Individual user checking document status
 *
 * Usage: node test-scripts/e2e-test-suite.js [environment]
 * Example: node test-scripts/e2e-test-suite.js development
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
  adminWalletPrivateKey: process.env.ADMIN_WALLET_PRIVATE_KEY,
  adminWalletAddress: '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c',
  testFileSize: 1024 * 1024, // 1MB
};

// Create test wallets
const individualWallet = ethers.Wallet.createRandom();
const organizationWallet = ethers.Wallet.createRandom();

console.log(`Using individual wallet address: ${individualWallet.address}`);
console.log(`Using organization wallet address: ${organizationWallet.address}`);

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

  const testFilePath = path.join(__dirname, 'test-document.pdf');

  // Create a random PDF-like content
  const header = '%PDF-1.5\n';
  const randomContent = crypto.randomBytes(config.testFileSize).toString('hex');
  const footer = '\n%%EOF';

  const content = header + randomContent + footer;

  fs.writeFileSync(testFilePath, content);
  console.log(
    `   Created test document at ${testFilePath} (${content.length} bytes)`
  );

  return {
    path: testFilePath,
    size: content.length,
    hash: crypto.createHash('sha256').update(content).digest('hex'),
  };
}

// Test individual user registration
async function testIndividualRegistration() {
  const userData = {
    name: `Test Individual ${Date.now()}`,
    email: `test-individual-${Date.now()}@example.com`,
    walletAddress: individualWallet.address,
    userType: 'individual',
  };

  console.log(
    `   Registering individual user with wallet: ${individualWallet.address}`
  );

  // Use the frontend API route
  const frontendApiUrl = config.frontendUrl;
  const response = await axios.post(
    `${frontendApiUrl}/api/user/signup/individual`,
    userData
  );

  if (!response.data.success) {
    throw new Error(
      'Registration failed: ' + (response.data.message || 'Unknown error')
    );
  }

  console.log(
    `   Individual user registered successfully: ${response.data.uid}`
  );
  return response.data;
}

// Test organization user registration
async function testOrganizationRegistration() {
  const orgData = {
    name: `Test Organization ${Date.now()}`,
    email: `test-org-${Date.now()}@example.com`,
    walletAddress: organizationWallet.address,
    userType: 'organization',
  };

  console.log(
    `   Registering organization user with wallet: ${organizationWallet.address}`
  );

  // Use the frontend API route
  const frontendApiUrl = config.frontendUrl;
  const response = await axios.post(
    `${frontendApiUrl}/api/user/signup/organization`,
    orgData
  );

  if (!response.data.success) {
    throw new Error(
      'Registration failed: ' + (response.data.message || 'Unknown error')
    );
  }

  console.log(
    `   Organization user registered successfully: ${response.data.uid}`
  );
  return response.data;
}

// Test user login
async function testUserLogin(wallet) {
  const loginData = {
    walletAddress: wallet.address,
  };

  console.log(`   Logging in with wallet: ${wallet.address}`);

  // Use the frontend API route
  const frontendApiUrl = config.frontendUrl;
  const response = await axios.post(
    `${frontendApiUrl}/api/auth/login`,
    loginData
  );

  if (!response.data.token) {
    throw new Error(
      'Login failed: ' + (response.data.message || 'Unknown error')
    );
  }

  console.log(`   Login successful, custom token received`);

  // Exchange the custom token for an ID token
  console.log(`   Exchanging custom token for ID token...`);
  try {
    const exchangeResponse = await axios.post(
      `${frontendApiUrl}/api/auth/exchange-token`,
      { customToken: response.data.token }
    );

    if (exchangeResponse.data.idToken) {
      console.log(`   Token exchange successful, ID token received`);
      return {
        ...response.data,
        token: exchangeResponse.data.idToken,
      };
    }
  } catch (exchangeError) {
    console.log(`   Token exchange failed: ${exchangeError.message}`);
    // Continue with the custom token if exchange fails
  }

  return response.data;
}

// Test getting current user
async function testGetCurrentUser(authToken) {
  console.log('   Getting current user profile');

  const frontendApiUrl = config.frontendUrl;
  const response = await axios.get(`${frontendApiUrl}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.data.uid) {
    throw new Error('Failed to get current user');
  }

  console.log(`   Got user profile: ${response.data.uid}`);
  return response.data;
}

// Test organization application submission
async function testOrganizationApplication(authToken) {
  console.log('   Submitting organization application');

  const applicationData = {
    orgName: `Test Organization ${Date.now()}`,
    contactEmail: `test-org-${Date.now()}@example.com`,
    website: 'https://example.com',
    description: 'This is a test organization for automated testing',
    address: '123 Test Street, Test City, Test Country',
    phoneNumber: '+1234567890',
    industry: 'Technology',
    registrationNumber: `REG-${Date.now()}`,
    foundedYear: '2023',
    documentTypes: ['Identity', 'Education', 'Employment'],
  };

  const response = await axios.post(
    `${config.apiUrl}/organizations/apply`,
    applicationData,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.data.applicationId) {
    throw new Error('Organization application submission failed');
  }

  console.log(
    `   Application submitted successfully: ${response.data.applicationId}`
  );
  return {
    applicationId: response.data.applicationId,
    status: response.data.status,
    ...applicationData,
  };
}

// Test getting all organization applications (admin only)
async function testGetAllApplications(authToken) {
  console.log('   Getting all organization applications (admin only)');

  const response = await axios.get(
    `${config.apiUrl}/organizations/applications`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!Array.isArray(response.data)) {
    throw new Error('Failed to get organization applications');
  }

  console.log(`   Found ${response.data.length} applications`);
  return response.data;
}

// Test updating application status (admin only)
async function testUpdateApplicationStatus(
  authToken,
  applicationId,
  status = 'approved'
) {
  console.log(`   Updating application status: ${applicationId} -> ${status}`);

  const updateData = {
    status,
    notes:
      status === 'approved'
        ? 'Approved by automated test'
        : 'Rejected by automated test',
  };

  const response = await axios.put(
    `${config.apiUrl}/organizations/applications/${applicationId}`,
    updateData,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.data.success) {
    throw new Error('Failed to update application status');
  }

  console.log(`   Application status updated successfully to: ${status}`);
  return response.data;
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
  return response.data;
}

// Test document upload
async function testDocumentUpload(authToken, verifyingOrgId) {
  console.log('   Testing document upload');

  // Create test document
  const testDoc = createTestDocument();

  // Check if we have a verifying organization
  if (!verifyingOrgId) {
    throw new Error('No verifying organization ID available');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', fs.createReadStream(testDoc.path));
  formData.append('documentName', `Test Document ${Date.now()}`);
  formData.append('documentType', 'Identity');
  formData.append('verifyingOrgId', verifyingOrgId);

  console.log('   Uploading document...');

  const response = await axios.post(
    `${config.apiUrl}/documents/upload`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${authToken}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  if (!response.data.documentId) {
    throw new Error('Document upload failed');
  }

  console.log(`   Document uploaded successfully: ${response.data.documentId}`);
  console.log(`   Initial status: ${response.data.status}`);

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

// Test getting pending verification documents (for organization users)
async function testGetPendingVerificationDocuments(authToken) {
  console.log('   Getting documents pending verification');

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

  console.log(
    `   Found ${response.data.length} documents pending verification`
  );
  return response.data;
}

// Test document verification (for organization users)
async function testDocumentVerification(
  authToken,
  documentId,
  status = 'Verified'
) {
  console.log(`   Verifying document: ${documentId} -> ${status}`);

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

  if (!response.data.success) {
    throw new Error('Document verification failed');
  }

  console.log(`   Document ${status.toLowerCase()} successfully`);
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
        (targetStatus !== 'Verified' && currentStatus === 'Verified') ||
        (targetStatus !== 'Rejected' && currentStatus === 'Rejected') ||
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
  console.log('Starting End-to-End Tests');
  console.log('=========================');
  console.log(`Environment: ${environment}`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log('=========================');

  let individualAuthToken;
  let organizationAuthToken;
  let adminAuthToken;
  let organizationId;
  let applicationId;
  let documentId;

  // Step 1: Register individual user
  await runTest('Individual User Registration', async () => {
    await testIndividualRegistration();
  });

  // Step 2: Individual user login
  const individualLoginSuccess = await runTest(
    'Individual User Login',
    async () => {
      const loginResult = await testUserLogin(individualWallet);
      individualAuthToken = loginResult.token;
    }
  );

  if (!individualLoginSuccess) {
    skipTest('Organization Application Submission', 'Individual login failed');
    skipTest('Admin Login', 'Individual login failed');
    skipTest('Get All Applications (Admin)', 'Individual login failed');
    skipTest('Update Application Status (Admin)', 'Individual login failed');
    skipTest('Organization User Registration', 'Individual login failed');
    skipTest('Organization User Login', 'Individual login failed');
    skipTest('Document Upload', 'Individual login failed');
    skipTest(
      'Document Status Polling (Pending Verification)',
      'Individual login failed'
    );
    skipTest('Get Pending Verification Documents', 'Individual login failed');
    skipTest('Document Verification', 'Individual login failed');
    skipTest('Document Status Polling (Verified)', 'Individual login failed');
  } else {
    // Step 3: Submit organization application
    const applicationSuccess = await runTest(
      'Organization Application Submission',
      async () => {
        const applicationResult = await testOrganizationApplication(
          individualAuthToken
        );
        applicationId = applicationResult.applicationId;
      }
    );

    if (!applicationSuccess) {
      skipTest('Admin Login', 'Organization application failed');
      skipTest(
        'Get All Applications (Admin)',
        'Organization application failed'
      );
      skipTest(
        'Update Application Status (Admin)',
        'Organization application failed'
      );
      skipTest(
        'Organization User Registration',
        'Organization application failed'
      );
      skipTest('Organization User Login', 'Organization application failed');
      skipTest('Document Upload', 'Organization application failed');
      skipTest(
        'Document Status Polling (Pending Verification)',
        'Organization application failed'
      );
      skipTest(
        'Get Pending Verification Documents',
        'Organization application failed'
      );
      skipTest('Document Verification', 'Organization application failed');
      skipTest(
        'Document Status Polling (Verified)',
        'Organization application failed'
      );
    } else {
      // Step 4: Admin login (using admin wallet if available)
      const adminWallet = config.adminWalletPrivateKey
        ? new ethers.Wallet(config.adminWalletPrivateKey)
        : individualWallet; // Fallback to individual wallet for testing

      const adminLoginSuccess = await runTest('Admin Login', async () => {
        const loginResult = await testUserLogin(adminWallet);
        adminAuthToken = loginResult.token;
      });

      if (!adminLoginSuccess) {
        skipTest('Get All Applications (Admin)', 'Admin login failed');
        skipTest('Update Application Status (Admin)', 'Admin login failed');
        skipTest('Organization User Registration', 'Admin login failed');
        skipTest('Organization User Login', 'Admin login failed');
        skipTest('Document Upload', 'Admin login failed');
        skipTest(
          'Document Status Polling (Pending Verification)',
          'Admin login failed'
        );
        skipTest('Get Pending Verification Documents', 'Admin login failed');
        skipTest('Document Verification', 'Admin login failed');
        skipTest('Document Status Polling (Verified)', 'Admin login failed');
      } else {
        // Step 5: Admin gets all applications
        const getAppsSuccess = await runTest(
          'Get All Applications (Admin)',
          async () => {
            await testGetAllApplications(adminAuthToken);
          }
        );

        // Step 6: Admin approves organization application
        if (getAppsSuccess && applicationId) {
          const approvalSuccess = await runTest(
            'Update Application Status (Admin)',
            async () => {
              await testUpdateApplicationStatus(
                adminAuthToken,
                applicationId,
                'approved'
              );
            }
          );

          if (!approvalSuccess) {
            skipTest(
              'Organization User Registration',
              'Application approval failed'
            );
            skipTest('Organization User Login', 'Application approval failed');
            skipTest('Document Upload', 'Application approval failed');
            skipTest(
              'Document Status Polling (Pending Verification)',
              'Application approval failed'
            );
            skipTest(
              'Get Pending Verification Documents',
              'Application approval failed'
            );
            skipTest('Document Verification', 'Application approval failed');
            skipTest(
              'Document Status Polling (Verified)',
              'Application approval failed'
            );
          } else {
            // Step 7: Register organization user
            await runTest('Organization User Registration', async () => {
              await testOrganizationRegistration();
            });

            // Step 8: Organization user login
            const orgLoginSuccess = await runTest(
              'Organization User Login',
              async () => {
                const loginResult = await testUserLogin(organizationWallet);
                organizationAuthToken = loginResult.token;

                // Get organization user details
                const userData = await testGetCurrentUser(
                  organizationAuthToken
                );
                organizationId = userData.uid;
              }
            );

            if (!orgLoginSuccess) {
              skipTest('Document Upload', 'Organization login failed');
              skipTest(
                'Document Status Polling (Pending Verification)',
                'Organization login failed'
              );
              skipTest(
                'Get Pending Verification Documents',
                'Organization login failed'
              );
              skipTest('Document Verification', 'Organization login failed');
              skipTest(
                'Document Status Polling (Verified)',
                'Organization login failed'
              );
            } else {
              // Step 9: Individual user uploads document
              const uploadSuccess = await runTest(
                'Document Upload',
                async () => {
                  const uploadResult = await testDocumentUpload(
                    individualAuthToken,
                    organizationId
                  );
                  documentId = uploadResult.documentId;
                }
              );

              if (!uploadSuccess) {
                skipTest(
                  'Document Status Polling (Pending Verification)',
                  'Document upload failed'
                );
                skipTest(
                  'Get Pending Verification Documents',
                  'Document upload failed'
                );
                skipTest('Document Verification', 'Document upload failed');
                skipTest(
                  'Document Status Polling (Verified)',
                  'Document upload failed'
                );
              } else {
                // Step 10: Wait for document to reach Pending Verification status
                const pollingSuccess = await runTest(
                  'Document Status Polling (Pending Verification)',
                  async () => {
                    await testDocumentStatusPolling(
                      individualAuthToken,
                      documentId,
                      'Pending Verification',
                      15
                    );
                  }
                );

                if (!pollingSuccess) {
                  skipTest(
                    'Get Pending Verification Documents',
                    'Document status polling failed'
                  );
                  skipTest(
                    'Document Verification',
                    'Document status polling failed'
                  );
                  skipTest(
                    'Document Status Polling (Verified)',
                    'Document status polling failed'
                  );
                } else {
                  // Step 11: Organization gets pending verification documents
                  const getPendingSuccess = await runTest(
                    'Get Pending Verification Documents',
                    async () => {
                      const pendingDocs =
                        await testGetPendingVerificationDocuments(
                          organizationAuthToken
                        );

                      // Verify that our document is in the list
                      const ourDoc = pendingDocs.find(
                        (doc) => doc.documentId === documentId
                      );
                      if (!ourDoc) {
                        throw new Error(
                          'Uploaded document not found in pending verification list'
                        );
                      }
                    }
                  );

                  if (!getPendingSuccess) {
                    skipTest(
                      'Document Verification',
                      'Failed to get pending documents'
                    );
                    skipTest(
                      'Document Status Polling (Verified)',
                      'Failed to get pending documents'
                    );
                  } else {
                    // Step 12: Organization verifies document
                    const verificationSuccess = await runTest(
                      'Document Verification',
                      async () => {
                        await testDocumentVerification(
                          organizationAuthToken,
                          documentId,
                          'Verified'
                        );
                      }
                    );

                    if (!verificationSuccess) {
                      skipTest(
                        'Document Status Polling (Verified)',
                        'Document verification failed'
                      );
                    } else {
                      // Step 13: Individual user checks document status
                      await runTest(
                        'Document Status Polling (Verified)',
                        async () => {
                          await testDocumentStatusPolling(
                            individualAuthToken,
                            documentId,
                            'Verified'
                          );
                        }
                      );
                    }
                  }
                }
              }
            }
          }
        } else {
          skipTest(
            'Update Application Status (Admin)',
            'Failed to get applications or no application ID'
          );
          skipTest(
            'Organization User Registration',
            'Failed to get applications or no application ID'
          );
          skipTest(
            'Organization User Login',
            'Failed to get applications or no application ID'
          );
          skipTest(
            'Document Upload',
            'Failed to get applications or no application ID'
          );
          skipTest(
            'Document Status Polling (Pending Verification)',
            'Failed to get applications or no application ID'
          );
          skipTest(
            'Get Pending Verification Documents',
            'Failed to get applications or no application ID'
          );
          skipTest(
            'Document Verification',
            'Failed to get applications or no application ID'
          );
          skipTest(
            'Document Status Polling (Verified)',
            'Failed to get applications or no application ID'
          );
        }
      }
    }
  }

  // Clean up test files
  try {
    const testFilePath = path.join(__dirname, 'test-document.pdf');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log(`\nRemoved test file: ${testFilePath}`);
    }
  } catch (error) {
    console.error('Error cleaning up test files:', error);
  }

  // Print test results
  console.log('\n=========================');
  console.log('End-to-End Test Results');
  console.log('=========================');
  console.log(`Total tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  console.log('=========================');

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
