/** Génération trésorerie réseau — liquidité opérationnelle IMF (≠ comptes épargne clients) */

import { AGENCES, AGENCES_DATA, RESEAU_CONSOLIDE } from '@/lib/agences'
import { getDecaissementsReseau, getAllPretsActifs } from '@/lib/core-banking-registry'
import type {
  ClotureJournaliere,
  FluxCaisse,
  PositionTresorerieAgence,
  RapprochementMomo,
  TransactionMomoNonRapprochee,
  VirementInterAgence,
} from '@/lib/caisse-hub'

function seeded(n: number, mod: number): number {
  return ((n * 9301 + 49297) % 233280) % mod
}

function splitLiquidite(total: number) {
  const caisse = Math.round(total * 0.45 / 10_000) * 10_000
  const momo = total - caisse
  const mixx = Math.round(momo * 0.62 / 5_000) * 5_000
  return { caisse_physique_fcfa: caisse, momo_mixx_fcfa: mixx, momo_flooz_fcfa: momo - mixx }
}

export function buildPositionsTresorerie(): PositionTresorerieAgence[] {
  return AGENCES.map((a, i) => {
    const detail = AGENCES_DATA[a.id]
    const liq = detail?.kpis.liquidite_disponible ?? Math.round(RESEAU_CONSOLIDE.liquidite_totale / AGENCES.length)
    const reserve = detail?.kpis.reserv_obligatoire ?? 300_000
    const split = splitLiquidite(liq)
    const total = liq
    const ratio = reserve > 0 ? Number(((total / reserve) * 100).toFixed(0)) : 100
    let statut: PositionTresorerieAgence['statut'] = 'OK'
    if (total < reserve * 1.2) statut = 'TENSION'
    if (a.nom_court === 'Bè Kpota' && total < reserve * 1.5) statut = 'CRITIQUE'

    return {
      agence_id: a.id,
      agence: a.nom_court,
      responsable: a.responsable,
      ...split,
      total_disponible_fcfa: total,
      reserve_obligatoire_fcfa: reserve,
      ratio_couverture_pct: ratio,
      statut,
      encours_credit_fcfa: a.encours_fcfa,
      decaissements_prevus_jour_fcfa: a.nom_court === 'Bè Kpota' ? 1_200_000 : seeded(i, 3) === 0 ? 800_000 : 0,
    }
  })
}

const FLUX_TYPES: FluxCaisse['type'][] = [
  'DECAISSEMENT', 'REMBOURSEMENT', 'VIREMENT_INTER_AGENCE', 'APPROVISIONNEMENT',
  'FRAIS_GESTION', 'RETRAIT_EPARGNE', 'DEPOT_EPARGNE',
]

const CANAUX: FluxCaisse['canal'][] = ['ESPECES', 'MOMO_MIXX', 'MOMO_FLOOZ', 'VIREMENT', 'CHEQUE']

const AGENTS = ['Kofi Amavi', 'Akua Lawson', 'Edem Kpélim', 'Komi Atsu', 'Ama Fiagbé', 'Yao Agbemabiawo', 'Mawunya Kpodzo']

