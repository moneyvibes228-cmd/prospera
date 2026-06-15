'use client'

import { useParams } from 'next/navigation'
import { getFicheClientMicrofinance } from '@/lib/fiche-client-microfinance'
import { FicheClientMicrofinanceView } from '@/components/credit/FicheClientMicrofinance'

export default function ClientRisqueDetailPage() {
  const params = useParams()
  const fiche = getFicheClientMicrofinance(params.id as string)

  if (!fiche) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-slate-600 font-medium">Client introuvable.</p>
        <p className="text-sm text-slate-400 mt-1">Identifiant : {String(params.id)}</p>
      </div>
    )
  }

  return <FicheClientMicrofinanceView fiche={fiche} />
}
