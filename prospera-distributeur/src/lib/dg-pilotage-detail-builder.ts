/**
 * Données détail DG grossiste — produits, expéditions, équipes, anomalies opérationnelles.
 */
import { REGISTRE_STOCK } from './registries/stock-registry'

export interface TopProduitDG {
  reference: string
  nom: string
  categorie: string
  quantite_sortie_mois: number
  unite: string
  ca_mois: number
  marge_pct: number
  rupture: boolean
  evolution_pct: number
}

export type StatutExpedition = 'LIVREE' | 'EN_ROUTE' | 'PREPARATION' | 'RETARD'

export interface ExpeditionDG {
  id: string
  bl_numero: string
  entrepot: string
  client: string
  lignes: number
  montant: number
  statut: StatutExpedition
  heure_prevue: string
  retard_h?: number
}

export type RoleEquipeDG = 'ENTREPOT' | 'VRP' | 'FREELANCE' | 'SUPPLY' | 'RECOUVREMENT'

export interface MembreEquipeDG {
  id: string
  nom: string
  role: RoleEquipeDG
  poste: string
  indicateur_label: string
  indicateur_valeur: string
  performance_pct: number
  alerte?: string
}

export interface AnomalieOperationnelleDG {
  id: string
  titre: string
  detail: string
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  domaine: string
  responsable: string
}

export function buildTopProduitsDG(): TopProduitDG[] {
  const huile = REGISTRE_STOCK.find(p => p.reference === 'PRD-HUILE-5L')!
  const eau = REGISTRE_STOCK.find(p => p.reference === 'PRD-EAU-1.5L')!
  const riz = REGISTRE_STOCK.find(p => p.reference === 'PRD-RIZ-25KG')!
  const soda = REGISTRE_STOCK.find(p => p.reference === 'PRD-COCA-33CL')!
  const savon = REGISTRE_STOCK.find(p => p.reference === 'PRD-SAVON-PACK')!

  return [
    { reference: eau.reference, nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_sortie_mois: 18_400, unite: 'packs', ca_mois: 77_280_000, marge_pct: 14.2, rupture: false, evolution_pct: 12 },
    { reference: soda.reference, nom: 'Soda 33cl pack 24', categorie: 'Boissons', quantite_sortie_mois: 9_200, unite: 'packs', ca_mois: 90_160_000, marge_pct: 16.8, rupture: false, evolution_pct: 8 },
    { reference: riz.reference, nom: 'Riz parfumé 25 kg', categorie: 'Alimentaire', quantite_sortie_mois: 4_850, unite: 'sacs', ca_mois: 87_300_000, marge_pct: 11.5, rupture: false, evolution_pct: -3 },
    { reference: huile.reference, nom: 'Huile végétale 5L', categorie: 'Alimentaire', quantite_sortie_mois: 3_120, unite: 'cartons', ca_mois: 26_520_000, marge_pct: 9.8, rupture: huile.stock < huile.seuil, evolution_pct: 22 },
    { reference: savon.reference, nom: 'Savon ménager carton 48', categorie: 'Hygiène', quantite_sortie_mois: 1_840, unite: 'cartons', ca_mois: 22_080_000, marge_pct: 18.4, rupture: savon.stock < savon.seuil, evolution_pct: 5 },
  ]
}

export function buildExpeditionsJourDG(): ExpeditionDG[] {
  return [
    { id: 'exp-1', bl_numero: 'BL-2026-4812', entrepot: 'Lomé Port', client: 'Dépôt Akossombo', lignes: 14, montant: 4_280_000, statut: 'LIVREE', heure_prevue: '08:30' },
    { id: 'exp-2', bl_numero: 'BL-2026-4819', entrepot: 'Lomé Port', client: 'Épicerie Mama T.', lignes: 8, montant: 1_920_000, statut: 'EN_ROUTE', heure_prevue: '11:00' },
    { id: 'exp-3', bl_numero: 'BL-2026-4824', entrepot: 'Lomé Port', client: 'Kiosque Port', lignes: 6, montant: 890_000, statut: 'RETARD', heure_prevue: '09:00', retard_h: 3 },
    { id: 'exp-4', bl_numero: 'BL-2026-4831', entrepot: 'Lomé Port', client: 'Grossiste Bè-Klikamé', lignes: 22, montant: 8_640_000, statut: 'PREPARATION', heure_prevue: '14:30' },
    { id: 'exp-5', bl_numero: 'BL-2026-4808', entrepot: 'Kara', client: 'Boutique Kara Centre', lignes: 5, montant: 1_140_000, statut: 'LIVREE', heure_prevue: '07:45' },
    { id: 'exp-6', bl_numero: 'BL-2026-4836', entrepot: 'Kara', client: 'Dépôt Sokodé Nord', lignes: 9, montant: 2_380_000, statut: 'PREPARATION', heure_prevue: '16:00' },
  ]
}

