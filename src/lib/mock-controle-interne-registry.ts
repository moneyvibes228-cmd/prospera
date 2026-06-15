/**
 * Registre unique — contrôle interne, fraude, plafonds, dormants, audit trail.
 * Lié à mock-risque-registry (clients / dossiers).
 */
import { AGENCES, RESEAU_CONSOLIDE } from './agences'
import { buildConcentrationsSuspectes, REGISTRE_CLIENTS_RISQUE, REGISTRE_DOSSIERS_BLOQUES } from './mock-risque-registry'
import { SECTEURS } from './portefeuille-reseau'

/** Aligné sur EPARGNE_STATS.dormants (mockMicrofinance) */
const DORMANTS_TOTAL = 51
const DORMANTS_ENCOURS_TOTAL = 2_340_000

const AGENCE_ALIAS: Record<string, string> = {
  Tabligbo: 'Kpalimé',
  Tsévié: 'Hédzranawoé',
  'Lomé C.': 'Lomé Centre',
}

function resolveAgence(nom: string): string {
  return AGENCE_ALIAS[nom] ?? nom
}

export interface TransactionSuspecteSeed {
  id: string
  date: string
  client: string
  client_id?: string
  dossier_id?: string
  montant: number
  motif: string
  code_alerte?: string
  score_fraude: number
  statut: 'EN_INVESTIGATION' | 'RESOLUE' | 'BLOQUEE'
  agent: string
  agence: string
}

export interface TentativeFraudeSeed {
  type: string
  count: number
  derniere_date: string
  neutralisees: number
}

export interface DepassementPlafondSeed {
  id: string
  client: string
  dossier_id?: string
  montant: number
  plafond: number
  date: string
  statut: 'EN_REVUE' | 'APPROUVE_DEROG' | 'REFUSE'
  agent: string
}

export interface ModificationSensibleSeed {
  date: string
  user: string
  action: string
  client_id?: string
  avant: string
  apres: string
  criticite: 'CRITIQUE' | 'HAUTE' | 'MOYENNE'
  justifie: boolean
}

/** Transactions suspectes — liées aux clients / dossiers du registre risque */
export const REGISTRE_TRANSACTIONS_SUSPECTES: TransactionSuspecteSeed[] = [
  { id: 'TX-S-001', date: '20/05/2026', client: 'Anonyme', montant: 3_400_000, motif: 'Pattern dépôt-retrait rapide', score_fraude: 89, statut: 'EN_INVESTIGATION', agent: 'Edem Kpélim', agence: 'Lomé Centre' },
  { id: 'TX-S-002', date: '20/05/2026', client: 'Togbui Apedo', client_id: 'CL-1003', montant: 1_800_000, motif: 'Dépôt pré-RDV crédit (gonflement)', code_alerte: 'DEPOT_PRE_RDV_SUSPECT', score_fraude: 82, statut: 'EN_INVESTIGATION', agent: 'Edem Kpélim', agence: 'Bè Kpota' },
  { id: 'TX-S-003', date: '19/05/2026', client: 'Mawuena Hotor', client_id: 'CL-1093', montant: 980_000, motif: 'Dépôt pré-RDV crédit (gonflement)', code_alerte: 'DEPOT_PRE_RDV_SUSPECT', score_fraude: 78, statut: 'EN_INVESTIGATION', agent: 'Akua Lawson', agence: 'Adidogomé' },
  { id: 'TX-S-004', date: '19/05/2026', client: 'Coop. Kpalimé Sud', dossier_id: 'DOS-2407', montant: 2_400_000, motif: 'Dépôt pré-RDV crédit (gonflement)', code_alerte: 'DEPOT_PRE_RDV_SUSPECT', score_fraude: 74, statut: 'EN_INVESTIGATION', agent: 'Ama Fiagbé', agence: 'Kpalimé' },
  { id: 'TX-S-005', date: '18/05/2026', client: 'Yao Tetevi', dossier_id: 'DOS-2421', montant: 1_200_000, motif: 'Transactions multiples > seuil', score_fraude: 71, statut: 'RESOLUE', agent: 'Elom Komlavi', agence: 'Hédzranawoé' },
  { id: 'TX-S-006', date: '18/05/2026', client: 'Komi Atsu D.', montant: 850_000, motif: 'Bénéficiaire blacklist', score_fraude: 84, statut: 'BLOQUEE', agent: 'Système', agence: 'Lomé Centre' },
  { id: 'TX-S-007', date: '17/05/2026', client: 'GIE Marché', montant: 1_650_000, motif: 'Géolocalisation incohérente', score_fraude: 68, statut: 'RESOLUE', agent: 'Edem Kpélim', agence: 'Lomé Centre' },
  { id: 'TX-S-008', date: '16/05/2026', client: 'Anonyme', montant: 2_100_000, motif: 'Compte récent + gros montant', score_fraude: 76, statut: 'EN_INVESTIGATION', agent: 'Système', agence: 'Lomé Centre' },
  { id: 'TX-S-009', date: '15/05/2026', client: 'Komlan Attivor', client_id: 'CL-1042', montant: 420_000, motif: 'Retrait massif post-dépôt', score_fraude: 65, statut: 'RESOLUE', agent: 'Kossi Adjavon', agence: 'Bè Kpota' },
  { id: 'TX-S-010', date: '14/05/2026', client: 'Sika Adjovi', client_id: 'CL-1071', montant: 380_000, motif: 'Dépôt inhabituel', code_alerte: 'DEPOT_INHABITUEL', score_fraude: 62, statut: 'RESOLUE', agent: 'Sena Dossou', agence: 'Adidogomé' },
  { id: 'TX-S-011', date: '13/05/2026', client: 'GIE Femmes Marché', dossier_id: 'DOS-2412', montant: 520_000, motif: 'Compte transit', code_alerte: 'COMPTE_TRANSIT', score_fraude: 58, statut: 'RESOLUE', agent: 'Edem Kpélim', agence: 'Lomé Centre' },
  { id: 'TX-S-012', date: '12/05/2026', client: 'Edem Bessan', client_id: 'CL-1067', montant: 290_000, motif: 'Gonflement récent solde', code_alerte: 'GONFLEMENT_RECENT', score_fraude: 55, statut: 'RESOLUE', agent: 'Mawu Hotor', agence: 'Hédzranawoé' },
]

