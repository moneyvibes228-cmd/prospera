// Hub recouvrement ROC — synthèse stratégique (méthode, rendu, agents en souci)

import { MOCK_ROC_HOME } from '@/lib/mockMicrofinance'
import { ROC_SYNTHESE_COMPLEMENT } from '@/lib/roc-synthese-ia'
import { getEquipeRecouvrementRoc, getAgentRecouvrementIdByNom } from '@/lib/roc-recouvrement-vue360'
import { EQUIPES_AGENCES_ROC } from '@/lib/roc-equipes-agences'

export interface MethodeRecouvrement {
  titre: string
  description: string
  points: string[]
}

export interface AgentEnSouci {
  id: string
  nom: string
  zone: string
  agence_id: string
  statut: 'CRITIQUE' | 'VIGILANCE' | 'DEGRADE'
  taux_recouvrement: number
  visites_jour: number
  visites_obj: number
  retards_j7: number
  collecte_jour: number
  ecart_objectif_pct: number
  diagnostic_ia: string
  action_roc: string
}

export interface AgenceRecouvrementHub {
  agence_id: string
  nom: string
  taux_pct: number
  objectif_pct: number
  collecte_jour_fcfa: number
  impayes_fcfa: number
  nb_agents: number
  taux_equipe_moyen: number
  strategie_ia: string
  statut: 'CRITIQUE' | 'TENSION' | 'OK' | 'EXCELLENT'
}

export interface ActionStrategique {
  priorite: number
  action: string
  responsable: string
  delai: string
  impact_estime: string
}

export interface RecouvrementHubData {
  synthese_ia: string
  methode_actuelle: MethodeRecouvrement
  rendu_actuel: MethodeRecouvrement
  methode_suggeree: MethodeRecouvrement
  kpis: {
    objectif_jour_fcfa: number
    collecte_jour_fcfa: number
    taux_atteint_pct: number
    objectif_taux_pct: number
    ecart_pts: number
    clients_visites: number
    clients_prevus: number
    clients_non_visites: number
    promesses_count: number
    promesses_montant: number
    promesses_honorees_pct: number
    impayes_reseau_fcfa: number
  }
  agents_en_souci: AgentEnSouci[]
  agences: AgenceRecouvrementHub[]
  plan_strategique: ActionStrategique[]
  evolution_semaine: { jour: string; collecte: number; objectif: number }[]
}

function buildAgentsEnSouci(): AgentEnSouci[] {
  const equipe = getEquipeRecouvrementRoc()
  const result: AgentEnSouci[] = []

  for (const a of equipe.agents) {
    const visiteRatio = a.visites_jour / a.visites_obj
    const isDegrade = a.statut === 'DEGRADE'
    const isCritique = a.taux_recouvrement < 55 || visiteRatio < 0.5
    const isVigilance = !isCritique && !isDegrade && (a.taux_recouvrement < 75 || a.retards_j7 >= 8 || visiteRatio < 0.85)

    if (!isDegrade && !isCritique && !isVigilance) continue

    const agence = EQUIPES_AGENCES_ROC.find(e => e.nom === a.zone || e.agents.some(ag => ag.nom === a.nom))

    result.push({
      id: a.id,
      nom: a.nom,
      zone: a.zone,
      agence_id: agence?.agence_id ?? 'AG-000',
      statut: isDegrade || isCritique ? 'CRITIQUE' : 'VIGILANCE',
      taux_recouvrement: a.taux_recouvrement,
      visites_jour: a.visites_jour,
      visites_obj: a.visites_obj,
      retards_j7: a.retards_j7,
      collecte_jour: a.collecte_jour,
      ecart_objectif_pct: Math.round(a.taux_recouvrement - 75),
      diagnostic_ia: a.analyse_ia_equipe,
      action_roc: a.points_faibles[0] ?? 'Suivi renforcé',
    })
  }

  // Kossi flagged via synthese even if NORMAL statut
  if (!result.some(a => a.nom === 'Kossi Adjavon')) {
    const kossi = equipe.agents.find(a => a.nom === 'Kossi Adjavon')
    if (kossi) {
      result.push({
        id: kossi.id,
        nom: kossi.nom,
        zone: kossi.zone,
        agence_id: 'AG-003',
        statut: 'VIGILANCE',
        taux_recouvrement: kossi.taux_recouvrement,
        visites_jour: kossi.visites_jour,
        visites_obj: kossi.visites_obj,
        retards_j7: kossi.retards_j7,
        collecte_jour: kossi.collecte_jour,
        ecart_objectif_pct: -4,
        diagnostic_ia: kossi.analyse_ia_equipe,
        action_roc: 'Mission jeudi sur 3 impayés top — PAR agence 11,7 %',
      })
    }
  }

  return result.sort((a, b) => {
    const order = { CRITIQUE: 0, DEGRADE: 0, VIGILANCE: 1 }
    return order[a.statut] - order[b.statut] || a.taux_recouvrement - b.taux_recouvrement
  })
}

