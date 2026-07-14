/**
 * Garde-fou anti-stock-mort — l'IA qui dit non avant l'achat.
 *
 * Le moteur de réappro sait très bien répondre à « combien commander pour ne pas tomber en
 * rupture ». C'est la moitié de la question. L'autre moitié — « et si je n'en vends pas ? » —
 * n'était posée nulle part, et c'est exactement là que naissent les quatre stocks morts.
 *
 * Ce module intercepte donc toute quantité **avant** qu'elle ne soit commandée, et lui applique
 * quatre contrôles, un par cause. Chacun peut **écrêter la quantité** ou **refuser la ligne** :
 *
 *   1. DLC     — on ne commande jamais plus que ce qu'on peut vendre avant péremption.
 *   2. Saison  — on ne réassortit pas un produit saisonnier hors de sa fenêtre de vente.
 *   3. Fin de vie commerciale — on ne réassortit pas un produit dont l'événement est passé.
 *   4. Remise volume — on ne prend une palette de plus que si la remise dépasse ce que
 *      le portage du surplus va coûter. C'est le piège le plus coûteux, parce qu'il se
 *      présente comme une bonne affaire.
 *
 * La règle d'or : le garde-fou ne remplace jamais l'acheteur, il l'oblige à voir le coût
 * caché. Il écrête tout seul ; il ne refuse qu'en le disant.
 */

import { REGISTRE_STOCK } from './registries/stock-registry'
import { getFicheLogistique } from './registries/entrepot-logistique-registry'
import {
  getProfilProduit, estEnSaison, moisAvantFinDeSaison,
} from './registries/profil-produit-registry'
import { DATE_DU_JOUR } from './reappro-engine'
import { COUT_PORTAGE_ANNUEL } from './transferts-engine'

export type MotifGardeFou = 'DLC' | 'SAISON' | 'FIN_DE_VIE' | 'REMISE_PIEGE' | 'COUVERTURE_EXCESSIVE'

export type VerdictGardeFou = 'PASSE' | 'ECRETE' | 'REFUSE'

export interface AlerteGardeFou {
  motif: MotifGardeFou
  verdict: VerdictGardeFou
  /** Ce que le moteur de réappro voulait commander. */
  quantite_demandee: number
  /** Ce que le garde-fou autorise réellement. */
  quantite_retenue: number
  /** Le capital que l'écrêtage vient d'éviter d'immobiliser. */
  capital_evite: number
  /** La perte qu'il aurait fallu constater plus tard. */
  perte_evitee: number
  explication: string
  action: string
}

export interface ControleAchat {
  produit_ref: string
  produit_nom: string
  quantite_initiale: number
  quantite_corrigee: number
  verdict: VerdictGardeFou
  alertes: AlerteGardeFou[]
  /** Total du capital que le garde-fou a empêché d'immobiliser sur cette ligne. */
  capital_evite: number
  perte_evitee: number
}

/** Marge de sécurité : on ne veut pas couvrir plus de 70 % de la DLC — le reste part en rayon. */
const PART_DLC_UTILISABLE = 0.7
/** Au-delà, une commande crée mécaniquement du surstock, quelle que soit sa justification. */
const COUVERTURE_MAX_ACCEPTABLE_J = 60

function vitesseJour(ref: string): number {
  const p = REGISTRE_STOCK.find(x => x.reference === ref)
  if (!p) return 0
  return (p.ventes_30j ?? p.seuil * 3) / 30
}

/**
 * Le contrôle. On part de la quantité voulue et on la rabote, contrôle après contrôle :
 * c'est toujours la contrainte la plus serrée qui gagne.
 */
