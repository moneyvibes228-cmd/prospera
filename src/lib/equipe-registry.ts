/** Registre agents rÃ©seau â€” consolidation mocks Prospera */

import { AGENCES, RESEAU_CONSOLIDE } from '@/lib/agences'
import { AGENTS_DG, agentNomToId } from '@/lib/dg-vue360'
import { TERRAIN_COMMERCIAL } from '@/lib/equipe-terrain-data'
import { MOCK_ROC_HOME } from '@/lib/mockMicrofinance'
import type { AgentPerformance, EquipeHub } from '@/lib/equipe-hub'

const ZONE_TO_AGENCE: Record<string, { id: string; nom: string }> = {
  'LomÃ© Centre': { id: 'AG-001', nom: 'LomÃ© Centre' },
  'LomÃ© C.': { id: 'AG-001', nom: 'LomÃ© Centre' },
  'AdidogomÃ©': { id: 'AG-002', nom: 'AdidogomÃ©' },
  'TsÃ©viÃ©': { id: 'AG-004', nom: 'HÃ©dzranawoÃ©' },
  'BÃ¨ Kpota': { id: 'AG-003', nom: 'BÃ¨ Kpota' },
  'HÃ©dzranawoÃ©': { id: 'AG-004', nom: 'HÃ©dzranawoÃ©' },
  'Tabligbo': { id: 'AG-005', nom: 'KpalimÃ©' },
  'KpalimÃ©': { id: 'AG-005', nom: 'KpalimÃ©' },
}

function agenceMeta(zoneOrId: string) {
  if (zoneOrId.startsWith('AG-')) {
    const a = AGENCES.find(x => x.id === zoneOrId)
    return a ? { id: a.id, nom: a.nom_court } : { id: zoneOrId, nom: zoneOrId }
  }
  return ZONE_TO_AGENCE[zoneOrId] ?? { id: 'AG-001', nom: zoneOrId }
}

function pct(real: number, obj: number) {
  if (obj <= 0) return 0
  return Math.min(100, Math.round((real / obj) * 100))
}

/** Agents terrain / commerciaux â€” voir equipe-terrain-data.ts */

function clientsPortefeuilleUniques(agents: AgentPerformance[]): number {
  const byAgence = new Map<string, number>()
  for (const a of agents) {
    if (a.role === 'Resp. agence') {
      byAgence.set(a.agence_id, a.clients_portefeuille)
    }
  }
  for (const a of agents) {
    if (!byAgence.has(a.agence_id)) {
      byAgence.set(a.agence_id, a.clients_portefeuille)
    }
  }
  return [...byAgence.values()].reduce((s, n) => s + n, 0)
}

function visitesEquipeAgence(agenceId: string): { mois: number; objectif: number; nb: number; nb_commerciaux: number } {
  const terrain = TERRAIN_COMMERCIAL.filter(a => a.agence_id === agenceId)
  const commerciaux = terrain.filter(a => a.role === 'Commercial')
  return {
    mois: commerciaux.reduce((s, a) => s + a.visites_mois, 0),
    objectif: commerciaux.reduce((s, a) => s + a.visites_objectif, 0),
    nb: terrain.length,
    nb_commerciaux: commerciaux.length,
  }
}

function dgToAgent(a: (typeof AGENTS_DG)[0]): Omit<AgentPerformance, 'rang'> {
  const objCollecte = a.objectifs.collecte
  const equipe = visitesEquipeAgence(a.agence_id)
  return {
    id: a.id,
    nom: a.nom,
    role: 'Resp. agence',
    agence_id: a.agence_id,
    agence: a.agence,
    actif: true,
    score: a.score,
    badge: a.badge,
    statut: a.score >= 85 ? 'BON' : a.score >= 70 ? 'NORMAL' : 'DEGRADE',
    clients_portefeuille: a.clients_portefeuille,
    clients_a_risque: a.clients_a_risque,
    portefeuille_fcfa: AGENCES.find(x => x.id === a.agence_id)?.encours_fcfa ?? Math.round(a.clients_portefeuille * 450_000),
    visites_mois: equipe.mois,
    visites_objectif: equipe.objectif,
    visites_jour: Math.round(equipe.mois / 22),
    collecte_mois_fcfa: a.collecte,
    collecte_jour_fcfa: Math.round(a.collecte / 22),
    objectif_collecte_mois_fcfa: objCollecte,
    objectif_atteint_pct: pct(a.collecte, objCollecte),
    recouvrement_pct: a.recouvrement,
    objectif_recouvrement_pct: a.objectifs.recouvrement,
    par_30_pct: a.par,
    retards_j7: a.clients_a_risque,
    nouveaux_clients_mois: a.realise.nouveaux_clients,
    objectif_nouveaux_clients: a.objectifs.nouveaux_clients,
    decaissements_mois: a.realise.decaissements,
    gps_conformite_pct: a.gps_conformite_pct,
    derniere_visite: 'Pilotage agence',
    lien_fiche: `/dashboard/agents/${a.id}`,
    ia_resume: a.ia_analyse,
    est_responsable_agence: true,
    nb_agents_terrain: equipe.nb_commerciaux,
  }
}