export const REGISTRE_TENTATIVES_FRAUDE: TentativeFraudeSeed[] = [
  { type: 'Faux justificatifs', count: 3, derniere_date: '20/05/2026', neutralisees: 3 },
  { type: 'Double financement', count: 2, derniere_date: '19/05/2026', neutralisees: 2 },
  { type: 'Usurpation identité', count: 1, derniere_date: '18/05/2026', neutralisees: 1 },
  { type: 'Dépôt pré-RDV', count: 3, derniere_date: '20/05/2026', neutralisees: 0 },
  { type: 'GPS spoofing agent', count: 1, derniere_date: '17/05/2026', neutralisees: 0 },
]

export const REGISTRE_DEPASSEMENTS_PLAFOND: DepassementPlafondSeed[] = [
  { id: 'PLF-001', client: 'PME Mawuena', montant: 5_400_000, plafond: 5_000_000, date: '20/05/2026', statut: 'EN_REVUE', agent: 'Akua Lawson' },
  { id: 'PLF-002', client: 'Coop. Kpalimé Sud', dossier_id: 'DOS-2407', montant: 3_400_000, plafond: 3_000_000, date: '19/05/2026', statut: 'APPROUVE_DEROG', agent: 'Ama Fiagbé' },
  { id: 'PLF-003', client: 'GIE Femmes Marché', dossier_id: 'DOS-2412', montant: 2_400_000, plafond: 2_000_000, date: '18/05/2026', statut: 'EN_REVUE', agent: 'Edem Kpélim' },
]

export const REGISTRE_MODIFICATIONS_SENSIBLES: ModificationSensibleSeed[] = [
  { date: '21/05 09:42', user: 'Edem Kpélim', action: 'Modification montant prêt CL-1124', client_id: 'CL-1124', avant: '550 000', apres: '680 000', criticite: 'HAUTE', justifie: false },
  { date: '20/05 17:18', user: 'Akua Lawson', action: 'Suppression note client CL-1093', client_id: 'CL-1093', avant: 'Note risque', apres: '(supprimée)', criticite: 'HAUTE', justifie: false },
  { date: '20/05 14:32', user: 'Kofi Amavi', action: 'Modification adresse CL-1018', client_id: 'CL-1018', avant: 'Bè Kpota Sud', apres: 'Hédzranawoé Nord', criticite: 'MOYENNE', justifie: true },
  { date: '20/05 11:08', user: 'DG', action: 'Validation dérogation plafond PLF-003', avant: 'EN_REVUE', apres: 'APPROUVE', criticite: 'HAUTE', justifie: true },
  { date: '19/05 16:54', user: 'Ama Fiagbé', action: 'Modification taux préférentiel DOS-2407', avant: '12%', apres: '10%', criticite: 'CRITIQUE', justifie: true },
  { date: '19/05 10:22', user: 'Komi Atsu', action: 'Suppression dossier brouillon DOS-2398', avant: 'DOS-2398', apres: '(supprimé)', criticite: 'MOYENNE', justifie: true },
]

/** Répartition dormants — ratios recalés sur EPARGNE_STATS.dormants */
const DORMANTS_REPARTITION_BASE = [
  { tranche: '6-12 mois inactifs', share: 28, encours: 1_240_000 },
  { tranche: '12-24 mois', share: 16, encours: 780_000 },
  { tranche: '> 24 mois', share: 7, encours: 320_000 },
] as const

