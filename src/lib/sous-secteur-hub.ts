/** Hub sous-secteur DG — dossiers complets & cohérence comptable */

import { AGENCES, RESEAU_CONSOLIDE, getEquipeAgenceImf, getAffectationClientAgence, type MembreEquipeImf } from '@/lib/agences'
import { getSecteurHub } from '@/lib/secteur-hub'
import { getSecteurBySlug, getSousSecteurBySlug, type SecteurDetail, type SousSecteurDetail } from '@/lib/dg-vue360'
import { formatFcfa } from '@/lib/utils'

export interface DossierSousSecteur {
  id: string
  client: string
  agence_id: string
  agence: string
  responsable_agence: string
  agent_commercial: string
  agent_gp: string
  /** Alias commercial — rétrocompatibilité */
  agent: string
  montant: number
  statut: 'ACTIF' | 'EN_RETARD' | 'RENOUVELLEMENT' | 'COURANT'
  jours_retard: number
  derniere_echeance: string
  score_ia: number
}

export type AgentEquipeSecteur = MembreEquipeImf

export interface AgenceSousSecteur {
  agence_id: string
  agence: string
  dossiers: number
  encours: number
  par: number
  pct_dossiers: number
  /** Équipe complète agence (RA + terrain) */
  equipe: AgentEquipeSecteur[]
  /** Noms plats — rétrocompatibilité */
  agents: string[]
}

export interface SousSecteurHub {
  secteur: SecteurDetail
  sous: SousSecteurDetail
  secteur_slug: string
  sous_slug: string
  synthese_memo: string
  kpis: {
    total_dossiers: number
    encours_fcfa: number
    par_pct: number
    dossiers_en_retard: number
    encours_en_retard_fcfa: number
    ticket_moyen: number
    taux_remboursement: number
    part_secteur_pct: number
    part_reseau_pct: number
    renouvellements_eligibles: number
  }
  agences: AgenceSousSecteur[]
  dossiers: DossierSousSecteur[]
  historique_6m: Array<{ mois: string; encours: number; par: number; dossiers: number }>
  decisions_dg: Array<{ priorite: 1 | 2 | 3; titre: string; detail: string; impact: string; delai: string }>
  glossaire: Array<{ terme: string; definition: string }>
}

const PRENOMS = ['Akossiwa', 'Koffi', 'Ama', 'Edem', 'Mawu', 'Sena', 'Yawa', 'Komlan', 'Efua', 'Komi', 'Afi', 'Mensah', 'Akua', 'Elom', 'Sika']
const NOMS = ['Mensah', 'Dossou', 'Amavi', 'Kpélim', 'Lawson', 'Adjavon', 'Kpodzo', 'Fiagbé', 'Atsu', 'Koffi', 'Bessan', 'Attivor', 'Hounyo', 'Kpakpo', 'Togbui']

const AGENCE_WEIGHTS = AGENCES.map(a => ({
  id: a.id,
  w: a.emprunteurs_actifs / AGENCES.reduce((s, x) => s + x.emprunteurs_actifs, 0),
}))

function seeded(seed: number, max: number) {
  const x = Math.sin(seed * 12.9898 + max * 78.233) * 43758.5453
  return Math.floor((x - Math.floor(x)) * max)
}

/** Code court unique par sous-secteur — évite les collisions CL-CO-00X entre sous-secteurs */
function codeSousSecteur(sousSlug: string): string {
  return sousSlug.split('-').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 5)
}

function distributeDossiers(total: number): Record<string, number> {
  const raw = AGENCE_WEIGHTS.map(a => ({ id: a.id, exact: total * a.w, floor: Math.floor(total * a.w) }))
  let assigned = raw.reduce((s, r) => s + r.floor, 0)
  const remainders = raw.map(r => ({ id: r.id, rem: r.exact - r.floor })).sort((a, b) => b.rem - a.rem)
  const out: Record<string, number> = {}
  for (const r of raw) out[r.id] = r.floor
  let i = 0
  while (assigned < total) {
    out[remainders[i % remainders.length].id] += 1
    assigned++
    i++
  }
  return out
}

