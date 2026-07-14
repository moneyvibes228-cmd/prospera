import type { CommandeFournisseur, StatutCommandeFournisseur, StatutPaiementFournisseur } from '@/types'

/**
 * Commandes fournisseurs en cours (spec V2 §5.3).
 * Les commandes `RECUE` ont généré l'entrée en stock et la dette portée par le fournisseur ;
 * les commandes suggérées par le moteur sont produites à la volée par `reappro-engine.ts`.
 */

const TVA = 0.18

function ttc(ht: number): number {
  return Math.round(ht * (1 + TVA))
}

export const REGISTRE_COMMANDES_FOURNISSEURS: CommandeFournisseur[] = [
  {
    id: 'cf-1', reference: 'CF-2026-0085',
    fournisseur_id: 'frn-4', fournisseur_nom: 'Source Eau Togo SA',
    entrepot_destination: 'Lomé Port', statut: 'ENVOYEE', origine: 'AUTO_IA',
    regle_declenchee: 'reg-1',
    lignes: [
      { produit_ref: 'PRD-EAU-1.5L', produit_nom: 'Eau minérale 1,5L (pack 12)', quantite_commandee: 400, prix_achat_unitaire: 3_110, total: 1_244_000, motif: 'SEUIL_ATTEINT' },
      { produit_ref: 'PRD-EAU-50CL', produit_nom: 'Eau minérale 50cl (pack 24)', quantite_commandee: 200, prix_achat_unitaire: 2_070, total: 414_000, motif: 'REGROUPEMENT' },
    ],
    montant_ht: 1_658_000, montant_ttc: ttc(1_658_000),
    date_creation: '2026-06-10', date_envoi: '2026-06-10', date_livraison_prevue: '2026-06-15',
    echeance_paiement: '2026-07-15', statut_paiement: 'NON_DUE', montant_paye: 0,
    justification_ia: 'Montant 1,96 M TTC sous le plafond automatique de 3 M — envoi sans validation humaine. Source Eau : 96 % de livraisons conformes, délai réel 5,2 j.',
    economie_regroupement: 180_000,
  },
  {
    id: 'cf-2', reference: 'CF-2026-0084',
    fournisseur_id: 'frn-3', fournisseur_nom: 'Brasserie du Golfe',
    entrepot_destination: 'Lomé Port', statut: 'EN_TRANSIT', origine: 'MANUELLE',
    lignes: [
      { produit_ref: 'PRD-BIERE-33CL', produit_nom: 'Bière locale 33cl (pack 24)', quantite_commandee: 300, prix_achat_unitaire: 8_290, total: 2_487_000, motif: 'MANUEL' },
      { produit_ref: 'PRD-BIERE-65CL', produit_nom: 'Bière locale 65cl (pack 12)', quantite_commandee: 150, prix_achat_unitaire: 6_590, total: 988_500, motif: 'REGROUPEMENT' },
    ],
    montant_ht: 3_475_500, montant_ttc: ttc(3_475_500),
    date_creation: '2026-06-06', date_envoi: '2026-06-06', date_livraison_prevue: '2026-06-12',
    echeance_paiement: '2026-07-12', statut_paiement: 'NON_DUE', montant_paye: 0,
    economie_regroupement: 45_000,
  },
  {
    id: 'cf-3', reference: 'CF-2026-0081',
    fournisseur_id: 'frn-1', fournisseur_nom: 'Huiles Ouest Afrique',
    entrepot_destination: 'Lomé Port', statut: 'RECUE_PARTIELLE', origine: 'MANUELLE',
    lignes: [
      { produit_ref: 'PRD-HUILE-5L', produit_nom: 'Huile végétale 5L', quantite_commandee: 800, quantite_recue: 540, prix_achat_unitaire: 6_310, total: 5_048_000, motif: 'SEUIL_ATTEINT' },
    ],
    montant_ht: 5_048_000, montant_ttc: ttc(5_048_000),
    date_creation: '2026-05-20', date_envoi: '2026-05-20', date_livraison_prevue: '2026-06-03',
    date_livraison_reelle: '2026-06-09',
    echeance_paiement: '2026-07-09', statut_paiement: 'A_PAYER', montant_paye: 2_000_000,
    justification_ia: 'Livraison partielle 540/800 avec 6 j de retard — c\'est la cause directe de la rupture huile 5L. Bascule Sotra Négoce recommandée sur le reliquat.',
  },
  {
    id: 'cf-4', reference: 'CF-2026-0079',
    fournisseur_id: 'frn-8', fournisseur_nom: 'Clean Home Import',
    entrepot_destination: 'Lomé Port', statut: 'LITIGE', origine: 'MANUELLE',
    lignes: [
      { produit_ref: 'PRD-DETERGENT-5L', produit_nom: 'Détergent liquide 5L', quantite_commandee: 300, quantite_recue: 210, prix_achat_unitaire: 5_610, total: 1_683_000, motif: 'SEUIL_ATTEINT' },
      { produit_ref: 'PRD-JAVEL-1L', produit_nom: 'Eau de Javel 1L (carton 12)', quantite_commandee: 200, quantite_recue: 200, prix_achat_unitaire: 1_510, total: 302_000, motif: 'REGROUPEMENT' },
    ],
    montant_ht: 1_985_000, montant_ttc: ttc(1_985_000),
    date_creation: '2026-05-08', date_envoi: '2026-05-08', date_livraison_prevue: '2026-05-20',
    date_livraison_reelle: '2026-05-29',
    echeance_paiement: '2026-06-13', statut_paiement: 'ECHUE', montant_paye: 0,
    justification_ia: '90 bidons manquants et 9 j de retard — litige ouvert, fournisseur suspendu. Dette 3,4 M échue : à solder ou à compenser sur l\'avoir en cours.',
  },
  {
    id: 'cf-5', reference: 'CF-2026-0078',
    fournisseur_id: 'frn-2', fournisseur_nom: 'Riz Import Vietnam',
    entrepot_destination: 'Lomé Port', statut: 'RECUE', origine: 'MANUELLE',
    lignes: [
      { produit_ref: 'PRD-RIZ-25KG', produit_nom: 'Riz parfumé 25 kg', quantite_commandee: 600, quantite_recue: 600, prix_achat_unitaire: 12_100, total: 7_260_000, motif: 'PREVISION_RUPTURE' },
    ],
    montant_ht: 7_260_000, montant_ttc: ttc(7_260_000),
    date_creation: '2026-05-02', date_envoi: '2026-05-02', date_livraison_prevue: '2026-05-23',
    date_livraison_reelle: '2026-05-27',
    echeance_paiement: '2026-07-11', statut_paiement: 'PARTIEL', montant_paye: 3_000_000,
  },
  {
    id: 'cf-6', reference: 'CF-2026-0076',
    fournisseur_id: 'frn-6', fournisseur_nom: 'Nestlé Distribution Kara',
    entrepot_destination: 'Kara', statut: 'RECUE', origine: 'AUTO_IA',
    regle_declenchee: 'reg-9',
    lignes: [
      { produit_ref: 'PRD-LAIT-400G', produit_nom: 'Lait concentré 400g (pack 24)', quantite_commandee: 250, quantite_recue: 250, prix_achat_unitaire: 3_950, total: 987_500, motif: 'SEUIL_ATTEINT' },
      { produit_ref: 'PRD-CAFE-200G', produit_nom: 'Café soluble 200g (carton 12)', quantite_commandee: 150, quantite_recue: 150, prix_achat_unitaire: 5_170, total: 775_500, motif: 'REGROUPEMENT' },
    ],
    montant_ht: 1_763_000, montant_ttc: ttc(1_763_000),
    date_creation: '2026-05-28', date_envoi: '2026-05-28', date_livraison_prevue: '2026-06-03',
    date_livraison_reelle: '2026-06-03',
    echeance_paiement: '2026-07-03', statut_paiement: 'A_PAYER', montant_paye: 0,
    economie_regroupement: 62_000,
  },
  {
    id: 'cf-7', reference: 'CF-2026-0075',
    fournisseur_id: 'frn-7', fournisseur_nom: 'Hygiène Pro Afrique',
    entrepot_destination: 'Kara', statut: 'CONFIRMEE', origine: 'AUTO_IA',
    regle_declenchee: 'reg-4',
    lignes: [
      { produit_ref: 'PRD-SHAMPOO-400ML', produit_nom: 'Shampooing 400ml (carton 24)', quantite_commandee: 100, prix_achat_unitaire: 6_090, total: 609_000, motif: 'SEUIL_ATTEINT' },
      { produit_ref: 'PRD-COUCHE-PK', produit_nom: 'Couches bébé (pack 6)', quantite_commandee: 60, prix_achat_unitaire: 10_770, total: 646_200, motif: 'REGROUPEMENT' },
    ],
    montant_ht: 1_255_200, montant_ttc: ttc(1_255_200),
    date_creation: '2026-06-08', date_envoi: '2026-06-08', date_livraison_prevue: '2026-06-16',
    echeance_paiement: '2026-07-16', statut_paiement: 'NON_DUE', montant_paye: 0,
    economie_regroupement: 38_000,
  },
  {
    id: 'cf-8', reference: 'CF-2026-0072',
    fournisseur_id: 'frn-5', fournisseur_nom: 'Coca-Cola Togo',
    entrepot_destination: 'Lomé Port', statut: 'RECUE', origine: 'MANUELLE',
    lignes: [
      { produit_ref: 'PRD-COCA-33CL', produit_nom: 'Soda 33cl (pack 24)', quantite_commandee: 400, quantite_recue: 400, prix_achat_unitaire: 7_540, total: 3_016_000, motif: 'MANUEL' },
    ],
    montant_ht: 3_016_000, montant_ttc: ttc(3_016_000),
    date_creation: '2026-05-25', date_envoi: '2026-05-25', date_livraison_prevue: '2026-06-01',
    date_livraison_reelle: '2026-06-02',
    echeance_paiement: '2026-06-28', statut_paiement: 'A_PAYER', montant_paye: 0,
  },
]

