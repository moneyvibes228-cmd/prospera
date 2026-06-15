/** Hub analyse risque DG — profondeur analytique (≠ synthèse dashboard) */

import { RESEAU_CONSOLIDE, AGENCES } from '@/lib/agences'
import { RISQUE_AVANCE, EXPECTED_LOSS, SECTEURS, BCEAO_REPARTITION } from '@/lib/mockMicrofinance'
import { formatFcfa } from '@/lib/utils'

const AGENCE_MAP: Record<string, string> = {
  'Tsévié': 'Hédzranawoé',
  'Tabligbo': 'Kpalimé',
}

export interface ClientRisque {
  id: string
  nom: string
  agence: string
  agent: string
  encours_fcfa: number
  score_ia: number
  pd_pct: number
  el_fcfa: number
  jours_retard: number
  action: string
}

export interface RisqueHub {
  synthese_memo: string
  el_vs_provisions: {
    el_total_fcfa: number
    provisions_constituees_fcfa: number
    ecart_fcfa: number
    couverture_pct: number
    evolution_6m: typeof EXPECTED_LOSS.evolution_6_mois
    par_agence: typeof EXPECTED_LOSS.par_agence
  }
  aging_entonnoir: Array<{ tranche: string; count: number; encours_fcfa: number; pct: number; description: string }>
  concentrations: typeof RISQUE_AVANCE.concentrations_suspectes
  hausses_defauts: typeof RISQUE_AVANCE.hausses_anormales_defauts
  clients_risque: ClientRisque[]
  dossiers_bloques_dg: Array<(typeof RISQUE_AVANCE.dossiers_bloques_48h)[0] & { necessite_dg: boolean }>
  decisions_dg: Array<{ priorite: 1 | 2 | 3; titre: string; detail: string; impact: string; delai: string }>
  secteurs_vigilance: Array<{ nom: string; par_pct: number; encours_fcfa: number; alerte: boolean; commentaire: string }>
  previsions_par: Array<{ mois: string; par_prevu_pct: number; par_objectif_pct: number; confidence: number; scenario: string }>
  glossaire: Array<{ terme: string; definition: string; seuil_dg?: string }>
  reference_dashboard: {
    par_30_reseau: number
    par_90_reseau: number
    encours_total_fcfa: number
  }
}

