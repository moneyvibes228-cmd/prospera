import type { NextConfig } from "next";

const apiProxyTarget =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") || "http://127.0.0.1:3001";

const distributeurUrl = process.env.DISTRIBUTEUR_URL?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Autorise la navigation RSC / _next depuis un tunnel ngrok en dev
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
  ],
  async rewrites() {
    const rules: {
      source: string;
      destination: string;
      basePath?: false;
    }[] = [];

    // Même origine que le front → API joignable via ngrok (évite localhost:3001 côté client)
    if (process.env.NODE_ENV === "development") {
      rules.push({
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
        basePath: false,
      });
    }

    // Multi-zones : proxy /distributeur → projet Vercel secondaire
    if (distributeurUrl) {
      rules.push(
        {
          source: "/distributeur",
          destination: `${distributeurUrl}/distributeur`,
          basePath: false,
        },
        {
          source: "/distributeur/:path*",
          destination: `${distributeurUrl}/distributeur/:path*`,
          basePath: false,
        },
      );
    }

    return rules;
  },
};

export default nextConfig;
