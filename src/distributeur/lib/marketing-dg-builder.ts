/**
 * Marketing & Prospection DG — campagnes, leads, segmentation, décisions IA.
 */
import {
  REGISTRE_CAMPAGNES,
  REGISTRE_LEADS,
  SEGMENTS_IA,
  ZONES_BLANCHES,
  DECISIONS_IA_DG,
  type CampagneMarketing,
  type LeadProspection,
  type StatutCampagne,
  type StatutLead,
  type CanalCampagne,
} from './registries/marketing-registry'
import { buildCatalogueDG } from './catalogue-dg-builder'
import { buildAnalyseEcoulementStock } from './marketing-combo-stock-builder'
import { formatFcfa } from './utils'

export type VueMarketingDG = 'campagnes' | 'leads' | 'segments' | 'zones'

export interface CampagneDG extends CampagneMarketing {
  taux_contact_pct: number
  taux_ouverture_pct: number
  taux_reponse_pct: number
  taux_conversion_pct: number
  roi_pct: number
  cout_par_conversion: number
}

export interface SyntheseMarketingDG {
  campagnes_actives: number
  ca_genere_total: number
  marge_generee_total: number
  budget_consomme: number
  roi_moyen_pct: number
  leads_actifs: number
  leads_chauds: number
  taux_conversion_wa_pct: number
  cout_acquisition_moyen: number
  zones_blanches_prioritaires: number
}

export interface AnalyseMarketingIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  action: string
}

export interface ColonneLeads {
  statut: StatutLead
  label: string
  couleur: string
  leads: LeadProspection[]
  potentiel_total: number
}

export const STATUT_CAMPAGNE_STYLE: Record<StatutCampagne, string> = {
  EN_COURS: 'bg-emerald-100 text-emerald-700',
  PLANIFIEE: 'bg-sky-100 text-sky-700',
  TERMINEE: 'bg-slate-100 text-slate-600',
  PAUSE: 'bg-amber-100 text-amber-700',
}

export const STATUT_LEAD_LABEL: Record<StatutLead, string> = {
  NOUVEAU: 'Nouveau',
  QUALIFIE: 'Qualifié',
  CHAUD: 'Chaud',
  NEGOCIATION: 'Négociation',
  CONVERTI: 'Converti',
  PERDU: 'Perdu',
}

const LEADS_COLONNES: { statut: StatutLead; label: string; couleur: string }[] = [
  { statut: 'NOUVEAU', label: 'Nouveaux', couleur: 'border-violet-200 bg-violet-50' },
  { statut: 'QUALIFIE', label: 'Qualifiés', couleur: 'border-sky-200 bg-sky-50' },
  { statut: 'CHAUD', label: 'Chauds', couleur: 'border-orange-200 bg-orange-50' },
  { statut: 'NEGOCIATION', label: 'Négociation', couleur: 'border-amber-200 bg-amber-50' },
  { statut: 'CONVERTI', label: 'Convertis', couleur: 'border-emerald-200 bg-emerald-50' },
  { statut: 'PERDU', label: 'Perdus', couleur: 'border-slate-200 bg-slate-50' },
]

export function enrichCampagneDG(c: CampagneMarketing): CampagneDG {
  const roi = c.cout_campagne > 0 ? Math.round((c.marge_generee / c.cout_campagne) * 100) : 0
  return {
    ...c,
    taux_contact_pct: c.cibles > 0 ? Math.round((c.contactes / c.cibles) * 100) : 0,
    taux_ouverture_pct: c.contactes > 0 ? Math.round((c.ouverts / c.contactes) * 100) : 0,
    taux_reponse_pct: c.ouverts > 0 ? Math.round((c.repondus / c.ouverts) * 100) : 0,
    taux_conversion_pct: c.contactes > 0 ? Math.round((c.convertis / c.contactes) * 100) : 0,
    roi_pct: roi,
    cout_par_conversion: c.convertis > 0 ? Math.round(c.cout_campagne / c.convertis) : 0,
  }
}

export function buildCampagnesDG(extra: CampagneMarketing[] = []): CampagneDG[] {
  return [...REGISTRE_CAMPAGNES, ...extra].map(enrichCampagneDG)
}

