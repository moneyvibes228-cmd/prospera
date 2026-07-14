/**
 * Réalité physique de l'entrepôt — ce que le pilotage commercial ignore complètement.
 *
 * Le reste de l'application décrit le stock en francs : valeur immobilisée, marge,
 * rentabilité. Un gestionnaire d'entrepôt ne travaille pas là-dedans. Il travaille en
 * mètres, en kilos, en allées et en heures : où est le produit, combien pèse la palette,
 * dans quel camion elle rentre, qui la prépare et en combien de temps.
 *
 * Ce registre est le socle physique qui manquait. Sans lui, aucun moteur de picking,
 * de chargement ou d'inventaire n'a de sens — ils ne sauraient rien du monde réel.
 */

import { REGISTRE_STOCK } from './stock-registry'
import { hashString, randInt, seededRandom } from '@distributeur/lib/generators/mock-seed'

/* ------------------------------------------------------------------ */
/* Topologie des entrepôts                                             */
/* ------------------------------------------------------------------ */

export interface ZonePicking {
  /** Code allée — le préparateur la lit sur l'étiquette au sol. */
  code: string
  libelle: string
  /** Ordre de parcours physique : le chemin de picking suit cet ordre croissant. */
  ordre: number
  /** Température dirigée : impose des contraintes de co-chargement. */
  froid: boolean
}

export interface TopologieEntrepot {
  entrepot: string
  /** Surface de stockage exploitable. */
  surface_m2: number
  /** Capacité en emplacements palette. */
  emplacements_total: number
  zones: ZonePicking[]
  /** Quais de chargement — contrainte de débit à l'expédition. */
  quais: number
  /** Heure limite de départ des camions : au-delà, la livraison bascule à J+1. */
  heure_cutoff: string
}

export const TOPOLOGIE_ENTREPOTS: TopologieEntrepot[] = [
  {
    entrepot: 'Lomé Port',
    surface_m2: 3_200,
    emplacements_total: 1_450,
    quais: 4,
    heure_cutoff: '15:30',
    zones: [
      { code: 'A', libelle: 'Boissons — palettiers lourds', ordre: 1, froid: false },
      { code: 'B', libelle: 'Alimentaire sec — sacs & cartons', ordre: 2, froid: false },
      { code: 'C', libelle: 'Alimentaire — rotation rapide (picking sol)', ordre: 3, froid: false },
      { code: 'D', libelle: 'Hygiène & entretien', ordre: 4, froid: false },
      { code: 'E', libelle: 'Frais & DLC courte', ordre: 5, froid: true },
      { code: 'Z', libelle: 'Zone de préparation / départ quais', ordre: 9, froid: false },
    ],
  },
  {
    entrepot: 'Kara',
    surface_m2: 900,
    emplacements_total: 380,
    quais: 1,
    heure_cutoff: '14:00',
    zones: [
      { code: 'A', libelle: 'Boissons & liquides', ordre: 1, froid: false },
      { code: 'B', libelle: 'Alimentaire sec', ordre: 2, froid: false },
      { code: 'D', libelle: 'Hygiène & entretien', ordre: 3, froid: false },
      { code: 'Z', libelle: 'Zone de départ', ordre: 9, froid: false },
    ],
  },
]

export function getTopologie(entrepot: string): TopologieEntrepot {
  return TOPOLOGIE_ENTREPOTS.find(t => t.entrepot === entrepot) ?? TOPOLOGIE_ENTREPOTS[0]
}

/* ------------------------------------------------------------------ */
/* Fiche logistique produit                                            */
/* ------------------------------------------------------------------ */

export interface FicheLogistique {
  produit_ref: string
  entrepot: string
  /** Emplacement de picking : allée-travée-niveau, ex. « B-07-2 ». */
  emplacement: string
  /** Allée — pilote l'ordre de parcours. */
  allee: string
  /** Poids d'une unité de vente (le colis / pack / sac tel qu'il est stocké). */
  poids_kg: number
  /** Volume d'une unité de vente, en m³. */
  volume_m3: number
  /** Unités par palette complète — au-delà, le préparateur sort une palette entière. */
  unites_par_palette: number
  /** Prix d'achat unitaire — le coût, jamais le prix de vente. */
  cout_achat: number
  /** Durée de vie restante moyenne du lot en stock, en jours. `null` = non périssable. */
  dlc_jours: number | null
  fragile: boolean
  /** Vrai si le produit doit être stocké et transporté en froid dirigé. */
  froid: boolean
}

