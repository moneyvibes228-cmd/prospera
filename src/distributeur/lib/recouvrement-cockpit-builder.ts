/**
 * Cockpit recouvrement — ce que le responsable fait de sa journée.
 *
 * Le tableau de bord d'un DG répond à « où en est-on ? ». Celui d'un chargé de
 * recouvrement doit répondre à « qui j'appelle en premier, et qu'est-ce que je
 * lui dis ? ». Toute la construction découle de là : une file de travail bornée
 * par ce qu'un humain traite vraiment dans une journée, triée par valeur
 * espérée, avec le message déjà écrit.
 */

import { buildDossiersRecouvrement, buildSyntheseRecouvrement, type DossierRecouvrement } from './recouvrement-builder'
import { PROMESSES_PAIEMENT, buildReglesRecouvrement } from './automation/recouvrement-automations'
import { fileDActions, type CibleAutomation, type RegleAutomation } from './automation/automation-types'
import { REGISTRE_PDV } from './registries/pdv-registry'
import { REGISTRE_FACTURES } from './registries/factures-registry'
import { ZONES_DISTRIBUTION } from './registries/zones-registry'

/**
 * Un chargé de recouvrement traite entre 10 et 15 dossiers par jour en tenant la
 * qualité. Au-delà, il expédie — et un dossier expédié est un dossier perdu.
 * La file est donc bornée : ce qui n'y tient pas attend demain, et c'est très
 * bien, à condition que ce soit le moins rentable qui attende.
 */
export const CAPACITE_JOUR = 12

export interface ActionDuJour {
  regle: RegleAutomation
  cible: CibleAutomation
  /** Rang dans la file — 1 est le premier appel de la journée. */
  rang: number
  valeur_esperee: number
}

/** La file du jour : les N actions qui rapportent le plus, tous canaux confondus. */
export function buildFileDuJour(regles: RegleAutomation[]): ActionDuJour[] {
  return fileDActions(regles)
    .filter(({ regle }) => regle.canal !== 'SYSTEME')
    .slice(0, CAPACITE_JOUR)
    .map(({ regle, cible }, i) => ({
      regle,
      cible,
      rang: i + 1,
      valeur_esperee: Math.round(cible.valeur_fcfa * (cible.score / 100)),
    }))
}

/* ------------------------------------------------------------------ */
/* Prévision d'encaissement                                            */
/* ------------------------------------------------------------------ */

export interface PrevisionEncaissement {
  /** Ce qui rentre presque sûrement — promesses fiables et retards récents. */
  quasi_certain: number
  /** Ce qui rentre si les relances font leur travail. */
  probable: number
  /** Ce qui ne rentrera qu'au prix d'un effort disproportionné. */
  incertain: number
  /** Ce qu'il faut se résoudre à provisionner. */
  perdu: number
  total_encours: number
  /** Cash attendu sur 30 jours, pondéré par les probabilités. */
  attendu_30j: number
}

export function buildPrevisionEncaissement(dossiers: DossierRecouvrement[]): PrevisionEncaissement {
  const somme = (predicat: (d: DossierRecouvrement) => boolean) =>
    dossiers.filter(predicat).reduce((s, d) => s + d.reste, 0)

  return {
    quasi_certain: somme(d => d.probabilite_recouvrement >= 80),
    probable: somme(d => d.probabilite_recouvrement >= 55 && d.probabilite_recouvrement < 80),
    incertain: somme(d => d.probabilite_recouvrement >= 35 && d.probabilite_recouvrement < 55),
    perdu: somme(d => d.probabilite_recouvrement < 35),
    total_encours: dossiers.reduce((s, d) => s + d.reste, 0),
    attendu_30j: dossiers.reduce((s, d) => s + d.valeur_esperee, 0),
  }
}

/* ------------------------------------------------------------------ */
/* Où le retard se fabrique                                            */
/* ------------------------------------------------------------------ */

export interface RisqueParZone {
  zone: string
  encours: number
  clients_en_retard: number
  dso_jours: number
  /** Part de l'encours réseau portée par cette zone. */
  part_pct: number
}

/**
 * L'impayé ne naît pas au recouvrement, il naît à la vente : une zone qui
 * livre trop vite, un commercial qui accorde des délais pour tenir son quota.
 * Le responsable recouvrement a besoin de le montrer, chiffres en main.
 */
