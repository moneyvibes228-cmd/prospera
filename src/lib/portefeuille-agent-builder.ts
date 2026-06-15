/**
 * Construction du portefeuille client (GP / commercial) à partir des emprunteurs réseau.
 */
import { buildEmprunteursReseau } from '@/lib/emprunteurs-builder'
import { commercialPourClientAgence, getPortefeuilleAgence } from '@/lib/portefeuille-agences-config'
import type { Borrower } from '@/types'

export interface ClientPortefeuille {
  id: string
  nom: string
  activite: string
  secteur: string
  encours_fcfa: number
  mensualite_fcfa: number
  jours_retard: number
  score_ia: number
  statut: 'PERFORMANT' | 'SURVEILLANCE' | 'RETARD' | 'DEFAUT'
  derniere_visite: string
  prochaine_echeance: string
  zone?: string
  derniere_relance?: string
  canal_relance?: string
}

const ACTIVITES = [
  'Boutique tissu', 'Coiffure & esthétique', 'Vente produits alimentaires', 'Commerce général',
  'Cosmétiques & parfums', 'Réparation téléphones', 'Transport moto-taxi', 'Restaurant de quartier',
  'Vente pagnes Wax', 'Salon beauté', 'Vente légumes frais', 'Atelier menuiserie',
]
const SECTEURS = ['Commerce', 'Services', 'Restauration', 'Transport']
const CANAUX = ['WhatsApp', 'Téléphone', 'Mixx By Yas', 'SMS', 'Espèces guichet']

function seeded(seed: number, max: number) {
  const x = Math.sin(seed * 12.9898 + max * 78.233) * 43758.5453
  return Math.floor((x - Math.floor(x)) * max)
}

function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function mapStatut(b: Borrower): ClientPortefeuille['statut'] {
  if (b.statut === 'DEFAUT' || b.retard_jours > 30) return 'DEFAUT'
  if (b.retard_jours > 0 || b.statut === 'RETARD' || b.statut === 'RESTRUCTURE') return 'RETARD'
  if (b.score_ia < 65) return 'SURVEILLANCE'
  return 'PERFORMANT'
}

function borrowerToClient(
  b: Borrower,
  index: number,
  agenceId: string,
  vue: 'GP' | 'COMMERCIAL',
): ClientPortefeuille {
  const seed = index * 31 + agenceId.charCodeAt(3) * 17
  const aff = commercialPourClientAgence(agenceId, index)
  const encours = Math.max(b.montant_credit - b.montant_rembourse, 0)
  const mensualite = b.montant_credit > 0 ? Math.round(b.montant_credit / 9) : 0
  const jourEcheance = 1 + seeded(seed + 20, 28)
  const moisEcheance = b.retard_jours > 0 ? 5 : 6
  const prochaine_echeance = `${String(jourEcheance).padStart(2, '0')}/${String(moisEcheance).padStart(2, '0')}/2026`

  const base: ClientPortefeuille = {
    id: b.id,
    nom: b.nom,
    activite: ACTIVITES[seeded(seed + 21, ACTIVITES.length)],
    secteur: SECTEURS[seeded(seed + 22, SECTEURS.length)],
    encours_fcfa: encours,
    mensualite_fcfa: mensualite,
    jours_retard: b.retard_jours,
    score_ia: b.score_ia,
    statut: mapStatut(b),
    zone: aff.zone,
    derniere_visite: formatDateFr(b.derniere_visite),
    prochaine_echeance,
  }

  if (vue === 'GP') {
    const jRelance = seeded(seed + 23, 10) + 18
    return {
      ...base,
      derniere_relance: `${String(jRelance).padStart(2, '0')}/05/2026`,
      canal_relance: canauxOrDash(CANAUX[seeded(seed + 24, CANAUX.length)]),
    }
  }
  return base
}

function canauxOrDash(canal: string): string {
  return canal || '—'
}

export interface BuildPortefeuilleOptions {
  vue: 'GP' | 'COMMERCIAL'
  /** Filtrer les clients d'un commercial (vue COMMERCIAL uniquement) */
  commercialNom?: string
}

/** Portefeuille complet d'une agence ou d'un commercial */
export function buildPortefeuilleAgent(
  agenceId: string,
  options: BuildPortefeuilleOptions,
): ClientPortefeuille[] {
  const cfg = getPortefeuilleAgence(agenceId)
  if (!cfg) return []

  const agShort = agenceId.replace('AG-', '')
  const byId = new Map(buildEmprunteursReseau().map(b => [b.id, b]))
  const result: ClientPortefeuille[] = []

  for (let i = 1; i <= cfg.total; i++) {
    if (options.vue === 'COMMERCIAL' && options.commercialNom) {
      const aff = commercialPourClientAgence(agenceId, i)
      if (aff.nom !== options.commercialNom) continue
    }

    const id = `EMP-${agShort}-${String(i).padStart(4, '0')}`
    const borrower = byId.get(id)
    if (!borrower) continue
    result.push(borrowerToClient(borrower, i, agenceId, options.vue))
  }

  return result
}
