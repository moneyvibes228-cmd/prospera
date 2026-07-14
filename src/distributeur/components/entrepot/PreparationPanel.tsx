'use client'

import { useMemo, useState } from 'react'
import {
  PackageCheck, AlertTriangle, Ban, Clock, MapPin, ArrowRight,
  User, Repeat, CircleSlash,
} from 'lucide-react'
import { cn } from '@distributeur/lib/utils'
import {
  buildBonsPreparation, buildVagues, buildChargeJour,
  type BonPreparation, type LignePicking,
} from '@distributeur/lib/picking-engine'

const DECISION_STYLE: Record<BonPreparation['decision_auto'], { label: string; className: string }> = {
  PREPARER: { label: 'À préparer', className: 'bg-emerald-100 text-emerald-700' },
  PREPARER_PARTIEL: { label: 'Partiel', className: 'bg-amber-100 text-amber-800' },
  BLOQUER: { label: 'Bloqué', className: 'bg-red-100 text-red-700' },
}

const LIGNE_STYLE: Record<LignePicking['statut'], string> = {
  SERVABLE: 'text-emerald-600',
  PARTIELLE: 'text-amber-600',
  RUPTURE: 'text-red-600',
}

export function PreparationPanel({ entrepot }: { entrepot: string }) {
  const bons = useMemo(() => buildBonsPreparation([entrepot]), [entrepot])
  const vagues = useMemo(() => buildVagues(entrepot, bons), [entrepot, bons])
  const charge = useMemo(() => buildChargeJour(entrepot, bons), [entrepot, bons])
  const [ouvert, setOuvert] = useState<string | null>(null)

  const bloques = bons.filter(b => b.blocage !== 'AUCUN')

  return (
    <div className="space-y-5">
      {/* Charge du jour — la seule question de 7 h du matin */}
      <div className={cn(
        'rounded-xl border p-4',
        charge.lignes_reportees > 0 ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white',
      )}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Charge du jour</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {charge.lignes_a_preparer} lignes à sortir · {charge.preparateurs_presents} préparateurs présents
              {charge.preparateurs_absents > 0 && ` · ${charge.preparateurs_absents} absent${charge.preparateurs_absents > 1 ? 's' : ''}`}
              {' '}· cutoff camions {charge.cutoff}
            </p>
          </div>
          <div className="text-right">
            <div className={cn(
              'text-2xl font-black tabular-nums',
              charge.taux_charge_pct > 100 ? 'text-red-600' : charge.taux_charge_pct > 85 ? 'text-amber-600' : 'text-emerald-600',
            )}>
              {charge.taux_charge_pct} %
            </div>
            <div className="text-[10px] text-slate-400">de la capacité ({charge.capacite_lignes} lignes)</div>
          </div>
        </div>

        <div className="h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              charge.taux_charge_pct > 100 ? 'bg-red-500' : charge.taux_charge_pct > 85 ? 'bg-amber-500' : 'bg-emerald-500',
            )}
            style={{ width: `${Math.min(100, charge.taux_charge_pct)}%` }}
          />
        </div>

        {charge.alerte && (
          <p className="text-xs text-red-700 font-medium mt-2.5 flex items-start gap-1.5">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {charge.alerte}
          </p>
        )}

        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-200/70 text-[11px]">
          <span className="text-slate-500">
            Carnet <span className="font-bold text-slate-800 tabular-nums">{charge.carnet_commandes}</span> commandes
          </span>
          <span className="text-slate-500">
            Libérées aujourd&apos;hui <span className="font-bold text-emerald-600 tabular-nums">{charge.commandes_liberees}</span>
          </span>
          <span className="text-slate-500">
            Arriéré <span className="font-bold text-red-600 tabular-nums">{charge.arriere_commandes}</span>
          </span>
        </div>
      </div>

      {/* L'arriéré n'est pas un problème de bras : c'est un problème de stock. */}
      {charge.alerte_structurelle && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <h3 className="text-sm font-bold text-red-900 flex items-center gap-2 mb-1">
            <AlertTriangle size={15} /> L&apos;arriéré ne se rattrapera pas avec des préparateurs
          </h3>
          <p className="text-xs text-red-800/90 leading-relaxed">{charge.alerte_structurelle}</p>
        </div>
      )}

      {/* Vagues */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
          <PackageCheck size={15} className="text-blue-600" />
          Vagues de préparation
          <span className="text-[10px] font-medium text-slate-400">
            regroupées par zone de livraison, chemin de picking optimisé
          </span>
        </h3>

        <div className="grid lg:grid-cols-2 gap-3">
          {vagues.map(vague => (
            <div key={vague.id} className={cn(
              'rounded-xl border p-4 bg-white',
              vague.tenable ? 'border-slate-200' : 'border-amber-300',
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900">{vague.libelle}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Clock size={11} /> {vague.creneau}
                    <span className="text-slate-300">·</span>
                    {vague.bons.length} bon{vague.bons.length > 1 ? 's' : ''} · {vague.nb_lignes} lignes
                  </div>
                </div>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                  vague.tenable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800',
                )}>
                  {vague.duree_min} min
                </span>
              </div>

              {vague.preparateur && (
                <div className="flex items-center gap-2 mt-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                    <User size={12} className="text-slate-500" />
                  </div>
                  <span className="font-semibold text-slate-700">{vague.preparateur.nom}</span>
                  <span className="text-slate-400">{vague.preparateur.cadence_lignes_h} lignes/h</span>
                  {vague.preparateur.taux_erreur_pct > 3 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      {vague.preparateur.taux_erreur_pct} % d&apos;erreur
                    </span>
                  )}
                </div>
              )}

              {/* Chemin de picking */}
              <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                <MapPin size={11} className="text-slate-400" />
                {vague.parcours.map((allee, i) => (
                  <span key={allee} className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {allee}
                    </span>
                    {i < vague.parcours.length - 1 && <ArrowRight size={9} className="text-slate-300" />}
                  </span>
                ))}
              </div>

              {!vague.tenable && (
                <p className="text-[11px] text-amber-700 font-medium mt-2 flex items-start gap-1.5">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  {vague.duree_min} min pour un créneau de 150 min — la vague déborde et rate le départ camion.
                  Scinder en deux ou ajouter un préparateur.
                </p>
              )}
            </div>
          ))}
          {vagues.length === 0 && (
            <p className="text-xs text-slate-400 py-6">Aucune vague à préparer — file de picking vide.</p>
          )}
        </div>
      </div>

      {/* Bons de préparation */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2.5">
          Bons de préparation
          <span className="text-[10px] font-medium text-slate-400 ml-2">
            triés par priorité réelle — pas par date de commande
          </span>
        </h3>

        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
          {bons.map(bon => {
            const style = DECISION_STYLE[bon.decision_auto]
            const estOuvert = ouvert === bon.commande_id

            return (
              <div key={bon.commande_id}>
                <button
                  type="button"
                  onClick={() => setOuvert(estOuvert ? null : bon.commande_id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-black tabular-nums',
                    bon.score_priorite >= 75 ? 'bg-red-100 text-red-700'
                      : bon.score_priorite >= 55 ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500',
                  )}>
                    {bon.score_priorite}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">{bon.pdv_nom}</span>
                      <span className="font-mono text-[10px] text-slate-400">{bon.commande_ref}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {bon.nb_lignes} lignes · {bon.palettes_total} palette{bon.palettes_total > 1 ? 's' : ''} ·{' '}
                      {bon.poids_total_kg.toLocaleString('fr-FR')} kg · {bon.volume_total_m3} m³ · {bon.duree_prep_min} min
                      {bon.lignes_en_rupture > 0 && (
                        <span className="text-red-600 font-semibold"> · {bon.lignes_en_rupture} en rupture</span>
                      )}
                    </div>
                  </div>

                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', style.className)}>
                    {style.label}
                  </span>
                </button>

                {estOuvert && (
                  <div className="px-4 pb-4 bg-slate-50/60">
                    <p className="text-[11px] text-slate-600 mb-3 flex items-start gap-1.5">
                      {bon.blocage === 'CREANCE'
                        ? <Ban size={12} className="text-red-500 shrink-0 mt-0.5" />
                        : <PackageCheck size={12} className="text-slate-400 shrink-0 mt-0.5" />}
                      {bon.justification}
                    </p>

                    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100">
                        <span>Empl.</span>
                        <span>Produit</span>
                        <span className="text-right">Demandé</span>
                        <span className="text-right">Servi</span>
                        <span className="text-right">Poids</span>
                      </div>
                      {bon.lignes.map(ligne => (
                        <div key={ligne.produit_ref} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2 text-[11px] border-b border-slate-50 last:border-0 items-center">
                          <span className="font-mono font-bold text-slate-600 w-14">{ligne.emplacement}</span>
                          <span className="min-w-0">
                            <span className="text-slate-800 truncate block">{ligne.produit_nom}</span>
                            {ligne.substitut_nom && (
                              <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                                <Repeat size={9} /> substitut proposé : {ligne.substitut_nom}
                              </span>
                            )}
                          </span>
                          <span className="text-right tabular-nums text-slate-500">{ligne.quantite_demandee}</span>
                          <span className={cn('text-right tabular-nums font-bold', LIGNE_STYLE[ligne.statut])}>
                            {ligne.quantite_servie}
                          </span>
                          <span className="text-right tabular-nums text-slate-400">{ligne.poids_kg} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bloqués — mis à part, ce ne sont pas des bons de préparation */}
      {bloques.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
            <CircleSlash size={14} />
            {bloques.length} commande{bloques.length > 1 ? 's' : ''} retirée{bloques.length > 1 ? 's' : ''} des vagues
          </h3>
          <p className="text-[11px] text-red-700/80 mb-3">
            Le stock correspondant n&apos;est pas réservé : il reste disponible pour les clients à jour de paiement.
          </p>
          <div className="space-y-1.5">
            {bloques.map(bon => (
              <div key={bon.commande_id} className="text-xs bg-white rounded-lg border border-red-100 px-3 py-2">
                <span className="font-semibold text-slate-800">{bon.pdv_nom}</span>
                <span className="font-mono text-[10px] text-slate-400 ml-2">{bon.commande_ref}</span>
                <p className="text-[11px] text-slate-600 mt-0.5">{bon.justification}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
