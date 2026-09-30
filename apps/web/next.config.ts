import type { NextConfig } from "next";

const apiOrigin = process.env.API_ORIGIN || 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      {
        source: '/api/files/:path*',
        destination: `${apiOrigin}/api/v1/files/:path*`,
      },
    ];
  },
};

export default nextConfig;
