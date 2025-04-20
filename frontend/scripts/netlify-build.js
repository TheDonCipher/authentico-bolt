/**
 * Script for Netlify build process
 *
 * This script ensures that all required PostCSS dependencies are installed
 * before building the Next.js application for Netlify deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define required PostCSS dependencies
const requiredDeps = [
  'postcss-import',
  'postcss-nesting',
  'tailwindcss-animate',
  'autoprefixer',
  'tailwindcss',
];

console.log('Starting Netlify build process...');
console.log('Checking for required PostCSS dependencies...');

// Verify dependencies are installed
try {
  console.log(`Verifying PostCSS dependencies: ${requiredDeps.join(', ')}`);

  // Check if dependencies are already installed
  const missingDeps = [];
  for (const dep of requiredDeps) {
    try {
      require.resolve(dep);
      console.log(`✓ ${dep} is installed`);
    } catch (e) {
      console.log(`✗ ${dep} is missing, will install`);
      missingDeps.push(dep);
    }
  }

  // Install any missing dependencies
  if (missingDeps.length > 0) {
    console.log(`Installing missing dependencies: ${missingDeps.join(', ')}`);
    execSync(`npm install --save ${missingDeps.join(' ')}`, {
      stdio: 'inherit',
    });
  }

  console.log('PostCSS dependencies verified successfully!');
} catch (error) {
  console.error('Error verifying PostCSS dependencies:', error);
  process.exit(1);
}

// Copy the Netlify-specific PostCSS config
try {
  console.log('Setting up Netlify-specific PostCSS config...');
  fs.copyFileSync(
    path.join(__dirname, '..', 'postcss.config.netlify.js'),
    path.join(__dirname, '..', 'postcss.config.js')
  );
  console.log('PostCSS config set up successfully!');
} catch (error) {
  console.error('Error setting up PostCSS config:', error);
  process.exit(1);
}

// Set default API URL if not provided
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.log('Setting default API URL...');
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080/api';
}

console.log(`Using API URL: ${process.env.NEXT_PUBLIC_API_URL}`);

// Run the Next.js build
try {
  console.log('Building Next.js application...');
  execSync('next build', { stdio: 'inherit' });
  console.log('Next.js build completed successfully!');
} catch (error) {
  console.error('Error building Next.js application:', error);
  process.exit(1);
}

console.log('Netlify build process completed successfully!');
