'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AgencesDgView } from '@/components/agences/AgencesDgView'
import { AgencesStandardView } from '@/components/agences/AgencesStandardView'

export default function AgencesPage() {
  const { user } = useAuth()
  const isDg = user?.role === 'MANAGER'

  if (isDg) {
    return <AgencesDgView />
  }

  return <AgencesStandardView />
}