export function buildSyntheseMarketingDG(campagnes: CampagneDG[], leads: LeadProspection[]): SyntheseMarketingDG {
  const actives = campagnes.filter(c => c.statut === 'EN_COURS' || c.statut === 'PLANIFIEE')
  const waCampagnes = campagnes.filter(c => c.canal === 'WHATSAPP' || c.canal === 'MIXTE' || c.canal === 'CHATBOT')
  const totalConvertis = waCampagnes.reduce((s, c) => s + c.convertis, 0)
  const totalContactes = waCampagnes.reduce((s, c) => s + c.contactes, 0)
  const totalCout = campagnes.reduce((s, c) => s + c.cout_campagne, 0)
  const totalConvertisAll = campagnes.reduce((s, c) => s + c.convertis, 0)

  return {
    campagnes_actives: actives.length,
    ca_genere_total: campagnes.reduce((s, c) => s + c.ca_genere, 0),
    marge_generee_total: campagnes.reduce((s, c) => s + c.marge_generee, 0),
    budget_consomme: totalCout,
    roi_moyen_pct: totalCout > 0
      ? Math.round(campagnes.reduce((s, c) => s + c.marge_generee, 0) / totalCout * 100)
      : 0,
    leads_actifs: leads.filter(l => !['CONVERTI', 'PERDU'].includes(l.statut)).length,
    leads_chauds: leads.filter(l => l.statut === 'CHAUD' || l.statut === 'NEGOCIATION').length,
    taux_conversion_wa_pct: totalContactes > 0 ? Math.round((totalConvertis / totalContactes) * 100) : 0,
    cout_acquisition_moyen: totalConvertisAll > 0 ? Math.round(totalCout / totalConvertisAll) : 0,
    zones_blanches_prioritaires: ZONES_BLANCHES.filter(z => z.priorite_ia >= 70).length,
  }
}

export function buildPipelineLeads(leads: LeadProspection[] = REGISTRE_LEADS): ColonneLeads[] {
  return LEADS_COLONNES.map(col => {
    const items = leads.filter(l => l.statut === col.statut)
    return {
      ...col,
      leads: items,
      potentiel_total: items.reduce((s, l) => s + l.ca_potentiel_mois, 0),
    }
  }).filter(col => col.leads.length > 0)
}

export function buildAnalysesMarketingIA(campagnes: CampagneDG[]): AnalyseMarketingIA[] {
  const analyses: AnalyseMarketingIA[] = []

  const rentree = campagnes.find(c => c.id === 'camp-1')
  if (rentree) {
    analyses.push({
      severite: 'MODEREE',
      titre: `Rentrée Lomé — ROI ${rentree.roi_pct}% · ${rentree.convertis} conversions`,
      detail: `CA ${(rentree.ca_genere / 1_000_000).toFixed(1)} M · conversion ${rentree.taux_conversion_pct}% · prolonger avec huile 5L en urgence rupture`,
      action: 'Prolonger 15j · budget restant ${((rentree.budget_max - rentree.cout_campagne) / 1000).toFixed(0)} K disponible',
    })
  }

  const hygiene = campagnes.find(c => c.id === 'camp-4')
  if (hygiene) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Cross-sell hygiène — 67 PDV en rupture',
      detail: `Potentiel 14 M · marge 18,4% · lancement 14/06 · coordonner transfert savon Kara`,
      action: 'Valider lancement DG · alerter stock avant envoi messages',
    })
  }

  const chatbot = campagnes.find(c => c.id === 'camp-5')
  if (chatbot) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Chatbot — scoring crédit manquant',
      detail: `18 conversions mais Grossiste Adidogomé = 5,25 M impayés. Coût/lead 10 K excellent mais risque crédit`,
      action: 'Bloquer validation auto si 1ère commande > 3 M sans historique paiement',
    })
  }

  const kara = campagnes.find(c => c.id === 'camp-2')
  if (kara) {
    analyses.push({
      severite: 'MODEREE',
      titre: 'Kara été — SMS sous-performe vs WhatsApp',
      detail: `Conversion ${kara.taux_conversion_pct}% vs 36% Lomé · bière retirée du prochain message`,
      action: 'Basculer 100% WhatsApp · message soda uniquement',
    })
  }

  const synthese = buildSyntheseMarketingDG(campagnes, REGISTRE_LEADS)
  analyses.push({
    severite: 'MODEREE',
    titre: `Performance globale — ROI moyen ${synthese.roi_moyen_pct}%`,
    detail: `CA campagnes ${(synthese.ca_genere_total / 1_000_000).toFixed(0)} M · marge ${(synthese.marge_generee_total / 1_000_000).toFixed(1)} M · ${synthese.leads_chauds} leads chauds`,
    action: 'Prioriser Lomé Est + cross-sell hygiène · réduire terrain Vogan (concurrent fort)',
  })

  return analyses
}

