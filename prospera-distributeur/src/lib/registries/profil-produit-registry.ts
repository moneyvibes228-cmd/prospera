/**
 * Profil commercial des produits — ce qui manquait pour empêcher le stock mort.
 *
 * Les quatre causes de capital immobilisé ont toutes un point commun : au moment de l'achat,
 * l'information qui aurait dit « non » existait déjà, mais elle n'était nulle part dans le
 * système. On achetait donc à l'aveugle, et on découvrait la palette morte dix mois plus tard.
 *
 *   — La boisson de la CAN avait une **date de péremption commerciale** (l'événement) bien
 *     avant sa DLC. Personne ne l'avait écrite.
 *   — La moustiquaire ne se vend qu'à la **saison des pluies**. Personne ne l'avait écrit.
 *   — Le sirop a été pris en 3 palettes pour une remise volume, sans jamais confronter la
 *     remise au **coût de portage** des 10 mois de couverture qu'elle créait.
 *   — Le jus frais a été commandé au rythme d'un produit sec, sans confronter la quantité
 *     à sa **DLC**.
 *
 * Ce registre porte ces trois informations. Elles ne servent pas à décrire les produits :
 * elles servent à refuser des commandes.
 */

export type SaisonnaliteProduit = 'AUCUNE' | 'SAISONNIER' | 'EVENEMENTIEL'

export interface ProfilProduit {
  produit_ref: string
  saisonnalite: SaisonnaliteProduit
  /** Mois de forte demande (1 = janvier). Vide ⇒ le produit se vend toute l'année. */
  mois_de_vente: number[]
  /**
   * Date après laquelle le produit devient invendable au prix normal, quelle que soit sa DLC.
   * C'est la péremption **commerciale** : un maillot de la CAN n'est pas périmé, il est invendable.
   */
  fin_de_vie_commerciale?: string
  /**
   * Élasticité prix : de combien les ventes augmentent quand on baisse le prix de 1 %.
   * 1,8 signifie qu'une remise de 10 % fait vendre 18 % de plus. C'est ce coefficient qui
   * détermine si une décote peut réellement écouler un stock, ou si elle ne fera que brader.
   */
  elasticite_prix: number
  /** Le fournisseur reprend-il les invendus, et avec quelle décote ? */
  reprise_fournisseur_pct?: number
}

/**
 * Élasticités par famille — mesurées sur l'historique des promotions du réseau.
 * Les produits de première nécessité réagissent peu au prix (on n'achète pas deux fois
 * plus de riz parce qu'il est soldé) ; le confort et l'impulsion y réagissent fortement.
 */
const ELASTICITE_PAR_CATEGORIE: Record<string, number> = {
  Boissons: 2.1,
  Alimentaire: 1.2,
  'Hygiène': 1.6,
  Entretien: 1.4,
}

const PROFILS: ProfilProduit[] = [
  {
    produit_ref: 'PRD-ENERGY-CAN',
    saisonnalite: 'EVENEMENTIEL',
    mois_de_vente: [1, 2],
    // L'habillage porte la CAN : passé l'événement, le produit ne se vend plus au prix normal.
    fin_de_vie_commerciale: '2026-02-28',
    elasticite_prix: 2.4,
    reprise_fournisseur_pct: 0,
  },
  {
    produit_ref: 'PRD-MOUSTIQUAIRE',
    saisonnalite: 'SAISONNIER',
    // Saison des pluies au Togo — c'est la seule fenêtre où la moustiquaire se vend.
    mois_de_vente: [4, 5, 6, 7, 8, 9, 10],
    elasticite_prix: 1.3,
    reprise_fournisseur_pct: 40,
  },
  {
    produit_ref: 'PRD-SIROP-MENTHE',
    saisonnalite: 'AUCUNE',
    mois_de_vente: [],
    elasticite_prix: 2.2,
    reprise_fournisseur_pct: 25,
  },
  {
    produit_ref: 'PRD-JUS-FRAIS-1L',
    saisonnalite: 'AUCUNE',
    mois_de_vente: [],
    // Le frais se brade mal : au-delà d'une certaine décote, le client doute du produit.
    elasticite_prix: 1.9,
    reprise_fournisseur_pct: 0,
  },
]

export function getProfilProduit(ref: string, categorie?: string): ProfilProduit {
  const profil = PROFILS.find(p => p.produit_ref === ref)
  if (profil) return profil

  return {
    produit_ref: ref,
    saisonnalite: 'AUCUNE',
    mois_de_vente: [],
    elasticite_prix: (categorie ? ELASTICITE_PAR_CATEGORIE[categorie] : undefined) ?? 1.5,
  }
}

/** Le produit est-il dans sa fenêtre de vente à cette date ? */
export function estEnSaison(profil: ProfilProduit, date: string): boolean {
  if (profil.mois_de_vente.length === 0) return true
  const mois = new Date(date).getMonth() + 1
  return profil.mois_de_vente.includes(mois)
}

/** Mois restants avant la fermeture de la fenêtre de vente. 0 = elle est fermée. */
export function moisAvantFinDeSaison(profil: ProfilProduit, date: string): number {
  if (profil.mois_de_vente.length === 0) return 12
  const mois = new Date(date).getMonth() + 1
  if (!profil.mois_de_vente.includes(mois)) return 0

  let restants = 0
  for (let m = mois; m <= 12; m++) {
    if (!profil.mois_de_vente.includes(m)) break
    restants++
  }
  return restants
}
