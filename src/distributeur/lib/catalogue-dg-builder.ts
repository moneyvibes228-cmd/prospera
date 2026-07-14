/**
 * Catalogue DG — rentabilité, engouement, ruptures, stock entrepôt & réseau PDV.
 */
import { REGISTRE_STOCK, CATEGORIES_CATALOGUE } from './registries/stock-registry'
import type { ProduitStock } from '@distributeur/types'
import { hashString, randInt, seededRandom } from './generators/mock-seed'

export type VueCatalogueDG = 'consolide' | 'lome-port' | 'kara' | 'reseau-pdv'
export type RentabiliteProduit = 'FORTE' | 'CORRECTE' | 'TENSION' | 'DEFICITAIRE'
export type EngouementProduit = 'FORT' | 'STABLE' | 'FAIBLE' | 'EN_CHUTE'

export interface StockEntrepotLigne {
  entrepot: string
  quantite: number
  seuil: number
  rupture: boolean
}

export interface StockReseauPdv {
  magasins_approvisionnes: number
  stock_moyen_unites: number
  magasins_en_rupture: number
  demande_mois_unites: number
}

export interface ProduitCatalogueDG {
  produit: ProduitStock
  visuel: { gradient: string; emoji: string; categorie_color: string }
  stocks_entrepot: StockEntrepotLigne[]
  reseau_pdv: StockReseauPdv
  sorties_mois: number
  ca_mois: number
  cout_revient: number
  marge_pct: number
  rentabilite: RentabiliteProduit
  ruptures_3m: number
  jours_rupture_3m: number
  evolution_demande_pct: number
  engouement: EngouementProduit
  rotation_jours: number
  valeur_stock_immobilisee: number
  synthese_ia: string
  alerte?: string
}

export interface AnalyseCatalogueIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  action: string
}

const VISUELS: Record<string, { gradient: string; emoji: string; categorie_color: string }> = {
  Boissons: { gradient: 'from-sky-400 to-blue-600', emoji: '🥤', categorie_color: '#3b82f6' },
  Alimentaire: { gradient: 'from-amber-400 to-orange-600', emoji: '🌾', categorie_color: '#f97316' },
  Hygiène: { gradient: 'from-violet-400 to-purple-600', emoji: '🧴', categorie_color: '#a855f7' },
  Entretien: { gradient: 'from-teal-400 to-emerald-600', emoji: '🧹', categorie_color: '#14b8a6' },
}

