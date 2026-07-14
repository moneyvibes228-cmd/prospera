import { REGISTRE_COMMANDES } from './registries/commandes-registry'
import { scopeAuPerimetre, perimetreDe, type HubContext } from './hub-context'

export function getCommandesHub(ctx?: HubContext) {
  const commandes = scopeAuPerimetre(REGISTRE_COMMANDES, ctx)
  return {
    commandes,
    total: commandes.length,
    perimetre: perimetreDe(ctx),
    caSociete: commandes.reduce((s, c) => s + c.montant_societe, 0),
    caClient: commandes.reduce((s, c) => s + (c.montant_client ?? c.montant_societe), 0),
    margeFreelance: commandes.reduce((s, c) => s + (c.marge_freelance ?? 0), 0),
  }
}
