'use client'

import { useMemo } from 'react'
import {
  Repeat, ArrowRight, TrendingUp, Zap, AlertTriangle, Truck, Clock, Sparkles, Check, Undo2,
} from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { buildPlanTransferts, type UrgenceTransfert } from '@distributeur/lib/transferts-engine'
import { useStockWorkflow } from '@distributeur/contexts/StockWorkflowContext'

const URGENCE_STYLE: Record<UrgenceTransfert, { label: string; className: string; border: string }> = {
  CRITIQUE: { label: 'Critique', className: 'bg-red-100 text-red-700', border: 'border-red-200' },
  HAUTE: { label: 'Haute', className: 'bg-amber-100 text-amber-800', border: 'border-amber-200' },
  OPPORTUNITE: { label: 'Opportunité', className: 'bg-sky-100 text-sky-700', border: 'border-slate-200' },
}

/**
 * Le panneau qui fait économiser le plus d'argent, et qui n'existait nulle part :
 * avant de commander à un fournisseur, regarder ce que le réseau possède déjà.
 */
export function TransfertsPanel() {
  const plan = useMemo(() => buildPlanTransferts(), [])
  const { isDone, getEntry, executer, annuler } = useStockWorkflow()

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4">
        <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
          <Repeat size={15} /> Rééquilibrage inter-entrepôts
        </h3>
        <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
          Quand Kara tombe en rupture pendant que Lomé Port dort sur le même produit, commander au
          fournisseur est la mauvaise réponse : elle coûte plus cher et arrive plus tard. Le moteur
          apparie les excédents aux manques <span className="font-bold">avant</span> tout réappro, et
          ne prélève jamais au point de créer une rupture chez l&apos;expéditeur.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3.5">
          {[
            { label: 'Transferts suggérés', value: String(plan.suggestions.length) },
            { label: 'Ruptures évitées', value: String(plan.ruptures_evitees) },
            { label: 'Coût des navettes', value: `${formatFcfa(plan.cout_total)} F` },
            { label: 'Économie nette', value: `${formatFcfa(plan.economie_totale)} F`, fort: true },
          ].map(k => (
            <div key={k.label} className="bg-white/70 rounded-lg p-2.5">
              <div className="text-[10px] text-indigo-700/70 font-medium">{k.label}</div>
              <div className={cn('text-base font-black mt-0.5', k.fort ? 'text-emerald-600' : 'text-indigo-900')}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {plan.auto_executables > 0 && (
          <p className="text-[11px] font-semibold text-indigo-800 mt-3 flex items-center gap-1.5">
            <Zap size={12} />
            {plan.auto_executables} navette{plan.auto_executables > 1 ? 's' : ''} programmée{plan.auto_executables > 1 ? 's' : ''} automatiquement —
            la marchandise nous appartient déjà, aucune trésorerie n&apos;est engagée.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {plan.suggestions.map(t => {
          const urgence = URGENCE_STYLE[t.urgence]
          return (
            <div key={t.id} className={cn('rounded-xl border bg-white p-4', urgence.border)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{t.produit_nom}</span>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', urgence.className)}>
                      {urgence.label}
                    </span>
                    {t.auto && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                        <Zap size={9} /> auto
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="font-semibold text-slate-700">{t.entrepot_source}</span>
                    <ArrowRight size={13} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">{t.entrepot_destination}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-black text-slate-900 tabular-nums">{t.quantite.toLocaleString('fr-FR')} u.</span>
                    <span className="text-slate-400">
                      ({t.palettes} palette{t.palettes > 1 ? 's' : ''} · {t.poids_kg.toLocaleString('fr-FR')} kg)
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-emerald-600 tabular-nums">
                    +{formatFcfa(t.economie_nette)} F
                  </div>
                  <div className="text-[10px] text-slate-400">économie nette</div>
                </div>
              </div>

              {/* L'arbitrage, en clair : transférer, commander, ou ne rien faire */}
              <div className="grid md:grid-cols-3 gap-2.5 mt-3.5">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5">
                  <div className="text-[9px] font-bold uppercase text-emerald-700 flex items-center gap-1">
                    <Truck size={10} /> Transférer
                  </div>
                  <div className="text-sm font-black text-emerald-800 mt-1 tabular-nums">
                    {t.cout_transfert.toLocaleString('fr-FR')} F
                  </div>
                  <div className="text-[10px] text-emerald-700/80 flex items-center gap-1 mt-0.5">
                    <Clock size={9} /> livré en {t.delai_transfert_j} j
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <div className="text-[9px] font-bold uppercase text-slate-500">Commander au fournisseur</div>
                  <div className="text-sm font-black text-slate-700 mt-1 tabular-nums">
                    {formatFcfa(t.cout_reappro_fournisseur)} F
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock size={9} /> livré en {t.delai_reappro_j} j
                  </div>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50/60 p-2.5">
                  <div className="text-[9px] font-bold uppercase text-red-700 flex items-center gap-1">
                    <AlertTriangle size={10} /> Ne rien faire
                  </div>
                  <div className="text-sm font-black text-red-700 mt-1 tabular-nums">
                    −{formatFcfa(t.cout_rupture_evite)} F
                  </div>
                  <div className="text-[10px] text-red-700/80 mt-0.5">de marge perdue en rupture</div>
                </div>
              </div>

              {/* Effet du transfert des deux côtés — on ne déshabille pas Pierre */}
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <div className="text-[11px]">
                  <div className="text-slate-400 font-medium mb-1">{t.entrepot_source} — après prélèvement</div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-slate-500">{t.stock_source_avant.toLocaleString('fr-FR')}</span>
                    <ArrowRight size={10} className="text-slate-300" />
                    <span className="tabular-nums font-bold text-slate-800">{t.stock_source_apres.toLocaleString('fr-FR')}</span>
                    <span className="text-slate-400">
                      · reste {Math.round(t.couverture_source_apres_j)} j de couverture
                    </span>
                  </div>
                </div>
                <div className="text-[11px]">
                  <div className="text-slate-400 font-medium mb-1">{t.entrepot_destination} — après réception</div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-red-600 font-bold">{t.couverture_dest_avant_j} j</span>
                    <ArrowRight size={10} className="text-slate-300" />
                    <span className="tabular-nums font-bold text-emerald-600">{t.couverture_dest_apres_j} j</span>
                    <span className="text-slate-400">de couverture</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 mt-3 flex items-start gap-1.5 bg-slate-50 rounded-lg p-2.5">
                <Sparkles size={12} className="text-indigo-500 shrink-0 mt-0.5" /> {t.justification}
              </p>

              {!t.auto && (() => {
                const lancee = isDone('TRANSFERT', t.id)
                const entry = getEntry('TRANSFERT', t.id)
                return lancee ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                      <Check size={12} /> Navette lancée{entry?.by ? ` par ${entry.by}` : ''} — bon de transfert émis
                    </span>
                    <button
                      type="button"
                      onClick={() => entry && annuler(entry.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600"
                    >
                      <Undo2 size={11} /> Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => executer('TRANSFERT', t.id, {
                      label: `Navette ${t.produit_nom} · ${t.entrepot_source} → ${t.entrepot_destination}`,
                      detail: `${t.quantite.toLocaleString('fr-FR')} u. · économie nette ${formatFcfa(t.economie_nette)} F`,
                      message: `Navette lancée : ${t.entrepot_source} → ${t.entrepot_destination} (${t.produit_nom}).`,
                      payload: { quantite: t.quantite, source: t.entrepot_source, destination: t.entrepot_destination },
                    })}
                    className={cn(
                      'mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white transition-colors inline-flex items-center gap-1.5',
                      t.urgence === 'CRITIQUE' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-slate-900',
                    )}
                  >
                    <Truck size={12} /> Lancer la navette
                  </button>
                )
              })()}
            </div>
          )
        })}

        {plan.suggestions.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <TrendingUp size={20} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Le réseau est équilibré</p>
            <p className="text-xs text-slate-400 mt-1">
              Aucun excédent d&apos;un entrepôt ne correspond à un manque de l&apos;autre.
              Les manques restants passeront par le réappro fournisseur.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