export function buildRisqueParZone(dossiers: DossierRecouvrement[]): RisqueParZone[] {
  const parZone = new Map<string, { encours: number; clients: number; joursPonderes: number }>()

  for (const d of dossiers) {
    const pdv = REGISTRE_PDV.find(p => p.id === d.client_id)
    const zone = pdv?.zone ?? 'Non rattaché'
    const acc = parZone.get(zone) ?? { encours: 0, clients: 0, joursPonderes: 0 }
    acc.encours += d.reste
    acc.clients += 1
    acc.joursPonderes += d.jours_retard * d.reste
    parZone.set(zone, acc)
  }

  const total = [...parZone.values()].reduce((s, z) => s + z.encours, 0)

  return [...parZone.entries()]
    .map(([zone, a]) => ({
      zone,
      encours: a.encours,
      clients_en_retard: a.clients,
      // DSO pondéré par le montant : un gros dossier très en retard pèse plus
      // qu'une poussière de petits retards récents.
      dso_jours: a.encours > 0 ? Math.round(a.joursPonderes / a.encours) : 0,
      part_pct: total > 0 ? Math.round((a.encours / total) * 100) : 0,
    }))
    .sort((a, b) => b.encours - a.encours)
    .slice(0, 6)
}

export interface RisqueParCommercial {
  commercial: string
  encours: number
  clients_en_retard: number
  dso_jours: number
}

export function buildRisqueParCommercial(dossiers: DossierRecouvrement[]): RisqueParCommercial[] {
  const parCommercial = new Map<string, { encours: number; clients: number; joursPonderes: number }>()

  for (const d of dossiers) {
    if (!d.commercial || d.commercial === '—') continue
    const acc = parCommercial.get(d.commercial) ?? { encours: 0, clients: 0, joursPonderes: 0 }
    acc.encours += d.reste
    acc.clients += 1
    acc.joursPonderes += d.jours_retard * d.reste
    parCommercial.set(d.commercial, acc)
  }

  return [...parCommercial.entries()]
    .map(([commercial, a]) => ({
      commercial,
      encours: a.encours,
      clients_en_retard: a.clients,
      dso_jours: a.encours > 0 ? Math.round(a.joursPonderes / a.encours) : 0,
    }))
    .sort((a, b) => b.encours - a.encours)
    .slice(0, 6)
}

/* ------------------------------------------------------------------ */
/* Synthèse du poste                                                   */
/* ------------------------------------------------------------------ */

export interface CockpitRecouvrement {
  dossiers: DossierRecouvrement[]
  regles: RegleAutomation[]
  file: ActionDuJour[]
  prevision: PrevisionEncaissement
  zones: RisqueParZone[]
  commerciaux: RisqueParCommercial[]
  promesses: typeof PROMESSES_PAIEMENT
  /** Cash à encaisser dans la file du jour, pondéré par la probabilité. */
  cash_du_jour: number
  encaisse_mois: number
  objectif_mois: number
  dso_reseau: number
  promesses_en_attente: number
  promesses_rompues: number
  clients_bloques: number
  perte_attendue: number
}

const OBJECTIF_ENCAISSEMENT_MOIS = 40_000_000

export function buildCockpitRecouvrement(): CockpitRecouvrement {
  const dossiers = buildDossiersRecouvrement()
  const regles = buildReglesRecouvrement()
  const file = buildFileDuJour(regles)
  const prevision = buildPrevisionEncaissement(dossiers)
  const synthese = buildSyntheseRecouvrement(dossiers)

  const encaisse = REGISTRE_FACTURES
    .filter(f => f.statut === 'PAYEE')
    .reduce((s, f) => s + f.paye, 0)

  const encoursTotal = dossiers.reduce((s, d) => s + d.reste, 0)
  const joursPonderes = dossiers.reduce((s, d) => s + d.jours_retard * d.reste, 0)

  return {
    dossiers,
    regles,
    file,
    prevision,
    zones: buildRisqueParZone(dossiers),
    commerciaux: buildRisqueParCommercial(dossiers),
    promesses: PROMESSES_PAIEMENT,
    cash_du_jour: file.reduce((s, a) => s + a.valeur_esperee, 0),
    encaisse_mois: encaisse,
    objectif_mois: OBJECTIF_ENCAISSEMENT_MOIS,
    dso_reseau: encoursTotal > 0 ? Math.round(joursPonderes / encoursTotal) : 0,
    promesses_en_attente: PROMESSES_PAIEMENT.filter(p => p.statut === 'EN_ATTENTE' || p.statut === 'ECHUE_AUJOURDHUI').length,
    promesses_rompues: PROMESSES_PAIEMENT.filter(p => p.statut === 'ROMPUE').length,
    clients_bloques: synthese.clients_bloques,
    perte_attendue: synthese.perte_attendue,
  }
}

export { ZONES_DISTRIBUTION }
