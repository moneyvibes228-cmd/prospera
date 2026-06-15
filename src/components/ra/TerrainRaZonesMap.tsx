'use client'

import { MapContainer, TileLayer, Circle, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { formatFcfa, cn } from '@/lib/utils'
import type { RaTerrainZonesHub, VisiteTerrainRa } from '@/lib/ra-terrain-zones-hub'
import type { AgentZone } from '@/lib/zones-hub'
import type { ZoneControlee } from '@/lib/rcc-commercial-hub'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const CLIENT_COLOR = {
  ACTIF: '#14b8a6',
  EN_RETARD: '#f97316',
  CONTENTIEUX: '#dc2626',
} as const

const VISIT_COLOR = {
  POSITIVE: '#16a34a',
  NEGATIVE: '#dc2626',
  SANS_REPONSE: '#94a3b8',
} as const

function agentIcon(agent: AgentZone, selected: boolean) {
  const color = agent.statut === 'DEGRADE' ? '#ef4444' : agent.statut === 'NORMAL' ? '#f97316' : '#2563eb'
  const size = selected ? 14 : 11
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)${selected ? ';outline:2px solid #0d9488;outline-offset:2px' : ''}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function visitIcon(v: VisiteTerrainRa, selected: boolean) {
  const color = VISIT_COLOR[v.statut]
  const size = selected ? 10 : 7
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:2px;background:${color};border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.35)${selected ? ';outline:2px solid #0f766e' : ''}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function agenceIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:3px;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);transform:rotate(45deg)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

interface Props {
  hub: RaTerrainZonesHub
  selectedZoneId: string | null
  selectedAgentId: string | null
  selectedVisiteId: string | null
  onSelectZone: (id: string | null) => void
  onSelectAgent: (id: string | null) => void
  onSelectVisite: (id: string | null) => void
}

export default function TerrainRaZonesMap({
  hub,
  selectedZoneId,
  selectedAgentId,
  selectedVisiteId,
  onSelectZone,
  onSelectAgent,
  onSelectVisite,
}: Props) {
  const center: [number, number] = [hub.agence.lat, hub.agence.lng]

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
      {hub.micro_zones.map(z => (
        <Circle
          key={z.id}
          center={[z.lat, z.lng]}
          radius={850}
          pathOptions={{
            color: selectedZoneId === z.id ? '#0d9488' : z.couleur,
            fillColor: z.couleur,
            fillOpacity: selectedZoneId === z.id ? 0.22 : 0.12,
            weight: selectedZoneId === z.id ? 3 : 2,
          }}
          eventHandlers={{
            click: () => {
              onSelectZone(z.id)
              onSelectAgent(null)
              onSelectVisite(null)
            },
          }}
        >
          <Popup>
            <div className="text-xs min-w-[160px]">
              <div className="font-bold">{z.nom}</div>
              <div className="text-slate-500">Couverture {z.couverture_pct} %</div>
              <div>Collecte {formatFcfa(z.collecte_jour)} / {formatFcfa(z.objectif_jour)}</div>
            </div>
          </Popup>
        </Circle>
      ))}
      {hub.clients.map(c => (
        <CircleMarker
          key={c.id}
          center={[c.lat, c.lng]}
          radius={c.statut === 'CONTENTIEUX' ? 4 : 3}
          pathOptions={{
            color: '#fff',
            fillColor: CLIENT_COLOR[c.statut],
            fillOpacity: 0.8,
            weight: 1,
          }}
        >
          <Popup>
            <div className="text-xs min-w-[150px]">
              <div className="font-bold">{c.nom}</div>
              <div className="text-slate-500">{c.zone}</div>
              {c.agent_focus && <div className="text-[10px] text-blue-600">Commercial : {c.agent_focus}</div>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {hub.visites_jour.map(v => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={visitIcon(v, selectedVisiteId === v.id)}
          eventHandlers={{
            click: () => {
              onSelectVisite(v.id)
              onSelectZone(null)
              onSelectAgent(null)
            },
          }}
        >
          <Popup>
            <div className="text-xs min-w-[170px]">
              <div className="font-bold">{v.client_nom}</div>
              <div className="text-slate-500">{v.heure} · {v.agent_nom.split(' ')[0]}</div>
              <div className="mt-1">{v.zone} · {v.methode.replace('_', ' ')}</div>
              <div className={cn('mt-1 font-bold', v.statut === 'POSITIVE' ? 'text-green-700' : 'text-red-600')}>
                {v.statut.replace('_', ' ')}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      <Marker position={[hub.agence.lat, hub.agence.lng]} icon={agenceIcon(hub.agence.color)}>
        <Popup>
          <div className="text-xs min-w-[140px]">
            <div className="font-bold">{hub.agence.nom}</div>
            <div className="text-slate-500">RA : {hub.agence.responsable}</div>
          </div>
        </Popup>
      </Marker>
      {hub.agents.map(a => (
        <Marker
          key={a.id}
          position={[a.lat, a.lng]}
          icon={agentIcon(a, selectedAgentId === a.id)}
          eventHandlers={{
            click: () => {
              onSelectAgent(a.id)
              onSelectZone(null)
              onSelectVisite(null)
            },
          }}
        >
          <Popup>
            <div className="text-xs min-w-[150px]">
              <div className="font-bold">{a.nom}</div>
              <div className="text-slate-500">{a.micro_zone}</div>
              <div className="mt-1">
                Visites {a.visites_jour}/{a.visites_prevues} · couv. {a.couverture_pct} %
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
