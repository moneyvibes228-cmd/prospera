import type { UserRole } from '@/types'

export interface CopilotContext {
  prenom: string
  role: UserRole
  zone: string
  /** Nom complet connecté — filtre agents/commerciaux si besoin */
  nomComplet?: string
}
