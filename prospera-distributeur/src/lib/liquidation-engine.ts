/**
 * Moteur de liquidation — comment sortir un stock déjà mort.
 *
 * Le garde-fou empêche les nouveaux. Reste les anciens : les palettes déjà là, déjà payées.
 * Sur celles-là, la question n'est plus « comment éviter la perte » — elle est actée — mais
 * « **quelle sortie récupère le plus** ». Et ce n'est presque jamais celle qu'on croit.
 *
 * Le réflexe est de solder. C'est parfois le pire choix : brader un produit à faible élasticité
 * ne fait pas vendre plus, ça fait juste encaisser moins. Le moteur compare donc cinq sorties,
 * chacune chiffrée en **recette nette récupérée**, et les classe :
 *
 *   REMISE   — on baisse le prix. Le volume écoulé dépend de l'élasticité du produit,
 *              pas de notre optimisme. La décote optimale est calculée, pas choisie.
 *   COMBO    — on l'attache à un produit qui tourne. Écoule sans casser le prix affiché :
 *              c'est le seul scénario qui préserve la valeur perçue du produit.
 *   TRANSFERT— il ne se vend pas ici, il se vend ailleurs. Coût : un camion.
 *   RETOUR   — le fournisseur le reprend, avec décote. Récupération immédiate, sans effort.
 *   REBUT    — on arrête les frais. Perte sèche, mais on récupère l'emplacement et on cesse
 *              de payer le portage. C'est parfois la meilleure décision, et personne n'ose la prendre.
 *
 * Le point de comparaison de tout cela, c'est **l'inaction** : garder la palette a un coût,
 * lui aussi. Un scénario qui « perd » de l'argent peut donc être le bon.
 */

import type { AlerteSanteStock } from './transferts-engine'
import { COUT_PORTAGE_ANNUEL } from './transferts-engine'
import { REGISTRE_STOCK } from './registries/stock-registry'
import { getFicheLogistique, camionsDisponibles } from './registries/entrepot-logistique-registry'
import { getProfilProduit } from './registries/profil-produit-registry'
import { stockDuSite, sitesDuProduit } from './registries/stock-reseau-registry'

export type TypeSortie = 'REMISE' | 'COMBO' | 'TRANSFERT' | 'RETOUR_FOURNISSEUR' | 'REBUT'

export interface ScenarioSortie {
  type: TypeSortie
  libelle: string
  /** Faisable ? Un scénario impossible est montré quand même — pour dire pourquoi. */
  faisable: boolean
  /** Unités que ce scénario permet réellement d'écouler. */
  unites_ecoulees: number
  /** Ce que la société encaisse, net de tous les coûts du scénario. */
  recette_nette: number
  /** Coût propre au scénario : décote, transport, temps commercial. */
  cout_scenario: number
  /** Délai d'écoulement, en jours. Une sortie lente laisse courir le portage. */
  delai_jours: number
  /** Gain par rapport à ne rien faire. C'est la seule colonne qui compte. */
  gain_vs_inaction: number
  detail: string
  frein?: string
}

export interface PlanLiquidation {
  produit_ref: string
  produit_nom: string
  entrepot: string
  stock: number
  /** Ce que le stock a coûté à l'achat. Il est déjà dépensé — c'est un coût irrécupérable. */
  capital_engage: number
  /** Ce que coûte l'inaction : portage + décote + péremption. La référence de comparaison. */
  cout_inaction: number
  scenarios: ScenarioSortie[]
  recommande: ScenarioSortie
  /** Pourquoi celui-là et pas le réflexe habituel. */
  justification: string
}

/** Au-delà, la décote détruit la valeur perçue : le client conclut que le produit est mauvais. */
const DECOTE_MAX_PCT = 50
/** Décotes testées par le moteur — il retient celle qui maximise la recette, pas le volume. */
const DECOTES_TESTEES = [10, 15, 20, 25, 30, 40, 50]
/** Un combo écoule au rythme du produit porteur, plafonné : on ne force pas la main au client. */
const RATIO_COMBO_MAX = 0.35

function vitesseJour(ref: string): number {
  const p = REGISTRE_STOCK.find(x => x.reference === ref)
  if (!p) return 0
  return (p.ventes_30j ?? p.seuil * 3) / 30
}

