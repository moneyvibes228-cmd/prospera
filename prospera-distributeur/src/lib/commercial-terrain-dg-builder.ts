/**
 * Pilotage commercial terrain DG — équipes, tournées, couverture, analyses IA.
 */
import type { PointDeVente } from '@/types'
import { REGISTRE_COMMERCIAUX, type CommercialRegistryEntry } from './registries/commerciaux-registry'
import { REGISTRE_PDV } from './registries/pdv-registry'
import { ZONES_DISTRIBUTION } from './registries/zones-registry'
import { hashString, pick, randInt, seededRandom } from './generators/mock-seed'

export interface CommercialPositionDG {
  commercial_id: string
  lat: number
  lng: number
  derniere_maj: string
  statut: 'EN_TOURNEE' | 'BUREAU' | 'PAUSE' | 'ALERTE_GPS'
}

export interface CommercialTerrainDG extends CommercialRegistryEntry {
  position: CommercialPositionDG
  pdv_portefeuille: number
  pdv_visites_jour: number
  couverture_secteur_pct: number
  impayes_a_relancer: number
  prospects_actifs: number
  commandes_mois: number
  ca_mois: number
  evolution_mois_pct: number
  gps_conformite_pct: number
  alerte?: string
  synthese_ia: string
  action_ia: string
}

export interface VisitePdvCarte {
  id: string
  nom: string
  lat: number
  lng: number
  commercial: string
  visite_aujourdhui: boolean
  priorite: 'HAUTE' | 'NORMALE' | 'BASSE'
  motif?: string
}

export interface AnalyseTerrainIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  commercial?: string
  action: string
}

const POSITIONS: Record<string, Omit<CommercialPositionDG, 'commercial_id'>> = {
  'c-1': { lat: 6.148, lng: 1.202, derniere_maj: '10:42', statut: 'EN_TOURNEE' },
  'c-2': { lat: 9.552, lng: 1.184, derniere_maj: '10:38', statut: 'EN_TOURNEE' },
  'c-4': { lat: 6.121, lng: 1.231, derniere_maj: '10:45', statut: 'EN_TOURNEE' },
  'c-3': { lat: 6.127, lng: 1.243, derniere_maj: '09:55', statut: 'ALERTE_GPS' },
}

const EXTRA_COMMERCIAL: Record<string, {
  couverture: number
  impayes: number
  prospects: number
  evolution: number
  gps: number
  commandes_mois: number
  ca_mois: number
  alerte?: string
  synthese: string
  action: string
}> = {
  'c-1': {
    couverture: 94, impayes: 2, prospects: 1, evolution: 8, gps: 96,
    commandes_mois: 312, ca_mois: 58_400_000,
    synthese: 'Meilleur VRP du réseau Lomé Nord. 28 visites/j (+12% vs obj.) · 2,84 M CA/jour. Modèle à répliquer sur Lomé Est (Mawuena en retard couverture).',
    action: 'Documenter script relance impayé + cross-sell huile 5L pour formation équipe.',
  },
  'c-2': {
    couverture: 96, impayes: 0, prospects: 2, evolution: 7, gps: 98,
    commandes_mois: 198, ca_mois: 62_000_000,
    synthese: 'Superviseur Kara/Centrale — couverture exemplaire. Superette Kara + Dépôt Sokodé en croissance. Taux transformation visite→commande 52%.',
    action: 'Étendre tournée Sokodé Nord (3 prospects identifiés IA).',
  },
  'c-4': {
    couverture: 88, impayes: 1, prospects: 2, evolution: 18, gps: 91,
    commandes_mois: 124, ca_mois: 12_800_000,
    synthese: 'Freelance top performer Lomé Sud. Marge nette 150 K/jour (+18% vs M-1). 2 nouveaux PDV signés. Grille prix client personnalisée efficace.',
    action: 'Capturer grille tarifaire Kofi pour benchmark freelances.',
  },
  'c-3': {
    couverture: 62, impayes: 0, prospects: 4, evolution: -6, gps: 71,
    commandes_mois: 48, ca_mois: 8_400_000,
    alerte: 'Couverture 62% · 12 PDV sans passage 15j',
    synthese: 'Prospection Lomé Est en difficulté. 15/18 visites mais seulement 3 commandes. Boutique Nouvelle non convertie. GPS non conforme sur 3 visites.',
    action: 'Coaching terrain avec Komlan Tetteh + réaffecter 6 PDV prioritaires Lomé Est.',
  },
}

