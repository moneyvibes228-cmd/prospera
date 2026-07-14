/**
 * Moteur de transferts inter-entrepôts — et santé du stock.
 *
 * Le réflexe d'un stock sous seuil, c'est de commander au fournisseur. C'est souvent
 * la mauvaise décision : quand Kara est en rupture de savon pendant que Lomé Port en
 * dort 400 cartons, la bonne réponse coûte un camion, pas une commande fournisseur —
 * et arrive en 1 jour au lieu de 12.
 *
 * Ce moteur cherche donc, AVANT le réappro fournisseur, ce que le réseau possède déjà :
 *   1. il apparie les excédents d'un entrepôt aux manques de l'autre ;
 *   2. il chiffre le transfert (camion, km) et le compare au coût de la commande ;
 *   3. il chiffre aussi le coût de NE RIEN faire — la rupture — car c'est ça, l'arbitrage.
 *
 * Il regarde ensuite la santé du stock dans l'autre sens : ce qui dort, ce qui va périmer,
 * ce qui immobilise de l'argent pour rien. Un distributeur meurt aussi de son surstock.
 */

import { REGISTRE_STOCK } from './registries/stock-registry'
import {
  REPARTITION_STOCK, stockDuSite, ligneDuSite, referencesDuSite, partDesVentes,
} from './registries/stock-reseau-registry'
import {
  getFicheLogistique, camionsDisponibles, TOPOLOGIE_ENTREPOTS,
} from './registries/entrepot-logistique-registry'
import { getRegleProduit } from './registries/regles-reappro-registry'
import { getFournisseursDuProduit } from './registries/produits-fournisseurs-registry'
import { getFournisseurById } from './registries/fournisseurs-registry'

/** Distance routière Lomé Port ↔ Kara — une navette, pas une tournée urbaine. */
const DISTANCE_INTER_ENTREPOTS_KM = 420
/** Un transfert n'a de sens que s'il reste de la marge de sécurité chez l'expéditeur. */
const COUVERTURE_MIN_EXPEDITEUR_J = 25
/** Au-delà, la couverture est du surstock : de l'argent qui dort en palettes. */
export const SEUIL_SURSTOCK_JOURS = 60
/** Sans sortie depuis ce délai, la référence est dormante. */
export const SEUIL_DORMANT_JOURS = 60

export type UrgenceTransfert = 'CRITIQUE' | 'HAUTE' | 'OPPORTUNITE'

export interface SuggestionTransfert {
  id: string
  produit_ref: string
  produit_nom: string
  categorie: string
  entrepot_source: string
  entrepot_destination: string
  quantite: number
  urgence: UrgenceTransfert

  /** Situation avant / après, des deux côtés — c'est ce que le responsable veut voir. */
  stock_source_avant: number
  stock_source_apres: number
  couverture_source_apres_j: number
  stock_dest_avant: number
  stock_dest_apres: number
  couverture_dest_avant_j: number
  couverture_dest_apres_j: number

  poids_kg: number
  palettes: number
  delai_transfert_j: number
  cout_transfert: number

  /** Ce que coûterait la même quantité commandée au fournisseur. */
  cout_reappro_fournisseur: number
  delai_reappro_j: number
  /** Ce que coûte l'inaction : ventes perdues pendant la rupture. */
  cout_rupture_evite: number
  /** Gain net du transfert vs commande fournisseur. */
  economie_nette: number

  justification: string
  /** Le moteur peut-il lancer le transfert seul ? */
  auto: boolean
}

export interface PlanTransferts {
  suggestions: SuggestionTransfert[]
  economie_totale: number
  ruptures_evitees: number
  cout_total: number
  /** Transferts que le moteur exécute seul, sans validation. */
  auto_executables: number
}

/* ------------------------------------------------------------------ */
/* Appariement excédent / manque                                       */
/* ------------------------------------------------------------------ */

/**
 * Vitesse d'écoulement **locale**. La demande du catalogue est nationale ; il faut la ramener
 * à la part que le site sert réellement, sinon on calculerait la couverture de Kara avec la
 * demande du pays entier et Kara paraîtrait perpétuellement en rupture.
 */
function vitesseJour(ref: string, entrepot: string): number {
  const p = REGISTRE_STOCK.find(x => x.reference === ref)
  if (!p) return 0
  const ventesReseau = (p.ventes_30j ?? p.seuil * 3) / 30
  return ventesReseau * partDesVentes(ref, entrepot)
}

