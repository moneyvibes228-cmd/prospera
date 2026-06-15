'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Shield, AlertTriangle } from 'lucide-react'
import { BCEAO_REPARTITION } from '@/lib/mockMicrofinance'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from './AiBadge'

export function BceaoClassesChart() {
  const data = BCEAO_REPARTITION.classes.map(c => ({
    name: c.label,
    value: c.count,
    color: c.color,
    encours: c.encours,
    provision: c.provision_fcfa,
    taux: c.provision_taux,
    score_range: c.score_range,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900">Classes BCEAO — Répartition portefeuille</h3>
          <AiBadge variant="small" label="Modèle CBI v5" />
        </div>
        <div className="text-xs text-slate-500">
          {BCEAO_REPARTITION.total_emprunteurs} emprunteurs · {formatFcfa(BCEAO_REPARTITION.total_encours)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, props) => {
                  const p = props as { payload?: { encours: number; taux: number; name: string } }
                  if (!p.payload) return [String(value), '']
                  return [
                    `${value} emprunteurs · ${formatFcfa(p.payload.encours)} · Prov. ${p.payload.taux}%`,
                    p.payload.name,
                  ]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-32 mb-4">
            <div className="text-3xl font-black text-slate-800">{BCEAO_REPARTITION.classes[0].pct_count.toFixed(0)}%</div>
            <div className="text-xs text-slate-500">Performant</div>
          </div>
        </div>

        {/* Légende détaillée */}
        <div className="space-y-2">
          {BCEAO_REPARTITION.classes.map((c) => (
            <div key={c.code} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">{c.label}</span>
                  <span className="text-xs font-bold text-slate-700">{c.count}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span>Score {c.score_range} · Prov. {c.provision_taux}%</span>
                  <span className="font-medium">{formatFcfa(c.encours)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provisions */}
      <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
        <div className="p-2.5 bg-green-50 rounded-lg border border-green-100">
          <div className="text-xs text-green-700 font-medium">Constituées</div>
          <div className="text-base font-black text-green-800">{formatFcfa(BCEAO_REPARTITION.total_provisions_constituees)}</div>
        </div>
        <div className="p-2.5 bg-orange-50 rounded-lg border border-orange-100">
          <div className="text-xs text-orange-700 font-medium">À constituer (BCEAO)</div>
          <div className="text-base font-black text-orange-800">{formatFcfa(BCEAO_REPARTITION.total_provisions_a_constituer)}</div>
        </div>
        <div className="p-2.5 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
          <div>
            <div className="text-xs text-red-700 font-medium">Écart à régulariser</div>
            <div className="text-base font-black text-red-800">{formatFcfa(BCEAO_REPARTITION.ecart_provisions)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
