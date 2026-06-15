/** Hub relances intelligentes — canaux SMS, WhatsApp, appel, scoring IA */

export type CanalRelance = 'SMS' | 'WHATSAPP' | 'APPEL' | 'VISITE'

export interface RelanceItem {
  id: string
  client: string
  telephone: string
  montant_fcfa: number
  jours_retard: number
  canal_recommande: CanalRelance
  canal_utilise?: CanalRelance
  score_ia: number
  message_ia: string
  statut: 'PLANIFIE' | 'ENVOYE' | 'REPONDU' | 'ECHEC' | 'PROMESSE'
  agence: string
  agent: string
}

export interface CampagneRelance {
  id: string
  nom: string
  cible: number
  envoyes: number
  taux_reponse_pct: number
  canal: CanalRelance
  statut: 'ACTIVE' | 'TERMINEE' | 'BROUILLON'
}

export type StatutWorkflow = 'NOUVEAU' | 'RELANCE_1' | 'RELANCE_2' | 'ESCALADE' | 'CONTENTIEUX' | 'CLOTURE'

export interface WorkflowRelance {
  id: string
  client: string
  etape: StatutWorkflow
  jours_retard: number
  prochaine_echeance: string
  agent: string
  action_ia: string
}

export interface PromessePaiement {
  id: string
  client: string
  montant_fcfa: number
  date_promesse: string
  date_echeance: string
  canal: CanalRelance
  statut: 'ACTIVE' | 'TENUE' | 'NON_TENUE' | 'PARTIELLE'
  agent: string
  score_tenue_ia: number
}

export interface PreuveRelance {
  id: string
  relance_id: string
  client: string
  type: 'SMS' | 'WHATSAPP' | 'APPEL' | 'VISITE' | 'RECU_MOMO'
  date: string
  fichier?: string
  reference?: string
  valide: boolean
  verifie_ia: boolean
}

export interface RelancesHub {
  synthese_ia: string
  workflows: WorkflowRelance[]
  promesses: PromessePaiement[]
  preuves: PreuveRelance[]
  kpis: {
    relances_jour: number
    taux_reponse_pct: number
    montant_recupere_fcfa: number
    promesses_jour: number
    echecs_envoi: number
    economie_ia_fcfa: number
  }
  stats_canaux: Array<{ canal: CanalRelance; envoyes: number; reponses: number; taux_pct: number }>
  relances: RelanceItem[]
  campagnes: CampagneRelance[]
  evolution_7j: Array<{ jour: string; envoyes: number; reponses: number }>
}

