/**
 * Test script for document upload
 *
 * This script tests the document upload functionality with the new ID token authentication
 */
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken, signOut } = require('firebase/auth');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file in the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const apiUrl = 'http://localhost:3000/api';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log Firebase config (without sensitive values)
console.log('Firebase config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '***' : undefined,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Test wallet address
const walletAddress = '0x1234567890123456789012345678901234567890';

async function runTest() {
  try {
    console.log('Starting document upload test...');

    // Step 1: Register or login with wallet address
    console.log('Step 1: Checking if wallet is registered...');
    let customToken;

    try {
      // Try to login first
      const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
        walletAddress,
      });

      if (!loginResponse.data.token) {
        throw new Error('No token received from login');
      }

      console.log('Wallet already registered, received token from login');
      // The token from login is also an ID token in our implementation
      const idToken = loginResponse.data.token;

      // Skip the custom token exchange step
      console.log('Step 3: Upload a document...');

      // Create a small test file
      const testFilePath = './test-document.txt';
      fs.writeFileSync(
        testFilePath,
        'This is a test document for upload testing.'
      );

      // Create form data
      const formData = new FormData();
      formData.append('document_file', fs.createReadStream(testFilePath));
      formData.append('documentName', 'Test Document');
      formData.append('documentType', 'identity');
      formData.append('verifyingOrgId', 'org1');

      // Upload the document
      const uploadResponse = await axios.post(
        `${apiUrl}/documents/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      console.log('Document upload response:', uploadResponse.data);

      // Clean up
      fs.unlinkSync(testFilePath);

      console.log('Test completed successfully!');
      return; // Exit the function early
    } catch (error) {
      // If login fails with NEW_USER error, register the wallet
      if (
        error.response &&
        error.response.data &&
        error.response.data.error === 'NEW_USER'
      ) {
        console.log('Wallet not registered, registering now...');

        // Register the wallet
        const registerResponse = await axios.post(`${apiUrl}/auth/register`, {
          walletAddress,
          userType: 'individual',
          userData: {
            name: 'Test User',
          },
        });

        console.log('Registration response:', registerResponse.data);

        if (registerResponse.data.token) {
          console.log('Received token directly from registration');
          // The token from registration is already an ID token, not a custom token
          console.log('Using ID token directly from registration');
          const idToken = registerResponse.data.token;

          // Skip the custom token exchange step
          console.log('Step 3: Upload a document...');

          // Create a small test file
          const testFilePath = './test-document.txt';
          fs.writeFileSync(
            testFilePath,
            'This is a test document for upload testing.'
          );

          // Create form data
          const formData = new FormData();

          // Add file as a Buffer instead of a stream
          const fileBuffer = fs.readFileSync(testFilePath);
          formData.append('document_file', fileBuffer, {
            filename: 'test-document.txt',
            contentType: 'text/plain',
          });

          formData.append('documentName', 'Test Document');
          formData.append('documentType', 'identity');
          formData.append('verifyingOrgId', 'org1');

          // Log the form data for debugging
          console.log('Form data entries:');
          for (const [key, value] of Object.entries(formData)) {
            console.log(`- ${key}: ${value}`);
          }

          // Upload the document
          const uploadResponse = await axios.post(
            `${apiUrl}/documents/upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
                // Let axios set the Content-Type header with the boundary
              },
              // Add maxBodyLength and maxContentLength
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
            }
          );

          console.log('Document upload response:', uploadResponse.data);

          // Clean up
          fs.unlinkSync(testFilePath);

          console.log('Test completed successfully!');
          return; // Exit the function early
        } else {
          // If no token in registration response, try login again
          console.log('No token in registration response, logging in...');
          const loginAfterRegisterResponse = await axios.post(
            `${apiUrl}/auth/login`,
            {
              walletAddress,
            }
          );

          if (!loginAfterRegisterResponse.data.token) {
            throw new Error('No token received after registration');
          }

          console.log('Received custom token after registration');
          customToken = loginAfterRegisterResponse.data.token;
        }
      } else {
        // If it's another error, rethrow it
        throw error;
      }
    }

    // Step 2: Exchange custom token for ID token
    console.log('Step 2: Exchanging custom token for ID token...');
    const userCredential = await signInWithCustomToken(auth, customToken);
    const idToken = await userCredential.user.getIdToken();
    console.log('Successfully obtained ID token');

    // Step 3: Upload a document
    console.log('Step 3: Uploading document...');

    // Create a small test file
    const testFilePath = './test-document.txt';
    fs.writeFileSync(
      testFilePath,
      'This is a test document for upload testing.'
    );

    // Create form data
    const formData = new FormData();

    // Add file as a Buffer instead of a stream
    const fileBuffer = fs.readFileSync(testFilePath);
    formData.append('document_file', fileBuffer, {
      filename: 'test-document.txt',
      contentType: 'text/plain',
    });

    formData.append('documentName', 'Test Document');
    formData.append('documentType', 'identity');
    formData.append('verifyingOrgId', 'org1');

    // Log the form data for debugging
    console.log('Form data entries:');
    for (const [key, value] of Object.entries(formData)) {
      console.log(`- ${key}: ${value}`);
    }

    // Upload the document
    const uploadResponse = await axios.post(
      `${apiUrl}/documents/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
          // Let axios set the Content-Type header with the boundary
        },
        // Add maxBodyLength and maxContentLength
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    console.log('Document upload response:', uploadResponse.data);

    // Clean up
    fs.unlinkSync(testFilePath);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  } finally {
    // Sign out
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out:', e);
    }
  }
}

runTest();
