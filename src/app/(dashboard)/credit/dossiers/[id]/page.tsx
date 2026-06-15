'use client'

import { use } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DossierCreditFicheView } from '@/components/credit/DossierCreditFicheView'

export default function DossierCreditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <PageWrapper title="Fiche dossier crédit" subtitle="Workflow, actions et rapports">
      <DossierCreditFicheView dossierId={id} />
    </PageWrapper>
  )
}
