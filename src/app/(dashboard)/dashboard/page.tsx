'use client'
import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/auth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DashboardByRole } from '@/components/dashboard/DashboardByRole'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <LoadingSpinner message="Chargement du tableau de bord..." />
  }

  const roleLabel = ROLE_LABELS[user.role]
  const roleDesc = ROLE_DESCRIPTIONS[user.role]

  return (
    <PageWrapper title={`Bonjour, ${user.nom.split(' ')[0]} 👋`} subtitle={`${roleLabel} · ${roleDesc}`}>
      <Suspense>
        <ApiVersionRedirect mockPath="/dashboard" />
      </Suspense>
      <MockVersionBanner mockPath="/dashboard" />
      <DashboardByRole role={user.role} apiMode={false} />
    </PageWrapper>
  )
}
