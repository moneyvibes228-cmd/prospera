'use client'
import { useMemo, useState } from 'react'
import { AlertTriangle, PackageCheck, Truck, Check, Undo2 } from 'lucide-react'
import { cn, formatFcfa } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'
import type { CommandeFournisseur, StatutCommandeFournisseur } from '@/types'
import {
  REGISTRE_COMMANDES_FOURNISSEURS, STATUT_CF_STYLE, STATUT_PAIEMENT_STYLE, PIPELINE_CF,
} from '@/lib/registries/commandes-fournisseurs-registry'
import { genererCommandesSuggerees } from '@/lib/reappro-engine'
import { useStockWorkflow } from '@/contexts/StockWorkflowContext'

/** Réception : on saisit ce qui arrive réellement, l'écart ouvre un litige. */
function PanneauReception({ commande }: { commande: CommandeFournisseur }) {
  const { isDone, getEntry, executer, annuler } = useStockWorkflow()
  const [quantites, setQuantites] = useState<Record<string, number>>(
    Object.fromEntries(commande.lignes.map(l => [l.produit_ref, l.quantite_recue ?? l.quantite_commandee])),
  )

  const ecarts = commande.lignes.filter(l => (quantites[l.produit_ref] ?? 0) !== l.quantite_commandee)
  const detteHt = commande.lignes.reduce(
    (s, l) => s + l.prix_achat_unitaire * (quantites[l.produit_ref] ?? 0), 0,
  )
  const detteTtc = Math.round(detteHt * 1.18)

  const receptionnee = isDone('RECEPTION', commande.id)
  const receptionEntry = getEntry('RECEPTION', commande.id)

  function validerReception() {
    executer('RECEPTION', commande.id, {
      label: `Réception ${commande.reference} · ${commande.fournisseur_nom}`,
      detail: `Dette ${formatFcfa(detteTtc)} TTC${ecarts.length > 0 ? ` · litige sur ${ecarts.length} ligne(s)` : ''}`,
      message: `Réception ${commande.reference} enregistrée${ecarts.length > 0 ? ' (litige ouvert)' : ''}.`,
      payload: {
        dette_ttc: detteTtc,
        ecarts: ecarts.length,
        quantites,
      },
    })
  }

  if (receptionnee) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Check size={12} /> Réception enregistrée{receptionEntry?.by ? ` par ${receptionEntry.by}` : ''}
          </div>
          <button type="button"
            onClick={() => receptionEntry && annuler(receptionEntry.id)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700/70 hover:text-emerald-900">
            <Undo2 size={11} /> Annuler
          </button>
        </div>
        Entrée en stock passée · dette fournisseur créée pour {formatFcfa(detteTtc)} TTC
        {ecarts.length > 0 && <> · <span className="font-bold text-red-700">litige ouvert sur {ecarts.length} ligne{ecarts.length > 1 ? 's' : ''}</span></>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <PackageCheck size={12} className="text-slate-500" />
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
          Réception — saisir les quantités réellement reçues
        </span>
      </div>
      <div className="space-y-1.5 mb-2.5">
        {commande.lignes.map(l => {
          const recue = quantites[l.produit_ref] ?? 0
          const ecart = recue - l.quantite_commandee
          return (
            <div key={l.produit_ref} className="flex items-center gap-2 text-xs">
              <span className="flex-1 min-w-0 truncate text-slate-700">{l.produit_nom}</span>
              <span className="text-[10px] text-slate-400 shrink-0">
                commandé {l.quantite_commandee.toLocaleString('fr-FR')}
              </span>
              <input
                type="number"
                min={0}
                value={recue}
                onChange={e => setQuantites(q => ({ ...q, [l.produit_ref]: Number(e.target.value) }))}
                className="w-24 px-2 py-1 rounded border border-slate-200 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className={cn('w-16 text-right text-[10px] font-bold shrink-0',
                ecart === 0 ? 'text-emerald-600' : 'text-red-600')}>
                {ecart === 0 ? 'conforme' : `${ecart > 0 ? '+' : ''}${ecart}`}
              </span>
            </div>
          )
        })}
      </div>

      {ecarts.length > 0 && (
        <div className="flex items-start gap-1.5 rounded border border-red-200 bg-red-50 p-2 text-[10px] text-red-800 mb-2.5">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          <span>
            Écart sur {ecarts.length} ligne{ecarts.length > 1 ? 's' : ''} — la validation ouvrira un litige
            fournisseur et la dette sera calculée sur les quantités reçues, pas commandées.
          </span>
        </div>
      )}

      <button type="button" onClick={validerReception}
        className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
        Valider la réception
      </button>
    </div>
  )
}

const RECEPTIONNABLES: StatutCommandeFournisseur[] = ['ENVOYEE', 'CONFIRMEE', 'EN_TRANSIT', 'RECUE_PARTIELLE']

