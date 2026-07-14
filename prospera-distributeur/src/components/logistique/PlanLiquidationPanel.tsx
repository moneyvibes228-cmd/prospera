'use client'

import { useState } from 'react'
import {
  Tag, Package, Repeat, Undo2, Trash2, Check, AlertTriangle, Clock, TrendingUp,
} from 'lucide-react'
import { cn, formatFcfa } from '@/lib/utils'
import type { AlerteSanteStock } from '@/lib/transferts-engine'
import { buildPlanLiquidation, type TypeSortie } from '@/lib/liquidation-engine'
import { controlerAchat } from '@/lib/garde-fou-achat'
import { useStockWorkflow } from '@/contexts/StockWorkflowContext'

const SORTIE_STYLE: Record<TypeSortie, { icon: typeof Tag; className: string }> = {
  REMISE: { icon: Tag, className: 'bg-amber-100 text-amber-700' },
  COMBO: { icon: Package, className: 'bg-pink-100 text-pink-700' },
  TRANSFERT: { icon: Repeat, className: 'bg-indigo-100 text-indigo-700' },
  RETOUR_FOURNISSEUR: { icon: Undo2, className: 'bg-sky-100 text-sky-700' },
  REBUT: { icon: Trash2, className: 'bg-slate-200 text-slate-600' },
}

/**
 * Le plan de sortie d'un stock mort.
 *
 * L'écran est construit pour combattre un réflexe : « on va le solder ». Les cinq scénarios
 * sont donc montrés côte à côte, chiffrés dans la même unité — ce qu'ils **récupèrent** — avec
 * le coût de l'inaction affiché en permanence comme point de comparaison. Solder n'est
 * recommandé que quand les chiffres le disent.
 */
export function PlanLiquidationPanel({ alerte }: { alerte: AlerteSanteStock }) {
  const plan = buildPlanLiquidation(alerte)
  const [choisi, setChoisi] = useState<TypeSortie>(plan.recommande.type)
  const { isDone, getEntry, executer, annuler } = useStockWorkflow()
  const refId = `${alerte.produit_ref}:${alerte.entrepot}`
  const lance = isDone('LIQUIDATION', refId)
  const entry = getEntry('LIQUIDATION', refId)

  /*
   * La leçon. On rejoue la commande qui a créé ce stock mort à travers le garde-fou
   * d'aujourd'hui, et on montre ce qu'il en aurait fait. Sans ça, l'écran ne fait que
   * constater la perte — et la même palette sera rachetée l'année prochaine.
   */
  const retrospective = controlerAchat(alerte.produit_ref, alerte.stock)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 mt-3">
      {retrospective.alertes.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 mb-3">
          <div className="text-[10px] font-bold uppercase text-emerald-800 mb-1">
            Ce qui empêche désormais que ça se reproduise
          </div>
          <p className="text-[11px] text-emerald-900/90 leading-relaxed">
            {retrospective.alertes[0].explication}
          </p>
          <p className="text-[11px] font-semibold text-emerald-900 mt-1">
            Le garde-fou d&apos;achat {retrospective.verdict === 'REFUSE' ? 'refuse' : 'écrête'} désormais
            cette commande — {formatFcfa(retrospective.capital_evite)} F qui ne seront plus immobilisés.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <TrendingUp size={13} className="text-emerald-600" /> Plan de sortie — 5 scénarios comparés
        </h4>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          ne rien faire coûte {formatFcfa(plan.cout_inaction)} F
        </span>
      </div>

      <div className="space-y-1.5">
        {plan.scenarios.map(s => {
          const style = SORTIE_STYLE[s.type]
          const Icon = style.icon
          const estRecommande = s.type === plan.recommande.type
          const estChoisi = s.type === choisi

          return (
            <button
              key={s.type}
              type="button"
              disabled={!s.faisable}
              onClick={() => setChoisi(s.type)}
              className={cn(
                'w-full text-left rounded-lg border p-2.5 transition-all',
                !s.faisable && 'opacity-45 cursor-not-allowed',
                estChoisi && s.faisable
                  ? 'border-slate-800 bg-white shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-400',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', style.className)}>
                  <Icon size={12} />
                </div>

                <span className="font-bold text-xs text-slate-900 flex-1 min-w-0 truncate">
                  {s.libelle}
                </span>

                {estRecommande && s.faisable && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1 shrink-0">
                    <Check size={9} /> recommandé
                  </span>
                )}

                {s.faisable ? (
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-emerald-600 tabular-nums">
                      +{formatFcfa(s.gain_vs_inaction)} F
                    </div>
                    <div className="text-[9px] text-slate-400 tabular-nums flex items-center gap-1 justify-end">
                      <Clock size={8} /> {s.delai_jours} j · {s.unites_ecoulees.toLocaleString('fr-FR')} u.
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">impossible</span>
                )}
              </div>

              {estChoisi && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-600 leading-relaxed">{s.detail}</p>
                  {s.frein && (
                    <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-start gap-1">
                      <AlertTriangle size={10} className="shrink-0 mt-0.5" /> {s.frein}
                    </p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed mt-2.5 bg-white rounded-lg border border-slate-100 p-2.5">
        {plan.justification}
      </p>

      {lance ? (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
            <Check size={12} /> {entry?.label ?? 'Scénario lancé'}{entry?.by ? ` · ${entry.by}` : ''}
          </span>
          <button
            type="button"
            onClick={() => entry && annuler(entry.id)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700/70 hover:text-emerald-900"
          >
            <Undo2 size={11} /> Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            const scenario = plan.scenarios.find(s => s.type === choisi)
            executer('LIQUIDATION', refId, {
              label: `${scenario?.libelle ?? 'Sortie'} — ${alerte.produit_nom}`,
              detail: `${alerte.entrepot} · +${formatFcfa(scenario?.gain_vs_inaction ?? 0)} F vs inaction`,
              message: `Scénario « ${scenario?.libelle} » lancé pour ${alerte.produit_nom}.`,
              payload: { type: choisi, entrepot: alerte.entrepot },
            })
          }}
          className="mt-2.5 w-full text-[11px] font-bold px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors"
        >
          Lancer « {plan.scenarios.find(s => s.type === choisi)?.libelle} »
        </button>
      )}
    </div>
  )
}
