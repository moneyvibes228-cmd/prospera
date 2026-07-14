'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Package, AlertTriangle, Warehouse, Truck, Sparkles, Filter,
  BarChart3, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Clock,
  TrendingDown, TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { formatFcfa } from '@distributeur/lib/utils'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { getPerimetreLogistique } from '@distributeur/lib/perimetre-logistique'
import {
  buildStockDG, buildSyntheseStockDG, buildEntrepotsSynthese,
  buildExpeditionsJour, buildAnalysesStockIA, filterStockVue,
  STATUT_STOCK_STYLE, CATEGORIES_CATALOGUE,
  type ProduitStockDG, type VueStockDG, type StatutStockDG,
} from '@distributeur/lib/stock-dg-builder'
import { RENTABILITE_STYLE } from '@distributeur/lib/catalogue-dg-builder'

const VUE_OPTIONS: { id: VueStockDG; label: string; icon: typeof Warehouse }[] = [
  { id: 'consolide', label: 'Vue globale', icon: BarChart3 },
  { id: 'lome-port', label: 'Lomé Port', icon: Warehouse },
  { id: 'kara', label: 'Kara', icon: Warehouse },
  { id: 'alertes', label: 'Alertes & ruptures', icon: AlertTriangle },
  { id: 'preparation', label: 'Préparation commandes', icon: Package },
]

const EXPEDITION_STYLE = {
  PREPARATION: 'bg-amber-100 text-amber-800',
  EN_ROUTE: 'bg-sky-100 text-sky-800',
  LIVRE: 'bg-emerald-100 text-emerald-800',
  RETARD: 'bg-red-100 text-red-800',
}