export function CommandesFournisseursView() {
  const suggerees = useMemo(() => genererCommandesSuggerees(), [])
  const toutes = useMemo(
    () => [...suggerees, ...REGISTRE_COMMANDES_FOURNISSEURS],
    [suggerees],
  )

  const [filtre, setFiltre] = useState<StatutCommandeFournisseur | 'tous'>('tous')
  const [ouverte, setOuverte] = useState<string | null>(null)

  const comptes = useMemo(() => {
    const map = new Map<StatutCommandeFournisseur, number>()
    for (const c of toutes) map.set(c.statut, (map.get(c.statut) ?? 0) + 1)
    return map
  }, [toutes])

  const filtrees = filtre === 'tous' ? toutes : toutes.filter(c => c.statut === filtre)

  return (
    <div className="space-y-4">
      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Truck size={15} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Pipeline commandes fournisseurs</h3>
          <AiBadge variant="small" label="Live" pulse />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {PIPELINE_CF.map(statut => {
            const st = STATUT_CF_STYLE[statut]
            const n = comptes.get(statut) ?? 0
            return (
              <button key={statut} type="button"
                onClick={() => setFiltre(prev => prev === statut ? 'tous' : statut)}
                className={cn(
                  'rounded-lg border p-2.5 text-left transition-all',
                  filtre === statut ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300',
                )}>
                <div className="text-lg font-black text-slate-900">{n}</div>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', st.className)}>{st.label}</span>
              </button>
            )
          })}
        </div>
        {filtre !== 'tous' && (
          <button type="button" onClick={() => setFiltre('tous')}
            className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-medium underline">
            ← Toutes les commandes
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {filtrees.map(cmd => {
          const st = STATUT_CF_STYLE[cmd.statut]
          const pay = STATUT_PAIEMENT_STYLE[cmd.statut_paiement]
          const estOuverte = ouverte === cmd.id
          const receptionnable = RECEPTIONNABLES.includes(cmd.statut)

          return (
            <div key={cmd.id} className={cn('p-4', cmd.statut === 'LITIGE' && 'bg-red-50/40')}>
              <button type="button"
                onClick={() => setOuverte(prev => prev === cmd.id ? null : cmd.id)}
                className="w-full text-left">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-slate-400">{cmd.reference}</span>
                      <span className="font-bold text-sm text-slate-900">{cmd.fournisseur_nom}</span>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', st.className)}>{st.label}</span>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', pay.className)}>{pay.label}</span>
                      {cmd.origine === 'AUTO_IA' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">Auto IA</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {cmd.lignes.length} ligne{cmd.lignes.length > 1 ? 's' : ''} · {cmd.entrepot_destination} ·
                      livraison prévue {cmd.date_livraison_prevue}
                      {cmd.date_livraison_reelle && <> · reçue le {cmd.date_livraison_reelle}</>}
                      · échéance {cmd.echeance_paiement}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900">{formatFcfa(cmd.montant_ttc)}</div>
                    {cmd.montant_paye > 0 && (
                      <div className="text-[10px] text-emerald-600">{formatFcfa(cmd.montant_paye)} payés</div>
                    )}
                    {cmd.valide_par && (
                      <div className="text-[10px] text-slate-400">validée par {cmd.valide_par}</div>
                    )}
                  </div>
                </div>
              </button>

              {estOuverte && (
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-slate-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="text-left p-2">Produit</th>
                          <th className="text-right p-2">Commandé</th>
                          <th className="text-right p-2">Reçu</th>
                          <th className="text-right p-2">P.A.</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cmd.lignes.map(l => {
                          const manquant = l.quantite_recue != null && l.quantite_recue < l.quantite_commandee
                          return (
                            <tr key={l.produit_ref} className="border-t border-slate-100">
                              <td className="p-2 font-medium text-slate-800">{l.produit_nom}</td>
                              <td className="p-2 text-right tabular-nums">{l.quantite_commandee.toLocaleString('fr-FR')}</td>
                              <td className={cn('p-2 text-right tabular-nums font-bold', manquant ? 'text-red-600' : 'text-slate-600')}>
                                {l.quantite_recue != null ? l.quantite_recue.toLocaleString('fr-FR') : '—'}
                              </td>
                              <td className="p-2 text-right text-slate-500">{l.prix_achat_unitaire.toLocaleString('fr-FR')}</td>
                              <td className="p-2 text-right font-bold">{formatFcfa(l.total)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {cmd.justification_ia && (
                    <p className="text-[11px] text-slate-600 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 leading-relaxed">
                      {cmd.justification_ia}
                    </p>
                  )}

                  {receptionnable && <PanneauReception commande={cmd} />}

                  {cmd.statut === 'LITIGE' && (
                    <div className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-800">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      <span>
                        Litige ouvert — quantités manquantes non réglées. La dette reste due tant que
                        l&apos;avoir fournisseur n&apos;est pas émis.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
