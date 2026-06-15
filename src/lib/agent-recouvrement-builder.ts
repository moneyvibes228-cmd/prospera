/**
 * Génération cohérente des actions recouvrement / relances — aligné sur visites_mois.
 */
import type { ActionRecouvrement } from '@/lib/fiche-agent-microfinance'
import type { ClientPortefeuille } from '@/lib/portefeuille-agent-builder'

const TYPES_GP: ActionRecouvrement['type'][] = ['RELANCE_WA', 'APPEL', 'RELANCE_SMS', 'PAIEMENT']
const TYPES_COM: ActionRecouvrement['type'][] = ['VISITE', 'PAIEMENT', 'RELANCE_WA', 'APPEL', 'PLAN_APUREMENT']
const CANAUX = ['WhatsApp', 'Téléphone', 'SMS', 'Mixx By Yas', 'Espèces guichet']

function seeded(seed: number, max: number) {
  const x = Math.sin(seed * 12.9898 + max * 78.233) * 43758.5453
  return Math.floor((x - Math.floor(x)) * max)
}

function pickType(isGP: boolean, c: ClientPortefeuille, seed: number): ActionRecouvrement['type'] {
  if (c.jours_retard > 30) return 'PLAN_APUREMENT'
  if (c.jours_retard > 0) return isGP ? 'APPEL' : 'VISITE'
  const types = isGP ? TYPES_GP : TYPES_COM
  return types[seeded(seed, types.length)]
}

function pickCanal(type: ActionRecouvrement['type'], seed: number): string {
  if (type === 'VISITE' || type === 'PLAN_APUREMENT') return 'Terrain'
  return CANAUX[seeded(seed, CANAUX.length)]
}

export interface BuildRecouvrementsOptions {
  prefix: string
  isGP: boolean
  /** Actions détaillées conservées en tête de liste */
  seeds?: ActionRecouvrement[]
}

/** Génère exactement `count` actions — même total que visites_mois / relances affichées côté RA */
export function buildRecouvrementsAgent(
  portefeuille: ClientPortefeuille[],
  count: number,
  options: BuildRecouvrementsOptions,
): ActionRecouvrement[] {
  if (count <= 0) return []

  const seeds = options.seeds ?? []
  const sorted = [...portefeuille].sort((a, b) => {
    if (b.jours_retard !== a.jours_retard) return b.jours_retard - a.jours_retard
    return a.score_ia - b.score_ia
  })

  const pool = sorted.length > 0 ? sorted : [{
    id: 'EMP-000-0000',
    nom: 'Client portefeuille',
    activite: '—',
    secteur: 'Commerce',
    encours_fcfa: 200_000,
    mensualite_fcfa: 22_222,
    jours_retard: 0,
    score_ia: 70,
    statut: 'PERFORMANT' as const,
    derniere_visite: '—',
    prochaine_echeance: '—',
  }]

  const result: ActionRecouvrement[] = []

  for (let i = 0; i < count; i++) {
    if (i < seeds.length) {
      result.push(seeds[i])
      continue
    }

    const c = pool[i % pool.length]
    const seed = i * 17 + c.id.charCodeAt(4)
    const day = Math.max(18, 28 - Math.floor(i / 3))
    const type = pickType(options.isGP, c, seed)
    const canal = pickCanal(type, seed + 1)
    const paid = type === 'PAIEMENT' && seeded(seed + 2, 4) === 0
    const montant = c.mensualite_fcfa > 0 ? c.mensualite_fcfa : Math.round(c.encours_fcfa / 6)

    result.push({
      id: `${options.prefix}-${String(i + 1).padStart(3, '0')}`,
      date: `${String(day).padStart(2, '0')}/05/2026`,
      heure: `${String(8 + seeded(seed + 3, 9)).padStart(2, '0')}:${String(seeded(seed + 4, 60)).padStart(2, '0')}`,
      client_id: c.id,
      client: c.nom,
      type,
      canal,
      montant_du_fcfa: montant,
      montant_recouvre_fcfa: paid ? montant : 0,
      jours_retard: c.jours_retard,
      resultat: paid
        ? 'Paiement encaissé'
        : c.jours_retard > 0
          ? `${options.isGP ? 'Relance' : 'Action'} J+${c.jours_retard} — ${canal}`
          : `Rappel échéance — ${canal}`,
      prochaine_action: c.jours_retard > 14 ? 'Escalade superviseur' : undefined,
    })
  }

  return result
}