function scaleIntegers(parts: number[], target: number): number[] {
  const total = parts.reduce((s, n) => s + n, 0)
  if (total === 0) return parts.map(() => 0)
  const raw = parts.map(n => (n / total) * target)
  const floored = raw.map(n => Math.floor(n))
  let remainder = target - floored.reduce((s, n) => s + n, 0)
  const order = raw.map((n, i) => ({ i, frac: n - Math.floor(n) })).sort((a, b) => b.frac - a.frac)
  const result = [...floored]
  for (let k = 0; k < order.length && remainder > 0; k++) {
    result[order[k].i] += 1
    remainder -= 1
  }
  return result
}

function scaleEncours(parts: number[], target: number): number[] {
  const total = parts.reduce((s, n) => s + n, 0)
  if (total === 0) return parts.map(() => 0)
  const scaled = parts.map(n => Math.round((n / total) * target))
  const diff = target - scaled.reduce((s, n) => s + n, 0)
  if (diff !== 0) scaled[0] += diff
  return scaled
}

export function buildTransactionsSuspectes(limit?: number) {
  const rows = [...REGISTRE_TRANSACTIONS_SUSPECTES]
    .sort((a, b) => b.score_fraude - a.score_fraude)
    .map(t => ({
      id: t.id,
      date: t.date,
      client: t.client,
      montant: t.montant,
      motif: t.motif,
      score_fraude: t.score_fraude,
      statut: t.statut,
      agent: t.agent,
      agence: resolveAgence(t.agence),
    }))
  return limit ? rows.slice(0, limit) : rows
}

export function buildTransactionsSuspectesStats() {
  const all = REGISTRE_TRANSACTIONS_SUSPECTES
  return {
    total: all.length,
    montant: all.reduce((s, t) => s + t.montant, 0),
    en_investigation: all.filter(t => t.statut === 'EN_INVESTIGATION').length,
    bloquees: all.filter(t => t.statut === 'BLOQUEE').length,
  }
}

export function buildTentativesFraude() {
  return REGISTRE_TENTATIVES_FRAUDE.map(t => ({ ...t }))
}

export function buildTentativesFraudeTotals() {
  const neutralisees = REGISTRE_TENTATIVES_FRAUDE.reduce((s, t) => s + t.neutralisees, 0)
  const actives = REGISTRE_TENTATIVES_FRAUDE.reduce((s, t) => s + (t.count - t.neutralisees), 0)
  return { total_tentatives_neutralisees: neutralisees, total_tentatives_actives: actives }
}

export function buildDepassementsPlafond() {
  return REGISTRE_DEPASSEMENTS_PLAFOND.map(d => ({
    id: d.id,
    client: d.client,
    montant: d.montant,
    plafond: d.plafond,
    depassement: d.montant - d.plafond,
    date: d.date,
    statut: d.statut,
    agent: d.agent,
  }))
}

export function buildComptesDormants() {
  const total = DORMANTS_TOTAL
  const counts = scaleIntegers(DORMANTS_REPARTITION_BASE.map(d => d.share), total)
  const encours = scaleEncours(DORMANTS_REPARTITION_BASE.map(d => d.encours), DORMANTS_ENCOURS_TOTAL)

  return {
    total,
    encours_total: encours.reduce((s, n) => s + n, 0),
    repartition: DORMANTS_REPARTITION_BASE.map((d, i) => ({
      tranche: d.tranche,
      count: counts[i],
      encours: encours[i],
    })),
    action_recommandee: 'Campagne de réactivation WhatsApp + appel ciblé',
    suspects_audit: Math.round(total * 0.14),
  }
}

export function buildModificationsSensibles() {
  return REGISTRE_MODIFICATIONS_SENSIBLES.map(m => ({ ...m }))
}

export function buildDisponibiliteSysteme() {
  return {
    uptime_pct_mois: 99.4,
    incidents_majeurs: 1,
    incidents_mineurs: 3,
    temps_reponse_moyen_ms: 320,
    pannes_mobile_money: [
      { operateur: 'MTN MoMo', date: '14/05', duree_min: 42, impact: 'Faible' },
    ],
  }
}

/** KPIs audit dérivés du registre contrôle interne */
export function buildAuditKpisControle() {
  const tx = buildTransactionsSuspectesStats()
  const dormants = buildComptesDormants()
  const fraudes = buildTentativesFraudeTotals()
  const mods = REGISTRE_MODIFICATIONS_SENSIBLES.filter(m => !m.justifie).length

  return {
    transactions_suspectes: tx.en_investigation,
    transactions_suspectes_total: tx.total,
    alertes_fraude: fraudes.total_tentatives_actives,
    comptes_dormants_suspects: dormants.suspects_audit,
    modifications_manuelles: REGISTRE_MODIFICATIONS_SENSIBLES.length,
    modifications_non_justifiees: mods,
  }
}

