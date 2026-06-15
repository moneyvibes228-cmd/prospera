/** Le RA / directeur d'agence n'est pas un agent terrain */
export function isResponsableAgence(role?: string): boolean {
  const r = (role ?? '').toLowerCase()
  return (
    r.includes('resp') ||
    r.includes('directeur') ||
    r.includes('chef d') ||
    r.includes('ra ') ||
    r === 'ra'
  )
}

/** Gestionnaire de portefeuille — suivi crédit guichet (≠ commercial terrain) */
export function isGestionnairePortefeuille(role?: string): boolean {
  if (isResponsableAgence(role)) return false
  const r = (role ?? '').toLowerCase()
  return (
    r === 'gp' ||
    r.includes('gp ') ||
    r.includes('gestionnaire portefeuille') ||
    r.includes('portefeuille') ||
    r.includes('guichet')
  )
}

/** Agent terrain = commercial / recouvrement terrain (hors RA et GP guichet) */
export function isAgentTerrain(role?: string): boolean {
  if (isResponsableAgence(role)) return false
  const r = (role ?? '').toLowerCase()
  if (
    r.includes('gp') ||
    r.includes('gestionnaire portefeuille') ||
    r.includes('portefeuille') ||
    r.includes('guichet')
  ) {
    return false
  }
  return (
    r.includes('commercial') ||
    r.includes('terrain') ||
    r.includes('recouvrement')
  )
}
