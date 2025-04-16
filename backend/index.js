const { PinataSDK } = require('pinata-web3');
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

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
const documentRoutes = require('./routes/documentRoutes');
const orgRoutes = require('./routes/orgRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const { verifyToken } = require('./authMiddleware');
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'development'
        ? ['http://localhost:3000', 'http://127.0.0.1:3000']
        : process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(fileUpload());

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
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/tokens', tokenRoutes);

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
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
  });
});

// The organizations/verified endpoint is now handled in orgRoutes.js

// Use standardized port from environment variables
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log(`API available at http://localhost:${port}/api`);
});
