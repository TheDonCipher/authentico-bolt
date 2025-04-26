/**
 * Jest setup file for Authentico backend tests
 * This file is automatically loaded by Jest before running tests
 */

// Load environment variables from .env.test file
require('dotenv').config({ path: '.env.test' });

// Verify that required environment variables are set
const requiredEnvVars = [
  'MASTER_KEY_SECRET',
  'BLOCKCHAIN_RPC_URL',
  'SPONSOR_WALLET_PRIVATE_KEY',
  'PINATA_API_KEY',
  'PINATA_API_SECRET',
  'PINATA_GATEWAY_URL',
  'CONTRACT_ADDRESS',
  'SEPOLIA_CHAIN_ID',
  'FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
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

// Set up global Jest mocks
global.console = {
  ...console,
  // Uncomment to suppress console logs during tests
  // log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Set up global Jest functions
global.fail = (message) => {
  throw new Error(message || 'Test failed');
};
