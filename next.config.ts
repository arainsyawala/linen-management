import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.devtunnels.ms", "localhost:3000"]
    }
  }
};

export default nextConfig;
