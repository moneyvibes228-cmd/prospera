/**
 * Registre conquête — le métier du chargé de prospection.
 *
 * Un prospecteur ne gère pas un portefeuille de clients : il travaille un **territoire**.
 * Il recense une zone blanche, qualifie les commerces qu'il y trouve, arrache une 1ʳᵉ
 * commande, puis **passe la main** au commercial de secteur. Trois objets suffisent à
 * décrire ce cycle — et aucun n'existait :
 *
 *   ZoneConquete    le territoire, son recensement, son coût de service
 *   Prospect        le commerce qualifié — ce n'est PAS encore un PointDeVente
 *   Ouverture       ce qu'il a ouvert, et ce que c'est devenu 3 mois après
 *
 * Le dernier est le seul qui compte vraiment : ouvrir un compte qui meurt à M+3 ou qui
 * ne paie jamais détruit de la valeur. C'est la redevabilité du poste.
 */

/** Étapes du cycle de conquête. `PERDU` est terminal, `PREMIERE_COMMANDE` déclenche l'Ouverture. */
export type EtapeConquete =
  | 'RECENSE'
  | 'QUALIFIE'
  | 'PREMIER_CONTACT'
  | 'OFFRE_ENVOYEE'
  | 'PREMIERE_COMMANDE'
  | 'PERDU'

/** Ce qu'un prospect peut supporter comme conditions de paiement — la variable qui tue. */
export type CapacitePaiement = 'COMPTANT' | 'CREDIT_7J' | 'CREDIT_30J' | 'INCONNUE'

export type StatutZone = 'A_RECENSER' | 'RECENSEMENT_EN_COURS' | 'EN_CONQUETE' | 'COUVERTE' | 'ABANDONNEE'

/** Devenir d'un PDV ouvert, constaté 3 mois après la 1ʳᵉ commande. */
export type SanteOuverture = 'VIVANT' | 'DORMANT' | 'MORT' | 'IMPAYE'

export interface ZoneConquete {
  id: string
  zone: string
  commercial: string
  statut: StatutZone
  /** Centre approximatif de la zone — sert à la tracer sur la carte de conquête. */
  lat: number
  lng: number
  /** Commerces effectivement recensés sur le terrain par le prospecteur. */
  pdv_recenses: number
  /** Estimation du parc total (source : recensement INSEED + relevé terrain). */
  pdv_estimes: number
  /** Commerces devenus clients grâce à lui. */
  pdv_ouverts: number
  distance_depot_km: number
  /** Coût logistique mensuel d'une tournée de desserte de la zone. */
  cout_service_mois: number
  potentiel_ca_mois: number
  concurrent_installe: string | null
  synthese_ia: string
}

export interface Prospect {
  id: string
  nom: string
  zone: string
  quartier: string
  telephone: string
  commercial: string
  etape: EtapeConquete
  /** Ancienneté dans l'étape courante — au-delà du seuil, le dossier pourrit. */
  jours_dans_etape: number
  score_ia: number
  // — Qualification terrain : ce qu'un prospecteur note sur son carnet —
  type_commerce: string
  surface_m2: number
  /** Passage client estimé par jour — le proxy d'achalandage du terrain. */
  achalandage_jour: number
  ca_estime_mois: number
  concurrent_fournisseur: string | null
  capacite_paiement: CapacitePaiement
  distance_depot_km: number
  dernier_contact: string
  prochaine_action: string
  /** Renseigné quand l'étape stagne — c'est ça qu'on veut lire, pas un score. */
  motif_blocage?: string
  /** Renseigné si `etape === 'PERDU'` — la matière première de l'apprentissage. */
  motif_perte?: string
  synthese_ia: string
}

