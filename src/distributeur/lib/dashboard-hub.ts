import { buildEntreprise, buildKpisDg, buildCaSparkline } from './mock-distribution-builders'
import { getCommandesHub } from './commandes-hub'
import { getPdvHub } from './pdv-hub'
import { getFacturationHub } from './facturation-hub'
import { getRelancesHub } from './relances-hub'
import { getCommercialHub } from './commercial-hub'
import { getStockHub } from './stock-hub'
import type { HubContext } from './hub-context'

/** Hub tableau de bord — agrège les hubs métier pour un persona. */
export function getDashboardHub(ctx?: HubContext) {
  return {
    entreprise: buildEntreprise(),
    kpisDg: buildKpisDg(),
    caSparkline: buildCaSparkline(),
    commandes: getCommandesHub(ctx),
    pdv: getPdvHub(ctx),
    facturation: getFacturationHub(ctx),
    relances: getRelancesHub(ctx),
    commerciaux: getCommercialHub(ctx),
    stock: getStockHub(),
  }
}
