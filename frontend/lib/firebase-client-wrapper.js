/**
 * Firebase Client initialization wrapper
 *
 * This module provides a wrapper around Firebase client initialization
 * with proper error handling and logging.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Initialize Firebase if not already initialized
let firebaseApp;

if (!firebase.apps.length) {
  try {
    // Check for required environment variables
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!apiKey || !projectId) {
      console.warn(
        'Missing Firebase API Key or Project ID. Check your environment variables.'
      );
    } else {
      // Firebase configuration from environment variables
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      // Log configuration (without sensitive values)
      console.log(
        'Initializing Firebase client with project ID:',
        firebaseConfig.projectId
      );

      // Initialize Firebase
      firebaseApp = firebase.initializeApp(firebaseConfig);
      console.log('Firebase client initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase client:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
} else {
  firebaseApp = firebase.app();
  console.log('Using existing Firebase client instance');
}

// Export the Firebase instance
export default firebase;

// Export Firebase services with proper null checks
export const auth = firebaseApp ? firebaseApp.auth() : null;
export const firestore = firebaseApp ? firebaseApp.firestore() : null;
export const storage = firebaseApp ? firebaseApp.storage() : null;

// Log initialization status
if (auth && firestore && storage) {
  console.log('Firebase services initialized successfully');
} else {
  console.warn('Some Firebase services could not be initialized');
}
