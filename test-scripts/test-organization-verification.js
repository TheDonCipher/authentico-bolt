/**
 * test-organization-verification.js
 * Test script for organization verification feature
 * 
 * This script tests:
 * 1. Organization application submission
 * 2. Admin approval/rejection
 * 3. Notifications
 */

require('dotenv').config();
const admin = require('firebase-admin');
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

// Collection references
const usersCollection = db.collection('users');
const orgApplicationsCollection = db.collection('organizationApplications');
const notificationsCollection = db.collection('notifications');

// Test data
const testOrg = {
  name: `Test Organization ${Date.now().toString().slice(-4)}`,
  email: `test-org-${Date.now().toString().slice(-4)}@example.com`,
  website: 'https://test-organization.example.com',
  description: 'This is a test organization for testing the verification feature',
  address: '123 Test Street, Test City, Test Country',
  phoneNumber: '+1234567890',
  industry: 'Technology',
  registrationNumber: `TEST-REG-${Date.now().toString().slice(-6)}`,
  foundedYear: '2023',
  documentTypes: ['Identity', 'Education', 'Employment'],
};

// Test user for organization
const testUser = {
  email: testOrg.email,
  password: 'Test123!',
  displayName: testOrg.name,
};

// Admin user for testing
let adminUser = null;

// Test IDs
let testUserId = null;
let applicationId = null;

/**
 * Create a test user for the organization
 */
async function createTestUser() {
  try {
    console.log(`Creating test user: ${testUser.email}`);
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: testUser.email,
      password: testUser.password,
      displayName: testUser.displayName,
      emailVerified: true,
    });
    
    testUserId = userRecord.uid;
    
    // Create user document in Firestore
    await usersCollection.doc(testUserId).set({
      uid: testUserId,
      email: testUser.email,
      name: testUser.displayName,
      userType: 'organization',
      isVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Test user created with ID: ${testUserId}`);
    return testUserId;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Find or create an admin user for testing
 */
async function findOrCreateAdminUser() {
  try {
    // Check if admin user already exists
    const adminSnapshot = await usersCollection.where('userType', '==', 'admin').limit(1).get();
    
    if (!adminSnapshot.empty) {
      adminUser = { id: adminSnapshot.docs[0].id, ...adminSnapshot.docs[0].data() };
      console.log(`Using existing admin user: ${adminUser.email || 'Unknown email'} (${adminUser.id})`);
      return adminUser;
    }
    
    // Create a new admin user
    console.log('No admin user found, creating one...');
    
    const adminEmail = `admin-${Date.now().toString().slice(-4)}@example.com`;
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: adminEmail,
      password: 'Admin123!',
      displayName: 'Test Admin',
      emailVerified: true,
    });
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      userType: 'admin',
    });
    
    // Create user document in Firestore
    await usersCollection.doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: adminEmail,
      name: 'Test Admin',
      userType: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    adminUser = {
      id: userRecord.uid,
      email: adminEmail,
      name: 'Test Admin',
      userType: 'admin',
    };
    
    console.log(`Created admin user: ${adminUser.email} (${adminUser.id})`);
    return adminUser;
  } catch (error) {
    console.error('Error finding/creating admin user:', error);
    throw error;
  }
}

/**
 * Submit an organization verification application
 */
async function submitApplication() {
  try {
    console.log(`Submitting application for: ${testOrg.name}`);
    
    // Create the application
    const applicationRef = await orgApplicationsCollection.add({
      orgName: testOrg.name,
      contactEmail: testOrg.email,
      website: testOrg.website,
      description: testOrg.description,
      address: testOrg.address,
      phoneNumber: testOrg.phoneNumber,
      industry: testOrg.industry,
      registrationNumber: testOrg.registrationNumber,
      foundedYear: testOrg.foundedYear,
      documentTypes: testOrg.documentTypes,
      status: 'pending',
      submittedBy: testUserId,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    applicationId = applicationRef.id;
    console.log(`Application submitted with ID: ${applicationId}`);
    return applicationId;
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
}

/**
 * Approve the organization application
 */
async function approveApplication() {
  try {
    console.log(`Approving application: ${applicationId}`);
    
    // Get the application
    const appSnapshot = await orgApplicationsCollection.doc(applicationId).get();
    if (!appSnapshot.exists) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    
    const appData = appSnapshot.data();
    
    // Update application status
    await orgApplicationsCollection.doc(applicationId).update({
      status: 'approved',
      updatedBy: adminUser.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Update user document
    await usersCollection.doc(testUserId).update({
      userType: 'organization',
      isVerified: true,
      website: appData.website,
      description: appData.description || '',
      address: appData.address || '',
      phoneNumber: appData.phoneNumber || '',
      industry: appData.industry || '',
      registrationNumber: appData.registrationNumber || '',
      foundedYear: appData.foundedYear || '',
      documentTypes: appData.documentTypes || [],
      verificationBadge: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUser.id,
    });
    
    console.log(`Application approved: ${applicationId}`);
    
    // Create notification
    const notificationRef = await notificationsCollection.add({
      userId: testUserId,
      title: 'Organization Verification Approved',
      message: `Your organization ${appData.orgName} has been verified! You can now verify documents.`,
      data: { status: 'approved', applicationId },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Notification created: ${notificationRef.id}`);
    return true;
  } catch (error) {
    console.error('Error approving application:', error);
    throw error;
  }
}

