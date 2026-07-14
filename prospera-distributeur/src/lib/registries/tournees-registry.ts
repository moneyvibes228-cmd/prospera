import type { MotifVisite, PointDeVente, ResultatVisite, StatutVisite, Visite } from '@/types'
import { REGISTRE_PDV } from './pdv-registry'
import { REGISTRE_COMMERCIAUX } from './commerciaux-registry'
import { hashString, seededRandom, pick, randInt } from '../generators/mock-seed'

/** Jour de référence du jeu de démo — aligné sur les autres registres. */
export const DATE_AUJOURDHUI = '2026-06-11'

/** Semaine terrain : lundi → samedi. Le dimanche n'est pas tourné. */
const JOURS_TOURNES = [1, 2, 3, 4, 5, 6]

/** Amplitude d'une journée terrain : premier arrêt 08h00, dernier vers 17h00. */
const HEURE_DEBUT = 8
const VISITES_MIN = 5
const VISITES_MAX = 9

/** Horizon généré autour du jour de référence : 3 semaines passées, 2 à venir. */
const JOURS_PASSES = 21
const JOURS_FUTURS = 14

const CONSEILS_IA: Record<MotifVisite, string[]> = {
  REASSORT: [
    'Rupture probable sur l\'huile 5L — proposer le pack de 3 cartons.',
    'Rotation en hausse sur les boissons : pousser le pack soda 24.',
    'Commande habituelle à J+14 — anticiper le réassort riz 25 kg.',
  ],
  RELANCE_IMPAYE: [
    'Créance en cours — proposer un échéancier avant toute nouvelle livraison.',
    'Client bon payeur historiquement : privilégier l\'encaissement cash sur place.',
    'Deux relances sans réponse — exiger un acompte pour débloquer la commande.',
  ],
  PROSPECTION: [
    'Premier contact — cibler le pack découverte 3 familles.',
    'Concurrent déjà présent : entrer par le prix sur les boissons.',
    'Zone à fort passage — argumenter sur la fréquence de livraison.',
  ],
  LANCEMENT_PRODUIT: [
    'Nouveau référencement café soluble — offrir un facing en tête de gondole.',
    'Lancement détergent 5L : proposer 1 carton offert pour 10 achetés.',
  ],
  FIDELISATION: [
    'Client fidèle — présenter la remise volume palier supérieur.',
    'Score élevé : bon candidat pour devenir dépôt relais de la zone.',
  ],
  RECLAMATION: [
    'Litige livraison ouvert — arriver avec l\'avoir déjà édité.',
    'Casse signalée sur la dernière livraison : constater et proposer un geste.',
  ],
}

const COMMENTAIRES_RESULTAT: Record<ResultatVisite, string[]> = {
  COMMANDE: ['Commande prise, livraison demandée sous 48 h.', 'Réassort validé sur les familles habituelles.'],
  ENCAISSEMENT: ['Créance soldée en espèces, reçu remis.', 'Acompte encaissé, solde promis à la prochaine visite.'],
  PROMESSE: ['Promesse de commande la semaine prochaine.', 'Attend sa recette du week-end pour se réapprovisionner.'],
  SANS_SUITE: ['Stock encore suffisant, pas de besoin cette semaine.', 'Refuse le tarif proposé, à retravailler.'],
  ABSENT: ['Boutique fermée, gérant injoignable.', 'Client absent — à reprogrammer.'],
}

/** Le motif découle de l'état réel du PDV : impayé, prospect, client fidèle ou à réassortir. */
function motifPourPdv(pdv: PointDeVente, rng: () => number): MotifVisite {
  if (pdv.creance > 0 && pdv.creance_jours > 7) return 'RELANCE_IMPAYE'
  if (pdv.pipeline === 'PROSPECTION' || pdv.pipeline === 'PREMIER_CONTACT') return 'PROSPECTION'
  if (pdv.pipeline === 'A_RISQUE') return rng() < 0.5 ? 'RECLAMATION' : 'FIDELISATION'
  if (pdv.pipeline === 'FIDELE') return rng() < 0.3 ? 'LANCEMENT_PRODUIT' : 'REASSORT'
  return 'REASSORT'
}

/** Un motif de relance ou une créance élevée passe en tête de tournée. */
function poidsPriorite(motif: MotifVisite): number {
  switch (motif) {
    case 'RELANCE_IMPAYE': return 0
    case 'RECLAMATION': return 1
    case 'REASSORT': return 2
    case 'LANCEMENT_PRODUIT': return 3
    case 'FIDELISATION': return 4
    case 'PROSPECTION': return 5
  }
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return toIso(d)
}

function jourSemaine(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay()
}

