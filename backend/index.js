const { PinataSDK } = require('pinata-web3');
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const session = require('express-session');

// Load environment variables
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'PINATA_JWT',
  'GATEWAY_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'MASTER_KEY_SECRET',
  'BLOCKCHAIN_RPC_URL',
  'SPONSOR_WALLET_PRIVATE_KEY',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);
if (missingEnvVars.length > 0) {
  console.error(
    `Error: Missing required environment variables: ${missingEnvVars.join(
      ', '
    )}`
  );
  console.error('Please check your .env file or environment configuration.');
  process.exit(1);
}

// Validate MASTER_KEY_SECRET length (must be 32 characters for AES-256)
if (process.env.MASTER_KEY_SECRET.length !== 32) {
  console.error(
    `Error: MASTER_KEY_SECRET must be exactly 32 characters for AES-256 encryption. Current length: ${process.env.MASTER_KEY_SECRET.length}`
  );
  console.error('Please update your .env file with a 32-character master key.');
  process.exit(1);
}

const { AdminUser } = require('./config');
const authRoutes = require('./authRoutes');
const csrfTokenRoute = require('./routes/auth/csrf-token');
const documentRoutes = require('./routes/documentRoutes');
const secureDocumentRoutes = require('./routes/secureDocumentRoutes');
const orgRoutes = require('./routes/orgRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const { verifyToken } = require('./authMiddleware');
const {
  syncUserClaimsMiddleware,
} = require('./middleware/userClaimsMiddleware');

// Import security middleware
const securityHeaders = require('./middleware/securityHeaders');
const { rateLimiter } = require('./middleware/rateLimiter');
const { sanitizeInputs } = require('./middleware/inputValidation');
const {
  csrfTokenGenerator,
  csrfTokenValidator,
} = require('./middleware/csrfProtection');
const {
  getSessionOptions,
  regenerateSessionOnLogin,
  checkSessionTimeout,
  protectAgainstSessionFixation,
  protectAgainstSessionHijacking,
} = require('./middleware/sessionManagement');

const app = express();

// Middleware

// Security middleware
app.use(helmet()); // Apply security headers with helmet
app.use(securityHeaders); // Apply custom security headers
app.use(rateLimiter); // Apply rate limiting
app.use(sanitizeInputs); // Sanitize inputs

// Session management
app.use(session(getSessionOptions()));
app.use(protectAgainstSessionFixation);
app.use(protectAgainstSessionHijacking);
app.use(checkSessionTimeout);

// CSRF protection
app.use(csrfTokenGenerator);
app.use(csrfTokenValidator);

// Body parsing middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      const allowedOrigins =
        process.env.NODE_ENV === 'development'
          ? [
              'http://localhost:3000',
              'http://127.0.0.1:3000',
              'http://localhost:3001',
              'http://127.0.0.1:3001',
            ]
          : [
              'https://authentico-demov2.vercel.app',
              'https://authentico-demov2.netlify.app',
              'https://authentico-bolt.netlify.app',
            ];

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(null, true); // Allow all origins for now to debug
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-XSRF-TOKEN',
      'x-xsrf-token',
    ],
    exposedHeaders: ['Set-Cookie', 'Date', 'ETag'],
  })
);

// Pinata setup with standardized gateway URL
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL,
});

// Log environment information (without sensitive data)
console.log(`Server starting in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`Using Pinata Gateway: ${process.env.GATEWAY_URL}`);
console.log(`Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);

// Routes
app.use('/api/auth/csrf-token', csrfTokenRoute); // Register CSRF token route first
app.use('/api/auth', authRoutes);

// Apply syncUserClaimsMiddleware to all protected routes
const protectedRoutes = express.Router();
protectedRoutes.use(verifyToken, syncUserClaimsMiddleware);

// Apply protected routes
app.use('/api/documents', protectedRoutes, documentRoutes);
app.use('/api/secure/documents', protectedRoutes, secureDocumentRoutes); // New secure document routes
app.use('/api/organizations', protectedRoutes, orgRoutes);
app.use('/api/tokens', protectedRoutes, tokenRoutes);
app.use('/api/verify', verificationRoutes); // Public verification endpoint

// Public routes
app.get('/', async (req, res) => {
  // Using the AdminUser reference from config.js which uses the admin SDK
  const snapshot = await AdminUser.get();
  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.send(list);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      firebase: true,
      pinata: true,
      blockchain: true,
    },
  });
});

// Legacy upload route - redirects to new document upload endpoint
app.post('/upload', verifyToken, async (req, res) => {
  try {
    // Redirect to the new document upload endpoint
    res.redirect(307, '/api/documents/upload');
  } catch (error) {
    console.error(error);
    res.status(500).send('Upload failed');
  }
});

// User management routes
app.post('/create', verifyToken, async (req, res) => {
  const data = req.body;
  await AdminUser.add({ data });
  res.send({ msg: 'User Added' });
});

app.post('/update', verifyToken, async (req, res) => {
  const id = req.body.id;
  delete req.body.id;
  await AdminUser.doc(id).update(req.body);
  res.send({ msg: 'Updated' });
});

app.post('/delete', verifyToken, async (req, res) => {
  await AdminUser.doc(req.body.id).delete();
  res.send({ msg: 'Deleted' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log the error with stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  } else {
    // Log error without sensitive details in production
    console.error('Error:', {
      name: err.name,
      message: err.message,
      status: err.status || 500,
      path: req.path,
      method: req.method,
    });
  }

  // Send a sanitized error response
  res.status(err.status || 500).json({
    error: 'An error occurred',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
    code: err.code || 'SERVER_ERROR',
    // Include a request ID for tracking
    requestId: req.id || Math.random().toString(36).substring(2, 15),
  });
});

// The organizations/verified endpoint is now handled in orgRoutes.js

// Use standardized port from environment variables
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);

  // Display the correct API URL based on environment
  if (process.env.NODE_ENV === 'production') {
    // In production, use the actual service URL
    const serviceUrl =
      process.env.SERVICE_URL || 'https://authentico-backend.onrender.com';
    console.log(`API available at ${serviceUrl}/api`);
  } else {
    // In development, use localhost
    console.log(`API available at http://localhost:${port}/api`);
  }
});
