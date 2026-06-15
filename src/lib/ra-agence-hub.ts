// Hub Responsable d'Agence — Lomé Centre (pilotage agence)

import { AGENCES, AGENCES_DATA } from '@/lib/agences'
import { buildEpargneStats } from '@/lib/mock-operations-registry'
import type { RapportIA } from '@/lib/mockMicrofinance'
import { MOCK_RA_HOME } from '@/lib/mockMicrofinance'
import { buildRapportIARa } from '@/lib/rapport-ra-builder'
import { isAgentTerrain, isGestionnairePortefeuille, isResponsableAgence } from '@/lib/ra-role-utils'
import { getMauvaisPayeursByAgence } from '@/lib/roc-recouvrement-vue360'

export { isAgentTerrain, isGestionnairePortefeuille, isResponsableAgence } from '@/lib/ra-role-utils'

export interface EquipeObjectifTerrain {
  agent: string
  role: string
  portefeuille: number
  collecte_jour: number
  par_30: number
  performance_pct: number
  badge: 'OR' | 'ARGENT' | 'BRONZE' | null
  statut: 'BON' | 'NORMAL' | 'DEGRADE'
  rang: number
  objectif_collecte_mois: number
  collecte_mois: number
  objectif_atteint_pct: number
  idees_ia: string[]
}

export interface EquipeGpRA {
  agent: string
  role: 'GP'
  clients_suivis: number
  encours_fcfa: number
  recouvrement_pct: number
  collecte_mois_fcfa: number
  objectif_recouvrement_pct: number
  objectif_atteint_pct: number
  par_30: number
  relances_jour: number
  promesses_semaine: number
  clients_a_risque: number
  dossiers_en_attente: number
  performance_pct: number
  badge: 'OR' | 'ARGENT' | 'BRONZE' | null
  statut: 'BON' | 'NORMAL' | 'DEGRADE'
  idees_ia: string[]
}

const AGENCE_ID_DEFAULT = 'AG-001'

function getAgenceMeta(agenceId: string) {
  const ag = AGENCES.find(a => a.id === agenceId)!
  return {
    id: ag.id,
    nom: ag.nom_court,
    responsable: ag.responsable,
    ville: ag.ville,
  }
}

export const AGENCE_RA = getAgenceMeta(AGENCE_ID_DEFAULT)

export const RAPPORT_IA_RA: RapportIA = buildRapportIARa(AGENCE_RA.id)

export interface AgentTerrainRA {
  id: string
  nom: string
  role: string
  lat: number
  lng: number
  actif: boolean
  visites_jour: number
  visites_prevues: number
  collecte_jour: number
  objectif_jour: number
  couverture_pct: number
  performance_pct: number
  statut: 'BON' | 'NORMAL' | 'DEGRADE'
  couleur: string
}

export interface MauvaisPayeurRA {
  client: string
  montant_du: number
  retard_jours: number
  agent: string
  proba_defaut?: number
  action_ia: string
}

export interface RaPilotageAcces {
  href: string
  label: string
  desc: string
  badge: string
}

export interface RaPilotageChiffres {
  emprunteurs_credit: number
  comptes_epargne: number
  clients_total: number
  agents_terrain: number
  agents_terrain_actifs: number
  dossiers_credit_actifs: number
  alertes_equipe: number
  responsable: string
}

const TERRAIN_UI: Record<
  string,
  Partial<Pick<AgentTerrainRA, 'visites_jour' | 'visites_prevues' | 'couverture_pct' | 'actif' | 'couleur'>>
> = {
  'Yawo Adjavon': { visites_jour: 8, visites_prevues: 9, couverture_pct: 92, actif: true, couleur: '#2563eb' },
  'Mensah Kodjo': { visites_jour: 4, visites_prevues: 12, couverture_pct: 42, actif: true, couleur: '#ef4444' },
}

