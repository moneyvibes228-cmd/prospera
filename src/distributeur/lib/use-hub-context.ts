'use client'

import { useAuth } from '@distributeur/contexts/AuthContext'
import type { HubContext } from './hub-context'

/** Contexte hub dérivé de l'utilisateur connecté — porte son périmètre de données. */
export function useHubContext(): HubContext {
  const { user } = useAuth()
  return { role: user?.role, nom: user?.nom, zones: user?.zones }
}
