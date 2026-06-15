// Hub Agent Collecte — Edem Kpélim

import { MOCK_BORROWERS } from '@/lib/mockMicrofinance'

export const COLL_AGENT = {
  id: '3',
  nom: 'Edem Kpélim',
  zone: 'Bè Kpota',
  agence: 'Lomé Centre',
}

/** Emprunteurs assignés à l'agent collecte (demo) */
export const COLL_BORROWER_IDS = ['b03', 'b06', 'b09', 'b12'] as const

export interface ClientCollecte {
  borrowerId: string
  nom: string
  telephone: string
  zone: string
  activite: string
  adresse: string
  encours: number
  retard_j: number
  statut: string
  score: number
  type_client: 'ACTIF' | 'RETARD' | 'PROSPECT' | 'TONTINE'
  derniere_collecte?: string
  // données enrichies
  segment: string
  risque: 'CRITIQUE' | 'HAUT' | 'MOYEN' | 'FAIBLE'
  canal_collecte: 'ESPECES' | 'MOMO' | 'TONTINE' | 'VIREMENT'
  groupe_tontine?: string
  dernier_paiement: string
  mensualite: number
  echeance_prochaine: string
  suggestion_ia: string
  action_prioritaire?: string
  membre_depuis: string
  nb_credits_anterieurs: number
  taux_ponctualite_pct: number
  canal_communication: 'WHATSAPP' | 'APPEL' | 'VISITE'
  motif_dernier_contact?: string
  nb_visites_mois: number
  produit_actuel?: string
  garantie?: string
  activite_secondaire?: string
  revenu_estime_mensuel?: number
}

const RICH_DATA: Record<string, Omit<ClientCollecte, 'borrowerId' | 'nom' | 'telephone' | 'zone' | 'encours' | 'retard_j' | 'statut' | 'score' | 'derniere_collecte'>> = {
  b03: {
    activite: 'Commerce de tissus & pagnes',
    adresse: 'Marché Bè Kpota, stand n°12, allée centrale',
    type_client: 'ACTIF',
    segment: 'PME',
    risque: 'FAIBLE',
    canal_collecte: 'ESPECES',
    dernier_paiement: 'il y a 6j',
    mensualite: 37_500,
    echeance_prochaine: '05/06/2026',
    suggestion_ia: 'Excellent profil — renouvellement 600 k FCFA recommandé dès ce mois. Historique paiement sans interruption.',
    action_prioritaire: 'Proposer renouvellement',
    membre_depuis: 'Juillet 2025',
    nb_credits_anterieurs: 2,
    taux_ponctualite_pct: 100,
    canal_communication: 'WHATSAPP',
    motif_dernier_contact: 'Confirmation paiement mensuel',
    nb_visites_mois: 4,
    produit_actuel: 'Crédit Commerce',
    garantie: 'Caution solidaire groupe Bè',
    activite_secondaire: 'Vente en gros marchés alentours',
    revenu_estime_mensuel: 180_000,
  },
  b06: {
    activite: 'Restauration (cuisine locale)',
    adresse: 'Route nationale 1, à 200m du carrefour Bè',
    type_client: 'RETARD',
    segment: 'Commerce',
    risque: 'MOYEN',
    canal_collecte: 'MOMO',
    groupe_tontine: 'Tontine Femmes Bè Solidaire',
    dernier_paiement: 'il y a 7j',
    mensualite: 35_000,
    echeance_prochaine: '01/06/2026',
    suggestion_ia: 'SMS rappel échéance + appel ce matin — bon historique avant ce retard. Commerce actif = solvabilité réelle.',
    action_prioritaire: 'SMS + appel aujourd\'hui',
    membre_depuis: 'Mai 2025',
    nb_credits_anterieurs: 1,
    taux_ponctualite_pct: 78,
    canal_communication: 'APPEL',
    motif_dernier_contact: 'Relance retard J+5',
    nb_visites_mois: 5,
    produit_actuel: 'Crédit Commerce',
    garantie: 'Nantissement matériel restauration',
    activite_secondaire: 'Vente plats à emporter',
    revenu_estime_mensuel: 140_000,
  },
  b09: {
    activite: 'Artisanat — menuiserie & ébénisterie',
    adresse: 'Quartier Apéyémé, atelier principal, derrière l\'école',
    type_client: 'RETARD',
    segment: 'Artisanat',
    risque: 'HAUT',
    canal_collecte: 'ESPECES',
    dernier_paiement: 'il y a 22j',
    mensualite: 20_833,
    echeance_prochaine: '01/06/2026 (en retard)',
    suggestion_ia: 'Inactif WhatsApp depuis 18j — visite porte-à-porte prioritaire ce matin. Risque abandon élevé si pas de contact cette semaine.',
    action_prioritaire: 'Visite terrain urgente',
    membre_depuis: 'Février 2025',
    nb_credits_anterieurs: 1,
    taux_ponctualite_pct: 52,
    canal_communication: 'VISITE',
    motif_dernier_contact: 'Aucune réponse depuis 18j',
    nb_visites_mois: 3,
    produit_actuel: 'Crédit Artisanat',
    garantie: 'Caution personnelle + outillage',
    activite_secondaire: 'Fabrication meubles sur commande',
    revenu_estime_mensuel: 95_000,
  },
  b12: {
    activite: 'Cosmétiques & parfumerie',
    adresse: 'Tokoin Hôpital, boutique face à la pharmacie centrale',
    type_client: 'TONTINE',
    segment: 'Artisanat',
    risque: 'CRITIQUE',
    canal_collecte: 'TONTINE',
    groupe_tontine: 'Groupe Tontine Tokoin — 12 membres',
    dernier_paiement: 'il y a 38j',
    mensualite: 12_500,
    echeance_prochaine: 'En défaut',
    suggestion_ia: 'Aucune réponse à 5 relances — visite conjointe avec RA ou escalade superviseur. Risque de perte totale si pas d\'action cette semaine.',
    action_prioritaire: 'Escalade superviseur',
    membre_depuis: 'Août 2024',
    nb_credits_anterieurs: 3,
    taux_ponctualite_pct: 31,
    canal_communication: 'VISITE',
    motif_dernier_contact: '5ème relance sans réponse',
    nb_visites_mois: 2,
    produit_actuel: 'Crédit Commerce + Tontine',
    garantie: 'Caution groupe tontine',
    activite_secondaire: 'Vente en ligne cosmétiques importés',
    revenu_estime_mensuel: 75_000,
  },
}

function buildClients(): ClientCollecte[] {
  return COLL_BORROWER_IDS.map(id => {
    const b = MOCK_BORROWERS.find(x => x.id === id)!
    const rich = RICH_DATA[id]!
    return {
      borrowerId: id,
      nom: b.nom,
      telephone: b.telephone,
      zone: b.zone,
      encours: b.montant_credit - b.montant_rembourse,
      retard_j: b.retard_jours,
      statut: b.statut,
      score: b.score_ia,
      derniere_collecte: b.derniere_visite ?? undefined,
      ...rich,
    }
  })
}

export function getCollecteHubData() {
  return {
    agent: COLL_AGENT,
    clients: buildClients(),
    kpis: {
      total_clients: COLL_BORROWER_IDS.length,
      en_retard: buildClients().filter(c => c.retard_j > 0).length,
      collecte_jour: 235_000,
      objectif_jour: 320_000,
    },
  }
}
