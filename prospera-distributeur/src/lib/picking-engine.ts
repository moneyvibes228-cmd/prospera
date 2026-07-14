/**
 * Moteur de préparation — de la commande client au bon de préparation exécutable.
 *
 * Le problème réel du gestionnaire d'entrepôt n'est pas « quelles commandes ai-je ? »,
 * c'est « lesquelles puis-je réellement servir aujourd'hui, dans quel ordre, par qui,
 * et lesquelles vont exploser en litige si je les laisse partir ».
 *
 * Le moteur répond à ça, dans cet ordre :
 *   1. il éclate chaque commande en lignes physiques (produit, quantité, emplacement) ;
 *   2. il confronte chaque ligne au stock disponible — et réserve, pour qu'une même
 *      palette ne soit pas promise deux fois (c'est LA cause des litiges de livraison) ;
 *   3. il bloque ce qui ne doit pas partir : créance échue, stock introuvable ;
 *   4. il ordonne le travail en vagues et trace le chemin de picking le plus court ;
 *   5. il affecte les vagues aux préparateurs présents, selon leur cadence réelle.
 */

import type { Commande, PrioriteCommandeIA } from '@/types'
import { REGISTRE_COMMANDES } from './registries/commandes-registry'
import { REGISTRE_STOCK } from './registries/stock-registry'
import { stockDuSite, referencesDuSite } from './registries/stock-reseau-registry'
import { getPdvById } from './registries/pdv-registry'
import {
  getFicheLogistique, ordreAllee, capaciteLignesJour, preparateursPresents,
  getTopologie, PREPARATEURS, type Preparateur,
} from './registries/entrepot-logistique-registry'
import { hashString, randInt, seededRandom } from './generators/mock-seed'

/**
 * Plafond de crédit d'un client, exprimé en mois de son propre chiffre d'affaires.
 *
 * Un plafond en francs, identique pour tous, n'a aucun sens en distribution : 500 000 F
 * d'encours, c'est la faillite pour un kiosque et un jeudi ordinaire pour un grossiste.
 * Le plafond suit donc l'activité du client — c'est ainsi que le crédit fournisseur se
 * pilote réellement.
 */
export const PLAFOND_CREDIT_EN_MOIS_DE_CA = 0.6
/** Plancher : même un petit client a droit à un encours de roulement. */
export const PLAFOND_CREDIT_MINIMUM = 400_000
/** Au-delà de ce retard, on bloque même sous le plafond : le client ne paie plus, il stocke. */
export const JOURS_RETARD_BLOQUANTS = 45

/** Le plafond d'encours accordé à un point de vente, selon son activité. */
export function plafondCredit(pdv: { ca_mois: number }): number {
  return Math.max(PLAFOND_CREDIT_MINIMUM, Math.round(pdv.ca_mois * PLAFOND_CREDIT_EN_MOIS_DE_CA))
}

export type StatutLignePicking = 'SERVABLE' | 'PARTIELLE' | 'RUPTURE'

export interface LignePicking {
  produit_ref: string
  produit_nom: string
  categorie: string
  quantite_demandee: number
  /** Ce que l'entrepôt peut réellement sortir après réservation des commandes prioritaires. */
  quantite_servie: number
  statut: StatutLignePicking
  emplacement: string
  allee: string
  /** Rang dans le chemin de picking — le préparateur ne revient jamais sur ses pas. */
  ordre_parcours: number
  poids_kg: number
  volume_m3: number
  /** Quantité exprimée en palettes complètes + reliquat : c'est ce que le cariste voit. */
  palettes: number
  colis_restants: number
  /** Renseigné seulement quand la ligne ne peut pas être servie entièrement. */
  substitut_ref?: string
  substitut_nom?: string
}

/**
 * Un bon libéré n'a qu'un motif de blocage possible : le crédit client. La rupture n'en est
 * pas un — une commande que le stock ne couvre pas n'est pas bloquée, elle n'est pas libérée.
 */
export type BlocagePreparation = 'CREANCE' | 'AUCUN'

