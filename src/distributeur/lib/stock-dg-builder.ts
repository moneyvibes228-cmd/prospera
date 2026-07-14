/**
 * Stock & Logistique DG — couverture, mouvements, expéditions, ruptures, fournisseurs.
 */
import {
  buildCatalogueDG,
  type ProduitCatalogueDG,
  CATEGORIES_CATALOGUE,
} from './catalogue-dg-builder'

export type VueStockDG = 'consolide' | 'lome-port' | 'kara' | 'alertes' | 'preparation'
export type StatutStockDG = 'CRITIQUE' | 'ALERTE' | 'OK' | 'SURSTOCK'

export interface MouvementStock {
  date: string
  type: 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT'
  quantite: number
  libelle: string
  reference?: string
}

export interface FournisseurSKU {
  nom: string
  delai_jours: number
  derniere_commande: string
  qte_en_cours: number
  prochaine_livraison?: string
}

export interface ProduitStockDG extends ProduitCatalogueDG {
  statut_stock: StatutStockDG
  couverture_jours: number
  taux_service_pct: number
  fournisseur: FournisseurSKU
  mouvements_recents: MouvementStock[]
  evolution_stock_7j: number[]
  commandes_a_preparer: number
  unites_en_preparation: number
  transferts_en_cours: number
  valeur_stock_cout: number
  synthese_logistique_ia: string
  recommandation_ia: string
}

export interface EntrepotSyntheseDG {
  nom: string
  sku_total: number
  sku_rupture: number
  occupation_pct: number
  valeur_stock: number
  sorties_jour: number
  expeditions_jour: number
  alertes: string[]
}

export interface ExpeditionDG {
  id: string
  heure: string
  entrepot: string
  destination: string
  nb_lignes: number
  unites: number
  statut: 'PREPARATION' | 'EN_ROUTE' | 'LIVRE' | 'RETARD'
  chauffeur?: string
}

export interface AnalyseStockIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  action: string
}

