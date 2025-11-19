import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Suppress the middleware deprecation warning
  // The middleware.ts file is still the correct approach for auth/route protection in Next.js 16
  // Note: clientTraceMetadata experimental feature is automatically enabled by @sentry/nextjs
  // This is safe for production and is used for Sentry performance monitoring
  experimental: {
    // This helps with the middleware warning
  },
  // Allow cross-origin requests in development (Next.js 16+)
  // This fixes the warning: "Cross origin request detected from 127.0.0.1 to /_next/* resource"
  allowedDevOrigins: process.env.NODE_ENV === "development" 
    ? ["127.0.0.1", "localhost", "http://127.0.0.1:3001", "http://localhost:3001"]
    : undefined,
  // Suppress source map warnings in development
  // These warnings are harmless and come from Next.js internal files in node_modules
  productionBrowserSourceMaps: false,
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

// Export with Sentry configuration
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    })
  : nextConfig;