type ExtraCommercial = (typeof EXTRA_COMMERCIAL)[string]

const ZONE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Lomé Nord': { lat: 6.145, lng: 1.205 },
  'Lomé Sud': { lat: 6.118, lng: 1.232 },
  'Lomé Centre': { lat: 6.135, lng: 1.228 },
  'Lomé Est': { lat: 6.125, lng: 1.248 },
  Kara: { lat: 9.552, lng: 1.184 },
  Centrale: { lat: 8.983, lng: 1.133 },
  Prospection: { lat: 6.127, lng: 1.243 },
}

function zoneKey(zone: string): string {
  return zone.split('/')[0]?.split('—')[0]?.trim() ?? zone
}

function buildPositionFallback(c: CommercialRegistryEntry, pdvs: PointDeVente[]): Omit<CommercialPositionDG, 'commercial_id'> {
  const rng = seededRandom(hashString(`pos-${c.id}`))
  const anchor = pdvs[0]
  const base = anchor
    ? { lat: anchor.lat, lng: anchor.lng }
    : ZONE_COORDS[zoneKey(c.zone)] ?? { lat: 6.13, lng: 1.22 }
  const seq = parseInt(c.id.replace('c-', ''), 10) || 1
  const statut: CommercialPositionDG['statut'] =
    c.score_ia < 72 ? 'ALERTE_GPS'
      : c.visites_jour < c.visites_objectif * 0.85 ? 'PAUSE'
        : rng() < 0.08 ? 'BUREAU'
          : 'EN_TOURNEE'

  return {
    lat: base.lat + (seq % 7) * 0.002,
    lng: base.lng + (seq % 5) * 0.0015,
    derniere_maj: `${9 + (seq % 2)}:${String(35 + (seq % 25)).padStart(2, '0')}`,
    statut,
  }
}

function buildExtraCommercialFallback(
  c: CommercialRegistryEntry,
  pdvs: PointDeVente[],
  visitesJour: number,
  portefeuille: number,
): ExtraCommercial {
  const rng = seededRandom(hashString(`extra-${c.id}`))
  const impayes = pdvs.filter(p => p.creance_jours > 15).length
  const prospects = pdvs.filter(p =>
    p.pipeline === 'PROSPECTION' || p.pipeline === 'PREMIER_CONTACT' || p.pipeline === 'PREMIERE_COMMANDE',
  ).length
  const couverture = portefeuille > 0
    ? Math.min(98, Math.max(58, Math.round((visitesJour / portefeuille) * 100)))
    : Math.min(95, Math.round((c.visites_jour / Math.max(1, c.visites_objectif)) * 92))
  const commandes_mois = Math.max(c.commandes_jour * 20, pdvs.length * randInt(rng, 3, 8))
  const ca_mois = pdvs.length > 0
    ? pdvs.reduce((s, p) => s + p.ca_mois, 0)
    : c.ca_jour * 22
  const evolution = c.score_ia >= 85
    ? randInt(rng, 4, 14)
    : c.score_ia >= 75
      ? randInt(rng, -2, 8)
      : randInt(rng, -12, 4)
  const gps = Math.min(99, Math.max(68, c.score_ia + randInt(rng, -8, 6)))
  const alerte = couverture < 65
    ? `Couverture ${couverture}% · ${Math.max(0, portefeuille - visitesJour)} PDV sans passage récent`
    : gps < 76 && c.score_ia < 72
      ? `GPS ${gps}% conforme — ${randInt(rng, 2, 4)} visites à vérifier`
      : undefined

  const synthese = c.type === 'FREELANCE'
    ? `${c.nom} (freelance ${zoneKey(c.zone)}) — ${c.commandes_jour} cmd/j · marge ${c.marge_jour ? Math.round(c.marge_jour / 1000) + ' K/j' : 'stable'}. Portefeuille ${portefeuille} PDV · couverture ${couverture}%.`
    : `${c.nom} (${zoneKey(c.zone)}) — ${visitesJour}/${c.visites_objectif} visites/j · couverture ${couverture}% · ${impayes} relance(s) impayé · ${prospects} prospect(s) actif(s).`

  const action = impayes > 0
    ? pick(rng, [
      `Prioriser ${impayes} relance(s) impayé avant nouvelles livraisons crédit.`,
      `Escalade recouvrement : ${impayes} PDV en retard sur ${zoneKey(c.zone)}.`,
    ])
    : couverture < 72
      ? pick(rng, [
        `Renforcer tournée ${zoneKey(c.zone)} — ${Math.max(0, portefeuille - visitesJour)} PDV sans passage 15j.`,
        `Binôme terrain avec top performer zone pour remonter couverture à 80 %.`,
        `Regrouper visites par micro-secteur pour optimiser le passage.`,
      ])
      : prospects > 0
        ? pick(rng, [
          `Convertir ${prospects} prospect(s) — offre découverte pack boissons.`,
          `Relancer ${prospects} contact(s) chauds avec conditions 1ère commande.`,
        ])
        : pick(rng, [
          'Maintenir rythme visites et cross-sell huile 5L / eau 1,5L.',
          'Capitaliser sur la dynamique — proposer upsell riz 25 kg aux meilleurs clients.',
          'Documenter bonnes pratiques de tournée pour partage équipe.',
        ])

  return {
    couverture,
    impayes,
    prospects: prospects || (c.zone.includes('Prospection') ? randInt(rng, 2, 5) : randInt(rng, 0, 2)),
    evolution,
    gps,
    commandes_mois,
    ca_mois,
    alerte,
    synthese,
    action,
  }
}