const LOGISTIQUE: Record<string, Omit<ProduitStockDG, keyof ProduitCatalogueDG>> = {
  'p-1': {
    statut_stock: 'OK', couverture_jours: 18, taux_service_pct: 98,
    fournisseur: { nom: 'Source Eau Togo SA', delai_jours: 5, derniere_commande: '2026-06-04', qte_en_cours: 5000, prochaine_livraison: '2026-06-12' },
    mouvements_recents: [
      { date: '2026-06-11', type: 'SORTIE', quantite: 840, libelle: 'Tournée Lomé Centre', reference: 'EXP-2841' },
      { date: '2026-06-10', type: 'ENTREE', quantite: 2000, libelle: 'Réception fournisseur', reference: 'BL-8821' },
      { date: '2026-06-09', type: 'TRANSFERT', quantite: 400, libelle: 'Lomé Port → Atlas Shop Tokoin', reference: 'TRF-1192' },
    ],
    evolution_stock_7j: [2100, 2280, 2450, 2380, 2520, 2480, 2400],
    commandes_a_preparer: 6, unites_en_preparation: 420, transferts_en_cours: 2,
    valeur_stock_cout: 8_640_000,
    synthese_logistique_ia: 'SKU pilier — stock sain, rotation 4j. Couverture 18j confortable. Taux service 98% sur le réseau.',
    recommandation_ia: 'Maintenir seuil 500 · pas de commande urgente.',
  },
  'p-5': {
    statut_stock: 'OK', couverture_jours: 14, taux_service_pct: 96,
    fournisseur: { nom: 'Coca-Cola Togo', delai_jours: 7, derniere_commande: '2026-06-02', qte_en_cours: 3000, prochaine_livraison: '2026-06-14' },
    mouvements_recents: [
      { date: '2026-06-11', type: 'SORTIE', quantite: 480, libelle: 'Grossistes Adidogomé', reference: 'EXP-2843' },
      { date: '2026-06-10', type: 'SORTIE', quantite: 360, libelle: 'Atlas Shop réseau', reference: 'EXP-2838' },
    ],
    evolution_stock_7j: [1050, 1120, 1180, 1150, 1220, 1210, 1200],
    commandes_a_preparer: 4, unites_en_preparation: 280, transferts_en_cours: 1,
    valeur_stock_cout: 9_840_000,
    synthese_logistique_ia: 'Forte demande été — stock OK mais surveiller pic week-end. 2 PDV en rupture réseau.',
    recommandation_ia: 'Préparer +15% stock sécurité avant vendredi.',
  },
  'p-6': {
    statut_stock: 'OK', couverture_jours: 12, taux_service_pct: 91,
    fournisseur: { nom: 'Jus Tropical Import', delai_jours: 10, derniere_commande: '2026-05-28', qte_en_cours: 800 },
    mouvements_recents: [
      { date: '2026-06-11', type: 'SORTIE', quantite: 120, libelle: 'Zone Kara transfert', reference: 'TRF-1195' },
    ],
    evolution_stock_7j: [620, 640, 660, 650, 670, 675, 680],
    commandes_a_preparer: 2, unites_en_preparation: 60, transferts_en_cours: 1,
    valeur_stock_cout: 3_944_000,
    synthese_logistique_ia: '6 magasins en rupture réseau — stock entrepôt suffisant mais distribution lente.',
    recommandation_ia: 'Prioriser tournée jus dans préparation commandes J+0.',
  },
  'p-7': {
    statut_stock: 'OK', couverture_jours: 16, taux_service_pct: 97,
    fournisseur: { nom: 'Brasserie du Golfe', delai_jours: 4, derniere_commande: '2026-06-06', qte_en_cours: 1500, prochaine_livraison: '2026-06-13' },
    mouvements_recents: [
      { date: '2026-06-11', type: 'SORTIE', quantite: 96, libelle: 'Bars & restaurants Lomé Sud', reference: 'EXP-2840' },
    ],
    evolution_stock_7j: [880, 900, 910, 905, 915, 918, 920],
    commandes_a_preparer: 3, unites_en_preparation: 144, transferts_en_cours: 0,
    valeur_stock_cout: 9_016_000,
    synthese_logistique_ia: 'Niche rentable — stock bien dimensionné. Pic consommation week-end à anticiper.',
    recommandation_ia: 'Réserver 200 unités pour commandes grossistes week-end.',
  },
  'p-2': {
    statut_stock: 'CRITIQUE', couverture_jours: 2, taux_service_pct: 72,
    fournisseur: { nom: 'Huiles Ouest Afrique', delai_jours: 14, derniere_commande: '2026-05-20', qte_en_cours: 2000, prochaine_livraison: '2026-06-18' },
    mouvements_recents: [
      { date: '2026-06-11', type: 'SORTIE', quantite: 180, libelle: 'Commande urgente grossistes', reference: 'EXP-2839' },
      { date: '2026-06-10', type: 'SORTIE', quantite: 120, libelle: 'Atlas Shop Agoè', reference: 'EXP-2835' },
      { date: '2026-06-08', type: 'ENTREE', quantite: 400, libelle: 'Réception partielle (retard)', reference: 'BL-8790' },
    ],
    evolution_stock_7j: [380, 320, 280, 240, 220, 200, 180],
    commandes_a_preparer: 8, unites_en_preparation: 0, transferts_en_cours: 0,
    valeur_stock_cout: 1_404_000,
    synthese_logistique_ia: 'RUPTURE ACTIVE — 180/200. 34 PDV en rupture réseau. 8 ruptures/3m. Coût opportunité ~4,2 M/mois. Fournisseur en retard.',
    recommandation_ia: 'Commande express 1500 u. · Bloquer nouvelles commandes grossistes · Activer sourcing alternatif.',
  },
  'p-3': {
    statut_stock: 'OK', couverture_jours: 11, taux_service_pct: 95,
    fournisseur: { nom: 'Riz Import Vietnam', delai_jours: 21, derniere_commande: '2026-05-15', qte_en_cours: 4000, prochaine_livraison: '2026-07-02' },
    mouvements_recents: [
      { date: '2026-06-11', type: 'SORTIE', quantite: 210, libelle: 'Marchés Nord Lomé', reference: 'EXP-2842' },
    ],
    evolution_stock_7j: [820, 850, 870, 860, 880, 885, 890],
    commandes_a_preparer: 5, unites_en_preparation: 175, transferts_en_cours: 1,
    valeur_stock_cout: 14_418_000,
    synthese_logistique_ia: 'Volume élevé — immobilisation 14,4 M mais rotation 6j acceptable. 3 PDV en rupture.',
    recommandation_ia: 'Commande maritime en cours — pas d\'action avant juillet.',
  },
  'p-8': {
    statut_stock: 'OK', couverture_jours: 13, taux_service_pct: 99,
    fournisseur: { nom: 'Pâtes Unilever Togo', delai_jours: 8, derniere_commande: '2026-06-01', qte_en_cours: 600 },
    mouvements_recents: [
      { date: '2026-06-10', type: 'SORTIE', quantite: 80, libelle: 'Détaillants Bè', reference: 'EXP-2836' },
    ],
    evolution_stock_7j: [400, 410, 415, 418, 420, 420, 420],
    commandes_a_preparer: 1, unites_en_preparation: 40, transferts_en_cours: 0,
    valeur_stock_cout: 1_428_000,
    synthese_logistique_ia: 'Complément panier stable — aucune rupture réseau. Logistique fluide.',
    recommandation_ia: 'Aucune action requise.',
  },
  'p-9': {
    statut_stock: 'OK', couverture_jours: 15, taux_service_pct: 94,
    fournisseur: { nom: 'Nestlé Distribution Kara', delai_jours: 6, derniere_commande: '2026-06-05', qte_en_cours: 400, prochaine_livraison: '2026-06-15' },
    mouvements_recents: [
      { date: '2026-06-11', type: 'SORTIE', quantite: 48, libelle: 'Magasins Kara centre', reference: 'EXP-K284' },
    ],
    evolution_stock_7j: [290, 300, 305, 308, 310, 310, 310],
    commandes_a_preparer: 2, unites_en_preparation: 72, transferts_en_cours: 0,
    valeur_stock_cout: 1_426_000,
    synthese_logistique_ia: 'Entrepôt Kara — demande Nord stable. 2 PDV en rupture locale.',
    recommandation_ia: 'Inclure dans prochaine tournée Kara Nord.',
  },
  'p-4': {
    statut_stock: 'CRITIQUE', couverture_jours: 1, taux_service_pct: 68,
    fournisseur: { nom: 'Hygiène Pro Afrique', delai_jours: 7, derniere_commande: '2026-06-03', qte_en_cours: 500, prochaine_livraison: '2026-06-13' },
    mouvements_recents: [
      { date: '2026-06-11', type: 'SORTIE', quantite: 36, libelle: 'Atlas Shop Kara + partenaires', reference: 'EXP-K283' },
      { date: '2026-06-09', type: 'SORTIE', quantite: 24, libelle: 'Grossiste Sokodé', reference: 'EXP-K280' },
    ],
    evolution_stock_7j: [120, 95, 78, 62, 55, 48, 45],
    commandes_a_preparer: 5, unites_en_preparation: 0, transferts_en_cours: 1,
    valeur_stock_cout: 459_000,
    synthese_logistique_ia: 'RUPTURE Kara — 45/80. 12 PDV en rupture. 5 ruptures/3m. Excellente marge mais perte CA si non réappro.',
    recommandation_ia: 'Transfert urgent Lomé→Kara 200 u. · Accélérer livraison fournisseur 13/06.',
  },
  'p-10': {
    statut_stock: 'OK', couverture_jours: 17, taux_service_pct: 100,
    fournisseur: { nom: 'Pampers Distribution', delai_jours: 10, derniere_commande: '2026-05-25', qte_en_cours: 300 },
    mouvements_recents: [
      { date: '2026-06-10', type: 'SORTIE', quantite: 18, libelle: 'Pharmacies & Atlas Shop', reference: 'EXP-K281' },
    ],
    evolution_stock_7j: [140, 148, 152, 154, 155, 156, 156],
    commandes_a_preparer: 1, unites_en_preparation: 24, transferts_en_cours: 0,
    valeur_stock_cout: 2_028_000,
    synthese_logistique_ia: 'Engouement +15% — stock OK, marge forte. Extension gamme bébé possible.',
    recommandation_ia: 'Augmenter seuil Kara de 60 à 80 unités.',
  },
  'p-11': {
    statut_stock: 'ALERTE', couverture_jours: 8, taux_service_pct: 82,
    fournisseur: { nom: 'Clean Home Import', delai_jours: 12, derniere_commande: '2026-04-18', qte_en_cours: 0 },
    mouvements_recents: [
      { date: '2026-06-08', type: 'SORTIE', quantite: 12, libelle: 'Commande unique grossiste', reference: 'EXP-2830' },
    ],
    evolution_stock_7j: [110, 105, 100, 98, 94, 90, 88],
    commandes_a_preparer: 0, unites_en_preparation: 0, transferts_en_cours: 0,
    valeur_stock_cout: 607_200,
    synthese_logistique_ia: 'Sous seuil (88/100) · demande -12% · rotation lente 18j. Stock immobilisé non rentable.',
    recommandation_ia: 'Ne pas réapprovisionner — promo clearance -15% ou sortie assortiment.',
  },
  'p-12': {
    statut_stock: 'SURSTOCK', couverture_jours: 32, taux_service_pct: 88,
    fournisseur: { nom: 'Café Nescafé Régional', delai_jours: 14, derniere_commande: '2026-03-10', qte_en_cours: 0 },
    mouvements_recents: [
      { date: '2026-06-05', type: 'SORTIE', quantite: 8, libelle: 'Vente sporadique', reference: 'EXP-K275' },
    ],
    evolution_stock_7j: [248, 246, 244, 242, 241, 240, 240],
    commandes_a_preparer: 0, unites_en_preparation: 0, transferts_en_cours: 0,
    valeur_stock_cout: 1_464_000,
    synthese_logistique_ia: 'SURSTOCK — 32j couverture, demande -28%. Déficitaire. Immobilisation 1,46 M sans retour.',
    recommandation_ia: 'Destockage -20% · Retrait catalogue sous 30j · Libérer 12 palettes Kara.',
  },
}

