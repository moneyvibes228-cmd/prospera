/**
 * Journal d'automatisation — ce que le système a décidé à votre place, et pourquoi.
 *
 * Automatiser sans journal, c'est demander à un responsable de stock de faire confiance
 * à une boîte noire qui engage sa signature. Il ne le fera pas, et il aura raison.
 *
 * Chaque décision automatique atterrit ici avec quatre choses : ce qui l'a déclenchée,
 * ce qu'elle a produit, ce qu'elle a évité (en francs), et **qui aurait dû la prendre**.
 * C'est cette dernière colonne qui transforme l'automatisation en délégation :
 * le responsable voit exactement quelle part de son travail la machine a assumée,
 * et peut la reprendre à tout moment.
 */

import type { UserRole } from '@/types'
import { genererCommandesSuggerees, simulerImpactTresorerie, DATE_DU_JOUR } from './reappro-engine'
import { buildBonsPreparation, buildVagues, buildChargeJour } from './picking-engine'
import { buildPlanExpedition } from './expedition-engine'
import { buildReceptionsAttendues } from './reception-engine'
import { buildPlanTransferts, buildSanteStock } from './transferts-engine'
import { buildClassificationABC, buildTachesComptage } from './inventaire-engine'
import { controlerCommandesSuggerees } from './garde-fou-achat'
import { buildPlansLiquidation } from './liquidation-engine'

export type DomaineAutomatisation =
  | 'REAPPRO' | 'TRANSFERT' | 'PREPARATION' | 'EXPEDITION' | 'RECEPTION' | 'INVENTAIRE' | 'STOCK'

/**
 * Ce que le système s'autorise à faire seul.
 *   EXECUTE  — c'est fait, sans intervention. Réversible, tracé.
 *   PROPOSE  — c'est prêt, il manque une signature humaine.
 *   ESCALADE — le garde-fou a sauté, un humain DOIT trancher.
 */
export type NatureDecision = 'EXECUTE' | 'PROPOSE' | 'ESCALADE'

export interface EntreeJournal {
  id: string
  domaine: DomaineAutomatisation
  nature: NatureDecision
  horodatage: string
  titre: string
  /** Le fait mesuré qui a déclenché la décision — jamais une intuition. */
  declencheur: string
  /** Ce que le système a fait, ou fera si on valide. */
  action: string
  /** Gain chiffré, en FCFA. 0 quand la décision fait gagner du temps, pas de l'argent. */
  gain_fcfa: number
  /** Temps de travail humain évité, en minutes. */
  gain_minutes: number
  /** Le poste qui aurait dû prendre cette décision à la main. */
  delegue_par: UserRole
  /** Ce qu'il faut faire si la décision est mauvaise — l'automatisation doit être réversible. */
  reversible: string
  entrepot?: string
}

export interface SyntheseAutomatisation {
  entrees: EntreeJournal[]
  decisions_executees: number
  decisions_proposees: number
  escalades: number
  gain_fcfa_total: number
  /** Heures de travail humain rendues à l'équipe sur la journée. */
  gain_heures: number
  /** Part des décisions prises sans intervention humaine. */
  taux_autonomie_pct: number
}

/* ------------------------------------------------------------------ */

/**
 * Reconstitue le journal du jour à partir de l'état réel des moteurs.
 *
 * Le journal n'est pas un log stocké : c'est une **projection** de ce que les moteurs
 * décident sur les données du moment. Il ne peut donc pas mentir ni dériver de la réalité —
 * si le moteur change d'avis, le journal change avec lui.
 */
