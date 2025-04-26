/**
 * Script to deploy to Vercel
 * 
 * This script prepares the application for deployment to Vercel
 * and provides instructions for deployment.
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
  cyan: '\x1b[36m',
};

console.log(
  `${colors.bright}${colors.cyan}=== Authentico Vercel Deployment Preparation ===${colors.reset}\n`
);

// Step 1: Verify environment files
console.log(
  `${colors.yellow}Step 1: Verifying environment files...${colors.reset}`
);

const envProdPath = path.join(__dirname, '..', '.env.production');
const envLocalPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envProdPath)) {
  console.error(
    `${colors.red}Error: .env.production file not found${colors.reset}`
  );
  process.exit(1);
}

if (!fs.existsSync(envLocalPath)) {
  console.error(
    `${colors.red}Error: .env.local file not found${colors.reset}`
  );
  process.exit(1);
}

// Check if API URL is set to production
const envProdContent = fs.readFileSync(envProdPath, 'utf8');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

if (!envProdContent.includes('NEXT_PUBLIC_API_URL=https://') || 
    !envLocalContent.includes('NEXT_PUBLIC_API_URL=https://')) {
  console.warn(
    `${colors.yellow}Warning: NEXT_PUBLIC_API_URL is not set to a production URL in one of the environment files${colors.reset}`
  );
  console.log(
    'Make sure your .env.production and .env.local files have the correct API URL for production.'
  );
}

console.log(`${colors.green}✓ Environment files verified${colors.reset}\n`);

// Step 2: Run deploy fixes
console.log(
  `${colors.yellow}Step 2: Running deployment fixes...${colors.reset}`
);
try {
  execSync('npm run deploy:fixes', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log(`${colors.green}✓ Deployment fixes applied${colors.reset}\n`);
} catch (error) {
  console.error(
    `${colors.red}Error applying deployment fixes: ${error.message}${colors.reset}`
  );
  process.exit(1);
}

// Step 3: Verify vercel.json
console.log(`${colors.yellow}Step 3: Verifying vercel.json...${colors.reset}`);
const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
if (!fs.existsSync(vercelJsonPath)) {
  console.error(
    `${colors.red}Error: vercel.json file not found${colors.reset}`
  );
  process.exit(1);
}

console.log(`${colors.green}✓ vercel.json verified${colors.reset}\n`);

// Step 4: Deployment instructions
console.log(
  `${colors.bright}${colors.cyan}=== Vercel Deployment Instructions ===${colors.reset}\n`
);
console.log(`${colors.bright}To deploy to Vercel:${colors.reset}`);
console.log(`1. Push your changes to GitHub`);
console.log(`2. Go to your Vercel dashboard`);
console.log(`3. Select your project and deploy the latest changes`);
console.log(`4. Make sure the following environment variables are set in Vercel:`);
console.log(`   - NODE_ENV=production`);
console.log(`   - NEXT_PUBLIC_THIRDWEB_CLIENT_ID`);
console.log(`   - NEXT_PUBLIC_FIREBASE_API_KEY`);
console.log(`   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`);
console.log(`   - NEXT_PUBLIC_FIREBASE_PROJECT_ID`);
console.log(`   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`);
console.log(`   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`);
console.log(`   - NEXT_PUBLIC_FIREBASE_APP_ID`);
console.log(`   - NEXT_PUBLIC_API_URL=https://authentico-backend.onrender.com/api`);
console.log(`   - FIREBASE_PROJECT_ID`);
console.log(`   - FIREBASE_CLIENT_EMAIL`);
console.log(`   - FIREBASE_PRIVATE_KEY (with escaped newlines)`);
console.log(`\n5. Verify that the build command in vercel.json is set to:`);
console.log(`   "buildCommand": "npm run deploy:fixes && npm run build"`);

console.log(
  `\n${colors.bright}${colors.green}Vercel deployment preparation complete!${colors.reset}`
);
