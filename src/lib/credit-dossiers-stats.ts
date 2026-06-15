/**
 * Stats crédit / décisions — dérivées de mock-time-series + portefeuille-reseau
 */
import {
  buildEvolutionDecisions6Mois,
  buildParGranulaireFromPar30,
  DELAI_OBJECTIF_J,
  getMoisCourant,
  RESEAU_MENSUEL,
} from './mock-time-series'
import { getPortefeuilleConsolide, PORTEFEUILLE_AGING_RESEAU } from './portefeuille-reseau'

function scaleIntegers(parts: number[], target: number): number[] {
  const total = parts.reduce((s, n) => s + n, 0)
  if (total === 0) return parts.map(() => 0)
  const raw = parts.map(n => (n / total) * target)
  const floored = raw.map(n => Math.floor(n))
  let remainder = target - floored.reduce((s, n) => s + n, 0)
  const order = raw.map((n, i) => ({ i, frac: n - Math.floor(n) })).sort((a, b) => b.frac - a.frac)
  const result = [...floored]
  for (let k = 0; k < order.length && remainder > 0; k++) {
    result[order[k].i] += 1
    remainder -= 1
  }
  return result
}

function scaleEncours(parts: number[], target: number): number[] {
  const total = parts.reduce((s, n) => s + n, 0)
  if (total === 0) return parts.map(() => 0)
  const scaled = parts.map(n => Math.round((n / total) * target))
  const diff = target - scaled.reduce((s, n) => s + n, 0)
  if (diff !== 0) scaled[0] += diff
  return scaled
}

/** Proportions portefeuille par tranche (ratios recalés sur emprunteurs courants) */
const TRANCHES_BASE = [
  { tranche: '< 100k FCFA', label: 'Très petits', share: 18, encours: 1_400_000, taux_approbation: 88, taux_par: 4.2, color: '#22c55e' },
  { tranche: '100k - 500k', label: 'Petits', share: 89, encours: 24_800_000, taux_approbation: 78, taux_par: 6.4, color: '#14b8a6' },
  { tranche: '500k - 1M', label: 'Moyens', share: 47, encours: 32_400_000, taux_approbation: 62, taux_par: 8.1, color: '#3b82f6' },
  { tranche: '1M - 5M', label: 'Importants', share: 23, encours: 38_200_000, taux_approbation: 48, taux_par: 9.8, color: '#f97316' },
  { tranche: '> 5M FCFA', label: 'Gros montants', share: 11, encours: 30_800_000, taux_approbation: 36, taux_par: 12.3, color: '#dc2626' },
] as const

const MOTIFS_REJET_BASE = [
  { motif: 'Revenus insuffisants vs mensualité', severity: 'CRITIQUE' as const, share: 18 },
  { motif: 'Activité économique non vérifiable', severity: 'CRITIQUE' as const, share: 11 },
  { motif: 'Endettement externe excessif', severity: 'CRITIQUE' as const, share: 9 },
  { motif: 'Garanties / cautions insuffisantes', severity: 'HAUTE' as const, share: 8 },
  { motif: 'Historique négatif autre IMF', severity: 'HAUTE' as const, share: 6 },
  { motif: 'Documents falsifiés détectés', severity: 'CRITIQUE' as const, share: 4 },
  { motif: 'Taux d\'effort > 33% (CBI v5)', severity: 'HAUTE' as const, share: 4 },
  { motif: 'Concentration sectorielle (alerte CBI)', severity: 'NORMALE' as const, share: 3 },
]

const MOTIFS_RESTRUCT_BASE = [
  { motif: 'Mauvaise récolte / saisonnalité', share: 8 },
  { motif: 'Maladie / urgence familiale', share: 6 },
  { motif: 'Perte client commercial majeur', share: 4 },
  { motif: 'Réinvestissement non planifié', share: 3 },
  { motif: 'Conjoncture défavorable secteur', share: 2 },
]

