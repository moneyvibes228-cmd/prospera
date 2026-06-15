/**
 * Hub Comptabilité — aligné SYSCOHADA révisé / plan IMF BCEAO (source : mock-comptabilite-syscohada).
 */
import { MOCK_DAF_HOME } from '@/lib/mockMicrofinance'
import { buildConformiteBceao } from '@/lib/mock-conformite-bceao-builder'
import type { ComptabiliteSyscohadaImf } from '@/lib/mock-comptabilite-syscohada'

export type { ComptabiliteSyscohadaImf } from '@/lib/mock-comptabilite-syscohada'

export interface EcritureComptable {
  id: string
  date: string
  journal: string
  piece: string
  libelle: string
  debit: number
  credit: number
  compte: string
  libelle_compte: string
  statut: string
  agence: string
}

export interface CompteGrandLivre {
  numero: string
  libelle: string
  classe: string
  solde_debiteur: number
  solde_crediteur: number
  mouvements_mois: number
}

export interface ReportingBceao {
  indicateur: string
  valeur: string
  seuil: string
  statut: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME'
}

export interface ComptePlanComptable {
  numero: string
  libelle: string
  classe: string
  type: 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT' | 'DOTATION'
  lettrable: boolean
}

export interface EcritureAutomatique {
  id: string
  declencheur: string
  debit_compte: string
  credit_compte: string
  libelle_modele: string
  actif: boolean
  executions_mois: number
}

export interface ComptabiliteHub {
  syscohada: ComptabiliteSyscohadaImf
  bilan_consolide: typeof MOCK_DAF_HOME.bilan_consolide
  synthese_ia: string
  date_cloture: string
  plan_comptable: ComptePlanComptable[]
  ecritures_automatiques: EcritureAutomatique[]
  kpis: {
    ecritures_jour: number
    ecritures_a_valider: number
    solde_caisse_fcfa: number
    solde_banque_fcfa: number
    ecart_rapprochement_fcfa: number
    taux_conformite_pct: number
    comptes_mouvementes: number
    comptes_plan: number
    comptes_epargne_actifs: number
  }
  journal: EcritureComptable[]
  grand_livre: CompteGrandLivre[]
  reporting_bceao: ReportingBceao[]
  clotures: Array<{ periode: string; statut: string; date: string }>
}

function mapStatutJournal(s: string): string {
  if (s === 'VALIDEE') return 'VALIDE'
  if (s === 'ATTENTE_VALIDATION') return 'A_VALIDER'
  return 'BROUILLON'
}

function buildSynthese(s: ComptabiliteSyscohadaImf): string {
  const op = s.operations
  const pf = s.referentiel.portefeuille
  const plan = s.referentiel.plan_stats
  const rap = s.rapprochements.find(r => r.ecart !== 0)
  const att = s.journal.ecritures.filter(e => e.statut === 'ATTENTE_VALIDATION').length
  return (
    `Clôture ${op.prochaine_cloture} (J-${op.cloture_dans_jours}) : ${op.ecritures_attente} écriture(s) en attente, ` +
    `${op.rapprochements_a_finaliser} rapprochement(s) bancaire à finaliser. ` +
    `Portefeuille : ${pf.dossiers_credit_actifs} dossiers crédit, ${pf.comptes_epargne_total} comptes épargne ` +
    `(${pf.comptes_epargne_actifs} actifs, ${pf.comptes_epargne_dormants} dormants). ` +
    `Plan ${plan.comptes_parametres} comptes — ${s.balance_generale.comptes_mouvementes} mouvementés en mai ` +
    `(${plan.comptes_extraits_balance} lignes balance), mouvements ` +
    `${s.balance_generale.equilibre ? 'équilibrés' : 'à contrôler'}. ` +
    (rap ? `Écart ${rap.compte} : ${(rap.ecart / 1000).toFixed(0)} k FCFA (${rap.operations_non_pointees[0]?.libelle ?? 'voir rapprochement'}). ` : '') +
    (att > 0 ? `Priorité : valider ${att} pièce(s) OD/BQ avant arrêté.` : 'Prêt pour arrêté provisoire après lettrage 471.')
  )
}

