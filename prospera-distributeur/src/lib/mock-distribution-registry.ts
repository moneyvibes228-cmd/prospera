/**
 * Registre unique des données mock Prospera Distributeur.
 * Point d'entrée pour hubs et écrans — tout remonte aux registres bruts.
 *
 * Usage :
 *   import { getMockRegistry } from '@/lib/mock-distribution-registry'
 *   const { core, operational } = getMockRegistry()
 */

import { ENTREPRISE_REGISTRY, CA_SPARKLINE_REGISTRY, PIPELINE_LABELS_REGISTRY } from './registries/entreprise-registry'
import { REGISTRE_PDV } from './registries/pdv-registry'
import { REGISTRE_COMMANDES } from './registries/commandes-registry'
import { REGISTRE_STOCK } from './registries/stock-registry'
import { REGISTRE_FACTURES } from './registries/factures-registry'
import { REGISTRE_RELANCES } from './registries/relances-registry'
import { REGISTRE_COMMERCIAUX } from './registries/commerciaux-registry'
import { buildEntreprise, buildKpisDg, buildCaSparkline } from './mock-distribution-builders'
import {
  getPdvHub,
  getCommandesHub,
  getStockHub,
  getFacturationHub,
  getRelancesHub,
  getCommercialHub,
  getDashboardHub,
  OPERATIONAL_HUBS,
} from './mock-distribution-hubs'

/** Données socle dérivées des registres */
export const MOCK_CORE = {
  entreprise: buildEntreprise(),
  kpisDg: buildKpisDg(),
  caSparkline: buildCaSparkline(),
  pipelineLabels: PIPELINE_LABELS_REGISTRY,
} as const

/** Registres bruts (lecture seule — préférer les hubs côté UI) */
export const MOCK_REGISTRIES = {
  entreprise: ENTREPRISE_REGISTRY,
  pdv: REGISTRE_PDV,
  commandes: REGISTRE_COMMANDES,
  stock: REGISTRE_STOCK,
  factures: REGISTRE_FACTURES,
  relances: REGISTRE_RELANCES,
  commerciaux: REGISTRE_COMMERCIAUX,
  caSparkline: CA_SPARKLINE_REGISTRY,
} as const

export interface MockRegistry {
  core: typeof MOCK_CORE
  registries: typeof MOCK_REGISTRIES
  operational: {
    getPdvHub: typeof getPdvHub
    getCommandesHub: typeof getCommandesHub
    getStockHub: typeof getStockHub
    getFacturationHub: typeof getFacturationHub
    getRelancesHub: typeof getRelancesHub
    getCommercialHub: typeof getCommercialHub
    getDashboardHub: typeof getDashboardHub
    hubIndex: typeof OPERATIONAL_HUBS
  }
}

let _registry: MockRegistry | null = null

export function getMockRegistry(): MockRegistry {
  if (!_registry) {
    _registry = {
      core: MOCK_CORE,
      registries: MOCK_REGISTRIES,
      operational: {
        getPdvHub,
        getCommandesHub,
        getStockHub,
        getFacturationHub,
        getRelancesHub,
        getCommercialHub,
        getDashboardHub,
        hubIndex: OPERATIONAL_HUBS,
      },
    }
  }
  return _registry
}
