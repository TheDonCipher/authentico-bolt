// This file is only used in API routes (server-side)

import admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Service account credentials from environment variables
// All these variables must be set in the environment
const serviceAccountKey = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// Initialize Firebase Admin if not already initialized
let db: Firestore;
let auth: Auth;

if (!admin.apps.length) {
  try {
    // Validate required environment variables
    const requiredVars = [
      'FIREBASE_TYPE',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required Firebase Admin environment variables: ${missingVars.join(
          ', '
        )}`
      );
    }

    // Log the initialization attempt for debugging
    console.log(
      'Initializing Firebase Admin SDK with project ID:',
      serviceAccountKey.project_id
    );

    // Ensure the private key is properly formatted
    if (typeof serviceAccountKey.private_key === 'string') {
      // Make sure newlines are properly handled
      serviceAccountKey.private_key = serviceAccountKey.private_key.replace(
        /\\n/g,
        '\n'
      );
    }

    // Log key details for debugging (don't log the full key in production)
    if (serviceAccountKey.private_key) {
      console.log(
        'Private key starts with:',
        serviceAccountKey.private_key.substring(0, 20) + '...'
      );
    }
    console.log('Client email:', serviceAccountKey.client_email);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey as admin.ServiceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully');

    // Initialize Firestore and Auth after successful initialization
    db = getFirestore();
    auth = getAuth();

    // Test the connection
    console.log('Testing Firestore connection...');
    db.collection('users')
      .limit(1)
      .get()
      .then(() => console.log('Firestore connection successful'))
      .catch((err) => console.error('Firestore connection test failed:', err));
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Throw the error to prevent silent failures
    throw new Error(
      `Firebase Admin SDK initialization failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
} else {
  console.log('Using existing Firebase Admin SDK instance');
  db = getFirestore();
  auth = getAuth();
}

// Export the admin services
export { db, auth };
