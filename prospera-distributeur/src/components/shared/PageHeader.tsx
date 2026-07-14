import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  badge?: string
  /** Contenu optionnel aligné à droite (boutons d'export, actions de page…). */
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, badge, actions }: Props) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
