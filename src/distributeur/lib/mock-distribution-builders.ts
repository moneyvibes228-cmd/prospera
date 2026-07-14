/**
 * Données dérivées — calculées à partir des registres bruts.
 * Ne pas dupliquer les entités métier ici.
 */

import { ENTREPRISE_REGISTRY, CA_SPARKLINE_REGISTRY } from './registries/entreprise-registry'
import { REGISTRE_PDV } from './registries/pdv-registry'
import { REGISTRE_COMMANDES } from './registries/commandes-registry'
import { REGISTRE_STOCK } from './registries/stock-registry'
import { REGISTRE_FACTURES } from './registries/factures-registry'

const dernierCaSparkline = CA_SPARKLINE_REGISTRY[CA_SPARKLINE_REGISTRY.length - 1].ca

/** Vue agrégée entreprise — chiffres démo + agrégats cohérents avec les registres. */
export function buildEntreprise() {
  const creancesDemo = REGISTRE_PDV.reduce((s, p) => s + p.creance, 0)
  const creancesRetardDemo = REGISTRE_PDV
    .filter(p => p.creance_jours > 15)
    .reduce((s, p) => s + p.creance, 0)
  const cmdActives = REGISTRE_COMMANDES.filter(c => c.statut !== 'ANNULEE').length
  const cmdJour = Math.round(cmdActives / 28) + 98

  return {
    nom: ENTREPRISE_REGISTRY.nom,
    ca_mois: dernierCaSparkline * 1_000_000,
    ca_objectif: ENTREPRISE_REGISTRY.ca_objectif_mois,
    points_vente: ENTREPRISE_REGISTRY.points_vente_total,
    points_vente_echantillon: REGISTRE_PDV.length,
    commerciaux: ENTREPRISE_REGISTRY.commerciaux_total,
    creances_total: Math.max(creancesDemo, 186_400_000),
    creances_retard: creancesRetardDemo > 0 ? creancesRetardDemo : 42_800_000,
    commandes_jour: cmdJour,
    stock_ruptures: REGISTRE_STOCK.filter(p => p.stock < p.seuil).length + 12,
    freelances_actifs: ENTREPRISE_REGISTRY.freelances_actifs,
    creances_demo: creancesDemo,
  }
}

export function buildKpisDg() {
  const entreprise = buildEntreprise()
  const caPrecedent = CA_SPARKLINE_REGISTRY[CA_SPARKLINE_REGISTRY.length - 2].ca
  const evolution = ((dernierCaSparkline - caPrecedent) / caPrecedent) * 100

  return {
    ca_mois: entreprise.ca_mois,
    ca_evolution: Math.round(evolution * 10) / 10,
    marge: 18.2,
    creances_retard_pct: Math.round((entreprise.creances_retard / entreprise.creances_total) * 100),
    couverture_zones: 78,
    commandes_perdues_evitees: 34,
  }
}

export function buildCaSparkline() {
  return CA_SPARKLINE_REGISTRY.map(row => ({ mois: row.mois, ca: row.ca }))
}

export function getPdvNomsByCommercial(nom: string): Set<string> {
  return new Set(REGISTRE_PDV.filter(p => p.commercial === nom).map(p => p.nom))
}
