/**
 * Deployment Configuration Verification Script
 * 
 * This script verifies that the Next.js configuration is properly set up
 * for API routes and server-side rendering, especially for the verify links.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('Verifying deployment configuration...');

// Define paths to check
const requiredFiles = [
  // Frontend files
  'frontend/next.config.js',
  'frontend/app/api/verify/[docId]/route.ts',
  'frontend/app/verify/[docId]/page.tsx',
  
  // Backend files
  'backend/routes/verificationRoutes.js',
];

// Check if required files exist
console.log('\nChecking required files:');
let missingFiles = false;
for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} is missing`);
    missingFiles = true;
  }
}

if (missingFiles) {
  console.error('\n❌ Some required files are missing. Please check the errors above.');
  process.exit(1);
}

// Check Next.js configuration
console.log('\nChecking Next.js configuration:');
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

if (nextConfig.includes('output: \'export\'')) {
  console.log('❌ next.config.js contains "output: \'export\'" which will break API routes. Please remove this line.');
  process.exit(1);
} else {
  console.log('✅ next.config.js does not contain static export configuration');
}

if (nextConfig.includes('async rewrites()')) {
  console.log('✅ next.config.js contains rewrites configuration');
} else {
  console.log('❌ next.config.js is missing rewrites configuration');
  process.exit(1);
}

// Check environment variables
console.log('\nChecking environment variables:');
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  console.log('❌ NEXT_PUBLIC_API_URL is not set. This will cause API calls to fail in production.');
  console.log('   Please set this environment variable to your backend URL (e.g., https://authentico-backend.onrender.com/api)');
} else {
  console.log(`✅ NEXT_PUBLIC_API_URL is set to: ${apiUrl}`);
  
  // Test API connection
  console.log('\nTesting API connection:');
  try {
    const healthUrl = `${apiUrl}/health`;
    console.log(`   Attempting to connect to ${healthUrl}...`);
    
    axios.get(healthUrl, { timeout: 5000 })
      .then(response => {
        console.log(`✅ Successfully connected to API: ${response.status} ${response.statusText}`);
        console.log('   API response:', response.data);
      })
      .catch(error => {
        console.log(`❌ Failed to connect to API: ${error.message}`);
        if (error.response) {
          console.log('   API response:', error.response.data);
        }
      });
  } catch (error) {
    console.log(`❌ Error testing API connection: ${error.message}`);
  }
}

console.log('\nVerification complete. Please address any issues before deploying.');
