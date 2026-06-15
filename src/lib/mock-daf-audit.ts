/**
 * Audit financier DAF — contrôle de gestion, clôture, réglementaire.
 * Distinct de MOCK_AUDIT_HOME (auditeur interne : fraude, terrain, GPS).
 */
import { MOCK_DAF_HOME } from './mockMicrofinance'
import { buildConformiteBceao } from './mock-conformite-bceao-builder'

export type MissionAuditDafStatut = 'URGENT' | 'EN_COURS' | 'PLANIFIE' | 'OK'
export type MissionAuditDafDomaine = 'CLOTURE' | 'COMPTA' | 'BCEAO' | 'TRESO' | 'BUDGET' | 'PROVISIONS'

export interface MissionAuditDaf {
  id: string
  domaine: MissionAuditDafDomaine
  titre: string
  detail: string
  echeance: string
  statut: MissionAuditDafStatut
  responsable: string
}

export interface DafAuditHome {
  synthese: {
    date_generation: string
    intro: string
    points: { tone: 'attention' | 'negatif' | 'positif' | 'info'; texte: string; action?: string }[]
    priorites: string[]
  }
  kpis: {
    score_bceao: number
    ratios_non_conformes: number
    suspens_count: number
    suspens_montant_fcfa: number
    ecritures_attente: number
    ecart_rapprochement_fcfa: number
    cloture_jours: number
    budget_alertes: number
    bilan_provisoire: boolean
  }
  missions: MissionAuditDaf[]
  suspens_comptables: typeof MOCK_DAF_HOME.comptabilite.suspens_comptables
  checklist_cloture: { ok: boolean; label: string }[]
  ratios_bceao: ReturnType<typeof buildConformiteBceao>['ratios_reglementaires']
  rapprochements: {
    compte: string
    libelle: string
    ecart: number
    statut: string
  }[]
  ecarts_budget: typeof MOCK_DAF_HOME.budget
  alertes_financieres: typeof MOCK_DAF_HOME.alertes
  liens: { href: string; label: string; desc: string }[]
}

