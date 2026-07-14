/**
 * Combos & promos IA — écouler les stocks lents via produits moteurs.
 */
import { buildCatalogueDG, type ProduitCatalogueDG } from './catalogue-dg-builder'
import { REGISTRE_PDV } from './registries/pdv-registry'
import { formatFcfa } from './utils'

export type TypeComboStock = 'COMBO_MOTEUR' | 'PROMO_CHOC' | 'BUNDLE_ADOPTION'

export interface ProduitStockProfil {
  reference: string
  nom: string
  categorie: string
  entrepot: string
  stock: number
  seuil: number
  prix_fcfa: number
  sorties_mois: number
  rotation_jours: number
  couverture_jours: number
  engouement: string
  evolution_demande_pct: number
  valeur_immobilisee_fcfa: number
  /** Coût estimé immobilisation + manque à gagner / mois */
  cout_stock_lent_mois_fcfa: number
}

export interface ComboStockIA {
  id: string
  priorite: number
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  type: TypeComboStock
  nom: string
  explication: string
  offre: string
  lent: ProduitStockProfil
  moteurs: ProduitStockProfil[]
  remise_lent_pct: number
  prix_lent_promo_fcfa: number
  prix_combo_estime_fcfa: number
  stock_a_liberer_unites: number
  cout_evite_mois_fcfa: number
  ca_potentiel_fcfa: number
  contacts_cibles: number
  canal: string
  zone: string
  marge_combo_pct: number
  metriques: { label: string; value: string }[]
}

export interface AnalyseEcoulementStock {
  sku_lents: number
  sku_moteurs: number
  valeur_immobilisee_lente_fcfa: number
  cout_stock_lent_total_mois_fcfa: number
  synthese: string
}

function couvertureJours(p: ProduitCatalogueDG): number {
  const sortiesJour = p.sorties_mois / 30
  if (sortiesJour <= 0) return 99
  const stock = p.stocks_entrepot[0]?.quantite ?? p.produit.stock
  return Math.round(stock / sortiesJour)
}

function profilFromProduit(p: ProduitCatalogueDG): ProduitStockProfil {
  const stock = p.stocks_entrepot[0]?.quantite ?? p.produit.stock
  const couverture = couvertureJours(p)
  const joursExcedent = Math.max(0, p.rotation_jours - 10)
  const coutLent = Math.round(p.valeur_stock_immobilisee * (joursExcedent / 30) * 0.14)

  return {
    reference: p.produit.reference,
    nom: p.produit.nom,
    categorie: p.produit.categorie,
    entrepot: p.stocks_entrepot[0]?.entrepot ?? p.produit.entrepot,
    stock,
    seuil: p.stocks_entrepot[0]?.seuil ?? p.produit.seuil,
    prix_fcfa: p.produit.prix_unitaire,
    sorties_mois: p.sorties_mois,
    rotation_jours: p.rotation_jours,
    couverture_jours: couverture,
    engouement: p.engouement,
    evolution_demande_pct: p.evolution_demande_pct,
    valeur_immobilisee_fcfa: p.valeur_stock_immobilisee,
    cout_stock_lent_mois_fcfa: coutLent,
  }
}

function isStockLent(p: ProduitCatalogueDG): boolean {
  if (p.stocks_entrepot.every(e => e.rupture)) return false
  const couverture = couvertureJours(p)
  return (
    p.rentabilite === 'DEFICITAIRE'
    || p.engouement === 'EN_CHUTE'
    || p.rotation_jours >= 16
    || (couverture >= 22 && p.evolution_demande_pct <= 0)
    || (p.engouement === 'FAIBLE' && p.rotation_jours >= 12)
  )
}

function isProduitMoteur(p: ProduitCatalogueDG): boolean {
  if (p.stocks_entrepot.some(e => e.rupture)) return false
  return (
    p.engouement === 'FORT'
    || p.rotation_jours <= 8
    || p.sorties_mois >= 3_000
  )
}

function scoreMoteur(lent: ProduitCatalogueDG, moteur: ProduitCatalogueDG): number {
  if (lent.produit.id === moteur.produit.id) return -1
  let score = moteur.sorties_mois / 1000
  if (lent.stocks_entrepot[0]?.entrepot === moteur.stocks_entrepot[0]?.entrepot) score += 50
  if (lent.produit.categorie !== moteur.produit.categorie) score += 20
  if (moteur.engouement === 'FORT') score += 30
  if (moteur.marge_pct >= 14) score += 10
  return score
}

