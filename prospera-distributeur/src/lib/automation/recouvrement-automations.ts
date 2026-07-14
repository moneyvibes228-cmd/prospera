/**
 * Automatisations recouvrement — l'escalade qui se déroule toute seule.
 *
 * Le recouvrement échoue presque toujours pour la même raison : personne n'a
 * relancé au bon moment. Pas parce que c'est difficile, mais parce que relancer
 * 40 clients par semaine à la main est un travail que personne ne tient trois
 * mois de suite. La machine, elle, le tient.
 *
 * L'échelle est graduée : plus le retard grandit, plus le canal coûte cher et
 * plus il engage l'entreprise. On ne commence pas par la mise en demeure, on la
 * garde pour le moment où elle vaut encore quelque chose.
 */

import { REGISTRE_FACTURES } from '@/lib/registries/factures-registry'
import { REGISTRE_PDV, getPdvById } from '@/lib/registries/pdv-registry'
import { buildDossiersRecouvrement, SEUIL_BLOCAGE_JOURS, type DossierRecouvrement } from '@/lib/recouvrement-builder'
import { ENTREPRISE_REGISTRY } from '@/lib/registries/entreprise-registry'
import { formatFcfa } from '@/lib/utils'
import { joursAvant, joursDepuis } from './garde-fous'
import type { CibleAutomation, RegleAutomation } from './automation-types'

const MARQUE = ENTREPRISE_REGISTRY.nom

/* ------------------------------------------------------------------ */
/* Promesses de paiement                                               */
/* ------------------------------------------------------------------ */

export type StatutPromesse = 'EN_ATTENTE' | 'TENUE' | 'ROMPUE' | 'ECHUE_AUJOURDHUI'

export interface PromessePaiement {
  id: string
  client_id: string
  client_nom: string
  montant: number
  date_promise: string
  jours_restants: number
  statut: StatutPromesse
  canal_obtention: string
  /** Fiabilité de la promesse : un client qui en a déjà rompu une vaut moins. */
  fiabilite_pct: number
  historique_promesses: number
  promesses_rompues: number
  note: string
}

/**
 * Une promesse de paiement est le seul actif que produit une relance. La suivre
 * est ce qui sépare un recouvrement d'une conversation : sans date, sans montant
 * et sans rappel automatique la veille, une promesse n'est qu'un moyen poli de
 * gagner trois semaines.
 */
export const PROMESSES_PAIEMENT: PromessePaiement[] = [
  {
    id: 'ptp-1', client_id: 'pdv-2', client_nom: 'Épicerie Mama T.',
    montant: 1_133_000, date_promise: '2026-06-15', jours_restants: 4,
    statut: 'EN_ATTENTE', canal_obtention: 'WhatsApp — échéancier 3 × 1,133 M',
    fiabilite_pct: 72, historique_promesses: 2, promesses_rompues: 0,
    note: 'Échéancier accepté sur 3 mois. 1ʳᵉ mensualité au 15/06. Relation de 3 ans, jamais de rupture de promesse.',
  },
  {
    id: 'ptp-2', client_id: 'pdv-5', client_nom: 'Dépôt Sokodé',
    montant: 620_000, date_promise: '2026-06-15', jours_restants: 4,
    statut: 'EN_ATTENTE', canal_obtention: 'SMS — accord oral confirmé',
    fiabilite_pct: 84, historique_promesses: 3, promesses_rompues: 0,
    note: '50% déjà réglés. Client fiable zone Centrale — le solde suit habituellement sous 5 jours.',
  },
  {
    id: 'ptp-3', client_id: 'pdv-3', client_nom: 'Kiosque Port',
    montant: 2_000_000, date_promise: '2026-05-15', jours_restants: -27,
    statut: 'ROMPUE', canal_obtention: 'Appel — promesse orale Komlan',
    fiabilite_pct: 8, historique_promesses: 4, promesses_rompues: 3,
    note: '3 promesses rompues sur 4. Aucune promesse orale ne sera plus acceptée : accord écrit signé ou contentieux.',
  },
  {
    id: 'ptp-4', client_id: 'pdv-9', client_nom: 'Grossiste Adidogomé',
    montant: 1_750_000, date_promise: '2026-06-11', jours_restants: 0,
    statut: 'ECHUE_AUJOURDHUI', canal_obtention: 'Visite terrain Mawuena — acompte 1/3',
    fiabilite_pct: 41, historique_promesses: 1, promesses_rompues: 0,
    note: 'Première promesse de ce client. Échéance aujourd\'hui — l\'encaissement doit être vérifié avant 17 h, sinon escalade automatique.',
  },
  {
    id: 'ptp-5', client_id: 'pdv-7', client_nom: 'Dépôt Agoè Plage',
    montant: 180_000, date_promise: '2026-06-08', jours_restants: -3,
    statut: 'TENUE', canal_obtention: 'WhatsApp — reliquat facture',
    fiabilite_pct: 95, historique_promesses: 5, promesses_rompues: 0,
    note: 'Encaissée le 08/06 par Mobile Money. Rapprochement automatique effectué, relances arrêtées.',
  },
]

