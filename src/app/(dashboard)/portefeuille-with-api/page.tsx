'use client'

import { PageWrapper } from '@/components/layout/PageWrapper'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'
import { GpPortefeuilleDossiersViewWithApi } from '@/components/gp/GpPortefeuilleDossiersViewWithApi'

export default function PortefeuilleGpWithApiPage() {
  return (
    <PageWrapper title="Mon portefeuille crédit" subtitle="Dossiers en gestion — suivi et recouvrement">
      <ApiVersionBanner apiPath="/portefeuille-with-api" />
      <GpPortefeuilleDossiersViewWithApi />
    </PageWrapper>
  )
}
