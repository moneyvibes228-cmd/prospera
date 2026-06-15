/**
 * Couverture terrain & visites — vue RA (une agence), alignée sur /zones DG.
 */
import { AGENCES } from '@/lib/agences'
import { buildEmprunteursReseau } from '@/lib/emprunteurs-builder'
import { getRaHubData } from '@/lib/ra-agence-hub'
import type { AgentTerrainRA } from '@/lib/ra-agence-hub'
import { getPortefeuilleAgence } from '@/lib/portefeuille-agences-config'
import { getClientsZonesMap, type ClientZoneMarker } from '@/lib/zones-clients-map'
import { getZonesHub, type AgentZone } from '@/lib/zones-hub'
import type { ZoneControlee } from '@/lib/rcc-commercial-hub'

export interface VisiteTerrainRa {
  id: string
  client_nom: string
  client_id: string
  agent_nom: string
  zone: string
  lat: number
  lng: number
  heure: string
  methode: 'VISITE_TERRAIN' | 'APPEL'
  statut: 'POSITIVE' | 'NEGATIVE' | 'SANS_REPONSE'
  commentaire: string
}

export interface RaTerrainZonesHub {
  agence: { id: string; nom: string; responsable: string; lat: number; lng: number; color: string }
  synthese: string
  kpis: {
    micro_zones: number
    couverture_moy_pct: number
    visites_realisees: number
    visites_prevues: number
    clients_cartographies: number
    agents_actifs: number
  }
  micro_zones: ZoneControlee[]
  agents: AgentZone[]
  clients: ClientZoneMarker[]
  visites_jour: VisiteTerrainRa[]
  lacunes: Array<{ zone: string; couverture_pct: number; impact: string }>
}

const HEURES_VISITES = [
  '07:55', '08:18', '08:42', '09:05', '09:38', '10:12', '10:45', '11:20',
  '14:02', '14:35', '15:10', '15:48', '16:22', '16:55', '17:18', '17:45',
]

function buildVisitesJour(
  agenceNom: string,
  agents: AgentTerrainRA[],
  clients: ClientZoneMarker[],
): VisiteTerrainRa[] {
  const borrowers = buildEmprunteursReseau().filter(b => b.zone === agenceNom)
  const out: VisiteTerrainRa[] = []
  let hi = 0

  for (const agent of agents) {
    const pool = clients.filter(c => c.agent_focus === agent.nom)
    const source = pool.length > 0 ? pool : clients

    for (let i = 0; i < agent.visites_jour; i++) {
      const c = source[i % source.length]!
      const borrower = borrowers.find(b => b.nom === c.nom)
      const negative = agent.statut === 'DEGRADE' && i % 4 === 3
      out.push({
        id: `VRA-${agent.id}-${i + 1}`,
        client_nom: c.nom,
        client_id: borrower?.id ?? c.id,
        agent_nom: agent.nom,
        zone: c.zone,
        lat: c.lat + ((i % 5) - 2) * 0.00025,
        lng: c.lng + ((i % 3) - 1) * 0.0002,
        heure: HEURES_VISITES[hi++ % HEURES_VISITES.length]!,
        methode: i % 5 === 0 ? 'APPEL' : 'VISITE_TERRAIN',
        statut: negative ? 'NEGATIVE' : i % 7 === 6 ? 'SANS_REPONSE' : 'POSITIVE',
        commentaire: negative
          ? 'Client absent — reprogrammer visite demain matin'
          : 'Point de situation / encaissement conforme au plan de tournée',
      })
    }
  }

  return out.sort((a, b) => a.heure.localeCompare(b.heure))
}

function mapAgentsTerrain(agenceId: string, agenceNom: string, terrain: AgentTerrainRA[]): AgentZone[] {
  const cfg = getPortefeuilleAgence(agenceId)
  return terrain.map(a => {
    const commercial = cfg?.commerciaux.find(c => c.nom === a.nom)
    return {
      id: a.id,
      nom: a.nom,
      role: 'Commercial',
      agence_id: agenceId,
      agence: agenceNom,
      micro_zone: commercial?.zone ?? a.role,
      lat: a.lat,
      lng: a.lng,
      actif: a.actif,
      statut: a.statut === 'BON' ? 'BON' : a.statut === 'DEGRADE' ? 'DEGRADE' : 'NORMAL',
      couverture_pct: a.couverture_pct,
      visites_jour: a.visites_jour,
      visites_prevues: a.visites_prevues,
      clients_portefeuille: commercial?.clients ?? Math.round(300 / Math.max(terrain.length, 1)),
      gps_conformite_pct: Math.min(99, a.couverture_pct + 6),
      gps_alerte: a.couverture_pct < 70,
      ia_resume:
        a.statut === 'DEGRADE'
          ? `Couverture ${a.couverture_pct} % — priorité recouvrement zone ${commercial?.zone ?? 'terrain'}`
          : `Tournée du jour ${a.visites_jour}/${a.visites_prevues} visites · collecte ${Math.round(a.collecte_jour / 1000)}k`,
    }
  })
}

export function getRaTerrainZonesHub(agenceId = 'AG-001'): RaTerrainZonesHub {
  const ag = AGENCES.find(a => a.id === agenceId)!
  const ra = getRaHubData(agenceId)
  const full = getZonesHub()

  const micro_zones = full.micro_zones.filter(z => z.agence === ag.nom_court)
  const agents = mapAgentsTerrain(agenceId, ag.nom_court, ra.agents_terrain)
  const clients = getClientsZonesMap(agenceId)
  const visites_jour = buildVisitesJour(ag.nom_court, ra.agents_terrain, clients)

  const couvertureMoy = micro_zones.length
    ? Math.round(micro_zones.reduce((s, z) => s + z.couverture_pct, 0) / micro_zones.length)
    : 0

  const visitesRealisees = ra.agents_terrain.reduce((s, a) => s + a.visites_jour, 0)
  const visitesPrevues = ra.agents_terrain.reduce((s, a) => s + a.visites_prevues, 0)

  const lacunes = micro_zones
    .filter(z => z.couverture_pct < 70)
    .map(z => ({
      zone: z.nom,
      couverture_pct: z.couverture_pct,
      impact:
        z.couverture_pct < 55
          ? 'Objectif collecte zone en risque — renfort ou réaffectation visites'
          : 'Tournées incomplètes — clients périphérie non vus',
    }))

  const cfg = getPortefeuilleAgence(agenceId)

  return {
    agence: {
      id: ag.id,
      nom: ag.nom_court,
      responsable: ag.responsable,
      lat: ag.latitude,
      lng: ag.longitude,
      color: ag.color,
    },
    synthese:
      `${ag.nom_court} : ${micro_zones.length} micro-zones · ${clients.length} clients cartographiés · ` +
      `${visitesRealisees}/${visitesPrevues} visites réalisées aujourd'hui. ` +
      `${cfg?.commerciaux.map(c => `${c.nom.split(' ')[0]} (${c.zone}, ${c.clients} clients)`).join(' · ') ?? ''}. ` +
      (lacunes.length > 0
        ? `Lacune : ${lacunes[0]!.zone} à ${lacunes[0]!.couverture_pct} %.`
        : 'Couverture homogène sur le périmètre.'),
    kpis: {
      micro_zones: micro_zones.length,
      couverture_moy_pct: couvertureMoy,
      visites_realisees: visitesRealisees,
      visites_prevues: visitesPrevues,
      clients_cartographies: clients.length,
      agents_actifs: ra.agents_terrain.filter(a => a.actif).length,
    },
    micro_zones,
    agents,
    clients,
    visites_jour,
    lacunes,
  }
}
