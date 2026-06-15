'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Cell,
} from 'recharts'
import {
  PiggyBank, Target, Bell, ChevronRight,
  AlertTriangle, Smartphone, Coins,
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { getEpargneHub, RAPPORT_IA_EPARGNE } from '@/lib/epargne-hub'
import { EPARGNE_STATS } from '@/lib/mockMicrofinance'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { KpiCardWithSparkline } from '@/components/dashboard/KpiCardWithSparkline'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { AiInsightPanel } from '@/components/dashboard/AiInsightPanel'
import { EpargneDgTables } from '@/components/epargne/EpargneDgTables'
import { formatFcfa, cn } from '@/lib/utils'

type Tab = 'comptes' | 'mouvements' | 'produits' | 'dormants' | 'tontines'

export function EpargneDgView() {
  const hub = getEpargneHub()
  const [tab, setTab] = useState<Tab>('comptes')

  const prioritesP1 = RAPPORT_IA_EPARGNE.recommandations.filter(r => r.priorite === 1)
  const encoursSparkline = hub.evolution_mensuelle.map(e => e.encours)
  const moisLabels = hub.evolution_mensuelle.map(e => e.mois)

  const repartitionProduits = useMemo(
    () => EPARGNE_STATS.par_type.map(t => ({
      nom: t.label,
      encours: t.encours,
      pct: t.pct,
      color: t.color,
    })),
    [],
  )

  const tontinesUrgentes = hub.tontines.filter(t => t.statut === 'CLOTURE_IMMINENTE')

  return (
    <PageWrapper
      title="Pilotage épargne réseau"
      subtitle={`${hub.kpis.comptes_actifs} comptes · ${formatFcfa(hub.kpis.encours_total_fcfa)} encours · Vue direction`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {tontinesUrgentes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg animate-pulse">
              <Bell size={13} />
              {tontinesUrgentes.length} tontine(s) à clôturer
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-xs">
            <span className="font-black text-teal-600">+{hub.kpis.croissance_30j_pct}%</span>
            <span className="text-slate-500">croissance 30j</span>
          </div>
          <ExportButton label="Exporter rapport épargne" filename="pilotage_epargne" size="sm" />
        </div>
      }
    >
      <RapportIAGlobal rapport={RAPPORT_IA_EPARGNE} accentColor="teal" analyseLabel="Épargne réseau" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCardWithSparkline
          title="Encours total"
          value={hub.kpis.encours_total_fcfa}
          format="fcfa"
          variation={8.4}
          variationLabel="vs avril"
          sparkline={encoursSparkline}
          sparklineLabels={moisLabels}
          colorScheme="teal"
        />
        <KpiCardWithSparkline
          title="Comptes actifs"
          value={hub.kpis.comptes_actifs}
          format="number"
          variation={1.1}
          variationLabel="vs avril"
          sparkline={hub.evolution_mensuelle.map((_, i) => 272 + i * 3)}
          sparklineLabels={moisLabels}
          colorScheme="blue"
        />
        <KpiCardWithSparkline
          title="Dormants >6 mois"
          value={hub.kpis.comptes_dormants}
          format="number"
          variation={-7.3}
          variationLabel="vs avril"
          sparkline={[55, 54, 53, 52, 51, 51]}
          sparklineLabels={moisLabels}
          colorScheme="orange"
          invertVariation
        />
        <KpiCardWithSparkline
          title="Flux net mensuel"
          value={EPARGNE_STATS.flux_mois.solde_net}
          format="fcfa"
          variation={12.4}
          variationLabel="vs avril"
          sparkline={hub.evolution_mensuelle.map(e => e.depots - e.retraits)}
          sparklineLabels={moisLabels}
          colorScheme="green"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] text-slate-400 uppercase">Ticket moyen</div>
          <div className="text-lg font-black text-slate-800">{formatFcfa(hub.kpis.ticket_moyen_fcfa)}</div>
          <div className="text-[10px] text-green-600 font-bold mt-0.5">+4 % vs T1</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <Smartphone size={10} /> Mobile Money
          </div>
          <div className="text-lg font-black text-indigo-700">{hub.kpis.ratio_momo_pct}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">des dépôts</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] text-slate-400 uppercase">Cross-sell éligible</div>
          <div className="text-lg font-black text-teal-700">38 clients</div>
          <div className="text-[10px] text-teal-600 font-bold mt-0.5">12 M FCFA crédit garanti</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] text-slate-400 uppercase">Couverture liquidité</div>
          <div className="text-lg font-black text-slate-800">{hub.kpis.liquidite_couverture_jours} jours</div>
          <div className={`text-[10px] font-bold mt-0.5 ${hub.liquidite.risque_retraits_semaine === 'ELEVE' ? 'text-red-600' : hub.liquidite.risque_retraits_semaine === 'MODERE' ? 'text-orange-600' : 'text-green-600'}`}>
            Risque {hub.liquidite.risque_retraits_semaine.toLowerCase()}
          </div>
        </div>
      </div>

      {prioritesP1.length > 0 && (
        <div className="mb-5 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-red-600" />
            <h2 className="text-sm font-bold text-slate-900">Décisions prioritaires — épargne</h2>
            <AiBadge variant="small" label="P1 IA" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prioritesP1.map((rec, i) => (
              <div key={i} className="flex gap-3 p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                <span className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  P{rec.priorite}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{rec.action}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-[10px]">
                    <span className="text-teal-700 font-bold">{rec.impact_estime}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{rec.delai}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-5">
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Évolution encours & flux</h2>
            <AiBadge variant="small" label="6 mois" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hub.evolution_mensuelle}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v) => formatFcfa(Number(v))} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="encours" name="Encours" stroke="#0d9488" fill="#0d948833" strokeWidth={2} />
              <Line type="monotone" dataKey="depots" name="Dépôts" stroke="#16a34a" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="retraits" name="Retraits" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <PiggyBank size={15} className="text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Répartition par produit</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={repartitionProduits} layout="vertical" margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="nom" width={90} tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v) => formatFcfa(Number(v))} />
              <Bar dataKey="encours" radius={[0, 4, 4, 0]}>
                {repartitionProduits.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-5">
        <div className="xl:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Encours par agence</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hub.par_agence}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nom" tick={{ fontSize: 9 }} />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatFcfa(Number(v))} />
              <Bar dataKey="encours" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Encours" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-5 gap-1 text-[9px] text-center">
            {hub.par_agence.map(a => (
              <div key={a.agence_id}>
                <div className={`font-bold ${a.croissance_pct >= 10 ? 'text-green-600' : a.croissance_pct < 3 ? 'text-red-600' : 'text-orange-600'}`}>
                  +{a.croissance_pct}%
                </div>
                <div className="text-slate-400">{a.dormants} dorm.</div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
            <Smartphone size={14} className="text-indigo-600" />
            Canaux
          </h2>
          <div className="space-y-3">
            {hub.par_canal.map(c => (
              <div key={c.canal}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{c.canal}</span>
                  <span className="font-bold" style={{ color: c.color }}>{c.depots_pct}% dépôts</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2">
                  <div className="h-full rounded-full" style={{ width: `${c.depots_pct}%`, backgroundColor: c.color }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{formatFcfa(c.volume_fcfa)} volume</div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <Coins size={14} className="text-teal-600" />
            Liquidité réseau
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Encours épargne</span>
              <span className="font-bold">{formatFcfa(hub.liquidite.encours_epargne)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Réserves BCEAO</span>
              <span className="font-bold">{formatFcfa(hub.liquidite.reserves_obligatoires)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Liquidité dispo.</span>
              <span className="font-bold text-teal-700">{formatFcfa(hub.liquidite.liquidite_disponible)}</span>
            </div>
          </div>
          {hub.liquidite.alerte_liquidite && (
            <div className="mt-3 p-2.5 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-800">
              <AlertTriangle size={12} className="inline mr-1" />
              {hub.liquidite.alerte_liquidite}
            </div>
          )}
          <Link href="/operations-bancaires" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900">
            Opérations bancaires <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {tontinesUrgentes.length > 0 && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600" />
            <h2 className="text-sm font-bold text-red-900">Tontines — clôtures imminentes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tontinesUrgentes.map(t => (
              <div key={t.id} className="p-3 bg-white rounded-lg border border-red-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900">{t.nom}</div>
                    <div className="text-xs text-slate-500">{t.agence} · {t.membres} membres · Cycle {t.cycle_num}</div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-200">
                    {t.prochaine_cloture}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="font-black text-teal-700">{formatFcfa(t.encours_fcfa)}</span>
                  <span className="text-orange-600 font-bold">{t.collecte_pct}% collecté</span>
                </div>
                {t.alerte && <p className="text-xs text-red-700 mt-1.5">{t.alerte}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <AiInsightPanel titre="Analyse IA — leviers épargne" insights={hub.ia_insights} collapsible />

      <div className="mb-4 mt-6 flex flex-wrap gap-2 items-center">
        {(['comptes', 'mouvements', 'produits', 'dormants', 'tontines'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium capitalize cursor-pointer transition-colors',
              tab === t ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200',
            )}
          >
            {t === 'dormants' ? `Dormants (${hub.kpis.comptes_dormants})` : t}
          </button>
        ))}
      </div>

      <EpargneDgTables hub={hub} tab={tab} />

      {hub.cross_sell.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">Cross-sell crédit garanti épargne — top éligibles</h2>
            <AiBadge variant="small" label="38 clients" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hub.cross_sell.map((c, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-teal-100">
                <div className="font-bold text-slate-900">{c.client}</div>
                <div className="text-xs text-slate-500">{c.agence}</div>
                <div className="flex justify-between mt-2 text-sm">
                  <span>Épargne <strong className="text-teal-700">{formatFcfa(c.solde_epargne)}</strong></span>
                  <span>Crédit <strong className="text-emerald-700">{formatFcfa(c.montant_credit_eligible)}</strong></span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Score risque {c.score_risque}/100</div>
              </div>
            ))}
          </div>
          <Link href="/credit/pipeline" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900">
            Voir pipeline crédit <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </PageWrapper>
  )
}
