import type { Fournisseur } from '@distributeur/types'

/**
 * Registre fournisseurs — source unique de vérité de la dette (spec V2 §5.1, §8).
 * `Σ encours_du` alimente le compte 401100 et le chiffre « Dette fournisseurs » du DG.
 */
export const REGISTRE_FOURNISSEURS: Fournisseur[] = [
  {
    id: 'frn-1', code: 'FRN-001', nom: 'Huiles Ouest Afrique',
    categories: ['Alimentaire'], pays: 'Côte d\'Ivoire', statut: 'ACTIF',
    contact: { nom: 'Ibrahim Koné', telephone: '+225 07 12 44 88', email: 'commercial@huilesouest.ci' },
    delai_livraison_j: 14, delai_paiement_j: 30, franco_de_port: 6_000_000,
    minimum_commande: 1_500_000, remise_volume_pct: 4,
    encours_du: 24_600_000, encours_echu: 20_400_000,
    prochaine_echeance: '2026-06-16', montant_prochaine_echeance: 8_200_000,
    plafond_credit_accorde: 30_000_000,
    score_fiabilite: 58, taux_livraison_conforme_pct: 74, delai_reel_moyen_j: 19.4,
    taux_litige_pct: 8.2, competitivite_prix: 82, ca_annuel_avec_fournisseur: 184_000_000,
  },
  {
    id: 'frn-2', code: 'FRN-002', nom: 'Riz Import Vietnam',
    categories: ['Alimentaire'], pays: 'Vietnam', statut: 'ACTIF',
    contact: { nom: 'Nguyen Van Minh', telephone: '+84 28 3822 0011', email: 'export@rizvn.com' },
    delai_livraison_j: 21, delai_paiement_j: 45, franco_de_port: 12_000_000,
    minimum_commande: 4_000_000, remise_volume_pct: 6,
    encours_du: 18_200_000, encours_echu: 12_800_000,
    prochaine_echeance: '2026-06-22', montant_prochaine_echeance: 5_400_000,
    plafond_credit_accorde: 25_000_000,
    score_fiabilite: 71, taux_livraison_conforme_pct: 88, delai_reel_moyen_j: 24.8,
    taux_litige_pct: 4.1, competitivite_prix: 91, ca_annuel_avec_fournisseur: 142_000_000,
  },
  {
    id: 'frn-3', code: 'FRN-003', nom: 'Brasserie du Golfe',
    categories: ['Boissons'], pays: 'Togo', statut: 'PREFERENTIEL',
    contact: { nom: 'Yawo Amegan', telephone: '+228 90 41 22 76', email: 'ventes@brasseriegolfe.tg' },
    delai_livraison_j: 4, delai_paiement_j: 30, franco_de_port: 3_000_000,
    minimum_commande: 800_000, remise_volume_pct: 5,
    encours_du: 9_600_000, encours_echu: 0,
    prochaine_echeance: '2026-07-05', montant_prochaine_echeance: 9_600_000,
    plafond_credit_accorde: 20_000_000,
    score_fiabilite: 94, taux_livraison_conforme_pct: 97, delai_reel_moyen_j: 3.8,
    taux_litige_pct: 0.8, competitivite_prix: 79, ca_annuel_avec_fournisseur: 128_000_000,
  },
  {
    id: 'frn-4', code: 'FRN-004', nom: 'Source Eau Togo SA',
    categories: ['Boissons'], pays: 'Togo', statut: 'PREFERENTIEL',
    contact: { nom: 'Afi Sossou', telephone: '+228 91 07 55 30', email: 'contact@sourceeau.tg' },
    delai_livraison_j: 5, delai_paiement_j: 30, franco_de_port: 2_500_000,
    minimum_commande: 600_000, remise_volume_pct: 3,
    encours_du: 8_400_000, encours_echu: 0,
    prochaine_echeance: '2026-07-02', montant_prochaine_echeance: 8_400_000,
    plafond_credit_accorde: 15_000_000,
    score_fiabilite: 91, taux_livraison_conforme_pct: 96, delai_reel_moyen_j: 5.2,
    taux_litige_pct: 1.2, competitivite_prix: 84, ca_annuel_avec_fournisseur: 96_000_000,
  },
  {
    id: 'frn-5', code: 'FRN-005', nom: 'Coca-Cola Togo',
    categories: ['Boissons'], pays: 'Togo', statut: 'ACTIF',
    contact: { nom: 'Délali Kpogo', telephone: '+228 92 33 18 04', email: 'grossistes@cocatogo.tg' },
    delai_livraison_j: 7, delai_paiement_j: 30, franco_de_port: 4_000_000,
    minimum_commande: 1_200_000, remise_volume_pct: 2,
    encours_du: 7_200_000, encours_echu: 0,
    prochaine_echeance: '2026-06-28', montant_prochaine_echeance: 7_200_000,
    plafond_credit_accorde: 18_000_000,
    score_fiabilite: 88, taux_livraison_conforme_pct: 94, delai_reel_moyen_j: 7.4,
    taux_litige_pct: 1.8, competitivite_prix: 68, ca_annuel_avec_fournisseur: 88_000_000,
  },
  {
    id: 'frn-6', code: 'FRN-006', nom: 'Nestlé Distribution Kara',
    categories: ['Alimentaire'], pays: 'Togo', statut: 'ACTIF',
    contact: { nom: 'Bassirou Idrissou', telephone: '+228 93 60 27 41', email: 'kara@nestle-dist.tg' },
    delai_livraison_j: 6, delai_paiement_j: 30, franco_de_port: 3_500_000,
    minimum_commande: 900_000, remise_volume_pct: 3,
    encours_du: 5_800_000, encours_echu: 3_200_000,
    prochaine_echeance: '2026-06-18', montant_prochaine_echeance: 2_600_000,
    plafond_credit_accorde: 12_000_000,
    score_fiabilite: 86, taux_livraison_conforme_pct: 92, delai_reel_moyen_j: 6.6,
    taux_litige_pct: 2.4, competitivite_prix: 72, ca_annuel_avec_fournisseur: 64_000_000,
  },
  {
    id: 'frn-7', code: 'FRN-007', nom: 'Hygiène Pro Afrique',
    categories: ['Hygiène', 'Entretien'], pays: 'Ghana', statut: 'ACTIF',
    contact: { nom: 'Kwame Asante', telephone: '+233 24 551 20 90', email: 'sales@hygienepro.gh' },
    delai_livraison_j: 7, delai_paiement_j: 30, franco_de_port: 2_000_000,
    minimum_commande: 500_000, remise_volume_pct: 4,
    encours_du: 4_900_000, encours_echu: 2_400_000,
    prochaine_echeance: '2026-06-19', montant_prochaine_echeance: 2_500_000,
    plafond_credit_accorde: 10_000_000,
    score_fiabilite: 83, taux_livraison_conforme_pct: 90, delai_reel_moyen_j: 7.8,
    taux_litige_pct: 3.1, competitivite_prix: 86, ca_annuel_avec_fournisseur: 52_000_000,
  },
  {
    id: 'frn-8', code: 'FRN-008', nom: 'Clean Home Import',
    categories: ['Entretien', 'Hygiène'], pays: 'Nigeria', statut: 'SUSPENDU',
    contact: { nom: 'Chidi Okafor', telephone: '+234 803 447 11 22', email: 'export@cleanhome.ng' },
    delai_livraison_j: 12, delai_paiement_j: 15, franco_de_port: 2_500_000,
    minimum_commande: 700_000, remise_volume_pct: 2,
    encours_du: 3_400_000, encours_echu: 3_400_000,
    prochaine_echeance: '2026-06-13', montant_prochaine_echeance: 3_400_000,
    plafond_credit_accorde: 4_000_000,
    score_fiabilite: 41, taux_livraison_conforme_pct: 62, delai_reel_moyen_j: 18.2,
    taux_litige_pct: 14.6, competitivite_prix: 94, ca_annuel_avec_fournisseur: 21_000_000,
  },
  {
    id: 'frn-9', code: 'FRN-009', nom: 'Sotra Négoce',
    categories: ['Alimentaire', 'Entretien'], pays: 'Togo', statut: 'EN_EVALUATION',
    contact: { nom: 'Rachidou Bawa', telephone: '+228 96 12 78 55', email: 'achat@sotranegoce.tg' },
    delai_livraison_j: 6, delai_paiement_j: 30, franco_de_port: 3_000_000,
    minimum_commande: 800_000, remise_volume_pct: 3,
    encours_du: 2_800_000, encours_echu: 1_600_000,
    prochaine_echeance: '2026-06-17', montant_prochaine_echeance: 1_600_000,
    plafond_credit_accorde: 8_000_000,
    score_fiabilite: 79, taux_livraison_conforme_pct: 89, delai_reel_moyen_j: 5.2,
    taux_litige_pct: 3.8, competitivite_prix: 88, ca_annuel_avec_fournisseur: 34_000_000,
  },
  {
    id: 'frn-10', code: 'FRN-010', nom: 'Jus Tropical Import',
    categories: ['Boissons'], pays: 'Côte d\'Ivoire', statut: 'ACTIF',
    contact: { nom: 'Aya Brou', telephone: '+225 05 88 31 07', email: 'commande@justropical.ci' },
    delai_livraison_j: 10, delai_paiement_j: 30, franco_de_port: 2_000_000,
    minimum_commande: 500_000, remise_volume_pct: 3,
    encours_du: 1_500_000, encours_echu: 0,
    prochaine_echeance: '2026-07-08', montant_prochaine_echeance: 1_500_000,
    plafond_credit_accorde: 6_000_000,
    score_fiabilite: 76, taux_livraison_conforme_pct: 87, delai_reel_moyen_j: 11.4,
    taux_litige_pct: 4.6, competitivite_prix: 81, ca_annuel_avec_fournisseur: 28_000_000,
  },
]

/** Dette fournisseurs totale — alimente le compte 401100 et le KPI DG. */
export const DETTE_FOURNISSEURS_TOTALE = REGISTRE_FOURNISSEURS.reduce((s, f) => s + f.encours_du, 0)

/** Part échue de la dette — le chiffre qui doit faire réagir le DAF. */
export const DETTE_FOURNISSEURS_ECHUE = REGISTRE_FOURNISSEURS.reduce((s, f) => s + f.encours_echu, 0)

export function getFournisseurById(id: string): Fournisseur | undefined {
  return REGISTRE_FOURNISSEURS.find(f => f.id === id)
}

export const STATUT_FOURNISSEUR_STYLE: Record<Fournisseur['statut'], { label: string; className: string }> = {
  PREFERENTIEL: { label: 'Préférentiel', className: 'bg-emerald-100 text-emerald-700' },
  ACTIF: { label: 'Actif', className: 'bg-slate-100 text-slate-600' },
  EN_EVALUATION: { label: 'En évaluation', className: 'bg-sky-100 text-sky-700' },
  SUSPENDU: { label: 'Suspendu', className: 'bg-red-100 text-red-700' },
}
