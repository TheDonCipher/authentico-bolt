/**
 * Thirdweb Document Upload Test Script
 *
 * This script tests document upload using Thirdweb for authentication
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ThirdwebSDK } = require('@thirdweb-dev/sdk');
const { Sepolia } = require('@thirdweb-dev/chains');
const FormData = require('form-data');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.development' });

// Configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  testFilePath: path.join(__dirname, 'tiny-test-document.pdf'),
  verifyingOrgId: process.env.TEST_VERIFYING_ORG_ID || 'test-org-id',
  privateKey: process.env.TEST_WALLET_PRIVATE_KEY,
  clientId: process.env.THIRDWEB_CLIENT_ID,
  secretKey: process.env.THIRDWEB_SECRET_KEY,
};

// Create a very small test document (1KB)
function createTinyTestDocument() {
  console.log('Creating tiny test document...');

  // Create a very small PDF-like content
  const header = '%PDF-1.5\\n';
  const randomContent = crypto.randomBytes(1024).toString('hex'); // Just 1KB
  const footer = '\\n%%EOF';

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

// Initialize Thirdweb SDK
async function initializeThirdweb() {
  try {
    console.log('Initializing Thirdweb SDK...');

    // Create SDK with private key
    const sdk = ThirdwebSDK.fromPrivateKey(config.privateKey, Sepolia, {
      clientId: config.clientId,
      secretKey: config.secretKey,
    });

    // Get the wallet
    const wallet = sdk.wallet;
    const address = await wallet.getAddress();
    console.log(`Connected wallet address: ${address}`);

    return { sdk, wallet, address };
  } catch (error) {
    console.error('Error initializing Thirdweb:', error);
    throw error;
  }
}

// Register user with wallet address
async function registerUser(walletAddress) {
  try {
    console.log(`Registering user with wallet address: ${walletAddress}`);

    const response = await axios.post(
      `${config.apiUrl.replace('/api', '')}/api/auth/register`,
      {
        walletAddress,
        userType: 'individual',
        userData: {
          name: 'Test User',
        },
      }
    );

    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    // Ignore if user already exists
    console.log('Registration skipped, user might already exist');
    return null;
  }
}

// Login with wallet address
async function loginWithWallet(walletAddress) {
  try {
    console.log(`Logging in with wallet address: ${walletAddress}`);

    const response = await axios.post(
      `${config.apiUrl.replace('/api', '')}/api/auth/login`,
      {
        walletAddress,
      }
    );

    if (!response.data.token) {
      throw new Error('Login failed: No token returned');
    }

    console.log('Login successful, token received');
    return response.data.token;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

// Get document types
async function getDocumentTypes() {
  try {
    console.log('Fetching document types...');

    const response = await axios.get(`${config.apiUrl}/documents/types`);
    console.log('Document types:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching document types:', error);

    // Return fallback document types
    return [
      { id: 'identity', name: 'Identity Document' },
      { id: 'education', name: 'Educational Certificate' },
      { id: 'employment', name: 'Employment Document' },
      { id: 'financial', name: 'Financial Document' },
      { id: 'other', name: 'Other Document' },
    ];
  }
}

// Upload document
async function uploadDocument(
  documentInfo,
  authToken,
  walletAddress,
  documentType = 'identity'
) {
  try {
    console.log('Uploading document...');
    console.log(`Using API URL: ${config.apiUrl}`);
    console.log(`Document size: ${documentInfo.size} bytes`);
    console.log(`Auth token: ${authToken.substring(0, 10)}...`);
    console.log(`Document type: ${documentType}`);

    // Create form data
    const formData = new FormData();

    // Add file to form data
    const fileBuffer = fs.readFileSync(documentInfo.path);
    formData.append('document_file', fileBuffer, {
      filename: 'tiny-test-document.pdf',
      contentType: 'application/pdf',
    });

    // Add metadata to form data
    formData.append('documentName', 'Thirdweb Test Document');
    formData.append('documentType', documentType); // Using the document type ID
    formData.append('verifyingOrgId', config.verifyingOrgId);
    formData.append('walletAddress', walletAddress);

    // Upload document
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

    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Initialize Thirdweb
    const { address } = await initializeThirdweb();

    // Register user (if needed)
    await registerUser(address);

    // Login with wallet
    const authToken = await loginWithWallet(address);

    // Get document types
    const documentTypes = await getDocumentTypes();

    // Select a random document type
    const randomType =
      documentTypes[Math.floor(Math.random() * documentTypes.length)];
    console.log(
      `Selected document type: ${randomType.name} (${randomType.id})`
    );

    // Create test document
    const documentInfo = createTinyTestDocument();

    // Upload document
    await uploadDocument(documentInfo, authToken, address, randomType.id);

    console.log('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
main();
