import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAvxovIhlBmtmiLMT8-WcXpybq7MuJFN4A",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "authentico-backend.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "authentico-backend",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "authentico-backend.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "848880789142",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:848880789142:web:e955ddd9261224206384b7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
