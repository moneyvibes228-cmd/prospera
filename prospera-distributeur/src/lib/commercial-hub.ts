import { REGISTRE_COMMERCIAUX, getCommercialByNom } from './registries/commerciaux-registry'
import { perimetreDe, type HubContext } from './hub-context'

/**
 * Hub commerciaux — l'équipe visible dépend du périmètre : un superviseur voit
 * les commerciaux de sa zone, un responsable des ventes ceux de sa région,
 * un commercial ne voit que lui-même, la direction voit le réseau.
 */
export function getCommercialHub(ctx?: HubContext) {
  const perimetre = perimetreDe(ctx)

  const commerciaux = perimetre.estReseau
    ? [...REGISTRE_COMMERCIAUX]
    : REGISTRE_COMMERCIAUX.filter(c => perimetre.equipe.includes(c.nom))

  return {
    commerciaux,
    perimetre,
    moi: ctx?.nom ? getCommercialByNom(ctx.nom) : undefined,
    freelances: commerciaux.filter(c => c.type === 'FREELANCE'),
    salaries: commerciaux.filter(c => c.type === 'SALARIE'),
  }
}
