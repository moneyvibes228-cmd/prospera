/**
 * Tournées & Cash — la matière quotidienne du Superviseur de Zone.
 *
 * Ce que supervise un chef d'équipe terrain chez un distributeur, ce n'est pas
 * le chiffre d'affaires (c'est le métier du responsable des ventes) : c'est
 * **l'exécution**. Trois choses, tous les jours :
 *
 *   1. Le PJP — plan de journée permanent : chaque commercial a une liste de
 *      PDV à visiter. Réalisé vs planifié, et surtout le **strike rate** :
 *      combien de visites se transforment en commande. Une visite sans
 *      commande, c'est du carburant brûlé.
 *   2. Le **cash** — en distribution africaine, le commercial encaisse en
 *      espèces sur le terrain et remet la caisse le soir. L'écart de caisse
 *      est le premier signal de fraude, et c'est le superviseur qui le voit.
 *   3. L'**exécution en magasin** — présence des références, prix affiché
 *      conforme, PLV posée. Ce que le client voit dans la boutique.
 *
 * Aucun de ces trois indicateurs n'existe sur l'écran du DG. C'est précisément
 * ce qui fait que le poste est un poste.
 */

import { REGISTRE_COMMERCIAUX, type CommercialRegistryEntry } from './registries/commerciaux-registry'
import type { Perimetre } from './perimetre'

export type StatutTournee = 'EN_COURS' | 'TERMINEE' | 'NON_DEMARREE'

export interface TourneeCommercial {
  commercial: string
  zone: string
  type: CommercialRegistryEntry['type']
  statut: StatutTournee
  /** PDV inscrits au plan de journée. */
  pjp_planifie: number
  pjp_realise: number
  /** Visites ayant débouché sur une commande. */
  visites_avec_commande: number
  /** Taux de transformation visite → commande. */
  strike_rate: number
  couverture_pjp: number
  /** Espèces encaissées sur le terrain aujourd'hui. */
  cash_encaisse: number
  /** Espèces effectivement remises à la caisse. */
  cash_remis: number
  /** cash_remis − cash_encaisse : négatif = manquant. */
  ecart_caisse: number
  /** Jours depuis la dernière remise de caisse — au-delà de 2 j, c'est une alerte. */
  jours_sans_remise: number
  km_parcourus: number
  derniere_position: string
}

export interface AlerteTournee {
  severite: 'CRITIQUE' | 'MODEREE'
  commercial: string
  titre: string
  detail: string
  action: string
}

export interface ExecutionMagasin {
  critere: string
  conforme: number
  total: number
  pct: number
  cible: number
}

/** Générateur déterministe — même zone, même rendu à chaque affichage. */
function seedDe(nom: string): () => number {
  let h = 2166136261
  for (let i = 0; i < nom.length; i++) {
    h ^= nom.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5
    return Math.abs(h % 1000) / 1000
  }
}

function construireTournee(c: CommercialRegistryEntry): TourneeCommercial {
  const rnd = seedDe(c.nom)

  const pjp_planifie = c.visites_objectif
  const pjp_realise = Math.min(c.visites_jour, pjp_planifie + 4)
  const visites_avec_commande = c.commandes_jour
  const strike_rate = pjp_realise > 0 ? Math.round((visites_avec_commande / pjp_realise) * 100) : 0
  const couverture_pjp = Math.round((pjp_realise / pjp_planifie) * 100)

  // Le cash encaissé suit le CA du jour : ~55 % des ventes se règlent en espèces.
  const cash_encaisse = Math.round((c.ca_jour * 0.55) / 5_000) * 5_000

  const tirage = rnd()
  // Deux commerciaux sur ce tirage présentent un manquant — le signal à voir.
  const manquant = tirage > 0.82 ? Math.round((cash_encaisse * (0.02 + rnd() * 0.04)) / 1_000) * 1_000 : 0
  const cash_remis = cash_encaisse - manquant

  const jours_sans_remise = manquant > 0 ? 1 + Math.floor(rnd() * 3) : 0

  const statut: StatutTournee = couverture_pjp >= 100 ? 'TERMINEE'
    : couverture_pjp > 0 ? 'EN_COURS'
      : 'NON_DEMARREE'

  return {
    commercial: c.nom,
    zone: c.zone,
    type: c.type,
    statut,
    pjp_planifie,
    pjp_realise,
    visites_avec_commande,
    strike_rate,
    couverture_pjp,
    cash_encaisse,
    cash_remis,
    ecart_caisse: cash_remis - cash_encaisse,
    jours_sans_remise,
    km_parcourus: 18 + Math.round(rnd() * 40),
    derniere_position: `${c.zone} — secteur ${1 + Math.floor(rnd() * 4)}`,
  }
}

