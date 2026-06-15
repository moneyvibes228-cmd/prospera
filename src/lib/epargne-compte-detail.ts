/**
 * Fiche détaillée compte épargne — données enrichies par type (DAT, Tontine, À vue, Bloquée).
 */
import type {
  CompteEpargne,
  MouvementEpargne,
  ProduitEpargne,
  TontineCycle,
  TypeCompteEpargne,
} from '@/lib/epargne-hub'
import {
  getAllComptesEpargne,
  getMouvementsEpargne,
  getTontinesFromComptes,
  getCatalogueProduit,
} from '@/lib/epargne-registry'

export interface MembreTontine {
  nom: string
  role: 'PRESIDENTE' | 'TRESORIERE' | 'MEMBRE'
  cotisation_fcfa: number
  statut: 'A_JOUR' | 'RETARD' | 'EXONERE'
  telephone?: string
}

export interface CreditLieEpargne {
  reference: string
  montant_fcfa: number
  couverture_pct: number
  statut: 'EN_COURS' | 'SOLDE' | 'EN_ANALYSE'
  mensualite_fcfa?: number
}

export interface CompteEpargneDetail {
  compte: CompteEpargne
  produit: Omit<ProduitEpargne, 'clients_actifs' | 'encours_fcfa'>
  date_ouverture: string
  agent_ouverture: string
  mouvements: MouvementEpargne[]
  progression_objectif_pct?: number
  interets_cumules_fcfa?: number
  /** DAT */
  date_echeance?: string
  montant_initial_fcfa?: number
  duree_restante_jours?: number
  renouvellement_auto?: boolean
  /** Tontine */
  tontine?: TontineCycle
  membres?: MembreTontine[]
  cotisation_mensuelle_fcfa?: number
  /** Bloquée */
  credit_lie?: CreditLieEpargne
  date_deblocage_prevue?: string
  /** À vue */
  plafond_retrait_jour_fcfa?: number
  mandataire?: { nom: string; telephone: string; lien: string }
  /** Cross-sell */
  credit_eligible_fcfa?: number
  analyse_ia: string
  alertes: string[]
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number, i = 0): T {
  return arr[(seed + i) % arr.length]
}

const AGENTS = ['Mensah Kodjo', 'Sena Dossou', 'Elom Komlavi', 'Kossi Adjavon', 'Yawo Adjavon', 'Edem Kpélim']

export function getCompteEpargneById(id: string): CompteEpargne | undefined {
  return getAllComptesEpargne().find(c => c.id === id || c.numero === id)
}

function buildMembresTontine(compte: CompteEpargne, seed: number, n: number): MembreTontine[] {
  const prenoms = ['Abla', 'Akua', 'Edem', 'Sika', 'Mawu', 'Koffi', 'Yawa', 'Komla', 'Afi', 'Enyonam']
  const noms = ['Mensah', 'Adjovi', 'Lawson', 'Dossou', 'Senou', 'Togbedji', 'Agbeko', 'Kpodar']
  const out: MembreTontine[] = []
  for (let i = 0; i < n; i++) {
    const cot = 10_000 + (seed + i * 7) % 6 * 5_000
    out.push({
      nom: `${pick(prenoms, seed, i)} ${pick(noms, seed, i + 2)}`,
      role: i === 0 ? 'PRESIDENTE' : i === 1 ? 'TRESORIERE' : 'MEMBRE',
      cotisation_fcfa: cot,
      statut: i === n - 1 && compte.id === 'EP-003' ? 'RETARD' : 'A_JOUR',
      telephone: i < 3 ? `+228 90 ${20 + (seed + i) % 70} ${30 + (seed + i) % 60} ${40 + (seed + i) % 50}` : undefined,
    })
  }
  return out
}

function analyseIa(compte: CompteEpargne, type: TypeCompteEpargne): string {
  if (compte.statut === 'DORMANT') {
    return `Compte dormant depuis ${compte.dernier_mouvement} — campagne réactivation recommandée (WhatsApp + offre DAT 8,5 %). Potentiel réactivation estimé à ${Math.round(compte.solde_fcfa * 1.3 / 1000)}k FCFA sur 90 jours.`
  }
  switch (type) {
    case 'DAT':
      return `Profil épargnant stable — objectif ${compte.objectif_fcfa ? 'à ' + Math.round((compte.solde_fcfa / compte.objectif_fcfa) * 100) + ' %' : 'non défini'}. Renouvellement DAT conseillé à échéance pour maintenir le taux 8,5 %/an.`
    case 'TONTINE':
      return compte.id === 'EP-003'
        ? 'Cycle en clôture imminente — coordonner redistribution et liquidité agence Bè Kpota cette semaine.'
        : 'Groupe discipliné — cotisations régulières. Pas de signal de défection détecté.'
    case 'BLOQUE':
      return 'Garantie crédit active — couverture solide. Déblocage conditionné au remboursement intégral du prêt lié.'
    default:
      return compte.solde_fcfa >= 500_000
        ? 'Client éligible crédit garanti 1,5× solde — opportunité cross-sell à faible risque.'
        : 'Compte à vue actif — flux réguliers. Proposer passage DAT si capacité d\'épargne confirmée.'
  }
}

