import { REGISTRE_PDV, getPdvById } from './registries/pdv-registry'
import { PIPELINE_LABELS_REGISTRY } from './registries/entreprise-registry'
import { scopeAuPerimetre, perimetreDe, type HubContext } from './hub-context'

export function getPdvHub(ctx?: HubContext) {
  const points = scopeAuPerimetre(REGISTRE_PDV, ctx)
  return {
    points,
    total: points.length,
    perimetre: perimetreDe(ctx),
    pipelineLabels: PIPELINE_LABELS_REGISTRY,
    getById: (id: string) => getPdvById(id),
  }
}
