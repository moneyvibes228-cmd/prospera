/**
 * Moteur de réception — le camion fournisseur est au quai, que fait-on ?
 *
 * La réception est le seul moment où l'on peut encore refuser une marchandise. Passé le quai,
 * un écart devient un litige, et un litige non tracé devient une facture payée pour rien.
 *
 * Le moteur prépare la journée du quai : ce qui est attendu, dans quel ordre, quelles lignes
 * contrôler en priorité (on ne compte pas tout — on compte ce qui a déjà posé problème),
 * et il tranche automatiquement le sort d'un écart selon sa tolérance.
 */

import type { CommandeFournisseur, LigneReception } from '@distributeur/types'
import { REGISTRE_COMMANDES_FOURNISSEURS } from './registries/commandes-fournisseurs-registry'
import { getFournisseurById } from './registries/fournisseurs-registry'
import { getFicheLogistique } from './registries/entrepot-logistique-registry'
import { DATE_DU_JOUR } from './reappro-engine'

/** En deçà, l'écart de quantité est absorbé sans litige (casse de transport admise). */
export const TOLERANCE_ECART_PCT = 2
/** Au-delà, l'écart est un litige : réserve sur le bon, facture bloquée en compta. */
export const SEUIL_LITIGE_PCT = 5

export type NiveauControle = 'INTEGRAL' | 'RENFORCE' | 'ALLEGE'

export interface LigneAttendue {
  produit_ref: string
  produit_nom: string
  quantite_commandee: number
  emplacement_destination: string
  allee: string
  poids_total_kg: number
  palettes_attendues: number
  /** Le contrôle coûte du temps : on le concentre là où l'historique le justifie. */
  controle: NiveauControle
  motif_controle: string
}

export type StatutAttendu = 'A_QUAI' | 'ATTENDU_JOUR' | 'EN_RETARD' | 'A_VENIR'

export interface ReceptionAttendue {
  commande_id: string
  reference: string
  fournisseur_id: string
  fournisseur_nom: string
  entrepot: string
  date_prevue: string
  /** Négatif = livraison en retard de N jours. */
  jours_ecart: number
  statut: StatutAttendu
  lignes: LigneAttendue[]
  nb_lignes: number
  poids_total_kg: number
  palettes_total: number
  /** Temps de déchargement + contrôle estimé, en minutes. Sature le quai. */
  duree_quai_min: number
  controle: NiveauControle
  /** Fiabilité du fournisseur — pilote le niveau de contrôle. */
  taux_conforme_pct: number
  taux_litige_pct: number
  alerte?: string
}

export type IssueEcart = 'ACCEPTE' | 'RESERVE' | 'LITIGE' | 'REFUS'

export interface DecisionEcart {
  produit_ref: string
  produit_nom: string
  quantite_commandee: number
  quantite_recue: number
  ecart: number
  ecart_pct: number
  issue: IssueEcart
  /** Impact financier de l'écart, au prix d'achat — ce qu'il ne faut pas payer. */
  impact_fcfa: number
  action: string
}

export interface BilanReception {
  commande_ref: string
  fournisseur_nom: string
  lignes: DecisionEcart[]
  taux_conformite_pct: number
  /** Montant à déduire de la facture fournisseur. */
  avoir_a_reclamer: number
  litige: boolean
  /** Ce que le moteur fait sans intervention : mise en stock, avoir, blocage facture. */
  actions_auto: string[]
}

/* ------------------------------------------------------------------ */
/* Attendus                                                            */
/* ------------------------------------------------------------------ */

function joursEntre(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000)
}

/**
 * Niveau de contrôle. Contrôler 100 % de chaque camion est impossible avec trois préparateurs ;
 * ne rien contrôler, c'est payer les erreurs du fournisseur. On cible : un fournisseur qui
 * livre conforme à 98 % passe en contrôle allégé, un fournisseur à litiges passe en intégral.
 */
function niveauControle(tauxConforme: number, tauxLitige: number): { niveau: NiveauControle; motif: string } {
  if (tauxLitige >= 5 || tauxConforme < 90) {
    return {
      niveau: 'INTEGRAL',
      motif: `Fournisseur à ${tauxLitige} % de litiges et ${tauxConforme} % de conformité — comptage intégral, colis par colis.`,
    }
  }
  if (tauxConforme < 97) {
    return {
      niveau: 'RENFORCE',
      motif: `${tauxConforme} % de livraisons conformes — comptage renforcé sur les lignes à forte valeur.`,
    }
  }
  return {
    niveau: 'ALLEGE',
    motif: `${tauxConforme} % de conformité sur l'historique — contrôle allégé par sondage, palettes scellées acceptées.`,
  }
}

