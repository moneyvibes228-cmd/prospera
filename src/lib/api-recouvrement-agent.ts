import { api } from '@/lib/api'
import type { AgentMissionsResponse } from '@/types/gestion-portefeuille'

export const recouvrementAgent = {
  missions: () => api.get<AgentMissionsResponse>('/recouvrement/agent/missions'),
}
