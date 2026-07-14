/**
 * Workflow recouvrement — actions métier + timeline persistée par dossier.
 *
 * Répond à l'audit (§3.13) : la fiche `DetailRelance` n'avait aucune action
 * hormis « Fermer ». On ajoute `Envoyer relance`, `Enregistrer paiement`,
 * `Enregistrer une promesse`, `Escalader`, `Bloquer/Débloquer le crédit`,
 * chaque action alimentant un journal (audit trail réversible).
 */
import { genId, loadJSON, nowIso, saveJSON } from './persistence'

export const STORAGE_RECOUVREMENT = 'prospera-recouvrement-events'

export type EvenementRecouvrementType =
  | 'RELANCE'
  | 'PAIEMENT'
  | 'PROMESSE'
  | 'ESCALADE'
  | 'BLOCAGE_CREDIT'
  | 'DEBLOCAGE_CREDIT'
  | 'CLOTURE'

export type CanalRelance = 'WHATSAPP' | 'SMS' | 'APPEL' | 'EMAIL' | 'VISITE'

export interface EvenementRecouvrement {
  id: string
  dossierId: string
  type: EvenementRecouvrementType
  date: string
  auteur: string
  canal?: CanalRelance
  montant?: number
  echeance?: string
  note?: string
}

export interface DossierRecouvrementState {
  events: EvenementRecouvrement[]
  creditBloque: boolean
  cloture: boolean
}

export const EVENEMENT_LABEL: Record<EvenementRecouvrementType, string> = {
  RELANCE: 'Relance envoyée',
  PAIEMENT: 'Paiement encaissé',
  PROMESSE: 'Promesse de paiement',
  ESCALADE: 'Escaladé en contentieux',
  BLOCAGE_CREDIT: 'Crédit bloqué',
  DEBLOCAGE_CREDIT: 'Crédit débloqué',
  CLOTURE: 'Dossier clôturé',
}

export function loadRecouvrementEvents(): EvenementRecouvrement[] {
  return loadJSON<EvenementRecouvrement[]>(STORAGE_RECOUVREMENT, [])
}

export function saveRecouvrementEvents(e: EvenementRecouvrement[]): void {
  saveJSON(STORAGE_RECOUVREMENT, e)
}

export function buildEvent(
  dossierId: string,
  type: EvenementRecouvrementType,
  auteur: string,
  extra: Partial<Pick<EvenementRecouvrement, 'canal' | 'montant' | 'echeance' | 'note'>> = {},
): EvenementRecouvrement {
  return { id: genId('rec'), dossierId, type, date: nowIso(), auteur, ...extra }
}

export function etatDossier(
  events: EvenementRecouvrement[],
  dossierId: string,
): DossierRecouvrementState {
  const dossierEvents = events
    .filter(e => e.dossierId === dossierId)
    .sort((a, b) => b.date.localeCompare(a.date))

  let creditBloque = false
  let cloture = false
  for (const e of [...dossierEvents].reverse()) {
    if (e.type === 'BLOCAGE_CREDIT') creditBloque = true
    if (e.type === 'DEBLOCAGE_CREDIT') creditBloque = false
    if (e.type === 'CLOTURE') cloture = true
  }
  return { events: dossierEvents, creditBloque, cloture }
}
