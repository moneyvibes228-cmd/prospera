/**
 * Moteur d'inventaire tournant — compter sans jamais fermer l'entrepôt.
 *
 * L'inventaire annuel est une mauvaise réponse à un vrai problème : on ferme deux jours,
 * on compte tout, on découvre en janvier un écart né en mars, et on ne peut plus rien
 * y faire. L'inventaire tournant compte tous les jours un petit sous-ensemble, choisi
 * par valeur et par rotation (classification ABC) :
 *
 *   A — 20 % des références, ~80 % de la valeur : comptées tous les mois.
 *   B — 30 % des références, ~15 % de la valeur : tous les trimestres.
 *   C — 50 % des références, ~5 % de la valeur : deux fois l'an.
 *
 * L'écart devient alors détectable en quelques semaines, quand la vidéo, le BL et le
 * préparateur du jour existent encore. C'est ce qui sépare la démarque expliquée du vol.
 */

import { REGISTRE_STOCK } from './registries/stock-registry'
import { getFicheLogistique, FICHES_LOGISTIQUES } from './registries/entrepot-logistique-registry'
import { DATE_DU_JOUR } from './reappro-engine'
import { hashString, randInt, seededRandom } from './generators/mock-seed'

export type ClasseABC = 'A' | 'B' | 'C'

export interface LigneABC {
  produit_ref: string
  produit_nom: string
  entrepot: string
  classe: ClasseABC
  /** Valeur de consommation annuelle au coût d'achat — le critère de classement. */
  valeur_consommee_an: number
  part_valeur_pct: number
  /** Part cumulée : c'est la courbe de Pareto qui découpe A, B et C. */
  cumul_pct: number
  rotation_an: number
  /** Cadence de comptage imposée par la classe. */
  frequence_jours: number
  dernier_comptage: string
  prochain_comptage: string
  /** Jours de retard sur le planning de comptage. */
  retard_jours: number
}

export type StatutComptage = 'A_COMPTER' | 'EN_RETARD' | 'PLANIFIE'

export interface TacheComptage {
  produit_ref: string
  produit_nom: string
  entrepot: string
  emplacement: string
  allee: string
  classe: ClasseABC
  statut: StatutComptage
  stock_theorique: number
  /** Écarts constatés lors des 3 derniers comptages — un SKU qui dérive est suspect. */
  ecarts_recents: number
  suspicion?: string
  /** Temps de comptage estimé, en minutes. */
  duree_min: number
}

export interface EcartInventaire {
  produit_ref: string
  produit_nom: string
  entrepot: string
  classe: ClasseABC
  stock_theorique: number
  stock_compte: number
  ecart: number
  ecart_pct: number
  /** Valeur de l'écart au coût d'achat — la perte sèche. */
  valeur_ecart: number
  cause_probable: string
  action: string
}

export interface SyntheseInventaire {
  entrepot: string
  sku_total: number
  /** Fiabilité du stock : part des références comptées sans écart significatif. */
  fiabilite_stock_pct: number
  taches_du_jour: number
  taches_en_retard: number
  /** Valeur cumulée de la démarque constatée sur 90 jours. */
  demarque_90j: number
  demarque_pct_ca: number
  sku_suspects: number
  alerte?: string
}

/** Écart au-delà duquel on ne parle plus d'erreur de comptage. */
export const SEUIL_ECART_SIGNIFICATIF_PCT = 3

const FREQUENCE_PAR_CLASSE: Record<ClasseABC, number> = { A: 30, B: 90, C: 180 }

/* ------------------------------------------------------------------ */
/* Classification ABC                                                  */
/* ------------------------------------------------------------------ */

function ajouterJours(date: string, jours: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + jours)
  return d.toISOString().slice(0, 10)
}

function joursEntre(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000)
}

/**
 * Classement ABC par valeur de consommation annuelle (Pareto), au **coût d'achat** :
 * ce qui compte n'est pas ce que le produit rapporte, c'est ce qu'il immobilise et
 * ce que sa disparition coûte.
 */
