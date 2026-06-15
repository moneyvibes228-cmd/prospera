/** Marque & modes — analyse crédit Prospera IA (ex-Claude dans l’UI) */

export type ProsperaIaAnalyseMode = 'PROSPERA_IA_API' | 'FALLBACK_LOCAL'

/** Compatibilité réponses API historiques (`PROSPERA_IA_API`) */
export function normalizeProsperaIaMode(
  mode?: string | null,
): ProsperaIaAnalyseMode {
  if (mode === 'PROSPERA_IA_API' || mode === 'PROSPERA_IA_API') return 'PROSPERA_IA_API'
  return 'FALLBACK_LOCAL'
}

export const PROSPERA_IA_LABEL = 'Prospera IA'

export function prosperaIaModeLabel(mode: ProsperaIaAnalyseMode): string {
  return mode === 'PROSPERA_IA_API' ? PROSPERA_IA_LABEL : 'Analyse locale'
}