export interface BonPreparation {
  commande_id: string
  commande_ref: string
  pdv_id: string
  pdv_nom: string
  zone: string
  entrepot: string
  priorite: PrioriteCommandeIA
  /** Score de priorité calculé — c'est lui qui ordonne la file, pas la date. */
  score_priorite: number
  lignes: LignePicking[]
  nb_lignes: number
  lignes_en_rupture: number
  poids_total_kg: number
  volume_total_m3: number
  palettes_total: number
  /** Temps de préparation estimé, en minutes, à la cadence moyenne de l'entrepôt. */
  duree_prep_min: number
  blocage: BlocagePreparation
  motif_blocage?: string
  /** Ce que le moteur ferait sans intervention humaine. */
  decision_auto: 'PREPARER' | 'PREPARER_PARTIEL' | 'BLOQUER'
  justification: string
}

export interface VaguePicking {
  id: string
  libelle: string
  entrepot: string
  /** Créneau de préparation — calé pour tenir le cutoff camion. */
  creneau: string
  bons: BonPreparation[]
  nb_lignes: number
  duree_min: number
  preparateur?: Preparateur
  /** Allées traversées, dans l'ordre du parcours. */
  parcours: string[]
  /** Le préparateur affecté tient-il le créneau ? */
  tenable: boolean
}

export interface ChargeEntrepotJour {
  entrepot: string
  lignes_a_preparer: number
  capacite_lignes: number
  taux_charge_pct: number
  /** Lignes qui ne rentrent pas dans la journée — elles glisseront à J+1. */
  lignes_reportees: number
  preparateurs_presents: number
  preparateurs_absents: number
  cutoff: string
  /** Commandes du carnet, tous statuts d'attente confondus. */
  carnet_commandes: number
  /** Commandes effectivement libérées en préparation aujourd'hui. */
  commandes_liberees: number
  /** Le carnet que le stock et les bras du jour ne permettent pas d'attaquer. */
  arriere_commandes: number
  alerte?: string
  /** Alerte structurelle : le carnet dépasse durablement ce que l'entrepôt peut servir. */
  alerte_structurelle?: string
}

/* ------------------------------------------------------------------ */
/* Éclatement d'une commande en lignes physiques                       */
/* ------------------------------------------------------------------ */

/**
 * Le registre des commandes ne porte qu'un *nombre* de lignes, pas leur détail — c'est
 * une donnée commerciale. L'entrepôt, lui, a besoin du détail physique. On le reconstitue
 * de façon déterministe à partir des familles de la commande : même commande ⇒ mêmes lignes,
 * à chaque rendu.
 */
function eclaterCommande(cmd: Commande): { produit_ref: string; quantite: number }[] {
  const rng = seededRandom(hashString(cmd.reference))

  // On ne peut préparer que ce que le site détient réellement — pas ce que le réseau possède.
  const surSite = new Set(referencesDuSite(cmd.entrepot).map(s => s.produit_ref))
  const candidats = REGISTRE_STOCK.filter(
    p => surSite.has(p.reference) && cmd.familles.includes(p.categorie),
  )
  if (candidats.length === 0) return []

  // Une commande de 28 lignes sur un catalogue de 20 SKU en couvre au plus 20.
  const nbLignes = Math.min(cmd.lignes, candidats.length)
  const melange = [...candidats].sort(
    (a, b) => hashString(cmd.reference + a.reference) - hashString(cmd.reference + b.reference),
  )

  return melange.slice(0, nbLignes).map(p => {
    // Le panier grossiste se compte en dizaines de colis, pas en pièces.
    const base = Math.max(4, Math.round((cmd.montant_societe / nbLignes) / p.prix_unitaire))
    return { produit_ref: p.reference, quantite: Math.max(1, base + randInt(rng, -3, 6)) }
  })
}

/**
 * Priorité de préparation. La date de commande est le pire des critères : elle sert
 * le premier arrivé, pas le plus urgent. On sert d'abord ce qui coûte cher à ne pas servir.
 */
