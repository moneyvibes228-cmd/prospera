/**
 * KPIs dashboard par rôle — dérivés réseau Mai 2026 (188 / 85,45 M).
 */
import { AGENCES, RESEAU_CONSOLIDE } from './agences'
import { DOSSIERS_CREDIT_STATS } from './credit-dossiers-stats'
import { buildParGranulaireReseau } from './credit-dossiers-stats'
import { buildAlertesCbiTotals } from './mock-audit-builders'
import { buildEpargneStats, buildTransactionsStats } from './mock-operations-registry'
import { buildBceaoRepartition, buildExpectedLossPortefeuille } from './portefeuille-reseau'
import { getMoisCourant, getMoisPrecedent, variationMoM } from './mock-time-series'
import { buildTransactionsSuspectesStats } from './mock-controle-interne-registry'
import { countDossiersBloques, REGISTRE_CLIENTS_RISQUE } from './mock-risque-registry'

const ag = AGENCES[0]

export function buildGestionnaireKpis() {
  const m = getMoisCourant()
  const clientsGp = Math.round(m.emprunteurs * 0.25)
  const collectePct = Math.round((ag.collecte_mois / ag.collecte_objectif) * 100)
  return {
    total_portefeuille: clientsGp,
    clients_a_risque: REGISTRE_CLIENTS_RISQUE.filter(c => c.agence === ag.nom_court).length || 9,
    taux_recouvrement: ag.taux_remboursement,
    visites_aujourd_hui: 6,
    visites_planifiees: 9,
    encours_fcfa: Math.round(ag.encours_fcfa * 0.25),
    collecte_mois: ag.collecte_mois,
    collecte_objectif: ag.collecte_objectif,
    alertes_actives: buildAlertesCbiTotals().total_actifs,
    echeances_7j: Math.round(clientsGp * 0.26),
    messages_whatsapp_non_lus: 8,
    visites_semaine: Math.round(clientsGp * 0.47),
    par_perso: ag.par_courant,
    collecte_objectif_pct: collectePct,
  }
}

export function buildCommercialRoleKpis() {
  const m = getMoisCourant()
  const collecteJour = Math.round(m.collecte_fcfa / 30)
  return {
    visites_aujourd_hui: Math.round(RESEAU_CONSOLIDE.agents_terrain * 0.5),
    objectif_jour: Math.round(RESEAU_CONSOLIDE.agents_terrain * 0.7),
    visites_semaine: Math.round(RESEAU_CONSOLIDE.agents_terrain * 2.3),
    objectif_semaine: Math.round(RESEAU_CONSOLIDE.agents_terrain * 2.9),
    collecte_aujourd_hui: Math.round(collecteJour * 0.04),
    collecte_objectif_jour: Math.round(collecteJour * 0.06),
    prospects_nouveaux: Math.max(1, Math.round(RESEAU_CONSOLIDE.leads_mois / 20)),
    prospects_positifs: Math.round(RESEAU_CONSOLIDE.leads_mois * 0.06),
    taux_conversion: RESEAU_CONSOLIDE.taux_conversion_reseau / 100,
    classement_equipe: 1,
    total_agents: RESEAU_CONSOLIDE.agents_terrain,
    streak_jours: 12,
    badges: ['OR', 'SEMAINE', 'RELEVE'] as string[],
    points_semaine: 1_240,
    points_objectif: 1_500,
  }
}

export function buildCreditRisqueKpis() {
  const m = getMoisCourant()
  const prev = getMoisPrecedent()
  const par = buildParGranulaireReseau()
  const cbi = buildAlertesCbiTotals()
  const el = buildExpectedLossPortefeuille()
  return {
    par_30j: m.par_30,
    par_30j_variation: Number((m.par_30 - prev.par_30).toFixed(1)),
    par_60j: par.par_60.valeur_pct,
    par_90j: m.par_90,
    dossiers_actifs: m.workflow_pipeline,
    en_evaluation: DOSSIERS_CREDIT_STATS.pipeline_14_statuts.find(s => s.statut === 'EN_ANALYSE')?.count ?? Math.round(m.en_attente * 0.5),
    en_approbation: countDossiersBloques(),
    decaissements_ce_mois: m.decaissements,
    montant_decaisse_mois: RESEAU_CONSOLIDE.montant_decaisse_mois,
    taux_approbation: DOSSIERS_CREDIT_STATS.taux_approbation_pct,
    duree_moyenne_traitement: m.delai_validation_j,
    score_moyen_portefeuille: Math.round(100 - m.par_30 * 4),
    signaux_faibles: cbi.total_actifs,
    alertes_critiques: cbi.total_critiques,
    a_debloquer_urgent: countDossiersBloques(),
    expected_loss_fcfa: el.el_total,
  }
}

