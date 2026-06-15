'use client'

import type { ReactNode } from 'react'
import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ApiLoadingState({ label = 'Chargement des données…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 px-6">
      <Loader2 size={32} className="text-teal-600 animate-spin" aria-hidden />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  )
}

export function ApiErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 sm:p-8">
      <div className="flex gap-3">
        <AlertCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-red-900">Erreur de chargement</h3>
          <p className="text-sm text-red-800 mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 text-sm font-semibold text-red-700 underline hover:text-red-900 cursor-pointer"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ApiEmptyState({
  title = 'Aucune donnée',
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 px-6 text-center">
      <Inbox size={36} className="text-slate-300" />
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-md">{description}</p>}
      {action}
    </div>
  )
}

export function ApiSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id?: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden scroll-mt-6', className)}
    >
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

export function ApiStatGrid({
  items,
}: {
  items: { label: string; value: string; hint?: string; tone?: 'default' | 'success' | 'warning' | 'danger' }[]
}) {
  const toneClass = {
    default: 'text-slate-900',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-teal-200 transition-colors duration-200"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
          <p className={cn('text-xl font-bold mt-1 tabular-nums', toneClass[item.tone ?? 'default'])}>
            {item.value}
          </p>
          {item.hint && <p className="text-[10px] text-slate-500 mt-0.5">{item.hint}</p>}
        </div>
      ))}
    </div>
  )
}

export function ApiSearchBar({
  value,
  onChange,
  placeholder = 'Rechercher…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-shadow duration-200"
    />
  )
}

export function statutPillClass(statut: string): string {
  const s = statut.toUpperCase()
  if (s.includes('APPROUV') || s.includes('VALID') || s.includes('GESTION')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
  if (s.includes('REFUS') || s.includes('REJET') || s.includes('RETARD')) {
    return 'bg-red-100 text-red-800 border-red-200'
  }
  if (s.includes('ANALYSE') || s.includes('ATTENT') || s.includes('SOUMIS')) {
    return 'bg-amber-100 text-amber-900 border-amber-200'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200'
}
