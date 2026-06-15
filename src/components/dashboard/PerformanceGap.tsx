'use client'
import type { AgentPerformance } from '@/types'

const SEED_PERF: AgentPerformance[] = [
  {
    agentId: '1', agentNom: 'Kofi Amavi', zone: 'Lomé Centre',
    visites_mois: 48, visites_objectif: 50, montant_collecte: 8_250_000,
    montant_objectif: 8_500_000, taux_recouvrement: 96.2,
    nouveaux_prospects: 12, taux_conversion: 0.75,
    score_performance: 96.2, classement: 1, badge: 'OR'
  },
  {
    agentId: '2', agentNom: 'Akua Lawson', zone: 'Adidogomé',
    visites_mois: 41, visites_objectif: 50, montant_collecte: 7_100_000,
    montant_objectif: 8_500_000, taux_recouvrement: 84.1,
    nouveaux_prospects: 8, taux_conversion: 0.62,
    score_performance: 84.1, classement: 3, badge: 'BRONZE'
  },
  {
    agentId: '3', agentNom: 'Edem Kpélim', zone: 'Bè Kpota',
    visites_mois: 44, visites_objectif: 50, montant_collecte: 7_700_000,
    montant_objectif: 8_500_000, taux_recouvrement: 88.4,
    nouveaux_prospects: 10, taux_conversion: 0.70,
    score_performance: 88.4, classement: 2, badge: 'ARGENT'
  },
]

interface PerformanceGapProps {
  data?: AgentPerformance[]
}

const badgeColors: Record<string, string> = {
  OR: 'bg-yellow-100 text-yellow-700',
  ARGENT: 'bg-slate-100 text-slate-600',
  BRONZE: 'bg-orange-100 text-orange-700',
}

export function PerformanceGap({ data }: PerformanceGapProps) {
  const agents = data && data.length > 0 ? data : SEED_PERF
  const sorted = [...agents].sort((a, b) => b.score_performance - a.score_performance)

  const rows = [
    { label: 'Meilleur', agent: sorted[0] },
    { label: 'Équipe (moy.)', agent: {
      agentNom: 'Moyenne équipe',
      score_performance: sorted.reduce((s, a) => s + a.score_performance, 0) / sorted.length,
      badge: undefined as undefined,
    }},
    { label: 'Plus faible', agent: sorted[sorted.length - 1] },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Performance Gap Analysis</h3>
        <p className="text-xs text-slate-500 mt-0.5">Comparatif agents — taux de recouvrement</p>
      </div>

      <div className="space-y-4">
        {rows.map(({ label, agent }) => (
          <div key={label} className="flex items-center gap-4">
            <div className="w-24 flex-shrink-0">
              <span className="text-xs text-slate-500 font-medium">{label}</span>
            </div>
            <div className="w-32 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800 truncate">{agent.agentNom}</span>
                {agent.badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeColors[agent.badge]}`}>
                    {agent.badge}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-700"
                  style={{ width: `${agent.score_performance}%` }}
                />
              </div>
              <span className="text-sm font-bold text-slate-800 w-12 text-right">
                {agent.score_performance.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
