/**
 * Builders persona — MOCK_*_HOME (KPIs dérivés) + RAPPORT_IA statiques.
 * Sources : AGENCES, RESEAU_MENSUEL, registres risque/contrôle, DOSSIERS CC.
 */
import { AGENCES, AGENCES_DATA, RESEAU_CONSOLIDE } from './agences'
import { isAgentTerrain } from './ra-role-utils'
import { getAgenceComparaisonMoM, getTresorerieAgence } from './ra-agence-metrics'
import { DOSSIERS_CREDIT_STATS } from './credit-dossiers-stats'
import {
  buildAlertesCbiTotals,
} from './mock-audit-builders'
import { buildTransactionsSuspectesStats } from './mock-controle-interne-registry'
import { buildCashGlobal, buildCashParAgence, buildTransactionsStats } from './mock-operations-registry'
import {
  buildParGranulaireFromPar30,
  getMoisCourant,
  getMoisPrecedent,
  RESEAU_MENSUEL,
  sparkline,
  variationMoM,
} from './mock-time-series'
import {
  countDossiersBloques,
  REGISTRE_CLIENTS_RISQUE,
  REGISTRE_DOSSIERS_BLOQUES,
} from './mock-risque-registry'
import { buildExpectedLossPortefeuille, buildBceaoRepartition } from './portefeuille-reseau'
import { buildEpargneStats } from './mock-operations-registry'
import type { RapportIA } from '@/types/rapport-ia'
import { buildRapportIARa as buildRapportIARaEnrichi } from './rapport-ra-builder'
import {
  buildGpHomeExtra,
  buildGpLomeCentreStats,
  buildGpSyntheseExecutive,
  buildGpSynthesePiliers,
  rapportComparaisonMoMGp,
  rapportPrevisionsGp,
} from './gp-lome-centre-stats'

export { buildRapportIARaEnrichi as buildRapportIARa }

