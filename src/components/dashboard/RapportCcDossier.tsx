'use client'
import { useState } from 'react'
import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  Sparkles, AlertTriangle, CheckCircle2, XCircle, Info, Bot,
  TrendingUp, Calendar, FileQuestion, ClipboardCheck, ArrowRight,
  ChevronDown, ChevronUp, MapPin, Phone, Briefcase,
} from 'lucide-react'
import { formatFcfa } from '@/lib/utils'
import { prosperaIaModeLabel } from '@/lib/prospera-ia-credit'
import {
  type RapportCC, type EtapeScore,
  ALERTES_CBI_LABELS,
} from '@/lib/mockMicrofinance'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { DossierEnrichiSections } from '@/components/dashboard/DossierEnrichiSections'
import { getEnrichissement } from '@/lib/dossier-enrichissement'
import {
  getDecisionsForRole, getDecisionSectionLabel, isRocRole, isCcRole,
  type DecisionCredit, normalizeLegacyDecision,
} from '@/lib/credit-decisions'
import type { UserRole } from '@/types'

interface RapportCcDossierProps {
  dossier: RapportCC
  userRole?: UserRole
  onDecisionClick?: (decision: DecisionCredit) => void
}

const ETAPES_ORDRE: EtapeScore[] = ['SOUMIS', 'DOSSIER_COMPLET', 'EN_ANALYSE', 'VALIDE_CHARGE', 'EN_ANALYSE_ROC']
const ETAPE_LABEL: Record<EtapeScore, string> = {
  SOUMIS:           'Soumis',
  DOSSIER_COMPLET:  'Docs OK',
  EN_ANALYSE:       'Analyse',
  VALIDE_CHARGE:    'Validé CC',
  EN_ANALYSE_ROC:   'Analyse ROC',
}

const CLASSE_BCEAO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PERFORMANT:        { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  SOUS_SURVEILLANCE: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  DOUTEUX:           { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  COMPROMIS:         { bg: 'bg-red-200',    text: 'text-red-900',    border: 'border-red-400' },
  PERTE:             { bg: 'bg-slate-900',  text: 'text-white',      border: 'border-slate-900' },
}

const SEVERITE_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  CRITICAL: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300',    icon: <AlertTriangle size={13} className="text-red-600" /> },
  WARN:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', icon: <AlertTriangle size={13} className="text-orange-500" /> },
  INFO:     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: <Info size={13} className="text-blue-500" /> },
}

const DECISION_STYLES: Record<string, { bg: string; text: string }> = {
  APPROUVER:           { bg: 'bg-green-600 hover:bg-green-700',   text: 'text-white' },
  APPROUVER_REDUIT:    { bg: 'bg-teal-600 hover:bg-teal-700',     text: 'text-white' },
  APPROUVER_RESERVES:  { bg: 'bg-amber-600 hover:bg-amber-700',   text: 'text-white' },
  DEMANDER_GARANTIES:  { bg: 'bg-orange-600 hover:bg-orange-700', text: 'text-white' },
  REFUSER:             { bg: 'bg-red-600 hover:bg-red-700',       text: 'text-white' },
  TRANSMETTRE_ROC:     { bg: 'bg-indigo-600 hover:bg-indigo-700', text: 'text-white' },
  RENVOYER_CC:         { bg: 'bg-slate-600 hover:bg-slate-700',   text: 'text-white' },
  A_VOIR_ROC:          { bg: 'bg-indigo-600 hover:bg-indigo-700', text: 'text-white' },
}

