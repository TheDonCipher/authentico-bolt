/** @type {import('next').NextConfig} */
const nextConfig = {
  // fixes wallet connect dependency issue https://docs.walletconnect.com/web3modal/nextjs/about#extra-configuration
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${(process.env.BACKEND_URL && process.env.BACKEND_URL !== 'undefined') ? process.env.BACKEND_URL : 'http://localhost:4000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
