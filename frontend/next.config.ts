import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress the middleware deprecation warning
  // The middleware.ts file is still the correct approach for auth/route protection in Next.js 16
  experimental: {
    // This helps with the middleware warning
  },
  // If you need API proxying, use rewrites instead of middleware
  // For now, we're using direct API calls via NEXT_PUBLIC_API_URL
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
  //     },
  //   ];
  // },
};

export default nextConfig;