/**
 * Gain d'un scénario par rapport à l'inaction.
 *
 * Le piège, ici, c'est le **coût irrécupérable**. Le capital déjà dépensé pour acheter la
 * palette est perdu quoi qu'on fasse : il est identique dans les cinq scénarios, donc il n'a
 * rien à faire dans la comparaison. L'y faire figurer conduit à des absurdités — jeter un
 * stock mort ressortait « pire » que le garder, alors que c'est exactement l'inverse : ne rien
 * faire, c'est continuer à payer le portage.
 *
 * On ne compare donc que ce qui diffère : ce que le scénario **encaisse**, plus le coût
 * d'inaction qu'il **évite** — au prorata de ce qu'il sort réellement du stock, car les unités
 * laissées sur place continuent, elles, de coûter.
 */
function gainVsInaction(
  recetteNette: number,
  unitesEcoulees: number,
  stock: number,
  coutInaction: number,
): number {
  const partLiquidee = stock > 0 ? unitesEcoulees / stock : 0
  return Math.round(recetteNette + coutInaction * partLiquidee)
}

/**
 * Coût de l'inaction — la palette qu'on garde « au cas où ».
 *
 * C'est le chiffre que personne ne calcule, et c'est pour ça que le stock mort ne bouge jamais :
 * ne rien faire semble gratuit. Ça ne l'est pas.
 */
function coutInaction(alerte: AlerteSanteStock, coutAchat: number, dlc: number | null): number {
  const vitesse = vitesseJour(alerte.produit_ref)

  // Produit périssable : ce qui ne sera pas vendu avant la DLC est jeté. Perte sèche.
  if (dlc != null && vitesse > 0) {
    const vendable = Math.floor(vitesse * dlc)
    const perdu = Math.max(0, alerte.stock - vendable)
    if (perdu > 0) return perdu * coutAchat
  }

  // Produit mort : il finira soldé, après avoir payé son portage. Douze mois d'attente typiques.
  const portage = alerte.stock * coutAchat * COUT_PORTAGE_ANNUEL
  const decoteFinale = alerte.probleme === 'OBSOLETE' ? 0.4 : 0.15
  return Math.round(portage + alerte.stock * coutAchat * decoteFinale)
}

/* ------------------------------------------------------------------ */

export function buildPlanLiquidation(alerte: AlerteSanteStock): PlanLiquidation {
  const produit = REGISTRE_STOCK.find(p => p.reference === alerte.produit_ref)!
  const fiche = getFicheLogistique(alerte.produit_ref)!
  const profil = getProfilProduit(alerte.produit_ref, produit.categorie)

  const coutAchat = fiche.cout_achat
  const prixVente = produit.prix_unitaire
  const stock = alerte.stock
  const capital = stock * coutAchat
  const inaction = coutInaction(alerte, coutAchat, fiche.dlc_jours)

  const scenarios: ScenarioSortie[] = [
    scenarioRemise(alerte, produit, profil.elasticite_prix, prixVente, coutAchat, inaction),
    scenarioCombo(alerte, produit, prixVente, coutAchat, inaction),
    scenarioTransfert(alerte, fiche, prixVente, coutAchat, inaction),
    scenarioRetour(alerte, profil.reprise_fournisseur_pct, coutAchat, inaction),
    scenarioRebut(alerte, coutAchat, inaction),
  ]

  const faisables = scenarios.filter(s => s.faisable)
  const recommande = [...faisables].sort((a, b) => b.gain_vs_inaction - a.gain_vs_inaction)[0]
    ?? scenarios[scenarios.length - 1]

  return {
    produit_ref: alerte.produit_ref,
    produit_nom: alerte.produit_nom,
    entrepot: alerte.entrepot,
    stock,
    capital_engage: capital,
    cout_inaction: inaction,
    scenarios: scenarios.sort((a, b) => Number(b.faisable) - Number(a.faisable) || b.gain_vs_inaction - a.gain_vs_inaction),
    recommande,
    justification: justifier(recommande, scenarios, inaction, profil.elasticite_prix),
  }
}

/**
 * Décote. On teste plusieurs profondeurs et on garde celle qui maximise la **recette**.
 * Ce n'est pas la plus forte : au-delà d'un point, on écoule à peine plus en encaissant
 * beaucoup moins. L'élasticité tranche, pas l'intuition.
 */