function couverture(stock: number, vitesse: number): number {
  if (vitesse <= 0) return 999
  return Math.round((stock / vitesse) * 10) / 10
}

/** Coût d'un transfert : le camion disponible le moins cher, aller simple sur la navette. */
function coutTransfert(source: string, poidsKg: number): { cout: number; delai: number } {
  const camions = camionsDisponibles(source)
  // Un porteur pour la navette longue distance ; à défaut, ce qui reste.
  const camion = camions.find(c => c.type === 'PORTEUR') ?? camions[0]
  if (!camion) return { cout: 0, delai: 0 }

  const rotations = Math.max(1, Math.ceil(poidsKg / camion.charge_utile_kg))
  const cout = Math.round(
    rotations * (camion.cout_tournee_fcfa + DISTANCE_INTER_ENTREPOTS_KM * camion.cout_km_fcfa),
  )
  return { cout, delai: rotations > 1 ? 2 : 1 }
}

/** Ce que coûte une rupture : la marge perdue sur les ventes qu'on ne fera pas. */
function coutRupture(ref: string, entrepot: string, joursRupture: number): number {
  const produit = REGISTRE_STOCK.find(p => p.reference === ref)
  const fiche = getFicheLogistique(ref)
  if (!produit || !fiche) return 0
  const vitesse = vitesseJour(ref, entrepot) || vitesseJour(ref, produit.entrepot)
  const margeUnitaire = produit.prix_unitaire - fiche.cout_achat
  return Math.round(vitesse * joursRupture * margeUnitaire)
}

/**
 * Suggestions de transfert. On ne déplace du stock que si l'expéditeur garde une couverture
 * saine : déshabiller Lomé pour habiller Kara ne fait que déplacer la rupture.
 */
export function buildPlanTransferts(): PlanTransferts {
  const suggestions: SuggestionTransfert[] = []
  const sites = TOPOLOGIE_ENTREPOTS.map(t => t.entrepot)

  // On raisonne site par site, et non produit par produit : c'est un site qui tombe en
  // rupture, pas une référence. Une même référence peut être saine à Lomé et critique à Kara.
  for (const ligne of REPARTITION_STOCK) {
    const regle = getRegleProduit(ligne.produit_ref)
    const couvertureMin = regle?.couverture_min_jours ?? 7

    const vitesseIci = vitesseJour(ligne.produit_ref, ligne.entrepot)
    const couvertureIci = couverture(ligne.quantite, vitesseIci)

    // Ce site est-il en manque ? Sinon, rien à transférer vers lui.
    const enManque = ligne.quantite <= ligne.seuil || couvertureIci < couvertureMin
    if (!enManque) continue

    for (const source of sites.filter(s => s !== ligne.entrepot)) {
      const stockSource = stockDuSite(ligne.produit_ref, source)
      if (stockSource === 0) continue

      const vitesseSource = vitesseJour(ligne.produit_ref, source)
      const couvertureSource = couverture(stockSource, vitesseSource)

      // On ne prélève que sur un site confortable : déshabiller Pierre pour habiller Paul
      // ne fait que déplacer la rupture.
      const gardeSource = Math.ceil(vitesseSource * COUVERTURE_MIN_EXPEDITEUR_J)
      const disponible = Math.max(0, stockSource - gardeSource)
      if (disponible <= 0 || couvertureSource < COUVERTURE_MIN_EXPEDITEUR_J) continue

      // De quoi ramener le site en manque à sa couverture cible.
      const cible = Math.ceil(vitesseIci * Math.max(couvertureMin * 2, 14))
      const besoin = Math.max(0, cible - ligne.quantite)
      const quantite = Math.min(disponible, besoin)
      if (quantite <= 0) continue

      suggestions.push(construireSuggestion(ligne.produit_ref, source, ligne.entrepot, quantite))
    }
  }

  const economie = suggestions.reduce((s, x) => s + x.economie_nette, 0)
  return {
    suggestions: suggestions.sort((a, b) => ordreUrgence(a.urgence) - ordreUrgence(b.urgence) || b.economie_nette - a.economie_nette),
    economie_totale: economie,
    ruptures_evitees: suggestions.filter(s => s.urgence !== 'OPPORTUNITE').length,
    cout_total: suggestions.reduce((s, x) => s + x.cout_transfert, 0),
    auto_executables: suggestions.filter(s => s.auto).length,
  }
}

