'use client'
import { MOCK_AUDIT_HOME } from '@/lib/mockMicrofinance'
import { AuditDetailPage } from '@/components/audit/AuditDetailPage'
import { AuditTabTracabilite } from '@/components/dashboard/roles/DashboardAuditeur'

export default function AuditTracabilitePage() {
  return (
    <AuditDetailPage
      title="Traçabilité"
      subtitle="Journal d'audit infalsifiable — utilisateur · action · IP · horodatage"
    >
      <AuditTabTracabilite d={MOCK_AUDIT_HOME} />
    </AuditDetailPage>
  )
}
