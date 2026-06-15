/** Source de données de la session — mock local vs API backend */

export type SessionSource = 'mock' | 'api'

const STORAGE_KEY = 'prospera_session_source'

export function saveSessionSource(source: SessionSource): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, source)
}

export function getSessionSource(): SessionSource | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'mock' || v === 'api' ? v : null
}

export function clearSessionSource(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
