'use client'

import { useState } from 'react'
import { X, Minus, Plus, Trash2, ShoppingCart, Send } from 'lucide-react'
import { useTerrainWorkflow } from '@distributeur/contexts/TerrainWorkflowContext'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { formatFcfa } from '@distributeur/lib/utils'
import type { CanalCommande } from '@distributeur/lib/terrain-workflow'

interface Props {
  open: boolean
  onClose: () => void
}

const CANAUX: { value: CanalCommande; label: string }[] = [
  { value: 'TERRAIN', label: 'En visite' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'TELEPHONE', label: 'Téléphone' },
]

export function PanierDrawer({ open, onClose }: Props) {
  const { user } = useAuth()
  const {
    panier, panierTotal, changerQuantite, retirerDuPanier, viderPanier, creerCommande,
  } = useTerrainWorkflow()
  const [pdv, setPdv] = useState('')
  const [canal, setCanal] = useState<CanalCommande>('TERRAIN')

  if (!open) return null

  function transmettre() {
    if (!pdv.trim() || panier.length === 0) return
    creerCommande(pdv.trim(), canal, user?.nom ?? 'Terrain')
    setPdv('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-white shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={17} className="text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Panier commande terrain</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {panier.length}
            </span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {panier.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12">
              <ShoppingCart size={28} className="mx-auto mb-2 opacity-40" />
              Panier vide — ajoutez des produits depuis la disponibilité.
            </div>
          ) : (
            panier.map(l => (
              <div key={l.reference} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">{l.nom}</div>
                  <div className="text-[10px] text-slate-400">{formatFcfa(l.prix)} F × {l.quantite}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => changerQuantite(l.reference, l.quantite - 1)}
                    className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-slate-800">{l.quantite}</span>
                  <button
                    type="button"
                    onClick={() => changerQuantite(l.reference, l.quantite + 1)}
                    className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => retirerDuPanier(l.reference)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-50 ml-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {panier.length > 0 && (
          <div className="border-t border-slate-100 p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Point de vente</label>
              <input
                value={pdv}
                onChange={e => setPdv(e.target.value)}
                placeholder="Nom du client / PDV…"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div className="flex gap-1.5">
              {CANAUX.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCanal(c.value)}
                  className={`flex-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors ${
                    canal === c.value ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total</span>
              <span className="font-black text-slate-900">{formatFcfa(panierTotal)} F</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={viderPanier}
                className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Vider
              </button>
              <button
                type="button"
                onClick={transmettre}
                disabled={!pdv.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <Send size={15} /> Transmettre la commande
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