function buildDossiers(ss: SousSecteurDetail, secteurSlug: string, sousSlug: string): DossierSousSecteur[] {
  const distribution = distributeDossiers(ss.count)
  const ticketBase = ss.ticket_moyen
  const nbRetard = Math.max(1, Math.round(ss.count * ss.par / 100))
  const dossiers: DossierSousSecteur[] = []
  let idx = 0
  let retardAssigned = 0

  for (const [agenceId, nb] of Object.entries(distribution)) {
    const agence = AGENCES.find(a => a.id === agenceId)!

    for (let j = 0; j < nb; j++) {
      const seed = idx * 17 + sousSlug.length * 31
      const prenom = PRENOMS[seeded(seed, PRENOMS.length)]
      const nom = NOMS[seeded(seed + 1, NOMS.length)]
      const aff = getAffectationClientAgence(agenceId, `${secteurSlug}-${sousSlug}-${idx}`)
      const variation = 0.72 + seeded(seed + 2, 56) / 100
      const montant = Math.round(ticketBase * variation / 10_000) * 10_000
      const isRetard = retardAssigned < nbRetard && (j === nb - 1 || seeded(seed + 3, 10) < 2)
      if (isRetard) retardAssigned++

      dossiers.push({
        id: `CL-${secteurSlug.slice(0, 2).toUpperCase()}-${codeSousSecteur(sousSlug)}-${String(idx + 1).padStart(3, '0')}`,
        client: `${prenom} ${nom}`,
        agence_id: agenceId,
        agence: agence.nom_court,
        responsable_agence: aff.responsable_agence,
        agent_commercial: aff.agent_commercial,
        agent_gp: aff.agent_gp,
        agent: aff.agent_commercial,
        montant: Math.max(150_000, montant),
        statut: isRetard ? 'EN_RETARD' : seeded(seed + 4, 10) > 7 ? 'RENOUVELLEMENT' : 'ACTIF',
        jours_retard: isRetard ? 12 + seeded(seed + 5, 45) : 0,
        derniere_echeance: isRetard ? `J+${12 + seeded(seed + 5, 45)}` : 'À jour',
        score_ia: isRetard ? 38 + seeded(seed + 6, 15) : 62 + seeded(seed + 6, 30),
      })
      idx++
    }
  }

  return dossiers.sort((a, b) => (b.statut === 'EN_RETARD' ? 1 : 0) - (a.statut === 'EN_RETARD' ? 1 : 0))
}

function buildAgences(dossiers: DossierSousSecteur[], ss: SousSecteurDetail): AgenceSousSecteur[] {
  return AGENCES.map(ag => {
    const agDossiers = dossiers.filter(d => d.agence_id === ag.id)
    const encours = agDossiers.reduce((s, d) => s + d.montant, 0)
    const retard = agDossiers.filter(d => d.statut === 'EN_RETARD')
    const par = agDossiers.length === 0 ? 0 : Math.round((retard.length / agDossiers.length) * 100 * (ss.par / 6) * 10) / 10
    const equipe = getEquipeAgenceImf(ag.id)
    return {
      agence_id: ag.id,
      agence: ag.nom_court,
      dossiers: agDossiers.length,
      encours,
      par: agDossiers.length === 0 ? 0 : Math.max(3, Math.min(14, par || ss.par + (ag.id === 'AG-003' ? 1.5 : -0.5))),
      pct_dossiers: ss.count === 0 ? 0 : Math.round((agDossiers.length / ss.count) * 100),
      equipe,
      agents: equipe.map(e => e.nom),
    }
  }).filter(a => a.dossiers > 0)
}

function buildHistorique(ss: SousSecteurDetail) {
  return [
    { mois: 'Déc', encours: Math.round(ss.encours * 0.88), par: Math.min(ss.par + 2.2, 15), dossiers: Math.round(ss.count * 0.92) },
    { mois: 'Jan', encours: Math.round(ss.encours * 0.91), par: Math.min(ss.par + 1.6, 15), dossiers: Math.round(ss.count * 0.94) },
    { mois: 'Fév', encours: Math.round(ss.encours * 0.94), par: Math.min(ss.par + 1.0, 15), dossiers: Math.round(ss.count * 0.96) },
    { mois: 'Mar', encours: Math.round(ss.encours * 0.96), par: Math.min(ss.par + 0.5, 15), dossiers: Math.round(ss.count * 0.98) },
    { mois: 'Avr', encours: Math.round(ss.encours * 0.98), par: Math.min(ss.par + 0.2, 15), dossiers: Math.round(ss.count * 0.99) },
    { mois: 'Mai', encours: ss.encours, par: ss.par, dossiers: ss.count },
  ]
}

function buildDecisions(ss: SousSecteurDetail, secteurNom: string, kpis: SousSecteurHub['kpis']): SousSecteurHub['decisions_dg'] {
  const d: SousSecteurHub['decisions_dg'] = []
  if (ss.par > 10) {
    d.push({ priorite: 1, titre: 'Gel nouveaux dossiers sous-secteur', detail: `PAR ${ss.par} % > seuil BCEAO 10 %`, impact: 'Limiter dégradation', delai: 'Immédiat' })
  }
  if (kpis.dossiers_en_retard > 0) {
    d.push({ priorite: 1, titre: `Plan recouvrement — ${kpis.dossiers_en_retard} dossiers`, detail: `${formatFcfa(kpis.encours_en_retard_fcfa)} encours à risque`, impact: 'PAR −0,8 pt', delai: '7 jours' })
  }
  if (kpis.renouvellements_eligibles >= 3) {
    d.push({ priorite: 2, titre: 'Accélérer renouvellements éligibles', detail: `${kpis.renouvellements_eligibles} dossiers ACTIF/RENOUVELLEMENT`, impact: `+${formatFcfa(kpis.renouvellements_eligibles * ss.ticket_moyen * 0.8)} pipeline`, delai: 'Juin' })
  }
  if (secteurNom === 'Commerce' && ss.nom.includes('fruits')) {
    d.push({ priorite: 2, titre: 'Campagne saison pluies', detail: 'Stockage & marge réduite juin-août — ajuster échéanciers', impact: 'Prévenir retards saisonniers', delai: 'Juin' })
  }
  if (d.length === 0) {
    d.push({ priorite: 3, titre: 'Maintenir politique actuelle', detail: 'Profil sain — pas d\'arbitrage urgent', impact: 'Stabilité PAR', delai: '—' })
  }
  return d.slice(0, 4)
}

