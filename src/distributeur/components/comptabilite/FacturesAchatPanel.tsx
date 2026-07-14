'use client'
import { useMemo, useState } from 'react'
import { ReceiptText, Check, AlertTriangle } from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { REGISTRE_COMMANDES_FOURNISSEURS, STATUT_PAIEMENT_STYLE } from '@distributeur/lib/registries/commandes-fournisseurs-registry'
import { getFournisseurById } from '@distributeur/lib/registries/fournisseurs-registry'

/**
 * Factures d'achat fournisseurs (spec V2 §7.11) — le pendant achat des factures de vente.
 * Une facture d'achat naît d'une commande fournisseur reçue : c'est elle qui crée la dette
 * comptable (601 / 445 / 401). Le comptable la rapproche du BL et la saisit.
 */

/** Écriture SYSCOHADA générée à la saisie — achats HT, TVA déductible, dette fournisseur. */
function ecritureAchat(montantTtc: number) {
  const ht = Math.round(montantTtc / 1.18)
  return {
    achats: ht,
    tva: montantTtc - ht,
    dette: montantTtc,
  }
}

export function FacturesAchatPanel() {
  // Seules les commandes réceptionnées donnent lieu à une facture d'achat.
  const aSaisir = useMemo(
    () => REGISTRE_COMMANDES_FOURNISSEURS.filter(
      c => ['RECUE', 'RECUE_PARTIELLE', 'LITIGE'].includes(c.statut),
    ),
    [],
  )

  const [saisies, setSaisies] = useState<Set<string>>(new Set())

  const resteASaisir = aSaisir.filter(c => !saisies.has(c.id))
  const montantASaisir = resteASaisir.reduce((s, c) => s + c.montant_ttc, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
        <ReceiptText size={15} className="text-purple-600" />
        <h3 className="text-sm font-bold text-slate-900">Factures d&apos;achat fournisseurs à saisir</h3>
        <AiBadge variant="small" label="Rapprochement BL auto" />
        <span className="text-[10px] text-slate-400 ml-auto">
          {resteASaisir.length} en attente · {formatFcfa(montantASaisir)}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {aSaisir.map(c => {
          const saisie = saisies.has(c.id)
          const fournisseur = getFournisseurById(c.fournisseur_id)
          const ecriture = ecritureAchat(c.montant_ttc)
          const pay = STATUT_PAIEMENT_STYLE[c.statut_paiement]
          const ecartReception = c.lignes.some(
            l => l.quantite_recue != null && l.quantite_recue < l.quantite_commandee,
          )

          return (
            <div key={c.id} className={cn('p-4', saisie && 'bg-emerald-50/40')}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-slate-400">{c.reference}</span>
                    <span className="font-bold text-sm text-slate-900">{c.fournisseur_nom}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', pay.className)}>
                      {pay.label}
                    </span>
                    {c.statut === 'LITIGE' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-700">
                        Litige
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Reçue le {c.date_livraison_reelle ?? '—'} · échéance {c.echeance_paiement}
                    {fournisseur && <> · crédit {fournisseur.delai_paiement_j} j</>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-slate-900">{formatFcfa(c.montant_ttc)}</div>
                  {c.montant_paye > 0 && (
                    <div className="text-[10px] text-emerald-600">{formatFcfa(c.montant_paye)} déjà réglés</div>
                  )}
                </div>
              </div>

              {ecartReception && (
                <div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900 mb-2">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                  <span>
                    Écart entre le BL et la commande : ne saisir que les quantités réellement reçues,
                    l&apos;écart doit passer en avoir fournisseur et non en charge.
                  </span>
                </div>
              )}

              {/* Écriture générée */}
              <div className="rounded-lg border border-slate-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left p-2">Compte</th>
                      <th className="text-left p-2">Libellé</th>
                      <th className="text-right p-2">Débit</th>
                      <th className="text-right p-2">Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100">
                      <td className="p-2 font-mono text-slate-500">601100</td>
                      <td className="p-2 text-slate-700">Achats de marchandises</td>
                      <td className="p-2 text-right font-bold tabular-nums">{ecriture.achats.toLocaleString('fr-FR')}</td>
                      <td className="p-2 text-right text-slate-300">—</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="p-2 font-mono text-slate-500">445200</td>
                      <td className="p-2 text-slate-700">TVA déductible</td>
                      <td className="p-2 text-right font-bold tabular-nums">{ecriture.tva.toLocaleString('fr-FR')}</td>
                      <td className="p-2 text-right text-slate-300">—</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="p-2 font-mono text-slate-500">401100</td>
                      <td className="p-2 text-slate-700">Fournisseur {c.fournisseur_nom}</td>
                      <td className="p-2 text-right text-slate-300">—</td>
                      <td className="p-2 text-right font-bold tabular-nums">{ecriture.dette.toLocaleString('fr-FR')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-2.5">
                {saisie ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                    <Check size={12} /> Écriture d&apos;achat validée — dette portée au compte 401100
                  </span>
                ) : (
                  <button type="button" onClick={() => setSaisies(s => new Set(s).add(c.id))}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                    <ReceiptText size={11} /> Saisir la facture d&apos;achat
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
