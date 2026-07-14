import type { PipelineStage, PointDeVente, TypeMagasin } from '@distributeur/types'
import { REGISTRE_COMMERCIAUX } from '@distributeur/lib/registries/commerciaux-registry'
import { hashString, pick, randFloat, randInt, seededRandom } from './mock-seed'

const NOMS = ['Mensah', 'Agbeko', 'Tetteh', 'Koffi', 'Dzobo', 'Ahi', 'Kpodo', 'Fiagbe', 'Doheto', 'Adjavon', 'Amegah', 'Soglo', 'Boco', 'Lawson', 'Abalo']

const QUARTIERS: Record<string, string[]> = {
  'Lomé Nord': ['Marché Bé', 'Adidogomé', 'Agoè Nyivé', 'Tsevié route', 'Djidjolé Nord', 'Tokoin Wuiti', 'Hedzranawoé', 'Kégué', 'Agbalépédogan'],
  'Lomé Sud': ['Bè', 'Agoè Plage', 'Vakpossito', 'Adétikopé', 'Gbossimé', 'Attiegou', 'Zongo', 'Anfamé'],
  'Lomé Centre': ['Zone portuaire', 'Grand Marché', 'Amoutivé', 'Quartier Administratif', 'Nyékonakpoé', 'Ablogamé'],
  'Lomé Est': ['Bè Kpota', 'Kégué Est', 'Baguida', 'Wologuédé', 'Klikamé'],
  'Kara': ['Centre-ville', 'Lassa', 'Tomdè', 'Pya', 'Sarakawa', 'Kozah'],
  'Centrale': ['Grand marché Sokodé', 'Tchamba', 'Sotouboua', 'Blitta', 'Tchaoudjo'],
}

const ZONE_GEO: Record<string, { lat: [number, number]; lng: [number, number]; entrepot: string }> = {
  'Lomé Nord': { lat: [6.128, 6.158], lng: [1.198, 1.232], entrepot: 'Lomé Port' },
  'Lomé Sud': { lat: [6.108, 6.132], lng: [1.218, 1.248], entrepot: 'Lomé Port' },
  'Lomé Centre': { lat: [6.128, 6.142], lng: [1.218, 1.238], entrepot: 'Lomé Port' },
  'Lomé Est': { lat: [6.118, 6.138], lng: [1.238, 1.268], entrepot: 'Lomé Port' },
  'Kara': { lat: [9.528, 9.568], lng: [1.168, 1.198], entrepot: 'Kara' },
  'Centrale': { lat: [8.968, 9.008], lng: [1.118, 1.158], entrepot: 'Kara' },
}

const ZONE_COUNTS: Record<string, number> = {
  'Lomé Nord': 145,
  'Lomé Sud': 118,
  'Lomé Centre': 96,
  'Lomé Est': 78,
  'Kara': 105,
  'Centrale': 68,
}

const TYPE_CLIENT_PREFIX: Record<string, string[]> = {
  PARTENAIRE: ['Boutique', 'Épicerie', 'Dépôt', 'Superette', 'Kiosque', 'Grossiste', 'Mini-dépôt', 'Pharmacie', 'Alimentation'],
  PROPRE: ['Atlas Shop'],
}

/**
 * Un point de vente est servi par un commercial **de sa zone** — c'est ce qui
 * fait qu'un superviseur voit le portefeuille de son équipe et rien d'autre.
 * Tirer le commercial dans un vivier national, comme on le faisait, donnait des
 * clients de Kara à un vendeur de Lomé et rendait tout périmètre incohérent.
 */
const COMMERCIAUX_PAR_ZONE: Record<string, typeof REGISTRE_COMMERCIAUX> = REGISTRE_COMMERCIAUX.reduce(
  (acc, c) => {
    (acc[c.zone] ??= []).push(c)
    return acc
  },
  {} as Record<string, typeof REGISTRE_COMMERCIAUX>,
)

function pickPipeline(rng: () => number): PipelineStage {
  const r = rng()
  if (r < 0.28) return 'FIDELE'
  if (r < 0.48) return 'ACTIF'
  if (r < 0.58) return 'PREMIERE_COMMANDE'
  if (r < 0.66) return 'PREMIER_CONTACT'
  if (r < 0.76) return 'PROSPECTION'
  if (r < 0.84) return 'A_RISQUE'
  return pick(rng, ['ACTIF', 'FIDELE'] as const)
}

function pickTypeMagasin(rng: () => number, zone: string): TypeMagasin {
  if (zone === 'Lomé Nord' && rng() < 0.04) return 'PROPRE'
  if (zone === 'Kara' && rng() < 0.06) return 'PROPRE'
  return rng() < 0.08 ? 'PROPRE' : 'PARTENAIRE'
}

function caForPipeline(pipeline: PipelineStage, rng: () => number): number {
  switch (pipeline) {
    case 'PROSPECTION':
    case 'PREMIER_CONTACT':
      return rng() < 0.7 ? 0 : randInt(rng, 200_000, 800_000)
    case 'PREMIERE_COMMANDE':
      return randInt(rng, 450_000, 1_800_000)
    case 'A_RISQUE':
      return randInt(rng, 280_000, 2_800_000)
    case 'ACTIF':
      return randInt(rng, 680_000, 3_800_000)
    case 'FIDELE':
      return randInt(rng, 920_000, 6_200_000)
    default:
      return randInt(rng, 500_000, 2_000_000)
  }
}

