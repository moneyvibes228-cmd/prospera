'use client'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'

export interface CollecteSecteurActivite {
  secteur: string
  icone: string
  prevu: number
  realise: number
  pct: number
  statut: 'BON' | 'NORMAL' | 'TENSION' | 'DEGRADE'
  clients: number
  retards: number
  variation_semaine_pct: number
  agents: number
  agence_top: string
}

const STATUT_STYLE: Record<string, string> = {
  BON: 'bg-green-100 text-green-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  TENSION: 'bg-orange-100 text-orange-700',
  DEGRADE: 'bg-red-100 text-red-700',
}

const BAR_COLOR: Record<string, string> = {
  BON: '#16a34a',
  NORMAL: '#2563eb',
  TENSION: '#f97316',
  DEGRADE: '#ef4444',
}

interface Props {
  secteurs: CollecteSecteurActivite[]
}

export function CollecteSecteursRcc({ secteurs }: Props) {
  const totalPrevu = secteurs.reduce((s, x) => s + x.prevu, 0)
  const totalRealise = secteurs.reduce((s, x) => s + x.realise, 0)
  const pctGlobal = Math.round(totalRealise / totalPrevu * 100)

  const chartData = [...secteurs]
    .sort((a, b) => b.realise - a.realise)
    .map(s => ({
      name: s.secteur.replace(' & ', '\n& '),
      realise: s.realise,
      ecart: Math.max(0, s.prevu - s.realise),
      pct: s.pct,
      statut: s.statut,
    }))

  const secteursAlerte = secteurs.filter(s => s.statut === 'TENSION' || s.statut === 'DEGRADE')

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Collecte par secteur d&apos;activité</h3>
          <AiBadge variant="small" label="Jour en cours" />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
          <span className="font-bold text-teal-700">{formatFcfa(totalRealise)}</span>
          <span className="text-slate-300">/</span>
          <span>{formatFcfa(totalPrevu)} objectif</span>
          <span className={`font-bold ${pctGlobal >= 80 ? 'text-green-700' : pctGlobal >= 65 ? 'text-orange-700' : 'text-red-700'}`}>
            {pctGlobal}%
          </span>
        </div>
      </div>

      {secteursAlerte.length > 0 && (
        <div className="px-5 py-2.5 bg-orange-50 border-b border-orange-100 flex items-start gap-2">
          <AlertTriangle size={14} className="text-orange-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-orange-900 leading-snug">
            <strong>IA :</strong> {secteursAlerte.map(s => s.secteur).join(', ')} —
            écart collecte · renforcer relances ({secteursAlerte.reduce((n, s) => n + s.retards, 0)} retards cumulés).
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:divide-x divide-slate-100">
        {/* Graphique */}
        <div className="lg:col-span-5 p-4 border-b lg:border-b-0 border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Réalisé vs objectif (FCFA)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" width={88} />
              <Tooltip
                formatter={(v, name) => [formatFcfa(Number(v)), name === 'realise' ? 'Réalisé' : 'Écart objectif']}
                contentStyle={{ fontSize: 11 }}
              />
              <ReferenceLine x={totalPrevu / secteurs.length} stroke="#e2e8f0" strokeDasharray="3 3" />
              <Bar dataKey="realise" stackId="a" radius={[0, 0, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={BAR_COLOR[entry.statut] ?? '#64748b'} />
                ))}
              </Bar>
              <Bar dataKey="ecart" stackId="a" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tableau détail */}
        <div className="lg:col-span-7 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                <th className="text-left px-4 py-2.5 font-bold">Secteur d&apos;activité</th>
                <th className="text-right px-2 py-2.5 font-bold">Collecte</th>
                <th className="text-center px-2 py-2.5 font-bold">Obj.</th>
                <th className="text-center px-2 py-2.5 font-bold hidden sm:table-cell">Clients</th>
                <th className="text-center px-2 py-2.5 font-bold">Retards</th>
                <th className="text-center px-2 py-2.5 font-bold hidden md:table-cell">Var. S-1</th>
                <th className="text-left px-2 py-2.5 font-bold hidden lg:table-cell">Agence top</th>
                <th className="text-center px-2 py-2.5 font-bold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {secteurs.map(s => (
                <tr key={s.secteur} className={`hover:bg-slate-50 ${s.statut === 'DEGRADE' ? 'bg-red-50/40' : s.statut === 'TENSION' ? 'bg-orange-50/30' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.icone}</span>
                      <span className="font-bold text-slate-800">{s.secteur}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <div className="font-bold text-teal-700">{formatFcfa(s.realise)}</div>
                    <div className="text-[10px] text-slate-400">/{formatFcfa(s.prevu)}</div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`font-black ${s.pct >= 85 ? 'text-green-700' : s.pct >= 70 ? 'text-blue-700' : 'text-red-700'}`}>{s.pct}%</span>
                      <div className="w-10 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: BAR_COLOR[s.statut] }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center text-slate-600 hidden sm:table-cell">{s.clients}</td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`font-bold ${s.retards >= 4 ? 'text-red-700' : s.retards >= 2 ? 'text-orange-700' : 'text-slate-600'}`}>{s.retards}</span>
                  </td>
                  <td className="px-2 py-2.5 text-center hidden md:table-cell">
                    <span className={`inline-flex items-center gap-0.5 font-bold ${s.variation_semaine_pct >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {s.variation_semaine_pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {s.variation_semaine_pct >= 0 ? '+' : ''}{s.variation_semaine_pct}%
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-slate-600 hidden lg:table-cell">{s.agence_top}</td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUT_STYLE[s.statut]}`}>{s.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