/** Ce que le quai doit encaisser — commandes envoyées ou en transit, non encore reçues. */
export function buildReceptionsAttendues(entrepots: string[]): ReceptionAttendue[] {
  const enCours = REGISTRE_COMMANDES_FOURNISSEURS.filter(
    c => ['ENVOYEE', 'CONFIRMEE', 'EN_TRANSIT'].includes(c.statut)
      && entrepots.includes(c.entrepot_destination),
  )

  return enCours
    .map(cmd => construireAttendu(cmd))
    .sort((a, b) => ordreStatut(a.statut) - ordreStatut(b.statut) || a.jours_ecart - b.jours_ecart)
}

function ordreStatut(s: StatutAttendu): number {
  return { EN_RETARD: 0, A_QUAI: 1, ATTENDU_JOUR: 2, A_VENIR: 3 }[s]
}

function construireAttendu(cmd: CommandeFournisseur): ReceptionAttendue {
  const fournisseur = getFournisseurById(cmd.fournisseur_id)
  const conforme = fournisseur?.taux_livraison_conforme_pct ?? 95
  const litige = fournisseur?.taux_litige_pct ?? 2
  const { niveau, motif } = niveauControle(conforme, litige)

  const ecart = joursEntre(cmd.date_livraison_prevue, DATE_DU_JOUR)
  const statut: StatutAttendu = ecart < 0 ? 'EN_RETARD' : ecart === 0 ? 'A_QUAI' : ecart <= 2 ? 'ATTENDU_JOUR' : 'A_VENIR'

  const lignes: LigneAttendue[] = cmd.lignes.map(l => {
    const fiche = getFicheLogistique(l.produit_ref)
    // Une ligne à forte valeur mérite un comptage même chez un bon fournisseur.
    const forteValeur = l.total > 3_000_000
    const controleLigne: NiveauControle = niveau === 'ALLEGE' && forteValeur ? 'RENFORCE' : niveau

    return {
      produit_ref: l.produit_ref,
      produit_nom: l.produit_nom,
      quantite_commandee: l.quantite_commandee,
      emplacement_destination: fiche?.emplacement ?? '—',
      allee: fiche?.allee ?? '—',
      poids_total_kg: Math.round((fiche?.poids_kg ?? 8) * l.quantite_commandee),
      palettes_attendues: Math.ceil(l.quantite_commandee / (fiche?.unites_par_palette ?? 60)),
      controle: controleLigne,
      motif_controle: controleLigne === niveau
        ? motif
        : `Ligne à ${(l.total / 1_000_000).toFixed(1)} M — comptage renforcé malgré la fiabilité du fournisseur.`,
    }
  })

  const palettes = lignes.reduce((s, l) => s + l.palettes_attendues, 0)
  const poids = lignes.reduce((s, l) => s + l.poids_total_kg, 0)

  // 6 min de déchargement par palette, + le surcoût du contrôle.
  const coeffControle = niveau === 'INTEGRAL' ? 2.2 : niveau === 'RENFORCE' ? 1.4 : 1
  const duree = Math.round(palettes * 6 * coeffControle)

  let alerte: string | undefined
  if (statut === 'EN_RETARD') {
    alerte = `Livraison en retard de ${Math.abs(ecart)} j (prévue le ${cmd.date_livraison_prevue}) — `
      + `relancer ${cmd.fournisseur_nom} aujourd'hui, les produits de cette commande sont sous seuil.`
  } else if (niveau === 'INTEGRAL') {
    alerte = `Contrôle intégral imposé — prévoir ${duree} min de quai et un préparateur dédié.`
  }

  return {
    commande_id: cmd.id,
    reference: cmd.reference,
    fournisseur_id: cmd.fournisseur_id,
    fournisseur_nom: cmd.fournisseur_nom,
    entrepot: cmd.entrepot_destination,
    date_prevue: cmd.date_livraison_prevue,
    jours_ecart: ecart,
    statut,
    lignes,
    nb_lignes: lignes.length,
    poids_total_kg: poids,
    palettes_total: palettes,
    duree_quai_min: duree,
    controle: niveau,
    taux_conforme_pct: conforme,
    taux_litige_pct: litige,
    alerte,
  }
}

/* ------------------------------------------------------------------ */
/* Contrôle des écarts                                                 */
/* ------------------------------------------------------------------ */

/**
 * Verdict automatique sur les écarts constatés au quai.
 *
 * La règle qui fait gagner de l'argent : un écart n'est pas « une erreur à signaler »,
 * c'est un avoir à réclamer. Le moteur chiffre le manquant au prix d'achat et prépare
 * la déduction sur la facture — sinon on paie 100 % d'une livraison à 94 %.
 */
