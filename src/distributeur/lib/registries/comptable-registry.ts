/**
 * Registre du poste comptable — la matière première de son travail quotidien.
 *
 * Le DAF arbitre, le comptable produit. Ce qui vit ici n'est jamais une décision :
 * ce sont des pièces à rapprocher, des encaissements à lettrer, des écarts de caisse
 * à justifier, une déclaration à sortir avant le 15. C'est le quotidien réel d'une
 * compta de distributeur, où l'essentiel du cash rentre en espèces et en Mobile Money
 * depuis le terrain, jamais proprement rattaché à une facture.
 */

// ─────────────────────────────────────────────────────────────
// 1. Lettrage client (411) — le vrai quotidien
// ─────────────────────────────────────────────────────────────

export interface EncaissementALettrer {
  id: string
  date: string
  mode: 'MOBILE_MONEY' | 'ESPECES' | 'VIREMENT' | 'CHEQUE'
  montant: number
  /** Ce qui apparaît sur le relevé ou le SMS MoMo — souvent illisible. */
  reference_brute: string
  /** Facture proposée par le rapprochement automatique. */
  facture_proposee?: string
  client_propose?: string
  /** Confiance du rapprochement — sous 70 %, le comptable doit trancher à la main. */
  confiance: number
  /** Pourquoi ça ne matche pas tout seul. */
  difficulte?: string
  anciennete_j: number
}

export const ENCAISSEMENTS_A_LETTRER: EncaissementALettrer[] = [
  {
    id: 'let-1', date: '2026-06-11', mode: 'MOBILE_MONEY', montant: 620_000,
    reference_brute: 'TMONEY 22890***441 — "PAIEMENT"',
    facture_proposee: 'FAC-8841', client_propose: 'Dépôt Sokodé', confiance: 94,
    anciennete_j: 0,
  },
  {
    id: 'let-2', date: '2026-06-10', mode: 'ESPECES', montant: 1_450_000,
    reference_brute: 'Remise caisse Agoè — bordereau BR-3312',
    facture_proposee: 'FAC-8830', client_propose: 'Dépôt Agoè Plage', confiance: 71,
    difficulte: 'Montant remis 1,45 M mais la facture est à 1,82 M — paiement partiel ou remise groupée ?',
    anciennete_j: 1,
  },
  {
    id: 'let-3', date: '2026-06-09', mode: 'MOBILE_MONEY', montant: 340_000,
    reference_brute: 'FLOOZ 90***227 — "KOMLAN"',
    confiance: 38,
    difficulte: 'Aucune facture de ce montant. Nom du commercial, pas du client — encaissement terrain non déclaré ?',
    anciennete_j: 2,
  },
  {
    id: 'let-4', date: '2026-06-08', mode: 'VIREMENT', montant: 2_400_000,
    reference_brute: 'VIR ECOBANK — ETS AKOSSOMBO SARL',
    facture_proposee: 'FAC-8836', client_propose: 'Boutique Akossombo', confiance: 88,
    difficulte: 'Le client règle 2 factures en un seul virement — à ventiler sur FAC-8836 et FAC-8839.',
    anciennete_j: 3,
  },
  {
    id: 'let-5', date: '2026-06-05', mode: 'ESPECES', montant: 180_000,
    reference_brute: 'Caisse Kara — sans bordereau',
    confiance: 12,
    difficulte: 'Espèces déposées sans pièce justificative. À réclamer au gestionnaire d\'entrepôt.',
    anciennete_j: 6,
  },
]

// ─────────────────────────────────────────────────────────────
// 2. Caisses terrain — la plaie d'un distributeur
// ─────────────────────────────────────────────────────────────

export interface RemiseCaisse {
  id: string
  commercial: string
  zone: string
  /** Ce que le système dit qu'il a encaissé sur sa tournée. */
  encaisse_theorique: number
  /** Ce qu'il a effectivement remis à la caisse. */
  remis: number
  ecart: number
  date_tournee: string
  jours_sans_remise: number
  statut: 'CONFORME' | 'ECART' | 'NON_REMIS'
}

export const REMISES_CAISSE: RemiseCaisse[] = [
  {
    id: 'rem-1', commercial: 'Kofi Agbessi', zone: 'Lomé Est',
    encaisse_theorique: 1_450_000, remis: 1_450_000, ecart: 0,
    date_tournee: '2026-06-10', jours_sans_remise: 0, statut: 'CONFORME',
  },
  {
    id: 'rem-2', commercial: 'Komlan Tetteh', zone: 'Lomé Port',
    encaisse_theorique: 890_000, remis: 870_000, ecart: -20_000,
    date_tournee: '2026-06-09', jours_sans_remise: 2, statut: 'ECART',
  },
  {
    id: 'rem-3', commercial: 'Efua Koffi', zone: 'Kara',
    encaisse_theorique: 1_240_000, remis: 0, ecart: -1_240_000,
    date_tournee: '2026-06-06', jours_sans_remise: 5, statut: 'NON_REMIS',
  },
  {
    id: 'rem-4', commercial: 'Mawuena Ahi', zone: 'Lomé Ouest',
    encaisse_theorique: 2_100_000, remis: 2_100_000, ecart: 0,
    date_tournee: '2026-06-10', jours_sans_remise: 0, statut: 'CONFORME',
  },
]

