import {
  REGISTRE_ZONES_CONQUETE,
  REGISTRE_PROSPECTS,
  REGISTRE_OUVERTURES,
} from './registries/prospection-registry'
import { filterByCommercial, type HubContext } from './hub-context'

/**
 * Hub conquête — territoires, prospects et ouvertures du persona connecté.
 *
 * Comme les autres hubs à portefeuille : sans contexte (ou pour un rôle d'encadrement),
 * on rend tout le réseau ; pour un prospecteur, uniquement son périmètre. C'est le
 * `ctx` qui manquait au dashboard prospection, qui servait donc la vue du DG.
 */
export function getProspectionHub(ctx?: HubContext) {
  const zones = filterByCommercial(REGISTRE_ZONES_CONQUETE, ctx)
  const prospects = filterByCommercial(REGISTRE_PROSPECTS, ctx)
  const ouvertures = filterByCommercial(REGISTRE_OUVERTURES, ctx)

  return {
    zones,
    prospects,
    ouvertures,
    getProspectById: (id: string) => prospects.find(p => p.id === id),
    getZoneById: (id: string) => zones.find(z => z.id === id),
  }
}
