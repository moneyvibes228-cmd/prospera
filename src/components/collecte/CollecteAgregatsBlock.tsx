'use client'

import { BarChart3 } from 'lucide-react'
import { useCollecteAgregats } from '@/hooks/usePhasesAd'
import { PhasesAdDataBanner } from '@/components/phases-ad/PhasesAdDataBanner'
import { formatFcfa } from '@/lib/utils'
import type { CollecteAgregatsApi } from '@/types/phases-ad'

export function CollecteAgregatsBlock({ agenceId }: { agenceId?: string }) {
  const { data, source } = useCollecteAgregats(agenceId)
  const c = (data ?? {}) as CollecteAgregatsApi
  const jour = c.jour
  const mois = c.mois

  if (!jour && !mois && source === 'mock') return null

  return (
    <section className="mb-6">
      <PhasesAdDataBanner source={source} endpoint="GET /collecte/agregats" compact />
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={16} className="text-teal-700" />
        <h2 className="text-sm font-bold text-slate-900">Collecte — agrégats</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {jour && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Jour</div>
              <div className="text-xl font-black text-teal-700 mt-1">{formatFcfa(jour.montant_fcfa ?? 0)}</div>
              <div className="text-[10px] text-slate-500">obj. {formatFcfa(jour.objectif_fcfa ?? 0)} · {jour.taux_pct ?? 0}%</div>
            </div>
          </>
        )}
        {mois && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Mois</div>
            <div className="text-xl font-black text-teal-700 mt-1">{formatFcfa(mois.montant_fcfa ?? 0)}</div>
            <div className="text-[10px] text-slate-500">obj. {formatFcfa(mois.objectif_fcfa ?? 0)} · {mois.taux_pct ?? 0}%</div>
          </div>
        )}
      </div>
      {c.synthese_ia && (
        <p className="text-sm text-slate-600 mt-3 p-3 bg-teal-50 border border-teal-100 rounded-lg">{c.synthese_ia}</p>
      )}
    </section>
  )
}
