/**
 * Rapport PDV DG — fiche 360° client / magasin enseigne.
 */
import type { PointDeVente, PipelineStage } from '@distributeur/types'
import { REGISTRE_PDV } from './registries/pdv-registry'
import { REGISTRE_COMMANDES } from './registries/commandes-registry'
import { REGISTRE_FACTURES } from './registries/factures-registry'
import { REGISTRE_VISITES } from './registries/tournees-registry'
import { REGISTRE_RELANCES } from './registries/relances-registry'
import { buildMagasinsCarteDG } from './magasins-pilotage-dg'
import { ZONES_DISTRIBUTION } from './registries/zones-registry'
import { getPdvCaEvolutionPct, getPdvDelaiLivraisonJ } from './generators/generate-pdv'

export interface PdvKpiRapport {
  ca_mois: number
  ca_evolution_pct: number
  ca_moyen_6m: number
  commandes_mois: number
  panier_moyen: number
  livraisons_mois: number
  marge_nette_pct?: number
  delai_livraison_j: number
  taux_service_pct: number
  jours_depuis_commande: number
}

export interface PdvProduitLigne {
  reference: string
  nom: string
  quantite_mois: number
  evolution_pct: number
  part_ca_pct: number
  rupture: boolean
}

export interface PdvCommandeLigne {
  reference: string
  date: string
  montant: number
  statut: string
  lignes: number
}

export interface PdvFactureLigne {
  numero: string
  montant: number
  paye: number
  statut: string
  jours_retard: number
}

export interface PdvContexteZone {
  zone_nom: string
  rang_ca_zone: number
  total_points_zone: number
  partenaires_zone: number
  magasins_enseigne_zone: number
  impayes_zone_fcfa: number
  saturation_partenaires_pct: number
}

export interface PdvRapportDG {
  pdv: PointDeVente
  kpis: PdvKpiRapport
  ca_sparkline_6m: { mois: string; ca: number }[]
  produits: PdvProduitLigne[]
  commandes: PdvCommandeLigne[]
  factures: PdvFactureLigne[]
  contexte_zone: PdvContexteZone
  alertes: { severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'; titre: string; detail: string }[]
  synthese_ia: string
  actions_prioritaires: string[]
  analyse_logistique: string
  analyse_financiere: string
}

function joursDepuis(dateStr: string): number {
  if (dateStr === '—') return 999
  const d = new Date(dateStr)
  const now = new Date('2026-06-10')
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86_400_000))
}

function buildSparkline(caMois: number, evolution: number) {
  const base = caMois / (1 + evolution / 100)
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
  return months.map((mois, i) => ({
    mois,
    ca: Math.round(base * (0.82 + i * 0.035 + (i === 5 ? evolution / 100 : 0))),
  }))
}

function buildAlertes(pdv: PointDeVente, kpis: PdvKpiRapport, ctx: PdvContexteZone): PdvRapportDG['alertes'] {
  const alertes: PdvRapportDG['alertes'] = []
  if (pdv.creance_jours > 30) {
    alertes.push({ severite: 'CRITIQUE', titre: 'Créance en retard critique', detail: `${pdv.creance_jours}j de retard · plafond crédit dépassé · risque coupure approvisionnement` })
  } else if (pdv.creance > 0) {
    alertes.push({ severite: 'HAUTE', titre: 'Encours client à surveiller', detail: `${Math.round(pdv.creance / 1000)} K FCFA · ${pdv.creance_jours}j · relance avant prochaine livraison` })
  }
  if (kpis.jours_depuis_commande > 21) {
    alertes.push({ severite: 'HAUTE', titre: 'Inactivité commande', detail: `Dernière commande il y a ${kpis.jours_depuis_commande}j · risque décrochage concurrent` })
  }
  if (kpis.delai_livraison_j > 3) {
    alertes.push({ severite: 'MODEREE', titre: 'Délai livraison élevé', detail: `${kpis.delai_livraison_j}j en moyenne vs 1,5j objectif · impact réassort client` })
  }
  const ruptures = buildMagasinsCarteDG().find(m => m.id === pdv.id)?.produits.filter(p => p.rupture) ?? []
  if (ruptures.length > 0) {
    alertes.push({ severite: 'HAUTE', titre: 'Rupture produit en point de vente', detail: `${ruptures.map(p => p.nom).join(', ')} — réappro urgent` })
  }
  if (pdv.type_magasin === 'PARTENAIRE' && ctx.saturation_partenaires_pct >= 75) {
    alertes.push({ severite: 'MODEREE', titre: 'Zone saturée partenaires', detail: `${ctx.saturation_partenaires_pct}% des BL zone vers partenaires · ${ctx.partenaires_zone} points concurrents même secteur` })
  }
  return alertes
}

