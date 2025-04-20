/**
 * Script to install PostCSS dependencies required for build
 * 
 * This script ensures that all required PostCSS dependencies are installed
 * before building the frontend application.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define required PostCSS dependencies
const requiredDeps = [
  'postcss-import',
  'postcss-nesting',
  'tailwindcss-animate'
];

console.log('Checking for required PostCSS dependencies...');

// Get frontend package.json
const frontendPackageJsonPath = path.join(__dirname, '..', 'frontend', 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(frontendPackageJsonPath, 'utf8'));
} catch (error) {
  console.error('Error reading frontend package.json:', error);
  process.exit(1);
}

// Check if dependencies are already installed
const devDependencies = packageJson.devDependencies || {};
const dependencies = packageJson.dependencies || {};
const missingDeps = [];

requiredDeps.forEach(dep => {
  if (!devDependencies[dep] && !dependencies[dep]) {
    missingDeps.push(dep);
  }
});

// Install missing dependencies
if (missingDeps.length > 0) {
  console.log(`Installing missing dependencies: ${missingDeps.join(', ')}`);
  
  try {
    // Change to frontend directory
    process.chdir(path.join(__dirname, '..', 'frontend'));
    
    // Install dependencies
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    
    console.log('Dependencies installed successfully!');
  } catch (error) {
    console.error('Error installing dependencies:', error);
    process.exit(1);
  }
} else {
  console.log('All required PostCSS dependencies are already installed.');
}

console.log('PostCSS dependency check completed.');