function scorePriorite(cmd: Commande): number {
  const pdv = getPdvById(cmd.pdv_id)
  let score = 50

  if (cmd.priorite_ia === 'HAUTE') score += 30
  if (cmd.priorite_ia === 'BLOQUEE') score -= 40

  // Un PDV qui a déjà commandé et qu'on ne sert pas est un PDV qui appelle le concurrent.
  if (pdv) {
    if (pdv.pipeline === 'A_RISQUE') score += 15
    if (pdv.pipeline === 'FIDELE') score += 10
    if (pdv.creance_jours > 30) score -= 10
  }

  // Un gros panier immobilise un camion : le sortir tôt libère le quai.
  if (cmd.montant_societe > 5_000_000) score += 10

  // Une commande validée depuis plus d'un jour a déjà fait attendre le client.
  score += cmd.statut === 'VALIDEE' ? 8 : 0

  return Math.max(0, Math.min(100, score))
}

/**
 * Deux motifs de blocage, et deux seulement : le client est trop en retard, ou il a dépassé
 * son propre plafond. Le reste part — bloquer un client qui paie est le meilleur moyen de
 * l'envoyer chez le concurrent.
 */
function evaluerBlocageCredit(cmd: Commande): { bloque: boolean; motif?: string } {
  const pdv = getPdvById(cmd.pdv_id)
  if (!pdv || pdv.creance <= 0) return { bloque: false }

  if (pdv.creance_jours >= JOURS_RETARD_BLOQUANTS) {
    return {
      bloque: true,
      motif: `Créance de ${(pdv.creance / 1_000).toFixed(0)} K en retard de ${pdv.creance_jours} j — sortie marchandise bloquée, déblocage recouvrement requis.`,
    }
  }

  const plafond = plafondCredit(pdv)
  if (pdv.creance > plafond) {
    return {
      bloque: true,
      motif: `Encours de ${(pdv.creance / 1_000_000).toFixed(1)} M pour un plafond de ${(plafond / 1_000_000).toFixed(1)} M `
        + `(${PLAFOND_CREDIT_EN_MOIS_DE_CA} mois de son CA) — accord commercial requis avant chargement.`,
    }
  }

  return { bloque: false }
}

/** Substitut de même famille, présent sur le même site, avec du stock — évite la livraison partielle. */
function chercherSubstitut(
  produitRef: string,
  quantiteManquante: number,
  dejaReserve: Map<string, number>,
  entrepot: string,
) {
  const produit = REGISTRE_STOCK.find(p => p.reference === produitRef)
  if (!produit) return undefined

  const surSite = new Set(referencesDuSite(entrepot).map(s => s.produit_ref))

  return REGISTRE_STOCK.find(p =>
    p.reference !== produitRef
    && surSite.has(p.reference)
    && p.categorie === produit.categorie
    && stockDuSite(p.reference, entrepot) - (dejaReserve.get(p.reference) ?? 0) >= quantiteManquante
    // Un substitut nettement plus cher n'en est pas un : le client refusera la ligne.
    && p.prix_unitaire <= produit.prix_unitaire * 1.25,
  )
}

/* ------------------------------------------------------------------ */
/* Construction des bons de préparation                                */
/* ------------------------------------------------------------------ */

/** Le carnet : tout ce qui attend l'entrepôt, validé ou déjà en préparation. */
function carnetDeCommandes(entrepots: string[]): Commande[] {
  return REGISTRE_COMMANDES
    .filter(c => (c.statut === 'VALIDEE' || c.statut === 'PREPARATION') && entrepots.includes(c.entrepot))
    .sort((a, b) => scorePriorite(b) - scorePriorite(a))
}

/**
 * Bons de préparation du jour — la **file libérée**, pas le carnet entier.
 *
 * Distinction essentielle, et c'est celle qui sépare un WMS d'un tableur : un entrepôt ne
 * « traite » pas son carnet, il en *libère* chaque matin la part qu'il peut réellement servir,
 * compte tenu du stock présent et des bras disponibles. Le reste attend — ce n'est pas une
 * rupture, c'est un arriéré.
 *
 * Deux règles de libération :
 *   — le stock est **réservé** au fil de l'eau, par priorité décroissante. La dernière commande
 *     libérée voit le stock qui reste vraiment, pas le stock théorique. C'est ce qui empêche
 *     de promettre deux fois la même palette — la cause n°1 des litiges de livraison.
 *   — on cesse de libérer quand la capacité de préparation du jour est atteinte, ou quand le
 *     stock ne permet plus de servir une commande de façon utile.
 */
