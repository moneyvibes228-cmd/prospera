'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { VisiteTerrain, ZoneAgent } from '@/lib/fiche-agent-microfinance'
import {
  getVisitesMoisCoords,
  getZonePolygons,
  VISITE_RESULTAT_COLOR,
  VISITE_TYPE_LABEL,
} from '@/lib/agent-zone-map-utils'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 })
  }, [map, points])
  return null
}

interface Props {
  zones: ZoneAgent[]
  visites: VisiteTerrain[]
  agentNom: string
  height?: string
}

export default function AgentZoneMap({ zones, visites, agentNom, height = '320px' }: Props) {
  const zonePolygons = useMemo(() => getZonePolygons(zones), [zones])
  const visitesMois = useMemo(() => getVisitesMoisCoords(visites), [visites])

  const allPoints = useMemo(
    () => [
      ...zonePolygons.flatMap(z => z.positions),
      ...visitesMois.map(v => [v.lat, v.lng] as [number, number]),
    ],
    [zonePolygons, visitesMois],
  )

  const center: [number, number] = allPoints[0] ?? [6.138, 1.212]

  return (
    <div className="space-y-2">
      <div style={{ height }} className="rounded-lg overflow-hidden border border-slate-200">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />
          {allPoints.length > 0 && <FitBounds points={allPoints} />}
          {zonePolygons.map(z => (
            <Polygon
              key={z.id}
              positions={z.positions}
              pathOptions={{
                color: z.color,
                fillColor: z.color,
                fillOpacity: 0.18,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs min-w-[140px]">
                  <div className="font-bold">{z.nom}</div>
                  <div className="text-slate-500">{agentNom}</div>
                </div>
              </Popup>
            </Polygon>
          ))}
          {visitesMois.map(v => (
            <CircleMarker
              key={v.id}
              center={[v.lat, v.lng]}
              radius={7}
              pathOptions={{
                color: '#fff',
                fillColor: VISITE_RESULTAT_COLOR[v.resultat],
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs min-w-[160px] space-y-1">
                  <div className="font-bold">{v.client}</div>
                  <div className="text-slate-500">
                    {VISITE_TYPE_LABEL[v.type]} · {v.date} {v.heure}
                  </div>
                  <div className={v.gps_conforme ? 'text-emerald-600' : 'text-red-600'}>
                    GPS {v.gps_conforme ? 'conforme' : 'non conforme'}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-teal-500/30 border border-teal-600" />
          Zone couverte
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow" />
          Visite positive
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow" />
          Promesse
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow" />
          Négative
        </span>
        <span className="text-slate-400 ml-auto">{visitesMois.length} visite(s) ce mois</span>
      </div>
    </div>
  )
}
