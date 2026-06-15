/**
 * Données cœur API — KPIs dérivés de RESEAU_MENSUEL (Mai 2026 canonique).
 */
import type { DashboardKpis, KpiSnapshot } from '@/types'
import { buildParGranulaireReseau } from './credit-dossiers-stats'
import { buildAlertesCbiTotals } from './mock-audit-builders'
import { buildEpargneStats, buildTransactionsStats } from './mock-operations-registry'
import { buildBceaoRepartition, buildExpectedLossPortefeuille } from './portefeuille-reseau'
import { getMoisCourant, RESEAU_MENSUEL, variationMoM } from './mock-time-series'

export function buildMockKpis(): DashboardKpis {
  const m = getMoisCourant()
  const par = buildParGranulaireReseau()
  const cbi = buildAlertesCbiTotals()

  return {
    par_30j: m.par_30,
    par_30j_variation: Number((m.par_30 - RESEAU_MENSUEL[RESEAU_MENSUEL.length - 2].par_30).toFixed(1)),
    par_60j: par.par_60.valeur_pct,
    par_90j: m.par_90,
    taux_remboursement: m.remboursement_pct,
    total_emprunteurs: m.emprunteurs,
    clients_actifs: Math.round(m.emprunteurs * 0.94),
    encours_fcfa: m.encours_fcfa,
    montant_collecte_mois: m.collecte_fcfa,
    alertes_critiques: cbi.total_critiques,
    alertes_surveillance: Math.max(0, cbi.total_actifs - cbi.total_critiques),
    visites_planifiees: Math.round(m.emprunteurs * 0.08),
    visites_effectuees_jour: Math.round(m.emprunteurs * 0.06),
    historique_par: buildMockKpiHistorique(),
  }
}

export function buildMockKpiHistorique(): KpiSnapshot[] {
  return RESEAU_MENSUEL.map((m, i) => ({
    id: String(i + 1),
    semaine: i + 1,
    par_30j: m.par_30,
    par_60j: Number((m.par_30 * 1.15).toFixed(1)),
    par_90j: m.par_90,
    taux_remboursement: m.remboursement_pct,
    total_emprunteurs: m.emprunteurs,
    clients_actifs: Math.round(m.emprunteurs * 0.94),
    encours_fcfa: m.encours_fcfa,
    montant_collecte_fcfa: m.collecte_fcfa,
    alertes_critiques: Math.max(2, 8 - i),
    alertes_surveillance: Math.max(6, 14 - i),
    createdAt: m.id.replace('-', '-') + '-28',
  }))
}

export function buildDgMeta() {
  const m = getMoisCourant()
  const prev = RESEAU_MENSUEL[RESEAU_MENSUEL.length - 2]
  const bceao = buildBceaoRepartition()
  const epargne = buildEpargneStats()
  const tx = buildTransactionsStats()
  const el = buildExpectedLossPortefeuille()

  return {
    expected_loss_fcfa: el.el_total,
    provisions_constituees: bceao.total_provisions_constituees,
    provisions_ecart: bceao.ecart_provisions,
    comptes_epargne: epargne.total_comptes,
    comptes_epargne_delta: Math.max(1, epargne.total_comptes - Math.round(epargne.total_comptes * 0.99)),
    encours_epargne_delta_fcfa: Math.round(epargne.encours_epargne_total * variationMoM('collecte_fcfa') / 100),
    transactions_mois: tx.total_mois,
    transactions_delta_pct: variationMoM('collecte_fcfa'),
    decaissements_mois: m.decaissements,
    decaissements_montant: Math.round(m.encours_fcfa * 0.29),
    taux_approbation: Math.round((m.approuves / Math.max(1, m.approuves + m.refuses)) * 1000) / 10,
    dossiers_rejetes: m.refuses,
    encours_mois_precedent: prev.encours_fcfa,
    par_mois_precedent: prev.par_30,
    provisions_mois_precedent: prev.provisions_fcfa,
    transactions_mois_precedent: Math.round(tx.total_mois * 0.92),
    decaissements_mois_precedent: prev.decaissements,
    comptes_epargne_mois_precedent: epargne.total_comptes - Math.max(1, epargne.total_comptes - Math.round(epargne.total_comptes * 0.99)),
  }
}
