'use client'

import { PageWrapper } from '@/components/layout/PageWrapper'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'
import { RecouvrementReseauViewWithApi } from '@/components/recouvrement/RecouvrementReseauViewWithApi'

export default function RecouvrementRocWithApiPage() {
  return (
    <PageWrapper title="Recouvrement réseau" subtitle="Synthèse ROC — données backend">
      <ApiVersionBanner apiPath="/credit/recouvrement-with-api" />
      <RecouvrementReseauViewWithApi />
    </PageWrapper>
  )
}
