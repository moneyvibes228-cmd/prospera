'use client'

import { useAuth } from '@distributeur/contexts/AuthContext'
import { MarketingDGView } from '@distributeur/components/marketing/MarketingDGView'
import { MarketingOperateurView } from '@distributeur/components/marketing/MarketingView'

const ROLES_OPERATEUR = new Set(['MARKETING', 'DC', 'PROSPECTION'])

export function MarketingByRole() {
  const { user } = useAuth()

  if (user && ROLES_OPERATEUR.has(user.role)) {
    return <MarketingOperateurView />
  }

  return <MarketingDGView />
}
