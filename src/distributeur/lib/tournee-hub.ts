import type { MotifVisite, ResultatVisite, StatutVisite, Visite } from '@distributeur/types'
import { DATE_AUJOURDHUI, REGISTRE_VISITES } from './registries/tournees-registry'
import { isPortefeuilleRole, type HubContext } from './hub-context'

export { DATE_AUJOURDHUI }

export interface StatsSemaine {
  visites_planifiees: number
  visites_faites: number
  commandes: number
  ca_genere: number
  encaisse: number
  taux_reussite_pct: number
}

export interface JourTournee {
  date: string
  /** 'lun', 'mar', … pour l'entête du calendrier. */
  label: string
  numero: number
  estAujourdhui: boolean
  estPasse: boolean
  visites: Visite[]
}

const JOURS_LABELS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
const MOIS_LABELS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

function utc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

export function addDays(iso: string, n: number): string {
  const d = utc(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Lundi de la semaine contenant `iso`. */
export function debutSemaine(iso: string): string {
  const jour = utc(iso).getUTCDay()
  return addDays(iso, jour === 0 ? -6 : 1 - jour)
}

export function libelleSemaine(lundi: string): string {
  const d = utc(lundi)
  const fin = utc(addDays(lundi, 5))
  const memeMois = d.getUTCMonth() === fin.getUTCMonth()
  const debut = memeMois ? `${d.getUTCDate()}` : `${d.getUTCDate()} ${MOIS_LABELS[d.getUTCMonth()]}`
  return `${debut} — ${fin.getUTCDate()} ${MOIS_LABELS[fin.getUTCMonth()]} ${fin.getUTCFullYear()}`
}

export function libelleJour(iso: string): string {
  const d = utc(iso)
  return `${JOURS_LABELS[d.getUTCDay()]}. ${d.getUTCDate()} ${MOIS_LABELS[d.getUTCMonth()]}`
}

function statsFrom(visites: readonly Visite[]): StatsSemaine {
  const faites = visites.filter(v => v.statut === 'FAITE')
  const commandes = faites.filter(v => v.resultat === 'COMMANDE')
  const ca = commandes.reduce((s, v) => s + (v.montant_commande ?? 0), 0)
  const encaisse = faites.reduce((s, v) => s + (v.montant_encaisse ?? 0), 0)
  return {
    visites_planifiees: visites.length,
    visites_faites: faites.length,
    commandes: commandes.length,
    ca_genere: ca,
    encaisse,
    taux_reussite_pct: faites.length ? Math.round((commandes.length / faites.length) * 100) : 0,
  }
}

/**
 * Agenda du commercial connecté.
 *
 * Un rôle de portefeuille (terrain, freelance, prospection) ne voit que ses propres visites.
 * Les rôles d'encadrement reçoivent un agenda vide : leur vue équipe vit dans /commercial.
 */
export function getTourneeHub(ctx?: HubContext) {
  const mesVisites = ctx?.nom && isPortefeuilleRole(ctx.role)
    ? REGISTRE_VISITES.filter(v => v.commercial === ctx.nom)
    : []

  const parDate = (date: string) =>
    mesVisites.filter(v => v.date === date).sort((a, b) => a.ordre - b.ordre)

  const semaine = (lundi: string): JourTournee[] =>
    Array.from({ length: 6 }, (_, i) => {
      const date = addDays(lundi, i)
      const d = utc(date)
      return {
        date,
        label: JOURS_LABELS[d.getUTCDay()],
        numero: d.getUTCDate(),
        estAujourdhui: date === DATE_AUJOURDHUI,
        estPasse: date < DATE_AUJOURDHUI,
        visites: parDate(date),
      }
    })

  const aujourdhui = parDate(DATE_AUJOURDHUI)

  return {
    aujourdhui,
    prochaineVisite: aujourdhui.find(v => v.statut === 'EN_COURS' || v.statut === 'PLANIFIEE'),
    parDate,
    semaine,
    statsSemaine: (lundi: string) =>
      statsFrom(mesVisites.filter(v => v.date >= lundi && v.date <= addDays(lundi, 5))),
    statsJour: (date: string) => statsFrom(parDate(date)),
    /** Visites terminées les plus récentes d'abord — alimente l'historique d'activité. */
    historique: (limite = 30) =>
      mesVisites
        .filter(v => v.date < DATE_AUJOURDHUI && v.statut === 'FAITE')
        .sort((a, b) => (a.date === b.date ? b.ordre - a.ordre : b.date.localeCompare(a.date)))
        .slice(0, limite),
    total: mesVisites.length,
  }
}

export const STATUT_VISITE_STYLE: Record<StatutVisite, { label: string; className: string }> = {
  PLANIFIEE: { label: 'Planifiée', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  EN_COURS: { label: 'En cours', className: 'bg-amber-100 text-amber-800 ring-amber-300' },
  FAITE: { label: 'Faite', className: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  REPORTEE: { label: 'Reportée', className: 'bg-orange-100 text-orange-700 ring-orange-200' },
  ANNULEE: { label: 'Annulée', className: 'bg-red-100 text-red-700 ring-red-200' },
}

export const MOTIF_VISITE_STYLE: Record<MotifVisite, { label: string; dot: string; className: string }> = {
  RELANCE_IMPAYE: { label: 'Relance impayé', dot: 'bg-red-500', className: 'bg-red-50 text-red-700' },
  RECLAMATION: { label: 'Réclamation', dot: 'bg-orange-500', className: 'bg-orange-50 text-orange-700' },
  REASSORT: { label: 'Réassort', dot: 'bg-teal-500', className: 'bg-teal-50 text-teal-700' },
  LANCEMENT_PRODUIT: { label: 'Lancement produit', dot: 'bg-violet-500', className: 'bg-violet-50 text-violet-700' },
  FIDELISATION: { label: 'Fidélisation', dot: 'bg-blue-500', className: 'bg-blue-50 text-blue-700' },
  PROSPECTION: { label: 'Prospection', dot: 'bg-cyan-500', className: 'bg-cyan-50 text-cyan-700' },
}

export const RESULTAT_VISITE_STYLE: Record<ResultatVisite, { label: string; className: string }> = {
  COMMANDE: { label: 'Commande', className: 'bg-emerald-100 text-emerald-700' },
  ENCAISSEMENT: { label: 'Encaissement', className: 'bg-teal-100 text-teal-700' },
  PROMESSE: { label: 'Promesse', className: 'bg-amber-100 text-amber-700' },
  SANS_SUITE: { label: 'Sans suite', className: 'bg-slate-100 text-slate-600' },
  ABSENT: { label: 'Client absent', className: 'bg-red-100 text-red-700' },
}
