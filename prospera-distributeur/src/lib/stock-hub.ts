import { REGISTRE_STOCK } from './registries/stock-registry'

export function getStockHub() {
  const ruptures = REGISTRE_STOCK.filter(p => p.stock < p.seuil)
  return {
    produits: REGISTRE_STOCK,
    ruptures,
    total: REGISTRE_STOCK.length,
    alertes: ruptures.length,
  }
}
