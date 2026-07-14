import { REGISTRE_FACTURES } from './registries/factures-registry'
import { scopeDocumentsPdv, perimetreDe, type HubContext } from './hub-context'

export function getFacturationHub(ctx?: HubContext) {
  const factures = scopeDocumentsPdv(REGISTRE_FACTURES, ctx)

  const impayees = factures.filter(f => f.statut === 'EN_RETARD' || f.statut === 'PARTIELLE')
  return {
    factures,
    impayees,
    perimetre: perimetreDe(ctx),
    totalImpaye: impayees.reduce((s, f) => s + (f.montant - f.paye), 0),
  }
}