export function buildJournalAutomatisation(entrepots: string[]): SyntheseAutomatisation {
  const entrees: EntreeJournal[] = [
    ...journalGardeFou(entrepots),
    ...journalReappro(entrepots),
    ...journalTransferts(entrepots),
    ...journalPreparation(entrepots),
    ...journalExpedition(entrepots),
    ...journalReception(entrepots),
    ...journalInventaire(entrepots),
    ...journalSanteStock(entrepots),
    ...journalLiquidation(entrepots),
  ]

  const executees = entrees.filter(e => e.nature === 'EXECUTE').length
  const proposees = entrees.filter(e => e.nature === 'PROPOSE').length
  const escalades = entrees.filter(e => e.nature === 'ESCALADE').length

  return {
    entrees: entrees.sort((a, b) => ordreNature(a.nature) - ordreNature(b.nature) || b.gain_fcfa - a.gain_fcfa),
    decisions_executees: executees,
    decisions_proposees: proposees,
    escalades,
    gain_fcfa_total: entrees.reduce((s, e) => s + e.gain_fcfa, 0),
    gain_heures: Math.round((entrees.reduce((s, e) => s + e.gain_minutes, 0) / 60) * 10) / 10,
    taux_autonomie_pct: entrees.length > 0 ? Math.round((executees / entrees.length) * 100) : 0,
  }
}

function ordreNature(n: NatureDecision): number {
  return { ESCALADE: 0, PROPOSE: 1, EXECUTE: 2 }[n]
}

/* ------------------------------------------------------------------ */

/**
 * Le garde-fou anti-stock-mort — la seule automatisation du lot qui empêche une dépense
 * au lieu d'en optimiser une. C'est aussi la seule dont le gain est invisible si on ne
 * la trace pas : personne ne remarque le stock mort qui n'a pas été créé.
 */
function journalGardeFou(entrepots: string[]): EntreeJournal[] {
  const suggestions = genererCommandesSuggerees()
    .filter(c => entrepots.includes(c.entrepot_destination))

  const lignes = suggestions.flatMap(c => c.lignes.map(l => ({
    produit_ref: l.produit_ref,
    quantite: l.quantite_commandee,
    prix_achat: l.prix_achat_unitaire,
  })))

  if (lignes.length === 0) return []

  const controles = controlerCommandesSuggerees(lignes)

  /*
   * Quand le garde-fou ne bloque rien, il ne dit rien — et c'est un défaut, pas une qualité.
   * Une prévention silencieuse est une prévention qu'on finit par débrancher, parce que
   * personne ne remarque jamais le stock mort qui n'a PAS été créé. On trace donc aussi
   * les journées où tout passe : c'est la preuve que le contrôle tourne.
   */
  if (controles.length === 0) {
    return [{
      id: 'journal-gardefou-ras',
      domaine: 'REAPPRO',
      nature: 'EXECUTE',
      horodatage: `${DATE_DU_JOUR} 05:55`,
      titre: `Garde-fou anti-stock-mort — ${lignes.length} ligne${lignes.length > 1 ? 's' : ''} d'achat contrôlée${lignes.length > 1 ? 's' : ''}, aucune écrêtée`,
      declencheur: 'Chaque quantité proposée au réappro est confrontée à la DLC du produit, à sa saison, '
        + 'à sa fin de vie commerciale, à la couverture qu\'elle crée et au piège de la remise volume.',
      action: 'Toutes les quantités du jour passent les cinq contrôles — aucune ne créerait de stock dormant.',
      gain_fcfa: 0,
      gain_minutes: 10,
      delegue_par: 'RESP_STOCK',
      reversible: 'Contrôle informatif : l\'acheteur peut toujours forcer une commande en le justifiant.',
    }]
  }

  return controles.map(c => {
    const refus = c.verdict === 'REFUSE'
    const principal = c.alertes[0]

    return {
      id: `journal-gardefou-${c.produit_ref}`,
      domaine: 'REAPPRO' as const,
      nature: 'EXECUTE' as const,
      horodatage: `${DATE_DU_JOUR} 05:55`,
      titre: refus
        ? `Achat refusé — ${c.produit_nom} (${c.quantite_initiale.toLocaleString('fr-FR')} u. bloquées)`
        : `Quantité écrêtée — ${c.produit_nom} : ${c.quantite_initiale.toLocaleString('fr-FR')} → ${c.quantite_corrigee.toLocaleString('fr-FR')} u.`,
      declencheur: principal.explication,
      action: `${principal.action} `
        + `${c.capital_evite.toLocaleString('fr-FR')} F de capital n'ont pas été immobilisés.`,
      // Le gain n'est pas une recette : c'est une perte future qui n'aura pas lieu.
      gain_fcfa: c.perte_evitee,
      gain_minutes: 0,
      delegue_par: 'RESP_STOCK' as UserRole,
      reversible: 'L\'acheteur peut forcer la commande malgré l\'alerte — le garde-fou informe, il ne verrouille pas.',
    }
  })
}

