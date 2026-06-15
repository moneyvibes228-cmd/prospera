/**
 * Génère 100 clients GPS par agence pour la carte interactive.
 * Utilise la spirale de Fibonacci (angle d'or) pour une distribution naturelle.
 */

export interface MockClientGeo {
  id: string
  agence_id: string
  lat: number
  lng: number
  status: 'ACTIF' | 'EN_RETARD' | 'CONTENTIEUX'
  score_ia: number
  nom: string
  montant_credit: number
  quartier: string
}

export interface ZoneProspection {
  id: string
  nom: string
  lat: number
  lng: number
  rayon_m: number
  potentiel: 'TRES_ELEVE' | 'ELEVE' | 'MODERE'
  clients_estimes: number
  raison_ia: string
  agence_plus_proche: string
  confidence: number
  action_ia: string
}

// Noms togolais fictifs
const PRENOMS = ['Kofi', 'Ama', 'Komi', 'Akua', 'Edem', 'Abla', 'Yao', 'Afi', 'Sena', 'Mawuli', 'Akosua', 'Kwame', 'Adzo', 'Kafui', 'Selom']
const NOMS    = ['Amavi', 'Lawson', 'Atsu', 'Fiagbé', 'Kpélim', 'Tsatsu', 'Agbéko', 'Koudjo', 'Mensah', 'Agbodjan', 'Dossou', 'Hounyèvi', 'Woedem', 'Adzaho']

const QUARTIERS_LOME_CENTRE  = ['Zongo', 'Grand Marché', 'Hanoukopé', 'Kodjoviakopé', 'Nyékonakpoè', 'Quartier Administratif', 'Amoutivé']
const QUARTIERS_ADIDOGOME    = ['Adidogomé Centre', 'Togblékopé', 'Dantokpa', 'Kégué', 'Agbata', 'Nkafu']
const QUARTIERS_BE_KPOTA     = ['Bè Kpota', 'Bè Afrikopé', 'Adéwui', 'Akodesséwa', 'Port Area', 'Hanoukopé Est']
const QUARTIERS_HEDZRANAWOE  = ['Hédzranawoé', 'Ablogamé', 'Tokoin Ouest', 'Agbata Nord', 'Atikoumé']
const QUARTIERS_KPALIME      = ['Kpalimé Centre', 'Afédzato', 'Danyi', 'Kloto', 'Kpété Béna', 'Agou Marché']

function det(i: number, seed: number): number {
  const x = Math.sin(i * seed + i * 7.3) * 43758.5453
  return x - Math.floor(x)
}

function pickFrom<T>(arr: T[], i: number, seed: number): T {
  return arr[Math.floor(det(i, seed) * arr.length)]
}

function generateClientsForAgence(
  agenceId: string,
  centerLat: number,
  centerLng: number,
  count: number,
  parRate: number,
  quartiers: string[],
  spreadDeg = 0.022,
): MockClientGeo[] {
  const retardCount     = Math.floor(count * parRate)
  const contentieuxCount = Math.floor(retardCount * 0.25)
  const goldenAngle     = 2.399963   // radians
  const cosLat          = Math.cos(centerLat * Math.PI / 180)

  return Array.from({ length: count }, (_, i) => {
    const angle  = i * goldenAngle
    const radius = Math.sqrt((i + 1) / count) * spreadDeg
    const dlat   = radius * Math.sin(angle)
    const dlng   = radius * Math.cos(angle) / cosLat

    let status: MockClientGeo['status'] = 'ACTIF'
    if (i < contentieuxCount) status = 'CONTENTIEUX'
    else if (i < retardCount)  status = 'EN_RETARD'

    const seed = i + agenceId.charCodeAt(3) * 13
    const prenom = pickFrom(PRENOMS, seed, 7.1)
    const nom    = pickFrom(NOMS, seed, 11.3)
    const quartier = pickFrom(quartiers, i, 3.7)

    return {
      id: `${agenceId}-C${String(i + 1).padStart(3, '0')}`,
      agence_id: agenceId,
      lat: centerLat + dlat,
      lng: centerLng + dlng,
      status,
      score_ia:       Math.floor(30 + det(i, 17.3) * 70),
      nom:            `${prenom} ${nom}`,
      montant_credit: 50_000 + Math.floor(det(i, 23.7) * 450_000),
      quartier,
    }
  })
}

// ─── Données clients : 100 par agence ────────────────────────────────────────
export const CLIENTS_AG001 = generateClientsForAgence('AG-001', 6.1375, 1.2123, 100, 0.068, QUARTIERS_LOME_CENTRE)
export const CLIENTS_AG002 = generateClientsForAgence('AG-002', 6.1742, 1.1843, 100, 0.094, QUARTIERS_ADIDOGOME, 0.019)
export const CLIENTS_AG003 = generateClientsForAgence('AG-003', 6.1512, 1.2478, 100, 0.112, QUARTIERS_BE_KPOTA, 0.018)
export const CLIENTS_AG004 = generateClientsForAgence('AG-004', 6.1628, 1.1967, 100, 0.061, QUARTIERS_HEDZRANAWOE, 0.016)
export const CLIENTS_AG005 = generateClientsForAgence('AG-005', 6.9048, 0.6328, 100, 0.042, QUARTIERS_KPALIME, 0.024)