/** Métriques DG mock — cohérentes avec le reste du réseau. */
const METRIQUES: Record<string, Omit<ProduitCatalogueDG, 'produit' | 'visuel' | 'stocks_entrepot' | 'reseau_pdv' | 'valeur_stock_immobilisee'>> = {
  'p-1': { sorties_mois: 18400, ca_mois: 77_280_000, cout_revient: 3_600, marge_pct: 14.2, rentabilite: 'FORTE', ruptures_3m: 1, jours_rupture_3m: 2, evolution_demande_pct: 12, engouement: 'FORT', rotation_jours: 4, synthese_ia: 'Produit moteur #1 — rotation rapide, marge correcte. Pilier du CA boissons.' },
  'p-5': { sorties_mois: 9200, ca_mois: 90_160_000, cout_revient: 8_200, marge_pct: 16.8, rentabilite: 'FORTE', ruptures_3m: 0, jours_rupture_3m: 0, evolution_demande_pct: 8, engouement: 'FORT', rotation_jours: 5, synthese_ia: 'Soda : forte demande été. Marge supérieure à l\'eau — à pousser en cross-sell.' },
  'p-6': { sorties_mois: 2100, ca_mois: 13_650_000, cout_revient: 5_800, marge_pct: 10.8, rentabilite: 'CORRECTE', ruptures_3m: 2, jours_rupture_3m: 5, evolution_demande_pct: -4, engouement: 'STABLE', rotation_jours: 8, synthese_ia: 'Jus : correct mais concurrence locale. Surveiller marge après promo été.' },
  'p-7': { sorties_mois: 1800, ca_mois: 20_160_000, cout_revient: 9_800, marge_pct: 12.5, rentabilite: 'CORRECTE', ruptures_3m: 1, jours_rupture_3m: 1, evolution_demande_pct: 6, engouement: 'STABLE', rotation_jours: 12, synthese_ia: 'Bière : niche rentable Kara/Lomé Sud. Stock sécurité à maintenir week-ends.' },
  'p-2': { sorties_mois: 3120, ca_mois: 26_520_000, cout_revient: 7_800, marge_pct: 9.8, rentabilite: 'TENSION', ruptures_3m: 8, jours_rupture_3m: 24, evolution_demande_pct: 22, engouement: 'FORT', rotation_jours: 3, alerte: '8 ruptures/3m · stock 180/200', synthese_ia: 'Engouement fort MAIS ruptures chroniques — coût opportunité estimé 4,2 M/mois. Supply chain à revoir.' },
  'p-3': { sorties_mois: 4850, ca_mois: 87_300_000, cout_revient: 16_200, marge_pct: 11.5, rentabilite: 'FORTE', ruptures_3m: 1, jours_rupture_3m: 3, evolution_demande_pct: -3, engouement: 'STABLE', rotation_jours: 6, synthese_ia: 'Riz : volume élevé, marge modeste mais stable. Légère baisse post-fête — normal.' },
  'p-8': { sorties_mois: 1200, ca_mois: 4_560_000, cout_revient: 3_400, marge_pct: 10.5, rentabilite: 'CORRECTE', ruptures_3m: 0, jours_rupture_3m: 0, evolution_demande_pct: 5, engouement: 'STABLE', rotation_jours: 10, synthese_ia: 'Pâtes : entrée de gamme alimentaire. Bon complément panier, peu de ruptures.' },
  'p-9': { sorties_mois: 890, ca_mois: 4_628_000, cout_revient: 4_600, marge_pct: 11.5, rentabilite: 'CORRECTE', ruptures_3m: 1, jours_rupture_3m: 2, evolution_demande_pct: 3, engouement: 'STABLE', rotation_jours: 9, synthese_ia: 'Lait concentré : demande stable Nord. Stock Kara bien dimensionné.' },
  'p-4': { sorties_mois: 1840, ca_mois: 22_080_000, cout_revient: 10_200, marge_pct: 18.4, rentabilite: 'FORTE', ruptures_3m: 5, jours_rupture_3m: 12, evolution_demande_pct: 5, engouement: 'STABLE', rotation_jours: 7, alerte: 'Rupture actuelle Kara — 45/80', synthese_ia: 'Excellente marge hygiène. Ruptures Kara récurrentes — réappro express requis.' },
  'p-10': { sorties_mois: 420, ca_mois: 6_090_000, cout_revient: 12_800, marge_pct: 11.7, rentabilite: 'CORRECTE', ruptures_3m: 0, jours_rupture_3m: 0, evolution_demande_pct: 15, engouement: 'FORT', rotation_jours: 11, synthese_ia: 'Couches : engouement croissant (+15%). Marge correcte — potentiel extension gamme bébé.' },
  'p-11': { sorties_mois: 380, ca_mois: 2_964_000, cout_revient: 6_900, marge_pct: 11.5, rentabilite: 'TENSION', ruptures_3m: 4, jours_rupture_3m: 8, evolution_demande_pct: -12, engouement: 'EN_CHUTE', rotation_jours: 18, alerte: 'Demande -12% · stock immobilisé', synthese_ia: 'Détergent : demande en chute, stock lent (18j rotation). Coût stockage > marge générée — réduire assortiment ou promo clearance.' },
  'p-12': { sorties_mois: 290, ca_mois: 1_972_000, cout_revient: 6_100, marge_pct: 10.3, rentabilite: 'DEFICITAIRE', ruptures_3m: 0, jours_rupture_3m: 0, evolution_demande_pct: -28, engouement: 'EN_CHUTE', rotation_jours: 32, alerte: 'Non rentable — rotation 32j', synthese_ia: 'Café soluble : échec assortiment. -28% demande, rotation 32j, marge 10% insuffisante vs coût immobilisation. Recommandation : sortie catalogue ou destockage -20%.' },
}

