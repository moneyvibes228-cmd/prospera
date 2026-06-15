'use client'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { formatFcfa } from '@/lib/utils'
import type { AgentTerrainRA } from '@/lib/ra-agence-hub'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createAgentIcon(color: string, actif: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${actif ? 16 : 12}px; height: ${actif ? 16 : 12}px; border-radius: 50%;
      background: ${actif ? color : '#94a3b8'}; border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ${actif ? 'animation: pulse 2s infinite;' : ''}
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

interface Props {
  agents: AgentTerrainRA[]
}

export default function MapAgentsRa({ agents }: Props) {
  const LOME_CENTER: [number, number] = [6.140, 1.210]

  return (
    <MapContainer
      center={LOME_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      {agents.map(agent => (
        <Marker
          key={agent.id}
          position={[agent.lat, agent.lng]}
          icon={createAgentIcon(agent.couleur, agent.actif)}
        >
          <Popup>
            <div className="text-sm min-w-[180px]">
              <div className="font-bold text-slate-900">{agent.nom}</div>
              <div className="text-xs text-slate-500">{agent.role} · {agent.actif ? 'Actif' : 'Inactif'}</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Visites</span>
                  <span className="font-bold">{agent.visites_jour}/{agent.visites_prevues}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collecte</span>
                  <span className="font-bold text-teal-700">{formatFcfa(agent.collecte_jour)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Couverture</span>
                  <span className={`font-bold ${agent.couverture_pct < 70 ? 'text-red-600' : 'text-green-700'}`}>
                    {agent.couverture_pct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Performance</span>
                  <span className="font-black">{agent.performance_pct}%</span>
                </div>
              </div>
            </div>
          </Popup>
          {agent.actif && (
            <Circle
              center={[agent.lat, agent.lng]}
              radius={400}
              pathOptions={{ color: agent.couleur, fillColor: agent.couleur, fillOpacity: 0.08, weight: 1 }}
            />
          )}
        </Marker>
      ))}
    </MapContainer>
  )
}
