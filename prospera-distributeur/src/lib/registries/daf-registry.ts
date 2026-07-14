import { REGISTRE_FOURNISSEURS } from './fournisseurs-registry'

/**
 * Registre DAF — ce que le Directeur Administratif & Financier arbitre,
 * et que le DG ne fait que constater.
 *
 * Le DG regarde « combien il reste en caisse ». Le DAF décide *qui est payé cette
 * semaine et qui attend*, *à qui on ouvre du crédit*, et *quelle ligne de la
 * distribution gagne réellement de l'argent une fois les remises, les commissions
 * et le transport déduits*. C'est ce qui vit ici.
 */

// ─────────────────────────────────────────────────────────────
// 1. BFR — le nerf de la guerre d'un distributeur
// ─────────────────────────────────────────────────────────────

/**
 * Un distributeur achète du stock, le porte, vend à crédit aux PDV, et paie ses
 * fournisseurs. Tout son cash est immobilisé entre ces trois postes.
 * Chiffres alignés sur la balance SYSCOHADA (311 / 411 / 401).
 */
export const BFR_REGISTRY = {
  stock: 86_500_000,              // 311000
  creances_clients: 18_350_000,   // 411100
  dettes_fournisseurs: REGISTRE_FOURNISSEURS.reduce((s, f) => s + f.encours_du, 0), // 401100
  achats_mois: 68_400_000,        // 601100 — base de rotation
  ca_mois: 89_200_000,            // 701100
  bfr_mois_precedent: 14_200_000,
}

// ─────────────────────────────────────────────────────────────
// 2. Run de paiement — la décision hebdomadaire du DAF
// ─────────────────────────────────────────────────────────────

export type ArbitragePaiement = 'PAYER' | 'PARTIEL' | 'REPORTER'

export interface LignePaiement {
  fournisseur_id: string
  fournisseur: string
  montant_du: number
  jours_retard: number          // > 0 = déjà échu
  echeance: string
  /** Ce qui casse en aval si on ne paie pas. Le cœur de l'arbitrage. */
  consequence_non_paiement: string
  /** Jours de couverture stock restants sur les références de ce fournisseur. */
  couverture_stock_j: number
  /** Escompte perdu si on paie en retard (négocié au contrat). */
  escompte_pct: number
  /** Pénalité de retard contractuelle, en % du montant dû, par mois entamé. */
  penalite_retard_pct: number
  /** Recommandation du moteur — le DAF garde la main. */
  reco: ArbitragePaiement
  reco_motif: string
}

/**
 * Les lignes ouvertes au 11/06/2026. Construites sur le registre fournisseurs
 * (encours échu + échéances proches) pour rester cohérent avec le compte 401.
 */
export const RUN_PAIEMENT: LignePaiement[] = [
  {
    fournisseur_id: 'frn-1', fournisseur: 'Huiles Ouest Afrique',
    montant_du: 20_400_000, jours_retard: 12, echeance: '2026-05-30',
    consequence_non_paiement: 'Livraison huile 5L bloquée — 1re référence en volume, 22 % du CA dépôts',
    couverture_stock_j: 6, escompte_pct: 0, penalite_retard_pct: 1.5,
    reco: 'PARTIEL',
    reco_motif: 'Fiabilité 58/100 et 8,2 % de litiges : payer 12 M pour débloquer la livraison, garder 8,4 M en levier de négociation sur les écarts de BL.',
  },
  {
    fournisseur_id: 'frn-2', fournisseur: 'Riz Import Vietnam',
    montant_du: 12_800_000, jours_retard: 8, echeance: '2026-06-03',
    consequence_non_paiement: 'Conteneur riz bloqué au port — surestaries 180 K/jour à partir de J+3',
    couverture_stock_j: 11, escompte_pct: 0, penalite_retard_pct: 0,
    reco: 'PAYER',
    reco_motif: 'Pas de pénalité contractuelle mais les surestaries portuaires courent : chaque jour de retard coûte plus cher que le cash économisé.',
  },
  {
    fournisseur_id: 'frn-8', fournisseur: 'Clean Home Import',
    montant_du: 3_400_000, jours_retard: 0, echeance: '2026-06-13',
    consequence_non_paiement: 'Passage en paiement comptant sur les prochaines commandes',
    couverture_stock_j: 24, escompte_pct: 2, penalite_retard_pct: 0,
    reco: 'PAYER',
    reco_motif: 'Délai fournisseur de 15 j seulement et 2 % d\'escompte : 68 K gagnés pour 2 jours d\'avance de trésorerie.',
  },
  {
    fournisseur_id: 'frn-6', fournisseur: 'Nestlé Distribution Kara',
    montant_du: 3_200_000, jours_retard: 5, echeance: '2026-06-06',
    consequence_non_paiement: 'Encours gelé — commandes Kara suspendues',
    couverture_stock_j: 9, escompte_pct: 0, penalite_retard_pct: 0,
    reco: 'PAYER',
    reco_motif: 'Petit montant, entrepôt Kara déjà en tension : le gain de trésorerie ne vaut pas la rupture.',
  },
  {
    fournisseur_id: 'frn-7', fournisseur: 'Hygiène Pro Afrique',
    montant_du: 2_400_000, jours_retard: 3, echeance: '2026-06-08',
    consequence_non_paiement: 'Aucune — 24 j de couverture, catégorie non stratégique',
    couverture_stock_j: 24, escompte_pct: 0, penalite_retard_pct: 0,
    reco: 'REPORTER',
    reco_motif: 'Rien ne casse avant 3 semaines. Reporter à après l\'encaissement Akossombo du 18/06.',
  },
  {
    fournisseur_id: 'frn-9', fournisseur: 'Sotra Négoce',
    montant_du: 1_600_000, jours_retard: 1, echeance: '2026-06-10',
    consequence_non_paiement: 'Aucune à court terme',
    couverture_stock_j: 18, escompte_pct: 0, penalite_retard_pct: 0,
    reco: 'REPORTER',
    reco_motif: 'Fournisseur d\'appoint, remplaçable. Report sans conséquence commerciale.',
  },
]