export function buildBonsPreparation(entrepots: string[]): BonPreparation[] {
  const reserve = new Map<string, number>()
  const bons: BonPreparation[] = []

  // Capacité de préparation cumulée des sites concernés — le plafond de la file du jour.
  const capacite = entrepots.reduce((s, e) => s + capaciteLignesJour(e), 0)
  let lignesLiberees = 0

  for (const cmd of carnetDeCommandes(entrepots)) {
    if (lignesLiberees >= capacite) break

    const credit = evaluerBlocageCredit(cmd)
    const lignesBrutes = eclaterCommande(cmd)
    const lignes: LignePicking[] = []

    // Réservations que CETTE commande engagerait. On ne les valide qu'une fois décidé
    // qu'elle est libérée — sinon une commande laissée dans l'arriéré consommerait
    // quand même du stock, et la file suivante hériterait d'une pénurie fictive.
    const tentative = new Map<string, number>()

    for (const ligne of lignesBrutes) {
      const produit = REGISTRE_STOCK.find(p => p.reference === ligne.produit_ref)
      const fiche = getFicheLogistique(ligne.produit_ref)
      if (!produit || !fiche) continue

      // Le stock qui compte est celui du site qui sert, pas celui du pays.
      const surSite = stockDuSite(produit.reference, cmd.entrepot)
      const dejaReserve = (reserve.get(produit.reference) ?? 0) + (tentative.get(produit.reference) ?? 0)
      const disponible = Math.max(0, surSite - dejaReserve)
      const servie = credit.bloque ? 0 : Math.min(ligne.quantite, disponible)

      // Une commande bloquée ne réserve rien : le stock reste disponible pour qui paie.
      if (!credit.bloque && servie > 0) {
        tentative.set(produit.reference, (tentative.get(produit.reference) ?? 0) + servie)
      }

      const manque = ligne.quantite - servie
      const statut: StatutLignePicking = manque === 0 ? 'SERVABLE' : servie === 0 ? 'RUPTURE' : 'PARTIELLE'
      const substitut = statut !== 'SERVABLE' && !credit.bloque
        ? chercherSubstitut(produit.reference, manque, reserve, cmd.entrepot)
        : undefined

      lignes.push({
        produit_ref: produit.reference,
        produit_nom: produit.nom,
        categorie: produit.categorie,
        quantite_demandee: ligne.quantite,
        quantite_servie: servie,
        statut,
        emplacement: fiche.emplacement,
        allee: fiche.allee,
        ordre_parcours: ordreAllee(cmd.entrepot, fiche.allee) * 100 + parseInt(fiche.emplacement.split('-')[1], 10),
        poids_kg: Math.round(fiche.poids_kg * servie * 10) / 10,
        volume_m3: Math.round(fiche.volume_m3 * servie * 1000) / 1000,
        palettes: Math.floor(servie / fiche.unites_par_palette),
        colis_restants: servie % fiche.unites_par_palette,
        substitut_ref: substitut?.reference,
        substitut_nom: substitut?.nom,
      })
    }

    if (lignes.length === 0) continue

    // Chemin de picking : on suit les allées dans l'ordre physique, sans aller-retour.
    lignes.sort((a, b) => a.ordre_parcours - b.ordre_parcours)

    const ruptures = lignes.filter(l => l.statut === 'RUPTURE').length
    const partielles = lignes.filter(l => l.statut === 'PARTIELLE').length

    /*
     * Décision de libération. Une commande dont le stock ne couvre plus rien n'est PAS
     * « en rupture » : elle n'est simplement pas libérée aujourd'hui. La déclarer en rupture
     * serait un contresens — le produit n'est pas absent de l'entrepôt, il est déjà promis
     * à un client mieux placé dans la file. Elle repart dans l'arriéré, sans rien réserver.
     */
    const servable = ruptures < lignes.length
    if (!credit.bloque && !servable) continue

    // À partir d'ici la commande est libérée : ses réservations deviennent fermes.
    for (const [ref, qte] of tentative) {
      reserve.set(ref, (reserve.get(ref) ?? 0) + qte)
    }
    if (!credit.bloque) lignesLiberees += lignes.length

    const poids = Math.round(lignes.reduce((s, l) => s + l.poids_kg, 0))
    const volume = Math.round(lignes.reduce((s, l) => s + l.volume_m3, 0) * 100) / 100
    const cadence = cadenceMoyenne(cmd.entrepot)
    const duree = Math.round((lignes.length / cadence) * 60)

    const blocage: BlocagePreparation = credit.bloque ? 'CREANCE' : 'AUCUN'

    bons.push({
      commande_id: cmd.id,
      commande_ref: cmd.reference,
      pdv_id: cmd.pdv_id,
      pdv_nom: cmd.pdv_nom,
      zone: cmd.zone,
      entrepot: cmd.entrepot,
      priorite: cmd.priorite_ia,
      score_priorite: scorePriorite(cmd),
      lignes,
      nb_lignes: lignes.length,
      lignes_en_rupture: ruptures,
      poids_total_kg: poids,
      volume_total_m3: volume,
      palettes_total: lignes.reduce((s, l) => s + l.palettes, 0),
      duree_prep_min: duree,
      blocage,
      motif_blocage: credit.motif,
      ...decider(blocage, ruptures, partielles, lignes.length, credit.motif),
    })
  }

  return bons
}