export function buildControleInterne() {
  const txStats = buildTransactionsSuspectesStats()
  const fraudeTotals = buildTentativesFraudeTotals()

  return {
    transactions_suspectes: buildTransactionsSuspectes(8),
    transactions_suspectes_total: txStats.total,
    transactions_suspectes_montant: txStats.montant,
    tentatives_fraude: buildTentativesFraude(),
    ...fraudeTotals,
    depassements_plafond: buildDepassementsPlafond(),
    comptes_dormants: buildComptesDormants(),
    modifications_sensibles: buildModificationsSensibles(),
    disponibilite_systeme: buildDisponibiliteSysteme(),
  }
}

// =============================================================================
//   ALERTES CBI — 9 codes (compteurs dérivés des TX suspectes quand possible)
// =============================================================================

export interface AlerteCbiSeed {
  code: string
  label: string
  severite: 'CRITICAL' | 'WARN' | 'INFO'
  description: string
  count_resolus_mois: number
  derive_tx?: boolean
}

/** Alertes portefeuille (hors TX actives et dossiers CC en cours) */
export const REGISTRE_CBI_PORTEFEUILLE_COUNTS: Record<string, { actifs: number; resolus_mois: number }> = {
  DEPOT_INHABITUEL: { actifs: 8, resolus_mois: 11 },
  GONFLEMENT_RECENT: { actifs: 5, resolus_mois: 6 },
  DEPOT_PRE_RDV_SUSPECT: { actifs: 0, resolus_mois: 4 },
  CAUTIONS_INSUFFISANTES: { actifs: 11, resolus_mois: 18 },
  CONCENTRATION_SECTORIELLE: { actifs: 2, resolus_mois: 3 },
  ENDETTEMENT_ELEVE: { actifs: 14, resolus_mois: 21 },
  TAUX_EFFORT_EXCESSIF: { actifs: 7, resolus_mois: 9 },
  COMPTE_TRANSIT: { actifs: 4, resolus_mois: 5 },
  ECHANTILLON_BENCHMARK_FAIBLE: { actifs: 9, resolus_mois: 11 },
}

/** Métadonnées des 9 codes CBI v5 — alignées sur AlertesCbiPanel */
export const REGISTRE_ALERTES_CBI: AlerteCbiSeed[] = [
  { code: 'DEPOT_INHABITUEL', label: 'Dépôt inhabituel', severite: 'WARN', description: 'Flux entrant atypique vs historique client', count_resolus_mois: 12, derive_tx: true },
  { code: 'GONFLEMENT_RECENT', label: 'Gonflement récent solde', severite: 'WARN', description: 'Solde artificiellement gonflé < 30j avant RDV', count_resolus_mois: 7, derive_tx: true },
  { code: 'DEPOT_PRE_RDV_SUSPECT', label: 'Dépôt pré-RDV suspect', severite: 'CRITICAL', description: 'Dépôt important 24-72h avant rendez-vous d\'analyse', count_resolus_mois: 4, derive_tx: true },
  { code: 'CAUTIONS_INSUFFISANTES', label: 'Cautions insuffisantes', severite: 'WARN', description: 'Garanties/cautions inférieures au seuil CBI v5', count_resolus_mois: 18 },
  { code: 'CONCENTRATION_SECTORIELLE', label: 'Concentration sectorielle', severite: 'INFO', description: 'Trop de dossiers même secteur dans même agence', count_resolus_mois: 3 },
  { code: 'ENDETTEMENT_ELEVE', label: 'Endettement élevé', severite: 'WARN', description: 'Endettement externe détecté > 50% revenus', count_resolus_mois: 21 },
  { code: 'TAUX_EFFORT_EXCESSIF', label: 'Taux d\'effort excessif', severite: 'CRITICAL', description: 'Mensualité > 33% des revenus déclarés', count_resolus_mois: 9 },
  { code: 'COMPTE_TRANSIT', label: 'Compte transit', severite: 'INFO', description: 'Compte avec mouvements faibles mais pic ponctuel', count_resolus_mois: 6, derive_tx: true },
  { code: 'ECHANTILLON_BENCHMARK_FAIBLE', label: 'Benchmark faible', severite: 'INFO', description: 'Pas assez de dossiers comparables pour scoring fiable', count_resolus_mois: 11 },
]

export function countDossierCbiAlerts(dossiers: { alertes_actives: { code: string }[] }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const d of dossiers) {
    for (const a of d.alertes_actives) {
      counts[a.code] = (counts[a.code] ?? 0) + 1
    }
  }
  return counts
}

export function countAlertesCbiActives(code: string): number {
  return REGISTRE_TRANSACTIONS_SUSPECTES.filter(
    t => t.code_alerte === code && (t.statut === 'EN_INVESTIGATION' || t.statut === 'BLOQUEE'),
  ).length
}

