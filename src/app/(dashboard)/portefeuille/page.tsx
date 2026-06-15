'use client'

import { PageWrapper } from '@/components/layout/PageWrapper'
import { GpPortefeuilleDossiersView } from '@/components/gp/GpPortefeuilleDossiersView'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'

export default function PortefeuilleGpPage() {
  return (
    <PageWrapper
      title="Mon portefeuille crédit"
      subtitle="Dossiers en gestion — suivi et recouvrement"
    >
      <ApiVersionRedirect mockPath="/portefeuille" />
      <GpPortefeuilleDossiersView />
    </PageWrapper>
  )
}
