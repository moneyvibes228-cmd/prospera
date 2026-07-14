/**
 * Équipe & Performance DG — classement, commissions, clients récurrents, coaching IA.
 */
import { buildCommerciauxTerrainDG, type CommercialTerrainDG } from './commercial-terrain-dg-builder'
import { buildRecouvrementParCommercial, buildFacturesDG, type CommercialRecouvrementDG } from './facturation-dg-builder'
import { REGISTRE_PDV } from './registries/pdv-registry'
import { hashString, pick, randInt, seededRandom } from './generators/mock-seed'

export type StatutPerformanceDG = 'TOP' | 'PERFORMANT' | 'NORMAL' | 'SOUS_PERF' | 'DEGRADE'
export type VueEquipeDG = 'classement' | 'comparatif' | 'coaching'

export interface CommercialPerformanceDG extends CommercialTerrainDG {
  rang: number
  statut_perf: StatutPerformanceDG
  badge?: 'OR' | 'ARGENT' | 'BRONZE'
  clients_portefeuille: number
  clients_recurrents: number
  clients_nouveaux_mois: number
  clients_fideles: number
  clients_a_risque: number
  factures_generees_mois: number
  factures_payees_mois: number
  factures_impayees_mois: number
  ca_facture_mois: number
  taux_recouvrement_pct: number
  panier_moyen: number
  taux_transformation_pct: number
  taux_fidelisation_pct: number
  commission_mois: number
  prime_objectif_mois: number
  remuneration_totale_mois: number
  evolution_ca_6m: number[]
  avantages: string[]
  points_forts: string[]
  points_faibles: string[]
  coaching_ia: string
  retour_ia_dg: string
  vs_equipe_ca_pct: number
  vs_equipe_visites_pct: number
}

export interface SyntheseEquipeDG {
  effectif_commercial: number
  performance_moyenne_pct: number
  ca_total_mois: number
  ca_jour_total: number
  commandes_total_mois: number
  clients_recurrents_total: number
  factures_total_mois: number
  commissions_total_mois: number
  taux_recouvrement_moyen: number
  commerciaux_top: number
  commerciaux_degrades: number
  objectif_ca_mois_pct: number
}

export interface AnalyseEquipeIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  commercial?: string
  action: string
}

export interface DecisionEquipeDG {
  priorite: number
  titre: string
  commercial?: string
  impact: string
  decision: string
}

