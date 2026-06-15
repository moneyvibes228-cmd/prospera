'use client'
import { useState } from 'react'
import { Sparkles, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ScoreRecouvrementIAProps {
  score: number
  probabilite_pct: number
  facteurs: {
    code: string
    label: string
    impact: 'POSITIF' | 'NEGATIF' | 'NEUTRE'
    poids_pct: number
    detail: string
  }[]
  compact?: boolean
}

export function ScoreRecouvrementIA({ score, probabilite_pct, facteurs, compact }: ScoreRecouvrementIAProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const scoreColor = score < 35 ? 'text-red-600' : score < 50 ? 'text-orange-600' : 'text-yellow-600'
  const bgColor = score < 35 ? 'bg-red-50 border-red-200' : score < 50 ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'
  const verdict = probabilite_pct >= 50 ? 'Remboursement probable' : probabilite_pct >= 30 ? 'Incertain — action requise' : 'Peu probable sans mesure coercitive'

  return (
    <div className={`rounded-xl border p-4 ${bgColor} relative`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-purple-600" />
            <span className="text-xs font-bold text-slate-600 uppercase">Score IA recouvrement</span>
            <button
              type="button"
              className="relative inline-flex"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              aria-label="Facteurs du score IA"
            >
              <Info size={14} className="text-slate-400 hover:text-purple-600 cursor-help" />
              {showTooltip && (
                <div className="absolute z-50 left-0 top-6 w-80 bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3 pointer-events-none">
                  <p className="font-bold mb-2 text-purple-300">Facteurs analysés par l&apos;IA</p>
                  <ul className="space-y-2">
                    {facteurs.map(f => (
                      <li key={f.code} className="border-b border-slate-700 pb-1.5 last:border-0">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {f.impact === 'POSITIF' ? <TrendingUp size={10} className="text-green-400" /> :
                           f.impact === 'NEGATIF' ? <TrendingDown size={10} className="text-red-400" /> :
                           <Minus size={10} className="text-slate-400" />}
                          {f.label} ({f.poids_pct}%)
                        </div>
                        <p className="text-slate-300 mt-0.5">{f.detail}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-400 mt-2">Modèle Prospera AI v2.4 · Recouvrement</p>
                </div>
              )}
            </button>
          </div>
          {!compact && (
            <p className="text-sm text-slate-600 mt-1">
              Probabilité de remboursement intégral sous 30j : <strong>{probabilite_pct}%</strong>
            </p>
          )}
          <p className={`text-xs font-bold mt-1 ${probabilite_pct >= 50 ? 'text-green-700' : probabilite_pct >= 30 ? 'text-orange-700' : 'text-red-700'}`}>
            {verdict}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-3xl font-black ${scoreColor}`}>{score}<span className="text-sm text-slate-400">/100</span></div>
          {!compact && <div className="text-[10px] text-slate-500">Score composite</div>}
        </div>
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {facteurs.filter(f => f.impact === 'NEGATIF').slice(0, 3).map(f => (
            <span key={f.code} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-red-700 border border-red-200">
              {f.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