function fmtM(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2).replace('.', ',')}M` : `${Math.round(n / 1000)}k`
}

function rapportPrevisionsStandard() {
  const m = getMoisCourant()
  return [
    { metrique: 'PAR 30', valeur_actuelle: `${m.par_30}%`, valeur_prevue: `${Math.max(4, Number((m.par_30 - 0.5).toFixed(1)))}%`, confidence: 75 },
    { metrique: 'Encours', valeur_actuelle: fmtM(m.encours_fcfa), valeur_prevue: fmtM(Math.round(m.encours_fcfa * 1.02)), confidence: 80 },
    { metrique: 'Remboursement', valeur_actuelle: `${m.remboursement_pct}%`, valeur_prevue: `${Math.min(99, m.remboursement_pct + 1)}%`, confidence: 78 },
  ]
}

function rapportComparaisonMoM() {
  const m = getMoisCourant()
  const prev = getMoisPrecedent()
  return [
    { metrique: 'Encours', mois_precedent: fmtM(prev.encours_fcfa), mois_courant: fmtM(m.encours_fcfa), variation_pct: variationMoM('encours_fcfa') },
    { metrique: 'PAR 30', mois_precedent: `${prev.par_30}%`, mois_courant: `${m.par_30}%`, variation_pct: Number(((m.par_30 - prev.par_30) / Math.max(prev.par_30, 0.1) * 100).toFixed(1)) },
    { metrique: 'Collecte', mois_precedent: fmtM(prev.collecte_fcfa), mois_courant: fmtM(m.collecte_fcfa), variation_pct: variationMoM('collecte_fcfa') },
  ]
}

function collectePctAgence(agenceId: string): number {
  const a = AGENCES.find(x => x.id === agenceId)
  if (!a || a.collecte_objectif === 0) return 0
  return Math.round((a.collecte_mois / a.collecte_objectif) * 100)
}

function mapSuggestionRoc(score: number, alertesCritiques: number): 'APPROUVER' | 'APPROUVER_REDUIT' | 'REFUSER' | 'DEMANDER_GARANTIES' {
  if (alertesCritiques >= 2 || score < 55) return 'REFUSER'
  if (alertesCritiques >= 1 || score < 65) return 'DEMANDER_GARANTIES'
  if (score >= 65 && score < 75) return 'APPROUVER_REDUIT'
  return 'APPROUVER'
}

// ─── ROC HOME ────────────────────────────────────────────────────────────────

export function buildRocHeatmapAgences() {
  const m = getMoisCourant()
  return AGENCES.map(a => {
    const par = buildParGranulaireFromPar30(a.par_courant, a.encours_fcfa)
    const statut = a.par_courant >= 10 ? 'CRITIQUE' as const
      : a.par_courant >= 8 ? 'NORMAL' as const
      : a.par_courant <= 5 ? 'BON' as const
      : 'NORMAL' as const
    return {
      agence_id: a.id,
      agence: a.nom_court,
      par_1: par.par_1.valeur_pct,
      par_7: par.par_7.valeur_pct,
      par_30: a.par_courant,
      par_90: par.par_90.valeur_pct,
      encours: a.encours_fcfa,
      statut,
    }
  })
}

export function buildRocCashSynthese() {
  const cash = buildCashParAgence()
  const global = buildCashGlobal()
  const urgents = cash
    .filter(a => a.niveau === 'CRITIQUE_BAS' || a.niveau === 'TENSION')
    .sort((a, b) => (a.niveau === 'CRITIQUE_BAS' ? 0 : 1) - (b.niveau === 'CRITIQUE_BAS' ? 0 : 1))
  const transferts_urgents_libelle = urgents.length
    ? urgents
      .map(a => `${a.agence_nom}${a.niveau === 'CRITIQUE_BAS' ? ' (urgent)' : ' (matin)'}`)
      .join(' + ')
    : 'Aucun virement urgent'
  return {
    total_disponible: global.total_reseau,
    agences_critiques: global.agences_critiques,
    agences_tension: global.agences_tension,
    agences_normales: cash.filter(c => c.niveau === 'NORMAL').length,
    agences_excedent: global.agences_excedent,
    transferts_recommandes: global.transferts_recommandes_montant,
    transferts_urgents_libelle,
    derniere_maj: 'il y a 8 min',
  }
}

export function buildRocFileValidationFromRegistry() {
  const rocDossiers = REGISTRE_DOSSIERS_BLOQUES.filter(
    d => d.statut_workflow.includes('ROC') || d.statut_workflow === 'EN_ATTENTE_DEC',
  )
  return rocDossiers.map(d => {
    const score = Math.max(52, 88 - Math.floor(d.bloque_depuis_h / 6))
    const alertes = d.raison.toLowerCase().includes('garant') ? 1 : 0
    return {
      reference: d.id,
      client: d.client,
      activite: d.etape,
      agence: d.agence,
      montant_demande: d.montant,
      score_consolide: score,
      classe_bceao: (score >= 75 ? 'PERFORMANT' : score >= 65 ? 'SOUS_SURVEILLANCE' : 'DOUTEUX') as 'PERFORMANT' | 'SOUS_SURVEILLANCE' | 'DOUTEUX',
      pd_pct: Number((100 - score) * 0.28),
      el_estimee: Math.round(d.montant * 0.08),
      avis_cc: (score >= 75 ? 'FAVORABLE' : score >= 65 ? 'FAVORABLE_REDUIT' : 'A_DEMANDER_GARANTIES') as 'FAVORABLE' | 'FAVORABLE_REDUIT' | 'A_DEMANDER_GARANTIES',
      note_cc: Number((score / 10).toFixed(1)),
      charge_credit: d.agent,
      alertes_critiques: alertes,
      attente_h: d.bloque_depuis_h,
      suggestion_ia: mapSuggestionRoc(score, alertes),
    }
  })
}

export function buildRocAlertesPriorisees() {
  const m = getMoisCourant()
  const cash = buildCashParAgence()
  const bk = cash.find(c => c.agence_id === 'AG-003')
  const rocAttente = countDossiersBloques()
  const cbi = buildAlertesCbiTotals()
  const depotPreRdv = cbi.byCode.DEPOT_PRE_RDV_SUSPECT ?? 3
  const bkAgence = AGENCES.find(a => a.id === 'AG-003')!

  return [
    {
      id: 'AROC-001',
      domaine: 'CASH' as const,
      severite: 'CRITIQUE' as const,
      titre: `Cash ${bkAgence.nom_court} sous seuil minimum`,
      detail: `Disponible ${fmtM(bk?.cash_disponible ?? 0)} FCFA · Min requis ${fmtM(bk?.cash_minimum_requis ?? 0)} · Décaissements prévus ${fmtM(bk?.decaissements_prevus_jour ?? 0)}.`,
      metric_actuelle: fmtM(bk?.cash_disponible ?? 0),
      seuil: fmtM(bk?.cash_minimum_requis ?? 0),
      action: `Virement urgent ${fmtM(Math.max(0, (bk?.cash_minimum_requis ?? 0) - (bk?.cash_disponible ?? 0) + 800_000))} siège → ${bkAgence.nom_court} avant 10h`,
      cta_label: 'Voir détail cash agences',
      cta_target: 'CREDIT_TRESORERIE' as const,
    },
    {
      id: 'AROC-002',
      domaine: 'CREDIT' as const,
      severite: 'CRITIQUE' as const,
      titre: `${rocAttente} dossiers en attente ROC > 48h`,
      detail: `Cumul ${fmtM(REGISTRE_DOSSIERS_BLOQUES.filter(d => d.statut_workflow.includes('ROC')).reduce((s, d) => s + d.montant, 0))} bloqués. SLA validation ROC dépassé.`,
      metric_actuelle: `${rocAttente} dossiers`,
      seuil: '48h max',
      action: `Valider les ${rocAttente} dossiers ce matin (file de validation ci-dessous)`,
      cta_label: 'Voir workflow & SLA',
      cta_target: 'CREDIT_WORKFLOW' as const,
    },
    {
      id: 'AROC-003',
      domaine: 'CREDIT' as const,
      severite: 'HAUTE' as const,
      titre: `PAR 30j ${bkAgence.nom_court} dépasse seuil BCEAO`,
      detail: `PAR 30j agence = ${bkAgence.par_courant}% (seuil interne 8%, BCEAO 10%).`,
      metric_actuelle: `${bkAgence.par_courant}%`,
      seuil: '10% (BCEAO)',
      action: 'Mission de recouvrement renforcée + restructurer dossiers prioritaires',
      cta_label: 'Voir détail risque',
      cta_target: 'CREDIT_RISQUE' as const,
    },
    {
      id: 'AROC-004',
      domaine: 'OPERATIONNEL' as const,
      severite: 'HAUTE' as const,
      titre: 'Délai moyen validation dépasse SLA',
      detail: `Délai courant ${m.delai_validation_j}j vs objectif 3j (+${Math.round((m.delai_validation_j / 3 - 1) * 100)}%).`,
      metric_actuelle: `${m.delai_validation_j} j`,
      seuil: '3 j',
      action: 'Réunion CC/ROC pour fluidifier analyse',
      cta_label: 'Voir workflow',
      cta_target: 'CREDIT_WORKFLOW' as const,
    },
    {
      id: 'AROC-005',
      domaine: 'FRAUDE' as const,
      severite: 'CRITIQUE' as const,
      titre: `${depotPreRdv} dépôts pré-RDV suspects détectés`,
      detail: 'Solde gonflé 24-72h avant analyse — risque manipulation score CBI.',
      metric_actuelle: `${depotPreRdv} cas`,
      seuil: '0',
      action: 'Investigation immédiate · Bloquer décaissements concernés',
      cta_label: 'Voir contrôle opérationnel',
      cta_target: 'CREDIT_CONTROLE' as const,
    },
  ]
}

export function buildRocActiviteOp() {
  const tx = buildTransactionsStats()
  const m = getMoisCourant()
  return {
    transactions_jour: tx.total_jour,
    volume_transactionnel: tx.montant_jour,
    decaissements_jour_montant: Math.round(RESEAU_CONSOLIDE.montant_decaisse_mois / 30),
    decaissements_jour_count: Math.max(1, Math.round(RESEAU_CONSOLIDE.decaissements_mois / 30)),
    remboursements_jour_montant: Math.round(m.collecte_fcfa / 30),
    incidents_systeme_actifs: 1,
    tickets_p1: 1,
  }
}

export function buildRocHomeDerived() {
  const m = getMoisCourant()
  const el = buildExpectedLossPortefeuille()
  return {
    heatmap_par_agences: buildRocHeatmapAgences(),
    cash_synthese: buildRocCashSynthese(),
    file_validation: buildRocFileValidationFromRegistry(),
    alertes_priorisees: buildRocAlertesPriorisees(),
    activite_op: buildRocActiviteOp(),
    recommandations_ia: [
      { priorite: 1, action: `Virement urgent Bè Kpota — ${fmtM(buildCashGlobal().transferts_recommandes_montant)} avant 10h00`, impact: 'Évite rupture cash', delai: 'Avant 10h' },
      { priorite: 2, action: `Valider les ${countDossiersBloques()} dossiers en attente ROC`, impact: `Décaissement ${fmtM(REGISTRE_DOSSIERS_BLOQUES.reduce((s, d) => s + d.montant, 0))}`, delai: "Aujourd'hui" },
      { priorite: 3, action: `Investiguer ${buildAlertesCbiTotals().byCode.DEPOT_PRE_RDV_SUSPECT ?? 3} dépôts pré-RDV suspects`, impact: 'Évite perte estimée 1.2M FCFA', delai: '48h' },
      { priorite: 4, action: `PAR Bè Kpota ${AGENCES.find(a => a.id === 'AG-003')?.par_courant}% — plan redressement`, impact: `EL réseau ${fmtM(el.el_total)}`, delai: '1 semaine' },
    ],
    equipes: {
      charges_credit: [
        { nom: 'Elom Adjavon', dossiers_actifs: m.en_attente, decisions_jour: Math.round(DOSSIERS_CREDIT_STATS.approuves / 30), qualite_pct: 89, charge: m.en_attente > 10 ? 'ELEVEE' as const : 'NORMALE' as const },
        { nom: 'Mawuli Sodji', dossiers_actifs: Math.round(m.en_attente * 0.7), decisions_jour: 2, qualite_pct: 92, charge: 'NORMALE' as const },
      ],
      responsables_agence: RESEAU_CONSOLIDE.responsables_agence,
      gestionnaires_pf: 8,
      agents_terrain: RESEAU_CONSOLIDE.agents_terrain,
    },
    kpis_credit_etendus: {
      encours_reseau: m.encours_fcfa,
      par_30_reseau: m.par_30,
      par_90_reseau: m.par_90,
      el_reseau: el.el_total,
      dossiers_pipeline: m.workflow_pipeline,
      taux_approbation: DOSSIERS_CREDIT_STATS.taux_approbation_pct,
    },
  }
}

// ─── RA HOME (Lomé Centre par défaut) ────────────────────────────────────────

export function buildRaHomeDerived(agenceId = 'AG-001') {
  const ag = AGENCES.find(a => a.id === agenceId)!
  const m = getMoisCourant()
  const prev = getMoisPrecedent()
  const treso = getTresorerieAgence(agenceId)
  const comparaison = getAgenceComparaisonMoM(agenceId)
  const collectePct = collectePctAgence(agenceId)
  const detail = AGENCES_DATA[agenceId]
  const parPrec =
    detail?.par_historique?.[detail.par_historique.length - 2]?.par_30j ??
    ag.par_courant
  const epargneAg = buildEpargneStats().par_agence.find(p => p.agence_id === agenceId)
  const performersTerrain =
    detail?.agents_performance.filter(a => isAgentTerrain(a.role)) ??
    RESEAU_CONSOLIDE.agents_performance
      .filter(a => a.agence === agenceId && isAgentTerrain(a.role))
  const rapportRa = buildRapportIARaEnrichi(agenceId)

  return {
    synthese_ia_agence: {
      date_generation: rapportRa.date_generation,
      intro: rapportRa.synthese_executive,
      points:
        rapportRa.synthese_piliers?.map(p => ({
          icon: 'pilier',
          texte: p.contenu,
          tone: 'info' as const,
        })) ?? [],
      recommandations: rapportRa.recommandations?.map(r => r.action) ?? [],
    },
    kpis_activite: {
      clients_emprunteurs: ag.emprunteurs_actifs,
      clients_epargne: epargneAg?.count ?? 0,
      clients_total: ag.emprunteurs_actifs,
      encours_agence: ag.encours_fcfa,
      depots_collectes_jour: Math.round(ag.collecte_mois / 30),
      decaissements_jour: Math.round(RESEAU_CONSOLIDE.montant_decaisse_mois * (ag.encours_fcfa / m.encours_fcfa) / 30),
      transactions_jour: Math.round(buildTransactionsStats().total_jour * (ag.encours_fcfa / m.encours_fcfa)),
      liquidite_disponible: treso.liquidite_disponible,
      sparkline_encours: sparkline('encours_fcfa').map(v => Math.round(v * (ag.encours_fcfa / m.encours_fcfa))),
    },
    kpis_credit: {
      par_30_pct: ag.par_courant,
      par_30_evolution_pts: Number((ag.par_courant - parPrec).toFixed(1)),
      montant_impayes: Math.round(ag.encours_fcfa * (ag.par_courant / 100) * 0.35),
      taux_remboursement_pct: ag.taux_remboursement,
      nb_dossiers_actifs: ag.emprunteurs_actifs,
      dossiers_en_retard: Math.round(ag.emprunteurs_actifs * (ag.par_courant / 100)),
    },
    kpis_commercial: {
      nouveaux_clients_jour: Math.max(1, Math.round(ag.nouveaux_clients_mois / 20)),
      nouveaux_clients_mois: ag.nouveaux_clients_mois,
      objectif_atteint_pct: collectePct,
      produits_vendus_mois: [
        { produit: 'Crédit Individuel', vendus: Math.round(ag.nouveaux_clients_mois * 0.55), objectif: Math.round(ag.nouveaux_clients_mois * 0.65) },
        { produit: 'Crédit PME', vendus: Math.round(ag.nouveaux_clients_mois * 0.35), objectif: Math.round(ag.nouveaux_clients_mois * 0.45) },
        { produit: 'Épargne', vendus: Math.round(buildEpargneStats().par_agence.find(p => p.agence_id === agenceId)?.count ?? 0 * 0.12), objectif: 40 },
      ],
      taux_conversion_pct: RESEAU_CONSOLIDE.taux_conversion_reseau,
      croissance_portefeuille_pct: comparaison.encours.variation_pct,
    },
    equipe: performersTerrain.map(a => ({
      agent: a.agent,
      role: a.role ?? 'Commercial',
      portefeuille: Math.round(ag.encours_fcfa * (a.collecte / Math.max(ag.collecte_mois, 1))),
      collecte_jour: Math.round(a.collecte / 30),
      par_30: a.par,
      performance_pct: a.score,
      badge: a.badge as 'OR' | 'ARGENT' | 'BRONZE' | null,
      statut: a.score >= 85 ? 'BON' as const : a.score >= 70 ? 'NORMAL' as const : 'DEGRADE' as const,
    })),
    tresorerie: {
      solde_caisse: treso.caisse_physique_fcfa,
      liquidite_agence: treso.liquidite_disponible,
      entrees_jour: Math.round(ag.collecte_mois / 30),
      sorties_jour: Math.round(RESEAU_CONSOLIDE.montant_decaisse_mois * (ag.encours_fcfa / m.encours_fcfa) / 30),
      flux_net_jour: Math.round(ag.collecte_mois / 30 - RESEAU_CONSOLIDE.montant_decaisse_mois / 30 * (ag.encours_fcfa / m.encours_fcfa)),
      niveau_liquidite_pct: treso.ratio_couverture_pct,
      seuil_minimum_fcfa: treso.reserve_obligatoire,
      seuil_alerte_fcfa: Math.round(treso.reserve_obligatoire * 1.2),
      statut: (treso.ratio_couverture_pct < 240
        ? 'TENSION'
        : treso.ratio_couverture_pct >= 600
          ? 'EXCEDENT'
          : 'NORMAL') as 'NORMAL' | 'TENSION' | 'CRITIQUE' | 'EXCEDENT',
    },
  }
}

// ─── CC HOME ─────────────────────────────────────────────────────────────────

export interface DossierCcLike {
  reference: string
  client_nom: string
  activite: string
  etape_courante: string
  score_consolide: number
  classe_bceao: string
  montant_demande: number
  alertes_actives: { code: string; severite: string; message: string }[]
}

export function buildCcHomeDerived(dossiers: DossierCcLike[]) {
  const stats = DOSSIERS_CREDIT_STATS
  const m = getMoisCourant()
  const dossiersAnalyseCc = dossiers.filter(d => d.etape_courante === 'EN_ANALYSE')
  const critiques = dossiersAnalyseCc.reduce((s, d) => s + d.alertes_actives.filter(a => a.severite === 'CRITICAL').length, 0)
  const scoreMoy = dossiersAnalyseCc.length > 0
    ? Math.round(dossiersAnalyseCc.reduce((s, d) => s + d.score_consolide, 0) / dossiersAnalyseCc.length)
    : 68

  const maFile = [...dossiersAnalyseCc]
    .sort((a, b) => {
      const pa = a.alertes_actives.some(x => x.severite === 'CRITICAL') ? 0 : 1
      const pb = b.alertes_actives.some(x => x.severite === 'CRITICAL') ? 0 : 1
      return pa - pb || b.montant_demande - a.montant_demande
    })
    .slice(0, 8)
    .map(d => ({
      reference: d.reference,
      client: d.client_nom,
      activite: d.activite,
      etape: d.etape_courante,
      score: d.score_consolide,
      classe: d.classe_bceao,
      montant: d.montant_demande,
      attente_h: 24,
      priorite: (d.alertes_actives.some(a => a.severite === 'CRITICAL') ? 'CRITIQUE' : d.montant_demande >= 1_000_000 ? 'HAUTE' : 'NORMALE') as 'CRITIQUE' | 'HAUTE' | 'NORMALE',
      alertes_critiques: d.alertes_actives.filter(a => a.severite === 'CRITICAL').length,
      prochaine_action: d.alertes_actives[0]?.message ?? 'Poursuivre analyse CC',
    }))

  const mesAlertes = dossiersAnalyseCc.flatMap(d =>
    d.alertes_actives.map(a => ({
      dossier: d.reference,
      client: d.client_nom,
      code: a.code,
      severite: a.severite as 'CRITICAL' | 'WARN' | 'INFO',
      detail: a.message,
    })),
  )

  return {
    mes_kpis: {
      en_attente_total: dossiersAnalyseCc.length,
      en_attente_prioritaires: dossiersAnalyseCc.filter(d => d.alertes_actives.some(a => a.severite === 'CRITICAL') || d.montant_demande >= 1_000_000).length,
      decisions_jour: Math.round(stats.approuves / 30),
      decisions_semaine: Math.round(stats.approuves / 4),
      decisions_mois: stats.approuves + stats.refuses,
      delai_moyen_perso_h: Math.round(m.delai_validation_j * 9),
      delai_objectif_h: 24,
      taux_approbation_perso: stats.taux_approbation_pct,
      score_moyen_attribue: scoreMoy,
      qualite_decisions_pct: 88,
    },
    ma_file_aujourdhui: maFile,
    mes_alertes_cbi: mesAlertes,
    vs_equipe: {
      mon_score_moy: scoreMoy,
      equipe_score_moy: Math.round(100 - m.par_30 * 4),
      mon_delai_h: Math.round(m.delai_validation_j * 9),
      equipe_delai_h: Math.round(m.delai_validation_j * 10),
      mon_taux_approb: stats.taux_approbation_pct,
      equipe_taux_approb: stats.taux_approbation_pct - 3,
      ma_qualite: 88,
      equipe_qualite: 86,
    },
    qualite_6_mois: RESEAU_MENSUEL.map(x => ({
      mois: x.label,
      qualite: 84 + RESEAU_MENSUEL.indexOf(x),
    })),
    kpis_portefeuille_perso: {
      clients_actifs: Math.round(m.emprunteurs * 0.22),
      portefeuille_fcfa: Math.round(m.encours_fcfa * 0.068),
      montant_a_collecter_jour: Math.round(m.collecte_fcfa * 0.022),
      montant_collecte_jour: Math.round(m.collecte_fcfa * 0.022 * 0.58),
      visites_prevues_jour: 8,
      visites_realisees_jour: 3,
      taux_remboursement_pct: m.remboursement_pct,
      dossiers_en_retard: Math.round(m.emprunteurs * (m.par_30 / 100) * 0.22),
    },
    synthese_ia_journee: {
      date_generation: "aujourd'hui 07:15",
      intro: `${dossiersAnalyseCc.length} dossiers en analyse CC · ${critiques} alertes CBI critiques · délai réseau ${m.delai_validation_j}j (obj. 3j).`,
      points: [
        { icon: 'doc', texte: `${maFile.filter(f => f.priorite === 'CRITIQUE').length} dossier(s) priorité critique ce matin.`, tone: 'negatif' as const },
        { icon: 'risk', texte: `${mesAlertes.filter(a => a.severite === 'CRITICAL').length} alertes CBI CRITICAL actives sur vos dossiers.`, tone: 'negatif' as const },
        { icon: 'team', texte: `Taux approbation réseau ${stats.taux_approbation_pct}% · votre score moyen ${scoreMoy}/100.`, tone: 'info' as const },
      ],
      priorites: [
        ...maFile.filter(f => f.priorite === 'CRITIQUE').slice(0, 2).map(f => `URGENT : ${f.reference} — ${f.client}`),
        `Traiter ${dossiers.filter(d => d.etape_courante === 'EN_ANALYSE').length} dossiers EN_ANALYSE`,
        `Transmettre ${dossiers.filter(d => d.etape_courante === 'VALIDE_CHARGE').length} dossiers validés au ROC`,
      ],
    },
  }
}

// ─── GP HOME (fraction portefeuille agent) ───────────────────────────────────

export function buildGpHomeDerived() {
  const stats = buildGpLomeCentreStats()
  const clientsRisque = stats.clients_risque_affichage

  return {
    synthese_ia_portefeuille: {
      date_generation: "aujourd'hui 06:30",
      intro: buildGpSyntheseExecutive().replace(/\n\n/g, ' · '),
      points: buildGpSynthesePiliers().map(p => ({
        titre: p.titre,
        texte: p.contenu,
        tone: p.titre.includes('Risque') ? 'negatif' as const : p.titre.includes('Suivi') ? 'attention' as const : 'positif' as const,
      })),
      priorites: clientsRisque.slice(0, 3).map(c => `Relancer ${c.nom} (J+${c.retard_j})`),
    },
    kpis_portefeuille: {
      clients_actifs: stats.clients_total,
      valeur_portefeuille: stats.encours_fcfa,
      encours_restant: stats.encours_restant,
      ticket_moyen: Math.round(stats.encours_fcfa / stats.clients_total),
      nb_prets_actifs: stats.clients_total,
      croissance_pct: stats.croissance_encours_pct,
      sparkline_encours: stats.sparkline_encours,
    },
    kpis_qualite: {
      par_1_pct: stats.parGran.par_1.valeur_pct,
      par_7_pct: stats.parGran.par_7.valeur_pct,
      par_30_pct: stats.par_30_pct,
      taux_remboursement_pct: stats.taux_remboursement_agence_pct,
      montant_retard_fcfa: stats.montant_retard_fcfa,
      clients_en_retard: stats.clients_en_retard,
      taux_recouvrement_pct: stats.taux_recouvrement_gp_pct,
    },
    activite_quotidienne: {
      collectes_jour_count: Math.round(stats.clients_total * 0.04),
      collectes_jour_montant: stats.collecte_jour_gp,
      visites_prevues_jour: 12,
      visites_realisees_jour: 5,
      promesses_paiement_jour: 3,
      promesses_montant_jour: Math.round(clientsRisque.reduce((s, c) => s + c.encours * 0.05, 0) / 3),
      clients_a_relancer: clientsRisque.length,
      dossiers_en_attente: Math.round(stats.clients_total * 0.02),
    },
    vue_clients: clientsRisque.map(c => ({
      nom: c.nom,
      encours: c.encours,
      retard_j: c.retard_j,
      dernier_paiement: `il y a ${c.retard_j}j`,
      risque: c.risque,
      segment: c.segment,
      score: c.score,
      telephone: c.telephone,
    })),
  }
}

export { buildGpHomeExtra }

// ─── DAF HOME ────────────────────────────────────────────────────────────────

export function buildDafHomeDerived() {
  const m = getMoisCourant()
  const el = buildExpectedLossPortefeuille()
  const bceao = buildBceaoRepartition()
  const revenus = Math.round(m.collecte_fcfa * 0.22)
  const profitNet = Math.round(revenus * 0.33)
  const hdz = AGENCES.find(a => a.id === 'AG-004')!
  const cashHdz = buildCashParAgence().find(c => c.agence_id === 'AG-004')

  return {
    synthese_ia: {
      date_generation: "aujourd'hui 07:00",
      intro: `Trésorerie réseau ${fmtM(m.liquidite_fcfa)} · EL ${fmtM(el.el_total)} · provisions écart ${fmtM(bceao.ecart_provisions)}. ${hdz.nom_court} : liquidité ${cashHdz?.niveau === 'TENSION' || cashHdz?.niveau === 'CRITIQUE_BAS' ? 'tension' : 'stable'}.`,
      points: [
        { tone: 'attention' as const, texte: `Écart provisions BCEAO : ${fmtM(bceao.ecart_provisions)} à régulariser.`, action: 'Constituer avant clôture mensuelle' },
        { tone: 'negatif' as const, texte: `${hdz.nom_court} : cash ${fmtM(cashHdz?.cash_disponible ?? 0)} — ${cashHdz?.niveau ?? 'NORMAL'}.`, action: 'Transfert liquidité si tension' },
        { tone: 'positif' as const, texte: `Résultat net estimé ${fmtM(profitNet)} (+${variationMoM('collecte_fcfa')}% vs M-1).` },
        { tone: 'info' as const, texte: `Coefficient exploitation 68% · coût risque ${((el.el_total / m.encours_fcfa) * 100).toFixed(1)}%.` },
      ],
      priorites: [
        `PROVISIONS : Régulariser ${fmtM(bceao.ecart_provisions)} avant rapport BCEAO`,
        `LIQUIDITÉ : Surveiller ${hdz.nom_court} et Bè Kpota`,
        `RISQUE : EL portefeuille ${fmtM(el.el_total)} — aligner ROC`,
      ],
      analyse_tresorerie: `Liquidité consolidée ${fmtM(m.liquidite_fcfa)} · autonomie ~${Math.round(m.liquidite_fcfa / (profitNet / 4))} sem.`,
      analyse_rentabilite: `Marge nette ~33% · revenus ${fmtM(revenus)}/mois · PAR ${m.par_30}%.`,
      analyse_budget: `Budget annuel ~68% réalisé (rythme mai). Collecte ${Math.round(RESEAU_CONSOLIDE.collecte_totale / RESEAU_CONSOLIDE.collecte_objectif * 100)}% objectif.`,
    },
    kpis_finance: {
      tresorerie_disponible: m.liquidite_fcfa * 34,
      tresorerie_delta_m1_pct: variationMoM('liquidite_fcfa'),
      resultat_net_mois: profitNet,
      resultat_net_delta_pct: variationMoM('collecte_fcfa'),
      produits_financiers_mois: revenus,
      charges_operationnelles: Math.round(revenus * 0.57),
      ratio_liquidite: Number((m.liquidite_fcfa / (revenus * 0.5)).toFixed(2)),
      ratio_liquidite_min: 1.5,
      cout_risque_pct: Number(((el.el_total / m.encours_fcfa) * 100).toFixed(1)),
      cout_risque_delta_pct: variationMoM('el_fcfa'),
      coefficient_exploitation_pct: 68,
      objectif_coeff_pct: 65,
      marge_nette_pct: 33,
      resultats_annuel_ytd: profitNet * 5,
      objectif_annuel: 145_000_000,
      taux_realisation_annuel_pct: 68,
    },
    tresorerie: {
      par_agence: AGENCES.map(a => {
        const c = buildCashParAgence().find(x => x.agence_id === a.id)!
        return {
          agence: a.nom_court,
          solde: c.cash_disponible * 100,
          ratio: Number((c.cash_disponible / c.cash_minimum_requis).toFixed(1)),
          statut: c.niveau === 'CRITIQUE_BAS' ? 'TENSION' as const : c.niveau === 'TENSION' ? 'TENSION' as const : 'NORMAL' as const,
          decaissement_prevu: Math.round(a.encours_fcfa * 0.028),
        }
      }),
    },
  }
}

// ─── RAPPORTS IA PERSONA ───────────────────────────────────────────────────────

export function buildRapportIAGestionnaire(): RapportIA {
  const m = getMoisCourant()
  const ag = AGENCES[0]
  const collectePct = collectePctAgence(ag.id)
  const clientsGp = Math.round(m.emprunteurs * 0.25)
  const scoreXg = Math.round(100 - m.par_30 * 4)

  return {
    date_generation: '21/05/2026 à 06:00',
    periode: 'Mai 2026 — Vue gestionnaire portefeuille / responsable agence',
    destinataire: "Responsable d'Agence / Gestionnaire Portefeuille",
    synthese_executive: `Votre portefeuille de ${clientsGp} clients affiche un taux de remboursement de ${ag.taux_remboursement}% et un PAR agence de ${ag.par_courant}%. ${REGISTRE_CLIENTS_RISQUE.filter(c => c.agence === ag.nom_court).length} clients sont à risque sur ${ag.nom_court}. Collecte mois : ${collectePct}% objectif (${fmtM(ag.collecte_mois)}). Encours agence ${fmtM(ag.encours_fcfa)}.`,
    chiffres_cles: [
      { label: 'Portefeuille', valeur: `${clientsGp} clients`, tendance: 'STABLE', commentaire: `${REGISTRE_CLIENTS_RISQUE.length} à risque réseau` },
      { label: 'Taux recouvrement', valeur: `${ag.taux_remboursement}%`, tendance: 'HAUSSE', commentaire: `Réseau ${m.remboursement_pct}%` },
      { label: 'PAR agence', valeur: `${ag.par_courant}%`, tendance: 'BAISSE', commentaire: `Réseau ${m.par_30}%` },
      { label: 'Collecte mois', valeur: fmtM(ag.collecte_mois), tendance: 'HAUSSE', commentaire: `${collectePct}% obj.` },
      { label: 'Encours agence', valeur: fmtM(ag.encours_fcfa), tendance: 'HAUSSE', commentaire: `${ag.emprunteurs_actifs} prêts` },
      { label: 'Score moyen XGBoost', valeur: `${scoreXg}/100`, tendance: 'HAUSSE', commentaire: 'Modèle CBI v5' },
      { label: 'Dossiers bloqués', valeur: String(REGISTRE_DOSSIERS_BLOQUES.length), tendance: 'STABLE', commentaire: 'Pipeline' },
      { label: 'EL agence (est.)', valeur: fmtM(Math.round(ag.encours_fcfa * 0.031)), tendance: 'BAISSE', commentaire: 'Portefeuille' },
    ],
    points_forts: [
      `Taux remboursement ${ag.taux_remboursement}% — au-dessus moyenne réseau ${m.remboursement_pct}%`,
      `${ag.emprunteurs_actifs - Math.round(ag.emprunteurs_actifs * ag.par_courant / 100)} clients sans retard significatif`,
      `Score moyen portefeuille ${scoreXg}/100`,
    ],
    points_attention: REGISTRE_CLIENTS_RISQUE.slice(0, 4).map(c => ({
      titre: `${c.nom} — J+${c.jours_retard}`,
      detail: c.action,
      severite: (c.jours_retard > 45 ? 'CRITIQUE' : c.jours_retard > 20 ? 'HAUTE' : 'MODEREE') as 'CRITIQUE' | 'HAUTE' | 'MODEREE',
    })),
    recommandations: [
      { priorite: 1, action: `Visites urgentes : ${REGISTRE_CLIENTS_RISQUE.slice(0, 3).map(c => c.nom).join(', ')}`, impact_estime: fmtM(REGISTRE_CLIENTS_RISQUE.slice(0, 3).reduce((s, c) => s + c.encours * 0.1, 0)), delai: "Aujourd'hui" },
      { priorite: 2, action: `Rattraper collecte (${100 - collectePct}% restant)`, impact_estime: fmtM(ag.collecte_objectif - ag.collecte_mois), delai: 'Cette semaine' },
    ],
    previsions_30j: [
      { metrique: 'Taux recouvrement', valeur_actuelle: `${ag.taux_remboursement}%`, valeur_prevue: `${Math.min(99, ag.taux_remboursement + 1.2)}%`, confidence: 84 },
      { metrique: 'PAR agence', valeur_actuelle: `${ag.par_courant}%`, valeur_prevue: `${Math.max(4, ag.par_courant - 0.6)}%`, confidence: 81 },
    ],
    alertes_immediates: REGISTRE_CLIENTS_RISQUE.slice(0, 3).map(c => `🚨 ${c.nom} — J+${c.jours_retard} · ${c.action}`),
    comparaison_mois_precedent: [
      { metrique: 'Encours', mois_precedent: fmtM(ag.encours_fcfa * 0.96), mois_courant: fmtM(ag.encours_fcfa), variation_pct: variationMoM('encours_fcfa') },
      { metrique: 'PAR', mois_precedent: `${(ag.par_courant + 0.4).toFixed(1)}%`, mois_courant: `${ag.par_courant}%`, variation_pct: -4.8 },
    ],
    signature_ia: 'Prospera AI v2.4 · Coaching personnalisé',
  }
}

export function buildRapportIAAgentTerrain(): RapportIA {
  const m = getMoisCourant()
  const tx = buildTransactionsSuspectesStats()
  const zoneClients = Math.round(m.emprunteurs / RESEAU_CONSOLIDE.total_agences)

  return {
    date_generation: '21/05/2026 à 06:00',
    periode: 'Mai 2026 — Activité agent terrain',
    destinataire: 'Agent Terrain',
    synthese_executive: `Zone Lomé Centre : ${zoneClients} clients · collecte jour ${fmtM(m.collecte_fcfa / 30 / RESEAU_CONSOLIDE.total_agences)} · ${REGISTRE_CLIENTS_RISQUE.filter(c => c.jours_retard > 7).length} impayés réseau à visiter. Conformité GPS 94%. ${tx.en_investigation} signaux fraude en investigation réseau.`,
    chiffres_cles: [
      { label: 'Clients en zone', valeur: String(zoneClients), tendance: 'STABLE', commentaire: 'Lomé Centre' },
      { label: 'Collecte jour (est.)', valeur: fmtM(m.collecte_fcfa / 30 / 5), tendance: 'HAUSSE', commentaire: `${m.remboursement_pct}% remb.` },
      { label: 'Impayés zone', valeur: String(Math.round(zoneClients * m.par_30 / 100)), tendance: 'BAISSE', commentaire: 'Priorité matin' },
      { label: 'Score performance', valeur: '84/100', tendance: 'HAUSSE', commentaire: 'Top quartile' },
      { label: 'Conformité GPS', valeur: '94%', tendance: 'STABLE', commentaire: 'Objectif 90%' },
      { label: 'TX suspectes réseau', valeur: String(tx.total), tendance: 'STABLE', commentaire: `${tx.en_investigation} actives` },
    ],
    points_forts: ['Conformité GPS réseau 94%', `${m.remboursement_pct}% taux remboursement consolidé`],
    points_attention: REGISTRE_CLIENTS_RISQUE.slice(0, 3).map(c => ({
      titre: `${c.nom} — impayé J+${c.jours_retard}`,
      detail: c.action,
      severite: 'HAUTE' as const,
    })),
    recommandations: [
      { priorite: 1, action: 'Tournée impayés matin (3 clients prioritaires)', impact_estime: fmtM(750_000), delai: "Aujourd'hui" },
    ],
    alertes_immediates: [`⚠ ${Math.round(zoneClients * m.par_30 / 100)} impayés zone · ${tx.en_investigation} TX en investigation`],
    previsions_30j: rapportPrevisionsStandard(),
    comparaison_mois_precedent: rapportComparaisonMoM(),
    signature_ia: 'Prospera AI v2.4 · Agent terrain',
  }
}

export function buildRapportIACommercial(): RapportIA {
  const m = getMoisCourant()
  const collectePct = Math.round(RESEAU_CONSOLIDE.collecte_totale / RESEAU_CONSOLIDE.collecte_objectif * 100)

  return {
    date_generation: '21/05/2026 à 06:00',
    periode: 'Mai 2026 — Performance commerciale réseau',
    destinataire: 'Directeur Commercial / RCC',
    synthese_executive: `Le réseau compte ${m.emprunteurs} emprunteurs actifs et ${RESEAU_CONSOLIDE.nouveaux_clients} nouveaux clients ce mois. Collecte à ${collectePct}% de l'objectif (${fmtM(RESEAU_CONSOLIDE.collecte_totale)}). Taux conversion ${RESEAU_CONSOLIDE.taux_conversion_reseau}%. ${RESEAU_CONSOLIDE.leads_mois} leads — ${RESEAU_CONSOLIDE.clients_perdus_mois} départs.`,
    chiffres_cles: [
      { label: 'Encours réseau', valeur: fmtM(m.encours_fcfa), tendance: 'HAUSSE', commentaire: `${variationMoM('encours_fcfa')}%` },
      { label: 'Nouveaux clients', valeur: String(RESEAU_CONSOLIDE.nouveaux_clients), tendance: 'HAUSSE', commentaire: 'Ce mois' },
      { label: 'Collecte', valeur: `${collectePct}%`, tendance: collectePct >= 80 ? 'STABLE' : 'BAISSE', commentaire: fmtM(RESEAU_CONSOLIDE.collecte_totale) },
      { label: 'Conversion', valeur: `${RESEAU_CONSOLIDE.taux_conversion_reseau}%`, tendance: 'STABLE', commentaire: `${RESEAU_CONSOLIDE.leads_mois} leads` },
      { label: 'PAR réseau', valeur: `${m.par_30}%`, tendance: 'BAISSE', commentaire: 'Qualité portefeuille' },
      { label: 'Épargne comptes', valeur: String(buildEpargneStats().total_comptes), tendance: 'HAUSSE', commentaire: `${buildEpargneStats().dormants} dormants` },
    ],
    points_forts: RESEAU_CONSOLIDE.ia_insights_reseau.filter(i => i.type === 'OPPORTUNITE').slice(0, 2).map(i => i.detail),
    points_attention: RESEAU_CONSOLIDE.alertes_reseau.slice(0, 3).map(a => ({
      titre: a.type,
      detail: a.detail,
      severite: a.urgence === 'HAUTE' ? 'HAUTE' as const : 'MODEREE' as const,
    })),
    recommandations: RESEAU_CONSOLIDE.alertes_reseau.slice(0, 3).map((a, i) => ({
      priorite: (i + 1) as 1 | 2 | 3,
      action: a.action,
      impact_estime: a.zone,
      delai: 'Cette semaine',
    })),
    previsions_30j: rapportPrevisionsStandard(),
    alertes_immediates: RESEAU_CONSOLIDE.alertes_reseau.map(a => `⚠ ${a.type} — ${a.zone}`),
    comparaison_mois_precedent: rapportComparaisonMoM(),
    signature_ia: 'Prospera AI v2.4 · Commercial réseau',
  }
}

