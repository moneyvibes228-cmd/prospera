/**
 * Workflow « recensement » de la prospection — le mode terrain où le prospecteur
 * tape un point sur la carte d'une zone blanche pour créer un prospect géolocalisé.
 *
 * On ne touche pas au `REGISTRE_PROSPECTS` statique (qualification aboutie) : le
 * recensement est une couche persistée à part, la matière brute d'une tournée de
 * porte-à-porte, réversible et exportable vers le carnet dès qu'elle est qualifiée.
 */

import { genId, loadJSON, nowIso, saveJSON } from './persistence'

const STORAGE_KEY = 'prospera-prospection-recensement'
const STORAGE_KEY_TRANSFERTS = 'prospera-prospection-transferts'

/** Un commerce repéré sur le terrain, géolocalisé, pas encore qualifié. */
export interface ProspectRecense {
  id: string
  nom: string
  lat: number
  lng: number
  type_commerce?: string
  /** Prospecteur qui l'a recensé — porte le périmètre. */
  commercial: string
  createdAt: string
}

export function loadRecensement(): ProspectRecense[] {
  return loadJSON<ProspectRecense[]>(STORAGE_KEY, [])
}

export function saveRecensement(items: ProspectRecense[]): void {
  saveJSON(STORAGE_KEY, items)
}

export function creerProspectRecense(input: {
  nom: string
  lat: number
  lng: number
  type_commerce?: string
  commercial: string
}): ProspectRecense {
  return {
    id: genId('recens'),
    createdAt: nowIso(),
    nom: input.nom,
    lat: input.lat,
    lng: input.lng,
    type_commerce: input.type_commerce,
    commercial: input.commercial,
  }
}

/**
 * Passation — transferts d'ouvertures au commercial de secteur.
 *
 * On ne modifie pas le `REGISTRE_OUVERTURES` (données de démo) : le transfert est
 * une couche persistée à part, indexée par identifiant d'ouverture → commercial.
 * Les vues fusionnent cette couche par-dessus le registre, ce qui fait sortir le
 * PDV de la file de passation dès qu'il est transféré.
 */
export type TransfertsMap = Record<string, string>

export function loadTransferts(): TransfertsMap {
  return loadJSON<TransfertsMap>(STORAGE_KEY_TRANSFERTS, {})
}

export function saveTransferts(map: TransfertsMap): void {
  saveJSON(STORAGE_KEY_TRANSFERTS, map)
}