function buildAgentsTerrain(
  agenceId: string,
  ag: (typeof AGENCES)[0],
  performers: Array<{
    agent: string
    role?: string
    visites: number
    collecte: number
    recouvrement: number
    par: number
    score: number
  }>,
): AgentTerrainRA[] {
  const baseLat = ag.latitude
  const baseLng = ag.longitude

  return performers.map((a, i) => {
    const ui = TERRAIN_UI[a.agent] ?? {}
    const visitesPrevues = ui.visites_prevues ?? Math.max(6, Math.round(a.visites / 10))
    const visitesJour = ui.visites_jour ?? Math.max(0, Math.round(a.visites / 10))
    const couverture = ui.couverture_pct ?? Math.min(95, Math.round(a.recouvrement))
    const perf = a.score
    const statut: AgentTerrainRA['statut'] =
      perf >= 85 ? 'BON' : perf >= 70 ? 'NORMAL' : 'DEGRADE'

    return {
      id: `AT-${agenceId}-${i + 1}`,
      nom: a.agent,
      role: a.role ?? 'Commercial',
      lat: baseLat + (i - 1) * 0.008,
      lng: baseLng + i * 0.006,
      actif: ui.actif ?? visitesJour > 0,
      visites_jour: visitesJour,
      visites_prevues: visitesPrevues,
      collecte_jour: Math.round(a.collecte / 30),
      objectif_jour: Math.round(a.collecte / 30 * 1.08),
      couverture_pct: couverture,
      performance_pct: perf,
      statut,
      couleur: ui.couleur ?? (statut === 'DEGRADE' ? '#ef4444' : '#2563eb'),
    }
  })
}

function buildEquipeGp(
  agenceNom: string,
  ag: (typeof AGENCES)[0],
  performersGp: Array<{
    agent: string
    role?: string
    visites: number
    collecte: number
    recouvrement: number
    par: number
    score: number
    badge?: string | null
  }>,
): EquipeGpRA[] {
  const clientsARisque = getMauvaisPayeursByAgence(agenceNom).length
  const objectifRecouvrement = 90

  return performersGp.map(a => {
    const perf = a.score
    const statut: EquipeGpRA['statut'] =
      perf >= 85 ? 'BON' : perf >= 70 ? 'NORMAL' : 'DEGRADE'

    return {
      agent: a.agent,
      role: 'GP',
      clients_suivis: ag.emprunteurs_actifs,
      encours_fcfa: ag.encours_fcfa,
      recouvrement_pct: a.recouvrement,
      collecte_mois_fcfa: a.collecte,
      objectif_recouvrement_pct: objectifRecouvrement,
      objectif_atteint_pct: Math.min(100, Math.round((a.recouvrement / objectifRecouvrement) * 100)),
      par_30: a.par,
      relances_jour: Math.max(2, Math.round(a.visites / 8)),
      promesses_semaine: Math.max(3, Math.round(a.recouvrement / 12)),
      clients_a_risque: clientsARisque,
      dossiers_en_attente: Math.max(1, Math.round(ag.emprunteurs_actifs * 0.04)),
      performance_pct: perf,
      badge: (a.badge as EquipeGpRA['badge']) ?? null,
      statut,
      idees_ia:
        statut === 'DEGRADE'
          ? ['Renforcer relances WA J+3', 'Revue hebdo dossiers contentieux', 'Binôme avec commercial terrain sur impayés']
          : perf >= 85
            ? ['Capitaliser sur promesses tenues', 'Mentorat relances commerciaux', 'Documenter bonnes pratiques recouvrement']
            : ['Prioriser clients J+7', 'Objectif +4 relances/jour', 'Synchroniser avec commerciaux zone'],
    }
  })
}