/**
 * Reject the organization application
 */
async function rejectApplication() {
  try {
    console.log(`Rejecting application: ${applicationId}`);
    
    // Get the application
    const appSnapshot = await orgApplicationsCollection.doc(applicationId).get();
    if (!appSnapshot.exists) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    
    const appData = appSnapshot.data();
    const notes = 'This application was rejected for testing purposes.';
    
    // Update application status
    await orgApplicationsCollection.doc(applicationId).update({
      status: 'rejected',
      notes: notes,
      updatedBy: adminUser.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Application rejected: ${applicationId}`);
    
    // Create notification
    const notificationRef = await notificationsCollection.add({
      userId: testUserId,
      title: 'Organization Verification Rejected',
      message: `Your organization verification was rejected. Reason: ${notes}`,
      data: { status: 'rejected', applicationId },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Notification created: ${notificationRef.id}`);
    return true;
  } catch (error) {
    console.error('Error rejecting application:', error);
    throw error;
  }
}

/**
 * Verify the organization status
 */
async function verifyOrganizationStatus() {
  try {
    console.log(`Verifying organization status for user: ${testUserId}`);
    
    // Get the user document
    const userSnapshot = await usersCollection.doc(testUserId).get();
    if (!userSnapshot.exists) {
      throw new Error(`User not found: ${testUserId}`);
    }
    
    const userData = userSnapshot.data();
    console.log(`Organization status: ${userData.isVerified ? 'Verified' : 'Not Verified'}`);
    
    // Get the application
    const appSnapshot = await orgApplicationsCollection.doc(applicationId).get();
    if (!appSnapshot.exists) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    
    const appData = appSnapshot.data();
    console.log(`Application status: ${appData.status}`);
    
    // Get notifications
    const notificationsSnapshot = await notificationsCollection
      .where('userId', '==', testUserId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    console.log(`Found ${notificationsSnapshot.size} notifications:`);
    notificationsSnapshot.forEach((doc) => {
      const notification = doc.data();
      console.log(`- ${notification.title}: ${notification.message}`);
    });
    
    return {
      userVerified: userData.isVerified,
      applicationStatus: appData.status,
      notificationsCount: notificationsSnapshot.size,
    };
  } catch (error) {
    console.error('Error verifying organization status:', error);
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanUp() {
  try {
    console.log('Cleaning up test data...');
    
    if (testUserId) {
      // Delete user document
      await usersCollection.doc(testUserId).delete();
      console.log(`Deleted user document: ${testUserId}`);
      
      // Delete user from Firebase Auth
      await admin.auth().deleteUser(testUserId);
      console.log(`Deleted user from Firebase Auth: ${testUserId}`);
    }
    
    if (applicationId) {
      // Delete application
      await orgApplicationsCollection.doc(applicationId).delete();
      console.log(`Deleted application: ${applicationId}`);
    }
    
    // Delete notifications
    const notificationsSnapshot = await notificationsCollection
      .where('userId', '==', testUserId)
      .get();
    
    const batch = db.batch();
    notificationsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Deleted ${notificationsSnapshot.size} notifications`);
    
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
  try {
    console.log('=== STARTING ORGANIZATION VERIFICATION TEST ===');
    
    // Step 1: Create test user
    await createTestUser();
    
    // Step 2: Find or create admin user
    await findOrCreateAdminUser();
    
    // Step 3: Submit application
    await submitApplication();
    
    // Step 4: Verify initial status
    console.log('\n=== INITIAL STATUS ===');
    await verifyOrganizationStatus();
    
    // Step 5: Approve application
    console.log('\n=== APPROVING APPLICATION ===');
    await approveApplication();
    
    // Step 6: Verify approved status
    console.log('\n=== APPROVED STATUS ===');
    await verifyOrganizationStatus();
    
    // Step 7: Create a new application for rejection test
    console.log('\n=== CREATING NEW APPLICATION FOR REJECTION TEST ===');
    testOrg.name = `${testOrg.name} (Rejection Test)`;
    await submitApplication();
    
    // Step 8: Reject application
    console.log('\n=== REJECTING APPLICATION ===');
    await rejectApplication();
    
    // Step 9: Verify rejected status
    console.log('\n=== REJECTED STATUS ===');
    await verifyOrganizationStatus();
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up test data
    console.log('\n=== CLEANING UP TEST DATA ===');
    await cleanUp();
    
    // Exit the process
    process.exit(0);
  }
}

// Run the test
runTest();