function scenarioRemise(
  alerte: AlerteSanteStock,
  produit: { reference: string },
  elasticite: number,
  prixVente: number,
  coutAchat: number,
  inaction: number,
): ScenarioSortie {
  const vitesse = vitesseJour(produit.reference)
  let meilleure = { decote: 0, unites: 0, recette: -Infinity, jours: 0 }

  for (const decote of DECOTES_TESTEES) {
    if (decote > DECOTE_MAX_PCT) continue

    // Élasticité : −1 % de prix ⇒ +elasticite % de volume.
    const vitesseBoostee = vitesse * (1 + (decote / 100) * elasticite)
    // On se donne un trimestre pour écouler — au-delà, ce n'est plus une opération, c'est du stock.
    const ecoulables = Math.min(alerte.stock, Math.floor(vitesseBoostee * 90))
    const prixNet = prixVente * (1 - decote / 100)
    const recette = ecoulables * prixNet
    const jours = vitesseBoostee > 0 ? Math.round(ecoulables / vitesseBoostee) : 999

    // Le portage court tant que le stock n'est pas sorti.
    const restant = alerte.stock - ecoulables
    const portageResiduel = restant * coutAchat * COUT_PORTAGE_ANNUEL * (jours / 365)
    const recetteNette = recette - portageResiduel

    if (recetteNette > meilleure.recette) {
      meilleure = { decote, unites: ecoulables, recette: recetteNette, jours }
    }
  }

  const invendus = alerte.stock - meilleure.unites
  const coutDecote = Math.round(meilleure.unites * prixVente * (meilleure.decote / 100))

  return {
    type: 'REMISE',
    libelle: `Décote de ${meilleure.decote} %`,
    faisable: meilleure.unites > 0,
    unites_ecoulees: meilleure.unites,
    recette_nette: Math.round(meilleure.recette),
    cout_scenario: coutDecote,
    delai_jours: meilleure.jours,
    gain_vs_inaction: gainVsInaction(meilleure.recette, meilleure.unites, alerte.stock, inaction),
    detail: `Élasticité ${elasticite} : une décote de ${meilleure.decote} % fait passer la rotation de `
      + `${vitesse.toFixed(1)} à ${(vitesse * (1 + (meilleure.decote / 100) * elasticite)).toFixed(1)} u./jour. `
      + `${meilleure.unites.toLocaleString('fr-FR')} u. écoulées en ${meilleure.jours} j`
      + (invendus > 0 ? `, ${invendus.toLocaleString('fr-FR')} u. resteraient sur les bras.` : ', stock intégralement sorti.'),
    frein: elasticite < 1.3
      ? 'Produit peu élastique : brader ne fera quasiment pas vendre plus, seulement encaisser moins.'
      : invendus > alerte.stock * 0.3
        ? 'La décote seule ne suffit pas à sortir le stock — à combiner avec un autre levier.'
        : undefined,
  }
}

/**
 * Combo. Le seul scénario qui écoule **sans casser le prix affiché** — le produit garde sa
 * valeur perçue, et le réseau ne prend pas l'habitude d'attendre les soldes.
 */
function scenarioCombo(
  alerte: AlerteSanteStock,
  produit: { reference: string; categorie: string },
  prixVente: number,
  coutAchat: number,
  inaction: number,
): ScenarioSortie {
  // Le porteur : un produit de la même famille, sur le même site, qui tourne vraiment.
  const porteur = REGISTRE_STOCK
    .filter(p => p.reference !== produit.reference
      && p.categorie === produit.categorie
      && stockDuSite(p.reference, alerte.entrepot) > 0)
    .sort((a, b) => vitesseJour(b.reference) - vitesseJour(a.reference))[0]

  if (!porteur) {
    return {
      type: 'COMBO', libelle: 'Combo avec un produit à forte rotation', faisable: false,
      unites_ecoulees: 0, recette_nette: 0, cout_scenario: 0, delai_jours: 0, gain_vs_inaction: 0,
      detail: 'Aucun produit de la même famille ne tourne assez sur ce site pour porter un combo.',
      frein: 'Pas de produit porteur disponible.',
    }
  }

  const vitessePorteur = vitesseJour(porteur.reference)
  // On n'attache pas une unité morte à chaque unité vendue : le client refuserait.
  const vitesseCombo = vitessePorteur * RATIO_COMBO_MAX
  const ecoulables = Math.min(alerte.stock, Math.floor(vitesseCombo * 90))
  const jours = vitesseCombo > 0 ? Math.round(ecoulables / vitesseCombo) : 999

  /*
   * La remise du combo dépend de l'état du produit, et non d'un forfait.
   *
   * Un produit sain qu'on pousse en lot part avec une remise d'appel modeste. Mais un produit
   * dont la fenêtre commerciale est fermée ne se vend plus au prix normal — c'est la définition
   * même de son problème. L'attacher à 15 % de remise reviendrait à nier le diagnostic : il ne
   * part qu'en cadeau d'achat, donc à décote forte.
   */
  const remiseCombo = alerte.probleme === 'OBSOLETE'
    ? 0.40
    : alerte.probleme === 'DLC_COURTE' ? 0.20 : 0.15

  const recette = ecoulables * prixVente * (1 - remiseCombo)
  const restant = alerte.stock - ecoulables
  const portageResiduel = restant * coutAchat * COUT_PORTAGE_ANNUEL * (jours / 365)
  const recetteNette = recette - portageResiduel

  return {
    type: 'COMBO',
    libelle: `Combo avec ${porteur.nom.split('(')[0].trim()}`,
    faisable: ecoulables > 0,
    unites_ecoulees: ecoulables,
    recette_nette: Math.round(recetteNette),
    cout_scenario: Math.round(ecoulables * prixVente * remiseCombo),
    delai_jours: jours,
    gain_vs_inaction: gainVsInaction(recetteNette, ecoulables, alerte.stock, inaction),
    detail: `${porteur.nom.split('(')[0].trim()} sort ${vitessePorteur.toFixed(1)} u./jour sur ce site. En attachant le lot à `
      + `${Math.round(RATIO_COMBO_MAX * 100)} % de ses ventes, à ${Math.round(remiseCombo * 100)} % de remise, on écoule `
      + `${ecoulables.toLocaleString('fr-FR')} u. en ${jours} j `
      + (remiseCombo <= 0.15
        ? 'sans casser le prix de vente affiché — la valeur perçue du produit est préservée.'
        : 'en cadeau d\'achat : le produit ne se vend plus seul, il ne part qu\'accroché à un porteur.'),
    frein: restant > 0
      ? `${restant.toLocaleString('fr-FR')} u. resteraient après 90 j de campagne.`
      : undefined,
  }
}