/** Les stocks morts déjà là : le moteur propose une sortie chiffrée, il ne la décide pas. */
function journalLiquidation(entrepots: string[]): EntreeJournal[] {
  const alertes = buildSanteStock(entrepots).flatMap(s => s.alertes)
  const plans = buildPlansLiquidation(alertes)
  if (plans.length === 0) return []

  const recuperable = plans.reduce((s, p) => s + p.recommande.gain_vs_inaction, 0)

  return [{
    id: 'journal-liquidation',
    domaine: 'STOCK',
    nature: 'PROPOSE',
    horodatage: `${DATE_DU_JOUR} 06:50`,
    titre: `${plans.length} plans de sortie chiffrés — ${(recuperable / 1_000_000).toFixed(1)} M récupérables`,
    declencheur: `${plans.length} références immobilisent du capital sans tourner. `
      + `Ne rien faire coûtera ${plans.reduce((s, p) => s + p.cout_inaction, 0).toLocaleString('fr-FR')} F.`,
    action: 'Cinq sorties comparées par référence (décote, combo, transfert, reprise fournisseur, rebut). '
      + plans.map(p => `${p.produit_nom.split('(')[0].trim()} → ${p.recommande.libelle.toLowerCase()}`).join(' · ')
      + '. Le moteur ne solde rien de lui-même : une décote engage le prix de vente, c\'est une décision commerciale.',
    gain_fcfa: recuperable,
    gain_minutes: 40,
    delegue_par: 'RESP_STOCK',
    reversible: 'Aucune action engagée — les scénarios sont des propositions chiffrées.',
  }]
}

function journalReappro(entrepots: string[]): EntreeJournal[] {
  const commandes = genererCommandesSuggerees()
    .filter(c => entrepots.includes(c.entrepot_destination))
  if (commandes.length === 0) return []

  const impact = simulerImpactTresorerie(commandes)
  const entrees: EntreeJournal[] = []

  for (const cmd of commandes) {
    const escalade = impact.franchit_plancher && cmd.montant_ttc > 20_000_000
    const auto = cmd.statut === 'EN_VALIDATION' && !escalade

    entrees.push({
      id: `journal-${cmd.id}`,
      domaine: 'REAPPRO',
      nature: escalade ? 'ESCALADE' : auto ? 'EXECUTE' : 'PROPOSE',
      horodatage: `${DATE_DU_JOUR} 06:00`,
      titre: `${cmd.reference} — ${cmd.fournisseur_nom}, ${cmd.lignes.length} référence${cmd.lignes.length > 1 ? 's' : ''}`,
      declencheur: cmd.lignes
        .filter(l => l.motif !== 'REGROUPEMENT')
        .map(l => `${l.produit_nom} sous son seuil de réappro`)
        .join(' · ') || 'Seuil de réappro franchi',
      action: escalade
        ? `Envoi bloqué : ${impact.commentaire}`
        : auto
          ? `Commande de ${(cmd.montant_ttc / 1_000_000).toFixed(1)} M TTC générée, fournisseur sélectionné et bon envoyé automatiquement.`
          : `Commande de ${(cmd.montant_ttc / 1_000_000).toFixed(1)} M TTC prête — au-dessus du plafond d'auto-validation, signature requise.`,
      gain_fcfa: cmd.economie_regroupement ?? 0,
      // Chiffrer les besoins, comparer trois fournisseurs, saisir le bon : ~25 min à la main.
      gain_minutes: 25,
      delegue_par: 'RESP_STOCK',
      reversible: 'Commande annulable tant que le fournisseur n\'a pas confirmé — bouton « Annuler » sur la fiche.',
      entrepot: cmd.entrepot_destination,
    })
  }

  return entrees
}

