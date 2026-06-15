'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { endpoints } from '@/lib/api'
import { phase1 } from '@/lib/api-phase1'
import { phasesAd } from '@/lib/api-phases-ad'
import { API_PHASES_AD_ENABLED } from '@/lib/api-config'
import { MOCK_VISITS } from '@/lib/mockMicrofinance'
import type { ContactMethod, Visit, VisitParams } from '@/types'

function unwrapList<T>(payload: T[] | { data: T[] }): T[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const d = (payload as { data: T[] }).data
    return Array.isArray(d) ? d : []
  }
  return []
}

function mapApiVisite(row: Record<string, unknown>): Visit {
  return {
    id: String(row.id ?? ''),
    borrowerId: String(row.clientId ?? row.client_id ?? ''),
    borrowerNom: String(row.client_nom ?? row.cliente ?? 'Client'),
    agentId: String(row.agentId ?? row.agent_id ?? ''),
    agentNom: String(row.agent_nom ?? ''),
    adresse: String(row.adresse ?? ''),
    date: String(row.date ?? row.createdAt ?? new Date().toISOString()),
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    statut: (row.statut as Visit['statut']) ?? 'POSITIVE',
    methode: (row.objet_visite ?? row.methode ?? 'VISITE_TERRAIN') as ContactMethod,
    commentaire: String(row.notes ?? row.compte_rendu ?? ''),
    distance_metres: row.distance_metres != null ? Number(row.distance_metres) : undefined,
  }
}

async function fetchVisitesList(params?: VisitParams): Promise<Visit[]> {
  if (API_PHASES_AD_ENABLED) {
    try {
      const qp: Record<string, string> = {}
      if (params?.agentId) qp.agent_id = params.agentId
      if (params?.statut) qp.statut = params.statut
      const res = await phasesAd.visites.list(qp)
      const list = unwrapList(res.data as unknown[] | { data: unknown[] })
      return list.map((r) => mapApiVisite(r as Record<string, unknown>))
    } catch {
      /* phase1 / mock */
    }
  }
  try {
    const res = await phase1.visites.list({ page: 1, limit: 50 })
    return res.data as Visit[]
  } catch {
    try {
      const res = await endpoints.visits(params)
      return res.data
    } catch {
      let data = [...MOCK_VISITS]
      if (params?.agentId) data = data.filter((v) => v.agentId === params.agentId)
      if (params?.statut) data = data.filter((v) => v.statut === params.statut)
      return data
    }
  }
}

export function useVisits(params?: VisitParams) {
  return useQuery<Visit[]>({
    queryKey: ['visits', params, API_PHASES_AD_ENABLED],
    queryFn: () => fetchVisitesList(params),
    staleTime: 30_000,
  })
}

export function useVisitHistory(borrowerId?: string) {
  return useQuery<Visit[]>({
    queryKey: ['visits', 'history', borrowerId],
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
    queryKey: ['visits', 'revisit', API_PHASES_AD_ENABLED],
    queryFn: async () => {
      if (API_PHASES_AD_ENABLED) {
        try {
          const res = await phasesAd.visites.aRevisiter()
          const list = unwrapList(res.data as unknown[] | { data: unknown[] })
          return list.map((r) => mapApiVisite(r as Record<string, unknown>))
        } catch {
          /* fallback */
        }
      }
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
    queryKey: ['visits', 'nearby', lat, lng, API_PHASES_AD_ENABLED],
    queryFn: async () => {
      if (API_PHASES_AD_ENABLED) {
        try {
          const res = await phasesAd.visites.nearby(lat, lng)
          const list = unwrapList(res.data as unknown[] | { data: unknown[] })
          return list.map((r) => mapApiVisite(r as Record<string, unknown>))
        } catch {
          /* fallback */
        }
      }
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
        const fd = new FormData()
        fd.append('lat', String(data.lat))
        fd.append('lng', String(data.lng))
        fd.append('statut', data.statut)
        fd.append('objet_visite', data.objet_visite ?? data.methode ?? 'VISITE')
        if (data.commentaire) fd.append('notes', data.commentaire)
        if (data.borrowerId) fd.append('clientId', data.borrowerId)
        if (!data.borrowerId && data.nom_prospect) {
          fd.append('nom_prospect', data.nom_prospect)
          fd.append('telephone_prospect', data.telephone_prospect ?? '')
        }
        data.photos?.forEach((f, i) => fd.append('photos', f, `photo-${i}.jpg`))
        const res = await phase1.visites.create(fd)
        return res.data
      } catch {
        try {
          const res = await endpoints.visitCreate(data as Omit<Visit, 'id' | 'createdAt'>)
          return res.data
        } catch {
          return { ...data, id: `mock-${Date.now()}`, date: new Date().toISOString() }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
    },
  })
}