function ordreUrgence(u: UrgenceTransfert): number {
  return { CRITIQUE: 0, HAUTE: 1, OPPORTUNITE: 2 }[u]
}

function construireSuggestion(
  ref: string, source: string, destination: string, quantite: number,
): SuggestionTransfert {
  const produit = REGISTRE_STOCK.find(p => p.reference === ref)!
  const fiche = getFicheLogistique(ref)!
  const ligneDest = ligneDuSite(ref, destination)!

  const stockSource = stockDuSite(ref, source)
  const stockDest = ligneDest.quantite
  const seuilDest = ligneDest.seuil
  const vitesseSource = vitesseJour(ref, source)
  const vitesseDest = vitesseJour(ref, destination)

  const poids = Math.round(fiche.poids_kg * quantite)
  const { cout, delai } = coutTransfert(source, poids)

  // Coût de la même quantité commandée au fournisseur prioritaire.
  const refsFournisseur = getFournisseursDuProduit(ref)
  const prio = refsFournisseur.find(r => r.prioritaire) ?? refsFournisseur[0]
  const fournisseur = prio ? getFournisseurById(prio.fournisseur_id) : undefined
  const coutFournisseur = prio ? prio.prix_achat * quantite : fiche.cout_achat * quantite
  const delaiFournisseur = fournisseur?.delai_reel_moyen_j ?? prio?.delai_j ?? 12

  // La rupture dure le temps que met la solution la plus lente à arriver.
  const joursRuptureEvites = Math.max(0, delaiFournisseur - delai)
  const ruptureEvitee = coutRupture(ref, destination, joursRuptureEvites)

  // Le transfert ne rachète rien : la marchandise est déjà payée. On compare donc
  // le coût du camion au coût d'un réapprovisionnement, rupture comprise.
  const economie = Math.round(coutFournisseur + ruptureEvitee - cout)

  // Tout se juge sur le stock DU SITE en manque, jamais sur le stock national :
  // c'est le quai de Kara qui est vide, pas le pays.
  const couvertureDestAvant = couverture(stockDest, vitesseDest)
  const urgence: UrgenceTransfert = couvertureDestAvant < 3
    ? 'CRITIQUE'
    : stockDest <= seuilDest ? 'HAUTE' : 'OPPORTUNITE'

  // Le moteur exécute seul un transfert non critique et peu coûteux : c'est du stock
  // qui nous appartient déjà, il ne sort pas un franc de la trésorerie.
  const auto = cout <= 250_000 && urgence !== 'CRITIQUE'

  const justification = [
    `${source} porte ${stockSource.toLocaleString('fr-FR')} u. pour ${Math.round(couverture(stockSource, vitesseSource))} j de couverture — l'excédent est immobile.`,
    `${destination} tombe à ${couvertureDestAvant} j de couverture.`,
    `Transférer ${quantite.toLocaleString('fr-FR')} u. coûte ${cout.toLocaleString('fr-FR')} F et arrive en ${delai} j,`,
    `contre ${coutFournisseur.toLocaleString('fr-FR')} F et ${delaiFournisseur} j chez ${fournisseur?.nom ?? 'le fournisseur'}`,
    ruptureEvitee > 0
      ? `— ${joursRuptureEvites} j de rupture évités, soit ${ruptureEvitee.toLocaleString('fr-FR')} F de marge sauvée.`
      : '—',
  ].join(' ')

  return {
    id: `trf-${ref}-${source}-${destination}`.toLowerCase().replace(/\W+/g, '-'),
    produit_ref: ref,
    produit_nom: produit.nom,
    categorie: produit.categorie,
    entrepot_source: source,
    entrepot_destination: destination,
    quantite,
    urgence,
    stock_source_avant: stockSource,
    stock_source_apres: stockSource - quantite,
    couverture_source_apres_j: couverture(stockSource - quantite, vitesseSource),
    stock_dest_avant: stockDest,
    stock_dest_apres: stockDest + quantite,
    couverture_dest_avant_j: couvertureDestAvant,
    couverture_dest_apres_j: couverture(stockDest + quantite, vitesseDest),
    poids_kg: poids,
    palettes: Math.ceil(quantite / fiche.unites_par_palette),
    delai_transfert_j: delai,
    cout_transfert: cout,
    cout_reappro_fournisseur: coutFournisseur,
    delai_reappro_j: delaiFournisseur,
    cout_rupture_evite: ruptureEvitee,
    economie_nette: economie,
    justification,
    auto,
  }
}

