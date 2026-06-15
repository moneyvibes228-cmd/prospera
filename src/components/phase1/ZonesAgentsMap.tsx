'use client'
import { MapContainer, TileLayer, Circle, Polygon, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { AgentZoneApi, GeoJsonPolygon } from '@/types/phase1'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function polygonPositions(geojson: GeoJsonPolygon): [number, number][] {
  const ring = geojson.coordinates[0] ?? []
  return ring.map(([lng, lat]) => [lat, lng] as [number, number])
}

interface Props {
  agents: AgentZoneApi[]
  selectedAgentId?: string | null
  onSelectAgent?: (id: string) => void
  height?: string
}

export function ZonesAgentsMap({
  agents,
  selectedAgentId,
  onSelectAgent,
  height = '420px',
}: Props) {
  const center: [number, number] = [6.152, 1.21]

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OSM" />
        {agents.map(agent => {
          const z = agent.zone_affectee
          if (!z) return null
          const color = z.couleur ?? '#0d9488'
          const key = agent.id

          if (z.geojson?.type === 'Polygon') {
            return (
              <Polygon
                key={key}
                positions={polygonPositions(z.geojson)}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: selectedAgentId === agent.id ? 0.35 : 0.15,
                  weight: selectedAgentId === agent.id ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onSelectAgent?.(agent.id),
                }}
              >
                <Popup>
                  <ZonePopup agent={agent} />
                </Popup>
              </Polygon>
            )
          }

          if (z.centre_lat != null && z.centre_lng != null) {
            return (
              <Circle
                key={key}
                center={[z.centre_lat, z.centre_lng]}
                radius={600}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.15,
                  weight: 2,
                }}
                eventHandlers={{ click: () => onSelectAgent?.(agent.id) }}
              >
                <Popup>
                  <ZonePopup agent={agent} />
                </Popup>
              </Circle>
            )
          }
          return null
        })}
        {agents
          .filter(a => a.zone_affectee?.centre_lat != null && a.zone_affectee?.centre_lng != null)
          .map(a => (
            <Marker
              key={`pin-${a.id}`}
              position={[a.zone_affectee!.centre_lat!, a.zone_affectee!.centre_lng!]}
            >
              <Popup>
                <ZonePopup agent={a} />
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}

function ZonePopup({ agent }: { agent: AgentZoneApi }) {
  const z = agent.zone_affectee
  return (
    <div className="text-xs min-w-[140px]">
      <div className="font-bold">
        {agent.prenom} {agent.nom}
      </div>
      <div className="text-slate-500">{agent.agence.nom}</div>
      {z && <div className="mt-1">{z.libelle}</div>}
      {agent.stats && (
        <div className="mt-1 text-slate-600">
          {agent.stats.nb_clients} clients · {agent.stats.nb_visites} visites
        </div>
      )}
    </div>
  )
}
