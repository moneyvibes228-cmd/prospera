import { Sparkles } from 'lucide-react'
import { AiBadge } from '@/components/dashboard/AiBadge'

interface Props {
  titre?: string
  texte: string
  variant?: 'purple' | 'teal' | 'blue' | 'amber'
}

const VARIANTS = {
  purple: 'from-purple-50 to-indigo-50 border-purple-200 text-purple-950',
  teal: 'from-teal-50 to-emerald-50 border-teal-200 text-teal-950',
  blue: 'from-blue-50 to-slate-50 border-blue-200 text-blue-950',
  amber: 'from-amber-50 to-orange-50 border-amber-200 text-amber-950',
}

export function ModuleSyntheseIA({ titre = 'Synthèse IA', texte, variant = 'purple' }: Props) {
  return (
    <div className={`p-5 bg-gradient-to-br border rounded-xl mb-6 ${VARIANTS[variant]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="opacity-80" />
        <span className="text-sm font-bold">{titre}</span>
        <AiBadge variant="small" label="Prospera AI" pulse />
      </div>
      <p className="text-sm leading-relaxed">{texte}</p>
    </div>
  )
}
