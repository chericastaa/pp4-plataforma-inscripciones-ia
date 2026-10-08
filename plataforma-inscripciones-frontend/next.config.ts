import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["155.181.150.7"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
