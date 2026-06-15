/** Hub épargne opérationnelle — comptes, produits, mouvements, tontines + vue DG */

import type { RapportIA } from '@/lib/mockMicrofinance'
import { EPARGNE_STATS } from '@/lib/mockMicrofinance'
import type { AuthUser } from '@/lib/auth'
import {
  getAllComptesEpargne,
  getDormantsFromComptes,
  getMouvementsEpargne,
  getProduitsFromComptes,
  getProfilsClientsEpargne,
  getTontinesFromComptes,
} from '@/lib/epargne-registry'

const AGENCE_NOMS = ['Lomé Centre', 'Adidogomé', 'Bè Kpota', 'Hédzranawoé', 'Kpalimé'] as const

const ROLES_EPARGNE_PERIMETRE_AGENCE = new Set([
  'GESTIONNAIRE_PORTEFEUILLE',
  'GESTIONNAIRE',
  'COLLECTRICE',
  'AGENT_TERRAIN',
  'COMMERCIAL',
  'RELANCE',
])

function fmtM(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2).replace('.', ',')}M` : `${Math.round(n / 1000)}k`
}

export function resolveAgenceNomFromZone(zone?: string): string | null {
  if (!zone) return null
  for (const nom of AGENCE_NOMS) {
    if (zone.includes(nom)) return nom
  }
  return null
}

function buildSyntheseIaEpargneAgence(
  agenceNom: string,
  kpis: EpargneHub['kpis'],
  dormantsPrioritaires: number,
  crossSellCount: number,
): string {
  const croissance = agenceNom === 'Lomé Centre' ? 12 : agenceNom === 'Kpalimé' ? 18 : 6
  return (
    `L'épargne **agence ${agenceNom}** progresse de +${croissance} % sur le mois — ${kpis.comptes_actifs} comptes actifs pour ${fmtM(kpis.encours_total_fcfa)} FCFA d'encours. ` +
    `${kpis.comptes_dormants} comptes dormants (${fmtM(kpis.comptes_dormants * kpis.ticket_moyen_fcfa * 0.4)} estimés à réactiver). ` +
    `Flux net jour ${fmtM(kpis.flux_net_jour_fcfa)} · ${Math.round(kpis.ratio_momo_pct)} % des dépôts via Mobile Money. ` +
    (crossSellCount > 0
      ? `${crossSellCount} client(s) du portefeuille éligibles au crédit garanti épargne — priorité cross-sell GP. `
      : '') +
    (dormantsPrioritaires > 0
      ? `Relancer ${Math.min(3, dormantsPrioritaires)} dormants prioritaires cette semaine. `
      : '') +
    `Liquidité guichet : maintenir le tampon caisse agence avant les pics retraits mardi–jeudi.`
  )
}

const _comptes = getAllComptesEpargne()

export type TypeCompteEpargne = 'VUE' | 'BLOQUE' | 'TONTINE' | 'DAT'

export interface CompteEpargne {
  id: string
  client: string
  numero: string
  type: TypeCompteEpargne
  solde_fcfa: number
  objectif_fcfa?: number
  taux_pct?: number
  agence: string
  statut: 'ACTIF' | 'DORMANT' | 'BLOQUE'
  dernier_mouvement: string
  score_ia: number
}

export interface MouvementEpargne {
  id: string
  date: string
  compte_id: string
  client: string
  type: 'DEPOT' | 'RETRAIT' | 'INTERET' | 'FRAIS'
  montant_fcfa: number
  solde_apres: number
  canal: 'CAISSE' | 'MOMO' | 'VIREMENT'
}

export interface ProduitEpargne {
  id: string
  nom: string
  type: TypeCompteEpargne
  taux_annuel_pct: number
  depot_min_fcfa: number
  clients_actifs: number
  encours_fcfa: number
  /** Description métier pour la direction */
  description: string
  profil_cible: string
  duree: string
  /** Libellé taux affiché (ex. « 8,5 % / an » ou « Rotation ») */
  taux_label: string
  /** Sous-produits ou variantes incluses */
  variantes?: string[]
  croissance_pct: number
}

export interface ProfilClientEpargne {
  id: string
  label: string
  comptes: number
  encours_fcfa: number
  pct_encours: number
  color: string
  description: string
}

export interface TontineCycle {
  id: string
  nom: string
  agence: string
  membres: number
  encours_fcfa: number
  cycle_num: number
  statut: 'ACTIF' | 'CLOTURE_IMMINENTE' | 'RETARD'
  prochaine_cloture: string
  collecte_pct: number
  alerte?: string
}

export interface CompteDormant {
  id: string
  client: string
  agence: string
  solde_fcfa: number
  dernier_mouvement: string
  jours_inactif: number
  potentiel_fcfa: number
  action_ia: string
}

export interface CrossSellEpargne {
  client: string
  agence: string
  solde_epargne: number
  montant_credit_eligible: number
  score_risque: number
}

export interface EpargneHub {
  synthese_ia: string
  kpis: {
    encours_total_fcfa: number
    comptes_actifs: number
    comptes_dormants: number
    depots_jour_fcfa: number
    retraits_jour_fcfa: number
    flux_net_jour_fcfa: number
    ticket_moyen_fcfa: number
    croissance_30j_pct: number
    ratio_momo_pct: number
    liquidite_couverture_jours: number
  }
  comptes: CompteEpargne[]
  mouvements: MouvementEpargne[]
  produits: ProduitEpargne[]
  profils_clients: ProfilClientEpargne[]
  evolution_mensuelle: Array<{ mois: string; encours: number; depots: number; retraits: number }>
  par_agence: Array<{ agence_id: string; nom: string; comptes: number; encours: number; dormants: number; croissance_pct: number }>
  par_canal: Array<{ canal: string; depots_pct: number; retraits_pct: number; volume_fcfa: number; color: string }>
  tontines: TontineCycle[]
  dormants_prioritaires: CompteDormant[]
  cross_sell: CrossSellEpargne[]
  liquidite: {
    encours_epargne: number
    reserves_obligatoires: number
    liquidite_disponible: number
    risque_retraits_semaine: 'FAIBLE' | 'MODERE' | 'ELEVE'
    alerte_liquidite?: string
  }
  ia_insights: Array<{ titre: string; detail: string; type: 'ALERTE' | 'OPPORTUNITE' | 'ACTION' | 'PREVISION'; confidence: number; impact: 'CRITIQUE' | 'ELEVE' | 'MODERE' | 'INFO' }>
}

export const RAPPORT_IA_EPARGNE: RapportIA = {
  date_generation: '28/05/2026 à 06:00',
  periode: 'Mai 2026 — Épargne réseau 5 agences',
  destinataire: 'Directeur Général',
  synthese_executive:
    'L\'épargne réseau progresse de +8,4 % sur le mois — signal de confiance client malgré le contexte PAR à Bè Kpota. Le vrai levier de valeur n\'est pas l\'ouverture de nouveaux comptes (+3 ce mois) mais la réactivation des 51 dormants (6,2 M FCFA immobilisés) et le cross-sell crédit garanti (38 clients éligibles, 12 M FCFA de décaissements à risque minimal). Deux tontines Bè Kpota arrivent à échéance cette semaine : clôture critique pour la liquidité locale. Le canal Mobile Money représente 68 % des dépôts — opportunité de réduire la fraude caisse, mais risque de retraits massifs mardi–jeudi (historique +42 % vs moyenne). Maintenir +800 k FCFA de liquidité tampon en caisse réseau.',
  synthese_piliers: [
    {
      titre: 'Croissance & rétention',
      contenu:
        '287 comptes actifs, encours 47,8 M FCFA (+8,4 % vs avril). La croissance est portée par Lomé Centre (+12 %) et Kpalimé pilote (+18 %). Bè Kpota stagne (+1,2 %) — corrélation avec le PAR élevé : les clients épargnent moins quand le recouvrement est agressif. Ticket moyen 166 550 FCFA, en hausse de 4 % — signe que les gros épargnants restent fidèles.',
    },
    {
      titre: 'Dormants & réactivation',
      contenu:
        '51 comptes sans mouvement > 6 mois (17,8 % du parc). Potentiel de réactivation estimé à 8 M FCFA sur 90 jours via campagne WhatsApp ciblée + visite agent. Coût marginal quasi nul vs prospection. Les 14 comptes scolaires dormants avant rentrée septembre sont une priorité commerciale.',
    },
    {
      titre: 'Produits & tontines',
      contenu:
        'DAT 6 mois (8,5 %/an) concentre 59 % de l\'encours — produit d\'ancrage. Tontines : 47 groupes, 6,8 M FCFA, 2 cycles à clôturer à Bè Kpota cette semaine. Épargne bloquée crédit sous-utilisée (246 clients seulement) — levier de garantie crédit non exploité.',
    },
    {
      titre: 'Liquidité & canaux',
      contenu:
        'Flux net mensuel +11,6 M FCFA. Couverture liquidité : 18 jours de retraits moyens. Risque modéré mardi–jeudi (pic MoMo historique). 68 % dépôts via Mobile Money vs 23 % espèces — traçabilité améliorée, fraude caisse réduite de 8 M FCFA/an estimés.',
    },
  ],
  chiffres_cles: [
    { label: 'Encours épargne', valeur: '47,8 M FCFA', tendance: 'HAUSSE', commentaire: '+8,4 % vs avril' },
    { label: 'Comptes actifs', valeur: '287', tendance: 'HAUSSE', commentaire: '+3 ce mois' },
    { label: 'Dormants >6 mois', valeur: '51', tendance: 'BAISSE', commentaire: '-4 vs mars' },
    { label: 'Flux net mensuel', valeur: '+11,6 M', tendance: 'HAUSSE', commentaire: 'Dépôts - retraits' },
    { label: 'Ticket moyen', valeur: '166 550 FCFA', tendance: 'HAUSSE', commentaire: '+4 % vs T1' },
    { label: 'Cross-sell éligible', valeur: '38 clients', tendance: 'STABLE', commentaire: '12 M FCFA crédit garanti' },
  ],
  points_forts: [
    'Croissance encours +8,4 % — meilleure performance depuis T4 2025',
    'Kpalimé pilote : +18 % encours en 6 mois — modèle à répliquer',
    'Mobile Money 68 % des dépôts — réduction fraude et traçabilité BCEAO',
    'DAT 8,5 % : produit compétitif vs banques locales (6–7 %)',
    'Aucun retrait massif anormal détecté ce mois (vs 2 alertes en avril)',
  ],
  points_attention: [
    { titre: '51 comptes dormants — fuite de valeur', detail: '6,2 M FCFA immobilisés sans mouvement > 6 mois. Campagne réactivation à lancer avant fin juin.', severite: 'HAUTE' },
    { titre: 'Tontines Bè Kpota — clôture imminente', detail: '2 cycles (890 k + 620 k FCFA) à clôturer cette semaine. Risque tension liquidité locale.', severite: 'CRITIQUE' },
    { titre: 'Risque retraits MoMo mardi–jeudi', detail: 'Historique +42 % retraits vs moyenne. Maintenir liquidité caisse +800 k FCFA.', severite: 'MODEREE' },
    { titre: 'Épargne bloquée crédit sous-utilisée', detail: 'Seulement 246 clients vs 287 comptes — garanties crédit non systématisées.', severite: 'MODEREE' },
  ],
  recommandations: [
    { priorite: 1, action: 'Clôturer 2 tontines Bè Kpota cette semaine + provisionner liquidité locale 800 k FCFA', impact_estime: 'Stabilité trésorerie agence', delai: 'Avant 02/06/2026' },
    { priorite: 1, action: 'Lancer campagne réactivation 51 dormants (WhatsApp + visite agent ciblée)', impact_estime: '+8 M FCFA encours', delai: 'Juin 2026' },
    { priorite: 2, action: 'Proposer microcrédit garanti épargne aux 38 clients éligibles (1,5× solde)', impact_estime: '+12 M FCFA décaissements', delai: 'Juin-juillet 2026' },
    { priorite: 2, action: 'Promouvoir épargne bloquée crédit auprès des 41 nouveaux clients crédit', impact_estime: 'Réduction PAR -0,8 pt', delai: 'Q3 2026' },
    { priorite: 3, action: 'Recalibrer objectifs collecte épargne Hédzranawoé et Kpalimé sur capacité réelle', impact_estime: 'KPIs plus réalistes', delai: 'Juin 2026' },
  ],
  previsions_30j: [
    { metrique: 'Encours épargne', valeur_actuelle: '47,8 M', valeur_prevue: '51,2 M', confidence: 84 },
    { metrique: 'Comptes actifs', valeur_actuelle: '287', valeur_prevue: '298', confidence: 86 },
    { metrique: 'Dormants', valeur_actuelle: '51', valeur_prevue: '38', confidence: 79 },
    { metrique: 'Flux net mensuel', valeur_actuelle: '11,6 M', valeur_prevue: '13,4 M', confidence: 77 },
    { metrique: 'Cross-sell décaissé', valeur_actuelle: '0', valeur_prevue: '4,2 M', confidence: 72 },
  ],
  alertes_immediates: [
    '⚠ 2 tontines Bè Kpota à clôturer cette semaine (1,51 M FCFA)',
    '⚠ 51 comptes dormants — campagne réactivation recommandée',
    'ℹ Pic retraits MoMo attendu mardi–jeudi (+42 % historique)',
    'ℹ 38 clients éligibles crédit garanti épargne — opportunité 12 M FCFA',
  ],
  comparaison_mois_precedent: [
    { metrique: 'Encours', mois_precedent: '44,1 M FCFA', mois_courant: '47,8 M FCFA', variation_pct: 8.4 },
    { metrique: 'Comptes', mois_precedent: '284', mois_courant: '287', variation_pct: 1.1 },
    { metrique: 'Dépôts', mois_precedent: '17,1 M', mois_courant: '18,4 M', variation_pct: 7.6 },
    { metrique: 'Retraits', mois_precedent: '7,0 M', mois_courant: '6,8 M', variation_pct: -2.9 },
    { metrique: 'Dormants', mois_precedent: '55', mois_courant: '51', variation_pct: -7.3 },
  ],
  signature_ia: 'Prospera AI v2.4 — Rapport épargne généré à 06:00 — Précision modèle épargne 89,1 %',
}

export const EPARGNE_HUB: EpargneHub = {
  synthese_ia: RAPPORT_IA_EPARGNE.synthese_executive,
  kpis: {
    encours_total_fcfa: EPARGNE_STATS.encours_epargne_total,
    comptes_actifs: EPARGNE_STATS.total_comptes,
    comptes_dormants: EPARGNE_STATS.dormants,
    depots_jour_fcfa: 1_240_000,
    retraits_jour_fcfa: 580_000,
    flux_net_jour_fcfa: 660_000,
    ticket_moyen_fcfa: EPARGNE_STATS.ticket_moyen,
    croissance_30j_pct: EPARGNE_STATS.flux_mois.croissance_pct,
    ratio_momo_pct: 68,
    liquidite_couverture_jours: 18,
  },
  comptes: _comptes,
  mouvements: getMouvementsEpargne(_comptes),
  produits: getProduitsFromComptes(_comptes),
  profils_clients: getProfilsClientsEpargne(),
  evolution_mensuelle: EPARGNE_STATS.evolution_12_mois.slice(-6).map(e => ({
    mois: e.mois.replace(' 26', '').replace(' 25', ''),
    encours: e.encours,
    depots: e.depots,
    retraits: e.retraits,
  })),
  par_agence: EPARGNE_STATS.par_agence.map(a => ({
    agence_id: a.agence_id,
    nom: a.nom,
    comptes: a.count,
    encours: a.encours,
    dormants: a.agence_id === 'AG-003' ? 14 : a.agence_id === 'AG-002' ? 12 : a.agence_id === 'AG-001' ? 9 : a.agence_id === 'AG-004' ? 11 : 5,
    croissance_pct: a.agence_id === 'AG-005' ? 18 : a.agence_id === 'AG-001' ? 12 : a.agence_id === 'AG-003' ? 1.2 : a.agence_id === 'AG-002' ? 6.5 : 8.1,
  })),
  par_canal: [
    { canal: 'Mobile Money', depots_pct: 68, retraits_pct: 54, volume_fcfa: 12_512_000, color: '#6366f1' },
    { canal: 'Caisse', depots_pct: 23, retraits_pct: 38, volume_fcfa: 4_232_000, color: '#14b8a6' },
    { canal: 'Virement', depots_pct: 9, retraits_pct: 8, volume_fcfa: 1_656_000, color: '#f97316' },
  ],
  tontines: getTontinesFromComptes(_comptes),
  dormants_prioritaires: getDormantsFromComptes(_comptes),
  cross_sell: [
    { client: 'Sika Adjovi', agence: 'Lomé Centre', solde_epargne: 1_240_000, montant_credit_eligible: 1_860_000, score_risque: 12 },
    { client: 'Mensah Folly', agence: 'Adidogomé', solde_epargne: 720_000, montant_credit_eligible: 1_080_000, score_risque: 18 },
    { client: 'Akouvi Senou', agence: 'Kpalimé', solde_epargne: 540_000, montant_credit_eligible: 810_000, score_risque: 9 },
    { client: 'Ama Dossou', agence: 'Lomé Centre', solde_epargne: 340_000, montant_credit_eligible: 510_000, score_risque: 22 },
    { client: 'Groupe Victoire', agence: 'Hédzranawoé', solde_epargne: 680_000, montant_credit_eligible: 1_020_000, score_risque: 15 },
  ],
  liquidite: {
    encours_epargne: EPARGNE_STATS.encours_epargne_total,
    reserves_obligatoires: 4_780_000,
    liquidite_disponible: 11_100_000,
    risque_retraits_semaine: 'MODERE',
    alerte_liquidite: 'Pic retraits MoMo attendu mardi–jeudi. Maintenir +800 k FCFA tampon caisse réseau.',
  },
  ia_insights: [
    { titre: 'Réactivation dormants — ROI immédiat', detail: '51 comptes dormants = 6,2 M FCFA immobilisés. Campagne WhatsApp ciblée estimée à 180 k FCFA de coût pour +8 M FCFA encours sur 90 jours.', type: 'OPPORTUNITE', confidence: 87, impact: 'ELEVE' },
    { titre: 'Tontines Bè Kpota — action cette semaine', detail: '2 cycles totalisant 1,51 M FCFA arrivent à échéance. Sans clôture coordonnée, tension liquidité locale + risque attrition membres.', type: 'ALERTE', confidence: 94, impact: 'CRITIQUE' },
    { titre: 'Cross-sell crédit garanti — 38 éligibles', detail: 'Clients avec solde épargne > 200 k FCFA et historique crédit sain. Décaissement 1,5× solde = 12 M FCFA à risque minimal.', type: 'ACTION', confidence: 82, impact: 'ELEVE' },
    { titre: 'Prévision encours juin : 51,2 M FCFA', detail: 'Scénario base si campagne dormants lancée + cross-sell partiel. Confiance 84 %.', type: 'PREVISION', confidence: 84, impact: 'INFO' },
  ],
}

export function getEpargneHub(): EpargneHub {
  return EPARGNE_HUB
}

/** Vue épargne limitée à une agence (GP, RA, terrain…) */
export function getEpargneHubForAgence(agenceNom: string): EpargneHub {
  const base = EPARGNE_HUB
  const agenceRow = base.par_agence.find(a => a.nom === agenceNom)
  const comptes = base.comptes.filter(c => c.agence === agenceNom)
  const compteIds = new Set(comptes.map(c => c.id))
  const mouvements = base.mouvements.filter(m => compteIds.has(m.compte_id))
  const actifs = comptes.filter(c => c.statut === 'ACTIF').length
  const dormants = comptes.filter(c => c.statut === 'DORMANT').length
  const encoursFromComptes = comptes.reduce((s, c) => s + c.solde_fcfa, 0)
  const encours = agenceRow?.encours ?? encoursFromComptes
  const share = EPARGNE_STATS.encours_epargne_total > 0
    ? encours / EPARGNE_STATS.encours_epargne_total
    : 0.2
  const ticketMoyen = actifs > 0 ? Math.round(encours / actifs) : base.kpis.ticket_moyen_fcfa
  const depotsJour = Math.round(base.kpis.depots_jour_fcfa * share)
  const retraitsJour = Math.round(base.kpis.retraits_jour_fcfa * share)
  const crossSell = base.cross_sell.filter(c => c.agence === agenceNom)
  const dormantsPrioritaires = base.dormants_prioritaires.filter(d => d.agence === agenceNom)

  const kpis: EpargneHub['kpis'] = {
    encours_total_fcfa: encours,
    comptes_actifs: actifs || agenceRow?.comptes || comptes.length,
    comptes_dormants: dormants || agenceRow?.dormants || 0,
    depots_jour_fcfa: depotsJour,
    retraits_jour_fcfa: retraitsJour,
    flux_net_jour_fcfa: depotsJour - retraitsJour,
    ticket_moyen_fcfa: ticketMoyen,
    croissance_30j_pct: agenceRow?.croissance_pct ?? base.kpis.croissance_30j_pct,
    ratio_momo_pct: base.kpis.ratio_momo_pct,
    liquidite_couverture_jours: Math.max(8, Math.round(base.kpis.liquidite_couverture_jours * share * 4)),
  }

  return {
    ...base,
    synthese_ia: buildSyntheseIaEpargneAgence(agenceNom, kpis, dormantsPrioritaires.length, crossSell.length),
    kpis,
    comptes,
    mouvements,
    produits: getProduitsFromComptes(comptes),
    profils_clients: getProfilsClientsEpargne(),
    evolution_mensuelle: base.evolution_mensuelle.map(e => ({
      mois: e.mois,
      encours: Math.round(e.encours * share),
      depots: Math.round(e.depots * share),
      retraits: Math.round(e.retraits * share),
    })),
    par_agence: base.par_agence.filter(a => a.nom === agenceNom),
    tontines: base.tontines.filter(t => t.agence === agenceNom),
    dormants_prioritaires: dormantsPrioritaires,
    cross_sell: crossSell,
    liquidite: {
      encours_epargne: encours,
      reserves_obligatoires: Math.round(base.liquidite.reserves_obligatoires * share),
      liquidite_disponible: Math.round(base.liquidite.liquidite_disponible * share),
      risque_retraits_semaine: base.liquidite.risque_retraits_semaine,
      alerte_liquidite: `Pic retraits MoMo attendu mardi–jeudi — tampon caisse ${agenceNom} recommandé.`,
    },
    ia_insights: base.ia_insights.filter(i =>
      i.detail.includes(agenceNom) || i.titre.toLowerCase().includes('dormant') || i.type === 'ACTION',
    ).slice(0, 4),
  }
}

export function getEpargneHubForUser(user?: AuthUser | null): EpargneHub {
  if (!user || user.role === 'MANAGER') return getEpargneHub()
  if (!ROLES_EPARGNE_PERIMETRE_AGENCE.has(user.role)) return getEpargneHub()
  const agenceNom = resolveAgenceNomFromZone(user.zone)
  if (!agenceNom) return getEpargneHub()
  return getEpargneHubForAgence(agenceNom)
}
