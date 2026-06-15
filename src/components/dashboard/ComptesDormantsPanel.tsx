'use client'
import { useRouter } from 'next/navigation'
import { MoonStar, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react'
import { CONTROLE_INTERNE } from '@/lib/mockMicrofinance'
import { ANALYSE_COMPTES_DORMANTS } from '@/lib/operationnel-vue360'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from './AiBadge'

export function ComptesDormantsPanel() {
  const router = useRouter()
  const { comptes_dormants } = CONTROLE_INTERNE
  const analyse = ANALYSE_COMPTES_DORMANTS

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <MoonStar size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Comptes dormants</h3>
        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{comptes_dormants.total}</span>
        <AiBadge variant="small" label="Analyse IA détaillée" />
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-baseline gap-4 flex-wrap">
          <div>
            <div className="text-3xl font-black text-indigo-700">{comptes_dormants.total}</div>
            <div className="text-xs text-slate-500">Encours total : {formatFcfa(comptes_dormants.encours_total)}</div>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">Opportunité réactivation estimée : </span>
            <span className="font-bold text-green-700">{formatFcfa(analyse.opportunite_reactivation_fcfa)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {comptes_dormants.repartition.map((r, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-700">{r.tranche}</div>
              <div className="text-lg font-black text-indigo-700">{r.count}</div>
              <div className="text-[10px] text-slate-500">{formatFcfa(r.encours)}</div>
              <div className="mt-2 bg-slate-200 rounded-full h-1.5">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(r.count / comptes_dormants.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} className="text-indigo-600" />
            <span className="text-sm font-bold text-indigo-900">Synthèse IA — Comptes dormants</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{analyse.synthese}</p>
          <ul className="space-y-1.5 mb-4">
            {analyse.constats.map((c, i) => (
              <li key={i} className="text-xs text-slate-600 flex gap-2">
                <span className="text-indigo-500 font-bold shrink-0">•</span>{c}
              </li>
            ))}
          </ul>
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Segmentation & stratégies</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            {analyse.segmentation.map(s => (
              <div key={s.segment} className="p-2.5 bg-white/80 rounded-lg border border-indigo-100 text-xs">
                <div className="font-bold text-indigo-800">{s.segment}</div>
                <div className="text-slate-600">{s.count} comptes · {formatFcfa(s.encours)}</div>
                <div className="text-indigo-700 mt-1 font-medium">{s.strategie}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Plan d&apos;action priorisé</div>
          <div className="space-y-2">
            {analyse.plan_action.map(p => (
              <div key={p.priorite} className="flex gap-3 p-2.5 bg-white rounded-lg border border-indigo-100 text-xs">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">{p.priorite}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800">{p.action}</div>
                  <div className="text-slate-500">Cible : {p.cible}</div>
                  <div className="text-green-700 font-semibold mt-0.5">{p.impact_estime} · {p.delai}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-orange-800 mt-3 flex items-start gap-1.5 bg-orange-50 p-2 rounded-lg border border-orange-100">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            {analyse.risque_provision}
          </p>
        </div>

        <div>
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">Exemples prioritaires — cliquer pour fiche</div>
          <div className="space-y-1.5">
            {analyse.exemples_prioritaires.map(ex => (
              <button
                key={ex.id}
                type="button"
                onClick={() => ex.client_id && router.push(`/dashboard/operationnel/clients/${ex.client_id}`)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-left transition-colors group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-800">{ex.client}</div>
                  <div className="text-[10px] text-slate-500">{ex.agence} · {ex.secteur} · inactif {ex.mois_inactif} mois</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-indigo-700">{formatFcfa(ex.solde)}</span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
