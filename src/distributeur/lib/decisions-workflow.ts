/**
 * Journal des décisions persisté — audit « qui a décidé quoi, quand ».
 *
 * Couvre les décisions jusqu'ici perdues au rechargement (état de session) :
 * arbitrages du run de paiement et crédit client (DAF), validations DG (compta),
 * lettrage 411 et tâches de clôture (COMPTABLE).
 *
 * Contrairement aux journaux stock/marketing (présence d'action), une décision
 * porte une **valeur choisie** (`choix`) réversible : re-cliquer le même choix
 * l'efface, cliquer un autre choix le remplace.
 */
import { loadJSON, saveJSON, genId, nowIso } from './persistence'

export type DecisionKind =
  | 'DECISION_DG'
  | 'ARBITRAGE_PAIEMENT'
  | 'CREDIT_CLIENT'
  | 'LETTRAGE'
  | 'CLOTURE_TACHE'

export interface DecisionEntry {
  id: string
  kind: DecisionKind
  /** Identifiant stable de l'objet tranché (fournisseur, demande, encaissement, tâche…). */
  refId: string
  /** Valeur retenue (ex. 'PAYER', 'ACCORDE', 'LETTRE', 'FAIT'). */
  choix: string
  label: string
  detail?: string
  by: string
  at: string
}

const STORAGE_KEY = 'prospera.decisions.journal.v1'

export function loadDecisions(): DecisionEntry[] {
  return loadJSON<DecisionEntry[]>(STORAGE_KEY, [])
}

export function saveDecisions(journal: DecisionEntry[]): void {
  saveJSON(STORAGE_KEY, journal)
}

function decisionKey(kind: DecisionKind, refId: string): string {
  return `${kind}::${refId}`
}

export function findDecision(
  journal: DecisionEntry[],
  kind: DecisionKind,
  refId: string,
): DecisionEntry | undefined {
  const key = decisionKey(kind, refId)
  return journal.find(e => decisionKey(e.kind, e.refId) === key)
}

export function setDecision(
  journal: DecisionEntry[],
  kind: DecisionKind,
  refId: string,
  choix: string,
  data: { label: string; detail?: string; by: string },
): DecisionEntry[] {
  const key = decisionKey(kind, refId)
  const idx = journal.findIndex(e => decisionKey(e.kind, e.refId) === key)
  const entry: DecisionEntry = {
    id: idx >= 0 ? journal[idx].id : genId('dec'),
    kind,
    refId,
    choix,
    label: data.label,
    detail: data.detail,
    by: data.by,
    at: nowIso(),
  }
  if (idx >= 0) {
    const copy = [...journal]
    copy[idx] = entry
    return copy
  }
  return [entry, ...journal]
}

export function clearDecision(
  journal: DecisionEntry[],
  kind: DecisionKind,
  refId: string,
): DecisionEntry[] {
  const key = decisionKey(kind, refId)
  return journal.filter(e => decisionKey(e.kind, e.refId) !== key)
}