const STOCK_ENTREPOT_SPLIT: Record<string, StockEntrepotLigne[]> = {
  'p-1': [{ entrepot: 'Lomé Port', quantite: 2400, seuil: 500, rupture: false }],
  'p-5': [{ entrepot: 'Lomé Port', quantite: 1200, seuil: 400, rupture: false }],
  'p-6': [{ entrepot: 'Lomé Port', quantite: 680, seuil: 200, rupture: false }],
  'p-7': [{ entrepot: 'Lomé Port', quantite: 920, seuil: 350, rupture: false }],
  'p-2': [{ entrepot: 'Lomé Port', quantite: 180, seuil: 200, rupture: true }],
  'p-3': [{ entrepot: 'Lomé Port', quantite: 890, seuil: 300, rupture: false }],
  'p-8': [{ entrepot: 'Lomé Port', quantite: 420, seuil: 150, rupture: false }],
  'p-9': [{ entrepot: 'Kara', quantite: 310, seuil: 120, rupture: false }],
  'p-4': [{ entrepot: 'Kara', quantite: 45, seuil: 80, rupture: true }],
  'p-10': [{ entrepot: 'Kara', quantite: 156, seuil: 60, rupture: false }],
  'p-11': [{ entrepot: 'Lomé Port', quantite: 88, seuil: 100, rupture: true }],
  'p-12': [{ entrepot: 'Kara', quantite: 240, seuil: 80, rupture: false }],
}

const RESEAU_PDV: Record<string, StockReseauPdv> = {
  'p-1': { magasins_approvisionnes: 142, stock_moyen_unites: 28, magasins_en_rupture: 4, demande_mois_unites: 18400 },
  'p-5': { magasins_approvisionnes: 98, stock_moyen_unites: 18, magasins_en_rupture: 2, demande_mois_unites: 9200 },
  'p-6': { magasins_approvisionnes: 45, stock_moyen_unites: 8, magasins_en_rupture: 6, demande_mois_unites: 2100 },
  'p-7': { magasins_approvisionnes: 38, stock_moyen_unites: 12, magasins_en_rupture: 1, demande_mois_unites: 1800 },
  'p-2': { magasins_approvisionnes: 124, stock_moyen_unites: 6, magasins_en_rupture: 34, demande_mois_unites: 3120 },
  'p-3': { magasins_approvisionnes: 86, stock_moyen_unites: 14, magasins_en_rupture: 3, demande_mois_unites: 4850 },
  'p-8': { magasins_approvisionnes: 52, stock_moyen_unites: 10, magasins_en_rupture: 0, demande_mois_unites: 1200 },
  'p-9': { magasins_approvisionnes: 34, stock_moyen_unites: 7, magasins_en_rupture: 2, demande_mois_unites: 890 },
  'p-4': { magasins_approvisionnes: 67, stock_moyen_unites: 5, magasins_en_rupture: 12, demande_mois_unites: 1840 },
  'p-10': { magasins_approvisionnes: 28, stock_moyen_unites: 4, magasins_en_rupture: 0, demande_mois_unites: 420 },
  'p-11': { magasins_approvisionnes: 22, stock_moyen_unites: 9, magasins_en_rupture: 5, demande_mois_unites: 380 },
  'p-12': { magasins_approvisionnes: 18, stock_moyen_unites: 11, magasins_en_rupture: 0, demande_mois_unites: 290 },
}

type MetriquesProduit = Omit<ProduitCatalogueDG, 'produit' | 'visuel' | 'stocks_entrepot' | 'reseau_pdv' | 'valeur_stock_immobilisee'>

function defaultReseauPdv(p: ProduitStock, sorties_mois: number): StockReseauPdv {
  const rng = seededRandom(hashString(`cat-pdv-${p.id}`))
  const rupture = p.stock < p.seuil
  return {
    magasins_approvisionnes: randInt(rng, 12, 68),
    stock_moyen_unites: randInt(rng, 4, 18),
    magasins_en_rupture: rupture ? randInt(rng, 2, 14) : randInt(rng, 0, 3),
    demande_mois_unites: sorties_mois,
  }
}

