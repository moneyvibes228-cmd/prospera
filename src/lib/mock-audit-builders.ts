/**
 * Builders audit — source de vérité unique pour MOCK_AUDIT_HOME, RAPPORT_IA_AUDITEUR
 * et métadonnées dérivées (KPIs, narratifs, radar agences).
 */
import { AGENCES } from './agences'
import { DOSSIERS_CREDIT_STATS } from './credit-dossiers-stats'
import type { RapportIA } from '@/types/rapport-ia'
import { buildConformiteBceao, CONFORMITE_BCEAO_SCORE } from './mock-conformite-bceao-builder'
import { buildExpectedLossPortefeuille } from './portefeuille-reseau'
import { getMoisCourant, variationMoM } from './mock-time-series'
import {
  buildAlertesCbi9Codes,
  buildAnomaliesAudit,
  buildAnomaliesAuditStats,
  buildAnomaliesDgStats,
  buildAnomaliesJour,
  buildAuditKpisControle,
  buildTransactionsSuspectesStats,
  REGISTRE_DEPASSEMENTS_PLAFOND,
  REGISTRE_DOSSIERS_INCOMPLETS_AUDIT,
  REGISTRE_ECARTS_CAISSE,
  REGISTRE_MODIFICATIONS_SENSIBLES,
  REGISTRE_OPS_HORS_HORAIRES,
  REGISTRE_TENTATIVES_FRAUDE,
  type AnomalieAudit,
} from './mock-controle-interne-registry'
import { REGISTRE_DOSSIERS_BLOQUES } from './mock-risque-registry'

const CONFORMITE_GPS_PCT = 94
const JOURS_RAPPORT_BCEAO = 8

export interface AuditContext {
  ano: ReturnType<typeof buildAnomaliesAuditStats>
  dg: ReturnType<typeof buildAnomaliesDgStats>
  ctrl: ReturnType<typeof buildAuditKpisControle>
  cbi: ReturnType<typeof buildAlertesCbiTotals>
  tx: ReturnType<typeof buildTransactionsSuspectesStats>
  anomalies: AnomalieAudit[]
  ecartsCaisse: typeof REGISTRE_ECARTS_CAISSE
  opsHorsHoraires: typeof REGISTRE_OPS_HORS_HORAIRES
  dossiersIncomplets: typeof REGISTRE_DOSSIERS_INCOMPLETS_AUDIT
  dossiersIncompletsTotal: number
  violationsProcedures: number
  agenceCounts: Record<string, number>
  agencesCritiques: number
  depotPreRdvMontant: number
  modsKpade: number
}

export function buildAlertesCbiTotals(dossierCounts: Record<string, number> = {}) {
  const codes = buildAlertesCbi9Codes(dossierCounts)
  const total_actifs = codes.reduce((s, c) => s + c.count_actifs, 0)
  const total_critiques = codes
    .filter(c => c.severite === 'CRITICAL')
    .reduce((s, c) => s + c.count_actifs, 0)
  const byCode = Object.fromEntries(codes.map(c => [c.code, c.count_actifs])) as Record<string, number>
  return { total_actifs, total_critiques, byCode, codes }
}

export function buildAlertesCbiLabels(dossierCounts: Record<string, number> = {}) {
  return Object.fromEntries(
    buildAlertesCbi9Codes(dossierCounts).map(c => [
      c.code,
      { label: c.label, description: c.description, severite_defaut: c.severite },
    ]),
  ) as Record<string, { label: string; description: string; severite_defaut: 'INFO' | 'WARN' | 'CRITICAL' }>
}

function countAnomaliesByAgence(anomalies: AnomalieAudit[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const a of anomalies) {
    if (a.agence === 'Multi' || a.agence === 'Réseau' || a.agence === 'Siège') continue
    counts[a.agence] = (counts[a.agence] ?? 0) + 1
  }
  return counts
}

function buildDossiersIncompletsTotal(): number {
  const bloquesDocs = REGISTRE_DOSSIERS_BLOQUES.filter(
    d => d.statut_workflow === 'DOCS_INCOMPLETS' || d.etape.toLowerCase().includes('pièces'),
  ).length
  const plafondsEnRevue = REGISTRE_DEPASSEMENTS_PLAFOND.filter(p => p.statut === 'EN_REVUE').length
  return REGISTRE_DOSSIERS_INCOMPLETS_AUDIT.length + bloquesDocs + plafondsEnRevue
}

function buildViolationsProcedures(): number {
  const mods = REGISTRE_MODIFICATIONS_SENSIBLES.filter(m => !m.justifie).length
  const fraudesActives = REGISTRE_TENTATIVES_FRAUDE.reduce(
    (s, t) => s + Math.max(0, t.count - t.neutralisees),
    0,
  )
  return mods + fraudesActives
}

export function buildAuditContext(): AuditContext {
  const anomalies = buildAnomaliesAudit()
  const ano = buildAnomaliesAuditStats()
  const agenceCounts = countAnomaliesByAgence(anomalies)
  const agencesCritiques = Object.entries(agenceCounts).filter(([, n]) => n >= 3).length
    + (agenceCounts['Kara'] ? 1 : 0)

  const depotPreRdv = anomalies.find(a => a.id === 'AN-003')

  return {
    ano,
    dg: buildAnomaliesDgStats(),
    ctrl: buildAuditKpisControle(),
    cbi: buildAlertesCbiTotals(),
    tx: buildTransactionsSuspectesStats(),
    anomalies,
    ecartsCaisse: REGISTRE_ECARTS_CAISSE,
    opsHorsHoraires: REGISTRE_OPS_HORS_HORAIRES,
    dossiersIncomplets: REGISTRE_DOSSIERS_INCOMPLETS_AUDIT,
    dossiersIncompletsTotal: buildDossiersIncompletsTotal(),
    violationsProcedures: buildViolationsProcedures(),
    agenceCounts,
    agencesCritiques,
    depotPreRdvMontant: depotPreRdv?.montant ?? 2_400_000,
    modsKpade: REGISTRE_OPS_HORS_HORAIRES.filter(o => o.user === 'kpade.j').length,
  }
}

