'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownToLine, AlertTriangle, ShieldCheck, ScanLine, Clock, Warehouse, CheckCircle2, Check, Undo2,
} from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import {
  buildReceptionsAttendues, buildChargeQuais, controlerReception,
  type ReceptionAttendue, type NiveauControle, type BilanReception,
} from '@distributeur/lib/reception-engine'
import { getTopologie } from '@distributeur/lib/registries/entrepot-logistique-registry'
import { useStockWorkflow } from '@distributeur/contexts/StockWorkflowContext'

const STATUT_STYLE: Record<ReceptionAttendue['statut'], { label: string; className: string }> = {
  EN_RETARD: { label: 'En retard', className: 'bg-red-100 text-red-700' },
  A_QUAI: { label: 'Aujourd\'hui', className: 'bg-blue-100 text-blue-700' },
  ATTENDU_JOUR: { label: 'Sous 48 h', className: 'bg-amber-100 text-amber-800' },
  A_VENIR: { label: 'À venir', className: 'bg-slate-100 text-slate-500' },
}

const CONTROLE_STYLE: Record<NiveauControle, { label: string; className: string; icon: typeof ShieldCheck }> = {
  INTEGRAL: { label: 'Contrôle intégral', className: 'bg-red-50 text-red-700 border-red-200', icon: ScanLine },
  RENFORCE: { label: 'Contrôle renforcé', className: 'bg-amber-50 text-amber-800 border-amber-200', icon: ScanLine },
  ALLEGE: { label: 'Contrôle allégé', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck },
}

const ISSUE_STYLE: Record<string, string> = {
  ACCEPTE: 'bg-emerald-100 text-emerald-700',
  RESERVE: 'bg-amber-100 text-amber-800',
  LITIGE: 'bg-red-100 text-red-700',
  REFUS: 'bg-slate-800 text-white',
}

