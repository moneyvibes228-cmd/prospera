import { buildReseauParHistoriqueChart } from './mock-time-series'
import {
  buildReseauAgentsPerformance,
  buildSyncedAgencesData,
  reseauClientsPerdus,
  reseauLeadsEtConversion,
} from './agences-detail-sync'

export interface Agence {
  id: string
  nom: string
  nom_court: string
  initiales: string
  ville: string
  region: string
  color: string
  responsable: string
  ouverture: string
  emprunteurs_actifs: number
  agents: number
  encours_fcfa: number
  par_courant: number
  taux_remboursement: number
  collecte_mois: number
  collecte_objectif: number
  nouveaux_clients_mois: number
  statut: 'ACTIF' | 'PILOTE' | 'EXPANSION'
  latitude: number
  longitude: number
}

export const AGENCES: Agence[] = [
  {
    id: 'AG-001',
    nom: 'Agence Lomé Centre',
    nom_court: 'Lomé Centre',
    initiales: 'LC',
    ville: 'Lomé',
    region: 'Maritime',
    color: '#14b8a6',
    responsable: 'Kofi Amavi',
    ouverture: '2019',
    emprunteurs_actifs: 300,
    agents: 4,
    encours_fcfa: 136_450_000,
    par_courant: 6.8,
    taux_remboursement: 96.2,
    collecte_mois: 19_940_000,
    collecte_objectif: 21_800_000,
    nouveaux_clients_mois: 9,
    statut: 'ACTIF',
    latitude: 6.1375,
    longitude: 1.2123,
  },
  {
    id: 'AG-002',
    nom: 'Agence Adidogomé',
    nom_court: 'Adidogomé',
    initiales: 'AD',
    ville: 'Lomé',
    region: 'Maritime',
    color: '#6366f1',
    responsable: 'Akua Lawson',
    ouverture: '2021',
    emprunteurs_actifs: 150,
    agents: 4,
    encours_fcfa: 69_060_000,
    par_courant: 9.4,
    taux_remboursement: 88.4,
    collecte_mois: 11_500_000,
    collecte_objectif: 14_100_000,
    nouveaux_clients_mois: 7,
    statut: 'ACTIF',
    latitude: 6.1613,
    longitude: 1.1745,
  },
  {
    id: 'AG-003',
    nom: 'Agence Bè Kpota',
    nom_court: 'Bè Kpota',
    initiales: 'BK',
    ville: 'Lomé',
    region: 'Maritime',
    color: '#f97316',
    responsable: 'Edem Kpélim',
    ouverture: '2022',
    emprunteurs_actifs: 212,
    agents: 4,
    encours_fcfa: 99_700_000,
    par_courant: 11.2,
    taux_remboursement: 84.1,
    collecte_mois: 17_065_000,
    collecte_objectif: 21_800_000,
    nouveaux_clients_mois: 5,
    statut: 'ACTIF',
    latitude: 6.1200,
    longitude: 1.2450,
  },
  {
    id: 'AG-004',
    nom: 'Agence Hédzranawoé',
    nom_court: 'Hédzranawoé',
    initiales: 'HZ',
    ville: 'Lomé',
    region: 'Maritime',
    color: '#a855f7',
    responsable: 'Komi Atsu',
    ouverture: '2023',
    emprunteurs_actifs: 153,
    agents: 4,
    encours_fcfa: 73_100_000,
    par_courant: 6.1,
    taux_remboursement: 92.3,
    collecte_mois: 8_613_000,
    collecte_objectif: 14_100_000,
    nouveaux_clients_mois: 4,
    statut: 'ACTIF',
    latitude: 6.1900,
    longitude: 1.1600,
  },
  {
    id: 'AG-005',
    nom: 'Agence Kpalimé',
    nom_court: 'Kpalimé',
    initiales: 'KP',
    ville: 'Kpalimé',
    region: 'Plateaux',
    color: '#22c55e',
    responsable: 'Ama Fiagbé',
    ouverture: '2025',
    emprunteurs_actifs: 90,
    agents: 4,
    encours_fcfa: 31_180_000,
    par_courant: 4.2,
    taux_remboursement: 97.1,
    collecte_mois: 4_371_000,
    collecte_objectif: 7_700_000,
    nouveaux_clients_mois: 3,
    statut: 'PILOTE',
    latitude: 6.9000,
    longitude: 0.6400,
  },
]

export function getAgenceById(id: string): Agence | undefined {
  return AGENCES.find(a => a.id === id)
}

/** Rôles équipe agence — modèle cible RA + commerciaux + GP (Lomé Centre = référence) */
export type RoleEquipeImf = 'RA' | 'COM' | 'GP'

export interface MembreEquipeImf {
  nom: string
  role: RoleEquipeImf
}

function roleEquipeFromLabel(role?: string): RoleEquipeImf {
  if (role === 'Resp. agence') return 'RA'
  if (role === 'GP') return 'GP'
  return 'COM'
}

/** Équipe complète d'une agence depuis la source réseau unique */
export function getEquipeAgenceImf(agenceId: string): MembreEquipeImf[] {
  const data = AGENCES_DATA[agenceId]
  if (!data) return []
  return data.agents_performance.map(a => ({
    nom: a.agent,
    role: roleEquipeFromLabel(a.role),
  }))
}