export function buildRapportIAFinances(): RapportIA {
  const m = getMoisCourant()
  const el = buildExpectedLossPortefeuille()
  const bceao = buildBceaoRepartition()
  const revenus = Math.round(m.collecte_fcfa * 0.22)

  return {
    date_generation: '21/05/2026 à 06:00',
    periode: 'Mai 2026 — Finances & trésorerie',
    destinataire: 'DAF / Contrôle de gestion',
    synthese_executive: `Trésorerie ${fmtM(m.liquidite_fcfa)} · EL ${fmtM(el.el_total)} · provisions ${fmtM(bceao.total_provisions_constituees)} (écart ${fmtM(bceao.ecart_provisions)}). Revenus estimés ${fmtM(revenus)}. PAR ${m.par_30}% · liquidité ratio ~${(m.liquidite_fcfa / revenus).toFixed(1)}x charges.`,
    chiffres_cles: [
      { label: 'Encours', valeur: fmtM(m.encours_fcfa), tendance: 'HAUSSE', commentaire: 'Portefeuille' },
      { label: 'Liquidité', valeur: fmtM(m.liquidite_fcfa), tendance: 'STABLE', commentaire: 'Siège + agences' },
      { label: 'Expected Loss', valeur: fmtM(el.el_total), tendance: 'BAISSE', commentaire: `${variationMoM('el_fcfa')}%` },
      { label: 'Provisions', valeur: fmtM(bceao.total_provisions_constituees), tendance: 'HAUSSE', commentaire: `Écart ${fmtM(bceao.ecart_provisions)}` },
      { label: 'Revenus mois', valeur: fmtM(revenus), tendance: 'HAUSSE', commentaire: 'Estimation' },
      { label: 'Coût risque', valeur: `${((el.el_total / m.encours_fcfa) * 100).toFixed(1)}%`, tendance: 'STABLE', commentaire: 'Portefeuille' },
    ],
    points_forts: [`PAR 90j ${m.par_90}% — sous seuil 5%`, `Collecte ${Math.round(RESEAU_CONSOLIDE.collecte_totale / RESEAU_CONSOLIDE.collecte_objectif * 100)}% objectif`],
    points_attention: [
      { titre: 'Écart provisions BCEAO', detail: `${fmtM(bceao.ecart_provisions)} à constituer`, severite: 'CRITIQUE' as const },
      { titre: 'Bè Kpota PAR', detail: `${AGENCES.find(a => a.id === 'AG-003')?.par_courant}% hors norme`, severite: 'HAUTE' as const },
    ],
    recommandations: [
      { priorite: 1, action: `Constituer provisions ${fmtM(bceao.ecart_provisions)}`, impact_estime: 'Conformité BCEAO', delai: 'Avant 31/05' },
    ],
    previsions_30j: rapportPrevisionsStandard(),
    alertes_immediates: [`🚨 Écart provisions ${fmtM(bceao.ecart_provisions)}`, `⚠ PAR Bè Kpota ${AGENCES.find(a => a.id === 'AG-003')?.par_courant}%`],
    comparaison_mois_precedent: rapportComparaisonMoM(),
    signature_ia: 'Prospera AI v2.4 · Finances',
  }
}

