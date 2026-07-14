/**
 * Moteur d'automatisation — socle commun aux postes Marketing et Recouvrement.
 *
 * Une règle n'est pas une case à cocher décorative : elle est *évaluée* sur les
 * registres à chaque rendu et produit la liste réelle des cibles qu'elle
 * déclencherait maintenant, message rédigé compris. C'est ce qui permet à
 * l'opérateur de valider une action au lieu de la fabriquer.
 *
 * Trois modes d'exécution, dans l'ordre de confiance :
 *   AUTO       — part sans intervention humaine. Réservé aux actions réversibles
 *                et sans risque relationnel (un rappel d'échéance, un accusé).
 *   VALIDATION — l'IA prépare tout, un humain clique. Dès qu'il y a de l'argent,
 *                une remise, ou la réputation de l'entreprise en jeu.
 *   SUGGESTION — l'IA signale, l'humain décide et fait. Pour ce qui n'est pas
 *                automatisable sans jugement (baisser un plafond de crédit).
 */

import type { UserRole } from '@distributeur/types'

export type ModeExecution = 'AUTO' | 'VALIDATION' | 'SUGGESTION'

export type CanalAutomation =
  | 'WHATSAPP' | 'SMS' | 'APPEL' | 'VISITE' | 'EMAIL'
  | 'FACEBOOK' | 'TIKTOK' | 'CHATBOT' | 'SYSTEME'

export const CANAL_ICON: Record<CanalAutomation, string> = {
  WHATSAPP: '💬', SMS: '📱', APPEL: '📞', VISITE: '🚶', EMAIL: '✉️',
  FACEBOOK: '📘', TIKTOK: '🎵', CHATBOT: '🤖', SYSTEME: '⚙️',
}

/** Une occurrence prête à partir : la règle a trouvé cette cible dans les données. */
export interface CibleAutomation {
  id: string
  /** Qui / quoi — « Kiosque Port · 8,9 M · 78 j de retard ». */
  libelle: string
  detail: string
  canal: CanalAutomation
  /** Le message réellement prêt à l'envoi, personnalisé. Pas un template. */
  message: string
  /** Cash à encaisser (recouvrement) ou CA attendu (marketing). */
  valeur_fcfa: number
  /** Probabilité de succès estimée, 0-100. */
  score: number
  quand: string
  /**
   * Renseigné quand un garde-fou a retenu la cible. Elle reste visible :
   * une automatisation qui bloque en silence est une automatisation qu'on
   * finit par ne plus croire.
   */
  bloque_par?: string
}

export interface StatsRegle {
  executions_30j: number
  succes_30j: number
  taux_succes_pct: number
  impact_fcfa_30j: number
}

export interface RegleAutomation {
  id: string
  nom: string
  poste: UserRole
  /** L'événement qui déclenche — « Facture échue depuis 1 jour ». */
  declencheur: string
  /** Ce que la règle fait. */
  action: string
  canal: CanalAutomation
  mode: ModeExecution
  actif: boolean
  /** Ce que la règle refuse de faire — la partie qui protège l'entreprise. */
  garde_fous: string[]
  /** Plafond de sollicitation, pour ne pas brûler l'audience. */
  quota?: string
  cibles: CibleAutomation[]
  stats: StatsRegle
  explication_ia: string
  /** Heures de travail manuel évitées par mois — l'argument du DG. */
  gain_temps_h_mois: number
}

export const MODE_STYLE: Record<ModeExecution, string> = {
  AUTO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  VALIDATION: 'bg-amber-100 text-amber-700 border-amber-200',
  SUGGESTION: 'bg-sky-100 text-sky-700 border-sky-200',
}

export const MODE_LABEL: Record<ModeExecution, string> = {
  AUTO: 'Automatique',
  VALIDATION: 'À valider',
  SUGGESTION: 'Suggestion',
}

export interface SyntheseAutomation {
  regles_actives: number
  regles_total: number
  /** Cibles qui partiraient sans intervention humaine. */
  actions_auto: number
  /** Cibles en attente d'un clic — la file de travail du poste. */
  actions_a_valider: number
  /** Cibles retenues par un garde-fou. */
  actions_bloquees: number
  impact_fcfa: number
  gain_temps_h_mois: number
}

export function buildSyntheseAutomation(regles: RegleAutomation[]): SyntheseAutomation {
  const actives = regles.filter(r => r.actif)
  const ciblesActives = actives.flatMap(r => r.cibles.map(c => ({ regle: r, cible: c })))
  const passantes = ciblesActives.filter(({ cible }) => !cible.bloque_par)

  return {
    regles_actives: actives.length,
    regles_total: regles.length,
    actions_auto: passantes.filter(({ regle }) => regle.mode === 'AUTO').length,
    actions_a_valider: passantes.filter(({ regle }) => regle.mode !== 'AUTO').length,
    actions_bloquees: ciblesActives.filter(({ cible }) => cible.bloque_par).length,
    impact_fcfa: passantes.reduce((s, { cible }) => s + cible.valeur_fcfa, 0),
    gain_temps_h_mois: actives.reduce((s, r) => s + r.gain_temps_h_mois, 0),
  }
}

/** Les cibles de toutes les règles actives, à plat — la file de travail du poste. */
export function fileDActions(regles: RegleAutomation[]): { regle: RegleAutomation; cible: CibleAutomation }[] {
  return regles
    .filter(r => r.actif)
    .flatMap(r => r.cibles.map(cible => ({ regle: r, cible })))
    .filter(({ cible }) => !cible.bloque_par)
    // La valeur espérée, pas le montant brut : une grosse cible improbable
    // passe après une petite cible sûre.
    .sort((a, b) => (b.cible.valeur_fcfa * b.cible.score) - (a.cible.valeur_fcfa * a.cible.score))
}
