/**
 * Index des hubs opérationnels — point d'entrée par domaine métier.
 * Les composants doivent consommer ces getters, pas les registres bruts.
 */

export { getPdvHub } from './pdv-hub'
export { getCommandesHub } from './commandes-hub'
export { getStockHub } from './stock-hub'
export { getFacturationHub } from './facturation-hub'
export { getRelancesHub } from './relances-hub'
export { getCommercialHub } from './commercial-hub'
export { getDashboardHub } from './dashboard-hub'

export const OPERATIONAL_HUBS = {
  pdv: 'getPdvHub',
  commandes: 'getCommandesHub',
  stock: 'getStockHub',
  facturation: 'getFacturationHub',
  relances: 'getRelancesHub',
  commercial: 'getCommercialHub',
  dashboard: 'getDashboardHub',
} as const
