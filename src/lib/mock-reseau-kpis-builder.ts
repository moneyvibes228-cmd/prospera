/**
 * KPIs réseau DG / ROC — dérivés de RESEAU_MENSUEL + RESEAU_CONSOLIDE + portefeuille.
 */
import { AGENCES, RESEAU_CONSOLIDE } from './agences'
import { buildExpectedLossPortefeuille, buildBceaoRepartition } from './portefeuille-reseau'
import {
  getMoisCourant,
  getMoisPrecedent,
  sparkline,
  variationMoM,
  RESEAU_MENSUEL,
} from './mock-time-series'
import { buildDisponibiliteSysteme } from './mock-controle-interne-registry'
import { countDossiersBloques } from './mock-risque-registry'
import { buildParGranulaireReseau } from './credit-dossiers-stats'
import { buildCashParAgence } from './mock-operations-registry'

export interface KpiGlobalDG {
  cle: string
  label: string
  valeur: number | string
  unite: string
  variation_pct: number
  variation_label: string
  sparkline: number[]
  couleur: 'teal' | 'green' | 'orange' | 'red' | 'blue' | 'purple'
  categorie: 'PORTEFEUILLE' | 'ACTIVITE' | 'RENTABILITE'
  drill_to?: 'CREDIT' | 'COMMERCIAL' | 'FINANCIER' | 'OPERATIONNEL'
}