function buildSyntheseIA(pdv: PointDeVente, kpis: PdvKpiRapport, ctx: PdvContexteZone): string {
  if (pdv.pipeline === 'A_RISQUE') {
    return `${pdv.nom} est classé à risque (score ${pdv.score_ia}/100). L'encours de ${Math.round(pdv.creance / 1000)} K FCFA bloque toute nouvelle livraison crédit. Le CA a chuté de ${Math.abs(kpis.ca_evolution_pct)}% vs M-1 dans une zone où ${ctx.impayes_zone_fcfa > 10_000_000 ? 'les impayés sont concentrés' : 'la demande reste stable'}. Action immédiate : recouvrement + visite superviseur.`
  }
  if (pdv.type_magasin === 'PROPRE') {
    return `Magasin enseigne ${pdv.nom} — ${kpis.ca_evolution_pct > 0 ? 'dynamique positive' : 'léger ralentissement'} (${kpis.ca_evolution_pct > 0 ? '+' : ''}${kpis.ca_evolution_pct}% vs M-1). Approvisionné directement par ${pdv.entrepot_source} en ${kpis.delai_livraison_j}j. Rang ${ctx.rang_ca_zone}/${ctx.total_points_zone} CA dans ${ctx.zone_nom}. Priorité : maintenir le taux service et le stock de sécurité sur les 3 SKU moteurs.`
  }
  if (pdv.pipeline === 'PROSPECTION') {
    return `Prospect ${pdv.nom} en phase d'activation (${ctx.zone_nom}). Potentiel estimé 1,2 M FCFA/mois si première commande validée. ${ctx.partenaires_zone} partenaires actifs dans le secteur — positionnement prix et assortiment alimentaire recommandés pour différenciation.`
  }
  return `${pdv.nom} (${ctx.zone_nom}) génère ${Math.round(kpis.ca_mois / 1_000_000 * 10) / 10} M FCFA/mois, ${kpis.ca_evolution_pct > 0 ? 'en progression' : 'en baisse'} de ${Math.abs(kpis.ca_evolution_pct)}%. ${kpis.commandes_mois} commandes · panier ${Math.round(kpis.panier_moyen / 1000)} K. ${pdv.commercial !== '—' ? `Commercial : ${pdv.commercial}.` : ''} Rang zone : ${ctx.rang_ca_zone}/${ctx.total_points_zone}.`
}

function buildActions(pdv: PointDeVente, alertes: PdvRapportDG['alertes']): string[] {
  const actions: string[] = []
  if (pdv.creance_jours > 30) actions.push('Bloquer BL crédit et lancer recouvrement terrain sous 48h')
  if (pdv.pipeline === 'PROSPECTION') actions.push('Planifier visite commerciale + offre découverte pack boissons')
  if (pdv.pipeline === 'A_RISQUE') actions.push('Escalade superviseur zone + négociation échéancier impayé')
  if (pdv.type_magasin === 'PROPRE') actions.push('Vérifier stock sécurité vs flux partenaires même zone')
  if (!actions.length) actions.push('Proposer réappro huile 5L + eau 1,5L — rotation forte ce mois')
  if (alertes.some(a => a.titre.includes('Rupture'))) actions.push('Expédition prioritaire SKU en rupture depuis entrepôt')
  return actions.slice(0, 4)
}

