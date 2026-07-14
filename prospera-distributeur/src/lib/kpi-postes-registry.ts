/**
 * KPI de performance par poste (spec V2 §3).
 * Chaque poste (hors DG) a 4-5 KPI valeur/objectif/tendance et un score global sur 100.
 * Le DG consulte la matrice agrégée de tous les postes sur /equipe.
 */
import type { UserRole } from '@/types'

export type PosteRole = Exclude<UserRole, 'DG'>

export interface KpiPoste {
  cle: string
  label: string
  valeur: number
  objectif: number
  unite: 'FCFA' | '%' | 'j' | '' | 'cmd' | 'visites'
  format: 'fcfa' | 'number' | 'pct' | 'jours'
  /** true = plus bas est meilleur (délai, impayés, ruptures) */
  invert: boolean
  sparkline: number[]
  variation_pct: number
  /** pondération dans le score de poste (Σ = 100) */
  poids: number
}

export interface PerformancePoste {
  role: PosteRole
  titre: string
  periode: string
  score_global: number
  kpis: KpiPoste[]
  points_forts: string[]
  axes_progres: string[]
}

export const PERIODE_KPI_POSTES = 'Juin 2026'
export const MOIS_SPARKLINE_KPI = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui'] as const

/** Taux d'atteinte d'un KPI, plafonné à 130 % pour qu'un seul KPI ne masque pas les autres. */
export function tauxAtteinte(kpi: KpiPoste): number {
  if (kpi.objectif <= 0) return 0
  const brut = kpi.invert
    ? (kpi.valeur <= 0 ? 130 : (kpi.objectif / kpi.valeur) * 100)
    : (kpi.valeur / kpi.objectif) * 100
  return Math.max(0, Math.min(130, Math.round(brut)))
}

/** Score de poste = moyenne des atteintes pondérée par `poids` (Σ poids = 100), plafonnée à 100. */
export function calculScorePoste(kpis: KpiPoste[]): number {
  const poidsTotal = kpis.reduce((s, k) => s + k.poids, 0)
  if (poidsTotal <= 0) return 0
  const somme = kpis.reduce((s, k) => s + tauxAtteinte(k) * k.poids, 0)
  return Math.min(100, Math.round(somme / poidsTotal))
}

export function statutScore(score: number): 'EXCELLENT' | 'BON' | 'A_SURVEILLER' | 'CRITIQUE' {
  if (score >= 90) return 'EXCELLENT'
  if (score >= 75) return 'BON'
  if (score >= 60) return 'A_SURVEILLER'
  return 'CRITIQUE'
}

