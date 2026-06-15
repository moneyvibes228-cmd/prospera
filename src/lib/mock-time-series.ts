/**
 * Source unique des séries temporelles mock — Déc 2025 → Mai 2026 (6 mois).
 * Toutes les valeurs « courantes » = dernier point (Mai 2026).
 * Les KPIs, sparklines et variations MoM en découlent.
 */

export interface ReseauMoisSnapshot {
  id: string
  label: string
  labelCourt: string
  emprunteurs: number
  encours_fcfa: number
  par_30: number
  par_90: number
  remboursement_pct: number
  collecte_fcfa: number
  decaissements: number
  delai_validation_j: number
  soumis: number
  approuves: number
  refuses: number
  en_attente: number
  restructures: number
  contentieux: number
  workflow_pipeline: number
  el_fcfa: number
  provisions_fcfa: number
  liquidite_fcfa: number
  taux_defaut_pct: number
}

export const DELAI_OBJECTIF_J = 3.0

/** Progression réseau — Mai 2026 = valeurs canoniques (905 / 409,49 M) */
export const RESEAU_MENSUEL: ReseauMoisSnapshot[] = [
  {
    id: '2025-12', label: 'Déc 25', labelCourt: 'Déc',
    emprunteurs: 828, encours_fcfa: 377_800_000, par_30: 12.0, par_90: 4.2,
    remboursement_pct: 87.4, collecte_fcfa: 12_800_000, decaissements: 14,
    delai_validation_j: 6.4, soumis: 52, approuves: 31, refuses: 11,
    en_attente: 6, restructures: 2, contentieux: 1, workflow_pipeline: 78,
    el_fcfa: 3_840_000, provisions_fcfa: 3_200_000, liquidite_fcfa: 9_200_000,
    taux_defaut_pct: 3.1,
  },
  {
    id: '2026-01', label: 'Jan 26', labelCourt: 'Jan',
    emprunteurs: 847, encours_fcfa: 385_400_000, par_30: 11.4, par_90: 3.9,
    remboursement_pct: 88.2, collecte_fcfa: 13_200_000, decaissements: 16,
    delai_validation_j: 6.1, soumis: 58, approuves: 36, refuses: 12,
    en_attente: 7, restructures: 2, contentieux: 1, workflow_pipeline: 82,
    el_fcfa: 3_620_000, provisions_fcfa: 3_400_000, liquidite_fcfa: 9_800_000,
    taux_defaut_pct: 2.9,
  },
  {
    id: '2026-02', label: 'Fév 26', labelCourt: 'Fév',
    emprunteurs: 861, encours_fcfa: 392_800_000, par_30: 10.8, par_90: 3.6,
    remboursement_pct: 89.0, collecte_fcfa: 13_600_000, decaissements: 19,
    delai_validation_j: 5.8, soumis: 61, approuves: 39, refuses: 13,
    en_attente: 7, restructures: 2, contentieux: 1, workflow_pipeline: 84,
    el_fcfa: 3_380_000, provisions_fcfa: 3_600_000, liquidite_fcfa: 10_200_000,
    taux_defaut_pct: 2.8,
  },
  {
    id: '2026-03', label: 'Mars 26', labelCourt: 'Mar',
    emprunteurs: 876, encours_fcfa: 398_900_000, par_30: 10.2, par_90: 3.4,
    remboursement_pct: 89.8, collecte_fcfa: 14_000_000, decaissements: 20,
    delai_validation_j: 5.4, soumis: 64, approuves: 38, refuses: 15,
    en_attente: 8, restructures: 3, contentieux: 1, workflow_pipeline: 86,
    el_fcfa: 3_180_000, provisions_fcfa: 3_800_000, liquidite_fcfa: 10_800_000,
    taux_defaut_pct: 2.7,
  },
  {
    id: '2026-04', label: 'Avr 26', labelCourt: 'Avr',
    emprunteurs: 890, encours_fcfa: 404_600_000, par_30: 9.2, par_90: 3.0,
    remboursement_pct: 90.6, collecte_fcfa: 14_400_000, decaissements: 16,
    delai_validation_j: 4.8, soumis: 71, approuves: 44, refuses: 16,
    en_attente: 8, restructures: 3, contentieux: 1, workflow_pipeline: 89,
    el_fcfa: 3_040_000, provisions_fcfa: 4_000_000, liquidite_fcfa: 11_400_000,
    taux_defaut_pct: 2.5,
  },
  {
    id: '2026-05', label: 'Mai 26', labelCourt: 'Mai',
    emprunteurs: 905, encours_fcfa: 409_490_000, par_30: 8.0, par_90: 2.4,
    remboursement_pct: 91.6, collecte_fcfa: 61_489_000, decaissements: 62,
    delai_validation_j: 4.2, soumis: 322, approuves: 197, refuses: 67,
    en_attente: 38, restructures: 14, contentieux: 5, workflow_pipeline: 443,
    el_fcfa: 14_120_000, provisions_fcfa: 20_200_000, liquidite_fcfa: 53_300_000,
    taux_defaut_pct: 2.4,
  },
]

