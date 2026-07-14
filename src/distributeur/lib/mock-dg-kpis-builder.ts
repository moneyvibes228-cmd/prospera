/**
 * KPIs DG distributeur — dérivés des registres zones + entreprise.
 * Courbes 6 mois volatiles (pas de hausse linéaire systématique).
 */
import { ZONES_DISTRIBUTION, RESEAU_CONSOLIDE_DIST } from './registries/zones-registry'
import { getPilotageAxeById } from './pilotage-axes-dg'
import { CA_SPARKLINE_REGISTRY } from './registries/entreprise-registry'
import { REGISTRE_STOCK } from './registries/stock-registry'
import { ENTREPOTS_DISTRIBUTION } from './registries/entrepots-registry'

export const SPARKLINE_MOIS_DG = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'] as const

/** KPIs dont une hausse est défavorable (rouge si variation > 0) */
export const KPI_INVERT_VARIATION = new Set([
  'impayes', 'ruptures', 'taux_service', 'delai_prep', 'pdv_risque',
])

export interface KpiGlobalDG {
  cle: string
  label: string
  valeur: number | string
  unite: string
  variation_pct: number
  variation_label: string
  sparkline: number[]
  couleur: 'teal' | 'green' | 'orange' | 'red' | 'blue' | 'purple'
  categorie: 'COMMERCIAL' | 'FINANCE' | 'OPERATIONS'
  format?: 'number' | 'fcfa' | 'pct' | 'raw'
}

export interface AnomalieJour {
  id: string
  titre: string
  detail: string
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  zone?: string
  acteur?: string
}

export type DomaineInsightDG =
  | 'CREDIT_B2B'
  | 'SUPPLY_CHAIN'
  | 'LOGISTIQUE'
  | 'CANAL_VRP'
  | 'CANAL_FREELANCE'
  | 'PROSPECTION'
  | 'PREVISION_SORTIES'

export interface AiInsightOperationnel {
  titre: string
  detail: string
  type: 'ALERTE' | 'OPPORTUNITE' | 'ACTION' | 'PREVISION'
  confidence: number
  impact?: 'CRITIQUE' | 'ELEVE' | 'MODERE' | 'INFO'
  domaine: DomaineInsightDG
  acteur?: string
  detecte_il_y_a?: string
  delai?: string
}

export const DOMAINE_INSIGHT_LABELS: Record<DomaineInsightDG, string> = {
  CREDIT_B2B: 'Crédit client B2B',
  SUPPLY_CHAIN: 'Supply chain',
  LOGISTIQUE: 'Entrepôt & expéditions',
  CANAL_VRP: 'Canal VRP salariés',
  CANAL_FREELANCE: 'Canal freelance',
  PROSPECTION: 'Prospection grossiste',
  PREVISION_SORTIES: 'Prévision sorties',
}

export interface CreanceAgingTranche {
  tranche: string
  montant: number
  count: number
  color: string
}

export interface RepartitionCategorie {
  categorie: string
  ca_pct: number
  ca_mois: number
  ruptures: number
  color: string
}

export interface ForecastCA {
  mois: string
  sorties_prevues: number
  commandes_prevues: number
  marge_prevue: number
  confidence: number
}

const caSparkM = CA_SPARKLINE_REGISTRY.map(r => r.ca * 1_000_000)

