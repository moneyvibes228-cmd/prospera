'use client'

import { useMemo, useState } from 'react'
import {
  Bot, Zap, ShieldCheck, Clock, ChevronDown, ChevronRight,
  Ban, Sparkles, Gauge, Check, X,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useAutomationWorkflow } from '@distributeur/contexts/AutomationWorkflowContext'
import { buildReglesMarketing } from '@distributeur/lib/automation/marketing-automations'
import { buildReglesRecouvrement } from '@distributeur/lib/automation/recouvrement-automations'
import {
  buildSyntheseAutomation, MODE_STYLE, MODE_LABEL, CANAL_ICON,
  type RegleAutomation,
} from '@distributeur/lib/automation/automation-types'
import type { CibleStatut } from '@distributeur/lib/automation-workflow'
import { formatFcfa } from '@distributeur/lib/utils'

/** Les règles du poste de la personne connectée — un DG voit les deux jeux. */
function reglesDuPoste(role?: string): RegleAutomation[] {
  if (role === 'MARKETING') return buildReglesMarketing()
  if (role === 'RECOUVREMENT') return buildReglesRecouvrement()
  return [...buildReglesMarketing(), ...buildReglesRecouvrement()]
}

function Tuile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
      <div className="text-[10px] text-slate-400 font-medium">{label}</div>
      <div className={`text-base font-black mt-0.5 ${accent ?? 'text-slate-800'}`}>{value}</div>
      {sub ? <div className="text-[9px] text-slate-400 mt-0.5">{sub}</div> : null}
    </div>
  )
}

