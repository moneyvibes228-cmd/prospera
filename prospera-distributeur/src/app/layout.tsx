import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/providers/AppProviders'

export const metadata: Metadata = {
  title: { default: 'Prospera Distribution', template: '%s · Prospera Distribution' },
  description: 'Plateforme AI-native de pilotage commercial — Distributeurs Togo',
  applicationName: 'Prospera Distribution',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-slate-50 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
