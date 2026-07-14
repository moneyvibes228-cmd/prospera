/**
 * Workflow d'exécution stock — journal persisté des actions réellement déclenchées
 * par le RESP_STOCK et le GEST_ENTREPOT (navettes de transfert, validations réappro,
 * réceptions contrôlées, comptages d'inventaire, scénarios de liquidation).
 *
 * Généralise le modèle « Combos stock » : chaque bouton d'exécution écrit une entrée
 * idempotente (une seule par couple `kind` + `refId`) qui survit au rechargement, ce qui
 * transforme les boutons « vitrine » en actions tracées et réversibles.
 */
import { loadJSON, saveJSON, genId, nowIso } from './persistence'

export type StockActionKind =
  | 'TRANSFERT'
  | 'REAPPRO_VALIDATION'
  | 'REAPPRO_BASCULE'
  | 'RECEPTION'
  | 'INVENTAIRE'
  | 'LIQUIDATION'

export interface StockActionEntry {
  id: string
  kind: StockActionKind
  /** Identifiant stable de l'objet concerné (transfert, commande, produit…). */
  refId: string
  label: string
  detail?: string
  by: string
  at: string
  payload?: Record<string, unknown>
}

const STORAGE_KEY = 'prospera.stock.journal.v1'

export function loadStockJournal(): StockActionEntry[] {
  return loadJSON<StockActionEntry[]>(STORAGE_KEY, [])
}

export function saveStockJournal(journal: StockActionEntry[]): void {
  saveJSON(STORAGE_KEY, journal)
}

export function actionKey(kind: StockActionKind, refId: string): string {
  return `${kind}::${refId}`
}

export function findAction(
  journal: StockActionEntry[],
  kind: StockActionKind,
  refId: string,
): StockActionEntry | undefined {
  const key = actionKey(kind, refId)
  return journal.find(e => actionKey(e.kind, e.refId) === key)
}

export function upsertAction(
  journal: StockActionEntry[],
  kind: StockActionKind,
  refId: string,
  data: { label: string; detail?: string; by: string; payload?: Record<string, unknown> },
): StockActionEntry[] {
  const key = actionKey(kind, refId)
  const idx = journal.findIndex(e => actionKey(e.kind, e.refId) === key)
  const entry: StockActionEntry = {
    id: idx >= 0 ? journal[idx].id : genId('stk'),
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

export function removeAction(journal: StockActionEntry[], entryId: string): StockActionEntry[] {
  return journal.filter(e => e.id !== entryId)
}

export const STOCK_ACTION_LABEL: Record<StockActionKind, string> = {
  TRANSFERT: 'Navette de transfert',
  REAPPRO_VALIDATION: 'Commande fournisseur validée',
  REAPPRO_BASCULE: 'Fournisseur alternatif retenu',
  RECEPTION: 'Réception contrôlée',
  INVENTAIRE: 'Comptage inventaire',
  LIQUIDATION: 'Scénario de liquidation lancé',
}
