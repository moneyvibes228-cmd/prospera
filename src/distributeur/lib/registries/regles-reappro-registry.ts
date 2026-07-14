import type { NiveauAutomatisation, RegleReappro, UserRole } from '@distributeur/types'
import { REGISTRE_STOCK } from './stock-registry'
import { getFournisseurPrioritaire } from './produits-fournisseurs-registry'

/**
 * Règles de réapprovisionnement par produit (spec V2 §5.2).
 * `PROPOSITION` est le défaut : le moteur prépare la commande, un humain la valide.
 * L'automatisation totale reste réservée aux produits à rotation rapide et fournisseur fiable.
 */

/** Le valideur dépend du montant : au-delà du plafond du poste, la décision remonte. */
export const PLAFONDS_VALIDATION: Record<'RESP_STOCK' | 'DAF' | 'DG', number> = {
  RESP_STOCK: 5_000_000,
  DAF: 20_000_000,
  DG: Number.POSITIVE_INFINITY,
}

export function valideurPourMontant(montant: number): Extract<UserRole, 'RESP_STOCK' | 'DAF' | 'DG'> {
  if (montant <= PLAFONDS_VALIDATION.RESP_STOCK) return 'RESP_STOCK'
  if (montant <= PLAFONDS_VALIDATION.DAF) return 'DAF'
  return 'DG'
}

/** Réglages qui s'écartent du défaut — produits stratégiques ou fournisseur peu fiable. */
const REGLAGES: Record<string, Partial<RegleReappro>> = {
  'PRD-HUILE-5L': {
    couverture_min_jours: 12, mode_quantite: 'PREVISION_IA',
    niveau_auto: 'PROPOSITION', plafond_auto_fcfa: 0, valideur_role: 'RESP_STOCK',
  },
  'PRD-RIZ-25KG': {
    couverture_min_jours: 18, mode_quantite: 'PREVISION_IA',
    niveau_auto: 'PROPOSITION', plafond_auto_fcfa: 0, valideur_role: 'DAF',
  },
  'PRD-EAU-1.5L': {
    couverture_min_jours: 7, mode_quantite: 'PREVISION_IA',
    niveau_auto: 'AUTO_SI_SOUS_PLAFOND', plafond_auto_fcfa: 3_000_000, valideur_role: 'RESP_STOCK',
  },
  'PRD-EAU-50CL': {
    couverture_min_jours: 7, mode_quantite: 'PREVISION_IA',
    niveau_auto: 'AUTO_SI_SOUS_PLAFOND', plafond_auto_fcfa: 3_000_000, valideur_role: 'RESP_STOCK',
  },
  'PRD-BIERE-33CL': {
    couverture_min_jours: 6, mode_quantite: 'PREVISION_IA',
    niveau_auto: 'AUTO_SI_SOUS_PLAFOND', plafond_auto_fcfa: 2_500_000, valideur_role: 'RESP_STOCK',
  },
  'PRD-SAVON-PACK': {
    couverture_min_jours: 10, mode_quantite: 'STOCK_CIBLE',
    niveau_auto: 'PROPOSITION', plafond_auto_fcfa: 0, valideur_role: 'RESP_STOCK',
  },
  // Fournisseur suspendu (Clean Home) : on alerte, on ne commande pas seul.
  'PRD-DETERGENT-5L': {
    couverture_min_jours: 10, mode_quantite: 'STOCK_CIBLE',
    niveau_auto: 'ALERTE_SEULE', plafond_auto_fcfa: 0, valideur_role: 'RESP_STOCK',
  },
  'PRD-JAVEL-1L': {
    niveau_auto: 'ALERTE_SEULE', plafond_auto_fcfa: 0, valideur_role: 'RESP_STOCK',
  },
}

const DEFAUT: Omit<RegleReappro, 'id' | 'produit_ref' | 'seuil_stock' | 'stock_cible' | 'fournisseur_prefere_id'> = {
  actif: true,
  couverture_min_jours: 10,
  mode_quantite: 'PREVISION_IA',
  niveau_auto: 'PROPOSITION',
  plafond_auto_fcfa: 0,
  valideur_role: 'RESP_STOCK',
}

