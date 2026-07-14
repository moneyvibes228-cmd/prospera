/**
 * Workflow d'automatisation persisté — le maillon manquant du §5 : l'exécution
 * et la validation. Le socle (règles AUTO / VALIDATION / SUGGESTION, garde-fous,
 * cibles calculées en direct) existe déjà ; ce journal enregistre ce que
 * l'opérateur en fait, et le conserve au rechargement.
 *
 * Deux natures d'entrées :
 *   REGLE_OFF     — la règle a été désactivée par l'utilisateur (présence = OFF).
 *   CIBLE_TRAITEE — une cible « à valider / suggérée » a été validée ou ignorée.
 *
 * Garde-fou préservé : une cible retenue par un garde-fou (`bloque_par`) n'est
 * jamais traitable — l'UI n'expose pas d'action dessus.
 */
import { loadJSON, saveJSON, genId, nowIso } from './persistence'

export type AutomationEntryKind = 'REGLE_OFF' | 'CIBLE_TRAITEE'
export type CibleStatut = 'VALIDEE' | 'IGNOREE'

export interface AutomationEntry {
  id: string
  kind: AutomationEntryKind
  /** rule.id (REGLE_OFF) ou cible.id (CIBLE_TRAITEE). */
  refId: string
  /** Pour CIBLE_TRAITEE : la décision prise. */
  choix?: CibleStatut
  label: string
  by: string
  at: string
}

const STORAGE_KEY = 'prospera.automation.journal.v1'

export function loadAutomationJournalWF(): AutomationEntry[] {
  return loadJSON<AutomationEntry[]>(STORAGE_KEY, [])
}

export function saveAutomationJournalWF(journal: AutomationEntry[]): void {
  saveJSON(STORAGE_KEY, journal)
}

function entryKey(kind: AutomationEntryKind, refId: string): string {
  return `${kind}::${refId}`
}

export function findAutomationEntry(
  journal: AutomationEntry[],
  kind: AutomationEntryKind,
  refId: string,
): AutomationEntry | undefined {
  const key = entryKey(kind, refId)
  return journal.find(e => entryKey(e.kind, e.refId) === key)
}

/** Bascule l'état actif/inactif d'une règle (ajoute ou retire l'entrée REGLE_OFF). */
export function toggleRegleOff(
  journal: AutomationEntry[],
  regleId: string,
  by: string,
  label: string,
): { journal: AutomationEntry[]; desactivee: boolean } {
  const existante = findAutomationEntry(journal, 'REGLE_OFF', regleId)
  if (existante) {
    return { journal: journal.filter(e => e.id !== existante.id), desactivee: false }
  }
  const entry: AutomationEntry = {
    id: genId('auto'), kind: 'REGLE_OFF', refId: regleId, label, by, at: nowIso(),
  }
  return { journal: [entry, ...journal], desactivee: true }
}

/** Pose (ou remplace) le statut d'une cible. Re-poser le même statut l'efface. */
export function setCibleStatut(
  journal: AutomationEntry[],
  cibleId: string,
  choix: CibleStatut,
  by: string,
  label: string,
): AutomationEntry[] {
  const existante = findAutomationEntry(journal, 'CIBLE_TRAITEE', cibleId)
  if (existante && existante.choix === choix) {
    return journal.filter(e => e.id !== existante.id)
  }
  const entry: AutomationEntry = {
    id: existante?.id ?? genId('auto'),
    kind: 'CIBLE_TRAITEE', refId: cibleId, choix, label, by, at: nowIso(),
  }
  if (existante) {
    return journal.map(e => (e.id === existante.id ? entry : e))
  }
  return [entry, ...journal]
}

export function clearCibleStatut(journal: AutomationEntry[], cibleId: string): AutomationEntry[] {
  const existante = findAutomationEntry(journal, 'CIBLE_TRAITEE', cibleId)
  return existante ? journal.filter(e => e.id !== existante.id) : journal
}
