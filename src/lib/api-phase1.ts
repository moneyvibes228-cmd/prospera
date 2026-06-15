import { api } from '@/lib/api'
import type { LoginPayload } from '@/types/phase1'
import type {
  AgenceApi,
  AgentZoneApi,
  CreateAgencePayload,
  CreateProspectPayload,
  CreateUserPayload,
  ObjectifAgenceMois,
  ZoneTerrainApi,
} from '@/types/phase1'

/** Endpoints Phase 1 — auth + données réelles (agences, équipes, zones, terrain) */
export const phase1 = {
  auth: {
    login: (data: LoginPayload) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
  },

  agences: {
    list: () => api.get<AgenceApi[]>('/agences'),
    get: (id: string) => api.get<AgenceApi>(`/agences/${id}`),
    create: (data: CreateAgencePayload) => api.post<AgenceApi>('/agences', data),
    objectifs: (agenceId: string, annee?: number) =>
      api.get<ObjectifAgenceMois[]>(`/agences/${agenceId}/objectifs`, {
        params: annee ? { annee } : undefined,
      }),
    setObjectifs: (agenceId: string, objectifs: ObjectifAgenceMois[]) =>
      api.put<{ objectifs: ObjectifAgenceMois[] }>(`/agences/${agenceId}/objectifs`, {
        objectifs,
      }),
  },

  users: {
    list: (params?: { agenceId?: string; role?: string; actif?: boolean }) =>
      api.get('/users', { params }),
    create: (data: CreateUserPayload) => api.post('/users', data),
    patch: (id: string, data: { actif?: boolean }) => api.patch(`/users/${id}`, data),
  },

  zones: {
    agents: (agenceId?: string) =>
      api.get<AgentZoneApi[]>('/zones/agents', {
        params: agenceId ? { agenceId } : undefined,
      }),
    me: () => api.get<ZoneTerrainApi & { libelle: string }>('/zones/me'),
    assign: (agentId: string, data: ZoneTerrainApi) =>
      api.put<AgentZoneApi>(`/zones/agents/${agentId}`, data),
    remove: (agentId: string) => api.delete(`/zones/agents/${agentId}`),
  },

  visites: {
    list: (params?: { page?: number; limit?: number }) =>
      api.get('/visites', { params }),
    create: (formData: FormData) =>
      api.post('/visites', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
  },

  clients: {
    createProspect: (data: CreateProspectPayload) =>
      api.post('/clients/prospects', data),
  },
}