function journalTransferts(entrepots: string[]): EntreeJournal[] {
  const plan = buildPlanTransferts()

  return plan.suggestions
    .filter(t => entrepots.includes(t.entrepot_destination) || entrepots.includes(t.entrepot_source))
    .map(t => ({
      id: `journal-${t.id}`,
      domaine: 'TRANSFERT' as const,
      nature: t.auto ? ('EXECUTE' as const) : ('PROPOSE' as const),
      horodatage: `${DATE_DU_JOUR} 06:05`,
      titre: `${t.quantite.toLocaleString('fr-FR')} × ${t.produit_nom} — ${t.entrepot_source} → ${t.entrepot_destination}`,
      declencheur: `${t.entrepot_destination} à ${t.couverture_dest_avant_j} j de couverture, ${t.entrepot_source} à ${Math.round(t.couverture_source_apres_j)} j après prélèvement.`,
      action: t.auto
        ? `Navette programmée (${t.palettes} palette${t.palettes > 1 ? 's' : ''}, ${t.cout_transfert.toLocaleString('fr-FR')} F) — évite une commande fournisseur de ${(t.cout_reappro_fournisseur / 1_000_000).toFixed(1)} M.`
        : `Transfert prêt — ${t.urgence === 'CRITIQUE' ? 'urgence critique, validation immédiate demandée' : 'validation requise (coût camion supérieur au plafond d\'auto-exécution)'}.`,
      gain_fcfa: t.economie_nette,
      gain_minutes: 15,
      delegue_par: 'RESP_STOCK' as UserRole,
      reversible: 'Navette annulable jusqu\'au chargement — la marchandise n\'a pas quitté le réseau.',
      entrepot: t.entrepot_destination,
    }))
}

function journalPreparation(entrepots: string[]): EntreeJournal[] {
  const bons = buildBonsPreparation(entrepots)
  const entrees: EntreeJournal[] = []

  for (const entrepot of entrepots) {
    const vagues = buildVagues(entrepot, bons)
    const charge = buildChargeJour(entrepot, bons)
    if (vagues.length === 0) continue

    const lignes = vagues.reduce((s, v) => s + v.nb_lignes, 0)

    entrees.push({
      id: `journal-vagues-${entrepot}`,
      domaine: 'PREPARATION',
      nature: 'EXECUTE',
      horodatage: `${DATE_DU_JOUR} 06:30`,
      titre: `${vagues.length} vagues de picking constituées — ${lignes} lignes`,
      declencheur: `${bons.filter(b => b.entrepot === entrepot).length} commandes à servir, ${charge.preparateurs_presents} préparateurs présents.`,
      action: `Bons regroupés par zone de livraison, chemin de picking optimisé par allée, vagues affectées aux préparateurs selon leur cadence réelle.`,
      gain_fcfa: 0,
      // Ordonner 20 bons et tracer les parcours à la main : une bonne heure chaque matin.
      gain_minutes: 60,
      delegue_par: 'GEST_ENTREPOT',
      reversible: 'Réaffectation d\'une vague à un autre préparateur possible à tout moment.',
      entrepot,
    })

    const bloques = bons.filter(b => b.entrepot === entrepot && b.blocage === 'CREANCE')
    if (bloques.length > 0) {
      entrees.push({
        id: `journal-blocage-${entrepot}`,
        domaine: 'PREPARATION',
        nature: 'EXECUTE',
        horodatage: `${DATE_DU_JOUR} 06:30`,
        titre: `${bloques.length} commande${bloques.length > 1 ? 's' : ''} bloquée${bloques.length > 1 ? 's' : ''} au chargement — encours client`,
        declencheur: bloques.map(b => `${b.pdv_nom} : ${b.motif_blocage}`).join(' · '),
        action: 'Sortie marchandise suspendue, recouvrement notifié, commande retirée des vagues du jour.',
        // La marchandise non livrée à un client qui ne paie pas est de la créance en moins.
        gain_fcfa: bloques.reduce((s, b) => s + b.lignes.reduce((t, l) => t + l.quantite_demandee, 0), 0) * 0,
        gain_minutes: 10,
        delegue_par: 'GEST_ENTREPOT',
        reversible: 'Déblocage possible par le recouvrement ou le directeur commercial, en un clic sur la commande.',
        entrepot,
      })
    }

    if (charge.lignes_reportees > 0) {
      entrees.push({
        id: `journal-charge-${entrepot}`,
        domaine: 'PREPARATION',
        nature: 'ESCALADE',
        horodatage: `${DATE_DU_JOUR} 06:35`,
        titre: `Capacité de préparation dépassée — ${charge.lignes_reportees} lignes sans créneau`,
        declencheur: charge.alerte ?? `Charge à ${charge.taux_charge_pct} % de la capacité.`,
        action: 'Le moteur ne reporte aucune commande de lui-même : arbitrage humain requis entre renfort, heures supplémentaires et report client.',
        gain_fcfa: 0,
        gain_minutes: 0,
        delegue_par: 'RESP_STOCK',
        reversible: '—',
        entrepot,
      })
    }
  }

  return entrees
}