export function controlerReception(commandeId: string, lignes: LigneReception[]): BilanReception | null {
  const cmd = REGISTRE_COMMANDES_FOURNISSEURS.find(c => c.id === commandeId)
  if (!cmd) return null

  const decisions: DecisionEcart[] = cmd.lignes.map(ligne => {
    const constat = lignes.find(l => l.produit_ref === ligne.produit_ref)
    const recue = constat?.quantite_recue ?? 0
    const ecart = recue - ligne.quantite_commandee
    const ecartPct = Math.round((Math.abs(ecart) / ligne.quantite_commandee) * 1000) / 10
    const impact = Math.abs(ecart) * ligne.prix_achat_unitaire

    const issue: IssueEcart = constat?.conforme === false
      ? 'REFUS'
      : ecart === 0 ? 'ACCEPTE'
        : ecartPct <= TOLERANCE_ECART_PCT ? 'ACCEPTE'
          : ecartPct <= SEUIL_LITIGE_PCT ? 'RESERVE'
            : 'LITIGE'

    return {
      produit_ref: ligne.produit_ref,
      produit_nom: ligne.produit_nom,
      quantite_commandee: ligne.quantite_commandee,
      quantite_recue: recue,
      ecart,
      ecart_pct: ecartPct,
      issue,
      impact_fcfa: issue === 'ACCEPTE' ? 0 : impact,
      action: actionEcart(issue, ecart, ecartPct, constat?.motif_ecart),
    }
  })

  const conformes = decisions.filter(d => d.issue === 'ACCEPTE').length
  const avoir = decisions.filter(d => d.ecart < 0 || d.issue === 'REFUS').reduce((s, d) => s + d.impact_fcfa, 0)
  const litige = decisions.some(d => d.issue === 'LITIGE' || d.issue === 'REFUS')

  const actions: string[] = []
  const misesEnStock = decisions.filter(d => d.quantite_recue > 0).length
  if (misesEnStock > 0) actions.push(`${misesEnStock} ligne${misesEnStock > 1 ? 's' : ''} mise${misesEnStock > 1 ? 's' : ''} en stock aux emplacements de destination.`)
  if (avoir > 0) actions.push(`Avoir de ${avoir.toLocaleString('fr-FR')} F préparé et transmis à la comptabilité fournisseur.`)
  if (litige) actions.push('Facture fournisseur bloquée au paiement jusqu\'à résolution du litige.')
  if (litige) actions.push(`Score de fiabilité de ${cmd.fournisseur_nom} recalculé — bascule en contrôle intégral sur les prochaines livraisons.`)
  if (!litige && avoir === 0) actions.push('Dette fournisseur enregistrée à l\'échéance, aucun blocage.')

  return {
    commande_ref: cmd.reference,
    fournisseur_nom: cmd.fournisseur_nom,
    lignes: decisions,
    taux_conformite_pct: Math.round((conformes / decisions.length) * 100),
    avoir_a_reclamer: avoir,
    litige,
    actions_auto: actions,
  }
}

function actionEcart(issue: IssueEcart, ecart: number, pct: number, motif?: string): string {
  switch (issue) {
    case 'ACCEPTE':
      return ecart === 0
        ? 'Conforme — mise en stock immédiate.'
        : `Écart de ${pct} % sous la tolérance de ${TOLERANCE_ECART_PCT} % — accepté, mis en stock.`
    case 'RESERVE':
      return `Manquant de ${Math.abs(ecart)} u. (${pct} %) — réserve portée sur le bon de livraison, avoir réclamé au fournisseur.`
    case 'LITIGE':
      return `Écart de ${pct} %, au-delà du seuil de ${SEUIL_LITIGE_PCT} % — litige ouvert, facture bloquée, marchandise reçue sous réserve.`
    case 'REFUS':
      return `Marchandise refusée${motif ? ` : ${motif}` : ''} — non mise en stock, retour au fournisseur à sa charge.`
  }
}

/* ------------------------------------------------------------------ */
/* Charge des quais                                                    */
/* ------------------------------------------------------------------ */

export interface ChargeQuai {
  entrepot: string
  quais: number
  receptions_jour: number
  duree_totale_min: number
  /** Capacité = quais × heures d'ouverture. */
  capacite_min: number
  sature: boolean
  retards: number
  alerte?: string
}

export function buildChargeQuais(entrepot: string, attendus: ReceptionAttendue[], quais: number): ChargeQuai {
  const dujour = attendus.filter(a => a.entrepot === entrepot && (a.statut === 'A_QUAI' || a.statut === 'EN_RETARD'))
  const duree = dujour.reduce((s, a) => s + a.duree_quai_min, 0)
  // Les quais servent aussi aux départs : la réception n'en dispose qu'à moitié.
  const capacite = quais * 8 * 60 * 0.5
  const sature = duree > capacite
  const retards = dujour.filter(a => a.statut === 'EN_RETARD').length

  return {
    entrepot,
    quais,
    receptions_jour: dujour.length,
    duree_totale_min: duree,
    capacite_min: Math.round(capacite),
    sature,
    retards,
    alerte: sature
      ? `${Math.round(duree / 60)} h de réception pour ${Math.round(capacite / 60)} h de quai disponibles — `
        + 'décaler une livraison fournisseur ou ouvrir le quai en heures supplémentaires.'
      : undefined,
  }
}
