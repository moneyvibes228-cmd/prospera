'use client'

import { MapContainer, TileLayer, Circle, Marker, Popup, CircleMarker, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { formatFcfa } from '@/lib/utils'
import type { ZonePilotageDG, EntrepotCarteDG } from '@/lib/zones-pilotage-dg'
import type { MagasinCarteDG, FluxEntrepotMagasinDG } from '@/lib/magasins-pilotage-dg'
import type { SuggestionImplantation } from '@/lib/cartographie-distance-builder'
import type { TypeMagasin } from '@/types'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export type ModeCarteDG = 'reseau' | 'flux' | 'produits'

function entrepotIcon(type: 'PRINCIPAL' | 'REGIONAL') {
  const color = type === 'PRINCIPAL' ? '#d97706' : '#3b82f6'
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:3px;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);transform:rotate(45deg)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function magasinPropreIcon(selected: boolean) {
  const size = selected ? 14 : 11
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:2px;background:#7c3aed;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)${selected ? ';outline:2px solid #fbbf24;outline-offset:2px' : ''}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function evolutionColor(pct: number, rupture: boolean): string {
  if (rupture) return '#dc2626'
  if (pct >= 10) return '#16a34a'
  if (pct >= 0) return '#14b8a6'
  if (pct >= -10) return '#f97316'
  return '#ef4444'
}

interface Props {
  zones: ZonePilotageDG[]
  entrepots: EntrepotCarteDG[]
  magasins: MagasinCarteDG[]
  flux: FluxEntrepotMagasinDG[]
  suggestions?: SuggestionImplantation[]
  selectedZoneId: string | null
  selectedMagasinId: string | null
  onSelectZone: (id: string | null) => void
  onSelectMagasin: (id: string | null) => void
  focus: 'lome' | 'nord'
  mode: ModeCarteDG
  filtreMagasin: 'tous' | TypeMagasin
  produitRef: string | null
}

const ZONE_IDS_LOME = ['zn-lome-nord', 'zn-lome-sud', 'zn-lome-centre', 'zn-lome-est']
const ZONE_IDS_NORD = ['zn-kara', 'zn-centrale']

export default function CarteZonesDG({
  zones, entrepots, magasins, flux, suggestions = [],
  selectedZoneId, selectedMagasinId,
  onSelectZone, onSelectMagasin,
  focus, mode, filtreMagasin, produitRef,
}: Props) {
  const zoneIds = focus === 'lome' ? ZONE_IDS_LOME : ZONE_IDS_NORD
  const center: [number, number] = focus === 'nord' ? [9.2, 1.15] : [6.135, 1.225]
  const zoom = focus === 'nord' ? 8 : 12

  const zonesFiltrees = zones.filter(z => zoneIds.includes(z.zone.id))
  const entrepotsFiltres = entrepots.filter(e => e.zones_rattachees.some(id => zoneIds.includes(id)))

  let magasinsFiltres = magasins.filter(m => zoneIds.includes(m.zone_id))
  if (selectedZoneId) magasinsFiltres = magasinsFiltres.filter(m => m.zone_id === selectedZoneId)
  if (filtreMagasin !== 'tous') magasinsFiltres = magasinsFiltres.filter(m => m.type_magasin === filtreMagasin)

  const entrepotPositions = Object.fromEntries(entrepotsFiltres.map(e => [e.id, [e.lat, e.lng] as [number, number]]))

  const suggestionsFiltrees = suggestions.filter(s =>
    s.zone_ids.some(id => zoneIds.includes(id)),
  )

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className="z-0 rounded-xl">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />

      {zonesFiltrees.map(z => (
        <Circle
          key={z.zone.id}
          center={[z.geo.lat, z.geo.lng]}
          radius={z.geo.radius_m}
          pathOptions={{
            color: selectedZoneId === z.zone.id ? '#0d9488' : z.zone.color,
            fillColor: z.zone.color,
            fillOpacity: selectedZoneId === z.zone.id ? 0.28 : mode === 'flux' ? 0.08 : 0.14,
            weight: selectedZoneId === z.zone.id ? 3 : 2,
          }}
          eventHandlers={{ click: () => onSelectZone(selectedZoneId === z.zone.id ? null : z.zone.id) }}
        >
          <Popup>
            <div className="text-xs min-w-[180px]">
              <div className="font-bold">{z.zone.nom}</div>
              <div className="text-slate-500">{z.entrepot_rattache}</div>
              <div className="mt-1">Sorties : <strong>{formatFcfa(z.demande_mois_fcfa)}</strong></div>
              <div>Progression : <strong className={z.progression_mois_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}>{z.progression_mois_pct > 0 ? '+' : ''}{z.progression_mois_pct}%</strong></div>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Flux entrepôt → magasins */}
      {mode === 'flux' && magasinsFiltres.map(m => {
        const from = entrepotPositions[m.entrepot_id]
        if (!from) return null
        const isPropre = m.type_magasin === 'PROPRE'
        return (
          <Polyline
            key={`flux-${m.id}`}
            positions={[from, [m.lat, m.lng]]}
            pathOptions={{
              color: isPropre ? '#7c3aed' : '#64748b',
              weight: isPropre ? 2.5 : 1.5,
              opacity: isPropre ? 0.75 : 0.45,
              dashArray: isPropre ? undefined : '6 4',
            }}
          />
        )
      })}

      {/* Zones d'implantation suggérées */}
      {suggestionsFiltrees.map(s => (
        <Circle
          key={s.id}
          center={[s.lat, s.lng]}
          radius={s.radius_km * 1000}
          pathOptions={{
            color: s.severite === 'CRITIQUE' ? '#dc2626' : s.severite === 'HAUTE' ? '#f97316' : '#14b8a6',
            fillColor: s.severite === 'CRITIQUE' ? '#fecaca' : s.severite === 'HAUTE' ? '#fed7aa' : '#ccfbf1',
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '8 6',
          }}
        >
          <Popup>
            <div className="text-xs min-w-[200px]">
              <div className="font-bold">{s.titre}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.detail}</div>
              <div className="text-[10px] font-semibold text-teal-700 mt-1.5">→ {s.action}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                {s.points_count} point(s) · {formatFcfa(s.ca_couvert_fcfa)} CA/mois
              </div>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Magasins */}
      {magasinsFiltres.map(m => {
        const selected = selectedMagasinId === m.id
        const produit = produitRef ? m.produits.find(p => p.reference === produitRef) : null

        if (m.type_magasin === 'PROPRE') {
          const size = mode === 'produits' && produit
            ? Math.min(12, 5 + Math.abs(produit.evolution_pct) / 4)
            : 11
          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={magasinPropreIcon(selected)}
              eventHandlers={{ click: () => onSelectMagasin(selected ? null : m.id) }}
            >
              <Popup>
                <MagasinPopup magasin={m} produit={produit} />
              </Popup>
            </Marker>
          )
        }

        let fill = '#14b8a6'
        let radius = m.ca_mois >= 2_000_000 ? 7 : m.ca_mois >= 1_000_000 ? 5 : 4
        if (mode === 'produits' && produit) {
          fill = evolutionColor(produit.evolution_pct, produit.rupture)
          radius = Math.min(10, 4 + produit.quantite_mois / 40)
        } else if (m.creance_jours > 30) {
          fill = '#dc2626'
        } else if (m.creance > 0) {
          fill = '#f97316'
        }

        return (
          <CircleMarker
            key={m.id}
            center={[m.lat, m.lng]}
            radius={radius}
            pathOptions={{
              color: selected ? '#fbbf24' : '#fff',
              fillColor: fill,
              fillOpacity: 0.9,
              weight: selected ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => onSelectMagasin(selected ? null : m.id) }}
          >
            <Popup>
              <MagasinPopup magasin={m} produit={produit} />
            </Popup>
          </CircleMarker>
        )
      })}

      {entrepotsFiltres.map(e => (
        <Marker key={e.id} position={[e.lat, e.lng]} icon={entrepotIcon(e.type)}>
          <Popup>
            <div className="text-xs min-w-[160px]">
              <div className="font-bold">Entrepôt {e.nom}</div>
              <div className="text-slate-500">{e.livraisons_jour} expéditions/jour</div>
              {mode === 'flux' && (
                <div className="mt-1 text-[10px]">
                  → {flux.filter(f => f.entrepot_id === e.id && zoneIds.includes(f.zone_id)).length} points livrés
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

function MagasinPopup({ magasin, produit }: { magasin: MagasinCarteDG; produit: MagasinCarteDG['produits'][0] | null | undefined }) {
  return (
    <div className="text-xs min-w-[200px]">
      <div className="font-bold flex items-center gap-1">
        {magasin.nom}
        <span className={`text-[8px] px-1 py-0.5 rounded font-bold ${magasin.type_magasin === 'PROPRE' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
          {magasin.type_magasin === 'PROPRE' ? 'ENSEIGNE' : 'PARTENAIRE'}
        </span>
      </div>
      <div className="text-slate-500">{magasin.zone} · via {magasin.entrepot_nom}</div>
      <div className="mt-1">CA mois : <strong>{formatFcfa(magasin.ca_mois)}</strong> · {magasin.livraisons_mois} BL</div>
      {produit ? (
        <div className="mt-1.5 p-1.5 bg-slate-50 rounded">
          <div className="font-semibold">{produit.nom}</div>
          <div>{produit.quantite_mois} {produit.unite}/mois · <span className={produit.evolution_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}>{produit.evolution_pct > 0 ? '+' : ''}{produit.evolution_pct}%</span></div>
          <div>Stock : {produit.stock_magasin} · couverture {produit.jours_couverture}j {produit.rupture && <span className="text-red-600 font-bold">RUPTURE</span>}</div>
        </div>
      ) : (
        <div className="mt-1 text-[10px] text-slate-500">
          Top : {magasin.produits.slice(0, 2).map(p => `${p.nom.split(' ')[0]} ${p.evolution_pct > 0 ? '+' : ''}${p.evolution_pct}%`).join(' · ')}
        </div>
      )}
      {magasin.creance > 0 && (
        <div className="text-red-600 mt-1">Impayé : {formatFcfa(magasin.creance)} · {magasin.creance_jours}j</div>
      )}
    </div>
  )
}
