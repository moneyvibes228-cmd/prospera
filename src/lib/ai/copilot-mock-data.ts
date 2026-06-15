/**
 * Index et accès aux sources mock (source de vérité démo).
 */
import type { UserRole } from '@/types'
import type { Objectif } from '@/lib/types'
import { DOSSIERS_ANALYSE_CC, MOCK_DAF_HOME } from '@/lib/mockMicrofinance'
import {
  MOCK_COMMERCIAL,
  MOCK_CREDIT_RISQUE,
  MOCK_GESTIONNAIRE,
  MOCK_AGENT_TERRAIN,
  MOCK_FINANCES,
  MOCK_MARKETING,
  MOCK_MANAGER,
  OBJECTIFS_AGENT_TERRAIN,
  OBJECTIFS_GESTIONNAIRE,
  OBJECTIFS_COMMERCIAL,
  OBJECTIFS_CREDIT_RISQUE,
  OBJECTIFS_FINANCES,
  OBJECTIFS_MARKETING,
  OBJECTIFS_AUDITEUR,
} from '@/lib/mockDataByRole'
import {
  REGISTRE_CLIENTS_RISQUE,
  REGISTRE_DOSSIERS_BLOQUES,
  REGISTRE_AGENT_ACTIVITE,
} from '@/lib/mock-risque-registry'
import { getClientRisqueById, getAllClientsRisque, getDossierBloqueById } from '@/lib/dec-vue360'
import { getFicheClientMicrofinance } from '@/lib/fiche-client-microfinance'
import { mockListDossiersCredit, mockGetDossierCredit } from '@/lib/credit-mock-workflow'
import { getRaHubData } from '@/lib/ra-agence-hub'
import { getRccHubData } from '@/lib/rcc-commercial-hub'
import { getGpHubData } from '@/lib/gp-portefeuille-hub'
import { getMoisCourant } from '@/lib/mock-time-series'
import { AGENCES, RESEAU_CONSOLIDE, type Agence } from '@/lib/agences'

export type EntityKind = 'client' | 'dossier' | 'dossier_bloque' | 'agent'

export interface ResolvedEntity {
  kind: EntityKind
  id: string
  label: string
  /** Nom client ou référence dossier */
  displayName: string
}

function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
}

