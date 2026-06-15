/** Génération déterministe des 287 comptes épargne réseau */

import { EPARGNE_STATS } from '@/lib/mockMicrofinance'
import type { CompteEpargne, CompteDormant, MouvementEpargne, ProduitEpargne, ProfilClientEpargne, TontineCycle, TypeCompteEpargne } from '@/lib/epargne-hub'

const PRENOMS = [
  'Kofi', 'Akua', 'Edem', 'Afi', 'Komi', 'Sika', 'Mensah', 'Akouvi', 'Ama', 'Koffi',
  'Efua', 'Kodjo', 'Abla', 'Yao', 'Komlan', 'Ahou', 'Kossi', 'Edoh', 'Amivi', 'Kafui',
  'Elom', 'Dzifa', 'Kossivi', 'Apelete', 'Mawuli', 'Selom', 'Kafui', 'Abla', 'Kossi', 'Edem',
]

const NOMS = [
  'Mensah', 'Lawson', 'Kpélim', 'Togbedji', 'Atsu', 'Adjovi', 'Folly', 'Senou', 'Akléssoé', 'Dossou',
  'Amavi', 'Agbeko', 'Koffi', 'Ble', 'Soglo', 'Dossou', 'Kpadenou', 'Ablo', 'Tchalla', 'Gbedemah',
]

const GROUPE_NOMS = [
  'Soleil', 'Victoire', 'Espoir', 'Harmonie', 'Progrès', 'Union', 'Étoile', 'Paix', 'Fraternité', 'Avenir',
  'Tornado', 'Phoenix', 'Baobab', 'Mango', 'Cacao', 'Ananas', 'Togoville', 'Marina', 'Plateaux', 'Agbel',
]

const COMPTES_NOMINES: CompteEpargne[] = [
  { id: 'EP-001', client: 'Sika Adjovi', numero: '373-8842-01', type: 'DAT', solde_fcfa: 1_240_000, objectif_fcfa: 1_500_000, taux_pct: 8.5, agence: 'Lomé Centre', statut: 'ACTIF', dernier_mouvement: '28/05/2026', score_ia: 94 },
  { id: 'EP-002', client: 'Groupe Soleil', numero: '373-9912-02', type: 'TONTINE', solde_fcfa: 980_000, objectif_fcfa: 1_200_000, agence: 'Lomé Centre', statut: 'ACTIF', dernier_mouvement: '27/05/2026', score_ia: 91 },
  { id: 'EP-003', client: 'Groupe Tontine Bè', numero: '373-T014', type: 'TONTINE', solde_fcfa: 890_000, objectif_fcfa: 1_200_000, agence: 'Bè Kpota', statut: 'ACTIF', dernier_mouvement: '28/05/2026', score_ia: 76 },
  { id: 'EP-004', client: 'Mensah Folly', numero: '373-7721-03', type: 'VUE', solde_fcfa: 720_000, agence: 'Adidogomé', statut: 'ACTIF', dernier_mouvement: '26/05/2026', score_ia: 88 },
  { id: 'EP-005', client: 'Akouvi Senou', numero: '373-5521-04', type: 'VUE', solde_fcfa: 540_000, agence: 'Kpalimé', statut: 'ACTIF', dernier_mouvement: '25/05/2026', score_ia: 92 },
  { id: 'EP-006', client: 'Komi Akléssoé', numero: '373-3312-05', type: 'VUE', solde_fcfa: 85_000, agence: 'Adidogomé', statut: 'DORMANT', dernier_mouvement: '15/02/2026', score_ia: 45 },
  { id: 'EP-007', client: 'Afi Togbedji', numero: '373-4412-06', type: 'BLOQUE', solde_fcfa: 420_000, objectif_fcfa: 500_000, taux_pct: 4.0, agence: 'Hédzranawoé', statut: 'ACTIF', dernier_mouvement: '28/05/2026', score_ia: 86 },
  { id: 'EP-008', client: 'Groupe Victoire', numero: '373-T022', type: 'TONTINE', solde_fcfa: 680_000, objectif_fcfa: 900_000, agence: 'Hédzranawoé', statut: 'ACTIF', dernier_mouvement: '24/05/2026', score_ia: 83 },
]

const TYPE_SLOTS: { type: TypeCompteEpargne; count: number; groupe?: boolean }[] = [
  { type: 'VUE', count: 100 },
  { type: 'DAT', count: 42 },
  { type: 'VUE', count: 60, groupe: true },
  { type: 'BLOQUE', count: 8 },
  { type: 'TONTINE', count: 47 },
  { type: 'VUE', count: 18 },
  { type: 'VUE', count: 12 },
]

