import { cn } from '@/lib/utils'

interface AiBadgeProps {
  confidence?: number
  label?: string
  variant?: 'default' | 'small' | 'inline'
  pulse?: boolean
}

export function AiBadge({ confidence, label = 'IA', variant = 'default', pulse = false }: AiBadgeProps) {
  if (variant === 'small') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full">
        <span className={`w-1 h-1 bg-indigo-500 rounded-full ${pulse ? 'animate-pulse' : ''}`} />
        {label}
        {confidence !== undefined && <span className="text-indigo-400 font-normal">{confidence}%</span>}
      </span>
    )
  }
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 px-1 py-0.5">
        ✦ {label}{confidence !== undefined && ` · ${confidence}%`}
      </span>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-2.5 py-1 rounded-full">
      <span className={cn('w-1.5 h-1.5 bg-indigo-500 rounded-full', pulse && 'animate-pulse')} />
      <span className="text-xs font-bold text-indigo-700">{label}</span>
      {confidence !== undefined && (
        <span className="text-xs text-indigo-400 font-normal">confiance {confidence}%</span>
      )}
    </div>
  )
}

interface AiScoreCardProps {
  score: number
  label?: string
  facteurs?: Array<{ label: string; impact: 'POSITIF' | 'NEGATIF'; valeur: string }>
  showFacteurs?: boolean
}

const SCORE_RING = (s: number) =>
  s >= 70 ? 'text-green-600 border-green-200 bg-green-50' :
  s >= 50 ? 'text-yellow-700 border-yellow-200 bg-yellow-50' :
  s >= 30 ? 'text-orange-600 border-orange-200 bg-orange-50' :
  'text-red-700 border-red-200 bg-red-50'

export function AiScoreCard({ score, label = 'Score IA', facteurs, showFacteurs = false }: AiScoreCardProps) {
  return (
    <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <AiBadge variant="small" />
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={cn('w-14 h-14 rounded-full border-4 flex items-center justify-center text-xl font-black flex-shrink-0', SCORE_RING(score))}>
          {score}
        </div>
        {showFacteurs && facteurs && facteurs.length > 0 && (
          <div className="space-y-1 flex-1">
            {facteurs.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className={`w-3 h-3 flex-shrink-0 rounded-full ${f.impact === 'POSITIF' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-slate-600 truncate">{f.label}</span>
                <span className={`font-bold ml-auto flex-shrink-0 ${f.impact === 'POSITIF' ? 'text-green-600' : 'text-red-600'}`}>{f.valeur}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
