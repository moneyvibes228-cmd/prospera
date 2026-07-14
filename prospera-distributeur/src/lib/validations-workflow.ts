/**
 * Workflow arbitrage — traite la « dette de travail » des files de validation.
 *
 * Répond à l'audit (§1 pb transversal n°2 & §3.3/3.4) : les boutons
 * `Valider` / `Refuser` de `ValidationsPanel` étaient purement décoratifs.
 * On persiste chaque décision (avec auteur, horodatage, motif) pour que la
 * pastille du menu reflète le travail réellement traité.
 */
import { nowIso, loadJSON, saveJSON } from './persistence'

export const STORAGE_VALIDATIONS = 'prospera-validations-decisions'

export type DecisionValidation = 'VALIDEE' | 'REFUSEE'

export interface ValidationDecisionEntry {
  demandeId: string
  decision: DecisionValidation
  decidedAt: string
  decidedBy: string
  niveau: string
  motif?: string
}

export function loadValidationDecisions(): Record<string, ValidationDecisionEntry> {
  return loadJSON<Record<string, ValidationDecisionEntry>>(STORAGE_VALIDATIONS, {})
}

export function saveValidationDecisions(d: Record<string, ValidationDecisionEntry>): void {
  saveJSON(STORAGE_VALIDATIONS, d)
}

export function buildDecision(
  demandeId: string,
  decision: DecisionValidation,
  decidedBy: string,
  niveau: string,
  motif?: string,
): ValidationDecisionEntry {
  return { demandeId, decision, decidedAt: nowIso(), decidedBy, niveau, motif }
}
