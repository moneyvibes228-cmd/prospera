/** Génération déterministe du portefeuille crédit réseau — aligné agences Prospera */

import { AGENCES, RESEAU_CONSOLIDE } from '@/lib/agences'
import type {
  Decaissement,
  EcheancePret,
  PretActif,
  Refinancement,
  StatutPret,
} from '@/lib/core-banking-hub'

const PRENOMS = [
  'Kofi', 'Akua', 'Edem', 'Afi', 'Komi', 'Sika', 'Mensah', 'Akouvi', 'Ama', 'Koffi',
  'Efua', 'Kodjo', 'Abla', 'Yao', 'Komlan', 'Ahou', 'Kossi', 'Edoh', 'Amivi', 'Kafui',
  'Elom', 'Dzifa', 'Mawuli', 'Selom', 'Enyonam', 'Yawo', 'Kwami', 'Mawuena',
]

const NOMS = [
  'Mensah', 'Lawson', 'Kpélim', 'Togbedji', 'Atsu', 'Adjovi', 'Folly', 'Senou', 'Akléssoé', 'Dossou',
  'Amavi', 'Agbeko', 'Koffi', 'Ble', 'Soglo', 'Adjavon', 'Kpadenou', 'Ekpé', 'Hotor', 'Kpade',
]

const GROUPE_NOMS = ['Commerce', 'Solidarité', 'Progrès', 'Union', 'Espoir', 'Victoire', 'Harmonie', 'Marché']

const PRODUITS = [
  { nom: 'Crédit individuel', taux: 24, duree: 12 },
  { nom: 'Microcrédit', taux: 28, duree: 6 },
  { nom: 'Crédit groupe', taux: 22, duree: 18 },
  { nom: 'Crédit PME', taux: 24, duree: 12 },
  { nom: 'Crédit tontine', taux: 20, duree: 9 },
]

const PRETS_NOMINES: PretActif[] = [
  { id: 'P1', ref: 'DC-2912', client: 'Afi Togbedji', montant_fcfa: 1_000_000, taux_annuel_pct: 24, duree_mois: 12, statut: 'EN_COURS', solde_restant_fcfa: 640_000, prochaine_echeance: '15/06/2026', agence: 'Hédzranawoé', produit: 'Crédit PME', score_ia: 82, mensualite_fcfa: 94_000, date_decaissement: '15/03/2025', echeances_payees: 2 },
  { id: 'P2', ref: 'DC-2847', client: 'Groupe Commerce Adidogomé', montant_fcfa: 2_400_000, taux_annuel_pct: 22, duree_mois: 18, statut: 'EN_COURS', solde_restant_fcfa: 2_100_000, prochaine_echeance: '01/07/2026', agence: 'Adidogomé', produit: 'Crédit groupe', score_ia: 71, mensualite_fcfa: 148_000, date_decaissement: '01/02/2026', echeances_payees: 1 },
  { id: 'P3', ref: 'DC-2789', client: 'Kwami Ekpé', montant_fcfa: 500_000, taux_annuel_pct: 28, duree_mois: 6, statut: 'IMPAYE', solde_restant_fcfa: 185_000, prochaine_echeance: '10/05/2026', agence: 'Bè Kpota', produit: 'Microcrédit', score_ia: 22, mensualite_fcfa: 92_000, date_decaissement: '10/12/2025', echeances_payees: 3, jours_retard: 18 },
]

function seeded(n: number, mod: number): number {
  return ((n * 9301 + 49297) % 233280) % mod
}

function buildAgencyList(): string[] {
  const out: string[] = []
  for (const a of AGENCES) {
    for (let i = 0; i < a.emprunteurs_actifs; i++) out.push(a.nom_court)
  }
  return out
}

function statutForIndex(i: number): StatutPret {
  const r = seeded(i, 100)
  if (r < 72) return 'EN_COURS'
  if (r < 82) return 'DECAISSE'
  if (r < 92) return 'IMPAYE'
  return 'RESTRUCTURE'
}

function montantForIndex(i: number): number {
  const tiers = [150_000, 250_000, 400_000, 600_000, 850_000, 1_200_000, 1_800_000, 2_500_000]
  return tiers[seeded(i, tiers.length)]
}

function clientName(i: number): string {
  if (seeded(i, 5) === 0) return `Groupe ${GROUPE_NOMS[seeded(i, GROUPE_NOMS.length)]} ${['Adidogomé', 'Lomé', 'Bè', 'HZ'][seeded(i, 4)]}`
  return `${PRENOMS[seeded(i, PRENOMS.length)]} ${NOMS[seeded(i + 2, NOMS.length)]}`
}

let _pretsCache: PretActif[] | null = null

