import type { NextConfig } from "next";

const allowedOrigins = ["localhost:3000"];
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  allowedOrigins.push(process.env.VERCEL_PROJECT_PRODUCTION_URL);
}
if (process.env.VERCEL_URL) {
  allowedOrigins.push(process.env.VERCEL_URL);
}

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins
    }
  }
};

export default nextConfig;