export function RapportCcDossier({ dossier, userRole, onDecisionClick }: RapportCcDossierProps) {
  const [dimExpanded, setDimExpanded] = useState<string | null>(null)
  const classeColors = CLASSE_BCEAO_COLORS[dossier.classe_bceao]
  const enrichi = getEnrichissement(dossier.dossier_id, dossier)
  const decisions = getDecisionsForRole(userRole)
  const sectionLabel = getDecisionSectionLabel(userRole)
  const suggested = dossier.analyse_prospera_ia.decision_suggeree
    ? normalizeLegacyDecision(dossier.analyse_prospera_ia.decision_suggeree)
    : undefined

  const radarData = [
    { axe: 'CHARACTER',  value: dossier.mapping_5c.CHARACTER,  max: 35, normalized: (dossier.mapping_5c.CHARACTER  / 35) * 100 },
    { axe: 'CAPACITY',   value: dossier.mapping_5c.CAPACITY,   max: 15, normalized: (dossier.mapping_5c.CAPACITY   / 15) * 100 },
    { axe: 'CAPITAL',    value: dossier.mapping_5c.CAPITAL,    max: 25, normalized: (dossier.mapping_5c.CAPITAL    / 25) * 100 },
    { axe: 'COLLATERAL', value: dossier.mapping_5c.COLLATERAL, max: 10, normalized: (dossier.mapping_5c.COLLATERAL / 10) * 100 },
    { axe: 'CONDITIONS', value: dossier.mapping_5c.CONDITIONS, max: 15, normalized: (dossier.mapping_5c.CONDITIONS / 15) * 100 },
  ]

  return (
    <div className="space-y-4">

      {/* ── HEADER DOSSIER ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400">{dossier.reference_dossier}</span>
                <span className="text-[10px] text-slate-300">·</span>
                <span className="text-[10px] text-slate-500">Soumis le {dossier.date_creation}</span>
                <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded border ${classeColors.bg} ${classeColors.text} ${classeColors.border}`}>
                  {dossier.classe_bceao}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">{dossier.client.prenom} {dossier.client.nom}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                <span className="inline-flex items-center gap-1"><Briefcase size={11} /> {dossier.client.activite}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={11} /> {dossier.client.localite}</span>
                <span className="inline-flex items-center gap-1"><Phone size={11} /> {dossier.client.telephone}</span>
                <span>· {dossier.client.age} ans</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-right">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Demandé</div>
                <div className="text-lg font-black text-slate-800">{formatFcfa(dossier.montant_demande)}</div>
                <div className="text-[10px] text-slate-500">{dossier.duree_mois} mois</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Score CBI</div>
                <div className={`text-2xl font-black ${dossier.score_consolide >= 75 ? 'text-green-600' : dossier.score_consolide >= 55 ? 'text-orange-600' : 'text-red-600'}`}>
                  {dossier.score_consolide}
                  <span className="text-xs text-slate-400">/100</span>
                </div>
                <div className="text-[10px] text-slate-500">CBI {dossier.score_cbi} <span className={dossier.ajustement_prospera_ia >= 0 ? 'text-green-600' : 'text-red-600'}>{dossier.ajustement_prospera_ia >= 0 ? '+' : ''}{dossier.ajustement_prospera_ia}</span></div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold text-slate-400 uppercase">PD</div>
                <div className={`text-lg font-black ${dossier.probabilite_defaut_pct < 15 ? 'text-green-600' : dossier.probabilite_defaut_pct < 35 ? 'text-orange-600' : 'text-red-600'}`}>{dossier.probabilite_defaut_pct.toFixed(1)}%</div>
                <div className="text-[10px] text-slate-500">défaut estimé</div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Objet du crédit : </span>{dossier.objet_credit}
          </div>
        </div>

        {/* Timeline étapes */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <div className="flex items-center justify-between gap-1">
            {ETAPES_ORDRE.map((etape, i) => {
              const evol = dossier.evolution_score.find(e => e.etape === etape)
              const isCurrent = dossier.etape_courante === etape
              const isPast = ETAPES_ORDRE.indexOf(dossier.etape_courante) > i
              const isFuture = ETAPES_ORDRE.indexOf(dossier.etape_courante) < i
              return (
                <div key={etape} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      isCurrent ? 'bg-teal-500 border-teal-700 text-white ring-4 ring-teal-100' :
                      isPast    ? 'bg-green-500 border-green-700 text-white' :
                                  'bg-white border-slate-200 text-slate-300'
                    }`}>
                      {isPast ? '✓' : (i + 1)}
                    </div>
                    <div className="text-center">
                      <div className={`text-[9px] font-bold ${isCurrent ? 'text-teal-700' : isPast ? 'text-green-700' : 'text-slate-400'}`}>{ETAPE_LABEL[etape]}</div>
                      {evol && <div className="text-[9px] text-slate-500">{evol.score_consolide}/100</div>}
                    </div>
                  </div>
                  {i < ETAPES_ORDRE.length - 1 && (
                    <div className={`flex-1 h-0.5 ${isPast || (isCurrent && isFuture === false) ? 'bg-green-300' : 'bg-slate-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── RADAR 5C + ÉVOLUTION SCORE ── */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-900">Mapping 5C (Kharoubi & Thomas)</h3>
            <AiBadge variant="small" label="CBI v5" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="axe" tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Radar name="Score" dataKey="normalized" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
              <Tooltip
                formatter={(_v, _n, props) => {
                  const p = (props as { payload?: { value: number; max: number } }).payload
                  return p ? [`${p.value}/${p.max}`, 'Score'] : ['', '']
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {radarData.map(d => (
              <div key={d.axe} className="text-center">
                <div className="text-[9px] font-bold text-slate-500">{d.axe}</div>
                <div className={`text-sm font-black ${d.normalized >= 70 ? 'text-green-600' : d.normalized >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                  {d.value}<span className="text-[9px] text-slate-400">/{d.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Évolution du score à chaque étape</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dossier.evolution_score} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="etape" tick={{ fontSize: 9 }} tickFormatter={(v) => ETAPE_LABEL[v as EtapeScore]} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <ReferenceLine y={75} stroke="#16a34a" strokeDasharray="4 2" label={{ value: 'PERFORMANT', position: 'right', fontSize: 9, fill: '#16a34a' }} />
              <ReferenceLine y={55} stroke="#f97316" strokeDasharray="4 2" label={{ value: 'SOUS-SURV.', position: 'right', fontSize: 9, fill: '#f97316' }} />
              <ReferenceLine y={35} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'DOUTEUX', position: 'right', fontSize: 9, fill: '#dc2626' }} />
              <Line type="monotone" dataKey="score_consolide" stroke="#14b8a6" strokeWidth={3} dot={{ fill: '#14b8a6', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ANALYSE PROSPERA IA ── */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm">
        <div className="px-5 py-4 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-purple-700" />
            <h3 className="text-sm font-bold text-purple-900">Analyse Prospera IA</h3>
            <AiBadge variant="small" label={prosperaIaModeLabel(dossier.analyse_prospera_ia.mode)} />
          </div>
          {dossier.analyse_prospera_ia.decision_suggeree && (
            <div className="text-[11px] font-bold text-purple-700">
              Décision suggérée : <span className="px-2 py-0.5 bg-white rounded">{dossier.analyse_prospera_ia.decision_suggeree.replaceAll('_', ' ')}</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Commentaire */}
          <div>
            <div className="text-[10px] font-bold text-purple-900 uppercase mb-1">Synthèse de l'analyste virtuel</div>
            <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-purple-100 italic">
            &ldquo;{dossier.analyse_prospera_ia.commentaire}&rdquo;
          </p>
          {/* Analyse approfondie Prospera IA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {[
              { label: 'Transactions & retraits', text: enrichi.analyse_prospera_ia_etendue.transactions },
              { label: 'Comportement client', text: enrichi.analyse_prospera_ia_etendue.comportement },
              { label: 'Contexte économique', text: enrichi.analyse_prospera_ia_etendue.macro_economie },
              { label: 'Saisonnalité', text: enrichi.analyse_prospera_ia_etendue.saison },
              { label: 'Recouvrement & impayés', text: enrichi.analyse_prospera_ia_etendue.recouvrement },
              { label: 'Saturation sectorielle', text: enrichi.analyse_prospera_ia_etendue.saturation_secteur },
            ].filter(x => x.text).map(block => (
              <div key={block.label} className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="text-[10px] font-bold text-purple-800 uppercase mb-1">{block.label}</div>
                <p className="text-xs text-slate-700 leading-relaxed">{block.text}</p>
              </div>
            ))}
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dossier.analyse_prospera_ia.questions_a_poser.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-purple-900 uppercase mb-2 flex items-center gap-1">
                  <FileQuestion size={11} />
                  Questions à poser au client ({dossier.analyse_prospera_ia.questions_a_poser.length})
                </div>
                <ul className="space-y-1.5">
                  {dossier.analyse_prospera_ia.questions_a_poser.map((q, i) => (
                    <li key={i} className="text-xs text-slate-700 bg-white p-2 rounded border border-purple-100 flex gap-2">
                      <span className="text-purple-500 font-bold flex-shrink-0">Q{i + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dossier.analyse_prospera_ia.points_a_verifier.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-purple-900 uppercase mb-2 flex items-center gap-1">
                  <ClipboardCheck size={11} />
                  Points à vérifier ({dossier.analyse_prospera_ia.points_a_verifier.length})
                </div>
                <ul className="space-y-1.5">
                  {dossier.analyse_prospera_ia.points_a_verifier.map((p, i) => (
                    <li key={i} className="text-xs text-slate-700 bg-white p-2 rounded border border-purple-100 flex gap-2">
                      <CheckCircle2 size={11} className="text-purple-500 flex-shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ALERTES CBI ACTIVES ── */}
      {dossier.alertes_actives.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle size={15} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">Alertes CBI v5 actives ({dossier.alertes_actives.length})</h3>
            <span className="ml-auto text-[10px] text-slate-400">9 codes possibles</span>
          </div>
          <div className="divide-y divide-slate-100">
            {dossier.alertes_actives.map((a, i) => {
              const meta = ALERTES_CBI_LABELS[a.code]
              const sev = SEVERITE_COLORS[a.severite]
              return (
                <div key={i} className={`px-5 py-3 ${sev.bg}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{sev.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${sev.bg} ${sev.text} ${sev.border}`}>{a.severite}</span>
                        <span className="text-xs font-bold text-slate-800">{meta.label}</span>
                        <span className="text-[9px] font-mono text-slate-400">{a.code}</span>
                      </div>
                      <p className="text-xs text-slate-700">{a.message}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">{meta.description}</p>
                      {a.donnees && (
                        <div className="mt-1.5 flex gap-2 flex-wrap">
                          {Object.entries(a.donnees).map(([k, v]) => (
                            <span key={k} className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {k} : <b>{v}</b>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── DONNÉES ENRICHIES ── */}
      <DossierEnrichiSections dossier={dossier} />

      {/* ── 8 DIMENSIONS DÉTAILLÉES ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Sparkles size={15} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900">Détail 8 dimensions CBI v5</h3>
          <span className="ml-auto text-[10px] text-slate-400">Cliquer pour développer</span>
        </div>
        <div className="divide-y divide-slate-100">
          {dossier.detail_dimensions.map(d => {
            const isExpanded = dimExpanded === d.code
            const couleur = !d.active ? '#94a3b8' : d.pct >= 70 ? '#16a34a' : d.pct >= 50 ? '#f97316' : '#dc2626'
            return (
              <div key={d.code} className={!d.active ? 'opacity-60' : ''}>
                <button
                  onClick={() => setDimExpanded(isExpanded ? null : d.code)}
                  className="w-full px-5 py-3 hover:bg-slate-50 text-left flex items-center gap-3 transition-colors"
                  disabled={!d.active}>
                  <span className="text-[10px] font-mono font-bold text-slate-400 w-6">{d.code}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{d.nom}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{d.axe_5c}</span>
                      {!d.active && <span className="text-[9px] font-bold text-slate-400">· non actif</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{d.justification}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: couleur }} />
                    </div>
                    <div className="text-right w-16">
                      <div className="text-xs font-bold" style={{ color: couleur }}>{d.score}<span className="text-[10px] text-slate-400">/{d.max}</span></div>
                      <div className="text-[9px] text-slate-500">{d.pct}%</div>
                    </div>
                    {d.active && (isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />)}
                  </div>
                </button>

                {isExpanded && d.active && (
                  <div className="px-5 pb-4 bg-slate-50">
                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                      <p className="text-xs text-slate-700 mb-2">{d.justification}</p>
                      {d.sous_dimensions.length > 0 && (
                        <div className="space-y-1.5 border-t border-slate-100 pt-2 mt-2">
                          <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Sous-dimensions</div>
                          {d.sous_dimensions.map(sd => {
                            const sdPct = (sd.score / sd.max) * 100
                            const sdColor = sdPct >= 70 ? '#16a34a' : sdPct >= 50 ? '#f97316' : '#dc2626'
                            return (
                              <div key={sd.key} className="flex items-center gap-2 text-[11px]">
                                <span className="text-slate-600 w-32 flex-shrink-0">{sd.key.replaceAll('_', ' ')}</span>
                                {sd.valeur && <span className="text-slate-800 font-semibold w-32">{sd.valeur}</span>}
                                <span className="text-slate-500 flex-1 italic">{sd.justification}</span>
                                <div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-full rounded-full" style={{ width: `${sdPct}%`, backgroundColor: sdColor }} /></div>
                                <span className="font-bold w-12 text-right" style={{ color: sdColor }}>{sd.score}/{sd.max}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RAPPELS ÉTAPE + ACTIONS DÉCISION ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Rappels pour l'étape courante</h3>
        </div>
        <ul className="space-y-2 mb-4">
          {dossier.rappels_etape.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <ArrowRight size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">{r}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-slate-100 pt-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{sectionLabel}</div>
          {!isRocRole(userRole) && !isCcRole(userRole) && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-2 border border-amber-200">
              Connectez-vous en tant que Chargé de crédit ou ROC pour voir les actions de décision adaptées à votre rôle.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {decisions.map(d => {
              const style = DECISION_STYLES[d.id] ?? DECISION_STYLES.REFUSER
              const isSuggested = suggested === d.id || dossier.analyse_prospera_ia.decision_suggeree === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => onDecisionClick?.(d.id)}
                  className={`relative text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all ${style.bg} ${style.text} ${
                    isSuggested ? 'ring-2 ring-purple-300 ring-offset-2' : ''
                  }`}>
                  {d.label}
                  {isSuggested && (
                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">IA</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 italic">
            {isRocRole(userRole)
              ? `ROC : ${userRole === 'MANAGER' ? 'Direction' : 'Validation finale'}`
              : isCcRole(userRole)
                ? `Chargé de crédit : ${dossier.charge_credit.nom} · ${dossier.charge_credit.agence}`
                : `Analyste : ${dossier.charge_credit.nom}`}
          </div>
        </div>
      </div>
    </div>
  )
}
