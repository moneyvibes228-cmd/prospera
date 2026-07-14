'use client'

import { useState, useMemo, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import {
  MapPin, TrendingUp, TrendingDown, Package, Wallet, Store,
  Warehouse, Sparkles, AlertTriangle, Building2,
  GitBranch, BarChart3, Filter, Route, Target, History,
} from 'lucide-react'
import { EntrepotSortiesHistoriquePanel } from '@/components/stock/EntrepotSortiesHistoriquePanel'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import {
  buildZonesPilotageDG, buildEntrepotsCarteDG,
  buildAnalysesZonesIA, getZoneRankings,
  type ZonePilotageDG,
} from '@/lib/zones-pilotage-dg'
import {
  buildMagasinsCarteDG, buildFluxEntrepotMagasins, buildZoneMixMagasins,
  buildAnalysesMagasinsIA, getProduitsDisponiblesCarte,
  getEvolutionProduitZone,
} from '@/lib/magasins-pilotage-dg'
import type { ModeCarteDG } from '@/components/dashboard/CarteZonesDG'
import type { TypeMagasin } from '@/types'
import { buildAnalyseDistanceReseau } from '@/lib/cartographie-distance-builder'

const CarteZonesDG = dynamic(() => import('@/components/dashboard/CarteZonesDG'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
      Chargement carte…
    </div>
  ),
})

const STATUT_ZONE_STYLE = {
  SAIN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ATTENTION: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITIQUE: 'bg-red-100 text-red-700 border-red-200',
}

const ANALYSE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

const MODE_CARTE: { id: ModeCarteDG; label: string; Icon: typeof MapPin }[] = [
  { id: 'reseau', label: 'Réseau', Icon: MapPin },
  { id: 'flux', label: 'Flux entrepôt', Icon: GitBranch },
  { id: 'produits', label: 'Évolution produits', Icon: BarChart3 },
]

