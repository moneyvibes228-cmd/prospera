// Hub Responsable Commerciale & Collecte — pilotage réseau

import type { RapportIA } from '@/lib/mockMicrofinance'
import { MOCK_COMMERCIAL_HOME } from '@/lib/mockMicrofinance'
import { PERFORMANCE_AGENCES_COMMERCIAL } from '@/lib/dc-vue360'

export const RCC_AGENT = {
  id: 'rcc-em',
  nom: 'Efua Mensah',
  perimetre: 'Réseau Lomé + régions',
}

export interface ZoneControlee {
  id: string
  nom: string
  agence: string
  lat: number
  lng: number
  couverture_pct: number
  collecte_jour: number
  objectif_jour: number
  agents_assignes: number
  statut: 'BON' | 'NORMAL' | 'TENSION' | 'DEGRADE'
  couleur: string
}

export interface PointCollecte {
  id: string
  lat: number
  lng: number
  montant: number
  agent: string
  client: string
  heure: string
  type: 'ESPECES' | 'MOMO' | 'TONTINE'
}

export interface EvenementAgentRCC {
  heure: string
  titre: string
  type: 'VISITE' | 'COLLECTE' | 'PROSPECTION' | 'RDV' | 'TONTINE'
  lieu: string
  montant?: number
}

export interface AgentCalendrierRCC {
  id: string
  nom: string
  agence: string
  collecte_jour: number
  objectif_jour: number
  statut: 'BON' | 'NORMAL' | 'SOUS_PERF' | 'INACTIF'
  couleur: string
  evenements: EvenementAgentRCC[]
}