export function controlerAchat(
  produitRef: string,
  quantiteDemandee: number,
  options: { remise_volume_pct?: number; prix_achat?: number } = {},
): ControleAchat {
  const produit = REGISTRE_STOCK.find(p => p.reference === produitRef)
  const fiche = getFicheLogistique(produitRef)

  if (!produit || !fiche) {
    return {
      produit_ref: produitRef,
      produit_nom: produitRef,
      quantite_initiale: quantiteDemandee,
      quantite_corrigee: quantiteDemandee,
      verdict: 'PASSE',
      alertes: [],
      capital_evite: 0,
      perte_evitee: 0,
    }
  }

  const profil = getProfilProduit(produitRef, produit.categorie)
  const cout = options.prix_achat ?? fiche.cout_achat
  const vitesse = vitesseJour(produitRef)
  const alertes: AlerteGardeFou[] = []

  let quantite = quantiteDemandee

  /* 1 — Fin de vie commerciale. Le contrôle le plus brutal : il refuse tout. */
  if (profil.fin_de_vie_commerciale && profil.fin_de_vie_commerciale < DATE_DU_JOUR) {
    alertes.push({
      motif: 'FIN_DE_VIE',
      verdict: 'REFUSE',
      quantite_demandee: quantite,
      quantite_retenue: 0,
      capital_evite: quantite * cout,
      perte_evitee: Math.round(quantite * cout * 0.4),
      explication: `La fenêtre commerciale de ce produit s'est fermée le ${profil.fin_de_vie_commerciale}. `
        + `Il n'est pas périmé — il est invendable au prix normal. Le stock actuel de ${produit.stock.toLocaleString('fr-FR')} u. `
        + 'ne s\'écoulera déjà qu\'en soldes.',
      action: 'Réappro refusé. La règle de ce produit doit passer en ALERTE_SEULE et le stock résiduel partir en liquidation.',
    })
    quantite = 0
  }

  /* 2 — Saison. On ne remplit pas un entrepôt hors de la fenêtre de vente. */
  if (quantite > 0 && profil.saisonnalite === 'SAISONNIER' && !estEnSaison(profil, DATE_DU_JOUR)) {
    alertes.push({
      motif: 'SAISON',
      verdict: 'REFUSE',
      quantite_demandee: quantite,
      quantite_retenue: 0,
      capital_evite: quantite * cout,
      perte_evitee: Math.round(quantite * cout * COUT_PORTAGE_ANNUEL * 0.5),
      explication: 'Produit saisonnier hors de sa fenêtre de vente. Le commander maintenant, c\'est payer '
        + 'son portage pendant des mois avant la première vente.',
      action: 'Réappro reporté à l\'ouverture de la saison — le moteur le relancera automatiquement le moment venu.',
    })
    quantite = 0
  }

  /* 3 — DLC. On ne commande jamais plus que ce qu'on peut vendre avant qu'il ne périme. */
  if (quantite > 0 && fiche.dlc_jours != null && vitesse > 0) {
    // Ce que le réseau peut réellement écouler pendant la durée de vie utile du lot.
    const ecoulable = Math.floor(vitesse * fiche.dlc_jours * PART_DLC_UTILISABLE)
    const plafond = Math.max(0, ecoulable - produit.stock)

    if (quantite > plafond) {
      const surplus = quantite - plafond
      alertes.push({
        motif: 'DLC',
        verdict: plafond > 0 ? 'ECRETE' : 'REFUSE',
        quantite_demandee: quantite,
        quantite_retenue: plafond,
        capital_evite: surplus * cout,
        // Ce qui dépasse la DLC ne se déprécie pas : il se jette. Perte sèche, 100 %.
        perte_evitee: surplus * cout,
        explication: `DLC de ${fiche.dlc_jours} j pour une rotation de ${vitesse.toFixed(1)} u./jour : le réseau ne peut `
          + `écouler que ${ecoulable.toLocaleString('fr-FR')} u. avant péremption, et il en reste déjà `
          + `${produit.stock.toLocaleString('fr-FR')} en stock. Commander ${quantite.toLocaleString('fr-FR')} u. revient à `
          + `en jeter ${surplus.toLocaleString('fr-FR')}.`,
        action: plafond > 0
          ? `Quantité écrêtée à ${plafond.toLocaleString('fr-FR')} u. — commandes plus fréquentes et plus petites sur ce produit frais.`
          : 'Réappro refusé : le stock présent couvre déjà toute la durée de vie du produit.',
      })
      quantite = plafond
    }
  }

  /* 4 — Couverture excessive. Le filet de sécurité générique. */
  if (quantite > 0 && vitesse > 0) {
    const couvertureApres = (produit.stock + quantite) / vitesse
    if (couvertureApres > COUVERTURE_MAX_ACCEPTABLE_J) {
      const plafond = Math.max(0, Math.floor(vitesse * COUVERTURE_MAX_ACCEPTABLE_J) - produit.stock)
      const surplus = quantite - plafond

      if (surplus > 0) {
        const joursExcedent = couvertureApres - COUVERTURE_MAX_ACCEPTABLE_J
        alertes.push({
          motif: 'COUVERTURE_EXCESSIVE',
          verdict: plafond > 0 ? 'ECRETE' : 'REFUSE',
          quantite_demandee: quantite,
          quantite_retenue: plafond,
          capital_evite: surplus * cout,
          perte_evitee: Math.round(surplus * cout * COUT_PORTAGE_ANNUEL * (joursExcedent / 365)),
          explication: `Cette commande porterait la couverture à ${Math.round(couvertureApres)} j, pour une cible de `
            + `${COUVERTURE_MAX_ACCEPTABLE_J} j. Le surplus dormirait ${Math.round(joursExcedent)} j en entrepôt.`,
          action: `Quantité écrêtée à ${plafond.toLocaleString('fr-FR')} u.`,
        })
        quantite = plafond
      }
    }
  }

  /* 5 — Le piège de la remise volume. Il se présente comme une bonne affaire. */
  const remise = options.remise_volume_pct ?? 0
  if (quantite > 0 && remise > 0 && vitesse > 0) {
    const couvertureApres = (produit.stock + quantite) / vitesse
    const joursExcedent = Math.max(0, couvertureApres - COUVERTURE_MAX_ACCEPTABLE_J)

    if (joursExcedent > 0) {
      const gainRemise = Math.round(quantite * cout * (remise / 100))
      const coutPortage = Math.round(quantite * cout * COUT_PORTAGE_ANNUEL * (joursExcedent / 365))

      if (coutPortage > gainRemise) {
        alertes.push({
          motif: 'REMISE_PIEGE',
          verdict: 'ECRETE',
          quantite_demandee: quantite,
          quantite_retenue: quantite,
          capital_evite: 0,
          perte_evitee: coutPortage - gainRemise,
          explication: `La remise volume de ${remise} % rapporte ${gainRemise.toLocaleString('fr-FR')} F. Mais elle impose `
            + `${Math.round(joursExcedent)} j de couverture excédentaire, qui coûteront ${coutPortage.toLocaleString('fr-FR')} F `
            + `de portage. La « bonne affaire » perd ${(coutPortage - gainRemise).toLocaleString('fr-FR')} F.`,
          action: 'Négocier la remise sur un engagement annuel plutôt que sur une commande unique — même prix, sans le stock.',
        })
      }
    }
  }

  const verdict: VerdictGardeFou = quantite === 0 && quantiteDemandee > 0
    ? 'REFUSE'
    : quantite < quantiteDemandee ? 'ECRETE' : 'PASSE'

  return {
    produit_ref: produitRef,
    produit_nom: produit.nom,
    quantite_initiale: quantiteDemandee,
    quantite_corrigee: quantite,
    verdict,
    alertes,
    capital_evite: alertes.reduce((s, a) => s + a.capital_evite, 0),
    perte_evitee: alertes.reduce((s, a) => s + a.perte_evitee, 0),
  }
}

