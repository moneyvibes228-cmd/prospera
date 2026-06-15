// Équipes par agence — vue ROC (performance agents + analyse IA)

import { MOCK_ROC_HOME } from '@/lib/mockMicrofinance'
import { getAgentRecouvrementIdByNom } from '@/lib/roc-recouvrement-vue360'
import { agentNomToId } from '@/lib/dg-vue360'

export interface AgentEquipeAgence {
  id: string
  nom: string
  role: 'Agent terrain' | 'Resp. agence' | 'Charge crédit'
  clients_actifs: number
  visites_jour: number
  visites_obj: number
  collecte_jour: number
  taux_recouvrement: number
  retards_j7: number
  portefeuille_fcfa: number
  statut: 'BON' | 'NORMAL' | 'DEGRADE'
  score_ia?: number
  lien_recouvrement?: string
  lien_fiche?: string
}

export interface EquipeAgenceROC {
  agence_id: string
  nom: string
  responsable: string
  par_30: number
  statut_agence: string
  encours: number
  nb_agents: number
  taux_recouvrement_moyen: number
  collecte_jour_totale: number
  agents: AgentEquipeAgence[]
  analyse_ia_equipe: string
  priorites: string[]
}

const RESPONSABLES: Record<string, string> = {
  'AG-001': 'Kofi Amavi',
  'AG-002': 'Akua Lawson',
  'AG-003': 'Edem Kpélim',
  'AG-004': 'Komi Atsu',
  'AG-005': 'Ama Fiagbé',
}

const ANALYSES: Record<string, { ia: string; priorites: string[] }> = {
  'AG-001': {
    ia: 'Équipe Lomé Centre sous Kofi Amavi : 62 clients agence uniques. 2 commerciaux (vue terrain/zones) + 1 GP (vue crédit) sur les mêmes dossiers. Mensah sous-performe en couverture zone Tokoin (42 %). Mawunya : relances et fidélisation OK. PAR agence 5,9 %.',
    priorites: ['Coaching Mensah Kodjo — couverture zone Tokoin', 'Relance 2 impayés > 30j via GP', 'Valider renouvellements éligibles'],
  },
  'AG-002': {
    ia: 'Adidogomé : Akua Lawson pilote l\'agence. Sena Dossou (GP) + 3 commerciaux terrain (Enyonam, Abla Tchalla). PAR 9,4 % — proche seuil BCEAO. Priorité restructuration 3 dossiers groupe.',
    priorites: ['Restructurer 3 dossiers crédit groupe', 'Suivre promesses impayés Adidogomé', 'Renforcer prospection commerciale'],
  },
  'AG-003': {
    ia: 'Bè Kpota : Edem Kpélim pilote l\'agence en situation critique. Kossi Adjavon (GP) + 3 commerciaux — PAR 11,2 % NON CONFORME. Supervision renforcée.',
    priorites: ['Mission recouvrement top impayés P1', 'Audit GPS équipe terrain', 'Virement cash urgent'],
  },
  'AG-004': {
    ia: 'Hédzranawoé : Komi Atsu pilote l\'agence. Mawu Hotor (GP) + Elom Komlavi et Abla Kpodar — meilleure discipline visites du réseau.',
    priorites: ['Validation ROC DOS-0228', 'Documenter bonnes pratiques visites', 'Maintenir PAR < 7 %'],
  },
  'AG-005': {
    ia: 'Kpalimé : Ama Fiagbé pilote l\'agence (meilleur PAR réseau 4,2 %). Akoue Yawa — GP suivi crédit. Prioriser décaissements — portefeuille sous-utilisé.',
    priorites: ['Arbitrer DOS-2026-0244', 'Accélérer décaissements éligibles', 'Maintenir PAR < 6 %'],
  },
}

function mapPerfAgent(a: (typeof MOCK_ROC_HOME.performance_agents)[0]): AgentEquipeAgence {
  const recId = getAgentRecouvrementIdByNom(a.agent)
  return {
    id: recId ?? agentNomToId(a.agent),
    nom: a.agent,
    role: 'Agent terrain',
    clients_actifs: a.clients_actifs,
    visites_jour: a.visites_jour,
    visites_obj: a.visites_obj,
    collecte_jour: a.collecte_jour,
    taux_recouvrement: a.taux_recouvrement,
    retards_j7: a.retards_j7,
    portefeuille_fcfa: a.portefeuille_fcfa,
    statut: a.statut as AgentEquipeAgence['statut'],
    lien_recouvrement: recId ? `/credit/recouvrement/agents/${recId}` : undefined,
    lien_fiche: `/dashboard/agents/${agentNomToId(a.agent)}`,
  }
}

