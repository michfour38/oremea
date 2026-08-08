/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
    serverActions: {
      allowedOrigins: ["oremea.com", "*.oremea.com"],
    },
  },
};

module.exports = nextConfig;