export const ALL_CLIENTS: MockClientGeo[] = [
  ...CLIENTS_AG001,
  ...CLIENTS_AG002,
  ...CLIENTS_AG003,
  ...CLIENTS_AG004,
  ...CLIENTS_AG005,
]

export function getClientsByAgence(agenceId: string | null): MockClientGeo[] {
  if (!agenceId) return ALL_CLIENTS
  return ALL_CLIENTS.filter(c => c.agence_id === agenceId)
}

// ─── Zones de prospection suggérées par l'IA ─────────────────────────────────
export const IA_ZONES_PROSPECTION: ZoneProspection[] = [
  {
    id: 'ZP-01',
    nom: 'Zone Agoé-Nyivé (Nord Lomé)',
    lat: 6.2040, lng: 1.2082,
    rayon_m: 1400,
    potentiel: 'TRES_ELEVE',
    clients_estimes: 85,
    raison_ia: 'Zone à croissance démographique rapide (+18%/an). Densité de petits commerces élevée. Zéro couverture microfinance actuellement. PAR estimé <5% (population stable, fonctionnaires).',
    agence_plus_proche: 'AG-001',
    confidence: 91,
    action_ia: 'Ouvrir un point de service ou recruter 1 agent terrain basé dans la zone',
  },
  {
    id: 'ZP-02',
    nom: 'Zone Tokoin Hôpital',
    lat: 6.1798, lng: 1.2148,
    rayon_m: 900,
    potentiel: 'ELEVE',
    clients_estimes: 52,
    raison_ia: 'Couloir entre AG-001 et AG-004 — zone neutre non couverte. Forte concentration de petits commerçants autour du CHU. 9 leads WhatsApp non traités de ce quartier en mai.',
    agence_plus_proche: 'AG-004',
    confidence: 84,
    action_ia: 'Assigner 2 tournées supplémentaires à AG-004 vers ce secteur — ROI positif à 6 semaines',
  },
  {
    id: 'ZP-03',
    nom: 'Zone Aflao Road (Est)',
    lat: 6.1282, lng: 1.2621,
    rayon_m: 1100,
    potentiel: 'ELEVE',
    clients_estimes: 63,
    raison_ia: 'Axe commercial frontalier Togo-Ghana. Forte activité import/export informelle. AG-003 (Bè Kpota) pourrait étendre sa couverture sur 1.5km est. Demande de micro-crédits commerciaux élevée.',
    agence_plus_proche: 'AG-003',
    confidence: 78,
    action_ia: 'Proposer un produit "crédit commerce frontalier" — adapter AG-003 pour couvrir ce corridor',
  },
  {
    id: 'ZP-04',
    nom: 'Zone Agbodrafo (Ouest)',
    lat: 6.1183, lng: 1.1890,
    rayon_m: 1000,
    potentiel: 'MODERE',
    clients_estimes: 38,
    raison_ia: 'Zone pêcheurs et petits artisans. Potentiel modéré mais niche spécifique (crédit équipement pêche). 0 concurrents microfinance recensés. Accès difficile — agent motorisé requis.',
    agence_plus_proche: 'AG-002',
    confidence: 68,
    action_ia: 'Étude de faisabilité : produit crédit pêcheur (montants 30k–80k FCFA, 3-6 mois)',
  },
  {
    id: 'ZP-05',
    nom: 'Zone Kpalimé Expansion (périphérie Nord)',
    lat: 6.9241, lng: 0.6183,
    rayon_m: 1600,
    potentiel: 'TRES_ELEVE',
    clients_estimes: 70,
    raison_ia: 'AG-005 (pilote) affiche le meilleur PAR du réseau (4.2%). Extension naturelle vers la périphérie nord estimée à +70 clients en 4 mois. Zone agricole (café, cacao) — demande crédit campagne.',
    agence_plus_proche: 'AG-005',
    confidence: 88,
    action_ia: 'Recruter 1 agent terrain Kpalimé Nord — objectif : 70 nouveaux clients en 4 mois (ROI mois 3)',
  },
]

// ─── Couleurs par agence ──────────────────────────────────────────────────────
export const AGENCE_COLORS: Record<string, string> = {
  'AG-001': '#14b8a6',
  'AG-002': '#6366f1',
  'AG-003': '#ef4444',
  'AG-004': '#f97316',
  'AG-005': '#a855f7',
}

export const AGENCE_NOMS_COURTS: Record<string, string> = {
  'AG-001': 'Lomé Centre',
  'AG-002': 'Adidogomé',
  'AG-003': 'Bè Kpota',
  'AG-004': 'Hédzranawoé',
  'AG-005': 'Kpalimé',
}

export const AGENCE_CENTERS: Record<string, [number, number]> = {
  'AG-001': [6.1375, 1.2123],
  'AG-002': [6.1742, 1.1843],
  'AG-003': [6.1512, 1.2478],
  'AG-004': [6.1628, 1.1967],
  'AG-005': [6.9048, 0.6328],
}
