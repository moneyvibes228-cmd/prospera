'use client'
import { useState } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Lightbulb, Target, Download, Mail, ChevronDown, ChevronUp, Calendar, Sparkles, Building2 } from 'lucide-react'
import type { RapportIA } from '@/lib/mockMicrofinance'
import { SyntheseAgenceBlock, TENDANCE_DOT } from '@/components/dashboard/SyntheseAgenceBlock'

interface Props {
  rapport: RapportIA
  accentColor?: 'slate' | 'indigo' | 'teal' | 'red' | 'orange' | 'green'
  /** Titre du bloc analyse exécutive (ex. Direction Générale vs ROC) */
  analyseLabel?: string
}

const ACCENT_GRADIENTS: Record<string, string> = {
  slate:  'from-slate-900 via-slate-800 to-slate-900',
  indigo: 'from-indigo-900 via-indigo-800 to-slate-900',
  teal:   'from-teal-900 via-slate-800 to-slate-900',
  red:    'from-red-900 via-slate-800 to-slate-900',
  orange: 'from-orange-900 via-slate-800 to-slate-900',
  green:  'from-green-900 via-slate-800 to-slate-900',
}

const SEVERITE_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-50 border-red-200 text-red-800',
  HAUTE:    'bg-orange-50 border-orange-200 text-orange-800',
  MODEREE:  'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const SEVERITE_DOT: Record<string, string> = {
  CRITIQUE: 'bg-red-500',
  HAUTE:    'bg-orange-500',
  MODEREE:  'bg-yellow-500',
}

const PRIORITE_BADGE: Record<number, string> = {
  1: 'bg-red-100 text-red-700 border-red-200',
  2: 'bg-orange-100 text-orange-700 border-orange-200',
  3: 'bg-blue-100 text-blue-700 border-blue-200',
}


function TendanceIcon({ tendance }: { tendance?: 'HAUSSE' | 'BAISSE' | 'STABLE' }) {
  if (tendance === 'HAUSSE') return <TrendingUp size={11} className="text-green-300" />
  if (tendance === 'BAISSE') return <TrendingDown size={11} className="text-red-300" />
  return <Minus size={11} className="text-slate-400" />
}

