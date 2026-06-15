'use client'
import { useEffect, useRef, useMemo, useState } from 'react'
import { MapPin, Eye, EyeOff, Zap, Users } from 'lucide-react'
import { AiBadge } from './AiBadge'
import {
  IA_ZONES_PROSPECTION,
  AGENCE_COLORS, AGENCE_NOMS_COURTS, AGENCE_CENTERS,
  type MockClientGeo, type ZoneProspection,
} from '@/lib/mockClients'
import { getClientsZonesMap } from '@/lib/zones-clients-map'
import { AGENCES } from '@/lib/agences'
import { formatFcfa } from '@/lib/utils'

interface AgenceMapProps {
  selectedAgenceId: string | null
}

// ── Stats rapides ─────────────────────────────────────────────────────────────
function MapStats({ clients, agenceId }: { clients: MockClientGeo[]; agenceId: string | null }) {
  const actifs      = clients.filter(c => c.status === 'ACTIF').length
  const retards     = clients.filter(c => c.status === 'EN_RETARD').length
  const contentieux = clients.filter(c => c.status === 'CONTENTIEUX').length
  const scoreAvg    = Math.round(clients.reduce((s, c) => s + c.score_ia, 0) / (clients.length || 1))
  const encours     = clients.reduce((s, c) => s + c.montant_credit, 0)

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-1.5 text-xs bg-white rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-teal-500" />
        <span className="font-bold text-slate-700">{actifs}</span><span className="text-slate-500">actifs</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs bg-white rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <span className="font-bold text-slate-700">{retards}</span><span className="text-slate-500">en retard</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs bg-white rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-red-600" />
        <span className="font-bold text-slate-700">{contentieux}</span><span className="text-slate-500">contentieux</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs bg-white rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
        <Zap size={10} className="text-indigo-500" />
        <span className="text-slate-500">Score IA moy.</span>
        <span className="font-bold text-indigo-700">{scoreAvg}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs bg-white rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
        <span className="text-slate-500">Encours</span>
        <span className="font-bold text-teal-700">{formatFcfa(encours)}</span>
      </div>
    </div>
  )
}

