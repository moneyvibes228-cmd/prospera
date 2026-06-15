'use client'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, TrendingDown, AlertTriangle, Bell, CheckCircle2,
  Banknote, ShieldAlert, Activity, FileText, ArrowRight,
  Clock, ChevronRight, Users, Zap,
  XCircle, Ban, FileX, Wifi, AlertOctagon, Wrench,
  BarChart3, Lock,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { MOCK_ROC_HOME } from '@/lib/mockMicrofinance'
import { RAPPORT_IA_ROC } from '@/lib/roc-synthese-ia'
import { getMauvaisPayeurIdByNom, getAgentRecouvrementIdByNom } from '@/lib/roc-recouvrement-vue360'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { SyntheseROCComplement } from '@/components/dashboard/SyntheseROCComplement'
import { entityLabel, formatFcfa } from '@/lib/utils'

const CLASSE_BCEAO_STYLE: Record<string, string> = {
  PERFORMANT:        'bg-green-100 text-green-700',
  SOUS_SURVEILLANCE: 'bg-orange-100 text-orange-700',
  DOUTEUX:           'bg-red-100 text-red-700',
  COMPROMIS:         'bg-red-200 text-red-900',
  PERTE:             'bg-slate-900 text-white',
}

const SUGGESTION_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  APPROUVER:           { bg: 'bg-green-600 hover:bg-green-700',   text: 'text-white', label: 'Approuver' },
  APPROUVER_REDUIT:    { bg: 'bg-teal-600 hover:bg-teal-700',     text: 'text-white', label: 'Approuver réduit' },
  DEMANDER_GARANTIES:  { bg: 'bg-orange-600 hover:bg-orange-700', text: 'text-white', label: 'Demander garanties' },
  REFUSER:             { bg: 'bg-red-600 hover:bg-red-700',       text: 'text-white', label: 'Refuser' },
}

const SEVERITE_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  CRITIQUE: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700' },
  HAUTE:    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  MOYENNE:  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
}

const STATUT_AGENCE_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-700',
  TENSION:  'bg-orange-100 text-orange-700',
  NORMAL:   'bg-blue-100 text-blue-700',
  BON:      'bg-green-100 text-green-700',
}

const STATUT_AGENT_STYLE: Record<string, { bg: string; text: string }> = {
  BON:     { bg: 'bg-green-100',  text: 'text-green-700' },
  NORMAL:  { bg: 'bg-blue-100',   text: 'text-blue-700' },
  DEGRADE: { bg: 'bg-red-100',    text: 'text-red-700' },
}

const DOMAINE_ICON: Record<string, React.ElementType> = {
  CASH:         Banknote,
  CREDIT:       FileText,
  OPERATIONNEL: Activity,
  FRAUDE:       ShieldAlert,
  SYSTEME:      Activity,
}

const PIPELINE_COLORS: Record<string, string> = {
  blue:   'bg-blue-500 text-white',
  indigo: 'bg-indigo-500 text-white',
  orange: 'bg-orange-500 text-white',
  teal:   'bg-teal-500 text-white',
  slate:  'bg-slate-400 text-white',
}

const DEFAULT_SUGGESTION = SUGGESTION_STYLE.APPROUVER

function lookupStyle<T>(map: Record<string, T>, key: string | undefined, fallback: T): T {
  if (!key) return fallback
  const upper = key.toUpperCase().replace(/[\s-]+/g, '_')
  return map[key] ?? map[upper] ?? fallback
}

function getSuggestionStyle(suggestion?: string) {
  const norm = suggestion?.toUpperCase().replace(/[\s-]+/g, '_') ?? ''
  if (norm in SUGGESTION_STYLE) return SUGGESTION_STYLE[norm]!
  if (norm.includes('REDUIT') && norm.includes('APPROUV')) return SUGGESTION_STYLE.APPROUVER_REDUIT
  if (norm.includes('APPROUV')) return SUGGESTION_STYLE.APPROUVER
  if (norm.includes('GARANT')) return SUGGESTION_STYLE.DEMANDER_GARANTIES
  if (norm.includes('REFUS')) return SUGGESTION_STYLE.REFUSER
  return {
    ...DEFAULT_SUGGESTION,
    label: suggestion?.replace(/_/g, ' ') ?? 'Décision IA',
  }
}

