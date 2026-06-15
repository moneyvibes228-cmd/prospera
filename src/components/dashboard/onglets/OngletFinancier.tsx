'use client'
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Receipt,
  AlertTriangle, BarChart2, Banknote, LineChart as LineChartIcon,
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from 'recharts'
import { REVENUS_CHARGES, TRESORERIE } from '@/lib/mockMicrofinance'
import { AiBadge } from '../AiBadge'
import { KpiCardWithSparkline } from '../KpiCardWithSparkline'
import { formatFcfa } from '@/lib/utils'

const SEVERITE_COLOR: Record<string, string> = {
  INFO: 'bg-blue-50 border-blue-200 text-blue-700',
  WARN: 'bg-orange-50 border-orange-200 text-orange-700',
  CRITIQUE: 'bg-red-50 border-red-200 text-red-700',
}

export function OngletFinancier() {
  const { ca_brut, revenus_nets, charges_totales, profit_net, marge_nette_pct,
          cout_du_risque_pct, cout_du_risque_montant, roi_annualise_pct,
          variation_profit_mom, revenus_detail, charges_detail,
          evolution_12_mois, ratios_cles } = REVENUS_CHARGES
  const { solde_actuel, solde_minimum_legal, marge_securite_pct, autonomie_semaines,
          variation_jour, variation_jour_pct, flux_7j, flux_par_categorie_mois,
          previsions_30j, alertes_tresorerie } = TRESORERIE

  return (
    <div className="space-y-5">

      {/* ── KPIs Financiers ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700">KPIs Financiers & Rentabilité</h2>
          <AiBadge variant="small" label="DAF pilotage" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCardWithSparkline
            title="Revenus nets mois"
            value={revenus_nets}
            unit="FCFA"
            variation={2.4}
            variationLabel={`CA brut ${formatFcfa(ca_brut)}`}
            sparkline={evolution_12_mois.map(m => m.revenus / 1_000_000)}
            colorScheme="green"
            badge="Revenus"
            format="fcfa"
          />
          <KpiCardWithSparkline
            title="Profit net"
            value={profit_net}
            unit="FCFA"
            variation={variation_profit_mom}
            variationLabel={`Marge ${marge_nette_pct}%`}
            sparkline={evolution_12_mois.map(m => m.profit / 1_000_000)}
            colorScheme="teal"
            badge="Profit"
            format="fcfa"
          />
          <KpiCardWithSparkline
            title="Coût du risque"
            value={`${cout_du_risque_pct}%`}
            variation={0.2}
            variationLabel={formatFcfa(cout_du_risque_montant)}
            sparkline={[2.1, 2.0, 1.9, 1.85, 1.8, 1.8, 1.78, 1.8, 1.8]}
            colorScheme="orange"
            invertVariation
            badge="Risque"
          />
          <KpiCardWithSparkline
            title="ROI annualisé"
            value={`${roi_annualise_pct}%`}
            variation={1.6}
            variationLabel="cible > 18%"
            sparkline={[19.8, 20.4, 20.9, 21.3, 21.8, 22.0, 22.2, 22.3, 22.4]}
            colorScheme="purple"
            badge="ROI"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          TRÉSORERIE : Solde + Flux + Prévisions 30j
         ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={15} className="text-teal-700" />
            <h3 className="text-sm font-semibold text-slate-900">Trésorerie en direct</h3>
          </div>
          <div className="text-3xl font-black text-teal-800">{formatFcfa(solde_actuel)}</div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={11} className="text-green-600" />
            <span className="text-xs font-bold text-green-600">+{variation_jour_pct}%</span>
            <span className="text-[11px] text-slate-500">· +{formatFcfa(variation_jour)} aujourd'hui</span>
          </div>
          <div className="mt-4 pt-4 border-t border-teal-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Min. légal BCEAO</span>
              <span className="font-bold text-slate-700">{formatFcfa(solde_minimum_legal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Marge sécurité</span>
              <span className="font-bold text-green-700">+{marge_securite_pct}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Autonomie</span>
              <span className="font-bold text-teal-700">{autonomie_semaines} semaines</span>
            </div>
            <div className="mt-2 bg-teal-100 rounded-full h-2">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(marge_securite_pct, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Flux entrants / sortants — 7 derniers jours</h3>
            <AiBadge variant="small" label={`Flux net +${formatFcfa(flux_par_categorie_mois.flux_net)} ce mois`} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={flux_7j} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip formatter={v => formatFcfa(Number(v))} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="entrants" name="Entrants" fill="#16a34a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sortants" name="Sortants" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LineChartIcon size={15} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Prévisions trésorerie 30 jours</h3>
              <AiBadge variant="small" label="3 scénarios IA" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={previsions_30j} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="jour" tick={{ fontSize: 10 }} tickFormatter={v => `J+${v}`} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={v => formatFcfa(Number(v))} labelFormatter={v => `J+${v}`} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={solde_minimum_legal} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'Min. légal', position: 'right', fontSize: 9 }} />
              <Line type="monotone" dataKey="scenario_optimiste"  name="Optimiste"  stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="scenario_central"     name="Central"    stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="scenario_pessimiste" name="Pessimiste" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-3">
          {alertes_tresorerie.map((a, i) => (
            <div key={i} className={`p-3 rounded-xl border ${SEVERITE_COLOR[a.severite]}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} />
                <span className="text-[10px] font-bold uppercase">{a.severite}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{a.code}</span>
              </div>
              <p className="text-xs">{a.message}</p>
            </div>
          ))}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Flux mensuel agrégé</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Total entrants</span>
                <span className="font-bold text-green-700">+{formatFcfa(flux_par_categorie_mois.entrants.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total sortants</span>
                <span className="font-bold text-red-700">-{formatFcfa(flux_par_categorie_mois.sortants.total)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-semibold">Flux net</span>
                <span className="font-bold text-teal-700">+{formatFcfa(flux_par_categorie_mois.flux_net)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════
          REVENUS DÉTAILLÉS
         ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Banknote size={15} className="text-green-600" />
            <h3 className="text-sm font-semibold text-slate-900">Décomposition des revenus</h3>
            <AiBadge variant="small" label={`${formatFcfa(revenus_nets)} nets`} />
          </div>
          <span className="text-xs text-slate-400">8 sources · Intérêts dominent (76%)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-bold">Source</th>
                <th className="text-right px-3 py-3 font-bold">Montant</th>
                <th className="text-center px-3 py-3 font-bold">Part %</th>
                <th className="text-center px-3 py-3 font-bold">Variation</th>
                <th className="text-left px-3 py-3 font-bold">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {revenus_detail.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-xs font-semibold text-slate-800">{r.source}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-green-700">{formatFcfa(r.montant)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="w-12 bg-slate-100 rounded-full h-1.5">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${(r.pct / 50) * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 w-9 text-right">{r.pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[11px] font-bold ${r.variation_pct > 0 ? 'text-green-600' : r.variation_pct < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {r.variation_pct > 0 ? '+' : ''}{r.variation_pct}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-500 italic">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          CHARGES DÉTAILLÉES
         ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Receipt size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Décomposition des charges</h3>
            <AiBadge variant="small" label={`${formatFcfa(charges_totales)} totales`} />
          </div>
          <span className="text-xs text-slate-400">7 postes · Personnel dominant (68%)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-bold">Poste</th>
                <th className="text-left px-3 py-3 font-bold">Type</th>
                <th className="text-right px-3 py-3 font-bold">Montant</th>
                <th className="text-center px-3 py-3 font-bold">Part %</th>
                <th className="text-center px-3 py-3 font-bold">Variation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {charges_detail.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-xs font-semibold text-slate-800">{c.poste}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{c.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-red-700">{formatFcfa(c.montant)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="w-12 bg-slate-100 rounded-full h-1.5">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${c.pct}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 w-9 text-right">{c.pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[11px] font-bold ${c.variation_pct > 5 ? 'text-red-600' : c.variation_pct < 0 ? 'text-green-600' : 'text-slate-500'}`}>
                      {c.variation_pct > 0 ? '+' : ''}{c.variation_pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          ÉVOLUTION 12 MOIS + RATIOS PRUDENTIELS
         ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={15} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Évolution revenus / charges / profit — 12 mois</h3>
            </div>
            <AiBadge variant="small" label="Trend solide" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={evolution_12_mois} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={v => formatFcfa(Number(v))} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="revenus" name="Revenus" stroke="#16a34a" fill="url(#gradRevenus)" strokeWidth={2} />
              <Area type="monotone" dataKey="charges" name="Charges" stroke="#dc2626" fill="none" strokeWidth={2} />
              <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#14b8a6" fill="url(#gradProfit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <PiggyBank size={15} className="text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-900">Ratios prudentiels</h3>
          </div>
          <div className="p-4 space-y-2.5">
            {ratios_cles.map((r, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-slate-700">{r.ratio}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    r.statut === 'BON' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>{r.statut}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-800">{r.valeur}</span>
                  <span className="text-[10px] text-slate-400">{r.cible}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
