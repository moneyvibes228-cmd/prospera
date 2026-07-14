import { ENTREPRISE_REGISTRY } from './entreprise-registry'
import { DETTE_FOURNISSEURS_TOTALE, DETTE_FOURNISSEURS_ECHUE } from './fournisseurs-registry'

/**
 * Comptabilité & Finance DG — SYSCOHADA grossiste distributeur.
 */

export type StatutEcriture = 'VALIDEE' | 'BROUILLON' | 'ATTENTE_VALIDATION'
export type StatutRapprochement = 'POINTE' | 'EN_COURS' | 'ECART'

export interface CompteTresorerie {
  id: string
  libelle: string
  type: 'BANQUE' | 'CAISSE' | 'MOBILE'
  entrepot?: string
  solde: number
  entrees_jour: number
  sorties_jour: number
  evolution_7j: number[]
  alerte?: string
}

export interface LigneEcriture {
  compte: string
  libelle: string
  debit: number
  credit: number
}

export interface EcritureJournal {
  id: string
  date: string
  journal: string
  piece: string
  libelle: string
  montant: number
  lignes: LigneEcriture[]
  statut: StatutEcriture
  source: string
  auteur: string
}

export interface BalanceLigne {
  compte: string
  libelle: string
  classe: number
  debit_mois: number
  credit_mois: number
  solde: number
  sens: 'D' | 'C'
  variation_pct?: number
  alerte?: string
}

export interface PrevisionTresorerie {
  date: string
  entrees: number
  sorties: number
  solde_fin: number
  commentaire?: string
  alerte?: boolean
}

export interface CreanceComptable {
  client_id: string
  client_nom: string
  compte_aux: string
  montant: number
  paye: number
  reste: number
  jours_retard: number
  commercial: string
  provision_pct: number
  factures: string[]
}

export interface RapprochementCompta {
  id: string
  compte: string
  banque: string
  periode: string
  solde_comptable: number
  solde_releve: number
  ecart: number
  statut: StatutRapprochement
  operations_non_pointees: number
}

export interface LigneResultat {
  libelle: string
  montant_mois: number
  montant_ytd: number
  section: 'PRODUITS' | 'ACHATS' | 'MARGE' | 'CHARGES' | 'RESULTAT'
  pct_ca?: number
}

export interface SuspensComptable {
  id: string
  libelle: string
  montant: number
  anciennete_j: number
  statut: 'CRITIQUE' | 'MODERE'
  action: string
}

export const REFERENTIEL_COMPTA = {
  norme: 'SYSCOHADA révisé',
  plan: 'Plan comptable OHADA',
  exercice: '2026',
  periode: 'Juin 2026',
  devise: 'FCFA',
  entite: ENTREPRISE_REGISTRY.nomLegal,
}

export const COMPTES_TRESORERIE: CompteTresorerie[] = [
  {
    id: 'treso-1', libelle: 'Banque Ecobank — compte principal', type: 'BANQUE',
    solde: 98_200_000, entrees_jour: 12_400_000, sorties_jour: 8_600_000,
    evolution_7j: [92, 94, 96, 95, 97, 98, 98.2],
  },
  {
    id: 'treso-2', libelle: 'Caisse siège Lomé Port', type: 'CAISSE', entrepot: 'Lomé Port',
    solde: 22_400_000, entrees_jour: 3_200_000, sorties_jour: 1_800_000,
    evolution_7j: [20, 21, 21.5, 22, 22, 22.2, 22.4],
  },
  {
    id: 'treso-3', libelle: 'Caisse entrepôt Kara', type: 'CAISSE', entrepot: 'Kara',
    solde: 7_800_000, entrees_jour: 1_400_000, sorties_jour: 920_000,
    evolution_7j: [7.2, 7.4, 7.5, 7.6, 7.7, 7.75, 7.8],
  },
]

