'use client'

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { formatFcfa } from '@distributeur/lib/utils'
import type { CommercialTerrainDG, VisitePdvCarte } from '@distributeur/lib/commercial-terrain-dg-builder'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const COMMERCIAL_PALETTE = ['#14b8a6', '#3b82f6', '#f97316', '#84cc16', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308']

const COMMERCIAL_COLORS: Record<string, string> = {
  'c-1': '#14b8a6',
  'c-2': '#3b82f6',
  'c-3': '#f97316',
  'c-4': '#84cc16',
}

function commercialColor(id: string): string {
  if (COMMERCIAL_COLORS[id]) return COMMERCIAL_COLORS[id]
  const n = parseInt(id.replace(/\D/g, ''), 10) || 0
  return COMMERCIAL_PALETTE[n % COMMERCIAL_PALETTE.length]
}

function commercialIcon(c: CommercialTerrainDG, selected: boolean) {
  const color = c.position.statut === 'ALERTE_GPS' ? '#ef4444' : commercialColor(c.id)
  const size = selected ? 16 : 13
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)${selected ? ';outline:2px solid #fbbf24;outline-offset:2px' : ''}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

interface Props {
  commerciaux: CommercialTerrainDG[]
  visites: VisitePdvCarte[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  focus: 'lome' | 'nord'
  showTour: boolean
}

export default function CarteCommercialDG({ commerciaux, visites, selectedId, onSelect, focus, showTour }: Props) {
  const center: [number, number] = focus === 'nord' ? [9.2, 1.15] : [6.135, 1.225]
  const zoom = focus === 'nord' ? 8 : 12

  const commerciauxFiltres = focus === 'nord'
    ? commerciaux.filter(c => c.zone.includes('Kara') || c.zone.includes('Centrale'))
    : commerciaux.filter(c => !c.zone.includes('Kara') && !c.zone.includes('Centrale'))

  const nomsFiltres = new Set(commerciauxFiltres.map(c => c.nom))
  const visitesFiltrees = visites.filter(v => nomsFiltres.has(v.commercial))
  const selected = commerciaux.find(c => c.id === selectedId)

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className="z-0 rounded-xl">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />

      {visitesFiltrees.map(v => {
        if (selected && v.commercial !== selected.nom) return null
        const comm = commerciaux.find(c => c.nom === v.commercial)
        const color = comm ? commercialColor(comm.id) : '#94a3b8'
        return (
          <CircleMarker
            key={v.id}
            center={[v.lat, v.lng]}
            radius={v.priorite === 'HAUTE' ? 6 : 4}
            pathOptions={{
              color: '#fff',
              fillColor: v.visite_aujourdhui ? color : v.priorite === 'HAUTE' ? '#ef4444' : '#cbd5e1',
              fillOpacity: v.visite_aujourdhui ? 0.9 : 0.6,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="text-xs min-w-[150px]">
                <div className="font-bold">{v.nom}</div>
                <div className="text-slate-500">{v.commercial}</div>
                <div className="mt-1">{v.visite_aujourdhui ? '✓ Visité aujourd\'hui' : '○ Non visité'}</div>
                {v.motif && <div className="text-orange-600 font-medium">{v.motif}</div>}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      {showTour && selected && visitesFiltrees
        .filter(v => v.commercial === selected.nom && v.visite_aujourdhui)
        .slice(0, 5)
        .map((v, i, arr) => {
          if (i === 0) return null
          const prev = arr[i - 1]
          return (
            <Polyline
              key={`route-${v.id}`}
              positions={[[prev.lat, prev.lng], [v.lat, v.lng]]}
              pathOptions={{ color: commercialColor(selected.id), weight: 2, opacity: 0.6, dashArray: '4 4' }}
            />
          )
        })}

      {commerciauxFiltres.map(c => (
        <Marker
          key={c.id}
          position={[c.position.lat, c.position.lng]}
          icon={commercialIcon(c, selectedId === c.id)}
          eventHandlers={{ click: () => onSelect(selectedId === c.id ? null : c.id) }}
        >
          <Popup>
            <div className="text-xs min-w-[180px]">
              <div className="font-bold">{c.nom}</div>
              <div className="text-slate-500">{c.zone} · {c.type}</div>
              <div className="mt-1">{c.visites_jour}/{c.visites_objectif} visites · Score {c.score_ia}</div>
              <div>CA jour : <strong>{formatFcfa(c.ca_jour)}</strong></div>
              <div>Couverture : <strong>{c.couverture_secteur_pct}%</strong></div>
              {c.alerte && <div className="text-red-600 font-bold mt-1">{c.alerte}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
