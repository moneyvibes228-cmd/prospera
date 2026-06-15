'use client'
import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  label?: string
  filename?: string
  variant?: 'primary' | 'ghost' | 'inline'
  size?: 'sm' | 'md'
}

export function ExportButton({
  label = 'Exporter',
  filename = 'rapport',
  variant = 'ghost',
  size = 'md',
}: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'pdf' | 'xlsx' | 'done'>('idle')

  const handleExport = (type: 'pdf' | 'xlsx') => {
    setStatus(type)
    setOpen(false)
    setTimeout(() => {
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2200)
    }, 1100)
  }

  const isLoading = status === 'pdf' || status === 'xlsx'
  const isDone = status === 'done'

  const baseClass = cn(
    'inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all',
    size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
    variant === 'primary' && 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
    variant === 'ghost'   && 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    variant === 'inline'  && 'text-teal-600 hover:text-teal-700 hover:underline',
  )

  if (isDone) {
    return (
      <div className={cn(baseClass, 'bg-green-50 text-green-700 border-green-200 cursor-default')}>
        <Check size={size === 'sm' ? 13 : 15} />
        <span>{status === 'done' ? `${filename} exporté` : 'Exporté'}</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn(baseClass, 'cursor-wait opacity-80')}>
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />
        <span>Génération {status === 'pdf' ? 'PDF' : 'Excel'}...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className={baseClass}>
        <Download size={size === 'sm' ? 13 : 15} />
        <span>{label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden min-w-[180px]">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left border-b border-slate-100">
              <FileText size={15} className="text-red-500" />
              <div>
                <div className="font-semibold">Export PDF</div>
                <div className="text-[10px] text-slate-400">Rapport mis en page</div>
              </div>
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left">
              <FileSpreadsheet size={15} className="text-green-600" />
              <div>
                <div className="font-semibold">Export Excel</div>
                <div className="text-[10px] text-slate-400">Données détaillées</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