function decider(
  blocage: BlocagePreparation,
  ruptures: number,
  partielles: number,
  total: number,
  motifCredit?: string,
): { decision_auto: BonPreparation['decision_auto']; justification: string } {
  if (blocage === 'CREANCE') {
    return { decision_auto: 'BLOQUER', justification: motifCredit ?? 'Encours client bloquant.' }
  }
  if (ruptures + partielles === 0) {
    return {
      decision_auto: 'PREPARER',
      justification: `${total} lignes servables intégralement — bon de préparation émis automatiquement.`,
    }
  }
  const incomplet = ruptures + partielles
  return {
    decision_auto: 'PREPARER_PARTIEL',
    justification: `${total - incomplet}/${total} lignes servables — livraison partielle proposée, ${incomplet} ligne${incomplet > 1 ? 's' : ''} à substituer ou à reliquater.`,
  }
}

function cadenceMoyenne(entrepot: string): number {
  const equipe = preparateursPresents(entrepot)
  if (equipe.length === 0) return 35
  return equipe.reduce((s, p) => s + p.cadence_lignes_h, 0) / equipe.length
}

/* ------------------------------------------------------------------ */
/* Vagues                                                              */
/* ------------------------------------------------------------------ */

/**
 * Regroupement en vagues. Une vague = un préparateur, un créneau, un parcours.
 *
 * On regroupe par **zone de livraison** et non par ordre d'arrivée : les bons d'une même
 * zone partiront dans le même camion, autant les préparer ensemble et les poser au même quai.
 */
export function buildVagues(entrepot: string, bons: BonPreparation[]): VaguePicking[] {
  const servables = bons
    .filter(b => b.entrepot === entrepot && b.blocage === 'AUCUN')
    .sort((a, b) => b.score_priorite - a.score_priorite)

  const equipe = preparateursPresents(entrepot)
  if (equipe.length === 0 || servables.length === 0) return []

  const parZone = new Map<string, BonPreparation[]>()
  for (const bon of servables) {
    const lot = parZone.get(bon.zone) ?? []
    lot.push(bon)
    parZone.set(bon.zone, lot)
  }

  const cutoff = getTopologie(entrepot).heure_cutoff
  const creneaux = ['07:00 → 09:30', '09:30 → 12:00', '13:00 → ' + cutoff]
  const vagues: VaguePicking[] = []
  let index = 0

  for (const [zone, lot] of [...parZone.entries()].sort(
    (a, b) => Math.max(...b[1].map(x => x.score_priorite)) - Math.max(...a[1].map(x => x.score_priorite)),
  )) {
    const preparateur = equipe[index % equipe.length]
    const duree = lot.reduce((s, b) => s + b.duree_prep_min, 0)
    const nbLignes = lot.reduce((s, b) => s + b.nb_lignes, 0)
    const creneau = creneaux[Math.min(index, creneaux.length - 1)]

    // Le parcours de la vague est l'union des allées de ses bons, dans l'ordre physique.
    const allees = [...new Set(lot.flatMap(b => b.lignes.map(l => l.allee)))]
      .sort((a, b) => ordreAllee(entrepot, a) - ordreAllee(entrepot, b))

    vagues.push({
      id: `vague-${entrepot.toLowerCase().replace(/\W/g, '')}-${index + 1}`,
      libelle: `Vague ${index + 1} — ${zone}`,
      entrepot,
      creneau,
      bons: lot,
      nb_lignes: nbLignes,
      duree_min: duree,
      preparateur,
      parcours: allees,
      // Un créneau fait 150 min ; au-delà, la vague déborde sur la suivante et rate le camion.
      tenable: duree <= 150,
    })
    index++
  }

  return vagues
}

