'use client'

import { PageWrapper } from '@/components/layout/PageWrapper'
import { DossiersCreditListView } from '@/components/credit/DossiersCreditListView'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'

export default function DossiersCreditPage() {
  return (
    <PageWrapper
      title="Dossiers crédit"
      subtitle="Demandes, instruction et décisions crédit"
    >
      <ApiVersionRedirect mockPath="/credit/dossiers" />
      <DossiersCreditListView />
    </PageWrapper>
  )
}
