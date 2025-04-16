/**
 * Test Verified Organization Document Upload Script for Authentico
 *
 * This script tests the document upload functionality with verified organizations.
 * It creates a test user, logs in, and uploads a document to a verified organization.
 *
 * Usage: node test-scripts/test-verified-org-upload.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken, signOut } = require('firebase/auth');
const admin = require('firebase-admin');
require('dotenv').config();

// Configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  firebaseProjectId:
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize Firebase Admin SDK
let firebaseApp;
try {
  // Try to use service account file if it exists
  const serviceAccountPath = path.join(
    __dirname,
    '..',
    'firebase-service-account.json'
  );

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    firebaseApp = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount),
      },
      'admin-app'
    );
    console.log('Firebase Admin SDK initialized with service account file');
  } else {
    // Use environment variables
    if (
      !config.firebaseProjectId ||
      !config.firebasePrivateKey ||
      !config.firebaseClientEmail
    ) {
      console.error(
        'Firebase credentials not found. Please set environment variables or provide a service account file.'
      );
      process.exit(1);
    }

    firebaseApp = admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId: config.firebaseProjectId,
          privateKey: config.firebasePrivateKey,
          clientEmail: config.firebaseClientEmail,
        }),
      },
      'admin-app'
    );
    console.log('Firebase Admin SDK initialized with environment variables');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Initialize Firebase Client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const clientApp = initializeApp(firebaseConfig, 'client-app');
const auth = getAuth(clientApp);

// Create a test document file
function createTestDocument(name = 'Test Document') {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create a PDF-like file (simple PDF structure)
  const filePath = path.join(tempDir, `${name.replace(/\s+/g, '_')}.pdf`);

  // Create a simple PDF-like content (not a real PDF, just for testing)
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 6 0 R >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (${name}) Tj ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000210 00000 n
0000000251 00000 n
0000000344 00000 n
trailer
<< /Size 7 /Root 1 0 R >>
startxref
412
%%EOF`;

  fs.writeFileSync(filePath, content);
  console.log(`Created test document at ${filePath}`);

  return {
    path: filePath,
    name: `${name}.pdf`,
    size: fs.statSync(filePath).size,
  };
}

// Get a verified organization
async function getVerifiedOrganization() {
  try {
    const db = firebaseApp.firestore();
    const usersCollection = db.collection('users');

    // Query for verified organizations
    const snapshot = await usersCollection
      .where('userType', '==', 'organization')
      .where('isVerified', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(
        'No verified organizations found. Please run the seed-verified-organizations.js script first.'
      );
      return null;
    }

    const orgDoc = snapshot.docs[0];
    const orgData = orgDoc.data();

    return {
      id: orgDoc.id,
      name: orgData.name,
      documentTypes: orgData.documentTypes || [
        'identity',
        'education',
        'employment',
        'financial',
        'legal',
      ],
    };
  } catch (error) {
    console.error('Error getting verified organization:', error);
    return null;
  }
}

// Test wallet address
const walletAddress = '0x1234567890123456789012345678901234567890';

// Main function
async function testVerifiedOrgUpload() {
  try {
    console.log('Starting verified organization document upload test...');

    // Get a verified organization
    const verifiedOrg = await getVerifiedOrganization();
    if (!verifiedOrg) {
      console.error(
        'No verified organization found. Please run the seed-verified-organizations.js script first.'
      );
      return false;
    }

    console.log(
      `Using verified organization: ${verifiedOrg.name} (${verifiedOrg.id})`
    );

    // Step 1: Register or login with wallet address
    console.log('Step 1: Checking if wallet is registered...');
    let idToken;

    try {
      // Try to login first
      const loginResponse = await axios.post(`${config.apiUrl}/auth/login`, {
        walletAddress,
      });

      if (!loginResponse.data.token) {
        throw new Error('No token received from login');
      }

      console.log('Wallet already registered, received token from login');

      // Exchange custom token for ID token
      const userCredential = await signInWithCustomToken(
        auth,
        loginResponse.data.token
      );
      idToken = await userCredential.user.getIdToken();
      console.log('Successfully obtained ID token');
    } catch (error) {
      // If login fails with NEW_USER error, register the wallet
      if (
        error.response &&
        error.response.data &&
        error.response.data.error === 'NEW_USER'
      ) {
        console.log('Wallet not registered, registering now...');

        // Register the wallet
        const registerResponse = await axios.post(
          `${config.apiUrl}/auth/register`,
          {
            walletAddress,
            userType: 'individual',
            userData: {
              name: 'Test User',
            },
          }
        );

        console.log('Registration response:', registerResponse.data);

        if (registerResponse.data.token) {
          // Exchange custom token for ID token
          const userCredential = await signInWithCustomToken(
            auth,
            registerResponse.data.token
          );
          idToken = await userCredential.user.getIdToken();
          console.log('Successfully obtained ID token after registration');
        } else {
          throw new Error('No token received from registration');
        }
      } else {
        // If it's another error, rethrow it
        throw error;
      }
    }

    // Step 2: Upload a document
    console.log('Step 2: Uploading document to verified organization...');

    // Create a test document
    const testDoc = createTestDocument('Test Identity Document');

    // Create form data
    const formData = new FormData();

    // Add file as a Buffer instead of a stream
    const fileBuffer = fs.readFileSync(testDoc.path);
    formData.append('document_file', fileBuffer, {
      filename: path.basename(testDoc.path),
      contentType: 'application/pdf',
    });

    formData.append('documentName', 'Test Identity Document');
    formData.append('documentType', 'identity');
    formData.append('verifyingOrgId', verifiedOrg.id);

    console.log('Form data prepared with the following fields:');
    console.log(`- documentName: Test Identity Document`);
    console.log(`- documentType: identity`);
    console.log(`- verifyingOrgId: ${verifiedOrg.id}`);
    console.log(
      `- document_file: ${testDoc.name} (${testDoc.size} bytes, type: application/pdf)`
    );

    // Upload the document
    const uploadResponse = await axios.post(
      `${config.apiUrl}/documents/upload`,
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

    // Clean up the test document
    fs.unlinkSync(testDoc.path);
    console.log(`Deleted test document: ${testDoc.path}`);

    console.log('Test completed successfully!');
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  } finally {
    // Sign out
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out:', e);
    }

    // Exit the process
    setTimeout(() => process.exit(0), 1000);
  }
}

// Run the test
testVerifiedOrgUpload();
