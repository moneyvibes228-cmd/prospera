import type {
  AlerteReappro, CommandeFournisseur, ImpactTresorerie, LigneCommandeFournisseur,
  LigneReception, ProduitStock, RegleReappro, SelectionFournisseur,
} from '@distributeur/types'
import type { AuthUser } from '@distributeur/lib/auth'
import { REGISTRE_STOCK } from '@distributeur/lib/registries/stock-registry'
import { REGISTRE_FOURNISSEURS, getFournisseurById } from '@distributeur/lib/registries/fournisseurs-registry'
import { getFournisseursDuProduit } from '@distributeur/lib/registries/produits-fournisseurs-registry'
import { getRegleProduit, valideurPourMontant } from '@distributeur/lib/registries/regles-reappro-registry'
import { REGISTRE_COMMANDES_FOURNISSEURS, getCommandeFournisseurById } from '@distributeur/lib/registries/commandes-fournisseurs-registry'
import { COMPTES_TRESORERIE } from '@distributeur/lib/registries/comptabilite-registry'

/**
 * Moteur de réapprovisionnement (spec V2 §5.2 à §5.4).
 *
 * Boucle fermée : rupture détectée → quantité calculée → fournisseur choisi →
 * commandes regroupées par fournisseur → garde-fou trésorerie → validation → réception → dette.
 */

const TVA = 0.18
/** Marge de sécurité sur le stock tampon — couvre la variabilité du délai fournisseur. */
const COEFF_SECURITE = 1.3
/** Sous ce solde de trésorerie projeté, l'automatisation s'arrête et escalade au DAF. */
export const SEUIL_PLANCHER_TRESORERIE = 40_000_000
export const DATE_DU_JOUR = '2026-06-11'

function vitesseVenteJour(produit: ProduitStock): number {
  return (produit.ventes_30j ?? produit.seuil * 3) / 30
}

function arrondiLot(quantite: number, lot: number): number {
  if (lot <= 0) return Math.max(0, Math.round(quantite))
  return Math.max(lot, Math.ceil(quantite / lot) * lot)
}

function couvertureJours(produit: ProduitStock): number {
  const vitesse = vitesseVenteJour(produit)
  if (vitesse <= 0) return 999
  return Math.round((produit.stock / vitesse) * 10) / 10
}

function delaiFournisseurPrioritaire(produitRef: string): number {
  const refs = getFournisseursDuProduit(produitRef)
  const prio = refs.find(r => r.prioritaire) ?? refs[0]
  return prio?.delai_j ?? 7
}

/** Quantité à commander selon le mode de la règle (spec §5.2). */
export function calculerQuantiteReappro(produitRef: string, regle: RegleReappro): number {
  const produit = REGISTRE_STOCK.find(p => p.reference === produitRef)
  if (!produit) return 0

  const refs = getFournisseursDuProduit(produitRef)
  const lot = (refs.find(r => r.prioritaire) ?? refs[0])?.quantite_lot ?? 1

  if (regle.mode_quantite === 'QUANTITE_FIXE') {
    return arrondiLot(regle.quantite_fixe ?? regle.stock_cible, lot)
  }

  if (regle.mode_quantite === 'STOCK_CIBLE') {
    return arrondiLot(Math.max(0, regle.stock_cible - produit.stock), lot)
  }

  // PREVISION_IA — on couvre le délai fournisseur + l'horizon de couverture visé.
  const vitesse = vitesseVenteJour(produit)
  const delai = delaiFournisseurPrioritaire(produitRef)
  const stockSecurite = vitesse * delai * COEFF_SECURITE
  const horizon = delai + regle.couverture_min_jours
  const besoin = vitesse * horizon + stockSecurite - produit.stock
  return arrondiLot(Math.max(0, besoin), lot)
}

/** Point de commande : le stock sous lequel il est déjà trop tard pour être livré à temps. */
export function pointDeCommande(produit: ProduitStock): number {
  const vitesse = vitesseVenteJour(produit)
  const delai = delaiFournisseurPrioritaire(produit.reference)
  return Math.round(vitesse * delai * (1 + COEFF_SECURITE))
}

