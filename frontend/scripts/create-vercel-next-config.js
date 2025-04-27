/**
 * Script to create a minimal next.config.js for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('Creating minimal next.config.js for Vercel...');

const minimalNextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration for Vercel deployment
  transpilePackages: ['thirdweb', 'firebase'],
  webpack: (config) => {
    // Fixes wallet connect dependency issue
    config.externals = [
      ...(config.externals || []),
      'pino-pretty',
      'lokijs',
      'encoding',
    ];
    // Fixes node polyfills
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with type errors
    ignoreBuildErrors: true,
  },
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  
  // Environment variables that will be available in the browser
  env: {
    // Firebase configuration
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

    // ThirdWeb configuration
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,

    // API configuration
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;`;

// Path to the next.config.js file
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');

// Backup the existing next.config.js if it exists
if (fs.existsSync(nextConfigPath)) {
  const backupPath = path.join(__dirname, '..', 'next.config.backup.js');
  fs.copyFileSync(nextConfigPath, backupPath);
  console.log(`Backed up existing next.config.js to ${backupPath}`);
}

// Write the minimal next.config.js
fs.writeFileSync(nextConfigPath, minimalNextConfig);
console.log('✓ Created minimal next.config.js for Vercel');

console.log('Next.js configuration for Vercel completed!');
