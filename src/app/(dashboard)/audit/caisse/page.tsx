'use client'
import { MOCK_AUDIT_HOME } from '@/lib/mockMicrofinance'
import { AuditDetailPage } from '@/components/audit/AuditDetailPage'
import { AuditTabCaisse } from '@/components/dashboard/roles/DashboardAuditeur'

export default function AuditCaissePage() {
  return (
    <AuditDetailPage
      title="Caisse & Comptabilité"
      subtitle="Écarts de caisse · suspens · ajustements inhabituels"
    >
      <AuditTabCaisse d={MOCK_AUDIT_HOME} />
    </AuditDetailPage>
  )
}
