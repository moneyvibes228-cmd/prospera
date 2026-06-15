'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import type { ClientPortefeuilleGP } from '@/lib/gp-portefeuille-hub'
import { formatFcfa } from '@/lib/utils'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createClientIcon(enRetard: boolean) {
  const color = enRetard ? '#dc2626' : '#0d9488'
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 8px; height: 8px; border-radius: 50%;
      background: ${color}; border: 1.5px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  })
}

interface MapGpClientsProps {
  clients: ClientPortefeuilleGP[]
}

export default function MapGpClients({ clients }: MapGpClientsProps) {
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
      {clients.map(client => {
        if (client.lat == null || client.lng == null) return null
        return (
          <Marker
            key={client.borrowerId}
            position={[client.lat, client.lng]}
            icon={createClientIcon(client.retard_j > 0)}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <div className="font-semibold text-slate-900">{client.nom}</div>
                <div className="text-xs text-slate-500 mt-1">{client.zone}</div>
                <div className={`text-xs mt-1 font-medium ${client.retard_j > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {client.retard_j > 0 ? `Retard ${client.retard_j} j` : 'À jour'}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">Encours {formatFcfa(client.encours)}</div>
                <Link
                  href={`/emprunteurs/${client.borrowerId}`}
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
