'use client'
import { useState } from 'react'
import { Calendar, Clock, MapPin, Wallet, Users, Target } from 'lucide-react'
import { formatFcfa } from '@/lib/utils'
import type { AgentCalendrierRCC } from '@/lib/rcc-commercial-hub'

const TYPE_ICON: Record<string, typeof Calendar> = {
  VISITE: MapPin, COLLECTE: Wallet, PROSPECTION: Target, RDV: Calendar, TONTINE: Users,
}

const STATUT_STYLE: Record<string, string> = {
  BON: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  SOUS_PERF: 'bg-orange-100 text-orange-800',
  INACTIF: 'bg-red-100 text-red-800',
}

interface Props {
  agents: AgentCalendrierRCC[]
}

export function AgentCalendrierRcc({ agents }: Props) {
  const [selected, setSelected] = useState(agents[0]?.id ?? '')

  const agent = agents.find(a => a.id === selected) ?? agents[0]
  if (!agent) return null

  const pct = Math.min(100, Math.round((agent.collecte_jour / agent.objectif_jour) * 100))

  return (
    <div className="flex flex-col h-full">
      {/* Sélecteur agents */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 shrink-0">
        {agents.map(a => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 cursor-pointer border ${
              selected === a.id
                ? 'bg-fuchsia-700 text-white border-fuchsia-700'
                : 'bg-white text-slate-600 border-slate-200 hover:border-fuchsia-300'
            }`}
          >
            {a.nom.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Résumé agent */}
      <div className="bg-slate-50 rounded-lg p-3 mb-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-bold text-slate-900">{agent.nom}</div>
            <div className="text-[10px] text-slate-500">{agent.agence}</div>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${STATUT_STYLE[agent.statut]}`}>
            {agent.statut.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-600">Collecte jour</span>
          <span className="font-black text-teal-700">{formatFcfa(agent.collecte_jour)} / {formatFcfa(agent.objectif_jour)}</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Événements */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {agent.evenements.map((e, i) => {
          const Icon = TYPE_ICON[e.type] ?? Calendar
          return (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-fuchsia-50/30 transition-colors duration-200">
              <span className="text-[10px] font-mono font-bold text-fuchsia-700 bg-fuchsia-50 px-1.5 py-0.5 rounded min-w-[40px] text-center">
                {e.heure}
              </span>
              <Icon size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800">{e.titre}</div>
                <div className="text-[10px] text-slate-500">{e.lieu} · {e.type}</div>
                {e.montant && (
                  <div className="text-[10px] font-bold text-teal-700 mt-0.5">{formatFcfa(e.montant)}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
