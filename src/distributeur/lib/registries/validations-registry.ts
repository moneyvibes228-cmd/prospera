/**
 * Demandes de validation terrain — le point de contact réel entre le
 * Superviseur de Zone et le Responsable des Ventes.
 *
 * Règle métier : le superviseur arbitre au fil de l'eau **dans la limite de sa
 * délégation**. Au-delà, la demande n'est pas « refusée », elle **remonte**.
 * C'est le responsable des ventes qui fixe la grille et tranche les
 * dépassements ; les cas hors de sa propre délégation remontent au DC.
 *
 * Sans ce mécanisme, les deux postes seraient deux écrans en lecture seule
 * sur la même donnée — c'est la délégation qui les distingue.
 */

export type TypeValidation =
  | 'PLAFOND_CREDIT'
  | 'REMISE_HORS_GRILLE'
  | 'RETOUR_AVOIR'
  | 'CASSE_TERRAIN'

export type StatutValidation = 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE'
export type NiveauValidation = 'SUPERVISEUR' | 'RESP_VENTES' | 'DC'
export type UrgenceValidation = 'HAUTE' | 'NORMALE'

export interface DemandeValidation {
  id: string
  type: TypeValidation
  pdv_nom: string
  commercial: string
  zone: string
  detail: string
  /** Montant en jeu — encours pour un crédit, valeur de la commande pour une remise. */
  montant: number
  /** Remise demandée, pour les demandes de type REMISE_HORS_GRILLE. */
  remise_pct?: number
  urgence: UrgenceValidation
  date: string
  statut: StatutValidation
  synthese_ia?: string
}

export const TYPE_VALIDATION_LABEL: Record<TypeValidation, string> = {
  PLAFOND_CREDIT: 'Dépassement plafond crédit',
  REMISE_HORS_GRILLE: 'Remise hors grille',
  RETOUR_AVOIR: 'Retour marchandise / avoir',
  CASSE_TERRAIN: 'Casse terrain à passer en perte',
}

/**
 * Grille de délégation — jusqu'où chaque niveau peut engager la société.
 * Le superviseur débloque la commande du jour ; le responsable des ventes
 * engage la marge de la région ; au-delà c'est une décision de direction.
 */
export const DELEGATION = {
  SUPERVISEUR: { remise_pct_max: 7, credit_max: 1_000_000, avoir_max: 250_000 },
  RESP_VENTES: { remise_pct_max: 12, credit_max: 5_000_000, avoir_max: 1_500_000 },
} as const

/** Le niveau habilité à trancher une demande, d'après la grille de délégation. */
export function niveauRequis(d: DemandeValidation): NiveauValidation {
  if (d.type === 'REMISE_HORS_GRILLE') {
    const r = d.remise_pct ?? 0
    if (r <= DELEGATION.SUPERVISEUR.remise_pct_max) return 'SUPERVISEUR'
    if (r <= DELEGATION.RESP_VENTES.remise_pct_max) return 'RESP_VENTES'
    return 'DC'
  }

  if (d.type === 'PLAFOND_CREDIT') {
    if (d.montant <= DELEGATION.SUPERVISEUR.credit_max) return 'SUPERVISEUR'
    if (d.montant <= DELEGATION.RESP_VENTES.credit_max) return 'RESP_VENTES'
    return 'DC'
  }

  // Retours, avoirs et casse : même logique, sur la valeur engagée.
  if (d.montant <= DELEGATION.SUPERVISEUR.avoir_max) return 'SUPERVISEUR'
  if (d.montant <= DELEGATION.RESP_VENTES.avoir_max) return 'RESP_VENTES'
  return 'DC'
}

