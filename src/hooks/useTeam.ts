'use client'
import { useQuery } from '@tanstack/react-query'
import { endpoints } from '@/lib/api'
import { MOCK_TEAM_PERFORMANCE } from '@/lib/mockMicrofinance'
import type { AgentPerformance } from '@/types'

export function useTeamPerformance() {
  return useQuery<AgentPerformance[]>({
    queryKey: ['team', 'performance'],
    queryFn: async () => {
      try {
        const res = await endpoints.teamPerformance()
        return res.data
      } catch {
        return MOCK_TEAM_PERFORMANCE
      }
    },
    staleTime: 300_000,
  })
}
