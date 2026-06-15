import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  variation?: number | null
  variationLabel?: string
  icon: LucideIcon
  colorScheme: 'teal' | 'red' | 'orange' | 'blue'
  subtext?: string
  invertVariation?: boolean
}

const colorMap = {
  teal:   { bg: 'bg-teal-50',   icon: 'bg-teal-100 text-teal-600',   border: 'border-teal-100' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',      border: 'border-red-100'  },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', border: 'border-orange-100' },
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',    border: 'border-blue-100'  },
}

export function KpiCard({
  title, value, variation, variationLabel, icon: Icon,
  colorScheme, subtext, invertVariation = false
}: KpiCardProps) {
  const colors = colorMap[colorScheme]

  const isPositive = invertVariation
    ? ((variation ?? 0) < 0)
    : ((variation ?? 0) > 0)

  return (
    <div className={cn('bg-white rounded-xl border p-5 shadow-sm', colors.border)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtext && (
            <p className="text-xs text-slate-500 mt-1">{subtext}</p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
          <Icon size={20} />
        </div>
      </div>

      {variation !== undefined && variation !== null && (
        <div className="mt-3 flex items-center gap-1">
          {isPositive ? (
            <TrendingUp size={14} className="text-green-600" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span className={cn('text-xs font-medium', isPositive ? 'text-green-600' : 'text-red-500')}>
            {variation > 0 ? '+' : ''}{variation}%
          </span>
          {variationLabel && (
            <span className="text-xs text-slate-400">{variationLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