const PERF_EXTRA: Record<string, Omit<CommercialPerformanceDG, keyof CommercialTerrainDG | 'rang'>> = {
  'c-1': {
    statut_perf: 'TOP', badge: 'OR',
    clients_portefeuille: 6, clients_recurrents: 5, clients_nouveaux_mois: 1, clients_fideles: 4, clients_a_risque: 2,
    factures_generees_mois: 42, factures_payees_mois: 28, factures_impayees_mois: 14,
    ca_facture_mois: 58_400_000, taux_recouvrement_pct: 72, panier_moyen: 1_390_000, taux_transformation_pct: 50,
    taux_fidelisation_pct: 83, commission_mois: 1_752_000, prime_objectif_mois: 280_000, remuneration_totale_mois: 2_032_000,
    evolution_ca_6m: [42, 45, 48, 52, 55, 58],
    avantages: ['Prime volume +12% objectif', 'Véhicule de fonction', 'Bonus visites dépassées (+3%)', 'Téléphone + data pro'],
    points_forts: ['Meilleur CA/jour réseau', '28 visites vs 25 obj.', 'Cross-sell huile+eau efficace', 'Relation client 3+ ans'],
    points_faibles: ['12,3 M impayés portefeuille (Kiosque+Mama T.)', 'Taux recouvrement 72% < objectif 85%'],
    coaching_ia: 'Komlan excelle en vente mais sous-performe en recouvrement. 2 clients à risque = 40% créances réseau Lomé Nord.',
    retour_ia_dg: 'Garder comme référence vente · imposer plan recouvrement Kiosque Port avant prime trimestrielle · documenter script cross-sell.',
    vs_equipe_ca_pct: 112, vs_equipe_visites_pct: 108,
  },
  'c-2': {
    statut_perf: 'TOP', badge: 'ARGENT',
    clients_portefeuille: 5, clients_recurrents: 4, clients_nouveaux_mois: 1, clients_fideles: 3, clients_a_risque: 0,
    factures_generees_mois: 38, factures_payees_mois: 34, factures_impayees_mois: 4,
    ca_facture_mois: 62_000_000, taux_recouvrement_pct: 94, panier_moyen: 1_630_000, taux_transformation_pct: 52,
    taux_fidelisation_pct: 80, commission_mois: 2_170_000, prime_objectif_mois: 350_000, remuneration_totale_mois: 2_520_000,
    evolution_ca_6m: [48, 52, 55, 58, 60, 62],
    avantages: ['Prime superviseur zone', 'Budget terrain Kara/Centrale', 'Bonus zéro impayé (+5%)', 'Formation supply chain'],
    points_forts: ['Meilleur taux recouvrement 94%', 'Superette Kara + Dépôt Sokodé en croissance', 'Couverture 96%'],
    points_faibles: ['Conversion terrain Centrale lente (21%)', 'Dépendance 2 gros clients zone Kara'],
    coaching_ia: 'Efua est le modèle recouvrement + couverture. À promouvoir comme superviseur référence Nord.',
    retour_ia_dg: 'Confier coaching Mawuena · étendre méthode Efua sur zone Centrale · valider prime zéro impayé.',
    vs_equipe_ca_pct: 118, vs_equipe_visites_pct: 105,
  },
  'c-4': {
    statut_perf: 'PERFORMANT', badge: 'BRONZE',
    clients_portefeuille: 4, clients_recurrents: 3, clients_nouveaux_mois: 2, clients_fideles: 2, clients_a_risque: 0,
    factures_generees_mois: 24, factures_payees_mois: 22, factures_impayees_mois: 2,
    ca_facture_mois: 12_800_000, taux_recouvrement_pct: 91, panier_moyen: 533_000, taux_transformation_pct: 38,
    taux_fidelisation_pct: 75, commission_mois: 0, prime_objectif_mois: 0, remuneration_totale_mois: 3_600_000,
    evolution_ca_6m: [8, 9, 10, 11, 12, 13],
    avantages: ['Grille tarifaire client personnalisée', 'Accès catalogue premium', 'Pas de plafond géographique', 'Marge nette conservée 100%'],
    points_forts: ['+18% évolution marge/mois', '2 nouveaux PDV signés', 'Paiement comptant majoritaire', 'Flexibilité prix client'],
    points_faibles: ['Panier moyen plus faible que VRP salariés', 'Pas de couverture Lomé Nord'],
    coaching_ia: 'Freelance top — modèle économique différent (marge vs commission). 2 nouveaux clients/mois = meilleur taux acquisition.',
    retour_ia_dg: 'Capturer grille Kofi pour benchmark · ne pas convertir en salarié (perte flexibilité) · session best practices freelances.',
    vs_equipe_ca_pct: 95, vs_equipe_visites_pct: 102,
  },
  'c-3': {
    statut_perf: 'DEGRADE',
    clients_portefeuille: 3, clients_recurrents: 0, clients_nouveaux_mois: 0, clients_fideles: 0, clients_a_risque: 0,
    factures_generees_mois: 8, factures_payees_mois: 6, factures_impayees_mois: 2,
    ca_facture_mois: 8_400_000, taux_recouvrement_pct: 78, panier_moyen: 1_050_000, taux_transformation_pct: 20,
    taux_fidelisation_pct: 0, commission_mois: 420_000, prime_objectif_mois: 0, remuneration_totale_mois: 420_000,
    evolution_ca_6m: [12, 11, 10, 9, 8, 8],
    avantages: ['Accès leads marketing', 'Zone prospection dédiée'],
    points_forts: ['4 prospects actifs identifiés', '15 visites/jour maintenues'],
    points_faibles: ['0 client récurrent converti', 'Couverture 62% · GPS 71%', '3 commandes/mois seulement', 'Boutique Nouvelle non convertie'],
    coaching_ia: 'Mawuena en dégradation — 6 mois de baisse CA. Prospection sans conversion. Plan coaching obligatoire sous 7j.',
    retour_ia_dg: 'Binôme Komlan 2j/semaine · objectif 2 conversions sous 30j sinon réaffectation zone · pas de prime juin.',
    vs_equipe_ca_pct: 48, vs_equipe_visites_pct: 78,
  },
}

type PerfExtra = Omit<CommercialPerformanceDG, keyof CommercialTerrainDG | 'rang'>

function statutPerfFor(c: CommercialTerrainDG): StatutPerformanceDG {
  if (c.score_ia >= 88 && c.visites_jour >= c.visites_objectif) return 'TOP'
  if (c.score_ia >= 82) return 'PERFORMANT'
  if (c.score_ia >= 74) return 'NORMAL'
  if (c.score_ia >= 68 || c.couverture_secteur_pct < 72) return 'SOUS_PERF'
  return 'DEGRADE'
}

