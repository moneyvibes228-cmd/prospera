import { REGISTRE_RELANCES } from './registries/relances-registry'
import { scopeDocumentsPdv, perimetreDe, type HubContext } from './hub-context'

export function getRelancesHub(ctx?: HubContext) {
  const relances = scopeDocumentsPdv(REGISTRE_RELANCES, ctx)

  return {
    relances,
    perimetre: perimetreDe(ctx),
    planifiees: relances.filter(r => r.statut === 'PLANIFIEE' || r.statut === 'DETECTION'),
    envoyees: relances.filter(r => r.statut === 'ENVOYEE'),
    urgentes: relances.filter(r => r.priorite === 'CRITIQUE' || r.priorite === 'HAUTE'),
    contentieux: relances.filter(r => r.statut === 'ECHEC'),
  }
}
