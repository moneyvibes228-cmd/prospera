import { api } from '@/lib/api'
import type {
  CollecteAgregatsApi,
  CreditPipelineApi,
  DashboardTerrainApi,
  KpiAgentApi,
  OperationsHubApi,
  TransactionStatsCaisse,
  TransactionStatsMomo,
} from '@/types/phases-ad'

export const phasesAd = {
  dashboard: {
    terrain: () => api.get<DashboardTerrainApi>('/dashboard/terrain'),
    chargeCredit: () => api.get<Record<string, unknown>>('/dashboard/charge-credit'),
    roc: () => api.get<Record<string, unknown>>('/dashboard/roc'),
    responsableAgence: (agenceId?: string) =>
      api.get<Record<string, unknown>>('/dashboard/responsable-agence', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
    responsableCommercial: () =>
      api.get<Record<string, unknown>>('/dashboard/responsable-commercial'),
    gestionnairePortefeuille: () =>
      api.get<Record<string, unknown>>('/dashboard/gestionnaire-portefeuille'),
  },

  pipeline: {
    credit: (agenceId?: string) =>
      api.get<CreditPipelineApi>('/dossiers-credit/pipeline', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
  },

  recouvrement: {
    reseau: (agenceId?: string) =>
      api.get<Record<string, unknown>>('/recouvrement/reseau', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
    reseauAgence: (agenceId: string) =>
      api.get<Record<string, unknown>>(`/recouvrement/reseau/agences/${agenceId}`),
    reseauAgent: (agentId: string) =>
      api.get<Record<string, unknown>>(`/recouvrement/reseau/agents/${agentId}`),
    reseauClient: (clientId: string) =>
      api.get<Record<string, unknown>>(`/recouvrement/reseau/clients/${clientId}`),
    reseauDossier: (dossierId: string) =>
      api.get<Record<string, unknown>>(`/recouvrement/reseau/dossiers/${dossierId}`),
  },

  collecte: {
    agregats: (agenceId?: string) =>
      api.get<CollecteAgregatsApi>('/collecte/agregats', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
  },

  transactions: {
    create: (body: Record<string, unknown>) => api.post('/transactions', body),
    statsMomo: (agenceId?: string) =>
      api.get<TransactionStatsMomo>('/transactions/stats/momo', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
    statsCaisse: (agenceId?: string) =>
      api.get<TransactionStatsCaisse>('/transactions/stats/caisse', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
    valider: (id: string) => api.patch(`/transactions/${id}/valider`),
    rejeter: (id: string, body: { motif: string }) =>
      api.patch(`/transactions/${id}/rejeter`, body),
    list: (params?: { type?: string; statut?: string; agence_id?: string }) =>
      api.get<unknown[]>('/transactions', { params }),
  },

  kpis: {
    agents: (agenceId?: string) =>
      api.get<KpiAgentApi[]>('/kpis/agents', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
    agent: (id: string) => api.get<KpiAgentApi>(`/kpis/agents/${id}`),
  },

  objectifs: {
    get: (agentId: string, annee?: number) =>
      api.get(`/objectifs/agents/${agentId}`, { params: annee ? { annee } : undefined }),
    put: (agentId: string, body: { objectifs: unknown[] }) =>
      api.put(`/objectifs/agents/${agentId}`, body),
  },

  operations: {
    creditCycle: (agenceId?: string) =>
      api.get<OperationsHubApi>('/operations/credit-cycle', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
    coreBanking: (agenceId?: string) =>
      api.get<OperationsHubApi>('/operations/core-banking', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
    relances: (agenceId?: string) =>
      api.get<OperationsHubApi>('/operations/relances', {
        params: agenceId ? { agence_id: agenceId } : undefined,
      }),
  },

  visites: {
    list: (params?: Record<string, string>) => api.get<unknown[]>('/visites', { params }),
    aRevisiter: () => api.get<unknown[]>('/visites/a-revisiter'),
    nearby: (lat: number, lng: number, rayonKm = 5) =>
      api.get<unknown[]>('/visites/nearby', { params: { lat, lng, rayon_km: rayonKm } }),
  },
}
