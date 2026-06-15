'use client'

import { useCallback, useEffect, useState } from 'react'
import { recouvrementAgent } from '@/lib/api-recouvrement-agent'
import type { AgentMissionsResponse } from '@/types/gestion-portefeuille'
import type { PhasesAdLoadState } from '@/hooks/usePhasesAd'

function unwrap<T>(data: T | { data: T }): T {
  if (data && typeof data === 'object' && 'data' in data) return (data as { data: T }).data
  return data as T
}

/** Missions agent terrain — API strict */
export function useAgentMissionsStrict() {
  const [data, setData] = useState<AgentMissionsResponse | null>(null)
  const [state, setState] = useState<PhasesAdLoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const res = await recouvrementAgent.missions()
      setData(unwrap(res.data as AgentMissionsResponse | { data: AgentMissionsResponse }))
      setState('ok')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur missions agent')
      setData(null)
      setState('error')
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, state, error, reload }
}