function creanceFor(pdv: { pipeline: PipelineStage; ca_mois: number }, rng: () => number) {
  if (pdv.ca_mois === 0) return { creance: 0, creance_jours: 0 }
  if (pdv.pipeline === 'A_RISQUE') {
    const creance = randInt(rng, Math.round(pdv.ca_mois * 1.5), Math.round(pdv.ca_mois * 4.5))
    return { creance, creance_jours: randInt(rng, 18, 78) }
  }
  if (rng() < 0.22) {
    const creance = randInt(rng, 120_000, Math.round(pdv.ca_mois * 1.8))
    return { creance, creance_jours: randInt(rng, 5, 35) }
  }
  return { creance: 0, creance_jours: 0 }
}

function scoreFor(pipeline: PipelineStage, creance_jours: number, rng: () => number): number {
  let base = randInt(rng, 55, 95)
  if (pipeline === 'A_RISQUE') base = randInt(rng, 28, 48)
  if (pipeline === 'FIDELE') base = randInt(rng, 78, 96)
  if (creance_jours > 30) base = Math.min(base, 45)
  return base
}

export function generatePdvBatch(existingIds: Set<string>): PointDeVente[] {
  const out: PointDeVente[] = []
  let seq = 100

  for (const [zone, count] of Object.entries(ZONE_COUNTS)) {
    const geo = ZONE_GEO[zone]
    const quartiers = QUARTIERS[zone] ?? ['Centre']

    for (let i = 0; i < count; i++) {
      let id = `pdv-gen-${seq++}`
      while (existingIds.has(id)) id = `pdv-gen-${seq++}`
      existingIds.add(id)

      const rng = seededRandom(hashString(id))
      const type_magasin = pickTypeMagasin(rng, zone)
      const pipeline = type_magasin === 'PROPRE' ? pick(rng, ['FIDELE', 'ACTIF', 'FIDELE'] as const) : pickPipeline(rng)
      const ca_mois = type_magasin === 'PROPRE' ? randInt(rng, 2_400_000, 5_800_000) : caForPipeline(pipeline, rng)
      const { creance, creance_jours } = creanceFor({ pipeline, ca_mois }, rng)

      // Le magasin d'enseigne n'a pas de commercial : il est tenu en propre.
      const equipeZone = COMMERCIAUX_PAR_ZONE[zone] ?? []
      const titulaire = type_magasin === 'PROPRE' || equipeZone.length === 0
        ? undefined
        : pick(rng, equipeZone)

      const commercial = titulaire?.nom ?? '—'
      // Le statut du PDV suit celui de son vendeur : un freelance porte ses clients.
      const type_proprietaire = titulaire?.type ?? 'SALARIE'

      const prefix = type_magasin === 'PROPRE'
        ? `${pick(rng, TYPE_CLIENT_PREFIX.PROPRE)} ${pick(rng, quartiers)}`
        : `${pick(rng, TYPE_CLIENT_PREFIX.PARTENAIRE)} ${pick(rng, NOMS)}`

      const joursDepuisCmd = pipeline === 'PROSPECTION' ? 999 : randInt(rng, 1, 45)
      const dateCmd = joursDepuisCmd > 60 ? '—' : `2026-${String(randInt(rng, 4, 6)).padStart(2, '0')}-${String(randInt(rng, 1, 28)).padStart(2, '0')}`

      out.push({
        id,
        nom: prefix,
        telephone: `+228 ${randInt(rng, 90, 99)} ${randInt(rng, 10, 99)} ${randInt(rng, 10, 99)} ${randInt(rng, 10, 99)}`,
        zone,
        adresse: `${pick(rng, quartiers)} — ${zone}`,
        score_ia: scoreFor(pipeline, creance_jours, rng),
        pipeline,
        ca_mois,
        creance,
        creance_jours,
        derniere_commande: dateCmd,
        commercial,
        type_proprietaire,
        type_magasin,
        entrepot_source: geo.entrepot,
        lat: randFloat(rng, geo.lat[0], geo.lat[1], 4),
        lng: randFloat(rng, geo.lng[0], geo.lng[1], 4),
      })
    }
  }

  return out
}

/** Évolution CA M-1 déterministe par id PDV. */
export function getPdvCaEvolutionPct(pdvId: string): number {
  const rng = seededRandom(hashString(`evo-${pdvId}`))
  if (pdvId === 'pdv-3') return -28
  if (pdvId === 'pdv-9') return 0
  if (pdvId.startsWith('mag-')) return randInt(rng, -4, 16)
  if (pdvId.includes('gen')) {
    const r = rng()
    if (r < 0.12) return randInt(rng, -35, -8)
    if (r < 0.55) return randInt(rng, -5, 12)
    return randInt(rng, 8, 28)
  }
  return randInt(rng, -15, 22)
}

export function getPdvDelaiLivraisonJ(pdvId: string): number {
  const rng = seededRandom(hashString(`delai-${pdvId}`))
  if (pdvId.startsWith('mag-')) return randFloat(rng, 0.9, 1.5, 1)
  if (pdvId === 'pdv-3') return 4.2
  return randFloat(rng, 1.2, 3.8, 1)
}
