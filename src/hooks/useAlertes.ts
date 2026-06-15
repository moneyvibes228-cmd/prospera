'use client'
import { useQuery } from '@tanstack/react-query'
import { endpoints } from '@/lib/api'
import { MOCK_ALERTES } from '@/lib/mockMicrofinance'
import type { AIAlert } from '@/types'

export function useAlertes(severity?: string) {
  return useQuery<AIAlert[]>({
    queryKey: ['alertes', severity],
    queryFn: async () => {
      try {
        const res = await endpoints.alertes(severity)
        return res.data
      } catch {
        if (severity) return MOCK_ALERTES.filter(a => a.severity === severity)
        return MOCK_ALERTES
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