function buildAgents(): AgentPerformance[] {
  const byName = new Map<string, Omit<AgentPerformance, 'rang'>>()

  for (const a of AGENTS_DG.map(dgToAgent)) {
    byName.set(a.nom, a)
  }
  for (const a of TERRAIN_COMMERCIAL) {
    if (!byName.has(a.nom)) {
      byName.set(a.nom, a)
    }
  }

  for (const p of MOCK_ROC_HOME.performance_agents) {
    const meta = agenceMeta(p.zone)
    if (byName.has(p.agent)) continue
    byName.set(p.agent, {
      id: agentNomToId(p.agent),
      nom: p.agent,
      role: 'GP',
      agence_id: meta.id,
      agence: meta.nom,
      actif: true,
      score: p.taux_recouvrement,
      badge: null,
      statut: p.statut as AgentPerformance['statut'],
      clients_portefeuille: p.clients_actifs,
      clients_a_risque: p.retards_j7,
      portefeuille_fcfa: p.portefeuille_fcfa,
      visites_mois: p.visites_jour * 22,
      visites_objectif: p.visites_obj * 22,
      visites_jour: p.visites_jour,
      collecte_mois_fcfa: p.collecte_jour * 22,
      collecte_jour_fcfa: p.collecte_jour,
      objectif_collecte_mois_fcfa: Math.round(p.portefeuille_fcfa * 0.08),
      objectif_atteint_pct: pct(p.collecte_jour * 22, p.portefeuille_fcfa * 0.08),
      recouvrement_pct: p.taux_recouvrement,
      objectif_recouvrement_pct: 85,
      par_30_pct: 8,
      retards_j7: p.retards_j7,
      nouveaux_clients_mois: 1,
      objectif_nouveaux_clients: 2,
      decaissements_mois: 1,
      gps_conformite_pct: 85,
      derniere_visite: 'â€”',
      lien_fiche: `/dashboard/agents/${agentNomToId(p.agent)}`,
      ia_resume: 'DonnÃ©es consolidÃ©es ROC â€” voir fiche agent pour dÃ©tail.',
    })
  }

  const sorted = [...byName.values()].sort((a, b) => b.score - a.score)
  return sorted.map((a, i) => ({ ...a, rang: i + 1 }))
}

let _cache: EquipeHub | null = null

export function resetEquipeRegistryCache(): void {
  _cache = null
}

export function getEquipeRegistry(): EquipeHub {
  if (_cache) return _cache

  const agents = buildAgents()
  const actifs = agents.filter(a => a.actif)
  const degrade = agents.filter(a => a.statut === 'DEGRADE')
  const collecteTot = agents.reduce((s, a) => s + a.collecte_mois_fcfa, 0)
  const objTot = agents.reduce((s, a) => s + a.objectif_collecte_mois_fcfa, 0)

  _cache = {
    synthese_ia: `RÃ©seau ${RESEAU_CONSOLIDE.total_agences} agences â€” performance moyenne ${Math.round(actifs.reduce((s, a) => s + a.score, 0) / actifs.length)} %. Deux arbitrages direction : redressement BÃ¨ Kpota (PAR agence) et consolidation du modÃ¨le RA + commercial + GP sur les agences conformes. Collecte ${Math.round(collecteTot / 1_000_000 * 10) / 10} M / ${Math.round(objTot / 1_000_000 * 10) / 10} M objectif (${pct(collecteTot, objTot)} %). DÃ©tail opÃ©rationnel (coaching, visites, GPS) Ã  traiter au niveau RA, pas en comitÃ© DG.`,
    kpis: {
      total_agents: agents.length,
      agents_actifs: actifs.length,
      agents_degrades: degrade.length,
      performance_moyenne_pct: Math.round(actifs.reduce((s, a) => s + a.score, 0) / actifs.length),
      collecte_mois_fcfa: collecteTot,
      objectif_collecte_mois_fcfa: objTot,
      objectif_atteint_pct: pct(collecteTot, objTot),
      recouvrement_moyen_pct: Math.round(actifs.reduce((s, a) => s + a.recouvrement_pct, 0) / actifs.length * 10) / 10,
      visites_mois_total: actifs.reduce((s, a) => s + a.visites_mois, 0),
      clients_portefeuille_total: clientsPortefeuilleUniques(actifs),
    },
    agents,
    repartition_agences: AGENCES.map(ag => {
      const agAgents = agents.filter(a => a.agence_id === ag.id)
      return {
        agence_id: ag.id,
        agence: ag.nom_court,
        nb_agents: agAgents.length,
        performance_moyenne: agAgents.length
          ? Math.round(agAgents.reduce((s, a) => s + a.score, 0) / agAgents.length)
          : 0,
        collecte_mois_fcfa: agAgents.reduce((s, a) => s + a.collecte_mois_fcfa, 0),
      }
    }),
    glossaire: [
      { terme: 'Score performance', definition: 'Indice composite 0â€“100 : collecte, recouvrement, visites, PAR et GPS.' },
      { terme: 'Recouvrement', definition: 'Taux de remboursement des Ã©chÃ©ances sur le portefeuille assignÃ© Ã  l\'agent.' },
      { terme: 'Objectif atteint', definition: 'Ratio collecte rÃ©alisÃ©e / objectif mensuel fixÃ© par la direction.' },
      { terme: 'Statut DEGRADE', definition: 'Score < 70 ou recouvrement < 60 % â€” plan d\'action obligatoire sous 7 jours.' },
    ],
  }
  return _cache
}

export function getEquipeHub(): EquipeHub {
  return getEquipeRegistry()
}