function journalExpedition(entrepots: string[]): EntreeJournal[] {
  const bons = buildBonsPreparation(entrepots)
  const entrees: EntreeJournal[] = []

  for (const entrepot of entrepots) {
    const plan = buildPlanExpedition(entrepot, bons)
    if (plan.tournees.length === 0) continue

    entrees.push({
      id: `journal-expedition-${entrepot}`,
      domaine: 'EXPEDITION',
      nature: 'EXECUTE',
      horodatage: `${DATE_DU_JOUR} 07:00`,
      titre: `${plan.tournees.length} tournée${plan.tournees.length > 1 ? 's' : ''} composée${plan.tournees.length > 1 ? 's' : ''} — remplissage moyen ${plan.remplissage_moyen_pct} %`,
      declencheur: `${plan.tournees.reduce((s, t) => s + t.arrets.length, 0)} livraisons à charger sur ${plan.tournees.length} camion${plan.tournees.length > 1 ? 's' : ''} disponible${plan.tournees.length > 1 ? 's' : ''}.`,
      action: 'Bons affectés aux camions sous double contrainte poids/volume, ordre des arrêts optimisé par proximité, ETA calculées et communicables aux clients.',
      gain_fcfa: plan.economie_regroupement,
      gain_minutes: 45,
      delegue_par: 'GEST_ENTREPOT',
      reversible: 'Un bon peut être sorti d\'une tournée et rebasculé sur une autre avant le chargement.',
      entrepot,
    })

    for (const tournee of plan.tournees.filter(t => !t.rentable)) {
      entrees.push({
        id: `journal-remplissage-${tournee.id}`,
        domaine: 'EXPEDITION',
        nature: 'PROPOSE',
        horodatage: `${DATE_DU_JOUR} 07:05`,
        titre: `${tournee.camion.immatriculation} sous-rempli — ${tournee.remplissage_pct} %`,
        declencheur: `Contrainte saturante : ${tournee.contrainte_saturante.toLowerCase()} à ${tournee.remplissage_pct} % pour ${tournee.cout_fcfa.toLocaleString('fr-FR')} F de tournée.`,
        action: tournee.recommandation ?? 'Regroupement suggéré.',
        // Une tournée sous-remplie gaspille la part non utilisée de son coût fixe.
        gain_fcfa: Math.round(tournee.camion.cout_tournee_fcfa * (1 - tournee.remplissage_pct / 100)),
        gain_minutes: 0,
        delegue_par: 'GEST_ENTREPOT',
        reversible: 'Décision purement économique — le gestionnaire tranche selon l\'engagement client.',
        entrepot,
      })
    }

    if (plan.non_charges.length > 0) {
      entrees.push({
        id: `journal-noncharge-${entrepot}`,
        domaine: 'EXPEDITION',
        nature: 'ESCALADE',
        horodatage: `${DATE_DU_JOUR} 07:10`,
        titre: `${plan.non_charges.length} commande${plan.non_charges.length > 1 ? 's' : ''} sans camion`,
        declencheur: 'Capacité de la flotte saturée sur la journée.',
        action: 'Location d\'un porteur ou report à J+1 — arbitrage humain, l\'engagement client est en jeu.',
        gain_fcfa: 0,
        gain_minutes: 0,
        delegue_par: 'RESP_STOCK',
        reversible: '—',
        entrepot,
      })
    }
  }

  return entrees
}

