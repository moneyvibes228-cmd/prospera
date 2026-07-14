/**
 * Helpers de persistance localStorage — socle générique réutilisé par tous les
 * workflows (terrain, validations, recouvrement…). Généralise le pattern
 * introduit par le workflow « Combos stock » (le seul câblé de bout en bout).
 *
 * Toutes les lectures/écritures sont défensives (SSR-safe + try/catch quota).
 */

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota dépassé / mode privé : on ignore silencieusement */
  }
}

/** Identifiant court, stable pour une session — suffisant pour des mocks. */
export function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Horodatage ISO courant. */
export function nowIso(): string {
  return new Date().toISOString()
}
