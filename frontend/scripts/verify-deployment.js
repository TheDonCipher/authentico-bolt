/**
 * Frontend Deployment Verification Script
 * 
 * This script verifies that all required files and configurations are in place
 * for a successful deployment of the frontend.
 */

const fs = require('fs');
const path = require('path');

console.log('Verifying frontend deployment configuration...');

// Define paths to check
const requiredFiles = [
  '.env.production',
  'next.config.js',
  'postcss.config.js',
  'tailwind.config.ts',
  'vercel.json',
  'netlify.toml'
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

// Check for PostCSS dependencies in package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error('Error reading package.json:', error);
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

// Check for environment variables in .env.production file
const envPath = path.join(__dirname, '..', '.env.production');

if (fs.existsSync(envPath)) {
  console.log('.env.production file exists.');
} else {
  console.error('.env.production file is missing.');
  console.error('Please create it by copying .env.production.example and filling in your values.');
}

// Final status
if (missingFiles.length === 0 && missingDeps.length === 0 && fs.existsSync(envPath)) {
  console.log('\n✅ Frontend deployment verification successful! Your frontend is ready to deploy.');
} else {
  console.error('\n❌ Frontend deployment verification failed. Please fix the issues above before deploying.');
  process.exit(1);
}