export function buildAlertesCbi9Codes(dossierCounts: Record<string, number> = {}) {
  return REGISTRE_ALERTES_CBI.map(a => {
    const txActive = countAlertesCbiActives(a.code)
    const txResolved = REGISTRE_TRANSACTIONS_SUSPECTES.filter(
      t => t.code_alerte === a.code && t.statut === 'RESOLUE',
    ).length
    const portfolio = REGISTRE_CBI_PORTEFEUILLE_COUNTS[a.code]
    const dossier = dossierCounts[a.code] ?? 0
    const count_actifs = txActive + dossier + (portfolio?.actifs ?? 0)
    const count_resolus_mois = txResolved + (portfolio?.resolus_mois ?? a.count_resolus_mois)
    return {
      code: a.code,
      label: a.label,
      severite: a.severite,
      count_actifs,
      count_resolus_mois,
      description: a.description,
    }
  })
}

// =============================================================================
//   ANOMALIES — registre unifié (vues DG jour + audit interne)
// =============================================================================

export type DomaineAnomalie = 'CREDIT' | 'COMMERCIAL' | 'FINANCE' | 'OPERATIONNEL' | 'TERRAIN' | 'FRAUDE' | 'CONFORMITE'
export type SeveriteAnomalie = 'CRITIQUE' | 'HAUTE' | 'MOYENNE' | 'INFO'

export interface Anomalie {
  id: string
  domaine: DomaineAnomalie
  severite: SeveriteAnomalie
  titre: string
  detail: string
  impact_estime: string
  action_recommandee: string
  responsable: string
  delai: string
  detecte_il_y_a: string
}

export interface AnomalieAudit {
  id: string
  type: string
  agent: string
  agence: string
  montant: number
  date: string
  gravite: 'CRITIQUE' | 'HAUTE' | 'MOYENNE'
  statut: 'EN_COURS' | 'DETECTE' | 'RESOLU'
  detail: string
}

interface AnomalieDgSeed {
  id: string
  domaine: DomaineAnomalie
  severite: SeveriteAnomalie
  titre: string
  detail: string | (() => string)
  impact_estime: string
  action_recommandee: string
  responsable: string
  delai: string
  detecte_il_y_a: string
}

interface AnomalieAuditSeed {
  id: string
  type: string
  agent: string
  agence: string
  montant: number
  date: string
  gravite: 'CRITIQUE' | 'HAUTE' | 'MOYENNE'
  statut: 'EN_COURS' | 'DETECTE' | 'RESOLU'
  detail: string | (() => string)
}

function resolveDetail(d: string | (() => string)): string {
  return typeof d === 'function' ? d() : d
}

function detailParBeKpota(): string {
  const ag = AGENCES.find(a => a.id === 'AG-003')
  if (!ag) return 'Détérioration PAR 30 Bè Kpota — seuil 10% dépassé'
  return `Détérioration +${(ag.par_courant - 9.4).toFixed(1)} pts vs Lomé Centre en 14 jours`
}

function detailDepotsPreRdv(): string {
  const tx = REGISTRE_TRANSACTIONS_SUSPECTES.filter(t => t.code_alerte === 'DEPOT_PRE_RDV_SUSPECT')
  const clients = tx.map(t => t.client).join(', ')
  return `Pattern fraude : ${clients} — dépôts 24-48h avant demande crédit`
}

function detailDossierBloque(): string {
  const d = REGISTRE_DOSSIERS_BLOQUES.find(x => x.id === 'DOS-2412')
  if (!d) return 'GIE Femmes Marché — Direction en mission'
  return `${d.client} — ${d.raison}`
}

function detailConcentrationSecteur(): string {
  const top = [...SECTEURS].sort((a, b) => b.encours - a.encours)[0]
  const pct = Math.round((top.encours / RESEAU_CONSOLIDE.encours_total) * 100)
  return `Diversification recommandée par BCEAO — ${top.nom.toLowerCase()} à ${pct}% (seuil 30%)`
}

function titreParBeKpota(): string {
  const ag = AGENCES.find(a => a.id === 'AG-003')
  return ag ? `PAR 30 Bè Kpota à ${ag.par_courant}% (seuil 10%)` : 'PAR 30 Bè Kpota au-dessus du seuil'
}

function titreConcentrationSecteur(): string {
  const top = [...SECTEURS].sort((a, b) => b.encours - a.encours)[0]
  const pct = Math.round((top.encours / RESEAU_CONSOLIDE.encours_total) * 100)
  return `Concentration secteur ${top.nom.toLowerCase()} ${pct}% (seuil 30%)`
}

