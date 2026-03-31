import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabled for Leaflet compatibility
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