export function buildPdvRapportDG(pdvId: string): PdvRapportDG | null {
  const pdv = REGISTRE_PDV.find(p => p.id === pdvId)
  if (!pdv) return null

  const magasin = buildMagasinsCarteDG().find(m => m.id === pdvId)
  const evolution = getPdvCaEvolutionPct(pdvId)
  const commandes = REGISTRE_COMMANDES.filter(c => c.pdv_id === pdvId)
  const commandesMois = commandes.length > 0 ? commandes.length + Math.max(2, Math.round(pdv.ca_mois / 400_000)) : Math.round(pdv.ca_mois / 400_000)
  const panier = commandesMois > 0 ? Math.round(pdv.ca_mois / commandesMois) : 0

  const zonePdvs = REGISTRE_PDV.filter(p => p.zone === pdv.zone && p.ca_mois > 0)
    .sort((a, b) => b.ca_mois - a.ca_mois)
  const rang = zonePdvs.findIndex(p => p.id === pdvId) + 1 || zonePdvs.length + 1
  const zoneMeta = ZONES_DISTRIBUTION.find(z => z.nom === pdv.zone)
  const partenairesZone = REGISTRE_PDV.filter(p => p.zone === pdv.zone && p.type_magasin === 'PARTENAIRE').length
  const propresZone = REGISTRE_PDV.filter(p => p.zone === pdv.zone && p.type_magasin === 'PROPRE').length

  const kpis: PdvKpiRapport = {
    ca_mois: pdv.ca_mois,
    ca_evolution_pct: evolution,
    ca_moyen_6m: Math.round(pdv.ca_mois * 0.92),
    commandes_mois: commandesMois,
    panier_moyen: panier,
    livraisons_mois: magasin?.livraisons_mois ?? commandesMois,
    delai_livraison_j: getPdvDelaiLivraisonJ(pdvId),
    taux_service_pct: pdv.type_magasin === 'PROPRE' ? 96 : pdv.pipeline === 'A_RISQUE' ? 72 : 89,
    jours_depuis_commande: joursDepuis(pdv.derniere_commande),
  }

  const produits: PdvProduitLigne[] = (magasin?.produits ?? []).map(p => ({
    reference: p.reference,
    nom: p.nom,
    quantite_mois: p.quantite_mois,
    evolution_pct: p.evolution_pct,
    part_ca_pct: Math.round((p.quantite_mois / Math.max(1, magasin!.produits.reduce((s, x) => s + x.quantite_mois, 0))) * 100),
    rupture: p.rupture,
  }))

  const cmdLignes: PdvCommandeLigne[] = commandes.length > 0
    ? commandes.map(c => ({ reference: c.reference, date: c.date, montant: c.montant_societe, statut: c.statut, lignes: c.lignes }))
    : pdv.ca_mois > 0
      ? [{ reference: 'CMD-2026-—', date: pdv.derniere_commande, montant: panier, statut: 'LIVREE', lignes: 8 }]
      : []

  const factures: PdvFactureLigne[] = REGISTRE_FACTURES
    .filter(f => f.pdv_nom === pdv.nom)
    .map(f => ({ numero: f.numero, montant: f.montant, paye: f.paye, statut: f.statut, jours_retard: f.jours_retard }))

  const ctx: PdvContexteZone = {
    zone_nom: pdv.zone,
    rang_ca_zone: rang,
    total_points_zone: zonePdvs.length,
    partenaires_zone: partenairesZone,
    magasins_enseigne_zone: propresZone,
    impayes_zone_fcfa: zoneMeta?.creances_retard ?? 0,
    saturation_partenaires_pct: partenairesZone + propresZone > 0
      ? Math.round((partenairesZone / (partenairesZone + propresZone)) * 100)
      : 0,
  }

  const alertes = buildAlertes(pdv, kpis, ctx)

  return {
    pdv,
    kpis,
    ca_sparkline_6m: buildSparkline(pdv.ca_mois, evolution),
    produits,
    commandes: cmdLignes,
    factures,
    contexte_zone: ctx,
    alertes,
    synthese_ia: buildSyntheseIA(pdv, kpis, ctx),
    actions_prioritaires: buildActions(pdv, alertes),
    analyse_logistique: `Approvisionné par ${pdv.entrepot_source} · ${kpis.livraisons_mois} BL/mois · délai moyen ${kpis.delai_livraison_j}j · taux service ${kpis.taux_service_pct}%. ${pdv.type_magasin === 'PROPRE' ? 'Flux direct entrepôt → magasin enseigne (priorité stock).' : `${ctx.partenaires_zone} partenaires actifs dans ${pdv.zone} — attention à la concurrence d'assortiment.`}`,
    analyse_financiere: pdv.creance > 0
      ? `Encours ${Math.round(pdv.creance / 1000)} K FCFA (${pdv.creance_jours}j). ${factures.length} facture(s) ouverte(s). Risque impact marge si coupure livraison.`
      : `Compte sain · paiement à jour · CA ${Math.round(pdv.ca_mois / 1_000_000 * 10) / 10} M/mois · évolution ${evolution > 0 ? '+' : ''}${evolution}%.`,
  }
}