export function getRecouvrementHubData(): RecouvrementHubData {
  const r = MOCK_ROC_HOME.recouvrement_reseau
  const strat = ROC_SYNTHESE_COMPLEMENT.recouvrement_global
  const impayes = MOCK_ROC_HOME.top_mauvais_payeurs.reduce((s, c) => s + c.montant_du, 0)

  const agences: AgenceRecouvrementHub[] = ROC_SYNTHESE_COMPLEMENT.recouvrement_agences.map(ag => {
    const eq = EQUIPES_AGENCES_ROC.find(e => e.agence_id === ag.agence_id)
    return {
      ...ag,
      nb_agents: eq?.nb_agents ?? 1,
      taux_equipe_moyen: eq?.taux_recouvrement_moyen ?? ag.taux_pct,
      statut:
        ag.taux_pct < 60 ? 'CRITIQUE' :
        ag.taux_pct < 70 ? 'TENSION' :
        ag.taux_pct >= 80 ? 'EXCELLENT' : 'OK',
    }
  })

  return {
    synthese_ia:
      'Le recouvrement réseau n\'atteint que 52 % de l\'objectif journalier (1,24 M / 2,4 M FCFA). La méthode actuelle — tournées dispersées sans ciblage P1 — produit un rendement insuffisant : 79 clients non visités et 64 % de promesses honorées seulement. L\'écart ne vient pas des clients seuls mais surtout de 2 agents terrain : Mensah Kodjo (48 %, 6/15 visites) et Kossi Adjavon (3 top impayés concentrés sur Bè Kpota). La stratégie suggérée par l\'IA : basculer jeudi–vendredi en mode mission ciblée (5 clients P1 + coaching + relance promesses) pour viser 68–72 % fin de semaine.',

    methode_actuelle: {
      titre: 'Méthode actuelle',
      description: 'Recouvrement réactif — tournées libres, relances téléphoniques, promesses sans suivi horaire.',
      points: [
        'Chaque agent planifie ses visites sans file priorités réseau commune',
        'Relances MoMo / appel sans escalade ROC sur impayés > 60 j',
        'Promesses enregistrées mais relance non systématique à J+1',
        'Pas de mission conjointe ROC sur agences PAR > 10 %',
      ],
    },

    rendu_actuel: {
      titre: 'Rendu actuel',
      description: `Taux jour ${strat.taux_pct} % (écart ${strat.ecart_pts} pts vs objectif 75 %).`,
      points: [
        `${formatFcfaShort(strat.collecte_jour_fcfa)} collectés sur ${formatFcfaShort(strat.objectif_jour_fcfa)} objectif`,
        `${r.clients_non_visites} clients non visités / ${r.clients_a_visiter} prévus (${Math.round((r.clients_visites_jour / r.clients_a_visiter) * 100)} % couverture)`,
        `${r.promesses_paiement_count} promesses actives — ${r.promesses_honorees_pct} % honorées sur 7 j`,
        `${formatFcfaShort(impayes)} impayés top 6 clients — 3 concentrés Bè Kpota`,
        '2 agents en alerte critique, 1 en vigilance PAR portefeuille',
      ],
    },

    methode_suggeree: {
      titre: 'Méthode suggérée (IA)',
      description: strat.strategie_ia,
      points: [
        'File P1 réseau : 5 impayés Bè Kpota (cible 400 k jeudi) + mission ROC conjointe',
        'Coaching Mensah Kodjo : objectif 12 visites/j + réaffectation 4 dossiers critiques',
        'Relance promesses : 4 non honorées avant 12 h — script MoMo standardisé',
        'Réplication modèle Tsévié/Tabligbo (visites régulières, PAR < 7 %)',
        'Objectif réaliste fin semaine : 68–72 % si exécution jeudi–vendredi',
      ],
    },

    kpis: {
      objectif_jour_fcfa: r.objectif_jour_fcfa,
      collecte_jour_fcfa: r.collecte_jour_fcfa,
      taux_atteint_pct: r.taux_atteint_pct,
      objectif_taux_pct: strat.objectif_pct,
      ecart_pts: strat.ecart_pts,
      clients_visites: r.clients_visites_jour,
      clients_prevus: r.clients_a_visiter,
      clients_non_visites: r.clients_non_visites,
      promesses_count: r.promesses_paiement_count,
      promesses_montant: r.promesses_paiement_montant,
      promesses_honorees_pct: r.promesses_honorees_pct,
      impayes_reseau_fcfa: impayes,
    },

    agents_en_souci: buildAgentsEnSouci(),
    agences,
    plan_strategique: [
      { priorite: 1, action: 'Mission recouvrement Bè Kpota — 3 impayés P1 avec Kossi Adjavon', responsable: 'ROC + Kossi', delai: 'Jeudi', impact_estime: '+400 k FCFA' },
      { priorite: 2, action: 'Coaching Mensah Kodjo — plan visites 12/j + réaffectation 4 clients', responsable: 'ROC', delai: 'Aujourd\'hui', impact_estime: '+8 pts tx Lomé C.' },
      { priorite: 3, action: 'Relance 4 promesses non honorées (avant 12 h)', responsable: 'Agents zone', delai: 'Demain matin', impact_estime: '+120 k FCFA' },
      { priorite: 4, action: 'Documenter bonnes pratiques Sena Dossou / Elom Komlavi', responsable: 'Resp. agences', delai: 'Semaine', impact_estime: 'Modèle réplicable' },
      { priorite: 5, action: 'Suspendre nouveaux décaissements Bè Kpota tant que PAR > 10 %', responsable: 'ROC', delai: 'Immédiat', impact_estime: 'Protection PAR' },
    ],

    evolution_semaine: [
      { jour: 'Lun', collecte: 980_000, objectif: 2_400_000 },
      { jour: 'Mar', collecte: 1_120_000, objectif: 2_400_000 },
      { jour: 'Mer', collecte: 1_240_000, objectif: 2_400_000 },
      { jour: 'Jeu', collecte: 0, objectif: 2_400_000 },
      { jour: 'Ven', collecte: 0, objectif: 2_400_000 },
    ],
  }
}

function formatFcfaShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace('.', ',')} M FCFA`
  return `${Math.round(n / 1000)} k FCFA`
}

export function getAgentIdByNom(nom: string): string | undefined {
  return getAgentRecouvrementIdByNom(nom)
}
