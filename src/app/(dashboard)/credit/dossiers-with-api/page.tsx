'use client'

import { PageWrapper } from '@/components/layout/PageWrapper'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'
import { DossiersCreditListViewWithApi } from '@/components/credit/DossiersCreditListViewWithApi'

export default function DossiersCreditWithApiPage() {
  return (
    <PageWrapper title="Dossiers crédit" subtitle="Processus Phase 2 — données backend">
      <ApiVersionBanner apiPath="/credit/dossiers-with-api" />
      <DossiersCreditListViewWithApi />
    </PageWrapper>
  )
}
