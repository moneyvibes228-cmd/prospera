/**
 * Échéancier crédit cohérent — aligne nb impayés, retards J+ et encours restant.
 */

import type { EcheanceCredit } from '@/lib/fiche-client-microfinance'

export const REFERENCE_MOIS = { month: 5, year: 2026, day: 28 }

export function parseDecaissement(date: string): { month: number; year: number } {
  const parts = date.split('/')
  if (parts.length >= 2) {
    const a = parseInt(parts[0]!, 10)
    const b = parseInt(parts[1]!, 10)
    if (a > 31) return { month: b, year: a }
    return { month: a, year: b }
  }
  return { month: 8, year: 2025 }
}

export function addMonths(month: number, year: number, delta: number): { month: number; year: number } {
  let m = month + delta
  let y = year
  while (m > 12) { m -= 12; y += 1 }
  while (m < 1) { m += 12; y -= 1 }
  return { month: m, year: y }
}

export function compareMonth(a: { month: number; year: number }, b: { month: number; year: number }): number {
  if (a.year !== b.year) return a.year - b.year
  return a.month - b.month
}

export function moisEchusDepuisDecaissement(dateDecaissement: string): number {
  const dep = parseDecaissement(dateDecaissement)
  const firstEch = addMonths(dep.month, dep.year, 1)
  let count = 0
  for (let i = 0; i < 24; i++) {
    const ech = addMonths(firstEch.month, firstEch.year, i)
    if (compareMonth(ech, REFERENCE_MOIS) > 0) break
    count++
  }
  return count
}

export function nbImpayesFromRetard(joursRetard: number): number {
  if (joursRetard <= 0) return 0
  return Math.max(1, Math.min(4, Math.ceil(joursRetard / 30)))
}

export function retardJoursDepuisEcheance(dateEcheance: string): number {
  const parts = dateEcheance.split('/')
  if (parts.length !== 3) return 0
  const day = parseInt(parts[0]!, 10)
  const month = parseInt(parts[1]!, 10)
  const year = parseInt(parts[2]!, 10)
  const ech = new Date(year, month - 1, day)
  const ref = new Date(REFERENCE_MOIS.year, REFERENCE_MOIS.month - 1, REFERENCE_MOIS.day)
  return Math.max(0, Math.floor((ref.getTime() - ech.getTime()) / 86_400_000))
}

/** Échéances échues dans la durée contractuelle (max dureeMois) */
export function echuesDansContrat(dateDecaissement: string, dureeMois = 12): number {
  return Math.min(moisEchusDepuisDecaissement(dateDecaissement), dureeMois)
}

/** Encours cohérent : mensualités antérieures payées, N dernières échues impayées */
export function deriveEncoursFromRetard(
  montant: number,
  dateDecaissement: string,
  joursRetard: number,
  dureeMois = 12,
): number {
  if (joursRetard <= 0) return montant
  const baseCap = Math.floor(montant / dureeMois)
  const nbImpayes = nbImpayesFromRetard(joursRetard)
  const echues = echuesDansContrat(dateDecaissement, dureeMois)
  const moisPayes = Math.max(0, echues - nbImpayes)
  const encours = montant - moisPayes * baseCap
  return Math.max(baseCap, Math.min(montant, encours))
}

/** Encours affiché — priorité à la source métier, repli sur le solde échéancier */
export function resolveEncoursCredit(
  encoursSource: number,
  montant: number,
  soldeEcheancier?: number,
): number {
  if (encoursSource > 0) return encoursSource
  if (soldeEcheancier != null && soldeEcheancier > 0) return soldeEcheancier
  return montant > 0 ? montant : 0
}

/** Nb impayés — priorité à la source métier si crédit actif */
export function resolveNbImpayes(
  echeancesSource: number,
  nbEcheancier: number,
  creditActif: boolean,
): number {
  if (!creditActif) return nbEcheancier
  if (echeancesSource > 0) return Math.max(nbEcheancier, echeancesSource)
  return nbEcheancier
}

export function countImpayesEcheancier(echeancier: EcheanceCredit[]): number {
  return echeancier.filter(e => e.statut === 'IMPAYE' || e.statut === 'PARTIEL').length
}

export interface BuildEcheancierInput {
  montant: number
  encours: number
  date_decaissement: string
  mensualite: number
  jours_retard: number
  echeances_impayees?: number
  duree_mois?: number
}

export function buildEcheancierCoherent(input: BuildEcheancierInput): EcheanceCredit[] {
  const {
    montant,
    date_decaissement,
    mensualite,
    jours_retard,
    duree_mois: dureeMois = 12,
  } = input

  if (montant <= 0) return []

  const nbImpayes = jours_retard > 0
    ? (input.echeances_impayees ?? nbImpayesFromRetard(jours_retard))
    : 0

  const dep = parseDecaissement(date_decaissement)
  const firstEch = addMonths(dep.month, dep.year, 1)
  const baseCap = Math.floor(montant / dureeMois)
  const capitalParts = Array.from({ length: dureeMois }, (_, i) =>
    i === dureeMois - 1 ? montant - baseCap * (dureeMois - 1) : baseCap,
  )

  const echues = echuesDansContrat(date_decaissement, dureeMois)
  const moisPayes = Math.max(0, echues - nbImpayes)

  let solde = montant
  const rows: EcheanceCredit[] = []

  for (let i = 0; i < dureeMois; i++) {
    const echDate = addMonths(firstEch.month, firstEch.year, i)
    if (compareMonth(echDate, REFERENCE_MOIS) > 0) break

    const capital = capitalParts[i]!
    const interet = Math.max(0, mensualite - capital)
    const total = capital + interet
    const dateEcheance = `15/${String(echDate.month).padStart(2, '0')}/${echDate.year}`

    let statut: EcheanceCredit['statut']
    let montant_paye_fcfa: number | undefined
    let date_paiement: string | undefined
    let retard_jours: number | undefined

    if (i < moisPayes) {
      statut = 'PAYE'
      montant_paye_fcfa = total
      date_paiement = `${String(Math.min(28, 12 + (i % 6))).padStart(2, '0')}/${String(echDate.month).padStart(2, '0')}/${echDate.year}`
      solde = Math.max(0, solde - capital)
    } else if (jours_retard > 0) {
      statut = 'IMPAYE'
      retard_jours = retardJoursDepuisEcheance(dateEcheance)
      if (i === moisPayes && nbImpayes === 1 && jours_retard > 0) {
        retard_jours = jours_retard
      }
    } else {
      break
    }

    rows.push({
      numero: i + 1,
      date_echeance: dateEcheance,
      capital_fcfa: capital,
      interet_fcfa: interet,
      total_fcfa: total,
      statut,
      montant_paye_fcfa,
      date_paiement,
      solde_apres_fcfa: Math.max(0, solde),
      retard_jours,
    })
  }

  return rows
}