function buildFluxJour(): FluxCaisse[] {
  const prets = getAllPretsActifs()
  const decaissements = getDecaissementsReseau(prets)
  const flux: FluxCaisse[] = []

  flux.push(
    { id: 'FX-VIR882-OUT', date: '28/05/2026', heure: '08:15', type: 'VIREMENT_INTER_AGENCE', canal: 'VIREMENT', libelle: 'Approvisionnement Bè Kpota ← Lomé Centre', montant_fcfa: 500_000, agence: 'Lomé Centre', agent: 'Kofi Amavi', piece: 'VIR-882', rapproche: true, sens: 'SORTIE' },
    { id: 'FX-VIR882-IN', date: '28/05/2026', heure: '08:22', type: 'VIREMENT_INTER_AGENCE', canal: 'VIREMENT', libelle: 'Réception virement inter-agence — Lomé Centre', montant_fcfa: 500_000, agence: 'Bè Kpota', agent: 'Edem Kpélim', piece: 'VIR-882', rapproche: true, sens: 'ENTREE' },
  )

  let idx = 0

  for (const d of decaissements.filter(x => x.statut === 'EXECUTE').slice(0, 8)) {
    const h = 8 + seeded(idx, 8)
    const m = seeded(idx + 1, 60)
    flux.push({
      id: `FX-${String(++idx).padStart(4, '0')}`,
      date: '28/05/2026',
      heure: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      type: 'DECAISSEMENT',
      canal: d.canal === 'MOMO' ? 'MOMO_MIXX' : d.canal === 'CAISSE' ? 'ESPECES' : 'VIREMENT',
      libelle: `Décaissement crédit ${d.ref_pret} — ${d.client}`,
      montant_fcfa: d.montant_fcfa,
      agence: prets.find(p => p.ref === d.ref_pret)?.agence ?? 'Lomé Centre',
      agent: d.validateur.split(' (')[0],
      piece: d.ref_pret,
      rapproche: d.canal !== 'MOMO',
      sens: 'SORTIE',
    })
  }

  const impayes = prets.filter(p => p.statut === 'IMPAYE' || p.statut === 'EN_COURS').slice(0, 35)
  for (const p of impayes) {
    if (seeded(idx, 3) !== 0) { idx++; continue }
    const h = 9 + seeded(idx, 7)
    const m = seeded(idx + 2, 60)
    const viaMomo = seeded(idx, 5) < 3
    flux.push({
      id: `FX-${String(++idx).padStart(4, '0')}`,
      date: '28/05/2026',
      heure: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      type: 'REMBOURSEMENT',
      canal: viaMomo ? (seeded(idx, 2) === 0 ? 'MOMO_MIXX' : 'MOMO_FLOOZ') : 'ESPECES',
      libelle: `Remboursement échéance — ${p.client}`,
      montant_fcfa: p.mensualite_fcfa,
      agence: p.agence,
      agent: AGENTS[seeded(idx, AGENTS.length)],
      piece: p.ref,
      rapproche: !viaMomo || seeded(idx, 4) !== 0,
      sens: 'ENTREE',
    })
  }

  for (let i = 0; i < 12; i++) {
    const agence = AGENCES[seeded(i + 100, AGENCES.length)].nom_court
    const isDepot = seeded(i, 2) === 0
    flux.push({
      id: `FX-E${String(i + 1).padStart(3, '0')}`,
      date: '28/05/2026',
      heure: `${String(10 + seeded(i, 6)).padStart(2, '0')}:${String(seeded(i + 3, 60)).padStart(2, '0')}`,
      type: isDepot ? 'DEPOT_EPARGNE' : 'RETRAIT_EPARGNE',
      canal: seeded(i, 3) === 0 ? 'ESPECES' : 'MOMO_MIXX',
      libelle: isDepot ? `Encaissement guichet épargne — client ${8800 + i}` : `Décaissement guichet épargne — client ${7700 + i}`,
      montant_fcfa: [25_000, 50_000, 75_000, 100_000, 150_000][seeded(i, 5)],
      agence,
      agent: AGENTS[seeded(i, AGENTS.length)],
      rapproche: seeded(i, 4) !== 0,
      sens: isDepot ? 'ENTREE' : 'SORTIE',
    })
  }

  return flux.sort((a, b) => `${a.date} ${a.heure}`.localeCompare(`${b.date} ${b.heure}`))
}

function buildClotures(): ClotureJournaliere[] {
  const positions = buildPositionsTresorerie()
  const statuts: Record<string, ClotureJournaliere['statut']> = {
    'Lomé Centre': 'VALIDEE',
    'Adidogomé': 'VALIDEE',
    'Bè Kpota': 'ECART',
    'Hédzranawoé': 'OUVERTE',
    'Kpalimé': 'VALIDEE',
  }
  const ecarts: Record<string, number> = {
    'Bè Kpota': 42_000,
    'Hédzranawoé': 0,
  }

  return positions.map((p, i) => {
    const theorique = p.caisse_physique_fcfa
    const ecart = ecarts[p.agence] ?? 0
    const physique = theorique - ecart
    return {
      id: `CL-${String(i + 1).padStart(2, '0')}`,
      date: '28/05/2026',
      agence: p.agence,
      agence_id: p.agence_id,
      solde_theorique_fcfa: theorique,
      solde_physique_fcfa: physique,
      ecart_fcfa: ecart,
      statut: statuts[p.agence] ?? 'OUVERTE',
      validateur: statuts[p.agence] === 'VALIDEE' ? AGENTS[i % AGENTS.length] : undefined,
      heure_cloture: statuts[p.agence] === 'VALIDEE' ? '18:00' : statuts[p.agence] === 'ECART' ? '17:52' : undefined,
      nb_operations_jour: 8 + seeded(i, 15),
    }
  })
}

const TRANSACTIONS_MOMO: TransactionMomoNonRapprochee[] = [
  { id: 'MOMO-8821', ref_externe: 'MIXX-448821901', date: '27/05/2026', heure: '16:42', montant_fcfa: 5_000, libelle: 'Remboursement Afi Togbedji', agence: 'Hédzranawoé', statut: 'NON_LETTRE' },
  { id: 'MOMO-8824', ref_externe: 'MIXX-448824332', date: '27/05/2026', heure: '17:08', montant_fcfa: 4_500, libelle: 'Dépôt épargne Akossiwa Mensah', agence: 'Bè Kpota', statut: 'NON_LETTRE' },
  { id: 'MOMO-8829', ref_externe: 'MIXX-448829117', date: '27/05/2026', heure: '18:31', montant_fcfa: 2_500, libelle: 'Remboursement Kwami Ekpé', agence: 'Bè Kpota', statut: 'NON_LETTRE' },
]

