'use client'

import { Loader2, RefreshCw } from 'lucide-react'

interface Props {
  state: 'idle' | 'loading' | 'ok' | 'error'
  error?: string
  onRetry?: () => void
  children: React.ReactNode
}

export function RapportTabLoader({ state, error, onRetry, children }: Props) {
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Loader2 size={28} className="animate-spin text-teal-600 mb-3" />
        <p className="text-sm">Chargement — recalcul CBI possible…</p>
      </div>
    )
  }
  if (state === 'error' || error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
        <p>{error ?? 'Données indisponibles'}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:underline cursor-pointer"
          >
            <RefreshCw size={12} /> Réessayer
          </button>
        )}
      </div>
    )
  }
  return <>{children}</>
}