export const ECRITURES_JOURNAL: EcritureJournal[] = [
  {
    id: 'ecr-1', date: '2026-06-11', journal: 'VT', piece: 'FAC-8840', libelle: 'Vente Boutique Akossombo — virement',
    montant: 4_850_000, statut: 'VALIDEE', source: 'Facturation auto', auteur: 'Système',
    lignes: [
      { compte: '411100', libelle: 'Client Akossombo', debit: 4_850_000, credit: 0 },
      { compte: '701100', libelle: 'Ventes marchandises', debit: 0, credit: 4_120_000 },
      { compte: '443100', libelle: 'TVA collectée', debit: 0, credit: 730_000 },
    ],
  },
  {
    id: 'ecr-2', date: '2026-06-11', journal: 'BQ', piece: 'ENC-8840', libelle: 'Encaissement Akossombo — virement reçu',
    montant: 4_850_000, statut: 'VALIDEE', source: 'Banque auto', auteur: 'Système',
    lignes: [
      { compte: '512100', libelle: 'Banque Ecobank', debit: 4_850_000, credit: 0 },
      { compte: '411100', libelle: 'Client Akossombo', debit: 0, credit: 4_850_000 },
    ],
  },
  {
    id: 'ecr-3', date: '2026-06-11', journal: 'VT', piece: 'FAC-8834', libelle: 'Vente Épicerie Mama T. — crédit client',
    montant: 1_920_000, statut: 'VALIDEE', source: 'Facturation auto', auteur: 'Système',
    lignes: [
      { compte: '411200', libelle: 'Client Mama T.', debit: 1_920_000, credit: 0 },
      { compte: '701100', libelle: 'Ventes marchandises', debit: 0, credit: 1_632_000 },
      { compte: '443100', libelle: 'TVA collectée', debit: 0, credit: 288_000 },
    ],
  },
  {
    id: 'ecr-4', date: '2026-06-11', journal: 'VT', piece: 'FAC-8821', libelle: 'Vente Kiosque Port — impayé J+45',
    montant: 2_840_000, statut: 'VALIDEE', source: 'Facturation auto', auteur: 'Système',
    lignes: [
      { compte: '411300', libelle: 'Client Kiosque Port', debit: 2_840_000, credit: 0 },
      { compte: '701100', libelle: 'Ventes marchandises', debit: 0, credit: 2_410_000 },
      { compte: '443100', libelle: 'TVA collectée', debit: 0, credit: 430_000 },
    ],
  },
  {
    id: 'ecr-5', date: '2026-06-11', journal: 'AC', piece: 'ACH-8821', libelle: 'Réception huile 5L — fournisseur partiel',
    montant: 3_400_000, statut: 'VALIDEE', source: 'Achats', auteur: 'Yao Mensah',
    lignes: [
      { compte: '601100', libelle: 'Achats marchandises', debit: 2_881_356, credit: 0 },
      { compte: '445200', libelle: 'TVA déductible', debit: 518_644, credit: 0 },
      { compte: '401100', libelle: 'Fournisseur Huiles Ouest', debit: 0, credit: 3_400_000 },
    ],
  },
  {
    id: 'ecr-6', date: '2026-06-11', journal: 'BQ', piece: 'DEC-4521', libelle: 'Décaissement fournisseur huile — acompte',
    montant: 2_000_000, statut: 'VALIDEE', source: 'Banque', auteur: 'DAF',
    lignes: [
      { compte: '401100', libelle: 'Fournisseur Huiles Ouest', debit: 2_000_000, credit: 0 },
      { compte: '512100', libelle: 'Banque Ecobank', debit: 0, credit: 2_000_000 },
    ],
  },
  {
    id: 'ecr-7', date: '2026-06-11', journal: 'OD', piece: 'PROV-411', libelle: 'Provision créance douteuse Kiosque Port',
    montant: 1_420_000, statut: 'ATTENTE_VALIDATION', source: 'IA DAF', auteur: 'DAF Copilot',
    lignes: [
      { compte: '657100', libelle: 'Pertes sur créances', debit: 1_420_000, credit: 0 },
      { compte: '491200', libelle: 'Provision clients douteux', debit: 0, credit: 1_420_000 },
    ],
  },
  {
    id: 'ecr-8', date: '2026-06-10', journal: 'VT', piece: 'FAC-8838', libelle: 'Vente Superette Kara',
    montant: 5_800_000, statut: 'VALIDEE', source: 'Facturation auto', auteur: 'Système',
    lignes: [
      { compte: '411400', libelle: 'Client Superette Kara', debit: 5_800_000, credit: 0 },
      { compte: '701100', libelle: 'Ventes marchandises', debit: 0, credit: 4_915_254 },
      { compte: '443100', libelle: 'TVA collectée', debit: 0, credit: 884_746 },
    ],
  },
  {
    id: 'ecr-9', date: '2026-06-10', journal: 'CA', piece: 'CAI-8839', libelle: 'Encaissement espèces Dépôt Agoè',
    montant: 3_680_000, statut: 'VALIDEE', source: 'Caisse Lomé', auteur: 'Caisse',
    lignes: [
      { compte: '531100', libelle: 'Caisse Lomé Port', debit: 3_680_000, credit: 0 },
      { compte: '411500', libelle: 'Client Dépôt Agoè', debit: 0, credit: 3_680_000 },
    ],
  },
  {
    id: 'ecr-10', date: '2026-06-10', journal: 'CH', piece: 'SAL-06', libelle: 'Charges personnel — commissions commerciales',
    montant: 4_200_000, statut: 'VALIDEE', source: 'Paie', auteur: 'RH',
    lignes: [
      { compte: '661100', libelle: 'Rémunérations personnel', debit: 4_200_000, credit: 0 },
      { compte: '421100', libelle: 'Personnel — rémunérations dues', debit: 0, credit: 4_200_000 },
    ],
  },
]