function buildHub(secteurSlug: string, sousSlug: string): SousSecteurHub | null {
  const base = getSousSecteurBySlug(secteurSlug, sousSlug)
  if (!base) return null

  const { secteur, sous: ss } = base
  const secteurHub = getSecteurHub(secteurSlug)
  const dossiers = buildDossiers(ss, secteurSlug, sousSlug)
  const agences = buildAgences(dossiers, ss)

  const dossiersRetard = dossiers.filter(d => d.statut === 'EN_RETARD')
  const encoursRetard = dossiersRetard.reduce((s, d) => s + d.montant, 0)
  const encoursTotal = dossiers.reduce((s, d) => s + d.montant, 0)
  const renouvellements = dossiers.filter(d => d.statut === 'RENOUVELLEMENT').length
  const partReseau = Math.round((encoursTotal / RESEAU_CONSOLIDE.encours_total) * 1000) / 10

  const kpis = {
    total_dossiers: dossiers.length,
    encours_fcfa: encoursTotal,
    par_pct: ss.par,
    dossiers_en_retard: dossiersRetard.length,
    encours_en_retard_fcfa: encoursRetard,
    ticket_moyen: dossiers.length ? Math.round(encoursTotal / dossiers.length) : ss.ticket_moyen,
    taux_remboursement: ss.taux_remboursement,
    part_secteur_pct: ss.part_secteur_pct,
    part_reseau_pct: partReseau,
    renouvellements_eligibles: renouvellements + dossiers.filter(d => d.statut === 'ACTIF' && d.score_ia >= 70).length,
  }

  const memoExtra = ss.nom.toLowerCase().includes('fruits')
    ? ' Marchés Adidogomé et Lomé Centre concentrent 57 % des dossiers — saison pluies juin-août : anticiper retards sur stock périssable.'
    : ss.par > 10
      ? ' Comité crédit obligatoire pour tout nouveau décaissement.'
      : ' Profil favorable — prioriser renouvellements et cross-sell épargne.'

  return {
    secteur,
    sous: ss,
    secteur_slug: secteurSlug,
    sous_slug: sousSlug,
    synthese_memo: `${ss.nom} (${secteur.nom}) : ${kpis.total_dossiers} dossiers · ${formatFcfa(kpis.encours_fcfa)} encours · PAR ${kpis.par_pct} %. Répartition ${agences.length} agences (modèle RA + commercial + GP par agence) — ${kpis.dossiers_en_retard} en retard (${formatFcfa(kpis.encours_en_retard_fcfa)}). Chaque client : 1 commercial terrain + 1 GP de suivi.${memoExtra} ${secteurHub?.alerte_concentration ? 'Secteur parent en alerte concentration BCEAO.' : ''}`,
    kpis,
    agences,
    dossiers,
    historique_6m: buildHistorique({ ...ss, encours: encoursTotal, count: dossiers.length }),
    decisions_dg: buildDecisions(ss, secteur.nom, kpis),
    glossaire: [
      { terme: 'Ticket moyen', definition: 'Encours total / nombre de dossiers actifs du sous-secteur.' },
      { terme: 'PAR sous-secteur', definition: 'Part des encours avec échéance impayée ≥ 30 jours dans ce sous-secteur.' },
      { terme: 'Renouvellement éligible', definition: 'Client avec historique sain (score IA ≥ 70) éligible à un crédit suite sans comité.' },
      { terme: 'Binôme client', definition: 'Chaque client est suivi par 1 commercial terrain (visites, prospection) et 1 GP (échéances, relances). Le RA pilote l\'agence.' },
    ],
  }
}

const _cache = new Map<string, SousSecteurHub>()

export function getSousSecteurHub(secteurSlug: string, sousSlug: string): SousSecteurHub | null {
  const key = `v4:${secteurSlug}/${sousSlug}`
  if (!_cache.has(key)) {
    const hub = buildHub(secteurSlug, sousSlug)
    if (hub) _cache.set(key, hub)
    else return null
  }
  return _cache.get(key)!
}

export { getSecteurBySlug }
