/**
 * Comptabilité & Finance DG — trésorerie, journal, balance, créances, analyses IA.
 */
import {
  COMPTES_TRESORERIE,
  ECRITURES_JOURNAL,
  BALANCE_GENERALE,
  PREVISIONS_TRESORERIE,
  CREANCES_COMPTABLES,
  RAPPROCHEMENTS,
  COMPTE_RESULTAT,
  SUSPENS_COMPTABLES,
  DECISIONS_COMPTA_DG,
  REFERENTIEL_COMPTA,
  type CompteTresorerie,
  type EcritureJournal,
  type BalanceLigne,
  type CreanceComptable,
  type PrevisionTresorerie,
  type RapprochementCompta,
} from './registries/comptabilite-registry'

export type VueComptabiliteDG = 'tresorerie' | 'journal' | 'balance' | 'creances' | 'resultat' | 'rapprochement'

export interface SyntheseComptabiliteDG {
  tresorerie_totale: number
  encours_clients: number
  creances_retard_30j: number
  pct_creances_retard: number
  ecritures_jour: number
  ecritures_attente: number
  rapprochement_pct: number
  marge_brute_pct: number
  resultat_net_mois: number
  suspens_critiques: number
  jours_cloture: number
}

export interface AnalyseComptabiliteIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  action: string
}

export const STATUT_ECRITURE_STYLE: Record<string, string> = {
  VALIDEE: 'bg-emerald-100 text-emerald-700',
  BROUILLON: 'bg-slate-100 text-slate-600',
  ATTENTE_VALIDATION: 'bg-amber-100 text-amber-700',
}

export const STATUT_RAPPROCHEMENT_STYLE: Record<string, string> = {
  POINTE: 'bg-emerald-100 text-emerald-700',
  EN_COURS: 'bg-amber-100 text-amber-700',
  ECART: 'bg-red-100 text-red-700',
}

export function buildSyntheseComptabiliteDG(): SyntheseComptabiliteDG {
  const treso = COMPTES_TRESORERIE.reduce((s, t) => s + t.solde, 0)
  const encours = CREANCES_COMPTABLES.reduce((s, c) => s + c.reste, 0)
  const retard30 = CREANCES_COMPTABLES.filter(c => c.jours_retard > 30).reduce((s, c) => s + c.reste, 0)
  const rapPointes = RAPPROCHEMENTS.filter(r => r.statut === 'POINTE').length
  const marge = COMPTE_RESULTAT.find(l => l.section === 'MARGE')
  const resultat = COMPTE_RESULTAT.find(l => l.section === 'RESULTAT')
  const ecrJour = ECRITURES_JOURNAL.filter(e => e.date === '2026-06-11')

  return {
    tresorerie_totale: treso,
    encours_clients: encours,
    creances_retard_30j: retard30,
    pct_creances_retard: encours > 0 ? Math.round((retard30 / encours) * 100) : 0,
    ecritures_jour: ecrJour.length,
    ecritures_attente: ECRITURES_JOURNAL.filter(e => e.statut === 'ATTENTE_VALIDATION').length,
    rapprochement_pct: Math.round((rapPointes / RAPPROCHEMENTS.length) * 100),
    marge_brute_pct: marge?.pct_ca ?? 23,
    resultat_net_mois: resultat?.montant_mois ?? 0,
    suspens_critiques: SUSPENS_COMPTABLES.filter(s => s.statut === 'CRITIQUE').length,
    jours_cloture: 19,
  }
}

export function buildAnalysesComptabiliteIA(s: SyntheseComptabiliteDG): AnalyseComptabiliteIA[] {
  return [
    {
      severite: 'CRITIQUE',
      titre: 'Pic sortie trésorerie J+5 — 28,6 M',
      detail: 'Réappro huile 5L (2 M acompte déjà passé) + commande riz maritime. Solde projeté 133,5 M vs 128,4 M aujourd\'hui.',
      action: 'Valider calendrier paiements fournisseurs · geler dépenses non critiques.',
    },
    {
      severite: 'CRITIQUE',
      titre: `Créances > 30j = ${s.pct_creances_retard}% du poste client`,
      detail: `Kiosque Port 8,9 M (provision 50% proposée) · Grossiste Adidogomé 5,25 M · total retard ${(s.creances_retard_30j / 1_000_000).toFixed(1)} M`,
      action: 'Valider provision OD PROV-411 · aligner compta + pipeline relances.',
    },
    {
      severite: 'HAUTE',
      titre: `Marge brute ${s.marge_brute_pct}% — sous objectif 25%`,
      detail: 'Achats +15% vs M-1 (huile, riz) · commissions commerciales 4,2 M · pertes créances 1,42 M',
      action: 'Audit compte 601 · revoir remises dépôts grossistes.',
    },
    {
      severite: 'MODEREE',
      titre: `${s.ecritures_attente} écriture(s) en attente validation`,
      detail: 'Provision Kiosque 1,42 M — impact résultat juin si validée',
      action: 'DG valide ou rejette avant clôture (J-19).',
    },
    {
      severite: 'MODEREE',
      titre: 'Rapprochement caisse Lomé — écart 20 K',
      detail: '2 opérations non pointées · rapprochement 67% global si caisse incluse',
      action: 'Pointage caisse sous 48h.',
    },
  ]
}

export function getComptesTresorerie() { return COMPTES_TRESORERIE }
export function getEcrituresJournal() { return ECRITURES_JOURNAL }
export function getBalanceGenerale() { return BALANCE_GENERALE }
export function getPrevisionsTresorerie() { return PREVISIONS_TRESORERIE }
export function getCreancesComptables() { return CREANCES_COMPTABLES }
export function getRapprochements() { return RAPPROCHEMENTS }
export function getCompteResultat() { return COMPTE_RESULTAT }
export function getSuspensComptables() { return SUSPENS_COMPTABLES }
export function getDecisionsComptaDG() { return DECISIONS_COMPTA_DG }
export function getReferentielCompta() { return REFERENTIEL_COMPTA }

export type { CompteTresorerie, EcritureJournal, BalanceLigne, CreanceComptable, PrevisionTresorerie, RapprochementCompta }
