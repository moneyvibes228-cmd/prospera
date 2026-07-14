'use client'
import { LayoutGrid, TrendingUp, TrendingDown } from 'lucide-react'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { cn } from '@/lib/utils'
import {
  buildMatricePostes, tauxAtteinte, statutScore, STATUT_SCORE_STYLE,
  formatValeurKpi, formatObjectifKpi, LIBELLE_POSTE, PERIODE_KPI_POSTES,
  type PerformancePoste, type KpiPoste, type PosteRole,
} from '@/lib/kpi-postes-registry'

/** KPI le mieux / le moins bien atteint du poste. */
function topFlop(perf: PerformancePoste): { top: KpiPoste; flop: KpiPoste } {
  const tries = [...perf.kpis].sort((a, b) => tauxAtteinte(b) - tauxAtteinte(a))
  return { top: tries[0], flop: tries[tries.length - 1] }
}

/** Mini-tendance en barres pour un KPI (invert = baisse souhaitable). */
function MiniSparkline({ kpi }: { kpi: KpiPoste }) {
  const data = kpi.sparkline ?? []
  if (data.length === 0) return <span className="text-slate-300">—</span>
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const derniereHausse = data[data.length - 1] >= data[0]
  const favorable = kpi.invert ? !derniereHausse : derniereHausse
  return (
    <div className="flex items-end gap-0.5 h-5 w-16">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn('flex-1 rounded-sm min-w-[3px]', favorable ? 'bg-emerald-400' : 'bg-red-400')}
          style={{ height: `${Math.max(20, ((v - min) / range) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function VariationBadge({ kpi }: { kpi: KpiPoste }) {
  const v = kpi.variation_pct
  if (v == null) return null
  const favorable = kpi.invert ? v < 0 : v > 0
  return (
    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
      favorable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
      {v > 0 ? '+' : ''}{v.toFixed(1)}%
    </span>
  )
}

/**
 * Matrice de performance par poste — vue DG / DC (spec V2 §3.4).
 * `perimetre` restreint la matrice aux postes fournis (le DC ne voit que les postes commerciaux).
 */
export function MatricePostesPanel({ perimetre, titre }: {
  perimetre?: PosteRole[]
  titre?: string
} = {}) {
  const postes = buildMatricePostes(perimetre)
  const scoreMoyen = Math.round(postes.reduce((s, p) => s + p.score_global, 0) / postes.length)
  const critiques = postes.filter(p => statutScore(p.score_global) === 'CRITIQUE')

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <LayoutGrid size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">{titre ?? 'Score de performance par poste'}</h2>
          <AiBadge variant="small" />
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500">{PERIODE_KPI_POSTES}</span>
          <span className="text-slate-500">
            Moyenne <strong className="text-slate-800 font-black">{scoreMoyen}</strong> / 100
          </span>
          {critiques.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {critiques.length} poste{critiques.length > 1 ? 's' : ''} en critique
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['Poste', 'Score', 'Atteinte', 'Meilleur KPI', 'KPI le plus en retard', 'Tendance'].map(h => (
                <th key={h} className="text-left p-3 whitespace-nowrap font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {postes.map(p => {
              const style = STATUT_SCORE_STYLE[statutScore(p.score_global)]
              const { top, flop } = topFlop(p)
              return (
                <tr key={p.role} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="p-3">
                    <span className="font-bold text-slate-800">{LIBELLE_POSTE[p.role]}</span>
                    <span className="text-slate-400 ml-2 font-mono text-[10px]">{p.role}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-lg font-black tabular-nums', style.text)}>{p.score_global}</span>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', style.badge)}>{style.label}</span>
                    </div>
                  </td>
                  <td className="p-3 w-40">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={cn('h-full rounded-full', style.bar)} style={{ width: `${p.score_global}%` }} />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={11} className="text-emerald-600 shrink-0" />
                      <span className="text-slate-700">{top.label}</span>
                      <span className="font-bold text-emerald-700 tabular-nums">
                        {formatValeurKpi(top)} <span className="text-slate-400 font-normal">/ {formatObjectifKpi(top)}</span>
                      </span>
                      <VariationBadge kpi={top} />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown size={11} className="text-red-500 shrink-0" />
                      <span className="text-slate-700">{flop.label}</span>
                      <span className="font-bold text-red-600 tabular-nums">
                        {formatValeurKpi(flop)} <span className="text-slate-400 font-normal">/ {formatObjectifKpi(flop)}</span>
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 shrink-0">
                        {tauxAtteinte(flop)}%
                      </span>
                      <VariationBadge kpi={flop} />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2" title={`Tendance ${flop.label} — 6 mois`}>
                      <MiniSparkline kpi={flop} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