export function buildClassificationABC(entrepots: string[]): LigneABC[] {
  const produits = REGISTRE_STOCK.filter(p => entrepots.includes(p.entrepot))

  const avecValeur = produits.map(p => {
    const fiche = getFicheLogistique(p.reference)
    const ventesAn = (p.ventes_30j ?? p.seuil * 3) * 12
    const cout = fiche?.cout_achat ?? Math.round(p.prix_unitaire * 0.84)
    return {
      produit: p,
      valeur: ventesAn * cout,
      rotation: p.stock > 0 ? Math.round((ventesAn / p.stock) * 10) / 10 : 0,
    }
  }).sort((a, b) => b.valeur - a.valeur)

  const total = avecValeur.reduce((s, x) => s + x.valeur, 0) || 1
  let cumul = 0

  return avecValeur.map(x => {
    const part = (x.valeur / total) * 100
    cumul += part
    const classe: ClasseABC = cumul <= 80 ? 'A' : cumul <= 95 ? 'B' : 'C'
    const frequence = FREQUENCE_PAR_CLASSE[classe]

    // Historique de comptage déterministe : chaque SKU a sa propre dérive.
    const rng = seededRandom(hashString(`inv-${x.produit.reference}`))
    const dernier = ajouterJours(DATE_DU_JOUR, -randInt(rng, 5, Math.round(frequence * 1.4)))
    const prochain = ajouterJours(dernier, frequence)
    const retard = Math.max(0, joursEntre(DATE_DU_JOUR, prochain))

    return {
      produit_ref: x.produit.reference,
      produit_nom: x.produit.nom,
      entrepot: x.produit.entrepot,
      classe,
      valeur_consommee_an: x.valeur,
      part_valeur_pct: Math.round(part * 10) / 10,
      cumul_pct: Math.round(cumul * 10) / 10,
      rotation_an: x.rotation,
      frequence_jours: frequence,
      dernier_comptage: dernier,
      prochain_comptage: prochain,
      retard_jours: retard,
    }
  })
}

/* ------------------------------------------------------------------ */
/* Planning de comptage                                                */
/* ------------------------------------------------------------------ */

/** Nombre d'écarts constatés aux 3 derniers comptages — déterministe par SKU. */
function ecartsRecents(ref: string): number {
  const rng = seededRandom(hashString(`ecart-${ref}`))
  const tirage = rng()
  // 70 % des SKU sont sains, 20 % dérivent une fois, 10 % dérivent de façon répétée.
  return tirage > 0.9 ? 3 : tirage > 0.7 ? 1 : 0
}

/**
 * Les comptages à faire aujourd'hui. On sert d'abord le retard (une classe A non comptée
 * depuis 45 jours est une bombe à retardement), puis les SKU à écarts répétés.
 */
export function buildTachesComptage(entrepots: string[], abc: LigneABC[]): TacheComptage[] {
  return abc
    .filter(l => entrepots.includes(l.entrepot))
    .filter(l => l.retard_jours >= 0 || l.classe === 'A')
    .map(l => {
      const produit = REGISTRE_STOCK.find(p => p.reference === l.produit_ref)!
      const fiche = getFicheLogistique(l.produit_ref)
      const ecarts = ecartsRecents(l.produit_ref)

      const statut: StatutComptage = l.retard_jours > 15
        ? 'EN_RETARD'
        : l.retard_jours >= 0 ? 'A_COMPTER' : 'PLANIFIE'

      return {
        produit_ref: l.produit_ref,
        produit_nom: l.produit_nom,
        entrepot: l.entrepot,
        emplacement: fiche?.emplacement ?? '—',
        allee: fiche?.allee ?? '—',
        classe: l.classe,
        statut,
        stock_theorique: produit.stock,
        ecarts_recents: ecarts,
        suspicion: ecarts >= 3
          ? `${ecarts} écarts sur les 3 derniers comptages — dérive récurrente, comptage contradictoire à deux personnes et revue des BL de sortie.`
          : undefined,
        // Une palette se compte vite, du picking au colis beaucoup moins.
        duree_min: Math.max(4, Math.round(produit.stock / (fiche?.unites_par_palette ?? 60)) * 3 + 4),
      }
    })
    .filter(t => t.statut !== 'PLANIFIE')
    .sort((a, b) =>
      ordreStatutComptage(a.statut) - ordreStatutComptage(b.statut)
      || b.ecarts_recents - a.ecarts_recents
      || a.classe.localeCompare(b.classe))
}

function ordreStatutComptage(s: StatutComptage): number {
  return { EN_RETARD: 0, A_COMPTER: 1, PLANIFIE: 2 }[s]
}

/* ------------------------------------------------------------------ */
/* Écarts & démarque                                                   */
/* ------------------------------------------------------------------ */

/** Verdict sur un comptage saisi — le magasinier entre une quantité, le moteur tranche. */
export function analyserEcart(produitRef: string, stockCompte: number, abc: LigneABC[]): EcartInventaire | null {
  const produit = REGISTRE_STOCK.find(p => p.reference === produitRef)
  const fiche = getFicheLogistique(produitRef)
  const ligne = abc.find(l => l.produit_ref === produitRef)
  if (!produit || !fiche || !ligne) return null

  const ecart = stockCompte - produit.stock
  const ecartPct = produit.stock > 0 ? Math.round((Math.abs(ecart) / produit.stock) * 1000) / 10 : 0
  const valeur = Math.abs(ecart) * fiche.cout_achat
  const ecarts = ecartsRecents(produitRef)

  return {
    produit_ref: produitRef,
    produit_nom: produit.nom,
    entrepot: produit.entrepot,
    classe: ligne.classe,
    stock_theorique: produit.stock,
    stock_compte: stockCompte,
    ecart,
    ecart_pct: ecartPct,
    valeur_ecart: valeur,
    cause_probable: causeProbable(ecart, ecartPct, ecarts, fiche.fragile),
    action: actionEcart(ecart, ecartPct, ligne.classe, valeur),
  }
}

