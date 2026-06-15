/**
 * Builders crédit / risque — dérivés de mock-time-series + agences + registre risque.
 */
import { AGENCES } from './agences'
import { getMoisCourant, getMoisPrecedent } from './mock-time-series'
import {
  buildConcentrationsSuspectes,
  buildDossiersBloques48h,
  buildHaussesAnormalesDefauts,
  buildTopClientsRisque,
} from './mock-risque-registry'

export function buildEvolutionPar30ParAgence() {
  const prevParReseau = getMoisPrecedent().par_30
  return AGENCES.map(a => {
    const par30 = a.par_courant
    const tendance = par30 > prevParReseau + 0.5 ? 'HAUSSE' as const
      : par30 < prevParReseau - 0.5 ? 'BAISSE' as const
      : 'STABLE' as const
    return {
      agence: a.nom_court,
      par_1: Number((par30 * 1.56).toFixed(1)),
      par_7: Number((par30 * 1.15).toFixed(1)),
      par_30: par30,
      par_60: Number((par30 * 0.56).toFixed(1)),
      par_90: Number((par30 * 0.38).toFixed(1)),
      tendance,
    }
  })
}

export function buildRisqueAvanceCourant(encoursContentieux: number) {
  const m = getMoisCourant()
  return {
    taux_defaut_pct: m.taux_defaut_pct,
    taux_recouvrement_pct: m.remboursement_pct,
    prets_restructures_mois: m.restructures,
    prets_contentieux_mois: m.contentieux,
    encours_contentieux: encoursContentieux,
    evolution_par_30j_par_agence: buildEvolutionPar30ParAgence(),
  }
}

/** Blocs narratifs DEC — dérivés du registre unifié */
export function buildRisqueAvanceNarratif() {
  return {
    top_clients_risque: buildTopClientsRisque(),
    dossiers_bloques_48h: buildDossiersBloques48h(),
    hausses_anormales_defauts: buildHaussesAnormalesDefauts(),
    concentrations_suspectes: buildConcentrationsSuspectes(),
  }
}

export function buildRisqueAvanceComplet(encoursContentieux: number) {
  return {
    ...buildRisqueAvanceCourant(encoursContentieux),
    ...buildRisqueAvanceNarratif(),
  }
}
