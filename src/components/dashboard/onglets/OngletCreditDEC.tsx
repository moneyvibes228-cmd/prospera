'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Clock, FileX, TrendingDown, Users, Activity,
  ShieldAlert, BarChart3, AlertOctagon, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts'
import {
  RISQUE_AVANCE, DOSSIERS_CREDIT_STATS,
} from '@/lib/mockMicrofinance'
import { buildCreditDecKpis } from '@/lib/credit-dossiers-stats'
import { DecisionsCreditPanel } from '../DecisionsCreditPanel'
import { AiBadge } from '../AiBadge'
import { KpiCardWithSparkline } from '../KpiCardWithSparkline'
import { formatFcfa } from '@/lib/utils'

const SEVERITE_BADGE: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-700 border-red-200',
  HAUTE:    'bg-orange-100 text-orange-700 border-orange-200',
  WARN:     'bg-orange-100 text-orange-700 border-orange-200',
  MOYENNE:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  NORMAL:   'bg-green-100 text-green-700 border-green-200',
  INFO:     'bg-blue-100 text-blue-700 border-blue-200',
}

const TENDANCE_LABEL: Record<string, { label: string; color: string }> = {
  HAUSSE: { label: '↑ Hausse',  color: 'text-red-600' },
  STABLE: { label: '→ Stable',  color: 'text-slate-500' },
  BAISSE: { label: '↓ Baisse',  color: 'text-green-600' },
}

