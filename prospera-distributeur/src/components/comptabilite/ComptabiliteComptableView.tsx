'use client'

import { useMemo } from 'react'
import {
  Link2, Wallet, Receipt, FileWarning, ListChecks, AlertTriangle,
  Landmark, Smartphone, Banknote, ArrowRightLeft, Check, HelpCircle, Send, BookOpen,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PerformancePostePanel } from '@/components/dashboard/PerformancePostePanel'
import { FacturesAchatPanel } from '@/components/comptabilite/FacturesAchatPanel'
import { WorkflowToast } from '@/components/shared/WorkflowToast'
import { useAuth } from '@/contexts/AuthContext'
import { useDecisionsWorkflow } from '@/contexts/DecisionsWorkflowContext'
import { formatFcfa, cn } from '@/lib/utils'
import {
  buildChargeDeTravail, buildSyntheseTva, buildRemisesCaisse, buildCloture,
  ENCAISSEMENTS_A_LETTRER, DECLARATION_TVA, PIECES_MANQUANTES,
} from '@/lib/comptable-poste-builder'
import {
  ECRITURES_JOURNAL, SUSPENS_COMPTABLES, RAPPROCHEMENTS,
} from '@/lib/registries/comptabilite-registry'
import { STATUT_ECRITURE_STYLE, STATUT_RAPPROCHEMENT_STYLE, getReferentielCompta } from '@/lib/comptabilite-dg-builder'

const MODE_ICON = {
  MOBILE_MONEY: Smartphone,
  ESPECES: Banknote,
  VIREMENT: ArrowRightLeft,
  CHEQUE: Receipt,
} as const

const MODE_LABEL = {
  MOBILE_MONEY: 'Mobile Money',
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
} as const

const CATEGORIE_LABEL = {
  SAISIE: 'Saisie',
  RAPPROCHEMENT: 'Rapprochement',
  CUT_OFF: 'Cut-off',
  PROVISIONS: 'Provisions',
  DECLARATIF: 'Déclaratif',
} as const

/** Ce que le comptable fait d'une ligne d'encaissement — local à la session de démo. */
type ActionLettrage = 'LETTRE' | 'A_ENQUETER'

