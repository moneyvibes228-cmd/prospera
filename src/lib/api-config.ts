/** URL de base API — normalise vers `/api/v1` (cf. API_MICROFINANCE_PHASE1.md) */
export function resolveApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:3001'
  const base = raw.replace(/\/$/, '')

  // Chemin relatif : même hôte que le front (localhost ou tunnel ngrok + rewrite dev)
  if (base === '/api/v1' || base === '/api') {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/v1`
    }
    const proxy =
      process.env.API_PROXY_TARGET?.replace(/\/$/, '') || 'http://127.0.0.1:3001'
    return `${proxy}/api/v1`
  }

  if (base.endsWith('/api/v1')) return base
  return `${base}/api/v1`
}

export const API_PHASE1_ENABLED =
  process.env.NEXT_PUBLIC_USE_API_PHASE1 !== 'false'

/** Processus crédit Phase 2 — dossiers, workflow, ROC → comité */
export const API_CREDIT_PHASE2_ENABLED =
  process.env.NEXT_PUBLIC_USE_CREDIT_API === 'true'

/**
 * Dashboards + agrégats Phases A–D (pipeline, collecte, transactions, ops hubs).
 * Activé explicitement ou avec l’API crédit.
 */
export const API_PHASES_AD_ENABLED =
  process.env.NEXT_PUBLIC_USE_API_PHASES_AD === 'true' || API_CREDIT_PHASE2_ENABLED

export type DataSourceMode = 'mock' | 'api'

export function getCreditDataSource(): DataSourceMode {
  return API_CREDIT_PHASE2_ENABLED ? 'api' : 'mock'
}

export function getPhasesAdDataSource(): DataSourceMode {
  return API_PHASES_AD_ENABLED ? 'api' : 'mock'
}