export interface HubTournees {
  tournees: TourneeCommercial[]
  /** Agrégats de la zone. */
  pjp_planifie: number
  pjp_realise: number
  couverture_pjp: number
  strike_rate: number
  cash_encaisse: number
  cash_remis: number
  ecart_caisse_total: number
  commerciaux_en_ecart: number
  alertes: AlerteTournee[]
  execution: ExecutionMagasin[]
}

export function buildTournees(perimetre: Perimetre): HubTournees {
  const equipe = perimetre.estReseau
    ? REGISTRE_COMMERCIAUX
    : REGISTRE_COMMERCIAUX.filter(c => perimetre.equipe.includes(c.nom))

  const tournees = equipe.map(construireTournee).sort((a, b) => a.couverture_pjp - b.couverture_pjp)

  const pjp_planifie = somme(tournees, t => t.pjp_planifie)
  const pjp_realise = somme(tournees, t => t.pjp_realise)
  const avecCommande = somme(tournees, t => t.visites_avec_commande)
  const cash_encaisse = somme(tournees, t => t.cash_encaisse)
  const cash_remis = somme(tournees, t => t.cash_remis)
  const enEcart = tournees.filter(t => t.ecart_caisse < 0)

  return {
    tournees,
    pjp_planifie,
    pjp_realise,
    couverture_pjp: pjp_planifie > 0 ? Math.round((pjp_realise / pjp_planifie) * 100) : 0,
    strike_rate: pjp_realise > 0 ? Math.round((avecCommande / pjp_realise) * 100) : 0,
    cash_encaisse,
    cash_remis,
    ecart_caisse_total: cash_remis - cash_encaisse,
    commerciaux_en_ecart: enEcart.length,
    alertes: construireAlertes(tournees),
    execution: construireExecution(tournees.length),
  }
}

function somme<T>(items: T[], f: (t: T) => number): number {
  return items.reduce((s, t) => s + f(t), 0)
}

function construireAlertes(tournees: TourneeCommercial[]): AlerteTournee[] {
  const alertes: AlerteTournee[] = []

  for (const t of tournees.filter(x => x.ecart_caisse < 0)) {
    alertes.push({
      severite: 'CRITIQUE',
      commercial: t.commercial,
      titre: 'Écart de caisse',
      detail: `${formatK(Math.abs(t.ecart_caisse))} manquants sur ${formatK(t.cash_encaisse)} encaissés · ${t.jours_sans_remise} j sans remise complète`,
      action: 'Rapprochement immédiat des reçus terrain · remise en main propre exigée ce soir',
    })
  }

  for (const t of tournees.filter(x => x.couverture_pjp < 80)) {
    alertes.push({
      severite: 'MODEREE',
      commercial: t.commercial,
      titre: 'PJP non tenu',
      detail: `${t.pjp_realise}/${t.pjp_planifie} visites (${t.couverture_pjp} %) · ${t.km_parcourus} km`,
      action: 'Accompagnement terrain en binôme sur la prochaine tournée',
    })
  }

  for (const t of tournees.filter(x => x.strike_rate < 40 && x.pjp_realise > 5)) {
    alertes.push({
      severite: 'MODEREE',
      commercial: t.commercial,
      titre: 'Strike rate faible',
      detail: `${t.strike_rate} % des visites débouchent sur une commande (cible 50 %)`,
      action: 'Revoir l’argumentaire d’entrée en boutique · vérifier les ruptures qui bloquent la prise de commande',
    })
  }

  return alertes.slice(0, 6)
}

/**
 * Exécution en magasin — relevé des visites du jour. Ce sont les critères que
 * le commercial coche en boutique et que le superviseur contrôle en double.
 */
function construireExecution(taille: number): ExecutionMagasin[] {
  const base = Math.max(taille * 12, 24)
  const ligne = (critere: string, pct: number, cible: number): ExecutionMagasin => ({
    critere,
    conforme: Math.round((base * pct) / 100),
    total: base,
    pct,
    cible,
  })

  return [
    ligne('Références obligatoires présentes', 78, 90),
    ligne('Prix affiché conforme au tarif', 64, 95),
    ligne('PLV en place et visible', 71, 80),
    ligne('Facing tenu (planogramme)', 58, 75),
    ligne('Aucun produit périmé en rayon', 92, 100),
  ]
}

function formatK(n: number): string {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)} M`
    : `${Math.round(n / 1_000)} K`
}
