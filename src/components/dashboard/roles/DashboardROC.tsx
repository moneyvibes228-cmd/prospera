'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  LayoutDashboard, BarChart3, ShieldAlert, Workflow, Network,
  Banknote, Settings2, Bell, Activity, AlertTriangle, Map as MapIcon,
  Building2, Clock, FileText, FileSearch, Columns3,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { AGENCES, AGENCES_DATA, RESEAU_CONSOLIDE } from '@/lib/agences'
import {
  KPIS_ROC_TOP, RAPPORT_IA_CREDIT_RISQUE, ANOMALIES_JOUR,
  PERFORMANCE_OPERATIONNELLE, CASH_PAR_AGENCE, CASH_GLOBAL,
  DOSSIERS_CREDIT_STATS, SECTEURS, BCEAO_REPARTITION, EXPECTED_LOSS,
} from '@/lib/mockMicrofinance'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { KpiCardWithSparkline } from '@/components/dashboard/KpiCardWithSparkline'
import { DrillDownBreadcrumb, type DrillNode } from '@/components/dashboard/DrillDownBreadcrumb'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { BceaoClassesChart } from '@/components/dashboard/BceaoClassesChart'
import { SectorBreakdown } from '@/components/dashboard/SectorBreakdown'
import { AlertesCbiPanel } from '@/components/dashboard/AlertesCbiPanel'
import { OngletCreditDEC } from '@/components/dashboard/onglets/OngletCreditDEC'
import { OngletOperationnel } from '@/components/dashboard/onglets/OngletOperationnel'
import { OngletTerrain } from '@/components/dashboard/onglets/OngletTerrain'
import { PipelineCreditKanban } from '@/components/dashboard/PipelineCreditKanban'
import { formatFcfa } from '@/lib/utils'

