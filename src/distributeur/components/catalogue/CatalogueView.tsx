'use client'

import { useState, useMemo } from 'react'
import {
  Package, TrendingUp, TrendingDown, AlertTriangle, Sparkles,
  Warehouse, Store, Filter, BarChart3,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { formatFcfa } from '@distributeur/lib/utils'
import {
  buildCatalogueDG, buildSyntheseCatalogueDG, buildAnalysesCatalogueIA,
  filterCatalogueVue, RENTABILITE_STYLE, ENGOUMENT_STYLE, CATEGORIES_CATALOGUE,
  type ProduitCatalogueDG, type VueCatalogueDG, type RentabiliteProduit,
} from '@distributeur/lib/catalogue-dg-builder'

const VUE_OPTIONS: { id: VueCatalogueDG; label: string; icon: typeof Warehouse }[] = [
  { id: 'consolide', label: 'Consolidé', icon: BarChart3 },
  { id: 'lome-port', label: 'Entrepôt Lomé Port', icon: Warehouse },
  { id: 'kara', label: 'Entrepôt Kara', icon: Warehouse },
  { id: 'reseau-pdv', label: 'Réseau points de vente', icon: Store },
]

const ANALYSE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

function ProduitCard({ p, selected, onClick, vue }: {
  p: ProduitCatalogueDG
  selected: boolean
  onClick: () => void
  vue: VueCatalogueDG
}) {
  const rent = RENTABILITE_STYLE[p.rentabilite] ?? RENTABILITE_STYLE.CORRECTE
  const eng = ENGOUMENT_STYLE[p.engouement] ?? ENGOUMENT_STYLE.STABLE
  const stockEntrepot = p.stocks_entrepot[0]
  const rupture = stockEntrepot?.rupture

  return (
    <button type="button" onClick={onClick}
      className={`text-left w-full rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${selected ? 'border-amber-400 shadow-md' : rupture ? 'border-red-200' : 'border-slate-200'}`}>
      {/* Visuel produit */}
      <div className={`h-28 bg-gradient-to-br ${p.visuel.gradient} flex items-center justify-center relative`}>
        <span className="text-5xl drop-shadow-md">{p.visuel.emoji}</span>
        <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-bold bg-white/90 text-slate-700">
          {p.produit.categorie}
        </span>
        {rupture && (
          <span className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full font-bold bg-red-600 text-white">
            RUPTURE
          </span>
        )}
      </div>

      <div className="p-3.5 bg-white">
        <div className="font-bold text-sm text-slate-900 leading-tight">{p.produit.nom}</div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.produit.reference}</div>

        <div className="flex flex-wrap gap-1 mt-2">
          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${rent.className}`}>{rent.label}</span>
          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${eng.className}`}>{eng.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
          <div>
            <div className="text-slate-400">Prix grossiste</div>
            <div className="font-bold text-amber-700">{formatFcfa(p.produit.prix_unitaire)}</div>
          </div>
          <div>
            <div className="text-slate-400">Marge</div>
            <div className="font-bold text-emerald-600">{p.marge_pct}%</div>
          </div>
          {vue === 'reseau-pdv' ? (
            <>
              <div>
                <div className="text-slate-400">PDV approvisionnés</div>
                <div className="font-bold">{p.reseau_pdv.magasins_approvisionnes}</div>
              </div>
              <div>
                <div className="text-slate-400">PDV en rupture</div>
                <div className={`font-bold ${p.reseau_pdv.magasins_en_rupture > 5 ? 'text-red-600' : 'text-slate-700'}`}>
                  {p.reseau_pdv.magasins_en_rupture}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-slate-400">Stock entrepôt</div>
                <div className={`font-bold ${rupture ? 'text-red-600' : 'text-slate-800'}`}>
                  {stockEntrepot?.quantite ?? p.produit.stock}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Sorties/mois</div>
                <div className="font-bold">{p.sorties_mois.toLocaleString('fr-FR')}</div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 mt-2 text-[10px]">
          {p.evolution_demande_pct >= 0
            ? <TrendingUp size={11} className="text-emerald-500" />
            : <TrendingDown size={11} className="text-red-500" />}
          <span className={p.evolution_demande_pct >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
            {p.evolution_demande_pct > 0 ? '+' : ''}{p.evolution_demande_pct}% demande
          </span>
          {p.ruptures_3m > 0 && (
            <span className="text-orange-600 ml-auto">{p.ruptures_3m} rupt./3m</span>
          )}
        </div>
      </div>
    </button>
  )
}

export function CatalogueView() {
  const [vue, setVue] = useState<VueCatalogueDG>('consolide')
  const [categorie, setCategorie] = useState<string>('toutes')
  const [filtreRentabilite, setFiltreRentabilite] = useState<string>('tous')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const all = useMemo(() => buildCatalogueDG(), [])
  const synthese = useMemo(() => buildSyntheseCatalogueDG(all), [all])
  const analyses = useMemo(() => buildAnalysesCatalogueIA(all), [all])

  const filtered = useMemo(() => {
    let list = filterCatalogueVue(all, vue)
    if (categorie !== 'toutes') list = list.filter(p => p.produit.categorie === categorie)
    if (filtreRentabilite !== 'tous') list = list.filter(p => p.rentabilite === filtreRentabilite)
    return list.sort((a, b) => b.ca_mois - a.ca_mois)
  }, [all, vue, categorie, filtreRentabilite])

  const selected = all.find(p => p.produit.id === selectedId) ?? null

  const topEngouement = useMemo(() => [...all].filter(p => p.engouement === 'FORT').sort((a, b) => b.evolution_demande_pct - a.evolution_demande_pct).slice(0, 3), [all])
  const topRuptures = useMemo(() => [...all].sort((a, b) => b.ruptures_3m - a.ruptures_3m).slice(0, 3), [all])
  const topDeficitaires = useMemo(() => [...all].filter(p => p.rentabilite === 'DEFICITAIRE' || p.rentabilite === 'TENSION').sort((a, b) => a.marge_pct - b.marge_pct), [all])

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Pilotage catalogue & assortiment"
        subtitle="Vue DG — 12 SKU · entrepôts & réseau PDV · rentabilité · engouement · ruptures · analyses IA"
        badge={`${synthese.total_sku} références`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'CA catalogue/mois', value: formatFcfa(synthese.ca_catalogue_mois), color: 'text-amber-700' },
          { label: 'Marge moyenne', value: `${synthese.marge_moyenne}%`, color: 'text-emerald-600' },
          { label: 'Ruptures actives', value: String(synthese.ruptures_actives), color: 'text-red-600' },
          { label: 'SKU sous tension', value: String(synthese.sku_deficitaires), color: 'text-orange-600' },
          { label: 'Fort engouement', value: String(synthese.engouement_fort), color: 'text-emerald-600' },
          { label: 'Ruptures/3m', value: String(synthese.ruptures_3m_total), color: 'text-orange-600' },
          { label: 'PDV en rupture', value: String(synthese.pdv_en_rupture_total), color: 'text-red-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-sm font-black mt-0.5 ${k.color ?? 'text-slate-800'}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Classements rapides */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3">
          <div className="text-[10px] font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1">
            <TrendingUp size={11} /> Top engouement
          </div>
          {topEngouement.map((p, i) => (
            <div key={p.produit.id} className="text-xs py-1 border-b border-emerald-100 last:border-0 flex justify-between">
              <span>{i + 1}. {p.produit.nom.split(' ').slice(0, 3).join(' ')}</span>
              <span className="font-bold text-emerald-700">+{p.evolution_demande_pct}%</span>
            </div>
          ))}
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-3">
          <div className="text-[10px] font-bold text-orange-800 uppercase mb-2 flex items-center gap-1">
            <AlertTriangle size={11} /> Plus de ruptures (3m)
          </div>
          {topRuptures.map((p, i) => (
            <div key={p.produit.id} className="text-xs py-1 border-b border-orange-100 last:border-0 flex justify-between">
              <span>{i + 1}. {p.produit.nom.split(' ').slice(0, 3).join(' ')}</span>
              <span className="font-bold text-orange-700">{p.ruptures_3m} rupt.</span>
            </div>
          ))}
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-3">
          <div className="text-[10px] font-bold text-red-800 uppercase mb-2 flex items-center gap-1">
            <TrendingDown size={11} /> Coût sans rentabilité
          </div>
          {topDeficitaires.slice(0, 3).map((p, i) => (
            <div key={p.produit.id} className="text-xs py-1 border-b border-red-100 last:border-0 flex justify-between">
              <span>{i + 1}. {p.produit.nom.split(' ').slice(0, 3).join(' ')}</span>
              <span className="font-bold text-red-700">{p.marge_pct}% · {p.rotation_jours}j rot.</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {/* Filtres vue */}
          <div className="flex flex-wrap items-center gap-2">
            {VUE_OPTIONS.map(v => {
              const Icon = v.icon
              return (
                <button key={v.id} type="button" onClick={() => setVue(v.id)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1 ${vue === v.id ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  <Icon size={11} /> {v.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={11} className="text-slate-400" />
            <button type="button" onClick={() => setCategorie('toutes')}
              className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${categorie === 'toutes' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
              Toutes catégories
            </button>
            {CATEGORIES_CATALOGUE.map(cat => (
              <button key={cat} type="button" onClick={() => setCategorie(cat)}
                className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${categorie === cat ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {cat}
              </button>
            ))}
            <span className="w-px h-4 bg-slate-200" />
            {(['tous', 'FORTE', 'TENSION', 'DEFICITAIRE'] as const).map(r => (
              <button key={r} type="button" onClick={() => setFiltreRentabilite(r)}
                className={`text-[9px] px-2 py-1 rounded-full font-bold ${filtreRentabilite === r ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400'}`}>
                {r === 'tous' ? 'Toute rentabilité' : RENTABILITE_STYLE[r as RentabiliteProduit].label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(p => (
              <ProduitCard
                key={p.produit.id}
                p={p}
                vue={vue}
                selected={selectedId === p.produit.id}
                onClick={() => setSelectedId(prev => prev === p.produit.id ? null : p.produit.id)}
              />
            ))}
          </div>
        </div>

        {/* Analyses IA */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-900">Analyses IA assortiment</h3>
            </div>
            <div className="space-y-2">
              {analyses.map((a, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${ANALYSE_STYLE[a.severite]}`}>
                  <div className="font-bold">{a.titre}</div>
                  <div className="text-[10px] opacity-90 mt-0.5">{a.detail}</div>
                  <div className="text-[10px] font-semibold mt-1 text-slate-700">→ {a.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fiche produit détaillée */}
      {selected && (
        <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className={`w-24 h-24 rounded-xl bg-gradient-to-br ${selected.visuel.gradient} flex items-center justify-center shrink-0`}>
              <span className="text-4xl">{selected.visuel.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900">{selected.produit.nom}</h3>
              <p className="text-sm text-slate-500">{selected.produit.reference} · {selected.produit.categorie}</p>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">{selected.synthese_ia}</p>
              {selected.alerte && (
                <p className="text-xs text-red-700 font-medium mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> {selected.alerte}
                </p>
              )}
            </div>
            <AiBadge variant="small" label="Analyse SKU" confidence={Math.round(selected.marge_pct * 5)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 rounded-lg p-2.5"><div className="text-slate-400">CA/mois</div><div className="font-bold">{formatFcfa(selected.ca_mois)}</div></div>
            <div className="bg-slate-50 rounded-lg p-2.5"><div className="text-slate-400">Coût revient</div><div className="font-bold">{formatFcfa(selected.cout_revient)}</div></div>
            <div className="bg-slate-50 rounded-lg p-2.5"><div className="text-slate-400">Marge</div><div className="font-bold text-emerald-600">{selected.marge_pct}%</div></div>
            <div className="bg-slate-50 rounded-lg p-2.5"><div className="text-slate-400">Rotation</div><div className="font-bold">{selected.rotation_jours}j</div></div>
            <div className="bg-slate-50 rounded-lg p-2.5"><div className="text-slate-400">Stock immobilisé</div><div className="font-bold">{formatFcfa(selected.valeur_stock_immobilisee)}</div></div>
            <div className="bg-slate-50 rounded-lg p-2.5"><div className="text-slate-400">Ruptures 3m</div><div className="font-bold text-orange-600">{selected.ruptures_3m} ({selected.jours_rupture_3m}j)</div></div>
            <div className="bg-slate-50 rounded-lg p-2.5"><div className="text-slate-400">PDV en rupture</div><div className="font-bold text-red-600">{selected.reseau_pdv.magasins_en_rupture}</div></div>
            <div className="bg-slate-50 rounded-lg p-2.5"><div className="text-slate-400">Demande PDV/mois</div><div className="font-bold">{selected.reseau_pdv.demande_mois_unites.toLocaleString('fr-FR')}</div></div>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <Warehouse size={11} /> Stock entrepôts
              </div>
              {selected.stocks_entrepot.map(s => (
                <div key={s.entrepot} className="flex justify-between text-xs py-1">
                  <span>{s.entrepot}</span>
                  <span className={s.rupture ? 'text-red-600 font-bold' : 'font-bold'}>{s.quantite} / seuil {s.seuil}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-violet-50 rounded-xl">
              <div className="text-[10px] font-bold text-violet-700 uppercase mb-2 flex items-center gap-1">
                <Store size={11} /> Réseau points de vente
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span>Magasins approvisionnés</span><span className="font-bold">{selected.reseau_pdv.magasins_approvisionnes}</span></div>
                <div className="flex justify-between"><span>Stock moyen PDV</span><span className="font-bold">{selected.reseau_pdv.stock_moyen_unites} u.</span></div>
                <div className="flex justify-between"><span>En rupture réseau</span><span className="font-bold text-red-600">{selected.reseau_pdv.magasins_en_rupture}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