function ZoneMiniCard({ z, mix, selected, onClick }: {
  z: ZonePilotageDG
  mix?: { magasins_propres: number; partenaires: number; part_partenaires_pct: number; alerte: boolean }
  selected: boolean
  onClick: () => void
}) {
  const st = STATUT_ZONE_STYLE[z.zone.statut]
  return (
    <button type="button" onClick={onClick}
      className={`text-left p-3 rounded-xl border-2 transition-all w-full ${selected ? 'border-amber-400 bg-amber-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
          style={{ backgroundColor: z.zone.color + '25', color: z.zone.color }}>
          {z.zone.initiales}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-800 truncate">{z.zone.nom}</div>
          <div className="text-[10px] text-slate-400">{z.entrepot_rattache}</div>
        </div>
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${st}`}>{z.zone.statut}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <div>
          <div className="text-slate-400">Prog.</div>
          <div className={`font-bold ${z.progression_mois_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {z.progression_mois_pct > 0 ? '+' : ''}{z.progression_mois_pct}%
          </div>
        </div>
        <div>
          <div className="text-slate-400">Ruptures</div>
          <div className={`font-bold ${z.zone.ruptures_stock >= 3 ? 'text-red-600' : 'text-slate-700'}`}>{z.zone.ruptures_stock}</div>
        </div>
        <div>
          <div className="text-slate-400">Impayés</div>
          <div className="font-bold text-red-600">{(z.zone.creances_retard / 1_000_000).toFixed(1)}M</div>
        </div>
      </div>
      {mix && (
        <div className="mt-1.5 text-[9px] flex flex-wrap gap-1">
          <span className="text-violet-600 font-semibold">{mix.magasins_propres} enseigne</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600">{mix.partenaires} partenaires</span>
          {mix.alerte && <span className="text-orange-600 font-bold">· {mix.part_partenaires_pct}% BL part.</span>}
        </div>
      )}
    </button>
  )
}

function RankingList({ titre, icon: Icon, items, render }: {
  titre: string
  icon: typeof TrendingUp
  items: ZonePilotageDG[]
  render: (z: ZonePilotageDG) => ReactNode
}) {
  if (!items.length) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
        <Icon size={11} /> {titre}
      </div>
      <div className="space-y-1">
        {items.map((z, i) => (
          <div key={z.zone.id} className="flex items-center gap-2 text-xs py-1 border-b border-slate-100 last:border-0">
            <span className="w-4 text-[10px] font-bold text-slate-400">{i + 1}</span>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: z.zone.color }} />
            <span className="font-medium text-slate-700 flex-1 truncate">{z.zone.nom_court}</span>
            {render(z)}
          </div>
        ))}
      </div>
    </div>
  )
}

type PanelVue = 'carte' | 'sorties'

export function ZonePilotageDGPanel() {
  const [panelVue, setPanelVue] = useState<PanelVue>('carte')
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedMagasinId, setSelectedMagasinId] = useState<string | null>(null)
  const [focusCarte, setFocusCarte] = useState<'lome' | 'nord'>('lome')
  const [modeCarte, setModeCarte] = useState<ModeCarteDG>('reseau')
  const [filtreMagasin, setFiltreMagasin] = useState<'tous' | TypeMagasin>('tous')
  const [produitRef, setProduitRef] = useState<string>('PRD-HUILE-5L')

  const zones = useMemo(() => buildZonesPilotageDG(), [])
  const magasins = useMemo(() => buildMagasinsCarteDG(), [])
  const flux = useMemo(() => buildFluxEntrepotMagasins(magasins), [magasins])
  const mixZones = useMemo(() => buildZoneMixMagasins(magasins), [magasins])
  const entrepots = useMemo(() => buildEntrepotsCarteDG(), [])
  const produitsDispo = useMemo(() => getProduitsDisponiblesCarte(), [])
  const rankings = useMemo(() => getZoneRankings(zones), [zones])
  const analysesZones = useMemo(() => buildAnalysesZonesIA(zones), [zones])
  const analysesMagasins = useMemo(() => buildAnalysesMagasinsIA(magasins, mixZones), [magasins, mixZones])
  const analyseDistance = useMemo(
    () => buildAnalyseDistanceReseau(magasins, entrepots),
    [magasins, entrepots],
  )

  const selectedZone = zones.find(z => z.zone.id === selectedZoneId) ?? null
  const distanceSelected = selectedMagasinId
    ? analyseDistance.distances.find(d => d.magasin_id === selectedMagasinId)
    : null
  const selectedMagasin = magasins.find(m => m.id === selectedMagasinId) ?? null
  const mixSelected = selectedZoneId ? mixZones.find(m => m.zone_id === selectedZoneId) : null
  const evolutionZone = selectedZoneId && modeCarte === 'produits'
    ? getEvolutionProduitZone(magasins, selectedZoneId, produitRef)
    : null

  const propres = magasins.filter(m => m.type_magasin === 'PROPRE')
  const partenaires = magasins.filter(m => m.type_magasin === 'PARTENAIRE')

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Cartographie réseau — zones, magasins & produits
          </h3>
          <AiBadge variant="small" label="Analyse IA" confidence={84} />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          {panelVue === 'carte' && (
            <>
              <span className="text-violet-600 font-bold">{propres.length} magasins enseigne</span>
              <span>·</span>
              <span><strong className="text-slate-700">{partenaires.length}</strong> partenaires cartographiés</span>
              <span>·</span>
              <span className="text-red-600 font-bold">Impayés max : {rankings.zone_impayes_max.zone.nom}</span>
            </>
          )}
        </div>
      </div>

      <div className="px-4 pt-3 flex flex-wrap gap-1 border-b border-slate-100">
        {([
          { id: 'carte' as const, label: 'Carte & flux réseau', Icon: MapPin },
          { id: 'sorties' as const, label: 'Sorties entrepôt · flux · IA', Icon: History },
        ]).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanelVue(id)}
            className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors ${
              panelVue === id ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>

      {panelVue === 'sorties' && (
        <div className="p-4">
          <EntrepotSortiesHistoriquePanel compact />
        </div>
      )}

      {panelVue === 'carte' && (
      <>
      <div className="grid lg:grid-cols-3 gap-0 lg:divide-x divide-slate-100">
        <div className="lg:col-span-2 p-4">
          {/* Contrôles carte */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex flex-wrap gap-1">
              {(['lome', 'nord'] as const).map(f => (
                <button key={f} type="button" onClick={() => setFocusCarte(f)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${focusCarte === f ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {f === 'lome' ? 'Grand Lomé' : 'Nord & Centrale'}
                </button>
              ))}
              <span className="w-px h-5 bg-slate-200 mx-0.5 self-center" />
              {MODE_CARTE.map(({ id, label, Icon }) => (
                <button key={id} type="button" onClick={() => setModeCarte(id)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-colors inline-flex items-center gap-1 ${modeCarte === id ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  <Icon size={10} /> {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Filter size={10} className="text-slate-400" />
              {(['tous', 'PROPRE', 'PARTENAIRE'] as const).map(f => (
                <button key={f} type="button" onClick={() => setFiltreMagasin(f)}
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${filtreMagasin === f ? (f === 'PROPRE' ? 'bg-violet-100 text-violet-700' : f === 'PARTENAIRE' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800') : 'bg-slate-50 text-slate-400'}`}>
                  {f === 'tous' ? 'Tous' : f === 'PROPRE' ? 'Enseigne' : 'Partenaires'}
                </button>
              ))}
            </div>
          </div>

          {modeCarte === 'produits' && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-medium">Produit :</span>
              <select
                value={produitRef}
                onChange={e => setProduitRef(e.target.value)}
                className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-medium"
              >
                {produitsDispo.map(p => (
                  <option key={p.reference} value={p.reference}>{p.nom}</option>
                ))}
              </select>
              <span className="text-[9px] text-slate-400">Taille/couleur = volume & évolution par magasin</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-[9px] text-slate-400 mb-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 rotate-45 inline-block" /> Entrepôt</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-600 inline-block" /> Magasin enseigne</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Partenaire</span>
            {modeCarte === 'flux' && (
              <>
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-violet-500 inline-block" /> Flux enseigne</span>
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 border-t border-dashed border-slate-400 inline-block" /> Flux partenaire</span>
              </>
            )}
            {analyseDistance.suggestions.length > 0 && (
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-teal-500 inline-block" /> Implantation suggérée</span>
            )}
          </div>

          <div className="h-[360px] rounded-xl overflow-hidden border border-slate-200">
            <CarteZonesDG
              zones={zones}
              entrepots={entrepots}
              magasins={magasins}
              flux={flux}
              suggestions={analyseDistance.suggestions}
              selectedZoneId={selectedZoneId}
              selectedMagasinId={selectedMagasinId}
              onSelectZone={id => { setSelectedZoneId(id); setSelectedMagasinId(null) }}
              onSelectMagasin={setSelectedMagasinId}
              focus={focusCarte}
              mode={modeCarte}
              filtreMagasin={filtreMagasin}
              produitRef={modeCarte === 'produits' ? produitRef : null}
            />
          </div>

          {/* Détail sélection */}
          {selectedMagasin && (
            <div className="mt-3 p-3 bg-violet-50 border border-violet-100 rounded-xl text-xs">
              <div className="font-bold text-violet-900 flex items-center gap-2">
                {selectedMagasin.type_magasin === 'PROPRE' ? <Building2 size={12} /> : <Store size={12} />}
                {selectedMagasin.nom}
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white font-bold text-violet-700">
                  {selectedMagasin.type_magasin === 'PROPRE' ? 'MAGASIN ENSEIGNE' : 'PARTENAIRE'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {selectedMagasin.zone} · approvisionné par {selectedMagasin.entrepot_nom} · {selectedMagasin.livraisons_mois} BL/mois
                {distanceSelected && (
                  <> · <strong className={distanceSelected.distance_km >= 3.5 ? 'text-orange-600' : 'text-slate-600'}>{distanceSelected.distance_km} km</strong> entrepôt
                    {distanceSelected.distance_enseigne_km !== null && (
                      <> · {distanceSelected.distance_enseigne_km} km enseigne ({distanceSelected.enseigne_proche_nom})</>
                    )}
                  </>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedMagasin.produits.map(p => (
                  <div key={p.reference} className={`p-2 rounded-lg border text-[10px] ${p.rupture ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                    <div className="font-semibold truncate">{p.nom.split(' ').slice(0, 2).join(' ')}</div>
                    <div>{p.quantite_mois} {p.unite}</div>
                    <div className={p.evolution_pct >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                      {p.evolution_pct > 0 ? '+' : ''}{p.evolution_pct}% vs M-1
                    </div>
                    <div className="text-slate-400">Stock {p.stock_magasin} · {p.jours_couverture}j</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedZone && !selectedMagasin && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs">
              <div className="font-bold text-amber-900">{selectedZone.zone.nom}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-[10px]">
                <div><span className="text-slate-500">Sorties</span><div className="font-bold">{formatFcfa(selectedZone.demande_mois_fcfa)}</div></div>
                <div><span className="text-slate-500">BL/mois</span><div className="font-bold">{selectedZone.livraisons_zone_mois}</div></div>
                {mixSelected && (
                  <>
                    <div><span className="text-slate-500">Mix BL</span>
                      <div className="font-bold">{mixSelected.part_partenaires_pct}% partenaires</div>
                    </div>
                    <div><span className="text-slate-500">Points carte</span>
                      <div className="font-bold">{mixSelected.magasins_propres} enseigne · {mixSelected.partenaires} part.</div>
                    </div>
                  </>
                )}
              </div>
              {evolutionZone && evolutionZone.magasins_count > 0 && (
                <div className="mt-2 p-2 bg-white rounded-lg border border-amber-100 text-[10px]">
                  <span className="font-semibold">{produitsDispo.find(p => p.reference === produitRef)?.nom}</span>
                  {' '}dans la zone : {evolutionZone.total_quantite} unités/mois · évolution moy. {evolutionZone.evolution_moyenne}%
                  · {evolutionZone.propres_count} enseigne · {evolutionZone.partenaires_count} partenaires
                  {evolutionZone.ruptures_count > 0 && <span className="text-red-600 font-bold"> · {evolutionZone.ruptures_count} rupture(s)</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              <Building2 size={11} className="text-violet-500" /> Magasins enseigne
            </div>
            <div className="space-y-1">
              {propres.map(m => (
                <button key={m.id} type="button" onClick={() => {
                  setSelectedMagasinId(m.id)
                  setFocusCarte(['zn-kara', 'zn-centrale'].includes(m.zone_id) ? 'nord' : 'lome')
                }}
                  className="w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-violet-50 text-left border border-transparent hover:border-violet-100">
                  <span className="w-2.5 h-2.5 rounded-sm bg-violet-600 shrink-0" />
                  <span className="font-medium text-slate-700 flex-1 truncate">{m.nom}</span>
                  <span className="font-bold text-slate-600">{formatFcfa(m.ca_mois)}</span>
                </button>
              ))}
            </div>
          </div>

          <RankingList titre="Saturation partenaires (BL)" icon={GitBranch}
            items={mixZones
              .filter(m => m.partenaires > 0)
              .sort((a, b) => b.part_partenaires_pct - a.part_partenaires_pct)
              .slice(0, 3)
              .map(m => zones.find(z => z.zone.id === m.zone_id)!)
              .filter(Boolean)}
            render={z => {
              const m = mixZones.find(x => x.zone_id === z.zone.id)!
              return <span className={`font-bold ${m.alerte_saturation_partenaires ? 'text-orange-600' : 'text-slate-600'}`}>{m.part_partenaires_pct}% part.</span>
            }}
          />

          <RankingList titre="Progressions" icon={TrendingUp} items={rankings.progressions}
            render={z => <span className="font-bold text-emerald-600">+{z.progression_mois_pct}%</span>} />
          <RankingList titre="Régressions" icon={TrendingDown} items={rankings.regressions}
            render={z => <span className="font-bold text-red-600">{z.progression_mois_pct}%</span>} />
          <RankingList titre="Ruptures SKU zone" icon={Package} items={rankings.ruptures}
            render={z => <span className="font-bold text-orange-600">{z.zone.ruptures_stock}</span>} />
          <RankingList titre="Impayés zone" icon={Wallet} items={rankings.impayes}
            render={z => <span className="font-bold text-red-600">{formatFcfa(z.zone.creances_retard)}</span>} />
        </div>
      </div>

      {/* Grille zones */}
      <div className="px-4 pb-4 border-t border-slate-100 pt-4">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Warehouse size={11} /> Zones — mix enseigne / partenaires
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {zones.map(z => {
            const mix = mixZones.find(m => m.zone_id === z.zone.id)
            return (
              <ZoneMiniCard
                key={z.zone.id}
                z={z}
                mix={mix ? { ...mix, alerte: mix.alerte_saturation_partenaires } : undefined}
                selected={selectedZoneId === z.zone.id}
                onClick={() => {
                  setSelectedZoneId(prev => prev === z.zone.id ? null : z.zone.id)
                  setSelectedMagasinId(null)
                  setFocusCarte(['zn-kara', 'zn-centrale'].includes(z.zone.id) ? 'nord' : 'lome')
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Analyse distances & implantation */}
      <div className="px-4 pb-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Route size={14} className="text-teal-600" />
          <span className="text-xs font-bold text-teal-900">Analyse distances — entrepôts, enseignes & partenaires</span>
          <AiBadge variant="small" label="Géo-IA" confidence={88} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
          {[
            { label: 'Dist. moy. entrepôt', value: `${analyseDistance.stats.distance_moy_entrepot_km} km` },
            { label: 'Dist. max entrepôt', value: `${analyseDistance.stats.distance_max_entrepot_km} km` },
            { label: 'Part. ↔ enseigne', value: `${analyseDistance.stats.distance_moy_partenaire_enseigne_km} km` },
            { label: 'Part. > 3,5 km', value: String(analyseDistance.stats.partenaires_loin_entrepot) },
            { label: 'Part. loin enseigne', value: String(analyseDistance.stats.partenaires_loin_enseigne) },
            { label: 'CA éloigné', value: formatFcfa(analyseDistance.stats.ca_eloigne_fcfa) },
            { label: '% CA éloigné', value: `${analyseDistance.stats.pct_ca_eloigne}%` },
          ].map(k => (
            <div key={k.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[9px] text-slate-400 font-medium">{k.label}</div>
              <div className="text-sm font-bold text-slate-800">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              <Target size={11} className="text-orange-500" />
              Top partenaires éloignés (CA × distance)
            </div>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-[10px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-semibold">Partenaire</th>
                    <th className="text-right px-2 py-1.5 font-semibold">CA</th>
                    <th className="text-right px-2 py-1.5 font-semibold">Entrepôt</th>
                    <th className="text-right px-2 py-1.5 font-semibold">Enseigne</th>
                  </tr>
                </thead>
                <tbody>
                  {analyseDistance.top_eloignes.map(p => (
                    <tr key={p.magasin_id} className="border-t border-slate-100 hover:bg-amber-50/50 cursor-pointer"
                      onClick={() => {
                        setSelectedMagasinId(p.magasin_id)
                        setFocusCarte(['zn-kara', 'zn-centrale'].includes(p.zone_id) ? 'nord' : 'lome')
                      }}>
                      <td className="px-2 py-1.5 font-medium text-slate-700 truncate max-w-[120px]">{p.magasin_nom}</td>
                      <td className="px-2 py-1.5 text-right font-bold">{formatFcfa(p.ca_mois)}</td>
                      <td className={`px-2 py-1.5 text-right font-bold ${p.distance_km >= 4 ? 'text-red-600' : p.distance_km >= 3.5 ? 'text-orange-600' : 'text-slate-600'}`}>
                        {p.distance_km} km
                      </td>
                      <td className="px-2 py-1.5 text-right text-slate-500">
                        {p.distance_enseigne_km !== null ? `${p.distance_enseigne_km} km` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              <MapPin size={11} className="text-teal-500" />
              Suggestions d&apos;implantation (cercles sur la carte)
            </div>
            <div className="space-y-2">
              {analyseDistance.suggestions.map(s => (
                <div key={s.id} className={`p-3 rounded-xl border text-xs ${ANALYSE_STYLE[s.severite]}`}>
                  <div className="flex items-start gap-2">
                    <Target size={14} className="shrink-0 mt-0.5 opacity-70" />
                    <div>
                      <div className="font-bold mb-0.5 flex items-center gap-1.5">
                        {s.titre}
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/80 font-bold uppercase">
                          {s.type === 'MICRO_DEPOT' ? 'micro-dépôt' : s.type === 'HUB_PARTENAIRE' ? 'hub relais' : 'tournée'}
                        </span>
                      </div>
                      <div className="text-[10px] opacity-90 mb-1">{s.detail}</div>
                      <div className="text-[10px] font-semibold text-slate-700">→ {s.action}</div>
                    </div>
                  </div>
                </div>
              ))}
              {analyseDistance.suggestions.length === 0 && (
                <div className="text-[10px] text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  Réseau bien couvert — aucune suggestion d&apos;implantation prioritaire.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analyses IA combinées */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-indigo-600" />
          <span className="text-xs font-bold text-indigo-900">Analyses IA — zones, flux & produits</span>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {[...analysesMagasins, ...analysesZones].map((a, i) => (
            <div key={i} className={`p-3 rounded-xl border text-xs ${ANALYSE_STYLE[a.severite]}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 opacity-70" />
                <div>
                  <div className="font-bold mb-0.5">{a.titre}</div>
                  <div className="text-[10px] opacity-90 mb-1.5">{a.detail}</div>
                  <div className="text-[10px] font-semibold text-slate-700">→ {a.action}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  )
}