export const STATUT_PROMESSE_STYLE: Record<StatutPromesse, string> = {
  EN_ATTENTE: 'bg-sky-100 text-sky-700 border-sky-200',
  TENUE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ROMPUE: 'bg-red-100 text-red-700 border-red-200',
  ECHUE_AUJOURDHUI: 'bg-amber-100 text-amber-800 border-amber-300',
}

/* ------------------------------------------------------------------ */
/* Messages — le ton monte avec le retard, jamais avant                 */
/* ------------------------------------------------------------------ */

function messageRelance(d: DossierRecouvrement): string {
  const montant = `${formatFcfa(d.reste)} F`
  const refs = d.factures.slice(0, 2).join(', ')

  if (d.jours_retard <= 0) {
    return `Bonjour ${d.client_nom}, petit rappel amical : votre facture ${refs} (${montant}) arrive à échéance dans 3 jours. Vous pouvez régler par Mobile Money ou virement. Merci ! — ${MARQUE}`
  }
  if (d.jours_retard <= 7) {
    return `Bonjour ${d.client_nom}, votre facture ${refs} de ${montant} est arrivée à échéance il y a ${d.jours_retard} jour${d.jours_retard > 1 ? 's' : ''}. Un oubli sans doute — vous pouvez régler dès aujourd'hui par Mobile Money. Merci de votre confiance. — ${MARQUE}`
  }
  if (d.jours_retard <= 15) {
    return `${d.client_nom}, votre solde de ${montant} (${refs}) est en retard de ${d.jours_retard} jours. Merci de régulariser cette semaine, ou de nous appeler pour convenir d'un échéancier. Votre commercial ${d.commercial} reste disponible. — ${MARQUE}`
  }
  if (d.jours_retard <= 30) {
    return `${d.client_nom} — ${montant} impayés depuis ${d.jours_retard} jours. Votre commercial ${d.commercial} passera vous voir cette semaine pour convenir d'un plan de règlement. Sans accord, votre ligne de crédit sera suspendue à 60 jours de retard.`
  }
  if (d.jours_retard <= SEUIL_BLOCAGE_JOURS) {
    return `MISE EN DEMEURE — ${d.client_nom}. Malgré nos relances, ${montant} restent impayés depuis ${d.jours_retard} jours (${refs}). Nous vous demandons de régulariser sous 8 jours. À défaut, votre compte sera bloqué et le dossier transmis au recouvrement contentieux.`
  }
  return `${d.client_nom} — dossier en défaut : ${montant} depuis ${d.jours_retard} jours. Crédit bloqué, livraisons suspendues. Deux issues : échéancier signé avec acompte immédiat, ou transmission au contentieux. Rendez-vous à fixer sous 48 h.`
}

function cibleDepuisDossier(d: DossierRecouvrement, canal: CibleAutomation['canal'], quand: string): CibleAutomation {
  return {
    id: `rec-${d.client_id}-${d.jours_retard}`,
    libelle: `${d.client_nom} · ${d.commercial}`,
    detail: `${formatFcfa(d.reste)} F · ${d.jours_retard} j de retard · probabilité ${d.probabilite_recouvrement}% · valeur espérée ${formatFcfa(d.valeur_esperee)} F`,
    canal,
    message: messageRelance(d),
    valeur_fcfa: d.valeur_esperee,
    score: d.probabilite_recouvrement,
    quand,
  }
}

/* ------------------------------------------------------------------ */
/* Les règles                                                          */
/* ------------------------------------------------------------------ */

