'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useTransactionStatsMomoStrict } from '@/hooks/usePhasesAdStrict'
import { ApiErrorState, ApiLoadingState } from '@/components/api-ui'
import { phasesAd } from '@/lib/api-phases-ad'
import { formatFcfa } from '@/lib/utils'

export function MomoValidationPanelWithApi() {
  const { data, state, error, reload } = useTransactionStatsMomoStrict()
  const [busy, setBusy] = useState<string | null>(null)

  async function valider(id: string) {
    setBusy(id)
    try {
      await phasesAd.transactions.valider(id)
      await reload()
    } finally {
      setBusy(null)
    }
  }

  async function rejeter(id: string) {
    setBusy(id)
    try {
      await phasesAd.transactions.rejeter(id, { motif: 'Rejet comptable' })
      await reload()
    } finally {
      setBusy(null)
    }
  }

  if (state === 'loading') return <ApiLoadingState label="Chargement MoMo…" />
  if (state === 'error' || !data) {
    return (
      <ApiErrorState message={error ?? 'Erreur stats MoMo'} onRetry={() => void reload()} />
    )
  }

  const recent = (data.transactions_recentes ?? []) as Array<Record<string, unknown>>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-amber-800 uppercase">En attente</p>
          <p className="text-2xl font-black text-amber-900">{data.en_attente}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-emerald-800 uppercase">Validés jour</p>
          <p className="text-2xl font-black">{data.valides_jour}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-red-800 uppercase">Rejetés</p>
          <p className="text-2xl font-black">{data.rejetes_jour}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Montant validé</p>
          <p className="text-lg font-black tabular-nums">{formatFcfa(data.montant_valide_jour_fcfa)}</p>
        </div>
      </div>
      <p className="text-xs text-slate-600">
        {data.libelle} ({data.operateur})
      </p>
      {recent.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2">Réf.</th>
                <th className="text-right p-2">Montant</th>
                <th className="text-left p-2">Statut</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {recent.slice(0, 10).map((t, i) => {
                const id = String(t.id ?? i)
                return (
                  <tr key={id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                    <td className="p-2 font-mono">{String(t.reference ?? id.slice(0, 8))}</td>
                    <td className="p-2 text-right font-semibold tabular-nums">
                      {formatFcfa(Number(t.montant) || 0)}
                    </td>
                    <td className="p-2">{String(t.statut ?? '—')}</td>
                    <td className="p-2 flex gap-1 justify-end">
                      {t.statut === 'EN_ATTENTE' && (
                        <>
                          <button
                            type="button"
                            disabled={busy === id}
                            onClick={() => void valider(id)}
                            className="p-1 rounded bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50"
                            aria-label="Valider"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={busy === id}
                            onClick={() => void rejeter(id)}
                            className="p-1 rounded bg-red-600 text-white cursor-pointer hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                            aria-label="Rejeter"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-6">Aucune transaction MoMo récente</p>
      )}
    </div>
  )
}