export function buildComptabiliteHub(): ComptabiliteHub {
  const c = MOCK_DAF_HOME.comptabilite
  const s = c.syscohada
  const op = s.operations
  const bceaoReg = buildConformiteBceao()

  const caisse = s.balance_generale.lignes.find(l => l.compte === '531100')
  const banque =
    s.balance_generale.lignes.filter(l => l.compte.startsWith('512')).reduce((sum, l) => sum + l.solde_n, 0)
  const ecartRap = s.rapprochements.reduce((max, r) => Math.max(max, Math.abs(r.ecart)), 0)

  const journal: EcritureComptable[] = s.journal.ecritures.flatMap(ec =>
    ec.lignes.map((l, i) => ({
      id: `${ec.id}-${i}`,
      date: ec.date,
      journal: ec.journal,
      piece: ec.piece,
      libelle: ec.libelle,
      debit: l.debit,
      credit: l.credit,
      compte: l.compte,
      libelle_compte: l.libelle,
      statut: mapStatutJournal(ec.statut),
      agence: ec.agence ?? 'Siège',
    })),
  )

  const balanceByNumero = new Map(s.balance_generale.lignes.map(l => [l.compte, l]))
  const plan_comptable: ComptePlanComptable[] = s.referentiel.plan_comptable_complet.map(p => {
    const ligne = balanceByNumero.get(p.numero)
    const nature = ligne?.nature ?? (p.classe <= 2 ? 'ACTIF' : p.classe <= 5 ? 'PASSIF' : p.classe === 6 ? 'CHARGE' : p.classe === 7 ? 'PRODUIT' : 'DOTATION')
    return {
      numero: p.numero,
      libelle: ligne?.libelle ?? p.libelle,
      classe: String(p.classe),
      type: nature === 'DOTATION' ? 'DOTATION' : nature,
      lettrable: p.numero.startsWith('41') || p.numero.startsWith('40') || p.numero.startsWith('52') || p.numero === '471100',
    }
  })

  const grand_livre: CompteGrandLivre[] = s.balance_generale.lignes
    .filter(l => l.debit_mois + l.credit_mois > 0 || Math.abs(l.solde_n) > 100_000)
    .map(l => ({
      numero: l.compte,
      libelle: l.libelle,
      classe: String(l.classe),
      solde_debiteur: l.sens_solde_n === 'D' ? l.solde_n : 0,
      solde_crediteur: l.sens_solde_n === 'C' ? l.solde_n : 0,
      mouvements_mois: Math.round((l.debit_mois + l.credit_mois) / 100_000) || 1,
    }))

  const ecritures_automatiques: EcritureAutomatique[] = [
    { id: 'AUTO-1', declencheur: 'Décaissement crédit', debit_compte: '41110x', credit_compte: '512100', libelle_modele: 'Décaissement {ref} — {client}', actif: true, executions_mois: Math.round(s.referentiel.portefeuille.dossiers_credit_actifs * 0.098) },
    { id: 'AUTO-2', declencheur: 'Remboursement caisse / MoMo', debit_compte: '53110x', credit_compte: '41110x', libelle_modele: 'Remboursement {ref}', actif: true, executions_mois: Math.round(s.referentiel.portefeuille.dossiers_credit_actifs * 0.45) },
    { id: 'AUTO-3', declencheur: 'Dépôt épargne', debit_compte: '53110x', credit_compte: '52110x', libelle_modele: 'Dépôt {client}', actif: true, executions_mois: Math.round(s.referentiel.portefeuille.comptes_epargne_actifs * 0.52) },
    { id: 'AUTO-4', declencheur: 'Constatation intérêts', debit_compte: '41110x', credit_compte: '701100', libelle_modele: 'Intérêts {mois}', actif: true, executions_mois: s.referentiel.portefeuille.dossiers_credit_actifs },
    { id: 'AUTO-5', declencheur: 'Dotation provisions BCEAO', debit_compte: '871100', credit_compte: '419100', libelle_modele: 'Provision classe {classe}', actif: true, executions_mois: 1 },
  ]

  const reporting_bceao: ReportingBceao[] = bceaoReg.ratios_reglementaires.map(r => ({
    indicateur: r.indicateur,
    valeur: r.valeur,
    seuil: r.seuil,
    statut: r.statut === 'CONFORME' ? 'CONFORME' : r.statut === 'ATTENTION' ? 'ATTENTION' : 'NON_CONFORME',
  }))

  return {
    syscohada: s,
    bilan_consolide: MOCK_DAF_HOME.bilan_consolide,
    synthese_ia: buildSynthese(s),
    date_cloture: `${s.referentiel.periode} — clôture ${op.prochaine_cloture} (J-${op.cloture_dans_jours})`,
    plan_comptable,
    ecritures_automatiques,
    kpis: {
      ecritures_jour: Math.round(op.journal_entries_mois / 22),
      ecritures_a_valider: op.ecritures_attente,
      solde_caisse_fcfa: caisse?.solde_n ?? 12_400_000,
      solde_banque_fcfa: banque,
      ecart_rapprochement_fcfa: ecartRap,
      taux_conformite_pct: bceaoReg.score_global,
      comptes_mouvementes: s.balance_generale.comptes_mouvementes,
      comptes_plan: s.referentiel.plan_stats.comptes_parametres,
      comptes_epargne_actifs: s.referentiel.portefeuille.comptes_epargne_actifs,
    },
    journal,
    grand_livre,
    reporting_bceao,
    clotures: [
      { periode: 'Avril 2026', statut: 'Clôturée', date: op.derniere_cloture },
      { periode: 'Mai 2026', statut: 'En cours', date: '—' },
      { periode: 'Juin 2026', statut: 'À venir', date: '—' },
    ],
  }
}

export const COMPTABILITE_HUB: ComptabiliteHub = buildComptabiliteHub()

export function getComptabiliteHub(): ComptabiliteHub {
  return COMPTABILITE_HUB
}

/** Données panel compta (Finance DAF + module Comptabilité) */
export function getComptabilitePanelData() {
  const hub = getComptabiliteHub()
  return {
    comptabilite: MOCK_DAF_HOME.comptabilite,
    bilan_consolide: hub.bilan_consolide,
  }
}
