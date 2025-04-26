/**
 * Script to prepare for Vercel build
 * 
 * This script ensures that all required dependencies for Vercel deployment
 * are installed before building the Next.js application.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Preparing for Vercel build...');

// Define all required dependencies
const requiredDeps = {
  postcss: [
    'postcss-import',
    'postcss-nesting',
    'tailwindcss-animate'
  ],
  typescript: [
    'typescript',
    '@types/react',
    '@types/react-dom'
  ]
};

// Get package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error('Error reading package.json:', error);
  process.exit(1);
}

// Check if dependencies are already installed
const devDependencies = packageJson.devDependencies || {};
const dependencies = packageJson.dependencies || {};
const missingDeps = [];

// Check all dependency categories
Object.values(requiredDeps).forEach(depCategory => {
  depCategory.forEach(dep => {
    if (!devDependencies[dep] && !dependencies[dep]) {
      missingDeps.push(dep);
    }
  });
});

// Install missing dependencies
if (missingDeps.length > 0) {
  console.log(`Installing missing dependencies: ${missingDeps.join(', ')}`);
  
  try {
    // Install dependencies
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    
    console.log('Dependencies installed successfully!');
  } catch (error) {
    console.error('Error installing dependencies:', error);
    process.exit(1);
  }
} else {
  console.log('All required dependencies are already installed.');
}

console.log('Vercel build preparation completed.');
