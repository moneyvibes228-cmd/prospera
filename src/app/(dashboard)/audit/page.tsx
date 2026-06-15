'use client'

import { useAuth } from '@/contexts/AuthContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DashboardAuditeur } from '@/components/dashboard/roles/DashboardAuditeur'
import { DafAuditView } from '@/components/finance/DafAuditView'

export default function AuditIndexPage() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <LoadingSpinner message="Chargement du module audit..." />
  }

  if (user.role === 'DAF') {
    return (
      <PageWrapper
        title="Audit financier & conformité"
        subtitle="Clôture · prudentiel BCEAO · trésorerie · budget — pilotage DAF"
      >
        <DafAuditView />
      </PageWrapper>
    )
  }

  if (user.role === 'AUDITEUR') {
    return (
      <PageWrapper
        title="Audit interne"
        subtitle="Fraude · anomalies · contrôle terrain · traçabilité"
      >
        <DashboardAuditeur />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Audit & Conformité" subtitle="Accès non configuré pour ce rôle">
      <p className="text-sm text-slate-600">Ce module est réservé au DAF et à l&apos;auditeur interne.</p>
    </PageWrapper>
  )
}
