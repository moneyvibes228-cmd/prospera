import type { Facture, FactureStatut, LigneFacture } from '@/types'
import type { PointDeVente } from '@/types'
import { REGISTRE_STOCK } from '@/lib/registries/stock-registry'
import { hashString, pick, randInt, seededRandom } from './mock-seed'

function buildLignes(rng: () => number, montantCible: number): LigneFacture[] {
  const produits = [...REGISTRE_STOCK].sort(() => rng() - 0.5).slice(0, randInt(rng, 2, 5))
  const lignes: LigneFacture[] = produits.map(p => {
    const qte = randInt(rng, 24, 480)
    const remise = randInt(rng, 0, 8)
    const total = Math.round(qte * p.prix_unitaire * (1 - remise / 100))
    return {
      reference: p.reference,
      produit: p.nom,
      quantite: qte,
      prix_unitaire: p.prix_unitaire,
      remise_pct: remise,
      total,
    }
  })
  const sum = lignes.reduce((s, l) => s + l.total, 0)
  if (sum > 0 && montantCible > 0) {
    const ratio = montantCible / sum
    return lignes.map(l => ({ ...l, total: Math.round(l.total * ratio) }))
  }
  return lignes
}

function statutFor(creance_jours: number, payeRatio: number): FactureStatut {
  if (creance_jours > 30) return 'EN_RETARD'
  if (payeRatio >= 1) return 'PAYEE'
  if (payeRatio > 0) return 'PARTIELLE'
  return 'EMISE'
}

export function generateFactures(pdvList: PointDeVente[], startNum = 9000): Facture[] {
  const out: Facture[] = []
  let num = startNum
  let id = 500

  const avecCreance = pdvList.filter(p => p.creance > 0)
  const sains = pdvList.filter(p => p.creance === 0 && p.ca_mois > 500_000).slice(0, 220)

  for (const pdv of avecCreance) {
    const rng = seededRandom(hashString(`fac-${pdv.id}`))
    const nbFactures = pdv.creance > 3_000_000 ? randInt(rng, 2, 4) : 1
    let reste = pdv.creance

    for (let f = 0; f < nbFactures; f++) {
      const subRng = seededRandom(hashString(`fac-${pdv.id}-${f}`))
      const montant = f === nbFactures - 1 ? reste : Math.round(reste * randInt(subRng, 35, 65) / 100)
      reste -= montant
      const paye = pdv.creance_jours > 25 ? 0 : Math.round(montant * randInt(subRng, 0, 40) / 100)
      const jours_retard = Math.max(0, pdv.creance_jours - randInt(subRng, 0, 5))

      out.push({
        id: `f-gen-${id++}`,
        numero: `FAC-2026-${num++}`,
        pdv_id: pdv.id,
        pdv_nom: pdv.nom,
        montant,
        paye,
        statut: statutFor(jours_retard, paye / montant),
        echeance: `2026-${String(randInt(subRng, 3, 5)).padStart(2, '0')}-${String(randInt(subRng, 1, 28)).padStart(2, '0')}`,
        jours_retard,
        date_emission: '2026-05-15',
        commande_ref: `CMD-2026-${randInt(subRng, 4400, 4580)}`,
        zone: pdv.zone,
        commercial: pdv.commercial,
        type_magasin: pdv.type_magasin,
        entrepot: pdv.entrepot_source,
        type_client: pdv.type_magasin === 'PROPRE' ? 'ENSEIGNE' : 'EPICERIE',
        mode_paiement: pick(subRng, ['CREDIT_30J', 'CREDIT_45J', 'CREDIT_60J'] as const),
        plafond_credit: randInt(subRng, 2, 8) * 1_000_000,
        marge_facture_pct: randInt(subRng, 128, 175) / 10,
        score_risque_ia: pdv.score_ia,
        nb_relances: jours_retard > 20 ? randInt(subRng, 3, 10) : randInt(subRng, 0, 2),
        synthese_ia: jours_retard > 30
          ? `Encours ${Math.round(montant / 1000)} K en retard ${jours_retard}j — aligner recouvrement et blocage crédit.`
          : `Facture ouverte — relance standard sous 7j si non réglée.`,
        lignes: buildLignes(subRng, montant),
      })
    }
  }

  for (const pdv of sains) {
    const rng = seededRandom(hashString(`fac-ok-${pdv.id}`))
    if (rng() > 0.55) continue
    const montant = randInt(rng, 1_800_000, 6_500_000)
    out.push({
      id: `f-gen-${id++}`,
      numero: `FAC-2026-${num++}`,
      pdv_id: pdv.id,
      pdv_nom: pdv.nom,
      montant,
      paye: montant,
      statut: 'PAYEE',
      echeance: '2026-06-15',
      jours_retard: 0,
      date_emission: '2026-06-01',
      zone: pdv.zone,
      commercial: pdv.commercial,
      type_magasin: pdv.type_magasin,
      entrepot: pdv.entrepot_source,
      marge_facture_pct: 16,
      score_risque_ia: pdv.score_ia,
      nb_relances: 0,
      lignes: buildLignes(rng, montant),
    })
  }

  return out
}