function regleRappelPreventif(): RegleAutomation {
  const aEchoir = REGISTRE_FACTURES
    .filter(f => (f.statut === 'EMISE' || f.statut === 'PARTIELLE') && f.montant - f.paye > 0)
    .map(f => ({ f, restant: joursAvant(f.echeance) }))
    .filter(({ restant }) => restant >= 0 && restant <= 5)
    .sort((a, b) => (b.f.montant - b.f.paye) - (a.f.montant - a.f.paye))
    .slice(0, 12)

  const cibles: CibleAutomation[] = aEchoir.map(({ f, restant }) => {
    const reste = f.montant - f.paye
    return {
      id: `prev-${f.id}`,
      libelle: `${f.pdv_nom} · ${f.numero}`,
      detail: `${formatFcfa(reste)} F · échéance dans ${restant} j · ${f.mode_paiement ?? 'crédit'}`,
      canal: 'WHATSAPP',
      message: `Bonjour ${f.pdv_nom}, rappel amical : votre facture ${f.numero} (${formatFcfa(reste)} F) arrive à échéance le ${f.echeance}. Règlement possible par Mobile Money, virement ou espèces à la livraison. Merci ! — ${MARQUE}`,
      valeur_fcfa: reste,
      score: 88,
      quand: `J-3 avant échéance · 08:00`,
    }
  })

  return {
    id: 'rec-preventif',
    nom: 'J-3 avant échéance → rappel préventif',
    poste: 'RECOUVREMENT',
    declencheur: 'Une facture à crédit arrive à 3 jours de son échéance',
    action: 'Rappel WhatsApp courtois avec le montant, la date et les moyens de paiement — avant tout retard',
    canal: 'WHATSAPP',
    mode: 'AUTO',
    actif: true,
    garde_fous: [
      'Ton neutre et amical — ce n\'est pas une relance, c\'est un service',
      'Jamais envoyé à un client qui a déjà payé (rapprochement vérifié avant envoi)',
      'Un seul rappel préventif par facture',
    ],
    cibles,
    stats: { executions_30j: 84, succes_30j: 61, taux_succes_pct: 73, impact_fcfa_30j: 22_800_000 },
    explication_ia: 'Le meilleur recouvrement est celui qu\'on n\'a pas à faire. Un rappel à J-3 coûte 0 F et évite 73% des retards — l\'essentiel des impayés commence par un oubli, pas par une insolvabilité.',
    gain_temps_h_mois: 14,
  }
}

function regleEscalade(
  id: string,
  nom: string,
  min: number,
  max: number,
  canal: CibleAutomation['canal'],
  mode: RegleAutomation['mode'],
  action: string,
  gardeFous: string[],
  explication: string,
  stats: RegleAutomation['stats'],
  gainTemps: number,
): RegleAutomation {
  const dossiers = buildDossiersRecouvrement()
    .filter(d => d.jours_retard >= min && d.jours_retard <= max)
    .slice(0, 12)

  const quand = mode === 'AUTO' ? 'Départ automatique demain 08:00' : 'Prêt — attend votre validation'

  return {
    id,
    nom,
    poste: 'RECOUVREMENT',
    declencheur: max >= 9999
      ? `Retard supérieur à ${min} jours`
      : `Retard de paiement entre ${min} et ${max} jours`,
    action,
    canal,
    mode,
    actif: true,
    garde_fous: gardeFous,
    cibles: dossiers.map(d => cibleDepuisDossier(d, canal, quand)),
    stats,
    explication_ia: explication,
    gain_temps_h_mois: gainTemps,
  }
}

