'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Target, Sparkles } from 'lucide-react'
import {
  EQUIPES_AGENCES_ROC, getEquipeAgenceById, getAnalyseReseauEquipes,
} from '@/lib/roc-equipes-agences'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'

const STATUT_AGENT: Record<string, string> = {
  BON: 'bg-green-100 text-green-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  DEGRADE: 'bg-red-100 text-red-700',
}

const STATUT_AGENCE: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-700',
  TENSION: 'bg-orange-100 text-orange-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  BON: 'bg-green-100 text-green-700',
}

export function RecouvrementEquipesBlock() {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(EQUIPES_AGENCES_ROC[0]?.agence_id ?? '')
  const selected = getEquipeAgenceById(selectedId)

  return (
    <section id="equipes" className="scroll-mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={18} className="text-teal-700" />
        <h2 className="text-base font-black text-slate-900">Équipes par agence</h2>
        <AiBadge variant="small" label="Performance terrain" />
      </div>

      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-purple-700" />
          <span className="text-xs font-bold text-purple-900">Analyse IA réseau — équipes</span>
        </div>
        <p className="text-sm text-purple-900 leading-relaxed">{getAnalyseReseauEquipes()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 space-y-2">
          {EQUIPES_AGENCES_ROC.map(eq => (
            <button
              key={eq.agence_id}
              type="button"
              onClick={() => setSelectedId(eq.agence_id)}
              className={`w-full text-left p-4 rounded-xl border transition-colors duration-200 cursor-pointer ${
                selectedId === eq.agence_id
                  ? 'border-teal-400 bg-teal-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-slate-900">{eq.nom}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUT_AGENCE[eq.statut_agence] ?? 'bg-slate-100'}`}>
                  {eq.statut_agence}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">{eq.nb_agents} agents · PAR 30 {eq.par_30}%</div>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className={`font-bold ${eq.taux_recouvrement_moyen >= 70 ? 'text-green-700' : 'text-red-600'}`}>
                  Tx {eq.taux_recouvrement_moyen}%
                </span>
                <span className="text-teal-700 font-semibold">{formatFcfa(eq.collecte_jour_totale)}/j</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8">
          {selected ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selected.nom}</h3>
                  <p className="text-sm text-slate-500">
                    Resp. {selected.responsable} · Encours {formatFcfa(selected.encours)} · PAR 30 {selected.par_30}%
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${selected.taux_recouvrement_moyen >= 70 ? 'text-green-700' : 'text-red-600'}`}>
                    {selected.taux_recouvrement_moyen}%
                  </div>
                  <div className="text-[10px] text-slate-500">Recouvrement moyen</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={13} className="text-teal-700" />
                  <span className="text-xs font-bold text-slate-800">Analyse IA — {selected.nom}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{selected.analyse_ia_equipe}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                      <th className="text-left px-3 py-2.5 font-bold">Agent</th>
                      <th className="text-center px-2 py-2.5">Visites</th>
                      <th className="text-right px-2 py-2.5">Collecte j</th>
                      <th className="text-center px-2 py-2.5">Tx récouv.</th>
                      <th className="text-center px-2 py-2.5">Statut</th>
                      <th className="px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selected.agents.map(ag => (
                      <tr key={ag.id} className={`hover:bg-slate-50 ${ag.statut === 'DEGRADE' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-slate-900">{ag.nom}</div>
                          <div className="text-[10px] text-slate-400">{ag.role} · {ag.clients_actifs} clients</div>
                        </td>
                        <td className="px-2 py-2.5 text-center text-[11px] font-bold">
                          <span className={ag.visites_jour / ag.visites_obj >= 0.8 ? 'text-green-700' : 'text-red-600'}>
                            {ag.visites_jour}/{ag.visites_obj}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right font-bold text-teal-700 text-xs">{formatFcfa(ag.collecte_jour)}</td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={`font-bold text-[11px] ${ag.taux_recouvrement >= 70 ? 'text-green-700' : 'text-red-700'}`}>
                            {ag.taux_recouvrement}%
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUT_AGENT[ag.statut]}`}>{ag.statut}</span>
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          {ag.lien_recouvrement && (
                            <button
                              type="button"
                              onClick={() => router.push(ag.lien_recouvrement!)}
                              className="text-[10px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                            >
                              Fiche agent →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
