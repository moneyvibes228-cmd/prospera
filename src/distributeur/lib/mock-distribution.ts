/**
 * Point d'entrée legacy — réexporte registre + hubs.
 * Préférer getMockRegistry() ou les getters hub dans les nouveaux composants.
 */

import { getMockRegistry, MOCK_CORE, MOCK_REGISTRIES } from './mock-distribution-registry'

export { getMockRegistry, MOCK_CORE, MOCK_REGISTRIES }
export {
  getPdvHub,
  getCommandesHub,
  getStockHub,
  getFacturationHub,
  getRelancesHub,
  getCommercialHub,
  getDashboardHub,
} from './mock-distribution-hubs'
export type { HubContext } from './hub-context'

const { core, registries } = getMockRegistry()

/** @deprecated Utiliser getPdvHub() */
export const POINTS_DE_VENTE = registries.pdv
/** @deprecated Utiliser getCommandesHub() */
export const COMMANDES = registries.commandes
/** @deprecated Utiliser getStockHub() */
export const STOCK = registries.stock
/** @deprecated Utiliser getFacturationHub() */
export const FACTURES = registries.factures
/** @deprecated Utiliser getRelancesHub() */
export const RELANCES = registries.relances
/** @deprecated Utiliser getCommercialHub() */
export const COMMERCIAUX = registries.commerciaux

export const ENTREPRISE = core.entreprise
export const KPIS_DG = core.kpisDg
export const CA_SPARKLINE = core.caSparkline
export const PIPELINE_LABELS = core.pipelineLabels
