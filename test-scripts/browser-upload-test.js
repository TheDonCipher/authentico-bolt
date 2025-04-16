/**
 * Browser-like Document Upload Test Script
 *
 * This script uses jsdom to simulate a browser environment for form data handling
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { ethers } = require('ethers');
const { JSDOM } = require('jsdom');

// Create a virtual DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.FormData = dom.window.FormData;
global.Blob = dom.window.Blob;
global.File = dom.window.File;

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

    console.log('Login successful, token received');
    return loginResponse.data.token;
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

// Test document upload using fetch API
async function testDocumentUpload(documentInfo, authToken) {
  console.log('Testing document upload...');
  console.log(`Using API URL: ${config.apiUrl}`);
  console.log(`Document size: ${documentInfo.size} bytes`);
  console.log(`Auth token: ${authToken.substring(0, 10)}...`);

  try {
    // Create a FormData object
    const formData = new FormData();

    // Read the file content
    const fileContent = fs.readFileSync(documentInfo.path);

    // Create a Blob from the file content
    const blob = new Blob([fileContent], { type: 'application/pdf' });

    // Create a File object from the Blob
    const file = new File([blob], 'tiny-test-document.pdf', {
      type: 'application/pdf',
    });

    // Append the file to the FormData
    formData.append('document_file', file);
    formData.append('documentName', 'Tiny Test Document');
    formData.append('documentType', 'identity'); // Using the standardized document type ID
    formData.append('verifyingOrgId', config.verifyingOrgId);

    console.log('Sending request to backend API...');

    // Use the fetch API to send the request
    const response = await fetch(`${config.apiUrl}/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Upload successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.error('Upload failed!');
      console.error('Response status:', response.status);
      console.error('Response data:', JSON.stringify(data, null, 2));
      throw new Error(`Upload failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Upload failed!');
    console.error('Error message:', error.message);
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
