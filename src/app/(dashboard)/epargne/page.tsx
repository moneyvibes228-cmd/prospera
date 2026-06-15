'use client'

import { useAuth } from '@/contexts/AuthContext'
import { EpargneDgView } from '@/components/epargne/EpargneDgView'
import { EpargneView } from '@/components/epargne/EpargneView'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { resolveAgenceNomFromZone } from '@/lib/epargne-hub'

export default function EpargnePage() {
  const { user } = useAuth()
  const isDg = user?.role === 'MANAGER'
  const agenceNom = resolveAgenceNomFromZone(user?.zone)

  if (isDg) {
    return <EpargneDgView />
  }

  return (
    <PageWrapper
      title="Épargne opérationnelle"
      subtitle={
        agenceNom
          ? `Agence ${agenceNom} · Comptes · Produits · Mouvements · Tontines`
          : 'Comptes · Produits · Mouvements · Tontines · Analyse IA'
      }
    >
      <EpargneView />
    </PageWrapper>
  )
}
