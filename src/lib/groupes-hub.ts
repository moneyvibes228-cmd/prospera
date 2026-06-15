/** Hub groupes & solidarité — tontines, garanties croisées, réunions */

export interface MembreGroupe {
  id: string
  nom: string
  role: 'PRESIDENT' | 'TRESORIER' | 'MEMBRE'
  cotisation_fcfa: number
  statut_paiement: 'A_JOUR' | 'RETARD' | 'EXCLU'
  score_ia: number
}

export interface ReunionGroupe {
  id: string
  date: string
  lieu: string
  presents: number
  total_membres: number
  decisions: string[]
}

export interface GroupeSolidarite {
  id: string
  nom: string
  type: 'TONTINE' | 'SOLIDARITE' | 'GARANTIE_CROISEE'
  agence: string
  agent: string
  membres_count: number
  encours_credit_fcfa: number
  encours_epargne_fcfa: number
  cycle_actuel: number
  statut: 'ACTIF' | 'SUSPENDU' | 'CLOTURE'
  prochaine_reunion: string
  score_cohesion_ia: number
  membres: MembreGroupe[]
}

export interface GroupesHub {
  synthese_ia: string
  kpis: {
    groupes_actifs: number
    membres_total: number
    encours_groupe_fcfa: number
    taux_cotisation_pct: number
    reunions_semaine: number
    defauts_groupe: number
  }
  groupes: GroupeSolidarite[]
  reunions_a_venir: ReunionGroupe[]
}

export const GROUPES_HUB: GroupesHub = {
  synthese_ia:
    'GS-014 (Commerce Adidogomé) : cohésion 88/100 — prêt groupe 1,2 M validé. Tontine Bè cycle 14 : 2 membres en retard cotisation — risque contagion si non régularisé avant vendredi. Recommandation : réunion de médiation GS-008 samedi 08h.',
  kpis: {
    groupes_actifs: 47,
    membres_total: 612,
    encours_groupe_fcfa: 28_400_000,
    taux_cotisation_pct: 91,
    reunions_semaine: 12,
    defauts_groupe: 4,
  },
  groupes: [
    {
      id: 'GS-014',
      nom: 'Commerçants Adidogomé',
      type: 'GARANTIE_CROISEE',
      agence: 'Adidogomé',
      agent: 'Efua Mensah',
      membres_count: 12,
      encours_credit_fcfa: 2_400_000,
      encours_epargne_fcfa: 890_000,
      cycle_actuel: 3,
      statut: 'ACTIF',
      prochaine_reunion: '31/05/2026',
      score_cohesion_ia: 88,
      membres: [
        { id: 'M1', nom: 'Afi Togbedji', role: 'PRESIDENT', cotisation_fcfa: 50_000, statut_paiement: 'A_JOUR', score_ia: 92 },
        { id: 'M2', nom: 'Kossi Mensah', role: 'TRESORIER', cotisation_fcfa: 50_000, statut_paiement: 'A_JOUR', score_ia: 85 },
        { id: 'M3', nom: 'Abla Fiagbedzi', role: 'MEMBRE', cotisation_fcfa: 50_000, statut_paiement: 'RETARD', score_ia: 48 },
      ],
    },
    {
      id: 'GS-008',
      nom: 'Tontine Femmes Bè',
      type: 'TONTINE',
      agence: 'Bè Kpota',
      agent: 'Edem Kpélim',
      membres_count: 18,
      encours_credit_fcfa: 0,
      encours_epargne_fcfa: 1_200_000,
      cycle_actuel: 14,
      statut: 'ACTIF',
      prochaine_reunion: '31/05/2026',
      score_cohesion_ia: 72,
      membres: [
        { id: 'M4', nom: 'Akossiwa Mensah', role: 'PRESIDENT', cotisation_fcfa: 10_000, statut_paiement: 'A_JOUR', score_ia: 88 },
        { id: 'M5', nom: 'Enyonam Kpade', role: 'MEMBRE', cotisation_fcfa: 10_000, statut_paiement: 'RETARD', score_ia: 35 },
      ],
    },
  ],
  reunions_a_venir: [
    { id: 'RV1', date: '31/05/2026 08:00', lieu: 'Marché Adidogomé', presents: 0, total_membres: 12, decisions: ['Validation décaissement DC-2919', 'Renouvellement cycle 4'] },
    { id: 'RV2', date: '31/05/2026 14:00', lieu: 'Agence Bè Kpota', presents: 0, total_membres: 18, decisions: ['Régularisation cotisations retard', 'Tirage au sort cycle 14'] },
  ],
}

export function getGroupesHub(): GroupesHub {
  return GROUPES_HUB
}
