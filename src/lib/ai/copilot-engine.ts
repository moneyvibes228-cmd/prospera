/**
 * Moteur Prospera IA — réponses construites depuis les mocks (par rôle).
 */
import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/lib/auth'
import type { CopilotContext } from '@/lib/ai/copilot-context'
import {
  resolveEntitiesFromQuestion,
  resolveAgencesFromQuestion,
  getObjectifsForRole,
  getDailyTargetsForRole,
  getDossierRapportCc,
  getGpClientByName,
  getClientRisqueById,
  getFicheClientMicrofinance,
  getDossierBloqueById,
  fmtFcfa,
  normalizeText,
  MOCK_COMMERCIAL,
  MOCK_CREDIT_RISQUE,
  MOCK_GESTIONNAIRE,
  MOCK_AGENT_TERRAIN,
  MOCK_FINANCES,
  MOCK_MARKETING,
  MOCK_MANAGER,
  MOCK_DAF_HOME,
  REGISTRE_CLIENTS_RISQUE,
  REGISTRE_DOSSIERS_BLOQUES,
  mockListDossiersCredit,
  getRaHubData,
  getRccHubData,
  type ResolvedEntity,
} from '@/lib/ai/copilot-mock-data'
import { REGISTRE_AGENT_ACTIVITE, buildHaussesAnormalesDefauts } from '@/lib/mock-risque-registry'
import { getMoisCourant } from '@/lib/mock-time-series'
import { AGENCES as AGENCES_LIST, RESEAU_CONSOLIDE, type Agence } from '@/lib/agences'
import { buildBceaoRepartition, buildExpectedLossPortefeuille, buildSecteursPortefeuille } from '@/lib/portefeuille-reseau'
import { buildConformiteBceao } from '@/lib/mock-conformite-bceao-builder'

type Intent =
  | 'objectifs'
  | 'retard_raison'
  | 'client'
  | 'dossier'
  | 'agent_commercial'
  | 'par_agence_compare'
  | 'par_evolution_reseau'
  | 'agences_alerte'
  | 'tresorerie'
  | 'actions_semaine'
  | 'priorites_jour'
  | 'ra_par_payeurs'
  | 'daf_compta'
  | 'daf_treso'
  | 'daf_bceao'
  | 'daf_provisions'
  | 'daf_cash_7j'
  | 'daf_risque_financier'
  | 'par_collecte'
  | 'synthese_role'
  | 'unknown'

/** Chaque id de suggestion → intention dédiée (ne pas confondre avec questions libres) */
const QUESTION_ID_INTENT: Record<string, Intent> = {
  'exec-priorites': 'priorites_jour',
  'exec-par': 'par_evolution_reseau',
  'exec-agences': 'agences_alerte',
  'exec-liquidite': 'tresorerie',
  'exec-actions': 'actions_semaine',
  'ra-kpi': 'objectifs',
  'ra-equipe': 'agent_commercial',
  'ra-par': 'ra_par_payeurs',
  'ra-credit': 'dossier',
  'ra-terrain': 'synthese_role',
  'gp-priorite': 'client',
  'gp-retard': 'retard_raison',
  'gp-renouvellement': 'client',
  'gp-collecte': 'objectifs',
  'gp-risque': 'par_collecte',
  'tr-tournee': 'synthese_role',
  'tr-retards': 'retard_raison',
  'tr-objectif': 'objectifs',
  'tr-prospects': 'client',
  'tr-conseil': 'synthese_role',
  'co-pipeline': 'synthese_role',
  'co-conversion': 'synthese_role',
  'co-prospects': 'client',
  'co-zones': 'synthese_role',
  'co-objectif': 'objectifs',
  'rcc-reseau': 'par_collecte',
  'rcc-agences': 'agences_alerte',
  'rcc-secteurs': 'synthese_role',
  'rcc-equipe': 'agent_commercial',
  'rcc-ia': 'synthese_role',
  'cc-file': 'dossier',
  'cc-urgent': 'dossier',
  'cc-cbi': 'dossier',
  'cc-score': 'dossier',
  'cc-jour': 'objectifs',
  'roc-par': 'par_evolution_reseau',
  'roc-recouv': 'retard_raison',
  'roc-bloques': 'dossier',
  'roc-agents': 'agent_commercial',
  'roc-decision': 'dossier',
  'fin-tresorerie': 'par_collecte',
  'fin-ecarts': 'par_collecte',
  'fin-recouv': 'retard_raison',
  'fin-alertes': 'synthese_role',
  'fin-cloture': 'synthese_role',
  'daf-compta': 'daf_compta',
  'daf-treso': 'daf_treso',
  'daf-bceao': 'daf_bceao',
  'daf-provisions': 'daf_provisions',
  'daf-cash': 'daf_cash_7j',
  'daf-risque': 'daf_risque_financier',
  'mkt-leads': 'client',
  'mkt-conversion': 'synthese_role',
  'mkt-chatbot': 'synthese_role',
  'mkt-campagnes': 'synthese_role',
  'mkt-segments': 'synthese_role',
}

function detectIntent(question: string, questionId?: string): Intent {
  if (questionId && QUESTION_ID_INTENT[questionId]) {
    return QUESTION_ID_INTENT[questionId]
  }
  const n = normalizeText(question)
  if (/objectif|atteint|rempli|accompli|cible|quota|defi\b/.test(n)) return 'objectifs'
  if (/3 priorit|priorites du jour|priorite du jour/.test(n)) return 'priorites_jour'
  if (/pourquoi.*retard|raison.*retard|retard.*pourquoi|motif.*retard|cause.*retard|explique.*retard/.test(n)) {
    return 'retard_raison'
  }
  if (/evolution|tendance|evolue/.test(n) && /\bpar\b/.test(n)) return 'par_evolution_reseau'
  if (/agence.*alerte|alerte.*agence|quelles agences|agence en alerte|agences en alerte/.test(n)) {
    return 'agences_alerte'
  }
  if (/suspens|cloture|rapproch|grand livre|comptab|ecriture.*attente|471|512/.test(n)) return 'daf_compta'
  if (/ratio.*bceao|bceao.*conform|ratios.*reglement/.test(n)) return 'daf_bceao'
  if (/provision/.test(n) && /constater|bceao|ecart|comptab/.test(n)) return 'daf_provisions'
  if (/besoin.*cash|7 prochain|cash.*7|prevision.*7/.test(n)) return 'daf_cash_7j'
  if (/risque.*financ|expected loss|cout du risque|rentabilite.*agence/.test(n)) return 'daf_risque_financier'
  if (/position.*treso|tresorerie consolid|cash.*agence|liquidite.*agence/.test(n)) return 'daf_treso'
  if (/liquidite|caisse|tresorerie|flux.*cash|position.*cash/.test(n)) return 'tresorerie'
  if (/action.*semaine|recommand.*semaine|ia.*semaine/.test(n)) return 'actions_semaine'
  if (isParAgenceCompareQuestion(n)) return 'par_agence_compare'
  if (/par agence|mauvais payeur|mauvais payeurs/.test(n) && /agence/.test(n)) return 'ra_par_payeurs'
  if (/par\b|impay|defaut|bceao|conformit/.test(n)) return 'par_collecte'
  if (/collecte|encaisse|rembours/.test(n)) return 'par_collecte'
  if (/commercial|agent\b|equipe|performance.*(agent|commercial)/.test(n)) return 'agent_commercial'
  if (/dossier|dos-|dc-|analyse|validation|pipeline|cbi|score.*dossier/.test(n)) return 'dossier'
  if (/client|emprunteur|cl-|portefeuille|visite/.test(n)) return 'client'
  if (/retard|relance|recouvr|mauvais payeur|impaye/.test(n)) return 'retard_raison'
  return 'unknown'
}

