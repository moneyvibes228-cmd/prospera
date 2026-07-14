import type { Commande, CommandeStatut, PrioriteCommandeIA, TypeClientCommande } from '@distributeur/types'
import type { PointDeVente } from '@distributeur/types'
import { hashString, pick, randInt, seededRandom } from './mock-seed'

const STATUTS: CommandeStatut[] = ['LIVREE', 'VALIDEE', 'PREPARATION', 'BROUILLON', 'ANNULEE']
const FAMILLES = [['Boissons'], ['Alimentaire'], ['Boissons', 'Alimentaire'], ['Hygiène'], ['Boissons', 'Hygiène'], ['Alimentaire', 'Hygiène'], ['Boissons', 'Alimentaire', 'Hygiène']]

const TYPE_CLIENT: TypeClientCommande[] = ['DEPOT', 'GROSSISTE', 'SUPERETTE', 'EPICERIE', 'KIOSQUE', 'ENSEIGNE']

function typeClientFor(pdv: PointDeVente): TypeClientCommande {
  if (pdv.type_magasin === 'PROPRE') return 'ENSEIGNE'
  if (pdv.nom.toLowerCase().includes('dépôt') || pdv.nom.toLowerCase().includes('depot')) return 'DEPOT'
  if (pdv.nom.toLowerCase().includes('grossiste')) return 'GROSSISTE'
  if (pdv.nom.toLowerCase().includes('superette')) return 'SUPERETTE'
  if (pdv.nom.toLowerCase().includes('kiosque')) return 'KIOSQUE'
  return 'EPICERIE'
}

function montantFor(pdv: PointDeVente, rng: () => number): number {
  const base = pdv.ca_mois > 0 ? pdv.ca_mois / randInt(rng, 3, 8) : randInt(rng, 1_200_000, 4_500_000)
  return Math.round(Math.max(980_000, Math.min(12_500_000, base)) / 10_000) * 10_000
}

export function generateCommandes(pdvList: PointDeVente[], startRef = 4600): Commande[] {
  const actifs = pdvList.filter(p => p.ca_mois > 0 && p.pipeline !== 'PROSPECTION')
  const out: Commande[] = []
  let ref = startRef
  let id = 100

  for (const pdv of actifs) {
    const rng = seededRandom(hashString(`cmd-${pdv.id}`))
    const nbCmd = pdv.type_magasin === 'PROPRE' ? randInt(rng, 2, 4) : randInt(rng, 2, 5)

    for (let j = 0; j < nbCmd; j++) {
      const subRng = seededRandom(hashString(`cmd-${pdv.id}-${j}`))
      let statut = pick(subRng, STATUTS.filter(s => s !== 'ANNULEE'))
      let priorite: PrioriteCommandeIA = 'NORMALE'
      let alerte: string | undefined

      if (pdv.pipeline === 'A_RISQUE' || pdv.creance_jours > 30) {
        statut = subRng() < 0.6 ? 'BROUILLON' : 'VALIDEE'
        priorite = 'BLOQUEE'
        alerte = `Crédit bloqué — impayé ${Math.round(pdv.creance / 1000)} K J+${pdv.creance_jours}`
      } else if (pdv.creance > 0) {
        if (subRng() < 0.3) alerte = `Créance ${Math.round(pdv.creance / 1000)} K — livraison sous réserve`
      }

      const montant_societe = montantFor(pdv, subRng)
      const isFreelance = pdv.type_proprietaire === 'FREELANCE'
      const marge_pct = randInt(subRng, 128, 182) / 10
      const marge_freelance = isFreelance ? Math.round(montant_societe * randInt(subRng, 12, 22) / 100) : undefined
      const montant_client = isFreelance ? montant_societe + (marge_freelance ?? 0) : undefined

      if (montant_societe > 5_000_000 && priorite !== 'BLOQUEE') priorite = 'HAUTE'

      out.push({
        id: `cmd-gen-${id++}`,
        reference: `CMD-2026-${ref++}`,
        pdv_id: pdv.id,
        pdv_nom: pdv.nom,
        commercial: pdv.commercial,
        type_commercial: pdv.type_proprietaire,
        montant_societe,
        montant_client,
        marge_freelance,
        statut,
        date: subRng() < 0.85 ? '2026-06-11' : '2026-06-10',
        lignes: randInt(subRng, 8, 48),
        zone: pdv.zone,
        entrepot: pdv.entrepot_source,
        type_magasin: pdv.type_magasin,
        type_client: typeClientFor(pdv),
        marge_brute_pct: marge_pct,
        familles: pick(subRng, FAMILLES),
        priorite_ia: priorite,
        alerte,
      })
    }
  }

  return out.sort((a, b) => b.montant_societe - a.montant_societe)
}
