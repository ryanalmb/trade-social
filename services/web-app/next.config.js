/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Compression
  compress: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // Output configuration for Docker
  output: 'standalone',
  
  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/api/trading/:path*',
        destination: `${process.env.TRADING_ENGINE_URL || 'http://localhost:3003'}/api/:path*`,
      },
      {
        source: '/api/telegram/:path*',
        destination: `${process.env.TELEGRAM_BOT_URL || 'http://localhost:3002'}/telegram/:path*`,
      },
    ];
  },
  
  // Health check endpoint
  async redirects() {
    return [
      {
        source: '/health',
        destination: '/api/health',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