/** Une visite passée a forcément un résultat ; sa distribution dépend du motif. */
function resultatPasse(motif: MotifVisite, rng: () => number): ResultatVisite {
  const r = rng()
  if (motif === 'RELANCE_IMPAYE') {
    if (r < 0.4) return 'ENCAISSEMENT'
    if (r < 0.65) return 'PROMESSE'
    if (r < 0.85) return 'COMMANDE'
    return 'ABSENT'
  }
  if (motif === 'PROSPECTION') {
    if (r < 0.25) return 'COMMANDE'
    if (r < 0.55) return 'PROMESSE'
    if (r < 0.8) return 'SANS_SUITE'
    return 'ABSENT'
  }
  if (r < 0.62) return 'COMMANDE'
  if (r < 0.78) return 'PROMESSE'
  if (r < 0.92) return 'SANS_SUITE'
  return 'ABSENT'
}

function construireJournee(
  commercial: string,
  portefeuille: PointDeVente[],
  date: string,
  rng: () => number,
): Visite[] {
  const nb = Math.min(portefeuille.length, randInt(rng, VISITES_MIN, VISITES_MAX))
  if (nb === 0) return []

  // Rotation stable du portefeuille : chaque jour attaque le tour à un offset différent,
  // ce qui évite qu'un même PDV soit visité tous les jours.
  const offset = hashString(`${commercial}|${date}`) % portefeuille.length
  const selection: PointDeVente[] = []
  for (let i = 0; i < nb; i++) {
    selection.push(portefeuille[(offset + i * 3) % portefeuille.length])
  }

  const passee = date < DATE_AUJOURDHUI
  const aujourdhui = date === DATE_AUJOURDHUI

  return selection
    .map(pdv => ({ pdv, motif: motifPourPdv(pdv, rng) }))
    .sort((a, b) => poidsPriorite(a.motif) - poidsPriorite(b.motif))
    .map(({ pdv, motif }, i) => {
      const duree = randInt(rng, 20, 45)
      const minutesDepuisDebut = i * 65
      const heure = `${String(HEURE_DEBUT + Math.floor(minutesDepuisDebut / 60)).padStart(2, '0')}:${String(minutesDepuisDebut % 60).padStart(2, '0')}`

      let statut: StatutVisite = 'PLANIFIEE'
      let resultat: ResultatVisite | undefined
      if (passee) {
        statut = rng() < 0.12 ? 'REPORTEE' : 'FAITE'
        if (statut === 'FAITE') resultat = resultatPasse(motif, rng)
      } else if (aujourdhui) {
        // Le jour même, la tournée est en cours : les premiers arrêts sont déjà faits.
        if (i < 3) {
          statut = 'FAITE'
          resultat = resultatPasse(motif, rng)
        } else if (i === 3) {
          statut = 'EN_COURS'
        }
      }

      const aCommande = resultat === 'COMMANDE'
      const aEncaisse = resultat === 'ENCAISSEMENT'

      return {
        id: `v-${hashString(`${commercial}|${date}|${pdv.id}`)}`,
        commercial,
        pdv_id: pdv.id,
        pdv_nom: pdv.nom,
        zone: pdv.zone,
        adresse: pdv.adresse,
        lat: pdv.lat,
        lng: pdv.lng,
        date,
        heure,
        duree_min: duree,
        motif,
        statut,
        ordre: i + 1,
        resultat,
        montant_commande: aCommande ? randInt(rng, 6, 90) * 10_000 : undefined,
        montant_encaisse: aEncaisse ? Math.round(pdv.creance * (rng() < 0.5 ? 1 : 0.4)) : undefined,
        commentaire: resultat ? pick(rng, COMMENTAIRES_RESULTAT[resultat]) : undefined,
        conseil_ia: statut === 'PLANIFIEE' || statut === 'EN_COURS' ? pick(rng, CONSEILS_IA[motif]) : undefined,
      } satisfies Visite
    })
}

function genererTournees(): Visite[] {
  const visites: Visite[] = []

  for (const c of REGISTRE_COMMERCIAUX) {
    const portefeuille = REGISTRE_PDV.filter(p => p.commercial === c.nom)
    if (portefeuille.length === 0) continue

    const rng = seededRandom(hashString(`tournee|${c.nom}`))
    const debut = addDays(DATE_AUJOURDHUI, -JOURS_PASSES)

    for (let i = 0; i <= JOURS_PASSES + JOURS_FUTURS; i++) {
      const date = addDays(debut, i)
      if (!JOURS_TOURNES.includes(jourSemaine(date))) continue
      visites.push(...construireJournee(c.nom, portefeuille, date, rng))
    }
  }
  return visites
}

/** Agenda terrain complet — ~5 semaines de visites pour chaque commercial du réseau. */
export const REGISTRE_VISITES: Visite[] = genererTournees()

export function getVisitesByCommercial(nom: string): Visite[] {
  return REGISTRE_VISITES.filter(v => v.commercial === nom)
}
