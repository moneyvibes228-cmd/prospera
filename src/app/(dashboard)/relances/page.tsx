'use client'
import { Suspense } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RelancesView } from '@/components/relances/RelancesView'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'

export default function RelancesPage() {
  return (
    <PageWrapper title="Relances intelligentes" subtitle="Canaux · workflows · promesses de paiement">
      <Suspense>
        <ApiVersionRedirect mockPath="/relances" />
      </Suspense>
      <MockVersionBanner mockPath="/relances" />
      <RelancesView />
    </PageWrapper>
  )
}
