// Clients & demandes crédit créés en session (mode démo)

import type { Borrower, BorrowerStatus, User } from '@/types'
import { COLL_AGENT } from '@/lib/collecte-agent-hub'

const CLIENTS_KEY = 'prospera_clients_collecte'
const DEMANDES_KEY = 'prospera_demandes_credit'

export interface NouveauClientInput {
  nom: string
  telephone: string
  zone: string
  activite: string
  adresse: string
  type_client: 'CLIENT' | 'TONTINE' | 'PROSPECT'
}

export interface DemandeCreditInput {
  clientId: string
  clientNom: string
  produit: string
  montant: number
  duree_mois: number
  objet: string
}

export interface DemandeCreditSession extends DemandeCreditInput {
  id: string
  reference: string
  statut: 'SOUMIS' | 'EN_ANALYSE'
  date: string
  agent: string
}

function agentUser(): User {
  return {
    id: COLL_AGENT.id,
    nom: COLL_AGENT.nom,
    email: 'e.kpelim@imf-togo.com',
    role: 'COLLECTRICE',
    zone: COLL_AGENT.zone,
    actif: true,
    createdAt: '2025-01-01',
  }
}

export function getSessionClients(): Borrower[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CLIENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSessionClient(input: NouveauClientInput): Borrower {
  const id = `new-${Date.now()}`
  const client: Borrower = {
    id,
    nom: input.nom,
    telephone: input.telephone,
    score_ia: 0,
    score_tendance: 'STABLE',
    montant_credit: 0,
    montant_rembourse: 0,
    statut: input.type_client === 'PROSPECT' ? 'EVALUATION' : 'INSTRUCTION',
    retard_jours: 0,
    agent: agentUser(),
    lat: 6.131,
    lng: 1.220,
    zone: input.zone,
    derniere_visite: null,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  const existing = getSessionClients()
  localStorage.setItem(CLIENTS_KEY, JSON.stringify([client, ...existing]))
  localStorage.setItem(`prospera_client_meta_${id}`, JSON.stringify({
    activite: input.activite,
    adresse: input.adresse,
    type_client: input.type_client,
  }))
  return client
}

export function getClientMeta(id: string): { activite?: string; adresse?: string; type_client?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`prospera_client_meta_${id}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getSessionClient(id: string): Borrower | null {
  return getSessionClients().find(c => c.id === id) ?? null
}

export function saveDemandeCredit(input: DemandeCreditInput): DemandeCreditSession {
  const demande: DemandeCreditSession = {
    ...input,
    id: `dc-${Date.now()}`,
    reference: `DOS-${Math.floor(1000 + Math.random() * 9000)}`,
    statut: 'SOUMIS',
    date: new Date().toLocaleDateString('fr-FR'),
    agent: COLL_AGENT.nom,
  }
  const existing = getDemandesCredit()
  localStorage.setItem(DEMANDES_KEY, JSON.stringify([demande, ...existing]))
  return demande
}

export function getDemandesCredit(clientId?: string): DemandeCreditSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DEMANDES_KEY)
    const all: DemandeCreditSession[] = raw ? JSON.parse(raw) : []
    return clientId ? all.filter(d => d.clientId === clientId) : all
  } catch {
    return []
  }
}

export function statutLabel(s: BorrowerStatus): string {
  const map: Record<BorrowerStatus, string> = {
    REMBOURSEMENT: 'En cours',
    RETARD: 'En retard',
    DEFAUT: 'Défaut',
    RESTRUCTURE: 'Restructuré',
    EVALUATION: 'Prospect',
    INSTRUCTION: 'Nouveau client',
  }
  return map[s] ?? s
}
