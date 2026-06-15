'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useBorrower } from '@/hooks/useBorrowers'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { FicheClientCollecte } from '@/components/collecte/FicheClientCollecte'
import { getDemandesCredit, type DemandeCreditSession } from '@/lib/clients-session'
import { getCollecteHubData } from '@/lib/collecte-agent-hub'

export default function ClientFichePage() {
  const params = useParams()
  const id = params.id as string
  const [demandes, setDemandes] = useState<DemandeCreditSession[]>([])

  const { data: client, isLoading } = useBorrower(id)
  const hubClient = getCollecteHubData().clients.find(c => c.borrowerId === id)

  useEffect(() => {
    setDemandes(getDemandesCredit(id))
  }, [id])

  if (isLoading) return <LoadingSpinner message="Chargement de la fiche..." />

  if (!client) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600 mb-4">Client introuvable.</p>
        <Link href="/clients" className="text-pink-600 font-bold text-sm">Retour à la liste</Link>
      </div>
    )
  }

  return (
    <FicheClientCollecte
      client={client}
      hubClient={hubClient}
      demandes={demandes}
      onDemandeCreated={d => setDemandes(prev => [d, ...prev])}
    />
  )
}
