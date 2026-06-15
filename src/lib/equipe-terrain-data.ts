/** Données agents terrain — dérivées de portefeuille-agences-config */
import { agentNomToId } from '@/lib/dg-vue360'
import { encoursCommercial, getPortefeuilleAgence } from '@/lib/portefeuille-agences-config'
import type { AgentPerformance } from '@/lib/equipe-hub'

type AgentBase = Omit<AgentPerformance, 'rang'>

function com(
  nom: string, agenceId: string, agence: string, clients: number,
  meta: Partial<AgentBase> & Pick<AgentBase, 'score' | 'recouvrement_pct' | 'visites_mois' | 'visites_objectif' | 'collecte_mois_fcfa' | 'ia_resume'>,
): AgentBase {
  return {
    id: agentNomToId(nom),
    nom,
    role: 'Commercial',
    agence_id: agenceId,
    agence,
    actif: true,
    badge: meta.badge ?? null,
    statut: meta.statut ?? (meta.score >= 70 ? 'BON' : meta.score >= 60 ? 'NORMAL' : 'DEGRADE'),
    clients_portefeuille: clients,
    clients_a_risque: meta.clients_a_risque ?? Math.max(1, Math.round(clients * 0.06)),
    portefeuille_fcfa: encoursCommercial(agenceId, clients),
    visites_jour: Math.round(meta.visites_mois / 22),
    collecte_jour_fcfa: Math.round(meta.collecte_mois_fcfa / 22),
    objectif_collecte_mois_fcfa: meta.objectif_collecte_mois_fcfa ?? Math.round(meta.collecte_mois_fcfa * 1.15),
    objectif_atteint_pct: meta.objectif_atteint_pct ?? Math.min(100, Math.round((meta.collecte_mois_fcfa / (meta.collecte_mois_fcfa * 1.15)) * 100)),
    objectif_recouvrement_pct: meta.objectif_recouvrement_pct ?? 85,
    par_30_pct: meta.par_30_pct ?? 8,
    retards_j7: meta.retards_j7 ?? 3,
    nouveaux_clients_mois: meta.nouveaux_clients_mois ?? 2,
    objectif_nouveaux_clients: meta.objectif_nouveaux_clients ?? 3,
    decaissements_mois: meta.decaissements_mois ?? 1,
    gps_conformite_pct: meta.gps_conformite_pct ?? 90,
    derniere_visite: meta.derniere_visite ?? 'Aujourd\'hui',
    lien_fiche: `/dashboard/agents/${agentNomToId(nom)}`,
    ...meta,
  }
}

function gp(
  nom: string, agenceId: string, agence: string, clients: number,
  meta: Partial<AgentBase> & Pick<AgentBase, 'score' | 'recouvrement_pct' | 'visites_mois' | 'visites_objectif' | 'collecte_mois_fcfa' | 'ia_resume'>,
): AgentBase {
  const cfg = getPortefeuilleAgence(agenceId)!
  return {
    ...com(nom, agenceId, agence, clients, meta),
    role: 'GP',
    portefeuille_fcfa: cfg.encours_fcfa,
    nouveaux_clients_mois: 0,
    objectif_nouveaux_clients: 0,
    decaissements_mois: 0,
  }
}

/** GP = somme des clients à risque des commerciaux de la même agence */
function alignGpClientsARisque(agents: AgentBase[]): AgentBase[] {
  const risqueParAgence = new Map<string, number>()
  for (const a of agents) {
    if (a.role === 'Commercial') {
      risqueParAgence.set(a.agence_id, (risqueParAgence.get(a.agence_id) ?? 0) + a.clients_a_risque)
    }
  }
  return agents.map(a => {
    if (a.role !== 'GP') return a
    const sum = risqueParAgence.get(a.agence_id) ?? a.clients_a_risque
    return { ...a, clients_a_risque: sum, retards_j7: sum }
  })
}

