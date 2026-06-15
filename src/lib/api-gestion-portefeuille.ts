import { api } from '@/lib/api'
import type {
  ActionRecouvrementLigne,
  PortefeuilleGpDossier,
  PromessePaiement,
  PromesseStatut,
} from '@/types/gestion-portefeuille'

export const gestionPortefeuille = {
  portefeuille: () => api.get<PortefeuilleGpDossier[]>('/gestion-portefeuille/portefeuille'),

  mauvaisPayeurs: () => api.get<PortefeuilleGpDossier[]>('/gestion-portefeuille/mauvais-payeurs'),

  relanceEmail: (dossierId: string, body?: { echeanceId?: string }) =>
    api.post(`/gestion-portefeuille/dossiers/${dossierId}/relance-email`, body ?? {}),

  listPromesses: (dossierId: string) =>
    api.get<PromessePaiement[]>(`/gestion-portefeuille/dossiers/${dossierId}/promesses`),

  createPromesse: (
    dossierId: string,
    body: {
      montant_promis: number
      date_promesse: string
      echeanceId?: string
      agent_suivi_id?: string
      notes?: string
    },
  ) => api.post<PromessePaiement>(`/gestion-portefeuille/dossiers/${dossierId}/promesses`, body),

  patchPromesse: (promesseId: string, body: { statut: PromesseStatut; notes?: string }) =>
    api.patch<PromessePaiement>(`/gestion-portefeuille/promesses/${promesseId}`, body),

  actions: (dossierId: string) =>
    api.get<ActionRecouvrementLigne[]>(`/gestion-portefeuille/dossiers/${dossierId}/actions`),
}