export const STATUT_SCORE_STYLE: Record<ReturnType<typeof statutScore>, { label: string; badge: string; bar: string; text: string }> = {
  EXCELLENT:    { label: 'Excellent',      badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  BON:          { label: 'Bon',            badge: 'bg-teal-100 text-teal-700',       bar: 'bg-teal-500',    text: 'text-teal-600' },
  A_SURVEILLER: { label: 'À surveiller',   badge: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-500',   text: 'text-amber-600' },
  CRITIQUE:     { label: 'Critique',       badge: 'bg-red-100 text-red-700',         bar: 'bg-red-500',     text: 'text-red-600' },
}

type KpiDef = Omit<KpiPoste, never>

const k = (
  cle: string, label: string, valeur: number, objectif: number,
  unite: KpiPoste['unite'], format: KpiPoste['format'],
  invert: boolean, sparkline: number[], variation_pct: number, poids: number,
): KpiDef => ({ cle, label, valeur, objectif, unite, format, invert, sparkline, variation_pct, poids })

const DEFINITIONS: Record<PosteRole, Omit<PerformancePoste, 'score_global' | 'periode'>> = {
  DC: {
    role: 'DC',
    titre: 'Performance — Directeur Commercial',
    kpis: [
      k('ca_reseau', 'CA réseau', 268_400_000, 300_000_000, 'FCFA', 'fcfa', false, [231, 244, 252, 249, 261, 268].map(v => v * 1_000_000), 2.8, 30),
      k('couverture_tournees', 'Couverture tournées', 82, 90, '%', 'pct', false, [74, 77, 79, 78, 80, 82], 2.5, 20),
      k('marge_brute', 'Marge brute', 21.4, 24, '%', 'pct', false, [19.8, 20.2, 20.9, 20.4, 21.1, 21.4], 1.4, 25),
      k('nouveaux_pdv', 'Nouveaux PDV signés', 17, 25, '', 'number', false, [22, 19, 24, 15, 14, 17], 21.4, 15),
      k('conversion_prospects', 'Taux conversion prospects', 31, 40, '%', 'pct', false, [36, 34, 33, 29, 28, 31], 10.7, 10),
    ],
    points_forts: ['CA réseau à 89 % de l\'objectif malgré un marché tendu', 'Marge brute en hausse 3 mois consécutifs'],
    axes_progres: ['Nouveaux PDV : 17 / 25, le rythme de signature a chuté depuis avril', 'Conversion prospects sous les 40 % attendus'],
  },

  RESP_VENTES: {
    role: 'RESP_VENTES',
    titre: 'Performance — Responsable des Ventes',
    kpis: [
      k('ca_zone', 'CA zone / quota', 84_200_000, 95_000_000, 'FCFA', 'fcfa', false, [71, 78, 81, 76, 82, 84].map(v => v * 1_000_000), 2.4, 30),
      k('cmd_terrain_jour', 'Commandes terrain / jour', 47, 55, 'cmd', 'number', false, [41, 44, 48, 43, 46, 47], 2.2, 20),
      k('panier_moyen', 'Panier moyen', 62_400, 70_000, 'FCFA', 'fcfa', false, [58, 60, 63, 59, 61, 62.4].map(v => v * 1_000), 2.3, 20),
      k('pdv_actifs', 'PDV actifs / portefeuille', 78, 85, '%', 'pct', false, [72, 74, 77, 75, 76, 78], 2.6, 20),
      k('taux_rupture_cmd', 'Taux rupture commande', 9.2, 5, '%', 'pct', true, [12.1, 11.4, 10.2, 11.0, 9.8, 9.2], -6.1, 10),
    ],
    points_forts: ['PDV actifs au plus haut du semestre (78 %)', 'Rupture commande divisée par 1,3 depuis janvier'],
    axes_progres: ['CA zone à 89 % du quota — l\'écart se creuse sur Maritime', 'Panier moyen sous les 70 K visés'],
  },

  SUPERVISEUR: {
    role: 'SUPERVISEUR',
    titre: 'Performance — Superviseur de Zone',
    kpis: [
      k('couverture_visites', 'Couverture visites zone', 86, 95, '%', 'pct', false, [79, 82, 85, 81, 84, 86], 2.4, 25),
      k('commerciaux_quota', 'Commerciaux ≥ quota', 4, 6, '', 'number', false, [5, 5, 4, 3, 4, 4], 0, 25),
      k('pdv_risque_churn', 'PDV à risque churn', 11, 5, '', 'number', true, [7, 8, 9, 12, 12, 11], -8.3, 20),
      k('delai_litige', 'Délai traitement litige', 3.4, 2, 'j', 'jours', true, [4.8, 4.2, 3.9, 4.1, 3.6, 3.4], -5.6, 15),
      k('ca_zone_superv', 'CA zone', 41_800_000, 45_000_000, 'FCFA', 'fcfa', false, [36, 38, 40, 37, 41, 41.8].map(v => v * 1_000_000), 2.0, 15),
    ],
    points_forts: ['Délai de traitement des litiges ramené à 3,4 j (−29 % sur 6 mois)', 'CA zone à 93 % de l\'objectif'],
    axes_progres: ['11 PDV à risque de churn pour un plafond de 5', 'Seulement 4 commerciaux sur 6 atteignent leur quota'],
  },

  COMMERCIAL: {
    role: 'COMMERCIAL',
    titre: 'Performance — Commercial Terrain',
    kpis: [
      k('visites_jour', 'Visites / objectif jour', 28, 25, 'visites', 'number', false, [22, 24, 26, 23, 27, 28], 3.7, 25),
      k('commandes_prises', 'Commandes prises', 14, 15, 'cmd', 'number', false, [11, 12, 14, 12, 13, 14], 7.7, 20),
      k('ca_genere', 'CA généré', 2_800_000, 3_200_000, 'FCFA', 'fcfa', false, [2.1, 2.4, 2.7, 2.3, 2.6, 2.8].map(v => v * 1_000_000), 7.7, 25),
      k('transformation', 'Transformation visite → cmd', 50, 60, '%', 'pct', false, [44, 47, 52, 48, 49, 50], 2.0, 20),
      k('encaissement_terrain', 'Encaissement terrain', 71, 80, '%', 'pct', false, [64, 66, 70, 68, 69, 71], 2.9, 10),
    ],
    points_forts: ['Objectif de visites dépassé (28 / 25)', 'CA généré en hausse de 7,7 % vs mai'],
    axes_progres: ['Transformation visite → commande à 50 %, cible 60 %', 'Encaissement terrain sous les 80 % attendus'],
  },

  FREELANCE: {
    role: 'FREELANCE',
    titre: 'Performance — Commercial Freelance',
    kpis: [
      k('marge_nette', 'Marge nette dégagée', 1_240_000, 1_500_000, 'FCFA', 'fcfa', false, [0.94, 1.05, 1.18, 1.02, 1.16, 1.24].map(v => v * 1_000_000), 6.9, 30),
      k('ca_societe', 'CA société', 8_600_000, 10_000_000, 'FCFA', 'fcfa', false, [6.8, 7.4, 8.1, 7.2, 8.2, 8.6].map(v => v * 1_000_000), 4.9, 20),
      k('pdv_portefeuille', 'PDV portefeuille', 34, 40, '', 'number', false, [28, 30, 32, 31, 33, 34], 3.0, 15),
      k('respect_grille', 'Respect grille prix', 88, 95, '%', 'pct', false, [92, 90, 89, 86, 87, 88], 1.1, 25),
      k('nouveaux_pdv_fl', 'Nouveaux PDV', 3, 5, '', 'number', false, [4, 3, 5, 2, 2, 3], 50, 10),
    ],
    points_forts: ['Marge nette en progression continue depuis avril', 'Portefeuille PDV au plus haut (34)'],
    axes_progres: ['Respect de la grille prix à 88 % — 4 ventes sous la marge minimale de 12 %', 'Acquisition ralentie : 3 nouveaux PDV pour 5 visés'],
  },

  /**
   * Un prospecteur n'est pas un vendeur : on ne le mesure pas au CA ni aux visites, mais à
   * ce que ses ouvertures deviennent. Compter les comptes ouverts récompense l'ouverture
   * d'un compte qui meurt à M+3 ou qui ne paie jamais — exactement ce qui s'est passé sur
   * Grossiste Adidogomé. Les 5 KPI suivent la chaîne réelle : je convertis → ça survit →
   * ça paie → ça m'a coûté combien → je passe la main.
   */
  PROSPECTION: {
    role: 'PROSPECTION',
    titre: 'Performance — Chargé de Prospection',
    kpis: [
      k('survie_m3', 'Survie M+3 des ouvertures', 56, 75, '%', 'pct', false, [72, 68, 61, 58, 56, 56], -8.1, 30),
      k('conversion_recense', 'Recensé → 1ʳᵉ commande', 14, 25, '%', 'pct', false, [19, 18, 16, 15, 14, 14], -6.7, 25),
      k('impaye_1re_commande', 'Impayé sur 1ʳᵉ commande', 7, 2, '%', 'pct', true, [0, 0, 7, 7, 7, 7], 0, 20),
      k('cout_acquisition', 'Coût acquisition PDV', 34_900, 25_000, 'FCFA', 'fcfa', true, [41, 39, 36, 38, 35.8, 34.9].map(v => v * 1_000), -2.5, 15),
      k('passation_secteur', 'Ouvertures transférées', 36, 90, '%', 'pct', false, [64, 58, 50, 43, 38, 36], -5.3, 10),
    ],
    points_forts: [
      'Coût d\'acquisition en baisse continue — le recensement terrain est efficace',
      'Zone Aného abandonnée à raison : 45 km, la desserte mangeait la marge',
    ],
    axes_progres: [
      '5,25 M d\'impayés sur une 1ʳᵉ commande à crédit 30 j — le plafond de 1,5 M a été franchi',
      '5 PDV ouverts jamais transférés à un commercial de secteur : personne ne les visite',
      'Le carnet ne fuit pas au recensement mais à l\'offre — 3 dossiers comptants perdus faute de relance',
    ],
  },

  RESP_STOCK: {
    role: 'RESP_STOCK',
    titre: 'Performance — Responsable Stock & Logistique',
    kpis: [
      k('taux_service', 'Taux service entrepôts', 91, 97, '%', 'pct', false, [88, 90, 92, 89, 90, 91], 1.1, 30),
      k('ruptures_sku', 'Ruptures SKU', 12, 5, '', 'number', true, [8, 9, 7, 11, 13, 12], -7.7, 25),
      k('rotation_stock', 'Rotation stock', 38, 30, 'j', 'jours', true, [44, 42, 39, 41, 39, 38], -2.6, 15),
      k('reappro_delai', 'Réappro dans le délai', 76, 90, '%', 'pct', false, [82, 80, 78, 74, 75, 76], 1.3, 20),
      k('stock_immobilise', 'Valeur stock immobilisé', 18_400_000, 12_000_000, 'FCFA', 'fcfa', true, [14.2, 15.1, 16.4, 17.8, 18.9, 18.4].map(v => v * 1_000_000), -2.6, 10),
    ],
    points_forts: ['Rotation de stock ramenée à 38 j (−14 % sur 6 mois)', 'Taux de service stabilisé au-dessus de 90 %'],
    axes_progres: ['12 SKU en rupture pour un plafond de 5 — réappro à automatiser', 'Stock immobilisé à 18,4 M, 53 % au-dessus de la cible'],
  },

  GEST_ENTREPOT: {
    role: 'GEST_ENTREPOT',
    titre: 'Performance — Gestionnaire Entrepôt',
    kpis: [
      k('delai_preparation', 'Délai préparation', 1.4, 1, 'j', 'jours', true, [2.1, 1.9, 1.7, 1.8, 1.5, 1.4], -6.7, 25),
      k('expeditions_jour', 'Expéditions / jour', 34, 40, '', 'number', false, [28, 31, 35, 30, 33, 34], 3.0, 25),
      k('erreur_picking', 'Taux erreur picking', 2.8, 1.5, '%', 'pct', true, [4.1, 3.7, 3.2, 3.5, 3.0, 2.8], -6.7, 20),
      k('bl_attente', 'BL en attente', 9, 3, '', 'number', true, [5, 6, 4, 8, 11, 9], -18.2, 15),
      k('taux_service_entrepot', 'Taux service entrepôt', 93, 97, '%', 'pct', false, [89, 91, 94, 90, 92, 93], 1.1, 15),
    ],
    points_forts: ['Délai de préparation ramené à 1,4 j (−33 % sur 6 mois)', 'Taux d\'erreur de picking en baisse continue'],
    axes_progres: ['9 BL en attente pour un plafond de 3', 'Expéditions à 34 / jour, cible 40'],
  },

  DAF: {
    role: 'DAF',
    titre: 'Performance — Directeur Administratif & Financier',
    kpis: [
      k('solde_tresorerie', 'Solde trésorerie', 47_600_000, 60_000_000, 'FCFA', 'fcfa', false, [58, 54, 51, 49, 46, 47.6].map(v => v * 1_000_000), 3.5, 25),
      k('marge_nette_daf', 'Marge nette', 8.4, 11, '%', 'pct', false, [9.8, 9.4, 9.1, 8.6, 8.2, 8.4], 2.4, 25),
      k('dette_echue', 'Dette fournisseurs échue', 43_800_000, 15_000_000, 'FCFA', 'fcfa', true, [22, 27, 31, 38, 41, 43.8].map(v => v * 1_000_000), 6.8, 25),
      k('dso', 'DSO — délai encaissement', 52, 35, 'j', 'jours', true, [41, 44, 47, 49, 51, 52], 2.0, 15),
      k('ecart_budget', 'Écart budget vs réel', 6.2, 3, '%', 'pct', true, [3.1, 3.8, 4.4, 5.1, 5.8, 6.2], 6.9, 10),
    ],
    points_forts: ['Trésorerie remontée de 3,5 % vs mai après 4 mois de baisse'],
    axes_progres: [
      'Dette fournisseurs échue à 43,8 M — près de 3× le plafond, elle triple depuis janvier',
      'DSO dégradé à 52 j : chaque mois d\'aggravation coûte de la trésorerie',
      'Marge nette sous les 11 % visés',
    ],
  },

  COMPTABLE: {
    role: 'COMPTABLE',
    titre: 'Performance — Comptable',
    kpis: [
      k('ecritures_jour', 'Écritures saisies / jour', 118, 130, '', 'number', false, [96, 104, 121, 108, 114, 118], 3.5, 20),
      k('taux_rapprochement', 'Taux rapprochement', 94, 98, '%', 'pct', false, [88, 90, 93, 91, 92, 94], 2.2, 25),
      k('suspens_ouverts', 'Suspens ouverts', 23, 10, '', 'number', true, [14, 16, 13, 19, 26, 23], -11.5, 25),
      k('delai_cloture', 'Délai clôture', 8, 5, 'j', 'jours', true, [11, 10, 9, 10, 8, 8], 0, 15),
      k('factures_traitees', 'Factures traitées / jour', 41, 50, '', 'number', false, [34, 36, 43, 38, 40, 41], 2.5, 15),
    ],
    points_forts: ['Taux de rapprochement au plus haut (94 %)', 'Délai de clôture ramené de 11 à 8 jours'],
    axes_progres: ['23 suspens ouverts pour un plafond de 10 — pic depuis mai', 'Volume de saisie sous la cible (118 / 130)'],
  },

  MARKETING: {
    role: 'MARKETING',
    titre: 'Performance — Responsable Marketing',
    kpis: [
      k('roi_campagnes', 'ROI campagnes', 214, 250, '%', 'pct', false, [176, 188, 231, 197, 205, 214], 4.4, 30),
      k('pdv_touches', 'PDV touchés', 187, 220, '', 'number', false, [142, 158, 194, 166, 178, 187], 5.1, 20),
      k('conversion_promo', 'Taux conversion promo', 34, 40, '%', 'pct', false, [28, 31, 37, 32, 33, 34], 3.0, 20),
      k('cout_pdv_active', 'Coût / PDV activé', 12_800, 9_000, 'FCFA', 'fcfa', true, [16.2, 15.1, 13.4, 14.2, 13.1, 12.8].map(v => v * 1_000), -2.3, 15),
      k('ca_combos', 'CA généré par combos', 14_200_000, 18_000_000, 'FCFA', 'fcfa', false, [9.8, 11.4, 13.9, 12.1, 13.4, 14.2].map(v => v * 1_000_000), 6.0, 15),
    ],
    points_forts: ['ROI campagnes à 214 %, en hausse 3 mois d\'affilée', 'Coût par PDV activé en baisse de 21 % sur 6 mois'],
    axes_progres: ['PDV touchés à 187 / 220', 'Conversion promo à 34 %, cible 40 %'],
  },

  RECOUVREMENT: {
    role: 'RECOUVREMENT',
    titre: 'Performance — Responsable Recouvrement',
    kpis: [
      k('montant_encaisse', 'Montant encaissé', 31_400_000, 40_000_000, 'FCFA', 'fcfa', false, [24, 27, 33, 28, 30, 31.4].map(v => v * 1_000_000), 4.7, 30),
      k('taux_encaissement', 'Taux encaissement', 68, 82, '%', 'pct', false, [74, 72, 71, 69, 67, 68], 1.5, 25),
      k('dso_recouv', 'DSO', 52, 35, 'j', 'jours', true, [41, 44, 47, 49, 51, 52], 2.0, 20),
      k('relances_abouties', 'Relances abouties', 44, 60, '%', 'pct', false, [51, 49, 47, 45, 42, 44], 4.8, 15),
      k('creances_60j', 'Créances > 60 j', 28_600_000, 10_000_000, 'FCFA', 'fcfa', true, [16, 19, 22, 25, 27, 28.6].map(v => v * 1_000_000), 5.9, 10),
    ],
    points_forts: ['Montant encaissé en hausse de 4,7 % vs mai'],
    axes_progres: [
      'Taux d\'encaissement en baisse continue depuis janvier (74 % → 68 %)',
      'Créances > 60 j à 28,6 M, presque 3× le plafond',
      'DSO à 52 j : le poste ne rattrape pas la dérive du crédit client',
    ],
  },
}

export const KPI_POSTES: Record<PosteRole, PerformancePoste> = Object.fromEntries(
  (Object.entries(DEFINITIONS) as [PosteRole, Omit<PerformancePoste, 'score_global' | 'periode'>][])
    .map(([role, def]) => [role, {
      ...def,
      periode: PERIODE_KPI_POSTES,
      score_global: calculScorePoste(def.kpis),
    }]),
) as Record<PosteRole, PerformancePoste>

export function buildPerformancePoste(role: UserRole): PerformancePoste | null {
  if (role === 'DG') return null
  return KPI_POSTES[role] ?? null
}

/** Postes rattachés à la direction commerciale — périmètre visible par le DC. */
export const POSTES_PERIMETRE_COMMERCIAL: PosteRole[] = [
  'RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION',
]

/**
 * Matrice des postes, triée par score décroissant — vue DG / DC sur /equipe.
 * Sans périmètre : tous les postes (DG). Avec périmètre : uniquement ces postes (DC).
 */
export function buildMatricePostes(perimetre?: PosteRole[]): PerformancePoste[] {
  const postes = perimetre
    ? perimetre.map(role => KPI_POSTES[role]).filter(Boolean)
    : Object.values(KPI_POSTES)
  return [...postes].sort((a, b) => b.score_global - a.score_global)
}

export const LIBELLE_POSTE: Record<PosteRole, string> = {
  DC: 'Directeur Commercial',
  RESP_VENTES: 'Responsable des Ventes',
  SUPERVISEUR: 'Superviseur de Zone',
  COMMERCIAL: 'Commercial Terrain',
  FREELANCE: 'Commercial Freelance',
  PROSPECTION: 'Chargé de Prospection',
  RESP_STOCK: 'Responsable Stock',
  GEST_ENTREPOT: 'Gestionnaire Entrepôt',
  DAF: 'Directeur Financier',
  COMPTABLE: 'Comptable',
  MARKETING: 'Responsable Marketing',
  RECOUVREMENT: 'Responsable Recouvrement',
}

/** Valeur formatée d'un KPI pour l'affichage. */
export function formatValeurKpi(kpi: KpiPoste): string {
  switch (kpi.format) {
    case 'fcfa': {
      const n = kpi.valeur
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`
      if (n >= 1_000) return `${Math.round(n / 1_000)} K`
      return n.toLocaleString('fr-FR')
    }
    case 'pct': return `${kpi.valeur}%`
    case 'jours': return `${kpi.valeur} j`
    default: return kpi.valeur.toLocaleString('fr-FR')
  }
}

export function formatObjectifKpi(kpi: KpiPoste): string {
  const prefixe = kpi.invert ? '≤' : '≥'
  const valeur = formatValeurKpi({ ...kpi, valeur: kpi.objectif })
  return `${prefixe} ${valeur}`
}
