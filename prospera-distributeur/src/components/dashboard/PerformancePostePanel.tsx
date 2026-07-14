'use client'
import { TrendingUp, TrendingDown, Minus, Target, ThumbsUp, AlertTriangle } from 'lucide-react'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'
import { AiBadge } from './AiBadge'
import {
  buildPerformancePoste, tauxAtteinte, statutScore, STATUT_SCORE_STYLE,
  formatValeurKpi, formatObjectifKpi, MOIS_SPARKLINE_KPI,
  type KpiPoste,
} from '@/lib/kpi-postes-registry'

function Sparkline({ data, invert }: { data: number[]; invert: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const derniereHausse = data[data.length - 1] >= data[0]
  const bonneTendance = invert ? !derniereHausse : derniereHausse
  return (
    <div className="flex items-end gap-0.5 h-7" aria-hidden>
      {data.map((v, i) => (
        <div
          key={i}
          title={`${MOIS_SPARKLINE_KPI[i] ?? i + 1} · ${v.toLocaleString('fr-FR')}`}
          className={cn('flex-1 rounded-sm min-w-[3px]', bonneTendance ? 'bg-emerald-300' : 'bg-red-300')}
          style={{ height: `${Math.max(20, ((v - min) / range) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function KpiPosteCard({ kpi }: { kpi: KpiPoste }) {
  const atteinte = tauxAtteinte(kpi)
  const style = STATUT_SCORE_STYLE[statutScore(Math.min(100, atteinte))]
  const bonneVariation = kpi.invert ? kpi.variation_pct < 0 : kpi.variation_pct > 0
  const neutre = kpi.variation_pct === 0

  return (
    <div className={cn(
      'bg-white rounded-xl border p-4 shadow-sm flex flex-col',
      atteinte < 60 ? 'border-red-200' : 'border-slate-200',
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{kpi.label}</p>
        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', style.badge)}>{atteinte}%</span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-slate-900">{formatValeurKpi(kpi)}</span>
        {kpi.unite && kpi.format !== 'pct' && kpi.format !== 'jours' && (
          <span className="text-xs font-medium text-slate-400">{kpi.unite}</span>
        )}
      </div>

      <div className="flex items-center gap-1 mt-1 mb-2.5">
        {neutre ? <Minus size={11} className="text-slate-400" />
          : bonneVariation ? <TrendingUp size={11} className="text-emerald-600" />
            : <TrendingDown size={11} className="text-red-500" />}
        <span className={cn('text-[11px] font-bold',
          neutre ? 'text-slate-400' : bonneVariation ? 'text-emerald-600' : 'text-red-500')}>
          {kpi.variation_pct > 0 ? '+' : ''}{kpi.variation_pct}%
        </span>
        <span className="text-[10px] text-slate-400">· vs M-1</span>
      </div>

      <div className="mt-auto space-y-1.5">
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', style.bar)}
            style={{ width: `${Math.min(100, atteinte)}%` }} />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>Objectif {formatObjectifKpi(kpi)}</span>
          <span className="tabular-nums">{kpi.poids} pts</span>
        </div>
        <Sparkline data={kpi.sparkline} invert={kpi.invert} />
      </div>
    </div>
  )
}

interface Props {
  role: UserRole
  /** Masque les listes points forts / axes de progrès (dashboards denses) */
  compact?: boolean
}

export function PerformancePostePanel({ role, compact = false }: Props) {
  const perf = buildPerformancePoste(role)
  if (!perf) return null

  const style = STATUT_SCORE_STYLE[statutScore(perf.score_global)]

  return (
    <section className="mb-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={15} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900">{perf.titre}</h2>
              <AiBadge />
            </div>
            <p className="text-xs text-slate-500">
              {perf.periode} · score pondéré sur {perf.kpis.length} indicateurs
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-baseline gap-1 justify-end">
                <span className={cn('text-4xl font-black', style.text)}>{perf.score_global}</span>
                <span className="text-sm font-bold text-slate-300">/ 100</span>
              </div>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', style.badge)}>{style.label}</span>
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-4">
          <div className={cn('h-full rounded-full transition-all', style.bar)} style={{ width: `${perf.score_global}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {perf.kpis.map(kpi => <KpiPosteCard key={kpi.cle} kpi={kpi} />)}
      </div>

      {!compact && (
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp size={13} className="text-emerald-600" />
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Points forts</h3>
            </div>
            <ul className="space-y-1.5">
              {perf.points_forts.map(p => (
                <li key={p} className="text-xs text-emerald-900 flex gap-2">
                  <span className="text-emerald-400 shrink-0">•</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={13} className="text-amber-600" />
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Axes de progrès</h3>
            </div>
            <ul className="space-y-1.5">
              {perf.axes_progres.map(a => (
                <li key={a} className="text-xs text-amber-900 flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>{a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
