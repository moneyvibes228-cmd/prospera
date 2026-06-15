/** Types API Phase 2 — processus crédit (cf. API_PHASE2_CREDIT.md) */

export type DossierStatutBd =
  | 'SOUMIS'
  | 'RDV_PROGRAMME'
  | 'EN_ATTENTE_DOCUMENTS'
  | 'DOSSIER_COMPLET'
  | 'VISITES_PLANIFIEES'
  | 'EN_ANALYSE'
  | 'VALIDE_CHARGE'
  | 'REFUSE_CHARGE'
  | 'EN_ANALYSE_ROC'
  | 'EN_COMITE_CREDIT'
  | 'REFUSE'
  | 'EN_GESTION'
  | 'CLOTURE'
  | 'ANNULE'

export type WorkflowAction =
  | 'CREER_DEMANDE'
  | 'PROGRAMMER_RDV'
  | 'SIGNALER_DOCUMENTS'
  | 'COMPLETER_DOSSIER_CAUTIONS'
  | 'PLANIFIER_VISITES'
  | 'CREER_VISITE'
  | 'COMPLETER_VISITE'
  | 'UPLOADER_PIECE'
  | 'DONNER_AVIS_CC'
  | 'DECISION_ROC'
  | 'VALIDER_COMITE'
  | 'VOIR_RAPPORT_CC'
  | 'VOIR_RAPPORT_ROC'
  | 'VOIR_SCORE_DOSSIER'
  | 'PAYER_ECHEANCE'
  | 'ENVOYER_RELANCE_EMAIL'
  | 'CREER_PROMESSE_PAIEMENT'
  | 'ANNULER_DOSSIER'

export type TimelineStatut = 'TERMINE' | 'EN_COURS' | 'A_VENIR' | 'REFUSE'

export interface WorkflowTimelineStep {
  etape: string
  label: string
  statut: TimelineStatut
  statuts_bd: string[]
}

export interface WorkflowJalon {
  cle: string
  date: string | null
  label: string
}

export interface SectionsVisibles {
  fiche_client: boolean
  cautionnaires: boolean
  visites_dossier: boolean
  rapport_cc: boolean
  rapport_roc: boolean
  comite: boolean
  echeancier: boolean
  scoring_ia: boolean
  instruction_cc?: boolean
  recouvrement?: boolean
  pieces?: boolean
  historique_statuts?: boolean
}

export interface DossierWorkflowResponse {
  statut_bd: DossierStatutBd | string
  etape_metier: string
  etape_label: string
  timeline: WorkflowTimelineStep[]
  jalons: WorkflowJalon[]
  actions_disponibles: WorkflowAction[]
  sections_visibles: SectionsVisibles
  role_connecte: string
}

export interface DossierCreditClient {
  id: string
  nom: string
  prenom: string
  telephone?: string
  email?: string
  activite?: string
  secteur?: string
  statut?: string
}

export interface DossierCreditListItem {
  id: string
  reference: string
  statut: DossierStatutBd | string
  montant_demande: number | string
  montant_accorde?: number | string | null
  mensualite?: number | string | null
  duree_mois?: number
  duree_accordee?: number | null
  date_soumission?: string
  date_decaissement?: string | null
  client: DossierCreditClient
  agent?: { id: string; nom: string; prenom: string } | null
  agence?: { id: string; nom: string } | null
  gestionnairePf?: { id: string; nom: string; prenom: string } | null
}

export interface DossierCreditDetail extends DossierCreditListItem {
  objet_credit?: string
  taux_interet?: number | string | null
  chargeCreditId?: string | null
  notes?: string | null
}

export interface CreateDossierCreditPayload {
  clientId: string
  montant_demande: number
  duree_mois: number
  objet_credit: string
  date_souhaitee?: string
}

export interface ConditionsFinales {
  reference: string
  montant_accorde: number
  duree_mois: number
  taux_interet_mensuel_pct: number
  mensualite: number
  date_decaissement: string
  gestionnaire_pf_id?: string
}

export interface ComiteCreditResponse {
  dossier: DossierCreditDetail
  conditions_finales?: ConditionsFinales
  etapes_auto?: { comite_valide: boolean; decaissement: boolean; echeancier_genere: boolean }
  diffusion?: Record<string, unknown>
  message_frontend?: string
}

export interface AvisChargePayload {
  avis_favorable: boolean
  montant_suggere?: number
  notes_charge_credit?: string
}

export interface DecisionRocPayload {
  approuve: boolean
  montant_accorde?: number
  duree_accordee?: number
  taux_interet?: number
  gestionnairePfId?: string
  motif_refus?: string
  notes_roc?: string
}

export interface ComiteCreditPayload {
  favorable: boolean
  notes_comite?: string
}

export interface EcheanceLigne {
  id: string
  numero: number
  date_echeance: string
  montant: number | string
  statut: 'A_VENIR' | 'PAYE' | 'RETARD' | string
  montant_paye?: number | string
}

export interface VuePortefeuilleResponse {
  dossier: DossierCreditDetail
  workflow: DossierWorkflowResponse
  fiche_client: Record<string, unknown>
  echeancier?: { lignes: EcheanceLigne[]; resume?: Record<string, unknown> }
}
