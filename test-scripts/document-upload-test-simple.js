/**
 * Simple Document Upload Test Script
 * 
 * This script tests the document upload functionality of the Authentico application.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { ethers } = require('ethers');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken, signOut } = require('firebase/auth');

// Create a random wallet for testing
const wallet = ethers.Wallet.createRandom();
console.log(`Using wallet address: ${wallet.address}`);

// Configuration
const apiUrl = 'http://localhost:3000/api';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvxovIhlBmtmiLMT8-WcXpybq7MuJFN4A",
  authDomain: "authentico-backend.firebaseapp.com",
  projectId: "authentico-backend",
  storageBucket: "authentico-backend.firebasestorage.app",
  messagingSenderId: "848880789142",
  appId: "1:848880789142:web:e955ddd9261224206384b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create a test document
function createTestDocument() {
  const testFilePath = path.join(__dirname, 'test-document.pdf');
  const content = 'This is a test document for Authentico testing.';
  
  fs.writeFileSync(testFilePath, content);
  console.log(`Created test document at ${testFilePath}`);
  
  return testFilePath;
}

// Test user registration
async function testRegistration() {
  console.log('\n=== Testing Registration ===');
  
  const userData = {
    walletAddress: wallet.address,
    userType: 'individual',
    userData: {
      name: 'Test User',
    },
  };

  try {
    console.log(`Registering user with wallet: ${wallet.address}`);
    const response = await axios.post(`${apiUrl}/auth/register`, userData);
    
    console.log('Registration response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Registration successful');
      return true;
    } else {
      console.log('❌ Registration failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Test user login
async function testLogin() {
  console.log('\n=== Testing Login ===');
  
  const loginData = {
    walletAddress: wallet.address,
  };

  try {
    console.log(`Logging in with wallet: ${wallet.address}`);
    const response = await axios.post(`${apiUrl}/auth/login`, loginData);
    
    console.log('Login response:', response.data);
    
    if (response.data.token) {
      console.log('✅ Login successful');
      
      // Sign in with the custom token
      console.log('Signing in with custom token...');
      await signInWithCustomToken(auth, response.data.token);
      console.log('✅ Firebase sign in successful');
      
      // Get the ID token
      const idToken = await auth.currentUser.getIdToken();
      console.log('✅ ID token retrieved');
      
      return idToken;
    } else {
      console.log('❌ Login failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Test document upload
async function testDocumentUpload(idToken) {
  console.log('\n=== Testing Document Upload ===');
  
  try {
    // Create test document
    const testFilePath = createTestDocument();
    
    // Create form data
    const formData = new FormData();
    formData.append('document_file', fs.createReadStream(testFilePath));
    formData.append('documentName', 'Test Document');
    formData.append('documentType', 'Identity');
    formData.append('verifyingOrgId', 'test-org-id');
    
    console.log('Uploading document...');
    const response = await axios.post(`${apiUrl}/documents/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${idToken}`,
      },
    });
    
    console.log('Upload response:', response.data);
    
    if (response.data.documentId) {
      console.log('✅ Document upload successful');
      return response.data.documentId;
    } else {
      console.log('❌ Document upload failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Document upload error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Test getting user documents
async function testGetUserDocuments(idToken) {
  console.log('\n=== Testing Get User Documents ===');
  
  try {
    console.log('Getting user documents...');
    const response = await axios.get(`${apiUrl}/documents`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    
    console.log('Documents response:', response.data);
    
    if (Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} documents`);
      return response.data;
    } else {
      console.log('❌ Failed to get user documents');
      return null;
    }
  } catch (error) {
    console.error('❌ Get documents error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Main function
async function runTests() {
  console.log('Starting Document Upload Tests');
  console.log('=============================');
  
  // Test registration
  const registrationSuccess = await testRegistration();
  
  // Test login
  const idToken = registrationSuccess ? await testLogin() : null;
  
  if (idToken) {
    // Test document upload
    const documentId = await testDocumentUpload(idToken);
    
    // Test get user documents
    if (documentId) {
      await testGetUserDocuments(idToken);
    } else {
      console.log('\n⏭️ Skipping Get User Documents test (no document ID)');
    }
  } else {
    console.log('\n⏭️ Skipping Document Upload test (no ID token)');
  }
  
  // Sign out
  await signOut(auth);
  console.log('\n✅ Signed out successfully');
  
  console.log('\n=============================');
  console.log('Document Upload Tests Complete');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});
