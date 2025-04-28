/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for Render deployment
  transpilePackages: ['thirdweb', 'firebase'],
  webpack: (config) => {
    // Fixes wallet connect dependency issue
    config.externals = [
      ...(config.externals || []),
      'pino-pretty',
      'lokijs',
      'encoding',
      // Add firebase-admin to externals to prevent it from being bundled
      'firebase-admin',
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

  // Use rewrites for API routing based on environment
  async rewrites() {
    // Set production API URL for Render deployment
    let apiUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://authentico-backend.onrender.com'
        : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    // Remove trailing slash if present
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }

    console.log(
      `Using API URL: ${apiUrl} (Environment: ${process.env.NODE_ENV})`
    );

    return [
      // Skip rewrites for Next.js API routes that we want to handle internally
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Default rewrite for all other API routes to the backend
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // Environment variables that will be available in the browser
  env: {
    // Firebase configuration
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

    // ThirdWeb configuration
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,

    // API configuration
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