function journalReception(entrepots: string[]): EntreeJournal[] {
  const attendus = buildReceptionsAttendues(entrepots)
  if (attendus.length === 0) return []

  const entrees: EntreeJournal[] = []
  const alleges = attendus.filter(a => a.controle === 'ALLEGE')
  const integraux = attendus.filter(a => a.controle === 'INTEGRAL')
  const retards = attendus.filter(a => a.statut === 'EN_RETARD')

  if (alleges.length + integraux.length > 0) {
    entrees.push({
      id: 'journal-controle-reception',
      domaine: 'RECEPTION',
      nature: 'EXECUTE',
      horodatage: `${DATE_DU_JOUR} 06:15`,
      titre: `Plan de contrôle réception adapté sur ${attendus.length} livraison${attendus.length > 1 ? 's' : ''}`,
      declencheur: 'Historique de conformité et taux de litige de chaque fournisseur.',
      action: `${alleges.length} livraison${alleges.length > 1 ? 's' : ''} en contrôle allégé (fournisseurs fiables), `
        + `${integraux.length} en contrôle intégral (fournisseurs à litiges) — le temps de quai va où le risque est.`,
      gain_fcfa: 0,
      // Compter tout sur tout, c'est ~2 h de préparateur par camion inutilement mobilisées.
      gain_minutes: alleges.length * 45,
      delegue_par: 'GEST_ENTREPOT',
      reversible: 'Le gestionnaire peut forcer un contrôle intégral sur n\'importe quelle livraison.',
    })
  }

  for (const retard of retards) {
    entrees.push({
      id: `journal-retard-${retard.commande_id}`,
      domaine: 'RECEPTION',
      nature: 'ESCALADE',
      horodatage: `${DATE_DU_JOUR} 06:20`,
      titre: `${retard.fournisseur_nom} en retard de ${Math.abs(retard.jours_ecart)} j — ${retard.reference}`,
      declencheur: `Livraison prévue le ${retard.date_prevue}, toujours pas au quai. Les références de cette commande sont sous seuil.`,
      action: 'Relance fournisseur préparée. Le moteur ne peut pas décider seul d\'un fournisseur de secours : impact prix et délai à arbitrer.',
      gain_fcfa: 0,
      gain_minutes: 0,
      delegue_par: 'RESP_STOCK',
      reversible: '—',
      entrepot: retard.entrepot,
    })
  }

  return entrees
}

