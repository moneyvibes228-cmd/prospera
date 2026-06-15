/** Types API Phases A–D — cf. API_PHASES_A_D.md */

export type DashboardRoleKey =
  | 'terrain'
  | 'charge-credit'
  | 'roc'
  | 'responsable-agence'
  | 'responsable-commercial'
  | 'gestionnaire-portefeuille'

export interface DashboardTerrainApi {
  resume_journee?: {
    visites_prevues?: number
    montant_collecte_jour?: number
    objectif_jour?: number
    taux_atteinte_pct?: number
    tontines_actives?: number
    clients_en_retard?: number
    promesses_actives?: number
    clientes_a_visiter?: number
    montant_a_collecter?: number
    tontines_prevues?: number
  }
  planning_jour?: Array<{
    heure: string
    cliente?: string
    client?: string
    type: string
    lat?: number
    lng?: number
    statut?: string
  }>
  performance?: {
    objectif_collecte_semaine?: number
    realise_collecte_semaine?: number
    taux_atteinte_collecte_semaine_pct?: number
    objectif_visites_semaine?: number
    visites_semaine?: number
    taux_visites_semaine_pct?: number
    objectif_prospects_semaine?: number
    prospects_semaine?: number
    semaine_iso?: number
    objectif_jour?: number
    realise_jour?: number
    objectif_collecte_mois?: number
    realise_collecte_mois?: number
  }
  promesses_a_suivre?: unknown[]
  recouvrement?: unknown
  tontines?: unknown[]
  synthese_ia_journee?: Record<string, unknown>
  kpis?: Record<string, number | string>
  [key: string]: unknown
}

export interface TransactionStatsMomo {
  operateur: string
  libelle: string
  en_attente: number
  valides_jour: number
  rejetes_jour: number
  montant_valide_jour_fcfa: number
  transactions_recentes?: unknown[]
}

export interface TransactionStatsCaisse {
  type: string
  libelle: string
  depots_jour: number
  retraits_jour: number
  montant_depots_jour_fcfa: number
  montant_retraits_jour_fcfa: number
  solde_net_jour_fcfa: number
  transactions_recentes?: unknown[]
}

export interface CreditPipelineApi {
  compteurs?: Record<string, number>
  par_statut?: Record<string, PipelineDossierItem[]>
  dossiers?: PipelineDossierItem[]
  total?: number
}

export interface PipelineDossierItem {
  id: string
  reference?: string
  reference_dossier?: string
  statut?: string
  montant_demande?: number
  montant_accorde?: number
  score?: number
  score_consolide?: number
  client?: { nom?: string; prenom?: string; activite?: string }
  agence?: { nom?: string }
  agent?: { nom?: string; prenom?: string }
  resume?: string
  priorite?: string
  jours_attente?: number
}

export interface CollecteAgregatsApi {
  jour?: { montant_fcfa?: number; objectif_fcfa?: number; taux_pct?: number }
  mois?: { montant_fcfa?: number; objectif_fcfa?: number; taux_pct?: number }
  par_secteur?: Array<{ secteur: string; montant_fcfa: number; pct?: number }>
  par_agent?: Array<{ agent_id: string; nom: string; montant_fcfa: number }>
  synthese_ia?: string
  kpis?: Record<string, number | string>
  [key: string]: unknown
}

export interface KpiAgentApi {
  agent_id: string
  nom: string
  prenom?: string
  collecte_semaine_fcfa?: number
  objectif_collecte_semaine_fcfa?: number
  taux_objectif_collecte_semaine_pct?: number
  visites_semaine?: number
  objectif_visites_semaine?: number
  taux_visites_semaine_pct?: number
  prospects_semaine?: number
  objectif_prospects_semaine?: number
  collecte_mois_fcfa?: number
  objectif_collecte_fcfa?: number
  taux_objectif_collecte_pct?: number
  semaine_iso?: number
}

export interface OperationsHubApi {
  synthese_ia?: string
  kpis?: Record<string, number | string>
  [key: string]: unknown
}
