'use client'

import { MapContainer, TileLayer, Circle, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { formatFcfa, cn } from '@/lib/utils'
import type { ZonesHub, AgentZone } from '@/lib/zones-hub'
import type { ZoneControlee } from '@/lib/rcc-commercial-hub'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const STATUT_LABEL: Record<string, string> = {
  BON: 'Bon', NORMAL: 'Normal', TENSION: 'Tension', DEGRADE: 'Dégradé',
}

const CLIENT_COLOR: Record<string, string> = {
  ACTIF: '#14b8a6',
  EN_RETARD: '#f97316',
  CONTENTIEUX: '#dc2626',
}

function agentIcon(agent: AgentZone, selected: boolean) {
  if (agent.est_pilotage) {
    const size = selected ? 16 : 13
    return L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;border-radius:3px;background:#6366f1;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)${selected ? ';outline:2px solid #0d9488;outline-offset:2px' : ''}"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  }
  const color = agent.role === 'GP' ? '#0d9488' : agent.statut === 'DEGRADE' ? '#ef4444' : agent.statut === 'NORMAL' ? '#f97316' : '#2563eb'
  const size = selected ? 14 : 11
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)${selected ? ';outline:2px solid #0d9488;outline-offset:2px' : ''}"></div>`,
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
  hub: ZonesHub
  selectedZoneId: string | null
  selectedAgentId: string | null
  onSelectZone: (id: string | null) => void
  onSelectAgent: (id: string | null) => void
  focus: 'lome' | 'kpalime'
}

export default function ZonesDgMap({ hub, selectedZoneId, selectedAgentId, onSelectZone, onSelectAgent, focus }: Props) {
  const center: [number, number] = focus === 'kpalime' ? [6.900, 0.640] : [6.152, 1.210]
  const zoom = focus === 'kpalime' ? 13 : 12

  const zones = focus === 'kpalime'
    ? hub.micro_zones.filter(z => z.agence === 'Kpalimé')
    : hub.micro_zones.filter(z => z.agence !== 'Kpalimé')

  const agents = focus === 'kpalime'
    ? hub.agents.filter(a => a.agence_id === 'AG-005')
    : hub.agents.filter(a => a.agence_id !== 'AG-005')

  const clients = focus === 'kpalime'
    ? hub.clients.filter(c => c.agence_id === 'AG-005')
    : hub.clients.filter(c => c.agence_id !== 'AG-005')

  const agences = focus === 'kpalime'
    ? hub.agences.filter(a => a.id === 'AG-005')
    : hub.agences.filter(a => a.id !== 'AG-005')

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className="z-0">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
      {zones.map(z => (
        <Circle
          key={z.id}
          center={[z.lat, z.lng]}
          radius={900}
          pathOptions={{
            color: selectedZoneId === z.id ? '#0d9488' : z.couleur,
            fillColor: z.couleur,
            fillOpacity: selectedZoneId === z.id ? 0.22 : 0.12,
            weight: selectedZoneId === z.id ? 3 : 2,
          }}
          eventHandlers={{
            click: () => { onSelectZone(z.id); onSelectAgent(null) },
          }}
        >
          <Popup>
            <ZonePopup zone={z} />
          </Popup>
        </Circle>
      ))}
      {clients.map(c => (
        <CircleMarker
          key={c.id}
          center={[c.lat, c.lng]}
          radius={c.statut === 'CONTENTIEUX' ? 5 : c.statut === 'EN_RETARD' ? 4 : 3}
          pathOptions={{
            color: '#fff',
            fillColor: CLIENT_COLOR[c.statut],
            fillOpacity: 0.85,
            weight: 1,
          }}
        >
          <Popup>
            <div className="text-xs min-w-[160px]">
              <div className="font-bold">{c.nom}</div>
              <div className="text-slate-500">{c.zone} · {c.agence}</div>
              <div className="mt-1">Encours : {formatFcfa(c.encours_fcfa)}</div>
              {c.agent_focus && <div className="text-[10px] text-blue-600 mt-1">Commercial : {c.agent_focus}</div>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {agences.map(a => (
        <Marker key={a.id} position={[a.latitude, a.longitude]} icon={agenceIcon(a.color)}>
          <Popup>
            <div className="text-xs min-w-[140px]">
              <div className="font-bold">{a.nom_court}</div>
              <div className="text-slate-500">RA : {a.responsable} · {a.emprunteurs_actifs} clients</div>
              <div className="mt-1">PAR {a.par_courant} %</div>
            </div>
          </Popup>
        </Marker>
      ))}
      {agents.map(a => (
        <Marker
          key={a.id}
          position={[a.lat, a.lng]}
          icon={agentIcon(a, selectedAgentId === a.id)}
          eventHandlers={{
            click: () => { onSelectAgent(a.id); onSelectZone(null) },
          }}
        >
          <Popup>
            <AgentPopup agent={a} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

function ZonePopup({ zone }: { zone: ZoneControlee }) {
  return (
    <div className="text-xs min-w-[160px]">
      <div className="font-bold">{zone.nom}</div>
      <div className="text-slate-500">{zone.agence} · {zone.agents_assignes} agent(s)</div>
      <div className="mt-1">Couverture : <strong>{zone.couverture_pct} %</strong></div>
      <div>Collecte : {formatFcfa(zone.collecte_jour)} / {formatFcfa(zone.objectif_jour)}</div>
      <div className="mt-1 font-bold">{STATUT_LABEL[zone.statut]}</div>
    </div>
  )
}

function AgentPopup({ agent }: { agent: AgentZone }) {
  return (
    <div className="text-xs min-w-[150px]">
      <div className="font-bold">{agent.nom}</div>
      <div className="text-slate-500">{agent.role} · {agent.micro_zone}</div>
      {agent.est_pilotage ? (
        <div className="mt-1 text-indigo-600 font-medium">Pilotage agence — 0 visite terrain</div>
      ) : (
        <>
          <div className="mt-1">Couverture : <strong>{agent.couverture_pct} %</strong></div>
          <div>Visites : {agent.visites_jour}/{agent.visites_prevues}</div>
          <div>{agent.clients_portefeuille} clients</div>
        </>
      )}
      {agent.gps_alerte && <div className="mt-1 text-red-600 font-bold">Alerte GPS</div>}
    </div>
  )
}
