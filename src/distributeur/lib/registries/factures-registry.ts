import type { Facture, LigneFacture, ModePaiementFacture } from '@distributeur/types'
import { getPdvById, REGISTRE_PDV } from './pdv-registry'
import { generateFactures } from '@distributeur/lib/generators/generate-factures'

function lignes(items: [string, string, number, number, number][]): LigneFacture[] {
  return items.map(([reference, produit, qte, prix, remise]) => ({
    reference,
    produit,
    quantite: qte,
    prix_unitaire: prix,
    remise_pct: remise,
    total: Math.round(qte * prix * (1 - remise / 100)),
  }))
}

function f(
  base: { pdv_id: string; lignes_items: [string, string, number, number, number][] } & Omit<Facture, 'lignes' | 'pdv_nom'>,
  extra: Partial<Facture> = {},
): Facture {
  const pdv = getPdvById(base.pdv_id)!
  const ls = lignes(base.lignes_items)
  const montantCalc = ls.reduce((s, l) => s + l.total, 0)
  return {
    ...base,
    montant: base.montant ?? montantCalc,
    pdv_nom: pdv.nom,
    zone: pdv.zone,
    commercial: pdv.commercial,
    type_magasin: pdv.type_magasin,
    entrepot: pdv.entrepot_source,
    lignes: ls,
    ...extra,
  }
}

