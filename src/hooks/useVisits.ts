'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { endpoints } from '@/lib/api'
import { MOCK_VISITS } from '@/lib/mockMicrofinance'
import type { Visit, VisitParams } from '@/types'

/** Visites — version mock (pas d’appel Phases A–D). Voir `useVisitsWithApi`. */
export function useVisits(params?: VisitParams) {
  return useQuery<Visit[]>({
    queryKey: ['visits', 'mock', params],
    queryFn: async () => {
      try {
        const res = await endpoints.visits(params)
        return res.data
      } catch {
        let data = [...MOCK_VISITS]
        if (params?.agentId) data = data.filter((v) => v.agentId === params.agentId)
        if (params?.statut) data = data.filter((v) => v.statut === params.statut)
        return data
      }
    },
    staleTime: 30_000,
  })
}

export function useVisitHistory(borrowerId?: string) {
  return useQuery<Visit[]>({
    queryKey: ['visits', 'history', 'mock', borrowerId],
    queryFn: async () => {
      try {
        const res = await endpoints.visitHistory(borrowerId)
        return res.data
      } catch {
        if (borrowerId) return MOCK_VISITS.filter((v) => v.borrowerId === borrowerId)
        return MOCK_VISITS
      }
    },
    staleTime: 60_000,
  })
}

export function useRevisitReady() {
  return useQuery<Visit[]>({
    queryKey: ['visits', 'revisit', 'mock'],
    queryFn: async () => {
      try {
        const res = await endpoints.revisitReady()
        return res.data
      } catch {
        return MOCK_VISITS.filter((v) => v.statut === 'POSITIVE').slice(0, 5)
      }
    },
    staleTime: 60_000,
  })
}

export function useVisitNearby(lat: number, lng: number, enabled: boolean) {
  return useQuery<Visit[]>({
    queryKey: ['visits', 'nearby', 'mock', lat, lng],
    queryFn: async () => {
      try {
        const res = await endpoints.visitNearby(lat, lng)
        return res.data
      } catch {
        const isNearLome = Math.abs(lat - 6.1374) < 0.05 && Math.abs(lng - 1.2123) < 0.05
        return isNearLome
          ? MOCK_VISITS.slice(0, 3).map((v) => ({
              ...v,
              distance_metres: Math.round(Math.random() * 45 + 5),
            }))
          : []
      }
    },
    enabled: enabled && !!lat && !!lng,
    staleTime: 10_000,
  })
}

export function useCreateVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      data: Omit<Visit, 'id' | 'date'> & {
        photos?: File[]
        objet_visite?: string
        nom_prospect?: string
        telephone_prospect?: string
      },
    ) => {
      try {
        const res = await endpoints.visitCreate(data as Omit<Visit, 'id' | 'createdAt'>)
        return res.data
      } catch {
        return { ...data, id: `mock-${Date.now()}`, date: new Date().toISOString() }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
    },
  })
}
