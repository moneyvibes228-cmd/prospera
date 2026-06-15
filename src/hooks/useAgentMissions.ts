'use client'

import { useCallback, useEffect, useState } from 'react'
import { API_CREDIT_PHASE2_ENABLED } from '@/lib/api-config'
import { recouvrementAgent } from '@/lib/api-recouvrement-agent'
import { mockAgentMissions } from '@/lib/gp-portefeuille-api-mock'
import type { AgentMissionsResponse } from '@/types/gestion-portefeuille'

function unwrap<T>(data: T | { data: T }): T {
  if (data && typeof data === 'object' && 'data' in data) return (data as { data: T }).data
  return data as T
}

export function useAgentMissions() {
  const [data, setData] = useState<AgentMissionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'api' | 'mock'>('mock')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (API_CREDIT_PHASE2_ENABLED) {
      try {
        const res = await recouvrementAgent.missions()
        setData(unwrap(res.data as AgentMissionsResponse | { data: AgentMissionsResponse }))
        setSource('api')
        setLoading(false)
        return
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur missions agent')
      }
    }
    setData(mockAgentMissions())
    setSource('mock')
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, source, error, reload, apiEnabled: API_CREDIT_PHASE2_ENABLED }
}
