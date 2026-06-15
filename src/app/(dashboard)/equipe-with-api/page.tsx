'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useAuth } from '@/contexts/AuthContext'
import { EquipeRaBlockWithApi } from '@/components/ra/EquipeRaBlockWithApi'
import { EquipeKpisApiTableWithApi } from '@/components/equipe/EquipeKpisApiTableWithApi'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'

export default function EquipePageWithApi() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role === 'RESPONSABLE_CREDIT') {
      router.replace('/credit/recouvrement-with-api')
    }
  }, [user, router])

  if (user?.role === 'RESPONSABLE_CREDIT') {
    return null
  }

  if (user?.role === 'GESTIONNAIRE') {
    return (
      <PageWrapper title="Équipe & Performance" subtitle="Objectifs et classement des agents">
        <ApiVersionBanner apiPath="/equipe-with-api" />
        <EquipeRaBlockWithApi />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Équipe & Performance" subtitle="Classement et performance des agents">
      <ApiVersionBanner apiPath="/equipe-with-api" />
      <EquipeKpisApiTableWithApi />
    </PageWrapper>
  )
}
