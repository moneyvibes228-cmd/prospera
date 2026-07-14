'use client'

import { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'

interface Props {
  action: { type: string; message: string } | null
  onClose: () => void
  /** Durée avant disparition auto (ms). */
  duration?: number
}

/**
 * Toast de confirmation partagé par les workflows (terrain, validations,
 * recouvrement…). Lit le `lastAction` d'un contexte et se referme seul.
 */
export function WorkflowToast({ action, onClose, duration = 3200 }: Props) {
  useEffect(() => {
    if (!action) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [action, duration, onClose])

  if (!action) return null

  const negatif = action.type === 'refusee' || action.type === 'escalade'
    || action.type === 'blocage_credit' || action.type === 'annule'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_0.15s_ease-out]">
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border text-sm font-medium ${
        negatif
          ? 'bg-slate-900 text-white border-slate-700'
          : 'bg-emerald-600 text-white border-emerald-500'
      }`}>
        <CheckCircle2 size={16} className="shrink-0" />
        <span>{action.message}</span>
        <button type="button" onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
