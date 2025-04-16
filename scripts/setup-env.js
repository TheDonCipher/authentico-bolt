/**
 * Environment Setup Script
 * 
 * This script helps set up the environment by copying the appropriate
 * environment configuration files to the correct locations.
 * 
 * Usage: node scripts/setup-env.js [environment]
 * Example: node scripts/setup-env.js production
 */

const fs = require('fs');
const path = require('path');

// Get environment from command line argument or default to development
const environment = process.argv[2] || 'development';
console.log(`Setting up ${environment} environment`);

// Define paths
const rootDir = path.resolve(__dirname, '..');
const configDir = path.join(rootDir, 'config');
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

// Source environment file
const sourceEnvFile = path.join(configDir, `${environment}.env.example`);

// Destination environment files
const rootEnvFile = path.join(rootDir, '.env');
const frontendEnvFile = path.join(frontendDir, '.env');
const backendEnvFile = path.join(backendDir, '.env');

// Check if source file exists
if (!fs.existsSync(sourceEnvFile)) {
  console.error(`Error: Environment file for ${environment} not found at ${sourceEnvFile}`);
  console.error('Available environments:');
  
  // List available environment files
  const files = fs.readdirSync(configDir);
  files.forEach(file => {
    if (file.endsWith('.env.example')) {
      console.error(`  - ${file.replace('.env.example', '')}`);
    }
  });
  
  process.exit(1);
}

// Read source file
const envContent = fs.readFileSync(sourceEnvFile, 'utf8');

// Write to destination files
try {
  // Root .env
  fs.writeFileSync(rootEnvFile, envContent);
  console.log(`Created ${rootEnvFile}`);
  
  // Frontend .env
  fs.writeFileSync(frontendEnvFile, envContent);
  console.log(`Created ${frontendEnvFile}`);
  
  // Backend .env
  fs.writeFileSync(backendEnvFile, envContent);
  console.log(`Created ${backendEnvFile}`);
  
  console.log('\nEnvironment setup complete!');
  console.log('\nIMPORTANT: You must edit the .env files and fill in your actual values.');
  console.log('Do not commit these files to version control.');
  
} catch (error) {
  console.error('Error creating environment files:', error);
  process.exit(1);
}