/** Anomalies DG — dashboard manager / ROC / terrain */
export const REGISTRE_ANOMALIES_DG: AnomalieDgSeed[] = [
  { id: 'AN-001', domaine: 'FRAUDE', severite: 'CRITIQUE', titre: 'GPS suspect — Kossi Adjavon (GP Bè Kpota)', detail: '12 visites en 45 min impossibles + GPS incohérent 4j', impact_estime: 'Perte 2-3M FCFA', action_recommandee: 'Audit terrain indépendant', responsable: 'DG + Auditeur', delai: '24h', detecte_il_y_a: '4 j' },
  { id: 'AN-002', domaine: 'CREDIT', severite: 'CRITIQUE', titre: titreParBeKpota(), detail: detailParBeKpota, impact_estime: 'Provisions +1.2M', action_recommandee: 'Plan de redressement agence', responsable: 'DEC + RA Bè Kpota', delai: '48h', detecte_il_y_a: '2 j' },
  { id: 'AN-003', domaine: 'CREDIT', severite: 'CRITIQUE', titre: '3 dépôts pré-RDV suspects (gonflement solde)', detail: detailDepotsPreRdv, impact_estime: 'Bloque fraude crédit', action_recommandee: 'Investigation 48h croisée', responsable: 'Auditeur + DEC', delai: '48h', detecte_il_y_a: '3 j' },
  { id: 'AN-004', domaine: 'OPERATIONNEL', severite: 'HAUTE', titre: 'Dossier DOS-2412 bloqué 96h en validation', detail: detailDossierBloque, impact_estime: 'Risque churn', action_recommandee: 'Validation déléguée immédiate', responsable: 'DEC', delai: '6h', detecte_il_y_a: '4 j' },
  { id: 'AN-005', domaine: 'FRAUDE', severite: 'HAUTE', titre: 'Concentration anormale GP Kossi Adjavon', detail: () => {
    const conc = buildConcentrationsSuspectes().find(c => c.type === 'Agent')
    return conc ? `${conc.cible} : ${conc.valeur} dossiers approuvés (seuil ${conc.seuil})` : '24/38 dossiers recouvrement (63% vs seuil 50%)'
  }, impact_estime: 'Risque collusion', action_recommandee: 'Redistribuer missions terrain', responsable: 'RA Bè Kpota', delai: '1 sem', detecte_il_y_a: '1 j' },
  { id: 'AN-006', domaine: 'COMMERCIAL', severite: 'HAUTE', titre: 'Objectif commercial à 74.7% à J-10', detail: 'Décaissements signés 11.2M / objectif 15M', impact_estime: 'Manque 3.8M FCFA', action_recommandee: 'Mobiliser pipeline chaud', responsable: 'DC', delai: '10 j', detecte_il_y_a: 'aujourd\'hui' },
  { id: 'AN-007', domaine: 'COMMERCIAL', severite: 'HAUTE', titre: '12 leads non assignés > 24h', detail: 'Chatbot WA qualifié — risque refroidissement', impact_estime: 'Perte 4 conversions', action_recommandee: 'Attribution immédiate agents', responsable: 'DC + Marketing', delai: 'aujourd\'hui', detecte_il_y_a: '1 j' },
  { id: 'AN-008', domaine: 'OPERATIONNEL', severite: 'HAUTE', titre: 'Modification taux préférentiel non standard', detail: () => {
    const mod = REGISTRE_MODIFICATIONS_SENSIBLES.find(m => m.action.includes('taux préférentiel'))
    return mod ? `${mod.user} ${mod.avant} → ${mod.apres} sur dossier lié` : 'Ama Fiagbé 12% → 10% sur 4 dossiers'
  }, impact_estime: 'Manque à gagner 180k', action_recommandee: 'Vérifier dérogation Direction', responsable: 'DEC', delai: '24h', detecte_il_y_a: '2 j' },
  { id: 'AN-009', domaine: 'FINANCE', severite: 'MOYENNE', titre: 'Décaissements mensuels +12% vs avril', detail: 'Surveiller couverture liquidité', impact_estime: 'Liquidité OK', action_recommandee: 'Surveillance hebdo', responsable: 'DAF + DG', delai: 'continu', detecte_il_y_a: 'aujourd\'hui' },
  { id: 'AN-010', domaine: 'CONFORMITE', severite: 'HAUTE', titre: 'Rapport BCEAO en retard 4j (éch. 31/05)', detail: 'Risque sanction réglementaire si non remis', impact_estime: 'Sanction BCEAO possible', action_recommandee: 'Finaliser avant 31/05', responsable: 'Auditeur + DG', delai: '7 j', detecte_il_y_a: '4 j' },
  { id: 'AN-011', domaine: 'TERRAIN', severite: 'MOYENNE', titre: 'Kossi Adjavon — GPS coupé 47 min', detail: 'Position dernière connue : Bè Kpota', impact_estime: 'Non conformité GPS', action_recommandee: 'Contact RA Edem Kpélim', responsable: 'RA Bè Kpota', delai: '1h', detecte_il_y_a: '47 min' },
  { id: 'AN-012', domaine: 'CONFORMITE', severite: 'MOYENNE', titre: titreConcentrationSecteur(), detail: detailConcentrationSecteur, impact_estime: 'Risque sectoriel', action_recommandee: 'Cibler PME services + agri', responsable: 'DC + DEC', delai: 'T+30j', detecte_il_y_a: '5 j' },
]

