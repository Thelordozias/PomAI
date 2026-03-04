/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["pdf-parse"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from bundling pdf-parse so __dirname stays correct inside the package
      const existing = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean);
      config.externals = [...existing, "pdf-parse"];
    }
    return config;
  },
};

module.exports = nextConfig;
