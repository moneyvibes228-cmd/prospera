import type { NextConfig } from "next";

const apiProxyTarget =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") || "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Autorise la navigation RSC / _next depuis un tunnel ngrok en dev
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
  ],
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    // Même origine que le front → API joignable via ngrok (évite localhost:3001 côté client)
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