function journalInventaire(entrepots: string[]): EntreeJournal[] {
  const abc = buildClassificationABC(entrepots)
  const taches = buildTachesComptage(entrepots, abc)
  if (taches.length === 0) return []

  const suspects = taches.filter(t => t.ecarts_recents >= 3)
  const entrees: EntreeJournal[] = [{
    id: 'journal-inventaire-planning',
    domaine: 'INVENTAIRE',
    nature: 'EXECUTE',
    horodatage: `${DATE_DU_JOUR} 06:10`,
    titre: `${taches.length} comptage${taches.length > 1 ? 's' : ''} planifié${taches.length > 1 ? 's' : ''} — inventaire tournant`,
    declencheur: `Classification ABC recalculée : ${abc.filter(a => a.classe === 'A').length} références de classe A portent ${abc.filter(a => a.classe === 'A').reduce((s, a) => s + a.part_valeur_pct, 0).toFixed(0)} % de la valeur consommée.`,
    action: 'Liste de comptage du jour générée, triée par allée — le magasinier compte en un seul passage, sans fermer l\'entrepôt.',
    gain_fcfa: 0,
    gain_minutes: 30,
    delegue_par: 'GEST_ENTREPOT',
    reversible: 'Un comptage peut être reporté ; le moteur le repositionne en tête du planning.',
  }]

  if (suspects.length > 0) {
    entrees.push({
      id: 'journal-inventaire-suspects',
      domaine: 'INVENTAIRE',
      nature: 'ESCALADE',
      horodatage: `${DATE_DU_JOUR} 06:12`,
      titre: `${suspects.length} référence${suspects.length > 1 ? 's' : ''} à écarts récurrents`,
      declencheur: suspects.slice(0, 3).map(s => `${s.produit_nom} : ${s.ecarts_recents} écarts sur 3 comptages`).join(' · '),
      action: 'Comptage contradictoire à deux personnes imposé et revue des BL de sortie sur 30 j. Un écart répété n\'est plus une erreur de comptage — le système ne l\'ajuste pas tout seul.',
      gain_fcfa: 0,
      gain_minutes: 0,
      delegue_par: 'RESP_STOCK',
      reversible: '—',
    })
  }

  return entrees
}

function journalSanteStock(entrepots: string[]): EntreeJournal[] {
  return buildSanteStock(entrepots).flatMap(sante => {
    const critiques = sante.alertes.filter(a => a.gravite === 'CRITIQUE')
    if (critiques.length === 0) return []

    const dlc = critiques.filter(a => a.probleme === 'DLC_COURTE')

    const entrees: EntreeJournal[] = [{
      id: `journal-sante-${sante.entrepot}`,
      domaine: 'STOCK',
      nature: 'PROPOSE',
      horodatage: `${DATE_DU_JOUR} 06:40`,
      titre: `${critiques.length} référence${critiques.length > 1 ? 's' : ''} immobilisent du capital — ${(sante.perte_potentielle / 1_000_000).toFixed(1)} M de perte potentielle`,
      declencheur: `${sante.part_dormante_pct} % du capital stock ne tourne plus : ${sante.sku_surstock} en surstock, ${sante.sku_dormant} dormantes, ${sante.sku_dlc_courte} à DLC menacée.`,
      action: 'Réappro suspendu sur les références concernées et dossier de déstockage transmis au marketing (combos, promo réseau).',
      gain_fcfa: sante.perte_potentielle,
      gain_minutes: 20,
      delegue_par: 'RESP_STOCK',
      reversible: 'Le réappro se réactive dès que la couverture repasse sous la cible.',
      entrepot: sante.entrepot,
    }]

    if (dlc.length > 0) {
      entrees.push({
        id: `journal-dlc-${sante.entrepot}`,
        domaine: 'STOCK',
        nature: 'ESCALADE',
        horodatage: `${DATE_DU_JOUR} 06:45`,
        titre: dlc.length > 1
          ? `${dlc.length} références périmeront en entrepôt si rien n'est fait`
          : 'Une référence périmera en entrepôt si rien n\'est fait',
        declencheur: dlc.map(a => `${a.produit_nom} : ${Math.round(a.couverture_jours)} j de couverture pour ${a.jours_avant_peremption} j de DLC`).join(' · '),
        action: 'Décote ou opération commerciale à décider — le moteur ne brade pas un prix de vente de sa propre initiative.',
        gain_fcfa: dlc.reduce((s, a) => s + a.perte_si_inaction, 0),
        gain_minutes: 0,
        delegue_par: 'RESP_STOCK',
        reversible: '—',
        entrepot: sante.entrepot,
      })
    }

    return entrees
  })
}