export function getAllPretsActifs(): PretActif[] {
  if (_pretsCache) return _pretsCache

  const agencies = buildAgencyList()
  const prets: PretActif[] = [...PRETS_NOMINES]

  for (let i = PRETS_NOMINES.length; i < agencies.length; i++) {
    const produit = PRODUITS[seeded(i, PRODUITS.length)]
    const montant = montantForIndex(i)
    const statut = statutForIndex(i)
    const duree = produit.duree
    const payees = statut === 'DECAISSE' ? 0 : seeded(i, Math.min(duree, 8))
    const soldeRatio = statut === 'DECAISSE' ? 1 : Math.max(0.15, 1 - payees / duree)
    const solde = Math.round(montant * soldeRatio / 10_000) * 10_000
    const mensualite = Math.round((montant / duree) * 1.12 / 5_000) * 5_000

    prets.push({
      id: `P-${String(i + 1).padStart(3, '0')}`,
      ref: `DC-${2800 + i}`,
      client: clientName(i),
      montant_fcfa: montant,
      taux_annuel_pct: produit.taux,
      duree_mois: duree,
      statut,
      solde_restant_fcfa: solde,
      prochaine_echeance: `${String(1 + seeded(i, 28)).padStart(2, '0')}/06/2026`,
      agence: agencies[i],
      produit: produit.nom,
      score_ia: statut === 'IMPAYE' ? 25 + seeded(i, 35) : statut === 'RESTRUCTURE' ? 45 + seeded(i, 25) : 65 + seeded(i, 30),
      mensualite_fcfa: mensualite,
      date_decaissement: `${String(1 + seeded(i, 28)).padStart(2, '0')}/${String(1 + seeded(i + 1, 12)).padStart(2, '0')}/2025`,
      echeances_payees: payees,
      jours_retard: statut === 'IMPAYE' ? 5 + seeded(i, 45) : undefined,
    })
  }

  _pretsCache = prets
  return prets
}

export interface EcheanceReseau extends EcheancePret {
  id: string
  ref_pret: string
  client: string
  agence: string
  jours_retard?: number
}

export function getEcheancierReseau(prets: PretActif[]): EcheanceReseau[] {
  const out: EcheanceReseau[] = []
  let idx = 0
  for (const p of prets) {
    if (p.statut === 'SOLDE') continue
    const nb = p.statut === 'IMPAYE' ? 2 : 1
    for (let n = 0; n < nb; n++) {
      const capital = Math.round(p.mensualite_fcfa * 0.82 / 5_000) * 5_000
      const interet = p.mensualite_fcfa - capital
      const statut = p.statut === 'IMPAYE' && n === 0
        ? 'IMPAYE' as const
        : p.statut === 'IMPAYE' && n === 1
          ? 'RETARD' as const
          : seeded(idx, 10) === 0
            ? 'PAYE' as const
            : 'A_VENIR' as const
      out.push({
        id: `ECH-${idx + 1}`,
        ref_pret: p.ref,
        client: p.client,
        agence: p.agence,
        numero: (p.echeances_payees ?? 0) + n + 1,
        date_echeance: p.prochaine_echeance,
        capital_fcfa: capital,
        interet_fcfa: interet,
        total_fcfa: p.mensualite_fcfa,
        statut,
        jours_retard: statut === 'IMPAYE' || statut === 'RETARD' ? p.jours_retard : undefined,
      })
      idx++
    }
  }
  return out.sort((a, b) => {
    const order = { IMPAYE: 0, RETARD: 1, A_VENIR: 2, PAYE: 3 }
    return order[a.statut] - order[b.statut]
  })
}

