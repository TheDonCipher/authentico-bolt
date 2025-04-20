/**
 * Deployment script for fixing document viewing issues
 * This script prepares the application for deployment with the necessary fixes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== Authentico Document Viewing Fix Deployment ===${colors.reset}\n`);

// Step 1: Verify environment variables
console.log(`${colors.yellow}Step 1: Verifying environment variables...${colors.reset}`);

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error(`${colors.red}Error: .env file not found in frontend directory${colors.reset}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('NEXT_PUBLIC_API_URL=https://')) {
  console.warn(`${colors.yellow}Warning: NEXT_PUBLIC_API_URL is not set to a production URL${colors.reset}`);
  console.log('Make sure your .env file has the correct API URL for production.');
}

console.log(`${colors.green}✓ Environment variables verified${colors.reset}\n`);

// Step 2: Install dependencies
console.log(`${colors.yellow}Step 2: Installing dependencies...${colors.reset}`);
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log(`${colors.green}✓ Dependencies installed${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}Error installing dependencies: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 3: Install PostCSS dependencies
console.log(`${colors.yellow}Step 3: Installing PostCSS dependencies...${colors.reset}`);
try {
  execSync('npm run install:postcss-deps', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log(`${colors.green}✓ PostCSS dependencies installed${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}Error installing PostCSS dependencies: ${error.message}${colors.reset}`);
  console.log('Attempting to install them directly...');
  try {
    execSync('npm install postcss-import postcss-nesting tailwindcss-animate', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..') 
    });
    console.log(`${colors.green}✓ PostCSS dependencies installed directly${colors.reset}\n`);
  } catch (directError) {
    console.error(`${colors.red}Failed to install PostCSS dependencies: ${directError.message}${colors.reset}`);
    process.exit(1);
  }
}

// Step 4: Build the application
console.log(`${colors.yellow}Step 4: Building the application...${colors.reset}`);
try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log(`${colors.green}✓ Application built successfully${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}Error building the application: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 5: Verify the build
console.log(`${colors.yellow}Step 5: Verifying the build...${colors.reset}`);
const buildDir = path.join(__dirname, '..', '.next');
if (!fs.existsSync(buildDir)) {
  console.error(`${colors.red}Error: Build directory (.next) not found${colors.reset}`);
  process.exit(1);
}
console.log(`${colors.green}✓ Build verified${colors.reset}\n`);

// Step 6: Deployment instructions
console.log(`${colors.bright}${colors.cyan}=== Deployment Instructions ===${colors.reset}\n`);
console.log(`${colors.bright}To deploy to Vercel:${colors.reset}`);
console.log(`1. Push your changes to GitHub`);
console.log(`2. Go to your Vercel dashboard`);
console.log(`3. Select your project and deploy the latest changes`);
console.log(`4. Verify that the NEXT_PUBLIC_API_URL environment variable is set correctly in Vercel\n`);

console.log(`${colors.bright}To test locally:${colors.reset}`);
console.log(`1. Run: npm run start`);
console.log(`2. Open: http://localhost:3000\n`);

console.log(`${colors.bright}${colors.green}Deployment preparation complete!${colors.reset}`);