/** Factures grossiste B2B — juin 2026, échelle 1,5 à 8 M FCFA (scénarios nommés). */
export const REGISTRE_FACTURES_SEED: Facture[] = [
  // —— Impayés chroniques — Kiosque Port (3 factures) ——
  f({
    id: 'f-1', numero: 'FAC-2026-8821', pdv_id: 'pdv-3',
    montant: 2_840_000, paye: 0, statut: 'EN_RETARD', echeance: '2026-04-25', jours_retard: 45,
    date_emission: '2026-03-28', commande_ref: 'CMD-2026-4412',
    type_client: 'KIOSQUE', mode_paiement: 'CREDIT_45J', plafond_credit: 3_000_000,
    marge_facture_pct: 14.2, score_risque_ia: 28, nb_relances: 6,
    synthese_ia: 'Client à risque élevé — 3 factures impayées cumulées 8,9 M. Dernière commande 12/05. Blocage livraison recommandé.',
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 320, 4_200, 0],
      ['PRD-HUILE-5L', 'Huile végétale 5L', 180, 8_500, 0],
      ['PRD-SAVON-PACK', 'Savon ménager (carton 48)', 48, 12_000, 0],
    ],
  }),
  f({
    id: 'f-1b', numero: 'FAC-2026-8810', pdv_id: 'pdv-3',
    montant: 3_520_000, paye: 0, statut: 'EN_RETARD', echeance: '2026-04-08', jours_retard: 62,
    date_emission: '2026-03-10', commande_ref: 'CMD-2026-4388',
    type_client: 'KIOSQUE', mode_paiement: 'CREDIT_45J', plafond_credit: 3_000_000,
    marge_facture_pct: 13.8, score_risque_ia: 28, nb_relances: 8,
    lignes_items: [
      ['PRD-COCA-33CL', 'Soda 33cl (pack 24)', 240, 9_800, 0],
      ['PRD-RIZ-25KG', 'Riz parfumé 25 kg', 120, 18_000, 0],
    ],
  }),
  f({
    id: 'f-1c', numero: 'FAC-2026-8798', pdv_id: 'pdv-3',
    montant: 2_540_000, paye: 0, statut: 'EN_RETARD', echeance: '2026-03-22', jours_retard: 78,
    date_emission: '2026-02-24', commande_ref: 'CMD-2026-4350',
    type_client: 'KIOSQUE', mode_paiement: 'CREDIT_45J', plafond_credit: 3_000_000,
    marge_facture_pct: 12.5, score_risque_ia: 28, nb_relances: 10,
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 400, 4_200, 0],
      ['PRD-PATES-500G', 'Pâtes alimentaires 500g', 80, 3_800, 0],
    ],
  }),

  // —— Épicerie Mama T. (2 impayées) ——
  f({
    id: 'f-2', numero: 'FAC-2026-8834', pdv_id: 'pdv-2',
    montant: 1_920_000, paye: 0, statut: 'EN_RETARD', echeance: '2026-05-28', jours_retard: 12,
    date_emission: '2026-05-14', commande_ref: 'CMD-2026-4498',
    type_client: 'EPICERIE', mode_paiement: 'CREDIT_30J', plafond_credit: 4_000_000,
    marge_facture_pct: 15.8, score_risque_ia: 52, nb_relances: 2,
    synthese_ia: '2e impayée ce trimestre — commercial Komlan Tetteh. Historique paiement irrégulier mais relation 3 ans.',
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 180, 4_200, 0],
      ['PRD-SAVON-PACK', 'Savon ménager (carton 48)', 72, 12_000, 0],
      ['PRD-DETERGENT-5L', 'Détergent liquide 5L', 48, 7_800, 0],
    ],
  }),
  f({
    id: 'f-2b', numero: 'FAC-2026-8825', pdv_id: 'pdv-2',
    montant: 1_480_000, paye: 0, statut: 'EN_RETARD', echeance: '2026-05-12', jours_retard: 28,
    date_emission: '2026-04-28', commande_ref: 'CMD-2026-4462',
    type_client: 'EPICERIE', mode_paiement: 'CREDIT_30J', plafond_credit: 4_000_000,
    marge_facture_pct: 15.2, score_risque_ia: 52, nb_relances: 4,
    lignes_items: [
      ['PRD-COCA-33CL', 'Soda 33cl (pack 24)', 96, 9_800, 0],
      ['PRD-JUS-1L', 'Jus d\'orange 1L (pack 6)', 48, 6_500, 0],
    ],
  }),

  // —— Grossiste Adidogomé (nouveau gros impayé) ——
  f({
    id: 'f-13', numero: 'FAC-2026-8828', pdv_id: 'pdv-9',
    montant: 3_200_000, paye: 0, statut: 'EN_RETARD', echeance: '2026-05-20', jours_retard: 20,
    date_emission: '2026-04-18', commande_ref: 'CMD-2026-4470',
    type_client: 'GROSSISTE', mode_paiement: 'CREDIT_60J', plafond_credit: 8_000_000,
    marge_facture_pct: 16.4, score_risque_ia: 41, nb_relances: 3,
    synthese_ia: 'Nouveau grossiste — 1ère grosse commande livrée mais aucun paiement. Vérifier solvabilité avant relivraison.',
    lignes_items: [
      ['PRD-RIZ-25KG', 'Riz parfumé 25 kg', 120, 18_000, 5],
      ['PRD-HUILE-5L', 'Huile végétale 5L', 96, 8_500, 5],
    ],
  }),
  f({
    id: 'f-14', numero: 'FAC-2026-8831', pdv_id: 'pdv-9',
    montant: 2_050_000, paye: 0, statut: 'EN_RETARD', echeance: '2026-06-01', jours_retard: 8,
    date_emission: '2026-05-18', commande_ref: 'CMD-2026-4502',
    type_client: 'GROSSISTE', mode_paiement: 'CREDIT_60J', plafond_credit: 8_000_000,
    marge_facture_pct: 16.1, score_risque_ia: 41, nb_relances: 1,
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 280, 4_200, 5],
      ['PRD-COCA-33CL', 'Soda 33cl (pack 24)', 72, 9_800, 5],
    ],
  }),

  // —— Partielles ——
  f({
    id: 'f-4', numero: 'FAC-2026-8841', pdv_id: 'pdv-5',
    montant: 1_240_000, paye: 620_000, statut: 'PARTIELLE', echeance: '2026-06-04', jours_retard: 5,
    date_emission: '2026-05-20', commande_ref: 'CMD-2026-4488', dernier_paiement: '2026-06-02',
    type_client: 'DEPOT', mode_paiement: 'CREDIT_30J', plafond_credit: 2_500_000,
    marge_facture_pct: 17.2, score_risque_ia: 58, nb_relances: 1,
    synthese_ia: 'Dépôt Sokodé — paiement partiel 50%. Promesse solde 15/06. Zone Centrale, bon historique global.',
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 120, 4_200, 8],
      ['PRD-LAIT-400G', 'Lait concentré 400g (pack 24)', 48, 5_200, 8],
    ],
  }),
  f({
    id: 'f-15', numero: 'FAC-2026-8830', pdv_id: 'pdv-7',
    montant: 1_820_000, paye: 1_640_000, statut: 'PARTIELLE', echeance: '2026-06-02', jours_retard: 8,
    date_emission: '2026-05-18', commande_ref: 'CMD-2026-4525', dernier_paiement: '2026-06-05',
    type_client: 'DEPOT', mode_paiement: 'CREDIT_30J', plafond_credit: 5_000_000,
    marge_facture_pct: 16.8, score_risque_ia: 72, nb_relances: 1,
    synthese_ia: 'Freelance Kofi Agbessi — 90% encaissé. Reliquat 180 K probable cette semaine.',
    lignes_items: [
      ['PRD-COCA-33CL', 'Soda 33cl (pack 24)', 120, 9_800, 8],
      ['PRD-HUILE-5L', 'Huile végétale 5L', 48, 8_500, 8],
    ],
  }),

  // —— Émises (en attente échéance) ——
  f({
    id: 'f-16', numero: 'FAC-2026-8845', pdv_id: 'pdv-1',
    montant: 4_850_000, paye: 0, statut: 'EMISE', echeance: '2026-07-10', jours_retard: 0,
    date_emission: '2026-06-10', commande_ref: 'CMD-2026-4521',
    type_client: 'GROSSISTE', mode_paiement: 'CREDIT_30J', plafond_credit: 10_000_000,
    marge_facture_pct: 16.2, score_risque_ia: 85, nb_relances: 0,
    synthese_ia: 'Boutique Akossombo — client fidèle, paiement habituel J+25. Aucun risque.',
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 400, 4_200, 5],
      ['PRD-RIZ-25KG', 'Riz parfumé 25 kg', 96, 18_000, 5],
      ['PRD-COCA-33CL', 'Soda 33cl (pack 24)', 72, 9_800, 5],
    ],
  }),
  f({
    id: 'f-17', numero: 'FAC-2026-8846', pdv_id: 'pdv-4',
    montant: 6_200_000, paye: 0, statut: 'EMISE', echeance: '2026-07-08', jours_retard: 0,
    date_emission: '2026-06-10', commande_ref: 'CMD-2026-4523',
    type_client: 'SUPERETTE', mode_paiement: 'CREDIT_30J', plafond_credit: 12_000_000,
    marge_facture_pct: 17.4, score_risque_ia: 92, nb_relances: 0,
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 480, 4_200, 3],
      ['PRD-SAVON-PACK', 'Savon ménager (carton 48)', 120, 12_000, 3],
      ['PRD-COUCHE-PK', 'Couches bébé (pack 6)', 48, 14_500, 3],
    ],
  }),

  // —— Payées (juin) ——
  f({
    id: 'f-3', numero: 'FAC-2026-8840', pdv_id: 'pdv-1',
    montant: 4_850_000, paye: 4_850_000, statut: 'PAYEE', echeance: '2026-06-08', jours_retard: 0,
    date_emission: '2026-05-22', commande_ref: 'CMD-2026-4480', dernier_paiement: '2026-06-07',
    type_client: 'GROSSISTE', mode_paiement: 'VIREMENT', plafond_credit: 10_000_000,
    marge_facture_pct: 16.2, score_risque_ia: 85, nb_relances: 0,
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 400, 4_200, 5],
      ['PRD-HUILE-5L', 'Huile végétale 5L', 120, 8_500, 5],
    ],
  }),
  f({
    id: 'f-5', numero: 'FAC-2026-8838', pdv_id: 'pdv-4',
    montant: 5_800_000, paye: 5_800_000, statut: 'PAYEE', echeance: '2026-06-05', jours_retard: 0,
    date_emission: '2026-05-18', commande_ref: 'CMD-2026-4468', dernier_paiement: '2026-06-04',
    type_client: 'SUPERETTE', mode_paiement: 'VIREMENT', plafond_credit: 12_000_000,
    marge_facture_pct: 17.4, score_risque_ia: 92, nb_relances: 0,
    lignes_items: [
      ['PRD-RIZ-25KG', 'Riz parfumé 25 kg', 180, 18_000, 3],
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 240, 4_200, 3],
    ],
  }),
  f({
    id: 'f-6', numero: 'FAC-2026-8835', pdv_id: 'mag-1',
    montant: 5_600_000, paye: 5_600_000, statut: 'PAYEE', echeance: '2026-06-01', jours_retard: 0,
    date_emission: '2026-05-15', commande_ref: 'CMD-2026-4528', dernier_paiement: '2026-05-30',
    type_client: 'ENSEIGNE', mode_paiement: 'VIREMENT', plafond_credit: 0,
    marge_facture_pct: 14.5, score_risque_ia: 100, nb_relances: 0,
    synthese_ia: 'Transfert interne enseigne — compensation comptable immédiate.',
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 360, 4_200, 0],
      ['PRD-COCA-33CL', 'Soda 33cl (pack 24)', 144, 9_800, 0],
    ],
  }),
  f({
    id: 'f-7', numero: 'FAC-2026-8832', pdv_id: 'mag-4',
    montant: 7_400_000, paye: 7_400_000, statut: 'PAYEE', echeance: '2026-05-28', jours_retard: 0,
    date_emission: '2026-05-10', commande_ref: 'CMD-2026-4527', dernier_paiement: '2026-05-27',
    type_client: 'ENSEIGNE', mode_paiement: 'VIREMENT', plafond_credit: 0,
    marge_facture_pct: 14.1, score_risque_ia: 100, nb_relances: 0,
    lignes_items: [
      ['PRD-RIZ-25KG', 'Riz parfumé 25 kg', 240, 18_000, 0],
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 320, 4_200, 0],
    ],
  }),
  f({
    id: 'f-8', numero: 'FAC-2026-8839', pdv_id: 'pdv-7',
    montant: 3_680_000, paye: 3_680_000, statut: 'PAYEE', echeance: '2026-06-06', jours_retard: 0,
    date_emission: '2026-05-25', commande_ref: 'CMD-2026-4505', dernier_paiement: '2026-06-05',
    type_client: 'DEPOT', mode_paiement: 'ESPECES', plafond_credit: 5_000_000,
    marge_facture_pct: 16.8, score_risque_ia: 72, nb_relances: 0,
    lignes_items: [
      ['PRD-COCA-33CL', 'Soda 33cl (pack 24)', 200, 9_800, 8],
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 240, 4_200, 8],
    ],
  }),
  f({
    id: 'f-9', numero: 'FAC-2026-8837', pdv_id: 'pdv-8',
    montant: 2_150_000, paye: 2_150_000, statut: 'PAYEE', echeance: '2026-06-03', jours_retard: 0,
    date_emission: '2026-05-20', commande_ref: 'CMD-2026-4526', dernier_paiement: '2026-06-02',
    type_client: 'EPICERIE', mode_paiement: 'ESPECES', plafond_credit: 3_000_000,
    marge_facture_pct: 17.2, score_risque_ia: 78, nb_relances: 0,
    lignes_items: [
      ['PRD-COCA-33CL', 'Soda 33cl (pack 24)', 120, 9_800, 0],
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 120, 4_200, 0],
    ],
  }),
  f({
    id: 'f-10', numero: 'FAC-2026-8836', pdv_id: 'mag-3',
    montant: 4_280_000, paye: 4_280_000, statut: 'PAYEE', echeance: '2026-06-04', jours_retard: 0,
    date_emission: '2026-05-22', commande_ref: 'CMD-2026-4529', dernier_paiement: '2026-06-03',
    type_client: 'ENSEIGNE', mode_paiement: 'VIREMENT', plafond_credit: 0,
    marge_facture_pct: 14.8, score_risque_ia: 100, nb_relances: 0,
    lignes_items: [
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 280, 4_200, 0],
      ['PRD-SAVON-PACK', 'Savon ménager (carton 48)', 96, 12_000, 0],
    ],
  }),
  f({
    id: 'f-11', numero: 'FAC-2026-8833', pdv_id: 'mag-2',
    montant: 3_920_000, paye: 3_920_000, statut: 'PAYEE', echeance: '2026-05-30', jours_retard: 0,
    date_emission: '2026-05-12', commande_ref: 'CMD-2026-4530', dernier_paiement: '2026-05-29',
    type_client: 'ENSEIGNE', mode_paiement: 'VIREMENT', plafond_credit: 0,
    marge_facture_pct: 13.9, score_risque_ia: 100, nb_relances: 0,
    lignes_items: [
      ['PRD-HUILE-5L', 'Huile végétale 5L', 200, 8_500, 0],
      ['PRD-RIZ-25KG', 'Riz parfumé 25 kg', 72, 18_000, 0],
    ],
  }),
  f({
    id: 'f-12', numero: 'FAC-2026-8829', pdv_id: 'pdv-8',
    montant: 1_680_000, paye: 1_680_000, statut: 'PAYEE', echeance: '2026-05-25', jours_retard: 0,
    date_emission: '2026-04-22', commande_ref: 'CMD-2026-4455', dernier_paiement: '2026-05-24',
    type_client: 'EPICERIE', mode_paiement: 'ESPECES', plafond_credit: 3_000_000,
    marge_facture_pct: 17.0, score_risque_ia: 78, nb_relances: 0,
    lignes_items: [
      ['PRD-JUS-1L', 'Jus d\'orange 1L (pack 6)', 96, 6_500, 0],
      ['PRD-EAU-1.5L', 'Eau minérale 1,5L (pack 12)', 96, 4_200, 0],
    ],
  }),
]

