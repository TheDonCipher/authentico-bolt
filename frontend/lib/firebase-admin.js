/**
 * Firebase Admin initialization for server-side components
 *
 * This module initializes Firebase Admin SDK for server-side use.
 * It's designed to be safely imported during build time without causing errors.
 */

// Only import firebase-admin when this file is executed at runtime, not during build
let admin, db, auth;

// This code will only run at runtime on the server, not during the build process
if (typeof window === 'undefined') {
  try {
    // Dynamic import to prevent build-time errors
    admin = require('firebase-admin');

    // Check if Firebase Admin is already initialized
    if (!admin.apps.length) {
      // Check for required environment variables
      const requiredVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
      ];

      const missingVars = requiredVars.filter(
        (varName) => !process.env[varName]
      );

      if (missingVars.length > 0) {
        console.error(
          `Error: Missing Firebase Admin environment variables: ${missingVars.join(
            ', '
          )}`
        );
        throw new Error(
          `Missing required Firebase Admin environment variables: ${missingVars.join(
            ', '
          )}`
        );
      }

      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });

      console.log('Firebase Admin SDK initialized successfully');
    }

    // Get Firestore and Auth instances
    db = admin.firestore();
    auth = admin.auth();
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);

    // Re-throw the error to ensure it's properly handled
    throw error;
  }
}

// Export Firebase Admin SDK instances
module.exports = { admin, db, auth };