function pickMoteurs(lent: ProduitCatalogueDG, catalogue: ProduitCatalogueDG[], max = 2): ProduitCatalogueDG[] {
  return catalogue
    .filter(isProduitMoteur)
    .map(m => ({ m, score: scoreMoteur(lent, m) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(x => x.m)
}

function remisePourLent(lent: ProduitCatalogueDG): number {
  if (lent.rentabilite === 'DEFICITAIRE') return 20
  if (lent.engouement === 'EN_CHUTE') return 15
  if (lent.rotation_jours >= 25) return 18
  if (lent.rotation_jours >= 16) return 12
  return 8
}

function typeCombo(lent: ProduitCatalogueDG, nbMoteurs: number): TypeComboStock {
  if (lent.rentabilite === 'DEFICITAIRE' || lent.rotation_jours >= 28) return 'PROMO_CHOC'
  if (nbMoteurs >= 2) return 'BUNDLE_ADOPTION'
  return 'COMBO_MOTEUR'
}

function nomCombo(lent: ProduitStockProfil, moteurs: ProduitStockProfil[], type: TypeComboStock): string {
  const m = moteurs.map(x => x.nom.split(' ').slice(0, 2).join(' ')).join(' + ')
  const l = lent.nom.split(' ').slice(0, 3).join(' ')
  if (type === 'PROMO_CHOC') return `Promo choc — ${l} offert si ${m}`
  if (type === 'BUNDLE_ADOPTION') return `Bundle adoption — ${m} + ${l}`
  return `Combo écoulement — ${l} avec ${m}`
}

function buildCombo(
  lent: ProduitCatalogueDG,
  catalogue: ProduitCatalogueDG[],
  priorite: number,
): ComboStockIA | null {
  const moteursRaw = pickMoteurs(lent, catalogue)
  if (moteursRaw.length === 0) return null

  const lentP = profilFromProduit(lent)
  const moteursP = moteursRaw.map(profilFromProduit)
  const remise = remisePourLent(lent)
  const type = typeCombo(lent, moteursP.length)
  const prixLentPromo = Math.round(lentP.prix_fcfa * (1 - remise / 100))
  const prixCombo = moteursP.reduce((s, m) => s + m.prix_fcfa, 0) + prixLentPromo

  const stockALiberer = Math.min(
    lentP.stock - lentP.seuil,
    Math.max(40, Math.round(lentP.sorties_mois * 0.35)),
  )
  const pdvActifs = REGISTRE_PDV.filter(p => p.ca_mois > 0).length
  const contacts = Math.round(pdvActifs * (type === 'PROMO_CHOC' ? 0.45 : 0.32))

  const caPotentiel = Math.round(stockALiberer * prixLentPromo * 0.6 + moteursP.reduce((s, m) => s + m.sorties_mois * 0.08 * m.prix_fcfa, 0))
  const margeCombo = Math.round((lent.marge_pct * 0.85 + moteursRaw.reduce((s, m) => s + m.marge_pct, 0) / moteursRaw.length) / 2)

  const explication = type === 'PROMO_CHOC'
    ? `${lentP.nom} stagne : rotation ${lentP.rotation_jours}j, couverture ${lentP.couverture_jours}j, demande ${lentP.evolution_demande_pct > 0 ? '+' : ''}${lentP.evolution_demande_pct}%. Stock immobilisé ${formatFcfa(lentP.valeur_immobilisee_fcfa)} — coût estimé ${formatFcfa(lentP.cout_stock_lent_mois_fcfa)}/mois (capital + manque à gagner). L'IA propose une promo choc sur le lent UNIQUEMENT si le client commande ${moteursP.map(m => m.nom.split(' ').slice(0, 2).join(' ')).join(' et ')} — produits qui s'écoulent en ${moteursP.map(m => m.rotation_jours).join('/')}j.`
    : `${lentP.nom} peine à s'écouler (${lentP.rotation_jours}j rotation vs ${moteursP[0].rotation_jours}j pour ${moteursP[0].nom.split(' ')[0]}). Plutôt qu'une remise globale, attacher le SKU lent à un panier moteur déjà demandé facilite l'adoption : le client prend ce qu'il connaît + découvre le lent à prix incitatif (-${remise}%).`

  const offre = moteursP.length >= 2
    ? `Commandez ${moteursP.map(m => m.nom.split(' ').slice(0, 2).join(' ')).join(' + ')} → ${lentP.nom.split(' ').slice(0, 3).join(' ')} à ${formatFcfa(prixLentPromo)} au lieu de ${formatFcfa(lentP.prix_fcfa)} (-${remise}%)`
    : `Ajoutez ${moteursP[0].nom.split(' ').slice(0, 2).join(' ')} à votre commande → ${lentP.nom.split(' ').slice(0, 3).join(' ')} à -${remise}% (${formatFcfa(prixLentPromo)}/${lentP.nom.includes('pack') ? 'pack' : 'u.'})`

  return {
    id: `combo-${lent.produit.id}`,
    priorite,
    severite: lent.rentabilite === 'DEFICITAIRE' || lentP.cout_stock_lent_mois_fcfa >= 400_000 ? 'CRITIQUE' : lentP.rotation_jours >= 18 ? 'HAUTE' : 'MODEREE',
    type,
    nom: nomCombo(lentP, moteursP, type),
    explication,
    offre,
    lent: lentP,
    moteurs: moteursP,
    remise_lent_pct: remise,
    prix_lent_promo_fcfa: prixLentPromo,
    prix_combo_estime_fcfa: prixCombo,
    stock_a_liberer_unites: stockALiberer,
    cout_evite_mois_fcfa: lentP.cout_stock_lent_mois_fcfa,
    ca_potentiel_fcfa: caPotentiel,
    contacts_cibles: contacts,
    canal: 'WHATSAPP',
    zone: lentP.entrepot === 'Kara' ? 'Kara + Centrale' : 'Grand Lomé',
    marge_combo_pct: margeCombo,
    metriques: [
      { label: 'Unités à libérer', value: stockALiberer.toLocaleString('fr-FR') },
      { label: 'Coût stock évité/mois', value: formatFcfa(lentP.cout_stock_lent_mois_fcfa) },
      { label: 'CA potentiel combo', value: formatFcfa(caPotentiel) },
      { label: 'Marge combo est.', value: `${margeCombo}%` },
    ],
  }
}

export function buildAnalyseEcoulementStock(catalogue: ProduitCatalogueDG[]): AnalyseEcoulementStock {
  const lents = catalogue.filter(isStockLent)
  const moteurs = catalogue.filter(isProduitMoteur)
  const valeurLente = lents.reduce((s, p) => s + p.valeur_stock_immobilisee, 0)
  const coutTotal = lents.reduce((s, p) => s + profilFromProduit(p).cout_stock_lent_mois_fcfa, 0)

  const topLent = [...lents].sort((a, b) => profilFromProduit(b).cout_stock_lent_mois_fcfa - profilFromProduit(a).cout_stock_lent_mois_fcfa)[0]

  return {
    sku_lents: lents.length,
    sku_moteurs: moteurs.length,
    valeur_immobilisee_lente_fcfa: valeurLente,
    cout_stock_lent_total_mois_fcfa: coutTotal,
    synthese: `${lents.length} SKU peinent à s'écouler (${formatFcfa(valeurLente)} immobilisés, coût ~${formatFcfa(coutTotal)}/mois). ${moteurs.length} produits moteurs disponibles pour combos. Priorité : ${topLent ? topLent.produit.nom.split(' ').slice(0, 3).join(' ') : '—'} (rotation ${topLent?.rotation_jours ?? 0}j). L'IA recommande des combos « moteur + lent » plutôt que des promos choc isolées — le client adopte via ce qu'il commande déjà.`,
  }
}

export function buildCombosStockIA(): ComboStockIA[] {
  const catalogue = buildCatalogueDG()
  const lents = catalogue
    .filter(isStockLent)
    .sort((a, b) => profilFromProduit(b).cout_stock_lent_mois_fcfa - profilFromProduit(a).cout_stock_lent_mois_fcfa)

  const combos: ComboStockIA[] = []
  let priorite = 1
  for (const lent of lents) {
    const combo = buildCombo(lent, catalogue, priorite)
    if (combo) {
      combos.push(combo)
      priorite++
    }
    if (combos.length >= 6) break
  }

  return combos
}
