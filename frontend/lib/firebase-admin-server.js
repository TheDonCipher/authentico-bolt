// This file is only used in API routes (server-side)

import admin from 'firebase-admin';

// Service account credentials from environment variables
const serviceAccountKey = {
  type: process.env.FIREBASE_TYPE || 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID || 'authentico-backend',
  private_key_id:
    process.env.FIREBASE_PRIVATE_KEY_ID ||
    'f21cf9b60fa17b580d86b6cf4ba46ffc8fb6ce09',
  private_key: (
    process.env.FIREBASE_PRIVATE_KEY ||
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjdnM5cVCmSbaQ\n5aQrbU9ohsk1L0AgZnBEwhph3hRDFuyAJWnib46mqoR/H2eaiRKsM89LcNtbUxMl\ni6l2e9xEnZcFKDR6RAD3lmWVLy6RNe6ALxxOjqJd1hILrsTHuWUCrfcaCQdn/g9n\nm1o5bJtGi9G1Q0fUy6KGP5Zme49ezjvF9CYBD/s1nmwVDReuD/vc60bop8Ev4zrt\nL36koZ5QMbUQqDinxylta8aZhYzcdvdej5f/j3mID2dhnCWykbGh2SqG30GvhSGs\nI4ttkreGtfS8GktWpWk+w6cqIrFHCEu58570E8LXhsyc4Ht4baSgbh86zX5krbCt\nFjpT38ZlAgMBAAECggEAB/ywbiDbjjiBV2ylHCsb63FUkQj1QvAGcdGjLN+HUWzk\nEvHhDduiFoIz9asw6oPime/xI9BIo5p4T8gWeG/eaCrkF3AqukOq4W4jmgnDZnyC\nYhiLM0p0ZA3i9VetjU3BggNClO7Wgg4PriIQ40frgWOxFECMmLj3gMRIIstMStdI\nVTjkm1XwIYu2XzT/HTysTJlThiktkqtIVJHbVxWSSFN+Nyd5M1zCsGuerZ1lne01\nJldDzD+yI5uiGvt8LWuPgfink8wqm/XWegIKP138Z37bgfag32hxFCIUN8E4tn0F\neVfhMJuwL/CGibLYFXMnY7xyr0hs1/krIASbg2bleQKBgQDd7OOlDCauwXqibvEX\nnI/ChC2KYFdPnKHr/Tpt82NjNpRjcT468mtBWVxmqlHoJbh8JwrKEJl0vC/1R+j5\n6Cl9w8vowCcVmWwEmyuUHLveDedaR0KH5y+b39YAG2dBVm2Yd3tK1m2Vd0zbD0fd\nH49mspQTRJs47IheNrwYhsczvQKBgQC8j5kZ82im2fXyToWAGYMjmaU+bBPyjoet\nzW01Ozuu7UN/qJerqMVeR+D/3PfyZLIft6KxO4cV8KUra7wm5tP4/Ho3aElMMZAi\niOcoTwq2GSdCwJ5ge2gXyuE7tNH755eGhZ1R5fpf2aTZpuhmXO0f0a8+P3TBJoWv\nvec12KezyQKBgFhEKd6xUIldJruISJfNi1ggXkSVQOTHNZe45g5pKXSCds5+cfPc\nC1C4jAnBYEZnClNG7AGmTIKjfqed7EnJTwdYYre2BVWP6eiDFvgX3ZjaCtRbV1ja\nWJM0mdb9Dzprd7eWfhEr6/Xwtz7BeyG1tcFw8XggZ2Rin3JpbrKKmJw5AoGARCyr\nDy3pZYIioVPwgqs2tdVkYFhVMfqEZbuDQ57B6nIQWISNKdxgV8EnQXsUDoiHul37\nrZa3NaCHJ1bRdUM52qj2SzgiYDD/Su0ynmlNlx8rCcB4wqt7rDaHDr5GuYw3RcTj\nZ2v+BU+8gZEOL4xjk4CNmrT4sqkJ5suDX/2QTLkCgYEAmdq4vz9+T78DMs8VXcAn\nR9zHVsTpgEFzlKtCc/NQnnpoLLgRwhtwTRdxmsaZ3rFLQ/zDCDspk6EBJ651/cqH\nLbViMbDfMpHB+okLDmxenB27l5FRiXziiJK+fNtPmRkcPwTNW6wvfE4yzdsmci9L\nIk6dt35UjHLGzuEidc9pRqc=\n-----END PRIVATE KEY-----\n'
  ).replace(/\\n/g, '\n'),
  client_email:
    process.env.FIREBASE_CLIENT_EMAIL ||
    'firebase-adminsdk-fbsvc@authentico-backend.iam.gserviceaccount.com',
  client_id: process.env.FIREBASE_CLIENT_ID || '107591713606685347756',
  auth_uri:
    process.env.FIREBASE_AUTH_URI ||
    'https://accounts.google.com/o/oauth2/auth',
  token_uri:
    process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url:
    process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
    'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    process.env.FIREBASE_CLIENT_X509_CERT_URL ||
    'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40authentico-backend.iam.gserviceaccount.com',
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com',
};

// Initialize Firebase Admin if not already initialized
let db;
let auth;

if (!admin.apps.length) {
  try {
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
    console.log(
      'Private key starts with:',
      serviceAccountKey.private_key.substring(0, 20) + '...'
    );
    console.log('Client email:', serviceAccountKey.client_email);

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
    });

    console.log('Firebase Admin SDK initialized successfully');

    // Initialize Firestore and Auth after successful initialization
    db = admin.firestore();
    auth = admin.auth();

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
      `Firebase Admin SDK initialization failed: ${error.message}`
    );
  }
} else {
  console.log('Using existing Firebase Admin SDK instance');
  db = admin.firestore();
  auth = admin.auth();
}

// Export the admin services
export { db, auth };