// ── Légende ───────────────────────────────────────────────────────────────────
function MapLegend({ showZones, onToggleZones }: { showZones: boolean; onToggleZones: () => void }) {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl border border-slate-200 shadow-lg p-3 text-xs space-y-2 max-w-44">
      <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide">Légende</div>
      <div className="space-y-1">
        <div className="font-medium text-slate-500 text-[10px] uppercase">Clients</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-500 opacity-90" /><span>Actif</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500 opacity-90" /><span>En retard</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600 opacity-90" /><span>Contentieux</span></div>
      </div>
      <div className="border-t border-slate-100 pt-2 space-y-1">
        <div className="font-medium text-slate-500 text-[10px] uppercase">Zones couvertes</div>
        {AGENCES.map(a => (
          <div key={a.id} className="flex items-center gap-2">
            <div className="w-3 h-1 rounded-full opacity-70" style={{ backgroundColor: AGENCE_COLORS[a.id] }} />
            <span className="text-[10px]">{a.initiales} · {a.nom_court}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 pt-2">
        <button onClick={onToggleZones} className="flex items-center gap-1.5 text-[10px] font-medium text-amber-700 hover:text-amber-900">
          {showZones ? <EyeOff size={10} /> : <Eye size={10} />}
          <span>{showZones ? 'Masquer' : 'Afficher'} zones IA</span>
        </button>
        {showZones && (
          <div className="mt-1 flex items-center gap-2">
            <div className="w-3 h-1 rounded-full bg-amber-400 opacity-80" />
            <span className="text-[10px] text-amber-700">Prospection IA</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Popup info zone IA ────────────────────────────────────────────────────────
function ZoneIATooltip({ zone, onClose }: { zone: ZoneProspection; onClose: () => void }) {
  const potStyle = {
    TRES_ELEVE: 'bg-red-100 text-red-700 border-red-200',
    ELEVE:      'bg-orange-100 text-orange-700 border-orange-200',
    MODERE:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  }
  return (
    <div className="absolute top-4 right-4 z-[1001] bg-white rounded-xl border border-amber-200 shadow-xl p-4 max-w-72 text-xs">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-bold text-slate-800 text-sm">{zone.nom}</div>
          <div className={`inline-block mt-0.5 px-2 py-0.5 rounded border text-[10px] font-bold ${potStyle[zone.potentiel]}`}>
            {zone.potentiel.replace('_', ' ')}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 flex-shrink-0 text-base leading-none">×</button>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <Zap size={10} className="text-amber-500" />
        <span className="text-amber-700 font-medium">Insight IA · Conf. {zone.confidence}%</span>
      </div>
      <p className="text-slate-600 leading-relaxed mb-2">{zone.raison_ia}</p>
      <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
        <div className="text-amber-700 font-semibold mb-0.5">Action recommandée :</div>
        <div className="text-amber-800">{zone.action_ia}</div>
      </div>
      <div className="mt-2 flex justify-between text-slate-500">
        <span>~{zone.clients_estimes} clients estimés</span>
        <span>Rayon {(zone.rayon_m / 1000).toFixed(1)} km</span>
      </div>
    </div>
  )
}

// ── Composant carte principal ─────────────────────────────────────────────────
export function AgenceMap({ selectedAgenceId }: AgenceMapProps) {
  const mapRef       = useRef<HTMLDivElement>(null)
  const leafletRef   = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null)
  const layersRef    = useRef<Record<string, unknown[]>>({})
  const [showZones,  setShowZones]  = useState(true)
  const [activeZone, setActiveZone] = useState<ZoneProspection | null>(null)
  const [mapReady,   setMapReady]   = useState(false)

  const clients = useMemo(() => {
    return getClientsZonesMap(selectedAgenceId).map(c => ({
      id: c.id,
      nom: c.nom,
      agence_id: c.agence_id,
      lat: c.lat,
      lng: c.lng,
      quartier: c.zone,
      status: c.statut,
      score_ia: c.score_ia,
      montant_credit: c.encours_fcfa,
    })) as MockClientGeo[]
  }, [selectedAgenceId])

  // ── Initialisation Leaflet ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    let cancelled = false
    let createdMap: import('leaflet').Map | null = null

    import('leaflet').then(mod => {
      if (cancelled || !mapRef.current) return
      // Garde-fou : si le container a déjà été initialisé (StrictMode / HMR), on sort
      const container = mapRef.current as HTMLDivElement & { _leaflet_id?: number }
      if (container._leaflet_id) return

      const L = mod.default ?? mod
      // Corriger icônes par défaut Leaflet (problème Next.js)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(container, {
        center: [6.15, 1.22],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      createdMap = map
      leafletRef.current = map as unknown as ReturnType<typeof import('leaflet')['map']>
      setMapReady(true)
    })

    return () => {
      cancelled = true
      if (leafletRef.current) {
        (leafletRef.current as unknown as import('leaflet').Map).remove()
        leafletRef.current = null
      } else if (createdMap) {
        // Couvre le cas où le cleanup arrive juste après la résolution du .then()
        ;(createdMap as import('leaflet').Map).remove()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Mise à jour calques quand agence ou données changent ──────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return
    const map = leafletRef.current as unknown as import('leaflet').Map

    import('leaflet').then(mod => {
      const L = mod.default ?? mod

      // Supprimer calques précédents
      Object.values(layersRef.current).forEach(layers =>
        (layers as import('leaflet').Layer[]).forEach(l => l.remove()),
      )
      layersRef.current = {}

      const allLayers: import('leaflet').Layer[] = []

      // ── Zones de couverture (cercles semi-transparents) ──────────────────
      const agencesToDraw = selectedAgenceId
        ? AGENCES.filter(a => a.id === selectedAgenceId)
        : AGENCES

      agencesToDraw.forEach(agence => {
        const center = AGENCE_CENTERS[agence.id]
        if (!center) return
        const color = AGENCE_COLORS[agence.id]
        const circle = L.circle(center, {
          radius: 1800,
          color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 2,
          opacity: 0.5,
          dashArray: undefined,
        }).addTo(map)
        circle.bindTooltip(
          `<b>${agence.nom}</b><br/>${agence.emprunteurs_actifs} emprunteurs · PAR ${agence.par_courant}%`,
          { permanent: false, className: 'text-xs' },
        )
        allLayers.push(circle)
      })

      // ── Marqueurs clients ────────────────────────────────────────────────
      const statusColor: Record<MockClientGeo['status'], string> = {
        ACTIF:       '#14b8a6',
        EN_RETARD:   '#f97316',
        CONTENTIEUX: '#dc2626',
      }
      const statusLabel: Record<MockClientGeo['status'], string> = {
        ACTIF:       'Actif',
        EN_RETARD:   'En retard',
        CONTENTIEUX: 'Contentieux',
      }

      clients.forEach(c => {
        const color = selectedAgenceId ? statusColor[c.status] : AGENCE_COLORS[c.agence_id]
        const marker = L.circleMarker([c.lat, c.lng], {
          radius:       c.status === 'CONTENTIEUX' ? 6 : c.status === 'EN_RETARD' ? 5 : 4,
          color:        '#fff',
          fillColor:    color,
          fillOpacity:  0.88,
          weight:       1.2,
        }).addTo(map)
        marker.bindPopup(`
          <div style="font-size:12px;min-width:180px">
            <b style="font-size:13px">${c.nom}</b><br/>
            <span style="color:#64748b">${c.quartier} · ${AGENCE_NOMS_COURTS[c.agence_id]}</span><br/>
            ${selectedAgenceId === 'AG-001' ? `<span style="color:#6366f1;font-size:11px">Zone commerciale</span><br/>` : ''}
            <div style="margin:6px 0;padding:4px 8px;background:${statusColor[c.status]}22;border-radius:6px;border:1px solid ${statusColor[c.status]}44">
              <b style="color:${statusColor[c.status]}">${statusLabel[c.status]}</b>
            </div>
            Crédit : <b>${c.montant_credit.toLocaleString('fr-FR')} FCFA</b><br/>
            Score IA : <b style="color:#6366f1">${c.score_ia}/100</b>
          </div>
        `, { maxWidth: 220 })
        allLayers.push(marker)
      })

      layersRef.current['main'] = allLayers

      // ── Zones de prospection IA ──────────────────────────────────────────
      const iaLayers: import('leaflet').Layer[] = []
      const zonesToShow = selectedAgenceId
        ? IA_ZONES_PROSPECTION.filter(z => z.agence_plus_proche === selectedAgenceId)
        : IA_ZONES_PROSPECTION

      if (showZones) {
        zonesToShow.forEach(zone => {
          const potColor: Record<ZoneProspection['potentiel'], string> = {
            TRES_ELEVE: '#ef4444',
            ELEVE:      '#f97316',
            MODERE:     '#eab308',
          }
          const c = potColor[zone.potentiel]
          const circle = L.circle([zone.lat, zone.lng], {
            radius:      zone.rayon_m,
            color:       c,
            fillColor:   c,
            fillOpacity: 0.06,
            weight:      2,
            dashArray:   '6 4',
            opacity:     0.7,
          }).addTo(map)
          circle.bindTooltip(`🎯 <b>${zone.nom}</b><br/>~${zone.clients_estimes} clients · Conf. ${zone.confidence}%`, {
            permanent: false,
            className: 'text-xs',
          })
          circle.on('click', () => setActiveZone(zone))
          iaLayers.push(circle)

          // Label IA au centre
          const label = L.marker([zone.lat, zone.lng], {
            icon: L.divIcon({
              html: `<div style="background:${c}ee;color:#fff;font-size:9px;font-weight:bold;padding:2px 6px;border-radius:20px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3)">🎯 IA</div>`,
              className: '',
              iconAnchor: [20, 8],
            }),
          }).addTo(map)
          label.on('click', () => setActiveZone(zone))
          iaLayers.push(label)
        })
      }
      layersRef.current['ia'] = iaLayers

      // ── Fit bounds selon la sélection ────────────────────────────────────
      if (selectedAgenceId) {
        const center = AGENCE_CENTERS[selectedAgenceId]
        if (center) {
          map.setView(center, selectedAgenceId === 'AG-005' ? 13 : 13)
        }
      } else {
        // Réseau complet — vue Lomé + Kpalimé
        try {
          const bounds = L.latLngBounds(clients.map(c => [c.lat, c.lng] as [number, number]))
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
        } catch {
          map.setView([6.15, 1.22], 12)
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, clients, selectedAgenceId, showZones])

  const shownZones = selectedAgenceId
    ? IA_ZONES_PROSPECTION.filter(z => z.agence_plus_proche === selectedAgenceId)
    : IA_ZONES_PROSPECTION

  return (
    <div className="space-y-3">
      {/* Stats rapides */}
      <MapStats clients={clients} agenceId={selectedAgenceId} />

      {/* Carte */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg" style={{ height: 480 }}>
        {/* Importer CSS Leaflet via <link> dynamique */}
        <style>{`
          @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
          .leaflet-container { font-family: inherit; }
          .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.15); }
          .leaflet-popup-tip { display: none; }
        `}</style>

        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Légende overlay */}
        {mapReady && (
          <MapLegend showZones={showZones} onToggleZones={() => setShowZones(v => !v)} />
        )}

        {/* Panel zone IA sélectionnée */}
        {activeZone && <ZoneIATooltip zone={activeZone} onClose={() => setActiveZone(null)} />}

        {/* Badge IA */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow border border-slate-200 text-xs font-medium text-slate-700">
            <MapPin size={11} className="text-teal-600" />
            {selectedAgenceId
              ? `${AGENCE_NOMS_COURTS[selectedAgenceId]} — ${clients.length} clients`
              : `Réseau complet — ${clients.length} clients · ${shownZones.length} zones IA`}
            <AiBadge variant="small" label="GPS validé" />
          </div>
        </div>
      </div>

      {/* Zones IA suggérées — liste ──────────────────────────────────────── */}
      {shownZones.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-amber-600" />
            <h4 className="text-sm font-semibold text-amber-900">
              Zones de prospection suggérées par l&apos;IA ({shownZones.length})
            </h4>
            <AiBadge variant="small" label="Analyse territoire" confidence={85} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {shownZones.map(z => {
              const potStyle = {
                TRES_ELEVE: 'text-red-700 bg-red-100 border-red-200',
                ELEVE:      'text-orange-700 bg-orange-100 border-orange-200',
                MODERE:     'text-yellow-700 bg-yellow-100 border-yellow-200',
              }
              return (
                <div key={z.id} className="bg-white rounded-xl border border-amber-100 p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-slate-800">{z.nom}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold flex-shrink-0 ${potStyle[z.potentiel]}`}>
                      {z.potentiel.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">{z.raison_ia}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users size={10} />
                      <span>~{z.clients_estimes} clients estimés</span>
                    </div>
                    <span className="text-xs font-medium text-indigo-600">Conf. {z.confidence}%</span>
                  </div>
                  <div className="mt-2 text-xs text-teal-700 font-medium bg-teal-50 rounded-lg px-2 py-1.5 border border-teal-100">
                    → {z.action_ia}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