export const BALANCE_GENERALE: BalanceLigne[] = [
  { compte: '211000', libelle: 'Immobilisations corporelles', classe: 2, debit_mois: 0, credit_mois: 0, solde: 45_000_000, sens: 'D' },
  { compte: '311000', libelle: 'Stocks marchandises', classe: 3, debit_mois: 18_400_000, credit_mois: 12_200_000, solde: 86_500_000, sens: 'D', variation_pct: 8 },
  { compte: '411100', libelle: 'Clients — créances commerciales', classe: 4, debit_mois: 42_800_000, credit_mois: 28_400_000, solde: 18_350_000, sens: 'D', variation_pct: 12, alerte: '23% créances > 30j' },
  // Solde dérivé du registre fournisseurs — source unique de vérité de la dette (spec V2 §8).
  {
    compte: '401100', libelle: 'Fournisseurs', classe: 4,
    debit_mois: 8_200_000, credit_mois: 14_600_000,
    solde: DETTE_FOURNISSEURS_TOTALE, sens: 'C',
    alerte: `${(DETTE_FOURNISSEURS_ECHUE / 1_000_000).toFixed(1)} M échus`,
  },
  { compte: '512100', libelle: 'Banque Ecobank', classe: 5, debit_mois: 32_400_000, credit_mois: 28_600_000, solde: 98_200_000, sens: 'D' },
  { compte: '531100', libelle: 'Caisse Lomé Port', classe: 5, debit_mois: 8_400_000, credit_mois: 6_200_000, solde: 22_400_000, sens: 'D' },
  { compte: '531200', libelle: 'Caisse Kara', classe: 5, debit_mois: 3_200_000, credit_mois: 2_400_000, solde: 7_800_000, sens: 'D' },
  { compte: '601100', libelle: 'Achats marchandises', classe: 6, debit_mois: 68_400_000, credit_mois: 0, solde: 68_400_000, sens: 'D', variation_pct: 15 },
  { compte: '661100', libelle: 'Charges de personnel', classe: 6, debit_mois: 12_800_000, credit_mois: 0, solde: 12_800_000, sens: 'D' },
  { compte: '657100', libelle: 'Pertes sur créances clients', classe: 6, debit_mois: 1_420_000, credit_mois: 0, solde: 1_420_000, sens: 'D', alerte: 'Provision Kiosque en attente' },
  { compte: '701100', libelle: 'Ventes de marchandises', classe: 7, debit_mois: 0, credit_mois: 89_200_000, solde: 89_200_000, sens: 'C', variation_pct: 6 },
  { compte: '736100', libelle: 'Marge brute distribution', classe: 7, debit_mois: 0, credit_mois: 14_800_000, solde: 14_800_000, sens: 'C' },
]

export const PREVISIONS_TRESORERIE: PrevisionTresorerie[] = [
  { date: '2026-06-11', entrees: 18_400_000, sorties: 12_320_000, solde_fin: 128_400_000 },
  { date: '2026-06-12', entrees: 14_200_000, sorties: 9_800_000, solde_fin: 132_800_000 },
  { date: '2026-06-13', entrees: 11_600_000, sorties: 8_400_000, solde_fin: 136_000_000 },
  { date: '2026-06-14', entrees: 8_200_000, sorties: 6_100_000, solde_fin: 138_100_000, commentaire: 'Week-end — encaissements réduits' },
  { date: '2026-06-15', entrees: 6_400_000, sorties: 5_200_000, solde_fin: 139_300_000 },
  { date: '2026-06-16', entrees: 22_800_000, sorties: 28_600_000, solde_fin: 133_500_000, commentaire: 'Pic sortie — réappro huile 5L + riz maritime', alerte: true },
  { date: '2026-06-17', entrees: 16_400_000, sorties: 14_200_000, solde_fin: 135_700_000 },
]