function buildPerfExtraFallback(
  c: CommercialTerrainDG,
  pdvs: typeof REGISTRE_PDV,
  reco?: CommercialRecouvrementDG,
): PerfExtra {
  const rng = seededRandom(hashString(`perf-${c.id}`))
  const portefeuille = pdvs.length || randInt(rng, 8, 18)
  const recurrents = pdvs.filter(p => p.pipeline === 'FIDELE' || p.pipeline === 'ACTIF').length
  const fideles = pdvs.filter(p => p.pipeline === 'FIDELE').length
  const nouveaux = pdvs.filter(p => p.pipeline === 'PREMIERE_COMMANDE' || p.pipeline === 'PREMIER_CONTACT').length
  const aRisque = pdvs.filter(p => p.pipeline === 'A_RISQUE' || p.creance_jours > 20).length
  const statut_perf = statutPerfFor(c)
  const tauxRec = reco?.taux_recouvrement_pct ?? Math.min(98, Math.max(62, c.score_ia + randInt(rng, -6, 8)))
  const caFacture = reco?.ca_facture ?? Math.round(c.ca_mois * randInt(rng, 92, 108) / 100)
  const facturesGen = Math.max(4, Math.round(c.commandes_mois * randInt(rng, 85, 115) / 100))
  const facturesPay = Math.round(facturesGen * tauxRec / 100)
  const transfo = Math.min(58, Math.max(18, Math.round((c.commandes_jour / Math.max(1, c.visites_jour)) * 100) + randInt(rng, -5, 10)))
  const fidelPct = portefeuille > 0 ? Math.round((recurrents / portefeuille) * 100) : 0
  const panier = c.commandes_mois > 0 ? Math.round(caFacture / c.commandes_mois) : randInt(rng, 800_000, 1_600_000)
  const commission = c.type === 'FREELANCE' ? 0 : Math.round(caFacture * randInt(rng, 28, 38) / 1000)
  const prime = c.type === 'FREELANCE' ? 0 : (statut_perf === 'TOP' ? randInt(rng, 180_000, 350_000) : randInt(rng, 0, 120_000))
  const vsCa = Math.round(80 + (c.score_ia - 70) * 1.8 + randInt(rng, -8, 8))
  const vsVisites = Math.round((c.visites_jour / Math.max(1, c.visites_objectif)) * 100)
  const evoBase = Math.round(c.ca_mois / 1_000_000)
  const evolution_ca_6m = Array.from({ length: 6 }, (_, i) =>
    Math.max(1, evoBase - (5 - i) + randInt(rng, -2, 3) + (c.evolution_mois_pct > 0 ? i : 0)),
  )

  const badge = statut_perf === 'TOP' && c.score_ia >= 90
    ? 'OR' as const
    : statut_perf === 'TOP'
      ? pick(rng, ['ARGENT', 'BRONZE'] as const)
      : undefined

  return {
    statut_perf,
    badge,
    clients_portefeuille: portefeuille,
    clients_recurrents: recurrents,
    clients_nouveaux_mois: nouveaux || randInt(rng, 0, 2),
    clients_fideles: fideles,
    clients_a_risque: reco?.clients_a_risque ?? aRisque,
    factures_generees_mois: facturesGen,
    factures_payees_mois: facturesPay,
    factures_impayees_mois: Math.max(0, facturesGen - facturesPay),
    ca_facture_mois: caFacture,
    taux_recouvrement_pct: tauxRec,
    panier_moyen: panier,
    taux_transformation_pct: transfo,
    taux_fidelisation_pct: fidelPct,
    commission_mois: commission,
    prime_objectif_mois: prime,
    remuneration_totale_mois: c.type === 'FREELANCE'
      ? c.ca_jour * 22 + (c.marge_jour ?? 0) * 22
      : commission + prime + randInt(rng, 280_000, 420_000),
    evolution_ca_6m,
    avantages: c.type === 'FREELANCE'
      ? ['Grille client personnalisée', 'Marge nette conservée', 'Zone flexible']
      : pick(rng, [
        ['Prime volume objectif', 'Téléphone pro', 'Bonus visites'],
        ['Prime zone', 'Budget terrain', 'Formation produits'],
        ['Prime recouvrement', 'Data mobile', 'Véhicule terrain'],
      ]),
    points_forts: [
      `${c.visites_jour}/${c.visites_objectif} visites/j`,
      `Couverture ${c.couverture_secteur_pct}%`,
      c.evolution_mois_pct > 0 ? `CA +${c.evolution_mois_pct}% vs M-1` : `Score IA ${c.score_ia}`,
    ],
    points_faibles: [
      ...(aRisque > 0 ? [`${aRisque} client(s) à risque`] : []),
      ...(c.couverture_secteur_pct < 75 ? [`Couverture ${c.couverture_secteur_pct}% sous objectif`] : []),
      ...(tauxRec < 80 ? [`Recouvrement ${tauxRec}%`] : []),
    ].slice(0, 3),
    coaching_ia: `${c.nom} (${c.zone}) — ${statut_perf === 'DEGRADE' ? 'plan redressement recommandé' : 'suivi standard'} · ${recurrents}/${portefeuille} clients récurrents · recouvrement ${tauxRec}%.`,
    retour_ia_dg: aRisque > 0
      ? `Prioriser recouvrement sur ${aRisque} dossier(s) à risque avant nouvelles ventes.`
      : transfo < 30
        ? 'Renforcer taux transformation visite → commande via offre pack découverte.'
        : 'Maintenir rythme et capitaliser sur clients fidèles pour upsell.',
    vs_equipe_ca_pct: vsCa,
    vs_equipe_visites_pct: vsVisites,
  }
}

