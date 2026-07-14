/**
 * Zones commerciales — source brute pour pilotage DG (agrégats réseau)
 * et socle de l'organigramme terrain.
 *
 * Hiérarchie : DC → Responsable des Ventes (1 région = n zones)
 *                 → Superviseur (1 zone = n commerciaux) → Commerciaux.
 * Un superviseur encadre UNE zone ; un responsable des ventes porte le quota
 * d'une région et n'a pas de portefeuille en propre.
 */

export type StatutZone = 'SAIN' | 'ATTENTION' | 'CRITIQUE'

export interface RegionDistribution {
  id: string
  nom: string
  /** Responsable des Ventes qui porte le quota de la région. */
  resp_ventes: string
}

export const REGIONS_DISTRIBUTION: RegionDistribution[] = [
  { id: 'reg-grand-lome', nom: 'Grand Lomé', resp_ventes: 'Kodjo Agbeko' },
  { id: 'reg-nord', nom: 'Nord', resp_ventes: 'Yao Adanlété' },
]

export interface ZoneDistribution {
  id: string
  nom: string
  /** Clé canonique de la zone — valeur portée par `zone` sur les PDV, commandes, commerciaux. */
  cle: string
  nom_court: string
  color: string
  initiales: string
  /** Région de rattachement (→ Responsable des Ventes). */
  region_id: string
  /** Superviseur de la zone — un seul, c'est la définition du poste. */
  superviseur: string
  commerciaux: number
  freelances: number
  pdv_actifs: number
  ca_mois: number
  ca_objectif: number
  creances_retard: number
  creances_pct: number
  couverture_visites_pct: number
  commandes_jour: number
  score_sante: number
  statut: StatutZone
  ruptures_stock: number
  pdv_a_risque: number
  pdv_non_visites_15j: number
}

export const ZONES_DISTRIBUTION: ZoneDistribution[] = [
  {
    id: 'zn-lome-nord', nom: 'Lomé Nord', cle: 'Lomé Nord', nom_court: 'Lomé N.', color: '#14b8a6', initiales: 'LN',
    region_id: 'reg-grand-lome', superviseur: 'Efua Koffi',
    commerciaux: 12, freelances: 0, pdv_actifs: 520, ca_mois: 148_000_000, ca_objectif: 155_000_000,
    creances_retard: 8_200_000, creances_pct: 14, couverture_visites_pct: 94, commandes_jour: 42,
    score_sante: 84, statut: 'SAIN', ruptures_stock: 2, pdv_a_risque: 18, pdv_non_visites_15j: 8,
  },
  {
    id: 'zn-lome-sud', nom: 'Lomé Sud', cle: 'Lomé Sud', nom_court: 'Lomé S.', color: '#84cc16', initiales: 'LS',
    region_id: 'reg-grand-lome', superviseur: 'Akouvi Bediako',
    commerciaux: 6, freelances: 12, pdv_actifs: 380, ca_mois: 92_000_000, ca_objectif: 88_000_000,
    creances_retard: 4_100_000, creances_pct: 11, couverture_visites_pct: 88, commandes_jour: 31,
    score_sante: 79, statut: 'SAIN', ruptures_stock: 1, pdv_a_risque: 9, pdv_non_visites_15j: 14,
  },
  {
    id: 'zn-lome-centre', nom: 'Lomé Centre', cle: 'Lomé Centre', nom_court: 'Lomé C.', color: '#f97316', initiales: 'LC',
    region_id: 'reg-grand-lome', superviseur: 'Selom Amevor',
    commerciaux: 8, freelances: 0, pdv_actifs: 290, ca_mois: 58_000_000, ca_objectif: 72_000_000,
    creances_retard: 18_400_000, creances_pct: 38, couverture_visites_pct: 71, commandes_jour: 18,
    score_sante: 52, statut: 'CRITIQUE', ruptures_stock: 4, pdv_a_risque: 34, pdv_non_visites_15j: 22,
  },
  {
    id: 'zn-lome-est', nom: 'Lomé Est', cle: 'Lomé Est', nom_court: 'Lomé E.', color: '#a855f7', initiales: 'LE',
    region_id: 'reg-grand-lome', superviseur: 'Rachidou Bawa',
    commerciaux: 5, freelances: 0, pdv_actifs: 210, ca_mois: 34_000_000, ca_objectif: 48_000_000,
    creances_retard: 2_800_000, creances_pct: 16, couverture_visites_pct: 62, commandes_jour: 11,
    score_sante: 61, statut: 'ATTENTION', ruptures_stock: 2, pdv_a_risque: 15, pdv_non_visites_15j: 12,
  },
  {
    id: 'zn-kara', nom: 'Kara', cle: 'Kara', nom_court: 'Kara', color: '#3b82f6', initiales: 'KR',
    region_id: 'reg-nord', superviseur: 'Abra Tchalla',
    commerciaux: 7, freelances: 0, pdv_actifs: 280, ca_mois: 62_000_000, ca_objectif: 58_000_000,
    creances_retard: 1_200_000, creances_pct: 6, couverture_visites_pct: 96, commandes_jour: 19,
    score_sante: 91, statut: 'SAIN', ruptures_stock: 1, pdv_a_risque: 4, pdv_non_visites_15j: 3,
  },
  {
    id: 'zn-centrale', nom: 'Centrale (Sokodé)', cle: 'Centrale', nom_court: 'Centrale', color: '#6366f1', initiales: 'CT',
    region_id: 'reg-nord', superviseur: 'Bassirou Kanté',
    commerciaux: 4, freelances: 0, pdv_actifs: 167, ca_mois: 18_000_000, ca_objectif: 22_000_000,
    creances_retard: 3_100_000, creances_pct: 19, couverture_visites_pct: 85, commandes_jour: 6,
    score_sante: 72, statut: 'ATTENTION', ruptures_stock: 4, pdv_a_risque: 8, pdv_non_visites_15j: 6,
  },
]

