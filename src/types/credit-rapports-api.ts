/** Réponses API rapports CBI — cf. FRONTEND_SPEC_RISQUE_CREDIT.md */

import type { ClasseBceao, EtapeScore } from '@/lib/mockMicrofinance'

export interface RapportCcApi {
  etape_courante: EtapeScore
  score_consolide: number
  score_cbi: number
  ajustement_claude: number
  classe_bceao: ClasseBceao
  probabilite_defaut_pct: number
  evolution_score: { etape: EtapeScore | string; score_consolide: number; date?: string }[]
  mapping_5c: {
    CHARACTER: number
    CAPACITY: number
    CAPITAL: number
    COLLATERAL: number
    CONDITIONS: number
  }
  detail_dimensions?: Record<
    string,
    {
      score: number
      max: number
      pct: number
      active: boolean
      justification: string
      sous_dimensions: { key: string; score: number; max: number; valeur?: string; justification: string }[]
    }
  >
  alertes_actives: { code: string; severite: 'INFO' | 'WARN' | 'CRITICAL'; message: string; donnees?: unknown }[]
  analyse_claude: {
    commentaire: string
    questions_a_poser: string[]
    points_a_verifier: string[]
    decision_suggeree?: string
  }
  rappels_etape?: string[]
  /** `CLAUDE_API` conservé pour compatibilité backend — mappé vers Prospera IA côté front */
  mode_analyse?: 'PROSPERA_IA_API' | 'CLAUDE_API' | 'FALLBACK_LOCAL'
  dossier_id?: string
  reference_dossier?: string
  client?: {
    id?: string
    nom: string
    prenom: string
    telephone?: string
    secteur?: string
    activite?: string
    age?: number
    localite?: string
  }
  montant_demande?: number
  duree_mois?: number
  objet_credit?: string
  date_creation?: string
  statut_dossier?: string
}

export interface RapportRocApi {
  reference_dossier: string
  client: { nom: string; prenom: string; telephone?: string; secteur?: string }
  montant_demande: number
  duree_mois: number
  objet_credit: string
  synthese_executive: string
  score_final: number
  score_cbi: number
  ajustement_claude: number
  classe_bceao: string
  probabilite_defaut_pct: number
  expected_loss?: {
    ead: number
    pd_pct: number
    lgd_pct: number
    perte_attendue_fcfa: number
    provision_reglementaire_fcfa: number
    taux_provision_pct: number
  }
  evolution_score?: { etape: string; score_consolide: number; score_cbi?: number; ajustement_claude?: number }[]
  mapping_5c?: RapportCcApi['mapping_5c']
  avis_charge_credit?: { avis: string; montant_suggere?: number; notes_brutes?: string; sentiment_claude?: string }
  benchmark?: {
    nbDossiers: number
    tauxCloturePct: number
    tauxIncidentPct: number
    score: number
    verdict: string
    echantillonFaible: boolean
  }
  alertes?: RapportCcApi['alertes_actives']
  analyse_risque?: {
    forces: string[]
    faiblesses: string[]
    risques_specifiques: string[]
    recommandations_avant_decision: string[]
  }
  suggestion?: {
    decision: string
    montant_recommande: number
    duree_recommandee: number
    taux_recommande: number
    conditions_a_imposer?: string[]
    justification: string
  }
}

export interface DossierScoreApi {
  score_actuel: {
    score_consolide: number
    score_cbi: number
    ajustement_claude: number
    classe_bceao: string
    probabilite_defaut_pct: number
    etape: string
  }
  historique: { etape: string; score_consolide: number; date?: string }[]
  alertes_actives?: RapportCcApi['alertes_actives']
}