/**
 * Contexte orienté **terrain** (COMMERCIAL / FREELANCE / PROSPECTION) : ce dont
 * un vendeur a besoin sur la fiche PDV — dernière visite, relances à faire,
 * stock en rupture, objectif du mois — au lieu du rang CA zone et des actions DG.
 */
export interface PdvContexteCommercial {
  derniere_visite?: {
    date: string
    resultat?: string
    commentaire?: string
    commercial: string
  }
  relances_a_faire: {
    canal: string
    action: string
    date: string
    priorite?: string
    montant?: number
  }[]
  ruptures: string[]
  objectif_mois_fcfa: number
  progression_objectif_pct: number
}

export function buildPdvContexteCommercial(pdvId: string): PdvContexteCommercial | null {
  const pdv = REGISTRE_PDV.find(p => p.id === pdvId)
  if (!pdv) return null

  const visites = REGISTRE_VISITES
    .filter(v => v.pdv_id === pdvId && v.statut === 'FAITE')
    .sort((a, b) => b.date.localeCompare(a.date))
  const derniere = visites[0]

  const relances = REGISTRE_RELANCES
    .filter(r => r.pdv_id === pdvId && r.statut !== 'ECHEC')
    .filter(r => r.statut === 'PLANIFIEE' || r.statut === 'DETECTION' || r.statut === 'ENVOYEE')

  const magasin = buildMagasinsCarteDG().find(m => m.id === pdvId)
  const ruptures = (magasin?.produits ?? []).filter(p => p.rupture).map(p => p.nom)

  const objectif = Math.round(pdv.ca_mois * 1.1)
  const progression = objectif > 0 ? Math.min(100, Math.round((pdv.ca_mois / objectif) * 100)) : 0

  return {
    derniere_visite: derniere
      ? {
        date: derniere.date,
        resultat: derniere.resultat,
        commentaire: derniere.commentaire,
        commercial: derniere.commercial,
      }
      : undefined,
    relances_a_faire: relances.map(r => ({
      canal: r.canal,
      action: r.prochaine_action ?? 'Relance à effectuer',
      date: r.prochaine_action_date ?? r.date,
      priorite: r.priorite,
      montant: r.montant,
    })),
    ruptures,
    objectif_mois_fcfa: objectif,
    progression_objectif_pct: progression,
  }
}

export interface PdvListeSyntheseDG {
  total: number
  magasins_enseigne: number
  partenaires: number
  ca_total_mois: number
  impayes_total: number
  a_risque: number
  prospection: number
  zones: { nom: string; count: number; ca: number }[]
}

export function buildPdvListeSyntheseDG(points: PointDeVente[]): PdvListeSyntheseDG {
  const zones = [...new Set(points.map(p => p.zone))].map(nom => ({
    nom,
    count: points.filter(p => p.zone === nom).length,
    ca: points.filter(p => p.zone === nom).reduce((s, p) => s + p.ca_mois, 0),
  })).sort((a, b) => b.ca - a.ca)

  return {
    total: points.length,
    magasins_enseigne: points.filter(p => p.type_magasin === 'PROPRE').length,
    partenaires: points.filter(p => p.type_magasin === 'PARTENAIRE').length,
    ca_total_mois: points.reduce((s, p) => s + p.ca_mois, 0),
    impayes_total: points.reduce((s, p) => s + p.creance, 0),
    a_risque: points.filter(p => p.pipeline === 'A_RISQUE').length,
    prospection: points.filter(p => p.pipeline === 'PROSPECTION').length,
    zones,
  }
}

