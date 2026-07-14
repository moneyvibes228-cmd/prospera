/**
 * Historique sorties entrepôt — BL, destinataires, dates, niveaux stock produits.
 */
import { REGISTRE_COMMANDES } from './registries/commandes-registry'
import { REGISTRE_STOCK } from './registries/stock-registry'
import { ENTREPOTS_DISTRIBUTION } from './registries/entrepots-registry'
import { buildMagasinsCarteDG, buildFluxEntrepotMagasins } from './magasins-pilotage-dg'
import { buildEntrepotsCarteDG } from './zones-pilotage-dg'
import { buildAnalyseDistanceReseau, type SuggestionImplantation } from './cartographie-distance-builder'
import { hashString, pick, randInt, seededRandom } from './generators/mock-seed'
import { formatFcfa } from './utils'

export type StatutSortie = 'LIVRE' | 'EN_ROUTE' | 'PREPARATION' | 'RETARD'
export type NiveauStockSortie = 'OK' | 'ALERTE' | 'RUPTURE'

export interface LigneSortieEntrepot {
  reference: string
  nom: string
  categorie: string
  quantite: number
  unite: string
  stock_avant: number
  stock_apres: number
  seuil: number
  niveau: NiveauStockSortie
}

export interface SortieEntrepot {
  id: string
  bl_reference: string
  commande_reference: string
  date: string
  heure: string
  entrepot_id: string
  entrepot_nom: string
  destination_id: string
  destination_nom: string
  type_magasin: 'PROPRE' | 'PARTENAIRE'
  type_client: string
  zone: string
  statut: StatutSortie
  chauffeur?: string
  nb_lignes: number
  unites_total: number
  valeur_fcfa: number
  lignes: LigneSortieEntrepot[]
  distance_km?: number
}

export interface FluxEntrepotResume {
  entrepot_id: string
  entrepot_nom: string
  sorties_jour: number
  sorties_semaine: number
  unites_jour: number
  valeur_jour_fcfa: number
  destinations_uniques: number
  bl_partenaires: number
  bl_enseigne: number
  taux_service_pct: number
}

export interface AnalyseSortieIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  action: string
  entrepot_ids: string[]
}

export interface PilotageEntrepotDG {
  sorties: SortieEntrepot[]
  flux: FluxEntrepotResume[]
  suggestions: SuggestionImplantation[]
  analyses: AnalyseSortieIA[]
}

const HEURES = ['06:45', '07:30', '08:15', '09:00', '09:45', '10:30', '11:15', '14:00', '15:30', '16:45']
const CHAUFFEURS = ['Kodjo A.', 'Afi T.', 'Mensah K.', 'Yao B.', 'Edem K.', 'Koffi M.', 'Abla S.']

function niveauStock(stockApres: number, seuil: number): NiveauStockSortie {
  if (stockApres <= seuil * 0.5) return 'RUPTURE'
  if (stockApres <= seuil) return 'ALERTE'
  return 'OK'
}

function buildLignesSortie(
  cmdId: string,
  entrepot: string,
  familles: string[],
  nbLignes: number,
  montant: number,
): LigneSortieEntrepot[] {
  const rng = seededRandom(hashString(`lignes-${cmdId}`))
  const stockEntrepot = REGISTRE_STOCK.filter(p => p.entrepot === entrepot)
  const parFamille = stockEntrepot.filter(p => familles.includes(p.categorie))
  const pool = parFamille.length >= 2 ? parFamille : stockEntrepot
  const count = Math.min(nbLignes, Math.max(2, randInt(rng, 2, 6)))
  const picked = [...pool].sort(() => rng() - 0.5).slice(0, count)

  return picked.map(prod => {
    const qty = Math.max(4, Math.round(montant / (count * prod.prix_unitaire * randInt(rng, 8, 24))))
    const stockAvant = prod.stock + qty + randInt(rng, 0, Math.round(prod.stock * 0.15))
    const stockApres = stockAvant - qty
    return {
      reference: prod.reference,
      nom: prod.nom,
      categorie: prod.categorie,
      quantite: qty,
      unite: prod.categorie === 'Alimentaire' ? 'cartons' : 'packs',
      stock_avant: stockAvant,
      stock_apres: stockApres,
      seuil: prod.seuil,
      niveau: niveauStock(stockApres, prod.seuil),
    }
  })
}

function statutFromCommande(statut: string, rng: () => number): StatutSortie {
  if (statut === 'LIVREE') return 'LIVRE'
  if (statut === 'PREPARATION') return 'PREPARATION'
  if (statut === 'VALIDEE') return rng() < 0.6 ? 'EN_ROUTE' : 'PREPARATION'
  return 'PREPARATION'
}

const ENTREPOT_ID: Record<string, string> = {
  'Lomé Port': 'ent-lome-port',
  'Kara': 'ent-kara',
}

