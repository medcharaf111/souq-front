import type { NextConfig } from "next";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.salla.sa" },
      { protocol: "https", hostname: "**.salla.network" },
      { protocol: "https", hostname: "cdn.salla.sa" },
      { protocol: "https", hostname: "salla.sa" },
    ],
  },
  // Proxy /api/* and /install through the frontend's domain to the backend.
  // This makes the backend look same-origin to the browser, so the auth
  // cookie set by the backend is stored on the frontend's domain and
  // automatically sent on subsequent requests.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND}/api/:path*` },
    ];
  },
};

export default nextConfig;