function isParAgenceCompareQuestion(n: string): boolean {
  const hasPar = /\bpar\b|impay|defaut/.test(n)
  const hasAgence =
    /agence|agences|reseau|lome centre|adidogome|be kpota|hedzranawoe|kpalime|plateaux|maritime/.test(n)
  const hasCompareIntent =
    /pourquoi|raison|cause|explique|compare|compar|difference|ecart|versus|vs\b|contre|autre|eleve|elevee|haut|haute|fort|forte|bas|faible|inegal|diverg/.test(
      n,
    )
  return (
    (hasPar && hasAgence && hasCompareIntent) ||
    /par.*(plus|moins).*(eleve|haut|bas|fort|faible).*agence/.test(n) ||
    /agence.*(plus|moins).*(eleve|haut|bas).*\bpar\b/.test(n) ||
    (hasPar && /(entre|parmi).*(agence|agences)/.test(n) && hasCompareIntent)
  )
}

const PAR_DRIVER_MAX = 3
const BRIEF_MAX = 3

function shortClientName(nom: string): string {
  const parts = nom.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1]! : nom
}

/** 2–3 facteurs max, sans doublons (BCEAO, zone PAR, etc.) */
function summarizeParAgenceDrivers(agence: Agence, limit = PAR_DRIVER_MAX): string[] {
  const out: string[] = []
  const collectePct = agence.collecte_objectif
    ? Math.round((agence.collecte_mois / agence.collecte_objectif) * 100)
    : 100
  const ops: string[] = []
  if (collectePct < 90) ops.push(`collecte ${collectePct} % obj.`)
  if (agence.taux_remboursement < 92) ops.push(`remb. ${agence.taux_remboursement} %`)
  if (ops.length) out.push(ops.join(' · '))

  const clients = REGISTRE_CLIENTS_RISQUE.filter(c => c.agence === agence.nom_court)
    .sort((a, b) => b.jours_retard - a.jours_retard)
    .slice(0, 3)
  if (clients.length) {
    out.push(
      `${clients.length} impayé${clients.length > 1 ? 's' : ''} : ${clients.map(c => `${shortClientName(c.nom)} J+${c.jours_retard}`).join(', ')}`,
    )
  }

  if (agence.par_courant >= 10) {
    out.push(`> seuil BCEAO 10 % (${agence.par_courant} %) — non-conformité si inaction`)
  } else {
    const hausse = buildHaussesAnormalesDefauts().find(h => h.agence === agence.nom_court)
    if (hausse?.alerte === 'CRITIQUE') out.push('Hausse PAR vs réseau — investigation')
  }

  if (out.length < limit) {
    const alerte = MOCK_MANAGER.alertes_direction.find(
      a => a.zone && (a.zone.includes(agence.nom_court) || agence.nom_court.includes(a.zone)),
    )
    if (alerte && !out.some(l => l.includes('BCEAO'))) {
      const action = alerte.action.split('+')[0]?.trim() ?? alerte.action
      out.push(`RA ${agence.responsable} : ${action}`)
    }
  }

  if (!out.length) {
    out.push(`${agence.emprunteurs_actifs} clients · encours ${fmtFcfa(agence.encours_fcfa)} FCFA`)
  }

  return out.slice(0, limit)
}

function bulletDrivers(drivers: string[]): string[] {
  return drivers.map(d => `• ${d}`)
}

