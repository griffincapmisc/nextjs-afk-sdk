import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // REQUIRED for Docker deployment -- bundles all dependencies into .next/standalone
  output: 'standalone',
};

export default nextConfig;