function seeded(n: number, mod: number): number {
  return ((n * 9301 + 49297) % 233280) % mod
}

function soldeForIndex(i: number): number {
  const base = EPARGNE_STATS.ticket_moyen
  const spread = seeded(i, 400) * 3_500 + seeded(i + 7, 80) * 12_000
  return Math.max(15_000, Math.round((base + spread - 80_000) / 5_000) * 5_000)
}

function dateMouvement(i: number, dormant: boolean): string {
  if (dormant) {
    const parts = ['11/2025', '12/2025', '01/2026', '02/2026']
    return `${String(seeded(i, 28) + 1).padStart(2, '0')}/${parts[seeded(i, 4)]}`
  }
  const day = 28 - (seeded(i, 14))
  return `${String(Math.max(1, day)).padStart(2, '0')}/05/2026`
}

function buildClientName(i: number, groupe: boolean): string {
  if (groupe) return `Groupe ${GROUPE_NOMS[seeded(i, GROUPE_NOMS.length)]}`
  return `${PRENOMS[seeded(i, PRENOMS.length)]} ${NOMS[seeded(i + 3, NOMS.length)]}`
}

function buildTypeList(): { type: TypeCompteEpargne; groupe: boolean }[] {
  const out: { type: TypeCompteEpargne; groupe: boolean }[] = []
  for (const slot of TYPE_SLOTS) {
    for (let i = 0; i < slot.count; i++) {
      out.push({ type: slot.type, groupe: slot.groupe ?? false })
    }
  }
  return out
}

const DEFAULT_TYPE_META: { type: TypeCompteEpargne; groupe: boolean } = { type: 'VUE', groupe: false }

function resolveTypeMeta(i: number, types: { type: TypeCompteEpargne; groupe: boolean }[]) {
  if (types.length === 0) return DEFAULT_TYPE_META
  return types[i % types.length] ?? DEFAULT_TYPE_META
}

function resolveAgence(i: number, agencies: string[]): string {
  if (agencies.length === 0) return 'Lomé Centre'
  return agencies[i % agencies.length] ?? 'Lomé Centre'
}

function buildAgencyList(): string[] {
  const out: string[] = []
  for (const ag of EPARGNE_STATS.par_agence) {
    for (let i = 0; i < ag.count; i++) out.push(ag.nom)
  }
  return out
}

function buildDormantSet(): Set<number> {
  const set = new Set<number>([5])
  let n = 1
  for (let i = 0; n < EPARGNE_STATS.dormants; i++) {
    const idx = seeded(i * 17 + 3, EPARGNE_STATS.total_comptes)
    if (idx >= 8 && !set.has(idx)) {
      set.add(idx)
      n++
    }
  }
  return set
}

let _comptesCache: CompteEpargne[] | null = null

export function getAllComptesEpargne(): CompteEpargne[] {
  if (_comptesCache) return _comptesCache

  const types = buildTypeList()
  const agencies = buildAgencyList()
  const dormantSet = buildDormantSet()
  const comptes: CompteEpargne[] = []

  for (let i = 0; i < EPARGNE_STATS.total_comptes; i++) {
    if (i < COMPTES_NOMINES.length) {
      comptes.push(COMPTES_NOMINES[i])
      continue
    }
    const meta = resolveTypeMeta(i, types)
    const isDormant = dormantSet.has(i)
    const solde = soldeForIndex(i)
    comptes.push({
      id: `EP-${String(i + 1).padStart(3, '0')}`,
      client: buildClientName(i, meta.groupe || meta.type === 'TONTINE'),
      numero: `373-${String(1000 + seeded(i, 9000)).padStart(4, '0')}-${String(seeded(i + 1, 99)).padStart(2, '0')}`,
      type: meta.type,
      solde_fcfa: solde,
      objectif_fcfa: meta.type === 'DAT' || meta.type === 'TONTINE' ? Math.round(solde * 1.25 / 10_000) * 10_000 : undefined,
      taux_pct: meta.type === 'DAT' ? 8.5 : meta.type === 'BLOQUE' ? 4.0 : meta.type === 'VUE' ? 2.5 : undefined,
      agence: resolveAgence(i, agencies),
      statut: isDormant ? 'DORMANT' : 'ACTIF',
      dernier_mouvement: dateMouvement(i, isDormant),
      score_ia: isDormant ? 40 + seeded(i, 25) : 72 + seeded(i, 28),
    })
  }

  _comptesCache = comptes
  return comptes
}

