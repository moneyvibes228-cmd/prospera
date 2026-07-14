import type {
  LigneFacture, Proforma, ProformaStatut, PointDeVente, ProduitStock,
  ModePaiementFacture, Commande, TypeClientCommande,
} from '@/types'

/**
 * Calculs et aide IA sur les proformas (spec V2 §4).
 *
 * Ce module ne connaît pas le registre : il prend les proformas en argument.
 * C'est ce qui permet au registre de l'importer pour ses propres calculs sans cycle.
 */

/** TVA Togo. */
export const TVA_PCT = 18
/** Une proforma est valable 15 jours, puis expire. */
export const VALIDITE_JOURS = 15

export interface Totaux {
  montant_ht: number
  tva: number
  montant_ttc: number
}

export function calculerTotaux(lignes: LigneFacture[], remiseGlobalePct = 0): Totaux {
  const brut = lignes.reduce((s, l) => s + l.total, 0)
  const montantHt = Math.round(brut * (1 - remiseGlobalePct / 100))
  const tva = Math.round(montantHt * (TVA_PCT / 100))
  return { montant_ht: montantHt, tva, montant_ttc: montantHt + tva }
}

export function ligneDepuisProduit(produit: ProduitStock, quantite: number, remisePct = 0): LigneFacture {
  const total = Math.round(produit.prix_unitaire * quantite * (1 - remisePct / 100))
  return {
    reference: produit.reference,
    produit: produit.nom,
    quantite,
    prix_unitaire: produit.prix_unitaire,
    remise_pct: remisePct,
    total,
  }
}

/**
 * Score d'acceptation — probabilité que le client signe.
 * Il s'appuie sur ce qu'on sait déjà du PDV : sa santé, son encours, son historique.
 */
export function scoreAcceptationIA(params: {
  score_pdv: number
  creance: number
  plafond_credit: number
  remise_pct: number
  montant_ttc: number
  panier_habituel: number
  relances_envoyees?: number
  vue?: boolean
}): number {
  const { score_pdv, creance, plafond_credit, remise_pct, montant_ttc, panier_habituel } = params

  let score = score_pdv * 0.5

  // Un client déjà au bord de son plafond de crédit signe moins facilement.
  const tauxPlafond = plafond_credit > 0 ? creance / plafond_credit : 0
  score -= Math.min(25, tauxPlafond * 30)

  // Une remise pousse à la signature, avec un rendement décroissant.
  score += Math.min(20, remise_pct * 3.5)

  // Un panier très au-dessus des habitudes du client freine la décision.
  if (panier_habituel > 0) {
    const ratio = montant_ttc / panier_habituel
    if (ratio > 1.5) score -= Math.min(18, (ratio - 1.5) * 12)
    else if (ratio < 0.8) score += 6
  }

  // Une proforma ouverte est un signal d'intérêt ; les relances sans réponse, un signal inverse.
  if (params.vue) score += 8
  score -= (params.relances_envoyees ?? 0) * 4

  return Math.max(0, Math.min(100, Math.round(score + 25)))
}

/** Le levier concret à proposer au commercial pour faire signer. */
export function suggestionIA(p: Proforma, scorePdv: number, creance: number): string | undefined {
  if (p.statut === 'ACCEPTEE' || p.statut === 'CONVERTIE') return undefined

  if (creance > 0 && p.score_acceptation_ia < 50) {
    return `Encours de ${(creance / 1_000_000).toFixed(1)} M non soldé : solder l'impayé avant de relancer, sinon la proforma restera sans réponse.`
  }
  if (p.remise_globale_pct < 3 && p.score_acceptation_ia < 65) {
    const gain = Math.min(20, 3 * 3.5)
    return `Remise 3 % → +${Math.round(gain)} pts d'acceptation, pour ${Math.round(p.montant_ht * 0.03).toLocaleString('fr-FR')} F de marge cédée.`
  }
  if (p.statut === 'ENVOYEE' && p.relances_envoyees === 0) {
    return 'Envoyée mais non ouverte : une relance WhatsApp le jour même double le taux d\'ouverture.'
  }
  if (p.statut === 'VUE') {
    return `Vue le ${p.vue_le} sans réponse — le client hésite. Un appel maintenant vaut mieux qu'une relance écrite.`
  }
  if (scorePdv >= 80 && p.score_acceptation_ia >= 70) {
    return 'Client fidèle, score élevé : convertir directement en commande sans attendre la réponse écrite.'
  }
  return undefined
}

/** Jours restants avant expiration — négatif si déjà expirée. */
export function joursAvantExpiration(p: Proforma, aujourdhui = '2026-06-11'): number {
  return Math.round(
    (new Date(p.date_validite).getTime() - new Date(aujourdhui).getTime()) / 86_400_000,
  )
}

export function estExpirante(p: Proforma, aujourdhui = '2026-06-11'): boolean {
  if (!['ENVOYEE', 'VUE', 'BROUILLON'].includes(p.statut)) return false
  const jours = joursAvantExpiration(p, aujourdhui)
  return jours >= 0 && jours <= 2
}

