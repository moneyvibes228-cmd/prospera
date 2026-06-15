'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts'
import { Activity, TrendingUp, AlertTriangle, Smartphone, Banknote } from 'lucide-react'
import { TRANSACTIONS_STATS } from '@/lib/mockMicrofinance'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from './AiBadge'

const TYPE_LABELS: Record<string, string> = {
  DECAISSEMENT_CREDIT:  'Décaissements',
  REMBOURSEMENT_CREDIT: 'Remboursements',
  DEPOT_EPARGNE:        'Dépôts épargne',
  RETRAIT_EPARGNE:      'Retraits épargne',
  TRANSFERT_INTERNE:    'Transferts',
  COMMISSION:           'Commissions',
  FRAIS_DOSSIER:        'Frais dossier',
}

const TYPE_COLORS: Record<string, string> = {
  DECAISSEMENT_CREDIT:  '#a855f7',
  REMBOURSEMENT_CREDIT: '#14b8a6',
  DEPOT_EPARGNE:        '#3b82f6',
  RETRAIT_EPARGNE:      '#f97316',
  TRANSFERT_INTERNE:    '#6366f1',
  COMMISSION:           '#eab308',
  FRAIS_DOSSIER:        '#64748b',
}

export function TransactionsStats() {
  const parType = Object.entries(TRANSACTIONS_STATS.par_type).map(([key, val]) => ({
    type: TYPE_LABELS[key],
    count: val.count,
    montant: val.montant,
    pct: val.pct,
    color: TYPE_COLORS[key],
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900">Statistiques transactions</h3>
          <AiBadge variant="small" label="Suivi temps réel" />
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">Aujourd'hui : <strong className="text-slate-800">{TRANSACTIONS_STATS.total_jour}</strong></span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">Mois : <strong className="text-slate-800">{TRANSACTIONS_STATS.total_mois}</strong></span>
          <span className="text-slate-300">·</span>
          <span className="text-teal-700 font-bold">{formatFcfa(TRANSACTIONS_STATS.montant_mois)}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* KPI haut */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-100">
            <div className="text-xs text-teal-700 font-medium">Transactions/jour</div>
            <div className="text-2xl font-black text-teal-800">{TRANSACTIONS_STATS.total_jour}</div>
            <div className="text-[10px] text-teal-600 mt-0.5">{formatFcfa(TRANSACTIONS_STATS.montant_jour)}</div>
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
            <div className="text-xs text-purple-700 font-medium">Volume mois</div>
            <div className="text-2xl font-black text-purple-800">{TRANSACTIONS_STATS.total_mois}</div>
            <div className="text-[10px] text-purple-600 mt-0.5">{formatFcfa(TRANSACTIONS_STATS.montant_mois)}</div>
          </div>
          <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <div className="text-xs text-orange-700 font-medium">Échecs ce mois</div>
            <div className="text-2xl font-black text-orange-800">{TRANSACTIONS_STATS.echecs_mois.total}</div>
            <div className="text-[10px] text-orange-600 mt-0.5">Taux {TRANSACTIONS_STATS.echecs_mois.taux_echec_pct}%</div>
          </div>
          <div className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
            <div className="text-xs text-yellow-700 font-medium">Mode mobile money</div>
            <div className="text-2xl font-black text-yellow-800">{TRANSACTIONS_STATS.pct_mobile_money}%</div>
            <div className="text-[10px] text-yellow-600 mt-0.5">Mixx By Yas + Flooz · {TRANSACTIONS_STATS.pct_especes}% espèce</div>
          </div>
        </div>

        {/* Par type + Par canal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Par type */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Par type d'opération</h4>
            <div className="space-y-2">
              {parType.map(t => (
                <div key={t.type} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium text-slate-700">{t.type}</span>
                      <span className="text-slate-500"><strong>{t.count}</strong> · {formatFcfa(t.montant)}</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-1.5">
                      <div className="h-full rounded-full" style={{ width: `${t.pct * 1.5}%`, backgroundColor: t.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Par canal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Par canal de paiement</h4>
            <div className="space-y-2">
              {TRANSACTIONS_STATS.par_canal.map(c => (
                <div key={c.canal} className="flex items-center gap-2">
                  {c.canal === 'Espèce' ? <Banknote size={11} className="text-slate-500 flex-shrink-0" /> : <Smartphone size={11} style={{ color: c.color }} className="flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium text-slate-700">{c.canal}</span>
                      <span className="text-slate-500"><strong>{c.count}</strong> · {c.pct}%</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-1.5">
                      <div className="h-full rounded-full" style={{ width: `${c.pct * 2}%`, backgroundColor: c.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Évolution 7j */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Évolution — 7 derniers jours</h4>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={TRANSACTIONS_STATS.evolution_7j} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTrans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v, n) => [String(n) === 'montant' ? formatFcfa(Number(v)) : `${v} transactions`, String(n) === 'montant' ? 'Montant' : 'Volume']} />
              <Area type="monotone" dataKey="count" name="Transactions" stroke="#14b8a6" fill="url(#gradTrans)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap par heure + Échecs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Pic d'activité — par heure</h4>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={TRANSACTIONS_STATS.par_heure} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="heure" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {TRANSACTIONS_STATS.par_heure.map((h, i) => (
                    <Cell key={i} fill={h.count > 60 ? '#14b8a6' : h.count > 40 ? '#22c55e' : h.count > 20 ? '#86efac' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Échecs */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <AlertTriangle size={11} className="text-red-500" /> Motifs d'échec
            </h4>
            <div className="space-y-1.5">
              {TRANSACTIONS_STATS.echecs_mois.top_motifs.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-red-700 truncate">{m.motif}</span>
                  <span className="font-bold text-red-800 ml-2">{m.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
