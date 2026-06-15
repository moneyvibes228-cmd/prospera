'use client'
import { useState, useMemo } from 'react'
import {
  BarChart2, TrendingDown, DollarSign, Activity, Zap,
  LayoutDashboard, CreditCard, ShoppingCart, Banknote, Settings2, MapPin,
  Building2, Bell,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { AGENCES, AGENCES_DATA, RESEAU_CONSOLIDE } from '@/lib/agences'
import { PORTEFEUILLE_AGING_RESEAU } from '@/lib/portefeuille-reseau'
import { KPIS_GLOBAUX_DG, RAPPORT_IA_DG, ANOMALIES_JOUR, SPARKLINE_MOIS_DG } from '@/lib/mockMicrofinance'
import { AiInsightPanel } from '../AiInsightPanel'
import { AiBadge } from '../AiBadge'
import { AgencySwitcher } from '../AgencySwitcher'
import { KpiCardWithSparkline } from '../KpiCardWithSparkline'
import { DrillDownBreadcrumb, type DrillNode } from '../DrillDownBreadcrumb'
import { ExportButton } from '../ExportButton'
import { RapportIAGlobal } from '../RapportIAGlobal'
import { BceaoClassesChart } from '../BceaoClassesChart'
import { SectorBreakdown } from '../SectorBreakdown'
import { CarteCouvertureIA } from '../CarteCouvertureIA'
import { PilotageEquipesDg } from '../PilotageEquipesDg'
import { AGENTS_DG, getInsightsOperationnelsJour } from '@/lib/dg-vue360'
import { OngletCreditDEC } from '../onglets/OngletCreditDEC'
import { OngletCommercialDC } from '../onglets/OngletCommercialDC'
import { OngletFinancier } from '../onglets/OngletFinancier'
import { OngletOperationnel } from '../onglets/OngletOperationnel'
import { OngletTerrain } from '../onglets/OngletTerrain'
import { formatFcfa } from '@/lib/utils'
import type { Agence, AgenceDetaillee } from '@/lib/agences'

// ─────────────────────────────────────────────────────────────────────────────
//  Constantes UI
// ─────────────────────────────────────────────────────────────────────────────

type Onglet = 'VUE_360' | 'CREDIT' | 'COMMERCIAL' | 'FINANCIER' | 'OPERATIONNEL' | 'TERRAIN'

const CONFORMITE_STYLE = {
  CONFORME:     { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', label: 'CONFORME' },
  ATTENTION:    { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200', label: 'ATTENTION' },
  NON_CONFORME: { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', label: 'NON CONFORME' },
}

const ONGLETS: { id: Onglet; label: string; icon: React.ElementType; color: string; for: string }[] = [
  { id: 'VUE_360',      label: 'Vue 360°',     icon: LayoutDashboard, color: 'text-slate-700',  for: 'DG' },
  { id: 'CREDIT',       label: 'Crédit DEC',   icon: CreditCard,      color: 'text-red-600',    for: 'DEC' },
  { id: 'COMMERCIAL',   label: 'Commercial DC', icon: ShoppingCart,    color: 'text-teal-600',   for: 'DC' },
  { id: 'FINANCIER',    label: 'Financier',    icon: Banknote,        color: 'text-green-600',  for: 'DAF' },
  { id: 'OPERATIONNEL', label: 'Opérationnel', icon: Settings2,       color: 'text-blue-600',   for: 'DO' },
  { id: 'TERRAIN',      label: 'Terrain',      icon: MapPin,          color: 'text-orange-600', for: 'RA' },
]

// ─────────────────────────────────────────────────────────────────────────────
//  Carte d'agence (réutilisée du dashboard précédent)
// ─────────────────────────────────────────────────────────────────────────────

function AgenceCard({ agence, selected, onClick }: { agence: Agence; selected: boolean; onClick: () => void }) {
  const data = AGENCES_DATA[agence.id]
  const parColor = agence.par_courant > 10 ? '#dc2626' : agence.par_courant > 8 ? '#f97316' : '#16a34a'
  const collectePct = Math.round((agence.collecte_mois / agence.collecte_objectif) * 100)
  const conf = data?.conformite_bceao
  return (
    <button onClick={onClick}
      className={`text-left p-3.5 rounded-xl border-2 transition-all ${selected ? 'border-teal-400 bg-teal-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: agence.color + '20', color: agence.color }}>
          {agence.initiales}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-800 truncate">{agence.nom_court}</div>
          <div className="text-[10px] text-slate-400">{agence.statut === 'PILOTE' ? '🧪 Pilote' : `Dep. ${agence.ouverture}`}</div>
        </div>
        {conf && (
          <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border flex-shrink-0 ${CONFORMITE_STYLE[conf.statut].bg} ${CONFORMITE_STYLE[conf.statut].color} ${CONFORMITE_STYLE[conf.statut].border}`}>
            {conf.statut === 'CONFORME' ? '✓' : conf.statut === 'ATTENTION' ? '!' : '✗'}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
        <div>
          <div className="text-[10px] text-slate-400">PAR &gt;30j</div>
          <div className="font-black text-sm" style={{ color: parColor }}>{agence.par_courant}%</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Remb.</div>
          <div className={`font-bold text-sm ${agence.taux_remboursement >= 93 ? 'text-green-600' : 'text-orange-600'}`}>{agence.taux_remboursement}%</div>
        </div>
        <div className="col-span-2">
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-slate-400">Collecte</span>
            <span className={`font-bold ${collectePct >= 90 ? 'text-green-600' : collectePct >= 70 ? 'text-orange-600' : 'text-red-600'}`}>{collectePct}%</span>
          </div>
          <div className="bg-slate-200 rounded-full h-1.5">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(collectePct, 100)}%`, backgroundColor: collectePct >= 90 ? '#16a34a' : collectePct >= 70 ? '#f97316' : '#dc2626' }} />
          </div>
        </div>
      </div>
      <div className="text-[10px] text-slate-400 mt-2 truncate">
        {agence.emprunteurs_actifs} emp · {agence.agents} agent{agence.agents > 1 ? 's' : ''} · RA {agence.responsable.split(' ')[0]}
      </div>
      {data && (
        <div className="mt-1.5 text-center">
          <div className="text-[10px] font-bold" style={{ color: data.kpis.score_sante >= 80 ? '#16a34a' : data.kpis.score_sante >= 65 ? '#f97316' : '#dc2626' }}>
            Score santé : {data.kpis.score_sante}/100
          </div>
        </div>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardManager() {
  const router = useRouter()
  const [selectedAgence, setSelectedAgence] = useState<Agence | null>(null)
  const [onglet, setOnglet] = useState<Onglet>('VUE_360')

  const agenceData: AgenceDetaillee | null = selectedAgence ? AGENCES_DATA[selectedAgence.id] ?? null : null
  const parHistorique = agenceData ? agenceData.par_historique : RESEAU_CONSOLIDE.par_historique
  const forecast = agenceData ? agenceData.forecast : RESEAU_CONSOLIDE.forecast
  const repartitionProduits = agenceData ? agenceData.repartition_produits : RESEAU_CONSOLIDE.repartition_produits
  const aging = agenceData ? agenceData.portefeuille_aging : PORTEFEUILLE_AGING_RESEAU
  const iaInsights = useMemo(
    () => getInsightsOperationnelsJour(selectedAgence?.id ?? null),
    [selectedAgence],
  )
  const agentsPerf = useMemo(() => {
    const base = agenceData ? agenceData.agents_performance : RESEAU_CONSOLIDE.agents_performance
    return base.map(a => {
      const detail = AGENTS_DG.find(d => d.nom === a.agent)
      return { ...a, detail }
    })
  }, [agenceData])
  const titre = selectedAgence ? selectedAgence.nom : 'Vue réseau consolidée'

  const drillPath: DrillNode[] = useMemo(() => {
    if (!selectedAgence) return []
    return [
      { level: 'AGENCE', id: selectedAgence.id, label: selectedAgence.nom_court, sublabel: `${selectedAgence.emprunteurs_actifs} clients` },
    ]
  }, [selectedAgence])

  const handleDrillReset = () => setSelectedAgence(null)
  const handleDrillNavigate = (idx: number) => {
    if (idx === 0) {
      return
    }
  }

  const anomaliesCritiques = ANOMALIES_JOUR.filter(a => a.severite === 'CRITIQUE')

  return (
    <div className="space-y-5">

      {/* ═════════════════════════════════════════════════════════════════════
          BANDEAU SUPÉRIEUR — Titre + Score santé réseau + export
         ═════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Pilotage Direction Générale</h1>
          <p className="text-sm text-slate-500 mt-0.5">DG · {RESEAU_CONSOLIDE.total_agents} agents ({RESEAU_CONSOLIDE.responsables_agence} RA + {RESEAU_CONSOLIDE.agents_terrain} terrain) · vue stratégique temps réel</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Score de santé réseau — indice composite IA */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-orange-500">74</span>
                <span className="text-xs text-slate-400 font-medium">/100</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Score réseau</span>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-xs text-slate-600 max-w-[110px]">
              <div className="font-semibold text-orange-600">⚡ Attention</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Bè Kpota hors conformité · provisions manquantes</div>
            </div>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 animate-pulse">
            <Bell size={13} className="text-red-500" />
            {anomaliesCritiques.length} alertes critiques
          </button>
          <ExportButton label="Exporter rapport DG" filename="rapport_direction" />
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          SECTION 0 — RAPPORT IA DIRECTION (déplié)
         ═════════════════════════════════════════════════════════════════════ */}
      <RapportIAGlobal rapport={RAPPORT_IA_DG} accentColor="slate" />

      {/* ═════════════════════════════════════════════════════════════════════
          SECTION 2 — DRILL-DOWN BREADCRUMB
         ═════════════════════════════════════════════════════════════════════ */}
      <DrillDownBreadcrumb path={drillPath} onNavigate={handleDrillNavigate} onReset={handleDrillReset} />

      {/* ═════════════════════════════════════════════════════════════════════
          SECTION 1 — VUE EXÉCUTIVE : 12 KPIs avec sparklines
         ═════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700">Vue exécutive — KPIs 360°</h2>
          <AiBadge variant="small" label="Mise à jour temps réel" />
          <span className="text-xs text-slate-400 ml-auto">12 indicateurs · Tendance sur 6 mois (Déc → Mai)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {KPIS_GLOBAUX_DG.map(kpi => (
            <KpiCardWithSparkline
              key={kpi.cle}
              title={kpi.label}
              value={kpi.valeur}
              unit={kpi.unite}
              variation={kpi.variation_pct}
              variationLabel={kpi.variation_label}
              sparkline={kpi.sparkline}
              sparklineLabels={SPARKLINE_MOIS_DG}
              colorScheme={kpi.couleur}
              invertVariation={['par_global', 'cout_risque', 'el_provisions'].includes(kpi.cle)}
              badge={kpi.categorie === 'PORTEFEUILLE' ? 'Portfolio' : kpi.categorie === 'ACTIVITE' ? 'Activité' : 'Rentabilité'}
              format={typeof kpi.valeur === 'number' && kpi.unite === 'FCFA' ? 'fcfa' : 'raw'}
              onClick={kpi.drill_to ? () => {
                const targetMap: Record<string, Onglet> = {
                  CREDIT: 'CREDIT', COMMERCIAL: 'COMMERCIAL',
                  FINANCIER: 'FINANCIER', OPERATIONNEL: 'OPERATIONNEL',
                }
                if (kpi.drill_to && targetMap[kpi.drill_to]) {
                  setOnglet(targetMap[kpi.drill_to])
                  window.scrollTo({ top: 800, behavior: 'smooth' })
                }
              } : undefined}
            />
          ))}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          SÉLECTEUR AGENCES
         ═════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              {selectedAgence ? `Vue agence : ${selectedAgence.nom}` : `Réseau — ${RESEAU_CONSOLIDE.total_agences} agences`}
            </h3>
            {!selectedAgence && <AiBadge variant="small" label="Alertes BCEAO auto" />}
          </div>
          <div className="flex items-center gap-2">
            {selectedAgence && (
              <button onClick={() => setSelectedAgence(null)} className="text-xs text-teal-600 hover:text-teal-700 font-medium underline">
                ← Tout le réseau
              </button>
            )}
            <AgencySwitcher selectedId={selectedAgence?.id ?? 'ALL'} onChange={setSelectedAgence} compact />
          </div>
        </div>
        <div className="p-3 grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          {AGENCES.map(a => (
            <AgenceCard key={a.id} agence={a} selected={selectedAgence?.id === a.id} onClick={() => setSelectedAgence(prev => prev?.id === a.id ? null : a)} />
          ))}
        </div>
        {!selectedAgence && (
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
            <span className="text-slate-500 font-medium">{titre} :</span>
            <span className="font-bold text-slate-700">{RESEAU_CONSOLIDE.total_agents} agents</span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-slate-700">{RESEAU_CONSOLIDE.total_emprunteurs} emprunteurs</span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-slate-700">{formatFcfa(RESEAU_CONSOLIDE.encours_total)} encours</span>
            <span className="text-slate-300">·</span>
            <span className={`font-bold ${RESEAU_CONSOLIDE.par_moyen > 10 ? 'text-red-600' : 'text-orange-600'}`}>PAR moy. {RESEAU_CONSOLIDE.par_moyen}%</span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-teal-700">{formatFcfa(RESEAU_CONSOLIDE.collecte_totale)}</span>
            <span className="text-slate-300">·</span>
            <span className="text-green-600 font-bold">{RESEAU_CONSOLIDE.agences_conformes} conformes BCEAO</span>
            {RESEAU_CONSOLIDE.agences_non_conformes > 0 && <span className="text-red-600 font-bold">{RESEAU_CONSOLIDE.agences_non_conformes} NON CONFORME</span>}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          ONGLETS DE NAVIGATION
         ═════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-0 z-10">
        <div className="flex overflow-x-auto">
          {ONGLETS.map(o => {
            const Icon = o.icon
            const isActive = onglet === o.id
            return (
              <button
                key={o.id}
                onClick={() => setOnglet(o.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}>
                <Icon size={15} className={isActive ? 'text-teal-600' : o.color} />
                <span className="text-xs font-bold">{o.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                }`}>{o.for}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          CONTENU ONGLET : VUE 360°
         ═════════════════════════════════════════════════════════════════════ */}
      {onglet === 'VUE_360' && (
        <div className="space-y-5">

          {/* Alertes opérationnelles du jour (sans doublon Rapport IA) */}
          <AiInsightPanel
            titre={`Alertes opérationnelles du jour — ${titre}`}
            insights={iaInsights}
            collapsible
          />

          {/* Évolution PAR + prévisions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Évolution PAR + Remboursement — {titre}
                </h3>
                <AiBadge variant="small" label="Prévisions juin–août" confidence={82} />
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={[
                  ...parHistorique,
                  ...forecast.map(f => ({ mois: `${f.mois} (IA)`, par_30j: f.par_prevu, remboursement: null, decaissements: null })),
                ]} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} unit="%" domain={[0, 'auto']} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine yAxisId="left" y={10} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'Seuil BCEAO', position: 'right', fontSize: 9 }} />
                  <Line yAxisId="left" type="monotone" dataKey="par_30j" name="PAR >30j (%)" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 3 }} />
                  <Line yAxisId="left" type="monotone" dataKey="remboursement" name="Remb. (%)" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 3 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {forecast.map(f => (
                  <div key={f.mois} className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                    <div className="text-xs font-bold text-indigo-700">{f.mois}</div>
                    <div className="text-lg font-black text-indigo-800">{f.par_prevu}%</div>
                    <div className="text-xs text-teal-600 font-medium">{formatFcfa(f.collecte_prevue)}</div>
                    <div className="text-[10px] text-indigo-400">Conf. {f.confidence}%</div>
                  </div>
                ))}
              </div>
          </div>

          {/* Donut BCEAO + Secteurs */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-5">
              <BceaoClassesChart />
            </div>
            <div className="col-span-12 lg:col-span-7">
              <SectorBreakdown />
            </div>
          </div>

          {/* Répartition produits + Aging portefeuille */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Répartition portefeuille par produit</h3>
              <div className="space-y-3">
                {repartitionProduits.map(p => (
                  <div key={p.produit} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-sm font-medium text-slate-800">{p.produit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{p.count} emprunteurs</span>
                        <span className={`text-xs font-bold ${p.par > 10 ? 'text-red-600' : p.par > 8 ? 'text-orange-600' : 'text-green-600'}`}>PAR {p.par}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Encours : <span className="font-bold">{formatFcfa(p.encours)}</span></span>
                      <span style={{ color: p.par > 10 ? '#dc2626' : p.par > 8 ? '#f97316' : '#16a34a' }}>
                        {p.par > 10 ? '⚠ Au-dessus seuil BCEAO' : p.par > 8 ? '⚡ Proche du seuil' : '✓ Sain'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Vieillissement du portefeuille (Aging)</h3>
                <AiBadge variant="small" label="Mis à jour temps réel" />
              </div>
              <div className="space-y-2.5">
                {aging.map(tr => {
                  const total = aging.reduce((s, t) => s + t.montant, 0)
                  const pct = total > 0 ? Math.round((tr.montant / total) * 100) : 0
                  return (
                    <div key={tr.tranche}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tr.color }} />
                          <span className="font-medium text-slate-700">{tr.tranche}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span>{tr.count} emprunteurs</span>
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
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Portefeuille sain</span>
                  <span className="font-bold text-green-600">
                    {Math.round((aging[0].count / aging.reduce((s, t) => s + t.count, 0)) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-0.5">
                  <span className="text-slate-500">À risque (&gt;30j)</span>
                  <span className="font-bold text-orange-600">
                    {formatFcfa(aging.slice(2).reduce((s, t) => s + t.montant, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Carte de couverture + analyse IA territoriale */}
          <CarteCouvertureIA selectedAgenceId={selectedAgence?.id ?? null} titre={titre} />

          {/* Pilotage équipes — RA · terrain · direction siège */}
          <PilotageEquipesDg
            agentsPerf={agentsPerf}
            selectedAgenceId={selectedAgence?.id ?? null}
            showAgenceColumn={!selectedAgence}
            onAgentClick={(id) => router.push(`/dashboard/agents/${id}`)}
            onOngletDirection={(tab) => {
              setOnglet(tab)
              window.scrollTo({ top: 800, behavior: 'smooth' })
            }}
          />
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          CONTENU AUTRES ONGLETS — Crédit DEC / Commercial DC / Financier / Opérationnel / Terrain
         ═════════════════════════════════════════════════════════════════════ */}
      {onglet === 'CREDIT'       && <OngletCreditDEC />}
      {onglet === 'COMMERCIAL'   && <OngletCommercialDC />}
      {onglet === 'FINANCIER'    && <OngletFinancier />}
      {onglet === 'OPERATIONNEL' && <OngletOperationnel />}
      {onglet === 'TERRAIN'      && <OngletTerrain />}

    </div>
  )
}