export function buildRapportIAMarketing(): RapportIA {
  const m = getMoisCourant()
  const epargne = buildEpargneStats()

  return {
    date_generation: '21/05/2026 à 06:00',
    periode: 'Mai 2026 — Marketing & acquisition',
    destinataire: 'Responsable Marketing / Communication',
    synthese_executive: `${RESEAU_CONSOLIDE.leads_mois} leads ce mois · conversion ${RESEAU_CONSOLIDE.taux_conversion_reseau}% · ${RESEAU_CONSOLIDE.nouveaux_clients} nouveaux emprunteurs. ${epargne.total_comptes} comptes épargne (${epargne.dormants} dormants à réactiver). Encours ${fmtM(m.encours_fcfa)} — message « croissance maîtrisée » validé par PAR ${m.par_30}%.`,
    chiffres_cles: [
      { label: 'Leads mois', valeur: String(RESEAU_CONSOLIDE.leads_mois), tendance: 'HAUSSE', commentaire: 'Multi-canal' },
      { label: 'Conversion', valeur: `${RESEAU_CONSOLIDE.taux_conversion_reseau}%`, tendance: 'STABLE', commentaire: 'Réseau' },
      { label: 'Nouveaux clients', valeur: String(RESEAU_CONSOLIDE.nouveaux_clients), tendance: 'HAUSSE', commentaire: 'Crédit' },
      { label: 'Comptes épargne', valeur: String(epargne.total_comptes), tendance: 'HAUSSE', commentaire: `${epargne.actifs} actifs` },
      { label: 'Dormants', valeur: String(epargne.dormants), tendance: 'STABLE', commentaire: 'Campagne WA' },
      { label: 'Encours crédit', valeur: fmtM(m.encours_fcfa), tendance: 'HAUSSE', commentaire: `${m.emprunteurs} clients` },
    ],
    points_forts: ['Kpalimé référence performance — contenu témoignages', `${RESEAU_CONSOLIDE.nouveaux_clients} acquisitions nettes`],
    points_attention: [
      { titre: 'Dormants épargne', detail: `${epargne.dormants} comptes — campagne réactivation`, severite: 'MODEREE' as const },
      { titre: 'Bè Kpota image', detail: 'PAR élevé — éviter sur-promesse commerciale', severite: 'HAUTE' as const },
    ],
    recommandations: [
      { priorite: 1, action: `Campagne réactivation ${epargne.dormants} dormants`, impact_estime: fmtM(epargne.encours_dormants * 0.3), delai: 'Juin 2026' },
    ],
    previsions_30j: rapportPrevisionsStandard(),
    alertes_immediates: [`ℹ ${epargne.dormants} comptes épargne dormants à réactiver`],
    comparaison_mois_precedent: rapportComparaisonMoM(),
    signature_ia: 'Prospera AI v2.4 · Marketing',
  }
}