const EXPEDITIONS_JOUR: ExpeditionDG[] = [
  { id: 'EXP-2843', heure: '08:30', entrepot: 'Lomé Port', destination: 'Zone Adidogomé · 4 grossistes', nb_lignes: 8, unites: 1240, statut: 'EN_ROUTE', chauffeur: 'Kodjo A.' },
  { id: 'EXP-2842', heure: '09:15', entrepot: 'Lomé Port', destination: 'Marchés Nord Lomé', nb_lignes: 5, unites: 680, statut: 'EN_ROUTE', chauffeur: 'Afi T.' },
  { id: 'EXP-2841', heure: '10:00', entrepot: 'Lomé Port', destination: 'Atlas Shop Tokoin + 3 partenaires', nb_lignes: 12, unites: 920, statut: 'PREPARATION' },
  { id: 'EXP-2839', heure: '07:45', entrepot: 'Lomé Port', destination: 'Grossistes urgence huile', nb_lignes: 3, unites: 180, statut: 'LIVRE', chauffeur: 'Mensah K.' },
  { id: 'EXP-K284', heure: '09:00', entrepot: 'Kara', destination: 'Kara centre + Bassar', nb_lignes: 6, unites: 340, statut: 'PREPARATION' },
  { id: 'EXP-K283', heure: '08:00', entrepot: 'Kara', destination: 'Sokodé grossistes', nb_lignes: 4, unites: 210, statut: 'RETARD', chauffeur: 'Yao B.' },
]

