const firebase = require('firebase');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

// Client SDK Configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAvxovIhlBmtmiLMT8-WcXpybq7MuJFN4A',
  authDomain: 'authentico-backend.firebaseapp.com',
  projectId: 'authentico-backend',
  storageBucket: 'authentico-backend.firebasestorage.app',
  messagingSenderId: '848880789142',
  appId: '1:848880789142:web:e955ddd9261224206384b7',
  measurementId: 'G-4J7YTPB5HS',
};

// Initialize Firebase apps
firebase.initializeApp(firebaseConfig);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Database references
const db = firebase.firestore();
const adminDb = admin.firestore();

// Standardize on a single collection name (lowercase)
const USER_COLLECTION = 'users';
const User = db.collection(USER_COLLECTION);
const AdminUser = adminDb.collection(USER_COLLECTION);

module.exports = {
  firebase,
  admin,
  db,
  adminDb,
  User,
  AdminUser,
  USER_COLLECTION,
};
