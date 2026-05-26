import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow next/image to load Salla product images regardless of which CDN/host they come from.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.salla.sa" },
      { protocol: "https", hostname: "**.salla.network" },
      { protocol: "https", hostname: "cdn.salla.sa" },
      { protocol: "https", hostname: "salla.sa" },
    ],
  },
};

export default nextConfig;
