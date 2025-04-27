/**
 * Script to prepare the environment for building
 *
 * This script ensures that TypeScript dependencies are properly installed
 * before the Next.js build process starts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing build environment...');

// Create a minimal tsconfig.json if it doesn't exist or is invalid
const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
const minimalTsConfig = {
  compilerOptions: {
    target: 'es5',
    lib: ['dom', 'dom.iterable', 'esnext'],
    allowJs: true,
    skipLibCheck: true,
    strict: false,
    forceConsistentCasingInFileNames: true,
    noEmit: true,
    esModuleInterop: true,
    module: 'esnext',
    moduleResolution: 'node',
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: 'preserve',
    incremental: true,
    plugins: [{ name: 'next' }],
    paths: { '@/*': ['./*'] },
  },
  include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
  exclude: ['node_modules'],
};

try {
  // Try to parse the existing tsconfig.json
  const existingConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
  console.log('Existing tsconfig.json is valid');
} catch (error) {
  // If parsing fails, create a new tsconfig.json
  console.log('Creating minimal tsconfig.json...');
  fs.writeFileSync(tsConfigPath, JSON.stringify(minimalTsConfig, null, 2));
  console.log('Created minimal tsconfig.json');
}

// Create a next-env.d.ts file if it doesn't exist
const nextEnvPath = path.join(__dirname, '..', 'next-env.d.ts');
if (!fs.existsSync(nextEnvPath)) {
  console.log('Creating next-env.d.ts...');
  const nextEnvContent = `/// <reference types="next" />\n/// <reference types="next/types/global" />\n`;
  fs.writeFileSync(nextEnvPath, nextEnvContent);
  console.log('Created next-env.d.ts');
}

// Install TypeScript dependencies
console.log('Installing TypeScript dependencies...');
try {
  execSync(
    'npm install typescript@5.8.3 @types/react@18.2.0 @types/react-dom@18.2.0 --no-save',
    {
      stdio: 'inherit',
    }
  );
  console.log('TypeScript dependencies installed successfully!');
} catch (error) {
  console.error('Error installing TypeScript dependencies:', error.message);
  process.exit(1);
}

// Check if we're in a Vercel environment
if (process.env.VERCEL === '1') {
  // Check if we should use the Vercel-specific next.config.js
  const vercelConfigPath = path.join(__dirname, '..', 'next.config.vercel.js');
  const defaultConfigPath = path.join(__dirname, '..', 'next.config.js');
  const backupConfigPath = path.join(__dirname, '..', 'next.config.backup.js');

  if (fs.existsSync(vercelConfigPath)) {
    console.log('Using Vercel-specific next.config.js...');
    try {
      // Backup the original next.config.js
      if (fs.existsSync(defaultConfigPath)) {
        fs.copyFileSync(defaultConfigPath, backupConfigPath);
        console.log('Backed up original next.config.js');
      }

      // Use the Vercel-specific next.config.js
      fs.copyFileSync(vercelConfigPath, defaultConfigPath);
      console.log('Using Vercel-specific next.config.js');
    } catch (error) {
      console.error(
        'Error switching to Vercel-specific next.config.js:',
        error.message
      );
    }
  }
}

console.log('Build environment prepared successfully!');