export const REGISTRE_FACTURES: Facture[] = [
  ...REGISTRE_FACTURES_SEED,
  ...generateFactures(REGISTRE_PDV, 9000),
]

export const GRILLE_PRIX_ENTREPRISE: {
  type_client: string
  remise_base_pct: number
  delai_paiement: ModePaiementFacture
  plafond_type: string
  exemple_produit: string
  prix_public: number
  prix_client: number
}[] = [
  { type_client: 'Dépôt / Grossiste volume', remise_base_pct: 8, delai_paiement: 'CREDIT_60J', plafond_type: '5–15 M FCFA', exemple_produit: 'Huile 5L', prix_public: 8_500, prix_client: 7_820 },
  { type_client: 'Grossiste', remise_base_pct: 5, delai_paiement: 'CREDIT_30J', plafond_type: '3–10 M FCFA', exemple_produit: 'Riz 25 kg', prix_public: 18_000, prix_client: 17_100 },
  { type_client: 'Superette', remise_base_pct: 3, delai_paiement: 'CREDIT_30J', plafond_type: '5–12 M FCFA', exemple_produit: 'Eau 1,5L pack 12', prix_public: 4_200, prix_client: 4_074 },
  { type_client: 'Épicerie / Kiosque', remise_base_pct: 0, delai_paiement: 'CREDIT_30J', plafond_type: '1–4 M FCFA', exemple_produit: 'Soda 33cl pack 24', prix_public: 9_800, prix_client: 9_800 },
  { type_client: 'Enseigne Atlas Shop', remise_base_pct: 0, delai_paiement: 'VIREMENT', plafond_type: 'Illimité (interne)', exemple_produit: 'Savon carton 48', prix_public: 12_000, prix_client: 12_000 },
]