export function buildCompteEpargneDetail(compte: CompteEpargne): CompteEpargneDetail {
  const seed = hashStr(compte.id + compte.numero)
  const produit = getCatalogueProduit(compte.type)
  const allMouvements = getMouvementsEpargne(getAllComptesEpargne())
  const mouvements = allMouvements.filter(m => m.compte_id === compte.id).slice(0, 12)
  if (mouvements.length === 0) {
    const types: MouvementEpargne['type'][] = ['DEPOT', 'DEPOT', 'RETRAIT', 'DEPOT', 'INTERET']
    const canaux: MouvementEpargne['canal'][] = ['MOMO', 'CAISSE', 'MOMO', 'VIREMENT']
    let solde = compte.solde_fcfa
    for (let i = 0; i < 6; i++) {
      const type = types[(seed + i) % types.length]
      const isIn = type === 'DEPOT' || type === 'INTERET'
      const amt = Math.round(compte.solde_fcfa * (0.05 + ((seed + i * 3) % 15) / 100))
      if (isIn) solde = Math.max(amt, solde - amt + amt)
      else solde = Math.max(10_000, solde - amt)
      mouvements.push({
        id: `${compte.id}-gen-${i}`,
        date: `${String(28 - i).padStart(2, '0')}/05/2026 ${String(9 + i).padStart(2, '0')}:00`,
        compte_id: compte.id,
        client: compte.client,
        type,
        montant_fcfa: amt,
        solde_apres: isIn ? compte.solde_fcfa - i * 20_000 : solde,
        canal: canaux[(seed + i) % canaux.length],
      })
    }
    mouvements.reverse()
  }

  const progression = compte.objectif_fcfa
    ? Math.min(100, Math.round((compte.solde_fcfa / compte.objectif_fcfa) * 100))
    : undefined

  const interets = compte.type === 'DAT' || compte.type === 'BLOQUE' || compte.type === 'VUE'
    ? Math.round(compte.solde_fcfa * ((compte.taux_pct ?? 2.5) / 100) * 0.45)
    : undefined

  const base: CompteEpargneDetail = {
    compte,
    produit,
    date_ouverture: compte.type === 'DAT' ? '15/11/2025' : compte.type === 'TONTINE' ? '01/03/2026' : `${String(1 + seed % 20).padStart(2, '0')}/0${1 + seed % 8}/202${4 + (seed % 2)}`,
    agent_ouverture: pick(AGENTS, seed),
    mouvements,
    progression_objectif_pct: progression,
    interets_cumules_fcfa: interets,
    credit_eligible_fcfa: compte.solde_fcfa >= 200_000 ? Math.round(compte.solde_fcfa * 1.5) : undefined,
    analyse_ia: analyseIa(compte, compte.type),
    alertes: [],
  }

  if (compte.statut === 'DORMANT') {
    base.alertes.push('Compte sans mouvement depuis plus de 6 mois')
  }

  if (compte.type === 'DAT') {
    base.date_echeance = '15/11/2026'
    base.montant_initial_fcfa = Math.round(compte.solde_fcfa * 0.82)
    base.duree_restante_jours = 170 + (seed % 30)
    base.renouvellement_auto = seed % 3 !== 0
    if (progression && progression >= 80) {
      base.alertes.push('Objectif DAT proche — proposer renouvellement anticipé')
    }
  }

  if (compte.type === 'TONTINE') {
    const tontines = getTontinesFromComptes(getAllComptesEpargne())
    base.tontine = tontines.find(t => t.nom === compte.client) ?? tontines.find(t => t.encours_fcfa === compte.solde_fcfa)
    const nMembres = base.tontine?.membres ?? 8 + seed % 6
    base.membres = buildMembresTontine(compte, seed, Math.min(nMembres, 10))
    base.cotisation_mensuelle_fcfa = base.membres.reduce((s, m) => s + m.cotisation_fcfa, 0)
    if (base.tontine?.alerte) base.alertes.push(base.tontine.alerte)
    if (base.tontine?.statut === 'RETARD') base.alertes.push('Retard cotisation sur le cycle en cours')
  }

  if (compte.type === 'BLOQUE') {
    const montantPret = Math.round(compte.solde_fcfa * 2.2)
    base.credit_lie = {
      reference: `DOS-2026-${String(100 + seed % 900).padStart(4, '0')}`,
      montant_fcfa: montantPret,
      couverture_pct: Math.min(100, Math.round((compte.solde_fcfa / montantPret) * 100)),
      statut: 'EN_COURS',
      mensualite_fcfa: Math.round(montantPret / 18),
    }
    base.date_deblocage_prevue = `${String(15 + seed % 10).padStart(2, '0')}/12/2026`
    base.alertes.push('Fonds immobilisés — retrait impossible tant que le crédit est en cours')
  }

  if (compte.type === 'VUE') {
    base.plafond_retrait_jour_fcfa = Math.min(compte.solde_fcfa, 500_000)
    if (seed % 4 === 0) {
      base.mandataire = {
        nom: `${pick(['Abla', 'Koffi', 'Edem'], seed)} ${compte.client.split(' ').slice(-1)[0]}`,
        telephone: `+228 91 ${20 + seed % 70} ${30 + seed % 60} ${40 + seed % 50}`,
        lien: pick(['Époux/se', 'Fils', 'Frère', 'Associé'], seed),
      }
    }
  }

  return base
}

export function getCompteEpargneDetail(id: string): CompteEpargneDetail | null {
  const compte = getCompteEpargneById(id)
  if (!compte) return null
  return buildCompteEpargneDetail(compte)
}