/**
 * Le garde-fou appliqué à tout ce que le moteur de réappro s'apprête à commander.
 * C'est le point d'intégration : rien ne part chez un fournisseur sans passer par ici.
 */
export function controlerCommandesSuggerees(
  lignes: { produit_ref: string; quantite: number; remise_volume_pct?: number; prix_achat?: number }[],
): ControleAchat[] {
  return lignes
    .map(l => controlerAchat(l.produit_ref, l.quantite, {
      remise_volume_pct: l.remise_volume_pct,
      prix_achat: l.prix_achat,
    }))
    .filter(c => c.alertes.length > 0)
}

/**
 * Réappro d'un saisonnier : au lieu de refuser sèchement, le moteur dit **quand** commander.
 * C'est ce qui transforme un garde-fou en assistant.
 */
export function prochaineFenetreAchat(produitRef: string): { mois: number; libelle: string } | null {
  const produit = REGISTRE_STOCK.find(p => p.reference === produitRef)
  const profil = getProfilProduit(produitRef, produit?.categorie)
  if (profil.mois_de_vente.length === 0) return null

  const moisActuel = new Date(DATE_DU_JOUR).getMonth() + 1
  const NOMS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

  // On commande un mois avant l'ouverture : le temps que le fournisseur livre.
  const ouverture = Math.min(...profil.mois_de_vente)
  const moisAchat = ouverture === 1 ? 12 : ouverture - 1

  return {
    mois: moisAchat,
    libelle: moisAchat === moisActuel
      ? `Fenêtre d'achat ouverte — la saison démarre en ${NOMS[ouverture - 1]}.`
      : `Prochaine fenêtre d'achat : ${NOMS[moisAchat - 1]}, pour une saison qui démarre en ${NOMS[ouverture - 1]}.`,
  }
}

export { moisAvantFinDeSaison }
