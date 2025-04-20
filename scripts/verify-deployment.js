/**
 * Deployment Verification Script
 * 
 * This script verifies that all required files and configurations are in place
 * for a successful deployment.
 */

const fs = require('fs');
const path = require('path');

console.log('Verifying deployment configuration...');

// Define paths to check
const requiredFiles = [
  // Frontend files
  'frontend/.env.production',
  'frontend/next.config.js',
  'frontend/postcss.config.js',
  'frontend/tailwind.config.ts',
  
  // Backend files
  'backend/.env.production',
  
  // Deployment files
  'netlify.toml',
  'vercel.json',
  'backend/render.yaml'
];

// Check for missing files
const missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('Missing required files:');
  missingFiles.forEach(file => console.error(`  - ${file}`));
  console.error('\nPlease create these files before deploying.');
} else {
  console.log('All required files are present.');
}

// Check for PostCSS dependencies in frontend package.json
const frontendPackageJsonPath = path.join(__dirname, '..', 'frontend', 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(frontendPackageJsonPath, 'utf8'));
} catch (error) {
  console.error('Error reading frontend package.json:', error);
  process.exit(1);
}

const requiredDeps = ['postcss-import', 'postcss-nesting', 'tailwindcss-animate'];
const missingDeps = [];

requiredDeps.forEach(dep => {
  const devDeps = packageJson.devDependencies || {};
  const deps = packageJson.dependencies || {};
  
  if (!devDeps[dep] && !deps[dep]) {
    missingDeps.push(dep);
  }
});

if (missingDeps.length > 0) {
  console.error('\nMissing required PostCSS dependencies:');
  missingDeps.forEach(dep => console.error(`  - ${dep}`));
  console.error('\nRun "npm run install:postcss-deps" to install them.');
} else {
  console.log('All required PostCSS dependencies are installed.');
}

// Check for environment variables in .env.production files
const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.production');
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env.production');

let frontendEnvExists = false;
let backendEnvExists = false;

if (fs.existsSync(frontendEnvPath)) {
  frontendEnvExists = true;
  console.log('Frontend .env.production file exists.');
} else {
  console.error('Frontend .env.production file is missing.');
}

if (fs.existsSync(backendEnvPath)) {
  backendEnvExists = true;
  console.log('Backend .env.production file exists.');
} else {
  console.error('Backend .env.production file is missing.');
}

// Final status
if (missingFiles.length === 0 && missingDeps.length === 0 && frontendEnvExists && backendEnvExists) {
  console.log('\n✅ Deployment verification successful! Your project is ready to deploy.');
} else {
  console.error('\n❌ Deployment verification failed. Please fix the issues above before deploying.');
  process.exit(1);
}