// ─────────────────────────────────────────────────────────────
// 3. Déclaration TVA — l'échéance qui ne se négocie pas
// ─────────────────────────────────────────────────────────────

export const DECLARATION_TVA = {
  periode: 'Mai 2026',
  date_limite: '2026-06-15',
  jours_restants: 4,
  /** 443100 — TVA collectée sur les ventes. */
  tva_collectee: 13_240_000,
  /** 445200 — TVA déductible sur les achats. */
  tva_deductible: 6_400_000,
  /** Crédit de TVA reporté du mois précédent. */
  credit_reporte: 0,
  statut: 'A_PREPARER' as 'A_PREPARER' | 'PRETE' | 'TELEDECLAREE',
  /** Ce qui empêche de boucler la déclaration aujourd'hui. */
  bloquants: [
    { libelle: '3 factures d\'achat non saisies — TVA déductible manquante', impact: 940_000 },
    { libelle: '1 avoir client à émettre (écart de BL Kiosque Port)', impact: 180_000 },
  ],
}

// ─────────────────────────────────────────────────────────────
// 4. Clôture mensuelle — sa checklist
// ─────────────────────────────────────────────────────────────

export interface TacheCloture {
  id: string
  libelle: string
  categorie: 'SAISIE' | 'RAPPROCHEMENT' | 'CUT_OFF' | 'PROVISIONS' | 'DECLARATIF'
  fait: boolean
  /** Qui bloque, quand ce n'est pas lui. */
  bloque_par?: string
}

export const CHECKLIST_CLOTURE: TacheCloture[] = [
  { id: 'clo-1', libelle: 'Saisie des factures de vente du mois', categorie: 'SAISIE', fait: true },
  { id: 'clo-2', libelle: 'Saisie des factures d\'achat fournisseurs', categorie: 'SAISIE', fait: false, bloque_par: '3 factures en attente — Huiles Ouest, Sotra, Clean Home' },
  { id: 'clo-3', libelle: 'Lettrage du compte client 411', categorie: 'RAPPROCHEMENT', fait: false },
  { id: 'clo-4', libelle: 'Rapprochement bancaire Ecobank', categorie: 'RAPPROCHEMENT', fait: true },
  { id: 'clo-5', libelle: 'Rapprochement des caisses (Lomé, Kara)', categorie: 'RAPPROCHEMENT', fait: false, bloque_par: 'Écart caisse Lomé de 20 000 F non justifié' },
  { id: 'clo-6', libelle: 'Inventaire tournant & cut-off stock', categorie: 'CUT_OFF', fait: false, bloque_par: 'Inventaire entrepôt Kara au 30/06' },
  { id: 'clo-7', libelle: 'Cut-off achats — marchandises reçues non facturées', categorie: 'CUT_OFF', fait: false },
  { id: 'clo-8', libelle: 'Provisions clients douteux', categorie: 'PROVISIONS', fait: false, bloque_par: 'Validation DG en attente sur OD PROV-411' },
  { id: 'clo-9', libelle: 'Dotations aux amortissements', categorie: 'PROVISIONS', fait: true },
  { id: 'clo-10', libelle: 'Charges à payer (commissions, transport)', categorie: 'PROVISIONS', fait: false },
  { id: 'clo-11', libelle: 'Déclaration TVA', categorie: 'DECLARATIF', fait: false },
  { id: 'clo-12', libelle: 'Déclaration CNSS', categorie: 'DECLARATIF', fait: true },
]

// ─────────────────────────────────────────────────────────────
// 5. Pièces manquantes — ce qu'il passe sa journée à réclamer
// ─────────────────────────────────────────────────────────────

export interface PieceManquante {
  id: string
  piece: string
  libelle: string
  montant: number
  /** À qui il doit courir après. */
  detenteur: string
  role_detenteur: string
  relances: number
  anciennete_j: number
  /** Ce que ça bloque en aval. */
  bloque: string
}

export const PIECES_MANQUANTES: PieceManquante[] = [
  {
    id: 'pm-1', piece: 'BL-8790', libelle: 'Bon de livraison huile 5L — réception partielle',
    montant: 1_400_000, detenteur: 'Yao Mensah', role_detenteur: 'Gestionnaire entrepôt',
    relances: 2, anciennete_j: 8, bloque: 'Rapprochement facture ACH-8821 · TVA déductible 252 K',
  },
  {
    id: 'pm-2', piece: 'FACT-FRN', libelle: 'Facture fournisseur Sotra Négoce — reçue par WhatsApp, illisible',
    montant: 1_600_000, detenteur: 'Rachidou Bawa', role_detenteur: 'Fournisseur',
    relances: 1, anciennete_j: 5, bloque: 'Saisie achat · déclaration TVA de mai',
  },
  {
    id: 'pm-3', piece: 'BR-3319', libelle: 'Bordereau de remise espèces — tournée Kara',
    montant: 1_240_000, detenteur: 'Efua Koffi', role_detenteur: 'Commercial',
    relances: 3, anciennete_j: 5, bloque: 'Lettrage 411 · rapprochement caisse Kara',
  },
  {
    id: 'pm-4', piece: 'NF-CARB', libelle: 'Notes de frais carburant — tournées de juin',
    montant: 340_000, detenteur: 'Superviseurs terrain', role_detenteur: 'Superviseur',
    relances: 1, anciennete_j: 3, bloque: 'Charges à payer · cut-off juin',
  },
]
