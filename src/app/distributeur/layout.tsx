import type { Metadata } from 'next'
import { AppProviders } from '@distributeur/components/providers/AppProviders'

export const metadata: Metadata = {
  title: {
    default: 'Prospera Distribution',
    template: '%s · Prospera Distribution',
  },
  description: 'Plateforme AI-native de pilotage commercial — Distributeurs Togo',
  applicationName: 'Prospera Distribution',
}

export default function DistributeurLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>
}
