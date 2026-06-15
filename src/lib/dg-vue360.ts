import { SECTEURS, type SecteurStats } from '@/lib/portefeuille-reseau'
import { AGENCES, RESEAU_CONSOLIDE } from '@/lib/agences'

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export interface SousSecteurDetail {
  slug: string
  nom: string
  count: number
  par: number
  encours: number
  part_secteur_pct: number
  ticket_moyen: number
  taux_remboursement: number
  croissance_pct: number
  ia_analyse: string
  risques: string[]
  opportunites: string[]
  top_agences: { agence: string; dossiers: number; par: number }[]
  dossiers_exemples: { client: string; montant: number; statut: string; agent: string }[]
}

export interface SecteurDetail extends SecteurStats {
  slug: string
  part_reseau_pct: number
  dossiers_en_retard: number
  provision_requise: number
  ia_analyse: string
  ia_recommandation: string
  historique_6m: { mois: string; encours: number; par: number; dossiers: number }[]
  agences_exposition: { agence_id: string; agence: string; dossiers: number; encours: number; par: number; pct_encours: number }[]
  sous_secteurs_detail: SousSecteurDetail[]
  alertes: { titre: string; severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'; detail: string }[]
}

export interface AgentObjectifs {
  visites: number
  collecte: number
  recouvrement: number
  nouveaux_clients: number
  decaissements: number
}

export interface AgentDetailDG {
  id: string
  nom: string
  agence_id: string
  agence: string
  responsable_agence: string
  rang: number
  badge: string | null
  score: number
  visites: number
  collecte: number
  recouvrement: number
  par: number
  objectifs: AgentObjectifs
  realise: AgentObjectifs
  historique_6m: { mois: string; collecte: number; visites: number; recouvrement: number }[]
  ia_analyse: string
  points_forts: string[]
  points_attention: string[]
  clients_portefeuille: number
  clients_a_risque: number
  gps_conformite_pct: number
  streak_jours: number
  derniere_visite: string
}

export const CARTE_COUVERTURE_IA = {
  titre: 'Analyse territoriale IA — Réseau consolidé',
  date_generation: '21/05/2026 à 06:00',
  score_couverture: 68,
  penetration_moyenne_pct: 34,
  zones_sous_couvertes: 4,
  clients_cartographies: 188,
  synthese: 'Le réseau couvre principalement le grand Lomé et la zone Kpalimé, avec une densité client élevée à Lomé Centre et des poches de sous-couverture à l’est (Adidogomé périphérie) et au nord-est (Hédzranawoé). L’IA identifie 4 zones à fort potentiel non exploitées, représentant environ 420 clients estimés et 18M FCFA d’encours potentiel sur 12 mois. La priorité n’est pas d’étendre géographiquement avant de stabiliser Bè Kpota : une expansion sur de nouvelles zones sans redressement de l’agence la plus faible augmenterait le risque opérationnel global.',
  piliers: [
    {
      titre: 'Densité & pénétration',
      contenu: 'Pénétration marché moyenne 34% sur les 5 agences actives. Kpalimé affiche la meilleure pénétration relative (43%) malgré un portefeuille jeune — signal de demande non satisfaite. Lomé Centre est proche de la saturation sur son rayon 1,8 km : les nouveaux clients y coûtent plus cher à acquérir.',
    },
    {
      titre: 'Risque géographique',
      contenu: 'Bè Kpota concentre 21% des clients en retard du réseau sur seulement 20% de la superficie couverte. La carte montre un cluster orange/rouge autour du marché de Bè — corrélation forte avec les dossiers commerce à flux cash irrégulier. L’IA recommande un ciblage sectoriel local avant toute prospection nouvelle.',
    },
    {
      titre: 'Opportunités IA (zones pointillées)',
      contenu: '3 zones à potentiel TRÈS ÉLEVÉ identifiées (conf. 82–91%) : Agoè-Zongo, Tokoin-Wuiti, et nord Kpalimé. Action type : affecter 1 agent dédié 2 j/semaine pendant 6 semaines avec objectif 15 nouveaux prospects qualifiés par zone.',
    },
    {
      titre: 'Cohérence réseau',
      contenu: 'Distance inter-agences optimale respectée sauf chevauchement léger Adidogomé / Bè Kpota (12 % clients à moins de 800 m d\'une autre agence). Pas d\'anomalie majeure de cannibalisation entre les 5 agences actives.',
    },
  ],
  par_agence: AGENCES.map(a => ({
    agence_id: a.id,
    nom: a.nom_court,
    rayon_km: a.id === 'AG-005' ? 2.2 : 1.8,
    clients: a.emprunteurs_actifs,
    par: a.par_courant,
    penetration_pct: a.id === 'AG-005' ? 43 : a.id === 'AG-001' ? 38 : a.id === 'AG-004' ? 36 : a.id === 'AG-002' ? 34 : 29,
    commentaire_ia:
      a.id === 'AG-003'
        ? 'Zone en tension — limiter prospection, focus recouvrement'
        : a.id === 'AG-005'
          ? 'Sous-exploité — doubler effort décaissement'
          : a.id === 'AG-001'
            ? 'Référence — modèle à documenter'
            : 'Croissance modérée possible',
  })),
}

function buildSecteurDetails(): SecteurDetail[] {
  const totalEncours = SECTEURS.reduce((s, x) => s + x.encours, 0)
  return SECTEURS.map(s => {
    const slug = toSlug(s.nom)
    const partReseau = Math.round((s.encours / totalEncours) * 1000) / 10
    const dossiersRetard = Math.round(s.nb_dossiers * (s.par_30j_pct / 100))
    return {
      ...s,
      slug,
      part_reseau_pct: partReseau,
      dossiers_en_retard: dossiersRetard,
      provision_requise: Math.round(s.expected_loss * 1.15),
      ia_analyse:
        s.alerte_concentration
          ? `Le secteur ${s.nom} représente ${partReseau}% de l'encours réseau — au-dessus du seuil de vigilance BCEAO (30%). La qualité globale reste acceptable (PAR ${s.par_30j_pct}%) mais la concentration expose l'institution à un choc sectoriel. L'IA recommande de plafonner les nouveaux décaissements à 25% du flux mensuel sur ce secteur jusqu'en juillet.`
          : `Secteur ${s.nom} : profil ${s.par_30j_pct <= 7 ? 'sain' : s.par_30j_pct <= 10 ? 'acceptable' : 'tendu'} avec PAR ${s.par_30j_pct}% et remboursement ${s.taux_remboursement}%. Saisonnalité ${s.saisonalite.toLowerCase()} — ${s.saisonalite === 'SAISONNIER' ? 'prévoir provisions renforcées en basse saison' : 'flux relativement prévisibles'}.`,
      ia_recommandation:
        s.nom === 'Commerce'
          ? 'Diversifier vers Artisanat et Services pour 30% des nouveaux dossiers en juin-juin.'
          : s.nom === 'Agriculture'
            ? 'Restructurer les 4 dossiers élevage > PAR 12% avant nouvelle campagne de décaissement.'
            : 'Maintenir le rythme actuel — secteur pilote pour renouvellements automatiques.',
      historique_6m: [
        { mois: 'Déc', encours: Math.round(s.encours * 0.88), par: Math.min(s.par_30j_pct + 2.4, 15), dossiers: Math.round(s.nb_dossiers * 0.92) },
        { mois: 'Jan', encours: Math.round(s.encours * 0.91), par: Math.min(s.par_30j_pct + 1.8, 15), dossiers: Math.round(s.nb_dossiers * 0.94) },
        { mois: 'Fév', encours: Math.round(s.encours * 0.94), par: Math.min(s.par_30j_pct + 1.2, 15), dossiers: Math.round(s.nb_dossiers * 0.96) },
        { mois: 'Mar', encours: Math.round(s.encours * 0.96), par: Math.min(s.par_30j_pct + 0.6, 15), dossiers: Math.round(s.nb_dossiers * 0.98) },
        { mois: 'Avr', encours: Math.round(s.encours * 0.98), par: Math.min(s.par_30j_pct + 0.2, 15), dossiers: Math.round(s.nb_dossiers * 0.99) },
        { mois: 'Mai', encours: s.encours, par: s.par_30j_pct, dossiers: s.nb_dossiers },
      ],
      agences_exposition: [
        { agence_id: 'AG-001', agence: 'Lomé Centre', dossiers: Math.round(s.nb_dossiers * 0.32), encours: Math.round(s.encours * 0.34), par: Math.max(4, s.par_30j_pct - 1.2), pct_encours: 34 },
        { agence_id: 'AG-002', agence: 'Adidogomé', dossiers: Math.round(s.nb_dossiers * 0.22), encours: Math.round(s.encours * 0.21), par: s.par_30j_pct + 0.8, pct_encours: 21 },
        { agence_id: 'AG-003', agence: 'Bè Kpota', dossiers: Math.round(s.nb_dossiers * 0.18), encours: Math.round(s.encours * 0.19), par: s.par_30j_pct + 2.4, pct_encours: 19 },
        { agence_id: 'AG-004', agence: 'Hédzranawoé', dossiers: Math.round(s.nb_dossiers * 0.14), encours: Math.round(s.encours * 0.13), par: Math.max(4, s.par_30j_pct - 0.8), pct_encours: 13 },
        { agence_id: 'AG-005', agence: 'Kpalimé', dossiers: Math.round(s.nb_dossiers * 0.14), encours: Math.round(s.encours * 0.13), par: Math.max(3, s.par_30j_pct - 2), pct_encours: 13 },
      ],
      sous_secteurs_detail: s.sous_secteurs.map(ss => {
        const ssEncours = Math.round((ss.count / s.nb_dossiers) * s.encours)
        return {
          slug: toSlug(ss.nom),
          nom: ss.nom,
          count: ss.count,
          par: ss.par,
          encours: ssEncours,
          part_secteur_pct: Math.round((ss.count / s.nb_dossiers) * 100),
          ticket_moyen: Math.round(ssEncours / ss.count),
          taux_remboursement: Math.max(80, s.taux_remboursement - (ss.par > s.par_30j_pct ? 4 : 0)),
          croissance_pct: s.croissance_mensuelle_pct + (ss.par < s.par_30j_pct ? 2 : -3),
          ia_analyse: `Sous-secteur « ${ss.nom} » : ${ss.count} dossiers, PAR ${ss.par}%. ${ss.par > 10 ? 'Au-dessus du seuil BCEAO — revue comité crédit obligatoire pour tout nouveau dossier.' : ss.par > 8 ? 'Zone de vigilance — renforcer les garanties ou réduire les montants.' : 'Profil favorable pour renouvellements et montées en gamme.'}`,
          risques: ss.par > 10
            ? ['Concentration défauts', 'Saisonnalité des revenus']
            : ss.par > 8
              ? ['Retards récurrents sur fin de mois']
              : [],
          opportunites: ss.par <= 7
            ? ['Éligibles renouvellement auto', 'Cross-sell épargne']
            : ['Restructuration possible sur 3 dossiers'],
          top_agences: [
            { agence: 'Lomé Centre', dossiers: Math.ceil(ss.count * 0.35), par: Math.max(4, ss.par - 1) },
            { agence: 'Bè Kpota', dossiers: Math.ceil(ss.count * 0.2), par: ss.par + 1.5 },
          ],
          dossiers_exemples: Array.from({ length: Math.min(3, ss.count) }, (_, i) => ({
            client: `Client ${ss.nom.split(' ')[0]} ${i + 1}`,
            montant: Math.round(ssEncours / ss.count),
            statut: ss.par > 10 ? 'EN_RETARD' : i === 0 ? 'ACTIF' : 'ACTIF',
            agent: ['Kofi Amavi', 'Akua Lawson', 'Edem Kpélim', 'Komi Atsu', 'Ama Fiagbé'][i % 5],
          })),
        }
      }),
      alertes: [
        ...(s.alerte_concentration
          ? [{ titre: 'Concentration sectorielle', severite: 'HAUTE' as const, detail: `>${partReseau}% de l'encours réseau — seuil BCEAO 30%` }]
          : []),
        ...(s.par_30j_pct > 10
          ? [{ titre: 'PAR secteur > 10%', severite: 'CRITIQUE' as const, detail: 'Rapport trimestriel impacté si non corrigé avant juillet' }]
          : []),
        ...(s.croissance_mensuelle_pct < 0
          ? [{ titre: 'Croissance négative', severite: 'MODEREE' as const, detail: `${s.croissance_mensuelle_pct}% ce mois — surveiller attrition` }]
          : []),
      ],
    }
  })
}

export const SECTEURS_DETAIL: SecteurDetail[] = buildSecteurDetails()

export function getSecteurBySlug(slug: string): SecteurDetail | undefined {
  return SECTEURS_DETAIL.find(s => s.slug === slug)
}

export function getSousSecteurBySlug(secteurSlug: string, sousSlug: string): { secteur: SecteurDetail; sous: SousSecteurDetail } | undefined {
  const secteur = getSecteurBySlug(secteurSlug)
  if (!secteur) return undefined
  const sous = secteur.sous_secteurs_detail.find(ss => ss.slug === sousSlug)
  if (!sous) return undefined
  return { secteur, sous }
}

const AGENTS_BASE = RESEAU_CONSOLIDE.agents_performance

export const AGENTS_DG: AgentDetailDG[] = [
  {
    id: 'agent-kofi-amavi',
    nom: 'Kofi Amavi',
    agence_id: 'AG-001',
    agence: 'Lomé Centre',
    responsable_agence: 'Kofi Amavi',
    rang: 1,
    badge: 'OR',
    score: 96,
    visites: 0,
    collecte: 19_940_000,
    recouvrement: 96.2,
    par: 5.9,
    objectifs: { visites: 0, collecte: 4_500_000, recouvrement: 94, nouveaux_clients: 6, decaissements: 5 },
    realise: { visites: 0, collecte: 4_120_000, recouvrement: 96.2, nouveaux_clients: 5, decaissements: 4 },
    historique_6m: [
      { mois: 'Déc', collecte: 3_680_000, visites: 0, recouvrement: 93.1 },
      { mois: 'Jan', collecte: 3_820_000, visites: 0, recouvrement: 94.2 },
      { mois: 'Fév', collecte: 3_950_000, visites: 0, recouvrement: 94.8 },
      { mois: 'Mar', collecte: 4_010_000, visites: 0, recouvrement: 95.4 },
      { mois: 'Avr', collecte: 4_080_000, visites: 0, recouvrement: 95.8 },
      { mois: 'Mai', collecte: 4_120_000, visites: 0, recouvrement: 96.2 },
    ],
    ia_analyse: 'Responsable Lomé Centre — 300 clients agence. 2 commerciaux (170 + 130 clients par zone terrain) + 1 GP (300 clients, suivi crédit). Collecte agence 92 %, PAR 5,9 %.',
    points_forts: ['300 clients — répartition terrain cohérente', 'Double vue commerciale / GP opérationnelle', 'Yawo Adjavon — référence commercial'],
    points_attention: ['Mensah Kodjo — couverture zone Tokoin faible', 'Aligner relances GP et visites commerciaux', 'Valider décaissements en attente'],
    clients_portefeuille: 300,
    clients_a_risque: 22,
    gps_conformite_pct: 88,
    streak_jours: 0,
    derniere_visite: 'Pilotage agence',
  },
  {
    id: 'agent-akua-lawson',
    nom: 'Akua Lawson',
    agence_id: 'AG-002',
    agence: 'Adidogomé',
    responsable_agence: 'Akua Lawson',
    rang: 3,
    badge: 'BRONZE',
    score: 84,
    visites: 0,
    collecte: 11_500_000,
    recouvrement: 88.4,
    par: 9.1,
    objectifs: { visites: 0, collecte: 4_500_000, recouvrement: 92, nouveaux_clients: 5, decaissements: 4 },
    realise: { visites: 0, collecte: 3_680_000, recouvrement: 88.4, nouveaux_clients: 3, decaissements: 3 },
    historique_6m: [
      { mois: 'Déc', collecte: 3_420_000, visites: 0, recouvrement: 85.2 },
      { mois: 'Jan', collecte: 3_510_000, visites: 0, recouvrement: 86.1 },
      { mois: 'Fév', collecte: 3_580_000, visites: 0, recouvrement: 87.0 },
      { mois: 'Mar', collecte: 3_620_000, visites: 0, recouvrement: 87.8 },
      { mois: 'Avr', collecte: 3_650_000, visites: 0, recouvrement: 88.0 },
      { mois: 'Mai', collecte: 3_680_000, visites: 0, recouvrement: 88.4 },
    ],
    ia_analyse: 'Responsable Adidogomé — pilotage agence (150 clients). Équipe : Enyonam Kpade + Abla Tchalla (commerciaux) + Sena Dossou (GP suivi crédit). PAR 9,1 % — proche seuil BCEAO.',
    points_forts: ['Amélioration continue sur 6 mois', 'Bonne conversion leads (33%)', 'Binôme 2 commerciaux / GP opérationnel'],
    points_attention: ['3 dossiers défaut actif', 'PAR groupe 10.8%', 'Audit trail incomplet', 'Aligner visites COM et relances GP'],
    clients_portefeuille: 150,
    clients_a_risque: 12,
    gps_conformite_pct: 91,
    streak_jours: 0,
    derniere_visite: 'Pilotage agence',
  },
  {
    id: 'agent-edem-kpelim',
    nom: 'Edem Kpélim',
    agence_id: 'AG-003',
    agence: 'Bè Kpota',
    responsable_agence: 'Edem Kpélim',
    rang: 5,
    badge: null,
    score: 62,
    visites: 0,
    collecte: 2_980_000,
    recouvrement: 62.3,
    par: 11.2,
    objectifs: { visites: 0, collecte: 3_800_000, recouvrement: 90, nouveaux_clients: 4, decaissements: 3 },
    realise: { visites: 0, collecte: 2_980_000, recouvrement: 62.3, nouveaux_clients: 2, decaissements: 2 },
    historique_6m: [
      { mois: 'Déc', collecte: 3_200_000, visites: 0, recouvrement: 71.4 },
      { mois: 'Jan', collecte: 3_100_000, visites: 0, recouvrement: 68.2 },
      { mois: 'Fév', collecte: 3_050_000, visites: 0, recouvrement: 65.8 },
      { mois: 'Mar', collecte: 3_020_000, visites: 0, recouvrement: 64.1 },
      { mois: 'Avr', collecte: 3_000_000, visites: 0, recouvrement: 63.2 },
      { mois: 'Mai', collecte: 2_980_000, visites: 0, recouvrement: 62.3 },
    ],
    ia_analyse: 'Responsable Bè Kpota — pilotage agence en situation critique (PAR 11,2 %). Équipe : Afi Lawson + Kofi Senyo (commerciaux) + Kossi Adjavon (GP). Recouvrement RA à 62,3 %.',
    points_forts: ['Connaissance terrain quartier Bè', 'Commerciaux Afi Lawson et Kofi Senyo en prospection active'],
    points_attention: ['Anomalies GPS GP', 'PAR 11,2 %', 'Coordination COM/GP insuffisante', 'Clients perdus ce mois'],
    clients_portefeuille: 212,
    clients_a_risque: 25,
    gps_conformite_pct: 54,
    streak_jours: 0,
    derniere_visite: 'Pilotage agence',
  },
  {
    id: 'agent-komi-atsu',
    nom: 'Komi Atsu',
    agence_id: 'AG-004',
    agence: 'Hédzranawoé',
    responsable_agence: 'Komi Atsu',
    rang: 2,
    badge: 'ARGENT',
    score: 79,
    visites: 0,
    collecte: 1_520_000,
    recouvrement: 92.3,
    par: 6.1,
    objectifs: { visites: 0, collecte: 2_500_000, recouvrement: 91, nouveaux_clients: 3, decaissements: 2 },
    realise: { visites: 0, collecte: 1_520_000, recouvrement: 92.3, nouveaux_clients: 2, decaissements: 1 },
    historique_6m: [
      { mois: 'Déc', collecte: 1_180_000, visites: 0, recouvrement: 89.1 },
      { mois: 'Jan', collecte: 1_250_000, visites: 0, recouvrement: 90.2 },
      { mois: 'Fév', collecte: 1_320_000, visites: 0, recouvrement: 91.0 },
      { mois: 'Mar', collecte: 1_380_000, visites: 0, recouvrement: 91.6 },
      { mois: 'Avr', collecte: 1_450_000, visites: 0, recouvrement: 92.0 },
      { mois: 'Mai', collecte: 1_520_000, visites: 0, recouvrement: 92.3 },
    ],
    ia_analyse: 'Responsable Hédzranawoé — pilotage agence (153 clients). Équipe : Elom Komlavi + Abla Kpodar (commerciaux) + Mawu Hotor (GP suivi crédit). PAR 6,1 % solide.',
    points_forts: ['PAR sous contrôle', 'Progression collecte +29% sur 6 mois', 'Double couverture commerciale + GP'],
    points_attention: ['Collecte sous objectif', 'Synchroniser relances GP et visites COM'],
    clients_portefeuille: 153,
    clients_a_risque: 8,
    gps_conformite_pct: 94,
    streak_jours: 0,
    derniere_visite: 'Pilotage agence',
  },
  {
    id: 'agent-ama-fiagbe',
    nom: 'Ama Fiagbé',
    agence_id: 'AG-005',
    agence: 'Kpalimé',
    responsable_agence: 'Ama Fiagbé',
    rang: 4,
    badge: 'OR',
    score: 91,
    visites: 0,
    collecte: 680_000,
    recouvrement: 97.1,
    par: 4.2,
    objectifs: { visites: 0, collecte: 1_200_000, recouvrement: 95, nouveaux_clients: 5, decaissements: 4 },
    realise: { visites: 0, collecte: 680_000, recouvrement: 97.1, nouveaux_clients: 4, decaissements: 3 },
    historique_6m: [
      { mois: 'Déc', collecte: 420_000, visites: 0, recouvrement: 94.2 },
      { mois: 'Jan', collecte: 480_000, visites: 0, recouvrement: 95.4 },
      { mois: 'Fév', collecte: 540_000, visites: 0, recouvrement: 96.1 },
      { mois: 'Mar', collecte: 590_000, visites: 0, recouvrement: 96.5 },
      { mois: 'Avr', collecte: 640_000, visites: 0, recouvrement: 96.8 },
      { mois: 'Mai', collecte: 680_000, visites: 0, recouvrement: 97.1 },
    ],
    ia_analyse: 'Responsable Kpalimé — pilotage agence (90 clients). Équipe : Selom Agbeko + Komla Adzro (commerciaux) + Akoue Yawa (GP suivi crédit). Meilleur PAR réseau 4,2 %.',
    points_forts: ['Meilleur PAR réseau', 'Conversion leads 57%', 'Modèle RA + 2 COM + GP pilote'],
    points_attention: ['Objectif collecte ambitieux', 'Documenter bonnes pratiques binôme COM/GP'],
    clients_portefeuille: 90,
    clients_a_risque: 3,
    gps_conformite_pct: 97,
    streak_jours: 0,
    derniere_visite: 'Pilotage agence',
  },
]

/** Membres clés du siège — vue DG (hors agences) */
export type RoleDirection = 'DEC' | 'DC' | 'DAF' | 'AUDIT'

export interface MembreDirectionDG {
  id: string
  nom: string
  role: RoleDirection
  role_label: string
  domaine: string
  kpi_principal: { label: string; valeur: string; statut: 'OK' | 'ALERTE' | 'TENSION' }
  kpi_secondaire: { label: string; valeur: string }
  synthese: string
  action_prioritaire: string
  onglet_lie?: 'CREDIT' | 'COMMERCIAL' | 'FINANCIER' | 'OPERATIONNEL'
}

export const EQUIPE_DIRECTION_DG: MembreDirectionDG[] = [
  {
    id: 'kafui-agbeko',
    nom: 'Kafui Agbeko',
    role: 'DEC',
    role_label: 'Resp. Opérations & Crédit (DEC / ROC)',
    domaine: 'Pipeline crédit · validations · risque CBI',
    kpi_principal: { label: 'Dossiers attente ROC', valeur: '4', statut: 'ALERTE' },
    kpi_secondaire: { label: 'Délai traitement moy.', valeur: '4,2 j' },
    synthese: '4 dossiers > 48 h dont DOS-2412 (2,4 M). 3 dépôts pré-RDV suspects à investiguer.',
    action_prioritaire: 'Valider dossiers ROC bloqués · enquête fraude crédit 48 h',
    onglet_lie: 'CREDIT',
  },
  {
    id: 'efua-mensah',
    nom: 'Efua Mensah',
    role: 'DC',
    role_label: 'Resp. Commerciale & Collecte (DC / RCC)',
    domaine: 'Collecte réseau · prospection · performance terrain',
    kpi_principal: { label: 'Collecte vs objectif', valeur: '76,9 %', statut: 'TENSION' },
    kpi_secondaire: { label: 'Agents terrain actifs', valeur: '7 / 7' },
    synthese: '2 agents sous-perf. (Mensah 48 %, Kossi GPS). Adakpamé −11 % vs semaine dernière.',
    action_prioritaire: 'Coaching Mensah Tokoin · audit GPS Kossi Bè Kpota',
    onglet_lie: 'COMMERCIAL',
  },
  {
    id: 'komlan-afavi',
    nom: 'Komlan Afavi',
    role: 'DAF',
    role_label: 'Directeur Administratif & Financier',
    domaine: 'Trésorerie · bilan · budget · rentabilité',
    kpi_principal: { label: 'Ratio liquidité', valeur: '1,84×', statut: 'OK' },
    kpi_secondaire: { label: 'Marge nette réseau', valeur: '21,4 %' },
    synthese: 'Trésorerie stable (380 M). Tension Hédzranawoé (1,2×). Clôture mensuelle J-7 — 3 comptes en anomalie.',
    action_prioritaire: 'Transfert liquidité Hédzranawoé · rapprochement 471/512',
    onglet_lie: 'FINANCIER',
  },
  {
    id: 'sena-fiagbe',
    nom: 'Séna Fiagbé',
    role: 'AUDIT',
    role_label: 'Auditeur interne · Conformité BCEAO',
    domaine: 'Fraude · audit trail · rapport réglementaire',
    kpi_principal: { label: 'Score conformité', valeur: '76 / 100', statut: 'TENSION' },
    kpi_secondaire: { label: 'Anomalies actives', valeur: '14 (3 crit.)' },
    synthese: 'Rapport BCEAO J-8 · 3 ratios NC. GPS réseau 94 %. Schéma décaissements Hédzranawoé 2,4 M.',
    action_prioritaire: 'Finaliser rapport BCEAO · mission audit Kara',
    onglet_lie: 'OPERATIONNEL',
  },
]

export function getAgentById(id: string): AgentDetailDG | undefined {
  return AGENTS_DG.find(a => a.id === id)
}

export function agentNomToId(nom: string): string {
  return `agent-${toSlug(nom)}`
}

// ─── Insights opérationnels du jour (DG) — sans doublon avec le Rapport IA ───

export interface InsightOperationnelJour {
  titre: string
  detail: string
  type: 'ALERTE' | 'OPPORTUNITE' | 'ACTION' | 'PREVISION'
  confidence: number
  impact: 'CRITIQUE' | 'ELEVE' | 'MODERE' | 'INFO'
  acteur?: string
  detecte_il_y_a: string
  delai: string
}

/** Réseau — actions et incidents du jour uniquement (pas de synthèse stratégique) */
export const INSIGHTS_OPERATIONNELS_RESEAU: InsightOperationnelJour[] = [
  {
    titre: '12 leads WhatsApp non assignés',
    detail: 'Le chatbot a qualifié 12 prospects depuis hier 18h. Aucun agent ne les a encore pris en charge — risque de perte de contact sous 24h.',
    type: 'ACTION',
    confidence: 94,
    impact: 'ELEVE',
    acteur: 'DC · agents Adidogomé & Bè Kpota',
    detecte_il_y_a: 'il y a 14 h',
    delai: 'Avant 12h aujourd\'hui',
  },
  {
    titre: 'Cash Bè Kpota sous le minimum réglementaire',
    detail: 'Solde caisse 980k FCFA pour un minimum requis de 1,2M. Virement siège de 2M recommandé pour éviter le blocage des décaissements de l\'après-midi.',
    type: 'ALERTE',
    confidence: 99,
    impact: 'CRITIQUE',
    acteur: 'DAF · trésorerie',
    detecte_il_y_a: 'il y a 35 min',
    delai: 'Avant 10h',
  },
  {
    titre: '4 dossiers en attente ROC > 48 h',
    detail: 'Montant cumulé 2,4M FCFA bloqué en validation finale. Délai moyen actuel : 52 h (objectif 48 h).',
    type: 'ACTION',
    confidence: 91,
    impact: 'ELEVE',
    acteur: 'ROC · DEC',
    detecte_il_y_a: 'il y a 2 j',
    delai: 'Aujourd\'hui',
  },
  {
    titre: '24 transactions Mobile Money à valider manuellement',
    detail: 'Échec réconciliation auto sur lot MTN de 11h42. Les encaissements terrain ne sont pas encore reflétés dans les soldes agents.',
    type: 'ACTION',
    confidence: 88,
    impact: 'MODERE',
    acteur: 'Opérations · compta',
    detecte_il_y_a: 'il y a 1 h',
    delai: 'Avant clôture journée',
  },
  {
    titre: 'Dossier GIE Femmes Marché bloqué 96 h',
    detail: 'Validation direction en attente — responsable en mission. Client a relancé par WhatsApp ce matin.',
    type: 'ALERTE',
    confidence: 86,
    impact: 'ELEVE',
    acteur: 'DEC · direction déléguée',
    detecte_il_y_a: 'il y a 4 h',
    delai: 'Sous 6 h',
  },
  {
    titre: 'Collecte réseau à 76 % — écart 3,7M FCFA',
    detail: 'Il reste 9 jours ouvrés dans le mois. Rattrapage possible si 60 % des échéances de la semaine 3 sont honorées (probabilité IA 67 %).',
    type: 'PREVISION',
    confidence: 79,
    impact: 'MODERE',
    acteur: 'Tous RA · agents terrain',
    detecte_il_y_a: 'mise à jour 06:00',
    delai: 'Semaine en cours',
  },
]

export const INSIGHTS_OPERATIONNELS_PAR_AGENCE: Record<string, InsightOperationnelJour[]> = {
  'AG-001': [
    {
      titre: '7 renouvellements à envoyer aujourd\'hui',
      detail: 'Propositions IA générées et prêtes — envoi WhatsApp recommandé avant 17h pour décaissement sous 48 h.',
      type: 'ACTION',
      confidence: 92,
      impact: 'ELEVE',
      acteur: 'Kofi Amavi',
      detecte_il_y_a: 'il y a 45 min',
      delai: 'Aujourd\'hui',
    },
    {
      titre: '380k FCFA pour atteindre l\'objectif collecte',
      detail: 'Collecte à 91 % (4,12M / 4,5M). 2 échéances demain avec probabilité de paiement 82 % chacune.',
      type: 'PREVISION',
      confidence: 84,
      impact: 'MODERE',
      acteur: 'Kofi Amavi',
      detecte_il_y_a: 'mise à jour 06:00',
      delai: '48 h',
    },
    {
      titre: '2 visites reportées hier non reprogrammées',
      detail: 'Clients Adakpamé et Tokoin — à replanifier par Mensah Kodjo (zone Tokoin).',
      type: 'ACTION',
      confidence: 90,
      impact: 'MODERE',
      acteur: 'Mensah Kodjo · Commercial',
      detecte_il_y_a: 'il y a 18 h',
      delai: 'Aujourd\'hui',
    },
  ],
  'AG-002': [
    {
      titre: '3 dossiers en défaut actif — visites non planifiées',
      detail: 'Aucune visite terrain enregistrée sur ces dossiers depuis 8 jours. Comité crédit attend un point cette semaine.',
      type: 'ACTION',
      confidence: 93,
      impact: 'ELEVE',
      acteur: 'Sena Dossou · GP',
      detecte_il_y_a: 'il y a 3 h',
      delai: 'Cette semaine',
    },
    {
      titre: '2 saisies sans horodatage audit trail',
      detail: 'Dossiers crédit groupe enregistrés hier 16h–17h sans trace horaire complète — à corriger avant export BCEAO.',
      type: 'ALERTE',
      confidence: 87,
      impact: 'MODERE',
      acteur: 'Akua Lawson · IT',
      detecte_il_y_a: 'il y a 20 h',
      delai: '24 h',
    },
    {
      titre: '5 leads zone Adidogomé non contactés',
      detail: 'Attribués hier matin — aucun appel ou visite enregistrée.',
      type: 'ACTION',
      confidence: 89,
      impact: 'MODERE',
      acteur: 'Sena Dossou · GP',
      detecte_il_y_a: 'il y a 1 j',
      delai: 'Aujourd\'hui',
    },
  ],
  'AG-003': [
    {
      titre: 'Virement trésorerie 2M — urgent',
      detail: 'Caisse agence insuffisante pour 480k de décaissements prévus cet après-midi.',
      type: 'ALERTE',
      confidence: 99,
      impact: 'CRITIQUE',
      acteur: 'DAF · Edem Kpélim',
      detecte_il_y_a: 'il y a 35 min',
      delai: 'Avant 10h',
    },
    {
      titre: '4 impayés prioritaires — tournée GP non démarrée',
      detail: 'Tournée IA du jour : 4 visites recouvrement à risque élevé. Kossi Adjavon (GP) — aucune visite GPS validée avant 11h.',
      type: 'ACTION',
      confidence: 91,
      impact: 'CRITIQUE',
      acteur: 'Kossi Adjavon · GP terrain',
      detecte_il_y_a: 'il y a 2 h',
      delai: 'Aujourd\'hui',
    },
    {
      titre: '8 messages clients WhatsApp non lus',
      detail: 'Délai de réponse moyen agence : 9 h (objectif < 2 h). 3 clients en retard — relance RA Edem Kpélim.',
      type: 'ACTION',
      confidence: 88,
      impact: 'ELEVE',
      acteur: 'Edem Kpélim · RA',
      detecte_il_y_a: 'il y a 6 h',
      delai: 'Avant 18h',
    },
  ],
  'AG-004': [
    {
      titre: '3 visites reportées à rattraper demain',
      detail: 'Objectif visites du mois à 80 % (32/40). Planning IA propose 3 créneaux demain 8h–12h.',
      type: 'ACTION',
      confidence: 85,
      impact: 'MODERE',
      acteur: 'Komi Atsu',
      detecte_il_y_a: 'hier 17h',
      delai: 'Demain matin',
    },
    {
      titre: '980k FCFA d\'écart collecte vs objectif',
      detail: 'Collecte à 61 % avec 9 jours restants — revoir calendrier ou ajuster objectif avec la direction.',
      type: 'PREVISION',
      confidence: 82,
      impact: 'MODERE',
      acteur: 'Komi Atsu · RA',
      detecte_il_y_a: 'mise à jour 06:00',
      delai: 'Semaine en cours',
    },
  ],
  'AG-005': [
    {
      titre: '3 prospects chauds sans RDV planifié',
      detail: 'Qualifiés par WA hier soir (scores 78, 81, 74). Aucun créneau réservé dans l\'agenda agent.',
      type: 'ACTION',
      confidence: 90,
      impact: 'ELEVE',
      acteur: 'Ama Fiagbé',
      detecte_il_y_a: 'il y a 12 h',
      delai: 'Aujourd\'hui',
    },
    {
      titre: 'Décaissement 850k en attente signature',
      detail: 'Dossier validé comité — signature direction manquante depuis hier.',
      type: 'ACTION',
      confidence: 94,
      impact: 'ELEVE',
      acteur: 'DEC · Ama Fiagbé',
      detecte_il_y_a: 'il y a 22 h',
      delai: 'Aujourd\'hui',
    },
    {
      titre: '1 client éligible renouvellement 750k',
      detail: 'Ama Kpodaho — score 92. Proposition IA prête, non encore envoyée.',
      type: 'OPPORTUNITE',
      confidence: 89,
      impact: 'MODERE',
      acteur: 'Ama Fiagbé',
      detecte_il_y_a: 'il y a 1 h',
      delai: 'Cette semaine',
    },
  ],
}

export function getInsightsOperationnelsJour(agenceId: string | null): InsightOperationnelJour[] {
  if (agenceId && INSIGHTS_OPERATIONNELS_PAR_AGENCE[agenceId]) {
    return INSIGHTS_OPERATIONNELS_PAR_AGENCE[agenceId]
  }
  return INSIGHTS_OPERATIONNELS_RESEAU
}