function buildHub(): RisqueHub {
  const aging = RISQUE_AVANCE.aging_detail
  const el = EXPECTED_LOSS
  const prov = BCEAO_REPARTITION.total_provisions_constituees
  const ecart = el.el_total - prov

  return {
    synthese_memo:
      `Analyse approfondie — Expected Loss ${formatFcfa(el.el_total)} vs provisions ${formatFcfa(prov)} (écart ${formatFcfa(Math.abs(ecart))}${ecart > 0 ? ' à combler' : ' excédent'}). Bè Kpota concentre 63 % des dossiers à risque élevé. Trois décisions DG requises cette semaine : plan Bè Kpota, arbitrage dossiers bloqués > 72h, révision concentration Commerce (42 % encours).`,
    el_vs_provisions: {
      el_total_fcfa: el.el_total,
      provisions_constituees_fcfa: prov,
      ecart_fcfa: ecart,
      couverture_pct: Math.round((prov / el.el_total) * 100),
      evolution_6m: el.evolution_6_mois,
      par_agence: el.par_agence,
    },
    aging_entonnoir: [
      { tranche: 'Courant', count: aging.courant.count, encours_fcfa: aging.courant.encours, pct: aging.courant.pct, description: 'Échéances à jour — pas de provision majorée' },
      { tranche: 'J+1 à J+7', count: aging.j_1_7.count, encours_fcfa: aging.j_1_7.encours, pct: aging.j_1_7.pct, description: 'Retard léger — relance agent suffisante dans 80 % des cas' },
      { tranche: 'J+8 à J+30', count: aging.j_8_30.count, encours_fcfa: aging.j_8_30.encours, pct: aging.j_8_30.pct, description: 'Zone PAR 30 — surveillance BCEAO, risque migration' },
      { tranche: 'J+31 à J+60', count: aging.j_31_60.count, encours_fcfa: aging.j_31_60.encours, pct: aging.j_31_60.pct, description: 'Sous surveillance — provision 10 %, plan recouvrement' },
      { tranche: 'J+61 à J+90', count: aging.j_61_90.count, encours_fcfa: aging.j_61_90.encours, pct: aging.j_61_90.pct, description: 'Douteux potentiel — comité crédit si pas d\'apurement' },
      { tranche: 'J+90+', count: aging.j_90_plus.count, encours_fcfa: aging.j_90_plus.encours, pct: aging.j_90_plus.pct, description: 'Contentieux — provision intégrale, décision DG' },
    ],
    concentrations: RISQUE_AVANCE.concentrations_suspectes,
    hausses_defauts: RISQUE_AVANCE.hausses_anormales_defauts,
    clients_risque: RISQUE_AVANCE.top_clients_risque.map(c => ({
      id: c.id,
      nom: c.nom,
      agence: AGENCE_MAP[c.agence] ?? c.agence,
      agent: c.agent,
      encours_fcfa: c.encours,
      score_ia: c.score_ia,
      pd_pct: c.pd_pct,
      el_fcfa: c.el,
      jours_retard: c.jours_retard,
      action: c.action,
    })),
    dossiers_bloques_dg: RISQUE_AVANCE.dossiers_bloques_48h.map(d => ({
      ...d,
      agence: AGENCE_MAP[d.agence] ?? d.agence,
      necessite_dg: d.etape.includes('Direction') || d.bloque_depuis_h >= 72,
    })),
    decisions_dg: [
      { priorite: 1, titre: 'Plan redressement Bè Kpota', detail: 'PAR 11,2 % — 18 dossiers impayés, concentration agent Edem Kpélim', impact: 'PAR réseau −1,5 pt si exécuté', delai: 'Cette semaine' },
      { priorite: 1, titre: 'Combler écart provisions / EL', detail: `${formatFcfa(Math.abs(ecart))} entre Expected Loss et provisions constituées`, impact: 'Conformité bilan BCEAO', delai: 'Avant 31/05' },
      { priorite: 1, titre: 'Arbitrer DOS-2412 (2,4 M FCFA)', detail: 'Bloqué 96h — validation Direction requise', impact: 'Déblocage pipeline crédit', delai: '48h' },
      { priorite: 2, titre: 'Plafonner décaissements Commerce', detail: 'Concentration 42 % > seuil 30 % BCEAO', impact: 'Diversification risque sectoriel', delai: 'Juin' },
      { priorite: 2, titre: 'Audit GPS Edem Kpélim', detail: 'Hausse défauts +38 % sur 14 j — fraude probable 73 %', impact: 'Intégrité données terrain', delai: '48h' },
      { priorite: 3, titre: 'Révision objectifs Hédzranawoé', detail: 'Agence mono-agent — Komi Atsu seul', impact: 'Résilience opérationnelle', delai: 'Q3' },
    ],
    secteurs_vigilance: SECTEURS.filter(s => s.alerte_concentration || s.par_30j_pct > 8).map(s => ({
      nom: s.nom,
      par_pct: s.par_30j_pct,
      encours_fcfa: s.encours,
      alerte: s.alerte_concentration,
      commentaire: s.alerte_concentration
        ? `Concentration ${Math.round((s.encours / RESEAU_CONSOLIDE.encours_total) * 100)} % encours réseau — plafond BCEAO 30 %`
        : `PAR ${s.par_30j_pct} % — surveillance renforcée`,
    })),
    previsions_par: [
      { mois: 'Juin 26', par_prevu_pct: 7.6, par_objectif_pct: 8.0, confidence: 82, scenario: 'Si actions P1 exécutées' },
      { mois: 'Juin 26', par_prevu_pct: 9.2, par_objectif_pct: 8.0, confidence: 68, scenario: 'Sans action Bè Kpota' },
      { mois: 'Juil. 26', par_prevu_pct: 7.0, par_objectif_pct: 7.5, confidence: 74, scenario: 'Trajectoire cible Q3' },
    ],
    glossaire: [
      { terme: 'PAR 30', definition: 'Part de l\'encours avec au moins 1 échéance impayée depuis 30 jours.', seuil_dg: 'Seuil BCEAO : 10 %. Action DG si > 9 % pendant 2 mois.' },
      { terme: 'Expected Loss (EL)', definition: 'Perte attendue = EAD × PD × LGD. Reflète le coût probable du risque crédit.', seuil_dg: 'Provisions ≥ EL — sinon bilan surévalué.' },
      { terme: 'PD (Probability of Default)', definition: 'Probabilité de défaut sur 12 mois — score IA CBI v5.', seuil_dg: 'PD > 50 % → comité crédit obligatoire.' },
      { terme: 'Migration aging', definition: 'Passage d\'une tranche de retard à la suivante (ex. J+7 → J+30).', seuil_dg: 'Si > 15 % migrent vers J+30/mois → alerte.' },
      { terme: 'Concentration', definition: 'Risque lié à la sur-exposition à un agent, secteur ou agence.', seuil_dg: 'Secteur > 30 % ou agent > 50 % approbations → revue DG.' },
    ],
    reference_dashboard: {
      par_30_reseau: RESEAU_CONSOLIDE.par_moyen,
      par_90_reseau: RISQUE_AVANCE.par_granulaire.par_90.valeur_pct,
      encours_total_fcfa: RESEAU_CONSOLIDE.encours_total,
    },
  }
}

let _cache: RisqueHub | null = null

export function getRisqueHub(): RisqueHub {
  if (!_cache) _cache = buildHub()
  return _cache
}

export { AGENCES }
