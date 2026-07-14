import type { ProduitFournisseur } from '@distributeur/types'
import { REGISTRE_STOCK } from './stock-registry'
import { getFournisseurById } from './fournisseurs-registry'

/**
 * Appairage produit → fournisseurs (spec V2 §5.1).
 * Règle : chaque produit a au moins 2 fournisseurs référencés — 1 prioritaire, 1 de secours —
 * sans quoi le moteur de réappro n'a pas de bascule possible en cas de rupture ou de suspension.
 */

/** Couple (prioritaire, secours) par défaut selon la famille produit. */
const COUPLE_PAR_CATEGORIE: Record<string, [string, string]> = {
  Boissons: ['frn-4', 'frn-5'],
  Alimentaire: ['frn-6', 'frn-9'],
  'Hygiène': ['frn-7', 'frn-8'],
  Entretien: ['frn-7', 'frn-9'],
}

/** Produits dont le sourcing réel diffère de la règle de famille. */
const COUPLE_PAR_PRODUIT: Record<string, [string, string]> = {
  'PRD-HUILE-5L': ['frn-1', 'frn-9'],
  'PRD-HUILE-1L': ['frn-1', 'frn-9'],
  'PRD-RIZ-25KG': ['frn-2', 'frn-9'],
  'PRD-FARINE-25KG': ['frn-2', 'frn-6'],
  'PRD-HARICOT-1KG': ['frn-2', 'frn-9'],
  'PRD-BIERE-33CL': ['frn-3', 'frn-5'],
  'PRD-BIERE-65CL': ['frn-3', 'frn-5'],
  'PRD-COCA-33CL': ['frn-5', 'frn-3'],
  'PRD-ENERGY-25CL': ['frn-5', 'frn-10'],
  'PRD-JUS-1L': ['frn-10', 'frn-4'],
  'PRD-SIROP-1L': ['frn-10', 'frn-4'],
  'PRD-EAU-1.5L': ['frn-4', 'frn-3'],
  'PRD-EAU-50CL': ['frn-4', 'frn-3'],
  'PRD-DETERGENT-5L': ['frn-8', 'frn-7'],
  'PRD-JAVEL-1L': ['frn-8', 'frn-7'],
}

/** Conditionnement d'achat — les quantités commandées sont arrondies à ce multiple. */
function lotAchat(prixUnitaire: number): number {
  if (prixUnitaire >= 15_000) return 20
  if (prixUnitaire >= 8_000) return 50
  if (prixUnitaire >= 4_000) return 100
  return 200
}

/** Le prioritaire est référencé au meilleur prix ; le secours coûte 6 à 9 % de plus. */
function prixAchat(prixVente: number, prioritaire: boolean, competitivite: number): number {
  const base = prixVente * (prioritaire ? 0.74 : 0.80)
  const ajustement = 1 + (85 - competitivite) / 500
  return Math.round((base * ajustement) / 10) * 10
}

function buildRegistre(): ProduitFournisseur[] {
  const lignes: ProduitFournisseur[] = []

  for (const produit of REGISTRE_STOCK) {
    const couple = COUPLE_PAR_PRODUIT[produit.reference]
      ?? COUPLE_PAR_CATEGORIE[produit.categorie]
      ?? ['frn-9', 'frn-6']

    couple.forEach((fournisseurId, index) => {
      const fournisseur = getFournisseurById(fournisseurId)
      if (!fournisseur) return
      const prioritaire = index === 0
      const lot = lotAchat(produit.prix_unitaire)
      lignes.push({
        produit_ref: produit.reference,
        fournisseur_id: fournisseurId,
        prix_achat: prixAchat(produit.prix_unitaire, prioritaire, fournisseur.competitivite_prix),
        delai_j: fournisseur.delai_livraison_j,
        quantite_min: lot,
        quantite_lot: lot,
        prioritaire,
        date_dernier_achat: prioritaire ? '2026-06-04' : '2026-05-12',
      })
    })
  }

  return lignes
}

export const REGISTRE_PRODUITS_FOURNISSEURS: ProduitFournisseur[] = buildRegistre()

export function getFournisseursDuProduit(produitRef: string): ProduitFournisseur[] {
  return REGISTRE_PRODUITS_FOURNISSEURS.filter(pf => pf.produit_ref === produitRef)
}

export function getFournisseurPrioritaire(produitRef: string): ProduitFournisseur | undefined {
  return REGISTRE_PRODUITS_FOURNISSEURS.find(pf => pf.produit_ref === produitRef && pf.prioritaire)
}

/** Produits fournis par un fournisseur — alimente sa fiche. */
export function getProduitsDuFournisseur(fournisseurId: string): ProduitFournisseur[] {
  return REGISTRE_PRODUITS_FOURNISSEURS.filter(pf => pf.fournisseur_id === fournisseurId)
}
