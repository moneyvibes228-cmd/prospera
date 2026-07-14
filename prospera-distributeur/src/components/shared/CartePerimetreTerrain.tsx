'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix des icônes Leaflet par défaut (assets servis via CDN) — même patron que CarteCommercialDG.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export interface CarteMarker {
  id: string
  lat: number
  lng: number
  nom: string
  couleur: string
  rayon?: number
  sousTitre?: string
  badge?: string
}

export interface CarteRoute {
  points: { lat: number; lng: number }[]
  couleur?: string
}

interface Props {
  markers: CarteMarker[]
  routes?: CarteRoute[]
  center?: [number, number]
  zoom?: number
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** Clic sur le fond de carte — utilisé par le « mode recensement » de la prospection. */
  onMapClick?: (lat: number, lng: number) => void
}

/** Recadre la carte pour englober tous les marqueurs du périmètre. */
function FitBounds({ markers }: { markers: CarteMarker[] }) {
  const map = useMap()
  useMemo(() => {
    const valides = markers.filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng))
    if (valides.length === 0) return
    if (valides.length === 1) {
      map.setView([valides[0].lat, valides[0].lng], 14)
      return
    }
    const bounds = L.latLngBounds(valides.map(m => [m.lat, m.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, map])
  return null
}

/** Capture les clics sur le fond de carte pour le mode recensement (opt-in). */
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/**
 * Carte terrain générique filtrée par périmètre — réutilisée par les écrans
 * COMMERCIAL/FREELANCE (tournée), SUPERVISEUR (équipe) et RECOUVREMENT (débiteurs).
 * S'inspire de `CarteCommercialDG` mais découplée des builders DG.
 *
 * À importer via `dynamic(..., { ssr: false })` côté écran.
 */
export default function CartePerimetreTerrain({
  markers, routes = [], center = [6.135, 1.225], zoom = 12, selectedId, onSelect, onMapClick,
}: Props) {
  const valides = markers.filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng))

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className="z-0 rounded-xl">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
      <FitBounds markers={valides} />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

      {routes.map((route, i) => (
        <Polyline
          key={`route-${i}`}
          positions={route.points.map(p => [p.lat, p.lng] as [number, number])}
          pathOptions={{ color: route.couleur ?? '#0f766e', weight: 2, dashArray: '6 6', opacity: 0.7 }}
        />
      ))}

      {valides.map(m => {
        const selected = selectedId === m.id
        return (
          <CircleMarker
            key={m.id}
            center={[m.lat, m.lng]}
            radius={selected ? (m.rayon ?? 8) + 3 : (m.rayon ?? 8)}
            pathOptions={{
              color: '#ffffff',
              weight: selected ? 3 : 1.5,
              fillColor: m.couleur,
              fillOpacity: 0.9,
            }}
            eventHandlers={onSelect ? { click: () => onSelect(selected ? null : m.id) } : undefined}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-bold text-slate-900">{m.nom}</div>
                {m.sousTitre && <div className="text-slate-500 mt-0.5">{m.sousTitre}</div>}
                {m.badge && (
                  <div className="mt-1 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {m.badge}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