const AgenceMap = dynamic(
  () => import('@/components/dashboard/AgenceMap').then(m => ({ default: m.AgenceMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-slate-400 text-sm">Chargement de la carte...</span>
      </div>
    ),
  },
)

type Onglet = 'EXEC' | 'PORTEFEUILLE' | 'RISQUE' | 'PIPELINE' | 'WORKFLOW' | 'RESEAU_TERRAIN' | 'TRESORERIE_CASH' | 'CONTROLE'

const ONGLETS: { id: Onglet; label: string; icon: React.ElementType }[] = [
  { id: 'EXEC',             label: 'Vue exécutive',     icon: LayoutDashboard },
  { id: 'PORTEFEUILLE',     label: 'Portefeuille',      icon: BarChart3 },
  { id: 'RISQUE',           label: 'Risque crédit',     icon: ShieldAlert },
  { id: 'PIPELINE',         label: 'Pipeline crédit',   icon: Columns3 },
  { id: 'WORKFLOW',         label: 'Workflow & SLA',    icon: Workflow },
  { id: 'RESEAU_TERRAIN',   label: 'Réseau & terrain',  icon: Network },
  { id: 'TRESORERIE_CASH',  label: 'Trésorerie & cash', icon: Banknote },
  { id: 'CONTROLE',         label: 'Contrôle opérat.',  icon: Settings2 },
]

const NIVEAU_CASH: Record<string, { bg: string; text: string; border: string; label: string }> = {
  CRITIQUE_BAS: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300',    label: 'CRITIQUE BAS' },
  TENSION:      { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', label: 'TENSION' },
  NORMAL:       { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: 'NORMAL' },
  EXCEDENT:     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300',   label: 'EXCÉDENT' },
}

const STATUT_TEMPS: Record<string, { bg: string; text: string }> = {
  BON:         { bg: 'bg-green-100',  text: 'text-green-700' },
  PROCHE:      { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  EN_ALERTE:   { bg: 'bg-red-100',    text: 'text-red-700' },
}

const TICKET_PRIORITE: Record<string, string> = {
  P1: 'bg-red-100 text-red-700 border-red-200',
  P2: 'bg-orange-100 text-orange-700 border-orange-200',
  P3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  P4: 'bg-blue-100 text-blue-700 border-blue-200',
}

const TICKET_STATUT: Record<string, string> = {
  NOUVEAU:  'bg-blue-100 text-blue-700',
  EN_COURS: 'bg-orange-100 text-orange-700',
  RESOLU:   'bg-green-100 text-green-700',
  BLOQUE:   'bg-red-100 text-red-700',
}

const EVENT_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  SUCCESS: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  INFO:    { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  WARNING: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  ERROR:   { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
}

export function DashboardROC() {
  const router = useRouter()
  const [onglet, setOnglet] = useState<Onglet>('EXEC')
  const [drillPath] = useState<DrillNode[]>([])
  const anomaliesCritiques = ANOMALIES_JOUR.filter(a => a.severite === 'CRITIQUE')
  const anomaliesCreditOp = ANOMALIES_JOUR.filter(a => ['CREDIT', 'OPERATIONNEL', 'FRAUDE', 'FINANCE'].includes(a.domaine))

  return (
    <div className="space-y-5">

      {/* Bandeau titre */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Pilotage Crédit & Opérations</h1>
          <p className="text-sm text-slate-500 mt-0.5">ROC · Chargé de Crédit — pilotage stratégique + opérationnel temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/credit/pipeline"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
            <Columns3 size={13} />
            Pipeline crédit
          </Link>
          <Link href="/credit/analyse"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
            <FileSearch size={13} />
            Workspace CC
          </Link>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Bell size={13} className="text-red-500" />
            {anomaliesCritiques.length} alertes critiques
          </button>
          <ExportButton label="Exporter rapport ROC" filename="rapport_roc" />
        </div>
      </div>

      {/* Rapport IA */}
      <RapportIAGlobal rapport={RAPPORT_IA_CREDIT_RISQUE} accentColor="red" />

      {/* Drill-down breadcrumb */}
      <DrillDownBreadcrumb path={drillPath} onNavigate={() => {}} onReset={() => {}} />

      {/* 12 KPIs ROC */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700">Vue exécutive — 12 KPIs ROC</h2>
          <AiBadge variant="small" label="Temps réel" pulse />
          <span className="text-xs text-slate-400 ml-auto">Crédit · Opérations · Finance opérationnelle</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {KPIS_ROC_TOP.map(kpi => (
            <KpiCardWithSparkline
              key={kpi.cle}
              title={kpi.label}
              value={kpi.valeur}
              unit={kpi.unite}
              variation={kpi.variation_pct}
              variationLabel={kpi.variation_label}
              sparkline={kpi.sparkline}
              colorScheme={kpi.couleur}
              invertVariation={['par_granul', 'attente_dossiers', 'cash_agences', 'el_total', 'temps_traitement'].includes(kpi.cle)}
              format={typeof kpi.valeur === 'number' && kpi.unite === 'FCFA' ? 'fcfa' : 'raw'}
              onClick={
                kpi.cle === 'attente_dossiers'
                  ? () => {
                      setOnglet('PIPELINE')
                      window.scrollTo({ top: 700, behavior: 'smooth' })
                    }
                  : kpi.drill_to
                    ? () => {
                        const map: Record<string, Onglet> = {
                          CREDIT: 'RISQUE',
                          OPERATIONNEL: 'CONTROLE',
                          FINANCIER: 'TRESORERIE_CASH',
                        }
                        if (map[kpi.drill_to!]) {
                          setOnglet(map[kpi.drill_to!])
                          window.scrollTo({ top: 700, behavior: 'smooth' })
                        }
                      }
                    : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-0 z-10">
        <div className="flex overflow-x-auto">
          {ONGLETS.map(o => {
            const Icon = o.icon
            const isActive = onglet === o.id
            return (
              <button
                key={o.id}
                onClick={() => setOnglet(o.id)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}>
                <Icon size={15} className={isActive ? 'text-red-600' : 'text-slate-500'} />
                <span className="text-xs font-bold">{o.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Onglet EXEC ── */}
      {onglet === 'EXEC' && (
        <div className="space-y-5">
          {/* Alertes critiques crédit+op */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-red-200 shadow-sm">
              <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between bg-red-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-600" />
                  <h3 className="text-sm font-semibold text-red-900">Alertes ROC priorisées IA</h3>
                </div>
                <span className="text-[10px] font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                  {anomaliesCreditOp.filter(a => a.severite === 'CRITIQUE').length} critiques
                </span>
              </div>
              <div className="divide-y divide-slate-50 max-h-[420px] overflow-auto">
                {anomaliesCreditOp.slice(0, 10).map(a => (
                  <div key={a.id} className="px-5 py-3 hover:bg-slate-50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        a.severite === 'CRITIQUE' ? 'bg-red-100 text-red-700' :
                        a.severite === 'HAUTE' ? 'bg-orange-100 text-orange-700' :
                        a.severite === 'MOYENNE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{a.severite}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{a.domaine}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">il y a {a.detecte_il_y_a}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">{a.titre}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{a.detail}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-teal-700 font-semibold">→ {a.action_recommandee}</span>
                      <span className="text-[10px] text-slate-400">· {a.responsable} · {a.delai}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash agences synthèse */}
            <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote size={15} className="text-orange-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Cash réseau — État du jour</h3>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Total réseau</div>
                    <div className="text-lg font-black text-slate-800">{formatFcfa(CASH_GLOBAL.total_reseau)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Minimum requis</div>
                    <div className="text-lg font-black text-slate-700">{formatFcfa(CASH_GLOBAL.total_minimum_requis)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                    <div className="text-[10px] font-bold text-red-600 uppercase">Critiques</div>
                    <div className="text-lg font-black text-red-700">{CASH_GLOBAL.agences_critiques}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                    <div className="text-[10px] font-bold text-orange-600 uppercase">En tension</div>
                    <div className="text-lg font-black text-orange-700">{CASH_GLOBAL.agences_tension}</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">Transferts recommandés</div>
                  <div className="text-base font-bold text-blue-800">{formatFcfa(CASH_GLOBAL.transferts_recommandes_montant)}</div>
                  <div className="text-[10px] text-blue-600 mt-0.5">Vers Bè Kpota (urgent) + Tsévié (matin)</div>
                </div>
                <button onClick={() => setOnglet('TRESORERIE_CASH')} className="w-full text-xs font-bold text-teal-700 hover:text-teal-800 underline py-1">
                  Voir détail cash par agence →
                </button>
              </div>
            </div>
          </div>

          {/* Donut BCEAO + Secteurs */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-5"><BceaoClassesChart /></div>
            <div className="col-span-12 lg:col-span-7"><SectorBreakdown /></div>
          </div>

          {/* 9 codes CBI v5 */}
          <AlertesCbiPanel />

          {/* Carte réseau */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MapIcon size={15} className="text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-900">Carte réseau — Concentration risque + Cash</h3>
              </div>
              <AiBadge variant="small" label="Multi-couches" />
            </div>
            <div className="p-4"><AgenceMap selectedAgenceId={null} /></div>
          </div>
        </div>
      )}

      {/* ── Onglet PORTEFEUILLE ── */}
      {onglet === 'PORTEFEUILLE' && <OngletPortefeuilleROC />}

      {/* ── Onglet RISQUE ── (réutilise OngletCreditDEC) ── */}
      {onglet === 'RISQUE' && <OngletCreditDEC />}

      {/* ── Onglet PIPELINE CRÉDIT (kanban Odoo) ── */}
      {onglet === 'PIPELINE' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-sm text-slate-600">
              Vue kanban des dossiers — colonnes par étape, cartes cliquables vers l&apos;analyse ROC.
            </p>
            <button
              type="button"
              onClick={() => router.push('/credit/pipeline')}
              className="text-xs font-bold text-orange-700 hover:text-orange-800 underline"
            >
              Ouvrir en plein écran
            </button>
          </div>
          <PipelineCreditKanban />
        </div>
      )}

      {/* ── Onglet WORKFLOW & SLA ── */}
      {onglet === 'WORKFLOW' && <OngletWorkflowROC />}

      {/* ── Onglet RÉSEAU & TERRAIN ── */}
      {onglet === 'RESEAU_TERRAIN' && <OngletReseauTerrainROC />}

      {/* ── Onglet TRÉSORERIE & CASH ── */}
      {onglet === 'TRESORERIE_CASH' && <OngletTresorerieCashROC />}

      {/* ── Onglet CONTRÔLE OPÉRATIONNEL ── (réutilise OngletOperationnel) ── */}
      {onglet === 'CONTROLE' && <OngletOperationnel />}

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ONGLET PORTEFEUILLE — Encours par produit/agence/région/secteur
// ═══════════════════════════════════════════════════════════════════════════════

function OngletPortefeuilleROC() {
  const [vue, setVue] = useState<'PRODUIT' | 'AGENCE' | 'REGION' | 'SECTEUR'>('PRODUIT')

  return (
    <div className="space-y-5">

      {/* Sélecteur vue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <BarChart3 size={15} className="text-slate-700" />
          <h3 className="text-sm font-bold text-slate-800">Analyse portefeuille</h3>
          <div className="flex gap-1 ml-auto">
            {(['PRODUIT', 'AGENCE', 'REGION', 'SECTEUR'] as const).map(v => (
              <button key={v} onClick={() => setVue(v)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                  vue === v ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-100'
                }`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {vue === 'PRODUIT' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Encours par produit de crédit</h3>
            <span className="text-xs text-slate-400">Total {formatFcfa(RESEAU_CONSOLIDE.encours_total)}</span>
          </div>
          <div className="space-y-3">
            {RESEAU_CONSOLIDE.repartition_produits.map(p => {
              const totalEncours = RESEAU_CONSOLIDE.repartition_produits.reduce((s, x) => s + x.encours, 0)
              const pct = (p.encours / totalEncours) * 100
              return (
                <div key={p.produit} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-bold text-slate-800">{p.produit}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-600">{p.count} contrats</span>
                      <span className={`font-bold ${p.par > 10 ? 'text-red-600' : p.par > 8 ? 'text-orange-600' : 'text-green-600'}`}>PAR {p.par}%</span>
                      <span className="font-bold text-slate-800 w-32 text-right">{formatFcfa(p.encours)} ({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="bg-slate-200 rounded-full h-2">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Ticket moyen : {formatFcfa(Math.round(p.encours / p.count))}</span>
                    <span style={{ color: p.par > 10 ? '#dc2626' : p.par > 8 ? '#f97316' : '#16a34a' }}>
                      {p.par > 10 ? '⚠ Au-dessus seuil BCEAO' : p.par > 8 ? '⚡ Proche du seuil' : '✓ Sain'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {vue === 'AGENCE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Encours par agence — Détail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-bold">Agence</th>
                  <th className="text-right px-3 py-3 font-bold">Encours</th>
                  <th className="text-right px-3 py-3 font-bold">% réseau</th>
                  <th className="text-right px-3 py-3 font-bold">Emprunteurs</th>
                  <th className="text-right px-3 py-3 font-bold">Ticket moy.</th>
                  <th className="text-right px-3 py-3 font-bold">PAR 30j</th>
                  <th className="text-right px-3 py-3 font-bold">Taux remb.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {AGENCES.map(a => {
                  const ticketMoy = Math.round(a.encours_fcfa / a.emprunteurs_actifs)
                  const pct = (a.encours_fcfa / RESEAU_CONSOLIDE.encours_total) * 100
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: a.color + '20', color: a.color }}>{a.initiales}</div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">{a.nom_court}</div>
                            <div className="text-[10px] text-slate-400">{a.region} · {a.responsable}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-800">{formatFcfa(a.encours_fcfa)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 bg-slate-100 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct * 1.5}%` }} />
                          </div>
                          <span className="text-[11px] font-bold w-9 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-slate-700">{a.emprunteurs_actifs}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-700">{formatFcfa(ticketMoy)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          a.par_courant > 10 ? 'bg-red-100 text-red-700' :
                          a.par_courant > 8 ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>{a.par_courant}%</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`text-xs font-bold ${
                          a.taux_remboursement >= 93 ? 'text-green-600' :
                          a.taux_remboursement >= 85 ? 'text-orange-600' : 'text-red-600'
                        }`}>{a.taux_remboursement}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vue === 'REGION' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { region: 'Maritime',  agences: ['Lomé Centre', 'Bè Kpota', 'Tsévié'],  encours: 42_400_000, dossiers: 138, par: 9.1, color: '#3b82f6' },
            { region: 'Plateaux',  agences: ['Tabligbo', 'Kpalimé'],                  encours: 18_780_000, dossiers: 50,  par: 5.8, color: '#14b8a6' },
            { region: 'Savanes',   agences: ['(en projet)'],                          encours: 0,         dossiers: 0,   par: 0,   color: '#94a3b8' },
          ].map(r => (
            <div key={r.region} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                <h4 className="text-base font-bold text-slate-800">Région {r.region}</h4>
                <span className="text-[10px] text-slate-500 ml-auto">{r.agences.length} agences</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Encours :</span> <span className="font-bold text-slate-800">{formatFcfa(r.encours)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Dossiers actifs :</span> <span className="font-bold text-slate-700">{r.dossiers}</span></div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PAR 30j :</span>
                  <span className={`font-bold ${r.par > 10 ? 'text-red-600' : r.par > 8 ? 'text-orange-600' : 'text-green-600'}`}>{r.par}%</span>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Ticket moy. :</span> <span className="font-bold text-slate-700">{r.dossiers ? formatFcfa(Math.round(r.encours / r.dossiers)) : '—'}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                {r.agences.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {vue === 'SECTEUR' && <SectorBreakdown />}

      {/* Synthèse caractéristiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Ticket moyen</div>
          <div className="text-2xl font-black text-slate-800">{formatFcfa(Math.round(RESEAU_CONSOLIDE.encours_total / RESEAU_CONSOLIDE.total_emprunteurs))}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">188 emprunteurs actifs</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Durée moyenne</div>
          <div className="text-2xl font-black text-slate-800">11.4 <span className="text-sm">mois</span></div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pondéré par encours</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Portefeuille sain</div>
          <div className="text-2xl font-black text-green-700">78.9%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Vs 21.1% à risque</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Expected Loss</div>
          <div className="text-2xl font-black text-red-700">{formatFcfa(EXPECTED_LOSS.el_total)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{EXPECTED_LOSS.el_pct_portefeuille}% du portefeuille</div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ONGLET WORKFLOW & SLA
// ═══════════════════════════════════════════════════════════════════════════════

function OngletWorkflowROC() {
  const router = useRouter()
  const { temps_moyens_par_etape, taux_erreur_operationnel_pct, taux_erreur_evolution,
          cible_taux_erreur_pct, tickets_incidents, tickets_stats,
          disponibilite_systeme, evenements_systeme } = PERFORMANCE_OPERATIONNELLE

  return (
    <div className="space-y-5">

      {/* KPIs Workflow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={13} className="text-orange-600" />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Délai moy. traitement</div>
          </div>
          <div className="text-2xl font-black text-orange-700">4.2 <span className="text-sm">j</span></div>
          <div className="text-[10px] text-slate-500 mt-0.5">Objectif {DOSSIERS_CREDIT_STATS.delai_objectif_jours}j · <span className="text-red-600 font-bold">+1.2j</span></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={13} className="text-blue-600" />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Dossiers en attente</div>
          </div>
          <div className="text-2xl font-black text-blue-700">{DOSSIERS_CREDIT_STATS.en_attente}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dont 4 dossiers &gt; 48h</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={13} className="text-red-600" />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Taux d'erreur op.</div>
          </div>
          <div className="text-2xl font-black text-red-700">{taux_erreur_operationnel_pct}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cible &lt; {cible_taux_erreur_pct}% · <span className="text-orange-600 font-bold">↘ baisse</span></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={13} className="text-purple-600" />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Tickets ouverts</div>
          </div>
          <div className="text-2xl font-black text-purple-700">{tickets_stats.total_ouverts}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{tickets_stats.P1_actifs} P1 · MTTR {disponibilite_systeme.mttr_h}h</div>
        </div>
      </div>

      {/* Temps moyens par étape */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Temps moyen par étape du workflow</h3>
            <AiBadge variant="small" label="Détection goulots" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-bold">Étape</th>
                <th className="text-right px-3 py-3 font-bold">Temps moyen</th>
                <th className="text-right px-3 py-3 font-bold">Objectif</th>
                <th className="text-center px-3 py-3 font-bold">Écart</th>
                <th className="text-left px-5 py-3 font-bold w-1/3">Progression</th>
                <th className="text-center px-3 py-3 font-bold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {temps_moyens_par_etape.map((e, i) => {
                const ratio = e.temps_min / e.objectif_min
                const ecart = ratio > 1 ? `+${Math.round((ratio - 1) * 100)}%` : `${Math.round((ratio - 1) * 100)}%`
                const widthPct = Math.min(ratio * 50, 100)
                const couleur = ratio < 1.1 ? '#16a34a' : ratio < 1.4 ? '#f97316' : '#dc2626'
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-xs font-semibold text-slate-800">{e.etape}</td>
                    <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-700">
                      {e.temps_min < 60 ? `${e.temps_min} min` : `${(e.temps_min / 60).toFixed(1)} h`}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-slate-500">
                      {e.objectif_min < 60 ? `${e.objectif_min} min` : `${(e.objectif_min / 60).toFixed(1)} h`}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-bold ${ratio > 1 ? 'text-red-600' : 'text-green-600'}`}>{ecart}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="bg-slate-100 rounded-full h-2 relative">
                        <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-slate-400" title="Cible 100%" />
                        <div className="h-full rounded-full transition-all" style={{ width: `${widthPct}%`, backgroundColor: couleur }} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUT_TEMPS[e.statut].bg} ${STATUT_TEMPS[e.statut].text}`}>
                        {e.statut.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline 14 statuts — raccourci vers kanban */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Workflow size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Pipeline crédit — 14 statuts (vision ROC)</h3>
          </div>
          <button
            type="button"
            onClick={() => router.push('/credit/pipeline')}
            className="text-xs font-bold text-orange-700 hover:text-orange-800 inline-flex items-center gap-1"
          >
            <Columns3 size={12} />
            Vue kanban complète
          </button>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-2 min-w-max">
            {DOSSIERS_CREDIT_STATS.pipeline_14_statuts.map((etape, i) => {
              const isBottleneck = ['DOCS_INCOMPLETS', 'EN_ANALYSE_ROC', 'EN_RETARD', 'CONTENTIEUX'].includes(etape.statut)
              const isCloture = ['CLOTURE', 'EN_GESTION'].includes(etape.statut)
              return (
                <button
                  key={etape.statut}
                  type="button"
                  onClick={() => router.push('/credit/pipeline')}
                  className={`flex-shrink-0 w-32 rounded-lg border p-2.5 text-left cursor-pointer hover:ring-2 hover:ring-orange-300 transition-all ${
                  isBottleneck ? 'border-red-200 bg-red-50' :
                  isCloture ? 'border-slate-100 bg-slate-100 opacity-70' :
                  'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[9px] font-bold text-slate-400">#{i + 1}</span>
                    {isBottleneck && <AlertTriangle size={9} className="text-red-500" />}
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 leading-tight mb-1 truncate">{etape.statut.replaceAll('_', ' ')}</div>
                  <div className="text-xl font-black text-slate-700">{etape.count}</div>
                  <div className="text-[9px] text-slate-400">{formatFcfa(etape.montant_estime)}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tickets incidents + Évolution taux erreur */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-900">Tickets incidents opérationnels</h3>
            </div>
            <span className="text-xs text-slate-400">{tickets_stats.total_ouverts} ouverts · {tickets_stats.P1_actifs} P1</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-3 py-3 font-bold">ID · Date</th>
                  <th className="text-center px-3 py-3 font-bold">Prio</th>
                  <th className="text-left px-3 py-3 font-bold">Module</th>
                  <th className="text-left px-3 py-3 font-bold">Description</th>
                  <th className="text-center px-3 py-3 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tickets_incidents.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-mono font-semibold text-slate-800">{t.id}</div>
                      <div className="text-[10px] text-slate-400">{t.date}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TICKET_PRIORITE[t.priorite]}`}>{t.priorite}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-700">{t.module}</td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-600">{t.description}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TICKET_STATUT[t.statut]}`}>
                        {t.statut.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-4">

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Évolution taux d'erreur</h3>
              <AiBadge variant="small" label="↘ Tendance baisse" />
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={taux_erreur_evolution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <ReferenceLine y={cible_taux_erreur_pct} stroke="#16a34a" strokeDasharray="4 2" label={{ value: 'Cible', position: 'right', fontSize: 9 }} />
                <Line type="monotone" dataKey="taux" stroke="#dc2626" strokeWidth={2.5} dot={{ fill: '#dc2626', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Disponibilité système</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-green-50 border border-green-100">
                <div className="text-[9px] font-bold text-green-700 uppercase">Uptime mois</div>
                <div className="text-xl font-black text-green-700">{disponibilite_systeme.uptime_pct_mois}%</div>
                <div className="text-[10px] text-green-600">SLA {disponibilite_systeme.sla_objectif_pct}%</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                <div className="text-[9px] font-bold text-blue-700 uppercase">Trimestre</div>
                <div className="text-xl font-black text-blue-700">{disponibilite_systeme.uptime_pct_trimestre}%</div>
                <div className="text-[10px] text-blue-600">{disponibilite_systeme.incidents_mois} incidents</div>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                <div className="text-[9px] font-bold text-orange-700 uppercase">MTTR</div>
                <div className="text-xl font-black text-orange-700">{disponibilite_systeme.mttr_h}h</div>
                <div className="text-[10px] text-orange-600">Temps réparation</div>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                <div className="text-[9px] font-bold text-purple-700 uppercase">MTBF</div>
                <div className="text-xl font-black text-purple-700">{disponibilite_systeme.mtbf_j}j</div>
                <div className="text-[10px] text-purple-600">Entre pannes</div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 italic">Dernière panne : {disponibilite_systeme.derniere_panne_majeure}</div>
          </div>

        </div>
      </div>

      {/* Événements système */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity size={15} className="text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Événements système récents</h3>
        </div>
        <div className="divide-y divide-slate-50 max-h-[300px] overflow-auto">
          {evenements_systeme.map((e, i) => {
            const color = EVENT_COLOR[e.type]
            return (
              <div key={i} className="px-5 py-2.5 hover:bg-slate-50 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                <span className="text-[11px] font-mono text-slate-500 w-28 flex-shrink-0">{e.date}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${color.bg} ${color.text} flex-shrink-0`}>{e.type}</span>
                <span className="text-[11px] text-slate-700 flex-1">{e.message}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ONGLET RÉSEAU & TERRAIN
// ═══════════════════════════════════════════════════════════════════════════════

function OngletReseauTerrainROC() {
  return (
    <div className="space-y-5">
      {/* Performance par agence */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Performance multi-agence — Vision ROC</h3>
            <AiBadge variant="small" label="Tableau de bord supervision" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-bold">Agence</th>
                <th className="text-right px-3 py-3 font-bold">Encours</th>
                <th className="text-right px-3 py-3 font-bold">PAR 30j</th>
                <th className="text-right px-3 py-3 font-bold">Taux remb.</th>
                <th className="text-right px-3 py-3 font-bold">Tx mois</th>
                <th className="text-right px-3 py-3 font-bold">Collecte</th>
                <th className="text-center px-3 py-3 font-bold">Score santé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {AGENCES.map(a => {
                const data = AGENCES_DATA[a.id]
                const collectePct = Math.round((a.collecte_mois / a.collecte_objectif) * 100)
                const score = data?.kpis.score_sante ?? 0
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: a.color + '20', color: a.color }}>{a.initiales}</div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{a.nom_court}</div>
                          <div className="text-[10px] text-slate-400">{a.agents} agents · {a.responsable}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-700">{formatFcfa(a.encours_fcfa)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        a.par_courant > 10 ? 'bg-red-100 text-red-700' :
                        a.par_courant > 8 ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>{a.par_courant}%</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`text-xs font-bold ${a.taux_remboursement >= 93 ? 'text-green-600' : 'text-orange-600'}`}>{a.taux_remboursement}%</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-slate-700">{Math.floor(140 + a.emprunteurs_actifs * 1.2)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="text-xs font-bold text-teal-700">{formatFcfa(a.collecte_mois)}</div>
                      <div className={`text-[10px] font-bold ${collectePct >= 90 ? 'text-green-600' : collectePct >= 70 ? 'text-orange-600' : 'text-red-600'}`}>{collectePct}% obj.</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5">
                          <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: score >= 80 ? '#16a34a' : score >= 65 ? '#f97316' : '#dc2626' }} />
                        </div>
                        <span className={`text-xs font-bold ${score >= 80 ? 'text-green-600' : score >= 65 ? 'text-orange-600' : 'text-red-600'}`}>{score}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Carte */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <MapIcon size={15} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900">Carte géographique réseau — Concentration risque</h3>
        </div>
        <div className="p-4"><AgenceMap selectedAgenceId={null} /></div>
      </div>

      {/* Activité terrain via composant existant */}
      <OngletTerrain />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ONGLET TRÉSORERIE & CASH
// ═══════════════════════════════════════════════════════════════════════════════

function OngletTresorerieCashROC() {
  return (
    <div className="space-y-5">

      {/* KPIs Cash global */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Cash total réseau</div>
          <div className="text-2xl font-black text-teal-700">{formatFcfa(CASH_GLOBAL.total_reseau)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Min. requis {formatFcfa(CASH_GLOBAL.total_minimum_requis)}</div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <div className="text-[10px] font-bold text-red-600 uppercase">Agences critiques</div>
          <div className="text-2xl font-black text-red-700">{CASH_GLOBAL.agences_critiques}</div>
          <div className="text-[10px] text-red-600 mt-0.5">Action immédiate</div>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4">
          <div className="text-[10px] font-bold text-orange-600 uppercase">Agences en tension</div>
          <div className="text-2xl font-black text-orange-700">{CASH_GLOBAL.agences_tension}</div>
          <div className="text-[10px] text-orange-600 mt-0.5">Surveiller cash</div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4">
          <div className="text-[10px] font-bold text-blue-600 uppercase">Transferts recommandés</div>
          <div className="text-2xl font-black text-blue-700">{formatFcfa(CASH_GLOBAL.transferts_recommandes_montant)}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Vers Bè Kpota + Tsévié</div>
        </div>
      </div>

      {/* Détail cash par agence */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Cash disponible par agence — Tension liquidité</h3>
            <AiBadge variant="small" label="Mise à jour quotidienne" />
          </div>
        </div>
        <div className="space-y-3 p-5">
          {CASH_PAR_AGENCE.map(c => {
            const niveau = NIVEAU_CASH[c.niveau]
            const ratioMin = (c.cash_disponible / c.cash_minimum_requis) * 100
            const couleurBar = c.niveau === 'CRITIQUE_BAS' ? '#dc2626' : c.niveau === 'TENSION' ? '#f97316' : c.niveau === 'EXCEDENT' ? '#3b82f6' : '#16a34a'
            return (
              <div key={c.agence_id} className={`p-4 rounded-xl border ${niveau.bg} ${niveau.border}`}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className={niveau.text} />
                    <span className="text-sm font-bold text-slate-800">{c.agence_nom}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${niveau.bg} ${niveau.text} ${niveau.border}`}>
                      {niveau.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">Min : {formatFcfa(c.cash_minimum_requis)}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">Décaiss. prévus : {formatFcfa(c.decaissements_prevus_jour)}</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-black text-slate-800">{formatFcfa(c.cash_disponible)}</span>
                  <span className="text-xs text-slate-500">disponibles</span>
                  <span className="text-[11px] text-slate-400 ml-auto">Prévision 24h : <b>{formatFcfa(c.prevision_24h)}</b></span>
                </div>
                <div className="bg-white rounded-full h-2 border border-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(ratioMin, 100)}%`, backgroundColor: couleurBar }} />
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-slate-400">0</span>
                  <span className="text-slate-400">{formatFcfa(c.cash_minimum_requis)} (min)</span>
                  <span className="text-slate-400">{formatFcfa(c.cash_maximum_securise)} (max)</span>
                </div>
                {c.action_recommandee && (
                  <div className={`mt-3 text-xs font-semibold ${niveau.text} flex items-center gap-1.5`}>
                    {c.niveau === 'CRITIQUE_BAS' ? <AlertTriangle size={12} /> : <Bell size={12} />}
                    Action : {c.action_recommandee}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
