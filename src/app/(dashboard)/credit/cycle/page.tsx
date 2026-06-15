'use client'
import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CreditCycleView } from '@/components/credit/CreditCycleView'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'
import { useAuth } from '@/contexts/AuthContext'
import { isRaRole } from '@/lib/credit-decisions'
import { resolveRedirectForSession } from '@/lib/api-ui-switch'

export default function CreditCyclePage() {
  const router = useRouter()
  const { user, sessionSource } = useAuth()

  useEffect(() => {
    if (isRaRole(user?.role)) {
      router.replace(resolveRedirectForSession('/credit/pipeline', sessionSource ?? 'mock'))
    }
  }, [user?.role, router, sessionSource])

  if (isRaRole(user?.role)) {
    return null
  }

  return (
    <PageWrapper title="Cycle de vie prêt" subtitle="Demande → décaissement → échéancier">
      <Suspense>
        <ApiVersionRedirect mockPath="/credit/cycle" />
      </Suspense>
      <MockVersionBanner mockPath="/credit/cycle" />
      <CreditCycleView />
    </PageWrapper>
  )
}
