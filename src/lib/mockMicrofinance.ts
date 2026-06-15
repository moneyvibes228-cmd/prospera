// =============================================================================
//   MOCK MICROFINANCE — Données enrichies pour dashboards Prospera CBI v5
//   Couvre : Transactions · Épargne · Décisions crédit · Secteurs · BCEAO · IA
// =============================================================================

import { RESEAU_CONSOLIDE } from '@/lib/agences'
import { buildParGranulaireReseau, buildRisqueAgingDetail } from '@/lib/credit-dossiers-stats'
import { buildRisqueAvanceComplet } from '@/lib/mock-credit-builders'
import { buildControleInterne, buildAlertesCbi9Codes, buildAnomaliesJour, countDossierCbiAlerts } from '@/lib/mock-controle-interne-registry'
import {
  buildAlertesCbiLabels,
  buildAuditAgencesRadar,
  buildAuditAlertesHome,
  buildAuditContext,
  buildAuditDetailPagesMeta,
  buildAuditKpisHome,
  buildAuditPriorites,
  buildAuditSyntheseIntro,
  buildAuditSynthesePoints,
  buildAuditTracabilite,
  buildCaisseComptabiliteAudit,
  buildControleCreditAudit,
  buildDetectionComportementale,
  buildRapportIAAuditeur,
  buildRapportIACreditRisque,
} from '@/lib/mock-audit-builders'
import { buildConformiteBceao } from '@/lib/mock-conformite-bceao-builder'
import { buildComptabiliteSyscohadaImf } from '@/lib/mock-comptabilite-syscohada'
import {
  buildCashGlobal,
  buildCashParAgence,
  buildEpargneStats,
  buildTransactionsStats,
} from '@/lib/mock-operations-registry'
import {
  buildCcHomeDerived,
  buildCommercialHomeDerived,
  buildCommunicationHomeDerived,
  buildDafHomeDerived,
  buildGpHomeDerived,
  buildGpHomeExtra,
  buildRaHomeDerived,
  buildRapportIAAgentTerrain,
  buildRapportIACommercial,
  buildRapportIAFinances,
  buildRapportIAGestionnaire,
  buildRapportIAMarketing,
  buildRocHomeDerived,
  buildTerrainHomeDerived,
  mapRapportCcToDossierLike,
} from '@/lib/mock-persona-builders'
import { buildTransactionsRecentes } from '@/lib/mock-operations-transactions-builder'
import {
  buildKpisGlobauxDG,
  buildKpisRocReseau,
  buildKpisRocTop,
  type KpiGlobalDG,
} from '@/lib/mock-reseau-kpis-builder'
import {
  buildDossiersBloquesRoc,
} from '@/lib/mock-risque-registry'
import {
  buildRocEvolutionPar30,
  buildRocKpisCreditEtendus,
  buildRocKpisOperationsFixed,
  buildRocPerformanceAgents,
  buildRocRecouvrementReseau,
  buildRocSyntheseNarrative,
  buildRocTopMauvaisPayeurs,
} from '@/lib/roc-dashboard-hub'
import { PORTEFEUILLE_AGING_RESEAU } from '@/lib/portefeuille-reseau'
import { buildRapportIADG } from '@/lib/rapport-dg-builder'
import type { RapportIA } from '@/types/rapport-ia'

export type { RapportIA } from '@/types/rapport-ia'
export type { SyntheseAgenceIA, MembreEquipeSynthese, EvolutionAgence6M } from '@/lib/synthese-agences-dg'

// ─────────────────────────────────────────────────────────────────────────────
//   1. TRANSACTIONS — Toutes opérations financières
// ─────────────────────────────────────────────────────────────────────────────

export type TypeTransaction =
  | 'DECAISSEMENT_CREDIT'
  | 'REMBOURSEMENT_CREDIT'
  | 'DEPOT_EPARGNE'
  | 'RETRAIT_EPARGNE'
  | 'TRANSFERT_INTERNE'
  | 'COMMISSION'
  | 'FRAIS_DOSSIER'

export type CanalPaiement =
  | 'MTN_MOMO' | 'AIRTEL_MONEY' | 'ORANGE_MONEY' | 'WAVE'
  | 'ESPECES' | 'CHEQUE' | 'VIREMENT'

export interface Transaction {
  id: string
  date: string
  heure: string
  type: TypeTransaction
  canal: CanalPaiement
  montant: number
  client: string
  agence_id: string
  agent: string
  reference: string
  statut: 'REUSSIE' | 'EN_ATTENTE' | 'ECHOUEE' | 'ANNULEE'
  motif_echec?: string
}

export const TRANSACTIONS_RECENTES: Transaction[] = buildTransactionsRecentes()

export const TRANSACTIONS_STATS = buildTransactionsStats()

// ─────────────────────────────────────────────────────────────────────────────
//   2. ÉPARGNE — Comptes d'épargne dédiés
// ─────────────────────────────────────────────────────────────────────────────

export interface CompteEpargne {
  id: string
  client: string
  type: 'INDIVIDUEL' | 'GROUPE_FEMMES' | 'TONTINE' | 'SCOLAIRE' | 'SANTE'
  agence: string
  solde: number
  date_ouverture: string
  dernier_mouvement: string
  statut: 'ACTIF' | 'DORMANT' | 'CLOTURE'
  frequence_depot: 'JOURNALIER' | 'HEBDO' | 'MENSUEL' | 'IRREGULIER'
}

export const EPARGNE_STATS = buildEpargneStats()

// ─────────────────────────────────────────────────────────────────────────────
//   3. DOSSIERS CRÉDIT — alignés portefeuille réseau (credit-dossiers-stats.ts)
// ─────────────────────────────────────────────────────────────────────────────

export { DOSSIERS_CREDIT_STATS } from '@/lib/credit-dossiers-stats'

// ─────────────────────────────────────────────────────────────────────────────
//   4. SECTEURS & PORTEFEUILLE — alignés sur agences.ts (portefeuille-reseau.ts)
// ─────────────────────────────────────────────────────────────────────────────

export type { SecteurStats } from '@/lib/portefeuille-reseau'
export {
  SECTEURS,
  BCEAO_REPARTITION,
  EXPECTED_LOSS,
  PORTEFEUILLE_AGING_RESEAU,
  getPortefeuilleConsolide,
} from '@/lib/portefeuille-reseau'

// ─────────────────────────────────────────────────────────────────────────────
//   5. RISQUE CBI v5 — Classes BCEAO, Expected Loss (voir portefeuille-reseau.ts)
//   ALERTES_CBI_9_CODES / ALERTES_CBI_LABELS : voir après DOSSIERS_ANALYSE_CC
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//   6. RAPPORTS IA — Un par rôle, vue d'ensemble synthétique
// ─────────────────────────────────────────────────────────────────────────────

/** Rapport DG — généré depuis agences.ts (source de vérité unique) */
export const RAPPORT_IA_DG: RapportIA = buildRapportIADG()

export const RAPPORT_IA_CREDIT_RISQUE: RapportIA = buildRapportIACreditRisque()

export const RAPPORT_IA_GESTIONNAIRE: RapportIA = buildRapportIAGestionnaire()

export const RAPPORT_IA_AGENT_TERRAIN: RapportIA = buildRapportIAAgentTerrain()

export const RAPPORT_IA_COMMERCIAL: RapportIA = buildRapportIACommercial()

export const RAPPORT_IA_FINANCES: RapportIA = buildRapportIAFinances()

export const RAPPORT_IA_AUDITEUR: RapportIA = buildRapportIAAuditeur()

export const RAPPORT_IA_MARKETING: RapportIA = buildRapportIAMarketing()


// =============================================================================
//   9. RENTABILITÉ — Revenus, charges, profit, coût du risque, ROI
// =============================================================================

export interface LigneRevenu {
  source: string
  montant: number
  pct: number
  variation_pct: number
  detail?: string
}

export interface LigneCharge {
  poste: string
  montant: number
  pct: number
  variation_pct: number
  type: 'PERSONNEL' | 'LOCATIF' | 'IT' | 'TRANSPORT' | 'MARKETING' | 'AUTRES'
}

export const REVENUS_CHARGES = {
  periode: 'Mai 2026',
  ca_brut: 18_420_000,
  revenus_nets: 16_840_000,
  charges_totales: 11_280_000,
  profit_net: 5_560_000,
  marge_nette_pct: 30.2,
  cout_du_risque_pct: 1.8,
  cout_du_risque_montant: 1_647_500,
  roi_annualise_pct: 22.4,
  variation_profit_mom: 8.7,

  revenus_detail: [
    { source: 'Intérêts crédit individuel', montant: 8_240_000, pct: 44.7, variation_pct: 6.2, detail: 'Taux moy. 14.5%' },
    { source: 'Intérêts groupe solidaire',  montant: 3_180_000, pct: 17.3, variation_pct: 11.8, detail: 'Taux moy. 18%' },
    { source: 'Intérêts PME',               montant: 2_640_000, pct: 14.3, variation_pct: 4.5,  detail: 'Taux moy. 12%' },
    { source: 'Intérêts agriculture',       montant: 1_120_000, pct: 6.1,  variation_pct: -2.3, detail: 'Saison soudure' },
    { source: 'Frais dossier',              montant: 1_485_000, pct: 8.1,  variation_pct: 14.6, detail: '5 700 FCFA / dossier moy.' },
    { source: 'Commissions MoMo',           montant:   850_000, pct: 4.6,  variation_pct: 18.4, detail: 'Cashback opérateurs' },
    { source: 'Frais tenue de compte',      montant:   620_000, pct: 3.4,  variation_pct: 2.1,  detail: '287 comptes épargne' },
    { source: 'Autres produits',            montant:   285_000, pct: 1.5,  variation_pct: 0,    detail: 'Microassurance' },
  ] as LigneRevenu[],

  charges_detail: [
    { poste: 'Salaires & charges sociales', montant: 5_840_000, pct: 51.8, variation_pct: 2.1, type: 'PERSONNEL' },
    { poste: 'Commissions agents terrain',  montant: 1_840_000, pct: 16.3, variation_pct: 12.2, type: 'PERSONNEL' },
    { poste: 'Loyers agences',              montant:   985_000, pct: 8.7,  variation_pct: 0,    type: 'LOCATIF' },
    { poste: 'Charges IT & hébergement',    montant:   720_000, pct: 6.4,  variation_pct: 8.5,  type: 'IT' },
    { poste: 'Carburant & véhicules',       montant:   480_000, pct: 4.3,  variation_pct: 15.3, type: 'TRANSPORT' },
    { poste: 'Marketing & WhatsApp Business',montant:  320_000, pct: 2.8,  variation_pct: 6.2,  type: 'MARKETING' },
    { poste: 'Provisions risque',           montant: 1_095_000, pct: 9.7,  variation_pct: 4.8,  type: 'AUTRES' },
  ] as LigneCharge[],

  evolution_12_mois: [
    { mois: 'Juin 25',  revenus: 13_200_000, charges: 9_840_000,  profit: 3_360_000, marge_pct: 25.5 },
    { mois: 'Juil 25',  revenus: 13_840_000, charges: 9_920_000,  profit: 3_920_000, marge_pct: 28.3 },
    { mois: 'Août 25',  revenus: 14_120_000, charges: 10_180_000, profit: 3_940_000, marge_pct: 27.9 },
    { mois: 'Sept 25',  revenus: 14_560_000, charges: 10_320_000, profit: 4_240_000, marge_pct: 29.1 },
    { mois: 'Oct 25',   revenus: 15_280_000, charges: 10_580_000, profit: 4_700_000, marge_pct: 30.8 },
    { mois: 'Nov 25',   revenus: 15_640_000, charges: 10_840_000, profit: 4_800_000, marge_pct: 30.7 },
    { mois: 'Déc 25',   revenus: 17_180_000, charges: 11_640_000, profit: 5_540_000, marge_pct: 32.2 },
    { mois: 'Jan 26',   revenus: 15_240_000, charges: 10_680_000, profit: 4_560_000, marge_pct: 29.9 },
    { mois: 'Fév 26',   revenus: 15_820_000, charges: 10_840_000, profit: 4_980_000, marge_pct: 31.5 },
    { mois: 'Mar 26',   revenus: 16_180_000, charges: 11_020_000, profit: 5_160_000, marge_pct: 31.9 },
    { mois: 'Avr 26',   revenus: 16_440_000, charges: 11_320_000, profit: 5_120_000, marge_pct: 31.1 },
    { mois: 'Mai 26',   revenus: 16_840_000, charges: 11_280_000, profit: 5_560_000, marge_pct: 33.0 },
  ],

  ratios_cles: [
    { ratio: 'Marge nette',          valeur: '30.2%', cible: '> 25%', statut: 'BON' },
    { ratio: 'Coût du risque',       valeur: '1.8%',  cible: '< 2.5%', statut: 'BON' },
    { ratio: 'ROI annualisé',        valeur: '22.4%', cible: '> 18%', statut: 'BON' },
    { ratio: 'Cost-to-income ratio', valeur: '57.4%', cible: '< 65%', statut: 'BON' },
    { ratio: 'OSS (autosuffisance)', valeur: '149%',  cible: '> 100%', statut: 'BON' },
    { ratio: 'FSS (viabilité financ.)', valeur: '128%', cible: '> 100%', statut: 'BON' },
  ],
}

// =============================================================================
//   10. TRÉSORERIE — Flux entrants/sortants + prévisions
// =============================================================================

export const TRESORERIE = {
  solde_actuel: 28_640_000,
  solde_minimum_legal: 12_000_000,
  marge_securite_pct: 138.7,
  autonomie_semaines: 6.2,
  variation_jour: 480_000,
  variation_jour_pct: 1.7,

  flux_7j: [
    { date: '15/05', entrants: 4_280_000, sortants: 3_640_000, solde: 26_180_000 },
    { date: '16/05', entrants: 3_840_000, sortants: 4_120_000, solde: 25_900_000 },
    { date: '17/05', entrants: 2_920_000, sortants: 2_180_000, solde: 26_640_000 },
    { date: '18/05', entrants: 4_640_000, sortants: 3_840_000, solde: 27_440_000 },
    { date: '19/05', entrants: 5_120_000, sortants: 4_580_000, solde: 27_980_000 },
    { date: '20/05', entrants: 4_840_000, sortants: 4_360_000, solde: 28_460_000 },
    { date: '21/05', entrants: 4_280_000, sortants: 4_100_000, solde: 28_640_000 },
  ],

  flux_par_categorie_mois: {
    entrants: {
      remboursements_credit:   64_300_000,
      depots_epargne:          18_400_000,
      frais_et_commissions:     2_330_000,
      autres_recettes:            285_000,
      total:                   85_315_000,
    },
    sortants: {
      decaissements_credit:    24_600_000,
      retraits_epargne:         6_800_000,
      charges_operationnelles: 11_280_000,
      autres_depenses:            420_000,
      total:                   43_100_000,
    },
    flux_net: 42_215_000,
  },

  previsions_30j: [
    { jour: 7,  scenario_central: 30_280_000, scenario_optimiste: 31_840_000, scenario_pessimiste: 28_120_000 },
    { jour: 14, scenario_central: 32_140_000, scenario_optimiste: 34_280_000, scenario_pessimiste: 27_680_000 },
    { jour: 21, scenario_central: 33_840_000, scenario_optimiste: 36_640_000, scenario_pessimiste: 27_240_000 },
    { jour: 30, scenario_central: 35_640_000, scenario_optimiste: 39_180_000, scenario_pessimiste: 26_840_000 },
  ],

  alertes_tresorerie: [
    { code: 'SOLDE_OK',            severite: 'INFO',  message: 'Solde 138% au-dessus du minimum légal — situation saine' },
    { code: 'DECAISSEMENTS_AVRIL', severite: 'WARN',  message: 'Décaissements +12% ce mois vs avril — surveiller couverture' },
    { code: 'COLLECTE_SOUDURE',    severite: 'WARN',  message: 'Période soudure agriculture : prévoir baisse remb. 8-12%' },
  ],
}

import {
  EVOLUTION_ACQUISITION_12_MOIS,
  PRODUITS_TOP_VENTES,
} from '@/lib/commercial-dc-hub'

export const PIPELINE_COMMERCIAL = {
  periode: 'Mai 2026',
  funnel: [
    { etape: 'Prospects identifiés',  count: 210, valeur_potentielle: 84_000_000, conversion_vs_prev: 100,  drop_pct: 0 },
    { etape: 'Contact établi',         count: 142, valeur_potentielle: 56_800_000, conversion_vs_prev: 67.6, drop_pct: 32.4 },
    { etape: 'RDV qualifié',           count: 89,  valeur_potentielle: 35_600_000, conversion_vs_prev: 62.7, drop_pct: 37.3 },
    { etape: 'Dossier en analyse',     count: 47,  valeur_potentielle: 18_800_000, conversion_vs_prev: 52.8, drop_pct: 47.2 },
    { etape: 'Offre formulée',         count: 38,  valeur_potentielle: 15_200_000, conversion_vs_prev: 80.9, drop_pct: 19.1 },
    { etape: 'Signature & déblocage',  count: 28,  valeur_potentielle: 11_200_000, conversion_vs_prev: 73.7, drop_pct: 26.3 },
  ],
  taux_conversion_global_pct: 13.3,
  duree_cycle_moyen_jours: 9.4,
  valeur_pipeline_actif: 35_600_000,
  valeur_signee_mois: 11_200_000,
  objectif_signature_mois: 15_000_000,
  atteinte_objectif_pct: 74.7,

  prospects_chauds: [
    { id: 'PR-2401', nom: 'Adjoa Klutse',     besoin: 'PME couture',          montant: 1_800_000, score_ia: 87, derniere_action: 'RDV 19/05', prochaine_action: 'Envoyer offre', delai: '24h', agent: 'Akua Lawson',  agence: 'Lomé Centre' },
    { id: 'PR-2402', nom: 'Mensah Folly',     besoin: 'Crédit conso scolaire', montant:   450_000, score_ia: 82, derniere_action: 'Visite 20/05', prochaine_action: 'Collecte docs', delai: '48h', agent: 'Kofi Amavi',  agence: 'Lomé Centre' },
    { id: 'PR-2403', nom: 'GIE Femmes Marché', besoin: 'Groupe solidaire',     montant: 2_400_000, score_ia: 79, derniere_action: 'Réunion 18/05', prochaine_action: 'Validation crédit', delai: '5j', agent: 'Edem Kpélim', agence: 'Lomé Centre' },
    { id: 'PR-2404', nom: 'Yao Tetevi',       besoin: 'Renforcement boutique', montant:   650_000, score_ia: 76, derniere_action: 'Chatbot WA',    prochaine_action: 'Premier RDV',     delai: '24h', agent: 'Komi Atsu',   agence: 'Tsévié' },
    { id: 'PR-2405', nom: 'Coop. agri Tabligbo', besoin: 'Engrais campagne',   montant: 3_200_000, score_ia: 81, derniere_action: 'Demande site', prochaine_action: 'Étude collective', delai: '3j',  agent: 'Ama Fiagbé',  agence: 'Tabligbo' },
    { id: 'PR-2406', nom: 'Kossi Dzigbodi',    besoin: 'PME menuiserie',       montant:   900_000, score_ia: 74, derniere_action: 'Référencé',     prochaine_action: 'Qualification',   delai: '24h', agent: 'Akua Lawson', agence: 'Lomé Centre' },
    { id: 'PR-2407', nom: 'Afi Lawson',        besoin: 'Tontinière',           montant:   180_000, score_ia: 71, derniere_action: 'Mobile money', prochaine_action: 'Onboarding',      delai: '48h', agent: 'Komi Atsu',   agence: 'Tsévié' },
    { id: 'PR-2408', nom: 'Sika Adjovi',       besoin: 'Trading import',       montant: 1_200_000, score_ia: 78, derniere_action: 'WA réponse',   prochaine_action: 'RDV',             delai: '3j',  agent: 'Edem Kpélim', agence: 'Lomé Centre' },
  ],

  relances_a_faire_aujourdhui: [
    { client: 'Komi Atsu Dewonou',    motif: 'Offre formulée — pas de retour 6j', canal: 'WhatsApp', priorite: 'HAUTE',     agent: 'Akua Lawson',  agence: 'Lomé Centre' },
    { client: 'Mawuena Hotor',         motif: 'Dossier incomplet — pièces manquantes', canal: 'Téléphone', priorite: 'HAUTE', agent: 'Kofi Amavi',   agence: 'Lomé Centre' },
    { client: 'Coop. Tabligbo',        motif: 'Étude collective à finaliser',    canal: 'Visite',   priorite: 'CRITIQUE', agent: 'Ama Fiagbé',   agence: 'Tabligbo' },
    { client: 'Edem Bessan',           motif: 'Premier contact non confirmé',     canal: 'WhatsApp', priorite: 'MOYENNE',  agent: 'Komi Atsu',    agence: 'Tsévié' },
    { client: 'Ama Kpodaho',           motif: 'Échéance offre J+2',               canal: 'Téléphone', priorite: 'HAUTE',    agent: 'Akua Lawson',  agence: 'Lomé Centre' },
    { client: 'Togbui Apedo',          motif: 'A demandé info sur PME 4j',        canal: 'Visite',   priorite: 'MOYENNE',  agent: 'Edem Kpélim',  agence: 'Lomé Centre' },
    { client: 'Akouvi Senou',          motif: 'Devis envoyé sans suite',          canal: 'WhatsApp', priorite: 'MOYENNE',  agent: 'Ama Fiagbé',   agence: 'Tabligbo' },
    { client: 'Sika Adjovi',           motif: 'A confirmé intérêt — RDV à caler', canal: 'Téléphone', priorite: 'HAUTE',    agent: 'Edem Kpélim',  agence: 'Lomé Centre' },
  ],

  clients_inactifs_a_reactiver: [
    { client: 'Yawa Dossou',       derniere_activite: '23/11/2025', encours_passe: 800_000,   probabilite_reactivation: 68, canal_recommande: 'WhatsApp + visite' },
    { client: 'Komlan Attivor',    derniere_activite: '08/12/2025', encours_passe: 1_500_000, probabilite_reactivation: 74, canal_recommande: 'Téléphone' },
    { client: 'Elinam Afetogbo',   derniere_activite: '14/12/2025', encours_passe: 350_000,   probabilite_reactivation: 62, canal_recommande: 'WhatsApp' },
    { client: 'Mensah Folly',      derniere_activite: '04/01/2026', encours_passe: 1_200_000, probabilite_reactivation: 71, canal_recommande: 'Visite' },
    { client: 'Edem Bessan',       derniere_activite: '18/01/2026', encours_passe: 600_000,   probabilite_reactivation: 58, canal_recommande: 'WhatsApp' },
    { client: 'Adjoa Klutse',      derniere_activite: '02/02/2026', encours_passe: 950_000,   probabilite_reactivation: 79, canal_recommande: 'Téléphone + offre' },
  ],

  produits_top_ventes: PRODUITS_TOP_VENTES,
  evolution_acquisition_12_mois: EVOLUTION_ACQUISITION_12_MOIS,
}

