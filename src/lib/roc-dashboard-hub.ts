/**
 * Dashboard ROC (/dashboard) — KPIs et tableaux dérivés des sources réseau.
 */
import { AGENCES, RESEAU_CONSOLIDE } from '@/lib/agences'
import { buildParGranulaireReseau } from '@/lib/credit-dossiers-stats'
import { TERRAIN_COMMERCIAL } from '@/lib/equipe-terrain-data'
import {
  buildTopClientsRisque,
  countDossiersBloques,
  REGISTRE_CLIENTS_RISQUE,
  REGISTRE_DOSSIERS_BLOQUES,
} from '@/lib/mock-risque-registry'
import { getMoisCourant, RESEAU_MENSUEL, variationMoM } from '@/lib/mock-time-series'

function fmtM(n: number): string {
  return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
}

export function buildRocKpisCreditEtendus() {
  const m = getMoisCourant()
  const par = buildParGranulaireReseau()
  const rec = buildRocRecouvrementReseau()
  const impayes = REGISTRE_CLIENTS_RISQUE.filter(c => c.jours_retard > 0)
  const montantImpayes = impayes.reduce((s, c) => s + Math.round(c.encours * Math.min(0.55, 0.08 + c.jours_retard / 200)), 0)

  return {
    nb_prets_actifs: m.emprunteurs,
    decaissements_jour_count: Math.max(1, Math.round(RESEAU_CONSOLIDE.decaissements_mois / 30)),
    decaissements_jour_montant: Math.round(RESEAU_CONSOLIDE.montant_decaisse_mois / 30),
    remboursements_jour_montant: rec.collecte_jour_fcfa,
    par_1_pct: par.par_1.valeur_pct,
    par_7_pct: par.par_7.valeur_pct,
    par_30_pct: m.par_30,
    nb_dossiers_retard: impayes.length,
    montant_impayes_fcfa: montantImpayes,
  }
}

export function buildRocKpisOperations() {
  const m = getMoisCourant()
  const bloques = countDossiersBloques()
  return {
    dossiers_en_attente: m.en_attente,
    dossiers_a_valider: bloques,
    dossiers_bloques: bloques,
    temps_traitement_h: Math.round(m.delai_validation_j * 24),
    temps_traitement_obj: 24,
    operations_jour: Math.round(m.decaissements * 1.8),
  }
}

/** Alias conservé pour compatibilité imports */
export function buildRocKpisOperationsFixed() {
  return buildRocKpisOperations()
}

export function buildRocEvolutionPar30() {
  const m = getMoisCourant()
  const trend = [7.4, 7.6, 7.9, 8.1, 8.4, 9.0, 9.8, 10.1, 9.4, 8.7, 8.2, m.par_30]
  return trend.map((par_30, i) => ({
    sem: `S${String(i + 8).padStart(2, '0')}`,
    par_30,
  }))
}

export function buildRocTopMauvaisPayeurs() {
  return buildTopClientsRisque(6).map(c => ({
    nom: c.nom,
    agence: c.agence,
    montant_du: Math.round(c.encours * Math.min(0.55, 0.08 + c.jours_retard / 200)),
    retard_j: c.jours_retard,
    score: c.score_ia,
    agent: c.agent.split(' ')[0] + ' ' + (c.agent.split(' ')[1]?.[0] ?? '') + '.',
  }))
}

function mapTerrainAgentToRocRow(agent: (typeof TERRAIN_COMMERCIAL)[number]) {
  const ag = AGENCES.find(a => a.id === agent.agence_id)!
  const statut = agent.recouvrement_pct < 55 ? 'DEGRADE' as const
    : agent.recouvrement_pct >= 80 ? 'BON' as const
    : (agent.statut === 'DEGRADE' ? 'DEGRADE' as const : agent.statut === 'BON' ? 'BON' as const : 'NORMAL' as const)
  return {
    agent: agent.nom,
    zone: ag.nom_court,
    clients_actifs: agent.clients_portefeuille,
    visites_jour: Math.max(1, agent.visites_jour ?? Math.round(agent.visites_mois / 22)),
    visites_obj: Math.max(1, Math.round(agent.visites_objectif / 22)),
    collecte_jour: Math.max(1, agent.collecte_jour_fcfa ?? Math.round(agent.collecte_mois_fcfa / 22)),
    retards_j7: agent.retards_j7,
    taux_recouvrement: agent.recouvrement_pct,
    portefeuille_fcfa: agent.portefeuille_fcfa,
    statut,
  }
}

/** Tous les agents terrain actifs du réseau (aligné RESEAU_CONSOLIDE.agents_terrain). */
export function buildRocPerformanceAgents() {
  const statutOrder = (s: string) => (s === 'DEGRADE' ? 0 : s === 'NORMAL' ? 1 : 2)
  return TERRAIN_COMMERCIAL
    .filter(a => a.actif !== false)
    .sort((a, b) => {
      const byStatut = statutOrder(a.statut) - statutOrder(b.statut)
      if (byStatut !== 0) return byStatut
      const byAgence = a.agence_id.localeCompare(b.agence_id)
      if (byAgence !== 0) return byAgence
      return a.recouvrement_pct - b.recouvrement_pct
    })
    .map(mapTerrainAgentToRocRow)
}

