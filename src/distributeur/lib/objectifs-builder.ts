/**
 * Objectifs & Quotas — la matière du Responsable des Ventes.
 *
 * Là où le superviseur pilote l'activité du jour, le responsable des ventes
 * pilote **le résultat du mois**. Trois questions, et elles ne se posent qu'à
 * son niveau :
 *
 *   1. **L'atterrissage** — au rythme actuel, où finit la région à J+30 ?
 *      C'est l'écart projeté au quota, pas le réalisé à date.
 *   2. **L'allocation** — le quota région se découpe en quotas de zone. C'est
 *      lui qui décide qui porte quoi, et qui rééquilibre en cours de mois.
 *   3. **Le mix** — vendre 100 M de riz à 9 % de marge ou 70 M de boissons à
 *      18 %, ce n'est pas le même mois. Le superviseur ne voit pas la marge ;
 *      le responsable des ventes ne pilote que ça.
 *
 * S'y ajoute la DN (distribution numérique) : le pourcentage de PDV du
 * territoire qui ont commandé au moins une fois sur la période. C'est
 * l'indicateur de couverture réelle du réseau, celui qu'on présente au DC.
 */

import type { ZoneDistribution } from './registries/zones-registry'
import { REGISTRE_COMMERCIAUX } from './registries/commerciaux-registry'
import { zonesDuPerimetre, type Perimetre } from './perimetre'

/** Jour ouvré courant dans le mois — sert à projeter l'atterrissage. */
const JOURS_ECOULES = 11
const JOURS_OUVRES_MOIS = 26

export interface ZoneObjectif {
  zone: ZoneDistribution
  superviseur: string
  ca_realise: number
  quota: number
  atteinte_pct: number
  /** Projection fin de mois au rythme actuel. */
  atterrissage: number
  /** atterrissage − quota : négatif = la zone ne rentrera pas. */
  ecart_projete: number
  /** Ce qu'il reste à faire par jour ouvré pour tenir le quota. */
  rythme_requis_jour: number
  rythme_actuel_jour: number
  effectif: number
  dn_pct: number
  statut: 'TIENT' | 'JUSTE' | 'DECROCHE'
}

export interface FamilleMix {
  famille: string
  ca: number
  part_pct: number
  marge_pct: number
  /** Part cible dans le mix — l'arbitrage du responsable des ventes. */
  part_cible_pct: number
}

export interface HubObjectifs {
  zones: ZoneObjectif[]
  ca_realise: number
  quota: number
  atteinte_pct: number
  atterrissage: number
  ecart_projete: number
  /** Marge brute moyenne pondérée par le mix réalisé. */
  marge_mix_pct: number
  marge_cible_pct: number
  dn_pct: number
  effectif: number
  mix: FamilleMix[]
  arbitrages: Arbitrage[]
}

export interface Arbitrage {
  priorite: number
  titre: string
  zone: string
  constat: string
  levier: string
  impact: string
}

export function buildObjectifs(perimetre: Perimetre): HubObjectifs {
  const zones = zonesDuPerimetre(perimetre).map(construireZoneObjectif)

  const ca_realise = zones.reduce((s, z) => s + z.ca_realise, 0)
  const quota = zones.reduce((s, z) => s + z.quota, 0)
  const atterrissage = zones.reduce((s, z) => s + z.atterrissage, 0)
  const effectif = zones.reduce((s, z) => s + z.effectif, 0)

  const mix = construireMix(ca_realise)
  const marge_mix_pct = mix.reduce((s, f) => s + (f.part_pct / 100) * f.marge_pct, 0)

  const pdvTotal = zones.reduce((s, z) => s + z.zone.pdv_actifs, 0)
  const pdvCommandants = zones.reduce((s, z) => s + Math.round((z.zone.pdv_actifs * z.dn_pct) / 100), 0)

  return {
    zones: [...zones].sort((a, b) => a.ecart_projete - b.ecart_projete),
    ca_realise,
    quota,
    atteinte_pct: quota > 0 ? Math.round((ca_realise / quota) * 100) : 0,
    atterrissage,
    ecart_projete: atterrissage - quota,
    marge_mix_pct: Math.round(marge_mix_pct * 10) / 10,
    marge_cible_pct: 16.5,
    dn_pct: pdvTotal > 0 ? Math.round((pdvCommandants / pdvTotal) * 100) : 0,
    effectif,
    mix,
    arbitrages: construireArbitrages(zones),
  }
}

