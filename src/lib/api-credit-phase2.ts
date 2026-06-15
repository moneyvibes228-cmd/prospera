import { api } from '@/lib/api'
import type {
  AvisChargePayload,
  ComiteCreditPayload,
  ComiteCreditResponse,
  CreateDossierCreditPayload,
  DecisionRocPayload,
  DossierCreditDetail,
  DossierCreditListItem,
  DossierWorkflowResponse,
  VuePortefeuilleResponse,
} from '@/types/credit-api'
import type { DossierScoreApi, RapportCcApi, RapportRocApi } from '@/types/credit-rapports-api'
import type { EcheancierResume, InstructionCcChecklist } from '@/types/gestion-portefeuille'

/** Endpoints Phase 2 — processus crédit */
export const creditPhase2 = {
  dossiers: {
    list: (params?: { statut?: string; agenceId?: string; page?: number; limit?: number }) =>
      api.get<DossierCreditListItem[]>('/dossiers-credit', { params }),

    get: (id: string) => api.get<DossierCreditDetail>(`/dossiers-credit/${id}`),

    create: (data: CreateDossierCreditPayload) =>
      api.post<DossierCreditDetail>('/dossiers-credit', data),

    workflow: (id: string) =>
      api.get<DossierWorkflowResponse>(`/dossiers-credit/${id}/workflow`),

    rapportCc: (id: string) => api.get<RapportCcApi>(`/dossiers-credit/${id}/rapport-cc`),

    rapportRoc: (id: string) => api.get<RapportRocApi>(`/dossiers-credit/${id}/rapport-roc`),

    score: (id: string) => api.get<DossierScoreApi>(`/dossiers-credit/${id}/score`),

    vuePortefeuille: (id: string) =>
      api.get<VuePortefeuilleResponse>(`/dossiers-credit/${id}/vue-portefeuille`),

    echeancier: (id: string) => api.get<{ lignes: unknown[] }>(`/dossiers-credit/${id}/echeancier`),

    echeancierResume: (id: string) =>
      api.get<EcheancierResume>(`/dossiers-credit/${id}/echeancier/resume`),

    instructionCc: (id: string) =>
      api.get<InstructionCcChecklist>(`/dossiers-credit/${id}/instruction-cc`),

    receptionDossierCaution: (
      dossierId: string,
      cautionId: string,
      body: { dossier_recu: boolean; notes_reception?: string; visite_dossier_id?: string },
    ) =>
      api.patch(`/dossiers-credit/${dossierId}/cautionnaires/${cautionId}/reception-dossier`, body),

    payerEcheance: (
      dossierId: string,
      echeanceId: string,
      data: { montant_paye: number; canal?: string; notes?: string; date_paiement?: string },
    ) => api.post(`/dossiers-credit/${dossierId}/echeancier/${echeanceId}/payer`, data),

    avisCharge: (id: string, data: AvisChargePayload) =>
      api.patch<DossierCreditDetail>(`/dossiers-credit/${id}/avis-charge`, data),

    decisionRoc: (id: string, data: DecisionRocPayload) =>
      api.patch<DossierCreditDetail>(`/dossiers-credit/${id}/decision-roc`, data),

    comiteCredit: (id: string, data: ComiteCreditPayload) =>
      api.patch<ComiteCreditResponse>(`/dossiers-credit/${id}/comite-credit`, data),

    annuler: (id: string, data: { motif: string }) =>
      api.patch(`/dossiers-credit/${id}/annuler`, data),
  },
}
