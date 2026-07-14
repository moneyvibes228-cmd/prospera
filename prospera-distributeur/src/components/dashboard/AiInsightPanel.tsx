'use client'
import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import type { AiInsightOperationnel, DomaineInsightDG } from '@/lib/mock-dg-kpis-builder'
import { DOMAINE_INSIGHT_LABELS } from '@/lib/mock-dg-kpis-builder'

interface AiInsightPanelProps {
  insights: AiInsightOperationnel[]
  titre?: string
  sousTitre?: string
  collapsible?: boolean
}

const TYPE_STYLE: Record<AiInsightOperationnel['type'], { emoji: string; color: string; bg: string; border: string }> = {
  ALERTE:     { emoji: '⚡', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-100' },
  OPPORTUNITE:{ emoji: '✅', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-100' },
  ACTION:     { emoji: '🎯', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
  PREVISION:  { emoji: '🔮', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
}

const IMPACT_BADGE: Record<NonNullable<AiInsightOperationnel['impact']>, string> = {
  CRITIQUE: 'bg-red-100 text-red-700 border-red-200',
  ELEVE:    'bg-orange-100 text-orange-700 border-orange-200',
  MODERE:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  INFO:     'bg-slate-100 text-slate-600 border-slate-200',
}

const DOMAINE_BADGE: Record<DomaineInsightDG, string> = {
  CREDIT_B2B: 'bg-rose-50 text-rose-700 border-rose-200',
  SUPPLY_CHAIN: 'bg-amber-50 text-amber-800 border-amber-200',
  LOGISTIQUE: 'bg-sky-50 text-sky-700 border-sky-200',
  CANAL_VRP: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CANAL_FREELANCE: 'bg-lime-50 text-lime-800 border-lime-200',
  PROSPECTION: 'bg-violet-50 text-violet-700 border-violet-200',
  PREVISION_SORTIES: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function AiInsightPanel({
  insights,
  titre = 'Alertes opérationnelles du jour',
  sousTitre = 'Exécution grossiste — crédit B2B, supply chain, entrepôts & canaux',
  collapsible = false,
}: AiInsightPanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => collapsible && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-3.5 ${collapsible ? 'hover:bg-indigo-100/50 transition-colors cursor-pointer' : 'cursor-default'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-indigo-900">{titre}</div>
            <div className="text-xs text-indigo-500">{sousTitre}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
            {insights.length} action{insights.length > 1 ? 's' : ''}
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
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${DOMAINE_BADGE[ins.domaine]}`}>
                        {DOMAINE_INSIGHT_LABELS[ins.domaine]}
                      </span>
                      {ins.impact && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${IMPACT_BADGE[ins.impact]}`}>{ins.impact}</span>
                      )}
                      <span className="text-[10px] text-indigo-400 ml-auto font-medium tabular-nums">confiance {ins.confidence}%</span>
                    </div>
                    <div className={`text-xs font-bold ${style.color} mb-0.5`}>{ins.titre}</div>
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
