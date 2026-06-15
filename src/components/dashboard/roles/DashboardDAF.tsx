'use client'
import { useState } from 'react'
import {
  Sparkles, Target, TrendingUp, TrendingDown, ChevronDown,
  Wallet, BarChart3, Building2, Activity, AlertTriangle,
  FileText, Calculator, PieChart as PieIcon, ArrowUp, ArrowDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, AreaChart, Area,
} from 'recharts'
import { MOCK_DAF_HOME } from '@/lib/mockMicrofinance'
import { DafComptabilitePanel } from '@/components/finance/DafComptabilitePanel'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { formatFcfa } from '@/lib/utils'

// ── Style maps ────────────────────────────────────────────────────────────────
const STATUT_BUDGET: Record<string, { bg: string; text: string; badge: string }> = {
  ALERTE:    { bg: 'bg-red-50',     text: 'text-red-700',    badge: 'bg-red-100 text-red-800 border-red-300'      },
  SURVEILLE: { bg: 'bg-orange-50',  text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800 border-orange-200'},
  SOUS_UTIL: { bg: 'bg-blue-50',    text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-800 border-blue-200'    },
  OK:        { bg: 'bg-slate-50',   text: 'text-slate-700',  badge: 'bg-green-100 text-green-800 border-green-200' },
}
const STATUT_AGENCE_COLORS: Record<string, string> = {
  PERFORMANTE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  CORRECTE:    'text-blue-700    bg-blue-50    border-blue-200',
  DEFICITAIRE: 'text-red-700     bg-red-50     border-red-300',
}
const STATUT_CASH: Record<string, { bg: string; text: string }> = {
  NORMAL:  { bg: 'bg-green-50',  text: 'text-green-700'  },
  TENSION: { bg: 'bg-orange-50', text: 'text-orange-700' },
}
const TONE_DOT: Record<string, string> = {
  attention: 'bg-orange-500',
  negatif:   'bg-red-500',
  positif:   'bg-green-500',
  info:      'bg-blue-400',
}
const TONE_BG: Record<string, string> = {
  attention: 'bg-orange-50 border-orange-200',
  negatif:   'bg-red-50    border-red-200',
  positif:   'bg-green-50  border-green-200',
  info:      'bg-blue-50   border-blue-200',
}
const AGENCE_COLORS = ['#14b8a6', '#6366f1', '#ef4444', '#f97316', '#a855f7']

// ── Mini helpers ──────────────────────────────────────────────────────────────
function Tb({ label, icon, active, onClick, alert }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void; alert?: boolean }) {
  return (
    <button onClick={onClick} className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${active ? 'border-cyan-700 text-cyan-800 bg-cyan-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
      {icon}{label}
      {alert && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
    </button>
  )
}

function MiniKpi({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-3 text-white ${color}`}>
      <div className="text-xl font-black">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5 opacity-90">{label}</div>
      {sub && <div className="text-[10px] opacity-75 mt-0.5">{sub}</div>}
    </div>
  )
}

// =============================================================================
//   TABS
// =============================================================================

function TabComptabilite({ d }: { d: typeof MOCK_DAF_HOME }) {
  return <DafComptabilitePanel d={{ comptabilite: d.comptabilite, bilan_consolide: d.bilan_consolide }} />
}

function TabTresorerie({ d }: { d: typeof MOCK_DAF_HOME }) {
  const t = d.tresorerie
  const fluxAvecSolde = t.flux_journal.map((f, i) => ({
    ...f,
    net: f.entrants - f.sortants,
  }))

  return (
    <div className="space-y-5">
      {/* Flux journal */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-teal-600" /> Flux journaliers — 5 derniers jours
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={fluxAvecSolde}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
            <Tooltip formatter={(v: any) => [formatFcfa(Number(v)), '']} />
            <Legend />
            <Bar dataKey="entrants" name="Entrants" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sortants" name="Sortants" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Prévisions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Prévision trésorerie — 5 prochains jours
          <AiBadge variant="small" label="Projection IA" />
        </h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={t.prevision_7j}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
            <Tooltip formatter={(v: any) => [formatFcfa(Number(v)), '']} />
            <Line type="monotone" dataKey="solde_proj" name="Solde projeté" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Par agence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {t.par_agence.map((ag, i) => {
          const s = STATUT_CASH[ag.statut] ?? STATUT_CASH.NORMAL
          return (
            <div key={i} className={`rounded-xl border p-4 border-slate-200 ${s.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">{ag.agence}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${ag.statut === 'TENSION' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                  {ag.statut}
                  {ag.statut === 'TENSION' && <AlertTriangle className="w-2.5 h-2.5" />}
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 mb-1">{formatFcfa(ag.solde)}</div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Ratio : <span className={`font-bold ${ag.ratio < 1.5 ? 'text-orange-700' : 'text-green-700'}`}>{ag.ratio}x</span></span>
                <span>Décaiss. prévu : <span className="font-semibold text-slate-700">{formatFcfa(ag.decaissement_prevu)}</span></span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TabBudget({ d }: { d: typeof MOCK_DAF_HOME }) {
  return (
    <div className="space-y-5">
      {/* Barres budget */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Suivi budgétaire — consommation par poste</h4>
        <div className="space-y-3">
          {d.budget.map((b, i) => {
            const s = STATUT_BUDGET[b.statut] ?? STATUT_BUDGET.OK
            return (
              <div key={i} className={`rounded-xl border p-3 ${s.bg} border-slate-200`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{b.poste}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.badge}`}>{b.statut}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">{formatFcfa(b.realise)} / {formatFcfa(b.budget)}</span>
                    <span className={`font-black text-sm ${b.deviation_pct > 5 ? 'text-red-700' : b.deviation_pct < -10 ? 'text-blue-700' : 'text-slate-700'}`}>{b.pct}%</span>
                    {b.deviation_pct !== 0 && (
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${b.deviation_pct > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {b.deviation_pct > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {Math.abs(b.deviation_pct)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${b.pct > 50 && b.statut === 'ALERTE' ? 'bg-red-500' : b.pct > 45 ? 'bg-orange-500' : b.pct < 30 ? 'bg-blue-400' : 'bg-teal-500'}`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Graphique budget */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Budget vs Réalisé — vue comparative</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={d.budget} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
            <YAxis dataKey="poste" type="category" tick={{ fontSize: 9 }} width={120} />
            <Tooltip formatter={(v: any) => [formatFcfa(Number(v)), '']} />
            <Legend />
            <Bar dataKey="budget"  name="Budget"  fill="#94a3b8" radius={[0, 4, 4, 0]} />
            <Bar dataKey="realise" name="Réalisé" fill="#14b8a6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TabRentabilite({ d }: { d: typeof MOCK_DAF_HOME }) {
  return (
    <div className="space-y-5">
      {/* Par agence */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-cyan-700" /> Rentabilité par agence
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Agence</th>
                <th className="text-right px-3 py-2 font-medium">Revenus</th>
                <th className="text-right px-3 py-2 font-medium">Charges</th>
                <th className="text-right px-3 py-2 font-medium">Résultat</th>
                <th className="text-center px-3 py-2 font-medium">Marge</th>
                <th className="text-center px-3 py-2 font-medium">ROI</th>
                <th className="text-center px-3 py-2 font-medium">PAR</th>
                <th className="text-center px-3 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {d.rentabilite_agences.map((ag, i) => (
                <tr key={i} className={`hover:bg-slate-50 ${ag.statut === 'DEFICITAIRE' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-3 py-2.5 font-bold text-slate-900">{ag.agence}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFcfa(ag.revenus)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{formatFcfa(ag.charges)}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-bold ${ag.resultat < 0 ? 'text-red-700' : 'text-green-700'}`}>{formatFcfa(ag.resultat)}</td>
                  <td className={`px-3 py-2.5 text-center font-black ${ag.marge_pct < 0 ? 'text-red-700' : ag.marge_pct >= 25 ? 'text-emerald-700' : 'text-blue-700'}`}>{ag.marge_pct}%</td>
                  <td className={`px-3 py-2.5 text-center font-bold ${ag.roi_pct < 0 ? 'text-red-700' : 'text-slate-700'}`}>{ag.roi_pct}%</td>
                  <td className={`px-3 py-2.5 text-center ${ag.par_pct > 5 ? 'text-red-700 font-bold' : 'text-slate-600'}`}>{ag.par_pct}%</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${STATUT_AGENCE_COLORS[ag.statut]}`}>{ag.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graphique rentabilité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Marge nette par agence</h5>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.rentabilite_agences}>
              <XAxis dataKey="agence" tick={{ fontSize: 9 }} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Marge']} />
              <Bar dataKey="marge_pct" radius={[4, 4, 0, 0]}>
                {d.rentabilite_agences.map((ag, i) => (
                  <Cell key={i} fill={ag.marge_pct < 0 ? '#ef4444' : ag.marge_pct >= 25 ? '#10b981' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Répartition revenus réseau</h5>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={d.rentabilite_agences} dataKey="revenus" nameKey="agence" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.agence?.split(' ')[0]}`}>
                {d.rentabilite_agences.map((_, i) => <Cell key={i} fill={AGENCE_COLORS[i % AGENCE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [formatFcfa(Number(v)), '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function TabControleGestion({ d }: { d: typeof MOCK_DAF_HOME }) {
  const cg = d.controle_gestion
  return (
    <div className="space-y-5">
      {/* KPIs productivité */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-cyan-700" /> KPIs productivité & performance
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Productivité agent',    value: formatFcfa(cg.kpis_performance.productivite_agent_fcfa), sub: 'revenus / agent' },
            { label: 'Revenus / employé',     value: formatFcfa(cg.kpis_performance.revenus_par_employe),     sub: 'par mois' },
            { label: 'Coût / dossier',        value: formatFcfa(cg.kpis_performance.cout_par_dossier),         sub: 'instruction crédit' },
            { label: 'Coût collecte',         value: formatFcfa(cg.kpis_performance.cout_collecte_fcfa),       sub: 'par transaction' },
            { label: 'CAC moyen',             value: formatFcfa(cg.kpis_performance.cac),                      sub: 'coût acquisition client' },
          ].map((k, i) => (
            <div key={i} className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-center">
              <div className="text-base font-black text-cyan-800">{k.value}</div>
              <div className="text-[10px] font-semibold text-cyan-600 uppercase mt-0.5">{k.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Analyse des écarts */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Analyse des écarts — objectif vs réalisé</h4>
        <div className="space-y-2">
          {cg.ecarts_vs_objectif.map((e, i) => (
            <div key={i} className={`rounded-xl border p-3 flex items-center gap-3 ${Math.abs(e.ecart_pct) > 10 ? 'bg-red-50 border-red-200' : Math.abs(e.ecart_pct) > 5 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs font-semibold text-slate-800 flex-1">{e.indicateur}</span>
              <span className="text-xs text-slate-500 tabular-nums">{typeof e.objectif === 'number' && e.objectif > 1000 ? formatFcfa(e.objectif) : e.objectif}</span>
              <span className="text-xs font-bold text-slate-900 tabular-nums">{typeof e.realise === 'number' && e.realise > 1000 ? formatFcfa(e.realise) : e.realise}</span>
              <span className={`text-sm font-black tabular-nums w-14 text-right ${e.ecart_pct > 5 ? 'text-red-700' : e.ecart_pct < -5 ? 'text-green-700' : 'text-slate-600'}`}>
                {e.ecart_pct > 0 ? '+' : ''}{e.ecart_pct}%
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${e.tendance === 'HAUSSE' ? 'bg-orange-100 text-orange-800' : e.tendance === 'BAISSE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{e.tendance}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rentabilité produits */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <PieIcon className="w-3.5 h-3.5 text-indigo-600" /> Rentabilité par produit financier
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Produit</th>
                  <th className="text-right px-3 py-2 font-medium">Revenus</th>
                  <th className="text-right px-3 py-2 font-medium">Coûts</th>
                  <th className="text-right px-3 py-2 font-medium">Marge</th>
                  <th className="text-center px-3 py-2 font-medium">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cg.rentabilite_produits.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{p.produit}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatFcfa(p.revenus)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{formatFcfa(p.couts)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-green-700 tabular-nums">{formatFcfa(p.marge)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-black text-sm ${p.marge_pct >= 50 ? 'text-emerald-700' : p.marge_pct >= 35 ? 'text-blue-700' : 'text-orange-700'}`}>{p.marge_pct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cg.rentabilite_produits} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="produit" type="category" tick={{ fontSize: 9 }} width={100} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Marge']} />
                <Bar dataKey="marge_pct" radius={[0, 4, 4, 0]}>
                  {cg.rentabilite_produits.map((p, i) => (
                    <Cell key={i} fill={p.marge_pct >= 50 ? '#10b981' : p.marge_pct >= 35 ? '#6366f1' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Prévisions trimestrielles */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Prévisions trimestrielles 2026
          <AiBadge variant="small" label="Projection" />
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cg.previsions_trimestre.map((q, i) => {
            const val = (q as any).revenus_realises ?? (q as any).revenus_proj
            const isRealise = !!(q as any).revenus_realises
            return (
              <div key={i} className={`rounded-xl border p-3 text-center ${isRealise ? 'bg-teal-50 border-teal-200' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="text-[10px] font-bold text-slate-500 uppercase">{q.trimestre}</div>
                <div className={`text-base font-black mt-1 ${isRealise ? 'text-teal-700' : 'text-indigo-700'}`}>{formatFcfa(val)}</div>
                <div className={`text-[10px] font-bold mt-0.5 ${q.ecart_pct > 0 ? 'text-green-600' : 'text-red-600'}`}>{q.ecart_pct > 0 ? '+' : ''}{q.ecart_pct}% vs obj.</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{isRealise ? 'Réalisé' : 'Projeté'}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
//   COMPOSANT PRINCIPAL
// =============================================================================
export function DashboardDAF() {
  const d = MOCK_DAF_HOME
  const [openSynth, setOpenSynth] = useState(true)
  const [activeTab, setActiveTab] = useState<'compta' | 'tresorerie' | 'budget' | 'rentabilite' | 'gestion'>('compta')

  return (
    <div className="space-y-5">

      {/* ─── Synthèse IA ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-cyan-50 via-teal-50 to-indigo-50 border border-cyan-200 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setOpenSynth(v => !v)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/30 transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-cyan-800 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">Synthèse IA — Finance & Contrôle de Gestion</h2>
                <AiBadge variant="small" pulse />
              </div>
              <p className="text-xs text-slate-500">Générée {d.synthese_ia.date_generation}</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSynth ? 'rotate-180' : ''}`} />
        </button>

        {openSynth && (
          <div className="px-4 sm:px-5 pb-5 space-y-4">
            <p className="text-sm text-slate-800 font-medium border-l-4 border-cyan-600 pl-3 italic leading-relaxed">{d.synthese_ia.intro}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {d.synthese_ia.points.map((p: any, i: number) => (
                <div key={i} className={`rounded-xl border p-3 ${TONE_BG[p.tone] ?? 'bg-white border-slate-200'}`}>
                  <div className="flex items-start gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TONE_DOT[p.tone]}`} />
                    <span className="text-xs font-medium text-slate-800 leading-snug">{p.texte}</span>
                  </div>
                  {p.action && <div className="ml-4 text-[11px] font-semibold text-slate-600 bg-white/80 rounded px-2 py-1 border border-white">→ {p.action}</div>}
                </div>
              ))}
            </div>
            {/* 3 analyses stratégiques */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {[
                { icon: Wallet,    color: 'border-teal-200',   label: 'Trésorerie',    text: d.synthese_ia.analyse_tresorerie  },
                { icon: BarChart3, color: 'border-indigo-200', label: 'Rentabilité',   text: d.synthese_ia.analyse_rentabilite },
                { icon: FileText,  color: 'border-amber-200',  label: 'Budget',        text: d.synthese_ia.analyse_budget      },
              ].map((sec, i) => (
                <div key={i} className={`bg-white rounded-xl p-3 border ${sec.color}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <sec.icon className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{sec.label}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{sec.text}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-cyan-800" />
                <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider">Plan d'action DAF</span>
              </div>
              <ol className="space-y-2">
                {d.synthese_ia.priorites.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-cyan-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-xs text-slate-700 leading-snug">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>

      {/* ─── KPIs globaux ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-800" />
            Tableau de bord Financier
          </h2>
          <ExportButton filename="rapport-daf" size="sm" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <MiniKpi label="Trésorerie" value={formatFcfa(d.kpis_finance.tresorerie_disponible)} sub={`+${d.kpis_finance.tresorerie_delta_m1_pct}% M-1`} color="bg-teal-600" />
          <MiniKpi label="Résultat net" value={formatFcfa(d.kpis_finance.resultat_net_mois)} sub={`+${d.kpis_finance.resultat_net_delta_pct}% M-1`} color="bg-indigo-600" />
          <MiniKpi label="Produits financiers" value={formatFcfa(d.kpis_finance.produits_financiers_mois)} color="bg-cyan-700" />
          <MiniKpi label="Charges opérat." value={formatFcfa(d.kpis_finance.charges_operationnelles)} sub="vs prévu 23M" color={d.kpis_finance.charges_operationnelles > 23_000_000 ? 'bg-orange-500' : 'bg-green-600'} />
          <MiniKpi label="Ratio liquidité" value={`${d.kpis_finance.ratio_liquidite}x`} sub={`min ${d.kpis_finance.ratio_liquidite_min}x`} color={d.kpis_finance.ratio_liquidite >= d.kpis_finance.ratio_liquidite_min ? 'bg-green-600' : 'bg-red-500'} />
          <MiniKpi label="Coût du risque" value={`${d.kpis_finance.cout_risque_pct}%`} sub={`+${d.kpis_finance.cout_risque_delta_pct}%`} color="bg-amber-600" />
          <MiniKpi label="Coeff. exploitation" value={`${d.kpis_finance.coefficient_exploitation_pct}%`} sub={`obj. ${d.kpis_finance.objectif_coeff_pct}%`} color={d.kpis_finance.coefficient_exploitation_pct <= d.kpis_finance.objectif_coeff_pct ? 'bg-green-600' : 'bg-orange-500'} />
          <MiniKpi label="Objectif annuel" value={`${d.kpis_finance.taux_realisation_annuel_pct}%`} sub={formatFcfa(d.kpis_finance.resultats_annuel_ytd)} color="bg-violet-700" />
        </div>
      </section>

      {/* ─── Tabs ───────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          <Tb label="Comptabilité"      icon={<Calculator   className="w-4 h-4" />} active={activeTab === 'compta'}      onClick={() => setActiveTab('compta')} alert={d.comptabilite.ecritures_attente > 0 || d.comptabilite.suspens_comptables.some(s => s.statut === 'CRITIQUE')} />
          <Tb label="Trésorerie"        icon={<Wallet       className="w-4 h-4" />} active={activeTab === 'tresorerie'}  onClick={() => setActiveTab('tresorerie')} />
          <Tb label="Budgets"           icon={<FileText     className="w-4 h-4" />} active={activeTab === 'budget'}      onClick={() => setActiveTab('budget')} alert={d.budget.some((b: any) => b.statut === 'ALERTE')} />
          <Tb label="Rentabilité"       icon={<BarChart3    className="w-4 h-4" />} active={activeTab === 'rentabilite'} onClick={() => setActiveTab('rentabilite')} />
          <Tb label="Contrôle Gestion"  icon={<PieIcon      className="w-4 h-4" />} active={activeTab === 'gestion'}     onClick={() => setActiveTab('gestion')} />
        </div>
        <div className="p-4 sm:p-5">
          {activeTab === 'compta'      && <TabComptabilite      d={d} />}
          {activeTab === 'tresorerie'  && <TabTresorerie        d={d} />}
          {activeTab === 'budget'      && <TabBudget            d={d} />}
          {activeTab === 'rentabilite' && <TabRentabilite       d={d} />}
          {activeTab === 'gestion'     && <TabControleGestion   d={d} />}
        </div>
      </section>

    </div>
  )
}
