'use client'
import { useRouter } from 'next/navigation'
import {
  Banknote, FileText, Building2, Activity, ChevronRight, Target, AlertTriangle,
} from 'lucide-react'
import { ROC_SYNTHESE_COMPLEMENT } from '@/lib/roc-synthese-ia'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'

const SUGGESTION_STYLE: Record<string, string> = {
  APPROUVER: 'bg-green-600 text-white',
  APPROUVER_REDUIT: 'bg-teal-600 text-white',
  DEMANDER_GARANTIES: 'bg-orange-600 text-white',
  REFUSER: 'bg-red-600 text-white',
}

const CASH_STYLE: Record<string, string> = {
  NORMAL: 'bg-green-100 text-green-800',
  TENSION: 'bg-orange-100 text-orange-800',
  CRITIQUE: 'bg-red-100 text-red-800',
}

export function SyntheseROCComplement() {
  const router = useRouter()
  const c = ROC_SYNTHESE_COMPLEMENT

  return (
    <div className="space-y-4">
      {/* Recouvrement global */}
      <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
          <Banknote size={16} className="text-teal-700" />
          <h3 className="text-sm font-bold text-teal-900">Recouvrement réseau — stratégie IA</h3>
          <AiBadge variant="small" label="Objectif jour" />
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Taux jour</div>
              <div className={`text-2xl font-black ${c.recouvrement_global.taux_pct < c.recouvrement_global.objectif_pct ? 'text-red-600' : 'text-green-700'}`}>
                {c.recouvrement_global.taux_pct}%
              </div>
              <div className="text-[10px] text-slate-500">obj. {c.recouvrement_global.objectif_pct}%</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Écart</div>
              <div className="text-2xl font-black text-orange-600">{c.recouvrement_global.ecart_pts} pts</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg col-span-2">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Collecté / objectif</div>
              <div className="text-lg font-black text-teal-700">
                {formatFcfa(c.recouvrement_global.collecte_jour_fcfa)} / {formatFcfa(c.recouvrement_global.objectif_jour_fcfa)}
              </div>
              <div className="mt-2 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full"
                  style={{ width: `${c.recouvrement_global.taux_pct}%` }}
                />
              </div>
            </div>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="text-xs font-bold text-purple-900 mb-1 flex items-center gap-1">
              <Target size={12} /> Stratégie IA globale
            </div>
            <p className="text-sm text-purple-900 leading-relaxed">{c.recouvrement_global.strategie_ia}</p>
          </div>
        </div>
      </div>

      {/* Recouvrement par agence */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Building2 size={16} className="text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">Recouvrement & stratégie par agence</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {c.recouvrement_agences.map(ag => (
            <div key={ag.agence_id} className="p-4 hover:bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-bold text-slate-900">{ag.nom}</span>
                <span className={`text-sm font-black ${ag.taux_pct >= ag.objectif_pct ? 'text-green-700' : 'text-red-600'}`}>
                  {ag.taux_pct}%
                </span>
                <span className="text-[10px] text-slate-400">obj. {ag.objectif_pct}%</span>
                <span className="text-xs text-slate-500 ml-auto">Impayés {formatFcfa(ag.impayes_fcfa)}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed border-l-2 border-teal-400 pl-3">
                {ag.strategie_ia}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dossiers à traiter */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-orange-700" />
            <h3 className="text-sm font-bold text-orange-900">Dossiers à traiter — analyse ROC</h3>
            <span className="text-[10px] font-bold bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
              {c.dossiers_a_traiter.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/credit/pipeline')}
            className="text-xs font-bold text-orange-700 hover:text-orange-900"
          >
            Voir pipeline complet →
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {c.dossiers_a_traiter.map(d => (
            <div key={d.reference} className="p-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono font-bold text-slate-400">{d.reference}</span>
                  {d.attente_h >= 48 && (
                    <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse">
                      {d.attente_h}h
                    </span>
                  )}
                  {d.classe_bceao && (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {d.classe_bceao}
                    </span>
                  )}
                </div>
                <div className="font-bold text-slate-900">{d.client}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatFcfa(d.montant)} · {d.etape.replaceAll('_', ' ')}
                  {d.score != null && ` · Score ${d.score}`}
                </div>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">{d.analyse_ia}</p>
                <p className="text-xs font-semibold text-teal-800 mt-1">→ {d.action_suggeree}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 sm:items-end">
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${SUGGESTION_STYLE[d.suggestion_ia]}`}>
                  IA : {d.suggestion_ia.replaceAll('_', ' ')}
                </span>
                <button
                  type="button"
                  onClick={() => router.push(d.lien)}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Ouvrir le dossier <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opérations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Activity size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Opérations réseau</h3>
          <AiBadge variant="small" label="Temps réel" />
        </div>
        <div className="p-4 bg-blue-50/50 border-b border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">{c.operations.resume_global}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {c.operations.agences.map(ag => (
            <div key={ag.agence_id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900">{ag.nom}</span>
                {ag.cash_statut && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${CASH_STYLE[ag.cash_statut]}`}>
                    Cash {ag.cash_statut}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{ag.resume}</p>
              {(ag.incidents ?? 0) > 0 && (
                <p className="text-[10px] text-red-600 font-bold mt-2 flex items-center gap-1">
                  <AlertTriangle size={10} /> {ag.incidents} incident(s)
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => router.push('/credit/reseau')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            Pilotage opérationnel complet →
          </button>
        </div>
      </div>
    </div>
  )
}
