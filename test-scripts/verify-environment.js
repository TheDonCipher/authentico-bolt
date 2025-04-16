/**
 * Environment Verification Script
 * 
 * This script verifies that all required environment variables are set
 * and that the configuration is valid for the specified environment.
 * 
 * Usage: node test-scripts/verify-environment.js [environment]
 * Example: node test-scripts/verify-environment.js development
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const { ethers } = require('ethers');

// Get environment from command line argument or default to development
const environment = process.argv[2] || 'development';
console.log(`Verifying ${environment} environment`);

// Define required environment variables for each component
const requiredVars = {
  frontend: [
    'NEXT_PUBLIC_THIRDWEB_CLIENT_ID',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_GATEWAY_URL',
  ],
  backend: [
    'PORT',
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

// Load environment variables
const envPath = path.resolve(process.cwd(), `.env.${environment}`);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // Fall back to .env
}

// Results tracking
const results = {
  missingVars: {
    frontend: [],
    backend: [],
  },
  tests: {
    passed: 0,
    failed: 0,
    skipped: 0,
  },
};

// Check for missing environment variables
function checkMissingVars() {
  console.log('\nChecking required environment variables...');
  
  // Check frontend variables
  requiredVars.frontend.forEach(varName => {
    if (!process.env[varName]) {
      results.missingVars.frontend.push(varName);
    }
  });
  
  // Check backend variables
  requiredVars.backend.forEach(varName => {
    if (!process.env[varName]) {
      results.missingVars.backend.push(varName);
    }
  });
  
  // Report missing variables
  if (results.missingVars.frontend.length > 0) {
    console.log('\n❌ Missing frontend environment variables:');
    results.missingVars.frontend.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  } else {
    console.log('✅ All frontend environment variables are set');
  }
  
  if (results.missingVars.backend.length > 0) {
    console.log('\n❌ Missing backend environment variables:');
    results.missingVars.backend.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  } else {
    console.log('✅ All backend environment variables are set');
  }
  
  return results.missingVars.frontend.length === 0 && results.missingVars.backend.length === 0;
}

// Test Firebase configuration
async function testFirebaseConfig() {
  console.log('\nTesting Firebase configuration...');
  
  // Skip if required variables are missing
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.log('⏭️ Skipping Firebase test due to missing configuration');
    results.tests.skipped++;
    return false;
  }
  
  try {
    // Test Firebase API key validity by making a request to the Firebase Auth REST API
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      { returnSecureToken: true }
    );
    
    // If we get here without an error, the API key is valid (though the request will fail for other reasons)
    console.log('❌ Firebase test failed: API key is valid but unexpected success response');
    results.tests.failed++;
    return false;
  } catch (error) {
    // We expect an error, but it should be a specific error from Firebase, not a network error
    if (error.response && error.response.data && error.response.data.error) {
      // This is a valid Firebase error response, which means the API key is valid
      console.log('✅ Firebase configuration is valid');
      results.tests.passed++;
      return true;
    } else {
      console.log('❌ Firebase test failed:', error.message);
      results.tests.failed++;
      return false;
    }
  }
}

// Test Pinata configuration
async function testPinataConfig() {
  console.log('\nTesting Pinata configuration...');
  
  // Skip if required variables are missing
  if (!process.env.PINATA_JWT) {
    console.log('⏭️ Skipping Pinata test due to missing configuration');
    results.tests.skipped++;
    return false;
  }
  
  try {
    // Test Pinata JWT by making a request to the Pinata API
    const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
    });
    
    if (response.status === 200 && response.data && response.data.message === 'Congratulations! You are communicating with the Pinata API!') {
      console.log('✅ Pinata configuration is valid');
      results.tests.passed++;
      return true;
    } else {
      console.log('❌ Pinata test failed: Unexpected response');
      results.tests.failed++;
      return false;
    }
  } catch (error) {
    console.log('❌ Pinata test failed:', error.message);
    results.tests.failed++;
    return false;
  }
}

// Test blockchain configuration
async function testBlockchainConfig() {
  console.log('\nTesting blockchain configuration...');
  
  // Skip if required variables are missing
  if (!process.env.BLOCKCHAIN_RPC_URL || !process.env.SPONSOR_WALLET_PRIVATE_KEY) {
    console.log('⏭️ Skipping blockchain test due to missing configuration');
    results.tests.skipped++;
    return false;
  }
  
  try {
    // Create a provider using the RPC URL
    const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    
    // Create a wallet using the private key
    const wallet = new ethers.Wallet(process.env.SPONSOR_WALLET_PRIVATE_KEY, provider);
    
    // Get the network and wallet balance
    const network = await provider.getNetwork();
    const balance = await provider.getBalance(wallet.address);
    
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`   Wallet Address: ${wallet.address}`);
    console.log(`   Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    // Verify this is the Sepolia testnet
    if (network.chainId === 11155111) {
      console.log('✅ Connected to Sepolia testnet');
    } else {
      console.log(`⚠️ Connected to ${network.name} (Chain ID: ${network.chainId}), expected Sepolia (Chain ID: 11155111)`);
    }
    
    // Check if the wallet has enough balance for transactions
    if (balance.gt(ethers.utils.parseEther('0.01'))) {
      console.log('✅ Wallet has sufficient balance for transactions');
    } else {
      console.log('⚠️ Wallet balance is low, may not be sufficient for transactions');
    }
    
    console.log('✅ Blockchain configuration is valid');
    results.tests.passed++;
    return true;
  } catch (error) {
    console.log('❌ Blockchain test failed:', error.message);
    results.tests.failed++;
    return false;
  }
}

// Test encryption key
function testEncryptionKey() {
  console.log('\nTesting encryption key configuration...');
  
  // Skip if required variables are missing
  if (!process.env.MASTER_KEY_SECRET) {
    console.log('⏭️ Skipping encryption key test due to missing configuration');
    results.tests.skipped++;
    return false;
  }
  
  // Check if the master key is exactly 32 characters (for AES-256)
  if (process.env.MASTER_KEY_SECRET.length === 32) {
    console.log('✅ Master key is valid (32 characters)');
    results.tests.passed++;
    return true;
  } else {
    console.log(`❌ Master key is invalid: length is ${process.env.MASTER_KEY_SECRET.length}, expected 32 characters`);
    results.tests.failed++;
    return false;
  }
}

// Test API URL configuration
async function testApiUrl() {
  console.log('\nTesting API URL configuration...');
  
  // Skip if required variables are missing
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.log('⏭️ Skipping API URL test due to missing configuration');
    results.tests.skipped++;
    return false;
  }
  
  // Check if the API URL is appropriate for the environment
  if (environment === 'production' && process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    console.log('❌ API URL is set to localhost in production environment');
    results.tests.failed++;
    return false;
  }
  
  try {
    // Try to connect to the API
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
      timeout: 5000, // 5 second timeout
    });
    
    if (response.status === 200) {
      console.log('✅ API is accessible');
      results.tests.passed++;
      return true;
    } else {
      console.log(`❌ API returned unexpected status: ${response.status}`);
      results.tests.failed++;
      return false;
    }
  } catch (error) {
    console.log('❌ API is not accessible:', error.message);
    results.tests.failed++;
    return false;
  }
}

// Main function
async function verifyEnvironment() {
  console.log('Environment Verification');
  console.log('=======================');
  
  // Check for missing environment variables
  const allVarsPresent = checkMissingVars();
  
  // Run tests if all variables are present
  if (allVarsPresent) {
    await testFirebaseConfig();
    await testPinataConfig();
    await testBlockchainConfig();
    testEncryptionKey();
    await testApiUrl();
  } else {
    console.log('\n⚠️ Skipping tests due to missing environment variables');
  }
  
  // Print summary
  console.log('\n=======================');
  console.log('Verification Summary:');
  console.log(`Tests Passed: ${results.tests.passed}`);
  console.log(`Tests Failed: ${results.tests.failed}`);
  console.log(`Tests Skipped: ${results.tests.skipped}`);
  console.log('=======================');
  
  // Return non-zero exit code if any tests failed
  if (results.tests.failed > 0) {
    process.exit(1);
  }
}

// Run the verification
verifyEnvironment().catch(error => {
  console.error('Error during verification:', error);
  process.exit(1);
});
