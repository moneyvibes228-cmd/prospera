'use client'

import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { OngletCreditDEC } from '@/components/dashboard/onglets/OngletCreditDEC'
import { RisqueDgView } from '@/components/risque/RisqueDgView'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'

export default function RisquePage() {
  const { user } = useAuth()
  const isDg = user?.role === 'MANAGER'

  if (isDg) {
    return (
      <>
        <Suspense>
          <ApiVersionRedirect mockPath="/risque" />
        </Suspense>
        <RisqueDgView />
      </>
    )
  }

  return (
    <PageWrapper title="PAR & Risque" subtitle="Pilotage crédit — indicateurs opérationnels">
      <Suspense>
        <ApiVersionRedirect mockPath="/risque" />
      </Suspense>
      <OngletCreditDEC />
    </PageWrapper>
  )
}