/** Responsables d'agence — pilotage, pas terrain */
const AGENTS_EXTRA: Record<string, AgentEquipeAgence[]> = {
  'AG-001': [{
    id: 'agent-kofi-amavi',
    nom: 'Kofi Amavi',
    role: 'Resp. agence',
    clients_actifs: 62,
    visites_jour: 0,
    visites_obj: 0,
    collecte_jour: 0,
    taux_recouvrement: 96,
    retards_j7: 4,
    portefeuille_fcfa: 28_200_000,
    statut: 'BON',
    score_ia: 96,
    lien_fiche: '/dashboard/agents/agent-kofi-amavi',
  }],
  'AG-002': [{
    id: 'agent-akua-lawson',
    nom: 'Akua Lawson',
    role: 'Resp. agence',
    clients_actifs: 48,
    visites_jour: 0,
    visites_obj: 0,
    collecte_jour: 0,
    taux_recouvrement: 88,
    retards_j7: 7,
    portefeuille_fcfa: 22_100_000,
    statut: 'BON',
    score_ia: 84,
    lien_fiche: '/dashboard/agents/agent-akua-lawson',
  }],
  'AG-003': [{
    id: 'agent-edem-kpelim',
    nom: 'Edem Kpélim',
    role: 'Resp. agence',
    clients_actifs: 37,
    visites_jour: 0,
    visites_obj: 0,
    collecte_jour: 0,
    taux_recouvrement: 62,
    retards_j7: 12,
    portefeuille_fcfa: 17_400_000,
    statut: 'DEGRADE',
    score_ia: 62,
    lien_fiche: '/dashboard/agents/agent-edem-kpelim',
  }],
  'AG-004': [{
    id: 'agent-komi-atsu',
    nom: 'Komi Atsu',
    role: 'Resp. agence',
    clients_actifs: 27,
    visites_jour: 0,
    visites_obj: 0,
    collecte_jour: 0,
    taux_recouvrement: 92,
    retards_j7: 3,
    portefeuille_fcfa: 12_900_000,
    statut: 'BON',
    score_ia: 79,
    lien_fiche: '/dashboard/agents/agent-komi-atsu',
  }],
  'AG-005': [{
    id: 'agent-ama-fiagbe',
    nom: 'Ama Fiagbé',
    role: 'Resp. agence',
    clients_actifs: 14,
    visites_jour: 0,
    visites_obj: 0,
    collecte_jour: 0,
    taux_recouvrement: 97,
    retards_j7: 1,
    portefeuille_fcfa: 6_300_000,
    statut: 'BON',
    score_ia: 91,
    lien_fiche: '/dashboard/agents/agent-ama-fiagbe',
  }],
}

function buildEquipes(): EquipeAgenceROC[] {
  const heatmap = MOCK_ROC_HOME.heatmap_par_agences

  return heatmap.map(h => {
    const agentsTerrain = MOCK_ROC_HOME.performance_agents
      .filter(a => a.zone === h.agence)
      .map(mapPerfAgent)

    const extra = AGENTS_EXTRA[h.agence_id] ?? []
    const agents = [...agentsTerrain, ...extra.filter(e => !agentsTerrain.some(t => t.nom === e.nom))]

    const tauxMoyen = agents.length
      ? Math.round(agents.reduce((s, a) => s + a.taux_recouvrement, 0) / agents.length)
      : 0
    const collecteTot = agents.reduce((s, a) => s + a.collecte_jour, 0)
    const meta = ANALYSES[h.agence_id] ?? { ia: 'Analyse en cours.', priorites: [] }

    return {
      agence_id: h.agence_id,
      nom: h.agence,
      responsable: RESPONSABLES[h.agence_id] ?? '—',
      par_30: h.par_30,
      statut_agence: h.statut,
      encours: h.encours,
      nb_agents: agents.length,
      taux_recouvrement_moyen: tauxMoyen,
      collecte_jour_totale: collecteTot,
      agents,
      analyse_ia_equipe: meta.ia,
      priorites: meta.priorites,
    }
  })
}

export const EQUIPES_AGENCES_ROC: EquipeAgenceROC[] = buildEquipes()

export function getEquipeAgenceById(id: string): EquipeAgenceROC | undefined {
  return EQUIPES_AGENCES_ROC.find(e => e.agence_id === id)
}

export function getAnalyseReseauEquipes(): string {
  const degrade = EQUIPES_AGENCES_ROC.filter(e => e.agents.some(a => a.statut === 'DEGRADE')).length
  const critique = EQUIPES_AGENCES_ROC.filter(e => e.statut_agence === 'CRITIQUE').length
  return `Réseau : ${EQUIPES_AGENCES_ROC.length} agences, ${EQUIPES_AGENCES_ROC.reduce((s, e) => s + e.nb_agents, 0)} agents suivis (terrain + RA). ${critique} agence(s) en statut critique, ${degrade} avec agent(s) dégradé(s). Priorité ROC : Bè Kpota (PAR 11,2 % + Kossi Adjavon) puis Lomé Centre (Mensah Kodjo). Hédzranawoé et Kpalimé sont les références à dupliquer.`
}