export interface PdvReseauSyntheseIA {
  synthese_ia: string
  alertes: { severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'; titre: string; detail: string }[]
  actions_prioritaires: string[]
}

export function buildPdvReseauSyntheseIA(points: PointDeVente[]): PdvReseauSyntheseIA {
  const synthese = buildPdvListeSyntheseDG(points)
  const enrichis = points.map(enrichPdvListeItem)

  const aRisque = enrichis.filter(p => p.pipeline === 'A_RISQUE').sort((a, b) => b.creance - a.creance)
  const impayesCritiques = enrichis.filter(p => p.creance_jours > 30).sort((a, b) => b.creance - a.creance)
  const enBaisse = enrichis.filter(p => p.ca_evolution_pct < -5 && p.ca_mois > 0)
  const enHausse = enrichis.filter(p => p.ca_evolution_pct > 5 && p.ca_mois > 0)
  const ruptures = enrichis.filter(p => p.produits_rupture > 0)
  const prospection = enrichis.filter(p => p.pipeline === 'PROSPECTION')
  const enseignes = enrichis.filter(p => p.type_magasin === 'PROPRE')
  const caEnseigne = enseignes.reduce((s, p) => s + p.ca_mois, 0)
  const evolMoyenne = enrichis.filter(p => p.ca_mois > 0).length > 0
    ? Math.round(enrichis.filter(p => p.ca_mois > 0).reduce((s, p) => s + p.ca_evolution_pct, 0) / enrichis.filter(p => p.ca_mois > 0).length)
    : 0

  const zoneImpayes = synthese.zones
    .map(z => ({
      ...z,
      impayes: points.filter(p => p.zone === z.nom).reduce((s, p) => s + p.creance, 0),
    }))
    .filter(z => z.impayes > 0)
    .sort((a, b) => b.impayes - a.impayes)
  const zoneExposee = zoneImpayes[0]

  const alertes: PdvReseauSyntheseIA['alertes'] = []
  if (aRisque.length > 0) {
    alertes.push({
      severite: 'CRITIQUE',
      titre: `${aRisque.length} client(s) à risque`,
      detail: `${aRisque.map(p => p.nom).join(', ')} · ${Math.round(aRisque.reduce((s, p) => s + p.creance, 0) / 1_000_000 * 10) / 10} M FCFA d'encours bloqués`,
    })
  }
  if (impayesCritiques.length > 0) {
    alertes.push({
      severite: 'CRITIQUE',
      titre: 'Impayés > 30 jours',
      detail: `${impayesCritiques.map(p => p.nom).join(', ')} · recouvrement urgent`,
    })
  }
  if (ruptures.length > 0) {
    alertes.push({
      severite: 'HAUTE',
      titre: 'Ruptures SKU en réseau',
      detail: `${ruptures.length} point(s) en rupture — réappro prioritaire entrepôt`,
    })
  }
  if (prospection.length > 0) {
    alertes.push({
      severite: 'MODEREE',
      titre: 'Pipeline prospection',
      detail: `${prospection.length} prospect(s) à activer · ${prospection.map(p => p.zone).join(', ')}`,
    })
  }

  const actions: string[] = []
  if (aRisque.length > 0) actions.push(`Recouvrement + visite superviseur : ${aRisque.slice(0, 2).map(p => p.nom).join(', ')}`)
  if (ruptures.length > 0) actions.push('Expédition prioritaire SKU en rupture (huile 5L, eau 1,5L)')
  if (prospection.length > 0) actions.push(`Activer prospection : ${prospection.map(p => p.nom).join(', ')}`)
  if (enBaisse.length > 0) actions.push(`Relancer clients en baisse CA : ${enBaisse.slice(0, 2).map(p => p.nom).join(', ')}`)
  if (!actions.length) actions.push('Maintenir le rythme sur les magasins enseigne et partenaires fidèles')

  const caTotalM = Math.round(synthese.ca_total_mois / 1_000_000 * 10) / 10
  const impayesM = Math.round(synthese.impayes_total / 1_000_000 * 10) / 10
  const risqueNoms = aRisque.map(p => p.nom).join(' et ')
  const risqueEncours = Math.round(aRisque.reduce((s, p) => s + p.creance, 0) / 1_000_000 * 10) / 10

  let synthese_ia = `Le réseau compte ${synthese.total} points actifs (${synthese.magasins_enseigne} enseignes, ${synthese.partenaires} partenaires) pour ${caTotalM} M FCFA de CA mensuel, en ${evolMoyenne >= 0 ? 'progression' : 'recul'} moyenne de ${Math.abs(evolMoyenne)} % vs M-1. `

  if (aRisque.length > 0) {
    synthese_ia += `${aRisque.length} client${aRisque.length > 1 ? 's' : ''} à risque (${risqueNoms}) concentrent ${risqueEncours} M FCFA d'encours et bloquent les livraisons crédit. `
    if (zoneExposee) {
      synthese_ia += `${zoneExposee.nom} est la zone la plus exposée (${Math.round(zoneExposee.impayes / 1_000_000 * 10) / 10} M FCFA d'impayés). `
    }
  }

  if (enseignes.length > 0) {
    const evolEnseigne = Math.round(enseignes.reduce((s, p) => s + p.ca_evolution_pct, 0) / enseignes.length)
    synthese_ia += `Les magasins enseigne restent sains (${Math.round(caEnseigne / 1_000_000 * 10) / 10} M FCFA, ${evolEnseigne >= 0 ? '+' : ''}${evolEnseigne} % vs M-1, 0 impayé). `
  }

  if (enHausse.length > 0) {
    synthese_ia += `Dynamique positive sur ${enHausse.slice(0, 2).map(p => p.nom).join(', ')}. `
  }

  if (ruptures.length > 0 || prospection.length > 0) {
    const parts: string[] = []
    if (ruptures.length > 0) parts.push(`${ruptures.length} point(s) en rupture SKU`)
    if (prospection.length > 0) parts.push(`${prospection.length} prospect(s) en activation`)
    synthese_ia += `${parts.join(' · ')}. `
  }

  synthese_ia += `Encours total réseau : ${impayesM} M FCFA. Action immédiate : ${actions[0]?.toLowerCase() ?? 'poursuivre le pilotage commercial hebdomadaire'}.`

  return {
    synthese_ia,
    alertes,
    actions_prioritaires: actions.slice(0, 4),
  }
}

export function enrichPdvListeItem(pdv: PointDeVente) {
  const evolution = getPdvCaEvolutionPct(pdv.id)
  const magasin = buildMagasinsCarteDG().find(m => m.id === pdv.id)
  return {
    ...pdv,
    ca_evolution_pct: evolution,
    commandes_mois: magasin?.livraisons_mois ?? Math.max(0, Math.round(pdv.ca_mois / 400_000)),
    produits_rupture: magasin?.produits.filter(p => p.rupture).length ?? 0,
    jours_inactif: joursDepuis(pdv.derniere_commande),
  }
}

export type PdvListeItemEnrichi = ReturnType<typeof enrichPdvListeItem>

export const PIPELINE_STYLE: Record<PipelineStage, { label: string; className: string }> = {
  PROSPECTION: { label: 'Prospection', className: 'bg-sky-100 text-sky-700' },
  PREMIER_CONTACT: { label: 'Premier contact', className: 'bg-indigo-100 text-indigo-700' },
  PREMIERE_COMMANDE: { label: '1ère commande', className: 'bg-violet-100 text-violet-700' },
  ACTIF: { label: 'Client actif', className: 'bg-emerald-100 text-emerald-700' },
  FIDELE: { label: 'Client fidèle', className: 'bg-teal-100 text-teal-700' },
  A_RISQUE: { label: 'À risque', className: 'bg-red-100 text-red-700' },
}
