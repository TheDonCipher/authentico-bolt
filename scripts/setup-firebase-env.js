/**
 * Setup Firebase Environment Variables Script
 * 
 * This script helps set up environment variables for Firebase Admin SDK
 * by reading from a service account file or prompting for values.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Main function
async function setupFirebaseEnv() {
  console.log('Firebase Environment Variables Setup');
  console.log('===================================');
  
  // Check if service account file exists
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log('Found firebase-service-account.json file.');
    const useFile = await prompt('Do you want to use this file? (y/n): ');
    
    if (useFile.toLowerCase() === 'y') {
      try {
        const serviceAccount = require(serviceAccountPath);
        
        // Generate environment variable export commands
        let envCommands = '';
        
        if (process.platform === 'win32') {
          // Windows (PowerShell)
          envCommands += `$env:FIREBASE_TYPE="service_account"\n`;
          envCommands += `$env:FIREBASE_PROJECT_ID="${serviceAccount.project_id}"\n`;
          envCommands += `$env:FIREBASE_PRIVATE_KEY_ID="${serviceAccount.private_key_id}"\n`;
          envCommands += `$env:FIREBASE_PRIVATE_KEY='${serviceAccount.private_key}'\n`;
          envCommands += `$env:FIREBASE_CLIENT_EMAIL="${serviceAccount.client_email}"\n`;
          envCommands += `$env:FIREBASE_CLIENT_ID="${serviceAccount.client_id}"\n`;
          envCommands += `$env:FIREBASE_AUTH_URI="${serviceAccount.auth_uri}"\n`;
          envCommands += `$env:FIREBASE_TOKEN_URI="${serviceAccount.token_uri}"\n`;
          envCommands += `$env:FIREBASE_AUTH_PROVIDER_X509_CERT_URL="${serviceAccount.auth_provider_x509_cert_url}"\n`;
          envCommands += `$env:FIREBASE_CLIENT_X509_CERT_URL="${serviceAccount.client_x509_cert_url}"\n`;
          envCommands += `$env:FIREBASE_UNIVERSE_DOMAIN="${serviceAccount.universe_domain || 'googleapis.com'}"\n`;
        } else {
          // Unix (Bash)
          envCommands += `export FIREBASE_TYPE="service_account"\n`;
          envCommands += `export FIREBASE_PROJECT_ID="${serviceAccount.project_id}"\n`;
          envCommands += `export FIREBASE_PRIVATE_KEY_ID="${serviceAccount.private_key_id}"\n`;
          envCommands += `export FIREBASE_PRIVATE_KEY='${serviceAccount.private_key}'\n`;
          envCommands += `export FIREBASE_CLIENT_EMAIL="${serviceAccount.client_email}"\n`;
          envCommands += `export FIREBASE_CLIENT_ID="${serviceAccount.client_id}"\n`;
          envCommands += `export FIREBASE_AUTH_URI="${serviceAccount.auth_uri}"\n`;
          envCommands += `export FIREBASE_TOKEN_URI="${serviceAccount.token_uri}"\n`;
          envCommands += `export FIREBASE_AUTH_PROVIDER_X509_CERT_URL="${serviceAccount.auth_provider_x509_cert_url}"\n`;
          envCommands += `export FIREBASE_CLIENT_X509_CERT_URL="${serviceAccount.client_x509_cert_url}"\n`;
          envCommands += `export FIREBASE_UNIVERSE_DOMAIN="${serviceAccount.universe_domain || 'googleapis.com'}"\n`;
        }
        
        // Save to a temporary file
        const tempFilePath = path.join(__dirname, '..', 'firebase-env-setup.txt');
        fs.writeFileSync(tempFilePath, envCommands);
        
        console.log('\nEnvironment variable commands have been saved to:');
        console.log(tempFilePath);
        console.log('\nTo set these environment variables:');
        
        if (process.platform === 'win32') {
          console.log('1. Open PowerShell');
          console.log(`2. Run: Get-Content "${tempFilePath}" | Invoke-Expression`);
        } else {
          console.log('1. Open a terminal');
          console.log(`2. Run: source "${tempFilePath}"`);
        }
        
        console.log('\nAfter setting the environment variables, you can run:');
        console.log('npm run seed:verified-orgs');
        
        console.log('\nNote: These environment variables will only be set for the current terminal session.');
      } catch (error) {
        console.error('Error reading service account file:', error);
      }
    } else {
      console.log('Please follow the instructions in FIREBASE_CREDENTIALS_GUIDE.md to set up your Firebase credentials.');
    }
  } else {
    console.log('No firebase-service-account.json file found.');
    console.log('Please follow the instructions in FIREBASE_CREDENTIALS_GUIDE.md to set up your Firebase credentials.');
  }
  
  rl.close();
}

// Run the setup
setupFirebaseEnv();
