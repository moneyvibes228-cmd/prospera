/**
 * Registre unique des données mock Prospera.
 * Point d'entrée pour hooks, hubs et écrans — tout remonte à mockMicrofinance.
 *
 * Usage :
 *   import { MockRegistry, getMockRegistry } from '@/lib/mockMicrofinance'
 *   const { core, operational } = getMockRegistry()
 */

import {
  MOCK_KPIS,
  MOCK_KPI_HISTORIQUE,
  MOCK_BORROWERS,
  MOCK_ALERTES,
  MOCK_VISITS,
  MOCK_TEAM_PERFORMANCE,
  MOCK_LOANS,
  MOCK_REMINDERS,
} from './mockMicrofinance-core'

import {
  TRANSACTIONS_RECENTES,
  TRANSACTIONS_STATS,
  EPARGNE_STATS,
  DOSSIERS_ANALYSE_CC,
  DOSSIERS_CREDIT_STATS,
  SECTEURS,
  BCEAO_REPARTITION,
  EXPECTED_LOSS,
  MOCK_ROC_HOME,
  MOCK_CC_HOME,
  MOCK_GP_HOME,
  MOCK_RA_HOME,
  MOCK_AUDIT_HOME,
  MOCK_DAF_HOME,
  RAPPORT_IA_DG,
  CASH_PAR_AGENCE,
  KPIS_GLOBAUX_DG,
} from './mockMicrofinance'

import {
  OPERATIONAL_HUBS,
  getComptabiliteHub,
  getRelancesHub,
  getConformiteHub,
  getCaisseHub,
  getCreditCycleHub,
  getProduitsHub,
  getEpargneHub,
  getCoreBankingHub,
  getGroupesHub,
  getKycHub,
  getTerrainOfflineHub,
  getUtilisateursHub,
} from './mockMicrofinance-hubs'

import { getCollecteHubData } from './collecte-agent-hub'
import { getRccHubData } from './rcc-commercial-hub'
import { getCcHubData } from './cc-credit-hub'
import { getGpHubData } from './gp-portefeuille-hub'
import { getRaHubData } from './ra-agence-hub'
import { getReseauHubData } from './roc-reseau-hub'
import { getRecouvrementHubData } from './roc-recouvrement-hub'

/** Getters persona (chargés après mockMicrofinance — évite dépendance circulaire) */
export const PERSONA_HUB_GETTERS = {
  collecte: getCollecteHubData,
  rcc: getRccHubData,
  cc: getCcHubData,
  gp: getGpHubData,
  ra: getRaHubData,
  rocReseau: getReseauHubData,
  rocRecouvrement: getRecouvrementHubData,
} as const

/** Données consommées par les 6 hooks React Query (fallback API) */
export const MOCK_CORE = {
  kpis: MOCK_KPIS,
  kpiHistorique: MOCK_KPI_HISTORIQUE,
  borrowers: MOCK_BORROWERS,
  alertes: MOCK_ALERTES,
  visits: MOCK_VISITS,
  teamPerformance: MOCK_TEAM_PERFORMANCE,
  loans: MOCK_LOANS,
  reminders: MOCK_REMINDERS,
} as const

/** Extraits principaux du fichier mockMicrofinance (dashboards) */
export const MOCK_DASHBOARDS = {
  transactions: TRANSACTIONS_RECENTES,
  transactionsStats: TRANSACTIONS_STATS,
  epargneStats: EPARGNE_STATS,
  dossiersAnalyseCc: DOSSIERS_ANALYSE_CC,
  dossiersCreditStats: DOSSIERS_CREDIT_STATS,
  secteurs: SECTEURS,
  bceaoRepartition: BCEAO_REPARTITION,
  expectedLoss: EXPECTED_LOSS,
  rocHome: MOCK_ROC_HOME,
  ccHome: MOCK_CC_HOME,
  gpHome: MOCK_GP_HOME,
  raHome: MOCK_RA_HOME,
  auditHome: MOCK_AUDIT_HOME,
  dafHome: MOCK_DAF_HOME,
  rapportIaDg: RAPPORT_IA_DG,
  cashParAgence: CASH_PAR_AGENCE,
  kpisGlobauxDg: KPIS_GLOBAUX_DG,
} as const

export const MOCK_GETTERS = {
  getComptabiliteHub,
  getRelancesHub,
  getConformiteHub,
  getCaisseHub,
  getCreditCycleHub,
  getProduitsHub,
  getEpargneHub,
  getCoreBankingHub,
  getGroupesHub,
  getKycHub,
  getTerrainOfflineHub,
  getUtilisateursHub,
  ...PERSONA_HUB_GETTERS,
} as const

export {
  REGISTRE_CLIENTS_RISQUE,
  REGISTRE_DOSSIERS_BLOQUES,
  REGISTRE_AGENT_ACTIVITE,
  buildTopClientsRisque,
  buildDossiersBloques48h,
  buildHaussesAnormalesDefauts,
  buildConcentrationsSuspectes,
  countDossiersBloques,
} from './mock-risque-registry'

export {
  REGISTRE_TRANSACTIONS_SUSPECTES,
  REGISTRE_TENTATIVES_FRAUDE,
  REGISTRE_DEPASSEMENTS_PLAFOND,
  REGISTRE_MODIFICATIONS_SENSIBLES,
  REGISTRE_ALERTES_CBI,
  REGISTRE_ANOMALIES_DG,
  REGISTRE_ANOMALIES_AUDIT,
  REGISTRE_ECARTS_CAISSE,
  REGISTRE_OPS_HORS_HORAIRES,
  REGISTRE_DOSSIERS_INCOMPLETS_AUDIT,
  buildControleInterne,
  buildAuditKpisControle,
  buildTransactionsSuspectes,
  buildAlertesCbi9Codes,
  buildAnomaliesJour,
  buildAnomaliesAudit,
  buildAnomaliesAuditStats,
  buildAnomaliesDgStats,
} from './mock-controle-interne-registry'

export {
  buildAlertesCbiTotals,
  buildAlertesCbiLabels,
  buildAuditContext,
  buildAuditAgencesRadar,
  buildAuditKpisHome,
  buildRapportIAAuditeur,
  buildRapportIACreditRisque,
} from './mock-audit-builders'

export { OPERATIONAL_HUBS } from './mockMicrofinance-hubs'

export const MockRegistry = {
  core: MOCK_CORE,
  dashboards: MOCK_DASHBOARDS,
  operational: OPERATIONAL_HUBS,
  getters: MOCK_GETTERS,
} as const

export type MockRegistryShape = typeof MockRegistry

/** Accès typé au registre complet */
export function getMockRegistry(): MockRegistryShape {
  return MockRegistry
}

/** Accès direct à un hub opérationnel par clé */
export function getOperationalHub<K extends keyof typeof OPERATIONAL_HUBS>(
  key: K,
): (typeof OPERATIONAL_HUBS)[K] {
  return OPERATIONAL_HUBS[key]
}