export const REGISTRE_REGLES_REAPPRO: RegleReappro[] = REGISTRE_STOCK.map((produit, i) => {
  const reglage = REGLAGES[produit.reference] ?? {}
  return {
    ...DEFAUT,
    id: `reg-${i + 1}`,
    produit_ref: produit.reference,
    seuil_stock: produit.seuil,
    /** Cible = 2,5 × le seuil : de quoi sortir de l'alerte sans surstocker. */
    stock_cible: Math.round(produit.seuil * 2.5),
    fournisseur_prefere_id: getFournisseurPrioritaire(produit.reference)?.fournisseur_id,
    ...reglage,
  }
})

export function getRegleProduit(produitRef: string): RegleReappro | undefined {
  return REGISTRE_REGLES_REAPPRO.find(r => r.produit_ref === produitRef && r.actif)
}

export const NIVEAU_AUTO_LABEL: Record<NiveauAutomatisation, { label: string; detail: string; className: string }> = {
  ALERTE_SEULE: {
    label: 'Alerte seule', detail: 'Notifie, ne commande pas',
    className: 'bg-slate-100 text-slate-600',
  },
  PROPOSITION: {
    label: 'Proposition', detail: 'Brouillon de commande à valider',
    className: 'bg-sky-100 text-sky-700',
  },
  AUTO_SI_SOUS_PLAFOND: {
    label: 'Auto sous plafond', detail: 'Envoi seul si le montant reste sous le plafond',
    className: 'bg-amber-100 text-amber-700',
  },
  AUTO_TOTAL: {
    label: 'Automatique', detail: 'Envoi systématique sans validation',
    className: 'bg-emerald-100 text-emerald-700',
  },
}

/** Journal des déclenchements — traçabilité de l'automatisation (onglet Règles). */
export interface DeclenchementReappro {
  id: string
  date: string
  produit_ref: string
  produit_nom: string
  niveau_auto: NiveauAutomatisation
  resultat: string
  commande_ref?: string
}

export const JOURNAL_DECLENCHEMENTS: DeclenchementReappro[] = [
  {
    id: 'dec-1', date: '2026-06-11 06:02', produit_ref: 'PRD-HUILE-5L', produit_nom: 'Huile végétale 5L',
    niveau_auto: 'PROPOSITION',
    resultat: 'Stock 180 sous le seuil 200 · commande suggérée 1 400 u. — en attente de validation Resp. Stock',
    commande_ref: 'CF-2026-0087',
  },
  {
    id: 'dec-2', date: '2026-06-11 06:02', produit_ref: 'PRD-SAVON-PACK', produit_nom: 'Savon ménager (carton 48)',
    niveau_auto: 'PROPOSITION',
    resultat: 'Couverture 4,4 j < 10 j · regroupée avec Hygiène Pro pour atteindre le franco de port',
    commande_ref: 'CF-2026-0088',
  },
  {
    id: 'dec-3', date: '2026-06-10 06:01', produit_ref: 'PRD-EAU-1.5L', produit_nom: 'Eau minérale 1,5L (pack 12)',
    niveau_auto: 'AUTO_SI_SOUS_PLAFOND',
    resultat: 'Commande 1,8 M sous le plafond 3 M · envoyée automatiquement à Source Eau Togo',
    commande_ref: 'CF-2026-0085',
  },
  {
    id: 'dec-4', date: '2026-06-10 06:01', produit_ref: 'PRD-DETERGENT-5L', produit_nom: 'Détergent liquide 5L',
    niveau_auto: 'ALERTE_SEULE',
    resultat: 'Stock 88 sous le seuil 100 — fournisseur Clean Home suspendu, aucune commande émise. Bascule Hygiène Pro à arbitrer.',
  },
  {
    id: 'dec-5', date: '2026-06-09 06:03', produit_ref: 'PRD-RIZ-25KG', produit_nom: 'Riz parfumé 25 kg',
    niveau_auto: 'PROPOSITION',
    resultat: 'Couverture 21,5 j > 18 j — aucun déclenchement, stock suffisant',
  },
]
