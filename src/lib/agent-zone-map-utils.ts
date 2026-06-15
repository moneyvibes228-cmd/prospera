import { AGENCES } from '@/lib/agences'
import { MICRO_ZONE_ANCHORS } from '@/lib/zones-clients-map'
import type { VisiteTerrain, ZoneAgent } from '@/lib/fiche-agent-microfinance'

const EXTRA_QUARTIER_ANCHORS: Record<string, { lat: number; lng: number }> = {
  'Rue des Bananiers': { lat: 6.1350, lng: 1.2140 },
  'Cité OUA': { lat: 6.1390, lng: 1.2110 },
  'Gbossimé': { lat: 6.165, lng: 1.198 },
  'Agbalépédogan': { lat: 6.172, lng: 1.188 },
  'Marché de Bè': { lat: 6.152, lng: 1.245 },
  'Agbalépédogan sud': { lat: 6.148, lng: 1.242 },
  'Adidogomé nord': { lat: 6.175, lng: 1.185 },
  Agoè: { lat: 6.178, lng: 1.175 },
  Kpimé: { lat: 6.905, lng: 0.635 },
  Agomé: { lat: 6.898, lng: 0.645 },
}

export function parseGpsCoord(gps: string): { lat: number; lng: number } | null {
  const m = gps.match(/([\d.]+)°N\s+([\d.]+)°E/)
  if (!m) return null
  return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
}

function agenceAnchor(name: string): { lat: number; lng: number } | null {
  const ag = AGENCES.find(a => a.nom === name || a.nom_court === name)
  if (!ag?.latitude || !ag?.longitude) return null
  return { lat: ag.latitude, lng: ag.longitude }
}

function quartierAnchor(quartier: string): { lat: number; lng: number } | null {
  return MICRO_ZONE_ANCHORS[quartier] ?? EXTRA_QUARTIER_ANCHORS[quartier] ?? agenceAnchor(quartier)
}

function squareAround(lat: number, lng: number, half = 0.008): [number, number][] {
  return [
    [lat - half, lng - half],
    [lat - half, lng + half],
    [lat + half, lng + half],
    [lat + half, lng - half],
  ]
}

/** Polygone de couverture à partir des quartiers assignés */
export function buildZonePolygon(quartiers: string[], padding = 0.007): [number, number][] {
  const anchors = quartiers.map(quartierAnchor).filter((a): a is NonNullable<typeof a> => !!a)
  if (anchors.length === 0) return []
  if (anchors.length === 1) return squareAround(anchors[0]!.lat, anchors[0]!.lng, padding * 1.4)

  const cx = anchors.reduce((s, a) => s + a.lat, 0) / anchors.length
  const cy = anchors.reduce((s, a) => s + a.lng, 0) / anchors.length

  const sorted = [...anchors].sort(
    (a, b) => Math.atan2(a.lat - cx, a.lng - cy) - Math.atan2(b.lat - cx, b.lng - cy),
  )

  return sorted.map(a => {
    const dLat = a.lat - cx
    const dLng = a.lng - cy
    const norm = Math.sqrt(dLat * dLat + dLng * dLng) || 1
    return [a.lat + (dLat / norm) * padding, a.lng + (dLng / norm) * padding] as [number, number]
  })
}

export function getZonePolygons(zones: ZoneAgent[]): Array<{ id: string; nom: string; positions: [number, number][]; color: string }> {
  const colors = ['#0d9488', '#6366f1', '#f97316', '#2563eb']
  return zones
    .map((z, i) => ({
      id: z.id,
      nom: z.nom,
      positions: buildZonePolygon(z.quartiers),
      color: colors[i % colors.length]!,
    }))
    .filter(z => z.positions.length >= 3)
}

function parseVisiteDate(date: string): { month: string; year: string } | null {
  const parts = date.split('/')
  if (parts.length !== 3) return null
  return { month: parts[1]!, year: parts[2]! }
}

/** Visites géolocalisées du mois courant (réf. = mois le plus récent dans les données) */
export function getVisitesMoisCoords(visites: VisiteTerrain[]): Array<{
  id: string
  lat: number
  lng: number
  client: string
  type: VisiteTerrain['type']
  date: string
  heure: string
  resultat: VisiteTerrain['resultat']
  gps_conforme: boolean
}> {
  if (visites.length === 0) return []

  const ref = visites.reduce<{ month: string; year: string } | null>((latest, v) => {
    const d = parseVisiteDate(v.date)
    if (!d) return latest
    if (!latest) return d
    if (d.year > latest.year || (d.year === latest.year && d.month > latest.month)) return d
    return latest
  }, null)

  if (!ref) return []

  return visites
    .filter(v => {
      const d = parseVisiteDate(v.date)
      return d?.month === ref.month && d?.year === ref.year
    })
    .map(v => {
      const coord = parseGpsCoord(v.gps_reel) ?? parseGpsCoord(v.gps_declare)
      if (!coord) return null
      return {
        id: v.id,
        lat: coord.lat,
        lng: coord.lng,
        client: v.client,
        type: v.type,
        date: v.date,
        heure: v.heure,
        resultat: v.resultat,
        gps_conforme: v.gps_conforme,
      }
    })
    .filter((v): v is NonNullable<typeof v> => !!v)
}

export const VISITE_RESULTAT_COLOR: Record<VisiteTerrain['resultat'], string> = {
  POSITIVE: '#16a34a',
  NEGATIVE: '#dc2626',
  NEUTRE: '#64748b',
  PROMESSE_PAIEMENT: '#f59e0b',
}

export const VISITE_TYPE_LABEL: Record<VisiteTerrain['type'], string> = {
  DOMICILE: 'Domicile',
  ACTIVITE: 'Activité',
  RECOUVREMENT: 'Recouvrement',
  PROSPECTION: 'Prospection',
  INSTRUCTION: 'Instruction',
  SUIVI: 'Suivi',
}
