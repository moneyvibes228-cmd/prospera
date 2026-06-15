/** Hub zones terrain DG — couverture réseau & affectations (≠ dashboard / équipe) */

import { AGENCES, RESEAU_CONSOLIDE } from '@/lib/agences'
import { getEquipeHub } from '@/lib/equipe-hub'
import { MOCK_COMMUNICATION_HOME } from '@/lib/mockMicrofinance'
import type { ZoneControlee } from '@/lib/rcc-commercial-hub'
import { getClientsZonesMap, type ClientZoneMarker } from '@/lib/zones-clients-map'

export type { ClientZoneMarker }

export interface AgentZone {
  id: string
  nom: string
  role: string
  agence_id: string
  agence: string
  micro_zone: string
  lat: number
  lng: number
  actif: boolean
  statut: 'BON' | 'NORMAL' | 'DEGRADE'
  couverture_pct: number
  visites_jour: number
  visites_prevues: number
  clients_portefeuille: number
  gps_conformite_pct: number
  gps_alerte: boolean
  ia_resume: string
  est_pilotage?: boolean
}

export interface ZoneExpansion {
  id: string
  nom: string
  potentiel: 'TRES_ELEVE' | 'ELEVE' | 'MODERE'
  prospects: number
  couverture_pct: number
  agence_ref: string
  agence_nom: string
  action: string
  confidence: number
  roi_rapide: boolean
}

export interface ZonesHub {
  synthese_memo: string
  kpis: {
    couverture_micro_zones_pct: number
    zones_actives: number
    zones_vierges: number
    agents_terrain_actifs: number
    agents_total: number
    clients_cartographie: number
    penetration_marche_pct: number
    anomalies_gps_7j: number
    rayon_couverture_km: number
  }
  agences: typeof AGENCES
  micro_zones: ZoneControlee[]
  agents: AgentZone[]
  clients: ClientZoneMarker[]
  zones_expansion: ZoneExpansion[]
  lacunes: Array<{ zone: string; agence: string; couverture_pct: number; impact: string; priorite: 1 | 2 | 3 }>
  decisions_dg: Array<{ priorite: 1 | 2 | 3; titre: string; detail: string; impact: string; delai: string }>
  glossaire: Array<{ terme: string; definition: string; seuil_dg?: string }>
  reference_equipe: {
    agents_degrades: number
    performance_moyenne_pct: number
  }
}

const AGENT_POSITIONS: Record<string, { lat: number; lng: number; micro_zone: string; couverture_pct: number }> = {
  'Yawo Adjavon':    { lat: 6.138, lng: 1.210, micro_zone: 'Marché / Assigamé',   couverture_pct: 92 },
  'Mensah Kodjo':    { lat: 6.155, lng: 1.195, micro_zone: 'Tokoin / Adakpamé',   couverture_pct: 42 },
  'Mawunya Kpodzo':  { lat: 6.136, lng: 1.214, micro_zone: 'Guichet — Lomé Centre', couverture_pct: 88 },
  'Sena Dossou':     { lat: 6.170, lng: 1.192, micro_zone: 'Marché Adidogomé',    couverture_pct: 88 },
  'Kossi Adjavon':   { lat: 6.152, lng: 1.250, micro_zone: 'Bè Kpota',            couverture_pct: 74 },
  'Elom Komlavi':    { lat: 6.148, lng: 1.178, micro_zone: 'Hédzranawoé',         couverture_pct: 86 },
  'Akoue Yawa':      { lat: 6.902, lng: 0.638, micro_zone: 'Kpalimé Centre',      couverture_pct: 82 },
}

const RA_NOMS = new Set(['Kofi Amavi', 'Akua Lawson', 'Edem Kpélim', 'Komi Atsu', 'Ama Fiagbé'])

