'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Visit } from '@/types'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const AGENT_COLORS: Record<string, string> = {
  'Kofi Amavi':  '#2563eb',
  'Akua Lawson': '#16a34a',
  'Edem Kpélim': '#f97316',
}

function createColoredIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 12px; height: 12px; border-radius: 50%;
      background: ${color}; border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

interface MapTerrainProps {
  visits: Visit[]
}

export default function MapTerrain({ visits }: MapTerrainProps) {
  const LOME_CENTER: [number, number] = [6.1374, 1.2123]

  return (
    <MapContainer
      center={LOME_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      {visits.map(visit => {
        const color = AGENT_COLORS[visit.agentNom] ?? '#64748b'
        return (
          <Marker
            key={visit.id}
            position={[visit.lat, visit.lng]}
            icon={createColoredIcon(color)}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <div className="font-semibold text-slate-900">{visit.borrowerNom}</div>
                <div className="text-slate-500 text-xs mt-1">{formatDate(visit.date)}</div>
                <div className="text-slate-600 text-xs mt-0.5">Agent : {visit.agentNom}</div>
                <div className={`text-xs mt-1 font-medium ${
                  visit.statut === 'POSITIVE' ? 'text-green-600' :
                  visit.statut === 'NEGATIVE' ? 'text-red-600' : 'text-slate-500'
                }`}>
                  {visit.statut.replace('_', ' ')}
                </div>
                <Link
                  href={`/emprunteurs/${visit.borrowerId}`}
                  className="block mt-2 text-xs text-teal-600 hover:text-teal-800 font-medium"
                >
                  Voir fiche →
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