export function RapportIAGlobal({ rapport, accentColor = 'slate', analyseLabel = 'Direction Générale' }: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
      {/* ── En-tête du rapport ── */}
      <div className={`bg-gradient-to-r ${ACCENT_GRADIENTS[accentColor]} px-5 py-4 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold">Rapport IA — Vue d'ensemble</h2>
                <span className="text-[10px] bg-teal-500/30 text-teal-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-teal-400/40">
                  <Sparkles size={9} /> AUTO 06:00
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300 flex-wrap">
                <Calendar size={11} />
                <span>{rapport.date_generation}</span>
                <span className="text-slate-500">·</span>
                <span>{rapport.periode}</span>
                <span className="text-slate-500">·</span>
                <span className="text-teal-200">{rapport.destinataire}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors">
              <Download size={11} /> PDF
            </button>
            <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors">
              <Mail size={11} /> Envoyer
            </button>
            <button onClick={() => setExpanded(e => !e)} className="text-xs bg-teal-500/30 hover:bg-teal-500/50 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors border border-teal-400/40">
              {expanded ? <><ChevronUp size={11} /> Réduire</> : <><ChevronDown size={11} /> Voir le rapport</>}
            </button>
          </div>
        </div>

        {/* ── Synthèse exécutive + analyse ── */}
        {expanded && (
          <div className="mt-4 space-y-3">

            {/* Synthèse exécutive */}
            <div className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2.5">
                <Lightbulb size={13} className="text-yellow-300 shrink-0" />
                <h3 className="text-xs font-bold text-yellow-200 uppercase tracking-wider">Analyse de situation — {analyseLabel}</h3>
              </div>
              <div className="space-y-3">
                {rapport.synthese_executive.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="text-sm text-slate-100 leading-[1.75]">{para.trim()}</p>
                ))}
              </div>
            </div>

            {/* Analyse par pilier */}
            {rapport.synthese_piliers && rapport.synthese_piliers.length > 0 && (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-2.5 bg-white/5 flex items-center gap-2 border-b border-white/10">
                  <Target size={12} className="text-teal-300 shrink-0" />
                  <h3 className="text-xs font-bold text-teal-200 uppercase tracking-wider">Analyse par domaine</h3>
                  <span className="ml-auto text-[10px] text-slate-400">{rapport.synthese_piliers.length} domaines analysés</span>
                </div>
                <div className="divide-y divide-white/5">
                  {rapport.synthese_piliers.map((pilier, i) => (
                    <div key={i} className="px-4 py-3 bg-black/15 hover:bg-black/25 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <span className="text-[10px] font-black text-teal-400 bg-teal-400/10 border border-teal-400/20 rounded px-1.5 py-0.5 shrink-0 mt-0.5 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <div className="text-xs font-bold text-white mb-1">{pilier.titre}</div>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{pilier.contenu}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analyse par agence */}
            {rapport.synthese_agences && rapport.synthese_agences.length > 0 && (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-2.5 bg-white/5 flex items-center gap-2 border-b border-white/10">
                  <Building2 size={12} className="text-teal-300 shrink-0" />
                  <h3 className="text-xs font-bold text-teal-200 uppercase tracking-wider">Lecture par agence</h3>
                  <span className="ml-auto text-[10px] text-slate-400">{rapport.synthese_agences.length} sites</span>
                </div>
                <div className="divide-y divide-white/5">
                  {rapport.synthese_agences.map(ag => (
                    <div key={ag.agence_id} className="px-4 py-3 bg-black/15 hover:bg-black/25 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-1.5 shrink-0 rounded-full mt-1.5 self-stretch ${TENDANCE_DOT[ag.tendance]}`} />
                        <div className="flex-1 min-w-0">
                          <SyntheseAgenceBlock ag={ag} variant="dark" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Chiffres clés (toujours visibles) ── */}
        {expanded && (
          <div
            className={`mt-3 grid grid-cols-2 gap-2 ${
              rapport.chiffres_cles.length >= 6 ? 'lg:grid-cols-6' : rapport.chiffres_cles.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
            }`}
          >
            {rapport.chiffres_cles.map((c, i) => (
              <div key={i} className="p-2.5 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] text-slate-300 uppercase tracking-wider truncate">{c.label}</div>
                  <TendanceIcon tendance={c.tendance} />
                </div>
                <div className="text-base font-black text-white truncate">{c.valeur}</div>
                {c.commentaire && <div className="text-[10px] text-slate-300 mt-0.5 truncate">{c.commentaire}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Corps déplié — bloc unique ── */}
      {expanded && (
        <div className="bg-white divide-y divide-slate-100">

          {/* ── Alertes immédiates ── */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alertes immédiates</h3>
              <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{rapport.alertes_immediates.length}</span>
            </div>
            <div className="space-y-2">
              {rapport.alertes_immediates.map((alerte, i) => {
                const isCritique = alerte.startsWith('🚨')
                const isWarning  = alerte.startsWith('⚠')
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${isCritique ? 'bg-red-50 border-red-100' : isWarning ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                    <span className="text-base shrink-0 leading-none mt-0.5">{alerte.charAt(0)}</span>
                    <p className={`text-sm leading-relaxed ${isCritique ? 'text-red-800' : isWarning ? 'text-orange-800' : 'text-blue-800'}`}>
                      {alerte.substring(2).trim()}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Points forts + Points d'attention côte à côte ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            <div className="px-5 pt-4 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Points forts</h3>
                <span className="ml-auto text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">{rapport.points_forts.length}</span>
              </div>
              <div className="space-y-2">
                {rapport.points_forts.map((force, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 leading-relaxed">{force}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pt-4 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} className="text-orange-500 shrink-0" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Points d'attention</h3>
                <span className="ml-auto text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{rapport.points_attention.length}</span>
              </div>
              <div className="space-y-2.5">
                {rapport.points_attention.map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${SEVERITE_DOT[point.severite]}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-xs font-bold text-slate-800">{point.titre}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${SEVERITE_STYLE[point.severite]}`}>{point.severite}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{point.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Recommandations ── */}
          <div className="px-5 pt-4 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={13} className="text-indigo-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recommandations priorisées</h3>
              <span className="ml-auto text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{rapport.recommandations.length}</span>
            </div>
            <div className="space-y-2">
              {[...rapport.recommandations].sort((a, b) => a.priorite - b.priorite).map((reco, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className={`text-[10px] px-2 py-1 rounded-lg font-black border shrink-0 ${PRIORITE_BADGE[reco.priorite]}`}>P{reco.priorite}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-snug">{reco.action}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                        <Target size={10} /> {reco.impact_estime}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar size={10} /> {reco.delai}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Prévisions 30j + Comparaison côte à côte ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            <div className="px-5 pt-4 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={13} className="text-teal-600 shrink-0" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Prévisions — 30 jours</h3>
              </div>
              <div className="space-y-2.5">
                {rapport.previsions_30j.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-28 shrink-0 truncate">{p.metrique}</span>
                    <span className="text-xs font-bold text-slate-700 w-20 shrink-0 text-right">{p.valeur_actuelle}</span>
                    <div className="flex-1 relative h-1.5 bg-slate-100 rounded-full">
                      <div className="absolute inset-y-0 left-0 bg-teal-400 rounded-full" style={{ width: `${p.confidence}%` }} />
                    </div>
                    <span className="text-xs font-bold text-teal-700 w-16 shrink-0 text-right">{p.valeur_prevue}</span>
                    <span className="text-[10px] text-slate-400 w-14 shrink-0 text-right">{p.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pt-4 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-purple-600 shrink-0" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vs mois précédent</h3>
              </div>
              <div className="space-y-1.5">
                {rapport.comparaison_mois_precedent.map((c, i) => {
                  const isPar = c.metrique.toLowerCase().includes('par')
                  const unite = c.variation_unite ?? (isPar ? 'pt' : 'pct')
                  const favorable = isPar ? c.variation_pct < 0 : c.variation_pct > 0
                  const suffix = unite === 'pt' ? ' pt' : '%'
                  return (
                    <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-500 flex-1 truncate">{c.metrique}</span>
                      <span className="text-xs text-slate-400 w-20 text-right shrink-0">{c.mois_precedent}</span>
                      <span className="text-xs font-bold text-slate-700 w-20 text-right shrink-0">{c.mois_courant}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${favorable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.variation_pct > 0 ? '+' : ''}{c.variation_pct.toFixed(1)}{suffix}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Signature IA ── */}
          <div className="px-5 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <span>{rapport.signature_ia}</span>
            <span className="italic">Ce rapport remplace le rapport manuel hebdomadaire — économie estimée : 4h/semaine</span>
          </div>

        </div>
      )}
    </div>
  )
}