export function buildRapportIARoc(): RapportIA {
  const m = getMoisCourant()
  const el = buildExpectedLossPortefeuille()
  const rocAttente = countDossiersBloques()
  const bk = AGENCES.find(a => a.id === 'AG-003')!

  return {
    date_generation: '27/05/2026 à 06:42',
    periode: 'Mai 2026 — Crédit, risque, recouvrement & opérations réseau',
    destinataire: 'Responsable Opération & Crédit',
    synthese_executive: `Encours réseau ${fmtM(m.encours_fcfa)} (+${variationMoM('encours_fcfa')}% MoM) · PAR ${m.par_30}% · ${bk.nom_court} ${bk.par_courant}% (seuil BCEAO). ${rocAttente} dossiers ROC bloqués · EL ${fmtM(el.el_total)}. Cash Bè Kpota critique — virement avant 10h.`,
    chiffres_cles: [
      { label: 'Encours', valeur: fmtM(m.encours_fcfa), tendance: 'HAUSSE', commentaire: `${m.emprunteurs} prêts` },
      { label: 'PAR 30', valeur: `${m.par_30}%`, tendance: 'BAISSE', commentaire: 'Réseau' },
      { label: 'Expected Loss', valeur: fmtM(el.el_total), tendance: 'BAISSE', commentaire: `${variationMoM('el_fcfa')}%` },
      { label: 'Dossiers ROC', valeur: String(rocAttente), tendance: 'HAUSSE', commentaire: '> 48h' },
      { label: 'Délai validation', valeur: `${m.delai_validation_j} j`, tendance: 'BAISSE', commentaire: 'Obj. 3j' },
      { label: 'CBI actives', valeur: String(buildAlertesCbiTotals().total_actifs), tendance: 'STABLE', commentaire: '9 codes' },
    ],
    points_forts: [`Remboursement ${m.remboursement_pct}%`, 'Audit trail complet'],
    points_attention: buildRocAlertesPriorisees().slice(0, 3).map(a => ({
      titre: a.titre,
      detail: a.detail,
      severite: a.severite === 'CRITIQUE' ? 'CRITIQUE' as const : 'HAUTE' as const,
    })),
    recommandations: buildRocHomeDerived().recommandations_ia.map(r => ({
      priorite: r.priorite as 1 | 2 | 3,
      action: r.action,
      impact_estime: r.impact,
      delai: r.delai,
    })),
    previsions_30j: rapportPrevisionsStandard(),
    alertes_immediates: buildRocAlertesPriorisees().slice(0, 5).map(a => `🚨 ${a.titre}`),
    comparaison_mois_precedent: rapportComparaisonMoM(),
    signature_ia: 'Prospera AI v2.4 · ROC',
  }
}

