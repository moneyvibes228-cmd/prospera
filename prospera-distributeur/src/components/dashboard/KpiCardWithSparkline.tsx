'use client'
import { useMemo, useId } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AreaChart, Area, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { cn, formatFcfa } from '@/lib/utils'

export interface KpiCardWithSparklineProps {
  title: string
  value: string | number
  unit?: string
  variation?: number | null
  variationLabel?: string
  sparkline?: number[]
  /** Libellés des mois (ex. Déc → Mai), une entrée par point sparkline */
  sparklineLabels?: readonly string[]
  colorScheme: 'teal' | 'red' | 'orange' | 'blue' | 'green' | 'purple'
  invertVariation?: boolean
  onClick?: () => void
  badge?: string
  format?: 'number' | 'fcfa' | 'pct' | 'raw'
}

const COLOR_MAP = {
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   stroke: '#14b8a6', fill: '#14b8a6', border: 'border-teal-100' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    stroke: '#ef4444', fill: '#ef4444', border: 'border-red-100'  },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', stroke: '#f97316', fill: '#f97316', border: 'border-orange-100' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   stroke: '#3b82f6', fill: '#3b82f6', border: 'border-blue-100' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  stroke: '#16a34a', fill: '#16a34a', border: 'border-green-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', stroke: '#a855f7', fill: '#a855f7', border: 'border-purple-100' },
}

function formatSparkValue(v: number, format: KpiCardWithSparklineProps['format']): string {
  if (format === 'fcfa') {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M FCFA`
    if (v >= 1_000) return `${Math.round(v / 1_000)}k FCFA`
    return `${v.toLocaleString('fr-FR')} FCFA`
  }
  if (format === 'pct') return `${v}%`
  if (format === 'number') return v.toLocaleString('fr-FR')
  return v % 1 === 0 ? v.toLocaleString('fr-FR') : v.toFixed(1)
}

export function KpiCardWithSparkline({
  title, value, unit, variation, variationLabel,
  sparkline, sparklineLabels, colorScheme, invertVariation = false,
  onClick, badge, format = 'raw',
}: KpiCardWithSparklineProps) {
  const gradientId = useId().replace(/:/g, '')
  const colors = COLOR_MAP[colorScheme]
  const hasVariation = variation !== undefined && variation !== null
  const isPositive = invertVariation ? (variation ?? 0) < 0 : (variation ?? 0) > 0
  const isNeutral = variation === 0

  const displayValue = (() => {
    if (typeof value === 'string') return value
    if (format === 'fcfa') return formatFcfa(value)
    if (format === 'pct') return `${value}%`
    if (format === 'number') return value.toLocaleString('fr-FR')
    return value.toString()
  })()

  const sparklineData = useMemo(() => {
    if (!sparkline?.length) return []
    return sparkline.map((v, i) => ({
      mois: sparklineLabels?.[i] ?? `${i + 1}`,
      v,
    }))
  }, [sparkline, sparklineLabels])

  const yDomain = useMemo((): [number, number] => {
    if (!sparkline?.length) return [0, 1]
    const min = Math.min(...sparkline)
    const max = Math.max(...sparkline)
    const span = max - min
    const pad = span > 0 ? span * 0.18 : Math.abs(max) * 0.12 || 1
    return [min - pad, max + pad]
  }, [sparkline])

  const isClickable = !!onClick
  const Wrapper: React.ElementType = isClickable ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'w-full text-left bg-white rounded-xl border p-4 shadow-sm transition-all relative overflow-hidden flex flex-col min-h-[148px]',
        colors.border,
        isClickable && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
      )}>

      <div className="relative flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{title}</p>
          {badge && (
            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', colors.bg, colors.text)}>{badge}</span>
          )}
        </div>

        <div className="flex items-baseline gap-1 mb-1">
          <p className={cn('text-2xl font-black', colors.text)}>{displayValue}</p>
          {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
        </div>

        {hasVariation && (
          <div className="flex items-center gap-1 mt-1.5">
            {isNeutral ? (
              <Minus size={11} className="text-slate-400" />
            ) : isPositive ? (
              <TrendingUp size={11} className="text-green-600" />
            ) : (
              <TrendingDown size={11} className="text-red-500" />
            )}
            <span className={cn('text-[11px] font-bold',
              isNeutral ? 'text-slate-400' : isPositive ? 'text-green-600' : 'text-red-500',
            )}>
              {variation > 0 ? '+' : ''}{variation}%
            </span>
            {variationLabel && (
              <span className="text-[10px] text-slate-400 truncate">· {variationLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* Courbe 6 mois */}
      {sparklineData.length >= 2 && (
        <div className="mt-3 -mx-1">
          <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.fill} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={colors.fill} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={yDomain} />
                <Tooltip
                  cursor={{ stroke: colors.stroke, strokeWidth: 1, strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    const p = payload[0].payload as { mois: string; v: number }
                    return (
                      <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                        <span className="font-bold">{p.mois}</span>
                        <span className="text-slate-300"> · </span>
                        <span>{formatSparkValue(p.v, format)}</span>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="none"
                  fill={`url(#${gradientId})`}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="v"
                  stroke={colors.stroke}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: colors.stroke, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: colors.stroke, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {sparklineLabels && sparklineLabels.length === sparklineData.length && (
            <div className="flex justify-between px-0.5 mt-0.5">
              {sparklineLabels.map(m => (
                <span key={m} className="text-[8px] text-slate-400 font-medium tabular-nums">{m}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </Wrapper>
  )
}
