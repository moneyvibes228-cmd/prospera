/**
 * Source de vérité — onglet Commercial DC
 * Aligne KPIs, top produits, évolution 12 mois et tableau par agence.
 */

import type { PerformanceAgenceCommercial } from '@/lib/dc-vue360'

export const COMMERCIAL_DC_PERIODE = 'Mai 2026'

/** Totaux réseau — mois courant (5 agences pilotes DC) */
export const COMMERCIAL_DC_TOTAUX = {
  nouveaux_clients: 28,
  leads: 84,
  taux_conversion_pct: 33.3,
  valeur_signee_fcfa: 11_200_000,
  signatures: 28,
  pipeline_valeur_fcfa: 35_600_000,
  objectif_signatures: 15_000_000,
  atteinte_objectif_pct: 74.7,
  duree_cycle_jours: 9.4,
} as const

/** Performance par agence — alignée AGENCES (encours, PAR, collecte) + totaux commercial DC */
export const PERFORMANCE_AGENCES_COMMERCIAL: PerformanceAgenceCommercial[] = [
  {
    agence_id: 'AG-001', agence: 'Lomé Centre', responsable: 'Kofi Amavi',
    emprunteurs: 300, nouveaux_mois: 9, leads_mois: 27, encours: 136_450_000,
    collecte_mois: 19_940_000, collecte_objectif: 21_800_000, conv_leads_pct: 33,
    cycle_moyen_jours: 8.2, pipeline_valeur: 12_400_000, signatures_mois: 9, objectif_signatures: 12,
    taux_remboursement: 96.2, score_commercial: 88, tendance: 'HAUSSE',
  },
  {
    agence_id: 'AG-002', agence: 'Adidogomé', responsable: 'Akua Lawson',
    emprunteurs: 150, nouveaux_mois: 7, leads_mois: 20, encours: 69_060_000,
    collecte_mois: 11_500_000, collecte_objectif: 14_100_000, conv_leads_pct: 35,
    cycle_moyen_jours: 9.1, pipeline_valeur: 9_800_000, signatures_mois: 7, objectif_signatures: 10,
    taux_remboursement: 88.4, score_commercial: 79, tendance: 'STABLE',
  },
  {
    agence_id: 'AG-003', agence: 'Bè Kpota', responsable: 'Edem Kpélim',
    emprunteurs: 212, nouveaux_mois: 5, leads_mois: 15, encours: 99_700_000,
    collecte_mois: 17_065_000, collecte_objectif: 21_800_000, conv_leads_pct: 33,
    cycle_moyen_jours: 11.4, pipeline_valeur: 6_200_000, signatures_mois: 5, objectif_signatures: 9,
    taux_remboursement: 84.1, score_commercial: 68, tendance: 'BAISSE',
  },
  {
    agence_id: 'AG-004', agence: 'Hédzranawoé', responsable: 'Komi Atsu',
    emprunteurs: 153, nouveaux_mois: 4, leads_mois: 12, encours: 73_100_000,
    collecte_mois: 8_613_000, collecte_objectif: 14_100_000, conv_leads_pct: 33,
    cycle_moyen_jours: 10.8, pipeline_valeur: 4_100_000, signatures_mois: 4, objectif_signatures: 6,
    taux_remboursement: 92.3, score_commercial: 64, tendance: 'STABLE',
  },
  {
    agence_id: 'AG-005', agence: 'Kpalimé', responsable: 'Ama Fiagbé',
    emprunteurs: 90, nouveaux_mois: 3, leads_mois: 10, encours: 31_180_000,
    collecte_mois: 4_371_000, collecte_objectif: 7_700_000, conv_leads_pct: 30,
    cycle_moyen_jours: 12.6, pipeline_valeur: 2_900_000, signatures_mois: 3, objectif_signatures: 5,
    taux_remboursement: 97.1, score_commercial: 61, tendance: 'STABLE',
  },
]

export interface ProduitTopVente {
  produit: string
  ventes_mois: number
  montant: number
  marge_pct: number
  croissance_mom_pct: number
  /** Crédit débloqué ou épargne (tontine) */
  type: 'CREDIT' | 'EPARGNE'
}

