'use client'
import { ChevronRight, Network, Building2, User, FileText, CreditCard, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DrillLevel = 'RESEAU' | 'REGION' | 'AGENCE' | 'AGENT' | 'CLIENT' | 'PRET'

export interface DrillNode {
  level: DrillLevel
  id: string
  label: string
  sublabel?: string
}

interface DrillDownBreadcrumbProps {
  path: DrillNode[]
  onNavigate: (index: number) => void
  onReset?: () => void
}

const LEVEL_CONFIG: Record<DrillLevel, { icon: React.ElementType; color: string; label: string }> = {
  RESEAU:  { icon: Network,    color: 'text-slate-600',  label: 'Réseau' },
  REGION:  { icon: Home,       color: 'text-indigo-600', label: 'Région' },
  AGENCE:  { icon: Building2,  color: 'text-teal-600',   label: 'Agence' },
  AGENT:   { icon: User,       color: 'text-blue-600',   label: 'Agent' },
  CLIENT:  { icon: FileText,   color: 'text-purple-600', label: 'Client' },
  PRET:    { icon: CreditCard, color: 'text-orange-600', label: 'Prêt' },
}

export function DrillDownBreadcrumb({ path, onNavigate, onReset }: DrillDownBreadcrumbProps) {
  if (path.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
        <Network size={14} className="text-slate-500" />
        <span className="text-xs font-semibold text-slate-600">Vue réseau consolidée</span>
        <span className="text-[10px] text-slate-400 ml-auto">Cliquez sur une agence, un agent ou un client pour drill-down</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg overflow-x-auto">
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900 flex-shrink-0">
        <Network size={13} />
        <span className="text-xs font-semibold">Réseau</span>
      </button>

      {path.map((node, idx) => {
        const config = LEVEL_CONFIG[node.level]
        const Icon = config.icon
        const isLast = idx === path.length - 1
        return (
          <div key={`${node.level}-${node.id}`} className="flex items-center gap-1 flex-shrink-0">
            <ChevronRight size={12} className="text-slate-300" />
            <button
              onClick={() => !isLast && onNavigate(idx)}
              disabled={isLast}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                isLast
                  ? 'bg-slate-100 cursor-default'
                  : 'hover:bg-slate-100 cursor-pointer',
              )}>
              <Icon size={13} className={config.color} />
              <span className={cn(
                'text-xs',
                isLast ? 'font-bold text-slate-900' : 'font-semibold text-slate-600 hover:text-slate-900',
              )}>{node.label}</span>
              {node.sublabel && (
                <span className="text-[10px] text-slate-400">· {node.sublabel}</span>
              )}
            </button>
          </div>
        )
      })}

      <div className="ml-auto flex items-center gap-2 pl-3 border-l border-slate-200 flex-shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Niveau</span>
        <span className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full',
          path[path.length - 1].level === 'REGION' && 'bg-indigo-100 text-indigo-700',
          path[path.length - 1].level === 'AGENCE' && 'bg-teal-100 text-teal-700',
          path[path.length - 1].level === 'AGENT'  && 'bg-blue-100 text-blue-700',
          path[path.length - 1].level === 'CLIENT' && 'bg-purple-100 text-purple-700',
          path[path.length - 1].level === 'PRET'   && 'bg-orange-100 text-orange-700',
        )}>
          {LEVEL_CONFIG[path[path.length - 1].level].label}
        </span>
      </div>
    </div>
  )
}