export const REGISTRE_VALIDATIONS: DemandeValidation[] = [
  // ---- Lomé Nord (superviseur Efua Koffi) ----
  {
    id: 'val-1', type: 'PLAFOND_CREDIT', pdv_nom: 'Épicerie Mama T.', commercial: 'Komlan Tetteh',
    zone: 'Lomé Nord', detail: 'Encours 940 K > plafond 800 K — commande du jour bloquée',
    montant: 940_000, urgence: 'HAUTE', date: '2026-06-11', statut: 'EN_ATTENTE',
    synthese_ia: 'Client fidèle, 0 retard sur 8 mois. Le dépassement vient d’un décalage de règlement Mobile Money de 48 h.',
  },
  {
    id: 'val-2', type: 'REMISE_HORS_GRILLE', pdv_nom: 'Boutique Akossombo', commercial: 'Ama Tetteh',
    zone: 'Lomé Nord', detail: 'Remise 6 % sur pack boissons (grille : 5 % max)',
    montant: 620_000, remise_pct: 6, urgence: 'NORMALE', date: '2026-06-11', statut: 'EN_ATTENTE',
    synthese_ia: 'Marge résiduelle 12,4 % — au-dessus du plancher. Concurrent présent à 200 m.',
  },
  {
    id: 'val-3', type: 'PLAFOND_CREDIT', pdv_nom: 'Grossiste Adidogomé', commercial: 'Komlan Lawson',
    zone: 'Lomé Nord', detail: 'Encours 3,2 M > plafond 1,5 M — impayé 20 j en cours',
    montant: 3_200_000, urgence: 'HAUTE', date: '2026-06-11', statut: 'EN_ATTENTE',
    synthese_ia: 'Au-delà de la délégation superviseur. Score IA 38, déjà 5,25 M de créance. Escalade justifiée.',
  },
  {
    id: 'val-4', type: 'REMISE_HORS_GRILLE', pdv_nom: 'Superette Adidogomé', commercial: 'Elom Doheto',
    zone: 'Lomé Nord', detail: 'Remise 9 % demandée pour aligner un concurrent',
    montant: 1_840_000, remise_pct: 9, urgence: 'HAUTE', date: '2026-06-10', statut: 'EN_ATTENTE',
    synthese_ia: 'Hors délégation superviseur (7 %). Marge tombe à 8,1 % — décision de politique tarifaire.',
  },
  {
    id: 'val-5', type: 'CASSE_TERRAIN', pdv_nom: 'Kiosque Bè-Kpota', commercial: 'Ama Tetteh',
    zone: 'Lomé Nord', detail: 'Casse 18 packs eau 1,5L — chute au déchargement',
    montant: 168_000, urgence: 'NORMALE', date: '2026-06-10', statut: 'EN_ATTENTE',
  },
  {
    id: 'val-6', type: 'RETOUR_AVOIR', pdv_nom: 'Alimentation Sika', commercial: 'Komlan Tetteh',
    zone: 'Lomé Nord', detail: 'Retour 12 cartons huile — DLC courte à la livraison',
    montant: 420_000, urgence: 'NORMALE', date: '2026-06-09', statut: 'EN_ATTENTE',
    synthese_ia: 'Au-dessus de la délégation superviseur (250 K). 3e retour DLC ce mois sur l’entrepôt Lomé Port.',
  },

  // ---- Lomé Sud (superviseur Akouvi Bediako) ----
  {
    id: 'val-7', type: 'REMISE_HORS_GRILLE', pdv_nom: 'Dépôt Agoè Plage', commercial: 'Edem Koffi',
    zone: 'Lomé Sud', detail: 'Remise 11 % sur engagement volume 3 M/mois',
    montant: 2_950_000, remise_pct: 11, urgence: 'HAUTE', date: '2026-06-11', statut: 'EN_ATTENTE',
    synthese_ia: 'Hors délégation superviseur. Rentable si le volume tient : seuil 2,4 M/mois.',
  },
  {
    id: 'val-8', type: 'PLAFOND_CREDIT', pdv_nom: 'Boutique Kofi Trade', commercial: 'Efua Abalo',
    zone: 'Lomé Sud', detail: 'Encours 620 K > plafond 500 K',
    montant: 620_000, urgence: 'NORMALE', date: '2026-06-11', statut: 'EN_ATTENTE',
  },
  {
    id: 'val-9', type: 'PLAFOND_CREDIT', pdv_nom: 'Grossiste Bè Marché', commercial: 'Komi Amegah',
    zone: 'Lomé Sud', detail: 'Encours 4,1 M > plafond 2,0 M — freelance, grille client personnalisée',
    montant: 4_100_000, urgence: 'HAUTE', date: '2026-06-10', statut: 'EN_ATTENTE',
    synthese_ia: 'Escalade. Le risque porte sur la société, pas sur le freelance — arbitrage responsable des ventes.',
  },

  // ---- Lomé Centre (superviseur Selom Amevor) ----
  {
    id: 'val-10', type: 'PLAFOND_CREDIT', pdv_nom: 'Kiosque Port', commercial: 'Yaovi Amouzou',
    zone: 'Lomé Centre', detail: 'Encours 8,9 M — 45 j de retard, zone en statut critique',
    montant: 8_900_000, urgence: 'HAUTE', date: '2026-06-11', statut: 'EN_ATTENTE',
    synthese_ia: 'Au-delà même de la délégation responsable des ventes (5 M). Décision DC — passage en contentieux à envisager.',
  },
  {
    id: 'val-11', type: 'REMISE_HORS_GRILLE', pdv_nom: 'Superette Nyékonakpoè', commercial: 'Kossi Fiagbe',
    zone: 'Lomé Centre', detail: 'Remise 7 % sur riz 25 kg — fin de trimestre',
    montant: 1_120_000, remise_pct: 7, urgence: 'NORMALE', date: '2026-06-10', statut: 'EN_ATTENTE',
  },
  {
    id: 'val-12', type: 'RETOUR_AVOIR', pdv_nom: 'Épicerie Hanoukopé', commercial: 'Adjoa Koffi',
    zone: 'Lomé Centre', detail: 'Retour 6 cartons — erreur de référence à la préparation',
    montant: 185_000, urgence: 'NORMALE', date: '2026-06-09', statut: 'EN_ATTENTE',
  },

  // ---- Lomé Est (superviseur Rachidou Bawa) ----
  {
    id: 'val-13', type: 'REMISE_HORS_GRILLE', pdv_nom: 'Boutique Nouvelle', commercial: 'Adjoa Mensah',
    zone: 'Lomé Est', detail: 'Remise 8 % — première commande d’ouverture',
    montant: 480_000, remise_pct: 8, urgence: 'NORMALE', date: '2026-06-11', statut: 'EN_ATTENTE',
    synthese_ia: 'Hors délégation superviseur d’un point. Ouverture de PDV en zone sous-couverte (62 % de couverture).',
  },
  {
    id: 'val-14', type: 'PLAFOND_CREDIT', pdv_nom: 'Dépôt Bè-Kpota', commercial: 'Afi Adjavon',
    zone: 'Lomé Est', detail: 'Encours 780 K > plafond 500 K',
    montant: 780_000, urgence: 'NORMALE', date: '2026-06-10', statut: 'EN_ATTENTE',
  },

  // ---- Nord (hors région Grand Lomé) ----
  {
    id: 'val-15', type: 'PLAFOND_CREDIT', pdv_nom: 'Dépôt Sokodé', commercial: 'Yao Ahi',
    zone: 'Centrale', detail: 'Encours 620 K > plafond 500 K',
    montant: 620_000, urgence: 'NORMALE', date: '2026-06-11', statut: 'EN_ATTENTE',
  },
  {
    id: 'val-16', type: 'REMISE_HORS_GRILLE', pdv_nom: 'Superette Kara', commercial: 'Sena Dzobo',
    zone: 'Kara', detail: 'Remise 6 % sur pack soda 24',
    montant: 940_000, remise_pct: 6, urgence: 'NORMALE', date: '2026-06-10', statut: 'EN_ATTENTE',
  },
]

export interface ValidationTriee extends DemandeValidation {
  niveau: NiveauValidation
}

/** Demandes en attente d'un territoire, enrichies du niveau habilité à trancher. */
export function getValidationsDuPerimetre(zones: readonly string[]): ValidationTriee[] {
  const dans = zones.length === 0
    ? REGISTRE_VALIDATIONS
    : REGISTRE_VALIDATIONS.filter(v => zones.includes(v.zone))

  return dans
    .filter(v => v.statut === 'EN_ATTENTE')
    .map(v => ({ ...v, niveau: niveauRequis(v) }))
}

/** Ce que le rôle peut trancher lui-même vs ce qu'il doit faire remonter. */
export function repartirParDelegation(demandes: ValidationTriee[], niveau: NiveauValidation) {
  return {
    aTrancher: demandes.filter(d => d.niveau === niveau),
    aEscalader: demandes.filter(d => estAuDessus(d.niveau, niveau)),
  }
}

const ORDRE: NiveauValidation[] = ['SUPERVISEUR', 'RESP_VENTES', 'DC']

function estAuDessus(niveau: NiveauValidation, reference: NiveauValidation): boolean {
  return ORDRE.indexOf(niveau) > ORDRE.indexOf(reference)
}
