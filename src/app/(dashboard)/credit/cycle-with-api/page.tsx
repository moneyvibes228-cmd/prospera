'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CreditCycleViewWithApi } from '@/components/credit/CreditCycleViewWithApi'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'
import { useAuth } from '@/contexts/AuthContext'
import { isRaRole } from '@/lib/credit-decisions'
import { resolveRedirectForSession } from '@/lib/api-ui-switch'

export default function CreditCyclePageWithApi() {
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
      <ApiVersionBanner apiPath="/credit/cycle-with-api" />
      <CreditCycleViewWithApi />
    </PageWrapper>
  )
}