export function buildSortiesEntrepot(): SortieEntrepot[] {
  const magasins = buildMagasinsCarteDG()
  const distanceMap = new Map(
    buildAnalyseDistanceReseau(magasins, buildEntrepotsCarteDG()).distances.map(d => [d.magasin_id, d.distance_km]),
  )

  const cmdSorties = REGISTRE_COMMANDES.filter(c =>
    ['LIVREE', 'VALIDEE', 'PREPARATION'].includes(c.statut),
  )

  const sorties: SortieEntrepot[] = cmdSorties.map((cmd, i) => {
    const rng = seededRandom(hashString(`sortie-${cmd.id}`))
    const lignes = buildLignesSortie(cmd.id, cmd.entrepot, cmd.familles, cmd.lignes, cmd.montant_societe)
    const unites = lignes.reduce((s, l) => s + l.quantite, 0)
    const statut = statutFromCommande(cmd.statut, rng)
    const dateOffset = randInt(rng, 0, 6)
    const baseDate = new Date('2026-06-11')
    baseDate.setDate(baseDate.getDate() - dateOffset)
    const date = baseDate.toISOString().slice(0, 10)

    return {
      id: `sortie-${cmd.id}`,
      bl_reference: `BL-2026-${4800 + i}`,
      commande_reference: cmd.reference,
      date,
      heure: pick(rng, HEURES),
      entrepot_id: ENTREPOT_ID[cmd.entrepot] ?? 'ent-lome-port',
      entrepot_nom: cmd.entrepot,
      destination_id: cmd.pdv_id,
      destination_nom: cmd.pdv_nom,
      type_magasin: cmd.type_magasin,
      type_client: cmd.type_client,
      zone: cmd.zone,
      statut,
      chauffeur: statut !== 'PREPARATION' ? pick(rng, CHAUFFEURS) : undefined,
      nb_lignes: lignes.length,
      unites_total: unites,
      valeur_fcfa: cmd.montant_societe,
      lignes,
      distance_km: distanceMap.get(cmd.pdv_id),
    }
  })

  return sorties.sort((a, b) => {
    const d = b.date.localeCompare(a.date)
    return d !== 0 ? d : b.heure.localeCompare(a.heure)
  })
}

export function buildFluxEntrepotResume(sorties: SortieEntrepot[]): FluxEntrepotResume[] {
  const today = '2026-06-11'
  const weekStart = '2026-06-05'

  return ENTREPOTS_DISTRIBUTION.map(ent => {
    const entSorties = sorties.filter(s => s.entrepot_id === ent.id)
    const jour = entSorties.filter(s => s.date === today)
    const semaine = entSorties.filter(s => s.date >= weekStart)
    const part = jour.filter(s => s.type_magasin === 'PARTENAIRE')
    const prop = jour.filter(s => s.type_magasin === 'PROPRE')

    return {
      entrepot_id: ent.id,
      entrepot_nom: ent.nom,
      sorties_jour: jour.length,
      sorties_semaine: semaine.length,
      unites_jour: jour.reduce((s, x) => s + x.unites_total, 0),
      valeur_jour_fcfa: jour.reduce((s, x) => s + x.valeur_fcfa, 0),
      destinations_uniques: new Set(jour.map(s => s.destination_id)).size,
      bl_partenaires: part.length,
      bl_enseigne: prop.length,
      taux_service_pct: ent.taux_service_pct,
    }
  })
}