function fmtMontant(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M FCFA`
  if (n >= 1_000) return `${Math.round(n / 1_000)} k FCFA`
  return `${n} FCFA`
}

export function buildAuditSyntheseIntro(ctx: AuditContext): string {
  return `Bonjour Séna. ${ctx.ano.actives} anomalies actives ce matin dont ${ctx.ano.critiques} critiques. Un schéma de décaissements répétitifs a été détecté à l'agence d'Hédzranawoé. ${ctx.ecartsCaisse.length} écarts de caisse non résolus depuis 48h. Priorité : auditer les ${ctx.opsHorsHoraires.length} opérations hors-horaires enregistrées hier soir.`
}

export function buildAuditSynthesePoints(ctx: AuditContext) {
  const an003 = ctx.anomalies.find(a => a.id === 'AN-003')
  const an004 = ctx.anomalies.find(a => a.id === 'AN-004')
  return [
    {
      tone: 'critique' as const,
      texte: `Schéma anormal : décaissements liés vers comptes connexes (Hédzranawoé) — montant total ${fmtMontant(ctx.depotPreRdvMontant)} en 48h.`,
      action: 'Geler les comptes concernés et ouvrir investigation immédiate',
    },
    {
      tone: 'critique' as const,
      texte: `Utilisateur kpade.j a effectué ${ctx.modsKpade} modifications manuelles de montants entre 22h et 23h30 — hors horaires système.`,
      action: 'Suspendre accès temporairement et auditer toutes les modifications',
    },
    {
      tone: 'negatif' as const,
      texte: an004?.detail ?? 'Agence Kara : hausse anormale des annulations cette semaine.',
      action: "Mission d'audit surprise sur site Kara dès cette semaine",
    },
    {
      tone: 'negatif' as const,
      texte: `${ctx.ecartsCaisse.map(e => `${e.agence.split(' ')[0]} ${e.type === 'EXCEDENT' ? '+' : '-'}${Math.round(e.montant / 1000)} k`).join(' et ')} — ${ctx.ecartsCaisse.length} écarts de caisse critiques non résolus.`,
      action: 'Rapprochement de caisse obligatoire avant 12h',
    },
    {
      tone: 'attention' as const,
      texte: an003?.detail ?? 'Pattern dépôts pré-RDV suspects détecté.',
      action: 'Signaler au ROC pour réallocation — rapport BCEAO à mettre à jour',
    },
    {
      tone: 'attention' as const,
      texte: `Dossier crédit validé sans garanties documentées (${fmtMontant(ctx.dossiersIncomplets[0]?.montant ?? 850_000)}). Agent : ${ctx.dossiersIncomplets[0]?.agent ?? 'Komi Atsu'}.`,
      action: 'Bloquer le décaissement et exiger pièce justificative',
    },
    {
      tone: 'positif' as const,
      texte: `Conformité GPS en hausse à ${CONFORMITE_GPS_PCT}% (+3pts) — les visites terrain sont mieux documentées depuis la nouvelle procédure.`,
    },
    {
      tone: 'info' as const,
      texte: `Prochain rapport BCEAO dans ${JOURS_RAPPORT_BCEAO} jours — 3 indicateurs à mettre à jour (classification risque, provisions, PAR 90).`,
    },
  ]
}

export function buildAuditPriorites(ctx: AuditContext): string[] {
  return [
    `URGENT : Geler et investiguer décaissements liés Hédzranawoé (${fmtMontant(ctx.depotPreRdvMontant)}, schéma fraude potentielle)`,
    `URGENT : Auditer modifications manuelles hors-horaires utilisateur kpade.j (22h-23h30)`,
    'AUDIT TERRAIN : Mission surprise Agence Kara (hausse annulations)',
    `CAISSE : Forcer rapprochement ${ctx.ecartsCaisse.map(e => e.agence.split(' ')[0]).join(' + ')} avant 12h`,
    `CONFORMITE : Bloquer dossiers sans garanties + rapport BCEAO dans ${JOURS_RAPPORT_BCEAO}j`,
  ]
}

export function buildAuditKpisHome(ctx: AuditContext) {
  return {
    anomalies_actives: ctx.ano.actives,
    anomalies_critiques: ctx.ano.critiques,
    transactions_suspectes: ctx.ctrl.transactions_suspectes,
    ecarts_caisse: ctx.ecartsCaisse.length,
    dossiers_incomplets: ctx.dossiersIncompletsTotal,
    alertes_fraude: ctx.ctrl.alertes_fraude,
    violations_procedures: ctx.violationsProcedures,
    modifications_manuelles: ctx.ctrl.modifications_manuelles,
    ops_hors_horaires: ctx.opsHorsHoraires.length,
    comptes_dormants_suspects: ctx.ctrl.comptes_dormants_suspects,
    niveau_risque_global: (ctx.ano.critiques >= 4 ? 'CRITIQUE' : ctx.ano.critiques >= 3 ? 'ELEVE' : 'MODERE') as 'CRITIQUE' | 'ELEVE' | 'MODERE',
    conformite_pct: CONFORMITE_GPS_PCT,
  }
}

/** Métadonnées statiques par agence (conformité, incidents) — anomalies dérivées du registre */
const AUDIT_AGENCE_META: Record<string, {
  risque: 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE'
  conformite_pct: number
  incidents_mois: number
  statut_audit: 'OK' | 'SURVEILLE' | 'ALERTE' | 'CRITIQUE'
}> = {
  'Lomé Centre': { risque: 'MODERE', conformite_pct: 96, incidents_mois: 3, statut_audit: 'OK' },
  'Adidogomé': { risque: 'MODERE', conformite_pct: 91, incidents_mois: 4, statut_audit: 'SURVEILLE' },
  'Bè Kpota': { risque: 'ELEVE', conformite_pct: 82, incidents_mois: 8, statut_audit: 'ALERTE' },
  'Hédzranawoé': { risque: 'CRITIQUE', conformite_pct: 74, incidents_mois: 12, statut_audit: 'CRITIQUE' },
  'Kpalimé': { risque: 'FAIBLE', conformite_pct: 98, incidents_mois: 1, statut_audit: 'OK' },
  'Kara': { risque: 'CRITIQUE', conformite_pct: 71, incidents_mois: 34, statut_audit: 'CRITIQUE' },
}

function statutFromCount(n: number): 'OK' | 'SURVEILLE' | 'ALERTE' | 'CRITIQUE' {
  if (n >= 5) return 'CRITIQUE'
  if (n >= 3) return 'ALERTE'
  if (n >= 1) return 'SURVEILLE'
  return 'OK'
}

export function buildAuditAgencesRadar(ctx: AuditContext) {
  const rows = AGENCES.map(a => {
    const meta = AUDIT_AGENCE_META[a.nom_court]
    const anomalies = ctx.agenceCounts[a.nom_court] ?? 0
    return {
      agence: a.nom_court,
      anomalies,
      risque: meta?.risque ?? statutFromCount(anomalies),
      conformite_pct: meta?.conformite_pct ?? 90,
      incidents_mois: meta?.incidents_mois ?? anomalies,
      statut_audit: anomalies >= 5 ? 'CRITIQUE' as const : (meta?.statut_audit ?? statutFromCount(anomalies)),
    }
  })

  const karaMeta = AUDIT_AGENCE_META['Kara']
  rows.push({
    agence: 'Kara',
    anomalies: ctx.agenceCounts['Kara'] ?? 1,
    risque: karaMeta.risque,
    conformite_pct: karaMeta.conformite_pct,
    incidents_mois: karaMeta.incidents_mois,
    statut_audit: karaMeta.statut_audit,
  })

  return rows
}

export function buildRapportIAAuditeur(): RapportIA {
  const ctx = buildAuditContext()
  const beKpota = AGENCES.find(a => a.id === 'AG-003')
  const parBeKpota = beKpota?.par_courant ?? 11.2
  const depotsPreRdv = ctx.cbi.byCode.DEPOT_PRE_RDV_SUSPECT ?? 3

  const agencesRadar = buildAuditAgencesRadar(ctx)
  const agencesCritiques = agencesRadar.filter(a => a.statut_audit === 'CRITIQUE').map(a => a.agence)

  return {
    date_generation: '27/05/2026 à 06:45',
    periode: 'Mai 2026 — Fraude, contrôle crédit, caisse & conformité BCEAO',
    destinataire: 'Auditeur Interne',
    synthese_executive:
      `Séna, la matinée ouvre sur un profil de risque ÉLEVÉ : ${ctx.ano.actives} anomalies actives dont ${ctx.ano.critiques} critiques, concentrées sur ${agencesCritiques.slice(0, 2).join(' et ') || 'Hédzranawoé'}. Un schéma de décaissements liés (${fmtMontant(ctx.depotPreRdvMontant)} en 48 h) et des modifications manuelles hors-horaires (kpade.j, ${ctx.modsKpade} ops) constituent les deux priorités absolues — ce ne sont pas des écarts de procédure, ce sont des signaux de fraude potentielle. Côté réglementaire, le score BCEAO est à ${CONFORMITE_BCEAO_SCORE}/100 avec 3 ratios non conformes (transformation 71 %, provisions 78 %, concentration 37 %) et le rapport mensuel dans ${JOURS_RAPPORT_BCEAO} jours. La bonne nouvelle : conformité GPS à ${CONFORMITE_GPS_PCT} % (+3 pts) et audit trail complet sur ${ctx.tx.total + 1235} transactions analysées. Votre semaine se joue sur trois leviers : geler les flux suspects, finaliser le rapport BCEAO, et mission surprise Kara.`,
    synthese_piliers: [
      {
        titre: 'Fraude & anomalies opérationnelles',
        contenu:
          `${ctx.ano.critiques} anomalies critiques convergent vers un même profil : décaissements répétitifs vers comptes connexes à Hédzranawoé (AN-003, ${fmtMontant(ctx.depotPreRdvMontant)}), double décaissement DC-2801 (AN-001), et modifications manuelles de montants par kpade.j hors plage horaire autorisée. L'IA comportementale signale aussi admin.backup depuis une IP étrangère (03h22). Pattern classique : volume anormal + absence de supervision + accès étendu. Recommandation : gel immédiat des comptes concernés, suspension temporaire kpade.j, et audit croisé logs SI / relevés MoMo avant toute nouvelle opération à Hédzranawoé.`,
      },
      {
        titre: 'Contrôle crédit & intégrité dossiers',
        contenu:
          `${ctx.dossiersIncompletsTotal} dossiers incomplets ou non conformes dont DC-2847 (${fmtMontant(ctx.dossiersIncomplets[0]?.montant ?? 850_000)} sans garanties — Komi Atsu). Deux agents dépassent le seuil BCEAO de concentration (Koku Ablam 37 %, Mawu Lawson 28 %). Une validation irrégulière détectée : dossier DC-2788 validé par l'agent instructeur lui-même. Double financement client Kofi Amavi (AG-001 + AG-003 sans CBI). Ces écarts ne sont pas isolés — ils indiquent un relâchement des contrôles à Lomé Centre et Adidogomé. Bloquer les décaissements sur dossiers sans pièces avant clôture mensuelle.`,
      },
      {
        titre: 'Caisse, comptabilité & traçabilité',
        contenu:
          `${ctx.ecartsCaisse.length} écarts de caisse non résolus depuis 48 h : Bè Kpota (+148 k excédent) et Hédzranawoé (-220 k déficit). Suspens 471 à 820 k FCFA depuis 62 jours — impact direct sur le rapport BCEAO. ${ctx.ctrl.modifications_manuelles} écritures modifiées ce mois dont un ajustement 512 à 450 k sans justificatif (kpade.j, 22h47). Le journal d'audit est complet mais ${ctx.ano.actives} entrées flaggées anomalie dont connexion IP non répertoriée. Rapprochement obligatoire avant clôture dans ${JOURS_RAPPORT_BCEAO} jours.`,
      },
      {
        titre: 'Conformité BCEAO & reporting réglementaire',
        contenu:
          `Score global ${CONFORMITE_BCEAO_SCORE}/100 — niveau ATTENTION. Ratios critiques : transformation 71 % (seuil 80 %), couverture provisions 78 % (écart 1,18 M FCFA), concentration top-2 à 37 % (seuil 25 %). PAR Bè Kpota à ${parBeKpota} % hors norme — plan de redressement requis avant 31/07. Rapport mensuel BCEAO dans ${JOURS_RAPPORT_BCEAO} jours : 4 indicateurs à mettre à jour. Historique en amélioration (+5 pts sur 5 mois) mais la marge réglementaire reste étroite sur solvabilité (8,4 % vs 8 % minimum).`,
      },
      {
        titre: 'Audit agences & posture réseau',
        contenu:
          `${agencesCritiques.join(' et ')} en statut CRITIQUE (${agencesRadar.filter(a => a.statut_audit === 'CRITIQUE').map(a => `${a.anomalies} anomalies`).join(', ')}). Bè Kpota en ALERTE (${ctx.agenceCounts['Bè Kpota'] ?? 0} anomalies, 82 % conformité). Kpalimé reste la référence (98 %, ${ctx.agenceCounts['Kpalimé'] ?? 0} anomalie). Mission surprise Kara justifiée par hausse annulations. Radar conformité réseau : polarisation des risques sur ${agencesCritiques.length} sites — concentration géographique à traiter avant qu'elle ne contamine le score consolidé.`,
      },
    ],
    synthese_agences: agencesRadar.map(a => ({
      agence_id: a.agence,
      nom: a.agence,
      statut_bceao: a.conformite_pct >= 95 ? 'CONFORME' as const : a.conformite_pct >= 80 ? 'ATTENTION' as const : 'NON_CONFORME' as const,
      score_sante: a.conformite_pct - 10,
      tendance: a.statut_audit === 'CRITIQUE' ? 'ALERTE' as const : a.statut_audit === 'OK' ? 'STABLE' as const : 'ALERTE' as const,
      resume: `${a.anomalies} anomalie${a.anomalies > 1 ? 's' : ''} · conformité ${a.conformite_pct} % · statut ${a.statut_audit}.`,
    })),
    chiffres_cles: [
      { label: 'Anomalies actives', valeur: String(ctx.ano.actives), tendance: 'HAUSSE', commentaire: `${ctx.ano.critiques} critiques` },
      { label: 'Conformité GPS', valeur: `${CONFORMITE_GPS_PCT}%`, tendance: 'HAUSSE', commentaire: '+3 pts M-1' },
      { label: 'Score BCEAO', valeur: `${CONFORMITE_BCEAO_SCORE}/100`, tendance: 'HAUSSE', commentaire: 'Niveau ATTENTION' },
      { label: 'Transactions auditées', valeur: String(ctx.tx.total + 1235), tendance: 'HAUSSE', commentaire: `${ctx.tx.en_investigation} suspectes` },
      { label: 'Écarts caisse', valeur: String(ctx.ecartsCaisse.length), tendance: 'STABLE', commentaire: 'Non résolus 48h' },
      { label: 'Ops hors-horaires', valeur: String(ctx.opsHorsHoraires.length), tendance: 'HAUSSE', commentaire: `kpade.j ×${ctx.modsKpade}` },
      { label: 'Rapport BCEAO', valeur: `J-${JOURS_RAPPORT_BCEAO}`, tendance: 'STABLE', commentaire: '4 ratios NC' },
      { label: 'Risque global', valeur: 'ÉLEVÉ', tendance: 'HAUSSE', commentaire: `${agencesCritiques.length} agences CRITIQUE` },
    ],
    points_forts: [
      `Conformité GPS au plus haut : ${CONFORMITE_GPS_PCT}% (objectif 90%)`,
      'Audit trail 100% complet — aucune action non tracée',
      `Détection IA précoce : ${ctx.dg.total} signaux DG repérés`,
      'Aucune fraude majeure non détectée — système IA performant',
      `${ctx.tx.total} transactions suspectes identifiées — ${ctx.tx.en_investigation} en investigation`,
    ],
    points_attention: buildAnomaliesJour()
      .filter(a => a.severite === 'CRITIQUE' || a.severite === 'HAUTE')
      .slice(0, 5)
      .map(a => ({
        titre: a.titre,
        detail: a.detail,
        severite: a.severite === 'CRITIQUE' ? 'CRITIQUE' as const : a.severite === 'HAUTE' ? 'HAUTE' as const : 'MODEREE' as const,
      })),
    recommandations: [
      { priorite: 1, action: 'Audit terrain indépendant Kossi Adjavon (GP Bè Kpota) cette semaine — GPS suspect', impact_estime: 'Évite perte 2-3M FCFA', delai: 'Cette semaine' },
      { priorite: 1, action: `Investiguer les ${depotsPreRdv} cas de dépôt pré-RDV suspect (croiser avec docs)`, impact_estime: 'Bloque fraude crédit', delai: '48h' },
      { priorite: 1, action: 'Finaliser rapport BCEAO avant 31/05 (échéance critique)', impact_estime: 'Conformité légale', delai: 'Avant 31/05' },
      { priorite: 2, action: 'Renforcer audit trail Bè Kpota (re-tester app sur site)', impact_estime: 'Conformité +100%', delai: 'Sem. prochaine' },
      { priorite: 3, action: 'Mettre en place audit aléatoire mensuel sur 5% des transactions', impact_estime: 'Dissuasion fraude', delai: 'Juin 2026' },
    ],
    previsions_30j: [
      { metrique: 'Conformité GPS', valeur_actuelle: `${CONFORMITE_GPS_PCT}%`, valeur_prevue: '96%', confidence: 84 },
      { metrique: 'Anomalies actives', valeur_actuelle: String(ctx.ano.actives), valeur_prevue: String(Math.max(1, ctx.ano.actives - 2)), confidence: 79 },
      { metrique: 'Score conformité', valeur_actuelle: '87', valeur_prevue: '91', confidence: 81 },
    ],
    alertes_immediates: [
      `🚨 Schéma décaissements liés Hédzranawoé — ${fmtMontant(ctx.depotPreRdvMontant)} · geler et investiguer`,
      `🚨 kpade.j — ${ctx.modsKpade} modifications hors-horaires (22h–00h) · suspendre accès`,
      `🚨 Rapport BCEAO J-${JOURS_RAPPORT_BCEAO} — 3 ratios non conformes à régulariser`,
      '⚠ Kara — hausse annulations · audit surprise cette semaine',
      `⚠ ${ctx.ecartsCaisse.length} écarts caisse non résolus (Bè +148k · Hédzranawoé -220k)`,
    ],
    comparaison_mois_precedent: [
      { metrique: 'Conformité GPS', mois_precedent: '92%', mois_courant: `${CONFORMITE_GPS_PCT}%`, variation_pct: 2.2 },
      { metrique: 'Anomalies', mois_precedent: String(ctx.ano.actives + 5), mois_courant: String(ctx.ano.actives), variation_pct: -41.7 },
      { metrique: 'Trans. suspectes', mois_precedent: '18', mois_courant: String(ctx.tx.total), variation_pct: -33.3 },
      { metrique: 'Score conformité', mois_precedent: '82', mois_courant: '87', variation_pct: 6.1 },
    ],
    signature_ia: 'Prospera AI v2.4 · Audit & Conformité · Détection fraude par IA',
  }
}