export const STATUT_STOCK_STYLE: Record<StatutStockDG, { label: string; className: string }> = {
  CRITIQUE: { label: 'Rupture', className: 'bg-red-100 text-red-700' },
  ALERTE: { label: 'Sous seuil', className: 'bg-orange-100 text-orange-700' },
  OK: { label: 'Stock OK', className: 'bg-emerald-100 text-emerald-700' },
  SURSTOCK: { label: 'Surstock', className: 'bg-violet-100 text-violet-700' },
}

export function buildStockDG(): ProduitStockDG[] {
  return buildCatalogueDG().map(p => ({
    ...p,
    ...(LOGISTIQUE[p.produit.id] ?? {
      statut_stock: 'OK' as StatutStockDG,
      couverture_jours: 10,
      taux_service_pct: 90,
      fournisseur: { nom: 'Fournisseur générique', delai_jours: 7, derniere_commande: '2026-06-01', qte_en_cours: 0 },
      mouvements_recents: [],
      evolution_stock_7j: [p.produit.stock, p.produit.stock],
      commandes_a_preparer: 0,
      unites_en_preparation: 0,
      transferts_en_cours: 0,
      valeur_stock_cout: p.produit.stock * (p.cout_revient ?? p.produit.prix_unitaire * 0.85),
      synthese_logistique_ia: p.synthese_ia,
      recommandation_ia: 'Surveiller seuil.',
    }),
  }))
}

export function buildSyntheseStockDG(produits: ProduitStockDG[]) {
  const ruptures = produits.filter(p => p.statut_stock === 'CRITIQUE' || p.statut_stock === 'ALERTE')
  return {
    total_sku: produits.length,
    ruptures_actives: produits.filter(p => p.statut_stock === 'CRITIQUE').length,
    alertes_seuil: produits.filter(p => p.statut_stock === 'ALERTE').length,
    surstock: produits.filter(p => p.statut_stock === 'SURSTOCK').length,
    valeur_stock_total: produits.reduce((s, p) => s + p.valeur_stock_immobilisee, 0),
    valeur_cout_total: produits.reduce((s, p) => s + p.valeur_stock_cout, 0),
    couverture_moyenne: Math.round(produits.reduce((s, p) => s + p.couverture_jours, 0) / produits.length),
    taux_service_moyen: Math.round(produits.reduce((s, p) => s + p.taux_service_pct, 0) / produits.length),
    commandes_a_preparer: produits.reduce((s, p) => s + p.commandes_a_preparer, 0),
    unites_en_preparation: produits.reduce((s, p) => s + p.unites_en_preparation, 0),
    pdv_en_rupture: produits.reduce((s, p) => s + p.reseau_pdv.magasins_en_rupture, 0),
    ruptures_3m: produits.reduce((s, p) => s + p.ruptures_3m, 0),
  }
}