export function DashboardResponsableCredit() {
  const router = useRouter()
  const d = MOCK_ROC_HOME

  const kpisReseau = Array.isArray(d.kpis_reseau) ? d.kpis_reseau : []
  const fileValidation = Array.isArray(d.file_validation) ? d.file_validation : []
  const alertesPriorisees = Array.isArray(d.alertes_priorisees) ? d.alertes_priorisees : []
  const pipelineDossiers = Array.isArray(d.pipeline_dossiers) ? d.pipeline_dossiers : []
  const topMauvaisPayeurs = Array.isArray(d.top_mauvais_payeurs) ? d.top_mauvais_payeurs : []
  const performanceAgents = Array.isArray(d.performance_agents) ? d.performance_agents : []
  const heatmapParAgences = Array.isArray(d.heatmap_par_agences) ? d.heatmap_par_agences : []
  const dossiersBloques = Array.isArray(d.dossiers_bloques) ? d.dossiers_bloques : []
  const alertesCritiques = alertesPriorisees.filter((a) => a.severite === 'CRITIQUE').length
  const dossiersA48h = fileValidation.filter((f) => f.attente_h >= 48).length

  return (
    <div className="space-y-5">
      {/* ─── HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bonjour Kafui — Pilotage Crédit & Opérations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Responsable Opération & Crédit · {dossiersA48h} dossiers &gt; 48h · {alertesCritiques} alertes critiques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/credit/pipeline')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors">
            <BarChart3 size={13} />
            Pipeline crédit
            <ArrowRight size={13} />
          </button>
          <button
            onClick={() => router.push('/credit')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
            <FileText size={13} />
            Pilotage complet (7 onglets)
            <ArrowRight size={13} />
          </button>
          <ExportButton label="Exporter synthèse ROC" filename="synthese_roc_home" />
        </div>
      </div>

      {/* ─── SYNTHÈSE IA (format DG) + compléments ROC ─── */}
      <RapportIAGlobal
        rapport={RAPPORT_IA_ROC}
        accentColor="red"
        analyseLabel="Responsable Opération & Crédit"
      />
      <SyntheseROCComplement />

      {/* ─── KPIs RÉSEAU ÉTENDUS (12 indicateurs en 2 lignes) ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700">KPIs Immédiats — Crédit + Opérations</h2>
          <AiBadge variant="small" label="Mise à jour 5 min" pulse />
        </div>

        {/* Ligne 1 — Crédit */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-2">
          {kpisReseau.slice(0, 4).map((kpi) => {
            const positifEstMieux = !['par_30', 'el', 'a_valider'].includes(kpi.cle)
            const goodTrend = positifEstMieux ? kpi.variation_pct >= 0 : kpi.variation_pct <= 0
            const TrendIcon = kpi.variation_pct >= 0 ? TrendingUp : TrendingDown
            return (
              <KpiMiniCard key={kpi.cle} label={kpi.label} valeur={kpi.valeur} unite={kpi.unite}
                variation={kpi.variation_pct} TrendIcon={TrendIcon} goodTrend={goodTrend} sparkline={kpi.sparkline} />
            )
          })}
          <KpiMiniCard label="Prêts actifs" valeur={d.kpis_credit_etendus?.nb_prets_actifs ?? 0} unite="" />
          <KpiMiniCard
            label="Décaissements jour"
            valeur={d.kpis_credit_etendus?.decaissements_jour_count ?? 0}
            sublabel={formatFcfa(d.kpis_credit_etendus?.decaissements_jour_montant ?? 0)}
            unite=""
          />
          <KpiMiniCard
            label="Remboursements jour"
            valeur={formatFcfa(d.kpis_credit_etendus?.remboursements_jour_montant ?? 0)}
            unite="FCFA"
          />
        </div>

        {/* Ligne 2 — Risque + Opérations */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <KpiMiniCard label="PAR 1j" valeur={`${d.kpis_credit_etendus?.par_1_pct ?? 0}%`} unite="" critique={(d.kpis_credit_etendus?.par_1_pct ?? 0) > 12} />
          <KpiMiniCard label="PAR 7j" valeur={`${d.kpis_credit_etendus?.par_7_pct ?? 0}%`} unite="" critique={(d.kpis_credit_etendus?.par_7_pct ?? 0) > 10} />
          <KpiMiniCard label="PAR 30j" valeur={`${d.kpis_credit_etendus?.par_30_pct ?? 0}%`} unite="" critique={(d.kpis_credit_etendus?.par_30_pct ?? 0) > 8} />
          <KpiMiniCard label="Dossiers retard" valeur={d.kpis_credit_etendus?.nb_dossiers_retard ?? 0} unite="" critique />
          <KpiMiniCard label="Montant impayés" valeur={formatFcfa(d.kpis_credit_etendus?.montant_impayes_fcfa ?? 0)} unite="" critique />
          <KpiMiniCard
            label="Dossiers bloqués &gt;48h"
            valeur={d.kpis_operations?.dossiers_bloques ?? 0}
            unite=""
            sublabel="action requise"
            critique
            onClick={() => router.push('/credit/recouvrement/dossiers-bloques')}
          />
          <KpiMiniCard
            label="Délai trait. moyen"
            valeur={`${d.kpis_operations?.temps_traitement_h ?? 0}h`}
            unite=""
            sublabel={`obj. ${d.kpis_operations?.temps_traitement_obj ?? 0}h`}
            critique={(d.kpis_operations?.temps_traitement_h ?? 0) > (d.kpis_operations?.temps_traitement_obj ?? 0)}
          />
        </div>
      </div>

      {/* ─── PIPELINE DOSSIERS (5 ÉTAPES) ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          <BarChart3 size={15} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Pipeline des dossiers — Réseau complet</h3>
          <AiBadge variant="small" label="Vue kanban Odoo" />
          <button
            type="button"
            onClick={() => router.push('/credit/pipeline')}
            className="ml-auto text-xs font-bold text-orange-700 hover:text-orange-800 inline-flex items-center gap-1"
          >
            Ouvrir le pipeline complet <ChevronRight size={12} />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 overflow-x-auto">
            {pipelineDossiers.map((step, i) => (
              <div key={step.code ?? `pipeline-${i}`} className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => router.push('/credit/pipeline')}
                  className="text-left bg-slate-50 hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-300 rounded-xl p-3 min-w-[150px] transition-colors cursor-pointer"
                >
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-2 ${lookupStyle(PIPELINE_COLORS, step.couleur, 'bg-slate-400 text-white')}`}>
                    {step.etape}
                  </div>
                  <div className="text-2xl font-black text-slate-800">{step.count}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{formatFcfa(step.montant_fcfa)}</div>
                  <div className={`text-[10px] font-bold mt-1 ${step.delta_jour > 0 ? 'text-green-600' : step.delta_jour < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {step.delta_jour > 0 ? '+' : ''}{step.delta_jour} jour
                  </div>
                </button>
                {i < pipelineDossiers.length - 1 && (
                  <ChevronRight size={20} className="text-slate-300 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2 COLONNES : FILE VALIDATION + ALERTES PRIORISÉES ─── */}
      <div className="grid grid-cols-12 gap-4">

        {/* FILE DE VALIDATION */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">File de validation ROC</h3>
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{fileValidation.length} en attente</span>
            </div>
            <button onClick={() => router.push('/credit')} className="text-[11px] font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
              Workflow complet <ChevronRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[440px] overflow-auto">
            {fileValidation.map((f, fi) => {
              const sug = getSuggestionStyle(f.suggestion_ia)
              const isUrgent = f.attente_h >= 48
              return (
                <div key={f.reference ?? `file-${fi}`} className={`px-5 py-3 hover:bg-slate-50 transition-colors ${isUrgent ? 'bg-red-50/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{f.reference}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${lookupStyle(CLASSE_BCEAO_STYLE, f.classe_bceao, 'bg-slate-100 text-slate-700')}`}>{f.classe_bceao ?? '—'}</span>
                        {f.alertes_critiques > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 inline-flex items-center gap-0.5">
                            <AlertTriangle size={9} /> {f.alertes_critiques}
                          </span>
                        )}
                        {isUrgent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">URGENT · {f.attente_h}h</span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-800">{entityLabel(f.client)}</div>
                      <div className="text-[11px] text-slate-500 truncate">{entityLabel(f.activite)} · {entityLabel(f.agence)}</div>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] flex-wrap">
                        <span className="text-slate-500">{formatFcfa(f.montant_demande)}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">Score <b className={f.score_consolide >= 75 ? 'text-green-600' : f.score_consolide >= 55 ? 'text-orange-600' : 'text-red-600'}>{f.score_consolide}</b></span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">PD <b>{f.pd_pct}%</b></span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">EL <b className="text-red-700">{formatFcfa(f.el_estimee)}</b></span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                      <button
                        onClick={() => alert(`${sug.label} : ${f.reference}\n${entityLabel(f.client)}\nAction enregistrée.`)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${sug.bg} ${sug.text} transition-all relative`}>
                        {sug.label}
                        <span className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">IA</span>
                      </button>
                      <button onClick={() => router.push(`/credit/analyse`)}
                        className="text-[10px] font-semibold text-slate-600 hover:text-teal-700 inline-flex items-center gap-1">
                        Détail <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ALERTES PRIORISÉES */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-red-200 shadow-sm">
          <div className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-red-600" />
              <h3 className="text-sm font-semibold text-red-900">Top 5 alertes priorisées IA</h3>
            </div>
            <span className="text-[10px] font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded-full">{alertesCritiques} critiques</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[440px] overflow-auto">
            {alertesPriorisees.map((a, i) => {
              const sev = lookupStyle(SEVERITE_STYLE, a.severite, SEVERITE_STYLE.MOYENNE)
              const Icon = DOMAINE_ICON[a.domaine] ?? Bell
              return (
                <div key={String(a.id ?? `alerte-${i}`)} className={`px-5 py-3 hover:bg-slate-50 ${sev.bg}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] font-bold text-slate-400">#{i + 1}</span>
                    <Icon size={13} className={`flex-shrink-0 mt-0.5 ${sev.text}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sev.text} ${sev.border} border bg-white`}>{a.severite}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{a.domaine}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1">{a.titre}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{a.detail}</p>
                      <p className={`text-[11px] mt-1.5 font-semibold ${sev.text}`}>→ {a.action}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── QUALITÉ PORTEFEUILLE — ÉVOLUTION PAR + TOP MAUVAIS PAYEURS ─── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Évolution PAR 30j */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingDown size={15} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">Évolution PAR 30j — 12 semaines</h3>
            <AiBadge variant="small" label="Tendance" />
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={d.evolution_par_30}>
                <XAxis dataKey="sem" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
                <ReferenceLine y={10} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'BCEAO 10%', position: 'right', fontSize: 9, fill: '#dc2626' }} />
                <ReferenceLine y={8}  stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Interne 8%', position: 'right', fontSize: 9, fill: '#f97316' }} />
                <Line type="monotone" dataKey="par_30" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top mauvais payeurs */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertOctagon size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Top mauvais payeurs réseau</h3>
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{topMauvaisPayeurs.length}</span>
            <span className="ml-auto text-[10px] text-slate-400">Cliquer pour fiche IA</span>
          </div>
          <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100">
                  <th className="text-left px-3 py-2 font-bold">Client</th>
                  <th className="text-left px-2 py-2 font-bold">Agence</th>
                  <th className="text-right px-2 py-2 font-bold">Dû</th>
                  <th className="text-center px-2 py-2 font-bold">Retard</th>
                  <th className="text-center px-2 py-2 font-bold">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topMauvaisPayeurs.map((c, i) => {
                  const nom = entityLabel(c.nom)
                  const clientId = getMauvaisPayeurIdByNom(nom)
                  return (
                  <tr key={`mp-${nom}-${i}`}
                    onClick={() => clientId && router.push(`/credit/recouvrement/mauvais-payeurs/${clientId}`)}
                    className={`hover:bg-red-50/50 ${clientId ? 'cursor-pointer' : ''}`}>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-800">{nom}</td>
                    <td className="px-2 py-2 text-[11px] text-slate-500">{entityLabel(c.agence)}</td>
                    <td className="px-2 py-2 text-right text-xs font-bold text-red-700">{formatFcfa(c.montant_du)}</td>
                    <td className="px-2 py-2 text-center text-[11px] font-bold text-red-600">{c.retard_j}j</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.score < 35 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{c.score}</span>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── RECOUVREMENT RÉSEAU ─── */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-200 shadow-sm">
        <div className="px-5 py-4 border-b border-teal-100 flex items-center gap-2">
          <Banknote size={15} className="text-teal-700" />
          <h3 className="text-sm font-bold text-teal-900">Recouvrement réseau — Aujourd&apos;hui</h3>
          <AiBadge variant="small" label="Suivi temps réel" />
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg p-3 border border-teal-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Objectif jour</div>
            <div className="text-xl font-black text-slate-800 mt-1">{formatFcfa(d.recouvrement_reseau.objectif_jour_fcfa)}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-teal-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Collecté jour</div>
            <div className="text-xl font-black text-teal-700 mt-1">{formatFcfa(d.recouvrement_reseau.collecte_jour_fcfa)}</div>
            <div className="mt-2">
              <div className="bg-slate-100 rounded-full h-1.5">
                <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${d.recouvrement_reseau.taux_atteint_pct}%` }} />
              </div>
              <div className="text-[10px] text-teal-700 font-bold mt-1">{d.recouvrement_reseau.taux_atteint_pct}% atteint</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <div className="text-[10px] font-bold text-orange-600 uppercase">Clients non visités</div>
            <div className="text-xl font-black text-orange-700 mt-1">{d.recouvrement_reseau.clients_non_visites}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">/ {d.recouvrement_reseau.clients_a_visiter} prévus</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-[10px] font-bold text-blue-600 uppercase">Promesses paiement</div>
            <div className="text-xl font-black text-blue-700 mt-1">{d.recouvrement_reseau.promesses_paiement_count}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{formatFcfa(d.recouvrement_reseau.promesses_paiement_montant)}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="text-[10px] font-bold text-green-600 uppercase">Promesses honorées</div>
            <div className="text-xl font-black text-green-700 mt-1">{d.recouvrement_reseau.promesses_honorees_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">moyenne 7j</div>
          </div>
        </div>
      </div>

      {/* ─── VUE TERRAIN — PERFORMANCE AGENTS ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Recouvrement — Performance agents</h3>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">{performanceAgents.length} agents</span>
            <AiBadge variant="small" label="Détection sous-perf." />
          </div>
          <button onClick={() => router.push('/credit/recouvrement#equipes')} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
            Recouvrement — équipes <ChevronRight size={11} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 font-bold">Agent</th>
                <th className="text-left px-2 py-2.5 font-bold">Zone</th>
                <th className="text-center px-2 py-2.5 font-bold">Clients</th>
                <th className="text-center px-2 py-2.5 font-bold">Visites j</th>
                <th className="text-right px-2 py-2.5 font-bold">Collecte j</th>
                <th className="text-center px-2 py-2.5 font-bold">Retards 7j</th>
                <th className="text-center px-2 py-2.5 font-bold">Tx récouv.</th>
                <th className="text-right px-2 py-2.5 font-bold">Portefeuille</th>
                <th className="text-center px-3 py-2.5 font-bold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {performanceAgents.map((a, ai) => {
                const agentNom = entityLabel(a.agent)
                const visiteTauxOk = a.visites_jour / a.visites_obj >= 0.8
                const st = lookupStyle(STATUT_AGENT_STYLE, a.statut, STATUT_AGENT_STYLE.NORMAL)
                const agentId = getAgentRecouvrementIdByNom(agentNom)
                return (
                  <tr key={`agent-${agentNom}-${ai}`}
                    onClick={() => agentId && router.push(`/credit/recouvrement/agents/${agentId}`)}
                    className={`hover:bg-slate-50 ${a.statut === 'DEGRADE' ? 'bg-red-50/30' : ''} ${agentId ? 'cursor-pointer' : ''}`}>
                    <td className="px-4 py-2 text-xs font-bold text-slate-800">{agentNom}</td>
                    <td className="px-2 py-2 text-[11px] text-slate-500">{entityLabel(a.zone)}</td>
                    <td className="px-2 py-2 text-center text-xs font-semibold text-slate-700">{a.clients_actifs}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`text-[11px] font-bold ${visiteTauxOk ? 'text-green-700' : 'text-red-600'}`}>{a.visites_jour}/{a.visites_obj}</span>
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-bold text-teal-700">{formatFcfa(a.collecte_jour)}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`text-[11px] font-bold ${a.retards_j7 >= 10 ? 'text-red-600' : a.retards_j7 >= 6 ? 'text-orange-600' : 'text-slate-700'}`}>{a.retards_j7}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`text-[11px] font-bold ${a.taux_recouvrement >= 70 ? 'text-green-700' : a.taux_recouvrement >= 50 ? 'text-orange-600' : 'text-red-700'}`}>{a.taux_recouvrement}%</span>
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-bold text-slate-700">{formatFcfa(a.portefeuille_fcfa)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>{a.statut}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 2 COLONNES : HEATMAP PAR + CASH AGENCES ─── */}
      <div className="grid grid-cols-12 gap-4">

        {/* HEATMAP PAR */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-orange-600" />
              <h3 className="text-sm font-semibold text-slate-900">Heatmap PAR par agence</h3>
            </div>
          <button onClick={() => router.push('/credit/reseau')} className="text-[11px] font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
            Drill-down <ChevronRight size={11} />
          </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 font-bold">Agence</th>
                  <th className="text-center px-2 py-2.5 font-bold">PAR 1j</th>
                  <th className="text-center px-2 py-2.5 font-bold">PAR 7j</th>
                  <th className="text-center px-2 py-2.5 font-bold">PAR 30j</th>
                  <th className="text-center px-2 py-2.5 font-bold">PAR 90j</th>
                  <th className="text-right px-3 py-2.5 font-bold">Encours</th>
                  <th className="text-center px-2 py-2.5 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {heatmapParAgences.map((a, hi) => {
                  const cellStyle = (v: number, seuil: number) => {
                    if (v > seuil * 1.3) return 'bg-red-500 text-white'
                    if (v > seuil) return 'bg-orange-400 text-white'
                    if (v > seuil * 0.7) return 'bg-yellow-300 text-yellow-900'
                    return 'bg-green-200 text-green-800'
                  }
                  return (
                    <tr key={a.agence_id ?? `agence-${hi}`} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-xs font-semibold text-slate-800">{entityLabel(a.agence)}</td>
                      <td className="px-2 py-2 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cellStyle(a.par_1, 12)}`}>{a.par_1}%</span></td>
                      <td className="px-2 py-2 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cellStyle(a.par_7, 10)}`}>{a.par_7}%</span></td>
                      <td className="px-2 py-2 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cellStyle(a.par_30, 8)}`}>{a.par_30}%</span></td>
                      <td className="px-2 py-2 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cellStyle(a.par_90, 3)}`}>{a.par_90}%</span></td>
                      <td className="px-3 py-2 text-right text-xs font-bold text-slate-700">{formatFcfa(a.encours)}</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${lookupStyle(STATUT_AGENCE_STYLE, a.statut, 'bg-slate-100 text-slate-700')}`}>{a.statut ?? '—'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CASH AGENCES */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote size={15} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">Tension cash agences</h3>
            </div>
            <span className="text-[10px] text-slate-400">{d.cash_synthese.derniere_maj}</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total réseau</div>
                <div className="text-lg font-black text-slate-800">{formatFcfa(d.cash_synthese.total_disponible)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                <div className="text-[10px] font-bold text-red-600 uppercase">Critiques</div>
                <div className="text-lg font-black text-red-700">{d.cash_synthese.agences_critiques}</div>
                <div className="text-[10px] text-red-600 mt-0.5">action immédiate</div>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                <div className="text-[10px] font-bold text-orange-600 uppercase">En tension</div>
                <div className="text-lg font-black text-orange-700">{d.cash_synthese.agences_tension}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                <div className="text-[10px] font-bold text-blue-700 uppercase">Excédent</div>
                <div className="text-lg font-black text-blue-700">{d.cash_synthese.agences_excedent}</div>
                <div className="text-[10px] text-blue-600 mt-0.5">à rapatrier</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-50 border-2 border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-red-900">Transferts urgents recommandés</div>
                  <div className="text-lg font-black text-red-700 my-1">{formatFcfa(d.cash_synthese.transferts_recommandes)}</div>
                  <div className="text-[11px] text-red-700">{d.cash_synthese.transferts_urgents_libelle ?? '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DOSSIERS BLOQUÉS + CONTRÔLE QUOTIDIEN ─── */}
      <div className="grid grid-cols-12 gap-4">

        {/* DOSSIERS BLOQUÉS */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-orange-200 shadow-sm">
          <div className="px-5 py-4 border-b border-orange-100 bg-orange-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/credit/recouvrement/dossiers-bloques')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Lock size={15} className="text-orange-700" />
              <h3 className="text-sm font-bold text-orange-900">Dossiers bloqués &gt; 48h</h3>
              <span className="text-[10px] font-bold bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full">{dossiersBloques.length}</span>
            </button>
            <span className="text-[10px] text-orange-600 font-bold">
              {formatFcfa(dossiersBloques.reduce((s, x) => s + (x.montant ?? 0), 0))} bloqués
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[280px] overflow-auto">
            {dossiersBloques.map((b, bi) => (
              <button key={b.reference ?? `bloque-${bi}`}
                onClick={() => router.push(`/credit/recouvrement/dossiers/${encodeURIComponent(b.reference)}`)}
                className="w-full text-left px-5 py-2.5 hover:bg-orange-50/40 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{b.reference}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                        {entityLabel(b.etape).replaceAll('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{entityLabel(b.client)}</div>
                    <div className="text-[11px] text-slate-500">{entityLabel(b.agence)} · {formatFcfa(b.montant ?? 0)}</div>
                    <div className="text-[11px] text-orange-700 font-semibold mt-0.5">{entityLabel(b.blocage_raison)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-black text-red-600">{b.bloque_depuis_h}h</div>
                    <div className="text-[9px] text-slate-400">bloqué</div>
                  </div>
                  <ChevronRight size={12} className="text-slate-300 group-hover:text-orange-700 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CONTRÔLE QUOTIDIEN */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <ShieldAlert size={15} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Contrôle quotidien</h3>
          </div>
          <div className="p-5 space-y-2.5">
            <ControleRow icon={XCircle} couleur="red"
              label="Transactions échouées"
              valeur={`${d.controle_quotidien.transactions_echouees} / ${d.controle_quotidien.transactions_total}`}
              detail="sur transactions du jour" />
            <ControleRow icon={Ban} couleur="orange"
              label="Opérations annulées" valeur={d.controle_quotidien.operations_annulees} detail="à investiguer" />
            <ControleRow icon={FileX} couleur="amber"
              label="Dossiers incomplets" valeur={d.controle_quotidien.dossiers_incomplets} detail="pièces manquantes" />
            <ControleRow icon={Wifi} couleur="green"
              label="Agences actives"
              valeur={`${d.controle_quotidien.agences_actives} / ${d.controle_quotidien.agences_actives + d.controle_quotidien.agences_offline}`}
              detail={`${d.controle_quotidien.agences_offline} offline`} />
            <ControleRow icon={Wrench} couleur="red"
              label="Tickets incidents"
              valeur={d.controle_quotidien.tickets_incidents_ouverts}
              detail={`P1: ${d.controle_quotidien.ticket_p1} · P2: ${d.controle_quotidien.ticket_p2}`} />

            {d.controle_quotidien.derniere_anomalie && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Dernière anomalie</div>
                <div className="flex items-start gap-2 text-[11px]">
                  <Clock size={11} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-slate-700">{d.controle_quotidien.derniere_anomalie.detail}</span>
                    <span className="text-slate-400 ml-1.5">à {d.controle_quotidien.derniere_anomalie.heure}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── FOOTER : ACCÈS COMPLET ─── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-bold">Besoin d&apos;une vision plus détaillée ?</div>
            <p className="text-xs text-slate-300 mt-1">
              Le dashboard de pilotage complet contient 7 onglets : Vue exécutive · Portefeuille · Risque · Workflow · Réseau & Terrain · Trésorerie · Contrôle
            </p>
          </div>
          <button
            onClick={() => router.push('/credit')}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors">
            Ouvrir Pilotage complet
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

    </div>
  )
}

// ─── COMPOSANTS INTERNES ──────────────────────────────────────────────────

interface KpiMiniCardProps {
  label: string
  valeur: string | number
  unite?: string
  sublabel?: string
  variation?: number
  TrendIcon?: React.ElementType
  goodTrend?: boolean
  sparkline?: number[]
  critique?: boolean
  onClick?: () => void
}

function KpiMiniCard({ label, valeur, unite, sublabel, variation, TrendIcon, goodTrend, sparkline, critique, onClick }: KpiMiniCardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-xl border shadow-sm p-2.5 text-left w-full transition-colors ${critique ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'} ${onClick ? 'hover:ring-2 hover:ring-orange-300 cursor-pointer' : ''}`}>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`text-lg font-black ${critique ? 'text-red-700' : 'text-slate-800'}`}>{valeur}</span>
        {unite && <span className="text-[9px] text-slate-500">{unite}</span>}
      </div>
      {sublabel && <div className="text-[9px] text-slate-500 mt-0.5">{sublabel}</div>}
      {variation !== undefined && TrendIcon && (
        <div className={`flex items-center gap-1 text-[10px] mt-1 ${goodTrend ? 'text-green-600' : 'text-red-600'}`}>
          <TrendIcon size={9} />
          <span className="font-bold">{variation >= 0 ? '+' : ''}{variation}%</span>
        </div>
      )}
      {sparkline && (
        <div className="flex items-end gap-px h-4 mt-1">
          {sparkline.map((v, i) => {
            const max = Math.max(...sparkline)
            const min = Math.min(...sparkline)
            const h = max === min ? 50 : ((v - min) / (max - min)) * 100
            return <div key={i} className={`flex-1 rounded-t ${goodTrend ? 'bg-green-200' : 'bg-red-200'}`} style={{ height: `${Math.max(h, 10)}%` }} />
          })}
        </div>
      )}
    </Tag>
  )
}

interface ControleRowProps {
  icon: React.ElementType
  couleur: 'red' | 'orange' | 'amber' | 'green'
  label: string
  valeur: string | number
  detail: string
}

function ControleRow({ icon: Icon, couleur, label, valeur, detail }: ControleRowProps) {
  const styles: Record<string, string> = {
    red:    'bg-red-50 border-red-100 text-red-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
    amber:  'bg-amber-50 border-amber-100 text-amber-700',
    green:  'bg-green-50 border-green-100 text-green-700',
  }
  return (
    <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${styles[couleur]}`}>
      <Icon size={14} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-slate-800">{label}</div>
        <div className="text-[10px] text-slate-500">{detail}</div>
      </div>
      <div className="text-base font-black text-slate-800 flex-shrink-0">{valeur}</div>
    </div>
  )
}