export function buildAuditDetailPagesMeta(ctx: AuditContext) {
  const agencesCrit = buildAuditAgencesRadar(ctx).filter(a => a.statut_audit === 'CRITIQUE').length
  const tracabiliteAnomalies = 5
  return [
    {
      href: '/audit/anomalies',
      label: 'Fraude & Anomalies',
      desc: `${ctx.ano.actives} anomalies · détection IA temps réel · ops hors-horaires`,
      badge: `${ctx.ano.critiques} critiques`,
      badgeStyle: 'bg-red-100 text-red-800 border-red-200',
    },
    {
      href: '/audit/credit',
      label: 'Contrôle crédit',
      desc: 'Dossiers incomplets · concentration BCEAO · validations irrégulières',
      badge: `${ctx.dossiersIncompletsTotal} dossiers`,
      badgeStyle: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      href: '/audit/agences',
      label: 'Audit agences',
      desc: 'Score conformité par site · radar réseau · statuts CRITIQUE',
      badge: `${agencesCrit} agences CRIT.`,
      badgeStyle: 'bg-red-100 text-red-800 border-red-200',
    },
    {
      href: '/audit/caisse',
      label: 'Caisse & Compta',
      desc: 'Écarts caisse · suspens · ajustements sans justificatif',
      badge: `${ctx.ecartsCaisse.length} écarts`,
      badgeStyle: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      href: '/audit/tracabilite',
      label: 'Traçabilité',
      desc: 'Journal infalsifiable · qui / quoi / quand / IP',
      badge: `${tracabiliteAnomalies} anomalies log`,
      badgeStyle: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      href: '/audit/bceao',
      label: 'Conformité BCEAO',
      desc: `Ratios réglementaires · CBI · rapport J-${JOURS_RAPPORT_BCEAO}`,
      badge: `${CONFORMITE_BCEAO_SCORE}/100`,
      badgeStyle: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
  ]
}

export function buildRapportIACreditRisque(): RapportIA {
  const stats = DOSSIERS_CREDIT_STATS
  const cbi = buildAlertesCbiTotals()
  const b = cbi.byCode
  const conformite = buildConformiteBceao()
  const m = getMoisCourant()
  const el = buildExpectedLossPortefeuille()
  const elFmt = `${(el.el_total / 1_000_000).toFixed(2).replace('.', ',')}M FCFA`
  const elPrev = getMoisCourant().el_fcfa * 1.034
  const scoreXgboost = Math.round(100 - m.par_30 * 4)
  const tauxEffort = b.TAUX_EFFORT_EXCESSIF ?? 7
  const depotPreRdv = b.DEPOT_PRE_RDV_SUSPECT ?? 3
  const endettement = b.ENDETTEMENT_ELEVE ?? 14
  const cautions = b.CAUTIONS_INSUFFISANTES ?? 11
  const benchmark = b.ECHANTILLON_BENCHMARK_FAIBLE ?? 9
  const rocAttente = REGISTRE_DOSSIERS_BLOQUES.filter(
    d => d.statut_workflow.includes('ROC') || d.statut_workflow === 'EN_ATTENTE_DEC',
  ).length

  return {
    date_generation: '21/05/2026 à 06:00',
    periode: 'Mai 2026 — Pipeline crédit & analyse risque',
    destinataire: 'Chargé de Crédit / Responsable Opérations Crédit',
    synthese_executive:
      `Le pipeline crédit traite actuellement ${stats.total_soumis_mois} dossiers soumis ce mois avec un taux d'approbation de ${stats.taux_approbation_pct}%. Les ${stats.refuses} dossiers rejetés le sont principalement pour insuffisance de revenus (28.6%) et activité non vérifiable (17.5%). Côté risque CBI v5 : ${conformite.pct_performant}% du portefeuille est PERFORMANT, mais ${conformite.pct_douteux}% est en classe DOUTEUX et requiert un suivi rapproché. L'Expected Loss s'élève à ${elFmt}. ${tauxEffort} dossiers présentent un taux d'effort excessif (>33% revenus) et ${depotPreRdv} cas de dépôt pré-RDV suspect ont été détectés. ${rocAttente} dossiers attendent l'avis ROC pour décaissement.`,
    chiffres_cles: [
      { label: 'Dossiers soumis', valeur: String(stats.total_soumis_mois), tendance: 'BAISSE', commentaire: '-4 vs avril' },
      { label: 'Approuvés', valeur: String(stats.approuves), tendance: 'BAISSE', commentaire: `Taux ${stats.taux_approbation_pct}%` },
      { label: 'Refusés', valeur: String(stats.refuses), tendance: 'BAISSE', commentaire: `Taux ${stats.taux_rejet_pct}%` },
      { label: 'En attente ROC', valeur: String(rocAttente), tendance: 'STABLE', commentaire: 'Délai moyen 2j' },
      { label: 'Délai traitement', valeur: `${stats.delai_moyen_traitement_jours} j`, tendance: 'BAISSE', commentaire: `Obj. ${stats.delai_objectif_jours}j` },
      { label: 'Score moyen XGBoost', valeur: `${scoreXgboost}/100`, tendance: 'HAUSSE', commentaire: '+2 pts' },
      { label: 'Expected Loss', valeur: elFmt, tendance: 'BAISSE', commentaire: `${variationMoM('el_fcfa')}%` },
      { label: 'Alertes CBI actives', valeur: String(cbi.total_actifs), tendance: 'BAISSE', commentaire: `${cbi.total_critiques} critiques` },
    ],
    points_forts: [
      `${conformite.classes_cbi.find(c => c.code === 'PERFORMANT')?.count ?? 0} dossiers PERFORMANT (${conformite.pct_performant}%) — portefeuille majoritairement sain`,
      `Taux d'approbation stable à ${stats.taux_approbation_pct}% — discipline d'analyse maintenue`,
      `Délai de traitement en amélioration : ${stats.delai_moyen_traitement_jours}j vs 5.1j en mars`,
      'Aucun dossier en classe PERTE > 400k FCFA',
      `Détection précoce IA : ${buildTransactionsSuspectesStats().total} signaux faibles repérés avant défaut effectif`,
    ],
    points_attention: [
      { titre: `${tauxEffort} dossiers avec taux d'effort excessif`, detail: 'Mensualité > 33% revenus détectée — risque défaut élevé. Restructurer ou rejeter.', severite: 'CRITIQUE' },
      { titre: `${depotPreRdv} cas de dépôt pré-RDV suspect`, detail: 'Solde gonflé 24-72h avant analyse — probable manipulation. Investigation obligatoire.', severite: 'CRITIQUE' },
      { titre: `${endettement} alertes endettement externe élevé`, detail: 'Clients potentiellement déjà endettés ailleurs (autre IMF). Croiser avec base BCEAO.', severite: 'HAUTE' },
      { titre: `${cautions} dossiers avec cautions insuffisantes`, detail: 'Garanties sous seuil CBI v5 — demander cautions complémentaires ou réduire montant.', severite: 'HAUTE' },
      { titre: `${benchmark} dossiers avec échantillon benchmark faible`, detail: 'Pas assez de dossiers comparables pour scoring fiable — analyse humaine approfondie.', severite: 'MODEREE' },
    ],
    recommandations: [
      { priorite: 1, action: `Traiter les ${rocAttente} dossiers en attente ROC (délai > 48h)`, impact_estime: 'Décaissement 2.4M FCFA', delai: 'Aujourd\'hui' },
      { priorite: 1, action: `Investiguer les ${depotPreRdv} cas de dépôt pré-RDV suspect (fraude probable)`, impact_estime: 'Évite perte 1.2M FCFA', delai: '48h' },
      { priorite: 2, action: `Restructurer les ${tauxEffort} dossiers à taux d'effort excessif (étalement durée)`, impact_estime: 'Réduit PAR de 1.8 pts', delai: '1 semaine' },
      { priorite: 2, action: 'Réduire l\'exposition Commerce (37.7% du portefeuille) vers Artisanat/Services', impact_estime: 'Risque -15%', delai: 'Q3 2026' },
      { priorite: 3, action: 'Former équipes sur les 9 codes d\'alerte CBI v5 pour standardiser l\'analyse', impact_estime: 'Cohérence décisionnelle', delai: 'Juin 2026' },
    ],
    previsions_30j: [
      { metrique: 'Nouveaux dossiers', valeur_actuelle: String(stats.total_soumis_mois), valeur_prevue: '72', confidence: 81 },
      { metrique: 'Taux approbation', valeur_actuelle: `${stats.taux_approbation_pct}%`, valeur_prevue: '63.5%', confidence: 76 },
      { metrique: 'Délai traitement', valeur_actuelle: `${stats.delai_moyen_traitement_jours} j`, valeur_prevue: '3.6 j', confidence: 84 },
      { metrique: 'Expected Loss', valeur_actuelle: elFmt, valeur_prevue: `${((el.el_total * 0.92) / 1_000_000).toFixed(2).replace('.', ',')}M`, confidence: 74 },
      { metrique: 'PAR portefeuille', valeur_actuelle: `${m.par_30}%`, valeur_prevue: '7.6%', confidence: 82 },
    ],
    alertes_immediates: [
      `🚨 ${rocAttente} dossiers en attente ROC depuis > 48h (montant cumulé 2.4M FCFA)`,
      `🚨 ${depotPreRdv} dépôts pré-RDV suspects à investiguer (potentielle fraude)`,
      `🚨 ${tauxEffort} dossiers taux d'effort > 33% — à restructurer ou rejeter`,
      `⚠ ${endettement} cas d'endettement externe élevé — vérifier base BCEAO`,
      `⚠ ${cautions} dossiers cautions insuffisantes — demander garanties complémentaires`,
    ],
    comparaison_mois_precedent: [
      { metrique: 'Dossiers soumis', mois_precedent: '71', mois_courant: String(stats.total_soumis_mois), variation_pct: -5.6 },
      { metrique: 'Approuvés', mois_precedent: '44', mois_courant: String(stats.approuves), variation_pct: -6.8 },
      { metrique: 'Refusés', mois_precedent: '16', mois_courant: String(stats.refuses), variation_pct: -12.5 },
      { metrique: 'Délai traitement', mois_precedent: '5.1', mois_courant: String(stats.delai_moyen_traitement_jours), variation_pct: -17.6 },
      { metrique: 'Expected Loss', mois_precedent: `${(elPrev / 1_000_000).toFixed(2).replace('.', ',')}M`, mois_courant: `${(el.el_total / 1_000_000).toFixed(2).replace('.', ',')}M`, variation_pct: variationMoM('el_fcfa') },
    ],
    signature_ia: 'Prospera AI v2.4 · Modèle CBI v5 (Kharoubi & Thomas) · Précision scoring 89.4%',
  }
}

export function buildDetectionComportementale(ctx: AuditContext) {
  const kpadeOps = ctx.opsHorsHoraires.filter(o => o.user === 'kpade.j')
  const adminBackup = ctx.opsHorsHoraires.find(o => o.user === 'admin.backup')
  return {
    activites_inhabituelles: [
      {
        utilisateur: 'kpade.j',
        type: 'HORS_HORAIRES',
        detail: `${kpadeOps.length} opération${kpadeOps.length > 1 ? 's' : ''} entre 22h et 00h — registre ops hors-horaires`,
        risque: 'ELEVE' as const,
      },
      ...(adminBackup ? [{
        utilisateur: 'admin.backup',
        type: 'CONNEXION_IP',
        detail: `IP étrangère ${adminBackup.heure} — compte de sauvegarde`,
        risque: 'CRITIQUE' as const,
      }] : []),
      {
        utilisateur: 'Komi Mensah',
        type: 'VOLUME_ANORMAL',
        detail: `${REGISTRE_DOSSIERS_BLOQUES.length * 4} décaissements en 1 journée (moy. 4/j)`,
        risque: 'ELEVE' as const,
      },
    ],
    pics_transactions: [
      { date: '21/05', heure: '14h-16h', agence: 'Hédzranawoé', volume: Math.round(ctx.tx.total * 3.5), normal: 12, alerte: true },
      { date: '22/05', heure: '18h-20h', agence: 'Kara', volume: 28, normal: 8, alerte: true },
      { date: '23/05', heure: '09h-10h', agence: 'Lomé Centre', volume: 16, normal: 14, alerte: false },
    ],
    ops_hors_horaires: ctx.opsHorsHoraires,
  }
}

export function buildControleCreditAudit(ctx: AuditContext) {
  const sansGaranties = ctx.dossiersIncomplets.filter(
    d => d.probleme.toLowerCase().includes('garant'),
  ).length
  return {
    dossiers_incomplets: ctx.dossiersIncomplets,
    credits_sans_garanties: sansGaranties,
    retards_suspects: [
      { client: 'M. Agbeko Tsatsu', retard_jours: 45, montant: 380_000, note: 'Même adresse que client en contentieux', risque: 'HAUTE' as const },
      { client: 'Mme Kafui Amavi', retard_jours: 32, montant: 210_000, note: 'Historique paiements modifié manuellement', risque: 'CRITIQUE' as const },
    ],
    validation_irreguliere: [
      { dossier: 'DC-2788', valideur: 'Komi Mensah', note: "Validé par l'agent instructeur lui-même (conflit intérêt)", montant: 720_000 },
    ],
    concentration_portefeuille: [
      { agent: 'Koku Ablam', top2_pct: 37, seuil_bceao: 25, statut: 'DEPASSEMENT' as const },
      { agent: 'Sika Dossou', top2_pct: 22, seuil_bceao: 25, statut: 'OK' as const },
      { agent: 'Mawu Lawson', top2_pct: 28, seuil_bceao: 25, statut: 'DEPASSEMENT' as const },
    ],
  }
}

export function buildCaisseComptabiliteAudit(ctx: AuditContext) {
  const modsNonJust = REGISTRE_MODIFICATIONS_SENSIBLES.filter(m => !m.justifie).length
  const kpadeMod = REGISTRE_OPS_HORS_HORAIRES.find(o => o.user === 'kpade.j')
  return {
    ecarts_caisse: ctx.ecartsCaisse,
    transactions_manuelles_mois: modsNonJust + ctx.opsHorsHoraires.length,
    ecritures_modifiees_mois: REGISTRE_MODIFICATIONS_SENSIBLES.length,
    suspens_comptables: [
      { compte: '401-Fournisseurs', solde: 480_000, age_jours: 45, statut: 'ANOMALIE' as const, note: 'Facture en attente validation DG' },
      { compte: '471-Comptes att.', solde: 820_000, age_jours: 62, statut: 'CRITIQUE' as const, note: 'Aucune justification depuis 62 jours' },
      { compte: '165-Depots gar.', solde: 120_000, age_jours: 15, statut: 'A_JUSTIFIER' as const, note: 'En cours de libération client Mensah' },
    ],
    ajustements_inhabituels: [
      ...(kpadeMod ? [{ date: '22/05', compte: '512-Banque', montant: kpadeMod.montant || 450_000, user: 'kpade.j', justif: 'Aucune', heure: kpadeMod.heure }] : []),
      { date: '20/05', compte: '401-Fourn.', montant: 180_000, user: 'compta.bp', justif: 'Régularisation', heure: '16:22' },
    ],
  }
}

export function buildAuditTracabilite(ctx: AuditContext) {
  const fromOps = ctx.opsHorsHoraires.map(o => ({
    heure: `22/05 ${o.heure}`,
    user: o.user,
    action: o.action,
    entite: o.agence === 'Siège' ? 'Système' : 'Crédit',
    poste: o.user === 'admin.backup' ? 'Inconnu' : '?',
    ip: o.user === 'admin.backup' ? '91.23.45.67' : '91.23.45.62',
    anomalie: true,
  }))
  const fromMods = REGISTRE_MODIFICATIONS_SENSIBLES.slice(0, 3).map(m => ({
    heure: m.date.replace(' ', ' '),
    user: m.user.toLowerCase().replace(' ', '.'),
    action: m.action,
    entite: m.action.includes('compt') ? 'Comptabilité' : 'Crédit',
    poste: 'PC-SIG-01',
    ip: '192.168.1.44',
    anomalie: !m.justifie,
  }))
  return [...fromOps, ...fromMods]
}

export function buildAuditAlertesHome(ctx: AuditContext) {
  const an003 = ctx.anomalies.find(a => a.id === 'AN-003')
  const kpadeCount = ctx.modsKpade
  return [
    { severite: 'CRITIQUE' as const, titre: 'Schéma fraude potentielle détecté', detail: an003?.detail ?? `3 décaissements liés Hédzranawoé — ${fmtMontant(ctx.depotPreRdvMontant)}, comptes connexes`, action: 'Geler et investiguer' },
    { severite: 'CRITIQUE' as const, titre: 'Connexion IP étrangère 03h22', detail: 'admin.backup — Allemagne — hors horaires autorisés', action: 'Réinitialiser accès + audit' },
    { severite: 'HAUTE' as const, titre: 'Modifications manuelles hors-horaires', detail: `kpade.j : ${kpadeCount} opération${kpadeCount > 1 ? 's' : ''} entre 22h et 00h`, action: 'Suspendre accès + audit' },
    { severite: 'HAUTE' as const, titre: 'Agence Kara : 180% hausse annulations', detail: '34 annulations vs 12 en temps normal', action: 'Audit surprise sur site' },
    { severite: 'HAUTE' as const, titre: `${ctx.ecartsCaisse.length} écarts caisse non résolus 48h`, detail: ctx.ecartsCaisse.map(e => `${e.agence.split(' ')[0]} ${e.type === 'EXCEDENT' ? '+' : '-'}${Math.round(e.montant / 1000)}k`).join(', '), action: 'Rapprochement avant 12h' },
    { severite: 'HAUTE' as const, titre: 'Double financement client Kofi Amavi', detail: 'Crédit actif AG-001 + demande AG-003 sans CBI', action: 'Bloquer AG-003 + vérification' },
  ]
}
