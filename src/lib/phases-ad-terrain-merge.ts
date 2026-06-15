import { MOCK_TERRAIN_HOME } from '@/lib/mockMicrofinance'
import type { DashboardTerrainApi } from '@/types/phases-ad'

/** Fusionne réponse API terrain avec mock pour l’UI existante */
export function mergeTerrainDashboard(api: DashboardTerrainApi | null) {
  const mock = MOCK_TERRAIN_HOME
  const rj = api?.resume_journee
  const perf = api?.performance

  const mergedPerformance = perf
    ? {
        ...mock.performance,
        objectif_collecte_mois: perf.objectif_collecte_mois ?? mock.performance.objectif_collecte_mois,
        realise_collecte_mois: perf.realise_collecte_mois ?? mock.performance.realise_collecte_mois,
        visits_objectif_mois: perf.objectif_visites_semaine
          ? perf.objectif_visites_semaine * 4
          : mock.performance.visites_objectif_mois,
        visites_realisees_mois: perf.visites_semaine
          ? perf.visites_semaine * 4
          : mock.performance.visites_realisees_mois,
        taux_global_pct: perf.taux_atteinte_collecte_semaine_pct ?? mock.performance.taux_global_pct,
      }
    : mock.performance

  return {
    ...mock,
    resume_journee: {
      ...mock.resume_journee,
      clientes_a_visiter: rj?.visites_prevues ?? rj?.clientes_a_visiter ?? mock.resume_journee.clientes_a_visiter,
      montant_a_collecter: rj?.montant_collecte_jour ?? rj?.montant_a_collecter ?? mock.resume_journee.montant_a_collecter,
      tontines_prevues: rj?.tontines_actives ?? rj?.tontines_prevues ?? mock.resume_journee.tontines_prevues,
      clients_en_retard: rj?.clients_en_retard ?? mock.resume_journee.clients_en_retard,
      objectif_jour: rj?.objectif_jour ?? perf?.objectif_jour ?? mock.resume_journee.objectif_jour,
      taux_atteinte_pct: rj?.taux_atteinte_pct ?? mock.resume_journee.taux_atteinte_pct,
    },
    performance: mergedPerformance,
    planning_jour:
      api?.planning_jour?.map((p) => ({
        heure: p.heure?.slice(11, 16) ?? '—',
        cliente: p.cliente ?? p.client ?? '—',
        action: p.type,
        priorite: 'NORMALE',
        type: p.type,
        lat: p.lat ?? 0,
        lng: p.lng ?? 0,
        statut: p.statut ?? 'A_VENIR',
      })) ?? mock.planning_jour,
  }
}

export type MergedTerrainHome = ReturnType<typeof mergeTerrainDashboard>
