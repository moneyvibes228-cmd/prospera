'use client'
import { Sparkles } from 'lucide-react'
import { AiBadge } from '@/components/dashboard/AiBadge'

export function BlocAnalyseIA({ titre, contenu, variant = 'default' }: {
  titre: string
  contenu: string
  variant?: 'default' | 'alert'
}) {
  const bg = variant === 'alert' ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={15} className="text-purple-600" />
        <h3 className="text-sm font-bold text-slate-900">{titre}</h3>
        <AiBadge variant="small" label="Prospera AI" />
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{contenu}</p>
    </div>
  )
}
