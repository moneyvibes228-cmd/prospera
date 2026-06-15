/**
 * Clients géolocalisés par micro-zone — alimente la carte DG /zones et AgenceMap.
 * Effectifs alignés sur AGENCES.emprunteurs_actifs (188 réseau, 62 Lomé Centre).
 */

import { AGENCES } from '@/lib/agences'
import { ALL_CLIENTS, type MockClientGeo } from '@/lib/mockClients'

export interface ClientZoneMarker {
  id: string
  nom: string
  agence_id: string
  agence: string
  zone: string
  lat: number
  lng: number
  statut: 'ACTIF' | 'EN_RETARD' | 'CONTENTIEUX'
  score_ia: number
  encours_fcfa: number
  agent_focus?: string
}

/** Ancres micro-zones Lomé Centre + réseau */
export const MICRO_ZONE_ANCHORS: Record<string, { lat: number; lng: number; agence_id: string; agence: string; commercial?: string }> = {
  'Marché Grand Lomé': { lat: 6.1375, lng: 1.2123, agence_id: 'AG-001', agence: 'Lomé Centre', commercial: 'Yawo Adjavon' },
  'Assigamé': { lat: 6.1719, lng: 1.2110, agence_id: 'AG-001', agence: 'Lomé Centre', commercial: 'Yawo Adjavon' },
  'Tokoin': { lat: 6.1420, lng: 1.2250, agence_id: 'AG-001', agence: 'Lomé Centre', commercial: 'Mensah Kodjo' },
  'Adakpamé': { lat: 6.1550, lng: 1.1950, agence_id: 'AG-001', agence: 'Lomé Centre', commercial: 'Mensah Kodjo' },
  'Bé Nord': { lat: 6.1450, lng: 1.2180, agence_id: 'AG-001', agence: 'Lomé Centre', commercial: 'Yawo Adjavon' },
  'Marché Adidogomé': { lat: 6.168, lng: 1.195, agence_id: 'AG-002', agence: 'Adidogomé', commercial: 'Sena Dossou' },
  'Bè Kpota': { lat: 6.155, lng: 1.248, agence_id: 'AG-003', agence: 'Bè Kpota', commercial: 'Kossi Adjavon' },
  'Hédzranawoé': { lat: 6.148, lng: 1.178, agence_id: 'AG-004', agence: 'Hédzranawoé', commercial: 'Elom Komlavi' },
  'Kpalimé Centre': { lat: 6.900, lng: 0.640, agence_id: 'AG-005', agence: 'Kpalimé', commercial: 'Akoue Yawa' },
}

const LC_ZONES = ['Marché Grand Lomé', 'Assigamé', 'Tokoin', 'Adakpamé', 'Bé Nord'] as const

const QUARTIER_TO_ZONE: Record<string, string> = {
  'Grand Marché': 'Marché Grand Lomé',
  'Zongo': 'Marché Grand Lomé',
  'Hanoukopé': 'Tokoin',
  'Kodjoviakopé': 'Assigamé',
  'Nyékonakpoè': 'Adakpamé',
  'Quartier Administratif': 'Marché Grand Lomé',
  'Amoutivé': 'Bé Nord',
}

const AGENCE_DEFAULT_ZONE: Record<string, string> = {
  'AG-002': 'Marché Adidogomé',
  'AG-003': 'Bè Kpota',
  'AG-004': 'Hédzranawoé',
  'AG-005': 'Kpalimé Centre',
}

function mapClient(c: MockClientGeo, zone: string, agent?: string): ClientZoneMarker {
  const anchor = MICRO_ZONE_ANCHORS[zone]
  return {
    id: c.id,
    nom: c.nom,
    agence_id: c.agence_id,
    agence: anchor?.agence ?? c.agence_id,
    zone,
    lat: c.lat,
    lng: c.lng,
    statut: c.status,
    score_ia: c.score_ia,
    encours_fcfa: c.montant_credit,
    agent_focus: agent ?? anchor?.commercial,
  }
}

function spreadAroundAnchor(
  c: MockClientGeo,
  i: number,
  anchor: { lat: number; lng: number },
  spread: number,
): MockClientGeo {
  const golden = 2.399963
  const r = Math.sqrt((i % 12 + 1) / 12) * spread
  const angle = i * golden
  return {
    ...c,
    lat: anchor.lat + r * Math.sin(angle),
    lng: anchor.lng + r * Math.cos(angle) / Math.cos(anchor.lat * Math.PI / 180),
  }
}

/** Clients Lomé Centre — 62 répartis sur 5 micro-zones commerciales */
function buildLomeCentreClients(): ClientZoneMarker[] {
  const count = AGENCES.find(a => a.id === 'AG-001')!.emprunteurs_actifs
  const ag001 = ALL_CLIENTS.filter(c => c.agence_id === 'AG-001').slice(0, count)
  return ag001.map((c, i) => {
    const zoneFromQuartier = QUARTIER_TO_ZONE[c.quartier]
    const zone = zoneFromQuartier ?? LC_ZONES[i % LC_ZONES.length]
    const anchor = MICRO_ZONE_ANCHORS[zone]!
    return mapClient(spreadAroundAnchor(c, i, anchor, 0.004), zone, anchor.commercial)
  })
}

function buildAgenceClients(agenceId: string): ClientZoneMarker[] {
  if (agenceId === 'AG-001') return buildLomeCentreClients()

  const agence = AGENCES.find(a => a.id === agenceId)
  if (!agence) return []

  const zone = AGENCE_DEFAULT_ZONE[agenceId] ?? agence.nom_court
  const anchor = MICRO_ZONE_ANCHORS[zone]
  const spread = agenceId === 'AG-005' ? 0.024 : 0.018

  return ALL_CLIENTS
    .filter(c => c.agence_id === agenceId)
    .slice(0, agence.emprunteurs_actifs)
    .map((c, i) => {
      const positioned = anchor ? spreadAroundAnchor(c, i, anchor, spread) : c
      return mapClient(positioned, zone, anchor?.commercial)
    })
}

/** Total clients cartographiés = somme emprunteurs_actifs des 5 agences (188) */
export function getClientsZonesMap(agenceId?: string | null): ClientZoneMarker[] {
  const all = AGENCES.flatMap(a => buildAgenceClients(a.id))
  if (!agenceId) return all
  return all.filter(c => c.agence_id === agenceId)
}

export function getTotalClientsCartographies(): number {
  return AGENCES.reduce((s, a) => s + a.emprunteurs_actifs, 0)
}