/** Produits à réapprovisionner — seuil franchi ou couverture insuffisante. */
export function detecterProduitsEnManque(): AlerteReappro[] {
  const alertes: AlerteReappro[] = []

  for (const produit of REGISTRE_STOCK) {
    const regle = getRegleProduit(produit.reference)
    if (!regle) continue

    const couverture = couvertureJours(produit)
    const sousSeuil = produit.stock <= regle.seuil_stock
    const couvertureInsuffisante = couverture < regle.couverture_min_jours
    if (!sousSeuil && !couvertureInsuffisante) continue

    const quantite = calculerQuantiteReappro(produit.reference, regle)
    if (quantite <= 0) continue

    const criticite = produit.stock <= regle.seuil_stock * 0.5 || couverture < 3
      ? 'CRITIQUE'
      : sousSeuil ? 'HAUTE' : 'MODEREE'

    alertes.push({
      produit_ref: produit.reference,
      produit_nom: produit.nom,
      categorie: produit.categorie,
      entrepot: produit.entrepot,
      stock_actuel: produit.stock,
      seuil: regle.seuil_stock,
      vitesse_vente_jour: Math.round(vitesseVenteJour(produit) * 10) / 10,
      couverture_jours: couverture,
      quantite_suggeree: quantite,
      motif: sousSeuil ? 'SEUIL_ATTEINT' : 'PREVISION_RUPTURE',
      criticite,
      regle_id: regle.id,
    })
  }

  const ordre = { CRITIQUE: 0, HAUTE: 1, MODEREE: 2 }
  return alertes.sort((a, b) => ordre[a.criticite] - ordre[b.criticite] || a.couverture_jours - b.couverture_jours)
}

function normaliser(valeur: number, min: number, max: number): number {
  if (max === min) return 100
  return Math.max(0, Math.min(100, ((valeur - min) / (max - min)) * 100))
}

/**
 * Sélection du fournisseur (spec §5.2) — prix 30 %, délai réel 25 %, fiabilité 25 %,
 * dette 10 %, franco 10 %. Le délai réel prime sur le délai annoncé : c'est lui qui fait la rupture.
 */
export function selectionnerFournisseur(produitRef: string, quantite: number): SelectionFournisseur | null {
  const candidats = getFournisseursDuProduit(produitRef)
    .map(pf => ({ pf, f: getFournisseurById(pf.fournisseur_id)! }))
    .filter(c => c.f && c.f.statut !== 'SUSPENDU')

  if (candidats.length === 0) return null

  const prix = candidats.map(c => c.pf.prix_achat)
  const delais = candidats.map(c => c.f.delai_reel_moyen_j)
  const dettes = candidats.map(c => c.f.encours_echu)

  const notes = candidats.map(c => {
    const montant = c.pf.prix_achat * quantite
    const scorePrix = 100 - normaliser(c.pf.prix_achat, Math.min(...prix), Math.max(...prix))
    const scoreDelai = 100 - normaliser(c.f.delai_reel_moyen_j, Math.min(...delais), Math.max(...delais))
    const scoreFiabilite = c.f.taux_livraison_conforme_pct
    const scoreDette = 100 - normaliser(c.f.encours_echu, Math.min(...dettes), Math.max(...dettes))
    const scoreFranco = montant >= c.f.franco_de_port ? 100 : (montant / c.f.franco_de_port) * 100

    const score = Math.round(
      0.30 * scorePrix + 0.25 * scoreDelai + 0.25 * scoreFiabilite + 0.10 * scoreDette + 0.10 * scoreFranco,
    )
    return { ...c, score, montant }
  }).sort((a, b) => b.score - a.score)

  const retenu = notes[0]
  const suivant = notes[1]

  const ecartPrix = suivant
    ? Math.round(((retenu.pf.prix_achat - suivant.pf.prix_achat) / suivant.pf.prix_achat) * 100)
    : 0

  const morceaux: string[] = []
  if (suivant && ecartPrix < 0) morceaux.push(`${ecartPrix} % sur le prix vs ${suivant.f.nom}`)
  morceaux.push(`délai réel ${retenu.f.delai_reel_moyen_j} j${suivant ? ` vs ${suivant.f.delai_reel_moyen_j} j` : ''}`)
  morceaux.push(`${retenu.f.taux_livraison_conforme_pct} % de livraisons conformes`)
  if (retenu.f.encours_echu > 0) {
    morceaux.push(`${(retenu.f.encours_echu / 1_000_000).toFixed(1)} M d'encours échu`)
  }
  if (retenu.montant >= retenu.f.franco_de_port) morceaux.push('franco de port atteint')

  return {
    fournisseur_id: retenu.f.id,
    fournisseur_nom: retenu.f.nom,
    prix_achat: retenu.pf.prix_achat,
    delai_j: retenu.pf.delai_j,
    score: retenu.score,
    justification: `${retenu.f.nom} retenu : ${morceaux.join(' · ')}.`,
    alternatif_id: suivant?.f.id,
    alternatif_nom: suivant?.f.nom,
  }
}