function fmtM(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2).replace('.', ',')}M` : `${Math.round(n / 1000)}k`
}

function pctCollecte(): number {
  const obj = RESEAU_CONSOLIDE.collecte_objectif
  return obj > 0 ? Math.round((RESEAU_CONSOLIDE.collecte_totale / obj) * 100) : 0
}

export function buildKpisGlobauxDG(): KpiGlobalDG[] {
  const m = getMoisCourant()
  const el = buildExpectedLossPortefeuille()
  const bceao = buildBceaoRepartition()
  const revenusMois = Math.round(m.collecte_fcfa * 0.22)
  const profitNet = Math.round(revenusMois * 0.33)

  return [
    {
      cle: 'encours', label: 'Encours total', valeur: m.encours_fcfa, unite: 'FCFA',
      variation_pct: variationMoM('encours_fcfa'), variation_label: 'vs mois préc.',
      sparkline: sparkline('encours_fcfa'), couleur: 'teal', categorie: 'PORTEFEUILLE', drill_to: 'CREDIT',
    },
    {
      cle: 'clients_actifs', label: 'Clients actifs', valeur: m.emprunteurs, unite: '',
      variation_pct: variationMoM('emprunteurs'), variation_label: `+${m.emprunteurs - getMoisPrecedent().emprunteurs} nets`,
      sparkline: sparkline('emprunteurs'), couleur: 'blue', categorie: 'PORTEFEUILLE', drill_to: 'COMMERCIAL',
    },
    {
      cle: 'par_global', label: 'PAR 30 / 90', valeur: `${m.par_30}% / ${m.par_90}%`, unite: '',
      variation_pct: Number((m.par_30 - getMoisPrecedent().par_30).toFixed(1)), variation_label: 'PAR 30 baisse',
      sparkline: sparkline('par_30'), couleur: 'orange', categorie: 'PORTEFEUILLE', drill_to: 'CREDIT',
    },
    {
      cle: 'el_provisions', label: 'EL / Provisions', valeur: `${fmtM(el.el_total)} / ${fmtM(bceao.total_provisions_constituees)}`, unite: 'FCFA',
      variation_pct: variationMoM('el_fcfa'), variation_label: `Écart ${fmtM(bceao.ecart_provisions)}`,
      sparkline: sparkline('el_fcfa'), couleur: 'red', categorie: 'PORTEFEUILLE', drill_to: 'CREDIT',
    },
    {
      cle: 'decaissements', label: 'Décaissements mois', valeur: Math.round(m.decaissements * (RESEAU_CONSOLIDE.montant_decaisse_mois / Math.max(RESEAU_CONSOLIDE.decaissements_mois, 1))), unite: 'FCFA',
      variation_pct: variationMoM('decaissements'), variation_label: 'vs avril',
      sparkline: RESEAU_MENSUEL.map(x => x.decaissements * 500_000), couleur: 'green', categorie: 'ACTIVITE', drill_to: 'COMMERCIAL',
    },
    {
      cle: 'collecte', label: 'Collecte mois', valeur: m.collecte_fcfa, unite: 'FCFA',
      variation_pct: variationMoM('collecte_fcfa'), variation_label: `${pctCollecte()}% obj.`,
      sparkline: sparkline('collecte_fcfa'), couleur: 'teal', categorie: 'ACTIVITE', drill_to: 'COMMERCIAL',
    },
    {
      cle: 'epargne', label: 'Encours épargne', valeur: Math.round(m.encours_fcfa * 0.283), unite: 'FCFA',
      variation_pct: variationMoM('encours_fcfa'), variation_label: `${RESEAU_CONSOLIDE.total_emprunteurs + 99} comptes`,
      sparkline: sparkline('encours_fcfa').map(v => Math.round(v * 0.283)), couleur: 'purple', categorie: 'ACTIVITE', drill_to: 'COMMERCIAL',
    },
    {
      cle: 'transactions', label: 'Transactions mois', valeur: Math.round(m.decaissements * 54.7), unite: '',
      variation_pct: 14.8, variation_label: `${fmtM(m.collecte_fcfa * 8.2)} total`,
      sparkline: RESEAU_MENSUEL.map(x => Math.round(x.decaissements * 54.7)), couleur: 'blue', categorie: 'ACTIVITE', drill_to: 'OPERATIONNEL',
    },
    {
      cle: 'revenus', label: 'Revenus mois', valeur: revenusMois, unite: 'FCFA',
      variation_pct: variationMoM('collecte_fcfa'), variation_label: 'intérêts + frais',
      sparkline: sparkline('collecte_fcfa').map(v => Math.round(v * 0.22)), couleur: 'green', categorie: 'RENTABILITE', drill_to: 'FINANCIER',
    },
    {
      cle: 'profit_net', label: 'Profit net mois', valeur: profitNet, unite: 'FCFA',
      variation_pct: 8.7, variation_label: 'marge 33%',
      sparkline: sparkline('collecte_fcfa').map(v => Math.round(v * 0.22 * 0.33)), couleur: 'green', categorie: 'RENTABILITE', drill_to: 'FINANCIER',
    },
    {
      cle: 'cout_risque', label: 'Coût du risque', valeur: `${((el.el_total / m.encours_fcfa) * 100).toFixed(1)}%`, unite: '',
      variation_pct: 0.2, variation_label: 'stable',
      sparkline: sparkline('el_fcfa').map(v => Number(((v / m.encours_fcfa) * 100).toFixed(1))), couleur: 'orange', categorie: 'RENTABILITE', drill_to: 'CREDIT',
    },
    {
      cle: 'liquidite', label: 'Liquidité disponible', valeur: m.liquidite_fcfa, unite: 'FCFA',
      variation_pct: variationMoM('liquidite_fcfa'), variation_label: `${(m.liquidite_fcfa / (profitNet || 1) / 4).toFixed(1)} sem. autonomie`,
      sparkline: sparkline('liquidite_fcfa'), couleur: 'teal', categorie: 'RENTABILITE', drill_to: 'FINANCIER',
    },
  ]
}

export function buildKpisRocReseau() {
  const m = getMoisCourant()
  const el = buildExpectedLossPortefeuille()
  const uptime = buildDisponibiliteSysteme()

  return [
    { cle: 'encours', label: 'Encours réseau', valeur: m.encours_fcfa, unite: 'FCFA', variation_pct: variationMoM('encours_fcfa'), trend: 'HAUSSE' as const, sparkline: sparkline('encours_fcfa', 8) },
    { cle: 'par_30', label: 'PAR 30j', valeur: `${m.par_30}%`, unite: '', variation_pct: Number((m.par_30 - getMoisPrecedent().par_30).toFixed(1)), trend: 'BAISSE' as const, sparkline: sparkline('par_30', 8) },
    { cle: 'el', label: 'Expected Loss', valeur: `${fmtM(el.el_total)}`, unite: 'FCFA', variation_pct: variationMoM('el_fcfa'), trend: 'BAISSE' as const, sparkline: sparkline('el_fcfa', 8) },
    { cle: 'cash_reseau', label: 'Cash réseau', valeur: m.liquidite_fcfa, unite: 'FCFA', variation_pct: variationMoM('liquidite_fcfa'), trend: 'HAUSSE' as const, sparkline: sparkline('liquidite_fcfa', 8) },
    { cle: 'a_valider', label: 'À valider (ROC)', valeur: countDossiersBloques(), unite: 'dossiers', variation_pct: variationMoM('en_attente'), trend: 'HAUSSE' as const, sparkline: RESEAU_MENSUEL.slice(-8).map(x => x.en_attente) },
    { cle: 'uptime', label: 'Uptime système', valeur: `${uptime.uptime_pct_mois}%`, unite: '', variation_pct: 0.4, trend: 'STABLE' as const, sparkline: RESEAU_MENSUEL.map(() => uptime.uptime_pct_mois).slice(-8) },
  ]
}

export function buildKpisRocTop(): KpiGlobalDG[] {
  const m = getMoisCourant()
  const el = buildExpectedLossPortefeuille()
  const parGran = buildParGranulaireReseau()
  const par1 = parGran.par_1.valeur_pct
  const par7 = parGran.par_7.valeur_pct
  const uptime = buildDisponibiliteSysteme()
  const txJour = Math.round(m.decaissements * 54.7 / 30)

  return [
    {
      cle: 'encours_credit', label: 'Encours crédit', valeur: m.encours_fcfa, unite: 'FCFA',
      variation_pct: variationMoM('encours_fcfa'), variation_label: `${m.emprunteurs} prêts actifs`,
      sparkline: sparkline('encours_fcfa', 9), couleur: 'teal', categorie: 'PORTEFEUILLE', drill_to: 'CREDIT',
    },
    {
      cle: 'decaissements_jour', label: 'Décaissements jour', valeur: `${RESEAU_CONSOLIDE.decaissements_mois} / ${Math.round(RESEAU_CONSOLIDE.montant_decaisse_mois / 1000)}k`, unite: 'FCFA',
      variation_pct: variationMoM('decaissements'), variation_label: `${fmtM(m.decaissements * 500_000)} ce mois`,
      sparkline: RESEAU_MENSUEL.slice(-9).map(x => x.decaissements), couleur: 'green', categorie: 'ACTIVITE', drill_to: 'CREDIT',
    },
    {
      cle: 'taux_remb', label: 'Taux remboursement', valeur: `${m.remboursement_pct}%`, unite: '',
      variation_pct: Number((m.remboursement_pct - getMoisPrecedent().remboursement_pct).toFixed(1)), variation_label: 'vs avril',
      sparkline: sparkline('remboursement_pct', 9), couleur: 'green', categorie: 'PORTEFEUILLE', drill_to: 'CREDIT',
    },
    {
      cle: 'par_granul', label: 'PAR 1/7/30/90', valeur: `${par1}%/${par7}%/${m.par_30}%/${m.par_90}%`, unite: '',
      variation_pct: Number((m.par_30 - getMoisPrecedent().par_30).toFixed(1)), variation_label: 'tendance baisse',
      sparkline: sparkline('par_30', 9), couleur: 'orange', categorie: 'PORTEFEUILLE', drill_to: 'CREDIT',
    },
    {
      cle: 'tx_jour', label: 'Transactions jour', valeur: txJour, unite: `· ${fmtM(m.collecte_fcfa / 30)} FCFA`,
      variation_pct: 14.8, variation_label: 'vs hier',
      sparkline: RESEAU_MENSUEL.slice(-9).map(x => Math.round(x.decaissements * 1.8)), couleur: 'blue', categorie: 'ACTIVITE', drill_to: 'OPERATIONNEL',
    },
    {
      cle: 'temps_traitement', label: 'Temps validation', valeur: m.delai_validation_j, unite: 'jours · obj 3j',
      variation_pct: variationMoM('delai_validation_j'), variation_label: 'vs mars',
      sparkline: sparkline('delai_validation_j', 9), couleur: 'orange', categorie: 'ACTIVITE', drill_to: 'CREDIT',
    },
    {
      cle: 'attente_dossiers', label: 'Dossiers en attente', valeur: m.en_attente, unite: `· ${countDossiersBloques()} > 48h`,
      variation_pct: variationMoM('en_attente'), variation_label: 'vs hier',
      sparkline: RESEAU_MENSUEL.slice(-9).map(x => x.en_attente), couleur: 'red', categorie: 'ACTIVITE', drill_to: 'CREDIT',
    },
    {
      cle: 'uptime', label: 'Disponibilité système', valeur: `${uptime.uptime_pct_mois}%`, unite: `· ${uptime.incidents_majeurs} incident maj.`,
      variation_pct: 0.4, variation_label: 'SLA 99.5%',
      sparkline: RESEAU_MENSUEL.map(() => uptime.uptime_pct_mois).slice(-9), couleur: 'green', categorie: 'ACTIVITE', drill_to: 'OPERATIONNEL',
    },
    {
      cle: 'tresorerie', label: 'Trésorerie réseau', valeur: m.liquidite_fcfa, unite: 'FCFA',
      variation_pct: variationMoM('liquidite_fcfa'), variation_label: 'autonomie 6.2 sem.',
      sparkline: sparkline('liquidite_fcfa', 9), couleur: 'teal', categorie: 'RENTABILITE', drill_to: 'FINANCIER',
    },
    {
      cle: 'cash_agences', label: 'Cash agences', valeur: `${buildCashParAgence().filter(a => a.niveau === 'CRITIQUE_BAS').length} crit · ${buildCashParAgence().filter(a => a.niveau === 'TENSION').length} tension`, unite: '',
      variation_pct: 0, variation_label: `${AGENCES.find(a => a.par_courant >= 10)?.nom_court ?? 'Bè Kpota'} urgent`,
      sparkline: buildCashParAgence().map(a => a.niveau === 'CRITIQUE_BAS' || a.niveau === 'TENSION' ? 1 : 0), couleur: 'red', categorie: 'RENTABILITE', drill_to: 'FINANCIER',
    },
    {
      cle: 'flux_net', label: 'Flux net jour', valeur: Math.round(m.collecte_fcfa / 30 - m.decaissements * 500_000 / 30), unite: 'FCFA',
      variation_pct: 8.4, variation_label: `entrants ${fmtM(m.collecte_fcfa / 30)}`,
      sparkline: RESEAU_MENSUEL.slice(-9).map(x => Math.round(x.collecte_fcfa / 30)), couleur: 'green', categorie: 'RENTABILITE', drill_to: 'FINANCIER',
    },
    {
      cle: 'el_total', label: 'Expected Loss', valeur: fmtM(el.el_total), unite: 'FCFA',
      variation_pct: variationMoM('el_fcfa'), variation_label: `Provisions ${fmtM(buildBceaoRepartition().total_provisions_constituees)}`,
      sparkline: sparkline('el_fcfa', 9), couleur: 'red', categorie: 'PORTEFEUILLE', drill_to: 'CREDIT',
    },
  ]
}