export const STATUT_PERF_STYLE: Record<StatutPerformanceDG, { label: string; className: string }> = {
  TOP: { label: 'Top performer', className: 'bg-amber-100 text-amber-800' },
  PERFORMANT: { label: 'Performant', className: 'bg-emerald-100 text-emerald-700' },
  NORMAL: { label: 'Normal', className: 'bg-slate-100 text-slate-600' },
  SOUS_PERF: { label: 'Sous perf.', className: 'bg-orange-100 text-orange-700' },
  DEGRADE: { label: 'Dégradé', className: 'bg-red-100 text-red-700' },
}

export const BADGE_STYLE: Record<string, string> = {
  OR: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  ARGENT: 'bg-slate-200 text-slate-700 border border-slate-300',
  BRONZE: 'bg-orange-100 text-orange-800 border border-orange-300',
}

function performancePct(c: CommercialPerformanceDG): number {
  const visites = Math.min(120, Math.round((c.visites_jour / c.visites_objectif) * 100))
  const ca = c.vs_equipe_ca_pct
  const reco = c.taux_recouvrement_pct
  const transfo = c.taux_transformation_pct * 2
  return Math.round((visites + ca + reco + transfo) / 4)
}

export function buildEquipePerformanceDG(): CommercialPerformanceDG[] {
  const terrain = buildCommerciauxTerrainDG()
  const recouvrement = buildRecouvrementParCommercial(buildFacturesDG())

  const list = terrain.map(c => {
    const pdvs = REGISTRE_PDV.filter(p => p.commercial === c.nom)
    const reco = recouvrement.find(r => r.commercial === c.nom)
    const extra = PERF_EXTRA[c.id] ?? buildPerfExtraFallback(c, pdvs, reco)
    return {
      ...c,
      ...extra,
      pdv_portefeuille: pdvs.length || extra.clients_portefeuille,
      ca_facture_mois: reco?.ca_facture ?? extra.ca_facture_mois,
      taux_recouvrement_pct: reco?.taux_recouvrement_pct ?? extra.taux_recouvrement_pct,
      clients_a_risque: reco?.clients_a_risque ?? extra.clients_a_risque,
      rang: 0,
    } as CommercialPerformanceDG
  })

  list.sort((a, b) => performancePct(b) - performancePct(a))
  return list.map((c, i) => ({ ...c, rang: i + 1 }))
}

export function buildSyntheseEquipeDG(membres: CommercialPerformanceDG[]): SyntheseEquipeDG {
  const perfMoy = Math.round(membres.reduce((s, c) => s + performancePct(c), 0) / membres.length)
  return {
    effectif_commercial: membres.length,
    performance_moyenne_pct: perfMoy,
    ca_total_mois: membres.reduce((s, c) => s + c.ca_mois, 0),
    ca_jour_total: membres.reduce((s, c) => s + c.ca_jour, 0),
    commandes_total_mois: membres.reduce((s, c) => s + c.commandes_mois, 0),
    clients_recurrents_total: membres.reduce((s, c) => s + c.clients_recurrents, 0),
    factures_total_mois: membres.reduce((s, c) => s + c.factures_generees_mois, 0),
    commissions_total_mois: membres.reduce((s, c) => s + c.commission_mois + c.prime_objectif_mois, 0),
    taux_recouvrement_moyen: Math.round(membres.reduce((s, c) => s + c.taux_recouvrement_pct, 0) / membres.length),
    commerciaux_top: membres.filter(c => c.statut_perf === 'TOP' || c.statut_perf === 'PERFORMANT').length,
    commerciaux_degrades: membres.filter(c => c.statut_perf === 'DEGRADE' || c.statut_perf === 'SOUS_PERF').length,
    objectif_ca_mois_pct: 87,
  }
}

