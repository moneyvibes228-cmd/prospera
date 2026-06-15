/**
 * Génération cohérente des visites terrain — aligné sur visites_mois (équipe RA).
 */
import type { VisiteTerrain } from '@/lib/fiche-agent-microfinance'
import type { ClientPortefeuille } from '@/lib/portefeuille-agent-builder'

const TYPES: VisiteTerrain['type'][] = ['ACTIVITE', 'DOMICILE', 'RECOUVREMENT', 'PROSPECTION', 'INSTRUCTION', 'SUIVI']
const RESULTATS: VisiteTerrain['resultat'][] = ['POSITIVE', 'NEGATIVE', 'NEUTRE', 'PROMESSE_PAIEMENT']

function seeded(seed: number, max: number) {
  const x = Math.sin(seed * 12.9898 + max * 78.233) * 43758.5453
  return Math.floor((x - Math.floor(x)) * max)
}

function pickType(c: ClientPortefeuille, seed: number): VisiteTerrain['type'] {
  if (c.jours_retard > 14) return 'RECOUVREMENT'
  if (c.jours_retard > 0) return seeded(seed, 2) === 0 ? 'RECOUVREMENT' : 'SUIVI'
  return TYPES[seeded(seed, TYPES.length)]
}

function pickResultat(c: ClientPortefeuille, type: VisiteTerrain['type'], seed: number): VisiteTerrain['resultat'] {
  if (type === 'RECOUVREMENT' && c.jours_retard > 0) {
    return seeded(seed, 3) === 0 ? 'NEGATIVE' : 'PROMESSE_PAIEMENT'
  }
  if (c.statut === 'RETARD' || c.statut === 'DEFAUT') return RESULTATS[seeded(seed, RESULTATS.length)]
  return seeded(seed, 4) === 0 ? 'NEUTRE' : 'POSITIVE'
}

export interface BuildVisitesOptions {
  prefix: string
  quartiers: string[]
  seeds?: VisiteTerrain[]
}

/** Génère exactement `count` visites — même total que visites_mois affiché côté RA */
export function buildVisitesTerrainAgent(
  portefeuille: ClientPortefeuille[],
  count: number,
  options: BuildVisitesOptions,
): VisiteTerrain[] {
  if (count <= 0) return []

  const seeds = options.seeds ?? []
  const sorted = [...portefeuille].sort((a, b) => {
    if (b.jours_retard !== a.jours_retard) return b.jours_retard - a.jours_retard
    return a.score_ia - b.score_ia
  })

  const pool = sorted.length > 0 ? sorted : [{
    id: 'EMP-000-0000',
    nom: 'Client portefeuille',
    activite: 'Commerce local',
    secteur: 'Commerce',
    encours_fcfa: 200_000,
    mensualite_fcfa: 22_222,
    jours_retard: 0,
    score_ia: 70,
    statut: 'PERFORMANT' as const,
    zone: options.quartiers[0] ?? 'Zone terrain',
    derniere_visite: '—',
    prochaine_echeance: '—',
  }]

  const result: VisiteTerrain[] = []

  for (let i = 0; i < count; i++) {
    if (i < seeds.length) {
      result.push(seeds[i])
      continue
    }

    const c = pool[i % pool.length]
    const seed = i * 23 + c.id.charCodeAt(4)
    const day = Math.max(2, 28 - Math.floor(i / 4))
    const type = pickType(c, seed)
    const resultat = pickResultat(c, type, seed + 1)
    const quartier = c.zone ?? options.quartiers[seeded(seed + 2, options.quartiers.length)]
    const ecart = seeded(seed + 3, 120)
    const gpsOk = ecart <= 100
    const paid = type === 'RECOUVREMENT' && resultat === 'POSITIVE' && seeded(seed + 4, 5) === 0
    const latBase = 6.13 + seeded(seed + 5, 50) / 1000
    const lngBase = 1.21 + seeded(seed + 6, 50) / 1000

    result.push({
      id: `${options.prefix}-${String(i + 1).padStart(3, '0')}`,
      date: `${String(day).padStart(2, '0')}/05/2026`,
      heure: `${String(8 + seeded(seed + 7, 9)).padStart(2, '0')}:${String(seeded(seed + 8, 60)).padStart(2, '0')}`,
      client_id: c.id,
      client: c.nom,
      type,
      adresse: `${quartier} — ${c.activite}`,
      gps_declare: `${latBase.toFixed(4)}°N ${lngBase.toFixed(4)}°E`,
      gps_reel: `${(latBase + (gpsOk ? 0.0001 : 0.001)).toFixed(4)}°N ${(lngBase + (gpsOk ? 0.0001 : -0.001)).toFixed(4)}°E`,
      ecart_m: ecart,
      gps_conforme: gpsOk,
      statut: gpsOk ? 'VALIDEE' : 'ANOMALIE',
      resultat,
      montant_recouvre_fcfa: paid ? c.mensualite_fcfa : undefined,
      canal_paiement: paid ? 'Espèces' : undefined,
      commentaire: `${type.replace('_', ' ')} — ${c.activite}`,
      duree_min: 15 + seeded(seed + 9, 35),
    })
  }

  return result
}
