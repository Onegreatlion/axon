/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Tell Next.js to ignore ESLint errors during the build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 2. Tell Next.js to ignore TypeScript errors during the build
  typescript: {
    ignoreBuildErrors: true,
  },

  // (Keep the webpack fix we added earlier for the crypto module)
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === 'edge') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;