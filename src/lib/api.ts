import axios from 'axios'
import type { DashboardKpis, KpiSnapshot, Borrower, Visit, User } from '@/types'
import { resolveApiBaseUrl } from '@/lib/api-config'
import { getSessionSource } from '@/lib/session-source'

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('prospera_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      !window.location.pathname.startsWith('/login')
    ) {
      const source = getSessionSource()
      const hadToken = !!localStorage.getItem('prospera_token')

      // Session mock ou sans JWT : ne pas expulser l'utilisateur sur un 401 API
      if (source === 'mock' || !hadToken) {
        return Promise.reject(error)
      }

      localStorage.removeItem('prospera_token')
      localStorage.removeItem('prospera_user')
      localStorage.removeItem('prospera_session_source')
      const url = new URL('/login', window.location.origin)
      url.searchParams.set('reason', 'session_expired')
      window.location.href = url.toString()
    }
    return Promise.reject(error)
  },
)

export const endpoints = {
  /** @deprecated Préférer phase1.auth.login({ identifiant, password }) */
  login: (data: { identifiant: string; password: string }) =>
    api.post('/auth/login', data),

  kpis: () => api.get<DashboardKpis>('/kpis/dashboard'),
  kpisHistorique: () => api.get<KpiSnapshot[]>('/kpis/historique'),

  borrowers: (params?: {
    statut?: string; zone?: string; agentId?: string;
    scoreMin?: number; scoreMax?: number; page?: number
  }) => api.get('/borrowers', { params }),
  borrower: (id: string) => api.get(`/borrowers/${id}`),
  updateBorrower: (id: string, data: Partial<Borrower>) =>
    api.patch(`/borrowers/${id}`, data),

  alertes: (severity?: string) =>
    api.get('/alertes', { params: { severity } }),

  visits: (params?: { agentId?: string; statut?: string; periode?: string }) =>
    api.get('/visits', { params }),
  visitCreate: (data: Omit<Visit, 'id' | 'createdAt'>) =>
    api.post('/visits', data),
  visitNearby: (lat: number, lng: number, radius?: number) =>
    api.get('/visits/nearby', { params: { lat, lng, radius: radius ?? 50 } }),
  visitHistory: (borrowerId?: string) =>
    api.get('/visits/history', { params: { borrowerId } }),
  revisitReady: () => api.get('/visits/revisit'),

  loans: (stage?: string) => api.get('/loans', { params: { stage } }),
  loanUpdateStage: (id: string, stage: string) =>
    api.patch(`/loans/${id}/stage`, { stage }),

  reminders: () => api.get('/reminders'),
  reminderTrigger: (id: string) =>
    api.post(`/reminders/${id}/trigger`),

  teamPerformance: () => api.get('/team/performance'),

  users: () => api.get('/users'),
  userCreate: (data: Partial<User>) => api.post('/users', data),
  userToggle: (id: string, actif: boolean) =>
    api.patch(`/users/${id}`, { actif }),
}
