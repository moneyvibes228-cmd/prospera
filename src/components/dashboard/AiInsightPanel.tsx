'use client'
import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface AiInsight {
  titre: string
  detail: string
  type: 'ALERTE' | 'OPPORTUNITE' | 'ACTION' | 'PREVISION'
  confidence: number
  impact?: 'CRITIQUE' | 'ELEVE' | 'MODERE' | 'INFO'
  acteur?: string
  detecte_il_y_a?: string
  delai?: string
}

interface AiInsightPanelProps {
  insights: AiInsight[]
  titre?: string
  collapsible?: boolean
}

const TYPE_STYLE: Record<AiInsight['type'], { emoji: string; color: string; bg: string; border: string }> = {
  ALERTE:     { emoji: '⚡', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-100' },
  OPPORTUNITE:{ emoji: '✅', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-100' },
  ACTION:     { emoji: '🎯', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
  PREVISION:  { emoji: '🔮', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
}

const IMPACT_BADGE: Record<NonNullable<AiInsight['impact']>, string> = {
  CRITIQUE: 'bg-red-100 text-red-700 border-red-200',
  ELEVE:    'bg-orange-100 text-orange-700 border-orange-200',
  MODERE:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  INFO:     'bg-slate-100 text-slate-600 border-slate-200',
}

export function AiInsightPanel({ insights, titre = 'Alertes opérationnelles du jour', collapsible = false }: AiInsightPanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
      <button
        onClick={() => collapsible && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-3.5 ${collapsible ? 'hover:bg-indigo-100/50 transition-colors cursor-pointer' : 'cursor-default'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-indigo-900">{titre}</div>
            <div className="text-xs text-indigo-500">Incidents & actions terrain · sans doublon rapport stratégique</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
            {insights.length} insight{insights.length > 1 ? 's' : ''}
          </span>
          {collapsible && (open ? <ChevronUp size={14} className="text-indigo-500" /> : <ChevronDown size={14} className="text-indigo-500" />)}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {insights.map((ins, i) => {
            const style = TYPE_STYLE[ins.type]
            return (
              <div key={i} className={`rounded-xl border p-3 ${style.bg} ${style.border}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0 mt-0.5">{style.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-xs font-bold ${style.color}`}>{ins.titre}</span>
                      {ins.impact && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${IMPACT_BADGE[ins.impact]}`}>{ins.impact}</span>
                      )}
                      <span className="text-[10px] text-indigo-400 ml-auto font-medium">confiance {ins.confidence}%</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{ins.detail}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-slate-500">
                      {ins.acteur && <span>→ <strong className="text-slate-600">{ins.acteur}</strong></span>}
                      {ins.detecte_il_y_a && <span>Détecté {ins.detecte_il_y_a}</span>}
                      {ins.delai && <span className="text-teal-700 font-semibold">· {ins.delai}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
