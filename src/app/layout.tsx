import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/providers/AppProviders'

export const metadata: Metadata = {
  title: {
    default: 'Prospera',
    template: '%s · Prospera',
  },
  description: 'Plateforme microfinance — pilotage commercial et crédit',
  applicationName: 'Prospera',
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