function truncate(s: string, max = 90): string {
  const t = s.trim()
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`
}

function statutCourt(statut: string): string {
  const map: Record<string, string> = {
    EN_AVANCE: 'avance',
    DANS_LES_TEMPS: 'ok',
    EN_RETARD: 'retard',
    CRITIQUE: 'critique',
  }
  return map[statut] ?? statut
}

function briefLines(header: string, bullets: string[], action?: string): string {
  const parts = [header, '', ...bulletDrivers(bullets.slice(0, BRIEF_MAX))]
  if (action) parts.push('', action)
  return parts.join('\n')
}

function answerParAgenceCompare(ctx: CopilotContext, question: string): string {
  const [high, low] = resolveAgencesFromQuestion(question)
  const parReseau = getMoisCourant().par_30
  const ecart = Number((high.par_courant - low.par_courant).toFixed(1))
  const collecteHigh = Math.round((high.collecte_mois / high.collecte_objectif) * 100)
  const collecteLow = Math.round((low.collecte_mois / low.collecte_objectif) * 100)
  const drivers = summarizeParAgenceDrivers(high)
  const header = `${ctx.prenom} — ${high.nom_court} ${high.par_courant} % vs ${low.nom_court} ${low.par_courant} % (réseau ${parReseau} %, écart ${ecart} pt).`

  switch (ctx.role) {
    case 'DAF': {
      const rentHigh = MOCK_DAF_HOME.rentabilite_agences.find(
        a => a.agence === high.nom_court || a.agence.includes(high.nom_court),
      )
      const rentLow = MOCK_DAF_HOME.rentabilite_agences.find(
        a => a.agence === low.nom_court || a.agence.includes(low.nom_court),
      )
      return briefLines(
        header,
        [
          rentHigh
            ? `${high.nom_court} : marge ${rentHigh.marge_pct} % · résultat ${fmtFcfa(rentHigh.resultat)}`
            : `${high.nom_court} : PAR ${high.par_courant} % tire le coût du risque`,
          rentLow ? `${low.nom_court} : marge ${rentLow.marge_pct} % · ROI ${rentLow.roi_pct} %` : `${low.nom_court} : PAR ${low.par_courant} %`,
          `Écart provisions réseau : ${fmtFcfa(buildBceaoRepartition().ecart_provisions)}`,
        ],
        `→ Provision complémentaire ${high.nom_court} + revue rentabilité agence.`,
      )
    }
    case 'MANAGER':
      return [
        header,
        '',
        `Pourquoi ${high.nom_court} :`,
        ...bulletDrivers(drivers),
        '',
        `${low.nom_court} : remb. ${low.taux_remboursement} %${low.statut === 'PILOTE' ? ', agence pilote' : ''}, PAR bas.`,
        '',
        `→ Plan redressement 60 j ${high.nom_court} + audit GPS ; renfort recouvrement.`,
      ].join('\n')

    case 'RESPONSABLE_CREDIT':
    case 'RISQUE':
    case 'CREDIT': {
      const reco =
        MOCK_CREDIT_RISQUE.recommandations_ia.find(r => r.message.includes(high.nom_court))?.message
      const recoShort = reco
        ? reco.length > 90
          ? `${reco.slice(0, 87)}…`
          : reco
        : `Restructurations + visites ${high.nom_court}.`
      return [
        header,
        '',
        `Drivers ${high.nom_court} :`,
        ...bulletDrivers(drivers),
        '',
        `→ ${recoShort}`,
        `${low.nom_court} (${low.par_courant} %) : garder critères stricts secteurs saisonniers.`,
      ].join('\n')
    }

    case 'GESTIONNAIRE': {
      const ra = getRaHubData()
      const monAgence = ra.agence.nom
      const isMine = high.nom_court === monAgence || high.nom.includes(monAgence)
      const secteurAlert = ra.secteurs_demande
        .filter((s: { par: number }) => s.par >= 9)
        .slice(0, 1)
        .map((s: { secteur: string; par: number }) => `Secteur ${s.secteur} PAR ${s.par} %`)[0]
      return [
        isMine ? `${ctx.prenom} — votre agence (${monAgence}), PAR ${high.par_courant} %.` : header,
        '',
        ...bulletDrivers(drivers),
        secteurAlert ? `• ${secteurAlert}` : '',
        '',
        `Réf. ${low.nom_court} ${low.par_courant} % — combler ${ecart} pt via recouvrement.`,
      ]
        .filter(Boolean)
        .join('\n')
    }

    case 'GESTIONNAIRE_PORTEFEUILLE':
      return [
        header,
        '',
        ...bulletDrivers(drivers),
        '',
        `Vos visites prioritaires : ${REGISTRE_CLIENTS_RISQUE.filter(c => c.agence === high.nom_court)
          .slice(0, 2)
          .map(c => shortClientName(c.nom))
          .join(', ')}.`,
      ].join('\n')

    case 'RESPONSABLE_COMMERCIAL':
    case 'COMMERCIAL':
      return [
        header,
        '',
        `${high.nom_court} : collecte ${collecteHigh} % obj. → PAR tiré vers le haut.`,
        `${low.nom_court} : collecte ${collecteLow} % · discipline paiement meilleure.`,
        '',
        `→ Renfort terrain ${high.nom_court} (objectif équipe ${MOCK_MANAGER.synthese_zones.find(z => z.zone.includes(high.nom_court))?.objectif_pct ?? 62} %).`,
      ].join('\n')

    case 'RELANCE':
    case 'COMPTABLE':
    case 'PAIE':
      return [
        header,
        '',
        ...bulletDrivers(drivers),
        '',
        `→ ${MOCK_FINANCES.relances_actives.length} relances actives réseau — prioriser ${high.nom_court}.`,
      ].join('\n')

    default:
      return [
        header,
        '',
        ...bulletDrivers(drivers),
        '',
        'Réseau :',
        ...[...AGENCES_LIST]
          .sort((a, b) => b.par_courant - a.par_courant)
          .map(a => `• ${a.nom_court} ${a.par_courant} %`),
      ].join('\n')
  }
}

function answerParEvolutionReseau(ctx: CopilotContext): string {
  const hist = MOCK_MANAGER.par_historique
  const first = hist[0]!
  const last = hist[hist.length - 1]!
  const delta = Number((last.par_30j - first.par_30j).toFixed(1))
  const k = MOCK_MANAGER.kpis
  const forecast = RESEAU_CONSOLIDE.forecast?.[0]

  return briefLines(
    `${ctx.prenom} — PAR réseau (mai 2026) :`,
    [
      `Jan → Mai : ${first.par_30j} % → ${last.par_30j} % (${delta > 0 ? '+' : ''}${delta} pt)`,
      `Actuel : ${k.par_30j} % (${k.par_30j_variation > 0 ? '+' : ''}${k.par_30j_variation} pt vs avril)`,
      forecast ? `Prévision juin : ${forecast.par_prevu} % (conf. ${forecast.confidence} %)` : 'Objectif juin : < 8 %',
    ],
    delta < 0 ? '→ Tendance baissière — verrouiller le gain sur Bè Kpota.' : '→ Tendance à surveiller.',
  )
}

function answerAgencesAlerte(ctx: CopilotContext): string {
  const hautes = MOCK_MANAGER.alertes_direction
    .filter(a => a.urgence === 'HAUTE' && a.zone)
    .slice(0, BRIEF_MAX)

  const bullets =
    hautes.length > 0
      ? hautes.map(a => `${a.zone} : ${truncate(a.action, 60)}`)
      : [...AGENCES_LIST]
          .filter(a => a.par_courant >= 9)
          .sort((a, b) => b.par_courant - a.par_courant)
          .slice(0, BRIEF_MAX)
          .map(a => `${a.nom_court} PAR ${a.par_courant} %`)

  const worst = AGENCES_LIST.reduce((w, a) => (a.par_courant > w.par_courant ? a : w), AGENCES_LIST[0]!)

  return briefLines(
    `${ctx.prenom} — agences en alerte :`,
    bullets,
    `→ Priorité : ${worst.nom_court} (${worst.par_courant} %, seuil BCEAO 10 %).`,
  )
}

function answerTresorerie(ctx: CopilotContext): string {
  const bullets: string[] = []
  let action: string | undefined

  switch (ctx.role) {
    case 'DAF':
      return answerDafTreso(ctx)
    case 'MANAGER':
      bullets.push('Caisse consolidée 8,6 M FCFA (72 % du seuil cible)')
      bullets.push('Flux net jour +390 k · tension décaissements vendredi')
      action = '→ Transfert inter-agences +1,5 M avant vendredi.'
      break
    case 'GESTIONNAIRE': {
      const t = getRaHubData().tresorerie as {
        solde_caisse?: number
        flux_net_jour?: number
      }
      bullets.push(`Solde caisse ${fmtFcfa(t.solde_caisse ?? 2_400_000)} FCFA`)
      bullets.push(`Flux jour ${t.flux_net_jour && t.flux_net_jour < 0 ? 'négatif' : 'positif'} — pic sorties vendredi`)
      action = '→ Renforcer caisse jeudi soir.'
      break
    }
    default:
      bullets.push(`Encours réseau ${fmtFcfa(RESEAU_CONSOLIDE.encours_total ?? 85_000_000)} FCFA`)
      action = '→ Consulter le tableau trésorerie agence.'
  }

  return briefLines(`${ctx.prenom} — liquidité & caisse :`, bullets, action)
}

function answerActionsSemaine(ctx: CopilotContext): string {
  const bullets: string[] = []

  switch (ctx.role) {
    case 'DAF':
      MOCK_DAF_HOME.synthese_ia.points
        .filter(p => p.tone === 'attention' || p.tone === 'negatif')
        .slice(0, BRIEF_MAX)
        .forEach(p => bullets.push(truncate(p.action ?? p.texte, 75)))
      break
    case 'MANAGER':
      MOCK_MANAGER.ia_insights_manager
        .filter(i => i.type === 'ALERTE')
        .slice(0, BRIEF_MAX)
        .forEach(i => bullets.push(truncate(i.titre, 75)))
      break
    case 'RESPONSABLE_CREDIT':
      MOCK_CREDIT_RISQUE.recommandations_ia.slice(0, BRIEF_MAX).forEach(r => {
        bullets.push(truncate(r.message, 75))
      })
      break
    case 'RESPONSABLE_COMMERCIAL':
      getRccHubData().propositions_ia?.slice(0, BRIEF_MAX).forEach((p: { action: string }) => {
        bullets.push(truncate(p.action, 75))
      })
      break
    default:
      MOCK_MANAGER.alertes_direction
        .filter(a => a.urgence === 'HAUTE')
        .slice(0, BRIEF_MAX)
        .forEach(a => bullets.push(`${a.zone ?? 'Réseau'} : ${truncate(a.action, 55)}`))
  }

  if (!bullets.length) {
    bullets.push('Aucune action critique en attente.')
  }

  return briefLines(`${ctx.prenom} — actions IA cette semaine :`, bullets, '→ Arbitrage Bè Kpota lundi matin.')
}

function answerPrioritesJour(ctx: CopilotContext): string {
  const bullets = MOCK_MANAGER.alertes_direction
    .filter(a => a.urgence === 'HAUTE')
    .slice(0, 3)
    .map((a, i) => `${i + 1}. ${a.zone ?? 'Réseau'} : ${truncate(a.action, 55)}`)

  if (ctx.role === 'DAF') {
    const d = MOCK_DAF_HOME
    const worstCash = [...d.tresorerie.prevision_7j].sort((a, b) => a.solde_proj - b.solde_proj)[0]!
    const suspensNote = d.comptabilite.suspens_comptables.find(s => s.statut === 'CRITIQUE')?.note ?? 'Suspens à traiter'
    const bulletsDaf = [
      `Clôture J-${d.comptabilite.cloture_dans_jours} : ${d.comptabilite.ecritures_attente} écritures + ${d.comptabilite.rapprochements_a_finaliser} rapproch.`,
      truncate(suspensNote, 70),
      `Cash ${worstCash.date} : solde projeté ${fmtFcfa(worstCash.solde_proj)}`,
    ]
    return briefLines(`${ctx.prenom} — priorités opérationnelles :`, bulletsDaf.slice(0, BRIEF_MAX), '→ Lettrage 471 puis provisions BCEAO.')
  }

  if (ctx.role !== 'MANAGER') {
    return answerSyntheseRole(ctx)
  }

  return briefLines(`${ctx.prenom} — 3 priorités du jour :`, bullets, '→ Valider le plan Bè Kpota en premier.')
}

function answerRaParEtPayeurs(ctx: CopilotContext): string {
  const ra = getRaHubData()
  const bullets = [
    `PAR agence ${ra.kpis_credit.par_30_pct} % · remb. ${ra.kpis_credit.taux_remboursement_pct} %`,
    ...ra.mauvais_payeurs
      .slice(0, 2)
      .map((c: { client: string; retard_jours: number }) => `${c.client} J+${c.retard_jours}`),
  ]

  return briefLines(
    `${ctx.prenom} — ${ra.agence.nom} :`,
    bullets.slice(0, BRIEF_MAX),
    '→ Visite impayés prioritaires ce matin.',
  )
}

const DAF_COPILOT_TAG = 'Complément IA (détail hors bandeau Finance)'

function answerDafCompta(ctx: CopilotContext): string {
  const c = MOCK_DAF_HOME.comptabilite
  const sy = c.syscohada
  const att = sy.journal.ecritures.filter(e => e.statut === 'ATTENTE_VALIDATION')
  const rap = sy.rapprochements.find(r => r.ecart !== 0)
  const bullets = [
    `Balance : ${sy.balance_generale.lignes.length} comptes · clôture J-${c.cloture_dans_jours}`,
    att[0] ? `${att[0].piece} (${att[0].journal}) — ${truncate(att[0].libelle, 50)}` : 'Journal validé',
    rap ? `Rapproch. ${rap.compte} : écart ${fmtFcfa(rap.ecart)} (${rap.operations_non_pointees.length} ligne(s))` : 'Rapprochements OK',
  ]
  return briefLines(
    `${ctx.prenom} — ${DAF_COPILOT_TAG} · compta :`,
    bullets,
    '→ Valider EC-ATT-003 puis pointer Ecobank 512100.',
  )
}

function answerDafTreso(ctx: CopilotContext): string {
  const rows = [...MOCK_DAF_HOME.tresorerie.par_agence].sort((a, b) => a.ratio - b.ratio)
  const tension = rows.filter(a => a.statut === 'TENSION')
  const bullets = (tension.length ? tension : rows.slice(0, 2)).slice(0, BRIEF_MAX).map(
    a => `${a.agence} : ratio ${a.ratio}x · décaiss. prévu ${fmtFcfa(a.decaissement_prevu)}`,
  )
  const pivot = rows.find(a => a.statut === 'NORMAL' && a.ratio >= 1.2) ?? rows[rows.length - 1]!
  return briefLines(
    `${ctx.prenom} — ${DAF_COPILOT_TAG} · cash agences :`,
    bullets,
    `→ Transfert ${fmtFcfa(Math.round(pivot.decaissement_prevu * 0.35))} depuis ${pivot.agence} vers ${rows[0]!.agence} avant jeudi.`,
  )
}

function answerDafBceao(ctx: CopilotContext): string {
  const conf = buildConformiteBceao()
  const nc = conf.ratios_reglementaires.filter(r => r.statut === 'NON_CONFORME').slice(0, BRIEF_MAX)
  const bullets = nc.map(r => {
    const label = r.indicateur.replace(/—.*/, '').trim()
    return `${label} : ${r.valeur} (seuil ${r.seuil})`
  })
  const score = conf.score_global
  return briefLines(
    `${ctx.prenom} — ${DAF_COPILOT_TAG} · ${nc.length} ratio(s) NC (score ${score}/100) :`,
    bullets,
    '→ Prioriser transformation + couverture provisions avant rapport du 31/05.',
  )
}

function answerDafProvisions(ctx: CopilotContext): string {
  const bceao = buildBceaoRepartition()
  const suspens = MOCK_DAF_HOME.comptabilite.suspens_comptables
  const critique = suspens.find(s => s.statut === 'CRITIQUE')
  const perte = bceao.classes.find(c => c.code === 'PERTE')
  const bullets = [
    `Écart BCEAO : ${fmtFcfa(bceao.ecart_provisions)} (couverture ${Math.round((bceao.total_provisions_constituees / bceao.total_provisions_a_constituer) * 100)} %)`,
    critique
      ? `${critique.compte} : ${fmtFcfa(critique.solde)} · ${critique.age_jours} j sans pièce`
      : 'Aucun suspens critique',
    perte ? `Classe PERTE : ${perte.count} dossiers · ${fmtFcfa(perte.provision_fcfa)} à 100 %` : undefined,
  ].filter((x): x is string => Boolean(x))

  return briefLines(
    `${ctx.prenom} — ${DAF_COPILOT_TAG} · provisions :`,
    bullets.slice(0, BRIEF_MAX),
    '→ OD provisions + lettrage 471 avant clôture (J-7).',
  )
}

function answerDafCash7j(ctx: CopilotContext): string {
  const prev = MOCK_DAF_HOME.tresorerie.prevision_7j
  const worst = prev.reduce((w, p) => (p.solde_proj < w.solde_proj ? p : w), prev[0]!)
  const peakOut = prev.reduce((w, p) => (p.sortants > w.sortants ? p : w), prev[0]!)
  const bullets = [
    `${worst.date} : solde projeté ${worst.solde_proj >= 0 ? '+' : ''}${fmtFcfa(worst.solde_proj)} (sorties ${fmtFcfa(worst.sortants)})`,
    `${peakOut.date} : pic sorties ${fmtFcfa(peakOut.sortants)} · entrants ${fmtFcfa(peakOut.entrants)}`,
    `Compte 657 pertes créances : +${MOCK_DAF_HOME.comptabilite.comptes_sensitifs.find(c => c.code === '657')?.variation_m1_pct ?? 18} % vs avril`,
  ]
  return briefLines(`${ctx.prenom} — ${DAF_COPILOT_TAG} · cash 7 j :`, bullets, '→ Renforcer caisse siège jeudi soir (pic vendredi).')
}

function answerDafRisqueFinancier(ctx: CopilotContext): string {
  const def = MOCK_DAF_HOME.rentabilite_agences.find(a => a.statut === 'DEFICITAIRE')!
  const elBk = buildExpectedLossPortefeuille().par_agence.find(a => a.nom.includes('Kpota'))
  const secteur = [...buildSecteursPortefeuille()].sort((a, b) => b.par_30j_pct - a.par_30j_pct)[0]!
  const ecartCharges = MOCK_DAF_HOME.controle_gestion.ecarts_vs_objectif.find(
    e => e.indicateur.includes('Charges'),
  )
  const bullets = [
    `${def.agence} : résultat ${fmtFcfa(def.resultat)} · marge ${def.marge_pct} % (seul déficit réseau)`,
    elBk ? `EL ${elBk.nom} : ${fmtFcfa(elBk.el)} (${elBk.el_pct} % encours agence)` : 'EL Bè Kpota élevée',
    `${secteur.nom} : PAR ${secteur.par_30j_pct} % — driver coût du risque`,
    ecartCharges
      ? `Charges op. ${ecartCharges.ecart_pct > 0 ? '+' : ''}${ecartCharges.ecart_pct} % vs budget`
      : undefined,
  ].filter((x): x is string => Boolean(x))

  return briefLines(
    `${ctx.prenom} — ${DAF_COPILOT_TAG} · risques :`,
    bullets.slice(0, BRIEF_MAX),
    '→ Point ROC + révision marge Bè Kpota avant comité risque.',
  )
}

function answerDafSynthese(ctx: CopilotContext): string {
  const budgetAlerte = MOCK_DAF_HOME.budget.find(b => b.statut === 'ALERTE')
  const suspens = MOCK_DAF_HOME.comptabilite.suspens_comptables.filter(
    s => s.statut === 'CRITIQUE' || s.statut === 'ANOMALIE',
  )
  const bullets = [
    budgetAlerte
      ? `${budgetAlerte.poste} : +${budgetAlerte.deviation_pct} % vs budget (${budgetAlerte.pct} % consommé)`
      : undefined,
    ...suspens.slice(0, 2).map(s => `${s.compte} ${fmtFcfa(s.solde)} · ${s.age_jours} j`),
    MOCK_DAF_HOME.bilan_consolide.statut === 'PROVISOIRE'
      ? 'Bilan provisoire — 3 suspens avant passage définitif'
      : undefined,
  ].filter((x): x is string => Boolean(x))

  return briefLines(
    `${ctx.prenom} — ${DAF_COPILOT_TAG} :`,
    bullets.slice(0, BRIEF_MAX),
    '→ Onglet Comptabilité : lettrer 471 puis valider clôture.',
  )
}

function answerObjectifs(ctx: CopilotContext): string {
  const objectifs = getObjectifsForRole(ctx.role)
  const daily = getDailyTargetsForRole(ctx.role)
  const bullets: string[] = []

  if (ctx.role === 'COMMERCIAL') {
    const k = MOCK_COMMERCIAL.kpis
    const pct = k.collecte_objectif_jour
      ? Math.round((k.collecte_aujourd_hui / k.collecte_objectif_jour) * 100)
      : 0
    bullets.push(`Jour : collecte ${pct} % · visites ${k.visites_aujourd_hui}/${k.objectif_jour}`)
    const gap = MOCK_COMMERCIAL.defis_actifs.find(d => d.realise < d.objectif)
    if (gap) bullets.push(`${gap.titre} : ${gap.realise}/${gap.objectif}`)
  }

  if (ctx.role === 'GESTIONNAIRE_PORTEFEUILLE') {
    const r = MOCK_GESTIONNAIRE.ia_rapport_journalier
    bullets.push(`Collecte ${fmtFcfa(r.collecte_realisee)} · visites ${r.visites_effectuees}/${r.visites_planifiees} · score ${r.score_journee}/100`)
  }

  if (ctx.role === 'AGENT_TERRAIN' || ctx.role === 'COLLECTRICE') {
    const k = MOCK_AGENT_TERRAIN.kpis
    const pct = Math.round((k.cash_collecte_aujourd_hui / k.cash_objectif_jour) * 100)
    bullets.push(`${k.zone} : collecte ${pct} % · visites ${MOCK_AGENT_TERRAIN.rapport_soir.nb_visites}/${MOCK_AGENT_TERRAIN.rapport_soir.nb_planifie}`)
  }

  for (const t of daily.slice(0, 2)) {
    if (bullets.length >= BRIEF_MAX) break
    bullets.push(`${t.label} : ${t.pct} % (${statutCourt(t.statut)})`)
  }
  for (const o of objectifs.slice(0, 2)) {
    if (bullets.length >= BRIEF_MAX) break
    bullets.push(`${o.titre} : ${o.progression} % (${statutCourt(o.statut)})`)
  }

  const enRetard = [...objectifs, ...daily].some(
    o => 'statut' in o && (o.statut === 'EN_RETARD' || o.statut === 'CRITIQUE'),
  )
  const urgent = objectifs.find(o => o.ia_action_urgente)

  return briefLines(
    `${ctx.prenom} — objectifs du jour (${ROLE_LABELS[ctx.role]}) :`,
    bullets,
    enRetard
      ? `→ ${urgent ? truncate(urgent.ia_action_urgente!, 85) : 'Prioriser les objectifs en retard.'}`
      : '→ Globalement dans les temps.',
  )
}

function answerRetardForRole(ctx: CopilotContext, entity?: ResolvedEntity): string {
  const clientName = entity?.displayName
  const seed = clientName
    ? REGISTRE_CLIENTS_RISQUE.find(
        c =>
          normalizeText(c.nom).includes(normalizeText(clientName)) ||
          normalizeText(clientName).includes(normalizeText(c.nom)),
      )
    : undefined
  const gp = clientName ? getGpClientByName(clientName) : undefined
  const detail = seed?.id ? getClientRisqueById(seed.id) : undefined
  const terrain = clientName
    ? MOCK_AGENT_TERRAIN.clients_en_retard.find(c =>
        normalizeText(c.nom).includes(normalizeText(clientName!)),
      )
    : undefined
  const label = clientName ?? seed?.nom

  if (!label) {
    if (ctx.role === 'GESTIONNAIRE_PORTEFEUILLE' || ctx.role === 'GESTIONNAIRE') {
      const top = MOCK_GESTIONNAIRE.clients_portefeuille
        .filter(c => c.retard > 0)
        .sort((a, b) => b.retard - a.retard)
        .slice(0, BRIEF_MAX)
      return briefLines(
        `${ctx.prenom} — retards prioritaires :`,
        top.map(c => `${shortClientName(c.nom)} J+${c.retard} · ${c.ia_action ?? 'Visite'}`),
        '→ Traiter les 2 premiers avant midi.',
      )
    }
    const top = [...REGISTRE_CLIENTS_RISQUE]
      .sort((a, b) => b.jours_retard - a.jours_retard)
      .slice(0, BRIEF_MAX)
    return briefLines(
      `${ctx.prenom} — impayés réseau :`,
      top.map(c => `${shortClientName(c.nom)} J+${c.jours_retard} (${c.agence})`),
    )
  }

  const bullets: string[] = []
  let action = '→ Relance aujourd\'hui.'

  switch (ctx.role) {
    case 'GESTIONNAIRE_PORTEFEUILLE':
    case 'GESTIONNAIRE':
      if (gp) {
        bullets.push(`J+${gp.retard} · score ${gp.score}/100 (${gp.delta_score >= 0 ? '+' : ''}${gp.delta_score})`)
        if (gp.ia_alerte) bullets.push(truncate(gp.ia_alerte, 85))
        action = `→ ${gp.ia_action ?? 'Visite terrain'}.`
      }
      break
    case 'CREDIT':
    case 'RISQUE':
    case 'RESPONSABLE_CREDIT':
      if (detail) {
        bullets.push(`Score ${detail.score_ia}/100 · PD ${detail.pd_pct} % · ${detail.echeances_impayees} impayé(s)`)
        const alert = detail.alertes_ia[0]
        if (alert) bullets.push(truncate(alert.message, 80))
      }
      if (seed) action = `→ ${seed.action}.`
      break
    case 'COMMERCIAL':
    case 'RESPONSABLE_COMMERCIAL':
      bullets.push(
        seed ? `${seed.agence} · agent ${seed.agent}` : 'Client hors registre prioritaire',
        gp?.ia_alerte ? truncate(gp.ia_alerte, 80) : 'Coordonner avec le GP',
      )
      action = '→ Pas de nouvelle offre avant régularisation.'
      break
    case 'MANAGER':
    case 'DAF':
      if (seed) {
        bullets.push(`${seed.agence} · encours ${fmtFcfa(seed.encours)} · EL ${fmtFcfa(seed.el)}`)
        bullets.push(`J+${seed.jours_retard} · ${truncate(seed.action, 70)}`)
      }
      action = '→ Suivi PAR agence si J+30.'
      break
    case 'AGENT_TERRAIN':
    case 'COLLECTRICE':
      if (terrain) {
        bullets.push(`J+${terrain.retard} · ${fmtFcfa(terrain.montant)} FCFA`)
        bullets.push(truncate(terrain.motif_probale, 80))
        action = `→ ${terrain.action_ia}.`
      } else if (seed) {
        bullets.push(`J+${seed.jours_retard}`)
        action = `→ ${seed.action}.`
      }
      break
    default:
      if (seed) bullets.push(`J+${seed.jours_retard} · ${seed.action}`)
  }

  const fiche = seed?.id ? getFicheClientMicrofinance(seed.id) : undefined
  if (fiche?.indicateurs_risque && bullets.length < BRIEF_MAX && ctx.role !== 'COMMUNICATION') {
    bullets.push(`DTI ${fiche.indicateurs_risque.dti_pct} % · encours/revenu ${fiche.indicateurs_risque.ratio_encours_revenu}×`)
  }

  return briefLines(`${ctx.prenom} — retard ${label} :`, bullets, action)
}

function answerClient(ctx: CopilotContext, entity?: ResolvedEntity): string {
  const name = entity?.displayName
  const seed = entity?.kind === 'client' ? REGISTRE_CLIENTS_RISQUE.find(c => c.id === entity.id) : undefined
  const client = getClientRisqueById(entity?.id ?? seed?.id ?? '')
  const gp = name ? getGpClientByName(name) : undefined
  const display = client?.nom ?? gp?.nom

  if (!client && !gp) {
    return `${ctx.prenom}, client introuvable. Essayez : Komlan Attivor, Kwami Ekpé, CL-1042.`
  }

  const bullets: string[] = []
  let action: string | undefined

  switch (ctx.role) {
    case 'GESTIONNAIRE_PORTEFEUILLE':
      if (gp) {
        bullets.push(`${gp.groupe} · J+${gp.retard} · ${gp.canal} · score ${gp.score}/100`)
        if (gp.ia_alerte) bullets.push(truncate(gp.ia_alerte, 80))
        action = gp.ia_action ? `→ ${gp.ia_action}` : undefined
      }
      break
    case 'COMMERCIAL':
    case 'RESPONSABLE_COMMERCIAL': {
      const revisit = MOCK_COMMERCIAL.ready_to_revisit.find(r =>
        normalizeText(r.nom).includes(normalizeText(name ?? '')),
      )
      bullets.push(
        client ? `${client.activite} · ${client.localite}` : display ?? '',
        revisit ? truncate(revisit.ia_conseil, 80) : 'Pas de relance prospect en attente',
      )
      action = '→ Vérifier avec le GP avant nouvelle offre.'
      break
    }
    case 'CREDIT':
    case 'RISQUE':
      if (client) {
        bullets.push(`Score ${client.score_ia}/100 · ${client.classe_bceao} · PD ${client.pd_pct} %`)
        if (client.jours_retard > 0) bullets.push(`Retard J+${client.jours_retard}`)
      }
      action = client?.action ? `→ ${client.action}` : undefined
      break
    case 'MANAGER':
      if (client) {
        bullets.push(`${client.agence} · encours ${fmtFcfa(client.encours)} · J+${client.jours_retard}`)
        bullets.push(`PD ${client.pd_pct} %`)
      }
      break
    default:
      if (client) {
        bullets.push(`${client.secteur} · encours ${fmtFcfa(client.encours)} · score ${client.score_ia}/100`)
        bullets.push(`J+${client.jours_retard} · ${client.action}`)
      }
  }

  if (client?.credits?.length && bullets.length < BRIEF_MAX) {
    const cr = client.credits[0]!
    bullets.push(`Crédit ${cr.reference} : ${cr.statut}`)
  }

  return briefLines(`${ctx.prenom} — ${display} :`, bullets, action)
}

function answerDossier(ctx: CopilotContext, entity?: ResolvedEntity): string {
  const id = entity?.id ?? entity?.label
  const rapport = id ? getDossierRapportCc(id) : undefined
  const bloque = id ? REGISTRE_DOSSIERS_BLOQUES.find(d => d.id === id) : undefined
  const bloqueDetail = id ? getDossierBloqueById(id) : undefined
  const pipeline = MOCK_CREDIT_RISQUE.dossiers_requierent_action.find(
    d => d.id === id || normalizeText(d.nom).includes(normalizeText(entity?.displayName ?? '')),
  )
  const ref = id ?? rapport?.reference_dossier ?? bloque?.id

  if (!rapport && !bloque && !pipeline) {
    const open = mockListDossiersCredit().slice(0, 3)
    return briefLines(
      `${ctx.prenom}, dossier introuvable. Exemples :`,
      open.map(d => `${d.reference} — ${d.client.prenom} ${d.client.nom}`),
    )
  }

  const bullets: string[] = []
  let action: string | undefined

  if (bloque || bloqueDetail) {
    const raison = bloque?.raison ?? bloqueDetail?.raison
    const h = bloque?.bloque_depuis_h ?? bloqueDetail?.bloque_depuis_h
    bullets.push(`Bloqué ${h}h · ${raison ?? '—'}`)
    action = bloqueDetail?.actions_recommandees?.[0]
      ? `→ ${truncate(bloqueDetail.actions_recommandees[0]!, 85)}`
      : undefined
  }

  if (rapport) {
    const clientLabel = `${rapport.client.prenom} ${rapport.client.nom}`
    switch (ctx.role) {
      case 'CREDIT':
      case 'RISQUE':
        bullets.push(`${rapport.etape_courante} · score ${rapport.score_consolide}/100`)
        bullets.push(`Décision : ${rapport.analyse_prospera_ia.decision_suggeree ?? '—'}`)
        if (rapport.alertes_actives[0]) bullets.push(truncate(rapport.alertes_actives[0]!.message, 80))
        action = rapport.rappels_etape[0] ? `→ ${truncate(rapport.rappels_etape[0]!, 85)}` : action
        break
      case 'RESPONSABLE_CREDIT':
        bullets.push(`${fmtFcfa(rapport.montant_demande)} FCFA · PD ${rapport.probabilite_defaut_pct} %`)
        bullets.push(`${rapport.classe_bceao} · ${rapport.charge_credit.nom}`)
        action = rapport.rappels_etape[0] ? `→ ${truncate(rapport.rappels_etape[0]!, 85)}` : action
        break
      case 'GESTIONNAIRE_PORTEFEUILLE':
        bullets.push(`${clientLabel} · ${rapport.etape_courante}`)
        action = '→ Suivi remboursement après décaissement seulement.'
        break
      case 'COMMERCIAL':
        bullets.push(`${clientLabel} · ${rapport.client.localite}`)
        bullets.push(`${rapport.etape_courante} depuis ${rapport.date_creation}`)
        break
      default:
        bullets.push(`${clientLabel} · ${fmtFcfa(rapport.montant_demande)} FCFA · score ${rapport.score_consolide}/100`)
    }
  }

  if (pipeline && bullets.length < BRIEF_MAX) {
    bullets.push(`${pipeline.stage} · ${pipeline.jours_attente}j attente · score ${pipeline.score}`)
    action = action ?? `→ ${truncate(pipeline.action, 85)}`
  }

  return briefLines(`${ctx.prenom} — ${ref} :`, bullets, action)
}

function answerAgentCommercial(ctx: CopilotContext, question: string): string {
  const n = normalizeText(question)
  const agent =
    REGISTRE_AGENT_ACTIVITE.find(a => n.includes(normalizeText(a.agent))) ??
    MOCK_COMMERCIAL.classement_equipe.find(a => n.includes(normalizeText(a.nom))) ??
    getRaHubData().agents_terrain?.find((a: { nom: string }) => n.includes(normalizeText(a.nom)))

  if (!agent) {
    if (ctx.role === 'RESPONSABLE_COMMERCIAL') {
      return briefLines(
        `${ctx.prenom} — top équipe :`,
        MOCK_COMMERCIAL.classement_equipe
          .slice(0, BRIEF_MAX)
          .map(a => `${a.nom} · conv. ${Math.round(a.conv * 100)} %`),
        `→ ${getRccHubData().rapport.alertes_immediates[0] ?? 'Voir alertes réseau.'}`,
      )
    }
    return `${ctx.prenom}, précisez l'agent (ex. Akua Lawson, Mensah Kodjo).`
  }

  const nom = 'nom' in agent ? agent.nom : agent.agent
  const bullets: string[] = []

  if ('dossiers_traites_mois' in agent) {
    bullets.push(`${agent.dossiers_approuves_mois}/${agent.dossiers_traites_mois} dossiers/mois · ${agent.agence}`)
  }
  if ('visites' in agent && 'collecte' in agent) {
    bullets.push(`#${agent.rang} · ${agent.visites} visites · conv. ${Math.round(agent.conv * 100)} %`)
  }
  if ('collecte_jour' in agent && 'performance_pct' in agent) {
    const a = agent as {
      collecte_jour: number
      objectif_jour: number
      performance_pct: number
      statut: string
      visites_jour: number
      visites_prevues: number
    }
    bullets.push(
      `Jour : ${a.visites_jour}/${a.visites_prevues} visites · ${Math.round((a.collecte_jour / a.objectif_jour) * 100)} % collecte`,
    )
    bullets.push(`Perf. ${a.performance_pct} % · ${a.statut}`)
  }

  if (ctx.role === 'MANAGER' || ctx.role === 'GESTIONNAIRE') {
    const alert = MOCK_MANAGER.synthese_zones.find(z =>
      z.agent.toLowerCase().includes(nom.toLowerCase()),
    )
    if (alert && bullets.length < BRIEF_MAX) bullets.push(`Zone PAR ${alert.par} % · obj. ${alert.objectif_pct} %`)
  }

  const action =
    'statut' in agent && agent.statut === 'DEGRADE'
      ? '→ Coaching sous 48 h.'
      : undefined

  return briefLines(`${ctx.prenom} — ${nom} :`, bullets, action)
}

