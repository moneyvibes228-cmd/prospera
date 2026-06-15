'use client'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DashboardROC } from '@/components/dashboard/roles/DashboardROC'
import { CreditRaView } from '@/components/ra/CreditRaView'
import { useAuth } from '@/contexts/AuthContext'

export default function CreditPage() {
  const { user } = useAuth()
  const isRa = user?.role === 'GESTIONNAIRE'

  return (
    <PageWrapper
      title={isRa ? 'Crédit & Opérations — Agence' : 'Pilotage Crédit & Opérations'}
      subtitle={isRa
        ? 'Analyse IA crédit, dossiers, PAR et transactions — périmètre agence'
        : 'Dashboard ROC — Vue stratégique et opérationnelle du portefeuille réseau'}
    >
      {isRa ? <CreditRaView /> : <DashboardROC />}
    </PageWrapper>
  )
}
