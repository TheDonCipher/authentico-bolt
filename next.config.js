/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes and server-side rendering
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },

  // Use rewrites for API routing based on environment
  async rewrites() {
    // Default API URL for local development
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    // Remove trailing slash if present
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }

    // Force local API URL in development
    if (process.env.NODE_ENV === 'development') {
      apiUrl = 'http://localhost:8080';
    }

    console.log(`Using API URL: ${apiUrl}`);

    return [
      // Explicitly handle the verify route
      {
        source: '/api/verify/:docId',
        destination: '/api/verify/:docId',
      },
      // Default rewrite for all other API routes to the backend
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
