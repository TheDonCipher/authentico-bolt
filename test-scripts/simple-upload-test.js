/**
 * Simple Document Upload Test Script
 *
 * This script tests only the document upload functionality with a very small file
 * to isolate any issues with the upload process.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FormData = require('form-data');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

// Load environment variables
dotenv.config({ path: '.env.development' });

// Configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  testFilePath: path.join(__dirname, 'tiny-test-document.pdf'),
  verifyingOrgId: process.env.TEST_VERIFYING_ORG_ID || 'test-org-id',
  testWalletPrivateKey: process.env.TEST_WALLET_PRIVATE_KEY,
};

// Create a test wallet if not provided
const wallet = config.testWalletPrivateKey
  ? new ethers.Wallet(config.testWalletPrivateKey)
  : ethers.Wallet.createRandom();

console.log(`Using wallet address: ${wallet.address}`);

// Function to get a fresh auth token
async function getAuthToken() {
  try {
    console.log('Getting a fresh auth token...');

    // First try to register the user (in case it doesn't exist)
    try {
      const registerResponse = await axios.post(
        `${config.apiUrl.replace('/api', '')}/api/auth/register`,
        {
          walletAddress: wallet.address,
          userType: 'individual',
          userData: {
            name: 'Test User',
          },
        }
      );
      console.log('Registration response:', registerResponse.data);
    } catch (regError) {
      // Ignore registration errors - user might already exist
      console.log('Registration skipped, user might already exist');
    }

    // Now login to get a token
    const loginResponse = await axios.post(
      `${config.apiUrl.replace('/api', '')}/api/auth/login`,
      {
        walletAddress: wallet.address,
      }
    );

    if (!loginResponse.data.token) {
      throw new Error('Login failed: No token returned');
    }

    console.log('Login successful, custom token received');

    // Exchange custom token for ID token
    const exchangeResponse = await axios.post(
      `${config.apiUrl}/tokens/exchange`,
      { customToken: loginResponse.data.token }
    );

    if (!exchangeResponse.data.idToken) {
      throw new Error('Failed to exchange custom token for ID token');
    }

    console.log('ID token received successfully');
    return exchangeResponse.data.idToken;
  } catch (error) {
    console.error('Error getting auth token:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error(
        'Response data:',
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}

// Create a very small test document (1KB)
function createTinyTestDocument() {
  console.log('Creating tiny test document...');

  // Create a very small PDF-like content
  const header = '%PDF-1.5\n';
  const randomContent = crypto.randomBytes(1024).toString('hex'); // Just 1KB
  const footer = '\n%%EOF';

  const content = header + randomContent + footer;

  fs.writeFileSync(config.testFilePath, content);
  console.log(
    `Created test document at ${config.testFilePath} (${content.length} bytes)`
  );

  return {
    path: config.testFilePath,
    size: content.length,
    hash: crypto.createHash('sha256').update(content).digest('hex'),
  };
}

// Test document upload
async function testDocumentUpload(documentInfo, authToken) {
  console.log('Testing document upload...');
  console.log(`Using API URL: ${config.apiUrl}`);
  console.log(`Document size: ${documentInfo.size} bytes`);
  console.log(`Auth token: ${authToken.substring(0, 10)}...`);

  // Create a buffer from the file instead of a stream
  const fileBuffer = fs.readFileSync(documentInfo.path);

  // Create a form data object using a different approach
  const FormData = require('form-data');
  const formData = new FormData();

  // Add the file with proper content type
  formData.append('document_file', fileBuffer, {
    filename: 'tiny-test-document.pdf',
    contentType: 'application/pdf',
  });

  // Add other fields
  formData.append('documentName', 'Tiny Test Document');
  formData.append('documentType', 'identity'); // Using the standardized document type ID
  formData.append('verifyingOrgId', config.verifyingOrgId);

  try {
    console.log('Sending request to backend API directly...');

    // Add authorization header to form data headers
    const headers = formData.getHeaders();
    headers.Authorization = `Bearer ${authToken}`;

    const response = await axios.post(
      `${config.apiUrl}/documents/upload`,
      formData,
      {
        headers,
        timeout: 30000, // 30 seconds
        maxBodyLength: 2 * 1024 * 1024, // 2MB
        maxContentLength: 2 * 1024 * 1024, // 2MB
      }
    );

    console.log('Upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Upload failed!');
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error(
        'Response data:',
        JSON.stringify(error.response.data, null, 2)
      );
    }

    throw error;
  }
}

// Main function
async function main() {
  try {
    // Get a fresh auth token
    const authToken = await getAuthToken();

    // Create test document
    const documentInfo = createTinyTestDocument();

    // Test document upload
    const result = await testDocumentUpload(documentInfo, authToken);

    console.log('\nTest completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nTest failed!');
    process.exit(1);
  }
}

// Run the test
main();