export function buildEquipesPilotageDG(): MembreEquipeDG[] {
  return [
    { id: 'eq-1', nom: 'Edem Kpodo', role: 'ENTREPOT', poste: 'Chef entrepôt Lomé Port', indicateur_label: 'BL préparés / jour', indicateur_valeur: '14 / 16 obj.', performance_pct: 88, alerte: '2 retards picking' },
    { id: 'eq-2', nom: 'Afi Mensah', role: 'ENTREPOT', poste: 'Responsable Kara', indicateur_label: 'Taux service', indicateur_valeur: '96%', performance_pct: 96 },
    { id: 'eq-3', nom: 'Yao Mensah', role: 'SUPPLY', poste: 'Achats & approvisionnement', indicateur_label: 'SKU sous seuil', indicateur_valeur: '3 en alerte', performance_pct: 72, alerte: 'Huile 5L critique' },
    { id: 'eq-4', nom: 'Komlan Tetteh', role: 'VRP', poste: 'VRP Lomé Nord', indicateur_label: 'Sorties terrain / jour', indicateur_valeur: '2,84 M FCFA', performance_pct: 112 },
    { id: 'eq-5', nom: 'Kofi Agbessi', role: 'FREELANCE', poste: 'Indépendant Lomé Sud', indicateur_label: 'Marge nette / jour', indicateur_valeur: '150 K FCFA', performance_pct: 118 },
    { id: 'eq-6', nom: 'Elom Adjavon', role: 'RECOUVREMENT', poste: 'Crédit client B2B', indicateur_label: 'Encaissements / jour', indicateur_valeur: '3,2 M FCFA', performance_pct: 77, alerte: 'Kiosque Port J+45' },
  ]
}

export function buildAnomaliesOperationnellesDG(): AnomalieOperationnelleDG[] {
  return [
    {
      id: 'ao-1', severite: 'CRITIQUE', domaine: 'Crédit B2B',
      titre: 'Blocage commande — Kiosque Port',
      detail: '890 K FCFA impayés J+45 · plafond 500 K dépassé · BL-2026-4824 en retard 3h',
      responsable: 'Elom Adjavon',
    },
    {
      id: 'ao-2', severite: 'CRITIQUE', domaine: 'Supply chain',
      titre: 'Rupture huile 5L — Lomé Port',
      detail: '180 / 200 cartons · VSS 0,9 sem. · 34 détaillants alimentaires sans réappro',
      responsable: 'Yao Mensah',
    },
    {
      id: 'ao-3', severite: 'HAUTE', domaine: 'Logistique',
      titre: 'Picking alimentaire en retard',
      detail: '7 BLP en attente · délai moyen 1,4j vs obj. 1,2j · taux service 91%',
      responsable: 'Edem Kpodo',
    },
    {
      id: 'ao-4', severite: 'HAUTE', domaine: 'Canal VRP',
      titre: '12 livraisons sans tournée préalable',
      detail: 'PDV sans passage commercial 15j · couverture Lomé Est 62%',
      responsable: 'Kodjo Agbeko',
    },
    {
      id: 'ao-5', severite: 'MODEREE', domaine: 'Canal freelance',
      titre: 'Marge Kofi Agbessi +18%',
      detail: '2 nouveaux détaillants signés · modèle prix client à documenter',
      responsable: 'Kofi Agbessi',
    },
  ]
}

export const STATUT_EXPEDITION_STYLE: Record<StatutExpedition, { label: string; className: string }> = {
  LIVREE: { label: 'Livrée', className: 'bg-emerald-100 text-emerald-700' },
  EN_ROUTE: { label: 'En route', className: 'bg-sky-100 text-sky-700' },
  PREPARATION: { label: 'Préparation', className: 'bg-amber-100 text-amber-700' },
  RETARD: { label: 'Retard', className: 'bg-red-100 text-red-700' },
}

export const ROLE_EQUIPE_LABEL: Record<RoleEquipeDG, string> = {
  ENTREPOT: 'Entrepôt',
  VRP: 'VRP',
  FREELANCE: 'Freelance',
  SUPPLY: 'Supply',
  RECOUVREMENT: 'Recouvrement',
}
