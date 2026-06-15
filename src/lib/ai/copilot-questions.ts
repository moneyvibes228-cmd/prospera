import type { UserRole } from '@/types'

export interface CopilotQuestion {
  id: string
  label: string
}

/** Maximum 5 questions par profil — lecture seule */
const QUESTIONS_BY_PROFILE: Record<string, CopilotQuestion[]> = {
  executive: [
    { id: 'exec-priorites', label: 'Quelles sont mes 3 priorités du jour ?' },
    { id: 'exec-par', label: 'Évolution du PAR réseau ce mois ?' },
    { id: 'exec-agences', label: 'Quelle agence est en alerte ?' },
    { id: 'exec-liquidite', label: 'Situation liquidité & caisse ?' },
    { id: 'exec-actions', label: 'Actions IA recommandées cette semaine ?' },
  ],
  agence: [
    { id: 'ra-kpi', label: 'Où en est mon agence vs objectif ?' },
    { id: 'ra-equipe', label: 'Quel agent est en difficulté ?' },
    { id: 'ra-par', label: 'PAR agence et mauvais payeurs ?' },
    { id: 'ra-credit', label: 'Dossiers crédit à débloquer ?' },
    { id: 'ra-terrain', label: 'Couverture terrain aujourd\'hui ?' },
  ],
  portefeuille: [
    { id: 'gp-priorite', label: 'Quels clients visiter en priorité ?' },
    { id: 'gp-retard', label: 'Clients en retard critiques ?' },
    { id: 'gp-renouvellement', label: 'Qui est éligible au renouvellement ?' },
    { id: 'gp-collecte', label: 'Objectif collecte du jour ?' },
    { id: 'gp-risque', label: 'Résumé risque de mon portefeuille ?' },
  ],
  terrain: [
    { id: 'tr-tournee', label: 'Ordre de visite recommandé ?' },
    { id: 'tr-retards', label: 'Clients en retard sur ma zone ?' },
    { id: 'tr-objectif', label: 'Objectif collecte du jour ?' },
    { id: 'tr-prospects', label: 'Prospects chauds à relancer ?' },
    { id: 'tr-conseil', label: 'Conseil IA pour ma tournée ?' },
  ],
  commercial: [
    { id: 'co-pipeline', label: 'État du pipeline commercial ?' },
    { id: 'co-conversion', label: 'Taux de conversion ce mois ?' },
    { id: 'co-prospects', label: 'Prospects à traiter aujourd\'hui ?' },
    { id: 'co-zones', label: 'Zone à fort potentiel ?' },
    { id: 'co-objectif', label: 'Écart vs objectif signatures ?' },
  ],
  rcc: [
    { id: 'rcc-reseau', label: 'Synthèse réseau commercial & collecte ?' },
    { id: 'rcc-agences', label: 'Quelle agence sous-performe ?' },
    { id: 'rcc-secteurs', label: 'Secteurs d\'activité en tension ?' },
    { id: 'rcc-equipe', label: 'Performance équipe terrain ?' },
    { id: 'rcc-ia', label: 'Propositions IA prioritaires ?' },
  ],
  credit: [
    { id: 'cc-file', label: 'Dossiers en attente d\'analyse ?' },
    { id: 'cc-urgent', label: 'Dossiers urgents > 24 h ?' },
    { id: 'cc-cbi', label: 'Alertes CBI à traiter ?' },
    { id: 'cc-score', label: 'Derniers scores IA dossiers ?' },
    { id: 'cc-jour', label: 'Planning analyse du jour ?' },
  ],
  roc: [
    { id: 'roc-par', label: 'PAR réseau et tendance ?' },
    { id: 'roc-recouv', label: 'Priorités recouvrement ?' },
    { id: 'roc-bloques', label: 'Dossiers bloqués critiques ?' },
    { id: 'roc-agents', label: 'Agents recouvrement en souci ?' },
    { id: 'roc-decision', label: 'Décisions IA à valider ?' },
  ],
  finances: [
    { id: 'fin-tresorerie', label: 'Trésorerie et flux du jour ?' },
    { id: 'fin-ecarts', label: 'Écarts de caisse non résolus ?' },
    { id: 'fin-recouv', label: 'Recouvrement vs objectif ?' },
    { id: 'fin-alertes', label: 'Alertes financières actives ?' },
    { id: 'fin-cloture', label: 'Points clôture mensuelle ?' },
  ],
  daf: [
    { id: 'daf-compta', label: 'Suspens et clôture à traiter ?' },
    { id: 'daf-provisions', label: 'Provisions à constater ?' },
    { id: 'daf-cash', label: 'Besoins cash 7 prochains jours ?' },
    { id: 'daf-bceao', label: 'Ratios BCEAO non conformes ?' },
    { id: 'daf-risque', label: 'Risques financiers majeurs ?' },
  ],
  marketing: [
    { id: 'mkt-leads', label: 'Leads non assignés > 24 h ?' },
    { id: 'mkt-conversion', label: 'Taux conversion par canal ?' },
    { id: 'mkt-chatbot', label: 'Performance chatbot WhatsApp ?' },
    { id: 'mkt-campagnes', label: 'Campagnes IA recommandées ?' },
    { id: 'mkt-segments', label: 'Meilleur segment à cibler ?' },
  ],
}

const ROLE_PROFILE: Record<UserRole, keyof typeof QUESTIONS_BY_PROFILE> = {
  MANAGER: 'executive',
  GESTIONNAIRE: 'agence',
  GESTIONNAIRE_PORTEFEUILLE: 'portefeuille',
  AGENT_TERRAIN: 'terrain',
  COLLECTRICE: 'terrain',
  COMMERCIAL: 'commercial',
  RESPONSABLE_COMMERCIAL: 'rcc',
  CREDIT: 'credit',
  RESPONSABLE_CREDIT: 'roc',
  RISQUE: 'roc',
  RELANCE: 'finances',
  COMPTABLE: 'finances',
  PAIE: 'finances',
  DAF: 'daf',
  COMMUNICATION: 'marketing',
  AUDITEUR: 'executive', // non exposé dans l’UI
}

export const COPILOT_MAX_QUESTIONS = 5

export function getCopilotQuestions(role: UserRole): CopilotQuestion[] {
  const profile = ROLE_PROFILE[role] ?? 'executive'
  return QUESTIONS_BY_PROFILE[profile].slice(0, COPILOT_MAX_QUESTIONS)
}

export function isCopilotEnabledForRole(role: UserRole): boolean {
  return role !== 'AUDITEUR'
}
