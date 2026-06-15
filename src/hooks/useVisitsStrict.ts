'use client'

import { useQuery } from '@tanstack/react-query'
import { phasesAd } from '@/lib/api-phases-ad'
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

async function fetchVisitesStrict(params?: VisitParams): Promise<Visit[]> {
  const qp: Record<string, string> = {}
  if (params?.agentId) qp.agent_id = params.agentId
  if (params?.statut) qp.statut = params.statut
  const res = await phasesAd.visites.list(qp)
  const list = unwrapList(res.data as unknown[] | { data: unknown[] })
  return list.map((r) => mapApiVisite(r as Record<string, unknown>))
}

/** Visites terrain — API strict (pages `-with-api`) */
export function useVisitsStrict(params?: VisitParams) {
  return useQuery<Visit[]>({
    queryKey: ['visits-strict', params],
    queryFn: () => fetchVisitesStrict(params),
    staleTime: 30_000,
    retry: 1,
  })
}

export function useRevisitReadyStrict() {
  return useQuery<Visit[]>({
    queryKey: ['visits-strict', 'revisit'],
    queryFn: async () => {
      const res = await phasesAd.visites.aRevisiter()
      const list = unwrapList(res.data as unknown[] | { data: unknown[] })
      return list.map((r) => mapApiVisite(r as Record<string, unknown>))
    },
    staleTime: 60_000,
    retry: 1,
  })
}

export function useVisitNearbyStrict(lat: number, lng: number, enabled: boolean) {
  return useQuery<Visit[]>({
    queryKey: ['visits-strict', 'nearby', lat, lng],
    queryFn: async () => {
      const res = await phasesAd.visites.nearby(lat, lng)
      const list = unwrapList(res.data as unknown[] | { data: unknown[] })
      return list.map((r) => mapApiVisite(r as Record<string, unknown>))
    },
    enabled: enabled && !!lat && !!lng,
    staleTime: 10_000,
    retry: 1,
  })
}
