/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    serverActions: {
      allowedOrigins: ["oremea.com", "*.oremea.com"],
    },
  },
};

module.exports = nextConfig;
