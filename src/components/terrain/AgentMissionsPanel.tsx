'use client'

import Link from 'next/link'
import { Target } from 'lucide-react'
import { mockAgentMissions } from '@/lib/gp-portefeuille-api-mock'
import { formatFcfa } from '@/lib/utils'

/** Missions agent — version mock. Voir `AgentMissionsPanelWithApi`. */
export function AgentMissionsPanel() {
  const data = mockAgentMissions()

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <Target size={16} className="text-teal-600" />
        Missions recouvrement
      </h3>
      {data.missions_clients?.map((m, mi) => (
        <div key={`mission-${mi}`} className="bg-white border border-slate-200 rounded-xl p-4 text-xs">
          <p className="font-bold text-slate-900">{m.client_nom}</p>
          {m.dossiers.map((d, di) => (
            <Link
              key={`d-${di}`}
              href={`/credit/dossiers/${d.id}`}
              className="block text-teal-700 hover:underline mt-1"
            >
              {d.reference} — retard {d.jours_retard} j
              {d.montant_retard != null && ` · ${formatFcfa(d.montant_retard)}`}
            </Link>
          ))}
        </div>
      ))}
    </div>
  )
}
