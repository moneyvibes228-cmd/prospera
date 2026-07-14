export type GroupeSecteurIA = 'ENTREPOT' | 'CANAL' | 'FAMILLE'

export type RisqueNiveauIA = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE'

export interface PrevisionSecteurIA {
  metrique: string
  valeur_actuelle: string
  valeur_prevue: string
  horizon: '7j' | '30j' | '60j'
  confidence: number
  tendance?: 'HAUSSE' | 'BAISSE' | 'STABLE'
}

export interface ScenarioSecteurIA {
  label: 'Optimiste' | 'Central' | 'Pessimiste'
  impact: string
  probabilite: number
}

export interface SyntheseSecteurIA {
  secteur_id: string
  nom: string
  groupe: GroupeSecteurIA
  tendance: 'POSITIF' | 'STABLE' | 'ALERTE'
  risque_niveau?: RisqueNiveauIA
  resume: string
  analyse_ia?: string
  chiffres: { label: string; valeur: string }[]
  previsions?: PrevisionSecteurIA[]
  scenarios?: ScenarioSecteurIA[]
  facteurs_cles?: string[]
  action_prioritaire?: string
  equipe?: { nom: string; role: 'RESPONSABLE' | 'COMMERCIAL' | 'FREELANCE' | 'PROSPECTION'; score: number; note?: string }[]
  evolution_6m?: string
}

/** @deprecated Utiliser SyntheseSecteurIA */
export type SyntheseZoneIA = SyntheseSecteurIA

export interface RapportIA {
  date_generation: string
  periode: string
  destinataire: string
  synthese_executive: string
  synthese_piliers?: { titre: string; contenu: string }[]
  synthese_operations?: SyntheseSecteurIA[]
  /** @deprecated Remplacé par synthese_operations */
  synthese_zones?: SyntheseSecteurIA[]
  chiffres_cles: { label: string; valeur: string; tendance?: 'HAUSSE' | 'BAISSE' | 'STABLE'; commentaire?: string }[]
  points_forts: string[]
  points_attention: { titre: string; detail: string; severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE' }[]
  recommandations: { priorite: 1 | 2 | 3; action: string; impact_estime: string; delai: string }[]
  previsions_30j: { metrique: string; valeur_actuelle: string; valeur_prevue: string; confidence: number }[]
  alertes_immediates: string[]
  comparaison_mois_precedent: {
    metrique: string
    mois_precedent: string
    mois_courant: string
    variation_pct: number
    variation_unite?: 'pct' | 'pt'
  }[]
  signature_ia: string
}