/** Ce que le DAF encaisse de façon quasi certaine cette semaine (base du run). */
export const ENCAISSEMENTS_CERTAINS_7J = 32_400_000

/** Plancher de trésorerie sous lequel on ne descend pas (règle interne, spec V2). */
export const PLANCHER_TRESORERIE = 40_000_000

// ─────────────────────────────────────────────────────────────
// 3. Encadrement du crédit client — la décision que le DAF seul peut prendre
// ─────────────────────────────────────────────────────────────

export interface DemandeCredit {
  id: string
  pdv_nom: string
  zone: string
  commercial: string
  /** Plafond actuellement accordé. */
  plafond_actuel: number
  /** Encours réel à date — au-dessus du plafond = commande bloquée. */
  encours: number
  /** Ce que le commercial demande : déblocage ponctuel ou relèvement de plafond. */
  demande: 'DEBLOCAGE_COMMANDE' | 'RELEVEMENT_PLAFOND'
  montant_demande: number
  motif_commercial: string
  /** Historique de paiement du PDV — l'argument du DAF face au commercial. */
  retards_12m: number
  delai_paiement_moyen_j: number
  ca_12m: number
  marge_12m: number
  anciennete_mois: number
  risque: 'FAIBLE' | 'MOYEN' | 'ELEVE'
}

export const DEMANDES_CREDIT: DemandeCredit[] = [
  {
    id: 'cred-1', pdv_nom: 'Grossiste Adidogomé', zone: 'Lomé Ouest', commercial: 'Mawuena Ahi',
    plafond_actuel: 5_000_000, encours: 5_250_000,
    demande: 'RELEVEMENT_PLAFOND', montant_demande: 9_000_000,
    motif_commercial: 'Veut charger avant la rentrée scolaire — commande ferme de 3,8 M en attente.',
    retards_12m: 7, delai_paiement_moyen_j: 41, ca_12m: 62_000_000, marge_12m: 8_680_000,
    anciennete_mois: 26, risque: 'ELEVE',
  },
  {
    id: 'cred-2', pdv_nom: 'Superette Kara Centre', zone: 'Kara', commercial: 'Sena Dzobo',
    plafond_actuel: 4_000_000, encours: 3_900_000,
    demande: 'DEBLOCAGE_COMMANDE', montant_demande: 1_400_000,
    motif_commercial: 'Meilleur payeur de la zone, veut passer sur la gamme boissons.',
    retards_12m: 0, delai_paiement_moyen_j: 12, ca_12m: 48_000_000, marge_12m: 8_160_000,
    anciennete_mois: 34, risque: 'FAIBLE',
  },
  {
    id: 'cred-3', pdv_nom: 'Kiosque Port', zone: 'Lomé Port', commercial: 'Komlan Tetteh',
    plafond_actuel: 3_000_000, encours: 8_900_000,
    demande: 'DEBLOCAGE_COMMANDE', montant_demande: 900_000,
    motif_commercial: 'Promet de régler 3 M la semaine prochaine.',
    retards_12m: 14, delai_paiement_moyen_j: 78, ca_12m: 31_000_000, marge_12m: 3_720_000,
    anciennete_mois: 19, risque: 'ELEVE',
  },
  {
    id: 'cred-4', pdv_nom: 'Boutique Akossombo', zone: 'Lomé Est', commercial: 'Kofi Agbessi',
    plafond_actuel: 6_000_000, encours: 2_100_000,
    demande: 'RELEVEMENT_PLAFOND', montant_demande: 8_500_000,
    motif_commercial: 'Ouvre un second point de vente à Baguida.',
    retards_12m: 1, delai_paiement_moyen_j: 18, ca_12m: 74_000_000, marge_12m: 13_320_000,
    anciennete_mois: 41, risque: 'FAIBLE',
  },
]

