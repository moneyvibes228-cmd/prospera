'use client'

import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CaisseView } from '@/components/caisse/CaisseView'
import { CaisseDgView } from '@/components/caisse/CaisseDgView'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'
import { AGENCE_RA } from '@/lib/ra-agence-hub'

export default function CaissePage() {
  const { user } = useAuth()
  const isDg = user?.role === 'MANAGER'
  const isRa = user?.role === 'GESTIONNAIRE'

  if (isDg) {
    return (
      <>
        <Suspense>
          <ApiVersionRedirect mockPath="/caisse" />
        </Suspense>
        <CaisseDgView />
      </>
    )
  }

  if (isRa) {
    return (
      <PageWrapper
        title={`Caisse agence — ${AGENCE_RA.nom}`}
        subtitle="Liquidité opérationnelle · Guichet, Mixx By Yas & Flooz"
      >
        <Suspense>
          <ApiVersionRedirect mockPath="/caisse" />
        </Suspense>
        <CaisseView agenceId={AGENCE_RA.id} />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Trésorerie réseau"
      subtitle="Liquidité opérationnelle · Caisse, Mixx By Yas & Flooz"
    >
      <Suspense>
        <ApiVersionRedirect mockPath="/caisse" />
      </Suspense>
      <CaisseView />
    </PageWrapper>
  )
}
