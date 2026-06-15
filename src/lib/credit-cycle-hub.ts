/** Cycle de vie prêt — demande → analyse → comité → décaissement → échéancier → clôture */

export type EtapeCyclePret =
  | 'DEMANDE'
  | 'ANALYSE'
  | 'COMITE'
  | 'DECAISSEMENT'
  | 'ECHEANCIER'
  | 'CLOTURE'

export interface HistoriqueEtape {
  etape: EtapeCyclePret
  date: string
  acteur: string
  commentaire?: string
  duree_h?: number
}

export interface DossierCyclePret {
  id: string
  ref: string
  client: string
  produit: string
  montant_fcfa: number
  etape_courante: EtapeCyclePret
  etapes_completees: EtapeCyclePret[]
  historique: HistoriqueEtape[]
  score_ia: number
  classe_bceao: string
  agence: string
  prochaine_action_ia: string
  bloque?: boolean
  motif_blocage?: string
}

export interface CreditCycleHub {
  synthese_ia: string
  kpis: {
    en_cours: number
    demandes_jour: number
    comite_semaine: number
    decaissements_attente: number
    clotures_mois: number
    delai_moyen_jours: number
  }
  etapes_definition: Array<{ id: EtapeCyclePret; label: string; description: string }>
  dossiers: DossierCyclePret[]
  comite_prochain: { date: string; dossiers: number; montant_total_fcfa: number }
}

const ETAPES = [
  { id: 'DEMANDE' as const, label: 'Demande', description: 'Saisie client, pièces KYC, produit' },
  { id: 'ANALYSE' as const, label: 'Analyse', description: '5C, CBI v5, scoring IA' },
  { id: 'COMITE' as const, label: 'Comité crédit', description: 'Validation collégiale RA/ROC' },
  { id: 'DECAISSEMENT' as const, label: 'Décaissement', description: 'Mise à disposition fonds' },
  { id: 'ECHEANCIER' as const, label: 'Échéancier', description: 'Remboursements en cours' },
  { id: 'CLOTURE' as const, label: 'Clôture', description: 'Solde nul, libération garanties' },
]

export const CREDIT_CYCLE_HUB: CreditCycleHub = {
  synthese_ia:
    'Pipeline cycle : 5 dossiers en comité jeudi (6,8 M FCFA). 3 décaissements bloqués KYC — priorité Yawo Adjavon. Délai moyen demande→décaissement 11 j (objectif 9 j). 2 clôtures prévues cette semaine (solde anticipé).',
  kpis: {
    en_cours: 24,
    demandes_jour: 4,
    comite_semaine: 5,
    decaissements_attente: 3,
    clotures_mois: 18,
    delai_moyen_jours: 11,
  },
  etapes_definition: ETAPES,
  comite_prochain: { date: '29/05/2026 14:00', dossiers: 5, montant_total_fcfa: 6_800_000 },
  dossiers: [
    {
      id: 'CY-1', ref: 'DC-2918', client: 'Yawo Adjavon', produit: 'Microcrédit individuel', montant_fcfa: 800_000,
      etape_courante: 'DECAISSEMENT', etapes_completees: ['DEMANDE', 'ANALYSE', 'COMITE'],
      historique: [
        { etape: 'DEMANDE', date: '18/05/2026', acteur: 'Edem Kpélim', duree_h: 4 },
        { etape: 'ANALYSE', date: '22/05/2026', acteur: 'Elom Adjavon', commentaire: 'Score 72 — garanties à compléter', duree_h: 48 },
        { etape: 'COMITE', date: '27/05/2026', acteur: 'Kafui Agbeko', commentaire: 'Approuvé sous condition KYC', duree_h: 24 },
      ],
      score_ia: 72, classe_bceao: 'NORMAL', agence: 'Tokoin',
      prochaine_action_ia: 'Compléter photo KYC puis lancer décaissement virement',
      bloque: true, motif_blocage: 'KYC incomplet',
    },
    {
      id: 'CY-2', ref: 'DC-2912', client: 'Afi Togbedji', produit: 'Crédit PME', montant_fcfa: 1_000_000,
      etape_courante: 'ECHEANCIER', etapes_completees: ['DEMANDE', 'ANALYSE', 'COMITE', 'DECAISSEMENT'],
      historique: [
        { etape: 'DEMANDE', date: '01/04/2026', acteur: 'Commercial Tokoin' },
        { etape: 'ANALYSE', date: '08/04/2026', acteur: 'Elom Adjavon' },
        { etape: 'COMITE', date: '12/04/2026', acteur: 'ROC' },
        { etape: 'DECAISSEMENT', date: '15/04/2026', acteur: 'Caisse Tokoin' },
      ],
      score_ia: 82, classe_bceao: 'NORMAL', agence: 'Tokoin',
      prochaine_action_ia: 'Échéance 15/06 — rappel préventif J-3',
    },
    {
      id: 'CY-3', ref: 'DC-2925', client: 'Groupe GS-014', produit: 'Crédit groupe', montant_fcfa: 1_200_000,
      etape_courante: 'COMITE', etapes_completees: ['DEMANDE', 'ANALYSE'],
      historique: [
        { etape: 'DEMANDE', date: '25/05/2026', acteur: 'Efua Mensah' },
        { etape: 'ANALYSE', date: '27/05/2026', acteur: 'Elom Adjavon', commentaire: 'Cohésion groupe 88/100' },
      ],
      score_ia: 78, classe_bceao: 'SOUS_SURVEILLANCE', agence: 'Adidogomé',
      prochaine_action_ia: 'Inscrire ordre du jour comité 29/05',
    },
    {
      id: 'CY-4', ref: 'DC-2650', client: 'Mawuena Hotor', produit: 'Microcrédit', montant_fcfa: 300_000,
      etape_courante: 'CLOTURE', etapes_completees: ['DEMANDE', 'ANALYSE', 'COMITE', 'DECAISSEMENT', 'ECHEANCIER'],
      historique: [
        { etape: 'CLOTURE', date: '26/05/2026', acteur: 'Système', commentaire: 'Solde nul — refinancement RF-007' },
      ],
      score_ia: 91, classe_bceao: 'NORMAL', agence: 'Lomé Centre',
      prochaine_action_ia: 'Archiver dossier — proposer renouvellement 450 k',
    },
  ],
}

export function getCreditCycleHub(): CreditCycleHub {
  return CREDIT_CYCLE_HUB
}

export const ETAPE_CYCLE_ORDER: EtapeCyclePret[] = ['DEMANDE', 'ANALYSE', 'COMITE', 'DECAISSEMENT', 'ECHEANCIER', 'CLOTURE']
