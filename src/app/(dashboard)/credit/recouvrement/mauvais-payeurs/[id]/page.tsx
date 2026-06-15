'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getFicheForMauvaisPayeur, getMauvaisPayeurMeta } from '@/lib/mauvais-payeur-fiche'
import { FicheClientMicrofinanceView } from '@/components/credit/FicheClientMicrofinance'

export default function MauvaisPayeurDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mpId = params.id as string
  const fiche = getFicheForMauvaisPayeur(mpId)
  const meta = getMauvaisPayeurMeta(mpId)

  const backHref = searchParams.get('from') ?? '/credit/recouvrement#mauvais-payeurs'
  const backLabel = backHref.startsWith('/credit/mauvais-payeurs')
    ? 'Retour mauvais payeurs agence'
    : backHref.includes('recouvrement')
      ? 'Retour recouvrement'
      : 'Retour'

  if (!fiche) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Mauvais payeur introuvable.</p>
        <button type="button" onClick={() => router.back()} className="text-teal-600 text-sm mt-2 cursor-pointer">
          ← Retour
        </button>
      </div>
    )
  }

  return (
    <FicheClientMicrofinanceView
      fiche={fiche}
      backHref={backHref}
      backLabel={backLabel}
      mauvaisPayeurBadge={meta ? `#${meta.rang_reseau} réseau` : undefined}
    />
  )
}
