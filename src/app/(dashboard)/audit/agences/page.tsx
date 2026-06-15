'use client'
import { MOCK_AUDIT_HOME } from '@/lib/mockMicrofinance'
import { AuditDetailPage } from '@/components/audit/AuditDetailPage'
import { AuditTabAgences } from '@/components/dashboard/roles/DashboardAuditeur'

export default function AuditAgencesPage() {
  return (
    <AuditDetailPage
      title="Audit agences"
      subtitle="Conformité par site · incidents · statuts CRITIQUE / ALERTE"
    >
      <AuditTabAgences d={MOCK_AUDIT_HOME} />
    </AuditDetailPage>
  )
}
