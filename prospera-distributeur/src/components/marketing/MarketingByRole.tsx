'use client'

import { useAuth } from '@/contexts/AuthContext'
import { MarketingDGView } from '@/components/marketing/MarketingDGView'
import { MarketingOperateurView } from '@/components/marketing/MarketingView'

const ROLES_OPERATEUR = new Set(['MARKETING', 'DC', 'PROSPECTION'])

export function MarketingByRole() {
  const { user } = useAuth()

  if (user && ROLES_OPERATEUR.has(user.role)) {
    return <MarketingOperateurView />
  }

  return <MarketingDGView />
}
