'use client'

import Link from 'next/link'
import { Trophy, ChevronRight } from 'lucide-react'
import { useKpiAgentsStrict } from '@/hooks/usePhasesAdStrict'
import {
  ApiEmptyState,
  ApiErrorState,
  ApiLoadingState,
  ApiPageShell,
} from '@/components/api-ui'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import type { KpiAgentApi } from '@/types/phases-ad'

function mapApiToRows(agents: KpiAgentApi[]) {
  const sorted = [...agents].sort(
    (a, b) => (b.taux_objectif_collecte_semaine_pct ?? 0) - (a.taux_objectif_collecte_semaine_pct ?? 0),
  )
  return sorted.map((a, i) => ({
    id: a.agent_id,
    rang: i + 1,
    nom: a.prenom ? `${a.prenom} ${a.nom}` : a.nom,
    agence: '—',
    score: Math.round(a.taux_objectif_collecte_semaine_pct ?? 0),
    collecte: a.collecte_semaine_fcfa ?? 0,
    recouvrement: Math.round(a.taux_visites_semaine_pct ?? 0),
    par: 0,
    badge: i === 0 ? 'OR' : i === 1 ? 'ARGENT' : i === 2 ? 'BRONZE' : undefined,
  }))
}

const BADGE_STYLE: Record<string, string> = {
  OR: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  ARGENT: 'bg-slate-200 text-slate-600 border-slate-300',
  BRONZE: 'bg-orange-100 text-orange-700 border-orange-300',
}

export function EquipeKpisApiTableWithApi({ agenceId }: { agenceId?: string }) {
  const { data, state, error, reload } = useKpiAgentsStrict(agenceId)
  const rows = data?.length ? mapApiToRows(data) : []

  if (state === 'loading') {
    return (
      <ApiPageShell title="Performance agents" endpoint="GET /kpis/agents">
        <ApiLoadingState label="Chargement KPI agents…" />
      </ApiPageShell>
    )
  }

  if (state === 'error') {
    return (
      <ApiPageShell title="Performance agents" endpoint="GET /kpis/agents" onRefresh={() => void reload()}>
        <ApiErrorState message={error ?? 'Erreur KPI agents'} onRetry={() => void reload()} />
      </ApiPageShell>
    )
  }

  return (
    <ApiPageShell
      title="Performance agents réseau"
      subtitle="Classement et KPIs collecte par agent."
      endpoint="GET /kpis/agents"
      onRefresh={() => void reload()}
    >
      {rows.length === 0 ? (
        <ApiEmptyState title="Aucun agent" description="La liste KPI agents est vide." />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-600" />
            <h2 className="text-sm font-bold text-slate-900">Classement agents</h2>
            <AiBadge variant="small" label="Temps réel" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                  <th className="text-left px-4 py-3 font-bold">Rang</th>
                  <th className="text-left px-2 py-3 font-bold">Agent</th>
                  <th className="text-left px-2 py-3 font-bold">Agence</th>
                  <th className="text-center px-2 py-3 font-bold">Score</th>
                  <th className="text-right px-2 py-3 font-bold">Collecte</th>
                  <th className="text-center px-2 py-3 font-bold">Recouv.</th>
                  <th className="text-center px-2 py-3 font-bold">PAR</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors duration-200">
                    <td className="px-4 py-3 font-black text-slate-400">{a.rang}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{a.nom}</span>
                        {a.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${BADGE_STYLE[a.badge]}`}
                          >
                            {a.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-500">{a.agence}</td>
                    <td className="px-2 py-3 text-center">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded ${
                          a.score >= 80
                            ? 'bg-emerald-100 text-emerald-700'
                            : a.score >= 60
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {a.score}%
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right font-bold text-teal-700 tabular-nums">
                      {formatFcfa(a.collecte)}
                    </td>
                    <td className="px-2 py-3 text-center text-xs font-bold">{a.recouvrement}%</td>
                    <td className="px-2 py-3 text-center text-xs">{a.par}%</td>
                    <td className="px-2 py-3">
                      <Link
                        href={`/dashboard/agents/${a.id}`}
                        className="text-teal-600 hover:text-teal-800 cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ApiPageShell>
  )
}
