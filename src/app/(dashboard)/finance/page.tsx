'use client'
import { useAuth } from '@/contexts/AuthContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DashboardDAF } from '@/components/dashboard/roles/DashboardDAF'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function FinancePage() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <LoadingSpinner message="Chargement Finance & Budget..." />
  }

  return (
    <PageWrapper
      title="Finance & Budget"
      subtitle="Pilotage financier — Trésorerie · Comptabilité · Rentabilité · Contrôle de gestion"
    >
      <DashboardDAF />
    </PageWrapper>
  )
}
