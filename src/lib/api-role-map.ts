import type { UserRole } from '@/types'
import type { ApiBackendRole, ApiUser } from '@/types/phase1'
import type { AuthUser } from '@/lib/auth'

/** Rôle API backend → rôle frontend */
export const API_ROLE_TO_FRONT: Record<string, UserRole> = {
  DIRECTEUR_GENERAL: 'MANAGER',
  MANAGER: 'MANAGER',
  RESPONSABLE_AGENCE: 'GESTIONNAIRE',
  GESTIONNAIRE: 'GESTIONNAIRE',
  RESPONSABLE_OPERATION_CREDIT: 'RESPONSABLE_CREDIT',
  RESPONSABLE_CREDIT: 'RESPONSABLE_CREDIT',
  RESPONSABLE_COMMERCIAL_COLLECTE: 'RESPONSABLE_COMMERCIAL',
  RESPONSABLE_COMMERCIAL: 'RESPONSABLE_COMMERCIAL',
  GESTIONNAIRE_PORTEFEUILLE: 'GESTIONNAIRE_PORTEFEUILLE',
  AGENT_TERRAIN: 'AGENT_TERRAIN',
  COLLECTRICE: 'COLLECTRICE',
  CHARGE_CREDIT: 'CREDIT',
  CREDIT: 'CREDIT',
  COMPTABLE: 'COMPTABLE',
  ANALYSTE_RISQUE: 'RISQUE',
  RISQUE: 'RISQUE',
  DAF: 'DAF',
  AUDITEUR: 'AUDITEUR',
  COMMUNICATION: 'COMMUNICATION',
  RELANCE: 'RELANCE',
  PAIE: 'PAIE',
}

/** Rôle frontend → création utilisateur (DG / RA) */
export const FRONT_ROLE_TO_API: Partial<Record<UserRole, ApiBackendRole | string>> = {
  MANAGER: 'DIRECTEUR_GENERAL',
  GESTIONNAIRE: 'RESPONSABLE_AGENCE',
  RESPONSABLE_CREDIT: 'RESPONSABLE_OPERATION_CREDIT',
  RESPONSABLE_COMMERCIAL: 'RESPONSABLE_COMMERCIAL_COLLECTE',
  GESTIONNAIRE_PORTEFEUILLE: 'GESTIONNAIRE_PORTEFEUILLE',
  AGENT_TERRAIN: 'AGENT_TERRAIN',
  COLLECTRICE: 'COLLECTRICE',
  CREDIT: 'CHARGE_CREDIT',
  COMPTABLE: 'COMPTABLE',
  COMMERCIAL: 'AGENT_TERRAIN',
}

export function mapApiRoleToFront(role: string): UserRole {
  return API_ROLE_TO_FRONT[role] ?? (role as UserRole)
}

export function mapApiUserToAuthUser(u: ApiUser & { role?: string }): AuthUser {
  const role = mapApiRoleToFront(u.role ?? 'AGENT_TERRAIN')
  const prenom = u.prenom ?? ''
  const nom = u.nom ?? ''
  const full = [prenom, nom].filter(Boolean).join(' ').trim() || u.email
  const initiales = `${(prenom[0] ?? '').toUpperCase()}${(nom[0] ?? '').toUpperCase()}` || 'U'
  const zone =
    u.agence?.nom ??
    (role === 'MANAGER' ? 'Réseau — Toutes agences' : 'Siège')

  return {
    id: u.id,
    nom: full,
    email: u.email,
    role,
    zone,
    initiales,
  }
}