export function getSegmentsIA() { return SEGMENTS_IA }
export function getZonesBlanches() { return ZONES_BLANCHES }
export function getDecisionsIADG() { return DECISIONS_IA_DG }
export function getLeads() { return REGISTRE_LEADS }

export function filterCampagnesStatut(campagnes: CampagneDG[], statut?: StatutCampagne) {
  if (!statut) return campagnes
  return campagnes.filter(c => c.statut === statut)
}

/** ——— Vue DG : situation, suggestions, contrôle ——— */

export interface PointSituationIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE' | 'POSITIVE'
  titre: string
  detail: string
}

export interface AnalyseSituationMarketingDG {
  synthese: string
  points: PointSituationIA[]
  ca_objectif_trimestre: number
  ca_campagnes_mois: number
  ecart_objectif_pct: number
  marge_objectif_pct: number
  marge_actuelle_pct: number
}

export interface MetriqueCibleCampagne {
  label: string
  objectif: string
  actuel?: string
  statut: 'OK' | 'ATTENTION' | 'CRITIQUE' | 'CIBLE'
}

export interface SuggestionCampagneIA {
  id: string
  priorite: number
  nom: string
  objectif: string
  explication: string
  canal: CanalCampagne
  zone: string
  segment: string
  produits: { nom: string; prix_unitaire_fcfa: number; marge_pct: number }[]
  contacts: {
    cibles: number
    source: string
    detail: string
  }
  budget: {
    cout_estime_fcfa: number
    budget_max_fcfa: number
    cout_par_contact_fcfa: number
    roi_attendu_pct: number
  }
  metriques_cibles: MetriqueCibleCampagne[]
  ca_potentiel_fcfa: number
  marge_potentielle_fcfa: number
  date_lancement_suggeree: string
  duree_jours: number
  statut_validation: 'A_VALIDER' | 'APPROUVEE' | 'REJETEE'
  risque?: string
}

export interface ControleCampagneActuelle {
  campagne: CampagneDG
  progression_pct: number
  budget_consomme_pct: number
  metriques: MetriqueCibleCampagne[]
  alerte?: string
}