export function buildKpisGlobauxDG(): KpiGlobalDG[] {
  const r = RESEAU_CONSOLIDE_DIST
  const couverture = Math.round(ZONES_DISTRIBUTION.reduce((s, z) => s + z.couverture_visites_pct, 0) / ZONES_DISTRIBUTION.length)
  const encaissement = 77
  const marge = 18.2
  const expeditionsJour = ENTREPOTS_DISTRIBUTION.reduce((s, e) => s + e.livraisons_jour, 0)
  const tauxService = 93
  const pdvARisque = ZONES_DISTRIBUTION.reduce((s, z) => s + z.pdv_a_risque, 0)
  const panierMoyen = 3_200_000
  const objPct = Math.round((r.ca_mois / r.ca_objectif) * 100)

  return [
    {
      cle: 'ventes_sorties',
      label: 'Ventes sorties entrepôt',
      valeur: r.ca_mois,
      unite: 'FCFA',
      variation_pct: 1.7,
      variation_label: `${objPct}% quota · creux avril`,
      sparkline: caSparkM,
      couleur: 'teal',
      categorie: 'COMMERCIAL',
      format: 'fcfa',
    },
    {
      cle: 'commandes_jour',
      label: 'Commandes terrain / jour',
      valeur: r.commandes_jour,
      unite: '',
      variation_pct: 5.2,
      variation_label: 'panier moy. 3,2 M',
      sparkline: [108, 115, 112, 104, 118, r.commandes_jour],
      couleur: 'green',
      categorie: 'COMMERCIAL',
      format: 'number',
    },
    {
      cle: 'couverture',
      label: 'Couverture tournées',
      valeur: `${couverture}%`,
      unite: '',
      variation_pct: -3.2,
      variation_label: 'Lomé Est 62% · obj. 90%',
      sparkline: [86, 85, 84, 82, 80, couverture],
      couleur: 'orange',
      categorie: 'COMMERCIAL',
      format: 'pct',
    },
    {
      cle: 'panier_moyen',
      label: 'Panier moyen commande',
      valeur: panierMoyen,
      unite: 'FCFA',
      variation_pct: -2.1,
      variation_label: 'pression prix alimentaire',
      sparkline: [3_450_000, 3_380_000, 3_320_000, 3_280_000, 3_250_000, panierMoyen],
      couleur: 'blue',
      categorie: 'COMMERCIAL',
      format: 'fcfa',
    },
    {
      cle: 'impayes',
      label: 'Encours clients impayés',
      valeur: r.creances_retard,
      unite: 'FCFA',
      variation_pct: 4.1,
      variation_label: `${Math.round((r.creances_retard / r.creances_total) * 100)}% poste clients`,
      sparkline: [36.5, 38.2, 39.8, 38.5, 41.1, r.creances_retard / 1_000_000].map(v =>
        v < 100 ? Math.round(v * 1_000_000) : v,
      ),
      couleur: 'red',
      categorie: 'FINANCE',
      format: 'fcfa',
    },
    {
      cle: 'encaissement',
      label: 'Taux encaissement',
      valeur: `${encaissement}%`,
      unite: '',
      variation_pct: 1.3,
      variation_label: 'écart -8 pt vs obj. 85%',
      sparkline: [79, 78, 76, 75, 74, encaissement],
      couleur: 'teal',
      categorie: 'FINANCE',
      format: 'pct',
    },
    {
      cle: 'marge',
      label: 'Marge brute grossiste',
      valeur: `${marge}%`,
      unite: '',
      variation_pct: -0.3,
      variation_label: 'pression huile & promo',
      sparkline: [18.5, 18.4, 18.3, 18.1, 18.0, marge],
      couleur: 'green',
      categorie: 'FINANCE',
      format: 'pct',
    },
    {
      cle: 'ruptures',
      label: 'Ruptures SKU',
      valeur: r.ruptures_stock,
      unite: 'réf.',
      variation_pct: 16.7,
      variation_label: 'Huile 5L · Savon Kara',
      sparkline: [7, 8, 9, 11, 12, r.ruptures_stock],
      couleur: 'orange',
      categorie: 'OPERATIONS',
      format: 'number',
    },
    {
      cle: 'taux_service',
      label: 'Taux service entrepôts',
      valeur: `${tauxService}%`,
      unite: '',
      variation_pct: -1.1,
      variation_label: 'Lomé Port 91% · Kara 96%',
      sparkline: [95, 94, 93, 94, 93, tauxService],
      couleur: 'purple',
      categorie: 'OPERATIONS',
      format: 'pct',
    },
    {
      cle: 'expeditions',
      label: 'Expéditions / jour',
      valeur: expeditionsJour,
      unite: '',
      variation_pct: 0,
      variation_label: `${pdvARisque} détaillants à risque`,
      sparkline: [16, 17, 18, 16, 17, expeditionsJour],
      couleur: 'blue',
      categorie: 'OPERATIONS',
      format: 'number',
    },
  ]
}

export function buildAnomaliesJour(): AnomalieJour[] {
  return [
    { id: 'a1', titre: 'Kiosque Port — crédit client bloqué', detail: '890 000 FCFA impayés J+45 · risque coupure approvisionnement · escalade superviseur', severite: 'CRITIQUE', zone: 'Lomé Centre', acteur: 'Komlan Tetteh' },
    { id: 'a2', titre: 'Huile 5L — rupture entrepôt', detail: 'Stock 180 / seuil 200 · 34 détaillants alimentaires sans réappro sous 5j', severite: 'CRITIQUE', zone: 'Réseau', acteur: 'Yao Mensah' },
    { id: 'a3', titre: 'Lomé Est — tournées en retard', detail: 'Couverture 62% · 12 PDV sans passage commercial · Boutique Nouvelle non convertie', severite: 'HAUTE', zone: 'Lomé Est', acteur: 'Mawuena Ahi' },
    { id: 'a4', titre: 'Savon ménager Kara — sous seuil', detail: '45 unités / seuil 80 · risque rupture zone Nord', severite: 'HAUTE', zone: 'Kara', acteur: 'Yao Mensah' },
    { id: 'a5', titre: 'Freelance Kofi — marge en hausse', detail: '+18% marge jour vs M-1 · 2 nouveaux PDV signés', severite: 'MODEREE', zone: 'Lomé Sud', acteur: 'Kofi Agbessi' },
  ]
}

