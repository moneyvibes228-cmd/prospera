'use client'
import { useQuery } from '@tanstack/react-query'
import { endpoints } from '@/lib/api'
import { MOCK_KPIS, MOCK_KPI_HISTORIQUE } from '@/lib/mockMicrofinance'
import type { DashboardKpis, KpiSnapshot } from '@/types'

export function useDashboardKpis() {
  return useQuery<DashboardKpis>({
    queryKey: ['kpis', 'dashboard'],
    queryFn: async () => {
      try {
        const res = await endpoints.kpis()
        return res.data
      } catch {
        return MOCK_KPIS
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useKpisHistorique() {
  return useQuery<KpiSnapshot[]>({
    queryKey: ['kpis', 'historique'],
    queryFn: async () => {
      try {
        const res = await endpoints.kpisHistorique()
        return res.data
      } catch {
        return MOCK_KPI_HISTORIQUE
      }
    },
    staleTime: 300_000,
  })
}
