/**
 * Résolution des fiches client — dossiers secteurs / sous-secteurs / risque
 * Complète CLIENTS_RISQUE_DETAILS (dec-vue360) pour /dashboard/credit/clients/[id]
 */

import { getAffectationClientAgence, getAgenceIdByNomCourt } from '@/lib/agences'
import type { ClientRisqueDetail, PaiementRecent } from '@/lib/dec-vue360'
import { SECTEURS_DETAIL } from '@/lib/dg-vue360'
import { buildEmprunteursReseau } from '@/lib/emprunteurs-builder'
import { deriveEncoursFromRetard, nbImpayesFromRetard } from '@/lib/credit-echeancier-builder'
import { REGISTRE_CLIENTS_RISQUE, type ClientRisqueSeed } from '@/lib/mock-risque-registry'
import { getSousSecteurHub, type DossierSousSecteur } from '@/lib/sous-secteur-hub'
import { getSecteurHub, type DossierSecteurRisque } from '@/lib/secteur-hub'
import type { Borrower } from '@/types'

const MOIS = ['Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai']

function seededPhone(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const prefix = 90 + (h % 8)
  const rest = String(h % 10_000_000).padStart(7, '0')
  return `+228 ${prefix} ${rest.slice(0, 2)} ${rest.slice(2, 4)} ${rest.slice(4, 6)}`
}

function cleanAgentName(agent: string): string {
  return agent.replace(/\s*\((COM|GP|RA)\)\s*$/, '').trim()
}

function classeBceao(joursRetard: number): string {
  if (joursRetard >= 90) return 'CONTENTIEUX'
  if (joursRetard >= 60) return 'DOUTEUX'
  if (joursRetard >= 30) return 'SOUS_SURVEILLANCE'
  return 'NORMAL'
}

function scoreEvolution(score: number): ClientRisqueDetail['score_evolution'] {
  return MOIS.map((mois, i) => ({
    mois,
    score: Math.min(99, Math.max(20, score + (5 - i) * 2)),
  }))
}

function buildPaiements(joursRetard: number, mensualite: number): PaiementRecent[] {
  if (joursRetard === 0) {
    return [{ date: '15/05/2026', montant: mensualite, type: 'REMBOURSEMENT', canal: 'Mixx By Yas' }]
  }
  if (joursRetard < 30) {
    return [{ date: '20/04/2026', montant: Math.round(mensualite * 0.5), type: 'PARTIEL', canal: 'Flooz' }]
  }
  return [
    { date: '18/03/2026', montant: 0, type: 'MANQUE', canal: '—' },
    { date: '18/02/2026', montant: mensualite, type: 'REMBOURSEMENT', canal: 'Espèces' },
  ]
}

