'use client'

import Link from 'next/link'
import { Trophy, ChevronRight } from 'lucide-react'
import { useKpiAgents } from '@/hooks/usePhasesAd'
import { PhasesAdDataBanner } from '@/components/phases-ad/PhasesAdDataBanner'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import { AGENTS_DG } from '@/lib/dg-vue360'
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

export function EquipeKpisApiTable({ agenceId }: { agenceId?: string }) {
  const { data, source } = useKpiAgents(agenceId)
  const rows =
    source === 'api' && data && data.length > 0
      ? mapApiToRows(data)
      : AGENTS_DG.map((a) => ({
          id: a.id,
          rang: a.rang,
          nom: a.nom,
          agence: a.agence,
          score: a.score,
          collecte: a.collecte,
          recouvrement: a.recouvrement,
          par: a.par,
          badge: a.badge,
        }))

  return (
    <>
      <PhasesAdDataBanner source={source} endpoint="GET /kpis/agents" compact />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Trophy size={16} className="text-yellow-600" />
          <h2 className="text-sm font-bold text-slate-900">Performance agents réseau</h2>
          <AiBadge variant="small" label="Analyse IA" />
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
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-black text-slate-400">#{a.rang}</td>
                  <td className="px-2 py-3">
                    <div className="font-bold text-slate-900">{a.nom}</div>
                    {a.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${BADGE_STYLE[a.badge]}`}
                      >
                        {a.badge}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-500">{a.agence}</td>
                  <td className="px-2 py-3 text-center font-black text-teal-700">{a.score}</td>
                  <td className="px-2 py-3 text-right font-bold text-slate-800">{formatFcfa(a.collecte)}</td>
                  <td className="px-2 py-3 text-center font-bold text-green-700">{a.recouvrement}%</td>
                  <td className="px-2 py-3 text-center">
                    <span
                      className={`font-bold ${a.par > 10 ? 'text-red-600' : a.par > 8 ? 'text-orange-600' : 'text-slate-700'}`}
                    >
                      {a.par}%
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/terrain?agent=${a.id}`}
                      className="text-teal-600 hover:text-teal-800 flex items-center gap-0.5 text-xs font-bold"
                    >
                      Voir <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