const RAW_TERRAIN_COMMERCIAL: AgentBase[] = [
  com('Yawo Adjavon', 'AG-001', 'Lomé Centre', 170, {
    score: 88, badge: 'OR', statut: 'BON', clients_a_risque: 8,
    visites_mois: 85, visites_objectif: 95, collecte_mois_fcfa: 11_500_000,
    objectif_atteint_pct: 87, recouvrement_pct: 91, objectif_recouvrement_pct: 92,
    par_30_pct: 6.2, retards_j7: 6, nouveaux_clients_mois: 12, gps_conformite_pct: 95,
    ia_resume: 'Commercial Lomé Centre — 170 clients zone Marché/Assigamé. Focus zones Marché/Assigamé. Conversion leads 44 %.',
  }),
  gp('Mawunya Kpodzo', 'AG-001', 'Lomé Centre', 300, {
    score: 89, badge: 'ARGENT', statut: 'BON', clients_a_risque: 18,
    visites_mois: 24, visites_objectif: 40, collecte_mois_fcfa: 8_200_000,
    objectif_atteint_pct: 89, recouvrement_pct: 89, objectif_recouvrement_pct: 90,
    par_30_pct: 5.4, retards_j7: 12, gps_conformite_pct: 98,
    ia_resume: 'GP Lomé Centre — suivi des 300 clients agence (vue crédit : échéances, relances, fidélisation). Taux rétention 94 %.',
  }),
  com('Mensah Kodjo', 'AG-001', 'Lomé Centre', 130, {
    score: 48, badge: null, statut: 'DEGRADE', clients_a_risque: 14,
    visites_mois: 45, visites_objectif: 80, collecte_mois_fcfa: 8_800_000,
    objectif_atteint_pct: 46, recouvrement_pct: 48, objectif_recouvrement_pct: 85,
    par_30_pct: 12.4, retards_j7: 11, nouveaux_clients_mois: 4, gps_conformite_pct: 72,
    ia_resume: 'Commercial Lomé Centre — 130 clients zone Tokoin/Adakpamé. Focus zone Tokoin/Adakpamé — couverture insuffisante. Coaching RA obligatoire.',
  }),
  gp('Sena Dossou', 'AG-002', 'Adidogomé', 150, {
    score: 76, badge: 'ARGENT', statut: 'BON', clients_a_risque: 12,
    visites_mois: 48, visites_objectif: 55, collecte_mois_fcfa: 9_200_000,
    objectif_atteint_pct: 88, recouvrement_pct: 78, objectif_recouvrement_pct: 85,
    par_30_pct: 7.8, retards_j7: 8, gps_conformite_pct: 90,
    ia_resume: 'GP Adidogomé — suivi crédit et relances sur les 150 clients agence. Régularité exemplaire — modèle à dupliquer.',
  }),
  gp('Kossi Adjavon', 'AG-003', 'Bè Kpota', 212, {
    score: 71, badge: null, statut: 'NORMAL', clients_a_risque: 22,
    visites_mois: 68, visites_objectif: 75, collecte_mois_fcfa: 18_800_000,
    objectif_atteint_pct: 92, recouvrement_pct: 71, objectif_recouvrement_pct: 88,
    par_30_pct: 10.2, retards_j7: 18, gps_conformite_pct: 88,
    ia_resume: 'GP Bè Kpota — suivi des 212 clients agence. Concentre 3 top mauvais payeurs réseau — mission recouvrement P1 avec Edem Kpélim.',
  }),
  com('Elom Komlavi', 'AG-004', 'Hédzranawoé', 93, {
    score: 82, badge: 'BRONZE', statut: 'BON', clients_a_risque: 5,
    visites_mois: 68, visites_objectif: 72, collecte_mois_fcfa: 9_700_000,
    objectif_atteint_pct: 89, recouvrement_pct: 82, objectif_recouvrement_pct: 85,
    par_30_pct: 5.8, retards_j7: 4, nouveaux_clients_mois: 5, gps_conformite_pct: 96,
    ia_resume: 'Commercial Hédzranawoé — 93 clients zone Hédzranawoé centre. Bonnes pratiques visites à partager.',
  }),
  gp('Akoue Yawa', 'AG-005', 'Kpalimé', 90, {
    score: 76, badge: null, statut: 'NORMAL', clients_a_risque: 4,
    visites_mois: 42, visites_objectif: 48, collecte_mois_fcfa: 6_900_000,
    objectif_atteint_pct: 86, recouvrement_pct: 76, objectif_recouvrement_pct: 80,
    par_30_pct: 6.8, retards_j7: 3, gps_conformite_pct: 92,
    ia_resume: 'GP Kpalimé — suivi crédit et fidélisation des 90 clients agence sous Ama Fiagbé (RA).',
  }),
  com('Enyonam Kpade', 'AG-002', 'Adidogomé', 90, {
    score: 79, badge: null, statut: 'BON', clients_a_risque: 7,
    visites_mois: 52, visites_objectif: 58, collecte_mois_fcfa: 6_600_000,
    objectif_atteint_pct: 82, recouvrement_pct: 81, objectif_recouvrement_pct: 85,
    par_30_pct: 8.2, retards_j7: 5, nouveaux_clients_mois: 5, gps_conformite_pct: 91,
    ia_resume: 'Commercial Adidogomé — 90 clients zone Marché Adidogomé. Binôme avec Abla Tchalla et Sena Dossou (GP).',
  }),
  com('Afi Lawson', 'AG-003', 'Bè Kpota', 120, {
    score: 65, badge: null, statut: 'NORMAL', clients_a_risque: 14,
    visites_mois: 58, visites_objectif: 65, collecte_mois_fcfa: 9_800_000,
    objectif_atteint_pct: 82, recouvrement_pct: 68, objectif_recouvrement_pct: 80,
    par_30_pct: 11.8, retards_j7: 10, nouveaux_clients_mois: 4, gps_conformite_pct: 86,
    ia_resume: 'Commercial Bè Kpota — 120 clients zone Marché de Bè. Kossi Adjavon (GP) gère le recouvrement agence.',
  }),
  gp('Mawu Hotor', 'AG-004', 'Hédzranawoé', 153, {
    score: 81, badge: 'BRONZE', statut: 'BON', clients_a_risque: 8,
    visites_mois: 28, visites_objectif: 35, collecte_mois_fcfa: 5_400_000,
    objectif_atteint_pct: 86, recouvrement_pct: 88, objectif_recouvrement_pct: 90,
    par_30_pct: 5.2, retards_j7: 4, gps_conformite_pct: 94,
    ia_resume: 'GP Hédzranawoé — suivi échéances et relances sur 153 clients agence. Binôme avec Elom Komlavi et Abla Kpodar.',
  }),
  com('Selom Agbeko', 'AG-005', 'Kpalimé', 60, {
    score: 83, badge: 'BRONZE', statut: 'BON', clients_a_risque: 2,
    visites_mois: 48, visites_objectif: 52, collecte_mois_fcfa: 5_800_000,
    objectif_atteint_pct: 88, recouvrement_pct: 84, objectif_recouvrement_pct: 85,
    par_30_pct: 4.8, retards_j7: 2, nouveaux_clients_mois: 8, gps_conformite_pct: 93,
    ia_resume: 'Commercial Kpalimé — 60 clients zone Kpalimé Centre. Akoue Yawa (GP) assure le suivi crédit agence.',
  }),
  com('Abla Tchalla', 'AG-002', 'Adidogomé', 60, {
    score: 74, badge: null, statut: 'NORMAL', clients_a_risque: 5,
    visites_mois: 38, visites_objectif: 45, collecte_mois_fcfa: 4_400_000,
    objectif_atteint_pct: 78, recouvrement_pct: 76, objectif_recouvrement_pct: 85,
    par_30_pct: 9.0, retards_j7: 4, nouveaux_clients_mois: 3, gps_conformite_pct: 88,
    ia_resume: 'Commercial Adidogomé — 60 clients zone Gbossimé/Zongo. Recrue terrain 2025 — montée en charge progressive.',
  }),
  com('Kofi Senyo', 'AG-003', 'Bè Kpota', 92, {
    score: 61, badge: null, statut: 'NORMAL', clients_a_risque: 11,
    visites_mois: 42, visites_objectif: 50, collecte_mois_fcfa: 7_500_000,
    objectif_atteint_pct: 75, recouvrement_pct: 64, objectif_recouvrement_pct: 80,
    par_30_pct: 12.2, retards_j7: 9, nouveaux_clients_mois: 3, gps_conformite_pct: 84,
    ia_resume: 'Commercial Bè Kpota — 92 clients zone Agbalépédogan sud. Mission recouvrement avec Afi Lawson.',
  }),
  com('Abla Kpodar', 'AG-004', 'Hédzranawoé', 60, {
    score: 78, badge: null, statut: 'NORMAL', clients_a_risque: 3,
    visites_mois: 44, visites_objectif: 50, collecte_mois_fcfa: 6_200_000,
    objectif_atteint_pct: 84, recouvrement_pct: 79, objectif_recouvrement_pct: 85,
    par_30_pct: 6.4, retards_j7: 3, nouveaux_clients_mois: 4, gps_conformite_pct: 92,
    ia_resume: 'Commercial Hédzranawoé — 60 clients zone Agoè/Adidogomé nord. Renfort terrain recruté Q1 2026.',
  }),
  com('Komla Adzro', 'AG-005', 'Kpalimé', 30, {
    score: 80, badge: null, statut: 'BON', clients_a_risque: 1,
    visites_mois: 28, visites_objectif: 32, collecte_mois_fcfa: 3_200_000,
    objectif_atteint_pct: 85, recouvrement_pct: 81, objectif_recouvrement_pct: 85,
    par_30_pct: 5.1, retards_j7: 1, nouveaux_clients_mois: 6, gps_conformite_pct: 94,
    ia_resume: 'Commercial Kpalimé — 30 clients zone Kpimé/Agomé. Prospection agriculture sous Selom Agbeko.',
  }),
]

export const TERRAIN_COMMERCIAL = alignGpClientsARisque(RAW_TERRAIN_COMMERCIAL)
