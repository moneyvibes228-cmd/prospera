import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-700">{title}</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>
      </div>
      <span className="px-3 py-1 text-xs bg-teal-50 text-teal-700 rounded-full border border-teal-200">
        Module disponible prochainement
      </span>
    </div>
  )
}