export function buildInsightsOperationnels(axeId?: string | null): AiInsightOperationnel[] {
  const axe = axeId ? getPilotageAxeById(axeId) : null
  const p = axe ? `${axe.nom_court} · ` : ''

  type InsightInterne = AiInsightOperationnel & { _axe?: string[]; _priorite: number }

  const items: InsightInterne[] = [
    {
      _priorite: 1,
      titre: `${p}Plafond crédit dépassé — Kiosque Port`,
      detail: 'Encours 890 K FCFA à J+45 sur plafond 500 K. Commandes à crédit bloquées par l\'IA — 3 BLP en attente validation superviseur. Encaissement probable 72% sous 48h avec visite terrain vs 38% relance WhatsApp seule.',
      type: 'ALERTE', confidence: 91, impact: 'CRITIQUE', domaine: 'CREDIT_B2B',
      acteur: 'Responsable recouvrement', detecte_il_y_a: '2h', delai: 'Aujourd\'hui',
      _axe: ['ent-lome-port', 'can-vrp-salaries'],
    },
    {
      _priorite: 2,
      titre: `${p}Rupture imminente — Huile 5L (PRD-HUILE-5L)`,
      detail: 'Stock Lomé Port : 180 cartons / seuil 200 · VSS 0,9 semaine. Valider bon d\'achat fournisseur 400 cartons avant vendredi. 34 détaillants alimentaires sans réappro — risque bascule concurrent sous 72h.',
      type: 'ACTION', confidence: 87, impact: 'ELEVE', domaine: 'SUPPLY_CHAIN',
      acteur: 'Edem Kpodo · Gestion entrepôt', detecte_il_y_a: '4h', delai: '48h',
      _axe: ['ent-lome-port'],
    },
    {
      _priorite: 3,
      titre: `${p}Retard préparation — plateforme Lomé Port`,
      detail: 'Délai moyen picking 1,4j (obj. 1,2j). 7 bons de livraison en attente sur huile et riz 25kg. Taux service 91% — 6 expéditions départ hier après 17h. Réorganiser vague matinale alimentaire.',
      type: 'ALERTE', confidence: 84, impact: 'ELEVE', domaine: 'LOGISTIQUE',
      acteur: 'Edem Kpodo', detecte_il_y_a: '3h', delai: 'Demain matin',
      _axe: ['ent-lome-port'],
    },
    {
      _priorite: 4,
      titre: `${p}Transfert stock — Savon Kara (PRD-SAVON-PACK)`,
      detail: '45 cartons / seuil 80 à l\'entrepôt Kara. 12 détaillants hygiène nord sans réappro sous 10j. Options IA : achat direct 120 cartons ou transfert interne depuis Lomé Port (coût logistique +180 K).',
      type: 'ACTION', confidence: 81, impact: 'ELEVE', domaine: 'SUPPLY_CHAIN',
      acteur: 'Afi Mensah · Kara', detecte_il_y_a: '3h', delai: '7 jours',
      _axe: ['ent-kara'],
    },
    {
      _priorite: 5,
      titre: `${p}Canal VRP — 12 détaillants sans tournée 15j`,
      detail: 'Couverture Lomé Est à 62% (obj. 90%). 12 PDV sans passage commercial, dont 4 comptes alimentaire actifs. Plan de reprise : 3 VRP × 4 PDV prioritaires — gain estimé +23 M sorties en juillet.',
      type: 'ACTION', confidence: 88, impact: 'ELEVE', domaine: 'CANAL_VRP',
      acteur: 'Kodjo Agbeko · DC', detecte_il_y_a: '5h', delai: '7 jours',
      _axe: ['can-vrp-salaries'],
    },
    {
      _priorite: 6,
      titre: `${p}1ère commande bloquée — Boutique Nouvelle`,
      detail: 'Prospect alimentaire Lomé Est : 3 visites, 0 commande au tarif grossiste. Friction probable sur plafond crédit initial. Tester offre découverte -5% sur 1ère BLP + plafond 200 K validé par superviseur.',
      type: 'ALERTE', confidence: 76, impact: 'MODERE', domaine: 'PROSPECTION',
      acteur: 'Mawuena Ahi', detecte_il_y_a: '5h', delai: '72h',
      _axe: ['can-prospection', 'can-vrp-salaries'],
    },
    {
      _priorite: 7,
      titre: `${p}Grilles prix freelance — 3 sous seuil marge`,
      detail: 'Kofi Agbessi : marge nette +18% vs M-1 (référence canal). 3 indépendants vendent sous marge minimale 12% sur huile et eau — érosion estimée 4,2 M/mois sur prix société inchangé.',
      type: 'OPPORTUNITE', confidence: 82, impact: 'MODERE', domaine: 'CANAL_FREELANCE',
      acteur: 'Kodjo Agbeko', detecte_il_y_a: '6h', delai: '14 jours',
      _axe: ['can-freelance'],
    },
    {
      _priorite: 8,
      titre: `${p}Sorties entrepôt juillet — scénario central`,
      detail: '428 M FCFA prévus (conf. 79%) si réappro huile J+3 et reprise VRP Lomé Est. Scénario pessimiste 405 M : rupture huile >5j + 23 factures clients >30j. Écart vs quota 450 M : -22 M à combler sur boissons saison.',
      type: 'PREVISION', confidence: 79, impact: 'INFO', domaine: 'PREVISION_SORTIES',
      detecte_il_y_a: '06:00',
      _axe: [],
    },
    {
      _priorite: 9,
      titre: `${p}VRP référence — modèle tournée Komlan Tetteh`,
      detail: '+12% vs quota vendeur · 28 tournées/j · 14 commandes terrain · panier 3,4 M. Séquence type : PDV à risque churn d\'abord, puis réappro alimentaire. À déployer sur 5 VRP Lomé Est.',
      type: 'OPPORTUNITE', confidence: 94, impact: 'MODERE', domaine: 'CANAL_VRP',
      acteur: 'Kodjo Agbeko', detecte_il_y_a: '6h',
      _axe: ['can-vrp-salaries'],
    },
  ]

  const filtered = axeId
    ? items.filter(i => !i._axe?.length || i._axe.includes(axeId))
    : items.filter(i => i._priorite <= 6)

  return filtered
    .sort((a, b) => a._priorite - b._priorite)
    .map(({ _axe: _, _priorite: __, ...rest }) => rest)
}