function ajouterJours(date: string, jours: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + jours)
  return d.toISOString().slice(0, 10)
}

/**
 * Commandes suggérées, **regroupées par fournisseur** : c'est le regroupement qui fait
 * atteindre le franco de port et la remise volume — le gain économique réel de l'automatisation.
 */
export function genererCommandesSuggerees(): CommandeFournisseur[] {
  const alertes = detecterProduitsEnManque()
  const parFournisseur = new Map<string, { alerte: AlerteReappro; selection: SelectionFournisseur }[]>()

  for (const alerte of alertes) {
    const regle = getRegleProduit(alerte.produit_ref)
    // ALERTE_SEULE : on notifie, on ne prépare aucune commande.
    if (regle?.niveau_auto === 'ALERTE_SEULE') continue

    const selection = selectionnerFournisseur(alerte.produit_ref, alerte.quantite_suggeree)
    if (!selection) continue

    const lot = parFournisseur.get(selection.fournisseur_id) ?? []
    lot.push({ alerte, selection })
    parFournisseur.set(selection.fournisseur_id, lot)
  }

  const commandes: CommandeFournisseur[] = []
  let index = 87

  for (const [fournisseurId, groupe] of parFournisseur) {
    const fournisseur = getFournisseurById(fournisseurId)!

    const lignes: LigneCommandeFournisseur[] = groupe.map(({ alerte, selection }, i) => ({
      produit_ref: alerte.produit_ref,
      produit_nom: alerte.produit_nom,
      quantite_commandee: alerte.quantite_suggeree,
      prix_achat_unitaire: selection.prix_achat,
      total: selection.prix_achat * alerte.quantite_suggeree,
      // Seule la première ligne déclenche la commande ; les autres profitent du regroupement.
      motif: i === 0 ? alerte.motif : 'REGROUPEMENT',
    }))

    const montantHt = lignes.reduce((s, l) => s + l.total, 0)
    const remise = montantHt >= fournisseur.franco_de_port ? fournisseur.remise_volume_pct : 0
    const montantHtRemise = Math.round(montantHt * (1 - remise / 100))
    const montantTtc = Math.round(montantHtRemise * (1 + TVA))

    const regroupe = lignes.length > 1
    const francoAtteint = montantHtRemise >= fournisseur.franco_de_port
    const economie = regroupe
      ? (francoAtteint ? 45_000 : 0) + Math.round(montantHt * (remise / 100))
      : 0

    const valideur = valideurPourMontant(montantTtc)
    const regle = getRegleProduit(groupe[0].alerte.produit_ref)
    const envoiAuto = regle?.niveau_auto === 'AUTO_TOTAL'
      || (regle?.niveau_auto === 'AUTO_SI_SOUS_PLAFOND' && montantTtc <= regle.plafond_auto_fcfa)

    const justification: string[] = [groupe[0].selection.justification]
    if (regroupe) {
      justification.push(
        `${lignes.length} produits regroupés en une commande` +
        (francoAtteint ? ` — franco de port atteint${remise > 0 ? `, remise volume ${remise} %` : ''}, économie ${economie.toLocaleString('fr-FR')} F` : ' — franco non atteint, transport à notre charge'),
      )
    }
    if (!envoiAuto) {
      justification.push(`Montant ${(montantTtc / 1_000_000).toFixed(1)} M TTC — validation ${valideur} requise.`)
    }

    commandes.push({
      id: `cf-sugg-${fournisseurId}`,
      reference: `CF-2026-${String(index++).padStart(4, '0')}`,
      fournisseur_id: fournisseurId,
      fournisseur_nom: fournisseur.nom,
      entrepot_destination: groupe[0].alerte.entrepot,
      statut: envoiAuto ? 'EN_VALIDATION' : 'SUGGEREE_IA',
      origine: 'AUTO_IA',
      regle_declenchee: groupe[0].alerte.regle_id,
      lignes,
      montant_ht: montantHtRemise,
      montant_ttc: montantTtc,
      date_creation: DATE_DU_JOUR,
      date_livraison_prevue: ajouterJours(DATE_DU_JOUR, fournisseur.delai_livraison_j),
      echeance_paiement: ajouterJours(DATE_DU_JOUR, fournisseur.delai_livraison_j + fournisseur.delai_paiement_j),
      statut_paiement: 'NON_DUE',
      montant_paye: 0,
      justification_ia: justification.join(' '),
      fournisseur_alternatif_id: groupe[0].selection.alternatif_id,
      economie_regroupement: economie > 0 ? economie : undefined,
    })
  }

  return commandes.sort((a, b) => b.montant_ttc - a.montant_ttc)
}

