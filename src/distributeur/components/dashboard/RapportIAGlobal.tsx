'use client'
import { useState } from 'react'
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  Lightbulb, Target, Download, Mail, ChevronDown, ChevronUp, Calendar, Sparkles,
  Warehouse, Users, Package,
} from 'lucide-react'
import type { RapportIA, SyntheseSecteurIA, GroupeSecteurIA } from '@distributeur/types/rapport-ia'

interface Props {
  rapport: RapportIA
  accentColor?: 'slate' | 'indigo' | 'teal' | 'red' | 'orange' | 'green' | 'amber'
  analyseLabel?: string
}

const ACCENT_GRADIENTS: Record<string, string> = {
  slate: 'from-slate-900 via-slate-800 to-slate-900',
  indigo: 'from-indigo-900 via-indigo-800 to-slate-900',
  teal: 'from-teal-900 via-slate-800 to-slate-900',
  red: 'from-red-900 via-slate-800 to-slate-900',
  orange: 'from-orange-900 via-slate-800 to-slate-900',
  green: 'from-green-900 via-slate-800 to-slate-900',
  amber: 'from-amber-900 via-slate-800 to-slate-900',
}

const SEVERITE_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-50 border-red-200 text-red-800',
  HAUTE: 'bg-orange-50 border-orange-200 text-orange-800',
  MODEREE: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const SEVERITE_DOT: Record<string, string> = {
  CRITIQUE: 'bg-red-500',
  HAUTE: 'bg-orange-500',
  MODEREE: 'bg-yellow-500',
}

const PRIORITE_BADGE: Record<number, string> = {
  1: 'bg-red-100 text-red-700 border-red-200',
  2: 'bg-orange-100 text-orange-700 border-orange-200',
  3: 'bg-blue-100 text-blue-700 border-blue-200',
}

const TENDANCE_DOT: Record<string, string> = {
  POSITIF: 'bg-emerald-400',
  STABLE: 'bg-slate-400',
  ALERTE: 'bg-rose-400',
}

function TendanceIcon({ tendance }: { tendance?: 'HAUSSE' | 'BAISSE' | 'STABLE' }) {
  if (tendance === 'HAUSSE') return <TrendingUp size={11} className="text-emerald-400" />
  if (tendance === 'BAISSE') return <TrendingDown size={11} className="text-rose-400" />
  return <Minus size={11} className="text-slate-300" />
}

function confidenceBarColor(confidence: number): string {
  if (confidence >= 80) return 'bg-emerald-400'
  if (confidence >= 65) return 'bg-sky-400'
  return 'bg-orange-400'
}

const GROUPE_META: Record<GroupeSecteurIA, { label: string; Icon: typeof Warehouse; iconClass: string; headerClass: string }> = {
  ENTREPOT: { label: 'Plateformes logistiques', Icon: Warehouse, iconClass: 'text-teal-400', headerClass: 'text-teal-200' },
  CANAL: { label: 'Canaux commerciaux', Icon: Users, iconClass: 'text-indigo-400', headerClass: 'text-indigo-200' },
  FAMILLE: { label: 'Familles produits', Icon: Package, iconClass: 'text-violet-400', headerClass: 'text-violet-200' },
}

const TENDANCE_BADGE: Record<string, string> = {
  POSITIF: 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/40',
  STABLE: 'bg-slate-500/30 text-slate-100 border border-slate-400/30',
  ALERTE: 'bg-rose-500/25 text-rose-100 border border-rose-400/40',
}

const RISQUE_STYLE: Record<string, string> = {
  FAIBLE: 'bg-emerald-500/20 text-emerald-100 border-emerald-400/35',
  MODERE: 'bg-amber-500/20 text-amber-100 border-amber-400/35',
  ELEVE: 'bg-orange-500/25 text-orange-100 border-orange-400/40',
  CRITIQUE: 'bg-rose-500/25 text-rose-100 border-rose-400/40',
}