export function buildAnalyseSituationMarketingDG(
  campagnes: CampagneDG[],
  synthese: SyntheseMarketingDG,
): AnalyseSituationMarketingDG {
  const actives = campagnes.filter(c => c.statut === 'EN_COURS' || c.statut === 'PLANIFIEE')
  const rentree = campagnes.find(c => c.id === 'camp-1')
  const hygiene = campagnes.find(c => c.id === 'camp-4')
  const ecoulement = buildAnalyseEcoulementStock(buildCatalogueDG())

  return {
    synthese: `Le marketing génère ${(synthese.ca_genere_total / 1_000_000).toFixed(0)} M FCFA ce mois avec un ROI moyen de ${synthese.roi_moyen_pct}% — au-dessus du seuil DG (250%). ${actives.length} campagnes actives consomment ${(synthese.budget_consomme / 1_000_000).toFixed(1)} M de budget. La rentrée Lomé (${rentree?.taux_conversion_pct ?? 0}% conversion) tire la performance ; le cross-sell hygiène (${hygiene ? 'planifié 14/06' : '—'}) est le levier prioritaire (+14 M potentiel). Stock : ${ecoulement.sku_lents} SKU lents immobilisent ${formatFcfa(ecoulement.valeur_immobilisee_lente_fcfa)} (coût ~${formatFcfa(ecoulement.cout_stock_lent_total_mois_fcfa)}/mois) — l'IA propose des combos moteur+lent plutôt que des promos choc isolées. Risque principal : conversions chatbot sans scoring crédit (Grossiste Adidogomé). ${synthese.leads_chauds} leads chauds en pipeline — Supermarché Tokoin (5,5 M/mois) nécessite validation DG.`,
    points: [
      {
        severite: 'POSITIVE',
        titre: 'Rentrée Lomé — performance record',
        detail: `ROI ${rentree?.roi_pct ?? 0}% · ${rentree?.convertis ?? 0} conversions · panier moyen 458 K · prolongation recommandée 15j`,
      },
      {
        severite: 'HAUTE',
        titre: 'Cross-sell hygiène — opportunité 67 PDV',
        detail: '14 M CA potentiel · marge 18,4% · lancement 14/06 · coordonner stock savon Kara avant envoi',
      },
      {
        severite: 'CRITIQUE',
        titre: 'Scoring crédit absent sur chatbot',
        detail: '18 conversions mais risque impayés — filtrer 1ères commandes > 3 M sans historique paiement',
      },
      {
        severite: 'MODEREE',
        titre: 'Lomé Est sous-exploité',
        detail: '92/100 priorité IA · 8,5 M/mois potentiel · 0 conversion terrain encore · valider remise -10%',
      },
      {
        severite: ecoulement.cout_stock_lent_total_mois_fcfa >= 500_000 ? 'HAUTE' : 'MODEREE',
        titre: `Stock lent — ${ecoulement.sku_lents} SKU à écouler`,
        detail: `${formatFcfa(ecoulement.valeur_immobilisee_lente_fcfa)} immobilisés · coût ${formatFcfa(ecoulement.cout_stock_lent_total_mois_fcfa)}/mois · combos IA moteur+lent recommandés`,
      },
    ],
    ca_objectif_trimestre: 420_000_000,
    ca_campagnes_mois: synthese.ca_genere_total,
    ecart_objectif_pct: Math.round((synthese.ca_genere_total / (420_000_000 / 3)) * 100 - 100),
    marge_objectif_pct: 16,
    marge_actuelle_pct: synthese.ca_genere_total > 0
      ? Math.round((synthese.marge_generee_total / synthese.ca_genere_total) * 1000) / 10
      : 0,
  }
}

