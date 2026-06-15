'use client'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/auth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DashboardByRole } from '@/components/dashboard/DashboardByRole'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'

export default function DashboardPageWithApi() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <LoadingSpinner message="Chargement du tableau de bord…" />
  }

  const roleLabel = ROLE_LABELS[user.role]
  const roleDesc = ROLE_DESCRIPTIONS[user.role]

  return (
    <PageWrapper title={`Bonjour, ${user.nom.split(' ')[0]} 👋`} subtitle={`${roleLabel} · ${roleDesc}`}>
      <ApiVersionBanner apiPath="/dashboard-with-api" />
      <DashboardByRole role={user.role} apiMode />
    </PageWrapper>
  )
}