export const RAPPORT_IA_RCC: RapportIA = {
  date_generation: '27/05/2026 à 07:30',
  periode: 'Mai 2026 — Pôle Commercial & Collecte réseau',
  destinataire: 'Responsable Commerciale & Collecte',
  synthese_executive:
    'Efua, le réseau est à 82 % de l\'objectif collecte du jour (3,85 M / 4,7 M FCFA) avec 12 agents actifs sur 13. Lomé Centre et Adidogomé tirent la performance ; Bè Kpota (-27 % vs objectif) et Adakpamé (-47 %) concentrent l\'écart. Commercial : 52 nouveaux clients ce mois (74 % objectif), 28 prospects actifs dont 4 sans relance > 3 j. Équipe : 2 agents sous-perf. (Yawa Akakpo 48 %, Koku Ablam inactif). L\'IA propose 5 actions : renfort zone Adakpamé aujourd\'hui, relance 3 prospects chauds, mission tontines Tokoin/Vogan, coaching Yawa+Koku, accélération signatures Adidogomé.',
  synthese_piliers: [
    {
      titre: 'Vue globale — commercial & collecte',
      contenu:
        'Collecte jour 82 % · 3,85 M FCFA · écart -850 k. Commercial : +4,2 % croissance portefeuille · conversion 34 % · 4 nouveaux clients aujourd\'hui. 68/90 visites réalisées (76 % productivité moyenne). 14 retards collecte · 6 promesses (340 k). Pipeline valorisé 14,5 M prospects → 11,2 M convertis ce mois.',
    },
    {
      titre: 'Analyse par agence',
      contenu:
        'Lomé Centre (score 88, +) : collecte 92 % objectif · 9/12 signatures. Adidogomé (79) : stable, marché fort potentiel 88 %. Bè Kpota (68, ↓) : collecte 73 % · retards +8 · 2 agents sous-perf. Hédzranawoé (64) : collecte 54 % · tontines à risque. Kpalimé (61) : pilote en croissance mais volume faible.',
    },
    {
      titre: 'Équipe commerciale & collecte',
      contenu:
        '6 agents suivis · top : Kossi Amegnaglo (91 %, OR, 3,85 M collecte). Afia Mensah (84 %, ARGENT). Alertes : Yawa Akakpo (48 %, 8 retards), Koku Ablam (37 %, inactif, 6 visites manquées). 8 visites non effectuées · 2 anomalies GPS. Contrôle qualité : 3 dossiers incomplets.',
    },
    {
      titre: 'Zones & couverture terrain',
      contenu:
        '5 zones contrôlées · couverture moyenne 78 %. Zones tension : Adakpamé (53 % collecte), Tokoin tontines (désengagement). Fort potentiel : Marché Adidogomé (88 %), Bè Kpota (72 %). 42 points de collecte enregistrés aujourd\'hui — pic 10h–14h.',
    },
    {
      titre: 'Propositions IA — actions prioritaires',
      contenu:
        '1) Déployer Kossi + Afia sur Adakpamé matinée (+210 k récupérables). 2) Relancer Boutique Hounyo, Restaurant Aklala, Mme Fovi (sans relance 3–5 j). 3) Visite groupe tontine Vogan (risque CRITIQUE). 4) Coaching Yawa — objectif réduit 5 visites réalistes. 5) Campagne WhatsApp Crédit Express — ROI 12,4x, 8 conversions.',
    },
  ],
  synthese_agences: PERFORMANCE_AGENCES_COMMERCIAL.map(a => ({
    agence_id: a.agence_id,
    nom: a.agence,
    statut_bceao: a.score_commercial >= 80 ? 'CONFORME' as const : a.score_commercial >= 65 ? 'ATTENTION' as const : 'NON_CONFORME' as const,
    score_sante: a.score_commercial,
    tendance: a.tendance === 'HAUSSE' ? 'POSITIF' as const : a.tendance === 'BAISSE' ? 'ALERTE' as const : 'STABLE' as const,
    resume: `${a.responsable} · collecte ${Math.round(a.collecte_mois / a.collecte_objectif * 100)} % · ${a.signatures_mois}/${a.objectif_signatures} signatures · conv. leads ${a.conv_leads_pct} % · remb. ${a.taux_remboursement} %.`,
  })),
  chiffres_cles: [
    { label: 'Collecte jour',      valeur: '82 %',        tendance: 'STABLE', commentaire: '3,85M / 4,7M' },
    { label: 'Nouveaux clients/m', valeur: '52',          tendance: 'HAUSSE', commentaire: 'Obj. 70' },
    { label: 'Conversion',         valeur: '34 %',        tendance: 'STABLE', commentaire: 'Obj. 40 %' },
    { label: 'Agents actifs',      valeur: '12/13',       tendance: 'STABLE', commentaire: '2 sous-perf.' },
    { label: 'Visites jour',       valeur: '68/90',       tendance: 'BAISSE', commentaire: '76 % prod.' },
    { label: 'Prospects chauds',   valeur: '8',           tendance: 'STABLE', commentaire: '4 sans relance' },
    { label: 'Retards collecte',   valeur: '14',          tendance: 'HAUSSE', commentaire: '+8 commerce' },
    { label: 'Fidélisation',       valeur: '91 %',        tendance: 'STABLE', commentaire: '487 actifs' },
  ],
  points_forts: [
    'Collecte 82 % — au-dessus moyenne historique semaine',
    'Lomé Centre score 88 — meilleure agence réseau',
    'Kossi Amegnaglo modèle équipe (91 %, badge OR)',
    'Marché Adidogomé — potentiel conversion 88 %',
    'Campagne WA Crédit Express ROI 12,4x',
  ],
  points_attention: [
    { titre: 'Adakpamé — collecte -47 %',           detail: '210 k / 400 k · baisse -11 % vs S-1 · renfort urgent',           severite: 'CRITIQUE' },
    { titre: 'Bè Kpota — sous-performance',         detail: 'Collecte 73 % objectif · Yawa + retards commerce +8 %',          severite: 'HAUTE' },
    { titre: 'Koku Ablam — inactif',                detail: '37 % perf. · 6 visites manquées · 9 retards portefeuille',       severite: 'CRITIQUE' },
    { titre: 'Tontines Tokoin/Vogan',               detail: 'Risque désengagement · Groupe Vogan CRITIQUE',                   severite: 'HAUTE' },
    { titre: '4 prospects sans relance > 3 j',      detail: 'Boutique Hounyo (5 j), Mme Fovi (4 j) — refroidissement',        severite: 'MODEREE' },
  ],
  recommandations: [
    { priorite: 1, action: 'Renfort Adakpamé — Kossi + Afia matinée (3 visites)',     impact_estime: '+210 k collecte',     delai: 'Aujourd\'hui' },
    { priorite: 1, action: 'Relancer 3 prospects chauds sans contact > 3 j',           impact_estime: '+1,65 M pipeline',    delai: 'Aujourd\'hui' },
    { priorite: 2, action: 'Mission tontine Vogan — risque désengagement CRITIQUE',    impact_estime: 'Sauve 420 k encours', delai: 'Jeudi' },
    { priorite: 2, action: 'Coaching Yawa Akakpo + plan visites réaliste (5/j)',       impact_estime: '+15 pts perf.',       delai: '48h' },
    { priorite: 3, action: 'Accélérer signatures Adidogomé — 4 restantes vs obj. 10',    impact_estime: '+4 clients/mois',     delai: 'Semaine' },
  ],
  previsions_30j: [
    { metrique: 'Collecte mensuelle', valeur_actuelle: '82 %',  valeur_prevue: '89 %',  confidence: 74 },
    { metrique: 'Nouveaux clients',   valeur_actuelle: '52',    valeur_prevue: '68',    confidence: 71 },
    { metrique: 'Conversion',         valeur_actuelle: '34 %',  valeur_prevue: '38 %',  confidence: 68 },
    { metrique: 'Productivité équipe',valeur_actuelle: '76 %',  valeur_prevue: '84 %',  confidence: 72 },
  ],
  alertes_immediates: [
    '🚨 Adakpamé — collecte 53 % · renfort agents aujourd\'hui',
    '🚨 Koku Ablam inactif · 6 visites manquées',
    '⚠ Tontine Vogan — risque désengagement CRITIQUE',
    '⚠ 4 prospects chauds sans relance > 3 jours',
    'ℹ Lomé Centre — 9/12 signatures (meilleure agence)',
  ],
  comparaison_mois_precedent: [
    { metrique: 'Collecte',         mois_precedent: '76 %', mois_courant: '82 %', variation_pct: 7.9 },
    { metrique: 'Nouveaux clients', mois_precedent: '45',   mois_courant: '52',   variation_pct: 15.6 },
    { metrique: 'Conversion',       mois_precedent: '31 %', mois_courant: '34 %', variation_pct: 9.7 },
    { metrique: 'Retards commerce', mois_precedent: '+5 %', mois_courant: '+8 %', variation_pct: 60.0 },
  ],
  signature_ia: 'Prospera AI v2.4 · Pilotage commercial & collecte réseau',
}