export function buildSuggestionsCampagnesIA(campagnes: CampagneDG[]): SuggestionCampagneIA[] {
  return [
    {
      id: 'sug-camp-1',
      priorite: 1,
      nom: 'Cross-sell Hygiène — Urgence rupture réseau',
      objectif: 'Convertir 67 PDV en rupture savon/couches en commande hygiène sous 14 jours',
      explication: 'L\'IA a détecté 67 points de vente en rupture savon (12 Kara + 34 Lomé + 21 autres). Ces clients cherchent déjà le produit — un message WhatsApp ciblé « urgence réappro » convertit 3× mieux qu\'une promo générique. Marge hygiène 18,4% = ROI attendu > 500%. Prérequis : transfert savon Kara validé par stock.',
      canal: 'WHATSAPP',
      zone: 'Multi-zones (Lomé + Kara)',
      segment: 'PDV en rupture savon/couches — segment IA seg-5',
      produits: [
        { nom: 'Savon ménager carton 48', prix_unitaire_fcfa: 12_000, marge_pct: 18.4 },
        { nom: 'Couches bébé pack 6', prix_unitaire_fcfa: 14_500, marge_pct: 17.2 },
      ],
      contacts: { cibles: 67, source: 'Registre PDV rupture stock', detail: '34 Lomé · 12 Kara · 21 Centrale/Nord — exclus 3 clients A_RISQUE' },
      budget: { cout_estime_fcfa: 380_000, budget_max_fcfa: 450_000, cout_par_contact_fcfa: 5_671, roi_attendu_pct: 520 },
      metriques_cibles: [
        { label: 'Taux conversion', objectif: '≥ 28%', statut: 'CIBLE' },
        { label: 'CA généré', objectif: '14 M FCFA', statut: 'CIBLE' },
        { label: 'Conversions', objectif: '≥ 19 clients', statut: 'CIBLE' },
        { label: 'Coût/conversion', objectif: '< 25 K', statut: 'CIBLE' },
        { label: 'Marge brute', objectif: '≥ 2,5 M', statut: 'CIBLE' },
      ],
      ca_potentiel_fcfa: 14_280_000,
      marge_potentielle_fcfa: 2_628_000,
      date_lancement_suggeree: '2026-06-14',
      duree_jours: 14,
      statut_validation: 'A_VALIDER',
      risque: 'Dépend livraison savon Kara — bloquer envoi si stock < 80 u.',
    },
    {
      id: 'sug-camp-2',
      priorite: 2,
      nom: 'Bundle Été Eau + Soda — Juillet',
      objectif: 'Reproduire le succès bundle huile+riz (ROI 945%) sur boissons avant saison chaude',
      explication: 'Le bundle Mai huile+riz a généré 22,8 M avec ROI 945% — mais huile en rupture. L\'IA recommande un bundle été eau 1,5L + soda 33cl pack 24, ciblant 42 clients segment « engouement boissons » (+8-12% évolution). Stock soda et eau confortables (couverture 12-18j).',
      canal: 'WHATSAPP',
      zone: 'Lomé + Kara',
      segment: 'Engouement boissons été — seg-2 (42 clients)',
      produits: [
        { nom: 'Eau minérale 1,5L pack 12', prix_unitaire_fcfa: 4_200, marge_pct: 14.2 },
        { nom: 'Soda 33cl pack 24', prix_unitaire_fcfa: 9_800, marge_pct: 15.8 },
      ],
      contacts: { cibles: 42, source: 'Segment IA moteurs boissons', detail: '28 Lomé · 14 Kara — clients actifs avec historique soda+eau' },
      budget: { cout_estime_fcfa: 420_000, budget_max_fcfa: 600_000, cout_par_contact_fcfa: 10_000, roi_attendu_pct: 400 },
      metriques_cibles: [
        { label: 'Taux conversion', objectif: '≥ 35%', statut: 'CIBLE' },
        { label: 'CA généré', objectif: '18 M FCFA', statut: 'CIBLE' },
        { label: 'Panier moyen', objectif: '≥ 420 K', statut: 'CIBLE' },
        { label: 'ROI', objectif: '≥ 400%', statut: 'CIBLE' },
      ],
      ca_potentiel_fcfa: 18_500_000,
      marge_potentielle_fcfa: 2_960_000,
      date_lancement_suggeree: '2026-07-01',
      duree_jours: 21,
      statut_validation: 'A_VALIDER',
    },
    {
      id: 'sug-camp-3',
      priorite: 3,
      nom: 'Conquête Lomé Est — 1ère commande -10%',
      objectif: 'Convertir 8 épiceries non partenaires zone Bè Kpota en clients actifs',
      explication: 'Lomé Est = 92/100 priorité IA, 85 000 hab., 1 seul partenaire (saturation 12%). Campagne terrain en cours : 3 leads chauds dont Boutique Nouvelle. L\'IA propose d\'activer une offre -10% 1ère commande + WhatsApp catalogue entrée gamme pour accélérer conversion.',
      canal: 'MIXTE',
      zone: 'Lomé Est',
      segment: 'Zones blanches urbaines — 8 prospects identifiés',
      produits: [
        { nom: 'Eau minérale 1,5L pack 12', prix_unitaire_fcfa: 4_200, marge_pct: 14.2 },
        { nom: 'Soda 33cl pack 24', prix_unitaire_fcfa: 9_800, marge_pct: 15.8 },
        { nom: 'Riz parfumé 25 kg', prix_unitaire_fcfa: 18_000, marge_pct: 12.1 },
      ],
      contacts: { cibles: 8, source: 'Prospection terrain camp-8 + zones blanches', detail: '5 déjà contactés · 3 chauds · 2 nouveaux à visiter' },
      budget: { cout_estime_fcfa: 520_000, budget_max_fcfa: 600_000, cout_par_contact_fcfa: 65_000, roi_attendu_pct: 280 },
      metriques_cibles: [
        { label: 'Conversions', objectif: '≥ 4 clients', statut: 'CIBLE' },
        { label: 'CA/mois nouveau', objectif: '≥ 4 M', statut: 'CIBLE' },
        { label: 'Coût acquisition', objectif: '< 150 K/client', statut: 'CIBLE' },
      ],
      ca_potentiel_fcfa: 8_500_000,
      marge_potentielle_fcfa: 1_190_000,
      date_lancement_suggeree: '2026-06-18',
      duree_jours: 30,
      statut_validation: 'A_VALIDER',
      risque: 'Remise -10% impacte marge 1ère commande — compensée par volume récurrent',
    },
    {
      id: 'sug-camp-4',
      priorite: 4,
      nom: 'Réactivation clients dormants (filtrés)',
      objectif: 'Relancer 11 clients sans commande 30-60j — historique paiement OK',
      explication: '14 clients dormants identifiés — 3 exclus (pipeline A_RISQUE incl. Kiosque Port 8,9 M impayés). Offre -5% limitée sur bundle entrée gamme. Pause campagne camp-6 justifiée — reprise avec liste nettoyée.',
      canal: 'WHATSAPP',
      zone: 'Lomé',
      segment: 'Dormants 30-60j filtrés — seg-4',
      produits: [
        { nom: 'Offre bundle -5% entrée gamme', prix_unitaire_fcfa: 0, marge_pct: 13.5 },
      ],
      contacts: { cibles: 11, source: 'Segment dormants — exclus A_RISQUE', detail: 'Mama T. · Kofi Trade · 9 autres clients historique OK' },
      budget: { cout_estime_fcfa: 95_000, budget_max_fcfa: 150_000, cout_par_contact_fcfa: 8_636, roi_attendu_pct: 220 },
      metriques_cibles: [
        { label: 'Taux réactivation', objectif: '≥ 25%', statut: 'CIBLE' },
        { label: 'Conversions', objectif: '≥ 3 clients', statut: 'CIBLE' },
        { label: 'CA généré', objectif: '≥ 2,5 M', statut: 'CIBLE' },
      ],
      ca_potentiel_fcfa: 7_480_000,
      marge_potentielle_fcfa: 1_010_000,
      date_lancement_suggeree: '2026-06-20',
      duree_jours: 14,
      statut_validation: 'A_VALIDER',
    },
  ]
}

