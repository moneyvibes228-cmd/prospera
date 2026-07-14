/**
 * Plateformes logistiques — agrégats entrepôt (pas secteurs commerciaux terrain).
 * Lomé Port dessert le grand Lomé ; Kara couvre le nord et la Centrale.
 */
import { ZONES_DISTRIBUTION } from './zones-registry'
import { REGISTRE_STOCK } from './stock-registry'

export type StatutEntrepot = 'SAIN' | 'ATTENTION' | 'CRITIQUE'

export interface EntrepotDistribution {
  id: string
  nom: string
  type: 'PRINCIPAL' | 'REGIONAL'
  zones_rattachees: string[]
  ca_mois: number
  ca_objectif: number
  livraisons_jour: number
  taux_service_pct: number
  references_stock: number
  ruptures_stock: number
  valeur_stock_fcfa: number
  impayes_lies: number
  score_operation: number
  statut: StatutEntrepot
  responsable: string
}

const ZONE_IDS_LOME_PORT = ['zn-lome-nord', 'zn-lome-sud', 'zn-lome-centre', 'zn-lome-est']
const ZONE_IDS_KARA = ['zn-kara', 'zn-centrale']

function sumZones(ids: string[]) {
  const zones = ZONES_DISTRIBUTION.filter(z => ids.includes(z.id))
  return {
    ca_mois: zones.reduce((s, z) => s + z.ca_mois, 0),
    impayes: zones.reduce((s, z) => s + z.creances_retard, 0),
    ruptures: zones.reduce((s, z) => s + z.ruptures_stock, 0),
  }
}

function stockEntrepot(nom: string) {
  const items = REGISTRE_STOCK.filter(p => p.entrepot === nom)
  const ruptures = items.filter(p => p.stock < p.seuil).length
  const valeur = items.reduce((s, p) => s + p.stock * p.prix_unitaire, 0)
  return { references: items.length, ruptures, valeur }
}

const lomeAgg = sumZones(ZONE_IDS_LOME_PORT)
const lomeStock = stockEntrepot('Lomé Port')
const karaAgg = sumZones(ZONE_IDS_KARA)
const karaStock = stockEntrepot('Kara')

export const ENTREPOTS_DISTRIBUTION: EntrepotDistribution[] = [
  {
    id: 'ent-lome-port',
    nom: 'Lomé Port',
    type: 'PRINCIPAL',
    zones_rattachees: ZONE_IDS_LOME_PORT,
    ca_mois: lomeAgg.ca_mois,
    ca_objectif: 360_000_000,
    livraisons_jour: 14,
    taux_service_pct: 91,
    references_stock: lomeStock.references,
    ruptures_stock: Math.max(lomeAgg.ruptures, lomeStock.ruptures),
    valeur_stock_fcfa: lomeStock.valeur,
    impayes_lies: lomeAgg.impayes,
    score_operation: lomeAgg.ruptures >= 4 ? 68 : 84,
    statut: lomeStock.ruptures >= 2 ? 'ATTENTION' : 'SAIN',
    responsable: 'Edem Kpodo',
  },
  {
    id: 'ent-kara',
    nom: 'Kara',
    type: 'REGIONAL',
    zones_rattachees: ZONE_IDS_KARA,
    ca_mois: karaAgg.ca_mois,
    ca_objectif: 78_000_000,
    livraisons_jour: 4,
    taux_service_pct: 96,
    references_stock: karaStock.references,
    ruptures_stock: Math.max(karaAgg.ruptures, karaStock.ruptures),
    valeur_stock_fcfa: karaStock.valeur,
    impayes_lies: karaAgg.impayes,
    score_operation: 89,
    statut: karaStock.ruptures > 0 ? 'ATTENTION' : 'SAIN',
    responsable: 'Afi Mensah',
  },
]

export function getEntrepotById(id: string): EntrepotDistribution | undefined {
  return ENTREPOTS_DISTRIBUTION.find(e => e.id === id)
}
