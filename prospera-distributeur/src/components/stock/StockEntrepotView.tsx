'use client'

import { useMemo, useState } from 'react'
import { Package, AlertTriangle, Search, Snowflake, Layers } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'
import { REGISTRE_STOCK } from '@/lib/registries/stock-registry'
import {
  FICHES_LOGISTIQUES, getTopologie, ordreAllee,
} from '@/lib/registries/entrepot-logistique-registry'
import { buildBonsPreparation } from '@/lib/picking-engine'

/**
 * Le stock vu depuis le quai.
 *
 * Pas de prix de vente, pas de marge, pas de rentabilité, pas de CA : le magasinier n'a
 * aucune décision à prendre avec ces chiffres, et ils ne le regardent pas. Ce qu'il lui
 * faut tient en cinq colonnes : où est le produit, combien il en reste, combien est déjà
 * réservé pour les commandes du jour, combien il peut donc réellement promettre, et
 * combien pèse une palette.
 */
export function StockEntrepotView({ entrepot }: { entrepot: string }) {
  const [recherche, setRecherche] = useState('')
  const [alleeFiltre, setAlleeFiltre] = useState<string>('toutes')

  const bons = useMemo(() => buildBonsPreparation([entrepot]), [entrepot])

  /** Réservé = ce que les bons de préparation du jour ont déjà engagé sur chaque référence. */
  const reserve = useMemo(() => {
    const map = new Map<string, number>()
    for (const bon of bons) {
      if (bon.blocage !== 'AUCUN') continue
      for (const ligne of bon.lignes) {
        map.set(ligne.produit_ref, (map.get(ligne.produit_ref) ?? 0) + ligne.quantite_servie)
      }
    }
    return map
  }, [bons])

  const topologie = getTopologie(entrepot)

  const lignes = useMemo(() => {
    return REGISTRE_STOCK
      .filter(p => p.entrepot === entrepot)
      .map(p => {
        const fiche = FICHES_LOGISTIQUES.find(f => f.produit_ref === p.reference)!
        const reserveQte = reserve.get(p.reference) ?? 0
        return {
          produit: p,
          fiche,
          reserve: reserveQte,
          disponible: p.stock - reserveQte,
          palettes: Math.floor(p.stock / fiche.unites_par_palette),
        }
      })
      .filter(l => alleeFiltre === 'toutes' || l.fiche.allee === alleeFiltre)
      .filter(l =>
        recherche === ''
        || l.produit.nom.toLowerCase().includes(recherche.toLowerCase())
        || l.produit.reference.toLowerCase().includes(recherche.toLowerCase())
        || l.fiche.emplacement.toLowerCase().includes(recherche.toLowerCase()))
      // Ordre du parcours physique — comme dans les allées.
      .sort((a, b) =>
        ordreAllee(entrepot, a.fiche.allee) - ordreAllee(entrepot, b.fiche.allee)
        || a.fiche.emplacement.localeCompare(b.fiche.emplacement))
  }, [entrepot, reserve, recherche, alleeFiltre])

  const sousSeuil = lignes.filter(l => l.produit.stock < l.produit.seuil)
  const surReserve = lignes.filter(l => l.disponible < 0)

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title={`Stock — ${entrepot}`}
        subtitle="Quantités, emplacements et disponible réel après réservation des commandes du jour"
        badge={`${lignes.length} références`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Références en stock', value: String(lignes.length), color: 'text-slate-800' },
          {
            label: 'Sous le seuil',
            value: String(sousSeuil.length),
            color: sousSeuil.length > 0 ? 'text-red-600' : 'text-emerald-600',
          },
          {
            label: 'Palettes stockées',
            value: lignes.reduce((s, l) => s + l.palettes, 0).toLocaleString('fr-FR'),
            color: 'text-slate-800',
          },
          {
            label: 'Emplacements occupés',
            value: `${Math.round((lignes.length / topologie.emplacements_total) * 100 * 10) / 10} %`,
            color: 'text-slate-800',
          },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={cn('text-base font-black mt-1', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {surReserve.length > 0 && (
        <p className="text-xs text-red-700 font-medium flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          {surReserve.length} référence{surReserve.length > 1 ? 's' : ''} promise{surReserve.length > 1 ? 's' : ''} au-delà du stock
          physique — une commande partira incomplète si rien n&apos;est arbitré.
        </p>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Produit, référence ou emplacement…"
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-slate-800 focus:outline-none w-64"
          />
        </div>

        <button
          type="button"
          onClick={() => setAlleeFiltre('toutes')}
          className={cn(
            'text-[10px] font-bold px-2.5 py-1.5 rounded-lg',
            alleeFiltre === 'toutes' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
          )}
        >
          Toutes les allées
        </button>
        {topologie.zones.filter(z => z.code !== 'Z').map(zone => (
          <button
            key={zone.code}
            type="button"
            onClick={() => setAlleeFiltre(zone.code)}
            title={zone.libelle}
            className={cn(
              'text-[10px] font-bold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1',
              alleeFiltre === zone.code ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
            )}
          >
            {zone.froid && <Snowflake size={10} />} Allée {zone.code}
          </button>
        ))}
      </div>

      {/* Le stock, dans l'ordre des allées */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_repeat(4,auto)] gap-3 px-4 py-2.5 text-[9px] font-bold uppercase text-slate-400 bg-slate-50 border-b border-slate-200">
          <span className="w-16">Empl.</span>
          <span>Produit</span>
          <span className="text-right w-20">Physique</span>
          <span className="text-right w-20">Réservé</span>
          <span className="text-right w-20">Disponible</span>
          <span className="text-right w-24">Palette</span>
        </div>

        {lignes.map(l => {
          const critique = l.produit.stock < l.produit.seuil
          return (
            <div
              key={l.produit.id}
              className={cn(
                'grid grid-cols-[auto_1fr_repeat(4,auto)] gap-3 px-4 py-2.5 text-xs items-center border-b border-slate-50 last:border-0',
                critique && 'bg-red-50/40',
              )}
            >
              <span className="font-mono font-bold text-slate-600 w-16">{l.fiche.emplacement}</span>

              <span className="min-w-0">
                <span className="font-semibold text-slate-800 truncate block">{l.produit.nom}</span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                  {l.produit.reference}
                  {l.fiche.froid && (
                    <span className="text-sky-600 font-bold inline-flex items-center gap-0.5">
                      <Snowflake size={9} /> froid
                    </span>
                  )}
                  {l.fiche.fragile && <span className="text-amber-600 font-bold">fragile</span>}
                </span>
              </span>

              <span className={cn('text-right tabular-nums font-bold w-20', critique ? 'text-red-600' : 'text-slate-800')}>
                {l.produit.stock.toLocaleString('fr-FR')}
                <span className="block text-[9px] font-normal text-slate-400">seuil {l.produit.seuil}</span>
              </span>

              <span className="text-right tabular-nums text-amber-600 font-semibold w-20">
                {l.reserve > 0 ? `−${l.reserve.toLocaleString('fr-FR')}` : '—'}
              </span>

              <span className={cn(
                'text-right tabular-nums font-black w-20',
                l.disponible < 0 ? 'text-red-600' : l.disponible < l.produit.seuil ? 'text-amber-600' : 'text-emerald-600',
              )}>
                {l.disponible.toLocaleString('fr-FR')}
              </span>

              <span className="text-right tabular-nums text-slate-500 w-24 text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <Layers size={10} className="text-slate-300" />
                  {l.palettes} pal.
                </span>
                <span className="block text-[9px] text-slate-400">{l.fiche.poids_kg} kg/u.</span>
              </span>
            </div>
          )
        })}

        {lignes.length === 0 && (
          <p className="text-xs text-slate-400 p-6 text-center flex items-center justify-center gap-2">
            <Package size={14} /> Aucune référence ne correspond.
          </p>
        )}
      </div>
    </div>
  )
}
