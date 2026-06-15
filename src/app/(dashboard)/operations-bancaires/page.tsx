'use client'

import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CoreBankingView } from '@/components/banking/CoreBankingView'
import { CoreBankingDgView } from '@/components/banking/CoreBankingDgView'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'

export default function OperationsBancairesPage() {
  const { user } = useAuth()
  const isDg = user?.role === 'MANAGER'

  if (isDg) {
    return (
      <>
        <Suspense>
          <ApiVersionRedirect mockPath="/operations-bancaires" />
        </Suspense>
        <CoreBankingDgView />
      </>
    )
  }

  return (
    <PageWrapper title="Opérations bancaires" subtitle="Prêts · décaissements · échéancier">
      <Suspense>
        <ApiVersionRedirect mockPath="/operations-bancaires" />
      </Suspense>
      <MockVersionBanner mockPath="/operations-bancaires" />
      <CoreBankingView />
    </PageWrapper>
  )
}