/** Anomalies audit interne — dashboard auditeur (projection distincte, mêmes IDs) */
export const REGISTRE_ANOMALIES_AUDIT: AnomalieAuditSeed[] = [
  { id: 'AN-001', type: 'Double décaissement', agent: 'Komi Mensah', agence: 'Hédzranawoé', montant: 850_000, date: '23/05 14:22', gravite: 'CRITIQUE', statut: 'EN_COURS', detail: 'Décaissement x2 du dossier DC-2801 vers même bénéficiaire. Différence de 12 minutes.' },
  { id: 'AN-002', type: 'Modification manuelle', agent: 'kpade.j', agence: 'Bè Kpota', montant: 320_000, date: '22/05 22:47', gravite: 'CRITIQUE', statut: 'EN_COURS', detail: () => {
    const mod = REGISTRE_MODIFICATIONS_SENSIBLES.find(m => m.user === 'Edem Kpélim' && m.criticite === 'HAUTE')
    return mod ? `Montant modifié ${mod.avant} → ${mod.apres} FCFA sans validation supérieure (${mod.user}).` : 'Montant original 650 000 modifié à 320 000 FCFA sans validation supérieure.'
  } },
  { id: 'AN-003', type: 'Décaissements liés', agent: 'Ablam Fiagbé', agence: 'Hédzranawoé', montant: 2_400_000, date: '21-23/05', gravite: 'CRITIQUE', statut: 'EN_COURS', detail: () => {
    const tx = REGISTRE_TRANSACTIONS_SUSPECTES.filter(t => t.code_alerte === 'DEPOT_PRE_RDV_SUSPECT')
    return `${tx.length} opérations liées vers comptes connexes — clients ${tx.map(t => t.client).join(', ')} (schéma fraude potentielle).`
  } },
  { id: 'AN-004', type: 'Annulations anormales', agent: 'Multiple', agence: 'Kara', montant: 980_000, date: '20-23/05', gravite: 'HAUTE', statut: 'EN_COURS', detail: '34 annulations cette semaine (moy. normale : 6). Patterns répétitifs détectés.' },
  { id: 'AN-005', type: 'Crédit sans garantie', agent: 'Komi Atsu', agence: 'Lomé Centre', montant: 850_000, date: '23/05 09:14', gravite: 'HAUTE', statut: 'EN_COURS', detail: 'Dossier DC-2847 validé : champ garanties vide. Montant élevé pour profil.' },
  { id: 'AN-006', type: 'Concentration portefeuille', agent: 'Koku Ablam', agence: 'Adidogomé', montant: 3_200_000, date: '23/05', gravite: 'HAUTE', statut: 'DETECTE', detail: () => {
    const conc = buildConcentrationsSuspectes().find(c => c.type === 'Géographie')
    return conc ? `${conc.cible} : ${conc.metrique} ${conc.valeur} (seuil ${conc.seuil}).` : '2 clients = 37% encours agent. Seuil BCEAO = 25%.'
  } },
  { id: 'AN-007', type: 'Opération hors-horaires', agent: 'kpade.j', agence: 'Bè Kpota', montant: 120_000, date: '22/05 23:12', gravite: 'HAUTE', statut: 'EN_COURS', detail: 'Transaction enregistrée à 23h12 — système normalement verrouillé à 20h.' },
  { id: 'AN-008', type: 'Écart de caisse', agent: 'Resp. Agence', agence: 'Bè Kpota', montant: 148_000, date: '22/05', gravite: 'HAUTE', statut: 'EN_COURS', detail: 'Caisse physique > caisse système de 148 000 FCFA. Non justifié.' },
  { id: 'AN-009', type: 'Écart de caisse', agent: 'Resp. Agence', agence: 'Hédzranawoé', montant: 220_000, date: '22/05', gravite: 'HAUTE', statut: 'EN_COURS', detail: 'Caisse physique < caisse système de 220 000 FCFA. Déficit.' },
  { id: 'AN-010', type: 'Compte dormant actif', agent: 'Système', agence: 'Lomé Centre', montant: 0, date: '23/05', gravite: 'MOYENNE', statut: 'DETECTE', detail: () => `${DORMANTS_TOTAL} comptes dormants réseau — activité suspecte sur sous-ensemble ce mois.` },
  { id: 'AN-011', type: 'Connexion suspecte', agent: 'admin.backup', agence: 'Siège', montant: 0, date: '21/05 03:22', gravite: 'HAUTE', statut: 'EN_COURS', detail: 'Connexion à 03h22 depuis IP non répertoriée (91.23.45.67 — Allemagne).' },
  { id: 'AN-012', type: 'Double financement', agent: 'Multiple', agence: 'Multi', montant: 1_200_000, date: '20/05', gravite: 'HAUTE', statut: 'EN_COURS', detail: () => {
    const fraude = REGISTRE_TENTATIVES_FRAUDE.find(f => f.type === 'Double financement')
    return fraude ? `${fraude.count} cas double financement détectés — dernier ${fraude.derniere_date}. Client Kofi Amavi : crédit actif + demande en cours.` : 'Client Kofi Amavi : crédit actif AG-001 + demande en cours AG-003.'
  } },
]

