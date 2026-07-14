'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Building2, Bell, BarChart3, Wallet, Users, Package, Sparkles,
  Warehouse, Truck, TrendingUp, TrendingDown, ArrowRight,
} from 'lucide-react'
import type { Facture } from '@distributeur/types'

/** Au-delà, la liste devient une page à part entière — on renvoie sur /relances. */
const IMPAYES_DASHBOARD_MAX = 20

/** Les plus gros restes à recouvrer d'abord, tronqués au format dashboard. */
function buildImpayesDashboard(factures: Facture[]) {
  const tries = factures
    .filter(f => f.statut === 'EN_RETARD' || f.statut === 'PARTIELLE')
    .sort((a, b) => (b.montant - b.paye) - (a.montant - a.paye))
  return {
    visibles: tries.slice(0, IMPAYES_DASHBOARD_MAX),
    total: tries.length,
    reste: Math.max(0, tries.length - IMPAYES_DASHBOARD_MAX),
  }
}
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { RapportIAGlobal } from '@distributeur/components/dashboard/RapportIAGlobal'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { AiInsightPanel } from '@distributeur/components/dashboard/AiInsightPanel'
import { KpiCardWithSparkline } from '@distributeur/components/dashboard/KpiCardWithSparkline'
import { RAPPORT_IA_DG } from '@distributeur/lib/rapport-dg-distribution-builder'
import {
  KPIS_GLOBAUX_DG, SPARKLINE_MOIS_DG, KPI_INVERT_VARIATION,
  buildInsightsOperationnels, buildCreancesAging, buildRepartitionCategories, buildForecastCA,
} from '@distributeur/lib/mock-dg-kpis-builder'
import { RESEAU_CONSOLIDE_DIST } from '@distributeur/lib/registries/zones-registry'
import {
  PILOTAGE_AXES_DG, PILOTAGE_CONSOLIDE_DG,
  type PilotageAxeDG, type StatutAxeDG, type AxeGroupeDG,
} from '@distributeur/lib/pilotage-axes-dg'
import { getDashboardHub } from '@distributeur/lib/mock-distribution'
import {
  buildTopProduitsDG, buildExpeditionsJourDG, buildEquipesPilotageDG,
  buildAnomaliesOperationnellesDG, STATUT_EXPEDITION_STYLE, ROLE_EQUIPE_LABEL,
} from '@distributeur/lib/dg-pilotage-detail-builder'
import { CA_SPARKLINE_REGISTRY } from '@distributeur/lib/registries/entreprise-registry'
import { formatFcfa } from '@distributeur/lib/utils'
import { ZonePilotageDGPanel } from '@distributeur/components/dashboard/ZonePilotageDGPanel'
import { SyntheseDecisionDGPanel } from '@distributeur/components/dashboard/SyntheseDecisionDGPanel'

/** Les 10 KPI ne sont pas de même nature : on les sépare au lieu d'une grille plate de 10. */
const FAMILLES_KPI_DG: { id: 'COMMERCIAL' | 'FINANCE' | 'OPERATIONS'; titre: string; bordure: string; puce: string }[] = [
  { id: 'COMMERCIAL', titre: 'Commercial — ce que vend le réseau', bordure: 'border-l-teal-500', puce: 'bg-teal-500' },
  { id: 'FINANCE', titre: 'Finance — ce que ça rapporte', bordure: 'border-l-violet-500', puce: 'bg-violet-500' },
  { id: 'OPERATIONS', titre: 'Opérations — ce qui livre', bordure: 'border-l-orange-500', puce: 'bg-orange-500' },
]

const STATUT_STYLE: Record<StatutAxeDG, { bg: string; text: string; border: string; label: string }> = {
  SAIN: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'OK' },
  ATTENTION: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'ATTENTION' },
  CRITIQUE: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'CRITIQUE' },
}

const GROUPE_AXE_META: Record<AxeGroupeDG, { label: string; Icon: typeof Warehouse }> = {
  ENTREPOT: { label: 'Plateformes logistiques', Icon: Warehouse },
  CANAL: { label: 'Canaux commerciaux', Icon: Truck },
}