const MOUVEMENT_ICON = {
  ENTREE: ArrowDownToLine,
  SORTIE: ArrowUpFromLine,
  TRANSFERT: RefreshCw,
  AJUSTEMENT: RefreshCw,
}

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm min-w-[3px] ${i === data.length - 1 && v <= (data[0] ?? v) ? 'bg-red-400' : 'bg-slate-300'}`}
          style={{ height: `${Math.max(20, ((v - min) / range) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function ProduitStockCard({ p, selected, onClick, entrepotFiltre }: {
  p: ProduitStockDG
  selected: boolean
  onClick: () => void
  entrepotFiltre?: string
}) {
  const statut = STATUT_STOCK_STYLE[p.statut_stock]
  const stockLigne = entrepotFiltre
    ? p.stocks_entrepot.find(e => e.entrepot === entrepotFiltre)
    : p.stocks_entrepot[0]
  const qty = stockLigne?.quantite ?? p.produit.stock
  const seuil = stockLigne?.seuil ?? p.produit.seuil

  return (
    <button type="button" onClick={onClick}
      className={`text-left w-full rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${selected ? 'border-amber-400 shadow-md' : p.statut_stock === 'CRITIQUE' ? 'border-red-300' : 'border-slate-200'}`}>
      <div className={`h-24 bg-gradient-to-br ${p.visuel.gradient} flex items-center justify-center relative`}>
        <span className="text-4xl drop-shadow-md">{p.visuel.emoji}</span>
        <span className={`absolute top-2 right-2 text-[8px] px-2 py-0.5 rounded-full font-bold ${statut.className}`}>
          {statut.label}
        </span>
        <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-bold bg-white/90 text-slate-700">
          {p.produit.categorie}
        </span>
      </div>

      <div className="p-3.5 bg-white">
        <div className="font-bold text-sm text-slate-900 leading-tight">{p.produit.nom}</div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.produit.reference}</div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
          <div>
            <div className="text-slate-400">Stock</div>
            <div className={`font-black text-sm ${p.statut_stock === 'CRITIQUE' ? 'text-red-600' : 'text-slate-800'}`}>
              {qty.toLocaleString('fr-FR')}
            </div>
            <div className="text-slate-400">seuil {seuil}</div>
          </div>
          <div>
            <div className="text-slate-400">Couverture</div>
            <div className={`font-bold ${p.couverture_jours <= 3 ? 'text-red-600' : p.couverture_jours > 20 ? 'text-violet-600' : 'text-slate-800'}`}>
              {p.couverture_jours}j
            </div>
          </div>
          <div>
            <div className="text-slate-400">Taux service</div>
            <div className={`font-bold ${p.taux_service_pct < 85 ? 'text-orange-600' : 'text-emerald-600'}`}>
              {p.taux_service_pct}%
            </div>
          </div>
        </div>

        <div className="mt-2">
          <Sparkline data={p.evolution_stock_7j} />
        </div>

        <div className="flex flex-wrap gap-1 mt-2 text-[8px]">
          {p.commandes_a_preparer > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
              {p.commandes_a_preparer} cmd. à préparer
            </span>
          )}
          {p.reseau_pdv.magasins_en_rupture > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
              {p.reseau_pdv.magasins_en_rupture} PDV rupture
            </span>
          )}
          {p.ruptures_3m > 2 && (
            <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">
              {p.ruptures_3m} rupt./3m
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function StockView() {
  const { user } = useAuth()
  // Le responsable stock arbitre en coût d'achat et en couverture ; la marge commerciale
  // et le CA par produit ne sont pas ses leviers — ils appartiennent à la direction.
  const { voitValeurCommerciale } = getPerimetreLogistique(user)

  const [vue, setVue] = useState<VueStockDG>('consolide')
  const [categorie, setCategorie] = useState('toutes')
  const [statutFiltre, setStatutFiltre] = useState<string>('tous')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const all = useMemo(() => buildStockDG(), [])
  const synthese = useMemo(() => buildSyntheseStockDG(all), [all])
  const entrepots = useMemo(() => buildEntrepotsSynthese(all), [all])
  const expeditions = useMemo(() => buildExpeditionsJour(), [])
  const analyses = useMemo(() => buildAnalysesStockIA(all), [all])

  const entrepotFiltre = vue === 'lome-port' ? 'Lomé Port' : vue === 'kara' ? 'Kara' : undefined

  const filtered = useMemo(() => {
    let list = filterStockVue(all, vue)
    if (categorie !== 'toutes') list = list.filter(p => p.produit.categorie === categorie)
    if (statutFiltre !== 'tous') list = list.filter(p => p.statut_stock === statutFiltre)
    const prio = (s: StatutStockDG) => ({ CRITIQUE: 0, ALERTE: 1, SURSTOCK: 2, OK: 3 }[s])
    return list.sort((a, b) => prio(a.statut_stock) - prio(b.statut_stock) || a.couverture_jours - b.couverture_jours)
  }, [all, vue, categorie, statutFiltre])

  const selected = all.find(p => p.produit.id === selectedId) ?? null

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Pilotage stock & logistique"
        subtitle={voitValeurCommerciale
          ? 'Multi-entrepôts · couverture · expéditions · ruptures · rentabilité produit · analyses IA'
          : 'Multi-entrepôts · couverture · expéditions · ruptures · préparation commandes · analyses IA'}
        badge={`${synthese.total_sku} références`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: voitValeurCommerciale ? 'Valeur stock (prix)' : 'Stock immobilisé', value: formatFcfa(synthese.valeur_stock_total), color: 'text-amber-700' },
          { label: 'Ruptures actives', value: String(synthese.ruptures_actives), color: 'text-red-600' },
          { label: 'Sous seuil', value: String(synthese.alertes_seuil), color: 'text-orange-600' },
          { label: 'Couverture moy.', value: `${synthese.couverture_moyenne}j`, color: 'text-slate-800' },
          { label: 'Taux service', value: `${synthese.taux_service_moyen}%`, color: 'text-emerald-600' },
          { label: 'Cmd. à préparer', value: String(synthese.commandes_a_preparer), color: 'text-amber-700' },
          { label: 'PDV en rupture', value: String(synthese.pdv_en_rupture), color: 'text-red-600' },
          { label: 'Ruptures/3m', value: String(synthese.ruptures_3m), color: 'text-orange-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-sm font-black mt-0.5 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Entrepôts */}
      <div className="grid md:grid-cols-2 gap-3">
        {entrepots.map(e => (
          <div key={e.nom} className={`rounded-xl border p-4 ${e.sku_rupture > 0 ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse size={16} className="text-orange-600" />
                <span className="font-bold text-sm">{e.nom}</span>
              </div>
              <span className="text-xs text-slate-500">{e.sku_total} SKU · {e.expeditions_jour} expéd. jour</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 text-[10px]">
              <div><div className="text-slate-400">Occupation</div><div className="font-bold">{e.occupation_pct}%</div></div>
              <div><div className="text-slate-400">Valeur stock</div><div className="font-bold">{formatFcfa(e.valeur_stock)}</div></div>
              <div><div className="text-slate-400">Sorties/jour</div><div className="font-bold">{e.sorties_jour.toLocaleString('fr-FR')}</div></div>
              <div><div className="text-slate-400">Ruptures</div><div className={`font-bold ${e.sku_rupture ? 'text-red-600' : 'text-emerald-600'}`}>{e.sku_rupture}</div></div>
            </div>
            {e.alertes.length > 0 && (
              <div className="mt-2 text-[10px] text-red-700 font-medium">
                ⚠ {e.alertes.join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {/* Vues */}
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
              Toutes
            </button>
            {CATEGORIES_CATALOGUE.map(cat => (
              <button key={cat} type="button" onClick={() => setCategorie(cat)}
                className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${categorie === cat ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {cat}
              </button>
            ))}
            <span className="w-px h-4 bg-slate-200" />
            {(['tous', 'CRITIQUE', 'ALERTE', 'SURSTOCK', 'OK'] as const).map(s => (
              <button key={s} type="button" onClick={() => setStatutFiltre(s)}
                className={`text-[9px] px-2 py-1 rounded-full font-bold ${statutFiltre === s ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400'}`}>
                {s === 'tous' ? 'Tous statuts' : STATUT_STOCK_STYLE[s as StatutStockDG].label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">{filtered.length} produit{filtered.length > 1 ? 's' : ''} — cliquez pour la fiche détaillée</div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(p => (
              <ProduitStockCard
                key={p.produit.id}
                p={p}
                entrepotFiltre={entrepotFiltre}
                selected={selectedId === p.produit.id}
                onClick={() => setSelectedId(prev => prev === p.produit.id ? null : p.produit.id)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar : expéditions + IA */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={14} className="text-sky-600" />
              <h3 className="text-sm font-bold text-slate-800">Expéditions du jour</h3>
            </div>
            <div className="space-y-2">
              {expeditions.map(exp => (
                <div key={exp.id} className="p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold">{exp.id}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${EXPEDITION_STYLE[exp.statut]}`}>
                      {exp.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{exp.heure} · {exp.entrepot}</div>
                  <div className="text-[10px] mt-1">{exp.destination}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{exp.nb_lignes} lignes · {exp.unites} u.{exp.chauffeur ? ` · ${exp.chauffeur}` : ''}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-900">Analyses IA logistique</h3>
            </div>
            <div className="space-y-2">
              {analyses.map((a, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${a.severite === 'CRITIQUE' ? 'border-red-200 bg-red-50' : a.severite === 'HAUTE' ? 'border-orange-200 bg-orange-50' : 'border-sky-200 bg-sky-50'}`}>
                  <div className="font-bold">{a.titre}</div>
                  <div className="text-[10px] opacity-90 mt-0.5">{a.detail}</div>
                  <div className="text-[10px] font-semibold mt-1 text-slate-700">→ {a.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fiche détaillée produit */}
      {selected && (
        <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${selected.visuel.gradient} flex items-center justify-center shrink-0`}>
              <span className="text-3xl">{selected.visuel.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900">{selected.produit.nom}</h3>
              <p className="text-sm text-slate-500">{selected.produit.reference} · {selected.produit.categorie}</p>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">{selected.synthese_logistique_ia}</p>
              <p className="text-xs font-semibold text-indigo-700 mt-2 flex items-center gap-1">
                <Sparkles size={11} /> {selected.recommandation_ia}
              </p>
            </div>
            <AiBadge variant="small" label="Analyse stock" confidence={selected.taux_service_pct} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            {[
              { label: 'Stock total', value: selected.produit.stock.toLocaleString('fr-FR') + ' u.' },
              { label: 'Couverture', value: `${selected.couverture_jours} jours`, alert: selected.couverture_jours <= 3 },
              { label: 'Taux service', value: `${selected.taux_service_pct}%` },
              { label: 'Sorties/mois', value: selected.sorties_mois.toLocaleString('fr-FR') },
              { label: 'Coût immobilisé', value: formatFcfa(selected.valeur_stock_cout) },
              { label: 'Rotation', value: `${selected.rotation_jours}j` },
              // Valeur au prix de vente et marge : décisions commerciales, pas logistiques.
              ...(voitValeurCommerciale
                ? [
                  { label: 'Valeur stock', value: formatFcfa(selected.valeur_stock_immobilisee) },
                  { label: 'Marge', value: `${selected.marge_pct}%` },
                ]
                : []),
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2.5">
                <div className="text-slate-400">{k.label}</div>
                <div className={`font-bold ${k.alert ? 'text-red-600' : ''}`}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {/* Stock par entrepôt */}
            <div className="p-3 bg-slate-50 rounded-xl md:col-span-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Stock par entrepôt</div>
              {selected.stocks_entrepot.map(s => {
                const pct = Math.min(100, Math.round((s.quantite / (s.seuil * 3)) * 100))
                return (
                  <div key={s.entrepot} className="mb-3">
                    <div className="flex justify-between text-xs">
                      <span>{s.entrepot}</span>
                      <span className={s.rupture ? 'text-red-600 font-bold' : 'font-bold'}>{s.quantite} / seuil {s.seuil}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${s.rupture ? 'bg-red-500' : pct < 50 ? 'bg-orange-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Fournisseur */}
            <div className="p-3 bg-amber-50 rounded-xl">
              <div className="text-[10px] font-bold text-amber-800 uppercase mb-2">Fournisseur & réappro</div>
              <div className="text-xs space-y-1">
                <div className="font-bold">{selected.fournisseur.nom}</div>
                <div className="flex justify-between"><span>Délai habituel</span><span className="font-bold">{selected.fournisseur.delai_jours}j</span></div>
                <div className="flex justify-between"><span>Dernière commande</span><span className="font-bold">{selected.fournisseur.derniere_commande}</span></div>
                <div className="flex justify-between"><span>En cours</span><span className="font-bold">{selected.fournisseur.qte_en_cours.toLocaleString('fr-FR')} u.</span></div>
                {selected.fournisseur.prochaine_livraison && (
                  <div className="flex justify-between text-emerald-700"><span>Prochaine livraison</span><span className="font-bold">{selected.fournisseur.prochaine_livraison}</span></div>
                )}
              </div>

              {/* Sous le seuil : on bascule directement sur le moteur de réappro */}
              {(selected.statut_stock === 'CRITIQUE' || selected.statut_stock === 'ALERTE') && (
                <Link href="/distributeur/approvisionnement?tab=reappro"
                  className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors">
                  <Truck size={12} /> Réapprovisionner
                </Link>
              )}
            </div>

            {/* Réseau desservi — et sa rentabilité, pour qui a la main sur les prix */}
            <div className="p-3 bg-violet-50 rounded-xl">
              <div className="text-[10px] font-bold text-violet-700 uppercase mb-2">
                {voitValeurCommerciale ? 'Réseau & rentabilité' : 'Réseau desservi'}
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span>PDV approvisionnés</span><span className="font-bold">{selected.reseau_pdv.magasins_approvisionnes}</span></div>
                <div className="flex justify-between"><span>PDV en rupture</span><span className="font-bold text-red-600">{selected.reseau_pdv.magasins_en_rupture}</span></div>
                <div className="flex justify-between"><span>Ruptures 3 mois</span><span className="font-bold text-orange-600">{selected.ruptures_3m} ({selected.jours_rupture_3m}j)</span></div>
                {voitValeurCommerciale && (
                  <>
                    <div className="flex justify-between"><span>CA/mois</span><span className="font-bold">{formatFcfa(selected.ca_mois)}</span></div>
                    <div className="mt-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${RENTABILITE_STYLE[selected.rentabilite].className}`}>
                        {RENTABILITE_STYLE[selected.rentabilite].label}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Préparation & évolution */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 border border-slate-200 rounded-xl">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <Package size={11} /> Préparation commandes
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <div className="text-amber-800 font-black text-lg">{selected.commandes_a_preparer}</div>
                  <div className="text-[10px] text-amber-600">commandes</div>
                </div>
                <div className="bg-sky-50 rounded-lg p-2 text-center">
                  <div className="text-sky-800 font-black text-lg">{selected.unites_en_preparation}</div>
                  <div className="text-[10px] text-sky-600">unités</div>
                </div>
                <div className="bg-violet-50 rounded-lg p-2 text-center">
                  <div className="text-violet-800 font-black text-lg">{selected.transferts_en_cours}</div>
                  <div className="text-[10px] text-violet-600">transferts</div>
                </div>
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded-xl">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <BarChart3 size={11} /> Évolution stock 7 jours
              </div>
              <Sparkline data={selected.evolution_stock_7j} />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>J-7: {selected.evolution_stock_7j[0]}</span>
                <span className="flex items-center gap-0.5">
                  {selected.evolution_stock_7j.at(-1)! < selected.evolution_stock_7j[0]
                    ? <><TrendingDown size={10} className="text-red-500" /> Baisse</>
                    : <><TrendingUp size={10} className="text-emerald-500" /> Stable/hausse</>}
                </span>
                <span>Auj.: {selected.evolution_stock_7j.at(-1)}</span>
              </div>
            </div>
          </div>

          {/* Mouvements récents */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
              <Clock size={11} /> Mouvements récents
            </div>
            {selected.mouvements_recents.length === 0 ? (
              <p className="text-xs text-slate-400">Aucun mouvement récent enregistré.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selected.mouvements_recents.map((m, i) => {
                  const Icon = MOUVEMENT_ICON[m.type]
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs bg-white">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.type === 'ENTREE' ? 'bg-emerald-100 text-emerald-600' : m.type === 'SORTIE' ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'}`}>
                        <Icon size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{m.libelle}</div>
                        <div className="text-[10px] text-slate-400">{m.date}{m.reference ? ` · ${m.reference}` : ''}</div>
                      </div>
                      <div className={`font-bold shrink-0 ${m.type === 'ENTREE' ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {m.type === 'ENTREE' ? '+' : '-'}{m.quantite} u.
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {selected.alerte && (
            <p className="text-sm text-red-700 font-medium flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle size={14} /> {selected.alerte}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
