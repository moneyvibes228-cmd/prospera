'use client'
import { useState } from 'react'
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react'
import { ALERTES_CBI_9_CODES } from '@/lib/mockMicrofinance'
import { AiBadge } from './AiBadge'

const SEVERITE_STYLE: Record<string, { bg: string; border: string; text: string; icon: typeof AlertOctagon; label: string }> = {
  CRITICAL: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    icon: AlertOctagon,  label: 'CRITICAL' },
  WARN:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: AlertTriangle, label: 'WARN' },
  INFO:     { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   icon: Info,          label: 'INFO' },
}

export function AlertesCbiPanel() {
  const [filter, setFilter] = useState<'TOUS' | 'CRITICAL' | 'WARN' | 'INFO'>('TOUS')

  const filtered = filter === 'TOUS'
    ? ALERTES_CBI_9_CODES
    : ALERTES_CBI_9_CODES.filter(a => a.severite === filter)

  const totalActifs = ALERTES_CBI_9_CODES.reduce((s, a) => s + a.count_actifs, 0)
  const totalCritical = ALERTES_CBI_9_CODES.filter(a => a.severite === 'CRITICAL').reduce((s, a) => s + a.count_actifs, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertOctagon size={15} className="text-red-600" />
          <h3 className="text-sm font-semibold text-slate-900">Alertes CBI v5 — 9 codes typés</h3>
          <AiBadge variant="small" label="Modèle Kharoubi & Thomas" />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500"><strong className="text-slate-800">{totalActifs}</strong> actives</span>
          <span className="text-slate-300">·</span>
          <span className="text-red-600 font-bold">{totalCritical} critiques</span>
        </div>
      </div>

      <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 overflow-x-auto">
        {(['TOUS', 'CRITICAL', 'WARN', 'INFO'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
            {f === 'TOUS' ? `Tous (${ALERTES_CBI_9_CODES.length})` : `${f} (${ALERTES_CBI_9_CODES.filter(a => a.severite === f).length})`}
          </button>
        ))}
      </div>

      <div className="divide-y divide-slate-50">
        {filtered.map(a => {
          const stl = SEVERITE_STYLE[a.severite]
          const Icon = stl.icon
          return (
            <div key={a.code} className={`flex items-start gap-3 px-5 py-3 hover:bg-slate-50 ${a.severite === 'CRITICAL' && a.count_actifs > 0 ? 'bg-red-50/30' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${stl.bg} ${stl.border} border`}>
                <Icon size={14} className={stl.text} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{a.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${stl.bg} ${stl.text} ${stl.border}`}>{stl.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{a.code}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-right">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Actifs</div>
                  <div className={`text-lg font-black ${a.count_actifs > 0 ? stl.text : 'text-slate-400'}`}>{a.count_actifs}</div>
                </div>
                <div className="text-slate-300">·</div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Résolus mois</div>
                  <div className="text-lg font-bold text-slate-500">{a.count_resolus_mois}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