function fmtFcfa(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`
  return String(n)
}

/** Objectifs coach IA par rôle */
export function getObjectifsForRole(role: UserRole): Objectif[] {
  const map: Partial<Record<UserRole, Objectif[]>> = {
    GESTIONNAIRE_PORTEFEUILLE: OBJECTIFS_GESTIONNAIRE,
    GESTIONNAIRE: OBJECTIFS_GESTIONNAIRE,
    AGENT_TERRAIN: OBJECTIFS_AGENT_TERRAIN,
    COLLECTRICE: OBJECTIFS_AGENT_TERRAIN,
    COMMERCIAL: OBJECTIFS_COMMERCIAL,
    CREDIT: OBJECTIFS_CREDIT_RISQUE,
    RISQUE: OBJECTIFS_CREDIT_RISQUE,
    RESPONSABLE_CREDIT: OBJECTIFS_CREDIT_RISQUE,
    RELANCE: OBJECTIFS_FINANCES,
    COMPTABLE: OBJECTIFS_FINANCES,
    PAIE: OBJECTIFS_FINANCES,
    COMMUNICATION: OBJECTIFS_MARKETING,
    AUDITEUR: OBJECTIFS_AUDITEUR,
  }
  return map[role] ?? []
}

/** Objectifs / KPIs du jour synthétiques pour rôles sans panel Objectifs */
export function getDailyTargetsForRole(role: UserRole): {
  label: string
  actuel: number | string
  cible: number | string
  unite: string
  pct: number
  statut: string
  detail?: string
}[] {
  const m = getMoisCourant()
  switch (role) {
    case 'MANAGER': {
      const k = MOCK_MANAGER.kpis
      return [
        {
          label: 'Objectifs équipe réseau',
          actuel: k.objectifs_equipe_pct,
          cible: 85,
          unite: '%',
          pct: Math.round((k.objectifs_equipe_pct / 85) * 100),
          statut: k.objectifs_equipe_pct >= 85 ? 'EN_AVANCE' : 'EN_RETARD',
          detail: `${k.alertes_critiques} alertes critiques actives`,
        },
        {
          label: 'Collecte réseau',
          actuel: k.collecte_mois,
          cible: k.collecte_objectif,
          unite: ' FCFA',
          pct: Math.round((k.collecte_mois / k.collecte_objectif) * 100),
          statut: k.collecte_mois >= k.collecte_objectif ? 'EN_AVANCE' : 'EN_RETARD',
        },
        {
          label: 'PAR 30 réseau',
          actuel: k.par_30j,
          cible: 8,
          unite: '%',
          pct: k.par_30j <= 8 ? 100 : Math.round((8 / k.par_30j) * 100),
          statut: k.par_30j <= 8 ? 'DANS_LES_TEMPS' : 'EN_RETARD',
          detail: 'Objectif fin juin < 8 %',
        },
      ]
    }
    case 'GESTIONNAIRE': {
      const ra = getRaHubData()
      const agents = ra.agents_terrain ?? []
      const collecteJour = agents.reduce((s: number, a: { collecte_jour?: number }) => s + (a.collecte_jour ?? 0), 0)
      const objectifJour = agents.reduce((s: number, a: { objectif_jour?: number }) => s + (a.objectif_jour ?? 0), 0)
      const sousPerf = agents.filter((a: { statut?: string }) => a.statut === 'DEGRADE').length
      return [
        {
          label: `Collecte agence ${ra.agence.nom}`,
          actuel: collecteJour,
          cible: objectifJour || 1,
          unite: ' FCFA',
          pct: objectifJour ? Math.round((collecteJour / objectifJour) * 100) : 0,
          statut: collecteJour >= objectifJour * 0.9 ? 'DANS_LES_TEMPS' : 'EN_RETARD',
        },
        {
          label: 'Agents terrain actifs',
          actuel: agents.filter((a: { actif?: boolean }) => a.actif).length,
          cible: agents.length,
          unite: '',
          pct: agents.length ? Math.round((agents.filter((a: { actif?: boolean }) => a.actif).length / agents.length) * 100) : 0,
          statut: sousPerf > 0 ? 'EN_RETARD' : 'DANS_LES_TEMPS',
          detail: sousPerf > 0 ? `${sousPerf} agent(s) en dégradation` : undefined,
        },
        {
          label: 'PAR agence',
          actuel: ra.kpis_credit?.par_30_pct ?? m.par_30,
          cible: 8.6,
          unite: '%',
          pct: 93,
          statut: 'DANS_LES_TEMPS',
        },
      ]
    }
    case 'RESPONSABLE_COMMERCIAL': {
      const zones = getRccHubData().zones ?? []
      const collecteJour = zones.reduce((s, z) => s + z.collecte_jour, 0)
      const objectifJour = zones.reduce((s, z) => s + z.objectif_jour, 0)
      return [
        {
          label: 'Collecte réseau jour',
          actuel: collecteJour,
          cible: objectifJour || 1,
          unite: ' FCFA',
          pct: objectifJour ? Math.round((collecteJour / objectifJour) * 100) : 82,
          statut: collecteJour >= objectifJour * 0.82 ? 'DANS_LES_TEMPS' : 'EN_RETARD',
          detail: 'Source : zones contrôlées RCC',
        },
        {
          label: 'Signatures mois',
          actuel: Math.round(RESEAU_CONSOLIDE.taux_conversion_reseau),
          cible: 40,
          unite: '% conv.',
          pct: Math.round((RESEAU_CONSOLIDE.taux_conversion_reseau / 40) * 100),
          statut: 'EN_AVANCE',
        },
      ]
    }
    case 'DAF': {
      const suspens = MOCK_DAF_HOME.comptabilite.suspens_comptables.find(s => s.statut === 'CRITIQUE')
      const note = suspens?.note ?? 'Comptes attente'
      return [
        {
          label: 'Clôture mai',
          actuel: `J-${MOCK_DAF_HOME.comptabilite.cloture_dans_jours}`,
          cible: 0,
          unite: ' j',
          pct: Math.round((1 - MOCK_DAF_HOME.comptabilite.cloture_dans_jours / 10) * 100),
          statut: MOCK_DAF_HOME.comptabilite.ecritures_attente > 0 ? 'EN_RETARD' : 'DANS_LES_TEMPS',
          detail: `${MOCK_DAF_HOME.comptabilite.ecritures_attente} écritures · ${MOCK_DAF_HOME.comptabilite.rapprochements_a_finaliser} rapproch. à finaliser`,
        },
        {
          label: suspens?.compte ?? 'Suspens',
          actuel: suspens ? fmtFcfa(suspens.solde) : '0',
          cible: 0,
          unite: ' FCFA',
          pct: 40,
          statut: 'CRITIQUE',
          detail: note.length > 55 ? `${note.slice(0, 52)}…` : note,
        },
      ]
    }
    default:
      return []
  }
}

const REF_PATTERN = /\b((?:DOS|DC|CL)[- ]?\d{4}(?:[-/]\d{2,4})?)\b/gi

export function extractReferences(question: string): string[] {
  const refs: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(REF_PATTERN.source, 'gi')
  while ((m = re.exec(question)) !== null) {
    refs.push(m[1]!.replace(/\s+/g, '-').toUpperCase())
  }
  return [...new Set(refs)]
}

interface NameEntry {
  kind: EntityKind
  id: string
  names: string[]
  displayName: string
}

function buildNameIndex(): NameEntry[] {
  const entries: NameEntry[] = []

  for (const c of getAllClientsRisque()) {
    entries.push({
      kind: 'client',
      id: c.id,
      names: [normalizeText(c.nom)],
      displayName: c.nom,
    })
  }

  for (const c of MOCK_GESTIONNAIRE.clients_portefeuille) {
    entries.push({
      kind: 'client',
      id: c.id,
      names: [normalizeText(c.nom)],
      displayName: c.nom,
    })
  }

  for (const c of MOCK_AGENT_TERRAIN.clients_en_retard) {
    entries.push({
      kind: 'client',
      id: c.id,
      names: [normalizeText(c.nom)],
      displayName: c.nom,
    })
  }

  for (const d of DOSSIERS_ANALYSE_CC) {
    const full = `${d.client.prenom} ${d.client.nom}`
    entries.push({
      kind: 'dossier',
      id: d.dossier_id,
      names: [normalizeText(full), normalizeText(d.reference_dossier)],
      displayName: d.reference_dossier,
    })
  }

  for (const d of REGISTRE_DOSSIERS_BLOQUES) {
    entries.push({
      kind: 'dossier_bloque',
      id: d.id,
      names: [normalizeText(d.client), normalizeText(d.id)],
      displayName: d.id,
    })
  }

  for (const d of MOCK_CREDIT_RISQUE.dossiers_requierent_action) {
    entries.push({
      kind: 'dossier',
      id: d.id,
      names: [normalizeText(d.nom)],
      displayName: d.nom,
    })
  }

  for (const a of REGISTRE_AGENT_ACTIVITE) {
    entries.push({
      kind: 'agent',
      id: a.agent,
      names: [normalizeText(a.agent)],
      displayName: a.agent,
    })
  }

  for (const a of MOCK_COMMERCIAL.classement_equipe) {
    entries.push({
      kind: 'agent',
      id: a.nom,
      names: [normalizeText(a.nom)],
      displayName: a.nom,
    })
  }

  return entries
}

let nameIndexCache: NameEntry[] | null = null

function getNameIndex(): NameEntry[] {
  if (!nameIndexCache) nameIndexCache = buildNameIndex()
  return nameIndexCache
}

export function resolveEntitiesFromQuestion(question: string): ResolvedEntity[] {
  const nq = normalizeText(question)
  const found: ResolvedEntity[] = []
  const seen = new Set<string>()

  for (const ref of extractReferences(question)) {
    const key = `ref:${ref}`
    if (seen.has(key)) continue
    seen.add(key)
    const dossier = DOSSIERS_ANALYSE_CC.find(
      d => d.dossier_id === ref || d.reference_dossier === ref,
    )
    if (dossier) {
      found.push({
        kind: 'dossier',
        id: dossier.dossier_id,
        label: dossier.reference_dossier,
        displayName: `${dossier.client.prenom} ${dossier.client.nom}`,
      })
      continue
    }
    const bloque = REGISTRE_DOSSIERS_BLOQUES.find(d => d.id === ref)
    if (bloque) {
      found.push({ kind: 'dossier_bloque', id: bloque.id, label: bloque.id, displayName: bloque.client })
      continue
    }
    const client = getClientRisqueById(ref)
    if (client) {
      found.push({ kind: 'client', id: client.id, label: client.id, displayName: client.nom })
    }
  }

  for (const entry of getNameIndex()) {
    for (const name of entry.names) {
      if (name.length < 4) continue
      if (nq.includes(name)) {
        const key = `${entry.kind}:${entry.id}`
        if (!seen.has(key)) {
          seen.add(key)
          found.push({
            kind: entry.kind,
            id: entry.id,
            label: entry.id,
            displayName: entry.displayName,
          })
        }
        break
      }
    }
  }

  return found
}

export function getDossierRapportCc(id: string) {
  return DOSSIERS_ANALYSE_CC.find(d => d.dossier_id === id || d.reference_dossier === id)
}

export function getGpClientByName(nom: string) {
  const n = normalizeText(nom)
  return MOCK_GESTIONNAIRE.clients_portefeuille.find(c => normalizeText(c.nom).includes(n) || n.includes(normalizeText(c.nom)))
}

/** 1 ou 2 agences ciblées dans la question — sinon compare la plus forte vs la plus faible */
export function resolveAgencesFromQuestion(question: string): Agence[] {
  const n = normalizeText(question)
  const matched = AGENCES.filter(
    a =>
      n.includes(normalizeText(a.nom_court)) ||
      n.includes(normalizeText(a.nom)) ||
      n.includes(normalizeText(a.ville)),
  )
  if (matched.length >= 2) {
    return [...matched].sort((a, b) => b.par_courant - a.par_courant)
  }
  if (matched.length === 1) {
    const peer = [...AGENCES]
      .filter(a => a.id !== matched[0]!.id)
      .sort((a, b) => a.par_courant - b.par_courant)[0]
    return [matched[0]!, peer ?? AGENCES[0]!].sort((a, b) => b.par_courant - a.par_courant)
  }
  const sorted = [...AGENCES].sort((a, b) => b.par_courant - a.par_courant)
  return [sorted[0]!, sorted[sorted.length - 1]!]
}

export { fmtFcfa, normalizeText, getRaHubData, getRccHubData, getGpHubData, mockListDossiersCredit, mockGetDossierCredit, getClientRisqueById, getFicheClientMicrofinance, getDossierBloqueById, REGISTRE_CLIENTS_RISQUE, REGISTRE_DOSSIERS_BLOQUES, MOCK_COMMERCIAL, MOCK_CREDIT_RISQUE, MOCK_GESTIONNAIRE, MOCK_AGENT_TERRAIN, MOCK_FINANCES, MOCK_MARKETING, MOCK_MANAGER, MOCK_DAF_HOME, AGENCES, RESEAU_CONSOLIDE }
