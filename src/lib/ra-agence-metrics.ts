/**
 * Métriques RA dérivées de AGENCES / AGENCES_DATA (pas des variations réseau brutes).
 */
import { AGENCES, AGENCES_DATA } from './agences'
import { getMoisCourant, getMoisPrecedent } from './mock-time-series'

function fmtM(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2).replace('.', ',')}M` : `${Math.round(n / 1000)}k`
}

/** Liquidité opérationnelle + caisse physique (aligné module Caisse) */
export function getTresorerieAgence(agenceId: string) {
  const detail = AGENCES_DATA[agenceId]
  const ag = AGENCES.find(a => a.id === agenceId)!
  const liquidite = detail?.kpis.liquidite_disponible ?? Math.round(ag.encours_fcfa * 0.028)
  const caisse_physique = Math.round((liquidite * 0.45) / 10_000) * 10_000
  const reserve = detail?.kpis.reserv_obligatoire ?? 500_000
  return {
    liquidite_disponible: liquidite,
    caisse_physique_fcfa: caisse_physique,
    reserve_obligatoire: reserve,
    ratio_couverture_pct: reserve > 0 ? Math.round((liquidite / reserve) * 100) : 100,
  }
}

/** Comparaisons M-1 au prorata agence (encours, PAR historique, collecte liée au remboursement) */
export function getAgenceComparaisonMoM(agenceId: string) {
  const ag = AGENCES.find(a => a.id === agenceId)!
  const detail = AGENCES_DATA[agenceId]
  const m = getMoisCourant()
  const prev = getMoisPrecedent()
  const ratio = ag.encours_fcfa / m.encours_fcfa

  const encoursPrev = Math.round(prev.encours_fcfa * ratio)
  const encoursVarPct =
    encoursPrev > 0
      ? Number((((ag.encours_fcfa - encoursPrev) / encoursPrev) * 100).toFixed(1))
      : 0

  const parHist = detail?.par_historique ?? []
  const parPrec = parHist.length >= 2 ? parHist[parHist.length - 2].par_30j : ag.par_courant
  const parVarPts = Number((ag.par_courant - parPrec).toFixed(1))

  const rembPrec = parHist.length >= 2 ? parHist[parHist.length - 2].remboursement : ag.taux_remboursement - 1.5
  const collectePrev = Math.round(ag.collecte_mois * (rembPrec / ag.taux_remboursement))
  const collecteVarPct =
    collectePrev > 0
      ? Number((((ag.collecte_mois - collectePrev) / collectePrev) * 100).toFixed(1))
      : 0

  return {
    encours: {
      metrique: 'Encours agence',
      mois_precedent: fmtM(encoursPrev),
      mois_courant: fmtM(ag.encours_fcfa),
      variation_pct: encoursVarPct,
      variation_unite: 'pct' as const,
    },
    par: {
      metrique: 'PAR 30 agence',
      mois_precedent: `${parPrec.toFixed(1).replace('.', ',')}%`,
      mois_courant: `${ag.par_courant}%`,
      variation_pct: parVarPts,
      variation_unite: 'pt' as const,
    },
    collecte: {
      metrique: 'Collecte mensuelle',
      mois_precedent: fmtM(collectePrev),
      mois_courant: fmtM(ag.collecte_mois),
      variation_pct: collecteVarPct,
      variation_unite: 'pct' as const,
    },
  }
}

export function buildComparaisonMoMRapport(agenceId: string) {
  const c = getAgenceComparaisonMoM(agenceId)
  return [c.encours, c.par, c.collecte]
}