export function ReceptionPanel({ entrepot }: { entrepot: string }) {
  const { isDone, getEntry, executer, annuler } = useStockWorkflow()
  const attendus = useMemo(() => buildReceptionsAttendues([entrepot]), [entrepot])
  const quais = getTopologie(entrepot).quais
  const charge = useMemo(() => buildChargeQuais(entrepot, attendus, quais), [entrepot, attendus, quais])
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [bilan, setBilan] = useState<BilanReception | null>(null)
  /** Quantités réellement descendues du camion, saisies par le magasinier (par ref produit). */
  const [saisies, setSaisies] = useState<Record<string, string>>({})

  function ouvrir(reception: ReceptionAttendue) {
    const estOuvert = ouvert === reception.commande_id
    setOuvert(estOuvert ? null : reception.commande_id)
    setBilan(null)
    // Pré-remplir avec le commandé : le magasinier ne corrige que les écarts.
    setSaisies(estOuvert
      ? {}
      : Object.fromEntries(reception.lignes.map(l => [l.produit_ref, String(l.quantite_commandee)])))
  }

  /** Contrôle réel : le bilan est calculé sur les quantités saisies puis persisté. */
  function validerControle(reception: ReceptionAttendue) {
    const lignes = reception.lignes.map(l => {
      const brut = saisies[l.produit_ref]
      const recue = Number(brut)
      const quantite_recue = Number.isFinite(recue) ? recue : l.quantite_commandee
      return {
        produit_ref: l.produit_ref,
        quantite_recue,
        conforme: quantite_recue === l.quantite_commandee,
      }
    })
    const resultat = controlerReception(reception.commande_id, lignes)
    setBilan(resultat)
    if (resultat) {
      const ecarts = resultat.lignes.filter(l => l.ecart !== 0).length
      executer('RECEPTION', reception.commande_id, {
        label: `Réception ${reception.reference} · ${reception.fournisseur_nom}`,
        detail: `Conformité ${resultat.taux_conformite_pct} %${resultat.avoir_a_reclamer > 0 ? ` · avoir ${formatFcfa(resultat.avoir_a_reclamer)} F` : ''}`,
        message: `Réception ${reception.reference} contrôlée${ecarts > 0 ? ` — ${ecarts} écart(s)` : ''}.`,
        payload: {
          taux_conformite_pct: resultat.taux_conformite_pct,
          avoir_a_reclamer: resultat.avoir_a_reclamer,
          ecarts,
        },
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* Charge des quais */}
      <div className={cn(
        'rounded-xl border p-4',
        charge.sature ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white',
      )}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Warehouse size={15} className="text-slate-500" /> Occupation des quais
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {charge.receptions_jour} réception{charge.receptions_jour > 1 ? 's' : ''} à traiter sur {charge.quais} quai{charge.quais > 1 ? 'x' : ''}
              {charge.retards > 0 && ` · ${charge.retards} en retard fournisseur`}
            </p>
          </div>
          <div className="text-right">
            <div className={cn('text-xl font-black tabular-nums', charge.sature ? 'text-red-600' : 'text-emerald-600')}>
              {Math.round(charge.duree_totale_min / 60 * 10) / 10} h
            </div>
            <div className="text-[10px] text-slate-400">sur {Math.round(charge.capacite_min / 60)} h disponibles</div>
          </div>
        </div>
        {charge.alerte && (
          <p className="text-xs text-red-700 font-medium mt-2.5 flex items-start gap-1.5">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {charge.alerte}
          </p>
        )}
      </div>

      {/* Attendus */}
      <div className="space-y-3">
        {attendus.map(rec => {
          const statut = STATUT_STYLE[rec.statut]
          const controle = CONTROLE_STYLE[rec.controle]
          const ControleIcon = controle.icon
          const estOuvert = ouvert === rec.commande_id

          return (
            <div key={rec.commande_id} className={cn(
              'rounded-xl border bg-white overflow-hidden',
              rec.statut === 'EN_RETARD' ? 'border-red-200' : 'border-slate-200',
            )}>
              <button
                type="button"
                onClick={() => ouvrir(rec)}
                className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <ArrowDownToLine size={17} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{rec.fournisseur_nom}</span>
                        <span className="font-mono text-[10px] text-slate-400">{rec.reference}</span>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statut.className)}>
                          {statut.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {rec.nb_lignes} référence{rec.nb_lignes > 1 ? 's' : ''} · {rec.palettes_total} palettes ·{' '}
                        {rec.poids_total_kg.toLocaleString('fr-FR')} kg · prévu le {rec.date_prevue}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {rec.duree_quai_min} min de quai estimées ·{' '}
                        {rec.taux_conforme_pct} % de livraisons conformes historiquement
                      </div>
                    </div>
                  </div>

                  <span className={cn(
                    'text-[10px] font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 shrink-0',
                    controle.className,
                  )}>
                    <ControleIcon size={12} /> {controle.label}
                  </span>
                </div>

                {rec.alerte && (
                  <p className={cn(
                    'text-[11px] font-medium mt-2.5 flex items-start gap-1.5 rounded-lg p-2',
                    rec.statut === 'EN_RETARD' ? 'text-red-700 bg-red-50' : 'text-slate-600 bg-slate-50',
                  )}>
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {rec.alerte}
                  </p>
                )}
              </button>

              {estOuvert && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  {(() => {
                    const receptionnee = isDone('RECEPTION', rec.commande_id)
                    const receptionEntry = getEntry('RECEPTION', rec.commande_id)
                    return (
                      <>
                  <div className="rounded-lg border border-slate-200 overflow-hidden mb-3">
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2 text-[9px] font-bold uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                      <span className="w-14">Destination</span>
                      <span>Produit</span>
                      <span className="text-right">Attendu</span>
                      <span className="text-right w-16">Contrôle</span>
                      <span className="text-right w-24">Reçu</span>
                    </div>
                    {rec.lignes.map(ligne => {
                      const brut = saisies[ligne.produit_ref] ?? ''
                      const recueNum = Number(brut)
                      const ecart = Number.isFinite(recueNum) ? recueNum - ligne.quantite_commandee : 0
                      return (
                      <div key={ligne.produit_ref} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2 text-[11px] items-center border-b border-slate-50 last:border-0">
                        <span className="font-mono font-bold text-slate-600 w-14">{ligne.emplacement_destination}</span>
                        <span className="text-slate-800 truncate">
                          {ligne.produit_nom}
                          {ecart !== 0 && (
                            <span className="text-red-600 font-bold ml-1">({ecart > 0 ? '+' : ''}{ecart})</span>
                          )}
                        </span>
                        <span className="text-right tabular-nums text-slate-600">
                          {ligne.quantite_commandee.toLocaleString('fr-FR')}
                          <span className="text-slate-400 ml-1">({ligne.palettes_attendues} pal.)</span>
                        </span>
                        <span className={cn(
                          'text-right text-[9px] font-bold w-16',
                          ligne.controle === 'ALLEGE' ? 'text-emerald-600' : ligne.controle === 'RENFORCE' ? 'text-amber-600' : 'text-red-600',
                        )}>
                          {ligne.controle}
                        </span>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          disabled={receptionnee}
                          value={brut}
                          onChange={e => setSaisies(s => ({ ...s, [ligne.produit_ref]: e.target.value }))}
                          className="w-24 px-2 py-1 text-right tabular-nums rounded border border-slate-300 focus:border-slate-800 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                      )
                    })}
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3">{rec.lignes[0]?.motif_controle}</p>

                  {receptionnee ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                        <Check size={12} /> Réception enregistrée{receptionEntry?.by ? ` par ${receptionEntry.by}` : ''}
                        {receptionEntry?.detail ? ` — ${receptionEntry.detail}` : ''}
                      </span>
                      <button type="button"
                        onClick={() => receptionEntry && annuler(receptionEntry.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600">
                        <Undo2 size={11} /> Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => validerControle(rec)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors inline-flex items-center gap-1.5"
                    >
                      <ScanLine size={12} /> Valider le contrôle au quai
                    </button>
                  )}

                  {bilan && bilan.commande_ref === rec.reference && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <h4 className="text-xs font-bold text-slate-900">
                          Verdict — conformité {bilan.taux_conformite_pct} %
                        </h4>
                        {bilan.avoir_a_reclamer > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            avoir de {formatFcfa(bilan.avoir_a_reclamer)} F à réclamer
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {bilan.lignes.filter(l => l.issue !== 'ACCEPTE' || l.ecart !== 0).map(ligne => (
                          <div key={ligne.produit_ref} className="bg-white rounded-lg border border-slate-100 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-slate-800 truncate">{ligne.produit_nom}</span>
                              <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0', ISSUE_STYLE[ligne.issue])}>
                                {ligne.issue}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                              commandé {ligne.quantite_commandee.toLocaleString('fr-FR')} ·
                              reçu {ligne.quantite_recue.toLocaleString('fr-FR')} ·
                              écart {ligne.ecart > 0 ? '+' : ''}{ligne.ecart} ({ligne.ecart_pct} %)
                              {ligne.impact_fcfa > 0 && ` · ${formatFcfa(ligne.impact_fcfa)} F`}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">{ligne.action}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg bg-white border border-slate-100 p-2.5">
                        <div className="text-[9px] font-bold uppercase text-slate-400 mb-1.5">Enchaîné automatiquement</div>
                        <ul className="space-y-1">
                          {bilan.actions_auto.map((action, i) => (
                            <li key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                              <CheckCircle2 size={11} className="text-emerald-500 shrink-0 mt-0.5" /> {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}

        {attendus.length === 0 && (
          <p className="text-xs text-slate-400 py-6">Aucune livraison fournisseur attendue sur cet entrepôt.</p>
        )}
      </div>
    </div>
  )
}
