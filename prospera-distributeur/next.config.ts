import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: '/distributeur',
  reactStrictMode: true,
  devIndicators: false,
  // Autorise la navigation RSC / _next depuis un tunnel ngrok en dev
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok.io',
    '*.ngrok.app',
  ],
}

export default nextConfig