const MICRO_ZONES: ZoneControlee[] = [
  { id: 'Z-01', nom: 'Marché Adidogomé',   agence: 'Adidogomé',   lat: 6.168, lng: 1.195, couverture_pct: 92, collecte_jour: 620_000, objectif_jour: 680_000, agents_assignes: 1, statut: 'BON',     couleur: '#16a34a' },
  { id: 'Z-02', nom: 'Lomé Centre',        agence: 'Lomé Centre', lat: 6.138, lng: 1.212, couverture_pct: 88, collecte_jour: 980_000, objectif_jour: 1_050_000, agents_assignes: 3, statut: 'BON',     couleur: '#14b8a6' },
  { id: 'Z-03', nom: 'Bè Kpota',           agence: 'Bè Kpota',    lat: 6.155, lng: 1.248, couverture_pct: 74, collecte_jour: 480_000, objectif_jour: 650_000, agents_assignes: 1, statut: 'TENSION', couleur: '#f97316' },
  { id: 'Z-04', nom: 'Tokoin Hôpital',     agence: 'Lomé Centre', lat: 6.142, lng: 1.225, couverture_pct: 68, collecte_jour: 320_000, objectif_jour: 420_000, agents_assignes: 1, statut: 'NORMAL',  couleur: '#6366f1' },
  { id: 'Z-05', nom: 'Adakpamé Carrefour', agence: 'Lomé Centre', lat: 6.162, lng: 1.188, couverture_pct: 53, collecte_jour: 210_000, objectif_jour: 400_000, agents_assignes: 1, statut: 'DEGRADE', couleur: '#ef4444' },
  { id: 'Z-06', nom: 'Assigamé',           agence: 'Lomé Centre', lat: 6.172, lng: 1.211, couverture_pct: 85, collecte_jour: 380_000, objectif_jour: 450_000, agents_assignes: 1, statut: 'BON',     couleur: '#0d9488' },
  { id: 'Z-07', nom: 'Hédzranawoé',        agence: 'Hédzranawoé', lat: 6.148, lng: 1.178, couverture_pct: 61, collecte_jour: 180_000, objectif_jour: 280_000, agents_assignes: 1, statut: 'NORMAL',  couleur: '#a855f7' },
  { id: 'Z-08', nom: 'Kpalimé Centre',     agence: 'Kpalimé',     lat: 6.900, lng: 0.640, couverture_pct: 86, collecte_jour: 340_000, objectif_jour: 400_000, agents_assignes: 1, statut: 'BON',     couleur: '#22c55e' },
]