export function mapRapportCcToDossierLike(d: {
  reference_dossier: string
  client: { nom: string; prenom: string; activite: string }
  etape_courante: string
  score_consolide: number
  classe_bceao: string
  montant_demande: number
  alertes_actives: { code: string; severite: string; message: string }[]
}): DossierCcLike {
  return {
    reference: d.reference_dossier,
    client_nom: `${d.client.prenom} ${d.client.nom}`.trim(),
    activite: d.client.activite,
    etape_courante: d.etape_courante,
    score_consolide: d.score_consolide,
    classe_bceao: d.classe_bceao,
    montant_demande: d.montant_demande,
    alertes_actives: d.alertes_actives,
  }
}

export function buildRapportIACc(dossiers: Parameters<typeof mapRapportCcToDossierLike>[0][]): RapportIA {
  const cc = buildCcHomeDerived(dossiers.map(mapRapportCcToDossierLike))
  const critiques = cc.mes_alertes_cbi.filter(a => a.severite === 'CRITICAL')

  return {
    date_generation: '27/05/2026 à 07:15',
    periode: 'Mai 2026 — Chargé de Crédit',
    destinataire: 'Chargé de Crédit',
    synthese_executive: cc.synthese_ia_journee.intro,
    synthese_piliers: [
      { titre: 'KPIs opérationnels', contenu: `${cc.mes_kpis.en_attente_total} dossiers · délai ${cc.mes_kpis.delai_moyen_perso_h}h vs obj. ${cc.mes_kpis.delai_objectif_h}h · approbation ${cc.mes_kpis.taux_approbation_perso}%.` },
      { titre: 'File prioritaire', contenu: cc.ma_file_aujourdhui.map(f => `${f.reference} ${f.client} (${f.priorite})`).join(' · ') },
      { titre: 'Alertes CBI', contenu: `${critiques.length} CRITICAL actives sur vos dossiers.` },
    ],
    chiffres_cles: [
      { label: 'En attente', valeur: String(cc.mes_kpis.en_attente_total), tendance: 'STABLE', commentaire: `${cc.mes_kpis.en_attente_prioritaires} prioritaires` },
      { label: 'Décisions mois', valeur: String(cc.mes_kpis.decisions_mois), tendance: 'STABLE', commentaire: `Approb. ${cc.mes_kpis.taux_approbation_perso}%` },
      { label: 'Délai moyen', valeur: `${cc.mes_kpis.delai_moyen_perso_h}h`, tendance: 'BAISSE', commentaire: `Obj. ${cc.mes_kpis.delai_objectif_h}h` },
      { label: 'Score moyen', valeur: `${cc.mes_kpis.score_moyen_attribue}/100`, tendance: 'HAUSSE', commentaire: 'CBI v5' },
    ],
    points_forts: [`Qualité décisions ${cc.mes_kpis.qualite_decisions_pct}%`, `Score moyen ${cc.mes_kpis.score_moyen_attribue}/100`],
    points_attention: critiques.slice(0, 5).map(a => ({
      titre: `${a.dossier} — ${a.code}`,
      detail: a.detail,
      severite: 'CRITIQUE' as const,
    })),
    recommandations: cc.synthese_ia_journee.priorites.map((p, i) => ({
      priorite: Math.min(3, i + 1) as 1 | 2 | 3,
      action: p,
      impact_estime: 'Pipeline crédit',
      delai: i === 0 ? "Aujourd'hui" : 'Cette semaine',
    })),
    previsions_30j: rapportPrevisionsStandard(),
    alertes_immediates: critiques.map(a => `🚨 ${a.dossier} — ${a.code}`),
    comparaison_mois_precedent: rapportComparaisonMoM(),
    signature_ia: 'Prospera AI v2.4 · Chargé de Crédit',
  }
}

