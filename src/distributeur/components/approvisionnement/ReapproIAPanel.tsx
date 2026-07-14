'use client'
import { useMemo } from 'react'
import {
  AlertTriangle, Check, Layers, Sparkles, TrendingDown, Truck, Wallet, ShieldAlert, Undo2,
} from 'lucide-react'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useStockWorkflow } from '@distributeur/contexts/StockWorkflowContext'
import {
  detecterProduitsEnManque, genererCommandesSuggerees, simulerImpactTresorerie,
} from '@distributeur/lib/reappro-engine'
import { buildAnalysesApproIA } from '@distributeur/lib/fournisseurs-hub'
import { getRegleProduit, NIVEAU_AUTO_LABEL } from '@distributeur/lib/registries/regles-reappro-registry'
import { getFournisseurById } from '@distributeur/lib/registries/fournisseurs-registry'

const CRITICITE_STYLE = {
  CRITIQUE: 'bg-red-100 text-red-700',
  HAUTE: 'bg-orange-100 text-orange-700',
  MODEREE: 'bg-sky-100 text-sky-700',
}

const SEVERITE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

export function ReapproIAPanel() {
  const { user } = useAuth()
  const { isDone, getEntry, executer, annuler } = useStockWorkflow()
  const alertes = useMemo(() => detecterProduitsEnManque(), [])
  const suggerees = useMemo(() => genererCommandesSuggerees(), [])
  const analyses = useMemo(() => buildAnalysesApproIA(), [])

  const restantes = suggerees.filter(c => !isDone('REAPPRO_VALIDATION', c.id))
  const impact = useMemo(() => simulerImpactTresorerie(restantes), [restantes])

  function valider(cmd: (typeof suggerees)[number]) {
    executer('REAPPRO_VALIDATION', cmd.id, {
      label: `Commande ${cmd.reference} · ${cmd.fournisseur_nom}`,
      detail: `${formatFcfa(cmd.montant_ttc)} TTC · ${cmd.entrepot_destination}`,
      message: `Commande ${cmd.reference} validée et envoyée à ${cmd.fournisseur_nom}.`,
      payload: { montant_ttc: cmd.montant_ttc, fournisseur_id: cmd.fournisseur_id },
    })
  }

  function validerTout() {
    restantes.forEach(valider)
  }

  return (
    <div className="space-y-4">
      {/* Impact trésorerie — le garde-fou avant tout engagement */}
      <div className={cn(
        'rounded-xl border p-4',
        impact.franchit_plancher ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50/60',
      )}>
        <div className="flex items-center gap-2 mb-3">
          {impact.franchit_plancher
            ? <ShieldAlert size={15} className="text-red-600" />
            : <Wallet size={15} className="text-emerald-600" />}
          <h3 className={cn('text-sm font-bold', impact.franchit_plancher ? 'text-red-900' : 'text-emerald-900')}>
            Impact trésorerie simulé
          </h3>
          <AiBadge variant="small" label="Garde-fou" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'Solde disponible', value: formatFcfa(impact.solde_actuel) },
            { label: 'Engagement suggéré', value: formatFcfa(impact.montant_engage), color: 'text-orange-700' },
            { label: 'Solde projeté', value: formatFcfa(impact.solde_projete), color: impact.franchit_plancher ? 'text-red-700' : 'text-emerald-700' },
            { label: 'Plancher', value: formatFcfa(impact.seuil_plancher), color: 'text-slate-500' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-lg border border-slate-200 p-2.5">
              <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
              <div className={cn('text-sm font-black mt-0.5', k.color ?? 'text-slate-900')}>{k.value}</div>
            </div>
          ))}
        </div>
        <p className={cn('text-xs mt-3', impact.franchit_plancher ? 'text-red-800' : 'text-emerald-800')}>
          {impact.commentaire}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Commandes suggérées */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Commandes suggérées par le moteur</h3>
                <AiBadge variant="small" label={`${suggerees.length} propositions`} />
              </div>
              {restantes.length > 0 && (
                <button type="button" onClick={validerTout}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                  Valider tout ({restantes.length})
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {suggerees.map(cmd => {
                const estValidee = isDone('REAPPRO_VALIDATION', cmd.id)
                const validationEntry = getEntry('REAPPRO_VALIDATION', cmd.id)
                const basculee = isDone('REAPPRO_BASCULE', cmd.id)
                const fournisseur = getFournisseurById(cmd.fournisseur_id)
                const alternatif = cmd.fournisseur_alternatif_id
                  ? getFournisseurById(cmd.fournisseur_alternatif_id)
                  : undefined
                const regle = getRegleProduit(cmd.lignes[0].produit_ref)

                return (
                  <div key={cmd.id} className={cn('p-4', estValidee && 'bg-emerald-50/50')}>
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] text-slate-400">{cmd.reference}</span>
                          <span className="font-bold text-sm text-slate-900">{cmd.fournisseur_nom}</span>
                          {regle && (
                            <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', NIVEAU_AUTO_LABEL[regle.niveau_auto].className)}>
                              {NIVEAU_AUTO_LABEL[regle.niveau_auto].label}
                            </span>
                          )}
                          {cmd.lignes.length > 1 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-violet-100 text-violet-700 inline-flex items-center gap-1">
                              <Layers size={9} /> {cmd.lignes.length} produits regroupés
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Livraison prévue {cmd.date_livraison_prevue} · {cmd.entrepot_destination} · échéance de paiement {cmd.echeance_paiement}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-slate-900">{formatFcfa(cmd.montant_ttc)}</div>
                        <div className="text-[10px] text-slate-400">TTC · {formatFcfa(cmd.montant_ht)} HT</div>
                        {cmd.economie_regroupement ? (
                          <div className="text-[10px] text-emerald-600 font-bold">
                            −{cmd.economie_regroupement.toLocaleString('fr-FR')} F économisés
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Lignes */}
                    <div className="rounded-lg border border-slate-100 overflow-hidden mb-2.5">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="text-left p-2">Produit</th>
                            <th className="text-right p-2">Qté</th>
                            <th className="text-right p-2">P.A.</th>
                            <th className="text-right p-2">Total</th>
                            <th className="text-left p-2 hidden md:table-cell">Motif</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cmd.lignes.map(l => (
                            <tr key={l.produit_ref} className="border-t border-slate-100">
                              <td className="p-2 font-medium text-slate-800">{l.produit_nom}</td>
                              <td className="p-2 text-right tabular-nums">{l.quantite_commandee.toLocaleString('fr-FR')}</td>
                              <td className="p-2 text-right text-slate-500">{l.prix_achat_unitaire.toLocaleString('fr-FR')}</td>
                              <td className="p-2 text-right font-bold">{formatFcfa(l.total)}</td>
                              <td className="p-2 text-[10px] text-slate-400 hidden md:table-cell">
                                {l.motif.replace(/_/g, ' ').toLowerCase()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Justification IA — pourquoi ce fournisseur */}
                    <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-2.5 mb-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={11} className="text-indigo-600" />
                        <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide">
                          Pourquoi ce fournisseur
                        </span>
                        {fournisseur && (
                          <span className="text-[10px] text-indigo-500">
                            fiabilité {fournisseur.score_fiabilite}/100
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-indigo-900 leading-relaxed">{cmd.justification_ia}</p>
                      {alternatif && (
                        <p className="text-[10px] text-indigo-500 mt-1">
                          Réserve : {alternatif.nom} — délai réel {alternatif.delai_reel_moyen_j} j.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {estValidee ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                            <Check size={12} /> Validée par {validationEntry?.by ?? user?.nom} — commande envoyée à {basculee && alternatif ? alternatif.nom : cmd.fournisseur_nom}
                          </span>
                          <button type="button"
                            onClick={() => validationEntry && annuler(validationEntry.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600">
                            <Undo2 size={11} /> Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => valider(cmd)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                            <Check size={12} /> Valider la commande
                          </button>
                          {alternatif && (
                            basculee ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
                                Fournisseur basculé sur {alternatif.nom}
                              </span>
                            ) : (
                              <button type="button"
                                onClick={() => executer('REAPPRO_BASCULE', cmd.id, {
                                  label: `Bascule ${cmd.reference} → ${alternatif.nom}`,
                                  detail: `Délai réel ${alternatif.delai_reel_moyen_j} j`,
                                  message: `${cmd.reference} basculée sur ${alternatif.nom}.`,
                                  payload: { fournisseur_alternatif_id: cmd.fournisseur_alternatif_id },
                                })}
                                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                                Basculer sur {alternatif.nom}
                              </button>
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}

              {suggerees.length === 0 && (
                <p className="p-6 text-center text-xs text-slate-400">
                  Aucune commande à suggérer — tous les produits sont au-dessus de leur seuil.
                </p>
              )}
            </div>
          </div>

          {/* Détection — produits en manque */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <TrendingDown size={15} className="text-red-500" />
              <h3 className="text-sm font-bold text-slate-900">Produits en manque — détection</h3>
              <span className="text-[10px] text-slate-400 ml-auto">{alertes.length} références</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left p-2.5">Produit</th>
                    <th className="text-right p-2.5">Stock</th>
                    <th className="text-right p-2.5">Seuil</th>
                    <th className="text-right p-2.5">Vitesse/j</th>
                    <th className="text-right p-2.5">Couverture</th>
                    <th className="text-right p-2.5">Qté suggérée</th>
                    <th className="text-center p-2.5">Criticité</th>
                  </tr>
                </thead>
                <tbody>
                  {alertes.map(a => (
                    <tr key={a.produit_ref} className="border-t border-slate-100">
                      <td className="p-2.5">
                        <div className="font-medium text-slate-800">{a.produit_nom}</div>
                        <div className="text-[10px] text-slate-400">{a.categorie} · {a.entrepot}</div>
                      </td>
                      <td className="p-2.5 text-right font-bold tabular-nums">{a.stock_actuel.toLocaleString('fr-FR')}</td>
                      <td className="p-2.5 text-right text-slate-400 tabular-nums">{a.seuil.toLocaleString('fr-FR')}</td>
                      <td className="p-2.5 text-right text-slate-600 tabular-nums">{a.vitesse_vente_jour}</td>
                      <td className={cn('p-2.5 text-right font-bold tabular-nums',
                        a.couverture_jours < 5 ? 'text-red-600' : 'text-amber-600')}>
                        {a.couverture_jours} j
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 tabular-nums">
                        {a.quantite_suggeree.toLocaleString('fr-FR')}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', CRITICITE_STYLE[a.criticite])}>
                          {a.criticite}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Analyses IA */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-900">Analyses IA approvisionnement</h3>
            </div>
            <div className="space-y-2">
              {analyses.map((a, i) => (
                <div key={i} className={cn('p-2.5 rounded-lg border text-xs', SEVERITE_STYLE[a.severite])}>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle size={11} className="mt-0.5 shrink-0 opacity-70" />
                    <div className="min-w-0">
                      <div className="font-bold">{a.titre}</div>
                      <div className="text-[10px] opacity-90 mt-0.5">{a.detail}</div>
                      <div className="text-[10px] font-semibold mt-1 text-slate-700">→ {a.action}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-indigo-200/60 text-[10px] text-indigo-700 flex items-center gap-1.5">
              <Truck size={11} />
              Le moteur tourne chaque matin à 6 h et n&apos;engage jamais au-delà du plafond du poste.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