export interface Ouverture {
  id: string
  pdv_id: string
  pdv_nom: string
  zone: string
  commercial: string
  /** Mois de la 1ʳᵉ commande — la cohorte. */
  mois_ouverture: string
  ca_1re_commande: number
  conditions_1re_commande: CapacitePaiement
  /** A-t-il recommandé le mois suivant ? La 1ʳᵉ preuve de vie. */
  reachat_m1: boolean
  /** Toujours vivant 3 mois après ? La seule preuve qui vaille. `null` = trop récent. */
  reachat_m3: boolean | null
  impaye_fcfa: number
  sante: SanteOuverture
  cout_acquisition: number
  marge_cumulee: number
  /** Commercial de secteur à qui le PDV a été transféré. `null` = orphelin. */
  transfere_a: string | null
  jours_depuis_ouverture: number
}

/**
 * Garde-fous du poste — les règles qu'une société de distribution apprend à ses dépens.
 * Elles ne sont pas décoratives : `buildAlertesConquete` les évalue sur les données réelles,
 * et c'est ce qui explique l'impayé de 5,25 M de Grossiste Adidogomé.
 */
export const REGLES_CONQUETE = {
  /** Une 1ʳᵉ commande à crédit au-delà de ce montant est interdite : aucun historique de paiement. */
  plafond_credit_1re_commande: 1_500_000,
  /** Au-delà, le coût de desserte dépasse la marge — la zone n'est pas rentable à servir. */
  distance_max_rentable_km: 35,
  /** Un prospect sans contact depuis ce délai est en train de mourir. */
  jours_max_sans_contact: 21,
  /** Un PDV ouvert et non transféré au-delà de ce délai devient orphelin : plus personne ne le visite. */
  jours_max_avant_passation: 45,
} as const

export const ETAPE_LABEL: Record<EtapeConquete, string> = {
  RECENSE: 'Recensé',
  QUALIFIE: 'Qualifié',
  PREMIER_CONTACT: '1er contact',
  OFFRE_ENVOYEE: 'Offre envoyée',
  PREMIERE_COMMANDE: '1ʳᵉ commande',
  PERDU: 'Perdu',
}

export const CAPACITE_LABEL: Record<CapacitePaiement, string> = {
  COMPTANT: 'Comptant',
  CREDIT_7J: 'Crédit 7 j',
  CREDIT_30J: 'Crédit 30 j',
  INCONNUE: 'Non évaluée',
}

export const SANTE_LABEL: Record<SanteOuverture, string> = {
  VIVANT: 'Vivant',
  DORMANT: 'Dormant',
  MORT: 'Mort',
  IMPAYE: 'Impayé',
}

/** Ordre du tunnel — sert aussi bien au funnel qu'au tri des colonnes. */
export const ETAPES_TUNNEL: EtapeConquete[] = [
  'RECENSE', 'QUALIFIE', 'PREMIER_CONTACT', 'OFFRE_ENVOYEE', 'PREMIERE_COMMANDE',
]

// ─────────────────────────────────────────────────────────────────────────────
// Territoires
// ─────────────────────────────────────────────────────────────────────────────

