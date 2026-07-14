import type { NextConfig } from 'next'
import path from 'path'

/** Racine du package distributeur (pas le monorepo parent). */
const appRoot = path.resolve(process.cwd())

const nextConfig: NextConfig = {
  basePath: '/distributeur',
  // Évite que Turbopack remonte au package-lock du monorepo parent (prospera-web)
  turbopack: {
    root: appRoot,
  },
  outputFileTracingRoot: appRoot,
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
