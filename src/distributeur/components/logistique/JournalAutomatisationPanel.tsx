'use client'

import { useMemo, useState } from 'react'
import {
  Zap, HandMetal, ShieldAlert, Undo2, Clock, Banknote, Bot,
} from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { ROLE_LABELS } from '@distributeur/lib/auth'
import {
  buildJournalAutomatisation,
  type NatureDecision, type DomaineAutomatisation,
} from '@distributeur/lib/automation-journal'

const NATURE_STYLE: Record<NatureDecision, {
  label: string; className: string; border: string; icon: typeof Zap; aide: string
}> = {
  EXECUTE: {
    label: 'Exécuté',
    className: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    icon: Zap,
    aide: 'Fait, sans intervention. Tracé et réversible.',
  },
  PROPOSE: {
    label: 'À valider',
    className: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200',
    icon: HandMetal,
    aide: 'Prêt — il manque une signature humaine.',
  },
  ESCALADE: {
    label: 'Arbitrage requis',
    className: 'bg-red-100 text-red-700',
    border: 'border-red-200',
    icon: ShieldAlert,
    aide: 'Le garde-fou a sauté : la machine refuse de trancher seule.',
  },
}

const DOMAINE_LABEL: Record<DomaineAutomatisation, string> = {
  REAPPRO: 'Réappro',
  TRANSFERT: 'Transfert',
  PREPARATION: 'Préparation',
  EXPEDITION: 'Expédition',
  RECEPTION: 'Réception',
  INVENTAIRE: 'Inventaire',
  STOCK: 'Stock',
}

/**
 * Le journal — la contrepartie de l'automatisation.
 *
 * Un responsable ne délègue pas sa signature à une boîte noire. Ici, chaque décision prise
 * par la machine dit ce qui l'a déclenchée, ce qu'elle a rapporté, qui aurait dû la prendre,
 * et comment la défaire. C'est ce qui rend l'automatisation acceptable — et reprenable.
 */
export function JournalAutomatisationPanel({ entrepots }: { entrepots: string[] }) {
  const journal = useMemo(() => buildJournalAutomatisation(entrepots), [entrepots])
  const [filtre, setFiltre] = useState<NatureDecision | 'tous'>('tous')

  const entrees = filtre === 'tous'
    ? journal.entrees
    : journal.entrees.filter(e => e.nature === filtre)

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900 text-white p-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Bot size={15} className="text-amber-400" /> Ce que le système a décidé à votre place
        </h3>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Chaque décision automatique est tracée avec son déclencheur, son gain et son annulation.
          Vous voyez exactement quelle part de votre travail la machine a assumée — et vous pouvez
          la reprendre à tout moment.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3.5">
          {[
            {
              label: 'Décisions autonomes',
              value: `${journal.decisions_executees}`,
              sub: `${journal.taux_autonomie_pct} % du total`,
              color: 'text-emerald-400',
            },
            {
              label: 'En attente de vous',
              value: `${journal.decisions_proposees + journal.escalades}`,
              sub: `dont ${journal.escalades} arbitrage${journal.escalades > 1 ? 's' : ''}`,
              color: 'text-amber-400',
            },
            {
              label: 'Gain du jour',
              value: `${formatFcfa(journal.gain_fcfa_total)} F`,
              sub: 'regroupements, transferts, pertes évitées',
              color: 'text-emerald-400',
            },
            {
              label: 'Temps rendu à l\'équipe',
              value: `${journal.gain_heures} h`,
              sub: 'de saisie et d\'ordonnancement',
              color: 'text-sky-400',
            },
          ].map(k => (
            <div key={k.label} className="bg-white/5 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
              <div className={cn('text-lg font-black mt-0.5', k.color)}>{k.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltre('tous')}
          className={cn(
            'text-[10px] font-bold px-2.5 py-1 rounded-lg',
            filtre === 'tous' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
          )}
        >
          Tout ({journal.entrees.length})
        </button>
        {(Object.keys(NATURE_STYLE) as NatureDecision[]).map(n => {
          const count = journal.entrees.filter(e => e.nature === n).length
          if (count === 0) return null
          return (
            <button
              key={n}
              type="button"
              onClick={() => setFiltre(n)}
              className={cn(
                'text-[10px] font-bold px-2.5 py-1 rounded-lg',
                filtre === n ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {NATURE_STYLE[n].label} ({count})
            </button>
          )
        })}
      </div>

      <div className="space-y-2.5">
        {entrees.map(entree => {
          const style = NATURE_STYLE[entree.nature]
          const Icon = style.icon
          return (
            <div key={entree.id} className={cn('rounded-xl border bg-white p-4', style.border)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', style.className)}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                        {DOMAINE_LABEL[entree.domaine]}
                      </span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', style.className)}>
                        {style.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{entree.horodatage}</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 mt-1">{entree.titre}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {entree.gain_fcfa > 0 && (
                    <div className="text-sm font-black text-emerald-600 tabular-nums flex items-center gap-1 justify-end">
                      <Banknote size={12} /> {formatFcfa(entree.gain_fcfa)} F
                    </div>
                  )}
                  {entree.gain_minutes > 0 && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                      <Clock size={9} /> {entree.gain_minutes} min épargnées
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-[11px]">
                <p className="text-slate-500">
                  <span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Déclencheur</span>
                  {entree.declencheur}
                </p>
                <p className="text-slate-700">
                  <span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Action</span>
                  {entree.action}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
                <span className="text-slate-500">
                  Aurait été fait par{' '}
                  <span className="font-bold text-slate-700">{ROLE_LABELS[entree.delegue_par]}</span>
                </span>
                {entree.reversible !== '—' && (
                  <span className="text-slate-500 flex items-start gap-1">
                    <Undo2 size={10} className="shrink-0 mt-0.5" /> {entree.reversible}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {entrees.length === 0 && (
          <p className="text-xs text-slate-400 py-6 text-center">Aucune décision dans cette catégorie.</p>
        )}
      </div>
    </div>
  )
}
