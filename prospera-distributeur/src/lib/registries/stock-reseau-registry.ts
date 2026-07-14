/**
 * Répartition physique du stock entre les entrepôts.
 *
 * Le catalogue (`stock-registry`) attribue à chaque référence **un** entrepôt et **une**
 * quantité. C'est une vue comptable : elle dit ce que la société possède, pas où c'est posé.
 *
 * Or un distributeur à deux plateformes ne range pas ses palettes ainsi. Les références qui
 * tournent partout — l'eau, le riz, l'huile, le savon — sont stockées **des deux côtés**,
 * parce que faire monter chaque palette d'eau de Lomé à Kara à la demande coûterait plus cher
 * que le produit. Les références de niche restent sur la plateforme principale.
 *
 * Ce registre porte donc la répartition, et **rien d'autre** : il découpe les quantités
 * existantes, il n'en invente aucune. Le total réseau d'une référence reste exactement celui
 * du catalogue — aucun autre écran ne voit sa valeur ni ses ruptures bouger.
 *
 * Sans cette répartition, le rééquilibrage inter-entrepôts est structurellement impossible :
 * on ne peut pas transférer vers Kara une référence que Kara ne stocke pas.
 */

import { REGISTRE_STOCK } from './stock-registry'

export interface StockSite {
  produit_ref: string
  entrepot: string
  quantite: number
  seuil: number
  /** Site principal de la référence — celui qui la reçoit du fournisseur. */
  principal: boolean
}

/**
 * Références stockées sur les deux plateformes, avec la part que Kara détient.
 *
 * Kara est un dépôt régional : il tient de quoi servir le nord sans navette quotidienne,
 * jamais plus. La part est donc faible, et calée sur le poids du nord dans les ventes.
 */
const PART_KARA: Record<string, number> = {
  // Volumes lourds et incompressibles — impensable de les monter à la demande.
  'PRD-EAU-1.5L': 0.22,
  'PRD-EAU-50CL': 0.20,
  'PRD-RIZ-25KG': 0.25,
  'PRD-HUILE-5L': 0.28,
  'PRD-FARINE-25KG': 0.24,
  'PRD-SUCRE-1KG': 0.20,
  // Rotations rapides du quotidien.
  'PRD-COCA-33CL': 0.18,
  'PRD-BIERE-33CL': 0.15,
  'PRD-PATES-500G': 0.22,
  'PRD-TOMATE-400G': 0.20,
  'PRD-DETERGENT-5L': 0.30,
  'PRD-JAVEL-1L': 0.25,
}

/**
 * Références du dépôt de Kara également tenues à Lomé Port — la plateforme principale
 * garde toujours un tampon des références qu'elle réapprovisionne pour le nord.
 */
const PART_LOME_SUR_REFS_KARA: Record<string, number> = {
  'PRD-SAVON-PACK': 0.45,
  'PRD-LAIT-400G': 0.40,
  'PRD-CAFE-200G': 0.35,
  'PRD-SARDINE-125G': 0.40,
}

/** Le seuil suit la part : un dépôt qui tient 20 % du stock déclenche sur 20 % du seuil. */
function seuilProrata(seuilTotal: number, part: number): number {
  return Math.max(10, Math.round(seuilTotal * part))
}

/**
 * La répartition. Le total par référence est conservé au colis près : ce qui est retiré
 * du site principal est ce qui est posé sur le site secondaire.
 */
export const REPARTITION_STOCK: StockSite[] = REGISTRE_STOCK.flatMap(p => {
  const partSecondaire = p.entrepot === 'Lomé Port'
    ? PART_KARA[p.reference]
    : PART_LOME_SUR_REFS_KARA[p.reference]

  if (!partSecondaire) {
    return [{
      produit_ref: p.reference,
      entrepot: p.entrepot,
      quantite: p.stock,
      seuil: p.seuil,
      principal: true,
    }]
  }

  const siteSecondaire = p.entrepot === 'Lomé Port' ? 'Kara' : 'Lomé Port'
  const quantiteSecondaire = Math.round(p.stock * partSecondaire)

  return [
    {
      produit_ref: p.reference,
      entrepot: p.entrepot,
      // Le reste, et pas un arrondi indépendant : le total réseau doit tomber juste.
      quantite: p.stock - quantiteSecondaire,
      seuil: seuilProrata(p.seuil, 1 - partSecondaire),
      principal: true,
    },
    {
      produit_ref: p.reference,
      entrepot: siteSecondaire,
      quantite: quantiteSecondaire,
      seuil: seuilProrata(p.seuil, partSecondaire),
      principal: false,
    },
  ]
})

/** Ce qu'un site détient d'une référence. 0 s'il ne la stocke pas. */
export function stockDuSite(ref: string, entrepot: string): number {
  return REPARTITION_STOCK.find(s => s.produit_ref === ref && s.entrepot === entrepot)?.quantite ?? 0
}

export function ligneDuSite(ref: string, entrepot: string): StockSite | undefined {
  return REPARTITION_STOCK.find(s => s.produit_ref === ref && s.entrepot === entrepot)
}

/** Les sites qui stockent la référence. */
export function sitesDuProduit(ref: string): StockSite[] {
  return REPARTITION_STOCK.filter(s => s.produit_ref === ref)
}

/** Les références présentes sur un site. */
export function referencesDuSite(entrepot: string): StockSite[] {
  return REPARTITION_STOCK.filter(s => s.entrepot === entrepot)
}

/**
 * Poids du nord (Kara + Centrale) dans les ventes du réseau.
 *
 * Le Grand Lomé concentre l'essentiel de la consommation : le dépôt de Kara sert environ
 * un cinquième de la demande nationale. C'est une donnée **commerciale**, indépendante de
 * l'endroit où les palettes sont posées.
 */
export const PART_DEMANDE_NORD = 0.18

/**
 * Part des ventes d'une référence écoulée par un site — sert à ramener la demande réseau
 * à la vitesse d'écoulement locale. Sans ça, on calculerait la couverture de Kara avec la
 * demande du pays entier, et Kara semblerait perpétuellement en rupture.
 *
 * Point crucial : cette part vient de la **demande**, jamais de la répartition du stock.
 * Les déduire l'une de l'autre serait une tautologie — la couverture des deux sites serait
 * égale par construction, et aucun déséquilibre ne pourrait jamais être détecté. Or c'est
 * précisément l'écart entre « où sont les palettes » et « où sont les clients » qui crée le
 * besoin de transfert.
 */
export function partDesVentes(ref: string, entrepot: string): number {
  const sites = sitesDuProduit(ref)
  if (sites.length === 0) return 0

  // Référence mono-site : elle sert toute la demande depuis là où elle est.
  if (sites.length === 1) return sites[0].entrepot === entrepot ? 1 : 0

  return entrepot === 'Kara' ? PART_DEMANDE_NORD : 1 - PART_DEMANDE_NORD
}