export function buildRapportIAGp(): RapportIA {
  const gp = buildGpHomeDerived()
  const stats = buildGpLomeCentreStats()

  return {
    date_generation: '27/05/2026 à 06:30',
    periode: 'Mai 2026',
    destinataire: 'Mawunya Kpodzo · Agence Lomé Centre',
    synthese_executive: buildGpSyntheseExecutive(),
    chiffres_cles: [
      { label: 'Clients actifs', valeur: String(gp.kpis_portefeuille.clients_actifs), tendance: 'STABLE', commentaire: 'Portefeuille Lomé Centre' },
      { label: 'Encours', valeur: fmtM(gp.kpis_portefeuille.valeur_portefeuille), tendance: 'HAUSSE', commentaire: `${gp.kpis_portefeuille.croissance_pct}% vs M-1` },
      { label: 'PAR 30', valeur: `${gp.kpis_qualite.par_30_pct}%`, tendance: 'BAISSE', commentaire: 'Agence Lomé Centre' },
      { label: 'Remboursement', valeur: `${gp.kpis_qualite.taux_remboursement_pct}%`, tendance: 'HAUSSE', commentaire: `Réseau ${stats.taux_remboursement_reseau_pct}%` },
      { label: 'Retards', valeur: String(gp.kpis_qualite.clients_en_retard), tendance: 'STABLE', commentaire: fmtM(gp.kpis_qualite.montant_retard_fcfa) },
    ],
    synthese_piliers: buildGpSynthesePiliers(),
    points_forts: [
      `Portefeuille ${stats.clients_total} clients — encours ${fmtM(stats.encours_fcfa)}`,
      `Taux remboursement agence ${stats.taux_remboursement_agence_pct}% (au-dessus réseau ${stats.taux_remboursement_reseau_pct}%)`,
      `Recouvrement GP ${stats.taux_recouvrement_gp_pct}% — classement #2 agence`,
    ],
    recommandations: gp.synthese_ia_portefeuille.priorites.map((p, i) => ({
      priorite: Math.min(3, i + 1) as 1 | 2 | 3,
      action: p,
      impact_estime: 'Recouvrement',
      delai: 'Cette semaine',
    })),
    points_attention: stats.clients_risque_affichage.map(c => ({
      titre: c.nom,
      detail: `J+${c.retard_j} · ${fmtM(c.encours)}`,
      severite: c.risque === 'CRITIQUE' ? 'CRITIQUE' as const : 'HAUTE' as const,
    })),
    previsions_30j: rapportPrevisionsGp(),
    alertes_immediates: gp.synthese_ia_portefeuille.priorites.map(p => `⚠ ${p}`),
    comparaison_mois_precedent: rapportComparaisonMoMGp(),
    signature_ia: 'Prospera AI v2.4 · GP',
  }
}

// ─── TERRAIN HOME ────────────────────────────────────────────────────────────

export function buildTerrainHomeDerived() {
  const m = getMoisCourant()
  const zoneClients = Math.round(m.emprunteurs / RESEAU_CONSOLIDE.total_agences)
  const objectifJour = Math.round(m.collecte_fcfa / 30 / RESEAU_CONSOLIDE.total_agences)
  const clientsRisque = REGISTRE_CLIENTS_RISQUE.slice(0, 9)
  const collecteJour = Math.round(objectifJour * 0.58)

  return {
    synthese_ia_journee: {
      date_generation: "aujourd'hui 06:00",
      intro: `${zoneClients} clients zone · objectif jour ${fmtM(objectifJour)} · collecte ${fmtM(collecteJour)} (${Math.round(collecteJour / objectifJour * 100)}%). ${clientsRisque.length} impayés à traiter · ${RESEAU_CONSOLIDE.leads_mois} leads réseau.`,
      points: [
        { icon: 'visit', texte: `${Math.round(zoneClients * 0.55)} visites prévues (tontines + recouvrement + prospects).`, tone: 'info' as const },
        { icon: 'risk', texte: `${clientsRisque.filter(c => c.jours_retard > 7).length} clients retard > 7j cette semaine.`, tone: 'negatif' as const },
        { icon: 'trend', texte: `Remboursement réseau ${m.remboursement_pct}% · PAR zone ~${Math.round(m.par_30)}%.`, tone: 'positif' as const },
        { icon: 'prosp', texte: `${Math.round(RESEAU_CONSOLIDE.leads_mois / RESEAU_CONSOLIDE.total_agences)} prospects actifs zone.`, tone: 'positif' as const },
      ],
      priorites: clientsRisque.slice(0, 4).map(c => `Relancer ${c.nom} (J+${c.jours_retard})`),
    },
    resume_journee: {
      clientes_a_visiter: Math.round(zoneClients * 0.55),
      montant_a_collecter: objectifJour,
      tontines_prevues: 8,
      clients_en_retard: clientsRisque.length,
      objectif_jour: objectifJour,
      taux_atteinte_pct: Math.round(collecteJour / objectifJour * 100),
      prospects_a_rencontrer: Math.round(RESEAU_CONSOLIDE.leads_mois / RESEAU_CONSOLIDE.total_agences),
      dossiers_a_completer: countDossiersBloques(),
    },
    recouvrement: {
      clients_en_retard: clientsRisque.length,
      montant_a_recouvrer: clientsRisque.reduce((s, c) => s + Math.round(c.encours * 0.08), 0),
      montant_recupere_jour: collecteJour,
      retards_critiques: clientsRisque.filter(c => c.jours_retard > 30).length,
      promesses_paiement_jour: 3,
      promesses_montant_jour: Math.round(clientsRisque.slice(0, 3).reduce((s, c) => s + c.encours * 0.05, 0)),
      clients_a_visiter: clientsRisque.map((c, i) => ({
        client: c.nom,
        retard_j: c.jours_retard,
        montant: Math.round(c.encours * 0.08),
        risque: c.jours_retard > 45 ? 'CRITIQUE' as const : c.jours_retard > 20 ? 'HAUT' as const : 'MOYEN' as const,
        priorite_ia: i + 1,
        raison_ia: c.action,
      })),
    },
    tontines: {
      montant_prevu_jour: Math.round(objectifJour * 0.4),
      montant_collecte_jour: Math.round(collecteJour * 0.35),
      taux_collecte_pct: Math.round(collecteJour / objectifJour * 100),
      clientes_absentes_count: 3,
      versements_manques_count: 2,
      retards_tontine_count: 4,
      groupes_actifs: 6,
    },
  }
}