export function buildControleCampagnesActuelles(campagnes: CampagneDG[]): ControleCampagneActuelle[] {
  return campagnes
    .filter(c => c.statut === 'EN_COURS' || c.statut === 'PLANIFIEE' || c.statut === 'PAUSE')
    .map(c => {
      const budgetPct = c.budget_max > 0 ? Math.round((c.cout_campagne / c.budget_max) * 100) : 0
      const convObj = c.canal === 'WHATSAPP' ? 30 : c.canal === 'TERRAIN' ? 20 : 25
      const progression = c.cibles > 0 ? Math.round((c.convertis / Math.max(1, Math.ceil(c.cibles * convObj / 100))) * 100) : 0

      const metriques: MetriqueCibleCampagne[] = [
        {
          label: 'Conversion',
          objectif: `≥ ${convObj}%`,
          actuel: c.contactes > 0 ? `${c.taux_conversion_pct}%` : '—',
          statut: c.contactes === 0 ? 'CIBLE' : c.taux_conversion_pct >= convObj ? 'OK' : c.taux_conversion_pct >= convObj * 0.7 ? 'ATTENTION' : 'CRITIQUE',
        },
        {
          label: 'CA généré',
          objectif: c.budget_max > 500_000 ? formatFcfa(c.budget_max * 15) : formatFcfa(c.budget_max * 10),
          actuel: c.ca_genere > 0 ? formatFcfa(c.ca_genere) : '—',
          statut: c.ca_genere > 0 ? 'OK' : c.statut === 'PLANIFIEE' ? 'CIBLE' : 'ATTENTION',
        },
        {
          label: 'ROI',
          objectif: '≥ 250%',
          actuel: c.roi_pct > 0 ? `${c.roi_pct}%` : '—',
          statut: c.roi_pct >= 250 ? 'OK' : c.roi_pct >= 150 ? 'ATTENTION' : c.roi_pct > 0 ? 'CRITIQUE' : 'CIBLE',
        },
        {
          label: 'Contacts',
          objectif: String(c.cibles),
          actuel: String(c.contactes),
          statut: c.contactes >= c.cibles * 0.9 ? 'OK' : c.contactes >= c.cibles * 0.5 ? 'ATTENTION' : c.contactes > 0 ? 'CRITIQUE' : 'CIBLE',
        },
      ]

      return {
        campagne: c,
        progression_pct: Math.min(100, progression),
        budget_consomme_pct: budgetPct,
        metriques,
        alerte: c.alerte,
      }
    })
}