const SCENARIO_STYLE: Record<string, { box: string; label: string; prob: string; impact: string }> = {
  Optimiste: {
    box: 'bg-emerald-950/50 border-emerald-500/45',
    label: 'text-emerald-300',
    prob: 'text-emerald-200',
    impact: 'text-slate-200',
  },
  Central: {
    box: 'bg-slate-800/70 border-slate-500/40',
    label: 'text-slate-100',
    prob: 'text-sky-300',
    impact: 'text-slate-300',
  },
  Pessimiste: {
    box: 'bg-rose-950/45 border-rose-500/45',
    label: 'text-rose-300',
    prob: 'text-rose-200',
    impact: 'text-slate-200',
  },
}

function SyntheseSecteurBlock({ secteur }: { secteur: SyntheseSecteurIA }) {
  const previsions = secteur.previsions ?? []
  const scenarios = secteur.scenarios ?? []
  const facteurs = secteur.facteurs_cles ?? []

  return (
    <div className="space-y-3 min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-white">{secteur.nom}</span>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${TENDANCE_BADGE[secteur.tendance]}`}>
          {secteur.tendance}
        </span>
        {secteur.risque_niveau && (
          <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${RISQUE_STYLE[secteur.risque_niveau]}`}>
            Risque {secteur.risque_niveau.toLowerCase()}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-200 leading-relaxed">{secteur.resume}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {secteur.chiffres.map(c => (
          <div key={c.label} className="rounded-lg bg-slate-900/60 border border-white/10 px-2.5 py-2">
            <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wide truncate">{c.label}</div>
            <div className="text-xs font-bold text-white mt-0.5 truncate">{c.valeur}</div>
          </div>
        ))}
      </div>

      {secteur.analyse_ia && (
        <div className="rounded-lg bg-slate-900/90 border border-sky-500/35 px-3.5 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={11} className="text-sky-400 shrink-0" />
            <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Analyse IA</span>
          </div>
          <p className="text-xs text-slate-100 leading-[1.65]">{secteur.analyse_ia}</p>
        </div>
      )}

      {previsions.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-sky-300 uppercase tracking-wider mb-2">Prévisions IA</div>
          <div className="space-y-2">
            {previsions.map((p, i) => (
              <div key={i} className="rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-white truncate">{p.metrique}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.tendance && <TendanceIcon tendance={p.tendance} />}
                    <span className="text-[10px] font-medium text-slate-400">{p.horizon}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] mb-1.5">
                  <span className="text-slate-400">Actuel</span>
                  <span className="font-semibold text-slate-200">{p.valeur_actuelle}</span>
                  <span className="text-slate-600">→</span>
                  <span className="font-bold text-sky-200">{p.valeur_prevue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative h-1.5 bg-slate-700 rounded-full">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${confidenceBarColor(p.confidence)}`}
                      style={{ width: `${p.confidence}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 w-8 text-right tabular-nums">{p.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scenarios.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">Scénarios probabilisés</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {scenarios.map(s => {
              const style = SCENARIO_STYLE[s.label]
              return (
                <div key={s.label} className={`rounded-lg border px-3 py-2.5 ${style.box}`}>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-bold ${style.label}`}>{s.label}</span>
                    <span className={`text-[10px] font-black tabular-nums ${style.prob}`}>{s.probabilite}%</span>
                  </div>
                  <p className={`text-[10px] leading-snug ${style.impact}`}>{s.impact}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {facteurs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {facteurs.map(f => (
            <span key={f} className="text-[9px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-600/50 text-slate-200 font-medium">
              {f}
            </span>
          ))}
        </div>
      )}

      {secteur.action_prioritaire && (
        <div className="flex items-start gap-2 rounded-lg bg-orange-950/60 border border-orange-500/30 border-l-[3px] border-l-orange-400 px-3 py-2.5">
          <Target size={11} className="text-orange-300 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-50 leading-snug font-medium">{secteur.action_prioritaire}</p>
        </div>
      )}

      {secteur.equipe && secteur.equipe.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {secteur.equipe.map((m, i) => (
            <span key={`${secteur.secteur_id}-${m.role}-${m.nom}-${i}`} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-600/40 text-slate-200">
              {m.nom} <span className="font-bold text-sky-300 tabular-nums">{m.score}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function construireResumeTexte(rapport: RapportIA): string {
  const lignes: string[] = [
    `RAPPORT IA — ${rapport.destinataire}`,
    `${rapport.date_generation} · ${rapport.periode}`,
    '',
    'SYNTHÈSE EXÉCUTIVE',
    rapport.synthese_executive,
    '',
    'CHIFFRES CLÉS',
    ...rapport.chiffres_cles.map(c => `- ${c.label} : ${c.valeur}${c.commentaire ? ` (${c.commentaire})` : ''}`),
    '',
    'ALERTES IMMÉDIATES',
    ...rapport.alertes_immediates.map(a => `- ${a}`),
    '',
    'RECOMMANDATIONS PRIORISÉES',
    ...[...rapport.recommandations]
      .sort((a, b) => a.priorite - b.priorite)
      .map(r => `- [P${r.priorite}] ${r.action} — ${r.impact_estime} · ${r.delai}`),
    '',
    rapport.signature_ia,
  ]
  return lignes.join('\n')
}

export function RapportIAGlobal({ rapport, accentColor = 'amber', analyseLabel = 'Direction Générale' }: Props) {
  const [expanded, setExpanded] = useState(true)

  function exporterPdf() {
    setExpanded(true)
    if (typeof window !== 'undefined') {
      setTimeout(() => window.print(), 60)
    }
  }

  function envoyerEmail() {
    if (typeof window === 'undefined') return
    const sujet = `Rapport IA — ${rapport.destinataire} — ${rapport.date_generation}`
    const corps = construireResumeTexte(rapport)
    window.location.href = `mailto:?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
  }
  const operations = (rapport.synthese_operations ?? rapport.synthese_zones ?? []).map(s => ({
    ...s,
    secteur_id: s.secteur_id ?? (s as { zone_id?: string }).zone_id ?? s.nom,
    groupe: s.groupe ?? 'CANAL',
  }))
  const groupes = (['ENTREPOT', 'CANAL', 'FAMILLE'] as GroupeSecteurIA[]).filter(g =>
    operations.some(s => s.groupe === g),
  )

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
      <div className={`bg-gradient-to-r ${ACCENT_GRADIENTS[accentColor]} px-5 py-4 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold">Rapport IA — Vue d&apos;ensemble</h2>
                <span className="text-[10px] bg-amber-500/30 text-amber-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-400/40">
                  <Sparkles size={9} /> AUTO 06:00
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300 flex-wrap">
                <Calendar size={11} />
                <span>{rapport.date_generation}</span>
                <span className="text-slate-500">·</span>
                <span>{rapport.periode}</span>
                <span className="text-slate-500">·</span>
                <span className="text-amber-200">{rapport.destinataire}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={exporterPdf} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1">
              <Download size={11} /> PDF
            </button>
            <button type="button" onClick={envoyerEmail} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1">
              <Mail size={11} /> Envoyer
            </button>
            <button type="button" onClick={() => setExpanded(e => !e)} className="text-xs bg-amber-500/30 hover:bg-amber-500/50 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 border border-amber-400/40">
              {expanded ? <><ChevronUp size={11} /> Réduire</> : <><ChevronDown size={11} /> Voir le rapport</>}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3">
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

            {rapport.synthese_piliers && rapport.synthese_piliers.length > 0 && (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-2.5 bg-white/5 flex items-center gap-2 border-b border-white/10">
                  <Target size={12} className="text-amber-300 shrink-0" />
                  <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Analyse par domaine</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {rapport.synthese_piliers.map((pilier, i) => (
                    <div key={i} className="px-4 py-3 bg-black/15">
                      <div className="flex items-start gap-2.5">
                        <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <div className="text-xs font-bold text-white mb-1">{pilier.titre}</div>
                          <p className="text-xs text-slate-300 leading-relaxed">{pilier.contenu}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {operations.length > 0 && (
              <div className="rounded-xl border border-slate-600/40 overflow-hidden bg-slate-950/40">
                <div className="px-4 py-3 bg-slate-900/60 flex items-center gap-2 border-b border-slate-600/30">
                  <Warehouse size={13} className="text-sky-400 shrink-0" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Lecture opérationnelle — analyses & prévisions IA</h3>
                  <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{operations.length} axes</span>
                </div>
                <div className="divide-y divide-slate-700/40">
                  {groupes.map(groupe => {
                    const meta = GROUPE_META[groupe]
                    const items = operations.filter(s => s.groupe === groupe)
                    const Icon = meta.Icon
                    return (
                      <div key={groupe}>
                        <div className="px-4 py-2.5 bg-slate-900/50 flex items-center gap-2 border-b border-slate-700/30">
                          <Icon size={12} className={`${meta.iconClass} shrink-0`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.headerClass}`}>{meta.label}</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">{items.length}</span>
                        </div>
                        {items.map(secteur => (
                          <div key={secteur.secteur_id} className="px-4 py-4 bg-slate-900/30 hover:bg-slate-900/45 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`w-1 shrink-0 rounded-full self-stretch min-h-[48px] ${TENDANCE_DOT[secteur.tendance]}`} />
                              <SyntheseSecteurBlock secteur={secteur} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {expanded && (
          <div className={`mt-3 grid grid-cols-2 gap-2 ${rapport.chiffres_cles.length >= 6 ? 'lg:grid-cols-4' : 'lg:grid-cols-4'}`}>
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

      {expanded && (
        <div className="bg-white divide-y divide-slate-100">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alertes immédiates</h3>
              <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{rapport.alertes_immediates.length}</span>
            </div>
            <div className="space-y-2">
              {rapport.alertes_immediates.map((alerte, i) => {
                const isCritique = alerte.startsWith('🚨')
                const isWarning = alerte.startsWith('⚠')
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${isCritique ? 'bg-red-50 border-red-100' : isWarning ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                    <p className={`text-sm leading-relaxed ${isCritique ? 'text-red-800' : isWarning ? 'text-orange-800' : 'text-blue-800'}`}>{alerte}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            <div className="px-5 pt-4 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Points forts</h3>
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
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Points d&apos;attention</h3>
              </div>
              <div className="space-y-2.5">
                {rapport.points_attention.map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${SEVERITE_DOT[point.severite]}`} />
                    <div>
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

          <div className="px-5 pt-4 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={13} className="text-indigo-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recommandations priorisées</h3>
            </div>
            <div className="space-y-2">
              {[...rapport.recommandations].sort((a, b) => a.priorite - b.priorite).map((reco, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <span className={`text-[10px] px-2 py-1 rounded-lg font-black border shrink-0 ${PRIORITE_BADGE[reco.priorite]}`}>P{reco.priorite}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-snug">{reco.action}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px]">
                      <span className="text-teal-700 font-medium flex items-center gap-1"><Target size={10} /> {reco.impact_estime}</span>
                      <span className="text-slate-400 flex items-center gap-1"><Calendar size={10} /> {reco.delai}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            <div className="px-5 pt-4 pb-5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Prévisions grossiste — 30 jours</h3>
              <div className="space-y-2.5">
                {rapport.previsions_30j.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-36 shrink-0 truncate" title={p.metrique}>{p.metrique}</span>
                    <span className="text-xs font-bold text-slate-700 w-20 shrink-0 text-right">{p.valeur_actuelle}</span>
                    <div className="flex-1 relative h-1.5 bg-slate-100 rounded-full">
                      <div className="absolute inset-y-0 left-0 bg-amber-400 rounded-full" style={{ width: `${p.confidence}%` }} />
                    </div>
                    <span className="text-xs font-bold text-amber-700 w-16 shrink-0 text-right">{p.valeur_prevue}</span>
                    <span className="text-[10px] text-slate-400 w-10 shrink-0 text-right">{p.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pt-4 pb-5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Vs mois précédent</h3>
              <div className="space-y-1.5">
                {rapport.comparaison_mois_precedent.map((c, i) => {
                  const isNegMetric = /impayé|encours|retard|rupture/i.test(c.metrique)
                  const favorable = isNegMetric ? c.variation_pct < 0 : c.variation_pct > 0
                  const suffix = c.variation_unite === 'pt' ? ' pt' : '%'
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

          <div className="px-5 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <span>{rapport.signature_ia}</span>
            <span className="italic">Rapport auto grossiste B2B — économie estimée : 4h/semaine vs consolidation manuelle</span>
          </div>
        </div>
      )}
    </div>
  )
}