export function buildRocRecouvrementReseau() {
  const objectif = 2_400_000
  const collecte = 1_240_000
  const clientsARisque = TERRAIN_COMMERCIAL.reduce((s, a) => s + a.clients_a_risque, 0)
  const visitesJour = TERRAIN_COMMERCIAL.reduce((s, a) => s + Math.max(1, a.visites_jour ?? Math.round(a.visites_mois / 22)), 0)
  return {
    objectif_jour_fcfa: objectif,
    collecte_jour_fcfa: collecte,
    taux_atteint_pct: Math.round((collecte / objectif) * 100),
    clients_a_visiter: clientsARisque,
    clients_visites_jour: Math.round(visitesJour * 0.72),
    clients_non_visites: Math.max(0, clientsARisque - Math.round(visitesJour * 0.72)),
    promesses_paiement_count: 12,
    promesses_paiement_montant: 480_000,
    promesses_honorees_pct: 64,
  }
}

export function buildRocSyntheseNarrative() {
  const m = getMoisCourant()
  const bk = AGENCES.find(a => a.id === 'AG-003')!
  const ad = AGENCES.find(a => a.id === 'AG-002')!
  const varEncours = variationMoM('encours_fcfa')
  const bloques = countDossiersBloques()
  const risqueEleve = REGISTRE_CLIENTS_RISQUE.filter(c => c.pd_pct >= 50).length

  return {
    date_generation: 'aujourd\'hui 06:42',
    intro: `Le portefeuille réseau progresse (${varEncours > 0 ? '+' : ''}${varEncours}% MoM) avec ${m.emprunteurs} prêts actifs, mais ${bk.nom_court} et le recouvrement du jour demandent un arbitrage matinal.`,
    points: [
      { icon: 'trend', texte: `Encours réseau : ${fmtM(m.encours_fcfa)} FCFA (${varEncours > 0 ? '+' : ''}${varEncours}% vs avril). ${m.emprunteurs} emprunteurs.`, tone: 'positif' as const },
      { icon: 'risk', texte: `PAR 30 ${bk.nom_court} : ${bk.par_courant}% (seuil BCEAO 10%) — PAR réseau ${m.par_30}%.`, tone: 'negatif' as const },
      { icon: 'risk', texte: `${risqueEleve} clients à PD ≥ 50% dans le registre risque réseau.`, tone: 'negatif' as const },
      { icon: 'team', texte: 'Agents Kossi Adjavon et Mensah Kodjo : recouvrement < 75% — coaching terrain requis.', tone: 'negatif' as const },
      { icon: 'block', texte: `${bloques} dossiers bloqués > 48h (${fmtM(sumMontantBloques())} FCFA en attente).`, tone: 'negatif' as const },
      { icon: 'volume', texte: `${m.decaissements} décaissements mois — ${Math.round(RESEAU_CONSOLIDE.decaissements_mois / 30)} prévus aujourd'hui.`, tone: 'attention' as const },
      { icon: 'cash', texte: `Tension cash ${bk.nom_court} + suivi ${ad.nom_court} — virement inter-agences matinal.`, tone: 'attention' as const },
    ],
    priorites: [
      `Traiter les ${bloques} dossiers en file ROC (> 48h)`,
      `Renforcer le recouvrement sur ${bk.nom_court} (PAR ${bk.par_courant}%)`,
      `Aligner collecte jour sur objectif ${fmtM(m.collecte_fcfa / 22)} FCFA`,
      `Virement urgent trésorerie → ${bk.nom_court} avant 10h`,
    ],
  }
}

function sumMontantBloques(): number {
  return REGISTRE_DOSSIERS_BLOQUES.reduce((s, d) => s + d.montant, 0)
}

export function verifierCoherenceRocDashboard(home: {
  kpis_credit_etendus: ReturnType<typeof buildRocKpisCreditEtendus>
  kpis_operations: ReturnType<typeof buildRocKpisOperationsFixed>
  recouvrement_reseau: ReturnType<typeof buildRocRecouvrementReseau>
  performance_agents: ReturnType<typeof buildRocPerformanceAgents>
}): boolean {
  const m = getMoisCourant()
  const checks = [
    home.kpis_credit_etendus.nb_prets_actifs === m.emprunteurs,
    home.kpis_credit_etendus.par_30_pct === m.par_30,
    home.kpis_operations.dossiers_bloques === countDossiersBloques(),
    home.recouvrement_reseau.collecte_jour_fcfa === home.kpis_credit_etendus.remboursements_jour_montant,
    home.performance_agents.every(a => AGENCES.some(ag => ag.nom_court === a.zone)),
    home.performance_agents.length === RESEAU_CONSOLIDE.agents_terrain,
    !home.performance_agents.some(a => /Tsévié|Tabligbo|Tsevié/i.test(a.zone)),
  ]
  return checks.every(Boolean)
}

/** Dernière valeur PAR mensuelle = mois courant */
export function assertRocParSeriesCoherent(): boolean {
  const last = RESEAU_MENSUEL.at(-1)!
  return buildRocEvolutionPar30().at(-1)?.par_30 === last.par_30
}