function buildRapprochements(): RapprochementMomo[] {
  const positions = buildPositionsTresorerie()
  const mixxTotal = positions.reduce((s, p) => s + p.momo_mixx_fcfa, 0)
  const floozTotal = positions.reduce((s, p) => s + p.momo_flooz_fcfa, 0)

  return [
    {
      id: 'RPM-1',
      operateur: 'MIXX',
      date: '28/05/2026',
      solde_plateforme_fcfa: mixxTotal + 12_000,
      solde_compta_fcfa: mixxTotal,
      ecart_fcfa: 12_000,
      transactions_non_rapprochees: TRANSACTIONS_MOMO.length,
      statut: 'ECART',
      suggestion_ia: 'Lettrer 3 opérations J-1 — refs MOMO-8821, 8824, 8829 (total 12 000 FCFA)',
      derniere_sync: '28/05/2026 06:00',
    },
    {
      id: 'RPM-2',
      operateur: 'FLOOZ',
      date: '28/05/2026',
      solde_plateforme_fcfa: floozTotal,
      solde_compta_fcfa: floozTotal,
      ecart_fcfa: 0,
      transactions_non_rapprochees: 0,
      statut: 'OK',
      suggestion_ia: 'Rapprochement conforme — dernière sync 06:00',
      derniere_sync: '28/05/2026 06:00',
    },
  ]
}

const VIREMENTS: VirementInterAgence[] = [
  { id: 'VIR-882', date: '28/05/2026', emetteur: 'Lomé Centre', beneficiaire: 'Bè Kpota', montant_fcfa: 500_000, motif: 'Approvisionnement caisse — tension liquidité', statut: 'EXECUTE', validateur: 'Kodjo Mensah (DG)' },
]

let _cache: ReturnType<typeof buildAll> | null = null

function buildAll() {
  const positions = buildPositionsTresorerie()
  const flux = buildFluxJour()
  const clotures = buildClotures()
  const rapprochements = buildRapprochements()

  const entrees = flux.filter(f => f.sens === 'ENTREE').reduce((s, f) => s + f.montant_fcfa, 0)
  const sorties = flux.filter(f => f.sens === 'SORTIE').reduce((s, f) => s + f.montant_fcfa, 0)
  const caissePhysique = positions.reduce((s, p) => s + p.caisse_physique_fcfa, 0)
  const reserveTotal = positions.reduce((s, p) => s + p.reserve_obligatoire_fcfa, 0)
  const liquiditeTotal = RESEAU_CONSOLIDE.liquidite_totale

  return {
    positions,
    flux,
    clotures,
    rapprochements,
    transactions_momo: TRANSACTIONS_MOMO,
    virements: VIREMENTS,
    kpis: {
      liquidite_totale_fcfa: liquiditeTotal,
      caisse_physique_fcfa: caissePhysique,
      float_momo_fcfa: positions.reduce((s, p) => s + p.momo_mixx_fcfa + p.momo_flooz_fcfa, 0),
      entrees_jour_fcfa: entrees,
      sorties_jour_fcfa: sorties,
      ecart_cloture_fcfa: clotures.reduce((s, c) => s + Math.abs(c.ecart_fcfa), 0),
      momo_ecart_fcfa: rapprochements.reduce((s, r) => s + Math.abs(r.ecart_fcfa), 0),
      agences_non_cloturees: clotures.filter(c => c.statut === 'OUVERTE' || c.statut === 'ECART').length,
      ratio_liquidite_pct: Math.round((liquiditeTotal / reserveTotal) * 100),
      agences_en_tension: positions.filter(p => p.statut !== 'OK').length,
    },
    synthese_ia: `Trésorerie réseau ${(liquiditeTotal / 1_000_000).toFixed(1)} M FCFA — Bè Kpota en tension (ratio ${positions.find(p => p.agence === 'Bè Kpota')?.ratio_couverture_pct} %). 2 agences non clôturées (Bè Kpota écart +42 k, Hédzranawoé ouverte). Mixx By Yas : écart +12 k (3 opérations J-1). Virement inter-agence 500 k exécuté ce matin. Clôturer Hédzranawoé avant 18h.`,
  }
}

export function getCaisseRegistry() {
  if (!_cache) _cache = buildAll()
  return _cache
}