// ─────────────────────────────────────────────────────────────
// 4. Rentabilité par canal — là où le DAF voit ce que le DG ne voit pas
// ─────────────────────────────────────────────────────────────

export interface MargeCanal {
  canal: string
  ca_mois: number
  /** Marge brute avant remises et coûts de service. */
  marge_brute: number
  remises_accordees: number
  commissions: number
  cout_transport: number
  /** Coût du crédit accordé : encours × coût du capital, sur le délai réel. */
  cout_credit_client: number
  /** Pertes sur créances imputées au canal. */
  pertes_creances: number
}

/**
 * Le compte de résultat du DG s'arrête à « marge brute 23 % ». Le DAF, lui, sait
 * que le canal grossiste détruit de la valeur une fois le crédit et les remises
 * déduits — et que personne ne s'en aperçoit parce qu'il fait du volume.
 */
export const MARGES_CANAL: MargeCanal[] = [
  {
    canal: 'Boutiques de proximité', ca_mois: 31_400_000, marge_brute: 8_170_000,
    remises_accordees: 620_000, commissions: 1_570_000, cout_transport: 1_880_000,
    cout_credit_client: 190_000, pertes_creances: 120_000,
  },
  {
    canal: 'Dépôts & superettes', ca_mois: 26_800_000, marge_brute: 6_030_000,
    remises_accordees: 1_070_000, commissions: 1_340_000, cout_transport: 1_100_000,
    cout_credit_client: 280_000, pertes_creances: 210_000,
  },
  {
    canal: 'Grossistes', ca_mois: 22_600_000, marge_brute: 3_390_000,
    remises_accordees: 1_810_000, commissions: 900_000, cout_transport: 340_000,
    cout_credit_client: 620_000, pertes_creances: 890_000,
  },
  {
    canal: 'Enseigne B2B (Atlas Shop)', ca_mois: 8_400_000, marge_brute: 2_180_000,
    remises_accordees: 840_000, commissions: 170_000, cout_transport: 210_000,
    cout_credit_client: 90_000, pertes_creances: 0,
  },
]

// ─────────────────────────────────────────────────────────────
// 5. Marge arrière — l'argent qu'un distributeur oublie de réclamer
// ─────────────────────────────────────────────────────────────

export interface Ristourne {
  fournisseur_id: string
  fournisseur: string
  /** Condition contractuelle : « x % au-delà de N FCFA d'achats sur la période ». */
  condition: string
  seuil: number
  achats_periode: number
  taux_pct: number
  /** Montant acquis à date. */
  acquis: number
  statut: 'A_RECLAMER' | 'RECLAMEE' | 'ENCAISSEE' | 'SEUIL_NON_ATTEINT'
  /** Date limite de réclamation — passé ce délai, l'argent est perdu. */
  echeance_reclamation: string
  jours_restants: number
}

