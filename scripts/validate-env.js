/**
 * Environment Variable Validation Script
 *
 * This script validates that all required environment variables are present
 * for the specified environment (development, staging, production).
 *
 * Usage: node scripts/validate-env.js [environment]
 * Example: node scripts/validate-env.js production
 */

// Load environment variables
require('dotenv').config();

// Get environment from command line argument or default to development
const environment = process.argv[2] || 'development';
console.log(`Validating environment variables for ${environment} environment`);

// Define required environment variables for each component
const requiredVariables = {
  // Common variables
  common: ['NODE_ENV'],

  // Frontend variables
  frontend: [
    'NEXT_PUBLIC_THIRDWEB_CLIENT_ID',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_ADMIN_WALLET_ADDRESS',
    'NEXT_PUBLIC_PINATA_JWT',
    'NEXT_PUBLIC_GATEWAY_URL',
  ],

  // Backend variables
  backend: [
    'PORT',
    'FIREBASE_TYPE',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'PINATA_JWT',
    'GATEWAY_URL',
    'BLOCKCHAIN_RPC_URL',
    'SPONSOR_WALLET_PRIVATE_KEY',
    'MASTER_KEY_SECRET',
  ],
};

// Additional variables required for production
if (environment === 'production') {
  requiredVariables.frontend
    .push
    // Add any production-specific frontend variables here
    ();

  requiredVariables.backend
    .push
    // Add any production-specific backend variables here
    ();
}

// Check for missing variables
const missingVariables = {
  common: [],
  frontend: [],
  backend: [],
};

// Check common variables
requiredVariables.common.forEach((variable) => {
  if (!process.env[variable]) {
    missingVariables.common.push(variable);
  }
});

// Check frontend variables
requiredVariables.frontend.forEach((variable) => {
  if (!process.env[variable]) {
    missingVariables.frontend.push(variable);
  }
});

// Check backend variables
requiredVariables.backend.forEach((variable) => {
  if (!process.env[variable]) {
    missingVariables.backend.push(variable);
  }
});

// Report results
let hasErrors = false;

if (missingVariables.common.length > 0) {
  console.error('Missing common environment variables:');
  missingVariables.common.forEach((variable) =>
    console.error(`  - ${variable}`)
  );
  hasErrors = true;
}

if (missingVariables.frontend.length > 0) {
  console.error('Missing frontend environment variables:');
  missingVariables.frontend.forEach((variable) =>
    console.error(`  - ${variable}`)
  );
  hasErrors = true;
}

if (missingVariables.backend.length > 0) {
  console.error('Missing backend environment variables:');
  missingVariables.backend.forEach((variable) =>
    console.error(`  - ${variable}`)
  );
  hasErrors = true;
}

// Check for environment-specific issues
if (environment === 'production') {
  // Verify production-specific settings
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      'NODE_ENV should be set to "production" for production environment'
    );
    hasErrors = true;
  }

  // Verify API URL is not localhost
  if (
    process.env.NEXT_PUBLIC_API_URL &&
    process.env.NEXT_PUBLIC_API_URL.includes('localhost')
  ) {
    console.error(
      'NEXT_PUBLIC_API_URL should not point to localhost in production'
    );
    hasErrors = true;
  }
}

// Validate MASTER_KEY_SECRET length (must be 32 characters for AES-256)
if (
  process.env.MASTER_KEY_SECRET &&
  process.env.MASTER_KEY_SECRET.length !== 32
) {
  console.error(
    `Error: MASTER_KEY_SECRET must be exactly 32 characters for AES-256 encryption. Current length: ${process.env.MASTER_KEY_SECRET.length}`
  );
  hasErrors = true;
}

// Validate that frontend Pinata variables are set if backend ones are
if (process.env.PINATA_JWT && !process.env.NEXT_PUBLIC_PINATA_JWT) {
  console.error(
    'Warning: PINATA_JWT is set but NEXT_PUBLIC_PINATA_JWT is missing. Frontend may not be able to access Pinata.'
  );
  hasErrors = true;
}

if (process.env.GATEWAY_URL && !process.env.NEXT_PUBLIC_GATEWAY_URL) {
  console.error(
    'Warning: GATEWAY_URL is set but NEXT_PUBLIC_GATEWAY_URL is missing. Frontend may not be able to access IPFS gateway.'
  );
  hasErrors = true;
}

// Final result
if (hasErrors) {
  console.error(
    '\nEnvironment validation failed. Please fix the issues above.'
  );
  process.exit(1);
} else {
  console.log(
    '\nEnvironment validation successful! All required variables are present.'
  );
}