/** Densité et conditionnement réels par famille — un pack d'eau ne pèse pas comme un savon. */
const GABARIT_PAR_CATEGORIE: Record<string, {
  poids: number; volume: number; parPalette: number; dlc: number | null; froid: boolean
}> = {
  Boissons:     { poids: 12.5, volume: 0.021, parPalette: 84,  dlc: 240, froid: false },
  Alimentaire:  { poids: 9.0,  volume: 0.018, parPalette: 60,  dlc: 180, froid: false },
  'Hygiène':    { poids: 5.5,  volume: 0.024, parPalette: 72,  dlc: null, froid: false },
  Entretien:    { poids: 7.5,  volume: 0.019, parPalette: 66,  dlc: null, froid: false },
}

/** Familles rangées dans l'allée de picking au sol : celles qui tournent le plus vite. */
const ALLEE_PAR_CATEGORIE: Record<string, string> = {
  Boissons: 'A',
  Alimentaire: 'B',
  'Hygiène': 'D',
  Entretien: 'D',
}

/** Coefficients de gabarit propres à certaines références — les sacs de 25 kg ne mentent pas. */
const GABARIT_SPECIFIQUE: Record<string, Partial<{ poids_kg: number; volume_m3: number; unites_par_palette: number; dlc_jours: number | null }>> = {
  'PRD-RIZ-25KG': { poids_kg: 25, volume_m3: 0.033, unites_par_palette: 40, dlc_jours: 365 },
  'PRD-FARINE-25KG': { poids_kg: 25, volume_m3: 0.033, unites_par_palette: 40, dlc_jours: 210 },
  'PRD-HUILE-5L': { poids_kg: 4.7, volume_m3: 0.006, unites_par_palette: 120, dlc_jours: 300 },
  'PRD-DETERGENT-5L': { poids_kg: 5.4, volume_m3: 0.007, unites_par_palette: 100 },
  'PRD-EAU-1.5L': { poids_kg: 18, volume_m3: 0.024, unites_par_palette: 72, dlc_jours: 300 },
  'PRD-EAU-50CL': { poids_kg: 12, volume_m3: 0.016, unites_par_palette: 96, dlc_jours: 300 },
  'PRD-BIERE-33CL': { poids_kg: 16.8, volume_m3: 0.020, unites_par_palette: 80, dlc_jours: 120 },
  'PRD-BIERE-65CL': { poids_kg: 14.5, volume_m3: 0.019, unites_par_palette: 80, dlc_jours: 120 },
  // DLC courte : c'est ce produit qui périme si la rotation décroche.
  'PRD-LAIT-UHT-1L': { poids_kg: 12.4, volume_m3: 0.014, unites_par_palette: 90, dlc_jours: 45 },
  'PRD-JUS-1L': { poids_kg: 6.6, volume_m3: 0.009, unites_par_palette: 110, dlc_jours: 60 },
  'PRD-BISCUIT-PK': { poids_kg: 4.2, volume_m3: 0.030, unites_par_palette: 54, dlc_jours: 90 },
  'PRD-PAPIER-HYG': { poids_kg: 1.8, volume_m3: 0.045, unites_par_palette: 40 },
  // Frais : 30 j de DLC. C'est cette ligne qui rend la péremption détectable — un produit
  // sans DLC déclarée ne périme jamais aux yeux du système, seulement dans l'entrepôt.
  'PRD-JUS-FRAIS-1L': { poids_kg: 6.6, volume_m3: 0.009, unites_par_palette: 110, dlc_jours: 30 },
  // Volumineuse et légère : elle sature le volume de picking sans peser, et ne tourne pas.
  'PRD-MOUSTIQUAIRE': { poids_kg: 3.2, volume_m3: 0.055, unites_par_palette: 36, dlc_jours: null },
  'PRD-ENERGY-CAN': { poids_kg: 16.8, volume_m3: 0.020, unites_par_palette: 80, dlc_jours: 150 },
  'PRD-SIROP-MENTHE': { poids_kg: 8.4, volume_m3: 0.011, unites_par_palette: 96, dlc_jours: 240 },
}