export const RISTOURNES: Ristourne[] = [
  {
    fournisseur_id: 'frn-1', fournisseur: 'Huiles Ouest Afrique',
    condition: '4 % au-delà de 150 M d\'achats annuels', seuil: 150_000_000,
    achats_periode: 184_000_000, taux_pct: 4, acquis: 7_360_000,
    statut: 'A_RECLAMER', echeance_reclamation: '2026-06-30', jours_restants: 19,
  },
  {
    fournisseur_id: 'frn-3', fournisseur: 'Brasserie du Golfe',
    condition: '5 % au-delà de 100 M d\'achats annuels', seuil: 100_000_000,
    achats_periode: 128_000_000, taux_pct: 5, acquis: 6_400_000,
    statut: 'RECLAMEE', echeance_reclamation: '2026-07-15', jours_restants: 34,
  },
  {
    fournisseur_id: 'frn-2', fournisseur: 'Riz Import Vietnam',
    condition: '6 % au-delà de 160 M d\'achats annuels', seuil: 160_000_000,
    achats_periode: 142_000_000, taux_pct: 6, acquis: 0,
    statut: 'SEUIL_NON_ATTEINT', echeance_reclamation: '2026-12-31', jours_restants: 203,
  },
  {
    fournisseur_id: 'frn-5', fournisseur: 'Coca-Cola Togo',
    condition: '3 % coopération commerciale (PLV, têtes de gondole)', seuil: 0,
    achats_periode: 112_000_000, taux_pct: 3, acquis: 3_360_000,
    statut: 'ENCAISSEE', echeance_reclamation: '2026-05-31', jours_restants: 0,
  },
]

// ─────────────────────────────────────────────────────────────
// 6. Échéances fiscales & sociales — les sorties qu'on ne négocie pas
// ─────────────────────────────────────────────────────────────

export interface EcheanceFiscale {
  id: string
  libelle: string
  organisme: string
  montant: number
  date_limite: string
  jours_restants: number
  statut: 'A_PREPARER' | 'PRETE' | 'DECLAREE' | 'PAYEE'
  penalite_retard: string
}

export const ECHEANCES_FISCALES: EcheanceFiscale[] = [
  {
    id: 'fis-1', libelle: 'TVA collectée - déductible (mai 2026)', organisme: 'OTR — Office Togolais des Recettes',
    montant: 6_840_000, date_limite: '2026-06-15', jours_restants: 4,
    statut: 'A_PREPARER', penalite_retard: '10 % du montant + 1 %/mois',
  },
  {
    id: 'fis-2', libelle: 'Cotisations sociales — CNSS', organisme: 'CNSS Togo',
    montant: 3_180_000, date_limite: '2026-06-15', jours_restants: 4,
    statut: 'PRETE', penalite_retard: '10 % de majoration',
  },
  {
    id: 'fis-3', libelle: 'Acompte impôt sur les sociétés — 2e tranche', organisme: 'OTR',
    montant: 4_200_000, date_limite: '2026-06-30', jours_restants: 19,
    statut: 'A_PREPARER', penalite_retard: '5 % + intérêts de retard',
  },
  {
    id: 'fis-4', libelle: 'Impôt sur les salaires (IRPP retenu)', organisme: 'OTR',
    montant: 1_940_000, date_limite: '2026-06-15', jours_restants: 4,
    statut: 'DECLAREE', penalite_retard: '10 %',
  },
]

// ─────────────────────────────────────────────────────────────
// 7. Lignes bancaires — la marge de manœuvre réelle
// ─────────────────────────────────────────────────────────────

export interface LigneBancaire {
  banque: string
  type: 'DECOUVERT' | 'ESCOMPTE' | 'CREDIT_CAMPAGNE'
  autorise: number
  utilise: number
  taux_pct: number
  echeance_revision: string
  /** Engagement pris auprès de la banque — s'il saute, la ligne est révisable. */
  covenant?: string
  covenant_respecte?: boolean
}

export const LIGNES_BANCAIRES: LigneBancaire[] = [
  {
    banque: 'Ecobank Togo', type: 'DECOUVERT',
    autorise: 60_000_000, utilise: 0, taux_pct: 11.5, echeance_revision: '2026-09-30',
    covenant: 'Trésorerie nette ≥ 40 M à la clôture de chaque trimestre',
    covenant_respecte: true,
  },
  {
    banque: 'Ecobank Togo', type: 'ESCOMPTE',
    autorise: 40_000_000, utilise: 12_400_000, taux_pct: 9.8, echeance_revision: '2026-12-31',
    covenant: 'Effets escomptés sur clients notés ≥ B uniquement',
    covenant_respecte: true,
  },
  {
    banque: 'Orabank', type: 'CREDIT_CAMPAGNE',
    autorise: 35_000_000, utilise: 28_000_000, taux_pct: 10.2, echeance_revision: '2026-08-15',
    covenant: 'Ratio dettes / fonds propres ≤ 1,5',
    covenant_respecte: false,
  },
]
