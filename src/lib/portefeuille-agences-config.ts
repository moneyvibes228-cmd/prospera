/** Répartition commerciale par agence — source de vérité clients terrain / GP */

export interface CommercialZone {
  nom: string
  clients: number
  zone: string
}

export interface PortefeuilleAgenceConfig {
  agence_id: string
  total: number
  encours_fcfa: number
  commerciaux: CommercialZone[]
  gp: string
}

export const PORTEFEUILLE_AGENCES: PortefeuilleAgenceConfig[] = [
  {
    agence_id: 'AG-001',
    total: 300,
    encours_fcfa: 136_450_000,
    gp: 'Mawunya Kpodzo',
    commerciaux: [
      { nom: 'Yawo Adjavon', clients: 170, zone: 'Marché/Assigamé' },
      { nom: 'Mensah Kodjo', clients: 130, zone: 'Tokoin/Adakpamé' },
    ],
  },
  {
    agence_id: 'AG-002',
    total: 150,
    encours_fcfa: 69_060_000,
    gp: 'Sena Dossou',
    commerciaux: [
      { nom: 'Enyonam Kpade', clients: 90, zone: 'Marché Adidogomé' },
      { nom: 'Abla Tchalla', clients: 60, zone: 'Gbossimé/Zongo' },
    ],
  },
  {
    agence_id: 'AG-003',
    total: 212,
    encours_fcfa: 99_700_000,
    gp: 'Kossi Adjavon',
    commerciaux: [
      { nom: 'Afi Lawson', clients: 120, zone: 'Marché de Bè' },
      { nom: 'Kofi Senyo', clients: 92, zone: 'Agbalépédogan sud' },
    ],
  },
  {
    agence_id: 'AG-004',
    total: 153,
    encours_fcfa: 73_100_000,
    gp: 'Mawu Hotor',
    commerciaux: [
      { nom: 'Elom Komlavi', clients: 93, zone: 'Hédzranawoé centre' },
      { nom: 'Abla Kpodar', clients: 60, zone: 'Agoè/Adidogomé nord' },
    ],
  },
  {
    agence_id: 'AG-005',
    total: 90,
    encours_fcfa: 31_180_000,
    gp: 'Akoue Yawa',
    commerciaux: [
      { nom: 'Selom Agbeko', clients: 60, zone: 'Kpalimé Centre' },
      { nom: 'Komla Adzro', clients: 30, zone: 'Kpimé/Agomé' },
    ],
  },
]

export const RESEAU_EMPRUNTEURS_TOTAL = PORTEFEUILLE_AGENCES.reduce((s, a) => s + a.total, 0)
export const RESEAU_ENCOURS_TOTAL = PORTEFEUILLE_AGENCES.reduce((s, a) => s + a.encours_fcfa, 0)

export function getPortefeuilleAgence(agenceId: string): PortefeuilleAgenceConfig | undefined {
  return PORTEFEUILLE_AGENCES.find(a => a.agence_id === agenceId)
}

/** Encours proportionnel d'un commercial dans son agence */
export function encoursCommercial(agenceId: string, clients: number): number {
  const cfg = getPortefeuilleAgence(agenceId)
  if (!cfg) return Math.round(clients * 450_000)
  return Math.round(cfg.encours_fcfa * (clients / cfg.total))
}

/** Commercial assigné à l'index client (1-based) dans l'agence */
export function commercialPourClientAgence(agenceId: string, indexAgence: number): CommercialZone & { gp: string } {
  const cfg = getPortefeuilleAgence(agenceId)!
  let cursor = 0
  for (const c of cfg.commerciaux) {
    cursor += c.clients
    if (indexAgence <= cursor) return { ...c, gp: cfg.gp }
  }
  const last = cfg.commerciaux[cfg.commerciaux.length - 1]
  return { ...last, gp: cfg.gp }
}