function baseClient(
  id: string,
  nom: string,
  agence: string,
  agent: string,
  secteur: string,
  activite: string,
  encours: number,
  scoreIa: number,
  joursRetard: number,
  action: string,
  pdPct?: number,
  elFcfa?: number,
  equipe?: {
    agence_id?: string
    responsable_agence?: string
    agent_commercial?: string
    agent_gp?: string
  },
): ClientRisqueDetail {
  const agenceId = equipe?.agence_id ?? getAgenceIdByNomCourt(agence) ?? ''
  const aff = equipe?.agent_commercial && equipe?.agent_gp
    ? equipe
    : agenceId ? getAffectationClientAgence(agenceId, id) : undefined
  const commercial = equipe?.agent_commercial ?? aff?.agent_commercial ?? cleanAgentName(agent)
  const gp = equipe?.agent_gp ?? aff?.agent_gp ?? '—'
  const ra = equipe?.responsable_agence ?? aff?.responsable_agence ?? '—'
  const pd = pdPct ?? (scoreIa < 45 ? 58 : scoreIa < 55 ? 47 : scoreIa < 65 ? 35 : 18)
  const el = elFcfa ?? Math.round(encours * pd / 100)
  const mensualite = Math.max(25_000, Math.round(encours / 12))
  const enRetard = joursRetard > 0

  return {
    id,
    nom,
    telephone: seededPhone(id),
    agence,
    agence_id: agenceId,
    agent: commercial,
    agent_commercial: commercial,
    agent_gp: gp,
    responsable_agence: ra,
    activite,
    secteur,
    localite: `${agence}`,
    encours,
    score_ia: scoreIa,
    pd_pct: pd,
    el,
    jours_retard: joursRetard,
    action,
    classe_bceao: classeBceao(joursRetard),
    mensualite,
    echeances_impayees: enRetard ? nbImpayesFromRetard(joursRetard) : 0,
    dernier_contact: enRetard ? `Retard J+${joursRetard}` : 'Mai 2026 — à jour',
    score_evolution: scoreEvolution(scoreIa),
    credits: [{
      reference: `CR-2025-${id.replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
      montant: encours,
      encours,
      statut: enRetard ? 'EN_RETARD' : 'ACTIF',
      date_decaissement: '08/2025',
    }],
    paiements_recents: buildPaiements(joursRetard, mensualite),
    visites: enRetard
      ? [{ date: '22/05/2026', agent: commercial, statut: 'POSITIVE', commentaire: 'Visite terrain — activité confirmée' }]
      : [],
    alertes_ia: enRetard
      ? [{ severite: joursRetard >= 60 ? 'HAUTE' : 'MOYENNE', message: `Retard J+${joursRetard} — relance GP ${gp}`, action, date: '23/05/2026' }]
      : [{ severite: 'INFO', message: 'Profil sain — suivi standard', action: 'Maintenir relation', date: '20/05/2026' }],
    analyse_dec: enRetard
      ? `Retard J+${joursRetard} — ${action}. Commercial ${commercial} (terrain) · GP ${gp} (suivi crédit) · RA ${ra} (pilotage). Score IA ${scoreIa} %.`
      : `Profil courant — binôme ${commercial} / ${gp} sous ${ra}. Score IA ${scoreIa} %. Pas d'arbitrage urgent.`,
  }
}

function fromDossierSousSecteur(d: DossierSousSecteur, secteurNom: string, sousSecteurNom: string): ClientRisqueDetail {
  const action = d.statut === 'EN_RETARD'
    ? 'Plan recouvrement sous-secteur'
    : d.statut === 'RENOUVELLEMENT'
      ? 'Renouvellement éligible'
      : 'Suivi courant'

  const detail = baseClient(
    d.id,
    d.client,
    d.agence,
    d.agent_commercial,
    secteurNom,
    `${sousSecteurNom} — ${secteurNom}`,
    d.montant,
    d.score_ia,
    d.jours_retard,
    action,
    undefined,
    undefined,
    {
      agence_id: d.agence_id,
      responsable_agence: d.responsable_agence,
      agent_commercial: d.agent_commercial,
      agent_gp: d.agent_gp,
    },
  )

  const statutCredit = d.statut === 'EN_RETARD' ? 'EN_RETARD' as const : 'ACTIF'
  const dateDec = detail.credits[0]!.date_decaissement
  const encoursEffectif = d.statut === 'EN_RETARD'
    ? deriveEncoursFromRetard(d.montant, dateDec, d.jours_retard)
    : d.montant
  const nbImpayes = d.jours_retard > 0 ? nbImpayesFromRetard(d.jours_retard) : 0

  return {
    ...detail,
    encours: encoursEffectif,
    echeances_impayees: nbImpayes,
    action: d.statut === 'EN_RETARD'
      ? `Recouvrement sous-secteur — ${d.derniere_echeance}`
      : detail.action,
    dernier_contact: d.statut === 'EN_RETARD' ? d.derniere_echeance : detail.dernier_contact,
    credits: [{
      ...detail.credits[0]!,
      montant: d.montant,
      encours: encoursEffectif,
      statut: statutCredit,
    }],
  }
}

function fromDossierSecteur(d: DossierSecteurRisque, secteurNom: string): ClientRisqueDetail {
  return baseClient(
    d.id,
    d.client,
    d.agence,
    d.agent,
    secteurNom,
    `${d.sous_secteur} — ${secteurNom}`,
    d.montant,
    Math.max(35, 70 - Math.floor(d.jours_retard / 3)),
    d.jours_retard,
    d.action,
  )
}

function fromRisqueSeed(c: ClientRisqueSeed): ClientRisqueDetail {
  return baseClient(
    c.id,
    c.nom,
    c.agence,
    c.agent,
    'Commerce',
    'Activité commerciale',
    c.encours,
    c.score_ia,
    c.jours_retard,
    c.action,
    c.pd_pct,
    c.el,
  )
}

function buildPortefeuilleGenerique(id: string, num: number): ClientRisqueDetail {
  return baseClient(
    id,
    `Client portefeuille ${num - 8799}`,
    'Lomé Centre',
    'Agent terrain',
    'Commerce',
    'Activité locale',
    450_000 + (num % 7) * 80_000,
    62 - (num % 5) * 4,
    num % 3 === 0 ? 18 + (num % 4) * 8 : 0,
    num % 3 === 0 ? 'Relance terrain' : 'Suivi courant',
  )
}

function fromEmprunteur(b: Borrower): ClientRisqueDetail {
  const [y, m] = (b.createdAt ?? '2025-06-01').split('-')
  const dateDec = `${m}/${y}`
  const encours = b.retard_jours > 0
    ? deriveEncoursFromRetard(b.montant_credit, dateDec, b.retard_jours)
    : Math.max(b.montant_credit - b.montant_rembourse, 0)
  const action = b.retard_jours > 30
    ? 'Escalade recouvrement'
    : b.retard_jours > 0
      ? 'Relance GP / commercial terrain'
      : 'Suivi courant'

  const detail = baseClient(
    b.id,
    b.nom,
    b.zone,
    b.agent.nom,
    'Commerce',
    'Activité commerciale',
    encours,
    b.score_ia,
    b.retard_jours,
    action,
  )

  const mensualite = Math.max(25_000, Math.round(b.montant_credit / 9))

  return {
    ...detail,
    mensualite,
    encours,
    echeances_impayees: b.retard_jours > 0 ? nbImpayesFromRetard(b.retard_jours) : 0,
    credits: [{
      ...detail.credits[0]!,
      montant: b.montant_credit,
      encours,
      date_decaissement: dateDec,
    }],
  }
}

let _index: Map<string, ClientRisqueDetail> | null = null

function buildIndex(): Map<string, ClientRisqueDetail> {
  const map = new Map<string, ClientRisqueDetail>()

  for (const secteur of SECTEURS_DETAIL) {
    for (const ss of secteur.sous_secteurs_detail) {
      const hub = getSousSecteurHub(secteur.slug, ss.slug)
      if (!hub) continue
      for (const d of hub.dossiers) {
        map.set(d.id, fromDossierSousSecteur(d, secteur.nom, ss.nom))
      }
    }

    const secteurHub = getSecteurHub(secteur.slug)
    if (secteurHub) {
      for (const d of secteurHub.dossiers_risque) {
        if (!map.has(d.id)) {
          map.set(d.id, fromDossierSecteur(d, secteur.nom))
        }
      }
    }
  }

  for (const c of REGISTRE_CLIENTS_RISQUE) {
    if (!map.has(c.id)) {
      map.set(c.id, fromRisqueSeed(c))
    }
  }

  return map
}

function getIndex(): Map<string, ClientRisqueDetail> {
  if (!_index) _index = buildIndex()
  return _index
}

/** Clients générés (secteurs, sous-secteurs, risque, portefeuille agent) — hors dec-vue360 statique */
export function resolveClientRisqueDynamic(id: string): ClientRisqueDetail | undefined {
  const fromIndex = getIndex().get(id)
  if (fromIndex) return fromIndex

  const m = id.match(/^CL-(\d+)$/)
  if (m && Number(m[1]) >= 8800) {
    return buildPortefeuilleGenerique(id, Number(m[1]))
  }

  const borrower = buildEmprunteursReseau().find(b => b.id === id)
  if (borrower) return fromEmprunteur(borrower)

  return undefined
}

/** Invalide le cache (tests / hot reload / changement IDs sous-secteurs) */
export function resetClientRisqueDynamicIndex(): void {
  _index = null
}
