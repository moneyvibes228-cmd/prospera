'use client'

import { use } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'
import { DossierCreditFicheViewWithApi } from '@/components/credit/DossierCreditFicheViewWithApi'

export default function DossierCreditDetailWithApiPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <PageWrapper title="Fiche dossier crédit" subtitle="Workflow, actions et rapports">
      <ApiVersionBanner apiPath="/credit/dossiers-with-api" />
      <DossierCreditFicheViewWithApi dossierId={id} />
    </PageWrapper>
  )
}