/* ------------------------------------------------------------------ */
/* Charge du jour                                                      */
/* ------------------------------------------------------------------ */

/**
 * Charge vs capacité. C'est la seule question qui compte à 7 h du matin : est-ce que
 * l'équipe présente peut sortir le travail du jour avant le départ des camions ?
 */
export function buildChargeJour(entrepot: string, bons: BonPreparation[]): ChargeEntrepotJour {
  const aPreparer = bons.filter(b => b.entrepot === entrepot && b.blocage === 'AUCUN')
  const lignes = aPreparer.reduce((s, b) => s + b.nb_lignes, 0)
  const capacite = capaciteLignesJour(entrepot)
  const equipe = preparateursPresents(entrepot)
  const absents = PREPARATEURS.filter(p => p.entrepot === entrepot && !p.present)
  const taux = capacite > 0 ? Math.round((lignes / capacite) * 100) : 0
  const reportees = Math.max(0, lignes - capacite)

  const carnet = carnetDeCommandes([entrepot]).length
  const liberees = aPreparer.length
  const arriere = Math.max(0, carnet - liberees - bons.filter(b => b.entrepot === entrepot && b.blocage !== 'AUCUN').length)

  let alerte: string | undefined
  if (reportees > 0) {
    const manqueHeures = Math.ceil(reportees / (cadenceMoyenne(entrepot) || 35))
    alerte = `${reportees} lignes au-delà de la capacité du jour (${manqueHeures} h d'équipe manquantes)`
      + (absents.length > 0 ? ` — ${absents.length} préparateur${absents.length > 1 ? 's' : ''} absent${absents.length > 1 ? 's' : ''}. Renfort ou report des vagues basses à arbitrer.` : ' — renfort à demander ou vagues basses à reporter.')
  } else if (taux > 85) {
    alerte = `Charge à ${taux} % de la capacité — aucune marge pour une commande urgente en fin de matinée.`
  }

  /*
   * L'alerte qui compte vraiment, et que personne ne regardait : si l'arriéré est du même
   * ordre que le carnet, l'entrepôt ne rattrapera jamais. Ce n'est pas un problème de
   * préparateurs, c'est un problème de stock — on vend beaucoup plus vite qu'on ne réassort.
   */
  let alerteStructurelle: string | undefined
  if (carnet > 0 && arriere > liberees * 2) {
    const partServie = Math.round((liberees / carnet) * 100)
    alerteStructurelle = `L'entrepôt ne peut libérer que ${partServie} % du carnet (${liberees} commandes sur ${carnet}) : `
      + `le stock présent ne couvre pas la demande engagée. L'arriéré de ${arriere.toLocaleString('fr-FR')} commandes ne se `
      + `résorbera pas en ajoutant des bras — il se résorbe en réapprovisionnant.`
  }

  return {
    entrepot,
    lignes_a_preparer: lignes,
    capacite_lignes: capacite,
    taux_charge_pct: taux,
    lignes_reportees: reportees,
    preparateurs_presents: equipe.length,
    preparateurs_absents: absents.length,
    cutoff: getTopologie(entrepot).heure_cutoff,
    carnet_commandes: carnet,
    commandes_liberees: liberees,
    arriere_commandes: arriere,
    alerte,
    alerte_structurelle: alerteStructurelle,
  }
}