/** Marge commerciale moyenne par famille — sert à retrouver le coût d'achat depuis le prix de vente. */
const MARGE_PAR_CATEGORIE: Record<string, number> = {
  Boissons: 0.14,
  Alimentaire: 0.16,
  'Hygiène': 0.22,
  Entretien: 0.20,
}

function ficheDuProduit(ref: string): FicheLogistique {
  const produit = REGISTRE_STOCK.find(p => p.reference === ref)!
  const gabarit = GABARIT_PAR_CATEGORIE[produit.categorie] ?? GABARIT_PAR_CATEGORIE.Alimentaire
  const specifique = GABARIT_SPECIFIQUE[ref] ?? {}
  const rng = seededRandom(hashString(`emp-${ref}`))

  const froid = (specifique.dlc_jours ?? gabarit.dlc) !== null
    && (specifique.dlc_jours ?? gabarit.dlc)! <= 45

  const allee = froid && produit.entrepot === 'Lomé Port'
    ? 'E'
    : ALLEE_PAR_CATEGORIE[produit.categorie] ?? 'B'

  const marge = MARGE_PAR_CATEGORIE[produit.categorie] ?? 0.16

  return {
    produit_ref: ref,
    entrepot: produit.entrepot,
    allee,
    emplacement: `${allee}-${String(randInt(rng, 1, 18)).padStart(2, '0')}-${randInt(rng, 1, 3)}`,
    poids_kg: specifique.poids_kg ?? gabarit.poids,
    volume_m3: specifique.volume_m3 ?? gabarit.volume,
    unites_par_palette: specifique.unites_par_palette ?? gabarit.parPalette,
    cout_achat: Math.round(produit.prix_unitaire * (1 - marge)),
    dlc_jours: specifique.dlc_jours !== undefined ? specifique.dlc_jours : gabarit.dlc,
    fragile: produit.categorie === 'Boissons',
    froid,
  }
}

export const FICHES_LOGISTIQUES: FicheLogistique[] = REGISTRE_STOCK.map(p => ficheDuProduit(p.reference))

export function getFicheLogistique(ref: string): FicheLogistique | undefined {
  return FICHES_LOGISTIQUES.find(f => f.produit_ref === ref)
}

/** Ordre de parcours d'une allée dans l'entrepôt — base du chemin de picking. */
export function ordreAllee(entrepot: string, allee: string): number {
  return getTopologie(entrepot).zones.find(z => z.code === allee)?.ordre ?? 99
}

/* ------------------------------------------------------------------ */
/* Flotte                                                              */
/* ------------------------------------------------------------------ */

export interface Camion {
  id: string
  immatriculation: string
  type: 'PORTEUR' | 'FOURGON' | 'TRICYCLE'
  entrepot: string
  /** Charge utile en kg — la contrainte qui saute en premier sur les boissons. */
  charge_utile_kg: number
  /** Volume utile en m³ — la contrainte qui saute en premier sur le papier hygiénique. */
  volume_utile_m3: number
  chauffeur: string
  /** Coût de mise en route d'une tournée, quel que soit le remplissage. */
  cout_tournee_fcfa: number
  cout_km_fcfa: number
  /** Un camion immobilisé ne peut pas être planifié. */
  disponible: boolean
  indisponibilite?: string
}