export function buildEntrepotsSynthese(produits: ProduitStockDG[]): EntrepotSyntheseDG[] {
  const entrepots = ['Lomé Port', 'Kara'] as const
  return entrepots.map(nom => {
    const lignes = produits.flatMap(p =>
      p.stocks_entrepot.filter(e => e.entrepot === nom).map(e => ({ p, e }))
    )
    const sku_rupture = lignes.filter(l => l.e.rupture).length
    const valeur = lignes.reduce((s, l) => s + l.e.quantite * l.p.produit.prix_unitaire, 0)
    const sorties = lignes.reduce((s, l) => s + Math.round(l.p.sorties_mois / 30), 0)
    return {
      nom,
      sku_total: lignes.length,
      sku_rupture,
      occupation_pct: nom === 'Lomé Port' ? 78 : 62,
      valeur_stock: valeur,
      sorties_jour: sorties,
      expeditions_jour: EXPEDITIONS_JOUR.filter(e => e.entrepot === nom).length,
      alertes: lignes.filter(l => l.e.rupture).map(l => `${l.p.produit.nom.split(' ').slice(0, 2).join(' ')} (${l.e.quantite}/${l.e.seuil})`),
    }
  })
}

export function buildExpeditionsJour(): ExpeditionDG[] {
  return EXPEDITIONS_JOUR
}

export function buildAnalysesStockIA(produits: ProduitStockDG[]): AnalyseStockIA[] {
  const analyses: AnalyseStockIA[] = []

  const huile = produits.find(p => p.produit.reference === 'PRD-HUILE-5L')
  if (huile) {
    analyses.push({
      severite: 'CRITIQUE',
      titre: 'Rupture huile 5L — impact réseau',
      detail: `Couverture ${huile.couverture_jours}j · ${huile.reseau_pdv.magasins_en_rupture} PDV en rupture · taux service ${huile.taux_service_pct}% · livraison fournisseur 18/06`,
      action: 'Commande express + bloquer ventes grossistes jusqu\'à réception 1500 u.',
    })
  }

  const savon = produits.find(p => p.produit.reference === 'PRD-SAVON-PACK')
  if (savon) {
    analyses.push({
      severite: 'CRITIQUE',
      titre: 'Savon Kara — rupture + transfert urgent',
      detail: `45/80 unités · ${savon.reseau_pdv.magasins_en_rupture} PDV · transfert Lomé→Kara en cours · perte CA estimée 1,8 M/semaine`,
      action: 'Accélérer transfert 200 u. · Prioriser expédition EXP-K284.',
    })
  }

  const prep = produits.reduce((s, p) => s + p.commandes_a_preparer, 0)
  analyses.push({
    severite: 'MODEREE',
    titre: `${prep} commandes en préparation aujourd'hui`,
    detail: `${produits.reduce((s, p) => s + p.unites_en_preparation, 0)} unités à préparer · 2 expéditions en retard · taux service moyen ${Math.round(produits.reduce((s, p) => s + p.taux_service_pct, 0) / produits.length)}%`,
    action: 'Renforcer équipe préparation Lomé Port (+2 préparateurs pic matin).',
  })

  const surstock = produits.filter(p => p.statut_stock === 'SURSTOCK')
  if (surstock.length) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Surstock à liquider',
      detail: surstock.map(p => `${p.produit.nom.split(' ')[0]} (${p.couverture_jours}j couverture)`).join(' · '),
      action: 'Libérer 12 palettes Kara · destockage café -20% sous 15j.',
    })
  }

  return analyses
}

export function filterStockVue(produits: ProduitStockDG[], vue: VueStockDG): ProduitStockDG[] {
  if (vue === 'consolide') return produits
  if (vue === 'lome-port') return produits.filter(p => p.stocks_entrepot.some(e => e.entrepot === 'Lomé Port'))
  if (vue === 'kara') return produits.filter(p => p.stocks_entrepot.some(e => e.entrepot === 'Kara'))
  if (vue === 'alertes') return produits.filter(p => p.statut_stock === 'CRITIQUE' || p.statut_stock === 'ALERTE' || p.statut_stock === 'SURSTOCK')
  return produits.filter(p => p.commandes_a_preparer > 0)
}

export { CATEGORIES_CATALOGUE }
