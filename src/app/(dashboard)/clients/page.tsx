'use client'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MesClientsCollecteView } from '@/components/collecte/MesClientsCollecteView'

export default function ClientsPage() {
  return (
    <PageWrapper
      title="Mes clients"
      subtitle="Portefeuille assigné — fiches clients et demandes de crédit"
    >
      <MesClientsCollecteView />
    </PageWrapper>
  )
}