/**
 * Garde-fou trésorerie (spec §5.4) : sans cette vérification, l'automatisation peut vider la caisse.
 * Si le solde projeté passe sous le plancher, la commande est escaladée au DAF au lieu d'être envoyée.
 */
export function simulerImpactTresorerie(commandes: CommandeFournisseur[]): ImpactTresorerie {
  const soldeActuel = COMPTES_TRESORERIE.reduce((s, c) => s + c.solde, 0)
  const montantEngage = commandes.reduce((s, c) => s + c.montant_ttc, 0)
  const soldeProjete = soldeActuel - montantEngage
  const franchit = soldeProjete < SEUIL_PLANCHER_TRESORERIE

  return {
    solde_actuel: soldeActuel,
    montant_engage: montantEngage,
    solde_projete: soldeProjete,
    seuil_plancher: SEUIL_PLANCHER_TRESORERIE,
    franchit_plancher: franchit,
    commentaire: franchit
      ? `Le solde projeté (${(soldeProjete / 1_000_000).toFixed(1)} M) passe sous le plancher de ${(SEUIL_PLANCHER_TRESORERIE / 1_000_000).toFixed(0)} M — envoi automatique bloqué, arbitrage DAF requis.`
      : `Solde projeté ${(soldeProjete / 1_000_000).toFixed(1)} M, au-dessus du plancher de ${(SEUIL_PLANCHER_TRESORERIE / 1_000_000).toFixed(0)} M — engagement soutenable.`,
  }
}

/** Validation d'une commande fournisseur — trace le valideur, passe la commande en ENVOYEE. */
export function validerCommandeFournisseur(id: string, valideur: AuthUser): CommandeFournisseur | null {
  const commande = getCommandeFournisseurById(id)
    ?? genererCommandesSuggerees().find(c => c.id === id)
  if (!commande) return null

  return {
    ...commande,
    statut: 'ENVOYEE',
    date_envoi: DATE_DU_JOUR,
    valide_par: valideur.nom,
    valide_le: DATE_DU_JOUR,
  }
}