/** Conversion proforma → commande : le point de bascule du cycle documentaire. */
export function convertirEnCommande(p: Proforma, pdv: PointDeVente, typeClient: TypeClientCommande): Commande {
  return {
    id: `cmd-from-${p.id}`,
    reference: `CMD-2026-${p.numero.split('-').pop()}`,
    pdv_id: p.pdv_id,
    pdv_nom: p.pdv_nom,
    commercial: p.commercial,
    type_commercial: pdv.type_proprietaire,
    montant_societe: p.montant_ttc,
    statut: 'VALIDEE',
    date: '2026-06-11',
    lignes: p.lignes.length,
    zone: p.zone,
    entrepot: pdv.entrepot_source,
    type_magasin: pdv.type_magasin,
    type_client: typeClient,
    marge_brute_pct: 16,
    familles: [...new Set(p.lignes.map(l => l.produit.split(' ')[0]))],
    priorite_ia: 'NORMALE',
  }
}

export interface SyntheseProformas {
  total: number
  en_attente: number
  taux_acceptation_pct: number
  delai_moyen_conversion_j: number
  montant_en_jeu: number
  expirantes_48h: number
  score_moyen: number
}

export function buildSyntheseProformas(proformas: Proforma[]): SyntheseProformas {
  const ouvertes = proformas.filter(p => ['BROUILLON', 'ENVOYEE', 'VUE'].includes(p.statut))
  const tranchees = proformas.filter(p => ['ACCEPTEE', 'CONVERTIE', 'REFUSEE', 'EXPIREE'].includes(p.statut))
  const gagnees = proformas.filter(p => ['ACCEPTEE', 'CONVERTIE'].includes(p.statut))

  const converties = proformas.filter(p => p.statut === 'CONVERTIE')
  const delai = converties.length > 0
    ? converties.reduce((s, p) => {
      const jours = (new Date(p.date_validite).getTime() - new Date(p.date_emission).getTime()) / 86_400_000
      return s + Math.max(1, Math.round(jours / 2))
    }, 0) / converties.length
    : 0

  return {
    total: proformas.length,
    en_attente: ouvertes.length,
    taux_acceptation_pct: tranchees.length > 0
      ? Math.round((gagnees.length / tranchees.length) * 100)
      : 0,
    delai_moyen_conversion_j: Math.round(delai * 10) / 10,
    montant_en_jeu: ouvertes.reduce((s, p) => s + p.montant_ttc, 0),
    expirantes_48h: proformas.filter(p => estExpirante(p)).length,
    score_moyen: ouvertes.length > 0
      ? Math.round(ouvertes.reduce((s, p) => s + p.score_acceptation_ia, 0) / ouvertes.length)
      : 0,
  }
}

/** Taux d'acceptation par commercial — le DC compare sa force de vente. */
export interface AcceptationCommercial {
  commercial: string
  emises: number
  gagnees: number
  taux_pct: number
  montant_gagne: number
  score_moyen: number
}

export function buildAcceptationParCommercial(proformas: Proforma[]): AcceptationCommercial[] {
  const map = new Map<string, Proforma[]>()
  for (const p of proformas) {
    const liste = map.get(p.commercial) ?? []
    liste.push(p)
    map.set(p.commercial, liste)
  }

  return [...map.entries()].map(([commercial, liste]) => {
    const tranchees = liste.filter(p => ['ACCEPTEE', 'CONVERTIE', 'REFUSEE', 'EXPIREE'].includes(p.statut))
    const gagnees = liste.filter(p => ['ACCEPTEE', 'CONVERTIE'].includes(p.statut))
    return {
      commercial,
      emises: liste.length,
      gagnees: gagnees.length,
      taux_pct: tranchees.length > 0 ? Math.round((gagnees.length / tranchees.length) * 100) : 0,
      montant_gagne: gagnees.reduce((s, p) => s + p.montant_ttc, 0),
      score_moyen: Math.round(liste.reduce((s, p) => s + p.score_acceptation_ia, 0) / liste.length),
    }
  }).sort((a, b) => b.taux_pct - a.taux_pct)
}

export const STATUT_PROFORMA_STYLE: Record<ProformaStatut, { label: string; className: string }> = {
  BROUILLON: { label: 'Brouillon', className: 'bg-slate-100 text-slate-600' },
  ENVOYEE:   { label: 'Envoyée',   className: 'bg-sky-100 text-sky-700' },
  VUE:       { label: 'Vue',       className: 'bg-indigo-100 text-indigo-700' },
  ACCEPTEE:  { label: 'Acceptée',  className: 'bg-emerald-100 text-emerald-700' },
  CONVERTIE: { label: 'Convertie', className: 'bg-teal-100 text-teal-700' },
  REFUSEE:   { label: 'Refusée',   className: 'bg-red-100 text-red-700' },
  EXPIREE:   { label: 'Expirée',   className: 'bg-orange-100 text-orange-700' },
}

export const CANAL_LABEL: Record<Proforma['canal_envoi'], string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  SMS: 'SMS',
  IMPRESSION: 'Impression',
}

export const MODE_PAIEMENT_LABEL: Record<ModePaiementFacture, string> = {
  VIREMENT: 'Virement',
  ESPECES: 'Espèces',
  CHEQUE: 'Chèque',
  CREDIT_30J: 'Crédit 30 j',
  CREDIT_45J: 'Crédit 45 j',
  CREDIT_60J: 'Crédit 60 j',
}