function reglePromessesRompues(): RegleAutomation {
  const aRisque = PROMESSES_PAIEMENT.filter(
    p => p.statut === 'ROMPUE' || p.statut === 'ECHUE_AUJOURDHUI',
  )

  const cibles: CibleAutomation[] = aRisque.map(p => ({
    id: `ptp-${p.id}`,
    libelle: `${p.client_nom} · promesse ${p.statut === 'ROMPUE' ? 'rompue' : 'échue aujourd\'hui'}`,
    detail: `${formatFcfa(p.montant)} F promis pour le ${p.date_promise} · ${p.promesses_rompues}/${p.historique_promesses} promesses rompues · fiabilité ${p.fiabilite_pct}%`,
    canal: p.fiabilite_pct < 30 ? 'VISITE' : 'APPEL',
    message: p.statut === 'ROMPUE'
      ? `${p.client_nom} — vous vous étiez engagé à régler ${formatFcfa(p.montant)} F le ${p.date_promise}. L'échéance est passée sans paiement. Le dossier passe au cran supérieur : plus aucune promesse orale ne sera acceptée, seul un accord écrit avec acompte immédiat suspendra la procédure.`
      : `${p.client_nom} — votre engagement de ${formatFcfa(p.montant)} F arrive à échéance aujourd'hui. Vérification de l'encaissement à 17 h ; sans paiement constaté, la procédure reprend automatiquement là où elle s'était arrêtée.`,
    valeur_fcfa: Math.round(p.montant * (p.fiabilite_pct / 100)),
    score: p.fiabilite_pct,
    quand: p.statut === 'ECHUE_AUJOURDHUI' ? 'Contrôle automatique à 17:00' : 'Escalade immédiate',
  }))

  return {
    id: 'rec-promesses',
    nom: 'Promesse de paiement non tenue → escalade automatique',
    poste: 'RECOUVREMENT',
    declencheur: 'La date d\'une promesse de paiement passe sans encaissement constaté',
    action: 'Le dossier remonte immédiatement d\'un cran dans l\'échelle d\'escalade, la fiabilité du client est dégradée, et toute nouvelle promesse orale est refusée',
    canal: 'APPEL',
    mode: 'AUTO',
    actif: true,
    garde_fous: [
      'Vérification de l\'encaissement (y compris Mobile Money) avant toute escalade — on n\'escalade jamais un client qui a payé',
      'Un délai de grâce de 24 h est accordé sur la première promesse d\'un client',
      'Au-delà de 2 promesses rompues : accord écrit obligatoire, plus d\'engagement oral',
    ],
    cibles,
    stats: { executions_30j: 11, succes_30j: 4, taux_succes_pct: 36, impact_fcfa_30j: 3_400_000 },
    explication_ia: 'Une promesse rompue n\'est pas un retard de plus, c\'est un signal : le client a compris qu\'il pouvait gagner du temps en promettant. Sans conséquence automatique, la promesse devient sa meilleure arme contre vous.',
    gain_temps_h_mois: 7,
  }
}

function regleBlocageCredit(): RegleAutomation {
  const aBloquer = buildDossiersRecouvrement().filter(d => d.credit_bloque)

  const cibles: CibleAutomation[] = aBloquer.map(d => ({
    id: `bloc-${d.client_id}`,
    libelle: `${d.client_nom} · blocage à ${d.jours_retard} j`,
    detail: `${formatFcfa(d.reste)} F · probabilité de recouvrement ${d.probabilite_recouvrement}% · ${d.factures.length} facture(s)`,
    canal: 'SYSTEME',
    message: `Crédit bloqué automatiquement — ${d.client_nom}, ${formatFcfa(d.reste)} F impayés depuis ${d.jours_retard} jours (seuil : ${SEUIL_BLOCAGE_JOURS} j). Livraisons suspendues, commandes en cours gelées, commercial ${d.commercial} et DG notifiés. Déblocage possible uniquement contre acompte ou échéancier signé — la décision et son auteur sont journalisés.`,
    valeur_fcfa: d.reste,
    score: 100,
    quand: 'Appliqué',
  }))

  return {
    id: 'rec-blocage',
    nom: `Retard > ${SEUIL_BLOCAGE_JOURS} j → blocage du crédit`,
    poste: 'RECOUVREMENT',
    declencheur: `Un client dépasse ${SEUIL_BLOCAGE_JOURS} jours de retard, ou son encours dépasse son plafond`,
    action: 'Blocage automatique des livraisons et des commandes en cours, notification du commercial et du DG, journalisation de la coupure',
    canal: 'SYSTEME',
    mode: 'AUTO',
    actif: true,
    garde_fous: [
      'Toute coupure est journalisée : qui, quand, pourquoi — et tout déblocage aussi',
      'Le déblocage ne peut jamais être automatique : il exige un acompte encaissé ou un échéancier signé',
      'Le commercial est prévenu avant le client — il ne doit pas l\'apprendre du client',
    ],
    cibles,
    stats: { executions_30j: 3, succes_30j: 2, taux_succes_pct: 67, impact_fcfa_30j: 5_200_000 },
    explication_ia: 'Continuer à livrer un client qui ne paie pas, c\'est financer sa trésorerie avec la vôtre. Le blocage n\'est pas une punition, c\'est ce qui arrête l\'hémorragie — et c\'est souvent ce qui déclenche enfin le paiement.',
    gain_temps_h_mois: 4,
  }
}

