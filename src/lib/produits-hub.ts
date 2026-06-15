/** Catalogue produits IMF — crédit, épargne, tontine, frais, assurances */

export type FamilleProduit = 'CREDIT' | 'EPARGNE' | 'TONTINE' | 'FRAIS' | 'ASSURANCE'

export interface ProduitImf {
  id: string
  code: string
  nom: string
  famille: FamilleProduit
  description: string
  actif: boolean
  taux_annuel_pct?: number
  montant_min_fcfa?: number
  montant_max_fcfa?: number
  duree_min_mois?: number
  duree_max_mois?: number
  frais_dossier_pct?: number
  assurance_obligatoire?: boolean
  garantie_groupe?: boolean
  clients_actifs: number
  encours_fcfa: number
  suggestion_ia?: string
}

export interface ProduitsHub {
  synthese_ia: string
  kpis: {
    produits_actifs: number
    encours_total_fcfa: number
    nouveaux_souscriptions_mois: number
    taux_utilisation_pct: number
  }
  produits: ProduitImf[]
  repartition_famille: Array<{ famille: FamilleProduit; count: number; encours_fcfa: number }>
}

const PRODUITS: ProduitImf[] = [
  { id: 'PR-CR-01', code: 'MIC-IND', nom: 'Microcrédit individuel', famille: 'CREDIT', description: 'Crédit personnel commerce, artisanat, services', actif: true, taux_annuel_pct: 24, montant_min_fcfa: 50_000, montant_max_fcfa: 2_000_000, duree_min_mois: 3, duree_max_mois: 12, frais_dossier_pct: 2, assurance_obligatoire: true, garantie_groupe: false, clients_actifs: 1842, encours_fcfa: 98_400_000, suggestion_ia: 'Top produit — PAR 7,2 %, maintenir plafond 2 M' },
  { id: 'PR-CR-02', code: 'CRED-GRP', nom: 'Crédit groupe solidarité', famille: 'CREDIT', description: 'Garantie croisée 5–15 membres', actif: true, taux_annuel_pct: 22, montant_min_fcfa: 500_000, montant_max_fcfa: 5_000_000, duree_min_mois: 6, duree_max_mois: 24, frais_dossier_pct: 1.5, assurance_obligatoire: true, garantie_groupe: true, clients_actifs: 47, encours_fcfa: 28_400_000, suggestion_ia: 'Coût acquisition −18 % vs individuel' },
  { id: 'PR-EP-01', code: 'EP-VUE', nom: 'Épargne à vue', famille: 'EPARGNE', description: 'Compte courant épargne, retraits libres', actif: true, taux_annuel_pct: 2.5, montant_min_fcfa: 5_000, clients_actifs: 2100, encours_fcfa: 52_000_000 },
  { id: 'PR-EP-02', code: 'DAT-6M', nom: 'DAT 6 mois', famille: 'EPARGNE', description: 'Dépôt à terme bloqué 6 mois', actif: true, taux_annuel_pct: 8.5, montant_min_fcfa: 100_000, duree_min_mois: 6, duree_max_mois: 6, clients_actifs: 412, encours_fcfa: 28_400_000 },
  { id: 'PR-TO-01', code: 'TONT-SOL', nom: 'Tontine solidaire', famille: 'TONTINE', description: 'Collecte rotative hebdomadaire', actif: true, montant_min_fcfa: 2_000, montant_max_fcfa: 50_000, clients_actifs: 89, encours_fcfa: 4_200_000, suggestion_ia: '18 groupes actifs — cycle 14 à clôturer' },
  { id: 'PR-FR-01', code: 'FRAIS-DOS', nom: 'Frais de dossier crédit', famille: 'FRAIS', description: 'Commission ouverture dossier', actif: true, frais_dossier_pct: 2, clients_actifs: 0, encours_fcfa: 1_240_000 },
  { id: 'PR-FR-02', code: 'FRAIS-MOMO', nom: 'Frais Mobile Money', famille: 'FRAIS', description: 'Commission retrait/dépôt MoMo', actif: true, frais_dossier_pct: 0.5, clients_actifs: 0, encours_fcfa: 890_000 },
  { id: 'PR-AS-01', code: 'ASS-DEC', nom: 'Assurance décès invalidité', famille: 'ASSURANCE', description: 'Couverture solde crédit en cas décès', actif: true, taux_annuel_pct: 1.2, assurance_obligatoire: true, clients_actifs: 1650, encours_fcfa: 3_800_000, suggestion_ia: 'Obligatoire sur microcrédit — 12 dossiers sans police' },
  { id: 'PR-AS-02', code: 'ASS-INC', nom: 'Assurance incendie stock', famille: 'ASSURANCE', description: 'PME commerce — stock marchandises', actif: true, taux_annuel_pct: 0.8, clients_actifs: 124, encours_fcfa: 620_000 },
]

export const PRODUITS_HUB: ProduitsHub = {
  synthese_ia:
    'Portefeuille 9 produits actifs · encours 217 M FCFA. Alerte : 12 dossiers crédit sans assurance DEC — bloquer décaissement. Tontine + DAT : opportunité cross-sell 34 clients dormants épargne. Revoir plafond microcrédit individuel (+15 % demandes > 1,5 M).',
  kpis: {
    produits_actifs: PRODUITS.filter((p) => p.actif).length,
    encours_total_fcfa: PRODUITS.reduce((s, p) => s + p.encours_fcfa, 0),
    nouveaux_souscriptions_mois: 186,
    taux_utilisation_pct: 78,
  },
  produits: PRODUITS,
  repartition_famille: (['CREDIT', 'EPARGNE', 'TONTINE', 'FRAIS', 'ASSURANCE'] as FamilleProduit[]).map((f) => ({
    famille: f,
    count: PRODUITS.filter((p) => p.famille === f).length,
    encours_fcfa: PRODUITS.filter((p) => p.famille === f).reduce((s, p) => s + p.encours_fcfa, 0),
  })),
}

export function getProduitsHub(): ProduitsHub {
  return PRODUITS_HUB
}