function answerParCollecte(ctx: CopilotContext): string {
  const m = getMoisCourant()
  const bullets: string[] = []
  let action: string | undefined

  switch (ctx.role) {
    case 'MANAGER':
      bullets.push(`PAR 30 : ${MOCK_MANAGER.kpis.par_30j} % (${MOCK_MANAGER.kpis.par_30j_variation >= 0 ? '+' : ''}${MOCK_MANAGER.kpis.par_30j_variation} pt)`)
      bullets.push(
        `Collecte ${Math.round((MOCK_MANAGER.kpis.collecte_mois / MOCK_MANAGER.kpis.collecte_objectif) * 100)} % objectif`,
      )
      action = '→ Voir agences > 10 % PAR (Bè Kpota).'
      break
    case 'GESTIONNAIRE': {
      const ra = getRaHubData()
      bullets.push(`PAR agence ${ra.kpis_credit.par_30_pct} % · remb. ${ra.kpis_credit.taux_remboursement_pct} %`)
      bullets.push(`${ra.kpis_credit.dossiers_en_retard} dossiers en retard`)
      break
    }
    case 'GESTIONNAIRE_PORTEFEUILLE':
      bullets.push(`PAR perso ${MOCK_GESTIONNAIRE.kpis.par_perso} % · recouv. ${MOCK_GESTIONNAIRE.kpis.taux_recouvrement} %`)
      bullets.push(`Collecte ${MOCK_GESTIONNAIRE.kpis.collecte_objectif_pct} % objectif`)
      break
    case 'COMMERCIAL': {
      const k = MOCK_COMMERCIAL.kpis
      const pct = Math.round((k.collecte_aujourd_hui / k.collecte_objectif_jour) * 100)
      bullets.push(`Collecte jour ${pct} %`)
      bullets.push(`Conversion ${Math.round(k.taux_conversion * 100)} %`)
      break
    }
    case 'CREDIT':
    case 'RISQUE':
    case 'RESPONSABLE_CREDIT':
      bullets.push(`PAR 30 ${MOCK_CREDIT_RISQUE.kpis.par_30j} % · PAR 90 ${MOCK_CREDIT_RISQUE.kpis.par_90j} %`)
      bullets.push(`${MOCK_CREDIT_RISQUE.kpis.signaux_faibles} alertes CBI actives`)
      break
    case 'RELANCE':
    case 'COMPTABLE':
    case 'PAIE':
      bullets.push(`Recouv. ${MOCK_FINANCES.kpis.par_recouvrement} % · ${MOCK_FINANCES.kpis.relances_actives_aujourd_hui} relances jour`)
      action = '→ Traiter les 5 MoMo en attente avant 17 h.'
      break
    case 'COMMUNICATION':
      bullets.push(`Leads ${MOCK_MARKETING.kpis.leads_mois} · conv. ${MOCK_MARKETING.kpis.taux_conversion} %`)
      break
    case 'DAF':
      return answerDafRisqueFinancier(ctx)
    default:
      bullets.push(`PAR réseau ${m.par_30} % · encours ${fmtFcfa(m.encours_fcfa)} FCFA`)
  }

  return briefLines(`${ctx.prenom} — indicateurs (${ROLE_LABELS[ctx.role]}) :`, bullets, action)
}