export function buildDafAuditHome(): DafAuditHome {
  const d = MOCK_DAF_HOME
  const bceao = buildConformiteBceao()
  const syscohada = d.comptabilite.syscohada
  const op = syscohada.operations
  const suspens = d.comptabilite.suspens_comptables
  const suspensMontant = suspens.reduce((s, x) => s + x.solde, 0)
  const ratiosNc = bceao.ratios_reglementaires.filter(r => r.statut === 'NON_CONFORME').length
  const ecartRap = syscohada.rapprochements.reduce((max, r) => Math.max(max, Math.abs(r.ecart)), 0)
  const budgetAlertes = d.budget.filter(b => b.statut === 'ALERTE' || b.statut === 'SURVEILLE').length
  const provEcart = bceao.ecart_provision_total

  const missions: MissionAuditDaf[] = [
    {
      id: 'DAF-A1',
      domaine: 'CLOTURE',
      titre: `Clôture ${op.prochaine_cloture} (J-${op.cloture_dans_jours})`,
      detail: `${op.ecritures_attente} écriture(s) en attente · ${op.rapprochements_a_finaliser} rapprochement(s) à finaliser`,
      echeance: op.prochaine_cloture,
      statut: op.cloture_dans_jours <= 7 ? 'URGENT' : 'EN_COURS',
      responsable: 'DAF / Comptable',
    },
    {
      id: 'DAF-A2',
      domaine: 'COMPTA',
      titre: 'Lettrage suspens 471 & 401',
      detail: suspens.find(s => s.statut === 'CRITIQUE')?.note ?? 'Comptes d\'attente à justifier',
      echeance: 'Avant arrêté provisoire',
      statut: suspens.some(s => s.statut === 'CRITIQUE') ? 'URGENT' : 'EN_COURS',
      responsable: 'Comptable siège',
    },
    {
      id: 'DAF-A3',
      domaine: 'TRESO',
      titre: 'Rapprochement bancaire Ecobank',
      detail: `Écart ${(ecartRap / 1000).toFixed(0)} k FCFA — ajustement OD non validé`,
      echeance: '24/05/2026',
      statut: ecartRap > 0 ? 'URGENT' : 'OK',
      responsable: 'DAF',
    },
    {
      id: 'DAF-A4',
      domaine: 'BCEAO',
      titre: 'Rapport prudentiel mensuel',
      detail: `${ratiosNc} ratio(x) hors seuil · score ${bceao.score_global}/100`,
      echeance: bceao.prochain_rapport_bceao,
      statut: bceao.jours_avant_rapport <= 10 ? 'URGENT' : 'EN_COURS',
      responsable: 'DAF + ROC',
    },
    {
      id: 'DAF-A5',
      domaine: 'PROVISIONS',
      titre: 'Couverture provisions créances',
      detail: `Écart à constituer ~${Math.round(provEcart / 1000)} k FCFA (dotation classe 871)`,
      echeance: '31/05/2026',
      statut: provEcart > 500_000 ? 'EN_COURS' : 'OK',
      responsable: 'DAF',
    },
    {
      id: 'DAF-A6',
      domaine: 'BUDGET',
      titre: 'Cadrage dérives budgétaires',
      detail: `${budgetAlertes} poste(s) en alerte ou sous surveillance (logistique +14 %)`,
      echeance: 'Fin juin 2026',
      statut: budgetAlertes > 0 ? 'EN_COURS' : 'OK',
      responsable: 'DAF + managers agences',
    },
  ]

  return {
    synthese: {
      date_generation: "aujourd'hui 07:15",
      intro:
        `Pilotage audit financier : bilan ${d.bilan_consolide.statut} au ${d.bilan_consolide.date_reference}, ` +
        `${suspens.length} suspens (${(suspensMontant / 1000).toFixed(0)} k FCFA), score conformité ${bceao.score_global}/100. ` +
        `Priorité : clôture, rapprochements et rapport prudentiel avant échéance réglementaire.`,
      points: [
        {
          tone: 'negatif',
          texte: `${ratiosNc} indicateurs BCEAO non conformes avant remise du rapport (J-${bceao.jours_avant_rapport}).`,
          action: 'Voir onglet Réglementaire + plan de mise en conformité',
        },
        {
          tone: 'attention',
          texte: `${suspens.filter(s => s.statut !== 'OK').length} suspens comptables à régulariser avant clôture (J-${op.cloture_dans_jours}).`,
          action: 'Onglet Clôture & compta → /comptabilite',
        },
        {
          tone: 'attention',
          texte: `Trésorerie : ${d.tresorerie.par_agence.filter(a => a.statut === 'TENSION').map(a => a.agence).join(', ') || 'réseau stable'} — surveiller ratios liquidité agence.`,
          action: 'Onglet Trésorerie ou /caisse',
        },
        {
          tone: 'positif',
          texte: `Bilan provisoire équilibré · ${op.journal_entries_mois.toLocaleString('fr-FR')} écritures mai · contrôles SYSCOHADA actifs.`,
        },
      ],
      priorites: [
        `Clôture ${op.prochaine_cloture} : solder suspens 471 (${suspens.find(s => s.compte.includes('471'))?.solde ? (suspens.find(s => s.compte.includes('471'))!.solde / 1000).toFixed(0) + ' k' : '—'}) et valider ${op.ecritures_attente} OD`,
        `BCEAO : traiter ratio transformation et concentration avant ${bceao.prochain_rapport_bceao}`,
        `Budget : contenir dérive logistique (+14 %) — revue hebdo avec responsables`,
      ],
    },
    kpis: {
      score_bceao: bceao.score_global,
      ratios_non_conformes: ratiosNc,
      suspens_count: suspens.length,
      suspens_montant_fcfa: suspensMontant,
      ecritures_attente: op.ecritures_attente,
      ecart_rapprochement_fcfa: ecartRap,
      cloture_jours: op.cloture_dans_jours,
      budget_alertes: budgetAlertes,
      bilan_provisoire: d.bilan_consolide.statut === 'PROVISOIRE',
    },
    missions,
    suspens_comptables: suspens,
    checklist_cloture: [
      { ok: syscohada.balance_generale.equilibre, label: 'Balance mai équilibrée (mouvements D = C)' },
      { ok: op.ecritures_attente === 0, label: `${op.ecritures_attente} écriture(s) en attente de validation DAF` },
      { ok: op.rapprochements_a_finaliser === 0, label: `${op.rapprochements_a_finaliser} rapprochement(s) bancaire à finaliser` },
      { ok: suspens.every(s => s.statut === 'OK'), label: 'Suspens 471 / 401 / 512 lettrés ou justifiés' },
      { ok: d.bilan_consolide.equilibre_ok, label: 'Bilan consolidé : actif = passif' },
      { ok: ratiosNc <= 2, label: `Ratios BCEAO : ≤ 2 NC (actuellement ${ratiosNc})` },
    ],
    ratios_bceao: bceao.ratios_reglementaires,
    rapprochements: syscohada.rapprochements.map(r => ({
      compte: r.compte,
      libelle: r.libelle,
      ecart: r.ecart,
      statut: r.statut,
    })),
    ecarts_budget: d.budget,
    alertes_financieres: d.alertes,
    liens: [
      { href: '/comptabilite', label: 'Comptabilité SYSCOHADA', desc: 'Balance, journal, rapprochements, clôture' },
      { href: '/conformite', label: 'Conformité BCEAO', desc: 'Classification, provisions, exports régulateur' },
      { href: '/finance', label: 'Finance & Budget', desc: 'Trésorerie, budget, rentabilité, contrôle de gestion' },
      { href: '/caisse', label: 'Caisse & trésorerie', desc: 'Flux journaliers et liquidité agences' },
    ],
  }
}

export const DAF_AUDIT_HOME = buildDafAuditHome()