/** Il ne se vend pas ici. Se vend-il ailleurs ? */
function scenarioTransfert(
  alerte: AlerteSanteStock,
  fiche: { poids_kg: number },
  prixVente: number,
  coutAchat: number,
  inaction: number,
): ScenarioSortie {
  const autres = sitesDuProduit(alerte.produit_ref).filter(s => s.entrepot !== alerte.entrepot)

  if (autres.length === 0) {
    return {
      type: 'TRANSFERT', libelle: 'Transfert vers l\'autre entrepôt', faisable: false,
      unites_ecoulees: 0, recette_nette: 0, cout_scenario: 0, delai_jours: 0, gain_vs_inaction: 0,
      detail: 'Cette référence n\'est stockée que sur ce site — il n\'y a nulle part où l\'envoyer.',
      frein: 'Aucun site alternatif ne référence ce produit.',
    }
  }

  // Le produit dort ici ; rien ne dit qu'il tournera mieux là-bas. On reste prudent.
  const cible = autres[0]
  const camion = camionsDisponibles(alerte.entrepot).find(c => c.type === 'PORTEUR')
  const poids = alerte.stock * fiche.poids_kg
  const rotations = camion ? Math.max(1, Math.ceil(poids / camion.charge_utile_kg)) : 1
  const cout = camion ? rotations * (camion.cout_tournee_fcfa + 420 * camion.cout_km_fcfa) : 200_000

  // On suppose que le site cible écoule à sa propre vitesse, sans miracle.
  const vitesseCible = vitesseJour(alerte.produit_ref) * 0.2
  const ecoulables = Math.min(alerte.stock, Math.floor(vitesseCible * 90))
  const jours = vitesseCible > 0 ? Math.round(ecoulables / vitesseCible) + 2 : 999
  const recetteNette = ecoulables * prixVente - cout

  return {
    type: 'TRANSFERT',
    libelle: `Transfert vers ${cible.entrepot}`,
    faisable: ecoulables > 0 && recetteNette > 0,
    unites_ecoulees: ecoulables,
    recette_nette: Math.round(recetteNette),
    cout_scenario: cout,
    delai_jours: jours,
    gain_vs_inaction: gainVsInaction(recetteNette, ecoulables, alerte.stock, inaction),
    detail: `${cout.toLocaleString('fr-FR')} F de navette pour déplacer ${alerte.stock.toLocaleString('fr-FR')} u. vers ${cible.entrepot}, `
      + `qui en écoulerait ${ecoulables.toLocaleString('fr-FR')} en ${jours} j.`,
    frein: 'Déplacer un produit qui ne tourne pas ne le fait pas tourner — à ne retenir que si la demande '
      + 'du site cible est avérée.',
  }
}