function AxePilotageCard({ axe, selected, onClick }: { axe: PilotageAxeDG; selected: boolean; onClick: () => void }) {
  const st = STATUT_STYLE[axe.statut]
  return (
    <button type="button" onClick={onClick}
      className={`text-left p-3.5 rounded-xl border-2 transition-all w-full ${selected ? 'border-amber-400 bg-amber-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ backgroundColor: axe.color + '20', color: axe.color }}>
          {axe.initiales}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-800 truncate">{axe.nom_court}</div>
          <div className="text-[10px] text-slate-400">{axe.responsable}</div>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${st.bg} ${st.text} ${st.border}`}>
          {st.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
        <div>
          <div className="text-[10px] text-slate-400">{axe.quota_label}</div>
          <div className={`font-black text-sm ${axe.quota_pct >= 100 ? 'text-emerald-600' : axe.quota_pct >= 85 ? 'text-amber-600' : 'text-red-600'}`}>
            {axe.quota_pct}%
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">{axe.indicateur_2_label}</div>
          <div className={`font-bold text-sm ${axe.indicateur_2_alerte ? 'text-red-600' : 'text-slate-700'}`}>
            {axe.indicateur_2_valeur}
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-slate-400">{axe.barre_label}</span>
            <span className={`font-bold ${axe.barre_pct >= axe.barre_seuil_ok ? 'text-emerald-600' : axe.barre_pct >= 75 ? 'text-orange-600' : 'text-red-600'}`}>
              {axe.barre_pct}%
            </span>
          </div>
          <div className="bg-slate-200 rounded-full h-1.5">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${axe.barre_pct}%`,
                backgroundColor: axe.barre_pct >= axe.barre_seuil_ok ? '#16a34a' : axe.barre_pct >= 75 ? '#f97316' : '#dc2626',
              }} />
          </div>
        </div>
      </div>
      <div className="text-[10px] text-slate-400 mt-2 truncate">{axe.resume}</div>
      <div className="mt-1.5 text-center">
        <div className={`text-[10px] font-bold ${axe.score_operation >= 80 ? 'text-emerald-600' : axe.score_operation >= 65 ? 'text-orange-600' : 'text-red-600'}`}>
          Pilotage IA : {axe.score_operation}/100
        </div>
      </div>
    </button>
  )
}

export function DashboardDG() {
  const { entreprise, facturation } = getDashboardHub()
  const [selectedAxe, setSelectedAxe] = useState<PilotageAxeDG | null>(null)

  const r = RESEAU_CONSOLIDE_DIST
  const pc = PILOTAGE_CONSOLIDE_DG
  const anomaliesOp = useMemo(() => buildAnomaliesOperationnellesDG(), [])
  const topProduits = useMemo(() => buildTopProduitsDG(), [])
  const expeditions = useMemo(() => buildExpeditionsJourDG(), [])
  const equipes = useMemo(() => buildEquipesPilotageDG(), [])
  const anomaliesCritiques = anomaliesOp.filter(a => a.severite === 'CRITIQUE')
  const insights = useMemo(
    () => buildInsightsOperationnels(selectedAxe?.id ?? null),
    [selectedAxe],
  )
  // Le dashboard ne montre que le haut de la pile ; le reste se traite dans /relances.
  const impayesDG = buildImpayesDashboard(facturation.factures)
  const aging = buildCreancesAging()
  const categories = buildRepartitionCategories()
  const forecast = buildForecastCA()
  const caHistorique = CA_SPARKLINE_REGISTRY.map(row => ({ mois: row.mois, sorties: row.ca }))
  const titre = selectedAxe
    ? `${selectedAxe.groupe === 'ENTREPOT' ? 'Entrepôt' : 'Canal'} : ${selectedAxe.nom}`
    : 'Vue consolidée grossiste'

  return (
    <div className="p-6 max-w-7xl space-y-5">
      {/* Bandeau supérieur */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Pilotage Direction Générale</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            DG · {pc.expeditions_jour} expéditions/j · {pc.commandes_jour} commandes terrain/j · {r.total_pdv} clients actifs · vue exécutive temps réel
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-xs text-slate-600 max-w-[200px]">
            <div className="font-semibold text-orange-600">Attention</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Lomé Port sous tension · huile en rupture · crédit Kiosque Port</div>
          </div>
          <button type="button" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg animate-pulse">
            <Bell size={13} className="text-red-500" />
            {anomaliesCritiques.length} alertes critiques
          </button>
        </div>
      </div>

      {/* 1. Les chiffres de décision — avant le rapport : le DG scanne puis décide */}
      <SyntheseDecisionDGPanel />

      {/* 2. Rapport IA complet */}
      <RapportIAGlobal rapport={RAPPORT_IA_DG} accentColor="amber" analyseLabel="Direction Générale" />

      {/* 3. KPIs 360° — regroupés par famille, pas en grille plate */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700">Vue exécutive — KPIs 360°</h2>
          <AiBadge variant="small" label="Temps réel" pulse />
          <span className="text-xs text-slate-400 ml-auto">
            {KPIS_GLOBAUX_DG.length} indicateurs · Tendance 6 mois
          </span>
        </div>

        {FAMILLES_KPI_DG.map(famille => {
          const kpis = KPIS_GLOBAUX_DG.filter(k => k.categorie === famille.id)
          if (kpis.length === 0) return null
          return (
            <div key={famille.id} className={`border-l-4 pl-3.5 ${famille.bordure}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${famille.puce}`} />
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{famille.titre}</h3>
                <span className="text-[10px] text-slate-400">{kpis.length}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {kpis.map(kpi => (
                  <KpiCardWithSparkline
                    key={kpi.cle}
                    title={kpi.label}
                    value={typeof kpi.valeur === 'string' && kpi.valeur.endsWith('%')
                      ? parseFloat(kpi.valeur)
                      : kpi.valeur}
                    unit={kpi.unite}
                    variation={kpi.variation_pct}
                    variationLabel={kpi.variation_label}
                    sparkline={kpi.sparkline}
                    sparklineLabels={SPARKLINE_MOIS_DG}
                    colorScheme={kpi.couleur}
                    invertVariation={KPI_INVERT_VARIATION.has(kpi.cle)}
                    badge={kpi.categorie}
                    format={kpi.format ?? (kpi.unite === 'FCFA' ? 'fcfa' : kpi.unite === 'réf.' ? 'number' : typeof kpi.valeur === 'number' ? 'number' : 'raw')}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cartographie & pilotage par zone */}
      <ZonePilotageDGPanel />

      {/* Pilotage entrepôts & canaux */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              {selectedAxe ? `Vue ${selectedAxe.groupe === 'ENTREPOT' ? 'entrepôt' : 'canal'} : ${selectedAxe.nom}` : 'Pilotage opérationnel — entrepôts & canaux'}
            </h3>
            {!selectedAxe && <AiBadge variant="small" label="Alertes IA auto" />}
          </div>
          {selectedAxe && (
            <button type="button" onClick={() => setSelectedAxe(null)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline">
              ← Vue consolidée
            </button>
          )}
        </div>
        {(['ENTREPOT', 'CANAL'] as AxeGroupeDG[]).map(groupe => {
          const meta = GROUPE_AXE_META[groupe]
          const axes = PILOTAGE_AXES_DG.filter(a => a.groupe === groupe)
          const Icon = meta.Icon
          return (
            <div key={groupe} className="border-b border-slate-100 last:border-b-0">
              <div className="px-5 py-2 bg-slate-50 flex items-center gap-2">
                <Icon size={13} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{meta.label}</span>
                <span className="text-[10px] text-slate-400">{axes.length}</span>
              </div>
              <div className={`p-3 grid gap-2.5 ${groupe === 'ENTREPOT' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {axes.map(axe => (
                  <AxePilotageCard
                    key={axe.id}
                    axe={axe}
                    selected={selectedAxe?.id === axe.id}
                    onClick={() => setSelectedAxe(prev => prev?.id === axe.id ? null : axe)}
                  />
                ))}
              </div>
            </div>
          )
        })}
        {!selectedAxe && (
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
            <span className="text-slate-500 font-medium">Consolidé grossiste :</span>
            <span className="font-bold text-slate-700">{formatFcfa(pc.ventes_sorties)} sorties</span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-slate-700">{pc.commandes_jour} cmd terrain/j</span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-slate-700">{pc.expeditions_jour} expéditions/j</span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-red-600">{formatFcfa(pc.impayes)} encours impayés</span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-orange-600">{pc.ruptures_sku} ruptures SKU</span>
            {pc.axes_alerte > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-orange-600 font-bold">{pc.axes_alerte} axe{pc.axes_alerte > 1 ? 's' : ''} en alerte</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Insights opérationnels */}
      <AiInsightPanel
        titre={`Alertes opérationnelles — ${titre}`}
        sousTitre="Exécution du jour — crédit client, supply chain, picking & canaux B2B · complément au rapport stratégique"
        insights={insights}
        collapsible
      />

      {/* Sorties entrepôt + prévisions */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 size={16} /> Ventes sorties entrepôt + prévisions IA — {titre}
            </h3>
            <AiBadge variant="small" label="Prévisions juil–sep" confidence={79} />
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={[
              ...caHistorique,
              ...forecast.map(f => ({ mois: `${f.mois} (IA)`, sorties: f.sorties_prevues })),
            ]} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="M" />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={450} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'Objectif', position: 'right', fontSize: 9 }} />
              <Line type="monotone" dataKey="sorties" name="Sorties (M FCFA)" stroke="#d97706" strokeWidth={2} dot={{ fill: '#d97706', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {forecast.map(f => (
              <div key={f.mois} className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <div className="text-xs font-bold text-amber-700">{f.mois}</div>
                <div className="text-lg font-black text-amber-800">{f.sorties_prevues} M</div>
                <div className="text-xs text-slate-600 font-medium">{f.commandes_prevues} cmd/j</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Marge {f.marge_prevue}%</div>
                <div className="text-[10px] text-amber-500">Conf. {f.confidence}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-indigo-900">Anomalies opérationnelles IA</h3>
          </div>
          <div className="space-y-2">
            {anomaliesOp.map(a => (
              <div key={a.id} className={`p-2.5 rounded-lg border text-xs ${
                a.severite === 'CRITIQUE' ? 'bg-red-50 border-red-100 text-red-800' :
                a.severite === 'HAUTE' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                'bg-slate-50 border-slate-100 text-slate-700'
              }`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/70 font-bold uppercase">{a.domaine}</span>
                  <span className="font-bold">{a.titre}</span>
                </div>
                <div className="text-[10px] opacity-90">{a.detail}</div>
                <div className="text-[10px] mt-1 text-slate-500">→ {a.responsable}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top produits + Expéditions du jour */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Package size={16} /> Top produits — sorties & marges
            </h3>
            <AiBadge variant="small" label="Mois en cours" />
          </div>
          <div className="space-y-2">
            {topProduits.map((p, i) => (
              <div key={p.reference} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{p.nom}</div>
                  <div className="text-[10px] text-slate-400">{p.categorie} · {p.quantite_sortie_mois.toLocaleString('fr-FR')} {p.unite}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-700">{formatFcfa(p.ca_mois)}</div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-emerald-600 font-semibold">Marge {p.marge_pct}%</span>
                    {p.evolution_pct >= 0
                      ? <TrendingUp size={10} className="text-emerald-500" />
                      : <TrendingDown size={10} className="text-red-500" />}
                    <span className={p.evolution_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}>{p.evolution_pct > 0 ? '+' : ''}{p.evolution_pct}%</span>
                  </div>
                  {p.rupture && <span className="text-[9px] text-red-600 font-bold">Rupture IA</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Truck size={16} /> Expéditions du jour — points de livraison
            </h3>
            <AiBadge variant="small" label="Live" pulse />
          </div>
          <div className="space-y-2">
            {expeditions.map(exp => {
              const st = STATUT_EXPEDITION_STYLE[exp.statut]
              return (
                <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{exp.client}</div>
                    <div className="text-[10px] text-slate-400">{exp.bl_numero} · {exp.entrepot} · {exp.lignes} lignes</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="font-bold text-slate-700">{formatFcfa(exp.montant)}</div>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${st.className}`}>{st.label}</span>
                      <span className="text-[10px] text-slate-400">{exp.heure_prevue}</span>
                      {exp.retard_h && <span className="text-[10px] text-red-600 font-bold">+{exp.retard_h}h</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 p-2.5 bg-sky-50 border border-sky-100 rounded-lg text-[10px] text-sky-800">
            <Truck size={10} className="inline mr-1" />
            {expeditions.filter(e => e.statut === 'LIVREE').length} livrées · {expeditions.filter(e => e.statut === 'EN_ROUTE').length} en route · {expeditions.filter(e => e.statut === 'RETARD').length} en retard
          </div>
        </div>
      </div>

      {/* Répartition familles + Balance âgée clients */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Package size={16} /> Répartition sorties par famille produit
          </h3>
          <div className="space-y-3">
            {categories.map(c => (
              <div key={c.categorie} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-sm font-medium text-slate-800">{c.categorie}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">{c.ca_pct}% · {formatFcfa(c.ca_mois)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{c.ruptures > 0 ? `${c.ruptures} rupture(s) SKU` : 'Stock OK'}</span>
                  <span className={c.ruptures > 0 ? 'text-red-600 font-bold' : 'text-emerald-600'}>
                    {c.ruptures > 0 ? '⚠ Réappro requis' : '✓ Sain'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Wallet size={16} /> Balance âgée — créances clients B2B
            </h3>
            <AiBadge variant="small" label="Temps réel" />
          </div>
          <div className="space-y-2.5">
            {aging.map(tr => {
              const total = aging.reduce((s, t) => s + t.montant, 0)
              const pct = total > 0 ? Math.round((tr.montant / total) * 100) : 0
              return (
                <div key={tr.tranche}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tr.color }} />
                      <span className="font-medium text-slate-700">{tr.tranche}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>{tr.count} clients</span>
                      <span className="font-bold text-slate-700">{formatFcfa(tr.montant)}</span>
                      <span className="font-bold" style={{ color: tr.color }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tr.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Impayés + Pilotage équipes */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Wallet size={16} className="text-red-500" /> Top impayés — priorisation recouvrement IA
            <span className="ml-auto text-[10px] font-normal text-slate-400">
              {impayesDG.total} au total
            </span>
          </h3>
          <div className="space-y-2">
            {impayesDG.visibles.map(f => (
              <div key={f.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <div>
                  <span className="font-medium text-slate-700">{f.pdv_nom}</span>
                  <div className="text-[10px] text-slate-400">{f.numero}</div>
                </div>
                <div className="text-right">
                  <div className="text-red-600 font-bold">{formatFcfa(f.montant - f.paye)} F</div>
                  <div className="text-[10px] text-orange-600">{f.jours_retard > 0 ? `${f.jours_retard}j retard` : 'Partiel'}</div>
                </div>
              </div>
            ))}
          </div>
          {impayesDG.reste > 0 && (
            <Link href="/distributeur/relances"
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs font-bold text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition-colors">
              Voir les {impayesDG.reste} impayés restants
              <ArrowRight size={13} />
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users size={16} /> Pilotage équipes — retours opérationnels
            </h3>
            <AiBadge variant="small" label="Live" />
          </div>
          <div className="space-y-2">
            {equipes.map(eq => (
              <div key={eq.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="font-medium text-slate-700 flex items-center gap-1.5 flex-wrap">
                    {eq.nom}
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {ROLE_EQUIPE_LABEL[eq.role]}
                    </span>
                  </div>
                  <div className="text-slate-400 truncate">{eq.poste}</div>
                  <div className="text-[10px] text-slate-500">{eq.indicateur_label} : <span className="font-semibold text-slate-700">{eq.indicateur_valeur}</span></div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className={`font-bold ${eq.performance_pct >= 100 ? 'text-emerald-600' : eq.performance_pct >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                    {eq.performance_pct}%
                  </div>
                  {eq.alerte && <div className="text-[10px] text-orange-600 max-w-[120px]">{eq.alerte}</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-800">
            <Sparkles size={10} className="inline mr-1" />
            IA recommande de répliquer le modèle picking Lomé Port (Edem Kpodo) sur le flux alimentaire Kara — gain taux service estimé +5 pts.
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-slate-400 pb-2">
        Objectif sorties : {formatFcfa(entreprise.ca_objectif)} FCFA · {Math.round((r.ca_mois / entreprise.ca_objectif) * 100)}% atteint · marge brute consolidée 18,2%
      </p>
    </div>
  )
}