const ZONES: ZoneControlee[] = [
  { id: 'Z-01', nom: 'Marché Adidogomé',   agence: 'Adidogomé',   lat: 6.168, lng: 1.195, couverture_pct: 92, collecte_jour: 620_000, objectif_jour: 680_000, agents_assignes: 2, statut: 'BON',     couleur: '#16a34a' },
  { id: 'Z-02', nom: 'Lomé Centre',        agence: 'Lomé Centre', lat: 6.138, lng: 1.212, couverture_pct: 88, collecte_jour: 980_000, objectif_jour: 1_050_000, agents_assignes: 3, statut: 'BON',     couleur: '#2563eb' },
  { id: 'Z-03', nom: 'Bè Kpota',           agence: 'Bè Kpota',    lat: 6.155, lng: 1.248, couverture_pct: 74, collecte_jour: 480_000, objectif_jour: 650_000, agents_assignes: 2, statut: 'TENSION', couleur: '#f97316' },
  { id: 'Z-04', nom: 'Tokoin Hôpital',     agence: 'Lomé Centre', lat: 6.142, lng: 1.225, couverture_pct: 68, collecte_jour: 320_000, objectif_jour: 420_000, agents_assignes: 1, statut: 'NORMAL',  couleur: '#6366f1' },
  { id: 'Z-05', nom: 'Adakpamé Carrefour', agence: 'Bè Kpota',    lat: 6.162, lng: 1.188, couverture_pct: 53, collecte_jour: 210_000, objectif_jour: 400_000, agents_assignes: 1, statut: 'DEGRADE', couleur: '#ef4444' },
  { id: 'Z-06', nom: 'Hédzranawoé',        agence: 'Hédzranawoé', lat: 6.148, lng: 1.178, couverture_pct: 61, collecte_jour: 180_000, objectif_jour: 280_000, agents_assignes: 1, statut: 'NORMAL',  couleur: '#94a3b8' },
]