/** Le fournisseur le reprend. Récupération immédiate, sans effort commercial. */
function scenarioRetour(
  alerte: AlerteSanteStock,
  repriseP: number | undefined,
  coutAchat: number,
  inaction: number,
): ScenarioSortie {
  const reprise = repriseP ?? 0

  if (reprise <= 0) {
    return {
      type: 'RETOUR_FOURNISSEUR', libelle: 'Retour au fournisseur', faisable: false,
      unites_ecoulees: 0, recette_nette: 0, cout_scenario: 0, delai_jours: 0, gain_vs_inaction: 0,
      detail: 'Aucune clause de reprise négociée avec le fournisseur sur cette référence.',
      frein: 'Pas de reprise contractuelle — à négocier au prochain référencement.',
    }
  }

  // Il reprend à `reprise` % du prix d'achat : le reste est notre perte.
  const recette = Math.round(alerte.stock * coutAchat * (reprise / 100))

  return {
    type: 'RETOUR_FOURNISSEUR',
    libelle: `Reprise fournisseur à ${reprise} %`,
    faisable: true,
    unites_ecoulees: alerte.stock,
    recette_nette: recette,
    cout_scenario: Math.round(alerte.stock * coutAchat * (1 - reprise / 100)),
    delai_jours: 15,
    gain_vs_inaction: gainVsInaction(recette, alerte.stock, alerte.stock, inaction),
    detail: `Le fournisseur reprend l'intégralité du lot à ${reprise} % du prix d'achat, sous 15 j. `
      + `${recette.toLocaleString('fr-FR')} F récupérés immédiatement, sans effort commercial, et l'emplacement est libéré.`,
    frein: 'Solution la plus rapide, mais elle acte la perte sans tenter de vendre.',
  }
}

/** On arrête les frais. Décision impopulaire, parfois la meilleure. */
function scenarioRebut(alerte: AlerteSanteStock, coutAchat: number, inaction: number): ScenarioSortie {
  // Aucune recette, mais on cesse de payer le portage et on récupère les emplacements.
  const portageEvite = Math.round(alerte.stock * coutAchat * COUT_PORTAGE_ANNUEL)

  return {
    type: 'REBUT',
    libelle: 'Sortie de stock (don ou destruction)',
    faisable: true,
    unites_ecoulees: alerte.stock,
    recette_nette: 0,
    cout_scenario: Math.round(alerte.stock * coutAchat),
    delai_jours: 3,
    // Le rebut n'encaisse rien : tout son intérêt est le coût d'inaction qu'il fait cesser.
    gain_vs_inaction: gainVsInaction(0, alerte.stock, alerte.stock, inaction),
    detail: `Perte sèche de ${(alerte.stock * coutAchat).toLocaleString('fr-FR')} F, mais ${portageEvite.toLocaleString('fr-FR')} F `
      + 'de portage annuel cessent immédiatement et les emplacements de picking sont rendus aux produits qui tournent.',
    frein: 'À ne retenir que si tous les autres scénarios récupèrent moins — ce qui arrive plus souvent qu\'on ne l\'admet.',
  }
}

function justifier(
  recommande: ScenarioSortie,
  scenarios: ScenarioSortie[],
  inaction: number,
  elasticite: number,
): string {
  const remise = scenarios.find(s => s.type === 'REMISE')
  const morceaux: string[] = []

  morceaux.push(
    `Ne rien faire coûte ${inaction.toLocaleString('fr-FR')} F — c'est le point de comparaison, et il n'est pas nul.`,
  )

  if (recommande.type !== 'REMISE' && remise?.faisable) {
    morceaux.push(
      `Le réflexe serait de solder : la décote optimale récupérerait ${remise.recette_nette.toLocaleString('fr-FR')} F. `
      + `« ${recommande.libelle} » en récupère ${recommande.recette_nette.toLocaleString('fr-FR')} F`
      + (elasticite < 1.3
        ? ' — sur un produit aussi peu élastique, brader ne fait pas vendre plus, seulement encaisser moins.'
        : ' — et sans casser le prix affiché.'),
    )
  } else if (recommande.type === 'REMISE') {
    morceaux.push(
      `Le produit est assez élastique (${elasticite}) pour que la décote fonctionne réellement : `
      + `${recommande.unites_ecoulees.toLocaleString('fr-FR')} u. sorties en ${recommande.delai_jours} j.`,
    )
  }

  if (recommande.type === 'REBUT') {
    morceaux.push('Aucune sortie commerciale ne récupère plus que l\'arrêt des frais. C\'est la décision que personne n\'ose prendre, et c\'est la bonne.')
  }

  return morceaux.join(' ')
}

/** Tous les plans de sortie du périmètre — le dossier de déstockage prêt pour le marketing. */
export function buildPlansLiquidation(alertes: AlerteSanteStock[]): PlanLiquidation[] {
  return alertes
    .filter(a => a.destockage_suggere)
    .map(buildPlanLiquidation)
    .sort((a, b) => b.cout_inaction - a.cout_inaction)
}
