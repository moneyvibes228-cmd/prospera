/**
 * Axes de pilotage DG grossiste — entrepôts & canaux (pas zones IMF).
 */
import { ENTREPOTS_DISTRIBUTION, type StatutEntrepot } from './registries/entrepots-registry'
import { CANAUX_DISTRIBUTION, type StatutCanal } from './registries/canaux-registry'
import { RESEAU_CONSOLIDE_DIST } from './registries/zones-registry'

export type AxeGroupeDG = 'ENTREPOT' | 'CANAL'
export type StatutAxeDG = StatutEntrepot | StatutCanal

export interface PilotageAxeDG {
  id: string
  groupe: AxeGroupeDG
  nom: string
  nom_court: string
  initiales: string
  color: string
  responsable: string
  statut: StatutAxeDG
  /** Libellé métrique principale (quota CA / sorties) */
  quota_label: string
  quota_pct: number
  /** Deuxième indicateur clé */
  indicateur_2_label: string
  indicateur_2_valeur: string
  indicateur_2_alerte?: boolean
  /** Barre de progression (0-100) */
  barre_label: string
  barre_pct: number
  barre_seuil_ok: number
  resume: string
  score_operation: number
}

const COULEURS = {
  entrepot: '#0d9488',
  entrepot_regional: '#3b82f6',
  canal_vrp: '#6366f1',
  canal_freelance: '#84cc16',
  canal_prospection: '#a855f7',
} as const

function buildEntrepotAxes(): PilotageAxeDG[] {
  return ENTREPOTS_DISTRIBUTION.map(e => {
    const quotaPct = Math.round((e.ca_mois / e.ca_objectif) * 100)
    return {
      id: e.id,
      groupe: 'ENTREPOT',
      nom: e.nom,
      nom_court: e.nom,
      initiales: e.nom === 'Lomé Port' ? 'LP' : 'KR',
      color: e.type === 'PRINCIPAL' ? COULEURS.entrepot : COULEURS.entrepot_regional,
      responsable: e.responsable,
      statut: e.statut,
      quota_label: 'Sorties mois',
      quota_pct: quotaPct,
      indicateur_2_label: 'Ruptures SKU',
      indicateur_2_valeur: String(e.ruptures_stock),
      indicateur_2_alerte: e.ruptures_stock >= 2,
      barre_label: 'Taux service',
      barre_pct: e.taux_service_pct,
      barre_seuil_ok: 95,
      resume: `${e.livraisons_jour} expéditions/j · ${e.references_stock} références · ${Math.round(e.valeur_stock_fcfa / 1_000_000)}M stock`,
      score_operation: e.score_operation,
    }
  })
}

function buildCanalAxes(): PilotageAxeDG[] {
  const styles: Record<string, { initiales: string; color: string }> = {
    'can-vrp-salaries': { initiales: 'VRP', color: COULEURS.canal_vrp },
    'can-freelance': { initiales: 'FL', color: COULEURS.canal_freelance },
    'can-prospection': { initiales: 'PR', color: COULEURS.canal_prospection },
  }

  return CANAUX_DISTRIBUTION.map(c => {
    const quotaPct = Math.round((c.ca_mois / c.ca_objectif) * 100)
    const style = styles[c.id]
    const isFreelance = c.id === 'can-freelance'

    return {
      id: c.id,
      groupe: 'CANAL',
      nom: c.nom,
      nom_court: c.nom.replace('Réseau ', '').replace(' & nouveaux comptes', ''),
      initiales: style.initiales,
      color: style.color,
      responsable: c.referent,
      statut: c.statut,
      quota_label: 'CA canal',
      quota_pct: quotaPct,
      indicateur_2_label: isFreelance ? 'Marge' : 'Effectif',
      indicateur_2_valeur: isFreelance ? `${c.marge_pct}%` : String(c.effectif),
      indicateur_2_alerte: isFreelance ? (c.marge_pct ?? 0) < 14 : false,
      barre_label: isFreelance ? 'Couverture' : 'Couverture tournées',
      barre_pct: c.couverture_pct,
      barre_seuil_ok: 85,
      resume: `${c.commandes_jour} cmd/j · ${c.description.split('—')[0].trim()}`,
      score_operation: c.score_canal,
    }
  })
}

export function buildPilotageAxesDG(): PilotageAxeDG[] {
  return [...buildEntrepotAxes(), ...buildCanalAxes()]
}

export function getPilotageAxeById(id: string): PilotageAxeDG | undefined {
  return buildPilotageAxesDG().find(a => a.id === id)
}

export const PILOTAGE_AXES_DG = buildPilotageAxesDG()

export const PILOTAGE_CONSOLIDE_DG = {
  ventes_sorties: RESEAU_CONSOLIDE_DIST.ca_mois,
  commandes_jour: RESEAU_CONSOLIDE_DIST.commandes_jour,
  impayes: RESEAU_CONSOLIDE_DIST.creances_retard,
  ruptures_sku: RESEAU_CONSOLIDE_DIST.ruptures_stock,
  expeditions_jour: ENTREPOTS_DISTRIBUTION.reduce((s, e) => s + e.livraisons_jour, 0),
  axes_alerte: PILOTAGE_AXES_DG.filter(a => a.statut !== 'SAIN').length,
  axes_critiques: PILOTAGE_AXES_DG.filter(a => a.statut === 'CRITIQUE').length,
}