export const CREANCES_COMPTABLES: CreanceComptable[] = [
  { client_id: 'pdv-3', client_nom: 'Kiosque Port', compte_aux: '411300', montant: 8_900_000, paye: 0, reste: 8_900_000, jours_retard: 78, commercial: 'Komlan Tetteh', provision_pct: 50, factures: ['FAC-8821', 'FAC-8810', 'FAC-8798'] },
  { client_id: 'pdv-9', client_nom: 'Grossiste Adidogomé', compte_aux: '411600', montant: 5_250_000, paye: 0, reste: 5_250_000, jours_retard: 20, commercial: 'Mawuena Ahi', provision_pct: 30, factures: ['FAC-8828', 'FAC-8831'] },
  { client_id: 'pdv-2', client_nom: 'Épicerie Mama T.', compte_aux: '411200', montant: 3_400_000, paye: 0, reste: 3_400_000, jours_retard: 28, commercial: 'Komlan Tetteh', provision_pct: 15, factures: ['FAC-8834', 'FAC-8825'] },
  { client_id: 'pdv-5', client_nom: 'Dépôt Sokodé', compte_aux: '411700', montant: 1_240_000, paye: 620_000, reste: 620_000, jours_retard: 5, commercial: 'Yao Ahi', provision_pct: 0, factures: ['FAC-8841'] },
  { client_id: 'pdv-7', client_nom: 'Dépôt Agoè Plage', compte_aux: '411500', montant: 1_820_000, paye: 1_640_000, reste: 180_000, jours_retard: 8, commercial: 'Kofi Agbessi', provision_pct: 0, factures: ['FAC-8830'] },
]

export const RAPPROCHEMENTS: RapprochementCompta[] = [
  { id: 'rap-1', compte: '512100', banque: 'Ecobank Lomé', periode: 'Juin 2026', solde_comptable: 98_200_000, solde_releve: 98_200_000, ecart: 0, statut: 'POINTE', operations_non_pointees: 0 },
  { id: 'rap-2', compte: '531100', banque: 'Caisse Lomé Port', periode: 'Juin 2026', solde_comptable: 22_400_000, solde_releve: 22_380_000, ecart: 20_000, statut: 'EN_COURS', operations_non_pointees: 2 },
  { id: 'rap-3', compte: '531200', banque: 'Caisse Kara', periode: 'Juin 2026', solde_comptable: 7_800_000, solde_releve: 7_800_000, ecart: 0, statut: 'POINTE', operations_non_pointees: 0 },
]

export const COMPTE_RESULTAT: LigneResultat[] = [
  { libelle: 'Ventes de marchandises (701)', montant_mois: 89_200_000, montant_ytd: 412_000_000, section: 'PRODUITS', pct_ca: 100 },
  { libelle: 'Achats marchandises (601)', montant_mois: 68_400_000, montant_ytd: 318_400_000, section: 'ACHATS', pct_ca: 77 },
  { libelle: 'Marge brute', montant_mois: 20_800_000, montant_ytd: 93_600_000, section: 'MARGE', pct_ca: 23 },
  { libelle: 'Charges personnel (661)', montant_mois: 12_800_000, montant_ytd: 58_200_000, section: 'CHARGES', pct_ca: 14 },
  { libelle: 'Transport & logistique', montant_mois: 4_200_000, montant_ytd: 19_800_000, section: 'CHARGES', pct_ca: 5 },
  { libelle: 'Pertes sur créances (657)', montant_mois: 1_420_000, montant_ytd: 2_800_000, section: 'CHARGES', pct_ca: 2 },
  { libelle: 'Résultat net estimé', montant_mois: 2_380_000, montant_ytd: 12_800_000, section: 'RESULTAT', pct_ca: 3 },
]

export const SUSPENS_COMPTABLES: SuspensComptable[] = [
  { id: 'sus-1', libelle: 'Provision Kiosque Port — écriture en attente validation DG', montant: 1_420_000, anciennete_j: 0, statut: 'CRITIQUE', action: 'Valider écriture OD PROV-411 ou contester avec DAF' },
  { id: 'sus-2', libelle: 'Écart caisse Lomé 20 000 F — rapprochement en cours', montant: 20_000, anciennete_j: 3, statut: 'MODERE', action: 'Pointage caisse J+2' },
  { id: 'sus-3', libelle: 'Facture fournisseur huile — BL partiel non rapproché', montant: 1_400_000, anciennete_j: 8, statut: 'MODERE', action: 'Rapprocher BL-8790 avec écriture ACH-8821' },
]

export const DECISIONS_COMPTA_DG = [
  { priorite: 1, titre: 'Valider provision Kiosque Port 1,42 M', impact: 'Bilan créances réaliste', decision: 'Approuver écriture OD PROV-411 ou demander audit' },
  { priorite: 2, titre: 'Anticiper pic trésorerie J+5', impact: 'Sortie 28,6 M — réappro huile + riz', decision: 'Geler dépenses non critiques · négocier délai fournisseur' },
  { priorite: 3, titre: 'Créances > 30j = 23% du poste client', impact: '18,35 M encours · 8,9 M Kiosque', decision: 'Aligner compta + relances · blocage crédit clients à risque' },
  { priorite: 4, titre: 'Marge brute 23% — sous objectif 25%', impact: 'Coût huile + commissions', decision: 'Revoir grille tarifaire dépôts · audit achats 601' },
  { priorite: 5, titre: 'Clôture juin dans 19j', impact: '1 écriture attente + 2 rapprochements', decision: 'Comité clôture avec DAF le 25/06' },
]