function CarteRegle({ regle, actif, onToggleOuvert, ouvert, onToggleActif, cibleStatut, traiterCible, annulerCible }: {
  regle: RegleAutomation
  actif: boolean
  ouvert: boolean
  onToggleOuvert: () => void
  onToggleActif: () => void
  cibleStatut: (cibleId: string) => CibleStatut | undefined
  traiterCible: (cibleId: string, choix: CibleStatut, input: { label: string; message?: string }) => void
  annulerCible: (cibleId: string) => void
}) {
  const passantes = regle.cibles.filter(c => !c.bloque_par)
  const bloquees = regle.cibles.filter(c => c.bloque_par)
  const impact = passantes.reduce((s, c) => s + c.valeur_fcfa, 0)
  // Les actions AUTO partent seules ; VALIDATION et SUGGESTION demandent un geste humain.
  const demandeValidation = regle.mode !== 'AUTO'

  return (
    <div className={`rounded-xl border-2 bg-white transition-colors ${actif ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button type="button" onClick={onToggleOuvert} className="flex items-start gap-2 text-left min-w-0 flex-1">
            {ouvert ? <ChevronDown size={15} className="text-slate-400 mt-0.5 shrink-0" /> : <ChevronRight size={15} className="text-slate-400 mt-0.5 shrink-0" />}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">{CANAL_ICON[regle.canal]}</span>
                <h3 className="font-bold text-sm text-slate-900">{regle.nom}</h3>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${MODE_STYLE[regle.mode]}`}>
                  {MODE_LABEL[regle.mode]}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                <span className="font-semibold text-slate-600">Quand :</span> {regle.declencheur}
              </p>
              <p className="text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Alors :</span> {regle.action}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs font-black text-emerald-700">{passantes.length} cible(s)</div>
              <div className="text-[9px] text-slate-400">{formatFcfa(impact)} F en jeu</div>
            </div>
            <button
              type="button"
              onClick={onToggleActif}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${actif ? 'bg-emerald-500' : 'bg-slate-300'}`}
              aria-label={actif ? 'Désactiver la règle' : 'Activer la règle'}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${actif ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Performance observée */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="text-[9px] text-slate-400">Exécutions 30 j</div>
            <div className="text-xs font-bold">{regle.stats.executions_30j}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="text-[9px] text-slate-400">Taux de succès</div>
            <div className={`text-xs font-bold ${regle.stats.taux_succes_pct >= 60 ? 'text-emerald-600' : regle.stats.taux_succes_pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
              {regle.stats.taux_succes_pct}%
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="text-[9px] text-slate-400">Impact 30 j</div>
            <div className="text-xs font-bold text-emerald-700">{formatFcfa(regle.stats.impact_fcfa_30j)} F</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="text-[9px] text-slate-400">Temps gagné</div>
            <div className="text-xs font-bold">{regle.gain_temps_h_mois} h/mois</div>
          </div>
        </div>
      </div>

      {ouvert && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
          {/* Pourquoi cette règle existe */}
          <div className="flex gap-2 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <Sparkles size={13} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-900">{regle.explication_ia}</p>
          </div>

          {/* Garde-fous */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase mb-1.5">
              <ShieldCheck size={12} className="text-emerald-600" /> Ce que la règle refuse de faire
            </div>
            <ul className="space-y-1">
              {regle.garde_fous.map((g, i) => (
                <li key={i} className="text-[11px] text-slate-600 flex gap-1.5">
                  <span className="text-emerald-600 font-bold">·</span> {g}
                </li>
              ))}
            </ul>
            {regle.quota ? (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1.5">
                <Gauge size={11} /> Quota : {regle.quota}
              </div>
            ) : null}
          </div>

          {/* Les cibles réelles */}
          <div>
            <div className="text-[10px] font-bold text-slate-600 uppercase mb-1.5">
              Cibles trouvées maintenant dans vos données ({regle.cibles.length})
            </div>
            {regle.cibles.length === 0 ? (
              <p className="text-[11px] text-slate-400">Aucune cible — la règle veille, elle n&apos;a rien à faire aujourd&apos;hui.</p>
            ) : (
              <div className="space-y-2">
                {regle.cibles.slice(0, 6).map(c => (
                  <div key={c.id} className={`rounded-lg border p-2.5 ${c.bloque_par ? 'border-red-200 bg-red-50/60' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-wrap justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[11px] text-slate-900">{c.libelle}</div>
                        <div className="text-[10px] text-slate-500">{c.detail}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-black text-emerald-700">{formatFcfa(c.valeur_fcfa)} F</div>
                        <div className="text-[9px] text-slate-400">confiance {c.score}%</div>
                      </div>
                    </div>

                    {c.bloque_par ? (
                      <div className="flex gap-1.5 mt-2 text-[10px] text-red-800 bg-red-100 rounded-md p-1.5">
                        <Ban size={11} className="shrink-0 mt-0.5" />
                        <span><strong>Retenu par un garde-fou —</strong> {c.bloque_par}</span>
                      </div>
                    ) : (
                      <>
                        <div className="mt-2 bg-slate-50 rounded-md p-2">
                          <div className="text-[9px] text-slate-400 mb-0.5">Message prêt</div>
                          <p className="text-[10px] text-slate-700 whitespace-pre-line line-clamp-4">{c.message}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-slate-400">
                            <Clock size={10} /> {c.quand}
                          </div>
                          {demandeValidation && (() => {
                            const statut = cibleStatut(c.id)
                            if (statut === 'VALIDEE') {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                                  <Check size={10} /> Validée
                                  <button type="button" onClick={() => annulerCible(c.id)}
                                    className="ml-0.5 underline text-emerald-800 hover:text-emerald-950">Annuler</button>
                                </span>
                              )
                            }
                            if (statut === 'IGNOREE') {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                  Ignorée
                                  <button type="button" onClick={() => annulerCible(c.id)}
                                    className="ml-0.5 underline text-slate-600 hover:text-slate-900">Annuler</button>
                                </span>
                              )
                            }
                            return (
                              <div className="flex items-center gap-1.5">
                                <button type="button"
                                  onClick={() => traiterCible(c.id, 'VALIDEE', {
                                    label: `${regle.nom} — ${c.libelle}`,
                                    message: `Action validée : ${c.libelle}.`,
                                  })}
                                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                                  <Check size={10} /> Valider
                                </button>
                                <button type="button"
                                  onClick={() => traiterCible(c.id, 'IGNOREE', {
                                    label: `${regle.nom} — ${c.libelle} ignorée`,
                                    message: `Cible ignorée : ${c.libelle}.`,
                                  })}
                                  className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100">
                                  <X size={10} /> Ignorer
                                </button>
                              </div>
                            )
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {regle.cibles.length > 6 && (
                  <p className="text-[10px] text-slate-400">… et {regle.cibles.length - 6} autre(s).</p>
                )}
              </div>
            )}
            {bloquees.length > 0 && (
              <p className="text-[10px] text-red-700 mt-2">
                {bloquees.length} cible(s) retenue(s) — elles restent visibles : une automatisation qui bloque en
                silence est une automatisation qu&apos;on finit par ne plus croire.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function AutomationsView() {
  const { user } = useAuth()
  const {
    regleActive, basculerRegle, cibleStatut, traiterCible, annulerCible,
    lastAction, clearLastAction,
  } = useAutomationWorkflow()
  const regles = useMemo(() => reglesDuPoste(user?.role), [user?.role])

  const [ouvert, setOuvert] = useState<string | null>(regles[0]?.id ?? null)

  const reglesAvecEtat = useMemo(
    () => regles.map(r => ({ ...r, actif: regleActive(r.id) })),
    [regles, regleActive],
  )
  const synthese = useMemo(() => buildSyntheseAutomation(reglesAvecEtat), [reglesAvecEtat])

  return (
    <div className="p-6 max-w-[80rem] space-y-5">
      <PageHeader
        title="Automatisations"
        subtitle="Ce que la machine fait à votre place — et ce qu'elle refuse de faire sans vous"
        badge={`${synthese.regles_actives}/${synthese.regles_total} règles actives`}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Tuile label="Actions automatiques" value={String(synthese.actions_auto)} sub="partent seules" accent="text-emerald-700" />
        <Tuile label="En attente de vous" value={String(synthese.actions_a_valider)} sub="un clic suffit" accent="text-amber-700" />
        <Tuile label="Retenues" value={String(synthese.actions_bloquees)} sub="garde-fous" accent="text-red-600" />
        <Tuile label="Valeur en jeu" value={`${formatFcfa(synthese.impact_fcfa)} F`} sub="sur les actions prêtes" accent="text-emerald-700" />
        <Tuile label="Temps gagné" value={`${synthese.gain_temps_h_mois} h`} sub="par mois" accent="text-sky-700" />
        <Tuile label="Équivalent" value={`${(synthese.gain_temps_h_mois / 150).toFixed(1)} ETP`} sub="poste temps plein" accent="text-slate-800" />
      </div>

      <div className="flex gap-2 bg-slate-900 text-white rounded-xl p-4">
        <Bot size={16} className="shrink-0 mt-0.5 text-emerald-400" />
        <div className="text-xs">
          <p className="font-bold mb-1">Trois niveaux de confiance, jamais un seul.</p>
          <p className="text-slate-300 leading-relaxed">
            <span className="text-emerald-400 font-semibold">Automatique</span> pour ce qui est réversible et
            sans risque relationnel (un rappel d&apos;échéance).{' '}
            <span className="text-amber-400 font-semibold">À valider</span> dès qu&apos;il y a de l&apos;argent, une
            remise ou la réputation de l&apos;entreprise en jeu.{' '}
            <span className="text-sky-400 font-semibold">Suggestion</span> pour ce qui demande un jugement humain
            (couper un plafond de crédit). Une IA qui décide de tout est une IA qu&apos;on débranche au premier
            incident.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {reglesAvecEtat.map(r => (
          <CarteRegle
            key={r.id}
            regle={r}
            actif={r.actif}
            ouvert={ouvert === r.id}
            onToggleOuvert={() => setOuvert(prev => (prev === r.id ? null : r.id))}
            onToggleActif={() => basculerRegle(r.id, r.nom)}
            cibleStatut={cibleStatut}
            traiterCible={traiterCible}
            annulerCible={annulerCible}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <Zap size={12} />
        Les cibles affichées sont calculées en direct sur vos registres — elles changent quand
        l&apos;entreprise change, pas quand la page se rafraîchit.
      </div>

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