function reglePrevention(): RegleAutomation {
  // Le client qui va tomber, avant qu'il ne tombe : il paie encore, mais son
  // score se dégrade et son délai s'allonge. C'est là qu'on agit, pas après.
  const enDegradation = REGISTRE_PDV
    .filter(p =>
      p.type_magasin === 'PARTENAIRE' &&
      p.creance > 0 &&
      p.creance_jours > 0 &&
      p.creance_jours <= 30 &&
      p.score_ia < 72 &&
      p.pipeline !== 'A_RISQUE',
    )
    .sort((a, b) => b.creance - a.creance)
    .slice(0, 8)

  const cibles: CibleAutomation[] = enDegradation.map(p => {
    const risque = Math.min(95, Math.round((p.creance_jours * 2) + (75 - p.score_ia)))
    const plafondSuggere = Math.round(p.ca_mois * 1.5)
    return {
      id: `prev-deg-${p.id}`,
      libelle: `${p.nom} · ${p.zone}`,
      detail: `${formatFcfa(p.creance)} F à ${p.creance_jours} j · score ${p.score_ia}/100 en baisse · risque de bascule ${risque}%`,
      canal: 'SYSTEME',
      message: `Signal faible — ${p.nom} : le délai de règlement s'allonge et le score de risque se dégrade, sans défaut constaté à ce jour. Action suggérée : ramener le plafond de crédit à ${formatFcfa(plafondSuggere)} F (1,5 × son CA mensuel) et repasser en paiement comptant pour la prochaine commande. Décision à prendre avec le commercial ${p.commercial} — un plafond réduit trop tôt fait fuir un bon client.`,
      valeur_fcfa: p.creance,
      score: risque,
      quand: 'À arbitrer cette semaine',
    }
  })

  return {
    id: 'rec-prevention',
    nom: 'Dégradation détectée → réduire le plafond avant l\'impayé',
    poste: 'RECOUVREMENT',
    declencheur: 'Le délai de règlement moyen d\'un client s\'allonge et son score baisse, sans défaut encore constaté',
    action: 'Proposition de réduction du plafond de crédit et de retour au comptant, à arbitrer avec le commercial de la zone',
    canal: 'SYSTEME',
    mode: 'SUGGESTION',
    actif: true,
    garde_fous: [
      'Aucune réduction appliquée automatiquement — un plafond coupé à tort fait perdre un bon client',
      'Le commercial de la zone est consulté : il sait ce que la donnée ne dit pas',
      'La décision est notifiée au client avec un préavis, jamais découverte à la livraison',
    ],
    cibles,
    stats: { executions_30j: 9, succes_30j: 6, taux_succes_pct: 67, impact_fcfa_30j: 4_100_000 },
    explication_ia: 'Un impayé de 8,9 M ne surgit pas d\'un coup : il commence par un règlement à 40 jours au lieu de 30, puis 55, puis plus rien. Ces deux mois d\'avertissement sont la seule fenêtre où l\'on peut encore agir sans conflit.',
    gain_temps_h_mois: 5,
  }
}

function regleRapprochement(): RegleAutomation {
  const payes = REGISTRE_FACTURES
    .filter(f => f.statut === 'PAYEE' && joursDepuis(f.echeance) <= 20)
    .slice(0, 6)

  const cibles: CibleAutomation[] = payes.map(f => ({
    id: `rap-${f.id}`,
    libelle: `${f.pdv_nom} · ${f.numero}`,
    detail: `${formatFcfa(f.montant)} F encaissés · rapprochement automatique · relances arrêtées`,
    canal: 'SYSTEME',
    message: `Encaissement détecté (Mobile Money / virement) sur ${f.numero} — ${formatFcfa(f.montant)} F. Facture lettrée, séquence de relance arrêtée, accusé de réception envoyé au client, commercial notifié.`,
    valeur_fcfa: f.montant,
    score: 100,
    quand: 'Traité automatiquement',
  }))

  return {
    id: 'rec-rapprochement',
    nom: 'Paiement reçu → lettrage et arrêt des relances',
    poste: 'RECOUVREMENT',
    declencheur: 'Un encaissement Mobile Money, virement ou espèces est constaté',
    action: 'Rapprochement automatique avec la facture, lettrage comptable, arrêt immédiat de toute séquence de relance en cours, accusé de réception au client',
    canal: 'SYSTEME',
    mode: 'AUTO',
    actif: true,
    garde_fous: [
      'En cas de paiement partiel, la séquence est suspendue et non arrêtée — le solde reste dû',
      'Un montant non rattachable à une facture ne se lettre pas tout seul : il part en écart pour la comptabilité',
    ],
    cibles,
    stats: { executions_30j: 96, succes_30j: 92, taux_succes_pct: 96, impact_fcfa_30j: 31_400_000 },
    explication_ia: 'Relancer un client qui vient de payer est la faute la plus coûteuse du recouvrement : elle détruit en une phrase la relation que quinze livraisons ont construite. Le rapprochement automatique existe d\'abord pour ça.',
    gain_temps_h_mois: 16,
  }
}

