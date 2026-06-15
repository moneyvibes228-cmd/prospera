import type { SyntheseAgenceIA } from '@/lib/synthese-agences-dg'

export interface RapportIA {
  date_generation: string
  periode: string
  destinataire: string
  synthese_executive: string
  synthese_piliers?: { titre: string; contenu: string }[]
  synthese_agences?: SyntheseAgenceIA[]
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