// ─── COMMUNICATION / MARKETING HOME ──────────────────────────────────────────

export function buildCommunicationHomeDerived() {
  const m = getMoisCourant()
  const epargne = buildEpargneStats()
  const leads = RESEAU_CONSOLIDE.leads_mois
  const convertis = RESEAU_CONSOLIDE.nouveaux_clients
  const penetration = Math.round((m.emprunteurs / 600) * 100)

  return {
    synthese_ia: {
      date_generation: "aujourd'hui 07:00",
      intro: `Réseau ${RESEAU_CONSOLIDE.total_agences} agences · ${m.emprunteurs} emprunteurs · encours ${fmtM(m.encours_fcfa)}. ${leads} leads · conversion ${RESEAU_CONSOLIDE.taux_conversion_reseau}%. ${epargne.dormants} comptes épargne dormants à réactiver.`,
      kpis_cles: [
        { label: 'Encours réseau', valeur: fmtM(m.encours_fcfa), note: `${m.emprunteurs} emprunteurs`, tendance: 'HAUSSE' as const, delta: `+${variationMoM('encours_fcfa')}% M-1` },
        { label: 'Leads pipeline', valeur: String(leads), note: `${Math.max(1, Math.round(leads * 0.06))} non assignés`, tendance: 'HAUSSE' as const, delta: '+12% M-1' },
        { label: 'Conversion', valeur: `${RESEAU_CONSOLIDE.taux_conversion_reseau}%`, note: `${convertis} clients`, tendance: 'STABLE' as const, delta: 'Réseau' },
        { label: 'NPS réseau', valeur: '72/100', note: 'objectif 80', tendance: 'HAUSSE' as const, delta: '+4 pts' },
        { label: 'Épargne comptes', valeur: String(epargne.total_comptes), note: `${epargne.dormants} dormants`, tendance: 'HAUSSE' as const, delta: 'Campagne WA' },
        { label: 'Pénétration marché', valeur: `${penetration}%`, note: 'estimé accessible', tendance: 'HAUSSE' as const, delta: '+3pts M-1' },
      ],
      analyse_territoire: `${RESEAU_CONSOLIDE.total_agences} agences · encours ${fmtM(m.encours_fcfa)} · PAR ${m.par_30}%. Couverture effective ~${penetration}% du marché accessible.`,
    },
    kpis: {
      leads_mois: leads,
      leads_qualifies: Math.round(leads * 0.73),
      leads_convertis: convertis,
      taux_conversion_pct: RESEAU_CONSOLIDE.taux_conversion_reseau,
      cac_moyen: 18_400,
      cac_objectif: 20_000,
      cac_evolution_pct: -8,
      ltv_moyen: Math.round(m.encours_fcfa / m.emprunteurs),
      pipeline_valeur: Math.round(m.encours_fcfa * 0.17),
      nouveaux_clients_mois: convertis,
      clients_perdus_mois: RESEAU_CONSOLIDE.clients_perdus_mois,
      taux_retention_pct: 87,
      objectif_retention_pct: 92,
      nps: 72,
      nps_evolution: 4,
      referrals_mois: 18,
      chatbot_conversations_mois: 312,
      chatbot_leads_crees: 47,
      score_presence_digitale: 78,
      leads_non_assignes: Math.max(1, Math.round(leads * 0.06)),
      budget_mois_total: 850_000,
      budget_consomme: 578_000,
      budget_roi_global: 11.4,
    },
    acquisition: {
      funnel: [
        { etape: 'Messages WA reçus', count: 312, couleur: '#6366f1' },
        { etape: 'Qualifiés chatbot', count: 198, couleur: '#8b5cf6' },
        { etape: 'Leads CRM', count: leads, couleur: '#a855f7' },
        { etape: 'RDV / Visite', count: Math.round(leads * 0.62), couleur: '#d946ef' },
        { etape: 'Dossier soumis', count: Math.round(leads * 0.4), couleur: '#ec4899' },
        { etape: 'Client gagné', count: convertis, couleur: '#16a34a' },
      ],
    },
  }
}

// ─── COMMERCIAL / RCC HOME ───────────────────────────────────────────────────

export function buildCommercialHomeDerived() {
  const m = getMoisCourant()
  const collecteJour = Math.round(m.collecte_fcfa / 30)
  const collectePct = Math.round(RESEAU_CONSOLIDE.collecte_totale / RESEAU_CONSOLIDE.collecte_objectif * 100)
  const objectifJour = Math.round(RESEAU_CONSOLIDE.collecte_objectif / 30)

  return {
    synthese_ia: {
      date_generation: "aujourd'hui 07:30",
      intro: `Collecte réseau ${collectePct}% objectif (${fmtM(RESEAU_CONSOLIDE.collecte_totale)}). Jour : ${fmtM(collecteJour)} / ${fmtM(objectifJour)}. ${RESEAU_CONSOLIDE.nouveaux_clients} nouveaux clients · PAR ${m.par_30}%.`,
      points: [
        { tone: collectePct >= 80 ? 'positif' as const : 'negatif' as const, texte: `Collecte globale à ${collectePct}% de l'objectif mensuel.` },
        { tone: 'attention' as const, texte: `PAR réseau ${m.par_30}% — ${REGISTRE_CLIENTS_RISQUE.length} clients à risque identifiés.` },
        { tone: 'positif' as const, texte: `${RESEAU_CONSOLIDE.leads_mois} leads · conversion ${RESEAU_CONSOLIDE.taux_conversion_reseau}%.` },
        { tone: 'positif' as const, texte: `Encours ${fmtM(m.encours_fcfa)} (+${variationMoM('encours_fcfa')}% MoM).` },
      ],
      priorites: [
        `Rattraper collecte (${100 - collectePct}% restant objectif mois)`,
        `Relancer ${REGISTRE_CLIENTS_RISQUE.slice(0, 3).map(c => c.nom).join(', ')}`,
        `${Math.max(1, Math.round(RESEAU_CONSOLIDE.leads_mois * 0.06))} leads non assignés à traiter`,
      ],
    },
    kpis_commercial: {
      nouveaux_clients_jour: Math.max(1, Math.round(RESEAU_CONSOLIDE.nouveaux_clients / 20)),
      objectif_commercial_pct: Math.round(RESEAU_CONSOLIDE.nouveaux_clients / 70 * 100),
      prospects_actifs: Math.round(RESEAU_CONSOLIDE.leads_mois * 0.33),
      taux_conversion_pct: RESEAU_CONSOLIDE.taux_conversion_reseau,
      produit_top: 'Crédit Commerce (PME)',
      croissance_portefeuille_pct: variationMoM('encours_fcfa'),
      nouveaux_clients_mois: RESEAU_CONSOLIDE.nouveaux_clients,
      objectif_clients_mois: 70,
    },
    kpis_collecte: {
      collecte_jour_realise: collecteJour,
      collecte_jour_prevu: objectifJour,
      taux_collecte_pct: Math.round(collecteJour / objectifJour * 100),
      ecart_collecte: collecteJour - objectifJour,
      retards_collecte: Math.round(m.emprunteurs * m.par_30 / 100),
      promesses_paiement_jour: 6,
      promesses_montant: Math.round(collecteJour * 0.09),
      taux_regularite_pct: m.remboursement_pct,
    },
    kpis_equipe: {
      agents_actifs: RESEAU_CONSOLIDE.agents_terrain,
      agents_sous_performance: 2,
      agents_inactifs_jour: 1,
      visites_realisees_jour: Math.round(RESEAU_CONSOLIDE.agents_terrain * 5.7),
      visites_objectif_jour: Math.round(RESEAU_CONSOLIDE.agents_terrain * 7.5),
      productivite_moy_pct: collectePct,
    },
    pipeline: [
      { etape: 'Prospects', count: Math.round(RESEAU_CONSOLIDE.leads_mois * 0.33), montant: Math.round(m.encours_fcfa * 0.17), couleur: '#6366f1' },
      { etape: 'Rendez-vous', count: Math.round(RESEAU_CONSOLIDE.leads_mois * 0.19), montant: Math.round(m.encours_fcfa * 0.1), couleur: '#8b5cf6' },
      { etape: 'Dossiers ouverts', count: m.en_attente, montant: Math.round(m.encours_fcfa * 0.08), couleur: '#a855f7' },
      { etape: 'En validation', count: countDossiersBloques(), montant: Math.round(m.encours_fcfa * 0.06), couleur: '#d946ef' },
      { etape: 'Convertis (mois)', count: RESEAU_CONSOLIDE.nouveaux_clients, montant: Math.round(RESEAU_CONSOLIDE.montant_decaisse_mois), couleur: '#ec4899' },
    ],
  }
}
