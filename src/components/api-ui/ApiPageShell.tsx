'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type ApiPageShellProps = {
  title: string
  subtitle?: string
  endpoint?: string
  backHref?: string
  backLabel?: string
  onRefresh?: () => void
  refreshing?: boolean
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** En-tête unifié pour toutes les pages `-with-api` */
export function ApiPageShell({
  title,
  subtitle,
  endpoint,
  backHref,
  backLabel = 'Retour',
  onRefresh,
  refreshing,
  actions,
  children,
  className,
}: ApiPageShellProps) {
  return (
    <div className={cn('min-h-full', className)}>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-6 sm:p-8 mb-6 shadow-sm">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors duration-200 cursor-pointer"
              >
                <ArrowLeft size={14} />
                {backLabel}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-800 transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Actualiser
              </button>
            )}
            {actions}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
