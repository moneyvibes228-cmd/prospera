/**
 * Workflow documentaire — persiste la chaîne proforma → commande → facture → e-facture.
 *
 * Deux stores localStorage :
 *  - les proformas **créées** depuis le builder (elles apparaissent ensuite dans la liste) ;
 *  - un journal d'événements documentaires (conversions, relances, retransmissions e-facture)
 *    idempotent par couple `kind` + `refId`.
 *
 * Généralise le modèle « Combos stock » au cycle documentaire terrain / comptable.
 */
import type { Proforma } from '@distributeur/types'
import { loadJSON, saveJSON, genId, nowIso } from './persistence'

export type DocEventKind = 'CONVERSION' | 'RELANCE' | 'RETRANSMISSION'

export interface DocEvent {
  id: string
  kind: DocEventKind
  /** proforma.id (conversion/relance) ou facture.id (retransmission e-facture). */
  refId: string
  at: string
  by: string
  payload?: Record<string, unknown>
}

const PROFORMAS_KEY = 'prospera.facturation.proformas.v1'
const EVENTS_KEY = 'prospera.facturation.events.v1'

export function loadProformasCreees(): Proforma[] {
  return loadJSON<Proforma[]>(PROFORMAS_KEY, [])
}

export function saveProformasCreees(list: Proforma[]): void {
  saveJSON(PROFORMAS_KEY, list)
}

export function loadDocEvents(): DocEvent[] {
  return loadJSON<DocEvent[]>(EVENTS_KEY, [])
}

export function saveDocEvents(list: DocEvent[]): void {
  saveJSON(EVENTS_KEY, list)
}

function eventKey(kind: DocEventKind, refId: string): string {
  return `${kind}::${refId}`
}

export function findEvent(events: DocEvent[], kind: DocEventKind, refId: string): DocEvent | undefined {
  return events.find(e => eventKey(e.kind, e.refId) === eventKey(kind, refId))
}

export function upsertEvent(
  events: DocEvent[],
  kind: DocEventKind,
  refId: string,
  data: { by: string; payload?: Record<string, unknown> },
): DocEvent[] {
  const idx = events.findIndex(e => eventKey(e.kind, e.refId) === eventKey(kind, refId))
  const entry: DocEvent = {
    id: idx >= 0 ? events[idx].id : genId('doc'),
    kind,
    refId,
    at: nowIso(),
    by: data.by,
    payload: data.payload,
  }
  if (idx >= 0) {
    const copy = [...events]
    copy[idx] = entry
    return copy
  }
  return [entry, ...events]
}

export function removeEvent(events: DocEvent[], entryId: string): DocEvent[] {
  return events.filter(e => e.id !== entryId)
}

/** Numérotation lisible dérivée d'un compteur (année figée sur le jeu de démonstration). */
export function genererReference(prefixe: 'CMD' | 'FAC' | 'PRO', seq: number): string {
  return `${prefixe}-2026-${String(seq).padStart(4, '0')}`
}