export function OngletCreditDEC() {
  const router = useRouter()
  const [agenceFiltre, setAgenceFiltre] = useState<string | null>(null)
  const kpis = buildCreditDecKpis()
  const { par_granulaire, taux_defaut_pct, taux_recouvrement_pct,
          prets_restructures_mois, prets_contentieux_mois, encours_contentieux,
          evolution_par_30j_par_agence, top_clients_risque, dossiers_bloques_48h,
          hausses_anormales_defauts, concentrations_suspectes, aging_detail } = RISQUE_AVANCE

  return (
    <div className="space-y-5">

      {/* ── KPIs Crédit DEC (4 cards) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700">KPIs Crédit & Risque</h2>
          <AiBadge variant="small" label="Pilotage DEC temps réel" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCardWithSparkline
            title="Portefeuille actif"
            value={kpis.portefeuille.value}
            unit="emprunteurs"
            variation={kpis.portefeuille.variationMoM}
            variationLabel={kpis.portefeuille.pipelineLabel}
            sparkline={kpis.portefeuille.sparkline}
            colorScheme="blue"
            badge="Portefeuille"
          />
          <KpiCardWithSparkline
            title="Délai moyen validation"
            value={kpis.delai.value}
            unit="jours"
            variation={kpis.delai.variationMoM}
            variationLabel={`obj. ${kpis.delai.objectif}j`}
            sparkline={kpis.delai.sparkline}
            colorScheme="orange"
            invertVariation
            badge="SLA"
          />
          <KpiCardWithSparkline
            title="Taux de défaut"
            value={`${taux_defaut_pct}%`}
            variation={kpis.tauxDefaut.variationAbs}
            variationLabel="vs avril"
            sparkline={kpis.tauxDefaut.sparkline}
            colorScheme="red"
            invertVariation
            badge="Risque"
          />
          <KpiCardWithSparkline
            title="Taux recouvrement"
            value={`${taux_recouvrement_pct}%`}
            variation={kpis.recouvrement.variationAbs}
            variationLabel="vs avril"
            sparkline={kpis.recouvrement.sparkline}
            colorScheme="green"
            badge="Performance"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          PAR GRANULAIRE 1/7/30/60/90 — seuils BCEAO
         ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">PAR granulaire — 1 / 7 / 30 / 60 / 90 jours</h3>
            <AiBadge variant="small" label="Seuils BCEAO" />
          </div>
          <span className="text-xs text-slate-400">Tous les seuils sont en zone NORMAL — réseau sain</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'PAR 1',  data: par_granulaire.par_1,  desc: '1+ jour de retard' },
              { label: 'PAR 7',  data: par_granulaire.par_7,  desc: '7+ jours' },
              { label: 'PAR 30', data: par_granulaire.par_30, desc: '30+ jours (BCEAO)' },
              { label: 'PAR 60', data: par_granulaire.par_60, desc: '60+ jours' },
              { label: 'PAR 90', data: par_granulaire.par_90, desc: '90+ jours' },
            ].map(item => {
              const ratio = (item.data.valeur_pct / item.data.seuil_alerte) * 100
              const couleur = ratio < 70 ? '#16a34a' : ratio < 90 ? '#f97316' : '#dc2626'
              return (
                <div key={item.label} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${SEVERITE_BADGE[item.data.statut]}`}>{item.data.statut}</span>
                  </div>
                  <div className="text-2xl font-black mt-1" style={{ color: couleur }}>{item.data.valeur_pct}%</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                  <div className="mt-2 text-[10px] text-slate-500">{formatFcfa(item.data.montant)}</div>
                  <div className="mt-1.5 bg-white rounded-full h-1.5 border border-slate-200">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(ratio, 100)}%`, backgroundColor: couleur }} />
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">Seuil {item.data.seuil_alerte}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          HEATMAP PAR × AGENCE
         ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">Heatmap PAR par agence</h3>
            <AiBadge variant="small" label="Cliquez pour drill-down agence" />
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100">
                <th className="text-left px-3 py-2 font-bold">Agence</th>
                <th className="text-center px-2 py-2 font-bold">PAR 1</th>
                <th className="text-center px-2 py-2 font-bold">PAR 7</th>
                <th className="text-center px-2 py-2 font-bold">PAR 30</th>
                <th className="text-center px-2 py-2 font-bold">PAR 60</th>
                <th className="text-center px-2 py-2 font-bold">PAR 90</th>
                <th className="text-right px-3 py-2 font-bold">Tendance</th>
              </tr>
            </thead>
            <tbody>
              {evolution_par_30j_par_agence.map(row => {
                const cells = [
                  { k: 'par_1',  v: row.par_1,  seuil: 15 },
                  { k: 'par_7',  v: row.par_7,  seuil: 12 },
                  { k: 'par_30', v: row.par_30, seuil: 10 },
                  { k: 'par_60', v: row.par_60, seuil: 6 },
                  { k: 'par_90', v: row.par_90, seuil: 4 },
                ]
                const isSelected = agenceFiltre === row.agence
                return (
                  <tr key={row.agence}
                      onClick={() => setAgenceFiltre(prev => prev === row.agence ? null : row.agence)}
                      className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-teal-50' : ''}`}>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{row.agence}</td>
                    {cells.map(c => {
                      const ratio = c.v / c.seuil
                      const bg = ratio < 0.7 ? '#dcfce7' : ratio < 0.9 ? '#fed7aa' : ratio < 1 ? '#fecaca' : '#dc2626'
                      const fg = ratio < 0.7 ? '#15803d' : ratio < 0.9 ? '#ea580c' : ratio < 1 ? '#b91c1c' : '#ffffff'
                      return (
                        <td key={c.k} className="px-2 py-2">
                          <div className="rounded-md py-1.5 text-center text-xs font-bold"
                               style={{ backgroundColor: bg, color: fg }}>
                            {c.v}%
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-right">
                      <span className={`text-xs font-bold ${TENDANCE_LABEL[row.tendance].color}`}>
                        {TENDANCE_LABEL[row.tendance].label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="mt-3 px-2 flex items-center gap-3 text-[10px] text-slate-400">
            <span>Légende :</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#dcfce7' }} /> &lt; 70% seuil</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#fed7aa' }} /> 70-90%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#fecaca' }} /> 90-100%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }} /> Dépassement</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          DOSSIERS BLOQUÉS — clic → fiche détail
         ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm">
        <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-900">Dossiers bloqués &gt; 48h</h3>
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{dossiers_bloques_48h.length}</span>
            <AiBadge variant="small" label="Cliquez pour fiche dossier" />
          </div>
          <span className="text-xs text-red-700 font-semibold">
            {formatFcfa(dossiers_bloques_48h.reduce((s, d) => s + d.montant, 0))} bloqués
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {dossiers_bloques_48h.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => router.push(`/dashboard/credit/dossiers/${d.id}`)}
              className="p-4 hover:bg-red-50/50 text-left transition-colors group w-full"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 group-hover:text-red-900">{d.client}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                    {d.bloque_depuis_h}h
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-red-600" />
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mb-1">{d.id} · {formatFcfa(d.montant)} · {d.etape}</div>
              <div className="text-[11px] text-slate-600 italic">&ldquo;{d.raison}&rdquo;</div>
              <div className="text-[10px] text-teal-700 mt-1 font-semibold">Agent : {d.agent} · {d.agence}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          DÉCISIONS CRÉDIT DU MOIS (intégré)
         ═══════════════════════════════════════════════════ */}
      <DecisionsCreditPanel />

      {/* ═══════════════════════════════════════════════════
          TOP CLIENTS À RISQUE (Top 10 PD/EL)
         ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Top 10 clients à risque</h3>
            <AiBadge variant="small" label="Cliquez pour fiche client" />
          </div>
          <span className="text-xs text-slate-400">Total exposé : {formatFcfa(top_clients_risque.reduce((s, c) => s + c.encours, 0))} · EL : {formatFcfa(top_clients_risque.reduce((s, c) => s + c.el, 0))}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-bold">#</th>
                <th className="text-left px-3 py-3 font-bold">Client</th>
                <th className="text-left px-3 py-3 font-bold">Agence · Agent</th>
                <th className="text-right px-3 py-3 font-bold">Encours</th>
                <th className="text-center px-3 py-3 font-bold">Score IA</th>
                <th className="text-center px-3 py-3 font-bold">PD</th>
                <th className="text-right px-3 py-3 font-bold">EL</th>
                <th className="text-center px-3 py-3 font-bold">Retard</th>
                <th className="text-left px-3 py-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {top_clients_risque.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/dashboard/credit/clients/${c.id}`)}
                  className={`hover:bg-teal-50 cursor-pointer transition-colors ${i < 3 ? 'bg-red-50/30' : ''}`}
                >
                  <td className="px-5 py-3">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      i < 3 ? 'bg-red-500 text-white' : i < 6 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>{i + 1}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-800">{c.nom}</div>
                    <div className="text-[10px] text-slate-400">{c.id}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-slate-700">{c.agence}</div>
                    <div className="text-[10px] text-slate-400">{c.agent}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-slate-800">{formatFcfa(c.encours)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      c.score_ia < 45 ? 'bg-red-100 text-red-700' :
                      c.score_ia < 55 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{c.score_ia}/100</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs font-bold text-red-700">{c.pd_pct}%</span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-red-700">{formatFcfa(c.el)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      c.jours_retard > 60 ? 'bg-red-100 text-red-700' :
                      c.jours_retard > 30 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{c.jours_retard}j</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-teal-700 font-semibold">{c.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          ALERTES CRITIQUES CRÉDIT
         ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">

        {/* Hausses anormales défauts */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-orange-200 shadow-sm">
          <div className="px-5 py-4 border-b border-orange-100 flex items-center gap-2 bg-orange-50">
            <TrendingDown size={15} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-900">Hausses anormales défauts</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {hausses_anormales_defauts.map((h, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">{h.agence} · {h.agent}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${SEVERITE_BADGE[h.alerte]}`}>{h.alerte}</span>
                </div>
                <div className="text-2xl font-black text-red-600">+{h.variation_pct}%</div>
                <div className="text-[11px] text-slate-500">{h.periode}</div>
                <div className="text-[11px] text-slate-600 italic mt-1">{h.commentaire}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Concentrations suspectes */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-red-200 shadow-sm">
          <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2 bg-red-50">
            <AlertOctagon size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-900">Concentrations suspectes</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {concentrations_suspectes.map((c, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{c.type}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${SEVERITE_BADGE[c.alerte]}`}>{c.alerte}</span>
                </div>
                <div className="text-sm font-bold text-slate-800">{c.cible}</div>
                <div className="text-[11px] text-slate-500">{c.metrique}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-black text-red-700">{c.valeur}</span>
                  <span className="text-[10px] text-slate-400">seuil {c.seuil}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Restructurations + Contentieux */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileX size={15} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Restructurations & Contentieux</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
              <div className="text-[10px] font-bold text-orange-700 uppercase">Prêts restructurés</div>
              <div className="text-3xl font-black text-orange-700">{prets_restructures_mois}</div>
              <div className="text-[11px] text-orange-600">ce mois · DOSSIERS_CREDIT_STATS.restructures</div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <div className="text-[10px] font-bold text-red-700 uppercase">Prêts en contentieux</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-red-700">{prets_contentieux_mois}</div>
                <div className="text-[11px] text-red-600">· {formatFcfa(encours_contentieux)}</div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-600 uppercase">Aging détaillé</div>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {[
                  { l: 'Courant',     d: aging_detail.courant,      c: '#16a34a' },
                  { l: '1-7j',        d: aging_detail.j_1_7,        c: '#eab308' },
                  { l: '8-30j',       d: aging_detail.j_8_30,       c: '#f97316' },
                  { l: '31-60j',      d: aging_detail.j_31_60,      c: '#ea580c' },
                  { l: '61-90j',      d: aging_detail.j_61_90,      c: '#dc2626' },
                  { l: '>90j',        d: aging_detail.j_90_plus,    c: '#991b1b' },
                ].map(t => (
                  <div key={t.l} className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.c }} />
                      {t.l}
                    </span>
                    <span className="font-bold" style={{ color: t.c }}>{t.d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          ÉVOLUTION 6 MOIS — Soumissions / Approuvés / Refusés
         ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Évolution dossiers crédit — 6 derniers mois</h3>
          </div>
          <AiBadge variant="small" label="Trend analysis" />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={DOSSIERS_CREDIT_STATS.evolution_decisions_6mois} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={DOSSIERS_CREDIT_STATS.evolution_decisions_6mois.reduce((s, m) => s + m.soumis, 0) / 6} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: 'Moy. soumis', position: 'right', fontSize: 9 }} />
            <Bar dataKey="soumis"    name="Soumis"   fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="approuves" name="Approuvés" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="refuses"   name="Refusés"  fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