function buildPilotageAcces(chiffres: RaPilotageChiffres): RaPilotageAcces[] {
  return [
    {
      href: '/emprunteurs',
      label: 'Emprunteurs agence',
      desc: 'Fiches clients · calendrier recouvrement',
      badge: `${chiffres.emprunteurs_credit} emprunteurs`,
    },
    {
      href: '/terrain',
      label: 'Terrain & agents',
      desc: 'Carte agents terrain · résultats du jour (hors RA)',
      badge: `${chiffres.agents_terrain_actifs}/${chiffres.agents_terrain} actifs`,
    },
    {
      href: '/credit',
      label: 'Crédit & Opérations',
      desc: 'Analyse IA crédit · dossiers · secteurs',
      badge: `${chiffres.dossiers_credit_actifs} dossiers`,
    },
    {
      href: '/equipe',
      label: 'Équipe & objectifs',
      desc: `Classement terrain · ${chiffres.responsable} (pilotage)`,
      badge: `${chiffres.alertes_equipe} alerte${chiffres.alertes_equipe > 1 ? 's' : ''}`,
    },
  ]
}

export function getRaHubData(agenceId = AGENCE_ID_DEFAULT) {
  const ag = AGENCES.find(a => a.id === agenceId)!
  const detail = AGENCES_DATA[agenceId]
  const d = MOCK_RA_HOME
  const epargneAg = buildEpargneStats().par_agence.find(p => p.agence_id === agenceId)

  const emprunteurs = ag.emprunteurs_actifs
  const comptesEpargne = epargneAg?.count ?? 0
  const allPerformers =
    detail?.agents_performance ??
    d.equipe.map(e => ({
      agent: e.agent,
      role: e.role,
      visites: Math.round(e.collecte_jour / 8000),
      collecte: e.collecte_jour * 30,
      recouvrement: e.performance_pct,
      par: e.par_30,
      score: e.performance_pct,
      badge: e.badge,
    }))

  const performersTerrain = allPerformers.filter(a => isAgentTerrain(a.role))
  const performersGp = allPerformers.filter(a => isGestionnairePortefeuille(a.role))

  const agents_terrain = buildAgentsTerrain(agenceId, ag, performersTerrain)
  const equipe_gp = buildEquipeGp(ag.nom_court, ag, performersGp)
  const agentsActifs = agents_terrain.filter(a => a.actif)
  const equipeTerrain = d.equipe.filter(e => isAgentTerrain(e.role))

  const pilotage: RaPilotageChiffres = {
    emprunteurs_credit: emprunteurs,
    comptes_epargne: comptesEpargne,
    /** Crédit actifs uniquement — l'épargne est un indicateur séparé (évite le double comptage 633) */
    clients_total: emprunteurs,
    agents_terrain: performersTerrain.length,
    agents_terrain_actifs: agentsActifs.length,
    dossiers_credit_actifs: emprunteurs,
    alertes_equipe: detail?.alertes?.length ?? 2,
    responsable: ag.responsable,
  }

  const parHist = detail?.par_historique ?? []
  const encoursM = ag.encours_fcfa / 1_000_000

  return {
    agence: getAgenceMeta(agenceId),
    rapport: buildRapportIARa(agenceId),
    ...d,
    kpis_activite: {
      ...d.kpis_activite,
      clients_total: pilotage.clients_total,
      clients_emprunteurs: emprunteurs,
      clients_epargne: comptesEpargne,
    },
    pilotage,
    pilotage_pages: buildPilotageAcces(pilotage),
    croissance_mensuelle: parHist.map((h, i) => ({
      mois: h.mois,
      encours: Number((encoursM * (0.92 + i * 0.02)).toFixed(1)),
      clients: Math.round(emprunteurs * (0.94 + i * 0.015)),
      par: h.par_30j,
    })),
    secteurs_demande: [
      { secteur: 'Commerce', demandes: 28, approuves: 20, encours_pct: 37, par: 8.2, potentiel: 'MOYEN' },
      { secteur: 'Services', demandes: 18, approuves: 14, encours_pct: 22, par: 6.8, potentiel: 'FORT' },
      { secteur: 'Artisanat', demandes: 15, approuves: 12, encours_pct: 18, par: 5.4, potentiel: 'FORT' },
      { secteur: 'Agriculture', demandes: 8, approuves: 5, encours_pct: 6, par: 4.2, potentiel: 'FORT' },
      { secteur: 'Transport', demandes: 6, approuves: 4, encours_pct: 4, par: 7.1, potentiel: 'MOYEN' },
      { secteur: 'Restauration', demandes: 5, approuves: 3, encours_pct: 5, par: 9.8, potentiel: 'VIGILANCE' },
    ],
    dossiers_synthese: {
      actifs: emprunteurs,
      en_retard: d.kpis_credit.dossiers_en_retard,
      en_attente_validation: 5,
      montant_attente: 1_800_000,
      par_produit:
        detail?.repartition_produits.map(p => ({
          produit: p.produit,
          count: p.count,
          montant: p.encours,
        })) ?? [],
    },
    mauvais_payeurs: getMauvaisPayeursByAgence(AGENCE_RA.nom).map(m => ({
      client: m.nom,
      montant_du: m.montant_du,
      retard_jours: m.retard_j,
      agent: m.agent,
      proba_defaut: m.probabilite_remboursement_pct <= 40 ? 100 - m.probabilite_remboursement_pct : undefined,
      action_ia: m.actions_recommandees[0] ?? m.analyse_ia_recouvrement.slice(0, 72),
    })) as MauvaisPayeurRA[],
    recouvrement_evolution: [
      { semaine: 'S18', taux: 91, objectif: 95, collecte: 5_800_000 },
      { semaine: 'S19', taux: 92, objectif: 95, collecte: 6_100_000 },
      { semaine: 'S20', taux: 93, objectif: 95, collecte: 6_400_000 },
      { semaine: 'S21', taux: 94.2, objectif: 95, collecte: 6_800_000 },
    ],
    agents_terrain,
    transactions: {
      total_jour: d.kpis_activite.transactions_jour,
      depots: d.kpis_activite.depots_collectes_jour,
      decaissements: d.kpis_activite.decaissements_jour,
      retraits_par_type: [
        { type: 'Mobile Money', count: 18, montant: 420_000, pct: 48 },
        { type: 'Guichet espèces', count: 12, montant: 280_000, pct: 32 },
        { type: 'Virement interne', count: 8, montant: 150_000, pct: 17 },
        { type: 'Chèque', count: 2, montant: 45_000, pct: 3 },
      ],
      liquidite_par_jour: [
        { jour: 'Lun', entrees: 980_000, sorties: 720_000, net: 260_000 },
        { jour: 'Mar', entrees: 1_320_000, sorties: 680_000, net: 640_000 },
        { jour: 'Mer', entrees: 1_180_000, sorties: 890_000, net: 290_000 },
        { jour: 'Jeu', entrees: 1_280_000, sorties: 750_000, net: 530_000 },
        { jour: 'Ven', entrees: 1_240_000, sorties: 1_650_000, net: -410_000 },
      ],
      analyse_ia:
        'Les retraits MoMo représentent 48 % du volume sortant — pic mardi–jeudi (+22 % vs moyenne). Vendredi : tension structurelle (décaissements PME). Recommandation : renforcer caisse jeudi soir.',
    },
    equipe_objectifs: equipeTerrain.map((a, i) => ({
      ...a,
      rang: i + 1,
      objectif_collecte_mois: Math.round(a.portefeuille * 0.08),
      collecte_mois: Math.round(a.collecte_jour * 22),
      objectif_atteint_pct: Math.min(100, Math.round((a.collecte_jour * 22) / Math.max(a.portefeuille * 0.08, 1) * 100)),
      idees_ia:
        a.statut === 'DEGRADE'
          ? ['Coaching quotidien 30 min', 'Réaffecter 5 visites zone Est', 'Objectif réduit 15 visites/semaine réalistes']
          : a.performance_pct >= 85
            ? ['Documenter bonnes pratiques', 'Mentorat Mensah Kodjo', 'Bonus performance Q2']
            : ['Relance prospects chauds', 'Objectif +2 visites/jour', 'WhatsApp relance impayés'],
    })) satisfies EquipeObjectifTerrain[],
    equipe_gp,
  }
}
