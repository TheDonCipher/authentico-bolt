/**
 * Simplified build script for standalone Vercel deployment
 *
 * This script ensures TypeScript dependencies are properly installed
 * before building the Next.js application on Vercel.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting standalone Vercel build process...');

// Install TypeScript dependencies
console.log('Installing TypeScript dependencies...');
try {
  execSync(
    'npm install --save-dev typescript@5.8.3 @types/react@18.2.0 @types/react-dom@18.2.0',
    {
      stdio: 'inherit',
    }
  );
  console.log('TypeScript dependencies installed successfully!');
} catch (error) {
  console.error('Error installing TypeScript dependencies:', error.message);
  console.log('Attempting individual installations...');

  try {
    execSync('npm install --save-dev typescript@5.8.3', { stdio: 'inherit' });
    execSync('npm install --save-dev @types/react@18.2.0', {
      stdio: 'inherit',
    });
    execSync('npm install --save-dev @types/react-dom@18.2.0', {
      stdio: 'inherit',
    });
    console.log('Individual TypeScript dependencies installed successfully!');
  } catch (individualError) {
    console.error(
      'Failed to install TypeScript dependencies:',
      individualError.message
    );
    process.exit(1);
  }
}

// Create a package-lock.json file if it doesn't exist
const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
if (!fs.existsSync(packageLockPath)) {
  console.log('Creating package-lock.json...');
  try {
    execSync('npm install --package-lock-only', { stdio: 'inherit' });
    console.log('package-lock.json created successfully!');
  } catch (error) {
    console.error('Error creating package-lock.json:', error.message);
    // Continue anyway, as this is not critical
  }
}

// Check if we should use the Vercel-specific configuration files
const vercelConfigPath = path.join(__dirname, '..', 'next.config.vercel.js');
const defaultConfigPath = path.join(__dirname, '..', 'next.config.js');
const backupConfigPath = path.join(__dirname, '..', 'next.config.backup.js');

const vercelPackagePath = path.join(__dirname, '..', 'package.vercel.json');
const defaultPackagePath = path.join(__dirname, '..', 'package.json');
const backupPackagePath = path.join(__dirname, '..', 'package.backup.json');

// Backup and use Vercel-specific configuration files
console.log('Setting up Vercel-specific configuration files...');

// Handle next.config.js
if (fs.existsSync(vercelConfigPath) && fs.existsSync(defaultConfigPath)) {
  console.log('Using Vercel-specific next.config.js...');
  try {
    fs.copyFileSync(defaultConfigPath, backupConfigPath);
    fs.copyFileSync(vercelConfigPath, defaultConfigPath);
    console.log('✓ Vercel-specific next.config.js applied');
  } catch (error) {
    console.error(
      'Error switching to Vercel-specific next.config.js:',
      error.message
    );
    // Continue anyway, as we'll use the existing config
  }
}

// Handle package.json
if (fs.existsSync(vercelPackagePath) && fs.existsSync(defaultPackagePath)) {
  console.log('Using Vercel-specific package.json...');
  try {
    fs.copyFileSync(defaultPackagePath, backupPackagePath);
    fs.copyFileSync(vercelPackagePath, defaultPackagePath);
    console.log('✓ Vercel-specific package.json applied');

    // Regenerate package-lock.json with the new package.json
    console.log('Regenerating package-lock.json...');
    try {
      execSync('npm install --package-lock-only', { stdio: 'inherit' });
      console.log('✓ package-lock.json regenerated');
    } catch (lockError) {
      console.error('Error regenerating package-lock.json:', lockError.message);
      // Continue anyway, as this is not critical
    }
  } catch (error) {
    console.error(
      'Error switching to Vercel-specific package.json:',
      error.message
    );
    // Continue anyway, as we'll use the existing config
  }
}

// Run the Next.js build
console.log('Building Next.js application...');
try {
  execSync('next build', { stdio: 'inherit' });
  console.log('Next.js build completed successfully!');
} catch (error) {
  console.error('Error building Next.js application:', error.message);
  process.exit(1);
}

// Restore original configuration files
console.log('Restoring original configuration files...');

// Restore next.config.js
if (fs.existsSync(backupConfigPath)) {
  console.log('Restoring original next.config.js...');
  try {
    fs.copyFileSync(backupConfigPath, defaultConfigPath);
    fs.unlinkSync(backupConfigPath);
    console.log('✓ Original next.config.js restored');
  } catch (error) {
    console.error('Error restoring original next.config.js:', error.message);
    // Continue anyway, as this is not critical
  }
}

// Restore package.json
if (fs.existsSync(backupPackagePath)) {
  console.log('Restoring original package.json...');
  try {
    fs.copyFileSync(backupPackagePath, defaultPackagePath);
    fs.unlinkSync(backupPackagePath);
    console.log('✓ Original package.json restored');
  } catch (error) {
    console.error('Error restoring original package.json:', error.message);
    // Continue anyway, as this is not critical
  }
}

console.log('Standalone Vercel build process completed successfully!');
