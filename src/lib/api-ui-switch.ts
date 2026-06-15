/**
 * Bascule UI mock ↔ pages/composants *WithApi (sans mélange des deux sources).
 * Quand `NEXT_PUBLIC_USE_API_UI=true`, les pages mock redirigent vers les routes `-with-api`.
 */
import { API_CREDIT_PHASE2_ENABLED, API_PHASES_AD_ENABLED } from '@/lib/api-config'

/** Active les routes et composants suffixés WithApi */
export const API_UI_ENABLED =
  process.env.NEXT_PUBLIC_USE_API_UI === 'true' ||
  process.env.NEXT_PUBLIC_USE_API_PHASES_AD === 'true' ||
  API_CREDIT_PHASE2_ENABLED

/** Chemin mock → chemin version API (segment de route) */
export const API_ROUTE_PAIRS: Record<string, string> = {
  '/dashboard': '/dashboard-with-api',
  '/credit/recouvrement': '/credit/recouvrement-with-api',
  '/credit/reseau': '/credit/reseau-with-api',
  '/equipe': '/equipe-with-api',
  '/caisse': '/caisse-with-api',
  '/credit/cycle': '/credit/cycle-with-api',
  '/operations-bancaires': '/operations-bancaires-with-api',
  '/relances': '/relances-with-api',
  '/credit/pipeline': '/credit/pipeline-with-api',
  '/terrain': '/terrain-with-api',
  '/portefeuille': '/portefeuille-with-api',
  '/credit/dossiers': '/credit/dossiers-with-api',
}

export function getApiRouteForMockPath(mockPath: string): string | null {
  const normalized = mockPath.split('?')[0]?.replace(/\/$/, '') || ''
  return API_ROUTE_PAIRS[normalized] ?? null
}

export function getMockRouteForApiPath(apiPath: string): string | null {
  const normalized = apiPath.split('?')[0]?.replace(/\/$/, '') || ''
  for (const [mock, api] of Object.entries(API_ROUTE_PAIRS)) {
    if (api === normalized) return mock
  }
  return null
}

/** Après login : route mock ou `-with-api` selon la session */
export function resolveRedirectForSession(path: string, source: 'mock' | 'api'): string {
  const qIdx = path.indexOf('?')
  const base = (qIdx >= 0 ? path.slice(0, qIdx) : path).replace(/\/$/, '') || '/'
  const suffix = qIdx >= 0 ? path.slice(qIdx) : ''

  if (source === 'api') {
    const mockBase = getMockRouteForApiPath(base) ?? base
    return (getApiRouteForMockPath(mockBase) ?? base) + suffix
  }

  return (getMockRouteForApiPath(base) ?? base) + suffix
}
