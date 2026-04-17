/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... any existing config you might have
  webpack: (config, { nextRuntime }) => {
    // Only apply this rule when building for the Edge (Cloudflare)
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