export const STATUT_CF_STYLE: Record<StatutCommandeFournisseur, { label: string; className: string }> = {
  SUGGEREE_IA:    { label: 'Suggérée IA',    className: 'bg-indigo-100 text-indigo-700' },
  BROUILLON:      { label: 'Brouillon',      className: 'bg-slate-100 text-slate-600' },
  EN_VALIDATION:  { label: 'En validation',  className: 'bg-amber-100 text-amber-700' },
  ENVOYEE:        { label: 'Envoyée',        className: 'bg-sky-100 text-sky-700' },
  CONFIRMEE:      { label: 'Confirmée',      className: 'bg-cyan-100 text-cyan-700' },
  EN_TRANSIT:     { label: 'En transit',     className: 'bg-blue-100 text-blue-700' },
  RECUE_PARTIELLE:{ label: 'Reçue partielle',className: 'bg-orange-100 text-orange-700' },
  RECUE:          { label: 'Reçue',          className: 'bg-emerald-100 text-emerald-700' },
  ANNULEE:        { label: 'Annulée',        className: 'bg-slate-100 text-slate-400' },
  LITIGE:         { label: 'Litige',         className: 'bg-red-100 text-red-700' },
}

export const STATUT_PAIEMENT_STYLE: Record<StatutPaiementFournisseur, { label: string; className: string }> = {
  NON_DUE: { label: 'Non due',  className: 'bg-slate-100 text-slate-500' },
  A_PAYER: { label: 'À payer',  className: 'bg-amber-100 text-amber-700' },
  PARTIEL: { label: 'Partiel',  className: 'bg-sky-100 text-sky-700' },
  PAYEE:   { label: 'Payée',    className: 'bg-emerald-100 text-emerald-700' },
  ECHUE:   { label: 'Échue',    className: 'bg-red-100 text-red-700' },
}

/** Pipeline affiché sur l'onglet « Commandes fournisseurs ». */
export const PIPELINE_CF: StatutCommandeFournisseur[] = [
  'SUGGEREE_IA', 'EN_VALIDATION', 'ENVOYEE', 'CONFIRMEE', 'EN_TRANSIT', 'RECUE_PARTIELLE', 'RECUE',
]

export function getCommandeFournisseurById(id: string): CommandeFournisseur | undefined {
  return REGISTRE_COMMANDES_FOURNISSEURS.find(c => c.id === id)
}

export function getCommandesDuFournisseur(fournisseurId: string): CommandeFournisseur[] {
  return REGISTRE_COMMANDES_FOURNISSEURS.filter(c => c.fournisseur_id === fournisseurId)
}
