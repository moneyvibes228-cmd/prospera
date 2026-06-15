'use client'

import { useParams, useRouter } from 'next/navigation'
import { getFicheClientMicrofinance } from '@/lib/fiche-client-microfinance'
import { FicheClientMicrofinanceView } from '@/components/credit/FicheClientMicrofinance'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useBorrower } from '@/hooks/useBorrowers'

export default function BorrowerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: borrower, isLoading } = useBorrower(id)
  const fiche = getFicheClientMicrofinance(id)

  if (isLoading && !fiche) {
    return <LoadingSpinner message="Chargement de la fiche client..." />
  }

  if (!fiche && !borrower) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600 mb-4">Emprunteur introuvable.</p>
        <button
          type="button"
          onClick={() => router.push('/emprunteurs')}
          className="text-teal-600 font-bold text-sm hover:text-teal-800"
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  if (fiche) {
    return <FicheClientMicrofinanceView fiche={fiche} />
  }

  return (
    <div className="p-6 text-center text-sm text-slate-500">
      Fiche client indisponible pour cet identifiant.
    </div>
  )
}
