/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Disable canvas for pdfjs-dist
    config.resolve.alias.canvas = false;

    return config;
  },
  // External packages that should not be bundled
  serverExternalPackages: ['@libsql/client'],
};

export default nextConfig;
