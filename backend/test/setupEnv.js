/**
 * Environment setup for Authentico backend security tests
 * This file loads environment variables from .env.test file
 * to avoid exposing sensitive credentials in the code
 */

// Load environment variables from .env.test file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Verify that required environment variables are set
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'MASTER_KEY_SECRET',
  'PINATA_API_KEY',
  'PINATA_API_SECRET',
  'PINATA_GATEWAY_URL',
  'BLOCKCHAIN_RPC_URL',
  'SPONSOR_WALLET_PRIVATE_KEY',
  'ADMIN_WALLET_ADDRESS',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
  console.error(
    'Please create a .env.test file with these variables for testing.'
  );
  process.exit(1);
}
