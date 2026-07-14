'use client'
import { QrCode, Printer, Send } from 'lucide-react'
import type { EFactureMeta, LigneFacture } from '@/types'
import { formatFcfaFull } from '@/lib/utils'
import { ENTREPRISE_REGISTRY } from '@/lib/registries/entreprise-registry'
import { TVA_PCT, MODE_PAIEMENT_LABEL } from '@/lib/proforma-builder'
import type { ModePaiementFacture } from '@/types'

interface Props {
  type: 'PROFORMA' | 'FACTURE'
  numero: string
  client: string
  zone: string
  date_emission: string
  /** Date de validité (proforma) ou d'échéance (facture). */
  date_limite: string
  lignes: LigneFacture[]
  montant_ht: number
  montant_ttc: number
  remise_globale_pct: number
  conditions_paiement: ModePaiementFacture
  efacture?: EFactureMeta
  onEnvoyer?: () => void
}

/** Rendu imprimable — c'est ce que le client reçoit sur WhatsApp ou en main propre. */
export function DocumentPreview(p: Props) {
  const tva = p.montant_ttc - p.montant_ht
  const brut = p.lignes.reduce((s, l) => s + l.total, 0)
  const remise = brut - p.montant_ht

  return (
    <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
      {/* En-tête émetteur */}
      <div className="px-6 py-5 border-b-2 border-slate-900 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-lg font-black text-slate-900">{ENTREPRISE_REGISTRY.nomLegal}</div>
          <div className="text-[11px] text-slate-500 leading-relaxed mt-1">
            Distribution B2B · {ENTREPRISE_REGISTRY.villes.join(' · ')} — {ENTREPRISE_REGISTRY.pays}<br />
            NIF 1000 4471 · RCCM TG-LOM-2019-B-1284
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {p.type === 'PROFORMA' ? 'Facture proforma' : 'Facture'}
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">{p.numero}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Émise le {p.date_emission}<br />
            {p.type === 'PROFORMA' ? 'Valable jusqu\'au' : 'Échéance'} {p.date_limite}
          </div>
        </div>
      </div>

      {/* Client */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client</div>
        <div className="text-sm font-bold text-slate-900">{p.client}</div>
        <div className="text-[11px] text-slate-500">{p.zone}</div>
      </div>

      {/* Lignes */}
      <table className="w-full text-xs">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="text-left px-6 py-2 font-bold">Désignation</th>
            <th className="text-right px-2 py-2 font-bold">Qté</th>
            <th className="text-right px-2 py-2 font-bold">P.U. HT</th>
            <th className="text-right px-2 py-2 font-bold">Remise</th>
            <th className="text-right px-6 py-2 font-bold">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {p.lignes.map((l, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="px-6 py-2.5">
                <div className="font-medium text-slate-800">{l.produit}</div>
                <div className="font-mono text-[10px] text-slate-400">{l.reference}</div>
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums">{l.quantite}</td>
              <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">
                {l.prix_unitaire.toLocaleString('fr-FR')}
              </td>
              <td className="px-2 py-2.5 text-right text-emerald-600 tabular-nums">
                {l.remise_pct > 0 ? `−${l.remise_pct}%` : '—'}
              </td>
              <td className="px-6 py-2.5 text-right font-bold tabular-nums">
                {l.total.toLocaleString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totaux */}
      <div className="px-6 py-4 border-t-2 border-slate-200 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Sous-total</span>
            <span className="tabular-nums">{brut.toLocaleString('fr-FR')}</span>
          </div>
          {p.remise_globale_pct > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Remise globale {p.remise_globale_pct} %</span>
              <span className="tabular-nums">−{remise.toLocaleString('fr-FR')}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-700 font-semibold pt-1.5 border-t border-slate-100">
            <span>Total HT</span>
            <span className="tabular-nums">{p.montant_ht.toLocaleString('fr-FR')}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>TVA {TVA_PCT} %</span>
            <span className="tabular-nums">{tva.toLocaleString('fr-FR')}</span>
          </div>
          <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
            <span>Total TTC</span>
            <span className="tabular-nums">{formatFcfaFull(p.montant_ttc)}</span>
          </div>
        </div>
      </div>

      {/* Pied — conditions + QR e-facture */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-end justify-between gap-4 flex-wrap">
        <div className="text-[11px] text-slate-500 leading-relaxed">
          <div>
            <span className="font-bold text-slate-700">Conditions de paiement :</span>{' '}
            {MODE_PAIEMENT_LABEL[p.conditions_paiement]}
          </div>
          {p.type === 'PROFORMA' && (
            <div className="mt-1 italic">
              Ce document n&apos;a pas valeur de facture. Il devient commande à votre acceptation,
              et expire le {p.date_limite}.
            </div>
          )}
          {p.efacture?.numero_certification && (
            <div className="mt-1 font-mono text-[10px] text-slate-400">
              Certification {p.efacture.numero_certification} · empreinte {p.efacture.hash_document?.slice(0, 12)}…
            </div>
          )}
        </div>

        {p.efacture?.qr_code_payload && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-16 h-16 rounded border-2 border-slate-300 bg-white flex items-center justify-center">
              <QrCode size={40} className="text-slate-800" />
            </div>
            <span className="text-[9px] text-slate-400 font-medium">Vérification OTR</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-3 border-t border-slate-200 flex items-center gap-2 flex-wrap">
        {p.onEnvoyer && (
          <button type="button" onClick={p.onEnvoyer}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <Send size={12} /> Envoyer au client
          </button>
        )}
        <button type="button"
          onClick={() => { if (typeof window !== 'undefined') window.print() }}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
          <Printer size={12} /> Imprimer / PDF
        </button>
      </div>
    </div>
  )
}
