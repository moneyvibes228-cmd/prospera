import { AGENCES, AGENCES_DATA, type Agence, type AgenceDetaillee } from './agences'

export interface MembreEquipeSynthese {
  nom: string
  role: 'RA' | 'COM' | 'GP'
  score: number
  evolution: string
}

export interface EvolutionAgence6M {
  par: string
  collecte: string
  remboursement: string
  encours: string
}

export interface SyntheseAgenceIA {
  agence_id: string
  nom: string
  statut_bceao: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME'
  score_sante: number
  tendance: 'POSITIF' | 'STABLE' | 'ALERTE'
  resume: string
  clients_actifs?: number
  responsable?: string
  equipe?: MembreEquipeSynthese[]
  evolution_6m?: EvolutionAgence6M
}

function fmtPct(n: number): string {
  return `${n.toFixed(1).replace('.', ',')} %`
}

function fmtPt(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1).replace('.', ',')} pt`
}

function fmtFcfaShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

function roleFromLabel(role?: string): 'RA' | 'COM' | 'GP' {
  const r = (role ?? '').toLowerCase()
  if (r.includes('resp') || r.includes('agence')) return 'RA'
  if (r === 'gp' || r.includes('gp')) return 'GP'
  return 'COM'
}

function collectePct(agence: Agence): number {
  return Math.round((agence.collecte_mois / agence.collecte_objectif) * 100)
}

function agentEvolutionNote(
  agent: AgenceDetaillee['agents_performance'][number],
  role: 'RA' | 'COM' | 'GP',
  parAgence: number,
): string {
  if (role === 'RA') {
    return `Pilotage · ${agent.visites} visite terrain · PAR agence ${fmtPct(parAgence)} · score ${agent.score}/100`
  }
  const base = `${agent.visites} visites · PAR zone ${fmtPct(agent.par)} · rec. ${agent.recouvrement} %`
  if (role === 'COM' && agent.score < 60) return `${base} · alerte recouvrement`
  if (role === 'COM' && agent.score >= 85) return `${base} · bon niveau`
  if (role === 'GP' && agent.par >= 10) return `${base} · PAR suivi élevé`
  if (role === 'GP' && agent.par <= 6) return `${base} · suivi maîtrisé`
  return base
}

function buildEvolution6M(agenceId: string, parCourant: number, encours: number): EvolutionAgence6M {
  const detail = AGENCES_DATA[agenceId]
  const hist = detail?.par_historique ?? []
  const agence = AGENCES.find(a => a.id === agenceId)
  const collPct = agence ? collectePct(agence) : 0

  let par = `PAR actuel ${fmtPct(parCourant)}`
  let remboursement = agence ? `Remb. ${fmtPct(agence.taux_remboursement)}` : '—'

  if (hist.length >= 2) {
    const first = hist[0]
    const last = hist[hist.length - 1]
    const parDelta = last.par_30j - first.par_30j
    const rembDelta = last.remboursement - first.remboursement
    const parTrend = parDelta < -0.3 ? 'en baisse' : parDelta > 0.3 ? 'en hausse' : 'stable'
    par = `PAR ${fmtPct(first.par_30j)} → ${fmtPct(last.par_30j)} (${fmtPt(parDelta)}, ${parTrend})`
    remboursement = `Remb. ${fmtPct(first.remboursement)} → ${fmtPct(last.remboursement)} (${fmtPt(rembDelta)} sur 5 mois)`
  }

  const forecast = detail?.forecast?.[0]
  const collecte =
    forecast && agence
      ? `Collecte ${collPct} % objectif mai · prévu juin ${fmtFcfaShort(forecast.collecte_prevue)} FCFA`
      : `Collecte ${collPct} % de l'objectif mensuel`

  return { par, collecte, remboursement, encours: `Encours ${fmtFcfaShort(encours)} FCFA` }
}

function inferTendance(
  parCourant: number,
  statut: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME',
  hist: Array<{ par_30j: number }>,
): 'POSITIF' | 'STABLE' | 'ALERTE' {
  if (statut === 'NON_CONFORME' || parCourant >= 10) return 'ALERTE'
  if (statut === 'ATTENTION' || parCourant >= 9) return 'ALERTE'
  if (hist.length >= 2) {
    const delta = hist[hist.length - 1].par_30j - hist[0].par_30j
    if (delta <= -2 && parCourant <= 7) return 'POSITIF'
    if (delta <= -1.5) return 'POSITIF'
  }
  if (parCourant <= 5) return 'POSITIF'
  return 'STABLE'
}

