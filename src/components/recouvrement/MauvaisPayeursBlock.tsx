'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertOctagon, Filter, Sparkles, ChevronRight } from 'lucide-react'
import { MAUVAIS_PAYEURS_ROC } from '@/lib/roc-recouvrement-vue360'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'

function montantRecuperable(montantDu: number, probaPct: number) {
  return Math.round(montantDu * probaPct / 100)
}

export function MauvaisPayeursBlock({
  defaultAgence = 'ALL',
  lockAgence = false,
  title = 'Mauvais payeurs réseau',
  detailFrom,
}: {
  defaultAgence?: string
  lockAgence?: boolean
  title?: string
  detailFrom?: string
}) {
  const router = useRouter()
  const [filtreAgence, setFiltreAgence] = useState(defaultAgence)

  const agences = useMemo(() => {
    const set = new Set(MAUVAIS_PAYEURS_ROC.map(m => m.agence))
    return Array.from(set).sort()
  }, [])

  const filtered = useMemo(() => {
    const list = [...MAUVAIS_PAYEURS_ROC].sort((a, b) => a.rang_reseau - b.rang_reseau)
    if (filtreAgence === 'ALL') return list
    return list.filter(m => m.agence === filtreAgence)
  }, [filtreAgence])

  const totaux = useMemo(() => {
    const montantDu = filtered.reduce((s, m) => s + m.montant_du, 0)
    const recuperable = filtered.reduce((s, m) => s + montantRecuperable(m.montant_du, m.probabilite_remboursement_pct), 0)
    const probaMoy = filtered.length
      ? Math.round(filtered.reduce((s, m) => s + m.probabilite_remboursement_pct, 0) / filtered.length)
      : 0
    return { montantDu, recuperable, probaMoy }
  }, [filtered])

  return (
    <section id="mauvais-payeurs" className="scroll-mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertOctagon size={18} className="text-red-600" />
          <h2 className="text-base font-black text-slate-900">{title}</h2>
          <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{filtered.length}</span>
          <AiBadge variant="small" label="Score IA recouvrement" />
        </div>
        {!lockAgence && (
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-400" />
          <select
            value={filtreAgence}
            onChange={e => setFiltreAgence(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white cursor-pointer"
          >
            <option value="ALL">Toutes agences</option>
            {agences.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-3">
          <div className="text-[10px] font-bold text-red-600 uppercase">Montant dû (filtre)</div>
          <div className="text-lg font-black text-red-700 mt-1">{formatFcfa(totaux.montantDu)}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
          <div className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
            <Sparkles size={11} /> Récupérable estimé IA
          </div>
          <div className="text-lg font-black text-emerald-700 mt-1">{formatFcfa(totaux.recuperable)}</div>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
          <div className="text-[10px] font-bold text-violet-700 uppercase">Probabilité moyenne</div>
          <div className="text-lg font-black text-violet-800 mt-1">{totaux.probaMoy}%</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                <th className="text-left px-4 py-3 font-bold">#</th>
                <th className="text-left px-3 py-3 font-bold">Client</th>
                <th className="text-left px-3 py-3 font-bold">Agence</th>
                <th className="text-left px-3 py-3 font-bold">Agent</th>
                <th className="text-right px-3 py-3 font-bold">Montant dû</th>
                <th className="text-center px-3 py-3 font-bold">Proba. IA</th>
                <th className="text-right px-3 py-3 font-bold">Récup. estimé</th>
                <th className="text-center px-3 py-3 font-bold">Score</th>
                <th className="text-center px-3 py-3 font-bold">Retard</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(m => {
                const recup = montantRecuperable(m.montant_du, m.probabilite_remboursement_pct)
                return (
                  <tr
                    key={m.id}
                    onClick={() => {
                      const q = detailFrom ? `?from=${encodeURIComponent(detailFrom)}` : ''
                      router.push(`/credit/recouvrement/mauvais-payeurs/${m.id}${q}`)
                    }}
                    className="hover:bg-red-50/40 transition-colors duration-200 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-xs font-bold text-slate-400">{m.rang_reseau}</td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-900">{m.nom}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{m.activite}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">{m.agence}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{m.agent}</td>
                    <td className="px-3 py-3 text-right font-black text-red-700">{formatFcfa(m.montant_du)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${
                        m.probabilite_remboursement_pct >= 40 ? 'bg-amber-100 text-amber-800' :
                        m.probabilite_remboursement_pct >= 25 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        <Sparkles size={10} />
                        {m.probabilite_remboursement_pct}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-700">{formatFcfa(recup)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        m.score_recouvrement_ia < 35 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {m.score_recouvrement_ia}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs font-bold text-red-600">{m.retard_j}j</td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] font-bold text-red-700 inline-flex items-center gap-0.5">
                        Fiche <ChevronRight size={11} />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">Aucun mauvais payeur pour cette agence</p>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-2">Cliquez sur une ligne pour ouvrir la fiche IA complète (échanges, causes, actions recommandées)</p>
    </section>
  )
}
