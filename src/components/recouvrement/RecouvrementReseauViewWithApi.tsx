'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Target,
  Sparkles,
  TrendingDown,
  MapPin,
  UserX,
  CheckCircle2,
  BarChart3,
  Zap,
  AlertOctagon,
  Building2,
} from 'lucide-react'
import {
  ApiErrorState,
  ApiLoadingState,
  ApiPageShell,
  ApiSection,
  ApiStatGrid,
} from '@/components/api-ui'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import { useRecouvrementReseauStrict } from '@/hooks/usePhasesAdStrict'

const STATUT_AGENT: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-800 border-red-200',
  DEGRADE: 'bg-red-100 text-red-800 border-red-200',
  VIGILANCE: 'bg-orange-100 text-orange-800 border-orange-200',
}

const STATUT_AGENCE: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-700',
  TENSION: 'bg-orange-100 text-orange-700',
  OK: 'bg-blue-100 text-blue-700',
  EXCELLENT: 'bg-emerald-100 text-emerald-700',
}

export function RecouvrementReseauViewWithApi() {
  const router = useRouter()
  const { hub, state, error, reload } = useRecouvrementReseauStrict()

  const kpiItems = useMemo(() => {
    if (!hub) return []
    const { kpis } = hub
    return [
      {
        label: 'Taux jour',
        value: `${kpis.taux_atteint_pct}%`,
        tone:
          kpis.taux_atteint_pct < 60
            ? ('danger' as const)
            : kpis.taux_atteint_pct < 75
              ? ('warning' as const)
              : ('success' as const),
        hint: `${kpis.ecart_pts} pts vs objectif`,
      },
      { label: 'Collecté', value: formatFcfa(kpis.collecte_jour_fcfa).replace(' FCFA', ''), hint: 'FCFA' },
      {
        label: 'Non visités',
        value: String(kpis.clients_non_visites),
        tone: 'warning' as const,
        hint: `${kpis.clients_visites}/${kpis.clients_prevus} visites`,
      },
      { label: 'Promesses', value: String(kpis.promesses_count), hint: formatFcfa(kpis.promesses_montant) },
      { label: 'Honorées 7j', value: `${kpis.promesses_honorees_pct}%`, tone: 'success' as const },
      {
        label: 'Impayés top 6',
        value: formatFcfa(kpis.impayes_reseau_fcfa).replace(' FCFA', ''),
        tone: 'danger' as const,
        hint: 'FCFA',
      },
    ]
  }, [hub])

  const agencesImpayes = useMemo(
    () => (hub ? [...hub.agences].sort((a, b) => b.impayes_fcfa - a.impayes_fcfa) : []),
    [hub],
  )

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [])

  if (state === 'loading') {
    return (
      <ApiPageShell
        title="Recouvrement réseau"
        subtitle="Synthèse stratégique ROC et pilotage réseau."
        endpoint="GET /recouvrement/reseau"
      >
        <ApiLoadingState label="Chargement du recouvrement réseau…" />
      </ApiPageShell>
    )
  }

  if (state === 'error' || !hub) {
    return (
      <ApiPageShell
        title="Recouvrement réseau"
        endpoint="GET /recouvrement/reseau"
        onRefresh={() => void reload()}
      >
        <ApiErrorState message={error ?? 'Erreur recouvrement'} onRetry={() => void reload()} />
      </ApiPageShell>
    )
  }

  return (
    <ApiPageShell
      title="Recouvrement réseau"
      subtitle="Synthèse stratégique, équipes par agence, mauvais payeurs et plan d'action ROC — données backend."
      endpoint="GET /recouvrement/reseau"
      onRefresh={() => void reload()}
    >
      <ApiSection title="Synthèse IA recouvrement" description="Analyse Prospera AI">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-teal-700" />
          <AiBadge variant="small" label="Prospera AI" pulse />
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{hub.synthese_ia}</p>
      </ApiSection>

      <ApiStatGrid items={kpiItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={15} className="text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">{hub.methode_actuelle.titre}</h3>
          </div>
          <p className="text-xs text-slate-600 mb-3">{hub.methode_actuelle.description}</p>
          <ul className="space-y-1.5">
            {hub.methode_actuelle.points.map((p, i) => (
              <li key={i} className="text-[11px] text-slate-600 flex gap-2">
                <span className="text-slate-400">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-red-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={15} className="text-orange-600" />
            <h3 className="text-sm font-bold text-orange-900">{hub.rendu_actuel.titre}</h3>
          </div>
          <p className="text-xs text-orange-800 mb-3 font-semibold">{hub.rendu_actuel.description}</p>
          <ul className="space-y-1.5">
            {hub.rendu_actuel.points.map((p, i) => (
              <li key={i} className="text-[11px] text-orange-900 flex gap-2">
                <span className="text-orange-500">▸</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50 to-emerald-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-teal-700" />
            <h3 className="text-sm font-bold text-teal-900">{hub.methode_suggeree.titre}</h3>
            <AiBadge variant="small" label="IA" />
          </div>
          <p className="text-xs text-teal-800 mb-3">{hub.methode_suggeree.description}</p>
          <ul className="space-y-1.5">
            {hub.methode_suggeree.points.map((p, i) => (
              <li key={i} className="text-[11px] text-teal-900 flex gap-2">
                <CheckCircle2 size={11} className="text-teal-600 shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ApiSection
        id="mauvais-payeurs"
        title="Impayés réseau par agence"
        description={`Total réseau ${formatFcfa(hub.kpis.impayes_reseau_fcfa)}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 -mx-1">
          {agencesImpayes.map((ag) => (
            <div
              key={ag.agence_id}
              className="rounded-xl border border-red-100 bg-red-50/30 p-4 hover:border-red-200 transition-colors duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon size={14} className="text-red-600" />
                <span className="font-bold text-slate-900">{ag.nom}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUT_AGENCE[ag.statut] ?? STATUT_AGENCE.OK}`}>
                  {ag.statut}
                </span>
              </div>
              <div className="text-xl font-black text-red-700">{formatFcfa(ag.impayes_fcfa)}</div>
              <div className="text-[11px] text-slate-600 mt-1">
                Taux {ag.taux_pct}% · {ag.nb_agents} agents · collecte j {formatFcfa(ag.collecte_jour_fcfa)}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{ag.strategie_ia}</p>
            </div>
          ))}
        </div>
      </ApiSection>

      <ApiSection title="Agents terrain en souci" description={`${hub.agents_en_souci.length} agent(s) identifié(s)`}>
        <div className="divide-y divide-slate-100 -mx-5 sm:-mx-6">
          {hub.agents_en_souci.map((a) => (
            <div
              key={a.id}
              className={`px-5 sm:px-6 py-5 hover:bg-slate-50 transition-colors duration-200 cursor-pointer ${
                a.statut === 'CRITIQUE' ? 'bg-red-50/20' : ''
              }`}
              onClick={() => router.push(`/credit/recouvrement/agents/${a.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/credit/recouvrement/agents/${a.id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{a.nom}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${STATUT_AGENT[a.statut] ?? STATUT_AGENT.VIGILANCE}`}
                    >
                      {a.statut}
                    </span>
                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-0.5">
                      <MapPin size={10} />
                      {a.zone}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    <span>
                      Tx{' '}
                      <strong className={a.taux_recouvrement < 55 ? 'text-red-600' : 'text-orange-600'}>
                        {a.taux_recouvrement}%
                      </strong>
                    </span>
                    <span>
                      Visites{' '}
                      <strong>
                        {a.visites_jour}/{a.visites_obj}
                      </strong>
                    </span>
                    <span>
                      Collecte j <strong className="text-teal-700">{formatFcfa(a.collecte_jour)}</strong>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    document.getElementById('equipes')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-100 cursor-pointer transition-colors duration-200"
                >
                  Voir équipe agence ↓
                </button>
              </div>
              <p className="text-[11px] text-slate-600">{a.diagnostic_ia}</p>
            </div>
          ))}
        </div>
      </ApiSection>

      <ApiSection title="Recouvrement par agence" description="Vue rapide multi-agences">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 -mx-1">
          {hub.agences.map((ag) => (
            <div
              key={ag.agence_id}
              className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:border-teal-200 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900">{ag.nom}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUT_AGENCE[ag.statut] ?? STATUT_AGENCE.OK}`}
                >
                  {ag.statut}
                </span>
              </div>
              <div className={`text-2xl font-black ${ag.taux_pct < 60 ? 'text-red-600' : 'text-teal-700'}`}>
                {ag.taux_pct}%
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Impayés <strong className="text-red-600">{formatFcfa(ag.impayes_fcfa)}</strong> · {ag.nb_agents}{' '}
                agents
              </div>
            </div>
          ))}
        </div>
      </ApiSection>

      <ApiSection
        id="equipes"
        title="Équipes par agence"
        description={`${hub.agences.length} agence(s) — performance recouvrement`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 -mx-1">
          {hub.agences.map((ag) => (
            <div key={ag.agence_id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-teal-700" />
                  <h3 className="font-bold text-slate-900">{ag.nom}</h3>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUT_AGENCE[ag.statut] ?? STATUT_AGENCE.OK}`}>
                  {ag.statut}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Taux recouv.</div>
                  <div className={`text-lg font-black ${ag.taux_pct < 60 ? 'text-red-600' : 'text-teal-700'}`}>
                    {ag.taux_pct}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Équipe moy.</div>
                  <div className="text-lg font-black text-slate-800">{ag.taux_equipe_moyen}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Agents</div>
                  <div className="text-lg font-black text-slate-800">{ag.nb_agents}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Collecte j</div>
                  <div className="text-lg font-black text-teal-700">{formatFcfa(ag.collecte_jour_fcfa)}</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 p-2.5 bg-teal-50 rounded-lg border border-teal-100">
                {ag.strategie_ia}
              </p>
            </div>
          ))}
        </div>
      </ApiSection>

      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-amber-400" />
          <h3 className="text-sm font-bold">Plan stratégique — semaine en cours</h3>
        </div>
        <div className="space-y-3">
          {hub.plan_strategique.map((p) => (
            <div
              key={p.priorite}
              className="flex flex-wrap items-start gap-3 bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-900 text-xs font-black flex items-center justify-center shrink-0">
                {p.priorite}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{p.action}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-400">
                  <span>{p.responsable}</span>
                  <span>·</span>
                  <span>{p.delai}</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-bold">{p.impact_estime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ApiPageShell>
  )
}
