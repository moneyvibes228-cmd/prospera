'use client'
import { useMemo, useState } from 'react'
import { ShieldCheck, ArrowUpRight, Sparkles, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useValidationsWorkflow } from '@distributeur/contexts/ValidationsWorkflowContext'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import {
  getValidationsDuPerimetre,
  repartirParDelegation,
  DELEGATION,
  TYPE_VALIDATION_LABEL,
  type NiveauValidation,
  type ValidationTriee,
} from '@distributeur/lib/registries/validations-registry'
import type { ValidationDecisionEntry } from '@distributeur/lib/validations-workflow'

interface Props {
  /** Niveau de délégation du persona connecté. */
  niveau: Exclude<NiveauValidation, 'DC'>
  /** Zones de son périmètre — vide pour le réseau entier. */
  zones: string[]
  compact?: boolean
}

const NIVEAU_SUIVANT: Record<Exclude<NiveauValidation, 'DC'>, string> = {
  SUPERVISEUR: 'Responsable des Ventes',
  RESP_VENTES: 'Directeur Commercial',
}

/**
 * Un superviseur tranche ce que sa délégation lui permet et fait remonter le
 * reste ; un responsable des ventes reçoit ces remontées. Le même composant,
 * deux positions dans la chaîne — c'est ce qui relie les deux postes.
 */
export function ValidationsPanel({ niveau, zones, compact = false }: Props) {
  const { user } = useAuth()
  const { decisions, getDecision, decider, annuler, lastAction, clearLastAction } = useValidationsWorkflow()
  const demandes = getValidationsDuPerimetre(zones)
  const { aTrancher, aEscalader } = repartirParDelegation(demandes, niveau)

  // Une demande déjà tranchée sort de la file « à arbitrer » et rejoint l'historique.
  const enAttente = useMemo(
    () => aTrancher.filter(d => !getDecision(d.id)),
    [aTrancher, getDecision],
  )
  const traitees = useMemo(
    () => aTrancher
      .map(d => ({ demande: d, decision: getDecision(d.id) }))
      .filter((x): x is { demande: ValidationTriee; decision: ValidationDecisionEntry } => !!x.decision),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aTrancher, decisions],
  )

  const grille = DELEGATION[niveau]
  const limite = `remise ≤ ${grille.remise_pct_max} % · crédit ≤ ${formatFcfa(grille.credit_max)} F · avoir ≤ ${formatFcfa(grille.avoir_max)} F`

  function onDecider(d: ValidationTriee, decision: 'VALIDEE' | 'REFUSEE') {
    let motif: string | undefined
    if (decision === 'REFUSEE' && typeof window !== 'undefined') {
      motif = window.prompt('Motif du refus (facultatif) :') ?? undefined
    }
    decider(d.id, decision, user?.nom ?? niveau, niveau, motif)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-amber-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={15} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            {niveau === 'SUPERVISEUR' ? 'À arbitrer maintenant' : 'Escalades reçues du terrain'}
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {enAttente.length}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mb-3">Votre délégation : {limite}</p>

        {enAttente.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Rien à arbitrer dans votre délégation.</p>
        ) : (
          <div className="space-y-2">
            {enAttente.slice(0, compact ? 3 : 10).map(d => (
              <CarteDemande
                key={d.id}
                demande={d}
                actionnable
                onValider={() => onDecider(d, 'VALIDEE')}
                onRefuser={() => onDecider(d, 'REFUSEE')}
              />
            ))}
          </div>
        )}

        {traitees.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Traitées aujourd&apos;hui ({traitees.length})
            </p>
            <div className="space-y-1.5">
              {traitees.slice(0, compact ? 2 : 8).map(({ demande, decision }) => (
                <div key={demande.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {decision.decision === 'VALIDEE'
                      ? <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      : <XCircle size={13} className="text-red-500 shrink-0" />}
                    <span className="text-[11px] font-medium text-slate-700 truncate">{demande.pdv_nom}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${decision.decision === 'VALIDEE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {decision.decision === 'VALIDEE' ? 'Validée' : 'Refusée'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => annuler(demande.id)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 shrink-0"
                  >
                    <RotateCcw size={11} /> Annuler
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <ArrowUpRight size={15} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">
            Hors délégation — remonte au {NIVEAU_SUIVANT[niveau]}
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {aEscalader.length}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mb-3">
          Vous ne pouvez pas trancher ces dossiers, mais vous restez responsable de leur suivi.
        </p>

        {aEscalader.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Aucune escalade en cours.</p>
        ) : (
          <div className="space-y-2">
            {aEscalader.slice(0, compact ? 2 : 10).map(d => (
              <CarteDemande key={d.id} demande={d} actionnable={false} />
            ))}
          </div>
        )}
      </div>

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}

function CarteDemande({
  demande, actionnable, onValider, onRefuser,
}: {
  demande: ValidationTriee
  actionnable: boolean
  onValider?: () => void
  onRefuser?: () => void
}) {
  return (
    <div className={cn(
      'rounded-lg border p-3',
      !actionnable ? 'border-slate-200 bg-slate-50/60'
        : demande.urgence === 'HAUTE' ? 'border-red-200 bg-red-50/50'
          : 'border-slate-200 bg-white',
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900">{demande.pdv_nom}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {TYPE_VALIDATION_LABEL[demande.type]} · {demande.commercial} · {demande.zone}
          </p>
          <p className="text-[11px] text-slate-600 mt-1">{demande.detail}</p>
        </div>
        <span className="text-xs font-black text-slate-800 shrink-0 tabular-nums">
          {formatFcfa(demande.montant)} F
        </span>
      </div>

      {demande.synthese_ia && (
        <div className="mt-2 flex items-start gap-1.5 rounded-md bg-indigo-50/70 border border-indigo-100 px-2 py-1.5">
          <Sparkles size={11} className="text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-indigo-900 leading-relaxed">{demande.synthese_ia}</p>
        </div>
      )}

      {actionnable ? (
        <div className="flex gap-2 mt-2.5">
          <button
            type="button"
            onClick={onValider}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle2 size={12} /> Valider
          </button>
          <button
            type="button"
            onClick={onRefuser}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XCircle size={12} /> Refuser
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-2.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <ArrowUpRight size={11} />
            En attente — niveau {demande.niveau === 'DC' ? 'Directeur Commercial' : 'Responsable des Ventes'}
          </span>
          <AiBadge variant="inline" label="analysé" />
        </div>
      )}
    </div>
  )
}