/** Workflow pré-décaissement — proportions Mai (base 92 dossiers) */
const WORKFLOW_BASE = [
  { statut: 'PROSPECT', share: 23, montant: 8_400_000 },
  { statut: 'SOUMIS', share: 18, montant: 6_200_000 },
  { statut: 'DOCS_INCOMPLETS', share: 7, montant: 2_800_000 },
  { statut: 'DOSSIER_COMPLET', share: 12, montant: 5_400_000 },
  { statut: 'EN_VISITE', share: 9, montant: 4_100_000 },
  { statut: 'EN_ANALYSE', share: 8, montant: 3_800_000 },
  { statut: 'VALIDE_CHARGE', share: 6, montant: 3_200_000 },
  { statut: 'EN_ANALYSE_ROC', share: 4, montant: 2_400_000 },
  { statut: 'APPROUVE_ROC', share: 3, montant: 1_800_000 },
  { statut: 'DECAISSEMENT', share: 2, montant: 1_200_000 },
] as const

function buildWorkflowPreDecaissement(pipelineTotal: number) {
  const counts = scaleIntegers(WORKFLOW_BASE.map(w => w.share), pipelineTotal)
  const montants = scaleEncours(WORKFLOW_BASE.map(w => w.montant), Math.round(pipelineTotal * 45_000))
  return WORKFLOW_BASE.map((w, i) => ({
    statut: w.statut,
    count: counts[i],
    montant_estime: montants[i],
  }))
}

/** Évolution du workflow sur 6 mois (pour sparklines pipeline) */
export function buildWorkflowEvolution6Mois() {
  return RESEAU_MENSUEL.map(m => ({
    mois: m.label,
    pipeline: m.workflow_pipeline,
    soumis: m.soumis,
  }))
}

export function buildDossiersCreditStats() {
  const mois = getMoisCourant()
  const { emprunteurs, encours } = getPortefeuilleConsolide()

  const counts = scaleIntegers(TRANCHES_BASE.map(t => t.share), emprunteurs)
  const encoursTranches = scaleEncours(TRANCHES_BASE.map(t => t.encours), encours)

  const par_tranche_montant = TRANCHES_BASE.map((t, i) => ({
    tranche: t.tranche,
    label: t.label,
    count: counts[i],
    encours: encoursTranches[i],
    taux_approbation: t.taux_approbation,
    taux_par: t.taux_par,
    color: t.color,
  }))

  const rejCounts = scaleIntegers(MOTIFS_REJET_BASE.map(m => m.share), mois.refuses)
  const motifs_rejet = MOTIFS_REJET_BASE.map((m, i) => ({
    ...m,
    count: rejCounts[i],
    pct: mois.refuses > 0 ? Number(((rejCounts[i] / mois.refuses) * 100).toFixed(1)) : 0,
  }))

  const restructCounts = scaleIntegers(MOTIFS_RESTRUCT_BASE.map(m => m.share), mois.restructures)
  const motifs_restructuration = MOTIFS_RESTRUCT_BASE.map((m, i) => ({
    ...m,
    count: restructCounts[i],
    pct: mois.restructures > 0 ? Math.round((restructCounts[i] / mois.restructures) * 100) : 0,
  }))

  const workflowPreDecaissement = buildWorkflowPreDecaissement(mois.workflow_pipeline)
  const enRetard = PORTEFEUILLE_AGING_RESEAU.filter(t => t.tranche !== 'Courant').reduce((s, t) => s + t.count, 0)
  const enContentieux = PORTEFEUILLE_AGING_RESEAU.find(t => t.tranche.includes('>90'))?.count ?? 0

  const pipeline_14_statuts = [
    ...workflowPreDecaissement,
    { statut: 'EN_GESTION', count: emprunteurs, montant_estime: encours },
    { statut: 'EN_RETARD', count: enRetard, montant_estime: PORTEFEUILLE_AGING_RESEAU.filter(t => t.tranche !== 'Courant').reduce((s, t) => s + t.montant, 0) },
    { statut: 'CONTENTIEUX', count: enContentieux, montant_estime: PORTEFEUILLE_AGING_RESEAU.find(t => t.tranche.includes('>90'))?.montant ?? 0 },
    { statut: 'CLOTURE', count: Math.round(emprunteurs * 0.76), montant_estime: 0 },
  ]

  return {
    mois_courant: mois.label,
    total_soumis_mois: mois.soumis,
    approuves: mois.approuves,
    refuses: mois.refuses,
    en_attente: mois.en_attente,
    restructures: mois.restructures,
    contentieux: mois.contentieux,
    taux_approbation_pct: mois.soumis > 0 ? Number(((mois.approuves / mois.soumis) * 100).toFixed(1)) : 0,
    taux_rejet_pct: mois.soumis > 0 ? Number(((mois.refuses / mois.soumis) * 100).toFixed(1)) : 0,
    delai_moyen_traitement_jours: mois.delai_validation_j,
    delai_objectif_jours: DELAI_OBJECTIF_J,
    portefeuille_actif: emprunteurs,
    encours_portefeuille_fcfa: encours,
    workflow_pre_decaissement: mois.workflow_pipeline,
    par_tranche_montant,
    motifs_rejet,
    motifs_restructuration,
    pipeline_14_statuts,
    evolution_decisions_6mois: buildEvolutionDecisions6Mois(),
    evolution_workflow_6mois: buildWorkflowEvolution6Mois(),
  }
}

