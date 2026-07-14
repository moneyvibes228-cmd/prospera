'use client'

import { Target, Package, Tag } from 'lucide-react'
import { formatFcfa, formatFcfaFull } from '@distributeur/lib/utils'
import type { CampagneDG } from '@distributeur/lib/marketing-dg-builder'

interface Props {
  campagne: CampagneDG
  compact?: boolean
}

export function CampagneButEtProduits({ campagne, compact = false }: Props) {
  const produits = campagne.produits_detail ?? []

  return (
    <div className={`space-y-3 ${compact ? '' : 'mt-3 pt-3 border-t border-slate-100'}`}>
      <div className={`p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
          <Target size={compact ? 11 : 13} /> But de la campagne
        </div>
        <p className="text-slate-700 leading-relaxed">{campagne.but_campagne}</p>
        {campagne.offre && (
          <p className="mt-2 text-indigo-800 font-medium flex items-start gap-1">
            <Tag size={11} className="shrink-0 mt-0.5" />
            <span><strong>Offre :</strong> {campagne.offre}</span>
          </p>
        )}
        <p className="mt-1.5 text-slate-500 italic">{campagne.objectif}</p>
      </div>

      {produits.length > 0 && (
        <div>
          <div className={`flex items-center gap-1.5 font-bold text-slate-600 uppercase tracking-wide mb-2 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
            <Package size={11} /> Produits & prix ({produits.length})
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className={`w-full ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-2 py-1.5 font-semibold">Produit</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Rôle</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Prix grossiste</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Promo</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Marge</th>
                  {produits.some(p => p.vendu_unites !== undefined) && (
                    <th className="text-right px-2 py-1.5 font-semibold">Vendu</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {produits.map(p => (
                  <tr key={p.reference} className="border-t border-slate-100 bg-white">
                    <td className="px-2 py-1.5">
                      <div className="font-semibold text-slate-800">{p.nom}</div>
                      <div className="text-slate-400 font-mono">{p.reference}</div>
                    </td>
                    <td className="px-2 py-1.5 text-slate-600 max-w-[140px]">{p.role}</td>
                    <td className="px-2 py-1.5 text-right font-bold whitespace-nowrap" title={formatFcfaFull(p.prix_grossiste_fcfa)}>
                      {formatFcfa(p.prix_grossiste_fcfa)}/{p.unite}
                    </td>
                    <td className="px-2 py-1.5 text-right whitespace-nowrap">
                      {p.prix_promo_fcfa ? (
                        <span className="text-emerald-700 font-bold">
                          {formatFcfa(p.prix_promo_fcfa)}
                          {p.remise_pct ? ` (-${p.remise_pct}%)` : ''}
                        </span>
                      ) : p.remise_pct ? (
                        <span className="text-emerald-700 font-bold">-{p.remise_pct}%</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold text-emerald-600">{p.marge_pct}%</td>
                    {produits.some(x => x.vendu_unites !== undefined) && (
                      <td className="px-2 py-1.5 text-right font-bold">
                        {p.vendu_unites !== undefined ? (
                          <>
                            {p.vendu_unites.toLocaleString('fr-FR')}
                            {p.objectif_unites ? (
                              <span className="text-slate-400 font-normal"> / {p.objectif_unites.toLocaleString('fr-FR')}</span>
                            ) : null}
                          </>
                        ) : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