export const REGISTRE_ZONES_CONQUETE: ZoneConquete[] = [
  {
    id: 'zc-1', zone: 'Lomé Est', commercial: 'Mawuena Ahi', statut: 'EN_CONQUETE',
    lat: 6.165, lng: 1.290,
    pdv_recenses: 64, pdv_estimes: 78, pdv_ouverts: 9, distance_depot_km: 12,
    cout_service_mois: 340_000, potentiel_ca_mois: 8_500_000,
    concurrent_installe: null,
    synthese_ia: 'Zone la plus rentable du plan de conquête : 12 km du dépôt, aucun distributeur installé, 82 % du parc recensé. Le goulot n\'est pas le recensement — c\'est la conversion : 64 commerces recensés, 9 ouverts.',
  },
  {
    id: 'zc-2', zone: 'Vogan', commercial: 'Mawuena Ahi', statut: 'RECENSEMENT_EN_COURS',
    lat: 6.331, lng: 1.531,
    pdv_recenses: 9, pdv_estimes: 22, pdv_ouverts: 1, distance_depot_km: 31,
    cout_service_mois: 480_000, potentiel_ca_mois: 2_100_000,
    concurrent_installe: 'Distributeur local (exclusivité)',
    synthese_ia: 'Concurrent local en exclusivité et 31 km de dépôt : le coût de service (480 K) mange 23 % du potentiel. Recenser sans engager — priorité basse.',
  },
  {
    id: 'zc-3', zone: 'Aného', commercial: 'Mawuena Ahi', statut: 'ABANDONNEE',
    lat: 6.228, lng: 1.594,
    pdv_recenses: 6, pdv_estimes: 28, pdv_ouverts: 1, distance_depot_km: 45,
    cout_service_mois: 610_000, potentiel_ca_mois: 3_800_000,
    concurrent_installe: null,
    synthese_ia: 'Abandonnée : 45 km > seuil de rentabilité (35 km). Le seul PDV ouvert (Dépôt Aného Port) est mort à M+3 — la marge ne couvrait pas la desserte. Décision assumée, pas un échec commercial.',
  },
  {
    id: 'zc-4', zone: 'Bassar', commercial: 'Mawuena Kpodo', statut: 'EN_CONQUETE',
    lat: 9.261, lng: 0.789,
    pdv_recenses: 21, pdv_estimes: 34, pdv_ouverts: 5, distance_depot_km: 28,
    cout_service_mois: 390_000, potentiel_ca_mois: 6_200_000,
    concurrent_installe: null,
    synthese_ia: 'Conquête saine : 5 ouvertures pour 21 recensés (24 %), toutes en comptant. Modèle à répliquer sur Lomé Est.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Prospects — le carnet de terrain
// ─────────────────────────────────────────────────────────────────────────────

export const REGISTRE_PROSPECTS: Prospect[] = [
  {
    id: 'prs-1', nom: 'Boutique Nouvelle', zone: 'Lomé Est', quartier: 'Bè Kpota',
    telephone: '+228 90 44 12 08', commercial: 'Mawuena Ahi',
    etape: 'OFFRE_ENVOYEE', jours_dans_etape: 24, score_ia: 74,
    type_commerce: 'Épicerie de quartier', surface_m2: 45, achalandage_jour: 120,
    ca_estime_mois: 1_400_000, concurrent_fournisseur: null, capacite_paiement: 'CREDIT_30J',
    distance_depot_km: 9, dernier_contact: '2026-06-10',
    prochaine_action: 'Trancher : remise découverte -10 % comptant, ou abandonner',
    motif_blocage: 'Demande 30 j de crédit sur la 1ʳᵉ commande — refusé par la règle de plafond. Le dossier est gelé depuis, personne n\'a proposé d\'alternative.',
    synthese_ia: 'Meilleur emplacement recensé de Lomé Est (120 passages/j, aucun concurrent fournisseur). Bloqué sur le crédit, pas sur l\'envie d\'acheter : une remise -10 % en comptant a converti 4 dossiers comparables sur 5.',
  },
  {
    id: 'prs-2', nom: 'Superette Kégué Est', zone: 'Lomé Est', quartier: 'Kégué Est',
    telephone: '+228 91 22 76 40', commercial: 'Mawuena Ahi',
    etape: 'PREMIER_CONTACT', jours_dans_etape: 6, score_ia: 68,
    type_commerce: 'Superette', surface_m2: 90, achalandage_jour: 180,
    ca_estime_mois: 2_600_000, concurrent_fournisseur: 'Grossiste Adjaka', capacite_paiement: 'COMPTANT',
    distance_depot_km: 11, dernier_contact: '2026-06-12',
    prochaine_action: 'Présenter le combo eau + riz (écart de prix -6 % vs Adjaka)',
    synthese_ia: 'Déjà fournie par Adjaka mais paie comptant : la bascule se joue sur le prix du combo, pas sur le crédit.',
  },
  {
    id: 'prs-3', nom: 'Dépôt Baguida Plage', zone: 'Lomé Est', quartier: 'Baguida',
    telephone: '+228 92 08 55 31', commercial: 'Mawuena Ahi',
    etape: 'QUALIFIE', jours_dans_etape: 11, score_ia: 71,
    type_commerce: 'Dépôt', surface_m2: 140, achalandage_jour: 60,
    ca_estime_mois: 3_200_000, concurrent_fournisseur: null, capacite_paiement: 'CREDIT_7J',
    distance_depot_km: 16, dernier_contact: '2026-06-09',
    prochaine_action: 'Vérifier solvabilité (crédit 7 j demandé) avant 1er contact commercial',
    synthese_ia: 'Gros volume potentiel, crédit court demandé — reste sous le plafond de 1,5 M si la 1ʳᵉ commande est cadrée. Solvabilité à confirmer.',
  },
  {
    id: 'prs-4', nom: 'Alimentation Wologuédé', zone: 'Lomé Est', quartier: 'Wologuédé',
    telephone: '+228 93 61 20 17', commercial: 'Mawuena Ahi',
    etape: 'OFFRE_ENVOYEE', jours_dans_etape: 29, score_ia: 42,
    type_commerce: 'Alimentation générale', surface_m2: 30, achalandage_jour: 55,
    ca_estime_mois: 620_000, concurrent_fournisseur: 'Distributeur informel', capacite_paiement: 'INCONNUE',
    distance_depot_km: 14, dernier_contact: '2026-05-15',
    prochaine_action: 'Clôturer — 29 j sans réponse',
    motif_blocage: 'Aucune réponse depuis l\'envoi de l\'offre. Capacité de paiement jamais évaluée : le dossier n\'aurait pas dû passer en offre.',
    synthese_ia: 'Offre envoyée sans qualification financière. Score 42, CA estimé 620 K : même converti, le dossier ne rembourse pas son coût d\'acquisition. À clôturer.',
  },
  {
    id: 'prs-5', nom: 'Kiosque Klikamé', zone: 'Lomé Est', quartier: 'Klikamé',
    telephone: '+228 90 77 43 92', commercial: 'Mawuena Ahi',
    etape: 'RECENSE', jours_dans_etape: 3, score_ia: 35,
    type_commerce: 'Kiosque', surface_m2: 12, achalandage_jour: 90,
    ca_estime_mois: 280_000, concurrent_fournisseur: null, capacite_paiement: 'INCONNUE',
    distance_depot_km: 13, dernier_contact: '2026-06-15',
    prochaine_action: 'Qualifier — relever surface, volumes, mode de paiement',
    synthese_ia: 'Petit format. À traiter en lot avec les 6 autres kiosques recensés de Klikamé — une visite groupée, pas une visite dédiée.',
  },
  {
    id: 'prs-6', nom: 'Grossiste Bè Kpota', zone: 'Lomé Est', quartier: 'Bè Kpota',
    telephone: '+228 91 55 08 24', commercial: 'Mawuena Ahi',
    etape: 'QUALIFIE', jours_dans_etape: 8, score_ia: 81,
    type_commerce: 'Grossiste', surface_m2: 220, achalandage_jour: 40,
    ca_estime_mois: 6_400_000, concurrent_fournisseur: null, capacite_paiement: 'CREDIT_30J',
    distance_depot_km: 10, dernier_contact: '2026-06-11',
    prochaine_action: '⚠ Ne pas reproduire Adidogomé — exiger un acompte 50 % sur la 1ʳᵉ commande',
    motif_blocage: 'Demande 30 j de crédit sur un panier estimé à 4 M. Même profil exact que Grossiste Adidogomé, qui a laissé 5,25 M d\'impayés.',
    synthese_ia: 'Meilleur potentiel du portefeuille (6,4 M/mois) et plus gros risque : profil identique à l\'ouverture ratée de février. Convertible uniquement avec acompte — l\'exception au plafond doit être validée par le DAF.',
  },
  {
    id: 'prs-7', nom: 'Épicerie Adétikopé Route', zone: 'Lomé Est', quartier: 'Kégué Est',
    telephone: '+228 92 34 66 05', commercial: 'Mawuena Ahi',
    etape: 'PREMIER_CONTACT', jours_dans_etape: 25, score_ia: 51,
    type_commerce: 'Épicerie de quartier', surface_m2: 38, achalandage_jour: 70,
    ca_estime_mois: 890_000, concurrent_fournisseur: null, capacite_paiement: 'COMPTANT',
    distance_depot_km: 18, dernier_contact: '2026-05-19',
    prochaine_action: 'Relancer ou clôturer — 25 j sans contact',
    motif_blocage: 'Contact établi puis abandonné. Paie comptant, aucun concurrent : le dossier est sain, il est juste laissé à l\'abandon.',
    synthese_ia: 'Dossier sain qui pourrit faute de relance. Comptant, sans concurrent, 18 km : c\'est exactement le profil qui survit à M+3.',
  },
  {
    id: 'prs-8', nom: 'Boutique Vogan Centre', zone: 'Vogan', quartier: 'Vogan Centre',
    telephone: '+228 93 12 88 47', commercial: 'Mawuena Ahi',
    etape: 'PERDU', jours_dans_etape: 34, score_ia: 28,
    type_commerce: 'Boutique', surface_m2: 25, achalandage_jour: 45,
    ca_estime_mois: 340_000, concurrent_fournisseur: 'Distributeur local (exclusivité)', capacite_paiement: 'COMPTANT',
    distance_depot_km: 31, dernier_contact: '2026-05-12',
    prochaine_action: 'Archivé',
    motif_perte: 'Contrat d\'exclusivité avec le distributeur local. Rien à négocier.',
    synthese_ia: 'Perte structurelle, pas commerciale — 3 des 4 pertes de Vogan ont le même motif. Ne pas réinvestir la zone tant que l\'exclusivité tient.',
  },
  {
    id: 'prs-9', nom: 'Superette Vogan Marché', zone: 'Vogan', quartier: 'Vogan Marché',
    telephone: '+228 90 91 37 60', commercial: 'Mawuena Ahi',
    etape: 'RECENSE', jours_dans_etape: 5, score_ia: 44,
    type_commerce: 'Superette', surface_m2: 70, achalandage_jour: 110,
    ca_estime_mois: 1_100_000, concurrent_fournisseur: 'Distributeur local (exclusivité)', capacite_paiement: 'INCONNUE',
    distance_depot_km: 31, dernier_contact: '2026-06-13',
    prochaine_action: 'Vérifier si l\'exclusivité concurrente couvre aussi le marché',
    synthese_ia: 'Seul commerce de Vogan avec un volume défendable. Tout dépend du périmètre de l\'exclusivité locale.',
  },
  {
    id: 'prs-10', nom: 'Dépôt Attiegou', zone: 'Lomé Est', quartier: 'Wologuédé',
    telephone: '+228 91 04 29 73', commercial: 'Mawuena Ahi',
    etape: 'PREMIERE_COMMANDE', jours_dans_etape: 2, score_ia: 66,
    type_commerce: 'Dépôt', surface_m2: 110, achalandage_jour: 50,
    ca_estime_mois: 1_800_000, concurrent_fournisseur: null, capacite_paiement: 'COMPTANT',
    distance_depot_km: 15, dernier_contact: '2026-06-16',
    prochaine_action: 'Transférer à Komlan Tetteh (secteur Lomé Est)',
    synthese_ia: 'Converti en comptant, 15 km : le profil qui tient. À transférer sous 45 j pour ne pas rejoindre les 5 orphelins.',
  },
  {
    id: 'prs-11', nom: 'Épicerie Zongo Nord', zone: 'Lomé Est', quartier: 'Klikamé',
    telephone: '+228 92 77 51 18', commercial: 'Mawuena Ahi',
    etape: 'PERDU', jours_dans_etape: 41, score_ia: 33,
    type_commerce: 'Épicerie de quartier', surface_m2: 28, achalandage_jour: 50,
    ca_estime_mois: 450_000, concurrent_fournisseur: null, capacite_paiement: 'COMPTANT',
    distance_depot_km: 17, dernier_contact: '2026-05-05',
    prochaine_action: 'Archivé',
    motif_perte: 'Aucune relance pendant 6 semaines — le commerce s\'est fourni ailleurs. Perte évitable.',
    synthese_ia: 'Perte par abandon, pas par concurrence. C\'est le 3ᵉ dossier comptant perdu faute de relance ce trimestre — le trou est dans le suivi, pas dans le recensement.',
  },
  {
    id: 'prs-12', nom: 'Boutique Sarakawa', zone: 'Bassar', quartier: 'Sarakawa',
    telephone: '+228 90 63 14 82', commercial: 'Mawuena Kpodo',
    etape: 'OFFRE_ENVOYEE', jours_dans_etape: 4, score_ia: 69,
    type_commerce: 'Boutique', surface_m2: 40, achalandage_jour: 85,
    ca_estime_mois: 950_000, concurrent_fournisseur: null, capacite_paiement: 'COMPTANT',
    distance_depot_km: 26, dernier_contact: '2026-06-14',
    prochaine_action: 'Relance J+7',
    synthese_ia: 'Offre comptant, relance planifiée — le suivi que Lomé Est n\'a pas.',
  },
  {
    id: 'prs-13', nom: 'Dépôt Bassar Centre', zone: 'Bassar', quartier: 'Centre',
    telephone: '+228 91 39 07 55', commercial: 'Mawuena Kpodo',
    etape: 'QUALIFIE', jours_dans_etape: 7, score_ia: 77,
    type_commerce: 'Dépôt', surface_m2: 160, achalandage_jour: 45,
    ca_estime_mois: 2_900_000, concurrent_fournisseur: null, capacite_paiement: 'COMPTANT',
    distance_depot_km: 28, dernier_contact: '2026-06-12',
    prochaine_action: 'Visite de qualification volumes',
    synthese_ia: 'Comptant sur un volume à 2,9 M — profil rare, à sécuriser vite.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Ouvertures — la cohorte, et ce qu'elle est devenue
// ─────────────────────────────────────────────────────────────────────────────

export const REGISTRE_OUVERTURES: Ouverture[] = [
  {
    id: 'ouv-1', pdv_id: 'pdv-9', pdv_nom: 'Grossiste Adidogomé', zone: 'Lomé Nord',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-02', ca_1re_commande: 5_250_000,
    conditions_1re_commande: 'CREDIT_30J', reachat_m1: false, reachat_m3: false,
    impaye_fcfa: 5_250_000, sante: 'IMPAYE', cout_acquisition: 45_000, marge_cumulee: 0,
    transfere_a: null, jours_depuis_ouverture: 128,
  },
  {
    id: 'ouv-2', pdv_id: 'pdv-c1', pdv_nom: 'Épicerie Kégué Est', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-01', ca_1re_commande: 380_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: true, reachat_m3: true,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 28_000, marge_cumulee: 412_000,
    transfere_a: 'Komlan Tetteh', jours_depuis_ouverture: 161,
  },
  {
    id: 'ouv-3', pdv_id: 'pdv-c2', pdv_nom: 'Boutique Baguida', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-01', ca_1re_commande: 240_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: true, reachat_m3: true,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 31_000, marge_cumulee: 298_000,
    transfere_a: 'Komlan Tetteh', jours_depuis_ouverture: 158,
  },
  {
    id: 'ouv-4', pdv_id: 'pdv-c3', pdv_nom: 'Kiosque Wologuédé', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-02', ca_1re_commande: 120_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: true, reachat_m3: true,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 24_000, marge_cumulee: 143_000,
    transfere_a: 'Komlan Tetteh', jours_depuis_ouverture: 131,
  },
  {
    id: 'ouv-5', pdv_id: 'pdv-c4', pdv_nom: 'Alimentation Bè Kpota', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-02', ca_1re_commande: 310_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: false, reachat_m3: false,
    impaye_fcfa: 0, sante: 'MORT', cout_acquisition: 33_000, marge_cumulee: 47_000,
    transfere_a: null, jours_depuis_ouverture: 124,
  },
  {
    id: 'ouv-6', pdv_id: 'pdv-c5', pdv_nom: 'Superette Klikamé', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-03', ca_1re_commande: 620_000,
    conditions_1re_commande: 'CREDIT_7J', reachat_m1: true, reachat_m3: true,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 36_000, marge_cumulee: 631_000,
    transfere_a: 'Komlan Tetteh', jours_depuis_ouverture: 102,
  },
  {
    id: 'ouv-7', pdv_id: 'pdv-c6', pdv_nom: 'Dépôt Aného Port', zone: 'Aného',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-03', ca_1re_commande: 480_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: false, reachat_m3: false,
    impaye_fcfa: 0, sante: 'MORT', cout_acquisition: 68_000, marge_cumulee: 72_000,
    transfere_a: null, jours_depuis_ouverture: 96,
  },
  {
    id: 'ouv-8', pdv_id: 'pdv-c7', pdv_nom: 'Épicerie Vogan Centre', zone: 'Vogan',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-03', ca_1re_commande: 150_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: true, reachat_m3: true,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 52_000, marge_cumulee: 168_000,
    transfere_a: null, jours_depuis_ouverture: 94,
  },
  {
    id: 'ouv-9', pdv_id: 'pdv-c8', pdv_nom: 'Boutique Kégué Nord', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-03', ca_1re_commande: 200_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: false, reachat_m3: false,
    impaye_fcfa: 0, sante: 'MORT', cout_acquisition: 29_000, marge_cumulee: 31_000,
    transfere_a: null, jours_depuis_ouverture: 89,
  },
  {
    id: 'ouv-10', pdv_id: 'pdv-c9', pdv_nom: 'Épicerie Adétikopé', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-04', ca_1re_commande: 290_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: true, reachat_m3: null,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 27_000, marge_cumulee: 244_000,
    transfere_a: 'Komlan Tetteh', jours_depuis_ouverture: 71,
  },
  {
    id: 'ouv-11', pdv_id: 'pdv-c10', pdv_nom: 'Kiosque Baguida Plage', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-04', ca_1re_commande: 95_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: false, reachat_m3: null,
    impaye_fcfa: 0, sante: 'DORMANT', cout_acquisition: 30_000, marge_cumulee: 14_000,
    transfere_a: null, jours_depuis_ouverture: 64,
  },
  {
    id: 'ouv-12', pdv_id: 'pdv-c11', pdv_nom: 'Boutique Zongo', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-05', ca_1re_commande: 340_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: true, reachat_m3: null,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 26_000, marge_cumulee: 187_000,
    transfere_a: null, jours_depuis_ouverture: 48,
  },
  {
    id: 'ouv-13', pdv_id: 'pdv-c12', pdv_nom: 'Mini-dépôt Kégué', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-05', ca_1re_commande: 410_000,
    conditions_1re_commande: 'CREDIT_7J', reachat_m1: true, reachat_m3: null,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 34_000, marge_cumulee: 221_000,
    transfere_a: null, jours_depuis_ouverture: 41,
  },
  {
    id: 'ouv-14', pdv_id: 'pdv-c13', pdv_nom: 'Épicerie Attiegou', zone: 'Lomé Est',
    commercial: 'Mawuena Ahi', mois_ouverture: '2026-06', ca_1re_commande: 180_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: false, reachat_m3: null,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 25_000, marge_cumulee: 38_000,
    transfere_a: null, jours_depuis_ouverture: 12,
  },
  {
    id: 'ouv-15', pdv_id: 'pdv-c14', pdv_nom: 'Boutique Tomdè', zone: 'Bassar',
    commercial: 'Mawuena Kpodo', mois_ouverture: '2026-03', ca_1re_commande: 260_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: true, reachat_m3: true,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 29_000, marge_cumulee: 355_000,
    transfere_a: 'Efua Mensah', jours_depuis_ouverture: 98,
  },
  {
    id: 'ouv-16', pdv_id: 'pdv-c15', pdv_nom: 'Dépôt Lassa', zone: 'Bassar',
    commercial: 'Mawuena Kpodo', mois_ouverture: '2026-04', ca_1re_commande: 520_000,
    conditions_1re_commande: 'COMPTANT', reachat_m1: true, reachat_m3: null,
    impaye_fcfa: 0, sante: 'VIVANT', cout_acquisition: 31_000, marge_cumulee: 448_000,
    transfere_a: 'Efua Mensah', jours_depuis_ouverture: 68,
  },
]