// =============================================================================
//   12. RISQUE AVANCÉ — PAR granulaire + top clients + dossiers bloqués
// =============================================================================

export const RISQUE_AVANCE = {
  par_granulaire: buildParGranulaireReseau(),
  ...buildRisqueAvanceComplet(
    PORTEFEUILLE_AGING_RESEAU.find(t => t.tranche.includes('>90'))?.montant ?? 0,
  ),
  taux_provisionnement: 4.8,

  aging_detail: buildRisqueAgingDetail(),
}

// =============================================================================
//   13. CONTRÔLE INTERNE — Fraude, plafonds, dormants, modifications
// =============================================================================

export const CONTROLE_INTERNE = buildControleInterne()

export { buildControleInterne } from '@/lib/mock-controle-interne-registry'

// =============================================================================
//   14. TERRAIN TEMPS RÉEL — Géolocalisation agents + photos preuves
// =============================================================================

export interface AgentPosition {
  agent_id: string
  nom: string
  agence: string
  statut: 'EN_VISITE' | 'EN_DEPLACEMENT' | 'AU_BUREAU' | 'EN_PAUSE' | 'HORS_LIGNE'
  derniere_position: { lat: number; lng: number; lieu: string }
  derniere_action: string
  derniere_action_heure: string
  visites_jour: number
  visites_objectif: number
  collecte_jour: number
  collecte_objectif: number
  conformite_gps_pct: number
}

export const TERRAIN_REALTIME = {
  /** Responsables agence — pilotage guichet (pas de visite terrain) */
  responsables_agence: [
    { agent_id: 'RA-01', nom: 'Kofi Amavi', agence: 'Lomé Centre', statut: 'AU_BUREAU' as const, derniere_action: 'Point équipe — 2 commerciaux + 1 GP', derniere_action_heure: '11h00', equipe_terrain: 3, clients_agence: 300 },
    { agent_id: 'RA-02', nom: 'Akua Lawson', agence: 'Adidogomé', statut: 'AU_BUREAU' as const, derniere_action: 'Revue PAR agence — 3 dossiers groupe', derniere_action_heure: '10h30', equipe_terrain: 3, clients_agence: 150 },
    { agent_id: 'RA-03', nom: 'Edem Kpélim', agence: 'Bè Kpota', statut: 'AU_BUREAU' as const, derniere_action: 'Comité crise PAR 11,2 %', derniere_action_heure: '09h15', equipe_terrain: 3, clients_agence: 212 },
    { agent_id: 'RA-04', nom: 'Komi Atsu', agence: 'Hédzranawoé', statut: 'AU_BUREAU' as const, derniere_action: 'Coaching équipe commerciale', derniere_action_heure: '08h45', equipe_terrain: 3, clients_agence: 153 },
    { agent_id: 'RA-05', nom: 'Ama Fiagbé', agence: 'Kpalimé', statut: 'AU_BUREAU' as const, derniere_action: 'Validation décaissements — 3 dossiers', derniere_action_heure: '10h00', equipe_terrain: 3, clients_agence: 90 },
  ],

  agents_positions: [
    { agent_id: 'COM-01', nom: 'Yawo Adjavon', role: 'Commercial', agence: 'Lomé Centre', zone: 'Marché / Assigamé', statut: 'EN_VISITE', derniere_position: { lat: 6.1719, lng: 1.2110, lieu: 'Marché Assigamé' }, derniere_action: 'Visite client Akossiwa Mensah', derniere_action_heure: '11h42', visites_jour: 6, visites_objectif: 8, collecte_jour: 285_000, collecte_objectif: 350_000, conformite_gps_pct: 95, clients_portefeuille: 170 },
    { agent_id: 'COM-02', nom: 'Mensah Kodjo', role: 'Commercial', agence: 'Lomé Centre', zone: 'Tokoin / Adakpamé', statut: 'EN_DEPLACEMENT', derniere_position: { lat: 6.1420, lng: 1.2250, lieu: 'Tokoin — carrefour Hôpital' }, derniere_action: 'Trajet recouvrement Kwami Ekpé', derniere_action_heure: '11h54', visites_jour: 3, visites_objectif: 8, collecte_jour: 0, collecte_objectif: 200_000, conformite_gps_pct: 72, clients_portefeuille: 130 },
    { agent_id: 'GP-01', nom: 'Mawunya Kpodzo', role: 'GP', agence: 'Lomé Centre', zone: 'Guichet — suivi crédit', statut: 'AU_BUREAU', derniere_position: { lat: 6.1375, lng: 1.2123, lieu: 'Agence Lomé Centre' }, derniere_action: 'Relances WA — 4 échéances semaine', derniere_action_heure: '11h15', visites_jour: 2, visites_objectif: 4, collecte_jour: 130_000, collecte_objectif: 150_000, conformite_gps_pct: 98, clients_portefeuille: 300 },
    { agent_id: 'GP-02', nom: 'Sena Dossou', role: 'GP', agence: 'Adidogomé', zone: 'Marché Adidogomé', statut: 'EN_VISITE', derniere_position: { lat: 6.168, lng: 1.195, lieu: 'Marché Adidogomé' }, derniere_action: 'Visite recouvrement Folly Kpedzu', derniere_action_heure: '11h20', visites_jour: 11, visites_objectif: 12, collecte_jour: 220_000, collecte_objectif: 240_000, conformite_gps_pct: 90, clients_portefeuille: 150 },
    { agent_id: 'GP-03', nom: 'Kossi Adjavon', role: 'GP', agence: 'Bè Kpota', zone: 'Bè Kpota — terrain', statut: 'EN_VISITE', derniere_position: { lat: 6.152, lng: 1.250, lieu: 'Marché de Bè' }, derniere_action: 'Mission recouvrement P1 — Mawuli Atsu', derniere_action_heure: '11h08', visites_jour: 12, visites_objectif: 14, collecte_jour: 285_000, collecte_objectif: 320_000, conformite_gps_pct: 88, clients_portefeuille: 212 },
    { agent_id: 'COM-03', nom: 'Elom Komlavi', role: 'Commercial', agence: 'Hédzranawoé', zone: 'Hédzranawoé', statut: 'EN_VISITE', derniere_position: { lat: 6.148, lng: 1.178, lieu: 'Hédzranawoé centre' }, derniere_action: 'Visite agriculture DOS-0228', derniere_action_heure: '11h38', visites_jour: 10, visites_objectif: 10, collecte_jour: 195_000, collecte_objectif: 200_000, conformite_gps_pct: 96, clients_portefeuille: 93 },
    { agent_id: 'GP-04', nom: 'Akoue Yawa', role: 'GP', agence: 'Kpalimé', zone: 'Kpalimé Centre', statut: 'EN_DEPLACEMENT', derniere_position: { lat: 6.902, lng: 0.638, lieu: 'Kpalimé — marché' }, derniere_action: 'Relance échéance client agriculture', derniere_action_heure: '10h55', visites_jour: 9, visites_objectif: 10, collecte_jour: 165_000, collecte_objectif: 180_000, conformite_gps_pct: 92, clients_portefeuille: 90 },
    { agent_id: 'COM-04', nom: 'Enyonam Kpade', role: 'Commercial', agence: 'Adidogomé', zone: 'Marché Adidogomé', statut: 'EN_VISITE', derniere_position: { lat: 6.165, lng: 1.192, lieu: 'Marché Adidogomé' }, derniere_action: 'Prospection groupe commerce', derniere_action_heure: '11h05', visites_jour: 5, visites_objectif: 7, collecte_jour: 95_000, collecte_objectif: 120_000, conformite_gps_pct: 91, clients_portefeuille: 90 },
    { agent_id: 'COM-05', nom: 'Abla Tchalla', role: 'Commercial', agence: 'Adidogomé', zone: 'Gbossimé / Zongo', statut: 'EN_DEPLACEMENT', derniere_position: { lat: 6.158, lng: 1.188, lieu: 'Gbossimé' }, derniere_action: 'Visite nouvelle cliente', derniere_action_heure: '11h28', visites_jour: 4, visites_objectif: 6, collecte_jour: 65_000, collecte_objectif: 90_000, conformite_gps_pct: 88, clients_portefeuille: 60 },
    { agent_id: 'COM-06', nom: 'Afi Lawson', role: 'Commercial', agence: 'Bè Kpota', zone: 'Marché de Bè', statut: 'EN_VISITE', derniere_position: { lat: 6.125, lng: 1.248, lieu: 'Marché de Bè' }, derniere_action: 'Recouvrement client retard J+7', derniere_action_heure: '11h18', visites_jour: 5, visites_objectif: 7, collecte_jour: 155_000, collecte_objectif: 180_000, conformite_gps_pct: 86, clients_portefeuille: 120 },
    { agent_id: 'COM-07', nom: 'Kofi Senyo', role: 'Commercial', agence: 'Bè Kpota', zone: 'Agbalépédogan sud', statut: 'EN_VISITE', derniere_position: { lat: 6.118, lng: 1.252, lieu: 'Agbalépédogan' }, derniere_action: 'Visite terrain P1', derniere_action_heure: '11h32', visites_jour: 4, visites_objectif: 6, collecte_jour: 120_000, collecte_objectif: 150_000, conformite_gps_pct: 84, clients_portefeuille: 92 },
    { agent_id: 'COM-08', nom: 'Abla Kpodar', role: 'Commercial', agence: 'Hédzranawoé', zone: 'Agoè', statut: 'EN_DEPLACEMENT', derniere_position: { lat: 6.185, lng: 1.165, lieu: 'Agoè carrefour' }, derniere_action: 'Prospection agriculture', derniere_action_heure: '11h45', visites_jour: 4, visites_objectif: 5, collecte_jour: 85_000, collecte_objectif: 100_000, conformite_gps_pct: 92, clients_portefeuille: 60 },
    { agent_id: 'COM-09', nom: 'Selom Agbeko', role: 'Commercial', agence: 'Kpalimé', zone: 'Kpalimé Centre', statut: 'EN_VISITE', derniere_position: { lat: 6.901, lng: 0.639, lieu: 'Kpalimé marché' }, derniere_action: 'Visite client agriculture', derniere_action_heure: '10h50', visites_jour: 7, visites_objectif: 8, collecte_jour: 95_000, collecte_objectif: 110_000, conformite_gps_pct: 93, clients_portefeuille: 60 },
    { agent_id: 'COM-10', nom: 'Komla Adzro', role: 'Commercial', agence: 'Kpalimé', zone: 'Kpimé / Agomé', statut: 'EN_VISITE', derniere_position: { lat: 6.895, lng: 0.645, lieu: 'Kpimé' }, derniere_action: 'Prospection nouveaux leads', derniere_action_heure: '10h38', visites_jour: 3, visites_objectif: 4, collecte_jour: 55_000, collecte_objectif: 70_000, conformite_gps_pct: 94, clients_portefeuille: 30 },
  ] as Array<AgentPosition & { role?: string; zone?: string; clients_portefeuille?: number }>,

  stats_terrain_jour: {
    agents_actifs: 7,
    agents_hors_ligne: 0,
    responsables_pilotage: 5,
    visites_total_jour: 53,
    visites_objectif: 66,
    taux_realisation_pct: 80,
    collecte_jour: 1_280_000,
    collecte_objectif: 1_640_000,
    photos_uploadees: 22,
    photos_validees: 19,
    photos_a_valider: 3,
    clients_geolocalises: 462,
  },

  photos_recentes: [
    { id: 'PH-001', client: 'Akossiwa Mensah', agent: 'Yawo Adjavon', heure: '11h42', type: 'Visite activité', statut: 'VALIDEE', gps_ok: true, notes: 'Marché Grand Lomé — paiement Mixx By Yas' },
    { id: 'PH-002', client: 'Mawuli Atsu', agent: 'Kossi Adjavon', heure: '11h08', type: 'Recouvrement P1', statut: 'VALIDEE', gps_ok: true, notes: 'Mission conjointe ROC — Bè Kpota' },
    { id: 'PH-003', client: 'Kwami Ekpé', agent: 'Mensah Kodjo', heure: '10h54', type: 'Visite recouvrement', statut: 'A_VALIDER', gps_ok: true, notes: 'Tokoin — client absent' },
    { id: 'PH-004', client: 'Folly Kpedzu', agent: 'Sena Dossou', heure: '11h20', type: 'Visite recouvrement', statut: 'VALIDEE', gps_ok: true, notes: 'Promesse post-récolte juin' },
    { id: 'PH-005', client: 'Yawa Dossou', agent: 'Mawunya Kpodzo', heure: '09h22', type: 'Relance guichet', statut: 'VALIDEE', gps_ok: true, notes: 'Rappel échéance WA — message lu' },
    { id: 'PH-006', client: 'Folly Mensah', agent: 'Elom Komlavi', heure: '11h38', type: 'Visite agriculture', statut: 'VALIDEE', gps_ok: true, notes: 'DOS-0228 — conditions OK' },
  ],

  checkin_checkout: [
    { agent: 'Yawo Adjavon', role: 'Commercial', checkin: '07h42', checkout: null, agence_depart: 'Lomé Centre', km_estime: 18, zone: 'Marché / Assigamé' },
    { agent: 'Mensah Kodjo', role: 'Commercial', checkin: '08h15', checkout: null, agence_depart: 'Lomé Centre', km_estime: 14, zone: 'Tokoin / Adakpamé', anomalie: 'Couverture zone 42 % — 3 visites seulement' },
    { agent: 'Mawunya Kpodzo', role: 'GP', checkin: '08h00', checkout: null, agence_depart: 'Lomé Centre', km_estime: 4, zone: 'Guichet' },
    { agent: 'Sena Dossou', role: 'GP', checkin: '07h55', checkout: null, agence_depart: 'Adidogomé', km_estime: 16, zone: 'Marché Adidogomé' },
    { agent: 'Kossi Adjavon', role: 'GP', checkin: '07h30', checkout: null, agence_depart: 'Bè Kpota', km_estime: 22, zone: 'Bè Kpota', anomalie: 'GPS incohérent — 4 points hors zone mission' },
    { agent: 'Elom Komlavi', role: 'Commercial', checkin: '08h12', checkout: null, agence_depart: 'Hédzranawoé', km_estime: 12, zone: 'Hédzranawoé' },
    { agent: 'Akoue Yawa', role: 'GP', checkin: '07h38', checkout: null, agence_depart: 'Kpalimé', km_estime: 20, zone: 'Kpalimé Centre' },
  ] as Array<{ agent: string; role: string; checkin: string; checkout: string | null; agence_depart: string; km_estime: number; zone: string; anomalie?: string }>,
}

// =============================================================================
//   15. ANOMALIES DU JOUR — Top anomalies multi-domaines priorisées IA
// =============================================================================

export type { DomaineAnomalie, SeveriteAnomalie, Anomalie } from '@/lib/mock-controle-interne-registry'

export const ANOMALIES_JOUR = buildAnomaliesJour()

// =============================================================================
//   16. KPIs GLOBAUX DG — Vue exécutive 12 KPIs avec sparklines
// =============================================================================

/** Libellés des 6 derniers mois — dérivés de mock-time-series */
export { MOCK_MOIS_LABELS as SPARKLINE_MOIS_DG } from '@/lib/mock-time-series'

export type { KpiGlobalDG } from '@/lib/mock-reseau-kpis-builder'

export const KPIS_GLOBAUX_DG: KpiGlobalDG[] = buildKpisGlobauxDG()

// =============================================================================
//   17. PERFORMANCE OPÉRATIONNELLE — Tickets, temps moyens, incidents
//        (spécifique DOC / ROC)
// =============================================================================

export interface TicketIncident {
  id: string
  date: string
  type: 'BUG' | 'INCIDENT' | 'DEMANDE' | 'INCIDENT_SECURITE'
  priorite: 'P1' | 'P2' | 'P3' | 'P4'
  module: string
  description: string
  statut: 'NOUVEAU' | 'EN_COURS' | 'RESOLU' | 'BLOQUE'
  agent_concerne?: string
  agence?: string
  duree_traitement_h?: number
}

