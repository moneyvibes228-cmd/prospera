// Rôles utilisateurs (alignés sur organigramme CECA + backend CBI v5)
export type UserRole =
  | 'MANAGER'                  // Directeur Général (DG)
  | 'GESTIONNAIRE'             // Responsable d'Agence (RA) — pilote l'agence
  | 'GESTIONNAIRE_PORTEFEUILLE'// Gestionnaire de Portefeuille (GP) — gère ses clients après décaissement
  | 'AGENT_TERRAIN'            // Agent terrain / champ (prospection + collecte)
  | 'COMMERCIAL'               // Commercial agence (enregistrement client + dossiers)
  | 'COLLECTRICE'              // Tontinière / Agent collecte
  | 'RESPONSABLE_COMMERCIAL'  // Responsable Commerciale & Collecte — pilote équipe + collecte + pipeline
  | 'CREDIT'                   // Chargé de Crédit (CC) — analyste dossier au siège
  | 'RESPONSABLE_CREDIT'       // Responsable Opération & Crédit (ROC) — pilote portefeuille N-1 DG
  | 'RISQUE'                   // Analyse risque transverse
  | 'RELANCE'                  // Recouvrement (fusionné avec COMPTABLE)
  | 'COMPTABLE'                // Comptabilité (fusionné avec RELANCE)
  | 'AUDITEUR'                 // Auditeur Interne — fraude, conformité, contrôle opérationnel
  | 'DAF'                      // Directeur Administratif & Financier (inclut Contrôle de Gestion)
  | 'PAIE'                     // Gestion paie RH
  | 'COMMUNICATION'            // Responsable Communication & Marketing

export interface User {
  id: string
  nom: string
  email: string
  role: UserRole
  zone: string
  actif: boolean
  createdAt: string
}

// Statuts emprunteur
export type BorrowerStatus =
  | 'REMBOURSEMENT'
  | 'RETARD'
  | 'DEFAUT'
  | 'RESTRUCTURE'
  | 'EVALUATION'
  | 'INSTRUCTION'

// Score IA : 0-39 = critique (rouge), 40-69 = surveiller (orange), 70-100 = sain (vert)
export interface Borrower {
  id: string
  nom: string
  telephone: string
  score_ia: number
  score_tendance: 'HAUSSE' | 'BAISSE' | 'STABLE'
  montant_credit: number
  montant_rembourse: number
  statut: BorrowerStatus
  retard_jours: number
  agent: User
  lat: number
  lng: number
  zone: string
  derniere_visite: string | null
  createdAt: string
  historique_paiements?: Payment[]
  visites?: Visit[]
  alertes_ia?: AIAlert[]
}

export interface Payment {
  id: string
  borrowerId: string
  montant: number
  type: 'REMBOURSEMENT' | 'PARTIEL' | 'DEFAUT' | 'REGULARISATION'
  canal: 'MOBILE_MONEY' | 'ESPECES' | 'VIREMENT'
  date: string
  agent: string
}

export type ContactMethod =
  | 'VISITE_TERRAIN'
  | 'PORTE_A_PORTE'
  | 'APPEL'
  | 'BROCHURE'
  | 'LETTRE'

export type VisitStatus = 'POSITIVE' | 'NEGATIVE' | 'SANS_REPONSE'

export interface Visit {
  id: string
  borrowerId: string
  borrowerNom: string
  agentId: string
  agentNom: string
  lat: number
  lng: number
  adresse: string
  methode: ContactMethod
  statut: VisitStatus
  commentaire: string
  commentaire_additionnel?: string
  photo_url?: string
  date: string
  distance_metres?: number
}

export interface KpiSnapshot {
  id: string
  semaine: number
  par_30j: number
  par_60j: number
  par_90j: number
  taux_remboursement: number
  total_emprunteurs: number
  clients_actifs: number
  encours_fcfa: number
  montant_collecte_fcfa: number
  alertes_critiques: number
  alertes_surveillance: number
  createdAt: string
}

export interface DashboardKpis {
  par_30j: number
  par_30j_variation: number
  par_60j: number
  par_90j: number
  taux_remboursement: number
  total_emprunteurs: number
  clients_actifs: number
  encours_fcfa: number
  montant_collecte_mois: number
  alertes_critiques: number
  alertes_surveillance: number
  visites_planifiees: number
  visites_effectuees_jour: number
  historique_par: KpiSnapshot[]
}

export type AlertSeverity = 'CRITIQUE' | 'SURVEILLANCE' | 'INFO'
export type AlertType =
  | 'RETARD_J7'
  | 'SCORE_BAISSE'
  | 'INACTIVITE_WHATSAPP'
  | 'DEFAUT_PREVU'
  | 'ECHEANCE_3J'

export interface AIAlert {
  id: string
  borrowerId: string
  borrowerNom: string
  severity: AlertSeverity
  type: AlertType
  message: string
  action_recommandee: string
  retard_jours: number
  score_ia: number
  agentNom: string
  createdAt: string
}

export type LoanStage =
  | 'PROSPECTION'
  | 'DEMANDE'
  | 'EVALUATION'
  | 'APPROBATION'
  | 'DECAISSEMENT'
  | 'REMBOURSEMENT'
  | 'CLOTURE'

export interface Loan {
  id: string
  borrowerId: string
  borrowerNom: string
  montant: number
  montant_approuve?: number
  duree_mois: number
  taux_interet: number
  stage: LoanStage
  score_ia: number
  recommandation_ia?: string
  agent: string
  createdAt: string
  date_decaissement?: string
  date_fin_prevue?: string
}

export type ReminderStrategy =
  | 'RAPPEL_DOUX'
  | 'RELANCE_FERME'
  | 'ALERTE_AGENT'
  | 'ESCALADE_MANAGER'
  | 'VISITE_PLANIFIEE'

export interface Reminder {
  id: string
  borrowerId: string
  borrowerNom: string
  strategie: ReminderStrategy
  canal: 'WHATSAPP' | 'SMS' | 'APPEL' | 'VISITE'
  statut: 'EN_ATTENTE' | 'ENVOYE' | 'LU' | 'REPONDU' | 'ECHEC'
  montant_du: number
  retard_jours: number
  score_ia: number
  message_ia: string
  lien_paiement?: string
  date_envoi: string
  date_reponse?: string
}

export interface AgentPerformance {
  agentId: string
  agentNom: string
  zone: string
  visites_mois: number
  visites_objectif: number
  montant_collecte: number
  montant_objectif: number
  taux_recouvrement: number
  nouveaux_prospects: number
  taux_conversion: number
  score_performance: number
  classement: number
  badge?: 'OR' | 'ARGENT' | 'BRONZE'
}

export interface AuditLog {
  id: string
  agentId: string
  agentNom: string
  action: string
  entite: string
  entite_id: string
  details: Record<string, unknown>
  lat?: number
  lng?: number
  valide_gps: boolean
  anomalie_detectee: boolean
  createdAt: string
}

export interface BorrowerFilters {
  statut?: string
  zone?: string
  agentId?: string
  scoreMin?: number
  scoreMax?: number
  page?: number
}

export interface VisitParams {
  agentId?: string
  statut?: string
  periode?: string
}