/** Contrats crédit — ventes_mois total = signatures (28) · montant total = valeur signée */
export const PRODUITS_TOP_VENTES: ProduitTopVente[] = [
  { produit: 'Crédit individuel', ventes_mois: 12, montant: 4_200_000, marge_pct: 14.5, croissance_mom_pct: 8.2, type: 'CREDIT' },
  { produit: 'Groupe solidaire', ventes_mois: 4, montant: 3_200_000, marge_pct: 18.0, croissance_mom_pct: 12.4, type: 'CREDIT' },
  { produit: 'PME', ventes_mois: 3, montant: 2_400_000, marge_pct: 12.0, croissance_mom_pct: 4.1, type: 'CREDIT' },
  { produit: 'Agriculture', ventes_mois: 3, montant: 900_000, marge_pct: 11.5, croissance_mom_pct: -2.3, type: 'CREDIT' },
  { produit: 'Conso/scolaire', ventes_mois: 6, montant: 500_000, marge_pct: 15.8, croissance_mom_pct: 18.4, type: 'CREDIT' },
  { produit: 'Tontinière (épargne)', ventes_mois: 24, montant: 480_000, marge_pct: 8.0, croissance_mom_pct: 22.1, type: 'EPARGNE' },
]

export interface MoisAcquisition {
  mois: string
  nouveaux_clients: number
  leads: number
  taux_conversion: number
}

/** 12 mois — dernier point = COMMERCIAL_DC_TOTAUX */
export const EVOLUTION_ACQUISITION_12_MOIS: MoisAcquisition[] = [
  { mois: 'Juin 25', nouveaux_clients: 12, leads: 38, taux_conversion: 31.6 },
  { mois: 'Juil 25', nouveaux_clients: 14, leads: 42, taux_conversion: 33.3 },
  { mois: 'Août 25', nouveaux_clients: 16, leads: 48, taux_conversion: 33.3 },
  { mois: 'Sept 25', nouveaux_clients: 18, leads: 52, taux_conversion: 34.6 },
  { mois: 'Oct 25', nouveaux_clients: 21, leads: 58, taux_conversion: 36.2 },
  { mois: 'Nov 25', nouveaux_clients: 23, leads: 64, taux_conversion: 35.9 },
  { mois: 'Déc 25', nouveaux_clients: 19, leads: 56, taux_conversion: 33.9 },
  { mois: 'Jan 26', nouveaux_clients: 22, leads: 68, taux_conversion: 32.4 },
  { mois: 'Fév 26', nouveaux_clients: 24, leads: 71, taux_conversion: 33.8 },
  { mois: 'Mar 26', nouveaux_clients: 26, leads: 75, taux_conversion: 34.7 },
  { mois: 'Avr 26', nouveaux_clients: 25, leads: 76, taux_conversion: 32.9 },
  {
    mois: 'Mai 26',
    nouveaux_clients: COMMERCIAL_DC_TOTAUX.nouveaux_clients,
    leads: COMMERCIAL_DC_TOTAUX.leads,
    taux_conversion: COMMERCIAL_DC_TOTAUX.taux_conversion_pct,
  },
]

export function totauxProduitsCredit() {
  const credit = PRODUITS_TOP_VENTES.filter(p => p.type === 'CREDIT')
  return {
    ventes: credit.reduce((s, p) => s + p.ventes_mois, 0),
    montant: credit.reduce((s, p) => s + p.montant, 0),
  }
}

export function verifierCoherenceCommercialDC(): boolean {
  const perf = PERFORMANCE_AGENCES_COMMERCIAL
  const sumNouv = perf.reduce((s, a) => s + a.nouveaux_mois, 0)
  const sumLeads = perf.reduce((s, a) => s + a.leads_mois, 0)
  const sumSign = perf.reduce((s, a) => s + a.signatures_mois, 0)
  const { ventes, montant } = totauxProduitsCredit()
  const last = EVOLUTION_ACQUISITION_12_MOIS.at(-1)!
  return (
    sumNouv === COMMERCIAL_DC_TOTAUX.nouveaux_clients
    && sumLeads === COMMERCIAL_DC_TOTAUX.leads
    && sumSign === COMMERCIAL_DC_TOTAUX.signatures
    && ventes === COMMERCIAL_DC_TOTAUX.signatures
    && montant === COMMERCIAL_DC_TOTAUX.valeur_signee_fcfa
    && last.nouveaux_clients === COMMERCIAL_DC_TOTAUX.nouveaux_clients
    && last.leads === COMMERCIAL_DC_TOTAUX.leads
  )
}
