'use client'
import { MOCK_AUDIT_HOME } from '@/lib/mockMicrofinance'
import { AuditDetailPage } from '@/components/audit/AuditDetailPage'
import { AuditTabConformiteBCEAO } from '@/components/dashboard/roles/DashboardAuditeur'

export default function AuditBceaoPage() {
  return (
    <AuditDetailPage
      title="Conformité BCEAO"
      subtitle="Ratios réglementaires · classes CBI · calendrier reporting"
    >
      <AuditTabConformiteBCEAO d={MOCK_AUDIT_HOME} />
    </AuditDetailPage>
  )
}