export function buildCommerciauxTerrainDG(): CommercialTerrainDG[] {
  return REGISTRE_COMMERCIAUX.map(c => {
    const pdvs = REGISTRE_PDV.filter(p => p.commercial === c.nom)
    const visitesJour = Math.min(c.visites_jour, pdvs.length + 4)
    const portefeuille = pdvs.length || (c.zone.includes('Prospection') ? 18 : 12)
    const extra = EXTRA_COMMERCIAL[c.id] ?? buildExtraCommercialFallback(c, pdvs, visitesJour, portefeuille)
    const positionBase = POSITIONS[c.id] ?? buildPositionFallback(c, pdvs)

    return {
      ...c,
      position: { commercial_id: c.id, ...positionBase },
      pdv_portefeuille: portefeuille,
      pdv_visites_jour: visitesJour,
      couverture_secteur_pct: extra.couverture,
      impayes_a_relancer: extra.impayes,
      prospects_actifs: extra.prospects,
      commandes_mois: extra.commandes_mois,
      ca_mois: extra.ca_mois,
      evolution_mois_pct: extra.evolution,
      gps_conformite_pct: extra.gps,
      alerte: extra.alerte,
      synthese_ia: extra.synthese,
      action_ia: extra.action,
    }
  })
}


export function buildVisitesPdvCarteStable(): VisitePdvCarte[] {
  const visiteMap: Record<string, boolean> = {
    'pdv-1': true, 'pdv-2': true, 'pdv-3': false, 'pdv-4': true,
    'pdv-5': true, 'pdv-6': false, 'pdv-7': true, 'pdv-8': false,
    'mag-1': true, 'mag-2': true, 'mag-3': true, 'mag-4': true,
  }
  return REGISTRE_PDV.map(p => ({
    id: p.id, nom: p.nom, lat: p.lat, lng: p.lng,
    commercial: p.commercial === '—' ? 'Mawuena Ahi' : p.commercial,
    visite_aujourdhui: visiteMap[p.id] ?? false,
    priorite: (p.creance_jours > 30 || p.pipeline === 'A_RISQUE' ? 'HAUTE' : p.pipeline === 'PROSPECTION' ? 'HAUTE' : 'NORMALE') as VisitePdvCarte['priorite'],
    motif: p.creance_jours > 30 ? 'Relance impayé' : p.pipeline === 'PROSPECTION' ? 'Prospect à convertir' : undefined,
  }))
}