function construireZoneObjectif(zone: ZoneDistribution): ZoneObjectif {
  // Le registre porte le CA du mois plein ; on en déduit le réalisé à date.
  const ca_realise = Math.round((zone.ca_mois * JOURS_ECOULES) / JOURS_OUVRES_MOIS)
  const quota = zone.ca_objectif

  const rythme_actuel_jour = Math.round(ca_realise / JOURS_ECOULES)
  const atterrissage = rythme_actuel_jour * JOURS_OUVRES_MOIS
  const ecart_projete = atterrissage - quota

  const restant = Math.max(quota - ca_realise, 0)
  const joursRestants = Math.max(JOURS_OUVRES_MOIS - JOURS_ECOULES, 1)

  const couverture = quota > 0 ? atterrissage / quota : 1
  const statut: ZoneObjectif['statut'] = couverture >= 1 ? 'TIENT'
    : couverture >= 0.92 ? 'JUSTE'
      : 'DECROCHE'

  return {
    zone,
    superviseur: zone.superviseur,
    ca_realise,
    quota,
    atteinte_pct: quota > 0 ? Math.round((ca_realise / quota) * 100) : 0,
    atterrissage,
    ecart_projete,
    rythme_requis_jour: Math.round(restant / joursRestants),
    rythme_actuel_jour,
    effectif: REGISTRE_COMMERCIAUX.filter(c => c.zone === zone.cle).length,
    // La DN suit la couverture des visites : un PDV non visité ne commande pas.
    dn_pct: Math.min(Math.round(zone.couverture_visites_pct * 0.82), 100),
    statut,
  }
}

/** Mix produit du territoire — parts réalisées vs parts cibles arbitrées. */
function construireMix(ca: number): FamilleMix[] {
  const familles: { famille: string; part: number; marge: number; cible: number }[] = [
    { famille: 'Boissons', part: 34, marge: 18.2, cible: 32 },
    { famille: 'Alimentaire sec', part: 29, marge: 11.4, cible: 24 },
    { famille: 'Hygiène & entretien', part: 18, marge: 22.6, cible: 24 },
    { famille: 'Huiles & condiments', part: 12, marge: 9.8, cible: 10 },
    { famille: 'Produits frais', part: 7, marge: 15.1, cible: 10 },
  ]

  return familles.map(f => ({
    famille: f.famille,
    ca: Math.round((ca * f.part) / 100),
    part_pct: f.part,
    marge_pct: f.marge,
    part_cible_pct: f.cible,
  }))
}

function construireArbitrages(zones: ZoneObjectif[]): Arbitrage[] {
  const arbitrages: Arbitrage[] = []

  const decrochent = [...zones]
    .filter(z => z.statut === 'DECROCHE')
    .sort((a, b) => a.ecart_projete - b.ecart_projete)

  decrochent.forEach((z, i) => {
    arbitrages.push({
      priorite: i + 1,
      titre: `${z.zone.nom} n'atterrira pas au quota`,
      zone: z.zone.nom,
      constat: `Atterrissage projeté ${fmt(z.atterrissage)} pour un quota de ${fmt(z.quota)} — écart ${fmt(z.ecart_projete)}. Rythme requis ${fmt(z.rythme_requis_jour)}/j contre ${fmt(z.rythme_actuel_jour)}/j tenus.`,
      levier: z.zone.couverture_visites_pct < 80
        ? `Couverture visites à ${z.zone.couverture_visites_pct} % — le problème est l'exécution, pas la demande. Renforcer l'effectif avec ${z.superviseur}.`
        : `Couverture visites correcte (${z.zone.couverture_visites_pct} %) — le problème est le panier. Pousser le mix hygiène (22,6 % de marge).`,
      impact: `+${fmt(Math.abs(z.ecart_projete))} sur l'atterrissage région`,
    })
  })

  const surperforme = zones.find(z => z.ecart_projete > 0 && z.statut === 'TIENT')
  if (surperforme && decrochent.length > 0) {
    arbitrages.push({
      priorite: arbitrages.length + 1,
      titre: `Réallouer du quota depuis ${surperforme.zone.nom}`,
      zone: surperforme.zone.nom,
      constat: `${surperforme.zone.nom} atterrit ${fmt(surperforme.ecart_projete)} au-dessus de son quota avec ${surperforme.effectif} commerciaux.`,
      levier: `Transférer 1 commercial vers ${decrochent[0].zone.nom} pour 30 jours, ou relever le quota de la zone au prochain cycle.`,
      impact: 'Rééquilibrage sans coût supplémentaire',
    })
  }

  const creancesFortes = zones.filter(z => z.zone.creances_pct > 25)
  if (creancesFortes.length > 0) {
    const z = creancesFortes[0]
    arbitrages.push({
      priorite: arbitrages.length + 1,
      titre: `Le CA de ${z.zone.nom} n'est pas encaissé`,
      zone: z.zone.nom,
      constat: `${z.zone.creances_pct} % des créances en retard (${fmt(z.zone.creances_retard)}). Le quota est tenu sur du papier.`,
      levier: 'Geler les livraisons à crédit sur la zone tant que la balance âgée > 30 j n\'est pas soldée.',
      impact: `${fmt(z.zone.creances_retard)} de trésorerie à récupérer`,
    })
  }

  return arbitrages.slice(0, 4)
}

function fmt(n: number): string {
  const abs = Math.abs(n)
  const signe = n < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${signe}${(abs / 1_000_000).toFixed(1)} M`
  return `${signe}${Math.round(abs / 1_000)} K`
}