export function ComptabiliteComptableView() {
  const { user } = useAuth()
  const { getChoix, decider, lastAction, clearLastAction } = useDecisionsWorkflow()
  const ref = getReferentielCompta()

  const charge = useMemo(() => buildChargeDeTravail(), [])
  const tva = useMemo(() => buildSyntheseTva(), [])
  const caisses = useMemo(() => buildRemisesCaisse(), [])
  const cloture = useMemo(() => buildCloture(), [])

  const lettrageOf = (id: string) => getChoix('LETTRAGE', id) as ActionLettrage | undefined
  const tacheFaite = (t: { id: string; fait: boolean }) =>
    (getChoix('CLOTURE_TACHE', t.id) ?? (t.fait ? 'FAIT' : 'A_FAIRE')) === 'FAIT'

  const restants = ENCAISSEMENTS_A_LETTRER.filter(e => !lettrageOf(e.id))
  const faitesLocal = cloture.taches.filter(tacheFaite).length
  const pctCloture = Math.round(faitesLocal / cloture.total * 100)

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Poste comptable"
        subtitle={`${user?.zone ?? 'Comptabilité — Siège'} · ${ref.norme} · ${ref.periode} — saisie, lettrage, rapprochement, clôture`}
        badge={`Clôture dans ${charge.jours_avant_cloture} j`}
      />

      <PerformancePostePanel role="COMPTABLE" />

      {/* Sa charge de travail — pas des KPI de direction */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'À lettrer', value: String(restants.length), color: 'text-amber-700', sub: `${formatFcfa(charge.montant_non_lettre)} non affectés` },
          { label: 'Lettrages manuels', value: String(charge.lettrages_manuels), color: 'text-red-600', sub: 'confiance auto < 70 %' },
          { label: 'Écritures à traiter', value: String(charge.ecritures_a_valider), color: 'text-violet-700', sub: 'brouillon + attente' },
          { label: 'Suspens ouverts', value: String(charge.suspens_ouverts), color: 'text-red-600', sub: `${charge.rapprochements_en_ecart} rapprochement en écart` },
          { label: 'Pièces manquantes', value: String(charge.pieces_manquantes), color: 'text-orange-600', sub: `${formatFcfa(charge.montant_pieces_manquantes)} non justifiés` },
          { label: 'Avancement clôture', value: `${pctCloture} %`, color: pctCloture >= 80 ? 'text-emerald-600' : 'text-slate-800', sub: `${faitesLocal}/${cloture.total} tâches` },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-base font-black mt-0.5 ${k.color}`}>{k.value}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* TVA — l'échéance qui ne se négocie pas */}
      <div className={cn(
        'rounded-xl border-2 p-4',
        tva.urgent ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
      )}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Landmark size={15} className="text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Déclaration TVA — {DECLARATION_TVA.periode}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {DECLARATION_TVA.jours_restants} j — limite {DECLARATION_TVA.date_limite}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
              <span className="bg-white rounded-lg border border-slate-200 px-3 py-1.5">
                <span className="text-slate-400">TVA collectée (443)</span>{' '}
                <strong className="tabular-nums">{formatFcfa(DECLARATION_TVA.tva_collectee)}</strong>
              </span>
              <span className="font-black text-slate-400">−</span>
              <span className="bg-white rounded-lg border border-slate-200 px-3 py-1.5">
                <span className="text-slate-400">TVA déductible (445)</span>{' '}
                <strong className="tabular-nums">{formatFcfa(DECLARATION_TVA.tva_deductible)}</strong>
              </span>
              <span className="font-black text-slate-400">=</span>
              <span className="bg-red-600 text-white rounded-lg px-3 py-1.5 font-black tabular-nums">
                {formatFcfa(tva.a_payer)} à payer
              </span>
            </div>
          </div>
          <button type="button" disabled={DECLARATION_TVA.bloquants.length > 0}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            Télédéclarer sur le portail OTR
          </button>
        </div>

        {DECLARATION_TVA.bloquants.length > 0 && (
          <div className="mt-3 bg-white/80 rounded-lg border border-red-100 p-3">
            <div className="text-[11px] font-bold text-red-800 mb-1.5">
              Ce qui empêche de déclarer aujourd&apos;hui
            </div>
            <div className="space-y-1">
              {DECLARATION_TVA.bloquants.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={11} className="text-red-500 shrink-0" /> {b.libelle}
                  </span>
                  <span className="font-bold tabular-nums text-red-700 shrink-0">{formatFcfa(b.impact)}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-red-800 mt-2 leading-relaxed">
              Déclarer sans ces pièces, c&apos;est payer <strong>{formatFcfa(tva.surcout_si_non_saisi)}</strong> de TVA
              qu&apos;on aurait pu déduire. Récupérable en régularisation, mais la trésorerie sort quand même le 15.
            </p>
          </div>
        )}
      </div>

      {/* ───────── LETTRAGE 411 — le cœur du poste ───────── */}
      <div className="bg-white rounded-xl border-2 border-amber-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Link2 size={15} className="text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800">Lettrage du compte client 411</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {restants.length}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            L&apos;argent est rentré — reste à savoir de quelle facture il vient
          </span>
        </div>

        {restants.length === 0 ? (
          <p className="text-xs text-slate-400 p-6 text-center">
            Tout est lettré. Le compte 411 est propre.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {ENCAISSEMENTS_A_LETTRER.map(e => {
              const action = lettrageOf(e.id)
              const Icon = MODE_ICON[e.mode]
              const auto = e.confiance >= 70
              return (
                <div key={e.id} className={cn('p-4', action && 'bg-slate-50/70 opacity-60')}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                        e.mode === 'ESPECES' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600',
                      )}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm tabular-nums text-slate-900">{formatFcfa(e.montant)}</span>
                          <span className="text-[10px] text-slate-400">{MODE_LABEL[e.mode]} · {e.date}</span>
                          {e.anciennete_j >= 5 && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700">
                              {e.anciennete_j} j non affecté
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">{e.reference_brute}</div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {e.facture_proposee ? (
                            <span className={cn(
                              'text-[11px] px-2 py-1 rounded-lg font-semibold',
                              auto ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800',
                            )}>
                              Proposé : {e.facture_proposee} — {e.client_propose}
                            </span>
                          ) : (
                            <span className="text-[11px] px-2 py-1 rounded-lg font-semibold bg-red-50 text-red-800">
                              Aucune facture identifiée
                            </span>
                          )}
                          <span className={cn(
                            'text-[10px] font-bold tabular-nums',
                            auto ? 'text-emerald-600' : 'text-red-600',
                          )}>
                            confiance {e.confiance} %
                          </span>
                        </div>

                        {e.difficulte && (
                          <p className="text-[11px] text-slate-600 mt-1.5 leading-snug flex items-start gap-1.5">
                            <HelpCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                            {e.difficulte}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button type="button"
                        onClick={() => decider('LETTRAGE', e.id, 'LETTRE', {
                          label: `Lettré — ${formatFcfa(e.montant)}`,
                          detail: e.facture_proposee ? `${e.facture_proposee} · ${e.client_propose}` : undefined,
                          message: 'Encaissement lettré sur le 411.',
                        })}
                        disabled={!e.facture_proposee}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-colors',
                          action === 'LETTRE'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed',
                        )}>
                        <Check size={11} /> Lettrer
                      </button>
                      <button type="button"
                        onClick={() => decider('LETTRAGE', e.id, 'A_ENQUETER', {
                          label: `Mis en suspens — ${formatFcfa(e.montant)}`,
                          detail: e.reference_brute,
                          message: 'Encaissement mis en suspens.',
                        })}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-colors',
                          action === 'A_ENQUETER'
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                        )}>
                        <FileWarning size={11} /> Mettre en suspens
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Remises de caisse terrain */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Remises de caisse — tournées terrain</h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Ce que le système dit qu&apos;ils ont encaissé, contre ce qui est effectivement arrivé en caisse.
          </p>

          <div className="space-y-1.5">
            {caisses.lignes.map(r => (
              <div key={r.id} className={cn(
                'rounded-lg border p-2.5',
                r.statut === 'NON_REMIS' ? 'border-red-200 bg-red-50/60'
                  : r.statut === 'ECART' ? 'border-amber-200 bg-amber-50/60'
                  : 'border-slate-100',
              )}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800">{r.commercial}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{r.zone} · tournée {r.date_tournee}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {formatFcfa(r.remis)} / {formatFcfa(r.encaisse_theorique)}
                    </span>
                    {r.ecart !== 0 && (
                      <div className="font-black text-red-600 tabular-nums text-xs">{formatFcfa(r.ecart)}</div>
                    )}
                  </div>
                </div>
                {r.statut === 'NON_REMIS' && (
                  <div className="text-[10px] text-red-700 font-semibold mt-1.5">
                    Rien remis depuis {r.jours_sans_remise} jours — {formatFcfa(-r.ecart)} d&apos;espèces
                    dans la nature. À escalader au superviseur aujourd&apos;hui.
                  </div>
                )}
                {r.statut === 'ECART' && (
                  <div className="text-[10px] text-amber-800 mt-1.5">
                    Écart de {formatFcfa(-r.ecart)} — c&apos;est lui qui bloque le rapprochement de la caisse Lomé.
                  </div>
                )}
              </div>
            ))}
          </div>

          {caisses.ecart_total !== 0 && (
            <div className="mt-3 text-[11px] text-red-800 bg-red-50 border border-red-100 rounded-lg p-2.5">
              <strong>{formatFcfa(-caisses.ecart_total)}</strong> d&apos;écart de caisse cumulé. Tant que ce n&apos;est pas
              justifié, ni le compte 531 ni la clôture ne peuvent être bouclés.
            </div>
          )}
        </div>

        {/* Pièces manquantes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileWarning size={14} className="text-orange-600" />
            <h3 className="text-sm font-bold text-slate-800">Pièces à réclamer</h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Sans le justificatif, l&apos;écriture ne passe pas — et ce n&apos;est jamais vous qui le détenez.
          </p>

          <div className="space-y-1.5">
            {PIECES_MANQUANTES.map(p => (
              <div key={p.id} className={cn(
                'rounded-lg border p-2.5',
                p.relances >= 3 ? 'border-red-200 bg-red-50/60' : 'border-slate-100',
              )}>
                <div className="flex items-start justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] text-slate-400">{p.piece}</span>
                    <div className="font-semibold text-slate-800 leading-snug">{p.libelle}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {p.detenteur} · {p.role_detenteur} — {p.relances} relance{p.relances > 1 ? 's' : ''} · {p.anciennete_j} j
                    </div>
                    <div className="text-[10px] text-orange-700 mt-0.5">Bloque : {p.bloque}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-black tabular-nums text-slate-800">{formatFcfa(p.montant)}</span>
                    <button type="button"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-slate-500 text-[10px] font-bold hover:bg-slate-50">
                      <Send size={10} /> Relancer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clôture */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ListChecks size={14} className="text-violet-600" />
            <h3 className="text-sm font-bold text-slate-800">Clôture {getReferentielCompta().periode}</h3>
          </div>
          <div className="flex items-center gap-2 min-w-[180px]">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500" style={{ width: `${pctCloture}%` }} />
            </div>
            <span className="text-xs font-black text-slate-700 tabular-nums">{pctCloture} %</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-1.5">
          {cloture.taches.map(t => {
            const fait = tacheFaite(t)
            return (
              <button key={t.id} type="button"
                onClick={() => decider('CLOTURE_TACHE', t.id, fait ? 'A_FAIRE' : 'FAIT', {
                  label: `${fait ? 'Tâche rouverte' : 'Tâche cochée'} — ${t.libelle}`,
                  message: fait ? 'Tâche de clôture rouverte.' : 'Tâche de clôture cochée.',
                })}
                className={cn(
                  'flex items-start gap-2.5 text-left rounded-lg border p-2.5 transition-colors',
                  fait ? 'border-emerald-100 bg-emerald-50/60' : t.bloque_par ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 hover:bg-slate-50',
                )}>
                <span className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5',
                  fait ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300',
                )}>
                  {fait && <Check size={11} />}
                </span>
                <span className="min-w-0">
                  <span className={cn('text-xs font-medium block', fait ? 'text-slate-400 line-through' : 'text-slate-800')}>
                    {t.libelle}
                  </span>
                  <span className="text-[9px] text-slate-400">{CATEGORIE_LABEL[t.categorie]}</span>
                  {!fait && t.bloque_par && (
                    <span className="block text-[10px] text-amber-800 mt-0.5">Bloqué : {t.bloque_par}</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        {cloture.bloquees.length > 0 && (
          <p className="text-[11px] text-slate-600 mt-3 bg-amber-50 border border-amber-100 rounded-lg p-2.5 leading-relaxed">
            <strong>{cloture.bloquees.length} tâches sur {cloture.total} sont à l&apos;arrêt et ne dépendent pas de vous</strong> —
            factures fournisseurs non transmises, écart de caisse non justifié, inventaire Kara non fait, provision en attente du DG.
            C&apos;est ce qui explique le délai de clôture, pas la vitesse de saisie.
          </p>
        )}
      </div>

      {/* Saisie des achats — le pendant de la facturation client */}
      <FacturesAchatPanel />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Journal */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Journal comptable</h3>
            </div>
            <span className="text-[10px] text-slate-400">VT ventes · BQ banque · AC achats · OD divers · CA caisse</span>
          </div>
          <div className="divide-y divide-slate-50">
            {ECRITURES_JOURNAL.map(e => (
              <div key={e.id} className="px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] text-slate-400 w-20">{e.date}</span>
                  <span className="text-[10px] font-bold text-violet-600 w-8">{e.journal}</span>
                  <span className="font-mono text-[10px] w-24">{e.piece}</span>
                  <span className="font-medium flex-1 min-w-[160px] text-slate-800">{e.libelle}</span>
                  <span className="font-bold w-24 text-right tabular-nums">{formatFcfa(e.montant)}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUT_ECRITURE_STYLE[e.statut]}`}>
                    {e.statut.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rapprochements + suspens */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Landmark size={14} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Rapprochements</h3>
            </div>
            <div className="space-y-1.5">
              {RAPPROCHEMENTS.map(r => (
                <div key={r.id} className="text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{r.banque}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUT_RAPPROCHEMENT_STYLE[r.statut]}`}>
                      {r.statut}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{r.operations_non_pointees} op. non pointées</span>
                    <span className={r.ecart === 0 ? 'text-emerald-600' : 'text-red-600 font-bold'}>
                      écart {formatFcfa(r.ecart)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-red-600" />
              <h3 className="text-sm font-bold text-slate-800">Suspens</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {SUSPENS_COMPTABLES.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {SUSPENS_COMPTABLES.map(s => (
                <div key={s.id} className={cn(
                  'rounded-lg border p-2.5 text-xs',
                  s.statut === 'CRITIQUE' ? 'border-red-200 bg-red-50/60' : 'border-slate-100',
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-slate-800 leading-snug">{s.libelle}</span>
                    <span className="font-black tabular-nums shrink-0">{formatFcfa(s.montant)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{s.anciennete_j} j · {s.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
