'use client'
import { MOCK_AUDIT_HOME } from '@/lib/mockMicrofinance'
import { AuditDetailPage } from '@/components/audit/AuditDetailPage'
import { AuditTabAnomalies } from '@/components/dashboard/roles/DashboardAuditeur'

export default function AuditAnomaliesPage() {
  return (
    <AuditDetailPage
      title="Fraude & Anomalies"
      subtitle="Détection IA · activités inhabituelles · pics transactions · ops hors-horaires"
    >
      <AuditTabAnomalies d={MOCK_AUDIT_HOME} />
    </AuditDetailPage>
  )
}
