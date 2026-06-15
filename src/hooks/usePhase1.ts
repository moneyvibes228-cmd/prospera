'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { phase1 } from '@/lib/api-phase1'
import { AGENCES } from '@/lib/agences'
import { getUtilisateursHub } from '@/lib/utilisateurs-hub'
import type {
  AgenceApi,
  AgentZoneApi,
  CreateAgencePayload,
  CreateProspectPayload,
  CreateUserPayload,
  ObjectifAgenceMois,
  ZoneTerrainApi,
} from '@/types/phase1'

export function useAgencesApi() {
  return useQuery({
    queryKey: ['phase1', 'agences'],
    queryFn: async (): Promise<{ data: AgenceApi[]; source: 'api' | 'mock' }> => {
      try {
        const res = await phase1.agences.list()
        return { data: res.data, source: 'api' }
      } catch {
        return {
          source: 'mock',
          data: AGENCES.map(a => ({
            id: a.id,
            nom: a.nom,
            ville: a.ville,
            zone: a.region,
            adresse: undefined,
            telephone: undefined,
          })),
        }
      }
    },
    staleTime: 60_000,
  })
}

export function useAgenceDetailApi(agenceId: string | null) {
  return useQuery({
    queryKey: ['phase1', 'agences', agenceId],
    enabled: !!agenceId,
    queryFn: async () => {
      const res = await phase1.agences.get(agenceId!)
      return res.data
    },
    staleTime: 30_000,
  })
}

export function useCreateAgence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAgencePayload) =>
      phase1.agences.create(payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phase1', 'agences'] }),
  })
}

export function useAgenceObjectifs(agenceId: string | null, annee = new Date().getFullYear()) {
  return useQuery({
    queryKey: ['phase1', 'objectifs', agenceId, annee],
    enabled: !!agenceId,
    queryFn: async () => {
      const res = await phase1.agences.objectifs(agenceId!, annee)
      return res.data
    },
  })
}

export function useSetAgenceObjectifs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      agenceId,
      objectifs,
    }: {
      agenceId: string
      objectifs: ObjectifAgenceMois[]
    }) => phase1.agences.setObjectifs(agenceId, objectifs).then(r => r.data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['phase1', 'objectifs', v.agenceId] })
    },
  })
}

export function useUsersApi(params?: { agenceId?: string; role?: string; actif?: boolean }) {
  return useQuery({
    queryKey: ['phase1', 'users', params],
    queryFn: async () => {
      try {
        const res = await phase1.users.list(params)
        return { users: res.data as import('@/types/phase1').ApiUser[], source: 'api' as const }
      } catch {
        const hub = getUtilisateursHub()
        return {
          source: 'mock' as const,
          users: hub.utilisateurs.map(u => ({
            id: u.id,
            nom: u.nom.split(' ').slice(-1)[0] ?? u.nom,
            prenom: u.nom.split(' ')[0] ?? '',
            email: u.email,
            role: u.role,
            actif: u.statut === 'ACTIF',
            agence: { id: 'mock', nom: u.agence },
          })),
        }
      }
    },
    staleTime: 30_000,
  })
}

export function useCreateUserApi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      phase1.users.create(payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phase1', 'users'] }),
  })
}

export function useZonesAgents(agenceId?: string) {
  return useQuery({
    queryKey: ['phase1', 'zones', 'agents', agenceId],
    queryFn: async (): Promise<{ agents: AgentZoneApi[]; source: 'api' | 'mock' }> => {
      try {
        const res = await phase1.zones.agents(agenceId)
        return { agents: res.data, source: 'api' }
      } catch {
        return {
          source: 'mock',
          agents: [
            {
              id: 'mock-agent-1',
              nom: 'Lawson',
              prenom: 'Akua',
              agence: { id: 'AG-002', nom: 'Agence Adidogomé', ville: 'Lomé' },
              zone_affectee: {
                libelle: 'Marché Adidogomé',
                centre_lat: 6.1613,
                centre_lng: 1.1745,
                couleur: '#0d9488',
                geojson: null,
              },
              stats: { nb_clients: 12, nb_visites: 45 },
            },
          ],
        }
      }
    },
    staleTime: 30_000,
  })
}

export function useMaZone() {
  return useQuery({
    queryKey: ['phase1', 'zones', 'me'],
    queryFn: async (): Promise<{ zone: ZoneTerrainApi | null; source: 'api' | 'mock' }> => {
      try {
        const res = await phase1.zones.me()
        return { zone: res.data, source: 'api' }
      } catch {
        return {
          source: 'mock',
          zone: {
            libelle: 'Lomé Centre',
            centre_lat: 6.1374,
            centre_lng: 1.2123,
            couleur: '#14b8a6',
            description: 'Zone terrain assignée',
          },
        }
      }
    },
    staleTime: 60_000,
  })
}

export function useAssignZone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string; data: ZoneTerrainApi }) =>
      phase1.zones.assign(agentId, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phase1', 'zones'] })
    },
  })
}

export function useCreateProspect() {
  return useMutation({
    mutationFn: (payload: CreateProspectPayload) =>
      phase1.clients.createProspect(payload).then(r => r.data),
  })
}

export function useCreateVisiteMultipart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      phase1.visites.create(formData).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      qc.invalidateQueries({ queryKey: ['phase1', 'zones'] })
    },
  })
}
