import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Enable experimental features for React 19 and Next.js 15
  experimental: {
    // Enable optimized client-side navigation
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
    // Enable React 19 compiler optimizations (if available in your version)
    // reactCompiler: true, // Uncomment when using canary version
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'urjcavadwlpthjfeuvtk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'urjcavadwlpthjfeuvtk.storage.supabase.co',
        port: '',
        pathname: '/v1/object/public/**',
      },
    ],
    // Enable modern image formats
    formats: ['image/webp', 'image/avif'],
    // Optimize image loading
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    return config;
  },
  
  // Enable compression
  compress: true,
  
  // Optimize static generation
  poweredByHeader: false,
  
  // Enable strict mode for better performance
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default withBundleAnalyzer(nextConfig);