function defaultMetriques(p: ProduitStock): MetriquesProduit {
  const rng = seededRandom(hashString(`cat-${p.id}`))
  const rupture = p.stock < p.seuil
  const sorties_mois = Math.max(80, Math.round(p.stock * randInt(rng, 2, 8)))
  const ca_mois = sorties_mois * p.prix_unitaire
  const marge_pct = randInt(rng, 95, 175) / 10
  const evolution_demande_pct = randInt(rng, -18, 22)
  const rotation_jours = randInt(rng, 5, 22)
  const ruptures_3m = rupture ? randInt(rng, 1, 4) : randInt(rng, 0, 2)

  let rentabilite: RentabiliteProduit = 'CORRECTE'
  if (marge_pct >= 14 && !rupture) rentabilite = 'FORTE'
  else if (rupture && ruptures_3m >= 3) rentabilite = 'TENSION'
  else if (marge_pct < 10 || rotation_jours > 28) rentabilite = 'DEFICITAIRE'
  else if (rupture || marge_pct < 11) rentabilite = 'TENSION'

  let engouement: EngouementProduit = 'STABLE'
  if (evolution_demande_pct >= 10) engouement = 'FORT'
  else if (evolution_demande_pct <= -15) engouement = 'EN_CHUTE'
  else if (evolution_demande_pct <= -5) engouement = 'FAIBLE'

  return {
    sorties_mois,
    ca_mois,
    cout_revient: Math.round(p.prix_unitaire * randInt(rng, 82, 92) / 100),
    marge_pct,
    rentabilite,
    ruptures_3m,
    jours_rupture_3m: ruptures_3m * randInt(rng, 1, 4),
    evolution_demande_pct,
    engouement,
    rotation_jours,
    synthese_ia: `${p.nom.split(' ').slice(0, 3).join(' ')} — ${engouement === 'FORT' ? 'demande dynamique' : 'suivi standard'} · marge ${marge_pct}% · rotation ${rotation_jours}j.`,
    alerte: rupture ? `Stock ${p.stock}/${p.seuil} sous seuil` : undefined,
  }
}

export function buildCatalogueDG(): ProduitCatalogueDG[] {
  return REGISTRE_STOCK.map(p => {
    const m = METRIQUES[p.id] ?? defaultMetriques(p)
    const visuel = VISUELS[p.categorie] ?? VISUELS.Alimentaire
    const stocks = STOCK_ENTREPOT_SPLIT[p.id] ?? [{ entrepot: p.entrepot, quantite: p.stock, seuil: p.seuil, rupture: p.stock < p.seuil }]
    return {
      produit: p,
      visuel,
      stocks_entrepot: stocks,
      reseau_pdv: RESEAU_PDV[p.id] ?? defaultReseauPdv(p, m.sorties_mois),
      valeur_stock_immobilisee: p.stock * p.prix_unitaire,
      ...m,
    }
  })
}

export function buildSyntheseCatalogueDG(produits: ProduitCatalogueDG[]) {
  return {
    total_sku: produits.length,
    ca_catalogue_mois: produits.reduce((s, p) => s + p.ca_mois, 0),
    marge_moyenne: Math.round(produits.reduce((s, p) => s + p.marge_pct, 0) / produits.length * 10) / 10,
    ruptures_actives: produits.filter(p => p.stocks_entrepot.some(e => e.rupture)).length,
    sku_deficitaires: produits.filter(p => p.rentabilite === 'DEFICITAIRE' || p.rentabilite === 'TENSION').length,
    engouement_fort: produits.filter(p => p.engouement === 'FORT').length,
    valeur_stock_total: produits.reduce((s, p) => s + p.valeur_stock_immobilisee, 0),
    ruptures_3m_total: produits.reduce((s, p) => s + p.ruptures_3m, 0),
    pdv_en_rupture_total: produits.reduce((s, p) => s + p.reseau_pdv.magasins_en_rupture, 0),
  }
}