/** Verdict rédigé à partir des KPIs agence (même source que les cartes dashboard) */
export function buildResumeAgence(agence: Agence, detail: AgenceDetaillee): string {
  const coll = collectePct(agence)
  const hist = detail.par_historique
  const parDelta = hist.length >= 2 ? hist[hist.length - 1].par_30j - hist[0].par_30j : 0
  const statut = detail.conformite_bceao.statut
  const { ra, commerciaux, gps } = (() => {
    const c: string[] = []
    const g: string[] = []
    let r = agence.responsable
    for (const a of detail.agents_performance) {
      const role = roleFromLabel(a.role)
      if (role === 'RA') r = a.agent
      else if (role === 'COM') c.push(a.agent)
      else if (role === 'GP') g.push(a.agent)
    }
    return { ra: r, commerciaux: c, gps: g }
  })()

  const equipeStr =
    commerciaux.length > 0
      ? `${ra} (RA), ${commerciaux.join(', ')} (commercial${commerciaux.length > 1 ? 'aux' : ''}), ${gps.join(', ')} (GP)`
      : `${ra} (RA), ${gps.join(', ')} (GP)`

  const parts: string[] = []

  parts.push(
    `${agence.nom_court} : ${agence.emprunteurs_actifs} clients, encours ${fmtFcfaShort(agence.encours_fcfa)} FCFA, score santé ${detail.kpis.score_sante}/100.`,
  )

  parts.push(
    `PAR ${fmtPct(agence.par_courant)}, remboursement ${fmtPct(agence.taux_remboursement)}, collecte à ${coll} % de l'objectif.`,
  )

  if (hist.length >= 2 && Math.abs(parDelta) >= 0.3) {
    parts.push(
      parDelta < 0
        ? `Le PAR progresse depuis janvier (${fmtPt(parDelta)} sur 5 mois).`
        : `Le PAR se dégrade depuis janvier (${fmtPt(parDelta)} sur 5 mois).`,
    )
  }

  parts.push(`Équipe : ${equipeStr}.`)

  if (statut === 'NON_CONFORME') {
    parts.push(`Statut BCEAO non conforme — plan de redressement urgent requis.`)
  } else if (statut === 'ATTENTION') {
    parts.push(`Statut BCEAO en attention — marge de ${fmtPt(10 - agence.par_courant)} avant le seuil de 10 %.`)
  }

  const comFaible = detail.agents_performance.filter(
    a => roleFromLabel(a.role) === 'COM' && a.recouvrement < 70,
  )
  if (comFaible.length > 0) {
    parts.push(
      `Point d'attention : ${comFaible.map(a => `${a.agent} (${a.recouvrement} % recouvrement)`).join(', ')}.`,
    )
  }

  const grp = detail.repartition_produits.find(p => p.produit.toLowerCase().includes('groupe'))
  if (grp && grp.par >= 10) {
    parts.push(`Crédit groupe à ${fmtPct(grp.par)} — à traiter en priorité.`)
  }

  if (coll < 70 && statut !== 'NON_CONFORME') {
    parts.push(`Collecte insuffisante malgré un PAR maîtrisé — revoir les objectifs ou l'exécution terrain.`)
  }

  return parts.join(' ')
}

/** Synthèses DG par agence — dérivées de agences.ts */
export function buildSyntheseAgencesDG(): SyntheseAgenceIA[] {
  return AGENCES.map(agence => {
    const detail = AGENCES_DATA[agence.id]
    if (!detail) {
      return {
        agence_id: agence.id,
        nom: agence.nom_court,
        statut_bceao: 'CONFORME' as const,
        score_sante: 0,
        tendance: 'STABLE' as const,
        resume: '',
      }
    }

    const conf = detail.conformite_bceao.statut
    const hist = detail.par_historique

    const equipe: MembreEquipeSynthese[] = detail.agents_performance.map(a => {
      const role = roleFromLabel(a.role)
      return {
        nom: a.agent,
        role,
        score: a.score,
        evolution: agentEvolutionNote(a, role, agence.par_courant),
      }
    })

    return {
      agence_id: agence.id,
      nom: agence.nom_court,
      statut_bceao: conf,
      score_sante: detail.kpis.score_sante,
      tendance: inferTendance(agence.par_courant, conf, hist),
      clients_actifs: agence.emprunteurs_actifs,
      responsable: equipe.find(e => e.role === 'RA')?.nom ?? agence.responsable,
      equipe,
      evolution_6m: buildEvolution6M(agence.id, agence.par_courant, agence.encours_fcfa),
      resume: buildResumeAgence(agence, detail),
    }
  })
}
