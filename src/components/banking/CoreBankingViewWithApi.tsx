'use client'
import { useState } from 'react'
import { Banknote, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react'
import { type StatutPret } from '@/lib/core-banking-hub'
import { useCoreBankingHubStrict } from '@/hooks/usePhasesAdStrict'
import {
  ApiErrorState,
  ApiLoadingState,
  ApiPageShell,
} from '@/components/api-ui'
import { formatFcfa } from '@/lib/utils'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { cn } from '@/lib/utils'

const STATUT_PRET: Record<StatutPret, string> = {
  DEMANDE: 'bg-slate-100 text-slate-700',
  APPROUVE: 'bg-emerald-100 text-emerald-800',
  DECAISSE: 'bg-blue-100 text-blue-800',
  EN_COURS: 'bg-teal-100 text-teal-800',
  SOLDE: 'bg-slate-100 text-slate-600',
  IMPAYE: 'bg-red-100 text-red-800',
  RESTRUCTURE: 'bg-purple-100 text-purple-800',
}

const STATUT_ECHEANCE = {
  PAYE: 'bg-emerald-100 text-emerald-800',
  A_VENIR: 'bg-slate-100 text-slate-700',
  RETARD: 'bg-orange-100 text-orange-800',
  IMPAYE: 'bg-red-100 text-red-800',
}

export function CoreBankingViewWithApi() {
  const { hub, state, error, reload } = useCoreBankingHubStrict()
  const [tab, setTab] = useState<'prets' | 'decaissements' | 'echeancier' | 'refinancement'>('prets')

  if (state === 'loading') {
    return (
      <ApiPageShell title="Opérations bancaires" endpoint="GET /operations/core-banking">
        <ApiLoadingState label="Chargement opérations bancaires…" />
      </ApiPageShell>
    )
  }

  if (state === 'error' || !hub) {
    return (
      <ApiPageShell title="Opérations bancaires" endpoint="GET /operations/core-banking" onRefresh={() => void reload()}>
        <ApiErrorState message={error ?? 'Erreur core banking'} onRetry={() => void reload()} />
      </ApiPageShell>
    )
  }

  const k = hub.kpis

  return (
    <ApiPageShell
      title="Opérations bancaires"
      subtitle="Prêts, décaissements, échéancier et refinancement — données backend."
      endpoint="GET /operations/core-banking"
      onRefresh={() => void reload()}
    >
      <ModuleSyntheseIA
        texte={hub.synthese_ia}
        variant="teal"
        titre="Synthèse IA — Opérations bancaires"
      />
      <ModuleKpiGrid
        cols={6}
        items={[
          { label: 'Encours crédit', value: formatFcfa(k.encours_credit_fcfa), highlight: 'teal' },
          { label: 'Décaiss. jour', value: formatFcfa(k.decaissements_jour_fcfa) },
          { label: 'En attente', value: String(k.decaissements_en_attente), highlight: 'orange' },
          { label: 'Échéances jour', value: formatFcfa(k.echeances_jour_fcfa) },
          { label: 'Taux remb.', value: `${k.taux_remboursement_pct}%`, highlight: 'teal' },
          { label: 'Refinancement', value: String(k.refinancement_en_cours) },
        ]}
      />

      <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-2">
        {([
          { id: 'prets' as const, label: 'Prêts actifs', icon: Banknote },
          { id: 'decaissements' as const, label: 'Décaissements', icon: CheckCircle2 },
          { id: 'echeancier' as const, label: 'Échéancier', icon: Calendar },
          { id: 'refinancement' as const, label: 'Refinancement', icon: RefreshCw },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200',
              tab === t.id ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'prets' && (
        <div className="space-y-3">
          {hub.prets.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-300 transition-colors cursor-pointer">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-teal-700">{p.ref}</span>
                    <span className="font-bold text-slate-900">{p.client}</span>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded', STATUT_PRET[p.statut])}>{p.statut}</span>
                    <AiBadge variant="small" confidence={p.score_ia} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{p.produit} · {p.agence} · {p.taux_annuel_pct}% · {p.duree_mois} mois</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Solde restant</div>
                  <div className="text-xl font-black text-slate-900">{formatFcfa(p.solde_restant_fcfa)}</div>
                  <div className="text-xs text-slate-500">Prochaine éch. {p.prochaine_echeance}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'decaissements' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Réf.</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Client</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Canal</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody>
              {hub.decaissements.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-teal-700">{d.ref_pret}</td>
                  <td className="px-4 py-3 font-medium">{d.client}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatFcfa(d.montant_fcfa)}</td>
                  <td className="px-4 py-3">{d.canal}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded', d.statut === 'EXECUTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>{d.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'echeancier' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-4">Échéancier exemple — Prêt DC-2912 (1 000 000 FCFA · 24 %/an)</p>
          <div className="space-y-2">
            {hub.echeancier_exemple.map((e) => (
              <div key={e.numero} className="flex flex-wrap items-center gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold">{e.numero}</span>
                <span className="text-sm text-slate-600 w-28">{e.date_echeance}</span>
                <span className="text-sm">Capital {formatFcfa(e.capital_fcfa)}</span>
                <span className="text-sm text-slate-500">Intérêt {formatFcfa(e.interet_fcfa)}</span>
                <span className="font-bold text-slate-900 ml-auto">{formatFcfa(e.total_fcfa)}</span>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', STATUT_ECHEANCE[e.statut])}>{e.statut}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'refinancement' && (
        <div className="space-y-4">
          {hub.refinancement.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono font-bold text-teal-700">{r.id}</span>
                <span className="font-bold text-slate-900">{r.client}</span>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', r.statut === 'APPROUVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>{r.statut}</span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{r.motif_ia}</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-slate-500">Initial</span><div className="font-bold">{formatFcfa(r.montant_initial_fcfa)}</div></div>
                <div><span className="text-slate-500">Refinancé</span><div className="font-bold text-teal-700">{formatFcfa(r.montant_refinance_fcfa)}</div></div>
                <div><span className="text-slate-500">Économie/mois</span><div className="font-bold text-emerald-700">{formatFcfa(r.economie_mensuelle_fcfa)}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ApiPageShell>
  )
}
