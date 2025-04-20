/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable font optimization
  optimizeFonts: true,
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

    // Fix for PostCSS plugins issue
    const oneOfRule = config.module.rules.find(
      (rule) => typeof rule.oneOf === 'object'
    );
    if (oneOfRule) {
      const cssModuleRules = oneOfRule.oneOf.filter(
        (rule) => rule.test && rule.test.toString().includes('css')
      );
      if (cssModuleRules.length > 0) {
        cssModuleRules.forEach((rule) => {
          if (rule.use && Array.isArray(rule.use)) {
            const postcssLoader = rule.use.find(
              (loader) =>
                loader.loader && loader.loader.includes('postcss-loader')
            );
            if (
              postcssLoader &&
              postcssLoader.options &&
              postcssLoader.options.postcssOptions
            ) {
              postcssLoader.options.postcssOptions.config = false;
              postcssLoader.options.postcssOptions.plugins = [
                'postcss-import',
                'tailwindcss/nesting',
                'tailwindcss',
                'autoprefixer',
              ];
            }
          }
        });
      }
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  // Use rewrites for API routing based on environment
  async rewrites() {
    // Default API URL for local development
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

    console.log(`Using API URL: ${apiUrl}`);

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
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
