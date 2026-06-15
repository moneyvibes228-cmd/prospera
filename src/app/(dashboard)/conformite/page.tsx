'use client'

import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ConformiteView } from '@/components/conformite/ConformiteView'
import { ConformiteDgView } from '@/components/conformite/ConformiteDgView'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'

export default function ConformitePage() {
  const { user } = useAuth()
  const isDg = user?.role === 'MANAGER'

  if (isDg) {
    return (
      <>
        <Suspense>
          <ApiVersionRedirect mockPath="/conformite" />
        </Suspense>
        <ConformiteDgView />
      </>
    )
  }

  return (
    <PageWrapper title="Conformité BCEAO" subtitle="Classification calculée · Provisions · Exports régulateur">
      <Suspense>
        <ApiVersionRedirect mockPath="/conformite" />
      </Suspense>
      <ConformiteView />
    </PageWrapper>
  )
}