export function getDecaissementsReseau(prets: PretActif[]): Decaissement[] {
  const featured: Decaissement[] = [
    { id: 'D1', ref_pret: 'DC-2918', client: 'Yawo Adjavon', montant_fcfa: 800_000, date_prevue: '28/05/2026', canal: 'VIREMENT', statut: 'EN_ATTENTE', validateur: 'Kafui Agbeko (ROC)' },
    { id: 'D2', ref_pret: 'DC-2919', client: 'Groupe GS-014', montant_fcfa: 1_200_000, date_prevue: '28/05/2026', date_effective: '28/05/2026 11:32', canal: 'CAISSE', statut: 'EXECUTE', validateur: 'Yao Agbemabiawo (RA)' },
    { id: 'D3', ref_pret: 'DC-2920', client: 'Enyonam Kpade', montant_fcfa: 350_000, date_prevue: '29/05/2026', canal: 'MOMO', statut: 'EN_ATTENTE', validateur: 'Elom Adjavon (CC)' },
    { id: 'D4', ref_pret: 'DC-2921', client: 'Sika Adjovi', montant_fcfa: 650_000, date_prevue: '28/05/2026', canal: 'VIREMENT', statut: 'EN_ATTENTE', validateur: 'Kafui Agbeko (ROC)' },
    { id: 'D5', ref_pret: 'DC-2922', client: 'Groupe Marché Bè', montant_fcfa: 1_200_000, date_prevue: '28/05/2026', canal: 'CAISSE', statut: 'EN_ATTENTE', validateur: 'Kafui Agbeko (ROC)' },
  ]

  const decaisses = prets.filter(p => p.statut === 'DECAISSE').slice(0, 20)
  const generated = decaisses.map((p, i) => ({
    id: `D-${String(i + 6).padStart(3, '0')}`,
    ref_pret: p.ref,
    client: p.client,
    montant_fcfa: p.montant_fcfa,
    date_prevue: p.date_decaissement ?? '28/05/2026',
    date_effective: i % 3 === 0 ? undefined : `${p.date_decaissement ?? '27/05/2026'} 14:${10 + i}`,
    canal: (['MOMO', 'CAISSE', 'VIREMENT'] as const)[seeded(i, 3)],
    statut: i % 3 === 0 ? 'EN_ATTENTE' as const : 'EXECUTE' as const,
    validateur: ['Kafui Agbeko (ROC)', 'Yao Agbemabiawo (RA)', 'Elom Adjavon (CC)'][seeded(i, 3)],
  }))

  return [...featured, ...generated].sort((a, b) => {
    if (a.statut === 'EN_ATTENTE' && b.statut !== 'EN_ATTENTE') return -1
    if (b.statut === 'EN_ATTENTE' && a.statut !== 'EN_ATTENTE') return 1
    return b.date_prevue.localeCompare(a.date_prevue)
  })
}

export function getRefinancementsReseau(prets: PretActif[]): Refinancement[] {
  const featured: Refinancement[] = [
    { id: 'RF-008', ref_pret_initial: 'DC-2789', client: 'Komi Akléssoé', montant_initial_fcfa: 500_000, montant_refinance_fcfa: 420_000, economie_mensuelle_fcfa: 18_000, statut: 'ETUDE', motif_ia: 'Allongement 12 mois + taux 22 % — probabilité remboursement +34 %', agence: 'Adidogomé' },
    { id: 'RF-007', ref_pret_initial: 'DC-2650', client: 'Mawuena Hotor', montant_initial_fcfa: 300_000, montant_refinance_fcfa: 280_000, economie_mensuelle_fcfa: 12_000, statut: 'APPROUVE', motif_ia: 'Historique MoMo stable 18 mois', agence: 'Lomé Centre' },
  ]

  const cibles = prets.filter(p => p.statut === 'IMPAYE' || p.statut === 'RESTRUCTURE').slice(0, 6)
  const generated = cibles.map((p, i) => ({
    id: `RF-${String(i + 9).padStart(3, '0')}`,
    ref_pret_initial: p.ref,
    client: p.client,
    montant_initial_fcfa: p.solde_restant_fcfa,
    montant_refinance_fcfa: Math.round(p.solde_restant_fcfa * 0.88 / 10_000) * 10_000,
    economie_mensuelle_fcfa: 8_000 + seeded(i, 15) * 2_000,
    statut: (['ETUDE', 'APPROUVE', 'REJETE'] as const)[seeded(i, 3)],
    motif_ia: p.statut === 'IMPAYE'
      ? `Retard ${p.jours_retard ?? 12}j — restructuration recommandée IA (conf. ${72 + seeded(i, 20)} %)`
      : 'Allègement mensualité — client historique acceptable',
    agence: p.agence,
  }))

  return [...featured, ...generated]
}

export function computeKpis(prets: PretActif[], decaissements: Decaissement[], echeances: EcheanceReseau[]) {
  const enAttente = decaissements.filter(d => d.statut === 'EN_ATTENTE')
  const echeancesJour = echeances
    .filter(e => e.statut === 'A_VENIR' || e.statut === 'IMPAYE')
    .slice(0, 12)
    .reduce((s, e) => s + e.total_fcfa, 0)

  return {
    encours_credit_fcfa: RESEAU_CONSOLIDE.encours_total,
    decaissements_jour_fcfa: decaissements
      .filter(d => d.statut === 'EXECUTE' && d.date_effective?.includes('28/05'))
      .reduce((s, d) => s + d.montant_fcfa, 0) || 6_800_000,
    decaissements_en_attente: enAttente.length,
    echeances_jour_fcfa: echeancesJour || 1_840_000,
    taux_remboursement_pct: RESEAU_CONSOLIDE.taux_remb_moyen,
    refinancement_en_cours: prets.filter(p => p.statut === 'RESTRUCTURE').length + 3,
    total_prets: prets.length,
  }
}