export function buildSyntheseTerrainDG(commerciaux: CommercialTerrainDG[]) {
  const visitesTotal = commerciaux.reduce((s, c) => s + c.visites_jour, 0)
  const visitesObj = commerciaux.reduce((s, c) => s + c.visites_objectif, 0)
  const caJour = commerciaux.reduce((s, c) => s + c.ca_jour, 0)
  const couvertureMoy = Math.round(commerciaux.reduce((s, c) => s + c.couverture_secteur_pct, 0) / commerciaux.length)
  const alertesGps = commerciaux.filter(c => c.position.statut === 'ALERTE_GPS' || c.gps_conformite_pct < 80).length
  const sousPerf = commerciaux.filter(c => c.visites_jour < c.visites_objectif || c.couverture_secteur_pct < 75).length

  return {
    equipes_actives: commerciaux.length,
    visites_jour: visitesTotal,
    visites_objectif: visitesObj,
    taux_visites_pct: Math.round((visitesTotal / visitesObj) * 100),
    ca_jour_total: caJour,
    commandes_jour: commerciaux.reduce((s, c) => s + c.commandes_jour, 0),
    couverture_moyenne_pct: couvertureMoy,
    impayes_a_relancer: commerciaux.reduce((s, c) => s + c.impayes_a_relancer, 0),
    prospects_actifs: commerciaux.reduce((s, c) => s + c.prospects_actifs, 0),
    alertes_gps: alertesGps,
    commerciaux_sous_perf: sousPerf,
    freelances: commerciaux.filter(c => c.type === 'FREELANCE').length,
    zones_couvertes: ZONES_DISTRIBUTION.length,
  }
}

export function buildAnalysesTerrainIA(commerciaux: CommercialTerrainDG[]): AnalyseTerrainIA[] {
  const analyses: AnalyseTerrainIA[] = []

  const mawuena = commerciaux.find(c => c.id === 'c-3')
  if (mawuena) {
    analyses.push({
      severite: 'CRITIQUE',
      titre: 'Lomé Est — couverture insuffisante',
      detail: `${mawuena.nom} : ${mawuena.couverture_secteur_pct}% couverture · ${mawuena.pdv_portefeuille - mawuena.pdv_visites_jour} PDV sans passage · GPS ${mawuena.gps_conformite_pct}% conforme`,
      commercial: mawuena.nom,
      action: 'Réaffecter 6 PDV prioritaires + binôme avec Komlan Tetteh 2j/semaine.',
    })
  }

  const komlan = commerciaux.find(c => c.id === 'c-1')
  if (komlan && komlan.impayes_a_relancer > 0) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Relances impayés — tournée du jour',
      detail: `${komlan.impayes_a_relancer} PDV avec encours en retard sur portefeuille ${komlan.nom} · Kiosque Port J+45 en tête`,
      commercial: komlan.nom,
      action: 'Prioriser relance Kiosque Port avant toute nouvelle livraison crédit.',
    })
  }

  analyses.push({
    severite: 'MODEREE',
    titre: 'Modèle freelance à répliquer',
    detail: `Kofi Agbessi : +${commerciaux.find(c => c.id === 'c-4')?.evolution_mois_pct}% marge · 2 nouveaux PDV/mois · conversion visite 38%`,
    commercial: 'Kofi Agbessi',
    action: 'Organiser session best practices freelances avec grille tarifaire Kofi.',
  })

  const couvertureReseau = Math.round(
    ZONES_DISTRIBUTION.reduce((s, z) => s + z.couverture_visites_pct, 0) / ZONES_DISTRIBUTION.length,
  )
  if (couvertureReseau < 80) {
    analyses.push({
      severite: 'HAUTE',
      titre: `Couverture réseau ${couvertureReseau}%`,
      detail: 'Lomé Centre (71%) et Lomé Est (62%) tirent la moyenne vers le bas · 34 PDV sans passage commercial 15j',
      action: 'Renforcer effectif Lomé Est ou fusionner secteurs Nord/Est sous même VRP.',
    })
  }

  return analyses
}

function coachingPriority(c: CommercialTerrainDG): number {
  let p = 0
  if (c.position.statut === 'ALERTE_GPS') p += 50
  if (c.couverture_secteur_pct < 65) p += 35
  else if (c.couverture_secteur_pct < 72) p += 18
  if (c.score_ia < 72) p += 28
  else if (c.score_ia < 75) p += 12
  if (c.impayes_a_relancer > 0) p += 22
  if (c.visites_jour < c.visites_objectif * 0.85) p += 14
  return p
}

export function getCommercialClassement(commerciaux: CommercialTerrainDG[]) {
  const sortedScore = [...commerciaux].sort((a, b) => b.score_ia - a.score_ia)
  return {
    par_ca: [...commerciaux].sort((a, b) => b.ca_jour - a.ca_jour),
    par_score: sortedScore,
    par_couverture: [...commerciaux].sort((a, b) => b.couverture_secteur_pct - a.couverture_secteur_pct),
    a_coacher: commerciaux
      .filter(c => coachingPriority(c) >= 20)
      .sort((a, b) => coachingPriority(b) - coachingPriority(a))
      .slice(0, 4),
    top_performer: sortedScore[0],
  }
}
