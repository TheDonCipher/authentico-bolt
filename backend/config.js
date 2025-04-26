const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Try to use service account file if it exists, otherwise use environment variables
let adminConfig;
const serviceAccountPath = path.join(
  __dirname,
  'firebase-service-account.json'
);

if (fs.existsSync(serviceAccountPath)) {
  console.log('Using firebase-service-account.json for Firebase Admin SDK');
  const serviceAccount = require('./firebase-service-account.json');
  adminConfig = {
    credential: admin.credential.cert(serviceAccount),
  };
} else {
  console.log('Using environment variables for Firebase Admin SDK');
  // Create service account from environment variables
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com',
  };
  adminConfig = {
    credential: admin.credential.cert(serviceAccount),
  };
}

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp(adminConfig);
}

// Database references
const adminDb = admin.firestore(); // Admin SDK Firestore

// Standardize on a single collection name (lowercase)
const USER_COLLECTION = 'users';
const AdminUser = adminDb.collection(USER_COLLECTION);

module.exports = {
  admin,
  adminDb,
  AdminUser,
  USER_COLLECTION,
};
