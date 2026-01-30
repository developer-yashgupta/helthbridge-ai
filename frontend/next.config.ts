import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  },

  // Configure rewrites for API proxy (optional - for CORS issues)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*', // Proxy to Backend
      },
      {
        source: '/ai-api/:path*',
        destination: 'http://localhost:5000/:path*', // Proxy to AI Engine
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    NEXT_PUBLIC_AI_ENGINE_URL: process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:5000',
  },

  // Image optimization
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
