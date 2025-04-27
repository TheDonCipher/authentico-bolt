/**
 * Script specifically for Vercel build environment
 * 
 * This script ensures that TypeScript dependencies are properly installed
 * before the Next.js build process starts in the Vercel environment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel-specific build process...');

// Function to install TypeScript dependencies with error handling
function installTypescriptDependencies() {
  console.log('Installing TypeScript dependencies for Vercel...');
  
  try {
    // Install TypeScript and React types with specific versions
    execSync(
      'npm install --save-dev typescript@5.8.3 @types/react@18.2.0 @types/react-dom@18.2.0',
      { stdio: 'inherit' }
    );
    console.log('TypeScript dependencies installed successfully!');
    return true;
  } catch (error) {
    console.error('Error installing TypeScript dependencies:', error.message);
    
    // Try individual installations
    console.log('Attempting individual package installations...');
    try {
      execSync('npm install --save-dev typescript@5.8.3', { stdio: 'inherit' });
      execSync('npm install --save-dev @types/react@18.2.0', { stdio: 'inherit' });
      execSync('npm install --save-dev @types/react-dom@18.2.0', { stdio: 'inherit' });
      console.log('Individual TypeScript dependencies installed successfully!');
      return true;
    } catch (individualError) {
      console.error('Individual installations failed:', individualError.message);
      return false;
    }
  }
}

// Function to verify TypeScript configuration
function verifyTsConfig() {
  const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
  
  if (fs.existsSync(tsConfigPath)) {
    console.log('tsconfig.json exists, verifying content...');
    try {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
      console.log('tsconfig.json is valid JSON');
      return true;
    } catch (error) {
      console.error('Error parsing tsconfig.json:', error.message);
      return false;
    }
  } else {
    console.error('tsconfig.json not found!');
    return false;
  }
}

// Main execution
async function main() {
  // Step 1: Install TypeScript dependencies
  const depsInstalled = installTypescriptDependencies();
  if (!depsInstalled) {
    console.error('Failed to install TypeScript dependencies');
    process.exit(1);
  }
  
  // Step 2: Verify TypeScript configuration
  const tsConfigValid = verifyTsConfig();
  if (!tsConfigValid) {
    console.error('TypeScript configuration is invalid');
    process.exit(1);
  }
  
  // Step 3: Run the prepare-vercel-build script
  console.log('Running prepare-vercel-build script...');
  try {
    execSync('node scripts/prepare-vercel-build.js', { stdio: 'inherit' });
    console.log('prepare-vercel-build completed successfully');
  } catch (error) {
    console.error('Error running prepare-vercel-build:', error.message);
    process.exit(1);
  }
  
  console.log('Vercel build preparation completed successfully!');
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error in vercel-build.js:', error);
  process.exit(1);
});
