'use client'
import { Sparkles, Smartphone, Building2, Users, AlertTriangle, TrendingDown } from 'lucide-react'
import {
  ANALYSE_COMPORTEMENT_AGENCES,
  SYNTHESE_IA_COMPORTEMENT_RESEAU,
  type AnalyseComportementAgence,
} from '@/lib/dc-vue360'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from './AiBadge'

const RECO_STYLE: Record<AnalyseComportementAgence['recommandation'], { label: string; bg: string; text: string }> = {
  MAINTENIR:           { label: 'Maintenir effectifs', bg: 'bg-green-100', text: 'text-green-800' },
  REDUIRE_EFFECTIFS:   { label: 'Réduire effectifs', bg: 'bg-orange-100', text: 'text-orange-800' },
  ETUDIER_FERMETURE:   { label: 'Étudier fermeture / relais', bg: 'bg-red-100', text: 'text-red-800' },
  DIGITALISER:         { label: 'Accélérer digital', bg: 'bg-blue-100', text: 'text-blue-800' },
}

export function AnalyseComportementAgencesIA() {
  const sorted = [...ANALYSE_COMPORTEMENT_AGENCES].sort(
    (a, b) => b.pct_operations_mobile_money - a.pct_operations_mobile_money,
  )

  return (
    <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-blue-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900">Analyse IA — Comportement clients par agence</h3>
          <AiBadge variant="small" label="MoMo vs visite physique" />
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-700 leading-relaxed">{SYNTHESE_IA_COMPORTEMENT_RESEAU.paragraphe}</p>
          <ul className="mt-3 space-y-1.5">
            {SYNTHESE_IA_COMPORTEMENT_RESEAU.recommandations_globales.map((r, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-teal-600 font-bold shrink-0">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          {sorted.map(ag => {
            const reco = RECO_STYLE[ag.recommandation]
            return (
              <div key={ag.agence_id} className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-500" />
                    <span className="text-sm font-bold text-slate-900">{ag.agence}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${reco.bg} ${reco.text}`}>{reco.label}</span>
                  </div>
                  {ag.economie_potentielle_fcfa && (
                    <span className="text-xs font-bold text-green-700">
                      Économie pot. {formatFcfa(ag.economie_potentielle_fcfa)}/mois
                    </span>
                  )}
                </div>
                <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg bg-teal-50 border border-teal-100">
                        <div className="flex items-center gap-1 text-[10px] text-teal-700 font-bold uppercase mb-1">
                          <Smartphone size={11} /> Mobile money
                        </div>
                        <div className="text-2xl font-black text-teal-800">{ag.pct_operations_mobile_money}%</div>
                        <div className="text-[10px] text-teal-600">{ag.retraits_momo_mois} retraits MoMo/mois</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold uppercase mb-1">
                          <Building2 size={11} /> Visite agence
                        </div>
                        <div className="text-2xl font-black text-slate-800">{ag.pct_visites_physiques}%</div>
                        <div className="text-[10px] text-slate-500">{ag.operations_agence_mois} opérations guichet/mois</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Users size={12} className="text-slate-400" />
                      <span className="text-slate-600">Caissières :</span>
                      <span className="font-bold text-slate-800">{ag.caissieres_actuelles}</span>
                      {ag.caissieres_recommandees < ag.caissieres_actuelles && (
                        <>
                          <TrendingDown size={12} className="text-orange-500" />
                          <span className="font-bold text-orange-700">→ {ag.caissieres_recommandees} recommandé</span>
                        </>
                      )}
                      {ag.caissieres_recommandees === ag.caissieres_actuelles && (
                        <span className="text-green-600 font-semibold">(niveau adapté)</span>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Motifs de visite en agence</div>
                    <div className="space-y-1.5">
                      {ag.motifs_visite_agence.map(m => (
                        <div key={m.motif}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-slate-700 truncate pr-2">{m.motif}</span>
                            <span className="font-bold text-slate-800 shrink-0">{m.pct}%</span>
                          </div>
                          <div className="bg-slate-100 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-teal-500" style={{ width: `${m.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                      <AlertTriangle size={11} className="text-teal-600" /> Lecture IA
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{ag.synthese_ia}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
