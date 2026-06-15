/** Hub Équipe & Performance réseau */

import { getEquipeRegistry } from '@/lib/equipe-registry'

export type StatutAgent = 'BON' | 'NORMAL' | 'DEGRADE'
export type RoleAgent = 'Resp. agence' | 'GP' | 'Commercial' | 'Collectrice' | 'Agent terrain'

export interface AgentPerformance {
  id: string
  nom: string
  role: RoleAgent
  agence_id: string
  agence: string
  actif: boolean
  rang: number
  score: number
  badge: string | null
  statut: StatutAgent
  clients_portefeuille: number
  clients_a_risque: number
  portefeuille_fcfa: number
  visites_mois: number
  visites_objectif: number
  visites_jour: number
  collecte_mois_fcfa: number
  collecte_jour_fcfa: number
  objectif_collecte_mois_fcfa: number
  objectif_atteint_pct: number
  recouvrement_pct: number
  objectif_recouvrement_pct: number
  par_30_pct: number
  retards_j7: number
  nouveaux_clients_mois: number
  objectif_nouveaux_clients: number
  decaissements_mois: number
  gps_conformite_pct: number
  derniere_visite: string
  lien_fiche: string
  ia_resume: string
  /** Responsable d'agence — portefeuille consolidé, visites = équipe terrain */
  est_responsable_agence?: boolean
  nb_agents_terrain?: number
}

export interface EquipeHub {
  synthese_ia: string
  kpis: {
    total_agents: number
    agents_actifs: number
    agents_degrades: number
    performance_moyenne_pct: number
    collecte_mois_fcfa: number
    objectif_collecte_mois_fcfa: number
    objectif_atteint_pct: number
    recouvrement_moyen_pct: number
    visites_mois_total: number
    clients_portefeuille_total: number
  }
  agents: AgentPerformance[]
  repartition_agences: Array<{
    agence_id: string
    agence: string
    nb_agents: number
    performance_moyenne: number
    collecte_mois_fcfa: number
  }>
  glossaire: Array<{ terme: string; definition: string }>
}

export function getEquipeHub(): EquipeHub {
  return getEquipeRegistry()
}
