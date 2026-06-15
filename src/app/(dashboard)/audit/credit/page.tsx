'use client'
import { MOCK_AUDIT_HOME } from '@/lib/mockMicrofinance'
import { AuditDetailPage } from '@/components/audit/AuditDetailPage'
import { AuditTabControleCredit } from '@/components/dashboard/roles/DashboardAuditeur'

export default function AuditCreditPage() {
  return (
    <AuditDetailPage
      title="Contrôle crédit"
      subtitle="Dossiers incomplets · concentration portefeuille · validations irrégulières"
    >
      <AuditTabControleCredit d={MOCK_AUDIT_HOME} />
    </AuditDetailPage>
  )
}
