/**
 * Transactions récentes — déterministes depuis le réseau (plus de Math.random).
 */
import { AGENCES } from './agences'
import { getMoisCourant } from './mock-time-series'
import { buildTransactionsStats } from './mock-operations-registry'

export type TypeTransaction =
  | 'DECAISSEMENT_CREDIT'
  | 'REMBOURSEMENT_CREDIT'
  | 'DEPOT_EPARGNE'
  | 'RETRAIT_EPARGNE'
  | 'TRANSFERT_INTERNE'
  | 'COMMISSION'
  | 'FRAIS_DOSSIER'

export type CanalPaiement =
  | 'MTN_MOMO'
  | 'AIRTEL_MONEY'
  | 'ORANGE_MONEY'
  | 'WAVE'
  | 'ESPECES'
  | 'CHEQUE'
  | 'VIREMENT'

export interface TransactionRecente {
  id: string
  date: string
  heure: string
  type: TypeTransaction
  canal: CanalPaiement
  montant: number
  client: string
  agence_id: string
  agent: string
  reference: string
  statut: 'REUSSIE' | 'EN_ATTENTE' | 'ECHOUEE' | 'ANNULEE'
  motif_echec?: string
}

const CLIENTS = [
  'Akossiwa Mensah', 'Yawa Dossou', 'Komi Akléssoé', 'Komlan Attivor', 'Mawuena Hotor',
  'Kafui Dewonou', 'Elinam Afetogbo', 'Ama Kpodaho', 'Abla Fiagbedzi', 'Togbui Apedo',
  'Enyonam Kpade', 'Kwami Ekpé', 'Sika Adjovi', 'Mensah Folly', 'Akouvi Senou',
  'Edem Bessan', 'Kossi Dzigbodi', 'Afi Lawson', 'Yao Tetevi', 'Adjoa Klutse',
]

const AGENTS = ['Kofi Amavi', 'Akua Lawson', 'Edem Kpélim', 'Komi Atsu', 'Ama Fiagbé']

const TYPES: TypeTransaction[] = [
  'DECAISSEMENT_CREDIT', 'REMBOURSEMENT_CREDIT', 'DEPOT_EPARGNE', 'RETRAIT_EPARGNE',
  'TRANSFERT_INTERNE', 'COMMISSION', 'FRAIS_DOSSIER',
]

const CANAUX: CanalPaiement[] = [
  'MTN_MOMO', 'AIRTEL_MONEY', 'ORANGE_MONEY', 'WAVE', 'ESPECES', 'CHEQUE', 'VIREMENT',
]

const MOTIFS_ECHEC = [
  'Solde MoMo insuffisant', 'PIN erroné', 'Réseau indisponible', 'Compte bloqué', 'Numéro invalide',
]

function montantForType(type: TypeTransaction, i: number): number {
  switch (type) {
    case 'DECAISSEMENT_CREDIT': return [150_000, 300_000, 500_000, 750_000, 1_200_000, 2_500_000][i % 6]
    case 'REMBOURSEMENT_CREDIT': return [25_000, 41_667, 50_000, 75_000, 100_000][i % 5]
    case 'DEPOT_EPARGNE': return [5_000, 10_000, 20_000, 50_000, 100_000][i % 5]
    case 'RETRAIT_EPARGNE': return [10_000, 25_000, 50_000][i % 3]
    case 'TRANSFERT_INTERNE': return [50_000, 200_000, 500_000][i % 3]
    case 'COMMISSION': return [1_500, 3_000, 5_000][i % 3]
    default: return [2_500, 5_000, 10_000][i % 3]
  }
}

/** Référence pseudo-aléatoire déterministe (seed = index) */
function refFor(i: number, canal: CanalPaiement): string {
  const n = ((i * 17_371 + 7_919) % 999_999) + 1
  return `${canal.substring(0, 3)}-${String(n).padStart(6, '0')}`
}

export function buildTransactionsRecentes(count = 60): TransactionRecente[] {
  const stats = buildTransactionsStats()
  const m = getMoisCourant()
  const tx: TransactionRecente[] = []

  for (let i = 0; i < count; i++) {
    const type = TYPES[i % TYPES.length]
    const canal = CANAUX[i % CANAUX.length]
    const agence = AGENCES[i % AGENCES.length]
    const echec = i % 13 === 0
    const heure = `${String(7 + (i % 11)).padStart(2, '0')}h${String((i * 7) % 60).padStart(2, '0')}`
    const date = i < 24 ? '21/05/2026' : i < 48 ? '20/05/2026' : '19/05/2026'

    tx.push({
      id: `TX-${String(i + 1).padStart(5, '0')}`,
      date,
      heure,
      type,
      canal,
      montant: montantForType(type, i),
      client: CLIENTS[i % CLIENTS.length],
      agence_id: agence.id,
      agent: AGENTS[i % AGENTS.length],
      reference: refFor(i, canal),
      statut: echec ? 'ECHOUEE' : (i % 17 === 0 ? 'EN_ATTENTE' : 'REUSSIE'),
      motif_echec: echec ? MOTIFS_ECHEC[i % MOTIFS_ECHEC.length] : undefined,
    })
  }

  // Ajuster le volume du jour sur le 1er lot pour cohérence stats
  if (tx.length > 0 && stats.total_jour > 0) {
    tx[0] = { ...tx[0], montant: Math.round(stats.montant_jour / Math.max(1, stats.total_jour)) }
  }

  void m
  return tx
}