export function buildFinancesRoleKpis() {
  const m = getMoisCourant()
  const bceao = buildBceaoRepartition()
  const revenus = Math.round(m.collecte_fcfa * 0.22)
  return {
    tresorerie_disponible: m.liquidite_fcfa * 34,
    tresorerie_delta_pct: variationMoM('liquidite_fcfa'),
    resultat_net_mois: Math.round(revenus * 0.33),
    resultat_net_delta_pct: variationMoM('collecte_fcfa'),
    produits_financiers_mois: revenus,
    charges_operationnelles: Math.round(revenus * 0.57),
    ratio_liquidite: Number((m.liquidite_fcfa / (revenus * 0.5)).toFixed(2)),
    cout_risque_pct: Number(((buildExpectedLossPortefeuille().el_total / m.encours_fcfa) * 100).toFixed(1)),
    provisions_ecart: bceao.ecart_provisions,
    encours_reseau: m.encours_fcfa,
    par_reseau: m.par_30,
    coefficient_exploitation_pct: 68,
    marge_nette_pct: 33,
  }
}

export function buildAgentTerrainRoleKpis() {
  const m = getMoisCourant()
  const zoneClients = Math.round(m.emprunteurs / RESEAU_CONSOLIDE.total_agences)
  const objectifJour = Math.round(m.collecte_fcfa / 30 / RESEAU_CONSOLIDE.total_agences)
  return {
    clients_zone: zoneClients,
    visites_jour: Math.round(zoneClients * 0.55),
    visites_objectif: Math.round(zoneClients * 0.82),
    collecte_jour: Math.round(objectifJour * 0.58),
    collecte_objectif_jour: objectifJour,
    impayes_zone: Math.round(zoneClients * m.par_30 / 100),
    score_performance: 84,
    streak_jours: 12,
    classement: 3,
    total_agents: RESEAU_CONSOLIDE.agents_terrain,
    conformite_gps_pct: 94,
    prospects_zone: Math.round(RESEAU_CONSOLIDE.leads_mois / RESEAU_CONSOLIDE.total_agences),
  }
}

export function buildMarketingRoleKpis() {
  const epargne = buildEpargneStats()
  return {
    leads_mois: RESEAU_CONSOLIDE.leads_mois,
    leads_qualifies: Math.round(RESEAU_CONSOLIDE.leads_mois * 0.73),
    leads_convertis: RESEAU_CONSOLIDE.nouveaux_clients,
    taux_conversion_pct: RESEAU_CONSOLIDE.taux_conversion_reseau,
    nps: 72,
    nps_evolution: 4,
    referrals_mois: 18,
    chatbot_conversations_mois: 312,
    chatbot_leads_crees: 47,
    comptes_epargne: epargne.total_comptes,
    dormants_epargne: epargne.dormants,
    pipeline_valeur: Math.round(RESEAU_CONSOLIDE.encours_total * 0.17),
    cac_moyen: 18_400,
    taux_retention_pct: 87,
    clients_perdus_mois: RESEAU_CONSOLIDE.clients_perdus_mois,
  }
}

export function buildManagerRoleKpis() {
  const m = getMoisCourant()
  const tx = buildTransactionsStats()
  return {
    encours_reseau: m.encours_fcfa,
    emprunteurs: m.emprunteurs,
    par_30: m.par_30,
    par_variation: Number((m.par_30 - getMoisPrecedent().par_30).toFixed(1)),
    collecte_mois: m.collecte_fcfa,
    collecte_objectif_pct: Math.round(RESEAU_CONSOLIDE.collecte_totale / RESEAU_CONSOLIDE.collecte_objectif * 100),
    transactions_mois: tx.total_mois,
    agences_conformes: RESEAU_CONSOLIDE.agences_conformes,
    agences_non_conformes: RESEAU_CONSOLIDE.agences_non_conformes,
    remboursement_pct: m.remboursement_pct,
    croissance_encours_pct: variationMoM('encours_fcfa'),
  }
}

export function buildAuditeurRoleKpis() {
  const cbi = buildAlertesCbiTotals()
  const tx = buildTransactionsSuspectesStats()
  return {
    alertes_cbi_actives: cbi.total_actifs,
    alertes_critiques: cbi.total_critiques,
    transactions_suspectes: tx.total,
    en_investigation: tx.en_investigation,
    agences_auditees: RESEAU_CONSOLIDE.total_agences,
    conformite_bceao_pct: Math.round((RESEAU_CONSOLIDE.agences_conformes / RESEAU_CONSOLIDE.total_agences) * 100),
    ecart_provisions: buildBceaoRepartition().ecart_provisions,
    dossiers_bloques: countDossiersBloques(),
  }
}
