import type { ProduitStock } from '@distributeur/types'

/** Catalogue grossiste — références multi-entrepôts. */
const STOCK_SEED: ProduitStock[] = [
  { id: 'p-1', reference: 'PRD-EAU-1.5L', nom: 'Eau minérale 1,5L (pack 12)', categorie: 'Boissons', stock: 2400, seuil: 500, prix_unitaire: 4_200, entrepot: 'Lomé Port' },
  { id: 'p-5', reference: 'PRD-COCA-33CL', nom: 'Soda 33cl (pack 24)', categorie: 'Boissons', stock: 1200, seuil: 400, prix_unitaire: 9_800, entrepot: 'Lomé Port' },
  { id: 'p-6', reference: 'PRD-JUS-1L', nom: 'Jus d\'orange 1L (pack 6)', categorie: 'Boissons', stock: 680, seuil: 200, prix_unitaire: 6_500, entrepot: 'Lomé Port' },
  { id: 'p-7', reference: 'PRD-BIERE-33CL', nom: 'Bière locale 33cl (pack 24)', categorie: 'Boissons', stock: 920, seuil: 350, prix_unitaire: 11_200, entrepot: 'Lomé Port' },
  { id: 'p-2', reference: 'PRD-HUILE-5L', nom: 'Huile végétale 5L', categorie: 'Alimentaire', stock: 180, seuil: 200, prix_unitaire: 8_500, entrepot: 'Lomé Port' },
  { id: 'p-3', reference: 'PRD-RIZ-25KG', nom: 'Riz parfumé 25 kg', categorie: 'Alimentaire', stock: 890, seuil: 300, prix_unitaire: 18_000, entrepot: 'Lomé Port' },
  { id: 'p-8', reference: 'PRD-PATES-500G', nom: 'Pâtes alimentaires 500g (carton 20)', categorie: 'Alimentaire', stock: 420, seuil: 150, prix_unitaire: 3_800, entrepot: 'Lomé Port' },
  { id: 'p-9', reference: 'PRD-LAIT-400G', nom: 'Lait concentré 400g (pack 24)', categorie: 'Alimentaire', stock: 310, seuil: 120, prix_unitaire: 5_200, entrepot: 'Kara' },
  { id: 'p-4', reference: 'PRD-SAVON-PACK', nom: 'Savon ménager (carton 48)', categorie: 'Hygiène', stock: 45, seuil: 80, prix_unitaire: 12_000, entrepot: 'Kara' },
  { id: 'p-10', reference: 'PRD-COUCHE-PK', nom: 'Couches bébé (pack 6)', categorie: 'Hygiène', stock: 156, seuil: 60, prix_unitaire: 14_500, entrepot: 'Kara' },
  { id: 'p-11', reference: 'PRD-DETERGENT-5L', nom: 'Détergent liquide 5L', categorie: 'Entretien', stock: 88, seuil: 100, prix_unitaire: 7_800, entrepot: 'Lomé Port' },
  { id: 'p-12', reference: 'PRD-CAFE-200G', nom: 'Café soluble 200g (carton 12)', categorie: 'Alimentaire', stock: 240, seuil: 80, prix_unitaire: 6_800, entrepot: 'Kara' },
  { id: 'p-13', reference: 'PRD-SUCRE-1KG', nom: 'Sucre cristallisé 1 kg (sac 10)', categorie: 'Alimentaire', stock: 520, seuil: 180, prix_unitaire: 2_400, entrepot: 'Lomé Port' },
  { id: 'p-14', reference: 'PRD-FARINE-25KG', nom: 'Farine de blé 25 kg', categorie: 'Alimentaire', stock: 340, seuil: 120, prix_unitaire: 9_500, entrepot: 'Lomé Port' },
  { id: 'p-15', reference: 'PRD-TOMATE-400G', nom: 'Concentré tomate 400g (carton 24)', categorie: 'Alimentaire', stock: 280, seuil: 90, prix_unitaire: 4_600, entrepot: 'Lomé Port' },
  { id: 'p-16', reference: 'PRD-SARDINE-125G', nom: 'Sardines à l\'huile 125g (carton 48)', categorie: 'Alimentaire', stock: 190, seuil: 70, prix_unitaire: 5_800, entrepot: 'Kara' },
  { id: 'p-17', reference: 'PRD-BISCUIT-PK', nom: 'Biscuits assortis (carton 36)', categorie: 'Alimentaire', stock: 165, seuil: 55, prix_unitaire: 3_200, entrepot: 'Lomé Port' },
  { id: 'p-18', reference: 'PRD-ENERGY-25CL', nom: 'Boisson énergisante 25cl (pack 24)', categorie: 'Boissons', stock: 480, seuil: 160, prix_unitaire: 7_400, entrepot: 'Lomé Port' },
  { id: 'p-19', reference: 'PRD-EAU-50CL', nom: 'Eau minérale 50cl (pack 24)', categorie: 'Boissons', stock: 3200, seuil: 800, prix_unitaire: 2_800, entrepot: 'Lomé Port' },
  { id: 'p-20', reference: 'PRD-BIERE-65CL', nom: 'Bière locale 65cl (pack 12)', categorie: 'Boissons', stock: 640, seuil: 200, prix_unitaire: 8_900, entrepot: 'Lomé Port' },
  { id: 'p-21', reference: 'PRD-SIROP-1L', nom: 'Sirop grenadine 1L (pack 6)', categorie: 'Boissons', stock: 210, seuil: 75, prix_unitaire: 5_600, entrepot: 'Kara' },
  { id: 'p-22', reference: 'PRD-SHAMPOO-400ML', nom: 'Shampooing 400ml (carton 24)', categorie: 'Hygiène', stock: 128, seuil: 45, prix_unitaire: 8_200, entrepot: 'Kara' },
  { id: 'p-23', reference: 'PRD-DENTIFRICE-PK', nom: 'Dentifrice 100ml (pack 12)', categorie: 'Hygiène', stock: 96, seuil: 35, prix_unitaire: 4_900, entrepot: 'Lomé Port' },
  { id: 'p-24', reference: 'PRD-PAPIER-HYG', nom: 'Papier hygiénique (pack 12 rouleaux)', categorie: 'Hygiène', stock: 72, seuil: 40, prix_unitaire: 3_600, entrepot: 'Lomé Port' },
  { id: 'p-25', reference: 'PRD-JAVEL-1L', nom: 'Eau de Javel 1L (carton 12)', categorie: 'Entretien', stock: 145, seuil: 50, prix_unitaire: 2_100, entrepot: 'Lomé Port' },
  { id: 'p-26', reference: 'PRD-INSECT-400ML', nom: 'Insecticide aérosol 400ml (carton 24)', categorie: 'Entretien', stock: 58, seuil: 30, prix_unitaire: 3_400, entrepot: 'Kara' },
  { id: 'p-27', reference: 'PRD-HUILE-1L', nom: 'Huile végétale 1L (carton 12)', categorie: 'Alimentaire', stock: 420, seuil: 150, prix_unitaire: 2_200, entrepot: 'Lomé Port' },
  { id: 'p-28', reference: 'PRD-HARICOT-1KG', nom: 'Haricots rouges 1 kg (sac 10)', categorie: 'Alimentaire', stock: 185, seuil: 60, prix_unitaire: 3_100, entrepot: 'Kara' },
  { id: 'p-29', reference: 'PRD-LAIT-UHT-1L', nom: 'Lait UHT 1L (pack 12)', categorie: 'Alimentaire', stock: 275, seuil: 90, prix_unitaire: 4_800, entrepot: 'Lomé Port' },
  { id: 'p-30', reference: 'PRD-CHIPS-150G', nom: 'Chips 150g (carton 24)', categorie: 'Alimentaire', stock: 132, seuil: 48, prix_unitaire: 2_900, entrepot: 'Lomé Port' },

  /*
   * Stock mort — le capital qui dort.
   *
   * Un catalogue de distribution n'est jamais composé que de références saines : il traîne
   * toujours des palettes qu'on n'ose pas regarder. Elles ne provoquent aucune rupture, aucune
   * alerte, aucun cri du commercial — elles coûtent simplement 22 % de leur valeur par an,
   * en silence. Les quatre références ci-dessous sont les quatre façons classiques d'en arriver là.
   */

  // Invendu de campagne : commandé pour la CAN, l'événement est passé, l'habillage est daté.
  // Plus aucune rotation. C'est le cas d'école de l'obsolescence.
  { id: 'p-31', reference: 'PRD-ENERGY-CAN', nom: 'Boisson énergisante — édition CAN (pack 24)', categorie: 'Boissons', stock: 380, seuil: 50, prix_unitaire: 8_900, entrepot: 'Lomé Port' },

  // Achat d'opportunité : l'acheteur a pris trois palettes pour décrocher la remise volume.
  // La remise était réelle ; la demande, non. Dix mois de couverture.
  { id: 'p-32', reference: 'PRD-SIROP-MENTHE', nom: 'Sirop menthe 1L (pack 6)', categorie: 'Boissons', stock: 240, seuil: 60, prix_unitaire: 5_400, entrepot: 'Lomé Port' },

  // Produit frais à DLC courte, commandé au rythme d'un produit sec : la couverture dépasse
  // largement la durée de vie. Une partie du lot périmera en chambre froide, pas en rayon.
  { id: 'p-33', reference: 'PRD-JUS-FRAIS-1L', nom: 'Jus pressé réfrigéré 1L (pack 6)', categorie: 'Boissons', stock: 180, seuil: 40, prix_unitaire: 7_200, entrepot: 'Lomé Port' },

  // Référence saisonnière bloquée à Kara : elle ne tourne qu'à la saison des pluies et
  // occupe toute l'année des emplacements de picking au sol.
  { id: 'p-34', reference: 'PRD-MOUSTIQUAIRE', nom: 'Moustiquaire imprégnée (carton 10)', categorie: 'Hygiène', stock: 95, seuil: 20, prix_unitaire: 22_000, entrepot: 'Kara' },
]