/** Réception — génère l'entrée en stock et la dette fournisseur ; un écart ouvre un litige. */
export function receptionner(
  id: string,
  lignes: LigneReception[],
): { commande: CommandeFournisseur; stock: ProduitStock[]; dette: number; litige: boolean } | null {
  const commande = getCommandeFournisseurById(id)
  if (!commande) return null

  const lignesRecues = commande.lignes.map(l => {
    const reception = lignes.find(r => r.produit_ref === l.produit_ref)
    return { ...l, quantite_recue: reception?.quantite_recue ?? 0 }
  })

  const complete = lignesRecues.every(l => (l.quantite_recue ?? 0) >= l.quantite_commandee)
  const litige = lignes.some(l => !l.conforme)

  const stock = REGISTRE_STOCK.map(produit => {
    const ligne = lignesRecues.find(l => l.produit_ref === produit.reference)
    return ligne ? { ...produit, stock: produit.stock + (ligne.quantite_recue ?? 0) } : produit
  })

  // La dette naît à la réception, sur la base des quantités réellement reçues.
  const detteHt = lignesRecues.reduce((s, l) => s + l.prix_achat_unitaire * (l.quantite_recue ?? 0), 0)
  const dette = Math.round(detteHt * (1 + TVA))
  const fournisseur = getFournisseurById(commande.fournisseur_id)

  return {
    commande: {
      ...commande,
      lignes: lignesRecues,
      statut: litige ? 'LITIGE' : complete ? 'RECUE' : 'RECUE_PARTIELLE',
      date_livraison_reelle: DATE_DU_JOUR,
      statut_paiement: 'A_PAYER',
      echeance_paiement: ajouterJours(DATE_DU_JOUR, fournisseur?.delai_paiement_j ?? 30),
    },
    stock,
    dette,
    litige,
  }
}

/** Commandes fournisseurs en attente d'une validation humaine — badge du menu Approvisionnement. */
export function commandesEnAttenteValidation(): CommandeFournisseur[] {
  const suggerees = genererCommandesSuggerees()
    .filter(c => c.statut === 'SUGGEREE_IA' || c.statut === 'EN_VALIDATION')
  const existantes = REGISTRE_COMMANDES_FOURNISSEURS
    .filter(c => c.statut === 'EN_VALIDATION' || c.statut === 'SUGGEREE_IA')
  return [...suggerees, ...existantes]
}

/** Échéancier de la dette fournisseur — vue DAF : ce qui sort à J+7 / J+15 / J+30. */
export interface TrancheEcheance {
  tranche: 'ECHU' | 'J+7' | 'J+15' | 'J+30' | 'AU_DELA'
  label: string
  montant: number
  fournisseurs: string[]
}

export function buildEcheancierFournisseurs(): TrancheEcheance[] {
  const aujourdhui = new Date(DATE_DU_JOUR)
  const tranches: Record<TrancheEcheance['tranche'], TrancheEcheance> = {
    ECHU:    { tranche: 'ECHU',    label: 'Échu — à régler',        montant: 0, fournisseurs: [] },
    'J+7':   { tranche: 'J+7',     label: 'Sous 7 jours',           montant: 0, fournisseurs: [] },
    'J+15':  { tranche: 'J+15',    label: 'Sous 15 jours',          montant: 0, fournisseurs: [] },
    'J+30':  { tranche: 'J+30',    label: 'Sous 30 jours',          montant: 0, fournisseurs: [] },
    AU_DELA: { tranche: 'AU_DELA', label: 'Au-delà de 30 jours',    montant: 0, fournisseurs: [] },
  }

  for (const f of REGISTRE_FOURNISSEURS) {
    if (f.encours_echu > 0) {
      tranches.ECHU.montant += f.encours_echu
      tranches.ECHU.fournisseurs.push(f.nom)
    }

    const aVenir = f.encours_du - f.encours_echu
    if (aVenir <= 0) continue

    const jours = Math.round((new Date(f.prochaine_echeance).getTime() - aujourdhui.getTime()) / 86_400_000)
    const cle: TrancheEcheance['tranche'] = jours <= 7 ? 'J+7' : jours <= 15 ? 'J+15' : jours <= 30 ? 'J+30' : 'AU_DELA'
    tranches[cle].montant += aVenir
    tranches[cle].fournisseurs.push(f.nom)
  }

  return Object.values(tranches).filter(t => t.montant > 0)
}