/* ------------------------------------------------------------------ */
/* Santé du stock — l'argent qui dort                                  */
/* ------------------------------------------------------------------ */

export type ProblemeStock = 'SURSTOCK' | 'DORMANT' | 'DLC_COURTE' | 'OBSOLETE'

export interface AlerteSanteStock {
  produit_ref: string
  produit_nom: string
  categorie: string
  entrepot: string
  probleme: ProblemeStock
  gravite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  stock: number
  couverture_jours: number
  /** Argent immobilisé au coût d'achat — la vraie perte, pas le prix de vente. */
  capital_immobilise: number
  /** Ce qu'on perd si on ne fait rien : casse, péremption, coût de portage. */
  perte_si_inaction: number
  jours_avant_peremption?: number
  diagnostic: string
  action: string
  /** Cette alerte doit-elle remonter au marketing pour un déstockage ? */
  destockage_suggere: boolean
}

export interface SyntheseSanteStock {
  entrepot: string
  capital_immobilise_total: number
  /** Part du stock qui ne tourne plus. */
  part_dormante_pct: number
  perte_potentielle: number
  alertes: AlerteSanteStock[]
  sku_surstock: number
  sku_dormant: number
  sku_dlc_courte: number
}

/**
 * Coût de portage annuel du stock : ~22 % de la valeur immobilisée (financement, place,
 * assurance, casse, obsolescence). C'est le chiffre que personne ne calcule et qui explique
 * pourquoi une palette qui dort douze mois a coûté un quart de sa valeur.
 */
export const COUT_PORTAGE_ANNUEL = 0.22

export function buildSanteStock(entrepots: string[]): SyntheseSanteStock[] {
  return entrepots.map(entrepot => {
    const alertes: AlerteSanteStock[] = []
    let capitalTotal = 0
    let capitalDormant = 0

    // Le capital dort dans un entrepôt précis, sur une palette précise — pas « dans le réseau ».
    for (const ligne of referencesDuSite(entrepot)) {
      const produit = REGISTRE_STOCK.find(p => p.reference === ligne.produit_ref)
      const fiche = getFicheLogistique(ligne.produit_ref)
      if (!produit || !fiche) continue

      const stock = ligne.quantite
      const vitesse = vitesseJour(ligne.produit_ref, entrepot)
      const couv = couverture(stock, vitesse)
      const capital = stock * fiche.cout_achat
      capitalTotal += capital

      const dormant = vitesse < 0.5 && stock > 0
      const surstock = couv > SEUIL_SURSTOCK_JOURS && couv < 900
      // La DLC ne pardonne pas : si la couverture dépasse la durée de vie, une part périmera.
      const dlcMenacee = fiche.dlc_jours != null && couv > fiche.dlc_jours * 0.6

      if (!dormant && !surstock && !dlcMenacee) continue
      if (dormant || surstock) capitalDormant += capital

      /*
       * L'ordre du diagnostic compte, et il va du plus grave au moins grave.
       *
       * Une référence qui ne tourne plus du tout est **obsolète** — c'est un constat de décès,
       * et il prime sur tout le reste. La ranger en « surstock » sous prétexte qu'elle a aussi
       * une DLC lointaine conduirait à recommander de « suspendre le réappro pendant 1 840 jours »,
       * ce qui n'a aucun sens : on ne suspend pas le réappro d'un produit mort, on le solde.
       */
      const probleme: ProblemeStock = dormant && couv > 300
        ? 'OBSOLETE'
        : dlcMenacee
          ? (fiche.dlc_jours! <= 60 ? 'DLC_COURTE' : 'SURSTOCK')
          : dormant ? 'DORMANT'
            : 'SURSTOCK'

      const perte = calculerPerte(probleme, capital, couv, fiche.dlc_jours, stock, vitesse, fiche.cout_achat)
      const gravite = perte > capital * 0.3 ? 'CRITIQUE' : perte > capital * 0.12 ? 'HAUTE' : 'MODEREE'

      alertes.push({
        produit_ref: ligne.produit_ref,
        produit_nom: produit.nom,
        categorie: produit.categorie,
        entrepot,
        probleme,
        gravite,
        stock,
        couverture_jours: couv,
        capital_immobilise: capital,
        perte_si_inaction: perte,
        jours_avant_peremption: fiche.dlc_jours ?? undefined,
        diagnostic: diagnostiquer(probleme, couv, fiche.dlc_jours, capital, vitesse),
        action: agir(probleme, stock, couv, vitesse),
        destockage_suggere: probleme !== 'DORMANT' || couv > 120,
      })
    }

    return {
      entrepot,
      capital_immobilise_total: capitalTotal,
      part_dormante_pct: capitalTotal > 0 ? Math.round((capitalDormant / capitalTotal) * 100) : 0,
      perte_potentielle: alertes.reduce((s, a) => s + a.perte_si_inaction, 0),
      alertes: alertes.sort((a, b) => b.perte_si_inaction - a.perte_si_inaction),
      sku_surstock: alertes.filter(a => a.probleme === 'SURSTOCK').length,
      sku_dormant: alertes.filter(a => a.probleme === 'DORMANT' || a.probleme === 'OBSOLETE').length,
      sku_dlc_courte: alertes.filter(a => a.probleme === 'DLC_COURTE').length,
    }
  })
}