export const FLOTTE: Camion[] = [
  {
    id: 'cam-1', immatriculation: 'TG-4821-AB', type: 'PORTEUR', entrepot: 'Lomé Port',
    charge_utile_kg: 3_500, volume_utile_m3: 18, chauffeur: 'Kwami Aholou',
    cout_tournee_fcfa: 28_000, cout_km_fcfa: 320, disponible: true,
  },
  {
    id: 'cam-2', immatriculation: 'TG-7734-CD', type: 'PORTEUR', entrepot: 'Lomé Port',
    charge_utile_kg: 3_500, volume_utile_m3: 18, chauffeur: 'Sena Amouzou',
    cout_tournee_fcfa: 28_000, cout_km_fcfa: 320, disponible: true,
  },
  {
    id: 'cam-3', immatriculation: 'TG-1290-EF', type: 'FOURGON', entrepot: 'Lomé Port',
    charge_utile_kg: 1_200, volume_utile_m3: 9, chauffeur: 'Yao Kouassi',
    cout_tournee_fcfa: 16_000, cout_km_fcfa: 190, disponible: true,
  },
  {
    id: 'cam-4', immatriculation: 'TG-5512-GH', type: 'TRICYCLE', entrepot: 'Lomé Port',
    charge_utile_kg: 400, volume_utile_m3: 2.5, chauffeur: 'Komi Adjo',
    cout_tournee_fcfa: 5_000, cout_km_fcfa: 70, disponible: true,
  },
  {
    id: 'cam-5', immatriculation: 'TG-8830-IJ', type: 'PORTEUR', entrepot: 'Lomé Port',
    charge_utile_kg: 3_500, volume_utile_m3: 18, chauffeur: 'Edoh Lawson',
    cout_tournee_fcfa: 28_000, cout_km_fcfa: 320, disponible: false,
    indisponibilite: 'Immobilisé — révision boîte de vitesses, retour prévu 13/06',
  },
  {
    id: 'cam-6', immatriculation: 'TG-2077-KL', type: 'FOURGON', entrepot: 'Kara',
    charge_utile_kg: 1_200, volume_utile_m3: 9, chauffeur: 'Abdoul Tchalla',
    cout_tournee_fcfa: 18_000, cout_km_fcfa: 210, disponible: true,
  },
]

export function camionsDisponibles(entrepot: string): Camion[] {
  return FLOTTE.filter(c => c.entrepot === entrepot && c.disponible)
    // Le plus gros camion d'abord : on remplit le porteur avant de sortir un second véhicule.
    .sort((a, b) => b.charge_utile_kg - a.charge_utile_kg)
}

/* ------------------------------------------------------------------ */
/* Équipe de préparation                                               */
/* ------------------------------------------------------------------ */

export interface Preparateur {
  id: string
  nom: string
  entrepot: string
  /** Cadence constatée, en lignes de picking par heure. */
  cadence_lignes_h: number
  /** Taux d'erreur constaté sur les 30 derniers jours. */
  taux_erreur_pct: number
  /** Heures effectivement disponibles sur la journée. */
  heures_dispo: number
  present: boolean
  absence?: string
}

export const PREPARATEURS: Preparateur[] = [
  { id: 'prep-1', nom: 'Kossi Ablavi', entrepot: 'Lomé Port', cadence_lignes_h: 42, taux_erreur_pct: 1.2, heures_dispo: 7.5, present: true },
  { id: 'prep-2', nom: 'Afi Sodji', entrepot: 'Lomé Port', cadence_lignes_h: 38, taux_erreur_pct: 0.8, heures_dispo: 7.5, present: true },
  { id: 'prep-3', nom: 'Mensah Klu', entrepot: 'Lomé Port', cadence_lignes_h: 31, taux_erreur_pct: 4.6, heures_dispo: 7.5, present: true },
  { id: 'prep-4', nom: 'Dela Agbo', entrepot: 'Lomé Port', cadence_lignes_h: 45, taux_erreur_pct: 1.0, heures_dispo: 0, present: false, absence: 'Congé — retour 15/06' },
  { id: 'prep-5', nom: 'Ayoko Bassa', entrepot: 'Kara', cadence_lignes_h: 34, taux_erreur_pct: 2.1, heures_dispo: 7, present: true },
]

export function preparateursPresents(entrepot: string): Preparateur[] {
  return PREPARATEURS.filter(p => p.entrepot === entrepot && p.present)
}

/** Capacité de préparation de la journée, en lignes — le plafond que la file de picking ne peut pas dépasser. */
export function capaciteLignesJour(entrepot: string): number {
  return Math.round(
    preparateursPresents(entrepot).reduce((s, p) => s + p.cadence_lignes_h * p.heures_dispo, 0),
  )
}