export const RESEAU_CONSOLIDE_DIST = {
  total_zones: ZONES_DISTRIBUTION.length,
  total_pdv: ZONES_DISTRIBUTION.reduce((s, z) => s + z.pdv_actifs, 0),
  total_commerciaux: 38,
  total_freelances: 12,
  ca_mois: ZONES_DISTRIBUTION.reduce((s, z) => s + z.ca_mois, 0),
  ca_objectif: 450_000_000,
  creances_retard: 42_800_000,
  creances_total: 186_400_000,
  commandes_jour: 127,
  ruptures_stock: 14,
  score_sante_reseau: 74,
  zones_critiques: ZONES_DISTRIBUTION.filter(z => z.statut === 'CRITIQUE').length,
  zones_attention: ZONES_DISTRIBUTION.filter(z => z.statut === 'ATTENTION').length,
}

export function getZoneById(id: string): ZoneDistribution | undefined {
  return ZONES_DISTRIBUTION.find(z => z.id === id)
}

export function getRegionById(id: string): RegionDistribution | undefined {
  return REGIONS_DISTRIBUTION.find(r => r.id === id)
}

/** Zones encadrées par un superviseur — une seule, par définition du poste. */
export function getZonesDuSuperviseur(nom: string): ZoneDistribution[] {
  return ZONES_DISTRIBUTION.filter(z => z.superviseur === nom)
}

/** Zones de la région portée par un Responsable des Ventes. */
export function getZonesDuRespVentes(nom: string): ZoneDistribution[] {
  const regions = REGIONS_DISTRIBUTION.filter(r => r.resp_ventes === nom).map(r => r.id)
  return ZONES_DISTRIBUTION.filter(z => regions.includes(z.region_id))
}

/** Superviseurs rattachés à un Responsable des Ventes — sa ligne managériale directe. */
export function getSuperviseursDuRespVentes(nom: string): { superviseur: string; zone: ZoneDistribution }[] {
  return getZonesDuRespVentes(nom).map(z => ({ superviseur: z.superviseur, zone: z }))
}