export function getAgentsTerrainImf(agenceId: string): MembreEquipeImf[] {
  return getEquipeAgenceImf(agenceId).filter(a => a.role === 'COM' || a.role === 'GP')
}

/** Affectation client — commercial terrain (visites) + GP (suivi crédit) + RA (pilotage agence) */
export interface AffectationClientAgence {
  agence_id: string
  responsable_agence: string
  agent_commercial: string
  agent_gp: string
}

const AGENCE_ALIASES: Record<string, string> = {
  'Tsévié': 'Hédzranawoé',
  'Tsevié': 'Hédzranawoé',
  'Tabligbo': 'Kpalimé',
}

export function getAgenceIdByNomCourt(nom: string): string | undefined {
  const n = nom.trim()
  const resolved = AGENCE_ALIASES[n] ?? n
  return AGENCES.find(a => a.nom_court === resolved || a.nom === resolved || resolved.includes(a.nom_court))?.id
}

function hashSeed(input: string | number): number {
  const s = String(input)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function getAffectationClientAgence(agenceId: string, seed: string | number = 0): AffectationClientAgence {
  const equipe = getEquipeAgenceImf(agenceId)
  const idx = hashSeed(seed)
  const ra = equipe.find(e => e.role === 'RA')
  const commerciaux = equipe.filter(e => e.role === 'COM')
  const gps = equipe.filter(e => e.role === 'GP')
  const commercial = commerciaux.length ? commerciaux[idx % commerciaux.length] : undefined
  const gp = gps.length ? gps[idx % gps.length] : undefined
  return {
    agence_id: agenceId,
    responsable_agence: ra?.nom ?? '—',
    agent_commercial: commercial?.nom ?? gps[0]?.nom ?? '—',
    agent_gp: gp?.nom ?? commercial?.nom ?? '—',
  }
}

export function enrichClientAffectation<T extends {
  id: string
  agence: string
  agence_id?: string
  agent: string
  agent_commercial?: string
  agent_gp?: string
  responsable_agence?: string
}>(client: T): T & AffectationClientAgence {
  const agenceId = client.agence_id ?? getAgenceIdByNomCourt(client.agence) ?? ''
  const aff = agenceId ? getAffectationClientAgence(agenceId, client.id) : null
  const equipe = agenceId ? getEquipeAgenceImf(agenceId) : []
  const raNames = new Set(equipe.filter(e => e.role === 'RA').map(e => e.nom))
  const gpNames = new Set(equipe.filter(e => e.role === 'GP').map(e => e.nom))
  const comNames = new Set(equipe.filter(e => e.role === 'COM').map(e => e.nom))

  let commercial = client.agent_commercial
  if (!commercial) {
    if (comNames.has(client.agent)) commercial = client.agent
    else if (!raNames.has(client.agent) && !gpNames.has(client.agent)) commercial = client.agent
    else commercial = aff?.agent_commercial ?? client.agent
  }

  const gp = client.agent_gp ?? aff?.agent_gp ?? '—'

  return {
    ...client,
    agence_id: agenceId || client.agence_id || '',
    responsable_agence: client.responsable_agence ?? aff?.responsable_agence ?? '—',
    agent_commercial: commercial,
    agent_gp: gp,
    agent: commercial,
  }
}

// ─── DONNÉES DÉTAILLÉES PAR AGENCE (pour dashboard directeur réactif) ────────
export interface AgenceDetaillee {
  id: string
  kpis: {
    par_30j: number; par_60j: number; par_90j: number
    taux_remboursement: number; encours: number
    collecte_mois: number; collecte_objectif: number
    nouveaux_clients: number; clients_perdus: number
    decaissements_mois: number; montant_decaisse: number
    liquidite_disponible: number; reserv_obligatoire: number
    leads_entrants: number; taux_conversion_leads: number
    score_sante: number
  }
  alertes: Array<{ type: string; detail: string; urgence: 'HAUTE' | 'NORMALE'; action: string }>
  par_historique: Array<{ mois: string; par_30j: number; remboursement: number; decaissements: number }>
  repartition_produits: Array<{ produit: string; count: number; encours: number; par: number; color: string }>
  agents_performance: Array<{
    agent: string
    role?: string
    rang: number
    visites: number
    collecte: number
    recouvrement: number
    par: number
    score: number
    badge: string | null
    agence?: string
  }>
  portefeuille_aging: Array<{ tranche: string; count: number; montant: number; color: string }>
  ia_insights: Array<{ titre: string; detail: string; type: 'ALERTE' | 'OPPORTUNITE' | 'ACTION' | 'PREVISION'; confidence: number; impact: 'CRITIQUE' | 'ELEVE' | 'MODERE' | 'INFO' }>
  forecast: Array<{ mois: string; par_prevu: number; collecte_prevue: number; confidence: number }>
  conformite_bceao: { statut: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME'; dernier_rapport: string; prochain_rapport: string; items: Array<{ label: string; ok: boolean }> }
}

const AGENCES_DATA_RAW: Record<string, AgenceDetaillee> = {
  'AG-001': {
    id: 'AG-001',
    kpis: {
      par_30j: 6.8, par_60j: 2.4, par_90j: 1.1,
      taux_remboursement: 96.2, encours: 136_450_000,
      collecte_mois: 19_940_000, collecte_objectif: 21_800_000,
      nouveaux_clients: 9, clients_perdus: 4,
      decaissements_mois: 4, montant_decaisse: 2_400_000,
      liquidite_disponible: 3_800_000, reserv_obligatoire: 500_000,
      leads_entrants: 27, taux_conversion_leads: 33,
      score_sante: 88,
    },
    alertes: [
      { type: 'Renouvellement', detail: '7 clients éligibles à un renouvellement automatique — opportunité 3.5M FCFA', urgence: 'NORMALE', action: 'Lancer les propositions IA' },
      { type: 'Objectif collecte', detail: 'À 91% de l\'objectif — 380k FCFA restant sur 9 jours', urgence: 'NORMALE', action: 'Appuyer les relances agents' },
    ],
    par_historique: [
      { mois: 'Jan', par_30j: 9.2, remboursement: 91.8, decaissements: 5 },
      { mois: 'Fév', par_30j: 8.7, remboursement: 92.4, decaissements: 7 },
      { mois: 'Mar', par_30j: 8.1, remboursement: 93.1, decaissements: 8 },
      { mois: 'Avr', par_30j: 7.5, remboursement: 94.8, decaissements: 6 },
      { mois: 'Mai', par_30j: 6.8, remboursement: 96.2, decaissements: 4 },
    ],
    repartition_produits: [
      { produit: 'Crédit individuel', count: 184, encours: 89_500_000, par: 6.2, color: '#14b8a6' },
      { produit: 'Crédit groupe',     count: 68, encours: 34_800_000,  par: 8.1, color: '#6366f1' },
      { produit: 'Tontine',           count: 48, encours: 12_150_000,  par: 4.0, color: '#f97316' },
    ],
    agents_performance: [
      { agent: 'Kofi Amavi', role: 'Resp. agence', rang: 1, visites: 0, collecte: 19_940_000, recouvrement: 96.2, par: 5.9, score: 96, badge: 'OR' },
      { agent: 'Yawo Adjavon', role: 'Commercial', rang: 2, visites: 85, collecte: 11_500_000, recouvrement: 91, par: 6.2, score: 88, badge: 'OR' },
      { agent: 'Mawunya Kpodzo', role: 'GP', rang: 3, visites: 24, collecte: 8_200_000, recouvrement: 89, par: 5.4, score: 89, badge: 'ARGENT' },
      { agent: 'Mensah Kodjo', role: 'Commercial', rang: 4, visites: 45, collecte: 8_800_000, recouvrement: 48, par: 12.4, score: 48, badge: null },
    ],
    portefeuille_aging: [
      { tranche: 'Courant',     count: 251, montant: 116_500_000, color: '#16a34a' },
      { tranche: '1-30j',       count: 29,  montant: 13_550_000,  color: '#eab308' },
      { tranche: '31-60j',      count: 15,  montant: 5_320_000,  color: '#f97316' },
      { tranche: '61-90j',      count: 5,   montant: 980_000,    color: '#dc2626' },
      { tranche: '>90j (contentieux)', count: 0, montant: 0, color: '#7f1d1d' },
    ],
    ia_insights: [
      { titre: 'Performance exemplaire — agence référence', detail: 'Agence Lomé Centre : PAR 6,8 %, remboursement 96,2 %, collecte à 92 % de l\'objectif. Meilleur score santé du réseau après Kpalimé.', type: 'OPPORTUNITE', confidence: 92, impact: 'ELEVE' },
      { titre: 'Prévision PAR juin : 6.2% — objectif atteint', detail: 'Sur la trajectoire actuelle, le PAR de juin devrait atteindre 6.2%, bien en dessous de l\'objectif 8%. Aucune action correctrice requise.', type: 'PREVISION', confidence: 87, impact: 'INFO' },
    ],
    forecast: [
      { mois: 'Juin',    par_prevu: 6.2, collecte_prevue: 4_600_000, confidence: 87 },
      { mois: 'Juillet', par_prevu: 5.9, collecte_prevue: 4_900_000, confidence: 79 },
      { mois: 'Août',    par_prevu: 5.6, collecte_prevue: 5_100_000, confidence: 71 },
    ],
    conformite_bceao: {
      statut: 'CONFORME', dernier_rapport: '30/04/2026', prochain_rapport: '31/05/2026',
      items: [
        { label: 'PAR <10%',            ok: true },
        { label: 'Réserves obligatoires',ok: true },
        { label: 'Rapport mensuel',     ok: true },
        { label: 'Audit trail complet', ok: true },
      ],
    },
  },
  'AG-002': {
    id: 'AG-002',
    kpis: {
      par_30j: 9.4, par_60j: 3.8, par_90j: 1.6,
      taux_remboursement: 88.4, encours: 69_060_000,
      collecte_mois: 11_500_000, collecte_objectif: 14_100_000,
      nouveaux_clients: 7, clients_perdus: 5,
      decaissements_mois: 3, montant_decaisse: 1_650_000,
      liquidite_disponible: 2_100_000, reserv_obligatoire: 400_000,
      leads_entrants: 20, taux_conversion_leads: 35,
      score_sante: 71,
    },
    alertes: [
      { type: 'PAR proche seuil', detail: 'PAR 9.4% — à 0.6% du seuil BCEAO 10%. Trois dossiers en défaut actif à traiter cette semaine.', urgence: 'HAUTE', action: 'Convoquer agent + restructurer 3 dossiers' },
      { type: 'Collecte insuffisante', detail: 'Collecte à 82% de l\'objectif — retard de 820k FCFA vs cible mensuelle.', urgence: 'HAUTE', action: 'Renforcer visites terrain cette semaine' },
    ],
    par_historique: [
      { mois: 'Jan', par_30j: 12.1, remboursement: 84.2, decaissements: 4 },
      { mois: 'Fév', par_30j: 11.4, remboursement: 85.1, decaissements: 5 },
      { mois: 'Mar', par_30j: 10.8, remboursement: 86.4, decaissements: 3 },
      { mois: 'Avr', par_30j: 10.1, remboursement: 87.2, decaissements: 4 },
      { mois: 'Mai', par_30j: 9.4,  remboursement: 88.4, decaissements: 3 },
    ],
    repartition_produits: [
      { produit: 'Crédit individuel', count: 88, encours: 41_300_000, par: 8.9,  color: '#14b8a6' },
      { produit: 'Crédit groupe',     count: 38, encours: 20_000_000,  par: 10.8, color: '#6366f1' },
      { produit: 'Tontine',           count: 24, encours: 7_760_000,  par: 7.2,  color: '#f97316' },
    ],
    agents_performance: [
      { agent: 'Akua Lawson', role: 'Resp. agence', rang: 1, visites: 0, collecte: 11_500_000, recouvrement: 88.4, par: 9.1, score: 84, badge: 'BRONZE' },
      { agent: 'Enyonam Kpade', role: 'Commercial', rang: 2, visites: 52, collecte: 6_600_000, recouvrement: 81, par: 8.2, score: 79, badge: null },
      { agent: 'Abla Tchalla', role: 'Commercial', rang: 3, visites: 38, collecte: 4_400_000, recouvrement: 76, par: 9.0, score: 74, badge: null },
      { agent: 'Sena Dossou', role: 'GP', rang: 4, visites: 48, collecte: 9_200_000, recouvrement: 78, par: 7.8, score: 76, badge: 'ARGENT' },
    ],
    portefeuille_aging: [
      { tranche: 'Courant',     count: 113, montant: 51_200_000, color: '#16a34a' },
      { tranche: '1-30j',       count: 22,  montant: 10_000_000,  color: '#eab308' },
      { tranche: '31-60j',      count: 9,  montant: 5_600_000,  color: '#f97316' },
      { tranche: '61-90j',      count: 6,  montant: 2_260_000,    color: '#dc2626' },
      { tranche: '>90j (contentieux)', count: 0, montant: 0, color: '#7f1d1d' },
    ],
    ia_insights: [
      { titre: 'PAR à risque — seuil BCEAO dans 0.6 points', detail: '3 dossiers en défaut actif représentent 2.1% du PAR. Si non traités cette semaine, l\'agence dépassera le seuil de 10% avant fin mai.', type: 'ALERTE', confidence: 91, impact: 'CRITIQUE' },
      { titre: 'Restructuration groupe recommandée', detail: 'Le crédit groupe présente un PAR de 10.8%. L\'IA recommande de revoir les conditions des 3 groupes les plus à risque et de proposer un étalement.', type: 'ACTION', confidence: 84, impact: 'ELEVE' },
    ],
    forecast: [
      { mois: 'Juin',    par_prevu: 8.9, collecte_prevue: 4_100_000, confidence: 79 },
      { mois: 'Juillet', par_prevu: 8.2, collecte_prevue: 4_400_000, confidence: 70 },
      { mois: 'Août',    par_prevu: 7.8, collecte_prevue: 4_600_000, confidence: 62 },
    ],
    conformite_bceao: {
      statut: 'ATTENTION', dernier_rapport: '30/04/2026', prochain_rapport: '31/05/2026',
      items: [
        { label: 'PAR <10%',            ok: true },
        { label: 'Réserves obligatoires',ok: true },
        { label: 'Rapport mensuel',     ok: true },
        { label: 'Audit trail complet', ok: false },
      ],
    },
  },
  'AG-003': {
    id: 'AG-003',
    kpis: {
      par_30j: 11.2, par_60j: 4.9, par_90j: 2.1,
      taux_remboursement: 84.1, encours: 99_700_000,
      collecte_mois: 17_065_000, collecte_objectif: 21_800_000,
      nouveaux_clients: 5, clients_perdus: 3,
      decaissements_mois: 2, montant_decaisse: 950_000,
      liquidite_disponible: 1_200_000, reserv_obligatoire: 350_000,
      leads_entrants: 15, taux_conversion_leads: 33,
      score_sante: 54,
    },
    alertes: [
      { type: '⚠ BCEAO — Non-conformité PAR', detail: 'PAR 11.2% AU-DESSUS du seuil BCEAO de 10%. Rapport trimestriel en danger. Action immédiate requise.', urgence: 'HAUTE', action: 'Convoquer comité crédit + plan d\'action urgent' },
      { type: 'Agent sous-performant', detail: 'Kossi Adjavon (GP terrain) : 3 top mauvais payeurs réseau. Audit GPS équipe Bè Kpota — le RA pilote, ne visite plus.', urgence: 'HAUTE', action: 'Mission recouvrement conjointe ROC + GP' },
      { type: 'Attrition clients', detail: '3 départs enregistrés ce mois — taux de rétention 91.9%. Analyser les raisons de départ.', urgence: 'NORMALE', action: 'Enquête satisfaction + offre de rétention' },
    ],
    par_historique: [
      { mois: 'Jan', par_30j: 14.2, remboursement: 79.4, decaissements: 3 },
      { mois: 'Fév', par_30j: 13.8, remboursement: 80.1, decaissements: 2 },
      { mois: 'Mar', par_30j: 12.9, remboursement: 81.5, decaissements: 3 },
      { mois: 'Avr', par_30j: 12.1, remboursement: 82.7, decaissements: 2 },
      { mois: 'Mai', par_30j: 11.2, remboursement: 84.1, decaissements: 2 },
    ],
    repartition_produits: [
      { produit: 'Crédit individuel', count: 115, encours: 56_200_000,  par: 10.4, color: '#14b8a6' },
      { produit: 'Crédit groupe',     count: 57, encours: 29_800_000,  par: 13.1, color: '#6366f1' },
      { produit: 'Tontine',           count: 40, encours: 13_700_000,  par: 8.9,  color: '#f97316' },
    ],
    agents_performance: [
      { agent: 'Edem Kpélim', role: 'Resp. agence', rang: 1, visites: 0, collecte: 17_065_000, recouvrement: 62.3, par: 11.2, score: 62, badge: null },
      { agent: 'Afi Lawson', role: 'Commercial', rang: 2, visites: 58, collecte: 9_800_000, recouvrement: 68, par: 11.8, score: 65, badge: null },
      { agent: 'Kofi Senyo', role: 'Commercial', rang: 3, visites: 42, collecte: 7_500_000, recouvrement: 64, par: 12.2, score: 61, badge: null },
      { agent: 'Kossi Adjavon', role: 'GP', rang: 4, visites: 68, collecte: 18_800_000, recouvrement: 71, par: 10.2, score: 71, badge: null },
    ],
    portefeuille_aging: [
      { tranche: 'Courant',     count: 138, montant: 58_400_000, color: '#16a34a' },
      { tranche: '1-30j',       count: 40,  montant: 21_800_000,  color: '#eab308' },
      { tranche: '31-60j',      count: 23,  montant: 12_100_000,  color: '#f97316' },
      { tranche: '61-90j',      count: 11,  montant: 7_400_000,  color: '#dc2626' },
      { tranche: '>90j (contentieux)', count: 0, montant: 0, color: '#7f1d1d' },
    ],
    ia_insights: [
      { titre: 'Agence en zone critique — action immédiate', detail: 'PAR 11.2%, taux de remboursement 84.1%, attrition en hausse. L\'IA recommande un plan de redressement sur 60 jours avec 3 actions prioritaires : restructuration de 5 dossiers, renforcement terrain, et remplacement/coaching de l\'agent sous-performant.', type: 'ALERTE', confidence: 96, impact: 'CRITIQUE' },
      { titre: 'Fraude données possible — équipe terrain Bè Kpota', detail: 'Anomalies GPS sur visites Kossi Adjavon (GP) — 12 points en 45 min. Audit terrain indépendant recommandé. Edem Kpélim (RA) en pilotage.', type: 'ALERTE', confidence: 73, impact: 'CRITIQUE' },
    ],
    forecast: [
      { mois: 'Juin',    par_prevu: 10.4, collecte_prevue: 3_200_000, confidence: 72 },
      { mois: 'Juillet', par_prevu: 9.8,  collecte_prevue: 3_500_000, confidence: 63 },
      { mois: 'Août',    par_prevu: 9.1,  collecte_prevue: 3_700_000, confidence: 54 },
    ],
    conformite_bceao: {
      statut: 'NON_CONFORME', dernier_rapport: '30/04/2026', prochain_rapport: '31/05/2026',
      items: [
        { label: 'PAR <10%',            ok: false },
        { label: 'Réserves obligatoires',ok: true },
        { label: 'Rapport mensuel',     ok: true },
        { label: 'Audit trail complet', ok: false },
      ],
    },
  },
  'AG-004': {
    id: 'AG-004',
    kpis: {
      par_30j: 6.1, par_60j: 2.2, par_90j: 0.9,
      taux_remboursement: 92.3, encours: 73_100_000,
      collecte_mois: 8_613_000, collecte_objectif: 14_100_000,
      nouveaux_clients: 4, clients_perdus: 2,
      decaissements_mois: 1, montant_decaisse: 600_000,
      liquidite_disponible: 1_800_000, reserv_obligatoire: 300_000,
      leads_entrants: 12, taux_conversion_leads: 33,
      score_sante: 79,
    },
    alertes: [
      { type: 'Collecte en retard', detail: 'Collecte à 60.8% de l\'objectif — agence encore jeune (2023), objectifs ambitieux à ajuster ?', urgence: 'NORMALE', action: 'Réviser objectifs ou renforcer prospection' },
      { type: 'Équipe terrain complète', detail: 'Elom Komlavi + Abla Kpodar (commerciaux) + Mawu Hotor (GP) — Komi Atsu (RA) pilote l\'agence.', urgence: 'NORMALE', action: 'Valider répartition zones COM/GP' },
    ],
    par_historique: [
      { mois: 'Jan', par_30j: 8.2, remboursement: 89.1, decaissements: 2 },
      { mois: 'Fév', par_30j: 7.8, remboursement: 90.2, decaissements: 1 },
      { mois: 'Mar', par_30j: 7.1, remboursement: 91.4, decaissements: 2 },
      { mois: 'Avr', par_30j: 6.5, remboursement: 92.0, decaissements: 1 },
      { mois: 'Mai', par_30j: 6.1, remboursement: 92.3, decaissements: 1 },
    ],
    repartition_produits: [
      { produit: 'Crédit individuel', count: 102, encours: 46_400_000,  par: 5.8, color: '#14b8a6' },
      { produit: 'Crédit groupe',     count: 40, encours: 20_400_000,  par: 7.1, color: '#6366f1' },
      { produit: 'Tontine',           count: 11, encours: 6_300_000,  par: 3.5, color: '#f97316' },
    ],
    agents_performance: [
      { agent: 'Komi Atsu', role: 'Resp. agence', rang: 1, visites: 0, collecte: 8_613_000, recouvrement: 92.3, par: 6.1, score: 79, badge: 'ARGENT' },
      { agent: 'Elom Komlavi', role: 'Commercial', rang: 2, visites: 68, collecte: 9_700_000, recouvrement: 82, par: 5.8, score: 82, badge: 'BRONZE' },
      { agent: 'Abla Kpodar', role: 'Commercial', rang: 3, visites: 44, collecte: 6_200_000, recouvrement: 79, par: 6.4, score: 78, badge: null },
      { agent: 'Mawu Hotor', role: 'GP', rang: 4, visites: 28, collecte: 5_400_000, recouvrement: 88, par: 5.2, score: 81, badge: 'BRONZE' },
    ],
    portefeuille_aging: [
      { tranche: 'Courant',     count: 130, montant: 61_200_000, color: '#16a34a' },
      { tranche: '1-30j',       count: 17,  montant: 7_900_000,  color: '#eab308' },
      { tranche: '31-60j',      count: 6,  montant: 4_000_000,    color: '#f97316' },
      { tranche: '61-90j',      count: 0,  montant: 0,          color: '#dc2626' },
      { tranche: '>90j (contentieux)', count: 0, montant: 0, color: '#7f1d1d' },
    ],
    ia_insights: [
      { titre: 'Bonne santé globale — potentiel de croissance', detail: 'PAR 6.1% et remboursement 92.3% — indicateurs sains. Principal frein : un seul agent et objectifs de collecte trop élevés pour la taille actuelle. Revoir les objectifs à la hausse progressive.', type: 'ACTION', confidence: 83, impact: 'MODERE' },
      { titre: 'Recruter un 2e agent d\'ici 3 mois', detail: 'L\'agence a le potentiel pour doubler son portefeuille (zone sous-couverte). Risque opérationnel si le seul agent tombe malade. ROI prévu positif dès le 3e mois.', type: 'OPPORTUNITE', confidence: 88, impact: 'ELEVE' },
    ],
    forecast: [
      { mois: 'Juin',    par_prevu: 5.8, collecte_prevue: 1_700_000, confidence: 81 },
      { mois: 'Juillet', par_prevu: 5.5, collecte_prevue: 1_900_000, confidence: 73 },
      { mois: 'Août',    par_prevu: 5.2, collecte_prevue: 2_100_000, confidence: 65 },
    ],
    conformite_bceao: {
      statut: 'CONFORME', dernier_rapport: '30/04/2026', prochain_rapport: '31/05/2026',
      items: [
        { label: 'PAR <10%',            ok: true },
        { label: 'Réserves obligatoires',ok: true },
        { label: 'Rapport mensuel',     ok: true },
        { label: 'Audit trail complet', ok: true },
      ],
    },
  },
  'AG-005': {
    id: 'AG-005',
    kpis: {
      par_30j: 4.2, par_60j: 1.1, par_90j: 0.0,
      taux_remboursement: 97.1, encours: 31_180_000,
      collecte_mois: 4_371_000, collecte_objectif: 7_700_000,
      nouveaux_clients: 3, clients_perdus: 1,
      decaissements_mois: 3, montant_decaisse: 850_000,
      liquidite_disponible: 2_200_000, reserv_obligatoire: 200_000,
      leads_entrants: 10, taux_conversion_leads: 30,
      score_sante: 91,
    },
    alertes: [
      { type: 'Collecte en construction', detail: 'Agence pilote (6 mois) — collecte à 56.7% de l\'objectif mais PAR et remboursement excellents.', urgence: 'NORMALE', action: 'Accélérer les décaissements — portefeuille sous-utilisé' },
    ],
    par_historique: [
      { mois: 'Jan', par_30j: 5.8, remboursement: 94.2, decaissements: 2 },
      { mois: 'Fév', par_30j: 5.1, remboursement: 95.4, decaissements: 3 },
      { mois: 'Mar', par_30j: 4.8, remboursement: 96.1, decaissements: 4 },
      { mois: 'Avr', par_30j: 4.5, remboursement: 96.7, decaissements: 3 },
      { mois: 'Mai', par_30j: 4.2, remboursement: 97.1, decaissements: 3 },
    ],
    repartition_produits: [
      { produit: 'Crédit individuel', count: 58,  encours: 19_900_000, par: 3.8, color: '#14b8a6' },
      { produit: 'Crédit groupe',     count: 26,  encours: 9_000_000, par: 5.2, color: '#6366f1' },
      { produit: 'Tontine',           count: 6,  encours: 2_280_000,   par: 0.0, color: '#f97316' },
    ],
    agents_performance: [
      { agent: 'Ama Fiagbé', role: 'Resp. agence', rang: 1, visites: 0, collecte: 4_371_000, recouvrement: 97.1, par: 4.2, score: 91, badge: 'OR' },
      { agent: 'Selom Agbeko', role: 'Commercial', rang: 2, visites: 48, collecte: 5_800_000, recouvrement: 84, par: 4.8, score: 83, badge: 'BRONZE' },
      { agent: 'Komla Adzro', role: 'Commercial', rang: 3, visites: 28, collecte: 3_200_000, recouvrement: 81, par: 5.1, score: 80, badge: null },
      { agent: 'Akoue Yawa', role: 'GP', rang: 4, visites: 42, collecte: 6_900_000, recouvrement: 76, par: 6.8, score: 76, badge: null },
    ],
    portefeuille_aging: [
      { tranche: 'Courant',     count: 84, montant: 28_300_000, color: '#16a34a' },
      { tranche: '1-30j',       count: 6,  montant: 2_890_000,   color: '#eab308' },
      { tranche: '31-60j',      count: 0,  montant: 0,         color: '#f97316' },
      { tranche: '61-90j',      count: 0,  montant: 0,         color: '#dc2626' },
      { tranche: '>90j (contentieux)', count: 0, montant: 0, color: '#7f1d1d' },
    ],
    ia_insights: [
      { titre: 'Agence pilote — performance exceptionnelle', detail: 'Kpalimé : PAR 4,2 %, remboursement 97,1 %, score santé 91/100 — meilleurs indicateurs du réseau. Liquidité disponible confortable.', type: 'OPPORTUNITE', confidence: 93, impact: 'ELEVE' },
      { titre: 'Prévision PAR juin : 3,9 %', detail: 'Sur la trajectoire actuelle (PAR passé de 5,8 % en janvier à 4,2 % en mai), le PAR de juin devrait rester sous 4 %. Collecte prévue : 950 k FCFA.', type: 'PREVISION', confidence: 88, impact: 'INFO' },
    ],
    forecast: [
      { mois: 'Juin',    par_prevu: 3.9, collecte_prevue: 950_000,   confidence: 88 },
      { mois: 'Juillet', par_prevu: 3.6, collecte_prevue: 1_100_000, confidence: 81 },
      { mois: 'Août',    par_prevu: 3.3, collecte_prevue: 1_300_000, confidence: 74 },
    ],
    conformite_bceao: {
      statut: 'CONFORME', dernier_rapport: '30/04/2026', prochain_rapport: '31/05/2026',
      items: [
        { label: 'PAR <10%',            ok: true },
        { label: 'Réserves obligatoires',ok: true },
        { label: 'Rapport mensuel',     ok: true },
        { label: 'Audit trail complet', ok: true },
      ],
    },
  },
}

/** Fiches agence — KPIs, équipe et alertes alignés avec commercial-dc-hub + terrain */
export const AGENCES_DATA = buildSyncedAgencesData(AGENCES, AGENCES_DATA_RAW)

const RESEAU_COMMERCIAL = reseauLeadsEtConversion()

// ─── DONNÉES RÉSEAU CONSOLIDÉ ────────────────────────────────────────────────
export const RESEAU_CONSOLIDE = {
  total_agences: AGENCES.length,
  agences_actives: AGENCES.filter(a => a.statut === 'ACTIF').length,
  total_emprunteurs: AGENCES.reduce((s, a) => s + a.emprunteurs_actifs, 0),
  total_agents: AGENCES.reduce((s, a) => s + a.agents, 0),
  /** 5 RA + 15 commerciaux/GP terrain (2 COM + 1 GP par agence) */
  responsables_agence: 5,
  agents_terrain: 15,
  encours_total: AGENCES.reduce((s, a) => s + a.encours_fcfa, 0),
  par_moyen: Number((AGENCES.reduce((s, a) => s + a.par_courant * a.emprunteurs_actifs, 0) / AGENCES.reduce((s, a) => s + a.emprunteurs_actifs, 0)).toFixed(1)),
  taux_remb_moyen: Number((AGENCES.reduce((s, a) => s + a.taux_remboursement, 0) / AGENCES.length).toFixed(1)),
  collecte_totale: AGENCES.reduce((s, a) => s + a.collecte_mois, 0),
  collecte_objectif: AGENCES.reduce((s, a) => s + a.collecte_objectif, 0),
  nouveaux_clients: AGENCES.reduce((s, a) => s + a.nouveaux_clients_mois, 0),
  // Données supplémentaires réseau
  liquidite_totale: 11_100_000,
  decaissements_mois: 13,
  montant_decaisse_mois: 6_450_000,
  leads_mois: RESEAU_COMMERCIAL.leads_mois,
  taux_conversion_reseau: RESEAU_COMMERCIAL.taux_conversion_reseau,
  clients_perdus_mois: reseauClientsPerdus(AGENCES_DATA),
  score_sante_reseau: 76,
  agences_conformes: 3,
  agences_attention: 1,
  agences_non_conformes: 1,
  // Pour les graphiques réseau
  par_historique: buildReseauParHistoriqueChart(),
  forecast: [
    { mois: 'Juin',    par_prevu: 7.6, collecte_prevue: 61_500_000, confidence: 82 },
    { mois: 'Juillet', par_prevu: 7.1, collecte_prevue: 64_000_000, confidence: 74 },
    { mois: 'Août',    par_prevu: 6.8, collecte_prevue: 67_200_000, confidence: 65 },
  ],
  repartition_produits: [
    { produit: 'Crédit individuel', count: 544, encours: 254_200_000, par: 7.4,  color: '#14b8a6' },
    { produit: 'Crédit groupe',     count: 226, encours: 114_400_000, par: 9.8,  color: '#6366f1' },
    { produit: 'Tontine',           count: 135, encours: 40_890_000,  par: 5.9,  color: '#f97316' },
  ],
  portefeuille_aging: [
    { tranche: 'Courant',     count: 712, montant: 317_200_000, color: '#16a34a' },
    { tranche: '1-30j',       count: 115, montant: 53_800_000, color: '#eab308' },
    { tranche: '31-60j',      count: 53,  montant: 27_500_000,  color: '#f97316' },
    { tranche: '61-90j',      count: 25,  montant: 10_990_000,  color: '#dc2626' },
    { tranche: '>90j (contentieux)', count: 0, montant: 0, color: '#7f1d1d' },
  ],
  ia_insights_reseau: [
    { titre: 'Agence Bè Kpota : non-conformité BCEAO — action immédiate', detail: 'PAR 11.2% > seuil 10%. Rapport trimestriel en danger. Convoquer responsable + plan de redressement 60j.', type: 'ALERTE' as const, confidence: 98, impact: 'CRITIQUE' as const },
    { titre: 'Agent équipe Bè Kpota — fraude probable aux données terrain', detail: 'Anomalies GPS sur visites GP (Kossi Adjavon) — 12 points en 45 min. Audit indépendant requis. RA Edem Kpélim en pilotage agence.', type: 'ALERTE' as const, confidence: 73, impact: 'CRITIQUE' as const },
    { titre: 'Kpalimé — meilleure performance réseau', detail: 'PAR 4,2 %, remboursement 97,1 %, score santé 91/100. Référence pour le pilotage RA + commercial + GP.', type: 'OPPORTUNITE' as const, confidence: 86, impact: 'ELEVE' as const },
    { titre: 'Prévision réseau juin : PAR 7.6% — sous l\'objectif 8%', detail: 'Si les actions correctives sur Bè Kpota sont menées, le PAR global devrait atteindre 7.6% en juin. Collecte prévue 14.8M FCFA (+20% vs jan-26).', type: 'PREVISION' as const, confidence: 82, impact: 'ELEVE' as const },
    { titre: '14 dossiers éligibles renouvellement automatique', detail: 'Score >85 sur tout le réseau. Opportunité 4.9M FCFA de nouveaux décaissements à risque minimal. L\'IA a généré les propositions — à envoyer par WhatsApp.', type: 'OPPORTUNITE' as const, confidence: 89, impact: 'MODERE' as const },
  ],
  alertes_reseau: [
    { type: '⚠ BCEAO — Non-conformité Bè Kpota', detail: 'PAR 11.2% > seuil 10%. Rapport trimestriel en danger.', urgence: 'HAUTE' as const, action: 'Plan de redressement 60j', zone: 'Bè Kpota' },
    { type: 'Équipe terrain Bè Kpota — GPS suspect', detail: 'Kossi Adjavon — doublons GPS détectés sur visites GP.', urgence: 'HAUTE' as const, action: 'Audit terrain indépendant', zone: 'Bè Kpota' },
    { type: 'Collecte réseau : 76.9% obj.', detail: 'Retard de 3.7M FCFA vs objectif consolidé mensuel.', urgence: 'HAUTE' as const, action: 'Intensifier visites terrain semaine 3', zone: 'Tout le réseau' },
    { type: 'Agence Hédzranawoé — renfort GP en place', detail: 'Elom Komlavi (commercial) + Mawu Hotor (GP) sous Komi Atsu (RA). Couverture terrain renforcée vs Q1.', urgence: 'NORMALE' as const, action: 'Suivre intégration GP', zone: 'Hédzranawoé' },
    { type: '8 leads WA non traités > 24h', detail: 'Chatbot a qualifié 8 leads — non attribués aux agents.', urgence: 'NORMALE' as const, action: 'Assigner aux agents zones concernées', zone: 'Adidogomé, Bè Kpota' },
  ],
  agents_performance: buildReseauAgentsPerformance(AGENCES_DATA),
}