export const MOCK_MOIS_LABELS = RESEAU_MENSUEL.map(m => m.labelCourt)

export function getMoisCourant(): ReseauMoisSnapshot {
  return RESEAU_MENSUEL[RESEAU_MENSUEL.length - 1]
}

export function getMoisPrecedent(): ReseauMoisSnapshot {
  return RESEAU_MENSUEL[RESEAU_MENSUEL.length - 2]
}

export function sparkline<K extends keyof ReseauMoisSnapshot>(
  key: K,
  points = RESEAU_MENSUEL.length,
): number[] {
  return RESEAU_MENSUEL.slice(-points).map(m => Number(m[key]))
}

/** Variation en % mois sur mois */
export function variationMoM(key: keyof ReseauMoisSnapshot): number {
  const cur = getMoisCourant()[key] as number
  const prev = getMoisPrecedent()[key] as number
  if (prev === 0) return 0
  return Number((((cur - prev) / prev) * 100).toFixed(1))
}

/** Variation absolue mois sur mois (points de %) */
export function variationAbsMoM(key: keyof ReseauMoisSnapshot): number {
  const cur = getMoisCourant()[key] as number
  const prev = getMoisPrecedent()[key] as number
  return Number((cur - prev).toFixed(1))
}

export function buildEvolutionDecisions6Mois() {
  return RESEAU_MENSUEL.map(m => ({
    mois: m.label,
    soumis: m.soumis,
    approuves: m.approuves,
    refuses: m.refuses,
    taux: m.soumis > 0 ? Number(((m.approuves / m.soumis) * 100).toFixed(1)) : 0,
  }))
}

export function buildReseauParHistoriqueChart() {
  return RESEAU_MENSUEL.map(m => ({
    mois: m.labelCourt,
    par_30j: m.par_30,
    remboursement: m.remboursement_pct,
    decaissements: m.decaissements,
    liquidite: m.liquidite_fcfa,
  }))
}

export function buildExpectedLossEvolution6Mois() {
  return RESEAU_MENSUEL.map(m => ({
    mois: m.label,
    el: m.el_fcfa,
    provisions: m.provisions_fcfa,
    pct_portefeuille: m.encours_fcfa > 0
      ? Number(((m.el_fcfa / m.encours_fcfa) * 100).toFixed(1))
      : 0,
  }))
}

/** Ratios PAR granulaire dérivés du PAR 30 (cohérence réseau) */
export function buildParGranulaireFromPar30(par30: number, encours: number) {
  const par1 = Number((par30 * 1.56).toFixed(1))
  const par7 = Number((par30 * 1.15).toFixed(1))
  const par60 = Number((par30 * 0.56).toFixed(1))
  const par90 = Number((par30 * 0.38).toFixed(1))
  const encoursPar30 = Math.round(encours * (par30 / 100))
  return {
    par_1: { valeur_pct: par1, montant: Math.round(encoursPar30 * 1.56), seuil_alerte: 15, statut: par1 <= 15 ? 'NORMAL' as const : 'WARN' as const },
    par_7: { valeur_pct: par7, montant: Math.round(encoursPar30 * 1.15), seuil_alerte: 12, statut: par7 <= 12 ? 'NORMAL' as const : 'WARN' as const },
    par_30: { valeur_pct: par30, montant: encoursPar30, seuil_alerte: 10, statut: par30 <= 10 ? 'NORMAL' as const : 'WARN' as const },
    par_60: { valeur_pct: par60, montant: Math.round(encoursPar30 * 0.56), seuil_alerte: 6, statut: par60 <= 6 ? 'NORMAL' as const : 'WARN' as const },
    par_90: { valeur_pct: par90, montant: Math.round(encoursPar30 * 0.38), seuil_alerte: 4, statut: par90 <= 4 ? 'NORMAL' as const : 'WARN' as const },
  }
}

export function buildCreditDecKpis() {
  const m = getMoisCourant()
  return {
    portefeuille: {
      value: m.emprunteurs,
      sparkline: sparkline('emprunteurs'),
      variationMoM: variationMoM('emprunteurs'),
      pipelineLabel: `${m.workflow_pipeline} en pipeline`,
    },
    delai: {
      value: m.delai_validation_j,
      objectif: DELAI_OBJECTIF_J,
      sparkline: sparkline('delai_validation_j'),
      variationMoM: variationMoM('delai_validation_j'),
    },
    tauxDefaut: {
      value: m.taux_defaut_pct,
      sparkline: sparkline('taux_defaut_pct'),
      variationAbs: variationAbsMoM('taux_defaut_pct'),
    },
    recouvrement: {
      value: m.remboursement_pct,
      sparkline: sparkline('remboursement_pct'),
      variationAbs: variationAbsMoM('remboursement_pct'),
    },
  }
}
