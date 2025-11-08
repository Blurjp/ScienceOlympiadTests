/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;

    // better-sqlite3 should only be loaded on the server
    if (isServer) {
      config.externals.push('better-sqlite3');
    }

    return config;
  },
  // Enable server components features
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
