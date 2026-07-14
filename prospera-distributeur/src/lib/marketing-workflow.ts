/**
 * Workflow marketing — journal persisté des actions du Studio réseaux sociaux
 * et des campagnes d'écoulement fournisseurs.
 *
 * Même modèle idempotent que le workflow stock : chaque bouton (programmer un post,
 * le supprimer, répondre à un message, créer un lead, monter une campagne) écrit une
 * entrée unique par couple `kind` + `refId`, qui survit au rechargement.
 */
import { loadJSON, saveJSON, genId, nowIso } from './persistence'

export type MarketingActionKind =
  | 'POST_PROGRAMME'
  | 'POST_REECRIRE'
  | 'POST_EDITE'
  | 'POST_SUPPRIME'
  | 'POST_CREE'
  | 'POST_REPROGRAMME'
  | 'POST_DUPLIQUE'
  | 'MESSAGE_REPONDU'
  | 'LEAD_CREE'
  | 'CAMPAGNE_ECOULEMENT'

export interface MarketingActionEntry {
  id: string
  kind: MarketingActionKind
  /** Identifiant stable de l'objet concerné (post, message, fournisseur…). */
  refId: string
  label: string
  detail?: string
  by: string
  at: string
  payload?: Record<string, unknown>
}

const STORAGE_KEY = 'prospera.marketing.journal.v1'

export function loadMarketingJournal(): MarketingActionEntry[] {
  return loadJSON<MarketingActionEntry[]>(STORAGE_KEY, [])
}

export function saveMarketingJournal(journal: MarketingActionEntry[]): void {
  saveJSON(STORAGE_KEY, journal)
}

function actionKey(kind: MarketingActionKind, refId: string): string {
  return `${kind}::${refId}`
}

export function findMarketingAction(
  journal: MarketingActionEntry[],
  kind: MarketingActionKind,
  refId: string,
): MarketingActionEntry | undefined {
  const key = actionKey(kind, refId)
  return journal.find(e => actionKey(e.kind, e.refId) === key)
}

export function upsertMarketingAction(
  journal: MarketingActionEntry[],
  kind: MarketingActionKind,
  refId: string,
  data: { label: string; detail?: string; by: string; payload?: Record<string, unknown> },
): MarketingActionEntry[] {
  const key = actionKey(kind, refId)
  const idx = journal.findIndex(e => actionKey(e.kind, e.refId) === key)
  const entry: MarketingActionEntry = {
    id: idx >= 0 ? journal[idx].id : genId('mkt'),
    kind,
    refId,
    label: data.label,
    detail: data.detail,
    by: data.by,
    at: nowIso(),
    payload: data.payload,
  }
  if (idx >= 0) {
    const copy = [...journal]
    copy[idx] = entry
    return copy
  }
  return [entry, ...journal]
}

export function removeMarketingAction(journal: MarketingActionEntry[], entryId: string): MarketingActionEntry[] {
  return journal.filter(e => e.id !== entryId)
}

export const MARKETING_ACTION_LABEL: Record<MarketingActionKind, string> = {
  POST_PROGRAMME: 'Post validé et programmé',
  POST_REECRIRE: 'Réécriture demandée',
  POST_EDITE: 'Contenu modifié',
  POST_SUPPRIME: 'Post supprimé',
  POST_CREE: 'Post créé',
  POST_REPROGRAMME: 'Post replanifié',
  POST_DUPLIQUE: 'Post dupliqué',
  MESSAGE_REPONDU: 'Réponse envoyée',
  LEAD_CREE: 'Lead créé',
  CAMPAGNE_ECOULEMENT: "Campagne d'écoulement créée",
}