function answerSyntheseRole(ctx: CopilotContext): string {
  const bullets: string[] = []
  let action: string | undefined

  switch (ctx.role) {
    case 'MANAGER':
      MOCK_MANAGER.alertes_direction.slice(0, BRIEF_MAX).forEach(a => {
        bullets.push(`${a.zone ?? 'Réseau'} : ${truncate(a.action, 70)}`)
      })
      action = '→ Valider plan Bè Kpota + leads WA > 24 h.'
      break
    case 'GESTIONNAIRE':
      getRaHubData()
        .mauvais_payeurs.slice(0, BRIEF_MAX)
        .forEach((c: { client: string; retard_jours: number }) => {
          bullets.push(`${c.client} J+${c.retard_jours}`)
        })
      action = '→ Visites impayés prioritaires ce matin.'
      break
    case 'GESTIONNAIRE_PORTEFEUILLE':
      MOCK_GESTIONNAIRE.alertes_urgentes.slice(0, BRIEF_MAX).forEach(a => {
        bullets.push(`${shortClientName(a.nom)} (${a.severity}) : ${truncate(a.action, 60)}`)
      })
      action = '→ Kwami Ekpé et Enyonam Kpade en premier.'
      break
    case 'COMMERCIAL': {
      const tour = MOCK_COMMERCIAL.plan_tournee.find(p => p.statut === 'EN_COURS')
      bullets.push(`Défis : ${MOCK_COMMERCIAL.defis_actifs.map(d => d.titre).join(', ')}`)
      if (tour) bullets.push(`Tournée : ${tour.zone}`)
      break
    }
    case 'RESPONSABLE_COMMERCIAL':
      return briefLines(
        `${ctx.prenom} — réseau commercial :`,
        [truncate(getRccHubData().rapport.synthese_executive, 200)],
        '→ Renfort Adakpamé + relance prospects > 3 j.',
      )
    case 'CREDIT':
      MOCK_CREDIT_RISQUE.dossiers_requierent_action.slice(0, BRIEF_MAX).forEach(d => {
        bullets.push(`${d.nom} · ${d.stage}`)
      })
      action = '→ 3 dossiers > 24 h à traiter.'
      break
    case 'RESPONSABLE_CREDIT':
      REGISTRE_DOSSIERS_BLOQUES.slice(0, BRIEF_MAX).forEach(d => {
        bullets.push(`${d.id} · ${truncate(d.raison, 50)} (${d.bloque_depuis_h}h)`)
      })
      action = '→ Valider ROC sous 48 h.'
      break
    case 'DAF':
      return answerDafSynthese(ctx)
    default:
      bullets.push('Consultez objectifs et clients prioritaires au tableau de bord.')
  }

  return briefLines(`${ctx.prenom} — priorités du jour :`, bullets, action)
}