function causeProbable(ecart: number, pct: number, ecartsRepetes: number, fragile: boolean): string {
  if (ecart > 0) {
    return 'Stock supérieur au théorique — réception non saisie, ou retour client remis en rayon sans mouvement.'
  }
  if (pct <= 1) {
    return fragile
      ? 'Écart faible sur produit fragile — casse de manutention, cause la plus probable.'
      : 'Écart faible — erreur de comptage ou reliquat de préparation non déclaré.'
  }
  if (ecartsRepetes >= 3) {
    return 'Écart négatif récurrent sur cette référence — sorties non tracées : BL non saisi, ou démarque interne. À traiter comme tel.'
  }
  return 'Écart négatif significatif — sortie sans bon de livraison, ou erreur de picking au profit d\'un autre client.'
}

function actionEcart(ecart: number, pct: number, classe: ClasseABC, valeur: number): string {
  if (pct <= 1) return `Ajustement passé automatiquement (${valeur.toLocaleString('fr-FR')} F) — sous le seuil d'investigation.`
  if (pct <= SEUIL_ECART_SIGNIFICATIF_PCT) {
    return `Ajustement soumis à validation du responsable stock — ${valeur.toLocaleString('fr-FR')} F d'impact.`
  }
  return classe === 'A'
    ? `Écart de ${pct} % sur une classe A (${valeur.toLocaleString('fr-FR')} F) — recomptage contradictoire obligatoire avant tout ajustement, BL des 30 derniers jours à ressortir.`
    : `Écart de ${pct} % (${valeur.toLocaleString('fr-FR')} F) — recomptage requis, ajustement bloqué en attendant.`
}

/* ------------------------------------------------------------------ */
/* Synthèse                                                            */
/* ------------------------------------------------------------------ */

export function buildSyntheseInventaire(
  entrepot: string,
  abc: LigneABC[],
  taches: TacheComptage[],
): SyntheseInventaire {
  const duSite = abc.filter(l => l.entrepot === entrepot)
  const tachesSite = taches.filter(t => t.entrepot === entrepot)
  const suspects = tachesSite.filter(t => t.ecarts_recents >= 3)
  const retards = tachesSite.filter(t => t.statut === 'EN_RETARD')

  // Démarque : les SKU qui dérivent, sur la base de leur valeur de consommation.
  const demarque = suspects.reduce((s, t) => {
    const fiche = FICHES_LOGISTIQUES.find(f => f.produit_ref === t.produit_ref)
    const produit = REGISTRE_STOCK.find(p => p.reference === t.produit_ref)
    if (!fiche || !produit) return s
    // ~1,5 % du stock théorique perdu par trimestre sur un SKU qui dérive.
    return s + Math.round(produit.stock * 0.015 * fiche.cout_achat)
  }, 0)

  const caTrimestre = duSite.reduce((s, l) => s + l.valeur_consommee_an, 0) / 4 || 1
  const fiabilite = duSite.length > 0
    ? Math.round(((duSite.length - suspects.length) / duSite.length) * 100)
    : 100

  let alerte: string | undefined
  if (retards.length > 0) {
    const classeA = retards.filter(t => t.classe === 'A').length
    alerte = `${retards.length} comptage${retards.length > 1 ? 's' : ''} en retard`
      + (classeA > 0 ? `, dont ${classeA} sur des références de classe A — ce sont elles qui portent la valeur du stock.` : '.')
  } else if (suspects.length > 0) {
    alerte = `${suspects.length} référence${suspects.length > 1 ? 's' : ''} à écarts répétés — `
      + `${Math.round(demarque / 1_000).toLocaleString('fr-FR')} K de démarque estimée sur 90 j.`
  }

  return {
    entrepot,
    sku_total: duSite.length,
    fiabilite_stock_pct: fiabilite,
    taches_du_jour: tachesSite.filter(t => t.statut === 'A_COMPTER').length,
    taches_en_retard: retards.length,
    demarque_90j: demarque,
    demarque_pct_ca: Math.round((demarque / caTrimestre) * 1000) / 10,
    sku_suspects: suspects.length,
    alerte,
  }
}
