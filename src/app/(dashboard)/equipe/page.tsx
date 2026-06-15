'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { EquipeRaBlock } from '@/components/ra/EquipeRaBlock'
import { EquipeDgView } from '@/components/equipe/EquipeDgView'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'

export default function EquipePage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role === 'RESPONSABLE_CREDIT') {
      router.replace('/credit/recouvrement')
    }
  }, [user, router])

  if (user?.role === 'RESPONSABLE_CREDIT') {
    return null
  }

  if (user?.role === 'MANAGER') {
    return (
      <>
        <Suspense>
          <ApiVersionRedirect mockPath="/equipe" />
        </Suspense>
        <EquipeDgView />
      </>
    )
  }

  if (user?.role === 'GESTIONNAIRE') {
    return (
      <PageWrapper title="Équipe & Performance" subtitle="Objectifs, classement — votre agence">
        <Suspense>
          <ApiVersionRedirect mockPath="/equipe" />
        </Suspense>
        <EquipeRaBlock />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Équipe & Performance" subtitle="Classement agents et objectifs">
      <Suspense>
        <ApiVersionRedirect mockPath="/equipe" />
      </Suspense>
      <EquipeDgView />
    </PageWrapper>
  )
}