function pickPrimaryEntity(entities: ResolvedEntity[], intent: Intent): ResolvedEntity | undefined {
  if (!entities.length) return undefined
  if (intent === 'dossier') {
    return entities.find(e => e.kind === 'dossier' || e.kind === 'dossier_bloque') ?? entities[0]
  }
  if (intent === 'client' || intent === 'retard_raison') {
    return entities.find(e => e.kind === 'client') ?? entities[0]
  }
  return entities[0]
}

/** Point d'entrée unique — question libre ou suggestion (questionId) */
export function answerCopilotQuestion(
  question: string,
  ctx: CopilotContext,
  questionId?: string,
): string {
  const trimmed = question.trim()
  if (!trimmed && !questionId) {
    return 'Client, dossier, retard, objectifs, PAR ou agence — posez une question précise.'
  }

  const intent = detectIntent(trimmed || 'suggestion', questionId)
  const entities = resolveEntitiesFromQuestion(trimmed)
  const primary = pickPrimaryEntity(entities, intent)

  switch (intent) {
    case 'objectifs':
      return answerObjectifs(ctx)
    case 'retard_raison':
      return answerRetardForRole(ctx, primary)
    case 'client':
      return answerClient(ctx, primary)
    case 'dossier':
      return answerDossier(ctx, primary)
    case 'agent_commercial':
      return answerAgentCommercial(ctx, trimmed)
    case 'par_agence_compare':
      return answerParAgenceCompare(ctx, trimmed)
    case 'par_evolution_reseau':
      return answerParEvolutionReseau(ctx)
    case 'agences_alerte':
      return answerAgencesAlerte(ctx)
    case 'tresorerie':
      return answerTresorerie(ctx)
    case 'actions_semaine':
      return answerActionsSemaine(ctx)
    case 'priorites_jour':
      return answerPrioritesJour(ctx)
    case 'ra_par_payeurs':
      return answerRaParEtPayeurs(ctx)
    case 'daf_compta':
      return answerDafCompta(ctx)
    case 'daf_treso':
      return answerDafTreso(ctx)
    case 'daf_bceao':
      return answerDafBceao(ctx)
    case 'daf_provisions':
      return answerDafProvisions(ctx)
    case 'daf_cash_7j':
      return answerDafCash7j(ctx)
    case 'daf_risque_financier':
      return answerDafRisqueFinancier(ctx)
    case 'par_collecte':
      return isParAgenceCompareQuestion(normalizeText(trimmed))
        ? answerParAgenceCompare(ctx, trimmed)
        : answerParCollecte(ctx)
    case 'synthese_role':
      return answerSyntheseRole(ctx)
    default:
      if (primary) {
        if (primary.kind === 'dossier' || primary.kind === 'dossier_bloque') return answerDossier(ctx, primary)
        if (primary.kind === 'client') {
          if (/retard|pourquoi|raison|motif/.test(normalizeText(trimmed))) {
            return answerRetardForRole(ctx, primary)
          }
          return answerClient(ctx, primary)
        }
      }
      if (/objectif|rempli|atteint/.test(normalizeText(trimmed))) return answerObjectifs(ctx)
      if (isParAgenceCompareQuestion(normalizeText(trimmed))) return answerParAgenceCompare(ctx, trimmed)
      if (ctx.role === 'DAF') return answerDafSynthese(ctx)
      return answerSyntheseRole(ctx)
  }
}
