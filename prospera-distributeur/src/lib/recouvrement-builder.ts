import { CREANCES_COMPTABLES, type CreanceComptable } from '@/lib/registries/comptabilite-registry'
import { getPdvById } from '@/lib/registries/pdv-registry'

/**
 * Recouvrement (spec V2 §7.13) — balance âgée client, priorisation par probabilité
 * de recouvrement, et blocage du crédit client avec trace.
 */

export interface TrancheAgee {
  tranche: string
  min_jours: number
  max_jours: number
  montant: number
  clients: number
  color: string
}

const TRANCHES: Omit<TrancheAgee, 'montant' | 'clients'>[] = [
  { tranche: 'Non échu', min_jours: -999, max_jours: 0, color: '#10b981' },
  { tranche: '1 – 30 j', min_jours: 1, max_jours: 30, color: '#f59e0b' },
  { tranche: '31 – 60 j', min_jours: 31, max_jours: 60, color: '#f97316' },
  { tranche: '61 – 90 j', min_jours: 61, max_jours: 90, color: '#ef4444' },
  { tranche: '> 90 j', min_jours: 91, max_jours: 9999, color: '#991b1b' },
]

export function buildBalanceAgeeClient(): TrancheAgee[] {
  return TRANCHES.map(t => {
    const dedans = CREANCES_COMPTABLES.filter(
      c => c.reste > 0 && c.jours_retard >= t.min_jours && c.jours_retard <= t.max_jours,
    )
    return {
      ...t,
      montant: dedans.reduce((s, c) => s + c.reste, 0),
      clients: dedans.length,
    }
  }).filter(t => t.montant > 0)
}

export interface DossierRecouvrement extends CreanceComptable {
  /** Probabilité de récupérer la créance, 0-100. */
  probabilite_recouvrement: number
  /** Montant × probabilité : ce sur quoi il faut réellement passer du temps. */
  valeur_esperee: number
  score_pdv: number
  credit_bloque: boolean
  action_recommandee: string
}

/**
 * Plus une créance vieillit, moins elle rentre — et la provision déjà passée
 * traduit ce que la comptabilité pense en récupérer.
 */
function probabiliteRecouvrement(c: CreanceComptable, scorePdv: number): number {
  let p = 95
  if (c.jours_retard > 90) p = 30
  else if (c.jours_retard > 60) p = 45
  else if (c.jours_retard > 30) p = 65
  else if (c.jours_retard > 0) p = 82

  p -= c.provision_pct * 0.4
  p += (scorePdv - 60) * 0.25
  // Un client qui a déjà payé une partie paie généralement le reste.
  if (c.paye > 0) p += 10

  return Math.max(5, Math.min(98, Math.round(p)))
}

function actionRecommandee(c: CreanceComptable, probabilite: number, bloque: boolean): string {
  if (probabilite < 40) {
    return `Recouvrement improbable en l'état — passer en contentieux ou négocier un échéancier avec abandon partiel${bloque ? '' : ', et bloquer le crédit immédiatement'}.`
  }
  if (c.jours_retard > 60) {
    return 'Visite physique : au-delà de 60 jours, la relance écrite ne produit plus rien.'
  }
  if (c.jours_retard > 30) {
    return 'Appel direct au gérant puis accord d\'échéancier — la fenêtre utile se referme à 60 jours.'
  }
  if (c.paye > 0) {
    return 'Paiement partiel déjà obtenu : relancer sur le solde, la probabilité est élevée.'
  }
  return 'Relance WhatsApp automatique — le retard est récent, le canal écrit suffit.'
}

/** Seuil au-delà duquel le crédit d'un client est coupé d'office. */
export const SEUIL_BLOCAGE_JOURS = 60

export function buildDossiersRecouvrement(): DossierRecouvrement[] {
  return CREANCES_COMPTABLES
    .filter(c => c.reste > 0)
    .map(c => {
      const pdv = getPdvById(c.client_id)
      const scorePdv = pdv?.score_ia ?? 60
      const probabilite = probabiliteRecouvrement(c, scorePdv)
      const bloque = c.jours_retard > SEUIL_BLOCAGE_JOURS
      return {
        ...c,
        probabilite_recouvrement: probabilite,
        valeur_esperee: Math.round(c.reste * (probabilite / 100)),
        score_pdv: scorePdv,
        credit_bloque: bloque,
        action_recommandee: actionRecommandee(c, probabilite, bloque),
      }
    })
    // On priorise sur la valeur espérée, pas sur le montant brut : courir après
    // une grosse créance irrécouvrable coûte plus qu'elle ne rapporte.
    .sort((a, b) => b.valeur_esperee - a.valeur_esperee)
}

export interface SyntheseRecouvrement {
  encours_total: number
  valeur_esperee_totale: number
  perte_attendue: number
  clients_bloques: number
  dossiers_contentieux: number
}

export function buildSyntheseRecouvrement(dossiers: DossierRecouvrement[]): SyntheseRecouvrement {
  const encours = dossiers.reduce((s, d) => s + d.reste, 0)
  const espere = dossiers.reduce((s, d) => s + d.valeur_esperee, 0)
  return {
    encours_total: encours,
    valeur_esperee_totale: espere,
    perte_attendue: encours - espere,
    clients_bloques: dossiers.filter(d => d.credit_bloque).length,
    dossiers_contentieux: dossiers.filter(d => d.probabilite_recouvrement < 40).length,
  }
}