export function buildRisqueAgingDetail() {
  const totalCount = PORTEFEUILLE_AGING_RESEAU.reduce((s, t) => s + t.count, 0)
  const byTranche = Object.fromEntries(PORTEFEUILLE_AGING_RESEAU.map(t => [t.tranche, t]))

  const courant = byTranche['Courant'] ?? { count: 0, montant: 0 }
  const j1_30 = byTranche['1-30j'] ?? { count: 0, montant: 0 }
  const j31_60 = byTranche['31-60j'] ?? { count: 0, montant: 0 }
  const j61_90 = byTranche['61-90j'] ?? { count: 0, montant: 0 }
  const j90plus = PORTEFEUILLE_AGING_RESEAU.find(t => t.tranche.includes('>90')) ?? { count: 0, montant: 0 }

  const split17 = scaleIntegers([35, 65], j1_30.count)
  const splitEnc17 = scaleEncours([35, 65], j1_30.montant)

  const buckets = {
    courant: { count: courant.count, encours: courant.montant },
    j_1_7: { count: split17[0], encours: splitEnc17[0] },
    j_8_30: { count: split17[1], encours: splitEnc17[1] },
    j_31_60: { count: j31_60.count, encours: j31_60.montant },
    j_61_90: { count: j61_90.count, encours: j61_90.montant },
    j_90_plus: { count: j90plus.count, encours: j90plus.montant },
  }

  const keys = ['courant', 'j_1_7', 'j_8_30', 'j_31_60', 'j_61_90', 'j_90_plus'] as const
  return Object.fromEntries(
    keys.map(k => [
      k,
      {
        count: buckets[k].count,
        encours: buckets[k].encours,
        pct: totalCount > 0 ? Number(((buckets[k].count / totalCount) * 100).toFixed(1)) : 0,
      },
    ]),
  ) as {
    courant: { count: number; encours: number; pct: number }
    j_1_7: { count: number; encours: number; pct: number }
    j_8_30: { count: number; encours: number; pct: number }
    j_31_60: { count: number; encours: number; pct: number }
    j_61_90: { count: number; encours: number; pct: number }
    j_90_plus: { count: number; encours: number; pct: number }
  }
}

export const DOSSIERS_CREDIT_STATS = buildDossiersCreditStats()

export function buildParGranulaireReseau() {
  const mois = getMoisCourant()
  return buildParGranulaireFromPar30(mois.par_30, mois.encours_fcfa)
}

export { buildCreditDecKpis } from './mock-time-series'
