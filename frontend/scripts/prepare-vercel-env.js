/**
 * Simple script to prepare the Vercel environment
 */

const fs = require('fs');
const path = require('path');

console.log('Preparing Vercel environment...');

// Copy the Vercel-specific tsconfig.json
const vercelTsConfigPath = path.join(__dirname, '..', 'tsconfig.vercel.json');
const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');

if (fs.existsSync(vercelTsConfigPath)) {
  console.log('Using Vercel-specific tsconfig.json...');
  try {
    fs.copyFileSync(vercelTsConfigPath, tsConfigPath);
    console.log('✓ Vercel-specific tsconfig.json applied');
  } catch (error) {
    console.error('Error applying Vercel-specific tsconfig.json:', error.message);
  }
}

// Create a .npmrc file with specific settings for Vercel
const npmrcPath = path.join(__dirname, '..', '.npmrc');
const npmrcContent = `
# Vercel-specific npm configuration
legacy-peer-deps=true
strict-peer-dependencies=false
auto-install-peers=true
engine-strict=false
save-exact=true
`;

try {
  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log('✓ Vercel-specific .npmrc created');
} catch (error) {
  console.error('Error creating Vercel-specific .npmrc:', error.message);
}

console.log('Vercel environment preparation completed!');
