'use client'
import { useAuth } from '@/contexts/AuthContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import DashboardCommunication from '@/components/dashboard/roles/DashboardCommunication'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function MarketingPage() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <LoadingSpinner message="Chargement Communication & Marketing..." />
  }

  return (
    <PageWrapper
      title="Communication & Marketing"
      subtitle="Stratégie digitale · Campagnes · Leads · Couverture territoire"
    >
      <DashboardCommunication />
    </PageWrapper>
  )
}