const POINTS_COLLECTE: PointCollecte[] = [
  { id: 'C-01', lat: 6.169, lng: 1.196, montant: 85_000,  agent: 'Kossi Amegnaglo', client: 'Boutique Hounyo',   heure: '09:15', type: 'ESPECES' },
  { id: 'C-02', lat: 6.139, lng: 1.211, montant: 120_000, agent: 'Afia Mensah',     client: 'Mme Akakpo',        heure: '10:30', type: 'MOMO' },
  { id: 'C-03', lat: 6.156, lng: 1.247, montant: 45_000,  agent: 'Mawu Lawson',     client: 'Groupe tontine Bè', heure: '11:00', type: 'TONTINE' },
  { id: 'C-04', lat: 6.163, lng: 1.189, montant: 35_000,  agent: 'Yawa Akakpo',     client: 'M. Adakpamé',       heure: '08:45', type: 'ESPECES' },
  { id: 'C-05', lat: 6.141, lng: 1.224, montant: 62_000,  agent: 'Sika Dossou',     client: 'Restaurant Aklala', heure: '12:20', type: 'MOMO' },
  { id: 'C-06', lat: 6.137, lng: 1.215, montant: 95_000,  agent: 'Kossi Amegnaglo', client: 'Atelier Edem',      heure: '14:00', type: 'ESPECES' },
]

function buildAgentCalendriers(equipe: typeof MOCK_COMMERCIAL_HOME.equipe): AgentCalendrierRCC[] {
  const colors = ['#2563eb', '#16a34a', '#f97316', '#6366f1', '#ef4444', '#94a3b8']
  const eventsByAgent: Record<string, EvenementAgentRCC[]> = {
    'Kossi Amegnaglo': [
      { heure: '08:00', titre: 'Prospection Marché Adidogomé', type: 'PROSPECTION', lieu: 'Adidogomé' },
      { heure: '09:15', titre: 'Collecte Boutique Hounyo',     type: 'COLLECTE',    lieu: 'Adidogomé', montant: 85_000 },
      { heure: '11:00', titre: 'RDV Atelier Edem',             type: 'RDV',         lieu: 'Tokoin' },
      { heure: '14:00', titre: 'Collecte Atelier Edem',        type: 'COLLECTE',    lieu: 'Tokoin', montant: 95_000 },
    ],
    'Afia Mensah': [
      { heure: '08:30', titre: 'Visite Mme Akakpo',           type: 'VISITE',      lieu: 'Lomé Centre' },
      { heure: '10:30', titre: 'Collecte MoMo',               type: 'COLLECTE',    lieu: 'Lomé Centre', montant: 120_000 },
      { heure: '13:00', titre: 'Prospection PME Commerce',    type: 'PROSPECTION', lieu: 'Lomé Centre' },
    ],
    'Mawu Lawson': [
      { heure: '09:00', titre: 'Tontine Bè Kpota',            type: 'TONTINE',     lieu: 'Bè Kpota' },
      { heure: '11:30', titre: 'Visite retard J+5',             type: 'VISITE',      lieu: 'Bè Kpota' },
    ],
    'Yawa Akakpo': [
      { heure: '08:45', titre: 'Collecte Adakpamé',           type: 'COLLECTE',    lieu: 'Adakpamé', montant: 35_000 },
      { heure: '10:00', titre: 'Relance promesses',           type: 'VISITE',      lieu: 'Adakpamé' },
    ],
    'Sika Dossou': [
      { heure: '10:00', titre: 'Prospection Tokoin',          type: 'PROSPECTION', lieu: 'Tokoin' },
      { heure: '12:20', titre: 'Collecte Restaurant Aklala',  type: 'COLLECTE',    lieu: 'Tokoin', montant: 62_000 },
    ],
    'Koku Ablam': [
      { heure: '—', titre: 'Aucune activité planifiée', type: 'VISITE', lieu: '—' },
    ],
  }

  return equipe.map((a, i) => ({
    id: `ag-${i}`,
    nom: a.agent,
    agence: i < 2 ? 'Lomé Centre' : i < 4 ? 'Bè Kpota' : 'Adidogomé',
    collecte_jour: a.collecte,
    objectif_jour: Math.round(a.collecte / (a.perf_pct / 100)),
    statut: a.statut as AgentCalendrierRCC['statut'],
    couleur: colors[i] ?? '#64748b',
    evenements: eventsByAgent[a.agent] ?? [],
  }))
}

export function getRccHubData() {
  const d = MOCK_COMMERCIAL_HOME
  return {
    agent: RCC_AGENT,
    rapport: RAPPORT_IA_RCC,
    ...d,
    agences: PERFORMANCE_AGENCES_COMMERCIAL,
    zones: ZONES,
    points_collecte: POINTS_COLLECTE,
    agents_calendrier: buildAgentCalendriers(d.equipe),
    propositions_ia: d.synthese_ia.priorites.map((p, i) => ({
      priorite: i + 1,
      action: p,
      impact: RAPPORT_IA_RCC.recommandations[i]?.impact_estime ?? 'Impact positif',
    })),
  }
}