export function buildAnalysesSortiesIA(
  sorties: SortieEntrepot[],
  flux: FluxEntrepotResume[],
  suggestions: SuggestionImplantation[],
): AnalyseSortieIA[] {
  const analyses: AnalyseSortieIA[] = []
  const today = '2026-06-11'
  const sortiesJour = sorties.filter(s => s.date === today)

  for (const f of flux) {
    const ratioPart = f.sorties_jour > 0 ? Math.round((f.bl_partenaires / f.sorties_jour) * 100) : 0
    if (f.bl_partenaires > f.bl_enseigne * 3 && f.sorties_jour >= 5) {
      analyses.push({
        severite: ratioPart >= 80 ? 'CRITIQUE' : 'HAUTE',
        titre: `Flux partenaires dominant — ${f.entrepot_nom}`,
        detail: `${f.sorties_jour} sorties aujourd'hui · ${ratioPart}% vers partenaires (${f.bl_partenaires} BL) vs ${f.bl_enseigne} enseigne · ${formatFcfa(f.valeur_jour_fcfa)} expédiés · ${f.destinations_uniques} destinations`,
        action: 'Regrouper les BL partenaires par micro-zone et prioriser réassort magasins enseigne avant 10h.',
        entrepot_ids: [f.entrepot_id],
      })
    }
  }

  const rupturesLignes = sortiesJour.flatMap(s =>
    s.lignes.filter(l => l.niveau === 'RUPTURE').map(l => ({ sortie: s, ligne: l })),
  )
  if (rupturesLignes.length >= 2) {
    const byProd = new Map<string, number>()
    for (const { ligne } of rupturesLignes) {
      byProd.set(ligne.nom, (byProd.get(ligne.nom) ?? 0) + 1)
    }
    const top = [...byProd.entries()].sort((a, b) => b[1] - a[1])[0]
    analyses.push({
      severite: 'CRITIQUE',
      titre: `Ruptures post-sortie — ${top?.[0]?.split(' ').slice(0, 3).join(' ') ?? 'SKU'}`,
      detail: `${rupturesLignes.length} lignes en rupture après expédition du jour · ${top?.[1] ?? 0} BL impactés · stock entrepôt sous seuil critique`,
      action: 'Bloquer nouvelles commandes sur SKU en rupture · accélérer réception fournisseur ou transfert inter-entrepôt.',
      entrepot_ids: [...new Set(rupturesLignes.map(r => r.sortie.entrepot_id))],
    })
  }

  const loin = sortiesJour.filter(s => (s.distance_km ?? 0) >= 4 && s.valeur_fcfa >= 2_000_000)
  if (loin.length >= 2) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Gros volumes livrés loin de l\'entrepôt',
      detail: `${loin.length} BL > 4 km aujourd'hui · ${formatFcfa(loin.reduce((s, x) => s + x.valeur_fcfa, 0))} · destinations : ${loin.slice(0, 3).map(s => s.destination_nom.split(' ').slice(0, 2).join(' ')).join(', ')}`,
      action: suggestions[0]?.action ?? 'Étudier micro-dépôt ou tournée groupée sur l\'axe le plus chargé.',
      entrepot_ids: [...new Set(loin.map(s => s.entrepot_id))],
    })
  }

  const retards = sortiesJour.filter(s => s.statut === 'RETARD')
  if (retards.length > 0) {
    analyses.push({
      severite: 'HAUTE',
      titre: `${retards.length} expédition(s) en retard`,
      detail: retards.map(s => `${s.destination_nom} (${s.heure})`).join(' · '),
      action: 'Réaffecter chauffeur ou fusionner avec tournée adjacente sous 2h.',
      entrepot_ids: [...new Set(retards.map(s => s.entrepot_id))],
    })
  }

  for (const sug of suggestions.slice(0, 2)) {
    analyses.push({
      severite: sug.severite,
      titre: sug.titre,
      detail: sug.detail,
      action: sug.action,
      entrepot_ids: sug.zone_ids.includes('zn-kara') || sug.zone_ids.includes('zn-centrale')
        ? ['ent-kara']
        : ['ent-lome-port'],
    })
  }

  return analyses.slice(0, 6)
}

export function buildPilotageEntrepotDG(): PilotageEntrepotDG {
  const magasins = buildMagasinsCarteDG()
  const entrepots = buildEntrepotsCarteDG()
  const sorties = buildSortiesEntrepot()
  const fluxResume = buildFluxEntrepotResume(sorties)
  const analyseDistance = buildAnalyseDistanceReseau(magasins, entrepots)
  const analyses = buildAnalysesSortiesIA(sorties, fluxResume, analyseDistance.suggestions)

  return {
    sorties,
    flux: fluxResume,
    suggestions: analyseDistance.suggestions,
    analyses,
  }
}

export function filterSorties(
  sorties: SortieEntrepot[],
  opts: { entrepotId?: string; date?: string; statut?: StatutSortie | 'tous'; search?: string },
): SortieEntrepot[] {
  let out = sorties
  if (opts.entrepotId && opts.entrepotId !== 'tous') {
    out = out.filter(s => s.entrepot_id === opts.entrepotId)
  }
  if (opts.date && opts.date !== 'tous') {
    out = out.filter(s => s.date === opts.date)
  }
  if (opts.statut && opts.statut !== 'tous') {
    out = out.filter(s => s.statut === opts.statut)
  }
  if (opts.search?.trim()) {
    const q = opts.search.toLowerCase()
    out = out.filter(s =>
      s.destination_nom.toLowerCase().includes(q) ||
      s.bl_reference.toLowerCase().includes(q) ||
      s.zone.toLowerCase().includes(q),
    )
  }
  return out
}

export function getDatesSorties(sorties: SortieEntrepot[]): string[] {
  return [...new Set(sorties.map(s => s.date))].sort((a, b) => b.localeCompare(a))
}

/** Points flux entrepôt → magasins (réutilise magasins-pilotage). */
export function buildFluxEntrepotPoints() {
  const magasins = buildMagasinsCarteDG()
  return buildFluxEntrepotMagasins(magasins)
}