function buildHub(): ZonesHub {
  const equipe = getEquipeHub()
  const territoire = MOCK_COMMUNICATION_HOME.couverture_territoire
  const zonesVierges = territoire.zones_expansion_ia.filter(z => z.couverture_pct === 0).length
  const clients = getClientsZonesMap()

  const agents: AgentZone[] = equipe.agents.map(a => {
    const agenceMeta = AGENCES.find(ag => ag.id === a.agence_id)
    const isRA = a.role === 'Resp. agence' || RA_NOMS.has(a.nom)
    const pos = isRA
      ? {
          lat: agenceMeta?.latitude ?? 6.15,
          lng: agenceMeta?.longitude ?? 1.21,
          micro_zone: `${a.agence} — agence (pilotage)`,
          couverture_pct: a.gps_conformite_pct,
        }
      : (AGENT_POSITIONS[a.nom] ?? {
          lat: agenceMeta?.latitude ?? 6.15,
          lng: agenceMeta?.longitude ?? 1.21,
          micro_zone: a.agence,
          couverture_pct: 75,
        })
    return {
      id: a.id,
      nom: a.nom,
      role: a.role,
      agence_id: a.agence_id,
      agence: a.agence,
      micro_zone: pos.micro_zone,
      lat: pos.lat,
      lng: pos.lng,
      actif: a.actif,
      statut: a.statut,
      couverture_pct: pos.couverture_pct,
      visites_jour: isRA ? 0 : a.visites_jour,
      visites_prevues: isRA ? 0 : Math.round(a.visites_objectif / 22),
      clients_portefeuille: a.clients_portefeuille,
      gps_conformite_pct: a.gps_conformite_pct,
      gps_alerte: !isRA && (a.gps_conformite_pct < 80 || a.nom === 'Mensah Kodjo' || a.nom === 'Kossi Adjavon'),
      ia_resume: a.ia_resume,
      est_pilotage: isRA,
    }
  })

  const couvertureMoy = Math.round(
    MICRO_ZONES.reduce((s, z) => s + z.couverture_pct, 0) / MICRO_ZONES.length,
  )

  const marcheEstime = 600
  const penetration = Math.round((RESEAU_CONSOLIDE.total_emprunteurs / marcheEstime) * 100)
  const agentsTerrain = agents.filter(a => !a.est_pilotage && a.actif)

  const lacunes = MICRO_ZONES
    .filter(z => z.couverture_pct < 70)
    .map(z => ({
      zone: z.nom,
      agence: z.agence,
      couverture_pct: z.couverture_pct,
      impact: z.couverture_pct < 55
        ? 'Collecte −40 % vs objectif · risque attrition clients'
        : 'Visites incomplètes · retards collecte en hausse',
      priorite: (z.couverture_pct < 55 ? 1 : z.couverture_pct < 65 ? 2 : 3) as 1 | 2 | 3,
    }))

  return {
    synthese_memo:
      `Couverture réseau : ${couvertureMoy} % sur ${MICRO_ZONES.length} micro-zones · ${clients.length} clients géolocalisés. ` +
      `5 responsables d'agence en pilotage (0 visite terrain) · ${agentsTerrain.length} agents commerciaux/GP sur le terrain. ` +
      `Lomé Centre : 62 clients uniques — Yawo (Marché/Assigamé), Mensah (Tokoin/Adakpamé), Mawunya (GP guichet). ` +
      `Lacune critique : Adakpamé 53 % (Mensah Kodjo). Audit GPS équipe Bè Kpota (Kossi Adjavon).`,
    kpis: {
      couverture_micro_zones_pct: couvertureMoy,
      zones_actives: MICRO_ZONES.length,
      zones_vierges: zonesVierges,
      agents_terrain_actifs: agentsTerrain.length,
      agents_total: agents.length,
      clients_cartographie: clients.length,
      penetration_marche_pct: penetration,
      anomalies_gps_7j: agents.filter(a => a.gps_alerte).length,
      rayon_couverture_km: territoire.rayon_couverture_moy_km,
    },
    agences: AGENCES,
    micro_zones: MICRO_ZONES,
    agents,
    clients,
    zones_expansion: territoire.zones_expansion_ia.map(z => ({
      id: z.id,
      nom: z.nom,
      potentiel: z.potentiel as ZoneExpansion['potentiel'],
      prospects: z.prospects,
      couverture_pct: z.couverture_pct,
      agence_ref: z.agence_ref,
      agence_nom: AGENCES.find(a => a.id === z.agence_ref)?.nom_court ?? z.agence_ref,
      action: z.action,
      confidence: z.confidence,
      roi_rapide: z.roi_mois_3,
    })),
    lacunes,
    decisions_dg: [
      { priorite: 1, titre: 'Renfort zone Adakpamé / Tokoin', detail: 'Couverture 53 % — Mensah Kodjo (commercial) · 18/45 visites/mois', impact: '+210 k collecte/semaine', delai: 'Cette semaine' },
      { priorite: 1, titre: 'Audit GPS équipe Bè Kpota', detail: 'Kossi Adjavon (GP) — conformité 88 % · doublons check-in', impact: 'Intégrité données terrain', delai: '48h' },
      { priorite: 1, titre: 'Agent terrain Agoé-Nyivé', detail: '85 prospects · 0 % couverture · ROI estimé mois 3', impact: '+38 clients/an', delai: 'Juin' },
      { priorite: 2, titre: 'Second agent Hédzranawoé', detail: 'Elom Komlavi seul terrain — Komi Atsu pilote l\'agence', impact: 'Résilience opérationnelle', delai: 'Q3' },
      { priorite: 2, titre: 'Aligner visites commerciaux & relances GP', detail: '62 clients Lomé Centre — double vue terrain / crédit', impact: 'Recouvrement +4 pt', delai: 'Juin' },
      { priorite: 3, titre: 'Extension Kpalimé Nord', detail: '70 prospects vierges · agence pilote performante', impact: 'Croissance régionale', delai: 'Q3' },
    ],
    glossaire: [
      { terme: 'Micro-zone', definition: 'Périmètre géographique assigné à un commercial — rayon ~1,8 km en moyenne.', seuil_dg: 'Couverture < 65 % → renfort ou réaffectation.' },
      { terme: 'Couverture terrain', definition: 'Ratio visites réalisées / visites planifiées sur la micro-zone sur 7 jours glissants.', seuil_dg: '< 70 % pendant 2 semaines → alerte RCC.' },
      { terme: 'Resp. agence', definition: 'Pilote l\'agence depuis le guichet — ne compte pas dans les visites terrain (0 visite/jour).', seuil_dg: 'Suivi via PAR agence et performance équipe.' },
      { terme: 'Géofencing GPS', definition: 'Contrôle automatique des check-in agents vs position client déclarée.', seuil_dg: 'Conformité < 80 % → audit obligatoire.' },
      { terme: 'Zone vierge', definition: 'Secteur identifié avec prospects mais aucun agent assigné.', seuil_dg: 'Potentiel TRÈS ÉLEVÉ + ROI < 3 mois → recrutement prioritaire.' },
    ],
    reference_equipe: {
      agents_degrades: equipe.kpis.agents_degrades,
      performance_moyenne_pct: equipe.kpis.performance_moyenne_pct,
    },
  }
}

let _cache: ZonesHub | null = null

export function getZonesHub(): ZonesHub {
  if (!_cache) _cache = buildHub()
  return _cache
}
