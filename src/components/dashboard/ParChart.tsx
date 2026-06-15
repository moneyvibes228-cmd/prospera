'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import type { KpiSnapshot } from '@/types'

const SEED_DATA = [
  { semaine: 'Sem 1', par_30j: 10.5, par_60j: 3.9, par_90j: 1.8 },
  { semaine: 'Sem 2', par_30j: 9.8,  par_60j: 3.7, par_90j: 1.6 },
  { semaine: 'Sem 3', par_30j: 9.1,  par_60j: 3.4, par_90j: 1.5 },
  { semaine: 'Sem 4', par_30j: 9.4,  par_60j: 3.5, par_90j: 1.6 },
  { semaine: 'Sem 5', par_30j: 8.9,  par_60j: 3.3, par_90j: 1.4 },
  { semaine: 'Sem 6', par_30j: 8.5,  par_60j: 3.2, par_90j: 1.4 },
  { semaine: 'Sem 7', par_30j: 8.3,  par_60j: 3.1, par_90j: 1.3 },
  { semaine: 'Sem 8', par_30j: 8.2,  par_60j: 3.1, par_90j: 1.4 },
]

interface ParChartProps {
  data?: KpiSnapshot[]
}

export function ParChart({ data }: ParChartProps) {
  const chartData = data && data.length > 0
    ? data.map(d => ({
        semaine: `Sem ${d.semaine}`,
        par_30j: d.par_30j,
        par_60j: d.par_60j,
        par_90j: d.par_90j,
      }))
    : SEED_DATA

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Évolution PAR — 8 semaines</h3>
        <p className="text-xs text-slate-500 mt-0.5">Portfolio At Risk en pourcentage</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="par30" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="par60" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="par90" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="semaine" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis domain={[0, 15]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
          <Tooltip
            formatter={(value) => [`${value}%`]}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
          <Area type="monotone" dataKey="par_30j" name="PAR 30j" stroke="#ef4444" fill="url(#par30)" strokeWidth={2} />
          <Area type="monotone" dataKey="par_60j" name="PAR 60j" stroke="#f97316" fill="url(#par60)" strokeWidth={2} />
          <Area type="monotone" dataKey="par_90j" name="PAR 90j" stroke="#eab308" fill="url(#par90)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