function calculerPerte(
  probleme: ProblemeStock, capital: number, couv: number,
  dlc: number | null, stock: number, vitesse: number, cout: number,
): number {
  if (probleme === 'DLC_COURTE' && dlc != null) {
    // Ce qui ne sera pas vendu avant la DLC est perdu sec.
    const vendableAvantDlc = Math.round(vitesse * dlc)
    return Math.max(0, (stock - vendableAvantDlc) * cout)
  }
  if (probleme === 'OBSOLETE') {
    // Un produit qui ne tourne plus finit déstocké à perte : 40 % de décote observée.
    return Math.round(capital * 0.4)
  }
  // Surstock et dormant : coût de portage sur la durée d'écoulement excédentaire.
  const joursExcedent = Math.max(0, Math.min(couv, 720) - SEUIL_SURSTOCK_JOURS)
  return Math.round(capital * COUT_PORTAGE_ANNUEL * (joursExcedent / 365))
}

function diagnostiquer(probleme: ProblemeStock, couv: number, dlc: number | null, capital: number, vitesse: number): string {
  switch (probleme) {
    case 'DLC_COURTE':
      return `${Math.round(couv)} j de couverture pour une DLC de ${dlc} j — au rythme actuel de ${vitesse.toFixed(1)} u./j, une partie du lot périmera en entrepôt.`
    case 'OBSOLETE':
      return `Plus aucune rotation significative (${vitesse.toFixed(2)} u./j) — ${(capital / 1_000).toFixed(0)} K immobilisés sur une référence morte.`
    case 'DORMANT':
      return `Rotation quasi nulle (${vitesse.toFixed(1)} u./j) — la référence occupe des emplacements de picking sans les rentabiliser.`
    case 'SURSTOCK':
      return `${Math.round(couv)} j de couverture pour une cible de ${SEUIL_SURSTOCK_JOURS} j — ${(capital / 1_000_000).toFixed(1)} M immobilisés au-delà du besoin, à 22 %/an de coût de portage.`
  }
}

function agir(probleme: ProblemeStock, stock: number, couv: number, vitesse: number): string {
  switch (probleme) {
    case 'DLC_COURTE': {
      const aEcouler = Math.round(stock - vitesse * 30)
      return `Déstockage prioritaire : pousser ${Math.max(0, aEcouler).toLocaleString('fr-FR')} u. en combo ou promo réseau sous 30 j, avant décote.`
    }
    case 'OBSOLETE':
      return 'Arrêter le réappro (règle à passer en ALERTE_SEULE), solder le stock résiduel et libérer l\'emplacement.'
    case 'DORMANT':
      return 'Sortir la référence du picking au sol vers le stockage haut, et la proposer en combo avec un produit à forte rotation.'
    case 'SURSTOCK':
      return `Suspendre le réappro sur ${Math.round(couv - SEUIL_SURSTOCK_JOURS)} j, transférer le surplus vers l'entrepôt en tension ou monter une opération marketing.`
  }
}