export const RELANCES_HUB: RelancesHub = {
  synthese_ia:
    'Priorité du jour : 23 clients J+15 à J+45 — canal optimal WhatsApp (68 % taux réponse vs 41 % SMS). Campagne « Promesses Bè Kpota » : relancer 8 promesses non tenues avant 14h. Kwami Ekpé (J+45) : escalade appel + visite terrain. Économie estimée vs relances manuelles : 420 k FCFA/mois.',
  kpis: {
    relances_jour: 47,
    taux_reponse_pct: 62,
    montant_recupere_fcfa: 1_840_000,
    promesses_jour: 8,
    echecs_envoi: 3,
    economie_ia_fcfa: 420_000,
  },
  stats_canaux: [
    { canal: 'WHATSAPP', envoyes: 124, reponses: 84, taux_pct: 68 },
    { canal: 'SMS', envoyes: 89, reponses: 36, taux_pct: 41 },
    { canal: 'APPEL', envoyes: 42, reponses: 31, taux_pct: 74 },
    { canal: 'VISITE', envoyes: 18, reponses: 14, taux_pct: 78 },
  ],
  relances: [
    { id: 'R1', client: 'Kwami Ekpé', telephone: '+228 90 12 34 56', montant_fcfa: 185_000, jours_retard: 45, canal_recommande: 'VISITE', score_ia: 22, message_ia: 'Bonjour M. Ekpé, votre échéance de 185 000 FCFA est en retard de 45 jours. Pouvons-nous convenir d\'un plan cette semaine ?', statut: 'PLANIFIE', agence: 'Bè Kpota', agent: 'Mawunya Kpodzo' },
    { id: 'R2', client: 'Mawuena Hotor', telephone: '+228 91 22 33 44', montant_fcfa: 62_000, jours_retard: 5, canal_recommande: 'WHATSAPP', canal_utilise: 'WHATSAPP', score_ia: 58, message_ia: 'Rappel amical : échéance 62 000 FCFA due hier. Répondez OUI pour confirmer paiement demain.', statut: 'REPONDU', agence: 'Lomé Centre', agent: 'Kossi Doheto' },
    { id: 'R3', client: 'Togbui Apedo', telephone: '+228 70 11 22 33', montant_fcfa: 240_000, jours_retard: 62, canal_recommande: 'APPEL', score_ia: 18, message_ia: 'Escalade recouvrement — contact téléphonique urgent requis.', statut: 'ENVOYE', agence: 'Bè Kpota', agent: 'Mensah Kodjo' },
    { id: 'R4', client: 'Komi Akléssoé', telephone: '+228 98 76 54 32', montant_fcfa: 45_000, jours_retard: 8, canal_recommande: 'SMS', canal_utilise: 'SMS', score_ia: 71, message_ia: 'IMF Togo : échéance 45 000 FCFA. Paiement MoMo *144*1# ref EP-8821', statut: 'PROMESSE', agence: 'Tokoin', agent: 'Edem Kpélim' },
  ],
  campagnes: [
    { id: 'C1', nom: 'J+7 préventif réseau', cible: 120, envoyes: 98, taux_reponse_pct: 54, canal: 'WHATSAPP', statut: 'ACTIVE' },
    { id: 'C2', nom: 'Promesses Bè Kpota', cible: 8, envoyes: 8, taux_reponse_pct: 38, canal: 'APPEL', statut: 'ACTIVE' },
    { id: 'C3', nom: 'Relance SMS J+30', cible: 45, envoyes: 45, taux_reponse_pct: 41, canal: 'SMS', statut: 'TERMINEE' },
  ],
  workflows: [
    { id: 'WF-1', client: 'Kwami Ekpé', etape: 'ESCALADE', jours_retard: 45, prochaine_echeance: '29/05/2026', agent: 'Mawunya Kpodzo', action_ia: 'Visite terrain + mise en demeure' },
    { id: 'WF-2', client: 'Komi Akléssoé', etape: 'RELANCE_1', jours_retard: 8, prochaine_echeance: '30/05/2026', agent: 'Edem Kpélim', action_ia: 'WhatsApp J+8 — taux réponse 68 %' },
    { id: 'WF-3', client: 'Mawuena Hotor', etape: 'CLOTURE', jours_retard: 0, prochaine_echeance: '—', agent: 'Kossi Doheto', action_ia: 'Promesse tenue — clôturer workflow' },
  ],
  promesses: [
    { id: 'PR-1', client: 'Komi Akléssoé', montant_fcfa: 45_000, date_promesse: '28/05/2026', date_echeance: '30/05/2026', canal: 'SMS', statut: 'ACTIVE', agent: 'Edem Kpélim', score_tenue_ia: 71 },
    { id: 'PR-2', client: 'Mawuena Hotor', montant_fcfa: 62_000, date_promesse: '27/05/2026', date_echeance: '28/05/2026', canal: 'WHATSAPP', statut: 'TENUE', agent: 'Kossi Doheto', score_tenue_ia: 88 },
    { id: 'PR-3', client: 'Togbui Apedo', montant_fcfa: 80_000, date_promesse: '25/05/2026', date_echeance: '27/05/2026', canal: 'APPEL', statut: 'NON_TENUE', agent: 'Mensah Kodjo', score_tenue_ia: 22 },
    { id: 'PR-4', client: 'Enyonam Kpade', montant_fcfa: 35_000, date_promesse: '28/05/2026', date_echeance: '31/05/2026', canal: 'VISITE', statut: 'PARTIELLE', agent: 'Edem Kpélim', score_tenue_ia: 45 },
  ],
  preuves: [
    { id: 'PV-1', relance_id: 'R2', client: 'Mawuena Hotor', type: 'WHATSAPP', date: '28/05/2026 08:45', fichier: 'whatsapp_hotor_2805.png', valide: true, verifie_ia: true },
    { id: 'PV-2', relance_id: 'R4', client: 'Komi Akléssoé', type: 'SMS', date: '28/05/2026 09:12', reference: 'SMS-88291', valide: true, verifie_ia: true },
    { id: 'PV-3', relance_id: 'R1', client: 'Kwami Ekpé', type: 'APPEL', date: '27/05/2026 16:30', fichier: 'compte_rendu_appel.pdf', valide: true, verifie_ia: false },
    { id: 'PV-4', relance_id: 'R4', client: 'Komi Akléssoé', type: 'RECU_MOMO', date: '—', reference: 'MOMO-8821', valide: false, verifie_ia: false },
  ],
  evolution_7j: [
    { jour: 'Lun', envoyes: 38, reponses: 22 },
    { jour: 'Mar', envoyes: 42, reponses: 28 },
    { jour: 'Mer', envoyes: 51, reponses: 31 },
    { jour: 'Jeu', envoyes: 47, reponses: 29 },
    { jour: 'Ven', envoyes: 44, reponses: 27 },
    { jour: 'Sam', envoyes: 28, reponses: 18 },
    { jour: 'Dim', envoyes: 12, reponses: 8 },
  ],
}

export function getRelancesHub(): RelancesHub {
  return RELANCES_HUB
}