export function buildAnalysesEquipeIA(membres: CommercialPerformanceDG[]): AnalyseEquipeIA[] {
  const analyses: AnalyseEquipeIA[] = []

  const mawuena = membres.find(c => c.id === 'c-3')
  if (mawuena) {
    analyses.push({
      severite: 'CRITIQUE',
      titre: `${mawuena.nom} — statut DÉGRADÉ`,
      detail: `0 client récurrent · CA -33% sur 6 mois · couverture ${mawuena.couverture_secteur_pct}% · GPS ${mawuena.gps_conformite_pct}% · 3 cmd/mois`,
      commercial: mawuena.nom,
      action: 'Plan coaching 7j avec Komlan · objectif 2 conversions sous 30j · suspension prime juin.',
    })
  }

  const komlan = membres.find(c => c.id === 'c-1')
  if (komlan) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Komlan — vente excellente, recouvrement faible',
      detail: `Top CA (${formatMini(komlan.ca_mois)}/mois) mais recouvrement ${komlan.taux_recouvrement_pct}% · 12,3 M impayés portefeuille · Kiosque Port J+45`,
      commercial: komlan.nom,
      action: 'Lier 30% prime à taux recouvrement > 85% · prioriser relance Kiosque avant nouvelles ventes.',
    })
  }

  const kofi = membres.find(c => c.id === 'c-4')
  if (kofi) {
    analyses.push({
      severite: 'MODEREE',
      titre: 'Kofi Agbessi — modèle freelance à documenter',
      detail: `+${kofi.evolution_mois_pct}% marge · 2 nouveaux PDV/mois · recouvrement ${kofi.taux_recouvrement_pct}% · rémunération ${formatMini(kofi.remuneration_totale_mois)}`,
      commercial: kofi.nom,
      action: 'Session best practices · capturer grille tarifaire · ne pas salarier (perte avantage compétitif).',
    })
  }

  const massan = membres.find(c => c.id === 'c-2')
  if (massan) {
    analyses.push({
      severite: 'MODEREE',
      titre: 'Massan Agbodjan — référence recouvrement réseau',
      detail: `94% recouvrement · 0 client à risque · ${massan.factures_generees_mois} factures/mois · prime ${formatMini(massan.prime_objectif_mois)}`,
      commercial: massan.nom,
      action: 'Promouvoir méthode Massan · confier coaching Mawuena · bonus zéro impayé à généraliser.',
    })
  }

  analyses.push({
    severite: 'MODEREE',
    titre: 'Écart performance équipe : 48% à 118% vs moyenne',
    detail: `${membres.filter(c => c.statut_perf === 'TOP').length} top · ${membres.filter(c => c.statut_perf === 'DEGRADE').length} dégradé · commissions totales ${formatMini(membres.reduce((s, c) => s + c.commission_mois, 0))}`,
    action: 'Comité performance mensuel DG · documenter top 2 · plan redressement bottom 1.',
  })

  return analyses
}

function formatMini(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`
  if (n >= 1_000) return `${Math.round(n / 1_000)} K`
  return String(n)
}

export function buildDecisionsEquipeDG(membres: CommercialPerformanceDG[]): DecisionEquipeDG[] {
  return [
    { priorite: 1, titre: 'Plan coaching Mawuena Ahi', commercial: 'Mawuena Ahi', impact: 'Convertir 2 prospects Lomé Est', decision: 'Binôme Komlan 2j/sem · revue dans 30j' },
    { priorite: 2, titre: 'Prime Komlan liée au recouvrement', commercial: 'Komlan Tetteh', impact: 'Récupérer 12,3 M impayés', decision: '30% prime conditionnelle taux > 85%' },
    { priorite: 3, titre: 'Généraliser bonus zéro impayé', commercial: 'Massan Agbodjan', impact: '+5% recouvrement réseau', decision: 'Étendre prime Massan à tous VRP dès juillet' },
    { priorite: 4, titre: 'Documenter modèle freelance Kofi', commercial: 'Kofi Agbessi', impact: '2 nouveaux PDV/mois reproductible', decision: 'Session best practices + grille tarifaire' },
    { priorite: 5, titre: 'Réaffecter 6 PDV Lomé Est', commercial: 'Mawuena → Komlan', impact: 'Couverture +20%', decision: 'Transfert temporaire 60 jours' },
  ]
}

export function getPerformancePct(c: CommercialPerformanceDG): number {
  return performancePct(c)
}