/* ------------------------------------------------------------------ */

export function buildReglesRecouvrement(): RegleAutomation[] {
  return [
    regleRappelPreventif(),
    regleEscalade(
      'rec-j1', 'J+1 → relance douce WhatsApp', 1, 7, 'WHATSAPP', 'AUTO',
      'Message WhatsApp courtois avec le relevé de compte en pièce jointe et les moyens de paiement',
      [
        'Ton neutre : à 3 jours de retard, c\'est un oubli, pas une fraude',
        'Aucune menace, aucune mention de blocage à ce stade',
        'Relevé de compte joint automatiquement — la moitié des retards viennent d\'une facture égarée',
      ],
      'À moins de 7 jours, 8 impayés sur 10 se règlent par un simple rappel. Passé ce délai, le taux s\'effondre : chaque semaine de silence divise par deux la probabilité d\'encaisser sans effort.',
      { executions_30j: 62, succes_30j: 44, taux_succes_pct: 71, impact_fcfa_30j: 14_600_000 },
      12,
    ),
    regleEscalade(
      'rec-j7', 'J+7 → SMS + appel programmé', 8, 15, 'APPEL', 'AUTO',
      'SMS de rappel puis appel du chargé de recouvrement, créneau réservé automatiquement dans son agenda',
      [
        'L\'appel est programmé, jamais improvisé : le script et l\'historique sont préparés',
        'Maximum 2 tentatives d\'appel par jour, aux heures d\'ouverture de la boutique',
        'Toute promesse obtenue est enregistrée avec un montant et une date — sinon elle n\'existe pas',
      ],
      'L\'appel est le canal qui convertit le mieux entre 7 et 15 jours, parce qu\'il oblige le client à s\'engager sur une date. Le message écrit, lui, se laisse ignorer sans coût.',
      { executions_30j: 38, succes_30j: 19, taux_succes_pct: 50, impact_fcfa_30j: 8_900_000 },
      10,
    ),
    regleEscalade(
      'rec-j15', 'J+15 → visite terrain assignée', 16, 30, 'VISITE', 'VALIDATION',
      'Visite insérée dans la tournée du commercial de la zone, avec l\'objectif d\'obtenir un échéancier écrit et un acompte immédiat',
      [
        'La visite est insérée dans une tournée existante — on ne fait pas 60 km pour 180 000 F',
        'Le commercial part avec un mandat clair : échéancier écrit ou acompte, pas une simple conversation',
        'Le commercial ne négocie jamais d\'abandon de créance : c\'est une décision du DAF',
      ],
      'Au-delà de 15 jours, l\'écrit ne produit plus rien : le client a intégré qu\'il ne se passe rien. La présence physique rétablit le rapport de force — et permet de voir si la boutique tourne encore.',
      { executions_30j: 14, succes_30j: 8, taux_succes_pct: 57, impact_fcfa_30j: 6_200_000 },
      6,
    ),
    regleEscalade(
      'rec-j30', 'J+30 → mise en demeure + alerte DG', 31, SEUIL_BLOCAGE_JOURS, 'EMAIL', 'VALIDATION',
      'Génération de la mise en demeure (courrier + WhatsApp), copie au DG, préavis de blocage du crédit à 60 jours',
      [
        'La mise en demeure est générée mais jamais envoyée sans validation humaine : c\'est un acte à portée juridique',
        'Le commercial et le DG sont informés avant l\'envoi',
        'Le préavis de blocage est explicite — le client doit savoir ce qui l\'attend',
      ],
      'La mise en demeure ne sert pas à récupérer l\'argent, elle sert à établir que l\'entreprise a réclamé. C\'est ce qui rend le contentieux possible plus tard — et c\'est souvent ce qui déclenche enfin l\'échéancier.',
      { executions_30j: 4, succes_30j: 2, taux_succes_pct: 50, impact_fcfa_30j: 3_800_000 },
      5,
    ),
    regleBlocageCredit(),
    reglePromessesRompues(),
    reglePrevention(),
    regleRapprochement(),
  ]
}

/** Nom du client, pour les vues qui n'ont que l'identifiant. */
export function nomClient(id: string): string {
  return getPdvById(id)?.nom ?? id
}