export function buildAnomaliesJour(): Anomalie[] {
  return REGISTRE_ANOMALIES_DG.map(a => ({
    id: a.id,
    domaine: a.domaine,
    severite: a.severite,
    titre: a.titre,
    detail: resolveDetail(a.detail),
    impact_estime: a.impact_estime,
    action_recommandee: a.action_recommandee,
    responsable: a.responsable,
    delai: a.delai,
    detecte_il_y_a: a.detecte_il_y_a,
  }))
}

export function buildAnomaliesAudit(): AnomalieAudit[] {
  return REGISTRE_ANOMALIES_AUDIT.map(a => ({
    id: a.id,
    type: a.type,
    agent: a.agent,
    agence: a.agence,
    montant: a.montant,
    date: a.date,
    gravite: a.gravite,
    statut: a.statut,
    detail: resolveDetail(a.detail),
  }))
}

export function buildAnomaliesAuditStats() {
  const anomalies = buildAnomaliesAudit()
  const actives = anomalies.filter(a => a.statut === 'EN_COURS' || a.statut === 'DETECTE').length
  const critiques = anomalies.filter(a => a.gravite === 'CRITIQUE' && a.statut !== 'RESOLU').length
  return { actives, critiques, total: anomalies.length }
}

export function buildAnomaliesDgStats() {
  const dg = buildAnomaliesJour()
  return {
    total: dg.length,
    critiques: dg.filter(a => a.severite === 'CRITIQUE').length,
    hautes: dg.filter(a => a.severite === 'HAUTE').length,
  }
}

// =============================================================================
//   AUDIT — seeds opérationnels (caisse, ops hors-horaires, dossiers incomplets)
// =============================================================================

export const REGISTRE_ECARTS_CAISSE = [
  { agence: 'Bè Kpota', type: 'EXCEDENT' as const, montant: 148_000, date: '22/05', statut: 'NON_RESOLU' as const, responsable: 'Kofi Agbodjan' },
  { agence: 'Hédzranawoé', type: 'DEFICIT' as const, montant: 220_000, date: '22/05', statut: 'NON_RESOLU' as const, responsable: 'Ama Lawson' },
]

export const REGISTRE_OPS_HORS_HORAIRES = [
  { heure: '22:47', user: 'kpade.j', action: 'Modification montant crédit', montant: 320_000, agence: 'Bè Kpota' },
  { heure: '23:12', user: 'kpade.j', action: 'Validation dossier', montant: 450_000, agence: 'Bè Kpota' },
  { heure: '03:22', user: 'admin.backup', action: 'Connexion système', montant: 0, agence: 'Siège' },
  { heure: '23:48', user: 'sys.relance', action: 'Export données clients', montant: 0, agence: 'Siège' },
]

export const REGISTRE_DOSSIERS_INCOMPLETS_AUDIT = [
  { id: 'DC-2847', client: 'Mme Akosua Lawson', montant: 850_000, probleme: 'Garanties manquantes', agent: 'Komi Atsu', risque: 'CRITIQUE' as const },
  { id: 'DC-2831', client: 'M. Edem Kpelim', montant: 420_000, probleme: 'Justificatif revenus absent', agent: 'Afi Mensah', risque: 'HAUTE' as const },
  { id: 'DC-2809', client: 'Groupe Solidaire 12', montant: 650_000, probleme: 'Signature membre manquante', agent: 'Yao Fiagbé', risque: 'HAUTE' as const },
  { id: 'DC-2798', client: 'Boutique Ami Plus', montant: 280_000, probleme: "Pièce d'identité expirée", agent: 'Komi Atsu', risque: 'MOYENNE' as const },
]

/** Vérifie la cohérence client_id / dossier_id avec les registres risque */
export function validateControleInterneLinks(): string[] {
  const warnings: string[] = []
  for (const t of REGISTRE_TRANSACTIONS_SUSPECTES) {
    if (t.client_id && !REGISTRE_CLIENTS_RISQUE.find(c => c.id === t.client_id)) {
      warnings.push(`TX ${t.id}: client_id ${t.client_id} absent du registre risque`)
    }
    if (t.dossier_id && !REGISTRE_DOSSIERS_BLOQUES.find(d => d.id === t.dossier_id)) {
      warnings.push(`TX ${t.id}: dossier_id ${t.dossier_id} absent du registre dossiers`)
    }
  }
  return warnings
}
