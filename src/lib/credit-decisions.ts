import type { UserRole } from '@/types'

export type DecisionCC =
  | 'APPROUVER'
  | 'APPROUVER_REDUIT'
  | 'DEMANDER_GARANTIES'
  | 'REFUSER'
  | 'TRANSMETTRE_ROC'

export type DecisionROC =
  | 'APPROUVER'
  | 'APPROUVER_REDUIT'
  | 'APPROUVER_RESERVES'
  | 'REFUSER'
  | 'RENVOYER_CC'

export type DecisionCredit = DecisionCC | DecisionROC

export interface DecisionOption {
  id: DecisionCredit
  label: string
  shortLabel: string
  style: string
  icon: 'check' | 'check-partial' | 'warning' | 'x' | 'arrow'
}

const CC_DECISIONS: DecisionOption[] = [
  { id: 'APPROUVER',          label: 'Approuver',              shortLabel: 'Approuver',        style: 'bg-emerald-600 hover:bg-emerald-700 text-white', icon: 'check' },
  { id: 'APPROUVER_REDUIT',   label: 'Approuver réduit',       shortLabel: 'Réduit',           style: 'bg-teal-600 hover:bg-teal-700 text-white',       icon: 'check-partial' },
  { id: 'DEMANDER_GARANTIES', label: 'Demander garanties',     shortLabel: 'Garanties',        style: 'bg-amber-600 hover:bg-amber-700 text-white',     icon: 'warning' },
  { id: 'REFUSER',            label: 'Refuser',                shortLabel: 'Refuser',          style: 'bg-red-600 hover:bg-red-700 text-white',         icon: 'x' },
  { id: 'TRANSMETTRE_ROC',    label: 'Transmettre au ROC',     shortLabel: '→ ROC',            style: 'bg-indigo-600 hover:bg-indigo-700 text-white',   icon: 'arrow' },
]

const ROC_DECISIONS: DecisionOption[] = [
  { id: 'APPROUVER',          label: 'Valider le dossier',     shortLabel: 'Valider',          style: 'bg-emerald-600 hover:bg-emerald-700 text-white', icon: 'check' },
  { id: 'APPROUVER_REDUIT',   label: 'Valider montant réduit', shortLabel: 'Réduit',           style: 'bg-teal-600 hover:bg-teal-700 text-white',       icon: 'check-partial' },
  { id: 'APPROUVER_RESERVES', label: 'Valider avec réserves',  shortLabel: 'Réserves',         style: 'bg-amber-600 hover:bg-amber-700 text-white',     icon: 'warning' },
  { id: 'REFUSER',            label: 'Rejeter',                shortLabel: 'Rejeter',          style: 'bg-red-600 hover:bg-red-700 text-white',         icon: 'x' },
  { id: 'RENVOYER_CC',        label: 'Renvoyer au CC',         shortLabel: '← CC',             style: 'bg-slate-600 hover:bg-slate-700 text-white',     icon: 'arrow' },
]

export function isRocRole(role?: UserRole): boolean {
  return role === 'RESPONSABLE_CREDIT' || role === 'MANAGER'
}

export function isCcRole(role?: UserRole): boolean {
  return role === 'CREDIT' || role === 'RISQUE'
}

export function isRaRole(role?: UserRole): boolean {
  return role === 'GESTIONNAIRE'
}

export function getDecisionsForRole(role?: UserRole): DecisionOption[] {
  if (isRocRole(role)) return ROC_DECISIONS
  if (isCcRole(role)) return CC_DECISIONS
  return CC_DECISIONS
}

export function getDecisionSectionLabel(role?: UserRole): string {
  if (isRocRole(role)) return 'Décision ROC — validation finale'
  if (isCcRole(role)) return 'Décision chargé de crédit'
  return 'Décision'
}

/** Map legacy A_VOIR_ROC → TRANSMETTRE_ROC */
export function normalizeLegacyDecision(d: string): DecisionCredit {
  if (d === 'A_VOIR_ROC') return 'TRANSMETTRE_ROC'
  return d as DecisionCredit
}