export const PERFORMANCE_OPERATIONNELLE = {
  temps_moyens_par_etape: [
    { etape: 'Saisie prospect',          temps_min: 12,  objectif_min: 10, statut: 'PROCHE' },
    { etape: 'Visite domicile',           temps_min: 65,  objectif_min: 60, statut: 'BON' },
    { etape: 'Vérif. documents',          temps_min: 38,  objectif_min: 30, statut: 'EN_ALERTE' },
    { etape: 'Analyse charge crédit',     temps_min: 180, objectif_min: 120, statut: 'EN_ALERTE' },
    { etape: 'Validation comité',         temps_min: 240, objectif_min: 180, statut: 'EN_ALERTE' },
    { etape: 'Décaissement',              temps_min: 45,  objectif_min: 30, statut: 'PROCHE' },
    { etape: 'Saisie remboursement',      temps_min: 4,   objectif_min: 3,  statut: 'PROCHE' },
    { etape: 'Validation tontinière',     temps_min: 22,  objectif_min: 15, statut: 'EN_ALERTE' },
  ],

  taux_erreur_operationnel_pct: 1.8,
  taux_erreur_evolution: [
    { mois: 'Déc 25', taux: 3.2 }, { mois: 'Jan 26', taux: 2.8 }, { mois: 'Fév 26', taux: 2.4 },
    { mois: 'Mar 26', taux: 2.1 }, { mois: 'Avr 26', taux: 1.9 }, { mois: 'Mai 26', taux: 1.8 },
  ],
  cible_taux_erreur_pct: 1.5,

  tickets_incidents: [
    { id: 'TKT-2401', date: '21/05 10:42', type: 'INCIDENT',    priorite: 'P1', module: 'Saisie crédit',        description: 'Erreur sauvegarde formulaire long',        statut: 'EN_COURS', agent_concerne: 'Akua Lawson', agence: 'Lomé Centre', duree_traitement_h: 1.5 },
    { id: 'TKT-2402', date: '21/05 09:18', type: 'BUG',         priorite: 'P2', module: 'Calendrier risque',    description: 'Mois VIGILANCE affichés deux fois',         statut: 'NOUVEAU',  duree_traitement_h: undefined },
    { id: 'TKT-2403', date: '20/05 16:30', type: 'INCIDENT_SECURITE', priorite: 'P1', module: 'GPS agent',      description: 'GPS spoofing détecté Edem Kpélim',           statut: 'BLOQUE',   agent_concerne: 'Edem Kpélim', agence: 'Lomé Centre' },
    { id: 'TKT-2404', date: '20/05 14:08', type: 'DEMANDE',     priorite: 'P3', module: 'Reporting',            description: 'Export PDF BCEAO en attente',                statut: 'EN_COURS', duree_traitement_h: 8 },
    { id: 'TKT-2405', date: '20/05 11:42', type: 'INCIDENT',    priorite: 'P2', module: 'Mobile Money',         description: 'Échecs MTN MoMo (durée 42 min)',             statut: 'RESOLU',   agence: 'Tabligbo',     duree_traitement_h: 0.7 },
    { id: 'TKT-2406', date: '19/05 18:12', type: 'BUG',         priorite: 'P3', module: 'Tableau aging',        description: 'Tranche 8-30j non triée',                    statut: 'RESOLU',                                                          duree_traitement_h: 4 },
    { id: 'TKT-2407', date: '19/05 09:54', type: 'DEMANDE',     priorite: 'P4', module: 'Permissions',          description: 'Ajout permission RA-Bè Kpota',               statut: 'RESOLU',                                                          duree_traitement_h: 2 },
  ] as TicketIncident[],

  tickets_stats: {
    total_ouverts: 4,
    P1_actifs: 1,
    P2_actifs: 1,
    P3_actifs: 1,
    P4_actifs: 0,
    temps_moyen_resolution_h: 6.2,
    objectif_resolution_h: 4,
    backlog_jours: 1.4,
  },

  disponibilite_systeme: {
    uptime_pct_mois: 99.4,
    uptime_pct_trimestre: 99.6,
    sla_objectif_pct: 99.5,
    derniere_panne_majeure: '14/05/2026 (MTN MoMo · 42 min)',
    incidents_mois: 4,
    mttr_h: 1.8, // mean time to recovery
    mtbf_j: 22,  // mean time between failures
  },

  evenements_systeme: [
    { date: '21/05 11:08', type: 'SUCCESS',  message: 'Sauvegarde quotidienne BDD réussie' },
    { date: '21/05 06:00', type: 'INFO',     message: 'Cron alertes préventives J+7 envoyé (2 GP notifiés)' },
    { date: '21/05 06:00', type: 'INFO',     message: 'Génération rapports IA (8 rôles) — 1.2s' },
    { date: '20/05 16:30', type: 'WARNING',  message: 'GPS spoofing détecté agent Edem Kpélim' },
    { date: '20/05 11:42', type: 'ERROR',    message: 'Panne MTN MoMo (42 min) — 6 transactions en échec' },
    { date: '20/05 11:42', type: 'SUCCESS',  message: 'Réconciliation MoMo automatique : 412 tx ok' },
    { date: '19/05 22:00', type: 'SUCCESS',  message: 'Calcul score CBI v5 portefeuille (1218 dossiers) — 4.1s' },
  ] as { date: string; type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'; message: string }[],
}

// =============================================================================
//   18. CASH PAR AGENCE — Tension liquidité opérationnelle
//        (spécifique DOC / ROC)
// =============================================================================

export interface CashAgence {
  agence_id: string
  agence_nom: string
  cash_disponible: number
  cash_minimum_requis: number
  cash_maximum_securise: number
  prevision_24h: number
  decaissements_prevus_jour: number
  niveau: 'CRITIQUE_BAS' | 'TENSION' | 'NORMAL' | 'EXCEDENT'
  action_recommandee?: string
}

export const CASH_PAR_AGENCE: CashAgence[] = buildCashParAgence()

export const CASH_GLOBAL = buildCashGlobal()

// =============================================================================
//   19. KPIs DASHBOARD ROC — Vue exécutive Crédit/Opérations
// =============================================================================

export const KPIS_ROC_TOP = buildKpisRocTop()

// =============================================================================
//   20. ANALYSE CHARGÉ DE CRÉDIT (CC) — Rapport CBI v5 par dossier
//        Conforme à FRONTEND_SPEC_RISQUE_CREDIT.md §4.1
// =============================================================================

export type ClasseBceao = 'PERFORMANT' | 'SOUS_SURVEILLANCE' | 'DOUTEUX' | 'COMPROMIS' | 'PERTE'
export type EtapeScore = 'SOUMIS' | 'DOSSIER_COMPLET' | 'EN_ANALYSE' | 'VALIDE_CHARGE' | 'EN_ANALYSE_ROC'
export type SeveriteAlerte = 'INFO' | 'WARN' | 'CRITICAL'

export type CodeAlerteCbi =
  | 'DEPOT_INHABITUEL' | 'GONFLEMENT_RECENT' | 'DEPOT_PRE_RDV_SUSPECT'
  | 'CAUTIONS_INSUFFISANTES' | 'CONCENTRATION_SECTORIELLE' | 'ENDETTEMENT_ELEVE'
  | 'TAUX_EFFORT_EXCESSIF' | 'COMPTE_TRANSIT'   | 'ECHANTILLON_BENCHMARK_FAIBLE'

// ALERTES_CBI_* exportés après DOSSIERS_ANALYSE_CC (compteurs dossiers inclus)

export interface AlerteActiveCC {
  code: CodeAlerteCbi
  severite: SeveriteAlerte
  message: string
  donnees?: Record<string, string | number>
}

export interface DimensionCBI {
  code: string                    // D1, D2, ..., D8
  nom: string
  score: number
  max: number
  pct: number
  active: boolean
  axe_5c: 'CHARACTER' | 'CAPACITY' | 'CAPITAL' | 'COLLATERAL' | 'CONDITIONS'
  justification: string
  sous_dimensions: { key: string; score: number; max: number; valeur?: string; justification: string }[]
}

export interface RapportCC {
  dossier_id: string
  reference_dossier: string
  client: { id: string; nom: string; prenom: string; telephone: string; secteur: string; activite: string; age: number; localite: string }
  montant_demande: number
  duree_mois: number
  objet_credit: string
  date_creation: string

  etape_courante: EtapeScore
  statut_dossier: string // 14 statuts internes
  score_consolide: number          // CBI + ajustement Prospera IA (0-100)
  score_cbi: number
  ajustement_prospera_ia: number        // -10..+10
  classe_bceao: ClasseBceao
  probabilite_defaut_pct: number

  evolution_score: { etape: EtapeScore; score_consolide: number; date: string }[]

  mapping_5c: {
    CHARACTER: number    // /35
    CAPACITY: number     // /15
    CAPITAL: number      // /25
    COLLATERAL: number   // /10
    CONDITIONS: number   // /15
  }

  detail_dimensions: DimensionCBI[]
  alertes_actives: AlerteActiveCC[]

  analyse_prospera_ia: {
    mode: 'PROSPERA_IA_API' | 'FALLBACK_LOCAL'
    commentaire: string
    questions_a_poser: string[]
    points_a_verifier: string[]
    decision_suggeree?: 'APPROUVER' | 'APPROUVER_REDUIT' | 'REFUSER' | 'DEMANDER_GARANTIES' | 'A_VOIR_ROC'
  }

  rappels_etape: string[]
  charge_credit: { nom: string; agence: string }
}

export const DOSSIERS_ANALYSE_CC: RapportCC[] = [
  {
    dossier_id: 'DOS-2026-0241',
    reference_dossier: 'DOS-2026-0241',
    client: { id: 'CL-1042', nom: 'Mensah', prenom: 'Akossiwa', telephone: '+228 90 12 34 56', secteur: 'Commerce', activite: 'Commerce fruits & légumes au marché de Lomé', age: 38, localite: 'Lomé Centre' },
    montant_demande: 500_000,
    duree_mois: 12,
    objet_credit: 'Achat stock fruits saisonniers — extension activité',
    date_creation: '18/05/2026',
    etape_courante: 'EN_ANALYSE',
    statut_dossier: 'EN_ANALYSE',
    score_consolide: 72,
    score_cbi: 70,
    ajustement_prospera_ia: 2,
    classe_bceao: 'SOUS_SURVEILLANCE',
    probabilite_defaut_pct: 12.4,
    evolution_score: [
      { etape: 'SOUMIS',          score_consolide: 58, date: '14/05/2026' },
      { etape: 'DOSSIER_COMPLET', score_consolide: 64, date: '16/05/2026' },
      { etape: 'EN_ANALYSE',      score_consolide: 72, date: '18/05/2026' },
    ],
    mapping_5c: { CHARACTER: 28, CAPACITY: 11, CAPITAL: 16, COLLATERAL: 8, CONDITIONS: 9 },
    detail_dimensions: [
      { code: 'D1', nom: 'Historique remboursement', score: 14, max: 15, pct: 93, active: true, axe_5c: 'CHARACTER', justification: 'Antécédent positif sur 2 crédits précédents — aucun défaut', sous_dimensions: [
        { key: 'cycles_anterieurs', score: 8,  max: 8,  valeur: '2 crédits clôturés',       justification: 'Tous remboursés à terme' },
        { key: 'incidents',         score: 6,  max: 7,  valeur: '0 incident',                justification: '1 retard < 7j pardonné' },
      ]},
      { code: 'D2', nom: 'Stabilité personnelle', score: 14, max: 20, pct: 70, active: true, axe_5c: 'CHARACTER', justification: 'Présence locale 15 ans, mariée, 3 enfants — stabilité forte mais activité saisonnière', sous_dimensions: [
        { key: 'anciennete_localite', score: 6, max: 8, valeur: '15 ans',  justification: 'Très ancien' },
        { key: 'situation_familiale', score: 8, max: 12, valeur: 'Mariée + 3 enfants', justification: 'Stable' },
      ]},
      { code: 'D3', nom: 'Capacité de remboursement', score: 11, max: 15, pct: 73, active: true, axe_5c: 'CAPACITY', justification: 'Revenus mensuels 1.5M FCFA, mensualité 46k — taux d\'effort 3.1%, confortable', sous_dimensions: [
        { key: 'revenus_mensuels', score: 7, max: 8,  valeur: '1 500 000 FCFA', justification: 'Activité quotidienne stable' },
        { key: 'taux_effort',      score: 4, max: 7,  valeur: '3.1%',           justification: 'Largement sous le seuil 33%' },
      ]},
      { code: 'D4', nom: 'Activité économique', score: 16, max: 25, pct: 64, active: true, axe_5c: 'CAPITAL', justification: 'Commerce saisonnier — bonne rentabilité mais sensible à la météo & concurrence', sous_dimensions: [
        { key: 'anciennete_activite', score: 6, max: 10, valeur: '8 ans',             justification: 'Solide' },
        { key: 'marge_brute',         score: 5, max: 8,  valeur: '~28%',              justification: 'Standard pour commerce de détail' },
        { key: 'saisonnalite',        score: 5, max: 7,  valeur: 'Forte saisonnalité', justification: 'Variabilité revenus' },
      ]},
      { code: 'D5', nom: 'Garanties & cautions', score: 8, max: 10, pct: 80, active: true, axe_5c: 'COLLATERAL', justification: 'Caution groupe femmes solidaire + dépôt 50k — couverture 70%', sous_dimensions: [
        { key: 'caution_solidaire', score: 5, max: 6, valeur: 'Groupe 5 femmes', justification: 'Solidarité forte' },
        { key: 'depot_garantie',    score: 3, max: 4, valeur: '50 000 FCFA',     justification: '10% du montant' },
      ]},
      { code: 'D6', nom: 'Visites terrain', score: 9, max: 12, pct: 75, active: true, axe_5c: 'CHARACTER', justification: '2 visites effectuées — domicile et étal vérifiés, stocks observés', sous_dimensions: [
        { key: 'domicile_visite', score: 5, max: 6, valeur: 'OK',                       justification: 'Maison familiale, électricité, eau' },
        { key: 'activite_visite', score: 4, max: 6, valeur: 'Étal présent au marché',   justification: 'Stocks moyens, peu de variété' },
      ]},
      { code: 'D7', nom: 'Avis CC', score: 0, max: 8, pct: 0, active: false, axe_5c: 'CHARACTER', justification: 'Étape non encore atteinte (VALIDE_CHARGE)', sous_dimensions: [] },
      { code: 'D8', nom: 'Validation ROC', score: 0, max: 5, pct: 0, active: false, axe_5c: 'CONDITIONS', justification: 'Étape non atteinte', sous_dimensions: [] },
    ],
    alertes_actives: [
      { code: 'CAUTIONS_INSUFFISANTES', severite: 'WARN', message: 'Couverture cautions 70% — sous le seuil recommandé 80%', donnees: { couverture_pct: 70, seuil: 80 } },
      { code: 'CONCENTRATION_SECTORIELLE', severite: 'INFO', message: 'Secteur Commerce = 37.7% portefeuille agence (Lomé Centre)', donnees: { pct_agence: 37.7 } },
    ],
    analyse_prospera_ia: {
      mode: 'PROSPERA_IA_API',
      commentaire: 'Dossier globalement sain. Cliente expérimentée, antécédents positifs, taux d\'effort très confortable. Deux points d\'attention : saisonnalité de l\'activité et garanties juste sous le seuil. Si la caution groupe est fiable, le risque reste maîtrisé.',
      questions_a_poser: [
        'Pouvez-vous préciser comment vous gérez la trésorerie pendant la basse saison (juillet-août) ?',
        'Le groupe de cautionnement a-t-il déjà fonctionné lors d\'un défaut ? Donnez un exemple.',
        'Quel pourcentage de vos clients sont des fidèles vs. occasionnels ?',
      ],
      points_a_verifier: [
        'Vérifier auprès du chef du marché l\'absence d\'arriérés de loyer d\'étal',
        'Croiser avec base BCEAO pour endettement externe',
        'Confirmer la solidarité du groupe (présence des 4 autres femmes à la signature)',
      ],
      decision_suggeree: 'APPROUVER_REDUIT',
    },
    rappels_etape: [
      'Demander caution complémentaire (objectif 80% de couverture)',
      'Approfondir l\'analyse saisonnière des revenus',
      'Transmettre avis favorable à ROC après vérifications',
    ],
    charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },

  {
    dossier_id: 'DOS-2026-0238',
    reference_dossier: 'DOS-2026-0238',
    client: { id: 'CL-998', nom: 'Attivor', prenom: 'Komlan', telephone: '+228 92 45 67 89', secteur: 'Transport', activite: 'Taxi-moto (zem) — quartier Bè', age: 29, localite: 'Bè Kpota' },
    montant_demande: 350_000,
    duree_mois: 9,
    objet_credit: 'Achat moto Honda CG125 — passage du moto loué au moto en propre',
    date_creation: '17/05/2026',
    etape_courante: 'DOSSIER_COMPLET',
    statut_dossier: 'DOCS_COMPLETS',
    score_consolide: 41,
    score_cbi: 44,
    ajustement_prospera_ia: -3,
    classe_bceao: 'DOUTEUX',
    probabilite_defaut_pct: 38.6,
    evolution_score: [
      { etape: 'SOUMIS',          score_consolide: 48, date: '15/05/2026' },
      { etape: 'DOSSIER_COMPLET', score_consolide: 41, date: '17/05/2026' },
    ],
    mapping_5c: { CHARACTER: 14, CAPACITY: 6, CAPITAL: 12, COLLATERAL: 4, CONDITIONS: 5 },
    detail_dimensions: [
      { code: 'D1', nom: 'Historique remboursement', score: 4, max: 15, pct: 27, active: true, axe_5c: 'CHARACTER', justification: '1er crédit — pas d\'historique IMF. Antécédent informel non vérifiable', sous_dimensions: [
        { key: 'cycles_anterieurs', score: 0, max: 8, valeur: 'Aucun', justification: 'Nouveau client' },
        { key: 'incidents',         score: 4, max: 7, valeur: 'N/A',   justification: 'Sans antécédent' },
      ]},
      { code: 'D2', nom: 'Stabilité personnelle', score: 10, max: 20, pct: 50, active: true, axe_5c: 'CHARACTER', justification: 'Jeune, célibataire, locataire récent — stabilité moyenne', sous_dimensions: [
        { key: 'anciennete_localite', score: 4, max: 8, valeur: '2 ans',  justification: 'Récent' },
        { key: 'situation_familiale', score: 6, max: 12, valeur: 'Célibataire', justification: 'Pas d\'attache familiale forte' },
      ]},
      { code: 'D3', nom: 'Capacité de remboursement', score: 6, max: 15, pct: 40, active: true, axe_5c: 'CAPACITY', justification: 'Revenus déclarés 220k/mois — mensualité 41k = 18.6% taux effort. OK mais revenus très volatils (saisonnalité, météo, demande)', sous_dimensions: [
        { key: 'revenus_mensuels', score: 4, max: 8, valeur: '220 000 FCFA', justification: 'Variable, météo-dépendant' },
        { key: 'taux_effort',      score: 2, max: 7, valeur: '18.6%',         justification: 'Marge faible en saison creuse' },
      ]},
      { code: 'D4', nom: 'Activité économique', score: 12, max: 25, pct: 48, active: true, axe_5c: 'CAPITAL', justification: 'Activité existante 3 ans avec moto louée — passage à la propriété techniquement viable', sous_dimensions: [
        { key: 'anciennete_activite', score: 6, max: 10, valeur: '3 ans',           justification: 'Établi' },
        { key: 'marge_brute',         score: 3, max: 8,  valeur: '~20%',           justification: 'Faible (location 1500/jour)' },
        { key: 'saisonnalite',        score: 3, max: 7,  valeur: 'Très saisonnier', justification: 'Pluies réduisent demande de 40%' },
      ]},
      { code: 'D5', nom: 'Garanties & cautions', score: 4, max: 10, pct: 40, active: true, axe_5c: 'COLLATERAL', justification: 'Pas de caution solidaire. Moto comme garantie mais valeur dégressive', sous_dimensions: [
        { key: 'caution_solidaire', score: 0, max: 6, valeur: 'Aucune',           justification: 'Refus du candidat' },
        { key: 'depot_garantie',    score: 4, max: 4, valeur: '35 000 FCFA',      justification: '10% montant — moto garantie' },
      ]},
      { code: 'D6', nom: 'Visites terrain', score: 5, max: 12, pct: 42, active: false, axe_5c: 'CHARACTER', justification: 'Visites prévues mais non encore réalisées', sous_dimensions: [] },
      { code: 'D7', nom: 'Avis CC', score: 0, max: 8, pct: 0, active: false, axe_5c: 'CHARACTER', justification: 'Étape non atteinte', sous_dimensions: [] },
      { code: 'D8', nom: 'Validation ROC', score: 0, max: 5, pct: 0, active: false, axe_5c: 'CONDITIONS', justification: 'Étape non atteinte', sous_dimensions: [] },
    ],
    alertes_actives: [
      { code: 'CAUTIONS_INSUFFISANTES',       severite: 'CRITICAL', message: 'Aucune caution solidaire — couverture garanties 35% (seuil 50%)', donnees: { couverture_pct: 35 } },
      { code: 'TAUX_EFFORT_EXCESSIF',         severite: 'WARN',     message: 'Taux d\'effort 18.6% acceptable mais marge faible en saison creuse',  donnees: { taux_effort: 18.6 } },
      { code: 'ECHANTILLON_BENCHMARK_FAIBLE', severite: 'INFO',     message: '3 dossiers comparables zem trouvés — scoring statistique limité',     donnees: { nb_dossiers: 3 } },
    ],
    analyse_prospera_ia: {
      mode: 'PROSPERA_IA_API',
      commentaire: 'Dossier risqué. Le profil (jeune zem, sans historique IMF, sans caution) cumule plusieurs facteurs de risque. La demande est cohérente avec l\'activité actuelle, mais la fragilité économique (revenus très volatils, saisonnalité forte) rend le remboursement incertain. Refus ou approbation très réduite avec garanties supplémentaires.',
      questions_a_poser: [
        'Pourquoi refusez-vous une caution solidaire (groupe d\'autres zems ou famille) ?',
        'Comment gérez-vous vos revenus pendant la saison des pluies (juin-septembre) ?',
        'Avez-vous une activité de remplacement en basse saison ?',
        'Quels sont vos frais d\'entretien moto mensuels (carburant, vidange, pneus) ?',
      ],
      points_a_verifier: [
        'Vérifier l\'authenticité du contrat de location moto actuel',
        'Contrôler les revenus déclarés via 30 jours de relevé MoMo',
        'Vérifier l\'existence d\'autres crédits informels (tontines, prêts familiaux)',
      ],
      decision_suggeree: 'DEMANDER_GARANTIES',
    },
    rappels_etape: [
      'Visites domicile + activité OBLIGATOIRES avant passage en EN_ANALYSE',
      'Demander caution familiale ou solidaire (au moins 2 cautionnaires)',
      'Réduire montant à 250k si pas de cautions complémentaires',
    ],
    charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },

  {
    dossier_id: 'DOS-2026-0235',
    reference_dossier: 'DOS-2026-0235',
    client: { id: 'CL-1108', nom: 'Hotor', prenom: 'Mawuena', telephone: '+228 96 78 90 12', secteur: 'Artisanat', activite: 'Couture & confection — atelier 2 machines', age: 42, localite: 'Tsévié' },
    montant_demande: 750_000,
    duree_mois: 18,
    objet_credit: 'Achat machine industrielle + stock tissu pour saison rentrée scolaire',
    date_creation: '10/05/2026',
    etape_courante: 'VALIDE_CHARGE',
    statut_dossier: 'VALIDE_CHARGE',
    score_consolide: 83,
    score_cbi: 80,
    ajustement_prospera_ia: 3,
    classe_bceao: 'PERFORMANT',
    probabilite_defaut_pct: 5.8,
    evolution_score: [
      { etape: 'SOUMIS',          score_consolide: 62, date: '04/05/2026' },
      { etape: 'DOSSIER_COMPLET', score_consolide: 68, date: '06/05/2026' },
      { etape: 'EN_ANALYSE',      score_consolide: 77, date: '08/05/2026' },
      { etape: 'VALIDE_CHARGE',   score_consolide: 83, date: '10/05/2026' },
    ],
    mapping_5c: { CHARACTER: 32, CAPACITY: 13, CAPITAL: 21, COLLATERAL: 9, CONDITIONS: 8 },
    detail_dimensions: [
      { code: 'D1', nom: 'Historique remboursement', score: 15, max: 15, pct: 100, active: true, axe_5c: 'CHARACTER', justification: '4 crédits remboursés à temps — historique exemplaire', sous_dimensions: [
        { key: 'cycles_anterieurs', score: 8, max: 8, valeur: '4 crédits clôturés', justification: 'Tous remboursés' },
        { key: 'incidents',         score: 7, max: 7, valeur: '0',                  justification: 'Aucun incident' },
      ]},
      { code: 'D2', nom: 'Stabilité personnelle', score: 17, max: 20, pct: 85, active: true, axe_5c: 'CHARACTER', justification: 'Mariée, 4 enfants, propriétaire atelier — très stable', sous_dimensions: [
        { key: 'anciennete_localite', score: 8, max: 8,  valeur: '20+ ans',       justification: 'Native' },
        { key: 'situation_familiale', score: 9, max: 12, valeur: 'Mariée + 4 enfants', justification: 'Forte stabilité' },
      ]},
      { code: 'D3', nom: 'Capacité de remboursement', score: 13, max: 15, pct: 87, active: true, axe_5c: 'CAPACITY', justification: 'Revenus 800k/mois, mensualité 46k = 5.8% taux effort. Très confortable', sous_dimensions: [
        { key: 'revenus_mensuels', score: 7, max: 8, valeur: '800 000 FCFA', justification: '2 employés' },
        { key: 'taux_effort',      score: 6, max: 7, valeur: '5.8%',          justification: 'Excellent' },
      ]},
      { code: 'D4', nom: 'Activité économique', score: 21, max: 25, pct: 84, active: true, axe_5c: 'CAPITAL', justification: 'Atelier établi 12 ans, clientèle fidèle, marge 35%', sous_dimensions: [
        { key: 'anciennete_activite', score: 9, max: 10, valeur: '12 ans',     justification: 'Très solide' },
        { key: 'marge_brute',         score: 7, max: 8,  valeur: '~35%',       justification: 'Élevée' },
        { key: 'saisonnalite',        score: 5, max: 7,  valeur: 'Modérée',    justification: 'Pic rentrée + fêtes' },
      ]},
      { code: 'D5', nom: 'Garanties & cautions', score: 9, max: 10, pct: 90, active: true, axe_5c: 'COLLATERAL', justification: '2 cautions solidaires fortes + dépôt 75k — couverture 95%', sous_dimensions: [
        { key: 'caution_solidaire', score: 6, max: 6, valeur: '2 commerçants', justification: 'Bons profils' },
        { key: 'depot_garantie',    score: 3, max: 4, valeur: '75 000 FCFA',   justification: '10% montant' },
      ]},
      { code: 'D6', nom: 'Visites terrain', score: 11, max: 12, pct: 92, active: true, axe_5c: 'CHARACTER', justification: 'Domicile + atelier vérifiés. Stocks observés, employés présents', sous_dimensions: [
        { key: 'domicile_visite', score: 6, max: 6, valeur: 'Propriétaire',         justification: 'Maison familiale' },
        { key: 'activite_visite', score: 5, max: 6, valeur: 'Atelier 2 machines',   justification: '2 employés, stocks corrects' },
      ]},
      { code: 'D7', nom: 'Avis CC', score: 8, max: 8, pct: 100, active: true, axe_5c: 'CHARACTER', justification: 'Avis CC très favorable — recommande approbation totale', sous_dimensions: [
        { key: 'avis_cc', score: 8, max: 8, valeur: 'FAVORABLE', justification: 'Note 9/10' },
      ]},
      { code: 'D8', nom: 'Validation ROC', score: 0, max: 5, pct: 0, active: false, axe_5c: 'CONDITIONS', justification: 'Étape en attente ROC', sous_dimensions: [] },
    ],
    alertes_actives: [],
    analyse_prospera_ia: {
      mode: 'PROSPERA_IA_API',
      commentaire: 'Excellent dossier. Cliente fidèle avec 4 crédits remboursés sans incident, activité solide depuis 12 ans, garanties suffisantes. Le projet d\'achat machine industrielle est cohérent avec la croissance de l\'atelier. Approbation totale recommandée. Considérer offrir des conditions favorables (taux réduit) pour fidéliser.',
      questions_a_poser: [
        'Le fournisseur de la machine industrielle est-il agréé ? Avez-vous un devis ?',
        'Comment comptez-vous gérer la formation de l\'opérateur sur la nouvelle machine ?',
      ],
      points_a_verifier: [
        'Vérifier le devis du fournisseur de la machine industrielle',
        'Confirmer la disponibilité du local pour la machine (espace + électricité 220V)',
      ],
      decision_suggeree: 'APPROUVER',
    },
    rappels_etape: [
      'Transmettre à ROC pour validation finale et décaissement',
      'Préparer le contrat avec conditions optimales (client fidèle)',
      'Programmer décaissement 750k sous 48h après approbation ROC',
    ],
    charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },

  {
    dossier_id: 'DOS-2026-0246',
    reference_dossier: 'DOS-2026-0246',
    client: { id: 'CL-1255', nom: 'Bessan', prenom: 'Edem', telephone: '+228 91 23 45 67', secteur: 'Services', activite: 'Salon de coiffure & cosmétiques', age: 26, localite: 'Lomé Centre' },
    montant_demande: 1_200_000,
    duree_mois: 24,
    objet_credit: 'Ouverture 2ème salon dans quartier Adidogomé',
    date_creation: '19/05/2026',
    etape_courante: 'SOUMIS',
    statut_dossier: 'SOUMIS',
    score_consolide: 35,
    score_cbi: 39,
    ajustement_prospera_ia: -4,
    classe_bceao: 'DOUTEUX',
    probabilite_defaut_pct: 51.2,
    evolution_score: [
      { etape: 'SOUMIS', score_consolide: 35, date: '19/05/2026' },
    ],
    mapping_5c: { CHARACTER: 11, CAPACITY: 4, CAPITAL: 13, COLLATERAL: 3, CONDITIONS: 4 },
    detail_dimensions: [
      { code: 'D1', nom: 'Historique remboursement', score: 3, max: 15, pct: 20, active: true, axe_5c: 'CHARACTER', justification: '1er crédit IMF. 1 retard signalé sur prêt familial (non vérifié)', sous_dimensions: [
        { key: 'cycles_anterieurs', score: 0, max: 8, valeur: 'Aucun', justification: 'Nouveau client' },
        { key: 'incidents',         score: 3, max: 7, valeur: '1 signalé informel',  justification: 'Source non fiable' },
      ]},
      { code: 'D2', nom: 'Stabilité personnelle', score: 8, max: 20, pct: 40, active: true, axe_5c: 'CHARACTER', justification: 'Jeune, célibataire, locataire 1 an — stabilité faible', sous_dimensions: [
        { key: 'anciennete_localite', score: 3, max: 8,  valeur: '1 an',         justification: 'Très récent' },
        { key: 'situation_familiale', score: 5, max: 12, valeur: 'Célibataire',  justification: 'Pas d\'attache' },
      ]},
      { code: 'D3', nom: 'Capacité de remboursement', score: 4, max: 15, pct: 27, active: true, axe_5c: 'CAPACITY', justification: 'Mensualité 58k sur revenus déclarés 180k = 32.2% taux effort — TRÈS limite', sous_dimensions: [
        { key: 'revenus_mensuels', score: 3, max: 8, valeur: '180 000 FCFA', justification: 'Salon 1 (existant)' },
        { key: 'taux_effort',      score: 1, max: 7, valeur: '32.2%',        justification: 'Quasi seuil limite' },
      ]},
      { code: 'D4', nom: 'Activité économique', score: 13, max: 25, pct: 52, active: true, axe_5c: 'CAPITAL', justification: 'Salon actuel 18 mois — pas assez d\'historique pour valider la duplication', sous_dimensions: [
        { key: 'anciennete_activite', score: 5, max: 10, valeur: '1.5 an',     justification: 'Récent' },
        { key: 'marge_brute',         score: 5, max: 8,  valeur: '~30%',        justification: 'OK secteur' },
        { key: 'saisonnalite',        score: 3, max: 7,  valeur: 'Modérée',    justification: 'Pic fêtes' },
      ]},
      { code: 'D5', nom: 'Garanties & cautions', score: 3, max: 10, pct: 30, active: true, axe_5c: 'COLLATERAL', justification: 'Aucune caution. Dépôt 120k. Pas d\'équipement en garantie', sous_dimensions: [
        { key: 'caution_solidaire', score: 0, max: 6, valeur: 'Aucune',         justification: 'Pas de cautionnaires' },
        { key: 'depot_garantie',    score: 3, max: 4, valeur: '120 000 FCFA',   justification: '10% du montant' },
      ]},
      { code: 'D6', nom: 'Visites terrain', score: 0, max: 12, pct: 0, active: false, axe_5c: 'CHARACTER', justification: 'Pas encore réalisées', sous_dimensions: [] },
      { code: 'D7', nom: 'Avis CC', score: 0, max: 8, pct: 0, active: false, axe_5c: 'CHARACTER', justification: 'Étape non atteinte', sous_dimensions: [] },
      { code: 'D8', nom: 'Validation ROC', score: 0, max: 5, pct: 0, active: false, axe_5c: 'CONDITIONS', justification: 'Étape non atteinte', sous_dimensions: [] },
    ],
    alertes_actives: [
      { code: 'TAUX_EFFORT_EXCESSIF',  severite: 'CRITICAL', message: 'Taux d\'effort 32.2% (seuil 33% = défaut élevé)',              donnees: { taux_effort: 32.2 } },
      { code: 'CAUTIONS_INSUFFISANTES', severite: 'CRITICAL', message: 'Aucune caution solidaire — garanties uniquement dépôt 10%',  donnees: { couverture_pct: 10 } },
      { code: 'ENDETTEMENT_ELEVE',     severite: 'WARN',     message: 'Signalé 1 retard prêt familial — endettement externe suspecté' },
      { code: 'DEPOT_PRE_RDV_SUSPECT', severite: 'CRITICAL', message: 'Dépôt 200k sur compte épargne 48h avant analyse — gonflement suspect', donnees: { dépôt_montant: 200_000, delai_h: 48 } },
    ],
    analyse_prospera_ia: {
      mode: 'PROSPERA_IA_API',
      commentaire: 'Dossier à refuser ou approuver très fortement réduit. Le profil cumule plusieurs signaux d\'alerte critiques : taux d\'effort limite, pas de cautions, dépôt suspect 48h avant RDV (probable manipulation pour gonfler le solde), endettement externe signalé. La duplication d\'un salon de 1.5 an d\'existence est prématurée. Recommandation : refus actuel + proposer un crédit plus petit pour consolider d\'abord le salon existant.',
      questions_a_poser: [
        'D\'où provient le dépôt récent de 200k sur votre compte épargne (48h avant ce RDV) ?',
        'Avez-vous des prêts en cours auprès de proches ou d\'autres IMF ? Soyez précis.',
        'Quel est votre business plan pour le 2ème salon (CA prévu, coûts opérationnels) ?',
        'Pourquoi ne pas attendre 6-12 mois supplémentaires pour valider la rentabilité du 1er salon ?',
      ],
      points_a_verifier: [
        'CRITIQUE : enquête sur l\'origine du dépôt suspect (témoin, justificatif)',
        'Vérifier auprès du voisinage la fréquentation réelle du salon actuel',
        'Croiser base BCEAO et IMF concurrentes pour endettement existant',
        'Visiter le local prévu pour le 2ème salon avant toute décision',
      ],
      decision_suggeree: 'REFUSER',
    },
    rappels_etape: [
      'BLOQUER le dossier en attente d\'enquête sur le dépôt suspect',
      'Si refus définitif : proposer alternative (crédit 300k pour équipement salon 1)',
      'Demander business plan détaillé si on poursuit',
    ],
    charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },

  {
    dossier_id: 'DOS-2026-0228',
    reference_dossier: 'DOS-2026-0228',
    client: { id: 'CL-787', nom: 'Folly', prenom: 'Mensah', telephone: '+228 90 56 78 90', secteur: 'Agriculture', activite: 'Maraîchage tomates & piments — 1.2 ha', age: 51, localite: 'Hédzranawoé' },
    montant_demande: 400_000,
    duree_mois: 8,
    objet_credit: 'Achat semences + engrais + petit matériel pour campagne saison sèche',
    date_creation: '12/05/2026',
    etape_courante: 'EN_ANALYSE_ROC',
    statut_dossier: 'EN_ANALYSE_ROC',
    score_consolide: 76,
    score_cbi: 75,
    ajustement_prospera_ia: 1,
    classe_bceao: 'PERFORMANT',
    probabilite_defaut_pct: 9.6,
    evolution_score: [
      { etape: 'SOUMIS',          score_consolide: 58, date: '06/05/2026' },
      { etape: 'DOSSIER_COMPLET', score_consolide: 64, date: '08/05/2026' },
      { etape: 'EN_ANALYSE',      score_consolide: 71, date: '10/05/2026' },
      { etape: 'VALIDE_CHARGE',   score_consolide: 74, date: '12/05/2026' },
      { etape: 'EN_ANALYSE_ROC',  score_consolide: 76, date: '12/05/2026' },
    ],
    mapping_5c: { CHARACTER: 30, CAPACITY: 12, CAPITAL: 19, COLLATERAL: 8, CONDITIONS: 7 },
    detail_dimensions: [
      { code: 'D1', nom: 'Historique remboursement', score: 13, max: 15, pct: 87, active: true, axe_5c: 'CHARACTER', justification: '3 crédits agricoles précédents tous remboursés', sous_dimensions: [
        { key: 'cycles_anterieurs', score: 8, max: 8, valeur: '3 crédits clôturés', justification: 'Tous OK' },
        { key: 'incidents',         score: 5, max: 7, valeur: '1 retard 14j',       justification: 'Saison pluies 2024' },
      ]},
      { code: 'D2', nom: 'Stabilité personnelle', score: 17, max: 20, pct: 85, active: true, axe_5c: 'CHARACTER', justification: 'Marié, 5 enfants, propriétaire terre — très stable', sous_dimensions: [
        { key: 'anciennete_localite', score: 8, max: 8, valeur: 'Natif',       justification: 'Stabilité maximale' },
        { key: 'situation_familiale', score: 9, max: 12, valeur: 'Marié + 5 enfants', justification: 'Forte stabilité' },
      ]},
      { code: 'D3', nom: 'Capacité de remboursement', score: 12, max: 15, pct: 80, active: true, axe_5c: 'CAPACITY', justification: 'Revenus saisonniers — recette 2.5M par campagne, mensualité 52k OK', sous_dimensions: [
        { key: 'revenus_mensuels', score: 6, max: 8, valeur: '~400k équivalent/mois', justification: 'Cycle agricole' },
        { key: 'taux_effort',      score: 6, max: 7, valeur: '13%',                    justification: 'Excellent' },
      ]},
      { code: 'D4', nom: 'Activité économique', score: 19, max: 25, pct: 76, active: true, axe_5c: 'CAPITAL', justification: '12 ans maraîchage, terre privée 1.2 ha, irrigation traditionnelle', sous_dimensions: [
        { key: 'anciennete_activite', score: 8, max: 10, valeur: '12 ans',           justification: 'Solide' },
        { key: 'marge_brute',         score: 6, max: 8,  valeur: '~40%',             justification: 'Maraîchage rentable' },
        { key: 'saisonnalite',        score: 5, max: 7,  valeur: '2 campagnes/an',   justification: 'Saison sèche + pluies' },
      ]},
      { code: 'D5', nom: 'Garanties & cautions', score: 8, max: 10, pct: 80, active: true, axe_5c: 'COLLATERAL', justification: 'Caution coopérative agricole + dépôt 40k', sous_dimensions: [
        { key: 'caution_solidaire', score: 5, max: 6, valeur: 'Coop agricole',    justification: 'Force de la coop' },
        { key: 'depot_garantie',    score: 3, max: 4, valeur: '40 000 FCFA',      justification: '10% montant' },
      ]},
      { code: 'D6', nom: 'Visites terrain', score: 10, max: 12, pct: 83, active: true, axe_5c: 'CHARACTER', justification: 'Terre visitée — 1.2 ha mesurés, irrigation observée', sous_dimensions: [
        { key: 'domicile_visite', score: 5, max: 6, valeur: 'Propriétaire',       justification: 'Concession familiale' },
        { key: 'activite_visite', score: 5, max: 6, valeur: 'Terre 1.2 ha vérifiée', justification: 'Bonne préparation' },
      ]},
      { code: 'D7', nom: 'Avis CC', score: 7, max: 8, pct: 88, active: true, axe_5c: 'CHARACTER', justification: 'Avis CC favorable. Recommande montant 400k pleine demande', sous_dimensions: [
        { key: 'avis_cc', score: 7, max: 8, valeur: 'FAVORABLE', justification: 'Note 8.5/10' },
      ]},
      { code: 'D8', nom: 'Validation ROC', score: 4, max: 5, pct: 80, active: true, axe_5c: 'CONDITIONS', justification: 'Analyse ROC en cours — recalcul + benchmark', sous_dimensions: [
        { key: 'benchmark', score: 4, max: 5, valeur: '12 dossiers comparables', justification: 'Échantillon suffisant' },
      ]},
    ],
    alertes_actives: [
      { code: 'CONCENTRATION_SECTORIELLE', severite: 'INFO', message: 'Agriculture = 13.6% portefeuille — concentration normale', donnees: { pct: 13.6 } },
    ],
    analyse_prospera_ia: {
      mode: 'PROSPERA_IA_API',
      commentaire: 'Très bon dossier agricole. Client expérimenté, terre privée, coopérative solide en caution, historique impeccable. La demande de 400k est cohérente avec les besoins de la campagne saison sèche. Approbation totale recommandée. Le ROC peut décaisser sans réserve.',
      questions_a_poser: [],
      points_a_verifier: [
        'Confirmer la date prévue de plantation pour caler les échéances',
        'Vérifier l\'engagement officiel de la coopérative agricole comme caution',
      ],
      decision_suggeree: 'A_VOIR_ROC',
    },
    rappels_etape: [
      'Dossier en attente ROC depuis 2j — décision attendue',
      'Calendrier échéances doit suivre le cycle agricole (différé partiel pendant croissance)',
      'Prévoir décaissement avant 25/05 pour début de campagne',
    ],
    charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
]

// Stats agrégées pour le workspace CC
export const CC_WORKSPACE_STATS = {
  total_dossiers: DOSSIERS_ANALYSE_CC.length,
  par_etape: {
    SOUMIS:           DOSSIERS_ANALYSE_CC.filter(d => d.etape_courante === 'SOUMIS').length,
    DOSSIER_COMPLET:  DOSSIERS_ANALYSE_CC.filter(d => d.etape_courante === 'DOSSIER_COMPLET').length,
    EN_ANALYSE:       DOSSIERS_ANALYSE_CC.filter(d => d.etape_courante === 'EN_ANALYSE').length,
    VALIDE_CHARGE:    DOSSIERS_ANALYSE_CC.filter(d => d.etape_courante === 'VALIDE_CHARGE').length,
    EN_ANALYSE_ROC:   DOSSIERS_ANALYSE_CC.filter(d => d.etape_courante === 'EN_ANALYSE_ROC').length,
  },
  par_classe: {
    PERFORMANT:        DOSSIERS_ANALYSE_CC.filter(d => d.classe_bceao === 'PERFORMANT').length,
    SOUS_SURVEILLANCE: DOSSIERS_ANALYSE_CC.filter(d => d.classe_bceao === 'SOUS_SURVEILLANCE').length,
    DOUTEUX:           DOSSIERS_ANALYSE_CC.filter(d => d.classe_bceao === 'DOUTEUX').length,
    COMPROMIS:         DOSSIERS_ANALYSE_CC.filter(d => d.classe_bceao === 'COMPROMIS').length,
    PERTE:             DOSSIERS_ANALYSE_CC.filter(d => d.classe_bceao === 'PERTE').length,
  },
  alertes_critiques: DOSSIERS_ANALYSE_CC.reduce((s, d) => s + d.alertes_actives.filter(a => a.severite === 'CRITICAL').length, 0),
  alertes_warn:      DOSSIERS_ANALYSE_CC.reduce((s, d) => s + d.alertes_actives.filter(a => a.severite === 'WARN').length, 0),
  montant_total_demande: DOSSIERS_ANALYSE_CC.reduce((s, d) => s + d.montant_demande, 0),
  score_moyen: Math.round(DOSSIERS_ANALYSE_CC.reduce((s, d) => s + d.score_consolide, 0) / DOSSIERS_ANALYSE_CC.length),
  delai_moyen_jours: 4.2,
}

const _DOSSIER_CBI_COUNTS = countDossierCbiAlerts(DOSSIERS_ANALYSE_CC)
export const ALERTES_CBI_9_CODES = buildAlertesCbi9Codes(_DOSSIER_CBI_COUNTS)
export const ALERTES_CBI_LABELS = buildAlertesCbiLabels(_DOSSIER_CBI_COUNTS) as Record<CodeAlerteCbi, { label: string; description: string; severite_defaut: SeveriteAlerte }>

const _CC_DOSSIERS_LIKE = DOSSIERS_ANALYSE_CC.map(mapRapportCcToDossierLike)
const _CC_DERIVED = buildCcHomeDerived(_CC_DOSSIERS_LIKE)
const _ROC_DERIVED = buildRocHomeDerived()
const _GP_DERIVED = buildGpHomeDerived()
const _GP_EXTRA = buildGpHomeExtra()
const _RA_DERIVED = buildRaHomeDerived('AG-001')
const _DAF_DERIVED = buildDafHomeDerived()
const _SYSCOHADA_COMPTA = buildComptabiliteSyscohadaImf()
const _TERRAIN_DERIVED = buildTerrainHomeDerived()
const _COMMUNICATION_DERIVED = buildCommunicationHomeDerived()
const _COMMERCIAL_DERIVED = buildCommercialHomeDerived()

// =============================================================================
//   21. DASHBOARD ACCUEIL ROC — Home /dashboard pour Responsable Op. Crédit
// =============================================================================

export interface DossierFileValidationROC {
  reference: string
  client: string
  activite: string
  agence: string
  montant_demande: number
  score_consolide: number
  classe_bceao: ClasseBceao
  pd_pct: number
  el_estimee: number
  avis_cc: 'FAVORABLE' | 'FAVORABLE_REDUIT' | 'DEFAVORABLE' | 'A_DEMANDER_GARANTIES'
  note_cc: number               // /10
  charge_credit: string
  alertes_critiques: number
  attente_h: number             // depuis combien d'heures en attente ROC
  suggestion_ia: 'APPROUVER' | 'APPROUVER_REDUIT' | 'REFUSER' | 'DEMANDER_GARANTIES'
}

export interface AlerteROC {
  id: string
  domaine: 'CREDIT' | 'OPERATIONNEL' | 'CASH' | 'FRAUDE' | 'SYSTEME'
  severite: 'CRITIQUE' | 'HAUTE' | 'MOYENNE'
  titre: string
  detail: string
  metric_actuelle?: string
  seuil?: string
  action: string
  cta_label?: string
  cta_target?: 'CREDIT_RISQUE' | 'CREDIT_WORKFLOW' | 'CREDIT_TRESORERIE' | 'CREDIT_CONTROLE'
}

const _ROC_DOSSIERS_BLOQUES = buildDossiersBloquesRoc()

export const MOCK_ROC_HOME = {
  // ── KPIs réseau compact (6) ───────────────────────────────────────────────
  kpis_reseau: buildKpisRocReseau(),

  file_validation: _ROC_DERIVED.file_validation as DossierFileValidationROC[],
  alertes_priorisees: _ROC_DERIVED.alertes_priorisees as AlerteROC[],
  heatmap_par_agences: _ROC_DERIVED.heatmap_par_agences,
  cash_synthese: _ROC_DERIVED.cash_synthese,
  recommandations_ia: _ROC_DERIVED.recommandations_ia,
  equipes: _ROC_DERIVED.equipes,
  activite_op: _ROC_DERIVED.activite_op,

    // ── KPIs additionnels (spec utilisateur) ──────────────────────────────────
  kpis_credit_etendus: buildRocKpisCreditEtendus(),

  kpis_operations: buildRocKpisOperationsFixed(),

  // ── Synthèse IA narrative ROC ─────────────────────────────────────────────
  synthese_ia_narrative: buildRocSyntheseNarrative(),

  // ── Pipeline des dossiers (5 étapes) ──────────────────────────────────────
  pipeline_dossiers: [
    { etape: 'Nouvelle demande', code: 'DEMANDE',      count: 18, montant_fcfa: 7_500_000, delta_jour: +2,  couleur: 'blue' },
    { etape: 'Analyse',          code: 'ANALYSE',      count: 12, montant_fcfa: 4_200_000, delta_jour: +1,  couleur: 'indigo' },
    { etape: 'Validation',       code: 'VALIDATION',   count: 4,  montant_fcfa: 3_350_000, delta_jour: -1,  couleur: 'orange' },
    { etape: 'Décaissement',     code: 'DECAISSEMENT', count: 6,  montant_fcfa: 2_100_000, delta_jour: +3,  couleur: 'teal' },
    { etape: 'Rejeté (7j)',      code: 'REJETE',       count: 9,  montant_fcfa: 3_600_000, delta_jour: 0,   couleur: 'slate' },
  ],

  // ── Évolution PAR 30j sur 12 semaines ─────────────────────────────────────
  evolution_par_30: buildRocEvolutionPar30(),

  // ── Top mauvais payeurs réseau ────────────────────────────────────────────
  top_mauvais_payeurs: buildRocTopMauvaisPayeurs(),

  // ── Recouvrement réseau du jour ───────────────────────────────────────────
  recouvrement_reseau: buildRocRecouvrementReseau(),

  // ── Vue terrain — Performance agents (table) ──────────────────────────────
  performance_agents: buildRocPerformanceAgents(),

  // ── Contrôle opérationnel quotidien ───────────────────────────────────────
  controle_quotidien: {
    transactions_echouees:  3,
    transactions_total:     247,
    operations_annulees:    2,
    dossiers_incomplets:    9,
    agences_offline:        0,
    agences_actives:        5,
    tickets_incidents_ouverts: 2,
    ticket_p1:              1,
    ticket_p2:              1,
    derniere_anomalie: { type: 'TRANSACTION_ECHOUEE', detail: 'Échec Mobile Money client #1247 — réessai automatique', heure: '14:32' },
  },

  // ── Dossiers bloqués > 48h (registre unifié mock-risque-registry) ────────
  dossiers_bloques: _ROC_DOSSIERS_BLOQUES,
}

// =============================================================================
//   22. DASHBOARD ACCUEIL CC — Home /dashboard pour Chargé de Crédit
// =============================================================================

export const MOCK_CC_HOME = {
  // Mes KPIs personnels
  mes_kpis: _CC_DERIVED.mes_kpis,

  // Productivité 7 jours
  productivite_7j: [
    { jour: 'L 19', traites: 3, approuves: 2, refuses: 1 },
    { jour: 'M 20', traites: 4, approuves: 3, refuses: 1 },
    { jour: 'M 21', traites: 2, approuves: 2, refuses: 0 },
    { jour: 'J 22', traites: 1, approuves: 0, refuses: 0 }, // demande de pièces
    { jour: 'V 23', traites: 0, approuves: 0, refuses: 0 }, // aujourd'hui en cours
    { jour: 'S 24', traites: 0, approuves: 0, refuses: 0 },
    { jour: 'D 25', traites: 0, approuves: 0, refuses: 0 },
  ],

  ma_file_aujourdhui: _CC_DERIVED.ma_file_aujourdhui,
  mes_alertes_cbi: _CC_DERIVED.mes_alertes_cbi,

  historique_decisions: [
    { date: '21/05', dossier: 'DOS-2026-0224', client: 'Sika Adjovi',        decision: 'APPROUVER',          montant: 350_000, score: 78, statut_post: 'EN_GESTION',      qualite: 'OK' },
    { date: '20/05', dossier: 'DOS-2026-0220', client: 'Komi Atsu',          decision: 'APPROUVER',          montant: 850_000, score: 71, statut_post: 'EN_ANALYSE_ROC', qualite: 'OK' },
    { date: '20/05', dossier: 'DOS-2026-0222', client: 'Mensah Folly',       decision: 'REFUSER',            montant: 400_000, score: 38, statut_post: 'REJETE',         qualite: 'OK' },
    { date: '19/05', dossier: 'DOS-2026-0218', client: 'Abla Fiagbedzi',     decision: 'APPROUVER_REDUIT',   montant: 300_000, score: 64, statut_post: 'EN_GESTION',     qualite: 'OK' },
    { date: '18/05', dossier: 'DOS-2026-0215', client: 'Togbui Apedo',       decision: 'DEMANDER_GARANTIES', montant: 600_000, score: 55, statut_post: 'EN_RETOUR',      qualite: 'OK' },
    { date: '15/05', dossier: 'DOS-2026-0210', client: 'Enyonam Kpade',      decision: 'APPROUVER',          montant: 250_000, score: 76, statut_post: 'RETARD',         qualite: 'ATTENTION' },
    { date: '12/05', dossier: 'DOS-2026-0205', client: 'Kwami Ekpé',         decision: 'APPROUVER',          montant: 500_000, score: 68, statut_post: 'EN_GESTION',     qualite: 'OK' },
  ],

  // Comparaison avec équipe CC (anonymisé)
  vs_equipe: _CC_DERIVED.vs_equipe,

  // Tendance qualité 6 mois (% de mes décisions qui restent saines)
  qualite_6_mois: _CC_DERIVED.qualite_6_mois,

  kpis_portefeuille_perso: _CC_DERIVED.kpis_portefeuille_perso,

  synthese_ia_journee: _CC_DERIVED.synthese_ia_journee,

  // ── Tâches du jour ────────────────────────────────────────────────────────
  taches_jour: {
    clients_a_visiter: [
      { id: 'CL-001', nom: 'M. Lawson Mawu',     adresse: 'Bè Kpota Rue 12',     statut: 'RETARD',          retard_j: 18, montant: 85_000,  risque: 'CRITIQUE', heure_prevue: '08:30', lat: 6.155, lng: 1.250 },
      { id: 'CL-002', nom: 'Mme Akakpo Yawa',    adresse: 'Adidogomé Marché',    statut: 'RETARD',          retard_j: 7,  montant: 45_000,  risque: 'HAUT',     heure_prevue: '09:30', lat: 6.165, lng: 1.190 },
      { id: 'CL-003', nom: 'M. Kouassi Edem',    adresse: 'Tokoin Hôpital',      statut: 'RETARD',          retard_j: 5,  montant: 32_000,  risque: 'HAUT',     heure_prevue: '10:30', lat: 6.140, lng: 1.220 },
      { id: 'CL-004', nom: 'Mme Mensah Adjoa',   adresse: 'Bè Kpota Église',     statut: 'PROMESSE',        retard_j: 3,  montant: 60_000,  risque: 'MOYEN',    heure_prevue: '11:30', lat: 6.158, lng: 1.255 },
      { id: 'CL-005', nom: 'M. Folly Kossi',     adresse: 'Adidogomé Carrefour', statut: 'NORMAL',          retard_j: 0,  montant: 25_000,  risque: 'FAIBLE',   heure_prevue: '14:00', lat: 6.168, lng: 1.195 },
      { id: 'CL-006', nom: 'Mme Sika Atsu',      adresse: 'Tokoin Pharmacie',    statut: 'NORMAL',          retard_j: 0,  montant: 18_000,  risque: 'FAIBLE',   heure_prevue: '14:45', lat: 6.142, lng: 1.225 },
      { id: 'CL-007', nom: 'M. Doheto Kwami',    adresse: 'Bè Kpota Sud',        statut: 'NORMAL',          retard_j: 0,  montant: 30_000,  risque: 'FAIBLE',   heure_prevue: '15:30', lat: 6.150, lng: 1.260 },
      { id: 'CL-008', nom: 'Mme Klutse Adjoa',   adresse: 'Adidogomé Goudron',   statut: 'INJOIGNABLE',     retard_j: 12, montant: 50_000,  risque: 'HAUT',     heure_prevue: '16:30', lat: 6.170, lng: 1.200 },
    ],
    rdv_programmes: [
      { heure: '08:30', client: 'M. Lawson Mawu',     type: 'Recouvrement urgent', lieu: 'Bè Kpota' },
      { heure: '11:30', client: 'Mme Mensah Adjoa',   type: 'Encaissement promesse', lieu: 'Bè Kpota' },
      { heure: '13:00', client: 'M. Apetey Kossi',    type: 'Signature dossier',     lieu: 'Agence' },
      { heure: '15:00', client: 'Mme Folly Akossiwa', type: 'Étude nouveau prêt',    lieu: 'Domicile' },
    ],
    dossiers_a_completer: [
      { reference: 'DOS-2026-0224', client: 'Apetey Kossi',   pieces_manquantes: ['Photo activité', 'Caution n°2'], delai_j: 2 },
      { reference: 'DOS-2026-0231', client: 'Folly Akossiwa', pieces_manquantes: ['Attestation domicile'],          delai_j: 4 },
    ],
    dossiers_a_relancer: [
      { reference: 'DOS-2026-0215', client: 'Togbui Apedo',   etape: 'EN_RETOUR',    relance_depuis_j: 5 },
      { reference: 'DOS-2026-0212', client: 'Dossou Yawo',    etape: 'EN_RETOUR',    relance_depuis_j: 8 },
    ],
    paiements_attendus_jour: [
      { client: 'M. Lawson Mawu',     montant: 85_000, retard_j: 18, probabilite_pct: 35 },
      { client: 'Mme Akakpo Yawa',    montant: 45_000, retard_j: 7,  probabilite_pct: 58 },
      { client: 'M. Kouassi Edem',    montant: 32_000, retard_j: 5,  probabilite_pct: 62 },
      { client: 'Mme Mensah Adjoa',   montant: 60_000, retard_j: 3,  probabilite_pct: 42 },
      { client: 'M. Folly Kossi',     montant: 25_000, retard_j: 0,  probabilite_pct: 88 },
      { client: 'Mme Sika Atsu',      montant: 18_000, retard_j: 0,  probabilite_pct: 92 },
      { client: 'M. Doheto Kwami',    montant: 30_000, retard_j: 0,  probabilite_pct: 85 },
      { client: 'Mme Klutse Adjoa',   montant: 50_000, retard_j: 12, probabilite_pct: 22 },
    ],
  },

  // ── Vue clients du portefeuille (table) ───────────────────────────────────
  portefeuille_clients: [
    { nom: 'M. Lawson Mawu',       statut: 'RETARD',        retard_j: 18, montant: 350_000, risque: 'CRITIQUE', zone: 'Bè Kpota',   score: 32, derniere_visite: 'il y a 12j' },
    { nom: 'Mme Klutse Adjoa',     statut: 'INJOIGNABLE',   retard_j: 12, montant: 220_000, risque: 'HAUT',     zone: 'Adidogomé',  score: 38, derniere_visite: 'il y a 14j' },
    { nom: 'Mme Akakpo Yawa',      statut: 'RETARD',        retard_j: 7,  montant: 180_000, risque: 'HAUT',     zone: 'Adidogomé',  score: 44, derniere_visite: 'il y a 5j' },
    { nom: 'M. Kouassi Edem',      statut: 'RETARD',        retard_j: 5,  montant: 145_000, risque: 'HAUT',     zone: 'Tokoin',     score: 48, derniere_visite: 'il y a 3j' },
    { nom: 'Mme Mensah Adjoa',     statut: 'PROMESSE',      retard_j: 3,  montant: 240_000, risque: 'MOYEN',    zone: 'Bè Kpota',   score: 52, derniere_visite: 'il y a 2j' },
    { nom: 'M. Folly Kossi',       statut: 'NORMAL',        retard_j: 0,  montant: 125_000, risque: 'FAIBLE',   zone: 'Adidogomé',  score: 74, derniere_visite: 'il y a 4j' },
    { nom: 'Mme Sika Atsu',        statut: 'NORMAL',        retard_j: 0,  montant: 95_000,  risque: 'FAIBLE',   zone: 'Tokoin',     score: 78, derniere_visite: 'il y a 7j' },
    { nom: 'M. Doheto Kwami',      statut: 'NORMAL',        retard_j: 0,  montant: 165_000, risque: 'FAIBLE',   zone: 'Bè Kpota',   score: 71, derniere_visite: 'il y a 6j' },
    { nom: 'M. Apetey Kossi',      statut: 'NOUVEAU',       retard_j: 0,  montant: 0,       risque: 'EVAL',     zone: 'Adidogomé',  score: 0,  derniere_visite: 'aucune' },
    { nom: 'Mme Folly Akossiwa',   statut: 'NOUVEAU',       retard_j: 0,  montant: 0,       risque: 'EVAL',     zone: 'Bè Kpota',   score: 0,  derniere_visite: 'aucune' },
  ],

  // ── Alertes clients (en plus des alertes CBI dossiers) ────────────────────
  alertes_clients: [
    { type: 'RETARD_IMMINENT',     client: 'Mme Adjoa Honoukpe', detail: 'Échéance dans 24h, paiement non sécurisé', risque: 'HAUT'     },
    { type: 'CLIENT_INJOIGNABLE',  client: 'Mme Klutse Adjoa',   detail: '5 tentatives WhatsApp + 3 appels en 7j',    risque: 'CRITIQUE' },
    { type: 'PAIEMENT_PARTIEL',    client: 'Mme Akakpo Yawa',    detail: 'A payé 15k/45k attendus le 21/05',           risque: 'MOYEN'    },
    { type: 'ACTIVITE_INHABITUELLE',client: 'M. Lawson Mawu',    detail: 'Aucun mouvement Mobile Money depuis 18j',    risque: 'HAUT'     },
    { type: 'RISQUE_DEFAUT',       client: 'M. Lawson Mawu',     detail: 'Modèle IA : probabilité défaut = 78%',       risque: 'CRITIQUE' },
  ],

  // ── Recouvrement personnel ────────────────────────────────────────────────
  recouvrement_perso: {
    objectif_jour_fcfa:       320_000,
    collecte_jour_fcfa:       185_000,
    taux_atteint_pct:         58,
    moyenne_hebdo_pct:        66,
    clients_en_retard_count:  7,
    clients_en_retard_montant: 1_252_000,
    promesses_paiement: [
      { client: 'Mme Mensah Adjoa', montant: 60_000, date_promesse: 'Aujourd\'hui 11:30', confiance_pct: 42 },
      { client: 'M. Apetey Kossi',  montant: 35_000, date_promesse: 'Demain 09:00',       confiance_pct: 75 },
      { client: 'Mme Dossou Yawo',  montant: 45_000, date_promesse: '26/05 14:00',         confiance_pct: 68 },
      { client: 'M. Mawu Folly',    montant: 28_000, date_promesse: '27/05 10:00',         confiance_pct: 58 },
    ],
  },

  // ── Itinéraire optimisé (mock - simulé par l'IA) ──────────────────────────
  itineraire_optimise: {
    distance_totale_km:     12.4,
    distance_economisee_km: 8.6,
    economie_pct:           25,
    duree_estimee_min:      210,
    ordre_visites: [
      { ordre: 1, client: 'M. Lawson Mawu',     zone: 'Bè Kpota',   distance_depuis_km: 0,    statut: 'PRIORITE' },
      { ordre: 2, client: 'Mme Mensah Adjoa',   zone: 'Bè Kpota',   distance_depuis_km: 0.4, statut: 'PROMESSE' },
      { ordre: 3, client: 'M. Doheto Kwami',    zone: 'Bè Kpota',   distance_depuis_km: 1.2, statut: 'NORMAL'   },
      { ordre: 4, client: 'Mme Akakpo Yawa',    zone: 'Adidogomé',  distance_depuis_km: 4.5, statut: 'PRIORITE' },
      { ordre: 5, client: 'M. Folly Kossi',     zone: 'Adidogomé',  distance_depuis_km: 0.8, statut: 'NORMAL'   },
      { ordre: 6, client: 'Mme Klutse Adjoa',   zone: 'Adidogomé',  distance_depuis_km: 1.1, statut: 'INJOIGN.' },
      { ordre: 7, client: 'M. Kouassi Edem',    zone: 'Tokoin',     distance_depuis_km: 3.2, statut: 'PRIORITE' },
      { ordre: 8, client: 'Mme Sika Atsu',      zone: 'Tokoin',     distance_depuis_km: 1.2, statut: 'NORMAL'   },
    ],
  },

  // ── Workflow personnel dossiers (5 étapes) ────────────────────────────────
  workflow_perso: [
    { etape: 'En préparation',         count: 3, delta_jour: +1 },
    { etape: 'Soumis',                 count: 5, delta_jour: 0  },
    { etape: 'En attente validation',  count: 2, delta_jour: -1 },
    { etape: 'Rejetés (30j)',          count: 4, delta_jour: 0  },
    { etape: 'Décaissement effectué',  count: 7, delta_jour: +2 },
  ],
}

// =============================================================================
//   23. DASHBOARD GP — Gestionnaire de Portefeuille
// =============================================================================

export const MOCK_GP_HOME = {
  synthese_ia_portefeuille: _GP_DERIVED.synthese_ia_portefeuille,
  kpis_portefeuille: _GP_DERIVED.kpis_portefeuille,
  kpis_qualite: _GP_DERIVED.kpis_qualite,
  activite_quotidienne: _GP_DERIVED.activite_quotidienne,
  vue_clients: _GP_DERIVED.vue_clients,

    // ── Aging portefeuille (Lomé Centre — 300 clients) ───────────────────────
  aging_portefeuille: _GP_EXTRA.aging_portefeuille,

  // ── Segmentation portefeuille ─────────────────────────────────────────────
  segmentation: _GP_EXTRA.segmentation,

  // ── Recouvrement personnel ────────────────────────────────────────────────
  recouvrement: _GP_EXTRA.recouvrement,

  // ── Activité terrain ──────────────────────────────────────────────────────
  activite_terrain: {
    visites_realisees_count: 5,
    visites_manquees_count:  2,
    visites_prevues_count:   12,
    temps_moyen_par_visite_min: 22,
    distance_parcourue_km:   8.4,
    derniere_visite: { client: 'M. Folly Kossi', heure: '10:45', resultat: 'PAIEMENT_OK', lat: 6.155, lng: 1.230 },
    geo_points: [
      { client: 'M. Agbodan Kossi',  lat: 6.158, lng: 1.250, statut: 'PREVUE',   resultat: null },
      { client: 'Mme Akakpo Yawa',   lat: 6.165, lng: 1.190, statut: 'PREVUE',   resultat: null },
      { client: 'M. Kouassi Edem',   lat: 6.140, lng: 1.220, statut: 'PREVUE',   resultat: null },
      { client: 'M. Folly Kossi',    lat: 6.155, lng: 1.230, statut: 'EFFECTUE', resultat: 'PAIEMENT_OK' },
      { client: 'Mme Sika Atsu',     lat: 6.142, lng: 1.225, statut: 'EFFECTUE', resultat: 'PAIEMENT_OK' },
      { client: 'M. Lawson Mawu',    lat: 6.150, lng: 1.260, statut: 'MANQUEE',  resultat: 'INJOIGNABLE' },
      { client: 'Mme Klutse Adjoa',  lat: 6.170, lng: 1.200, statut: 'EFFECTUE', resultat: 'PROMESSE' },
    ],
  },

  // ── Performance personnelle ───────────────────────────────────────────────
  performance: _GP_EXTRA.performance,

  // ── Productivité 30 jours (graphique) ─────────────────────────────────────
  productivite_30j: Array.from({ length: 30 }, (_, i) => {
    const day = i + 1
    const base = day <= 10 ? 180_000 : day <= 20 ? 240_000 : 280_000
    const noise = Math.sin(day * 0.7) * 60_000
    return {
      jour: `J${day}`,
      collecte: Math.max(0, Math.round(base + noise)),
      objectif: 300_000,
    }
  }),
}

// =============================================================================
//   24. DASHBOARD RESPONSABLE D'AGENCE — Pilotage agence complète
// =============================================================================

export const MOCK_RA_HOME = {
  synthese_ia_agence: _RA_DERIVED.synthese_ia_agence,
  kpis_activite: _RA_DERIVED.kpis_activite,
  kpis_credit: _RA_DERIVED.kpis_credit,
  kpis_commercial: _RA_DERIVED.kpis_commercial,
  equipe: _RA_DERIVED.equipe,
  tresorerie: {
    ..._RA_DERIVED.tresorerie,
    prevision_48h: [
      { jour: "Aujourd'hui", entrees: _RA_DERIVED.tresorerie.entrees_jour, sorties: _RA_DERIVED.tresorerie.sorties_jour, solde_fin: _RA_DERIVED.tresorerie.solde_caisse + _RA_DERIVED.tresorerie.flux_net_jour },
      { jour: 'Demain', entrees: Math.round(_RA_DERIVED.tresorerie.entrees_jour * 1.1), sorties: Math.round(_RA_DERIVED.tresorerie.sorties_jour * 1.2), solde_fin: _RA_DERIVED.tresorerie.solde_caisse },
      { jour: 'Après-demain', entrees: Math.round(_RA_DERIVED.tresorerie.entrees_jour * 1.05), sorties: Math.round(_RA_DERIVED.tresorerie.sorties_jour * 1.4), solde_fin: Math.round(_RA_DERIVED.tresorerie.solde_caisse * 0.95) },
    ],
    transferts_recommandes: [
      { type: 'RENFORCEMENT', montant: Math.round(_RA_DERIVED.tresorerie.seuil_minimum_fcfa * 0.3), justification: 'Pic décaissement prévu vendredi', delai: '48h' },
    ],
  },

    // ── Opérations agence ─────────────────────────────────────────────────────
  operations: {
    operations_en_attente:    8,
    transactions_echouees:    2,
    transactions_total:       64,
    temps_moyen_traitement_min: 12,
    incidents_operationnels:  1,
    tickets_support:          2,
    derniere_anomalie: { type: 'TRANSACTION_BLOQUEE', detail: 'Décaissement #4521 — vérification Mobile Money en cours', heure: '14:38' },
  },

  // ── Risque agence ─────────────────────────────────────────────────────────
  risque: {
    clients_a_risque_count: 12,
    clients_a_risque_montant: 1_800_000,
    gros_impayes_count: 3,
    gros_impayes_montant: 920_000,
    fraudes_potentielles: 1,
    anomalies_transactions: 2,
    credits_sensibles: 8,
    alertes_critiques: [
      { titre: 'PAR PME en hausse',        detail: 'PAR 30 du portefeuille PME est passé de 6.2% à 8.4% en 2 semaines.',  severite: 'HAUTE'    },
      { titre: 'Client M. Agbodan défaut', detail: 'Probabilité de défaut modèle IA = 78%. Encours 320k FCFA.',             severite: 'CRITIQUE' },
      { titre: 'Tentative fraude Mobile',  detail: 'Compte #4521 : tentative décaissement double détectée à 14:32.',         severite: 'CRITIQUE' },
      { titre: 'Concentration zone Est',   detail: 'Augmentation impayés +18% zone Est sur 7 derniers jours.',               severite: 'HAUTE'    },
    ],
  },

  // ── Satisfaction client ───────────────────────────────────────────────────
  satisfaction: {
    nb_plaintes_mois:           6,
    nb_plaintes_resolues:       4,
    temps_resolution_moyen_h:   18,
    score_satisfaction:         4.2,    // sur 5
    score_evolution:            +0.1,
    clients_inactifs_count:     34,
    taux_fidelisation_pct:      87,
    derniere_plainte: { client: 'Mme Dossou Yawo', sujet: 'Délai décaissement long', statut: 'EN_COURS', heure: 'hier 16:20' },
    repartition_plaintes: [
      { categorie: 'Délai',         count: 2 },
      { categorie: 'Tarification',  count: 1 },
      { categorie: 'Service',       count: 2 },
      { categorie: 'Mobile Money',  count: 1 },
    ],
  },
}

// =============================================================================
//   25. DASHBOARD TERRAIN — Agent Terrain & Collectrice de Tontine
// =============================================================================

export const MOCK_TERRAIN_HOME = {
  synthese_ia_journee: _TERRAIN_DERIVED.synthese_ia_journee,
  resume_journee: _TERRAIN_DERIVED.resume_journee,

  // ── Planning intelligent journée ──────────────────────────────────────────
  planning_jour: [
    { heure: '08:30', cliente: 'Mme Akossiwa Lawson',  action: 'Collecte tontine groupe Bè',  priorite: 'HAUTE',    type: 'TONTINE',      lat: 6.156, lng: 1.250, statut: 'A_VENIR' },
    { heure: '09:15', cliente: 'M. Agbeko Kossi',      action: 'Recouvrement (18j retard)',   priorite: 'CRITIQUE', type: 'RECOUVREMENT', lat: 6.158, lng: 1.255, statut: 'A_VENIR' },
    { heure: '10:00', cliente: 'Boutique Hounyo',      action: 'Prospection nouvelle cliente',priorite: 'MOYENNE',  type: 'PROSPECTION',  lat: 6.165, lng: 1.260, statut: 'A_VENIR' },
    { heure: '10:45', cliente: 'Mme Mensah Adjoa',     action: 'Encaissement promesse 60k',   priorite: 'HAUTE',    type: 'PROMESSE',     lat: 6.155, lng: 1.245, statut: 'A_VENIR' },
    { heure: '11:30', cliente: 'Mme Akakpo Yawa',      action: 'Recouvrement (12j retard)',   priorite: 'HAUTE',    type: 'RECOUVREMENT', lat: 6.165, lng: 1.190, statut: 'A_VENIR' },
    { heure: '12:15', cliente: 'Groupe Tontine Adidogomé', action: 'Collecte semaine',         priorite: 'HAUTE',    type: 'TONTINE',      lat: 6.170, lng: 1.195, statut: 'A_VENIR' },
    { heure: '14:00', cliente: 'Atelier Edem',         action: 'Signature dossier crédit',    priorite: 'HAUTE',    type: 'DOSSIER',      lat: 6.140, lng: 1.220, statut: 'A_VENIR' },
    { heure: '15:00', cliente: 'M. Folly Kossi',       action: 'Visite suivi mensuel',        priorite: 'NORMALE',  type: 'VISITE',       lat: 6.142, lng: 1.225, statut: 'A_VENIR' },
    { heure: '16:00', cliente: 'Mme Sika Atsu',        action: 'Encaissement régulier',       priorite: 'NORMALE',  type: 'COLLECTE',     lat: 6.144, lng: 1.228, statut: 'A_VENIR' },
  ],

  tontines: {
    ..._TERRAIN_DERIVED.tontines,
    groupes: [
      { nom: 'Groupe Bè Solidaire',     membres: 12, collecte_jour: 36_000, montant_prevu: 36_000, retard_membres: 0, taux_pct: 100, statut: 'BON' },
      { nom: 'Groupe Adidogomé',        membres: 10, collecte_jour: 25_000, montant_prevu: 30_000, retard_membres: 2, taux_pct: 83,  statut: 'NORMAL' },
      { nom: 'Tontine Marché Tokoin',   membres: 15, collecte_jour: 30_000, montant_prevu: 45_000, retard_membres: 4, taux_pct: 67,  statut: 'TENSION' },
      { nom: 'Groupe Femmes Vogan',     membres: 8,  collecte_jour: 14_000, montant_prevu: 24_000, retard_membres: 3, taux_pct: 58,  statut: 'DEGRADE' },
      { nom: 'Tontine Restau Hédzranawoé', membres: 6, collecte_jour: 0,    montant_prevu: 18_000, retard_membres: 6, taux_pct: 0,  statut: 'CRITIQUE' },
      { nom: 'Groupe Sotraco',          membres: 9,  collecte_jour: 0,     montant_prevu: 27_000, retard_membres: 0, taux_pct: 0,   statut: 'PROGRAMME' },
    ],

    alertes_tontine: [
      { type: 'CLIENTE_ABSENTE',    cliente: 'Mme Akossiwa Lawson',  detail: 'Absente aux 2 dernières collectes — risque abandon groupe Bè',    severite: 'CRITIQUE' },
      { type: 'BAISSE_COTISATION',  cliente: 'Mme Atsu Folly',       detail: 'Cotisation -40% sur les 4 dernières séances (groupe Adidogomé)',  severite: 'HAUTE'    },
      { type: 'RISQUE_ABANDON',     cliente: 'Mme Hounyo Adjoa',     detail: 'Pattern : 3 absences sur 6 dernières séances tontine Tokoin',     severite: 'HAUTE'    },
      { type: 'RETARD_REPETE',      cliente: 'Mme Dossou Yawo',      detail: 'Toujours en retard depuis 3 mois sur le groupe Vogan',            severite: 'MOYENNE'  },
    ],
  },

  recouvrement: _TERRAIN_DERIVED.recouvrement,

  // ── Prospection ──────────────────────────────────────────────────────────
  prospection: {
    nouveaux_prospects_mois:   12,
    rdv_commerciaux_jour:      6,
    taux_conversion_pct:       34,
    dossiers_ouverts_mois:     4,
    prospects_chauds:          3,

    prospects: [
      { prospect: 'Boutique Hounyo',     activite: 'Commerce tissus',      potentiel_fcfa: 600_000,  statut: 'CHAUD',   probabilite_pct: 78, derniere_interaction: 'il y a 2j' },
      { prospect: 'Atelier Edem',        activite: 'Menuiserie',           potentiel_fcfa: 850_000,  statut: 'CHAUD',   probabilite_pct: 72, derniere_interaction: 'il y a 1j' },
      { prospect: 'Restaurant Aklala',   activite: 'Restauration',         potentiel_fcfa: 400_000,  statut: 'TIEDE',   probabilite_pct: 54, derniere_interaction: 'il y a 5j' },
      { prospect: 'Mme Fovi Cosmétiques',activite: 'Vente cosmétiques',    potentiel_fcfa: 250_000,  statut: 'TIEDE',   probabilite_pct: 48, derniere_interaction: 'il y a 4j' },
      { prospect: 'M. Kpalimé Bétail',   activite: 'Élevage volaille',     potentiel_fcfa: 700_000,  statut: 'CHAUD',   probabilite_pct: 65, derniere_interaction: 'hier' },
      { prospect: 'Salon Beauté Sika',   activite: 'Salon coiffure',       potentiel_fcfa: 180_000,  statut: 'FROID',   probabilite_pct: 28, derniere_interaction: 'il y a 12j' },
    ],

    zones_potentiel: [
      { zone: 'Marché de Bè',          potentiel_pct: 88, raison: '5 boutiques sans crédit + zone à fort trafic',     boutiques_eligibles: 5 },
      { zone: 'Adidogomé Carrefour',   potentiel_pct: 75, raison: '3 ateliers identifiés + concentration commerce',   boutiques_eligibles: 3 },
      { zone: 'Hédzranawoé Marché',    potentiel_pct: 62, raison: '2 prospects relancés + zone agricole proche',      boutiques_eligibles: 2 },
      { zone: 'Tokoin Hôpital',        potentiel_pct: 45, raison: 'Saturé concurrentiel — opportunités limitées',     boutiques_eligibles: 1 },
    ],
  },

  // ── Portefeuille personnel ───────────────────────────────────────────────
  portefeuille: {
    total_clientes:     42,
    bonnes_payeuses:    28,
    clientes_sensibles: 7,
    clientes_a_risque:  4,
    clientes_vip:       2,
    clientes_inactives: 1,

    mes_clientes: [
      { cliente: 'Mme Tetevi Akossiwa', produit: 'Crédit PME',         encours: 540_000, dernier_paiement: 'il y a 3j',  risque: 'FAIBLE',  segment: 'VIP' },
      { cliente: 'Mme Edem Mensah',     produit: 'Crédit Agricole',    encours: 320_000, dernier_paiement: 'il y a 7j',  risque: 'FAIBLE',  segment: 'BONNE' },
      { cliente: 'Mme Akakpo Yawa',     produit: 'Crédit Commerce',    encours: 180_000, dernier_paiement: 'il y a 14j', risque: 'HAUT',    segment: 'RISQUE' },
      { cliente: 'Mme Mensah Adjoa',    produit: 'Tontine',            encours: 95_000,  dernier_paiement: 'il y a 2j',  risque: 'MOYEN',   segment: 'SENSIBLE' },
      { cliente: 'Mme Sika Atsu',       produit: 'Crédit Coiffure',    encours: 75_000,  dernier_paiement: 'il y a 1j',  risque: 'FAIBLE',  segment: 'BONNE' },
      { cliente: 'M. Folly Kossi',      produit: 'Crédit Agriculture', encours: 125_000, dernier_paiement: 'il y a 4j',  risque: 'FAIBLE',  segment: 'BONNE' },
      { cliente: 'Mme Klutse Adjoa',    produit: 'Crédit Commerce',    encours: 220_000, dernier_paiement: 'il y a 14j', risque: 'HAUT',    segment: 'RISQUE' },
      { cliente: 'M. Apetey Kossi',     produit: 'Crédit Transport',   encours: 380_000, dernier_paiement: 'il y a 35j', risque: 'CRITIQUE',segment: 'RISQUE' },
      { cliente: 'Mme Dossou Yawo',     produit: 'Tontine',            encours: 45_000,  dernier_paiement: 'il y a 8j',  risque: 'MOYEN',   segment: 'SENSIBLE' },
      { cliente: 'Mme Hounyo Adjoa',    produit: 'Crédit Commerce',    encours: 280_000, dernier_paiement: 'il y a 22j', risque: 'CRITIQUE',segment: 'RISQUE' },
    ],
  },

  // ── Performance personnelle ──────────────────────────────────────────────
  performance: {
    objectif_collecte_mois:      4_500_000,
    realise_collecte_mois:       3_245_000,
    taux_atteinte_collecte_pct:  72,
    objectif_prospection_mois:   15,
    realise_prospection_mois:    12,
    objectif_recouvrement_mois:  1_200_000,
    realise_recouvrement_mois:   985_000,
    taux_global_pct:             76,
    visites_realisees_mois:      168,
    visites_objectif_mois:       200,
    classement_agence:           3,    // sur 14 agents
    classement_evolution:        +2,
    badge:                       'ARGENT' as 'OR' | 'ARGENT' | 'BRONZE',

    evolution_hebdo: [
      { sem: 'S15', collecte: 720_000, recouvrement: 180_000 },
      { sem: 'S16', collecte: 840_000, recouvrement: 220_000 },
      { sem: 'S17', collecte: 780_000, recouvrement: 245_000 },
      { sem: 'S18', collecte: 905_000, recouvrement: 340_000 },
    ],

    vs_equipe: {
      mes_collectes_pct:   72,   // % atteinte
      equipe_collectes_pct:65,
      mes_recouv_pct:      82,
      equipe_recouv_pct:   71,
      mes_prospects:       12,
      equipe_prospects_moy:9,
    },
  },

  // ── GPS / Carte intelligente ─────────────────────────────────────────────
  gps: {
    distance_totale_jour_km:    12.4,
    distance_optimisee_km:      10.2,
    economie_km:                4.2,
    economie_pct:               18,
    temps_estime_min:           240,
    temps_economise_min:        45,
    derniere_position: { lat: 6.155, lng: 1.230, lieu: 'Bè Kpota', heure: '07:55' },
    geo_points: [
      { ordre: 1, cliente: 'Mme Akossiwa Lawson',  lat: 6.156, lng: 1.250, statut: 'A_VENIR',  type: 'TONTINE',      heure: '08:30' },
      { ordre: 2, cliente: 'M. Agbeko Kossi',      lat: 6.158, lng: 1.255, statut: 'A_VENIR',  type: 'RECOUVREMENT', heure: '09:15' },
      { ordre: 3, cliente: 'Boutique Hounyo',      lat: 6.165, lng: 1.260, statut: 'A_VENIR',  type: 'PROSPECTION',  heure: '10:00' },
      { ordre: 4, cliente: 'Mme Mensah Adjoa',     lat: 6.155, lng: 1.245, statut: 'A_VENIR',  type: 'PROMESSE',     heure: '10:45' },
      { ordre: 5, cliente: 'Mme Akakpo Yawa',      lat: 6.165, lng: 1.190, statut: 'A_VENIR',  type: 'RECOUVREMENT', heure: '11:30' },
      { ordre: 6, cliente: 'Groupe Adidogomé',     lat: 6.170, lng: 1.195, statut: 'A_VENIR',  type: 'TONTINE',      heure: '12:15' },
      { ordre: 7, cliente: 'Atelier Edem',         lat: 6.140, lng: 1.220, statut: 'A_VENIR',  type: 'DOSSIER',      heure: '14:00' },
      { ordre: 8, cliente: 'M. Folly Kossi',       lat: 6.142, lng: 1.225, statut: 'A_VENIR',  type: 'VISITE',       heure: '15:00' },
      { ordre: 9, cliente: 'Mme Sika Atsu',        lat: 6.144, lng: 1.228, statut: 'A_VENIR',  type: 'COLLECTE',     heure: '16:00' },
    ],
    zones_risque_securite: ['Akodessewa marché soir', 'Aného route sud après 18h'],
  },

  // ── Alertes intelligentes (4 catégories) ────────────────────────────────
  alertes_intelligentes: [
    { categorie: 'RECOUVREMENT', titre: 'M. Agbeko à 18 jours de retard',                detail: 'Solvabilité historique forte, action immédiate recommandée', severite: 'CRITIQUE', action: 'Visite ferme matin' },
    { categorie: 'RECOUVREMENT', titre: 'Promesse Mme Mensah expire à 16h',              detail: '60k FCFA promis aujourd\'hui — confirmer encaissement',      severite: 'HAUTE',    action: 'Visite confirmation' },
    { categorie: 'TONTINE',      titre: 'Mme Akossiwa absente 2 réunions consécutives', detail: 'Risque abandon groupe Bè — entretien individuel requis',    severite: 'CRITIQUE', action: 'Visite domicile' },
    { categorie: 'TONTINE',      titre: 'Baisse cotisation Mme Atsu (-40%)',             detail: '4 dernières séances à 6k au lieu de 10k',                    severite: 'HAUTE',    action: 'Discussion personnelle' },
    { categorie: 'PROSPECTION',  titre: 'Boutique Hounyo : pas de relance depuis 5j',    detail: 'Prospect chaud probabilité 78% — risque refroidissement',    severite: 'HAUTE',    action: 'Visite aujourd\'hui' },
    { categorie: 'PROSPECTION',  titre: 'Atelier Edem signe demain',                     detail: 'Préparer contrat + cautions à apporter',                     severite: 'MOYENNE',  action: 'Préparer dossier' },
    { categorie: 'PERFORMANCE',  titre: 'Objectif journalier inférieur à la moyenne',    detail: 'Taux atteinte 58% vs moyenne hebdo 66% — accélérer',         severite: 'MOYENNE',  action: 'Optimiser tournée' },
    { categorie: 'PERFORMANCE',  titre: '2 places gagnées au classement agence !',       detail: 'Tu es maintenant #3 sur 14 agents (+2 vs mois préc.)',       severite: 'INFO',     action: 'Continuer !' },
  ],
}

// =============================================================================
//   26. DASHBOARD RESPONSABLE COMMUNICATION & MARKETING
// =============================================================================

export const MOCK_COMMUNICATION_HOME = {
  synthese_ia: {
    ..._COMMUNICATION_DERIVED.synthese_ia,
    points: [
      { tone: 'critique',  texte: '4 leads qualifiés non assignés > 24h (valeur estimée 1.8M FCFA) — chaque heure augmente le risque de conversion concurrent.', action: 'Assigner avant 12h aux agents Adidogomé + Bè Kpota' },
      { tone: 'negatif',   texte: 'Bè Kpota : taux de pénétration marché à 12% seulement — zone sous-exploitée avec 63 prospects sur la zone Aflao Road identifiés.', action: 'Lancer campagne locale ciblée + renforcer présence WhatsApp' },
      { tone: 'negatif',   texte: 'Agoé-Nyivé (Nord Lomé) : 85 prospects estimés, couverture 0% — zone vierge à très fort potentiel. Aucune agence n\'opère dans ce rayon de 2 km.', action: 'Recruter 1 agent terrain dédié Agoé — ROI estimé mois 3' },
      { tone: 'positif',   texte: 'Kpalimé Pilote : taux de conversion 45% (meilleur réseau) et PAR 4.2% — modèle reproductible confirmé par l\'IA avec 88% de confiance.', action: 'Dupliquer le modèle sur Kpalimé Nord (+70 clients estimés)' },
      { tone: 'positif',   texte: 'Chatbot WhatsApp : 47 leads qualifiés en automatique — ROI canal à 0 FCFA/lead. Pic d\'activité 19h-21h non exploité par agents humains.', action: 'Créer permanence réponse humaine 19h-22h (2 rotations équipe)' },
      { tone: 'attention', texte: 'Rétention à 87% vs objectif 92% — 3 départs pour "concurrent moins cher" ce mois. Analyse concurrentielle nécessaire sur zones Adidogomé et Bè.', action: 'Programme fidélité + audit tarification concurrents' },
      { tone: 'attention', texte: 'Site web : 1 240 visites mensuelles sans formulaire de contact — perte de 12 leads/mois estimés. Quick win à 0 coût.', action: 'Intégrer formulaire "demande de renseignement" en 1h dev' },
      { tone: 'positif',   texte: 'NPS à 72 (+4 pts) — 18 ambassadeurs actifs ont généré 950k FCFA de crédits via parrainage. Canal gratuit à fort ROI sous-utilisé.', action: 'Structurer programme ambassadeurs : objectif 30 parrains actifs' },
    ],
    priorites: [
      'URGENT : Assigner les 4 leads non attribués avant 12h (risque perte > 1.8M FCFA)',
      'TERRITOIRE : Lancer recrutement agent Agoé-Nyivé — 85 prospects identifiés, zone vierge',
      'RÉTENTION : Appel personnalisé aux 8 clients à risque + audit tarifs concurrents zones Adidogomé/Bè',
      'DIGITAL : Ajouter formulaire site web + déployer permanence chatbot 19h-22h',
      'CROISSANCE : Dupliquer modèle Kpalimé Pilote sur périphérie Nord (+70 clients, 4 mois)',
    ],
    analyse_canaux: 'Le canal référencement client (75% de conversion) est le plus performant mais aussi le moins développé (8 leads/mois). Le chatbot WhatsApp génère 41 leads à 0 FCFA/lead mais nécessite un suivi humain le soir. Les événements terrain (50% conversion) ont le meilleur ROI après le référencement. Les brochures (14% conversion, 5 000 FCFA/lead) sont à abandonner progressivement.',
    analyse_concurrence: 'Signal de 3 départs "concurrent moins cher" ce mois sur les zones Adidogomé et Bè Kpota. Une IMF concurrente a récemment lancé des crédits à 12% sur ces zones. Recommandation : créer un produit "Crédit Fidélité" avec taux préférentiel pour les clients > 2 ans.',
  },

  kpis: _COMMUNICATION_DERIVED.kpis,

  acquisition: {
    funnel: _COMMUNICATION_DERIVED.acquisition.funnel,
    leads_pipeline: [
      { nom: 'Kafui Woedem',    agence: 'Kpalimé',     source: 'Chatbot WA',    score: 92, statut: 'CHAUD',  besoin: 'Crédit groupe agricole 800k', assigne: true,  agent: 'Ama Fiagbé' },
      { nom: 'Adjoa Mensah',    agence: 'Adidogomé',   source: 'Chatbot WA',    score: 87, statut: 'CHAUD',  besoin: 'Crédit commerce 400k',        assigne: true,  agent: 'Akua Lawson' },
      { nom: 'Ama Tepe',        agence: 'Kpalimé',     source: 'Chatbot WA',    score: 81, statut: 'CHAUD',  besoin: 'Crédit agricole 600k',        assigne: true,  agent: 'Ama Fiagbé' },
      { nom: 'Elikplim Dossou', agence: 'Hédzranawoé', source: 'Événement',     score: 71, statut: 'CHAUD',  besoin: 'Crédit équipement 350k',      assigne: false, agent: null },
      { nom: 'Mawuli Adétou',   agence: 'Bè Kpota',    source: 'Chatbot WA',    score: 65, statut: 'TIEDE',  besoin: 'Crédit individuel 250k',      assigne: false, agent: null },
      { nom: 'Aku Fiakli',      agence: 'Adidogomé',   source: 'Brochure',      score: 58, statut: 'TIEDE',  besoin: 'Tontine',                     assigne: false, agent: null },
      { nom: 'Koffi Aglo',      agence: 'Lomé Centre', source: 'Porte-à-porte', score: 74, statut: 'CHAUD',  besoin: 'Tontine groupe 5 pers',       assigne: true,  agent: 'Kofi Amavi' },
      { nom: 'Togbui Sossou',   agence: 'Lomé Centre', source: 'Référencement', score: 43, statut: 'FROID',  besoin: 'Non défini',                  assigne: false, agent: null },
    ],
    par_agence: [
      { agence: 'Lomé Centre',  leads: 24, convertis:  9, taux: 38, pipeline: 3_200_000 },
      { agence: 'Kpalimé',      leads: 22, convertis: 10, taux: 45, pipeline: 3_800_000 },
      { agence: 'Adidogomé',    leads: 16, convertis:  5, taux: 31, pipeline: 2_200_000 },
      { agence: 'Hédzranawoé',  leads: 12, convertis:  3, taux: 25, pipeline: 1_500_000 },
      { agence: 'Bè Kpota',     leads:  8, convertis:  1, taux: 12, pipeline:   900_000 },
    ],
    canaux: [
      { canal: 'Référencement client', leads:  8, convertis: 6, taux: 75, cout_lead:     0, trend: +18 },
      { canal: 'Événements terrain',   leads: 18, convertis: 9, taux: 50, cout_lead: 1_800, trend:  +8 },
      { canal: 'Porte-à-porte',        leads: 14, convertis: 6, taux: 43, cout_lead: 2_500, trend:  +2 },
      { canal: 'Chatbot WhatsApp',     leads: 41, convertis:14, taux: 34, cout_lead:     0, trend: +12 },
      { canal: 'Réseaux sociaux FB',   leads:  9, convertis: 2, taux: 22, cout_lead:   800, trend: +35 },
      { canal: 'Brochures terrain',    leads:  7, convertis: 1, taux: 14, cout_lead: 5_000, trend:  -3 },
    ],
  },

  // ── Chatbot WhatsApp IA ───────────────────────────────────────────────────
  chatbot: {
    conversations_jour:      14,
    conversations_mois:     312,
    leads_crees_mois:        47,
    leads_crees_jour:         4,
    taux_resolution_auto_pct: 72,
    leads_en_attente:         7,
    satisfaction_score:       4.4,
    temps_reponse_moy_min:    2.8,
    top_sujets: [
      { sujet: 'Crédit individuel',       count: 84 },
      { sujet: 'Tontine groupe',          count: 61 },
      { sujet: 'Conditions d\'accès',     count: 48 },
      { sujet: 'Remboursement',           count: 32 },
      { sujet: 'Création compte',         count: 28 },
    ],
    heatmap_heure: [
      { h: '07h', n: 1 }, { h: '08h', n: 3 }, { h: '09h', n: 5 }, { h: '10h', n: 7 },
      { h: '11h', n: 9 }, { h: '12h', n: 6 }, { h: '13h', n: 4 }, { h: '14h', n: 8 },
      { h: '15h', n: 7 }, { h: '16h', n: 10 },{ h: '17h', n: 14 },{ h: '18h', n: 18 },
      { h: '19h', n: 21 },{ h: '20h', n: 16 },{ h: '21h', n: 12 },{ h: '22h', n: 5  },
    ],
    conversations_recentes: [
      { heure: '11h42', nom: 'Anonyme (Kpalimé)',  message: 'Bonjour je veux un crédit pour ma boutique, combien c\'est le maximum ?', statut: 'LEAD_CREE',  score: 74 },
      { heure: '11h21', nom: 'Adjoa M.',            message: 'Mes documents sont prêts, quand puis-je venir ?',                          statut: 'TRANSFERE',  score: 87 },
      { heure: '10h58', nom: 'Anonyme (Lomé)',      message: 'Quel est le taux d\'intérêt pour un groupe de 5 personnes ?',              statut: 'QUALIFIE',   score: 58 },
      { heure: '09h55', nom: 'Anonyme (Adidogomé)', message: 'Mon amie a eu un crédit chez vous, elle m\'a recommandé',                 statut: 'LEAD_CREE',  score: 65 },
    ],
    statuts_conv: [
      { statut: 'Leads créés',           count: 47 },
      { statut: 'Transférés agents',     count: 41 },
      { statut: 'En attente',            count:  7 },
      { statut: 'Résolus automatiquement',count:224 },
    ],
  },

  // ── Campagnes ────────────────────────────────────────────────────────────
  campagnes: [
    {
      nom: 'Crédit Express Mai 2026', type: 'WhatsApp Blast', statut: 'ACTIVE',
      budget: 45_000, depense: 38_000, fin: '31/05/2026',
      envois: 312, ouvertures: 198, ouv_pct: 63, clics: 47, conversions: 8,
      revenu_genere: 558_000, roi: 12.4,
      ia_note: 'Excellent taux d\'ouverture (63%). Prolonger de 7 jours pour maximiser la fin du mois.',
    },
    {
      nom: 'Tontine Groupe Femmes', type: 'SMS + WhatsApp', statut: 'ACTIVE',
      budget: 22_000, depense: 18_500, fin: '28/05/2026',
      envois: 156, ouvertures: 104, ouv_pct: 67, clics: 29, conversions: 4,
      revenu_genere: 178_200, roi: 8.1,
      ia_note: 'Bon engagement. Segment femmes commerçantes très réceptif — élargir la cible géographique.',
    },
    {
      nom: 'Lancement Kpalimé Pilote', type: 'Événement + WA', statut: 'ACTIVE',
      budget: 60_000, depense: 42_000, fin: '15/06/2026',
      envois: 89, ouvertures: 71, ouv_pct: 80, clics: 38, conversions: 12,
      revenu_genere: 1_122_000, roi: 18.7,
      ia_note: 'Meilleur ROI du réseau ce mois. Dupliquer ce modèle pour Agoé et Aflao.',
    },
    {
      nom: 'Promotion Ramadan (archives)', type: 'WhatsApp Blast', statut: 'TERMINEE',
      budget: 55_000, depense: 55_000, fin: '12/04/2026',
      envois: 428, ouvertures: 301, ouv_pct: 70, clics: 72, conversions: 18,
      revenu_genere: 1_171_500, roi: 21.3,
      ia_note: 'Meilleure campagne de l\'année. Reproduire en novembre (fêtes de fin d\'année).',
    },
  ],

  // ── Recommandations campagnes IA ─────────────────────────────────────────
  campagnes_ia: [
    { titre: 'Campagne Agoé-Nyivé Lancement',     canal: 'WhatsApp + Radio',     budget: 85_000,  roi_estime: 14, confidence: 91, cible: '85 prospects identifiés zone nord',         desc: 'Zone vierge à fort potentiel. Modèle Kpalimé à dupliquer.' },
    { titre: 'Programme Fidélité Ambassadeurs',   canal: 'WhatsApp personnalisé', budget: 30_000,  roi_estime: 22, confidence: 88, cible: '18 clients NPS 10 + ambassadeurs',          desc: '500 FCFA offerts par nouveau client référé — ROI très élevé.' },
    { titre: 'Retargeting FB Ads Bè Kpota',       canal: 'Facebook Ads',          budget: 40_000,  roi_estime:  9, confidence: 74, cible: 'Commerçants 25-45 ans zone Bè',            desc: 'Zone sous-performante. Audience locale très ciblée requise.' },
    { titre: 'Campagne Agricole Saison Récolte',  canal: 'Agent terrain + WA',    budget: 50_000,  roi_estime: 18, confidence: 85, cible: 'Agriculteurs zones périphériques Kpalimé', desc: 'Saison favorable juin-juillet. Produit crédit agricole idéal.' },
  ],

  // ── Budget ────────────────────────────────────────────────────────────────
  budget: {
    total_mois:       850_000,
    consomme:         578_000,
    restant:          272_000,
    taux_consomme_pct: 68,
    roi_global:       11.4,
    repartition: [
      { poste: 'WhatsApp Business',  budget: 280_000, consomme: 198_000, pct: 71 },
      { poste: 'Événements terrain', budget: 200_000, consomme: 142_000, pct: 71 },
      { poste: 'Facebook Ads',       budget: 150_000, consomme: 128_000, pct: 85 },
      { poste: 'Brochures / Print',  budget:  80_000, consomme:  52_000, pct: 65 },
      { poste: 'Radio locale',       budget:  80_000, consomme:  40_000, pct: 50 },
      { poste: 'Partenariats',       budget:  60_000, consomme:  18_000, pct: 30 },
    ],
    evolution_mensuelle: [
      { mois: 'Jan', depense: 420_000, leads: 52, cac: 8_077 },
      { mois: 'Fév', depense: 510_000, leads: 61, cac: 8_360 },
      { mois: 'Mar', depense: 680_000, leads: 74, cac: 9_189 },
      { mois: 'Avr', depense: 750_000, leads: 75, cac: 10_000 },
      { mois: 'Mai', depense: 578_000, leads: 84, cac: 6_881 },
    ],
  },

  // ── Présence digitale ─────────────────────────────────────────────────────
  presence_digitale: {
    score_global: 78,
    score_cible:  95,
    evolution_pts: +5,
    google_maps: {
      note: 4.3, avis: 52, vues_mois: 1_420, profil_complet: true,
      avis_sans_reponse: 4,
      derniers_avis: [
        { auteur: 'Ama K.',    note: 5, texte: 'Service rapide, agents très professionnels. Crédit en 3 jours !', date: '18/05' },
        { auteur: 'Kofi A.',   note: 5, texte: 'Prospera m\'a aidé à développer ma boutique. Je recommande !',    date: '12/05' },
        { auteur: 'Anonyme',   note: 3, texte: 'Délais un peu long au début mais résultat satisfaisant.',         date: '05/05' },
        { auteur: 'Mawuli T.', note: 4, texte: 'Bon suivi dossier. L\'appli WhatsApp est pratique.',              date: '28/04' },
      ],
    },
    facebook: {
      followers: 1_840, evolution: +42, engagement_pct: 4.8,
      portee_mois: 9_200, posts_mois: 8,
      meilleur_post: 'Témoignage client Kpalimé — 486 vues · 23 partages',
    },
    whatsapp_business: {
      contacts_opt_in: 538, broadcasts_mois: 4,
      taux_lecture_pct: 89, reponses: 218,
    },
    site_web: {
      visites_mois: 1_240, bounce_rate_pct: 48, duree_moy: '2min34',
      leads_generes: 12, formulaire_contact: false,
    },
    recommandations_ia: [
      { axe: 'Google Maps',      action: 'Répondre aux 4 avis sans réponse — impact fort sur crédibilité locale', priorite: 'HAUTE'  },
      { axe: 'Site web',         action: 'Ajouter formulaire de demande en ligne — 1 240 visites sans conversion directe', priorite: 'HAUTE' },
      { axe: 'Facebook',         action: 'Publier 2x/semaine : témoignages + photos terrain — engagement x3 potentiel',    priorite: 'MODERE' },
      { axe: 'WhatsApp',         action: 'Lancer campagne parrainage : 500 FCFA offerts pour chaque client référé',        priorite: 'MODERE' },
    ],
  },

  // ── Fidélisation & Réputation ─────────────────────────────────────────────
  fidelisation: {
    taux_retention_pct:          87,
    objectif_retention_pct:      92,
    nps:                         72,
    nps_objectif:                80,
    nps_evolution_pts:           +4,
    clients_a_risque_attrition:   8,
    ambassadeurs_potentiels:     14,
    referrals_mois:              18,
    taux_conv_referral_pct:      75,
    raisons_depart: [
      { raison: 'Concurrent moins cher',    count: 2, pct: 33 },
      { raison: 'Remboursement difficile',  count: 2, pct: 33 },
      { raison: 'Déménagement',             count: 1, pct: 17 },
      { raison: 'Mécontentement service',   count: 1, pct: 17 },
    ],
    ambassadeurs: [
      { parrain: 'Akossiwa Mensah', filleuls: 3, credits_generes: 950_000 },
      { parrain: 'Ama Kpodaho',     filleuls: 2, credits_generes: 500_000 },
      { parrain: 'Kafui Dewonou',   filleuls: 1, credits_generes: 300_000 },
    ],
    clients_a_risque_attrition_liste: [
      { client: 'Mme Togbé Amavi',   signal: '3 mois sans activité',              risque: 'HAUT',   action: 'Appel personnalisé' },
      { client: 'M. Sodji Kpakpo',   signal: 'Dernier crédit non renouvelé',      risque: 'MOYEN',  action: 'Offre renouvellement' },
      { client: 'Mme Dossou Akuwa',  signal: 'Activité mobile money en baisse',   risque: 'MOYEN',  action: 'Visite conseiller' },
    ],
    nps_evolution: [
      { mois: 'Jan', nps: 64 }, { mois: 'Fév', nps: 66 }, { mois: 'Mar', nps: 68 },
      { mois: 'Avr', nps: 68 }, { mois: 'Mai', nps: 72 },
    ],
  },

  // ── Couverture territoire (pour la carte) ─────────────────────────────────
  couverture_territoire: {
    taux_penetration_global_pct: 31,
    marche_total_estime:         3_870,   // micro-entrepreneurs zone d'intervention
    clients_actifs_reseau:       1_200,
    prospects_non_couverts:      326,
    zones_vierges:               5,
    agents_terrain_actifs:       14,
    rayon_couverture_moy_km:     1.8,

    par_agence: [
      { id: 'AG-001', nom: 'Lomé Centre',   clients: 324, marche_estime: 850,  penet_pct: 38, agents: 4, par_pct: 3.2, statut: 'BON'     },
      { id: 'AG-002', nom: 'Adidogomé',     clients: 248, marche_estime: 720,  penet_pct: 34, agents: 3, par_pct: 4.8, statut: 'NORMAL'  },
      { id: 'AG-003', nom: 'Bè Kpota',      clients: 198, marche_estime: 680,  penet_pct: 29, agents: 3, par_pct: 5.4, statut: 'TENSION' },
      { id: 'AG-004', nom: 'Hédzranawoé',   clients: 224, marche_estime: 620,  penet_pct: 36, agents: 2, par_pct: 4.1, statut: 'NORMAL'  },
      { id: 'AG-005', nom: 'Kpalimé',       clients: 206, marche_estime: 480,  penet_pct: 43, agents: 2, par_pct: 4.2, statut: 'BON'     },
    ],

    zones_expansion_ia: [
      { id: 'ZP-01', nom: 'Agoé-Nyivé (Nord Lomé)',   potentiel: 'TRES_ELEVE', prospects: 85,  couverture_pct:  0, agence_ref: 'AG-001', roi_mois_3: true,  action: 'Recruter 1 agent terrain Agoé — ROI dès mois 3',        confidence: 91 },
      { id: 'ZP-05', nom: 'Kpalimé Expansion Nord',   potentiel: 'TRES_ELEVE', prospects: 70,  couverture_pct:  0, agence_ref: 'AG-005', roi_mois_3: true,  action: 'Étendre la couverture AG-005 : 1 agent Kpalimé Nord',    confidence: 88 },
      { id: 'ZP-02', nom: 'Tokoin Hôpital',           potentiel: 'ELEVE',      prospects: 52,  couverture_pct: 10, agence_ref: 'AG-004', roi_mois_3: false, action: '2 tournées supplémentaires depuis AG-004 hebdomadaires', confidence: 84 },
      { id: 'ZP-03', nom: 'Aflao Road Est',            potentiel: 'ELEVE',      prospects: 63,  couverture_pct: 13, agence_ref: 'AG-003', roi_mois_3: false, action: 'Produit crédit commerce frontalier — étendre AG-003',     confidence: 78 },
      { id: 'ZP-04', nom: 'Agbodrafo Pêcheurs',       potentiel: 'MODERE',     prospects: 38,  couverture_pct:  0, agence_ref: 'AG-002', roi_mois_3: false, action: 'Étude faisabilité crédit équipement pêche (3-6 mois)',    confidence: 68 },
    ],

    agents_par_zone: [
      { agence: 'Lomé Centre',  agents: [
        { nom: 'Kossi Amegnaglo', visites_sem: 28, zone_km2: 4.2, clients: 82, taux_couv: 96 },
        { nom: 'Afia Mensah',     visites_sem: 24, zone_km2: 3.8, clients: 74, taux_couv: 88 },
        { nom: 'Mawu Lawson',     visites_sem: 21, zone_km2: 3.1, clients: 68, taux_couv: 82 },
        { nom: 'Sika Dossou',     visites_sem: 19, zone_km2: 2.9, clients: 61, taux_couv: 74 },
      ]},
      { agence: 'Adidogomé', agents: [
        { nom: 'Yawa Akakpo', visites_sem: 22, zone_km2: 3.4, clients: 84, taux_couv: 91 },
        { nom: 'Koku Ablam',  visites_sem: 12, zone_km2: 2.8, clients: 58, taux_couv: 62 },
        { nom: 'Ama Fiagbé',  visites_sem: 20, zone_km2: 3.0, clients: 76, taux_couv: 85 },
      ]},
    ],

    evolution_penetration: [
      { mois: 'Jan', penet_pct: 24, clients: 940 },
      { mois: 'Fév', penet_pct: 26, clients: 1_008 },
      { mois: 'Mar', penet_pct: 27, clients: 1_045 },
      { mois: 'Avr', penet_pct: 29, clients: 1_122 },
      { mois: 'Mai', penet_pct: 31, clients: 1_200 },
    ],
  },

  // ── Zones & Segmentation marché ───────────────────────────────────────────
  marche: {
    zones_potentiel: [
      { zone: 'Agoé-Nyivé (Nord Lomé)',   potentiel: 'TRES_ELEVE', prospects_estimes: 85,  couverture_pct:  0, action: 'Recruter 1 agent terrain Agoé — ROI mois 3',      confidence: 91 },
      { zone: 'Aflao Road (Est)',          potentiel: 'ELEVE',      prospects_estimes: 63,  couverture_pct: 13, action: 'Produit crédit commerce frontalier',               confidence: 78 },
      { zone: 'Kpalimé périphérie Nord',  potentiel: 'TRES_ELEVE', prospects_estimes: 70,  couverture_pct:  0, action: 'Extension agence Kpalimé ou agent dédié',          confidence: 88 },
      { zone: 'Tokoin Hôpital',           potentiel: 'ELEVE',      prospects_estimes: 52,  couverture_pct: 10, action: '2 tournées supplémentaires AG-004',                 confidence: 84 },
      { zone: 'Agbodrafo (Pêcheurs)',     potentiel: 'MODERE',     prospects_estimes: 38,  couverture_pct:  0, action: 'Étude produit crédit équipement pêche',            confidence: 68 },
    ],
    segments_clients: [
      { segment: 'Commerçantes marché',      count: 52, taux_conv: 58, ticket_moyen: 320_000, canal_top: 'Chatbot WA',     croissance: +12 },
      { segment: 'Agriculteurs',             count: 24, taux_conv: 67, ticket_moyen: 480_000, canal_top: 'Agent terrain',  croissance: +18 },
      { segment: 'Groupes tontine',          count: 38, taux_conv: 52, ticket_moyen: 200_000, canal_top: 'Chatbot WA',     croissance:  +5 },
      { segment: 'Fonctionnaires / Salariés',count: 12, taux_conv: 75, ticket_moyen: 580_000, canal_top: 'Référencement',  croissance:  +3 },
      { segment: 'Artisans / Ouvriers',      count: 28, taux_conv: 46, ticket_moyen: 270_000, canal_top: 'Porte-à-porte',  croissance:  +8 },
      { segment: 'Étudiants / Jeunes',       count:  9, taux_conv: 28, ticket_moyen: 120_000, canal_top: 'Réseaux sociaux',croissance: +22 },
    ],
  },

  // ── Communication institutionnelle ────────────────────────────────────────
  communication_institutionnelle: {
    evenements_prevus: [
      { titre: 'Journée Portes Ouvertes Kpalimé',  date: '08/06/2026', lieu: 'Agence Kpalimé',  type: 'EVENEMENT',   statut: 'PLANIFIE' },
      { titre: 'Radio Lomé — Spot publicitaire',    date: '01/06/2026', lieu: 'Radio Lomé FM',   type: 'MEDIA',       statut: 'CONFIRME' },
      { titre: 'Forum Femmes Entrepreneures',       date: '14/06/2026', lieu: 'Palais Congrès',  type: 'PARTENARIAT', statut: 'EN_COURS' },
      { titre: 'Lancement Produit Crédit Récolte',  date: '22/06/2026', lieu: 'Toutes agences',  type: 'PRODUIT',     statut: 'EN_PREP'  },
    ],
    partenariats: [
      { partenaire: 'MTN Mobile Money',   type: 'Intégration paiement',     statut: 'ACTIF',   valeur: 'Commission 1.2%' },
      { partenaire: 'Marché Adidogomé',   type: 'Espace info / présence',  statut: 'ACTIF',   valeur: '15 leads/mois' },
      { partenaire: 'Radio Lomé FM',      type: 'Spot publicitaire mensuel',statut: 'ACTIF',   valeur: '2 spots/semaine' },
      { partenaire: 'Union des Femmes',   type: 'Programme micro-crédit',   statut: 'EN_NEGO', valeur: '60 clientes potentielles' },
    ],
    publications_planifiees: [
      { date: '25/05', canal: 'Facebook',    sujet: 'Témoignage client Kpalimé Pilote',    statut: 'A_PUBLIER' },
      { date: '26/05', canal: 'WhatsApp',    sujet: 'Rappel offre Crédit Express fin mai', statut: 'A_PREPARER' },
      { date: '01/06', canal: 'Facebook',    sujet: 'Lancement campagne Agoé',             statut: 'PLANIFIE' },
    ],
  },

  // ── Alertes ───────────────────────────────────────────────────────────────
  alertes: [
    { cat: 'LEADS',    titre: '4 leads non assignés > 24h',               detail: 'Chatbot a qualifié — manque attribution agent. Risque de refroidissement.',  severite: 'CRITIQUE' },
    { cat: 'RETENTION',titre: '8 clients à risque d\'attrition identifiés',detail: 'Signaux comportementaux : inactivité + baisse activité mobile money.',        severite: 'HAUTE'    },
    { cat: 'DIGITAL',  titre: '4 avis Google sans réponse',               detail: 'Impact négatif sur confiance et conversion SEO local — à traiter sous 24h.',  severite: 'HAUTE'    },
    { cat: 'BUDGET',   titre: 'FB Ads CPM +25% au-dessus du benchmark',   detail: 'Budget restant : 22k FCFA. Suspendre et A/B tester ou réallouer à WA.',       severite: 'HAUTE'    },
    { cat: 'DIGITAL',  titre: 'Site web : 1 240 visites, 0 formulaire',   detail: 'Visiteurs sans possibilité de contact direct. Formulaire = +12 leads/mois.',  severite: 'MOYENNE'  },
    { cat: 'LEADS',    titre: '7 conversations chatbot en attente > 2h',  detail: 'Heures de pointe 18h-21h — renforcer la capacité de réponse humaine.',        severite: 'MOYENNE'  },
  ],
}

// =============================================================================
//   27. DASHBOARD RESPONSABLE COMMERCIALE & COLLECTE
// =============================================================================

export const MOCK_COMMERCIAL_HOME = {
  synthese_ia: _COMMERCIAL_DERIVED.synthese_ia,
  kpis_commercial: _COMMERCIAL_DERIVED.kpis_commercial,
  kpis_collecte: _COMMERCIAL_DERIVED.kpis_collecte,
  kpis_equipe: _COMMERCIAL_DERIVED.kpis_equipe,
  pipeline: _COMMERCIAL_DERIVED.pipeline,

  // ── Analyse prospection ──────────────────────────────────────────────────
  prospection: {
    prospects_chauds:              8,
    prospects_sans_relance_3j:     4,
    taux_transformation_pct:      34,
    top_produits_demandes: [
      { produit: 'Crédit Commerce',  count: 12 },
      { produit: 'Crédit PME',       count: 7  },
      { produit: 'Tontine',          count: 5  },
      { produit: 'Crédit Agricole',  count: 4  },
    ],
    zones_potentiel: [
      { zone: 'Marché Adidogomé',   potentiel: 88, prospects: 6 },
      { zone: 'Bè Kpota',           potentiel: 72, prospects: 4 },
      { zone: 'Tokoin Hôpital',     potentiel: 55, prospects: 3 },
      { zone: 'Akodesséwa',         potentiel: 41, prospects: 2 },
      { zone: 'Adakpamé Carrefour', potentiel: 37, prospects: 2 },
    ],
    prospects_chauds_liste: [
      { nom: 'Boutique Hounyo',   secteur: 'Tissus',      montant: 600_000,  prob_pct: 78, sans_relance_j: 5, statut: 'CHAUD' },
      { nom: 'Atelier Edem',      secteur: 'Menuiserie',  montant: 850_000,  prob_pct: 72, sans_relance_j: 1, statut: 'CHAUD' },
      { nom: 'Restaurant Aklala', secteur: 'Restauration',montant: 400_000,  prob_pct: 65, sans_relance_j: 3, statut: 'CHAUD' },
      { nom: 'Mme Fovi Cosm.',    secteur: 'Cosmétiques', montant: 250_000,  prob_pct: 54, sans_relance_j: 4, statut: 'TIEDE' },
      { nom: 'M. Kpalimé Bétail', secteur: 'Élevage',    montant: 700_000,  prob_pct: 65, sans_relance_j: 1, statut: 'CHAUD' },
    ],
  },

  // ── Collecte par secteur d'activité ─────────────────────────────────────
  collecte_par_secteur: [
    { secteur: 'Commerce & Détail',     icone: '🏪', prevu: 1_800_000, realise: 1_620_000, pct: 90, statut: 'BON'     as const, clients: 142, retards: 3, variation_semaine_pct: 4,  agents: 4, agence_top: 'Lomé Centre' },
    { secteur: 'Tontines & Épargne',    icone: '👥', prevu: 1_200_000, realise: 1_050_000, pct: 88, statut: 'BON'     as const, clients: 86,  retards: 2, variation_semaine_pct: 1,  agents: 3, agence_top: 'Adidogomé' },
    { secteur: 'Restauration',          icone: '🍽️', prevu:   520_000, realise:   465_000, pct: 89, statut: 'BON'     as const, clients: 38,  retards: 1, variation_semaine_pct: 6,  agents: 2, agence_top: 'Lomé Centre' },
    { secteur: 'Artisanat & Services',  icone: '🔧', prevu:   680_000, realise:   510_000, pct: 75, statut: 'TENSION' as const, clients: 52,  retards: 4, variation_semaine_pct: -3, agents: 2, agence_top: 'Bè Kpota' },
    { secteur: 'Agriculture & Élevage', icone: '🌾', prevu:   600_000, realise:   480_000, pct: 80, statut: 'NORMAL'  as const, clients: 44,  retards: 2, variation_semaine_pct: -1, agents: 2, agence_top: 'Kpalimé' },
    { secteur: 'Cosmétiques & Beauté',  icone: '💄', prevu:   300_000, realise:   225_000, pct: 75, statut: 'TENSION' as const, clients: 28,  retards: 2, variation_semaine_pct: -5, agents: 1, agence_top: 'Tokoin' },
  ],

  // ── Collecte tendance (6 semaines) ──────────────────────────────────────
  collecte_tendance: [
    { sem: 'S13', collecte: 18_200_000, objectif: 20_000_000 },
    { sem: 'S14', collecte: 19_500_000, objectif: 20_000_000 },
    { sem: 'S15', collecte: 17_800_000, objectif: 20_000_000 },
    { sem: 'S16', collecte: 21_300_000, objectif: 20_000_000 },
    { sem: 'S17', collecte: 20_100_000, objectif: 20_000_000 },
    { sem: 'S18', collecte: 16_400_000, objectif: 20_000_000 },  // semaine en cours partielle
  ],

  // ── Performance équipe terrain ──────────────────────────────────────────
  equipe: [
    { agent: 'Kossi Amegnaglo',  collecte: 3_850_000, prospection: 5, conversion: 2, retard: 2, perf_pct: 91, statut: 'BON',          badge: 'OR' as const },
    { agent: 'Afia Mensah',      collecte: 3_200_000, prospection: 4, conversion: 1, retard: 3, perf_pct: 84, statut: 'BON',          badge: 'ARGENT' as const },
    { agent: 'Mawu Lawson',      collecte: 2_900_000, prospection: 3, conversion: 2, retard: 5, perf_pct: 78, statut: 'NORMAL',       badge: undefined },
    { agent: 'Sika Dossou',      collecte: 2_400_000, prospection: 2, conversion: 1, retard: 4, perf_pct: 64, statut: 'NORMAL',       badge: undefined },
    { agent: 'Yawa Akakpo',      collecte: 1_800_000, prospection: 1, conversion: 0, retard: 8, perf_pct: 48, statut: 'SOUS_PERF',   badge: undefined },
    { agent: 'Koku Ablam',       collecte: 1_400_000, prospection: 0, conversion: 0, retard: 9, perf_pct: 37, statut: 'INACTIF',     badge: undefined },
  ],

  // ── Contrôle qualité terrain ─────────────────────────────────────────────
  controle_qualite: [
    { type: 'Visites non effectuées',  count: 8,  severite: 'HAUTE',    detail: 'Koku A. : 6 visites manquées, Yawa A. : 2' },
    { type: 'Dossiers incomplets',     count: 3,  severite: 'HAUTE',    detail: 'Pièces manquantes sur 3 dossiers crédit' },
    { type: 'Relances oubliées',       count: 5,  severite: 'MOYENNE',  detail: '5 promesses de paiement sans suivi >24h' },
    { type: 'Retards de suivi',        count: 7,  severite: 'MOYENNE',  detail: '7 clients sans contact depuis >7 jours' },
    { type: 'Anomalies terrain GPS',   count: 2,  severite: 'CRITIQUE', detail: 'Check-in hors zone client détecté x2' },
  ],

  // ── Portefeuille clients ─────────────────────────────────────────────────
  portefeuille_clients: {
    clients_actifs:       487,
    clients_inactifs:      34,
    clients_vip:           18,
    clients_a_risque:      42,
    taux_fidelisation_pct: 91,
    attrition_mois_pct:    2.1,
    segmentation: [
      { segment: 'Très fidèles',               count: 210, pct: 43, couleur: '#16a34a' },
      { segment: 'Risque moyen',               count:  98, pct: 20, couleur: '#eab308' },
      { segment: 'Risque élevé',               count:  42, pct:  9, couleur: '#ef4444' },
      { segment: 'Opportunité cross-selling',  count:  85, pct: 17, couleur: '#6366f1' },
      { segment: 'Clients inactifs',           count:  34, pct:  7, couleur: '#94a3b8' },
      { segment: 'VIP fidèles',                count:  18, pct:  4, couleur: '#d97706' },
    ],
  },

  // ── Recouvrement préventif ───────────────────────────────────────────────
  recouvrement_preventif: {
    retards_imminents_7j:     18,
    clients_irreguliers:      26,
    promesses_suivis:          6,
    baisse_frequence_count:   11,
    risque_defaut_comportemental: 7,
    clients_a_surveiller: [
      { client: 'Mme Akakpo Yawa',   signal: 'Baisse fréquence paiement -3 sem.',  risque: 'HAUT',    action: 'Visite préventive' },
      { client: 'M. Folly Kossi',    signal: 'Retard imminent J+4',                risque: 'MOYEN',   action: 'Rappel WhatsApp' },
      { client: 'Mme Mensah Sika',   signal: 'Irrégularité collecte 2 mois',       risque: 'HAUT',    action: 'Entretien téléphonique' },
      { client: 'Groupe Tontine Vogan', signal: 'Absent 3 réunions consécutives',  risque: 'CRITIQUE',action: 'Visite groupe urgente' },
      { client: 'M. Doheto Kwami',   signal: 'Promesse expirée non honorée',       risque: 'HAUT',    action: 'Escalade agent' },
    ],
  },

  // ── Objectifs & Performance mensuels ────────────────────────────────────
  objectifs: {
    collecte:          { realise: 78_500_000, objectif: 96_000_000, pct: 82 },
    nouveaux_clients:  { realise: 52,         objectif: 70,         pct: 74 },
    prospection:       { realise: 38,         objectif: 50,         pct: 76 },
    taux_conversion:   { realise: 34,         objectif: 40,         pct: 85 },
    recouvrement:      { realise: 12_400_000, objectif: 15_000_000, pct: 83 },
    visites_terrain:   { realise: 312,        objectif: 400,        pct: 78 },
  },

  // ── Satisfaction client ─────────────────────────────────────────────────
  satisfaction: {
    nb_plaintes_mois:        8,
    nb_resolues:             6,
    temps_resolution_moy_h: 14,
    score_satisfaction:      4.3,
    clients_perdus_mois:     3,
    taux_fidelite_pct:       91,
    plaintes_categories: [
      { cat: 'Délai décaissement', count: 3 },
      { cat: 'Erreur de collecte', count: 2 },
      { cat: 'Tarification',       count: 2 },
      { cat: 'Comportement agent', count: 1 },
    ],
  },

  // ── Leads & Campagnes (fusion marketing → commercial) ────────────────────
  leads_et_campagnes: {
    leads_non_assignes:     4,
    leads_chauds_total:     8,
    pipeline_valeur:        7_800_000,
    chatbot_conversations_jour: 14,
    chatbot_leads_jour:     4,
    taux_resolution_auto_pct: 72,
    funnel: [
      { etape: 'Messages WhatsApp', count: 124, couleur: '#6366f1' },
      { etape: 'Qualifiés chatbot', count:  89, couleur: '#8b5cf6' },
      { etape: 'Leads CRM créés',  count:  61, couleur: '#a855f7' },
      { etape: 'RDV / Visite',     count:  38, couleur: '#d946ef' },
      { etape: 'Dossier soumis',   count:  24, couleur: '#ec4899' },
      { etape: 'Client gagné',     count:  19, couleur: '#16a34a' },
    ],
    campagnes_actives: [
      { nom: 'Crédit Express Mai',       type: 'WhatsApp Blast', conversions: 8,  roi: 12.4, statut: 'ACTIVE'   },
      { nom: 'Tontine Groupe Femmes',    type: 'SMS + WA',       conversions: 4,  roi:  8.1, statut: 'ACTIVE'   },
      { nom: 'Lancement Kpalimé Pilote', type: 'Événement + WA', conversions: 12, roi: 18.7, statut: 'ACTIVE'   },
    ],
    canaux_top: [
      { canal: 'Référencement client', taux_conv: 75, leads: 8 },
      { canal: 'Événements terrain',   taux_conv: 50, leads: 18 },
      { canal: 'Porte-à-porte',        taux_conv: 43, leads: 14 },
      { canal: 'Chatbot WhatsApp',     taux_conv: 34, leads: 41 },
    ],
  },

  // ── Alertes intelligentes ────────────────────────────────────────────────
  alertes: [
    { cat: 'COMMERCIAL',  titre: 'Prospect chaud sans relance depuis 5j',        detail: 'Boutique Hounyo — prob. conv. 78%, risque de refroidissement',  severite: 'HAUTE'    },
    { cat: 'COMMERCIAL',  titre: 'Baisse taux conversion secteur Agoè (-8%)',    detail: 'Passage de 41% à 33% sur les 2 dernières semaines',             severite: 'MOYENNE'  },
    { cat: 'COLLECTE',    titre: 'Collecte Adakpamé -11% vs semaine dernière',   detail: '210k / 400k prévus — 2 agents absents en zone',                 severite: 'CRITIQUE' },
    { cat: 'COLLECTE',    titre: 'Cliente régulière absente 2 collectes — Vogan',detail: 'Mme Dossou Yawo : 2e absence consécutive, risque désengagement', severite: 'HAUTE'    },
    { cat: 'EQUIPE',      titre: 'Koku Ablam : aucune activité terrain ce matin',detail: 'Aucun check-in enregistré depuis 08h00 — zone Bè',              severite: 'CRITIQUE' },
    { cat: 'EQUIPE',      titre: 'Faible performance recouvrement Yawa Akakpo',  detail: '37% d\'atteinte vs objectif recouvrement — 8 retards en cours', severite: 'HAUTE'    },
    { cat: 'COMMERCIAL',  titre: 'Restaurant Aklala : 3j sans relance',          detail: 'Prospect tiède prob. 65% — risque passage à froid',              severite: 'MOYENNE'  },
    { cat: 'COLLECTE',    titre: 'Groupe Tontine Tokoin : 3 absences cette semaine', detail: 'Taux collecte 67% — risque dislocation groupe',              severite: 'HAUTE'    },
  ],
}


// =============================================================================
//   MOCK — AUDITEUR INTERNE
// =============================================================================
const _AUDIT_CTX = buildAuditContext()

export const MOCK_AUDIT_HOME = {

  synthese_ia: {
    date_generation: "aujourd'hui 06:45",
    intro: buildAuditSyntheseIntro(_AUDIT_CTX),
    points: buildAuditSynthesePoints(_AUDIT_CTX),
    priorites: buildAuditPriorites(_AUDIT_CTX),
  },

  kpis: buildAuditKpisHome(_AUDIT_CTX),

  anomalies: _AUDIT_CTX.anomalies,

  detail_pages: buildAuditDetailPagesMeta(_AUDIT_CTX),

  detection_comportementale: buildDetectionComportementale(_AUDIT_CTX),

  controle_credit: buildControleCreditAudit(_AUDIT_CTX),

  audit_agences: buildAuditAgencesRadar(_AUDIT_CTX),

  caisse_comptabilite: buildCaisseComptabiliteAudit(_AUDIT_CTX),

  tracabilite: buildAuditTracabilite(_AUDIT_CTX),

  alertes: buildAuditAlertesHome(_AUDIT_CTX),

  conformite_bceao: buildConformiteBceao(),
}

// =============================================================================
//   MOCK — DAF (Directeur Administratif & Financier) + Contrôle de Gestion
// =============================================================================
export const MOCK_DAF_HOME = {
  synthese_ia: _DAF_DERIVED.synthese_ia,
  kpis_finance: _DAF_DERIVED.kpis_finance,
  tresorerie: {
    ..._DAF_DERIVED.tresorerie,
    flux_journal: [
      { date: '19/05', entrants: 8_200_000, sortants: 6_400_000 },
      { date: '20/05', entrants: 9_400_000, sortants: 7_100_000 },
      { date: '21/05', entrants: 7_800_000, sortants: 8_200_000 },
      { date: '22/05', entrants: 11_200_000, sortants: 9_800_000 },
      { date: '23/05', entrants: 10_400_000, sortants: 7_600_000 },
    ],
    prevision_7j: [
      { date: '24/05', entrants: 9_800_000, sortants: 7_200_000, solde_proj: _DAF_DERIVED.kpis_finance.tresorerie_disponible + 600_000 },
      { date: '25/05', entrants: 8_400_000, sortants: 9_100_000, solde_proj: _DAF_DERIVED.kpis_finance.tresorerie_disponible - 100_000 },
      { date: '26/05', entrants: 7_200_000, sortants: 6_800_000, solde_proj: _DAF_DERIVED.kpis_finance.tresorerie_disponible + 300_000 },
      { date: '27/05', entrants: 10_600_000, sortants: 8_400_000, solde_proj: _DAF_DERIVED.kpis_finance.tresorerie_disponible + 2_500_000 },
      { date: '28/05', entrants: 9_200_000, sortants: 11_200_000, solde_proj: _DAF_DERIVED.kpis_finance.tresorerie_disponible + 500_000 },
    ],
  },

    comptabilite: {
    ..._SYSCOHADA_COMPTA.operations,
    syscohada: _SYSCOHADA_COMPTA,
    comptes_sensitifs: [
      { code: '101', libelle: 'Capital social',      solde: 480000000, variation_m1_pct:  0   },
      { code: '512', libelle: 'Banques',             solde: 380000000, variation_m1_pct:  3.2 },
      { code: '701', libelle: 'Produits interets',   solde:  42800000, variation_m1_pct:  5.1 },
      { code: '657', libelle: 'Pertes sur créances', solde:   8400000, variation_m1_pct: 18   },
      { code: '641', libelle: 'Salaires',            solde:  12200000, variation_m1_pct:  2.1 },
    ],
  },

  bilan_consolide: {
    date_reference: '31/05/2026',
    statut: 'PROVISOIRE' as const,
    equilibre_ok: true,
    note_ia:
      'Extrait consolidé post-clôture provisoire — les montants trésorerie (512) et créances (411/416) sont rapprochés du grand livre. Passage en définitif après rapprochement des 3 suspens et validation clôture (J-7).',
    actifs:  { total: 1240000000, creances_clients: 920000000, tresorerie: 380000000, immos: 62000000, autres: 28000000 },
    passifs: { total: 1240000000, depots_clients: 680000000, emprunts: 280000000, fonds_propres: 248000000, autres: 32000000 },
    compte_resultat_mois: {
      produits: 42800000,
      charges: 24400000,
      resultat_net: 18400000,
    },
    resultat_net_annuel_ytd: 98600000,
    roe_pct: 12.4,
    roa_pct:  8.2,
  },

  budget: [
    { poste: 'Salaires et charges RH',   budget: 65000000, realise: 25360000, pct: 39, deviation_pct: -3,  statut: 'OK'        },
    { poste: 'Logistique et transport',  budget: 15000000, realise:  8400000, pct: 56, deviation_pct: 14,  statut: 'ALERTE'    },
    { poste: 'Loyers et infrastructures',budget: 22000000, realise:  9240000, pct: 42, deviation_pct:  0,  statut: 'OK'        },
    { poste: 'Informatique et SI',       budget: 18000000, realise:  5040000, pct: 28, deviation_pct: -14, statut: 'SOUS_UTIL' },
    { poste: 'Marketing Communication',  budget: 12000000, realise:  4440000, pct: 37, deviation_pct: -5,  statut: 'OK'        },
    { poste: 'Formation RH',             budget:  8000000, realise:  3200000, pct: 40, deviation_pct: -2,  statut: 'OK'        },
    { poste: 'Charges financières',      budget: 20000000, realise:  8800000, pct: 44, deviation_pct:  2,  statut: 'OK'        },
    { poste: 'Provisions créances',      budget: 25000000, realise: 11750000, pct: 47, deviation_pct:  5,  statut: 'SURVEILLE' },
  ],

  rentabilite_agences: [
    { agence: 'Lomé Centre', revenus: 14200000, charges: 10800000, resultat:  3400000, marge_pct: 24.0, roi_pct: 16.4, par_pct: 3.2, statut: 'PERFORMANTE' },
    { agence: 'Adidogomé',   revenus: 11800000, charges:  9200000, resultat:  2600000, marge_pct: 22.0, roi_pct: 14.2, par_pct: 4.8, statut: 'CORRECTE'    },
    { agence: 'Bè Kpota',    revenus:  9200000, charges:  9490000, resultat:  -290000, marge_pct: -3.1, roi_pct: -1.8, par_pct: 5.4, statut: 'DEFICITAIRE' },
    { agence: 'Hédzranawoé', revenus: 10400000, charges:  8840000, resultat:  1560000, marge_pct: 15.0, roi_pct:  9.2, par_pct: 4.1, statut: 'CORRECTE'    },
    { agence: 'Kpalimé',     revenus:  9600000, charges:  6912000, resultat:  2688000, marge_pct: 28.0, roi_pct: 19.8, par_pct: 4.2, statut: 'PERFORMANTE' },
  ],

  evolution_mensuelle: [
    { mois: 'Jan', revenus: 38200000, charges: 26400000, resultat: 11800000, taux_marge: 30.9 },
    { mois: 'Fev', revenus: 39400000, charges: 27200000, resultat: 12200000, taux_marge: 31.0 },
    { mois: 'Mar', revenus: 40800000, charges: 27800000, resultat: 13000000, taux_marge: 31.9 },
    { mois: 'Avr', revenus: 41200000, charges: 28000000, resultat: 13200000, taux_marge: 32.0 },
    { mois: 'Mai', revenus: 42800000, charges: 24400000, resultat: 18400000, taux_marge: 43.0 },
  ],

  controle_gestion: {
    kpis_performance: {
      productivite_agent_fcfa: 2840000,
      revenus_par_employe:     3180000,
      cout_par_dossier:          12400,
      cout_collecte_fcfa:         1850,
      cac:                       18400,
    },
    ecarts_vs_objectif: [
      { indicateur: 'Revenus interets',         objectif: 44000000, realise: 42800000, ecart_pct: -2.7, tendance: 'STABLE' },
      { indicateur: 'Charges operationnelles',  objectif: 23000000, realise: 24400000, ecart_pct:  6.1, tendance: 'HAUSSE' },
      { indicateur: 'Résultat net',             objectif: 21000000, realise: 18400000, ecart_pct:-12.4, tendance: 'BAISSE' },
      { indicateur: 'Coeff. exploitation',      objectif: 65,       realise: 68,       ecart_pct:  4.6, tendance: 'STABLE' },
      { indicateur: 'Taux provisionnement',     objectif: 3.5,      realise: 2.8,      ecart_pct:  -20, tendance: 'STABLE' },
    ],
    rentabilite_produits: [
      { produit: 'Crédit individuel', revenus: 18400000, couts:  9200000, marge: 9200000, marge_pct: 50 },
      { produit: 'Groupe solidaire',  revenus: 12200000, couts:  5490000, marge: 6710000, marge_pct: 55 },
      { produit: 'Crédit PME',        revenus:  8400000, couts:  5880000, marge: 2520000, marge_pct: 30 },
      { produit: 'Crédit agriculture',revenus:  4200000, couts:  2520000, marge: 1680000, marge_pct: 40 },
      { produit: 'Dépôts épargne',    revenus:  3600000, couts:  2520000, marge: 1080000, marge_pct: 30 },
    ],
    previsions_trimestre: [
      { trimestre: 'Q1 2026', revenus_realises: 118400000, objectif: 115000000, ecart_pct:  3.0 },
      { trimestre: 'Q2 2026', revenus_proj:     122000000, objectif: 125000000, ecart_pct: -2.4 },
      { trimestre: 'Q3 2026', revenus_proj:     130000000, objectif: 132000000, ecart_pct: -1.5 },
      { trimestre: 'Q4 2026', revenus_proj:     140000000, objectif: 145000000, ecart_pct: -3.4 },
    ],
  },

  alertes: [
    { severite: 'HAUTE',   titre: 'Tension cash Hédzranawoé',           detail: 'Ratio liquidité 1.2x — décaissements bloqués si ratio passe sous 1.0x', action: 'Transfert liquidité depuis siège'         },
    { severite: 'HAUTE',   titre: 'Dérive budgétaire logistique',        detail: '+14% vs budget — dépassement projeté 2.1M FCFA fin juin',               action: 'Cadrage responsables + contrôle dépenses' },
    { severite: 'HAUTE',   titre: '3 suspens comptables non justifiés',  detail: '471 (820k, 62j) + 512 (450k manual) + 401 anomalie',                    action: 'Rapprochement avant clôture (7j)'         },
    { severite: 'MOYENNE', titre: 'Agence Bè Kpota déficitaire',         detail: 'Marge -3.1% ce mois — 3e mois consécutif sous 0%',                      action: 'Plan redressement urgence avec RA'         },
    { severite: 'MOYENNE', titre: 'Coût risque PME +18%',                detail: 'Impact marge nette -0.4pts — tendance haussière depuis 3 mois',          action: 'Alerte ROC + révision politique PME'       },
  ],
}

// =============================================================================
//   RÉEXPORTS — hooks (core) + hubs opérationnels
//   Registre complet : import { MockRegistry } from '@/lib/mockMicrofinance-registry'
//   Tout-en-un : import '@/lib/prospera-mocks'
// =============================================================================

export * from './mockMicrofinance-core'