export function buildAnalysesCatalogueIA(produits: ProduitCatalogueDG[]): AnalyseCatalogueIA[] {
  const analyses: AnalyseCatalogueIA[] = []

  const huile = produits.find(p => p.produit.reference === 'PRD-HUILE-5L')
  if (huile) {
    analyses.push({
      severite: 'CRITIQUE',
      titre: 'Huile 5L — ruptures vs forte demande',
      detail: `${huile.ruptures_3m} ruptures/3m (${huile.jours_rupture_3m}j cumulés) · +${huile.evolution_demande_pct}% demande · 34 PDV en rupture réseau · coût opportunité ~4,2 M/mois`,
      action: 'Commande fournisseur express + réserver 20% stock aux magasins enseigne.',
    })
  }

  const cafe = produits.find(p => p.rentabilite === 'DEFICITAIRE')
  if (cafe) {
    analyses.push({
      severite: 'HAUTE',
      titre: `Sortie catalogue recommandée — ${cafe.produit.nom.split(' ')[0]}`,
      detail: `${cafe.produit.nom} : marge ${cafe.marge_pct}% · rotation ${cafe.rotation_jours}j · demande ${cafe.evolution_demande_pct}% · stock immobilisé ${(cafe.valeur_stock_immobilisee / 1_000_000).toFixed(1)} M`,
      action: 'Destockage -20% ou retrait assortiment sous 30j — libérer cash et espace entrepôt Kara.',
    })
  }

  const tops = [...produits].filter(p => p.engouement === 'FORT').sort((a, b) => b.ca_mois - a.ca_mois).slice(0, 3)
  analyses.push({
    severite: 'MODEREE',
    titre: 'Top engouement — à protéger',
    detail: tops.map(p => `${p.produit.nom.split(' ')[0]} (+${p.evolution_demande_pct}%, ${(p.ca_mois / 1_000_000).toFixed(1)} M)`).join(' · '),
    action: 'Maintenir stock sécurité +2 semaines sur ces 3 SKU moteurs.',
  })

  const detergent = produits.find(p => p.produit.reference === 'PRD-DETERGENT-5L')
  if (detergent) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Détergent — coût sans rentabilité',
      detail: `Demande ${detergent.evolution_demande_pct}% · rotation ${detergent.rotation_jours}j · marge ${detergent.marge_pct}% insuffisante vs immobilisation`,
      action: 'Réduire commande fournisseur 40% · tester promo bundle hygiène.',
    })
  }

  return analyses
}

export function filterCatalogueVue(produits: ProduitCatalogueDG[], vue: VueCatalogueDG): ProduitCatalogueDG[] {
  if (vue === 'consolide') return produits
  if (vue === 'lome-port') return produits.filter(p => p.stocks_entrepot.some(e => e.entrepot === 'Lomé Port'))
  if (vue === 'kara') return produits.filter(p => p.stocks_entrepot.some(e => e.entrepot === 'Kara'))
  return produits
}

export const RENTABILITE_STYLE: Record<RentabiliteProduit, { label: string; className: string }> = {
  FORTE: { label: 'Forte rentabilité', className: 'bg-emerald-100 text-emerald-700' },
  CORRECTE: { label: 'Correcte', className: 'bg-sky-100 text-sky-700' },
  TENSION: { label: 'Sous tension', className: 'bg-orange-100 text-orange-700' },
  DEFICITAIRE: { label: 'Déficitaire', className: 'bg-red-100 text-red-700' },
}

export const ENGOUMENT_STYLE: Record<EngouementProduit, { label: string; className: string }> = {
  FORT: { label: 'Fort engouement', className: 'bg-emerald-100 text-emerald-700' },
  STABLE: { label: 'Stable', className: 'bg-slate-100 text-slate-600' },
  FAIBLE: { label: 'Faible', className: 'bg-amber-100 text-amber-700' },
  EN_CHUTE: { label: 'En chute', className: 'bg-red-100 text-red-700' },
}

export { CATEGORIES_CATALOGUE }
