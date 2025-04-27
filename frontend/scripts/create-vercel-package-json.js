/**
 * Script to create a minimal package.json for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('Creating minimal package.json for Vercel...');

// Path to the package.json file
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Read the existing package.json
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error('Error reading package.json:', error.message);
  process.exit(1);
}

// Create a minimal version of the package.json
const minimalPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  private: packageJson.private,
  scripts: {
    dev: "next dev",
    build: "next build",
    start: "next start"
  },
  dependencies: packageJson.dependencies,
  devDependencies: {
    "@types/node": "^20",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "typescript": "5.8.3"
  },
  overrides: {
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "typescript": "5.8.3"
  },
  resolutions: {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0"
  }
};

// Backup the existing package.json
const backupPath = path.join(__dirname, '..', 'package.backup.json');
fs.copyFileSync(packageJsonPath, backupPath);
console.log(`Backed up existing package.json to ${backupPath}`);

// Write the minimal package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(minimalPackageJson, null, 2));
console.log('✓ Created minimal package.json for Vercel');

console.log('Package.json configuration for Vercel completed!');
