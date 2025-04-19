/**
 * test-admin-access.js
 * Test script for admin access to organization applications
 */

require('dotenv').config();
const admin = require('firebase-admin');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (error) {
  console.log('Service account key file not found, using environment variables');
  serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Admin wallet address
const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

// Collection references
const usersCollection = db.collection('users');
const orgApplicationsCollection = db.collection('organizationApplications');

/**
 * Create a test admin user
 */
async function createTestAdminUser() {
  try {
    console.log('Creating test admin user...');
    
    // Create a unique email for the test user
    const email = `admin-test-${Date.now()}@example.com`;
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: 'Test123!',
      displayName: 'Test Admin',
      emailVerified: true,
    });
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      userType: 'admin',
      wallet_address: ADMIN_WALLET_ADDRESS
    });
    
    // Create user document in Firestore
    await usersCollection.doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      name: 'Test Admin',
      userType: 'admin',
      wallet_address: ADMIN_WALLET_ADDRESS,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Created admin user: ${userRecord.uid} (${email})`);
    
    // Create a custom token for testing
    const customToken = await admin.auth().createCustomToken(userRecord.uid, {
      admin: true,
      userType: 'admin',
      wallet_address: ADMIN_WALLET_ADDRESS
    });
    
    console.log('Custom token created for testing');
    
    return {
      uid: userRecord.uid,
      email: email,
      customToken: customToken
    };
  } catch (error) {
    console.error('Error creating test admin user:', error);
    throw error;
  }
}

/**
 * Create a test organization application
 */
async function createTestOrgApplication(userId) {
  try {
    console.log('Creating test organization application...');
    
    // Create the application
    const applicationRef = await orgApplicationsCollection.add({
      orgName: `Test Organization ${Date.now()}`,
      contactEmail: `org-${Date.now()}@example.com`,
      website: 'https://test-organization.example.com',
      description: 'This is a test organization for testing admin access',
      status: 'pending',
      submittedBy: userId,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Created test application: ${applicationRef.id}`);
    return applicationRef.id;
  } catch (error) {
    console.error('Error creating test organization application:', error);
    throw error;
  }
}

/**
 * Test accessing organization applications as admin
 */
async function testAdminAccess(customToken) {
  try {
    console.log('Testing admin access to organization applications...');
    
    // Exchange custom token for ID token
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );
    
    const idToken = response.data.idToken;
    console.log('Obtained ID token for testing');
    
    // Test accessing organization applications
    try {
      const apiResponse = await axios.get(
        'http://localhost:8080/api/organizations/applications',
        {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        }
      );
      
      console.log('Successfully accessed organization applications:');
      console.log(`Found ${apiResponse.data.length} applications`);
      console.log('Test passed!');
      return true;
    } catch (error) {
      console.error('Error accessing organization applications:', error.response?.data || error.message);
      console.log('Test failed!');
      return false;
    }
  } catch (error) {
    console.error('Error testing admin access:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanUp(userId, applicationId) {
  try {
    console.log('Cleaning up test data...');
    
    if (applicationId) {
      // Delete application
      await orgApplicationsCollection.doc(applicationId).delete();
      console.log(`Deleted application: ${applicationId}`);
    }
    
    if (userId) {
      // Delete user document
      await usersCollection.doc(userId).delete();
      console.log(`Deleted user document: ${userId}`);
      
      // Delete user from Firebase Auth
      await admin.auth().deleteUser(userId);
      console.log(`Deleted user from Firebase Auth: ${userId}`);
    }
    
    console.log('Cleanup completed successfully');
    return true;
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return false;
  }
}

/**
 * Run the test
 */
async function runTest() {
  let userId = null;
  let applicationId = null;
  
  try {
    console.log('=== STARTING ADMIN ACCESS TEST ===');
    
    // Step 1: Create test admin user
    const adminUser = await createTestAdminUser();
    userId = adminUser.uid;
    
    // Step 2: Create test organization application
    applicationId = await createTestOrgApplication(userId);
    
    // Step 3: Test admin access
    await testAdminAccess(adminUser.customToken);
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up test data
    console.log('\n=== CLEANING UP TEST DATA ===');
    await cleanUp(userId, applicationId);
    
    // Exit the process
    process.exit(0);
  }
}

// Run the test
runTest();
