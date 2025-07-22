import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper handling of TypeScript files
  typescript: {
    // Don't fail builds on type errors for now
    ignoreBuildErrors: false,
  },
  // Configure webpack to handle module resolution better
  webpack: (config, { dev, isServer }) => {
    // Handle file extensions properly
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.jsx': ['.tsx', '.jsx'],
    };
    
    // Ensure CSS handling doesn't interfere
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
  // Output configuration for containerized deployments
  output: 'standalone',
};

export default nextConfig;