export function buildCreancesAging(): CreanceAgingTranche[] {
  return [
    { tranche: '0 – 15 jours', montant: 98_400_000, count: 1240, color: '#16a34a' },
    { tranche: '16 – 30 jours', montant: 45_200_000, count: 412, color: '#84cc16' },
    { tranche: '31 – 60 jours', montant: 28_600_000, count: 128, color: '#f97316' },
    { tranche: '> 60 jours', montant: 14_200_000, count: 67, color: '#dc2626' },
  ]
}

export function buildRepartitionCategories(): RepartitionCategorie[] {
  const ruptures = REGISTRE_STOCK.filter(p => p.stock < p.seuil).length
  return [
    { categorie: 'Boissons', ca_pct: 38, ca_mois: 156_560_000, ruptures: 1, color: '#3b82f6' },
    { categorie: 'Alimentaire', ca_pct: 34, ca_mois: 140_080_000, ruptures: ruptures > 0 ? 2 : 1, color: '#f97316' },
    { categorie: 'Hygiène', ca_pct: 18, ca_mois: 74_160_000, ruptures: 1, color: '#a855f7' },
    { categorie: 'Autres', ca_pct: 10, ca_mois: 41_200_000, ruptures: 0, color: '#64748b' },
  ]
}

export function buildForecastCA(): ForecastCA[] {
  return [
    { mois: 'Juil', sorties_prevues: 428, commandes_prevues: 134, marge_prevue: 18.4, confidence: 79 },
    { mois: 'Août', sorties_prevues: 435, commandes_prevues: 131, marge_prevue: 18.6, confidence: 74 },
    { mois: 'Sep', sorties_prevues: 418, commandes_prevues: 128, marge_prevue: 18.1, confidence: 68 },
  ]
}

export const KPIS_GLOBAUX_DG = buildKpisGlobauxDG()
export const ANOMALIES_JOUR = buildAnomaliesJour()
