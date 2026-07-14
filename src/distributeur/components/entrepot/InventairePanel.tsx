'use client'

import { useMemo, useState } from 'react'
import {
  ClipboardCheck, AlertTriangle, ShieldAlert, Layers, Search, Check, Undo2,
} from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import {
  buildClassificationABC, buildTachesComptage, buildSyntheseInventaire, analyserEcart,
  type ClasseABC, type EcartInventaire,
} from '@distributeur/lib/inventaire-engine'
import { useStockWorkflow } from '@distributeur/contexts/StockWorkflowContext'

const CLASSE_STYLE: Record<ClasseABC, string> = {
  A: 'bg-red-100 text-red-700',
  B: 'bg-amber-100 text-amber-800',
  C: 'bg-slate-100 text-slate-500',
}

/** Le magasinier ne voit pas la valeur du stock — il voit ce qu'il doit compter. */
export function InventairePanel({ entrepot, voitValeur }: { entrepot: string; voitValeur: boolean }) {
  const abc = useMemo(() => buildClassificationABC([entrepot]), [entrepot])
  const taches = useMemo(() => buildTachesComptage([entrepot], abc), [entrepot, abc])
  const synthese = useMemo(() => buildSyntheseInventaire(entrepot, abc, taches), [entrepot, abc, taches])

  const { isDone, getEntry, executer, annuler } = useStockWorkflow()
  const [saisie, setSaisie] = useState<Record<string, string>>({})
  const [ecart, setEcart] = useState<EcartInventaire | null>(null)

  function valider(ref: string, nom: string) {
    const valeur = Number(saisie[ref])
    if (!Number.isFinite(valeur) || saisie[ref] === '') return
    const resultat = analyserEcart(ref, valeur, abc)
    setEcart(resultat)
    executer('INVENTAIRE', ref, {
      label: `Comptage ${nom}`,
      detail: resultat
        ? `Théorique ${resultat.stock_theorique} · compté ${resultat.stock_compte} · écart ${resultat.ecart > 0 ? '+' : ''}${resultat.ecart} (${resultat.ecart_pct} %)`
        : `Compté ${valeur}`,
      message: `Comptage enregistré : ${nom}${resultat && resultat.ecart !== 0 ? ` (écart ${resultat.ecart > 0 ? '+' : ''}${resultat.ecart})` : ''}.`,
      payload: { compte: valeur, ecart: resultat?.ecart ?? 0 },
    })
  }

  return (
    <div className="space-y-5">
      {/* Fiabilité du stock */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Fiabilité du stock',
            value: `${synthese.fiabilite_stock_pct} %`,
            color: synthese.fiabilite_stock_pct >= 95 ? 'text-emerald-600' : 'text-amber-600',
          },
          { label: 'À compter aujourd\'hui', value: String(synthese.taches_du_jour), color: 'text-slate-800' },
          {
            label: 'Comptages en retard',
            value: String(synthese.taches_en_retard),
            color: synthese.taches_en_retard > 0 ? 'text-red-600' : 'text-emerald-600',
          },
          ...(voitValeur
            ? [{
              label: 'Démarque estimée / 90 j',
              value: `${formatFcfa(synthese.demarque_90j)} F`,
              color: 'text-red-600',
            }]
            : [{
              label: 'Références suspectes',
              value: String(synthese.sku_suspects),
              color: synthese.sku_suspects > 0 ? 'text-red-600' : 'text-emerald-600',
            }]),
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={cn('text-base font-black mt-1', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {synthese.alerte && (
        <p className="text-xs text-red-700 font-medium flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {synthese.alerte}
        </p>
      )}

      {/* Explication de la méthode — sinon « classe A » ne veut rien dire pour le magasinier */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
        <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-1.5">
          <Layers size={14} /> Inventaire tournant — pourquoi cette liste
        </h3>
        <p className="text-xs text-indigo-900/80 leading-relaxed">
          On ne ferme plus l&apos;entrepôt pour tout compter une fois par an. Chaque référence est classée par
          la valeur qu&apos;elle consomme dans l&apos;année :{' '}
          <span className="font-bold">classe A</span> comptée tous les 30 jours,{' '}
          <span className="font-bold">B</span> tous les 90,{' '}
          <span className="font-bold">C</span> tous les 180. Un écart se voit alors en quelques semaines —
          quand le bon de livraison et le préparateur du jour existent encore.
        </p>
        <div className="flex flex-wrap gap-2 mt-2.5">
          {(['A', 'B', 'C'] as ClasseABC[]).map(c => {
            const lignes = abc.filter(l => l.classe === c)
            const part = lignes.reduce((s, l) => s + l.part_valeur_pct, 0)
            return (
              <span key={c} className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg', CLASSE_STYLE[c])}>
                Classe {c} — {lignes.length} réf. · {part.toFixed(0)} % de la valeur
              </span>
            )
          })}
        </div>
      </div>

      {/* Liste de comptage — triée par allée, un seul passage */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
          <ClipboardCheck size={15} className="text-blue-600" />
          Liste de comptage du jour
          <span className="text-[10px] font-medium text-slate-400">triée par allée — un seul passage</span>
        </h3>

        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
          {taches.map(tache => (
            <div key={tache.produit_ref} className={cn(
              'p-3.5',
              tache.suspicion ? 'bg-red-50/40' : tache.statut === 'EN_RETARD' ? 'bg-amber-50/40' : '',
            )}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-bold text-slate-600 w-16 shrink-0">{tache.emplacement}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 truncate">{tache.produit_nom}</span>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', CLASSE_STYLE[tache.classe])}>
                      {tache.classe}
                    </span>
                    {tache.statut === 'EN_RETARD' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        en retard
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    allée {tache.allee} · {tache.duree_min} min de comptage estimées
                  </div>
                </div>

                {/* Le stock théorique reste affiché : le comptage à l'aveugle double le temps
                    de saisie sans améliorer la détection sur un entrepôt de cette taille. */}
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400">Théorique</div>
                  <div className="text-sm font-black tabular-nums text-slate-700">
                    {tache.stock_theorique.toLocaleString('fr-FR')}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isDone('INVENTAIRE', tache.produit_ref) ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-lg">
                        <Check size={12} /> Compté
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const entry = getEntry('INVENTAIRE', tache.produit_ref)
                          if (entry) annuler(entry.id)
                          if (ecart?.produit_ref === tache.produit_ref) setEcart(null)
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600"
                      >
                        <Undo2 size={11} /> Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="compté"
                        value={saisie[tache.produit_ref] ?? ''}
                        onChange={e => setSaisie(s => ({ ...s, [tache.produit_ref]: e.target.value }))}
                        className="w-24 px-2.5 py-1.5 text-xs font-bold tabular-nums rounded-lg border border-slate-300 focus:border-slate-800 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => valider(tache.produit_ref, tache.produit_nom)}
                        className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                      >
                        Valider
                      </button>
                    </>
                  )}
                </div>
              </div>

              {tache.suspicion && (
                <p className="text-[11px] text-red-700 font-medium mt-2 flex items-start gap-1.5">
                  <ShieldAlert size={12} className="shrink-0 mt-0.5" /> {tache.suspicion}
                </p>
              )}

              {ecart?.produit_ref === tache.produit_ref && (
                <div className={cn(
                  'mt-2.5 rounded-lg border p-3',
                  Math.abs(ecart.ecart_pct) > 3 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50',
                )}>
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-1.5">
                    <span className="text-slate-500">
                      Théorique <span className="font-bold text-slate-800 tabular-nums">{ecart.stock_theorique.toLocaleString('fr-FR')}</span>
                    </span>
                    <span className="text-slate-500">
                      Compté <span className="font-bold text-slate-800 tabular-nums">{ecart.stock_compte.toLocaleString('fr-FR')}</span>
                    </span>
                    <span className={cn(
                      'font-black tabular-nums',
                      ecart.ecart < 0 ? 'text-red-600' : ecart.ecart > 0 ? 'text-amber-600' : 'text-emerald-600',
                    )}>
                      écart {ecart.ecart > 0 ? '+' : ''}{ecart.ecart} ({ecart.ecart_pct} %)
                    </span>
                    {voitValeur && ecart.valeur_ecart > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        {formatFcfa(ecart.valeur_ecart)} F
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 flex items-start gap-1.5">
                    <Search size={11} className="shrink-0 mt-0.5" /> {ecart.cause_probable}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-1">→ {ecart.action}</p>
                </div>
              )}
            </div>
          ))}

          {taches.length === 0 && (
            <p className="text-xs text-slate-400 p-6">Aucun comptage planifié — l&apos;inventaire tournant est à jour.</p>
          )}
        </div>
      </div>
    </div>
  )
}
