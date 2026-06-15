'use client'

import { useRecouvrementDrilldown } from '@/hooks/usePhasesAd'
import { PhasesAdDataBanner } from '@/components/phases-ad/PhasesAdDataBanner'

const ENDPOINTS: Record<string, string> = {
  agence: 'GET /recouvrement/reseau/agences/:id',
  agent: 'GET /recouvrement/reseau/agents/:id',
  client: 'GET /recouvrement/reseau/clients/:id',
  dossier: 'GET /recouvrement/reseau/dossiers/:id',
}

export function RecouvrementDrillBanner({
  type,
  id,
}: {
  type: 'agence' | 'agent' | 'client' | 'dossier'
  id: string
}) {
  const { source } = useRecouvrementDrilldown(type, id)
  return <PhasesAdDataBanner source={source} endpoint={ENDPOINTS[type]} compact />
}
