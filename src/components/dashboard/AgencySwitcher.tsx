'use client'
import { useState } from 'react'
import { Building2, ChevronDown, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AGENCES, type Agence } from '@/lib/agences'

interface AgencySwitcherProps {
  selectedId?: string
  onChange?: (agence: Agence | null) => void
  showAll?: boolean
  compact?: boolean
}

export function AgencySwitcher({ selectedId, onChange, showAll = true, compact = false }: AgencySwitcherProps) {
  const [open, setOpen] = useState(false)

  const selected = selectedId === 'ALL' ? null : AGENCES.find(a => a.id === selectedId) ?? null

  const handleSelect = (a: Agence | null) => {
    onChange?.(a)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 rounded-xl border bg-white shadow-sm hover:bg-slate-50 transition-colors',
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
        )}>
        <Building2 size={compact ? 12 : 14} className="text-teal-600 flex-shrink-0" />
        <span className="font-medium text-slate-700 max-w-36 truncate">
          {selected ? selected.nom_court : 'Toutes agences'}
        </span>
        {!selected && showAll && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-bold ml-0.5">RÉSEAU</span>}
        <ChevronDown size={compact ? 11 : 13} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-slate-200 shadow-xl w-72 overflow-hidden">
            {showAll && (
              <button onClick={() => handleSelect(null)}
                className={cn('w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100', !selected && 'bg-teal-50')}>
                <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} className="text-teal-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Toutes agences</div>
                  <div className="text-xs text-slate-400">Vue consolidée réseau</div>
                </div>
                {!selected && <CheckCircle size={14} className="text-teal-600 ml-auto flex-shrink-0" />}
              </button>
            )}
            {AGENCES.map(a => (
              <button key={a.id} onClick={() => handleSelect(a)}
                className={cn('w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left', selected?.id === a.id && 'bg-teal-50')}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: a.color + '20', color: a.color }}>
                  {a.initiales}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{a.nom}</div>
                  <div className="text-xs text-slate-400">{a.ville} · {a.emprunteurs_actifs} emp. · PAR {a.par_courant}%</div>
                </div>
                {selected?.id === a.id && <CheckCircle size={13} className="text-teal-600 flex-shrink-0" />}
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', a.par_courant > 10 ? 'bg-red-500' : a.par_courant > 8 ? 'bg-orange-400' : 'bg-green-500')} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