export function getMouvementsEpargne(comptes: CompteEpargne[]): MouvementEpargne[] {
  const types: MouvementEpargne['type'][] = ['DEPOT', 'DEPOT', 'DEPOT', 'RETRAIT', 'INTERET', 'FRAIS']
  const canaux: MouvementEpargne['canal'][] = ['MOMO', 'MOMO', 'MOMO', 'CAISSE', 'VIREMENT']
  const actifs = comptes.filter(c => c.statut === 'ACTIF')

  const featured: MouvementEpargne[] = [
    { id: 'M1', date: '28/05/2026 09:12', compte_id: 'EP-001', client: 'Sika Adjovi', type: 'DEPOT', montant_fcfa: 150_000, solde_apres: 1_240_000, canal: 'MOMO' },
    { id: 'M2', date: '28/05/2026 08:45', compte_id: 'EP-003', client: 'Groupe Tontine Bè', type: 'DEPOT', montant_fcfa: 120_000, solde_apres: 890_000, canal: 'MOMO' },
    { id: 'M3', date: '27/05/2026 16:20', compte_id: 'EP-001', client: 'Sika Adjovi', type: 'INTERET', montant_fcfa: 8_800, solde_apres: 1_090_000, canal: 'VIREMENT' },
    { id: 'M4', date: '27/05/2026 14:05', compte_id: 'EP-004', client: 'Mensah Folly', type: 'RETRAIT', montant_fcfa: 50_000, solde_apres: 720_000, canal: 'CAISSE' },
    { id: 'M5', date: '27/05/2026 11:30', compte_id: 'EP-005', client: 'Akouvi Senou', type: 'DEPOT', montant_fcfa: 80_000, solde_apres: 540_000, canal: 'MOMO' },
    { id: 'M6', date: '26/05/2026 10:15', compte_id: 'EP-007', client: 'Afi Togbedji', type: 'DEPOT', montant_fcfa: 60_000, solde_apres: 420_000, canal: 'CAISSE' },
  ]

  const generated: MouvementEpargne[] = []
  for (let i = 0; i < 144; i++) {
    const c = actifs[seeded(i + 50, actifs.length)]
    const type = types[seeded(i, types.length)]
    const day = 28 - (i % 28)
    const hour = 8 + seeded(i, 10)
    const min = seeded(i + 2, 60)
    generated.push({
      id: `M-${String(i + 7).padStart(3, '0')}`,
      date: `${String(Math.max(1, day)).padStart(2, '0')}/05/2026 ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      compte_id: c.id,
      client: c.client,
      type,
      montant_fcfa: [5_000, 10_000, 20_000, 50_000, 80_000, 120_000][seeded(i, 6)],
      solde_apres: c.solde_fcfa,
      canal: canaux[seeded(i, canaux.length)],
    })
  }

  return [...featured, ...generated].sort((a, b) => b.date.localeCompare(a.date))
}

export function getTontinesFromComptes(comptes: CompteEpargne[]): TontineCycle[] {
  return comptes
    .filter(c => c.type === 'TONTINE')
    .map((c, i) => ({
      id: `T-${String(i + 1).padStart(3, '0')}`,
      nom: c.client,
      agence: c.agence,
      membres: 6 + seeded(i, 14),
      encours_fcfa: c.solde_fcfa,
      cycle_num: 1 + seeded(i, 12),
      statut: c.id === 'EP-003'
        ? 'CLOTURE_IMMINENTE' as const
        : seeded(i, 10) === 0
          ? 'RETARD' as const
          : 'ACTIF' as const,
      prochaine_cloture: c.id === 'EP-003' ? '02/06/2026' : `${String(Math.min(28, 5 + seeded(i, 20))).padStart(2, '0')}/07/2026`,
      collecte_pct: 65 + seeded(i, 35),
      alerte: c.id === 'EP-003' ? 'Clôture cette semaine — liquidité agence' : seeded(i, 8) === 0 ? 'Retard cotisation membres' : undefined,
    }))
}

export function getDormantsFromComptes(comptes: CompteEpargne[]): CompteDormant[] {
  return comptes
    .filter(c => c.statut === 'DORMANT')
    .map((c, i) => ({
      id: c.id,
      client: c.client,
      agence: c.agence,
      solde_fcfa: c.solde_fcfa,
      dernier_mouvement: c.dernier_mouvement,
      jours_inactif: 90 + seeded(i, 120),
      potentiel_fcfa: Math.round(c.solde_fcfa * 1.4 / 10_000) * 10_000,
      action_ia: ['WhatsApp + offre DAT 8,5 %', 'Visite agent — risque départ', 'Proposer crédit garanti 1,5× solde', 'Relance tontine', 'Campagne scolarité'][seeded(i, 5)],
    }))
}

const CATALOGUE_PRODUITS: Record<
  TypeCompteEpargne,
  Omit<ProduitEpargne, 'clients_actifs' | 'encours_fcfa'>
> = {
  VUE: {
    id: 'PR-VUE',
    nom: 'Épargne à vue',
    type: 'VUE',
    taux_annuel_pct: 2.5,
    depot_min_fcfa: 5_000,
    description: 'Compte courant : dépôts et retraits libres. Produit le plus utilisé pour la trésorerie quotidienne des clients.',
    profil_cible: 'Particuliers, commerçants, réserves de court terme',
    duree: 'Sans durée fixe',
    taux_label: '2,5 % / an',
    variantes: ['Épargne scolaire (rentrée)', 'Urgence santé'],
    croissance_pct: 7.2,
  },
  DAT: {
    id: 'PR-DAT',
    nom: 'DAT — Dépôt à terme 6 mois',
    type: 'DAT',
    taux_annuel_pct: 8.5,
    depot_min_fcfa: 100_000,
    description: 'Placement bloqué 6 mois avec rémunération attractive. Produit d\'ancrage — concentre la majorité de l\'encours réseau.',
    profil_cible: 'Clients avec capacité d\'épargne stable, objectif projet',
    duree: '6 mois (renouvelable)',
    taux_label: '8,5 % / an',
    croissance_pct: 11.4,
  },
  TONTINE: {
    id: 'PR-TONTINE',
    nom: 'Tontine solidaire',
    type: 'TONTINE',
    taux_annuel_pct: 0,
    depot_min_fcfa: 2_000,
    description: 'Épargne collective rotative par groupes. Cotisations régulières, cycle de clôture avec redistribution.',
    profil_cible: 'Groupes de femmes, associations de marché, GS',
    duree: 'Cycle 3 à 12 mois',
    taux_label: 'Rotation (sans intérêt)',
    croissance_pct: 4.8,
  },
  BLOQUE: {
    id: 'PR-BLOQUE',
    nom: 'Épargne bloquée — garantie crédit',
    type: 'BLOQUE',
    taux_annuel_pct: 4.0,
    depot_min_fcfa: 50_000,
    description: 'Solde immobilisé comme garantie d\'un microcrédit. Réduit le risque de défaut — levier sous-exploité du réseau.',
    profil_cible: 'Emprunteurs actifs souhaitant un crédit garanti (1,5× solde)',
    duree: 'Durée du prêt lié',
    taux_label: '4,0 % / an',
    croissance_pct: 9.1,
  },
}

const PROFIL_DESCRIPTIONS: Record<string, string> = {
  INDIVIDUEL: 'Comptes personnels — commerçants, salariés, artisans',
  GROUPE_FEMMES: 'Épargne collective féminine — groupes solidaires',
  TONTINE: 'Cotisation rotative en groupe',
  SCOLAIRE: 'Épargne dédiée frais scolaires (rentrée sept.)',
  SANTE: 'Réserve urgence médicale',
}

export function getCatalogueProduit(type: TypeCompteEpargne): Omit<ProduitEpargne, 'clients_actifs' | 'encours_fcfa'> {
  return CATALOGUE_PRODUITS[type]
}

export function getProduitsFromComptes(comptes: CompteEpargne[]): ProduitEpargne[] {
  const rawTotal = comptes.reduce((s, c) => s + c.solde_fcfa, 0)
  const scale = rawTotal > 0 ? EPARGNE_STATS.encours_epargne_total / rawTotal : 1
  const order: TypeCompteEpargne[] = ['DAT', 'VUE', 'TONTINE', 'BLOQUE']

  return order.map(type => {
    const subset = comptes.filter(c => c.type === type)
    const meta = CATALOGUE_PRODUITS[type]
    const encoursRaw = subset.reduce((s, c) => s + c.solde_fcfa, 0)
    return {
      ...meta,
      clients_actifs: subset.length,
      encours_fcfa: Math.round(encoursRaw * scale),
    }
  })
}

export function getProfilsClientsEpargne(): ProfilClientEpargne[] {
  return EPARGNE_STATS.par_type.map(p => ({
    id: p.type,
    label: p.label,
    comptes: p.count,
    encours_fcfa: p.encours,
    pct_encours: p.pct,
    color: p.color,
    description: PROFIL_DESCRIPTIONS[p.type] ?? '',
  }))
}
