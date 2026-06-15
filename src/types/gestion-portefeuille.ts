/** Types API gestion portefeuille GP + recouvrement agent */

export interface PortefeuilleGpClient {
  id: string
  nom: string
  prenom: string
  telephone?: string
  email?: string
}

export interface PortefeuilleGpDossier {
  dossier_id: string
  reference: string
  statut: string
  montant_accorde?: number
  mensualite?: number
  client: PortefeuilleGpClient
  en_retard: boolean
  jours_retard?: number
  prochaine_echeance?: string | null
  montant_prochaine_echeance?: number | null
  est_mauvais_payeur: boolean
  a_agent_terrain?: boolean
  agent_terrain?: { id: string; nom: string; prenom: string } | null
}

export type PromesseStatut = 'ACTIVE' | 'TENUE' | 'NON_TENUE' | 'PARTIELLE' | 'ANNULEE'

export interface PromessePaiement {
  id: string
  montant_promis: number
  date_promesse: string
  statut: PromesseStatut
  notes?: string | null
  echeanceId?: string | null
  agent_suivi?: { id: string; nom: string; prenom: string } | null
}

export interface ActionRecouvrementLigne {
  id: string
  type: string
  date: string
  libelle?: string
  detail?: Record<string, unknown>
}

export interface AgentMissionClient {
  client_id: string
  client_nom: string
  dossiers: { id: string; reference: string; jours_retard: number; montant_retard?: number }[]
}

export interface AgentMissionsResponse {
  missions_clients: AgentMissionClient[]
  promesses_a_suivre: (PromessePaiement & { dossier_id: string; reference?: string; client_nom?: string })[]
  activite_recente: {
    id: string
    date: string
    objet_visite: string
    client_nom?: string
    dossier_reference?: string
    compte_rendu?: string
  }[]
}

export interface InstructionCcChecklist {
  cautionnaires_renseignes: boolean
  toutes_visites_caution_effectuees: boolean
  tous_dossiers_cautionnaires_recus: boolean
  pret_pour_avis_cc: boolean
  cautionnaires?: {
    id: string
    nom: string
    prenom?: string
    dossier_recu?: boolean
    notes_reception?: string | null
  }[]
}

export interface EcheancierResume {
  total_echeances?: number
  payees?: number
  en_retard?: number
  montant_retard_fcfa?: number
  par30?: boolean
  prochaine_echeance?: string
  mensualite?: number
}
