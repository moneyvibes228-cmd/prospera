'use client'

import { useMemo, useState } from 'react'
import { Search, Package, CheckCircle2, AlertTriangle, XCircle, ShoppingCart, Info } from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { PanierDrawer } from '@distributeur/components/terrain/PanierDrawer'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useTerrainWorkflow } from '@distributeur/contexts/TerrainWorkflowContext'
import { REGISTRE_STOCK } from '@distributeur/lib/registries/stock-registry'
import { formatFcfa } from '@distributeur/lib/utils'

type Dispo = 'DISPONIBLE' | 'LIMITE' | 'RUPTURE'

const DISPO_STYLE: Record<Dispo, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  DISPONIBLE: { label: 'Disponible', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  LIMITE: { label: 'Stock limité', className: 'bg-amber-50 text-amber-700 ring-amber-200', icon: AlertTriangle },
  RUPTURE: { label: 'Rupture', className: 'bg-red-50 text-red-700 ring-red-200', icon: XCircle },
}

/**
 * Le commercial n'a pas besoin du niveau de stock exact — il a besoin de savoir
 * s'il peut vendre. On expose un statut, pas une quantité d'entrepôt.
 */
function dispoDe(stock: number, seuil: number): Dispo {
  if (stock <= 0) return 'RUPTURE'
  if (stock < seuil) return 'LIMITE'
  return 'DISPONIBLE'
}

export function DisponibiliteView() {
  const { user } = useAuth()
  const { ajouterAuPanier, panierCount, panierTotal, lastAction, clearLastAction } = useTerrainWorkflow()
  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState<string>('TOUTES')
  const [panierOuvert, setPanierOuvert] = useState(false)

  const freelance = user?.role === 'FREELANCE'

  // Un produit peut exister dans plusieurs entrepôts : le commercial vend une référence,
  // pas un emplacement — on consolide les lignes par référence.
  const catalogue = useMemo(() => {
    const parRef = new Map<string, { reference: string; nom: string; categorie: string; stock: number; seuil: number; prix: number }>()
    for (const p of REGISTRE_STOCK) {
      const existant = parRef.get(p.reference)
      if (existant) {
        existant.stock += p.stock
        existant.seuil += p.seuil
      } else {
        parRef.set(p.reference, {
          reference: p.reference, nom: p.nom, categorie: p.categorie,
          stock: p.stock, seuil: p.seuil, prix: p.prix_unitaire,
        })
      }
    }
    return [...parRef.values()].sort((a, b) => a.nom.localeCompare(b.nom))
  }, [])

  const categories = useMemo(
    () => ['TOUTES', ...new Set(catalogue.map(p => p.categorie))].sort(),
    [catalogue],
  )

  const produits = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return catalogue.filter(p =>
      (categorie === 'TOUTES' || p.categorie === categorie) &&
      (!q || p.nom.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q)),
    )
  }, [catalogue, categorie, recherche])

  const ruptures = catalogue.filter(p => dispoDe(p.stock, p.seuil) === 'RUPTURE').length
  const limites = catalogue.filter(p => dispoDe(p.stock, p.seuil) === 'LIMITE').length

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title="Disponibilité produits"
        subtitle="Ce que vous pouvez vendre aujourd'hui"
        badge={`${catalogue.length} références`}
      />

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <Info size={14} className="shrink-0 mt-0.5 text-slate-400" />
        <span>
          {freelance ? (
            <>Les prix affichés sont le <strong>tarif grossiste société</strong> — votre coût d&apos;achat.
            Le prix que vous facturez à votre client reste le vôtre.</>
          ) : (
            <>Prix de cession société. En cas de stock limité, la quantité est confirmée à la validation
            de la commande par l&apos;entrepôt.</>
          )}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="text-xl font-bold text-emerald-600">{catalogue.length - ruptures - limites}</div>
          <div className="text-[11px] text-slate-500">Références disponibles</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="text-xl font-bold text-amber-600">{limites}</div>
          <div className="text-[11px] text-slate-500">Stock limité — à confirmer</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="text-xl font-bold text-red-600">{ruptures}</div>
          <div className="text-[11px] text-slate-500">En rupture — ne pas promettre</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un produit ou une référence…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>
        {categories.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setCategorie(c)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              categorie === c ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {c === 'TOUTES' ? 'Toutes' : c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">Produit</th>
              <th className="text-left font-semibold px-4 py-2.5">Catégorie</th>
              <th className="text-left font-semibold px-4 py-2.5">Disponibilité</th>
              <th className="text-right font-semibold px-4 py-2.5">{freelance ? 'Votre coût' : 'Prix société'}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {produits.map(p => {
              const dispo = dispoDe(p.stock, p.seuil)
              const style = DISPO_STYLE[dispo]
              const Icon = style.icon
              return (
                <tr key={p.reference} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{p.nom}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.reference}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{p.categorie}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 ring-inset ${style.className}`}>
                      <Icon size={10} /> {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                    {formatFcfa(p.prix)} F
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      disabled={dispo === 'RUPTURE'}
                      onClick={() => ajouterAuPanier({ reference: p.reference, nom: p.nom, prix: p.prix })}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <ShoppingCart size={10} /> Ajouter
                    </button>
                  </td>
                </tr>
              )
            })}
            {produits.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  <Package size={20} className="mx-auto mb-2 opacity-50" />
                  Aucun produit ne correspond à votre recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {panierCount > 0 && (
        <button
          type="button"
          onClick={() => setPanierOuvert(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white pl-4 pr-5 py-3 shadow-lg font-semibold text-sm"
        >
          <ShoppingCart size={16} />
          <span>Panier</span>
          <span className="bg-white/25 rounded-full px-2 py-0.5 text-xs">{panierCount}</span>
          <span className="text-xs font-normal opacity-90">· {formatFcfa(panierTotal)} F</span>
        </button>
      )}

      <PanierDrawer open={panierOuvert} onClose={() => setPanierOuvert(false)} />
      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
