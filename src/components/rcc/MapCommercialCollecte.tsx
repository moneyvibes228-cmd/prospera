'use client'
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { formatFcfa } from '@/lib/utils'
import type { ZoneControlee, PointCollecte } from '@/lib/rcc-commercial-hub'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function collecteIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
}

const STATUT_LABEL: Record<string, string> = {
  BON: 'Bon', NORMAL: 'Normal', TENSION: 'Tension', DEGRADE: 'Dégradé',
}

interface Props {
  zones: ZoneControlee[]
  points: PointCollecte[]
}

export default function MapCommercialCollecte({ zones, points }: Props) {
  const center: [number, number] = [6.152, 1.210]

  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} className="z-0">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap"
      />
      {zones.map(z => (
        <Circle
          key={z.id}
          center={[z.lat, z.lng]}
          radius={800}
          pathOptions={{
            color: z.couleur,
            fillColor: z.couleur,
            fillOpacity: 0.12,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-xs min-w-[160px]">
              <div className="font-bold">{z.nom}</div>
              <div className="text-slate-500">{z.agence} · couverture {z.couverture_pct}%</div>
              <div className="mt-1">Collecte : <strong>{formatFcfa(z.collecte_jour)}</strong></div>
              <div>Objectif : {formatFcfa(z.objectif_jour)}</div>
              <div className="mt-1 font-bold">{STATUT_LABEL[z.statut]}</div>
            </div>
          </Popup>
        </Circle>
      ))}
      {points.map(p => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={collecteIcon('#0d9488')}>
          <Popup>
            <div className="text-xs">
              <div className="font-bold">{formatFcfa(p.montant)}</div>
              <div>{p.client}</div>
              <div className="text-slate-500">{p.agent} · {p.heure} · {p.type}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