/** Rotation moyenne par famille — sert de base aux sorties 30 j quand le produit n'est pas listé ci-dessous. */
const ROTATION_PAR_CATEGORIE: Record<string, number> = {
  Boissons: 4.2,
  Alimentaire: 3.6,
  'Hygiène': 2.8,
  Entretien: 2.4,
}

/** Sorties réelles des 30 derniers jours — produits dont la demande s'écarte de la rotation de famille. */
const VENTES_30J: Record<string, number> = {
  'PRD-HUILE-5L': 920,      // demande forte + fournisseur en retard = la rupture du mois
  'PRD-RIZ-25KG': 1_240,
  'PRD-SAVON-PACK': 310,    // stock 45 pour un seuil de 80
  'PRD-DETERGENT-5L': 340,
  'PRD-EAU-1.5L': 2_100,
  'PRD-EAU-50CL': 2_800,
  'PRD-COCA-33CL': 1_450,
  'PRD-BIERE-33CL': 1_320,
  'PRD-PAPIER-HYG': 190,
  'PRD-INSECT-400ML': 96,
  'PRD-DENTIFRICE-PK': 128,
  // Rotations rapides de Kara : leur couverture passe sous la cible en même temps,
  // et comme elles partagent un fournisseur, le moteur les regroupe en une commande.
  'PRD-LAIT-400G': 1_050,
  'PRD-CAFE-200G': 810,

  /*
   * Les sorties du stock mort. Sans ces lignes, la rotation moyenne de famille
   * (`ROTATION_PAR_CATEGORIE`) leur prêterait une demande qu'elles n'ont pas, et ces
   * références passeraient pour saines — c'est exactement ainsi qu'un stock mort reste
   * invisible dans un ERP : personne ne déclare jamais qu'un produit ne se vend plus.
   */
  'PRD-ENERGY-CAN': 6,        // 380 en stock : plus de cinq ans d'écoulement au rythme actuel
  'PRD-SIROP-MENTHE': 24,     // 240 en stock pour 0,8 u./jour — dix mois de couverture
  'PRD-JUS-FRAIS-1L': 60,     // tourne correctement, mais 90 j de couverture pour 30 j de DLC
  'PRD-MOUSTIQUAIRE': 12,     // saisonnier : ne bouge qu'aux pluies, dort le reste de l'année
}

/**
 * Catalogue enrichi des sorties 30 j — base du calcul de vitesse de vente
 * du moteur de réappro (`src/lib/reappro-engine.ts`).
 */
export const REGISTRE_STOCK: ProduitStock[] = STOCK_SEED.map(p => ({
  ...p,
  ventes_30j: VENTES_30J[p.reference]
    ?? Math.round(p.seuil * (ROTATION_PAR_CATEGORIE[p.categorie] ?? 3)),
}))

export const CATEGORIES_CATALOGUE = ['Boissons', 'Alimentaire', 'Hygiène', 'Entretien'] as const
