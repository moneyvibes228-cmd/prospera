import type { UserRole } from '@distributeur/types'
import {
  getPerimetre,
  filtrerParPerimetre,
  estRolePortefeuille,
  estRoleTerritoire,
  type Perimetre,
} from './perimetre'
import { REGISTRE_PDV } from './registries/pdv-registry'

/** Zone du PDV par identifiant — les noms de PDV ne sont pas uniques. */
const ZONE_PAR_PDV = new Map(REGISTRE_PDV.map(p => [p.id, p.zone]))

/** Contexte passé aux hubs pour filtrer selon le persona connecté. */
export interface HubContext {
  role?: UserRole
  nom?: string
  /** Rattachement de secours, si l'utilisateur n'est pas dans l'organigramme. */
  zones?: string[]
}

export { estRolePortefeuille, estRoleTerritoire }

/** @deprecated Utiliser `estRolePortefeuille`. */
export function isPortefeuilleRole(role?: UserRole): boolean {
  return estRolePortefeuille(role)
}

/** Le périmètre de données du contexte — réseau entier si aucun contexte. */
export function perimetreDe(ctx?: HubContext): Perimetre {
  return getPerimetre(ctx)
}

/**
 * Filtre de référence des hubs : restreint une collection au périmètre du
 * persona connecté. Un commercial voit son portefeuille, un superviseur sa
 * zone, un responsable des ventes sa région, la direction voit le réseau.
 */
export function scopeAuPerimetre<T extends { zone?: string; commercial?: string }>(
  items: readonly T[],
  ctx?: HubContext,
): T[] {
  return filtrerParPerimetre(items, perimetreDe(ctx))
}

/** @deprecated Ne filtrait que les rôles portefeuille — utiliser `scopeAuPerimetre`. */
export function filterByCommercial<T extends { commercial: string }>(
  items: readonly T[],
  ctx?: HubContext,
): T[] {
  return scopeAuPerimetre(items, ctx)
}

export function filterByPdvNom<T extends { pdv_nom: string }>(
  items: readonly T[],
  pdvNoms: ReadonlySet<string>,
): T[] {
  return items.filter(i => pdvNoms.has(i.pdv_nom))
}

/**
 * Scope des documents rattachés à un PDV (factures, relances).
 *
 * On rattache par `pdv_id`, jamais par `pdv_nom` : les noms de points de vente
 * ne sont pas uniques (« Boutique Mensah » existe dans plusieurs zones), et un
 * filtre par nom ramasse les homonymes des autres territoires — un commercial
 * se retrouvait avec plus de relances que sa zone entière n'en comptait.
 *
 * La `zone` du document est facultative ; on la retrouve alors via le PDV, sans
 * quoi un impayé sans zone échapperait au superviseur censé le recouvrer.
 */
export function scopeDocumentsPdv<
  T extends { pdv_nom: string; pdv_id?: string; zone?: string; commercial?: string },
>(
  items: readonly T[],
  ctx?: HubContext,
): T[] {
  const p = perimetreDe(ctx)
  if (p.estReseau) return [...items]

  if (p.type === 'PORTEFEUILLE') {
    const mesPdv = new Set(
      REGISTRE_PDV.filter(pdv => p.equipe.includes(pdv.commercial)).map(pdv => pdv.id),
    )
    return items.filter(i => {
      if (i.commercial != null) return p.equipe.includes(i.commercial)
      return i.pdv_id != null && mesPdv.has(i.pdv_id)
    })
  }

  return items.filter(i => {
    const zone = i.zone ?? (i.pdv_id != null ? ZONE_PAR_PDV.get(i.pdv_id) : undefined)
    return zone != null && p.zones.includes(zone)
  })
}
