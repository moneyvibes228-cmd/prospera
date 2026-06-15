/**
 * Point d'entrée unique — dashboards + core (hooks) + hubs + registre.
 *
 * @example
 * import { MOCK_BORROWERS, DOSSIERS_ANALYSE_CC, MockRegistry, getRelancesHub } from '@/lib/prospera-mocks'
 */

export * from './mockMicrofinance'

export {
  MockRegistry,
  getMockRegistry,
  getOperationalHub,
  MOCK_CORE,
  MOCK_DASHBOARDS,
  MOCK_GETTERS,
  OPERATIONAL_HUBS,
  PERSONA_HUB_GETTERS,
} from './mockMicrofinance-registry'

export {
  COMPTABILITE_HUB,
  RELANCES_HUB,
  CONFORMITE_HUB,
  CAISSE_HUB,
  CREDIT_CYCLE_HUB,
  PRODUITS_HUB,
  EPARGNE_HUB,
  CORE_BANKING_HUB,
  GROUPES_HUB,
  KYC_HUB,
  TERRAIN_OFFLINE_HUB,
  UTILISATEURS_HUB,
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
  ETAPE_CYCLE_ORDER,
} from './mockMicrofinance-hubs'
