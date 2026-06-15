/** Caisse & trésorerie réseau — liquidité opérationnelle IMF (≠ épargne clients) */

import { AGENCES } from '@/lib/agences'
import { getCaisseRegistry } from '@/lib/caisse-registry'

export type TypeFluxCaisse =
  | 'DECAISSEMENT'
  | 'REMBOURSEMENT'
  | 'VIREMENT_INTER_AGENCE'
  | 'APPROVISIONNEMENT'
  | 'FRAIS_GESTION'
  | 'RETRAIT_EPARGNE'
  | 'DEPOT_EPARGNE'

export type CanalCaisse = 'ESPECES' | 'MOMO_MIXX' | 'MOMO_FLOOZ' | 'VIREMENT' | 'CHEQUE'

/** @deprecated alias */
export type TypeMouvementCaisse = TypeFluxCaisse

export interface FluxCaisse {
  id: string
  date: string
  heure: string
  type: TypeFluxCaisse
  canal: CanalCaisse
  libelle: string
  montant_fcfa: number
  agence: string
  agent: string
  piece?: string
  rapproche: boolean
  sens: 'ENTREE' | 'SORTIE'
}

/** @deprecated alias */
export type MouvementCaisse = FluxCaisse

export interface PositionTresorerieAgence {
  agence_id: string
  agence: string
  responsable: string
  caisse_physique_fcfa: number
  momo_mixx_fcfa: number
  momo_flooz_fcfa: number
  total_disponible_fcfa: number
  reserve_obligatoire_fcfa: number
  ratio_couverture_pct: number
  statut: 'OK' | 'TENSION' | 'CRITIQUE'
  encours_credit_fcfa: number
  decaissements_prevus_jour_fcfa: number
}

export interface ClotureJournaliere {
  id: string
  date: string
  agence: string
  agence_id: string
  solde_theorique_fcfa: number
  solde_physique_fcfa: number
  ecart_fcfa: number
  statut: 'OUVERTE' | 'VALIDEE' | 'ECART'
  validateur?: string
  heure_cloture?: string
  nb_operations_jour: number
}

export interface TransactionMomoNonRapprochee {
  id: string
  ref_externe: string
  date: string
  heure: string
  montant_fcfa: number
  libelle: string
  agence: string
  statut: 'NON_LETTRE' | 'EN_COURS' | 'LETTRE'
}

export interface RapprochementMomo {
  id: string
  operateur: 'MIXX' | 'FLOOZ'
  date: string
  solde_plateforme_fcfa: number
  solde_compta_fcfa: number
  ecart_fcfa: number
  transactions_non_rapprochees: number
  statut: 'OK' | 'ECART' | 'EN_COURS'
  suggestion_ia: string
  derniere_sync: string
}

export interface VirementInterAgence {
  id: string
  date: string
  emetteur: string
  beneficiaire: string
  montant_fcfa: number
  motif: string
  statut: 'EXECUTE' | 'EN_ATTENTE' | 'ANNULE'
  validateur: string
}

export interface CaisseHub {
  synthese_ia: string
  kpis: {
    liquidite_totale_fcfa: number
    caisse_physique_fcfa: number
    float_momo_fcfa: number
    entrees_jour_fcfa: number
    sorties_jour_fcfa: number
    ecart_cloture_fcfa: number
    momo_ecart_fcfa: number
    agences_non_cloturees: number
    ratio_liquidite_pct: number
    agences_en_tension: number
  }
  positions: PositionTresorerieAgence[]
  flux: FluxCaisse[]
  /** @deprecated use flux */
  mouvements: FluxCaisse[]
  clotures: ClotureJournaliere[]
  rapprochements_momo: RapprochementMomo[]
  transactions_momo: TransactionMomoNonRapprochee[]
  virements: VirementInterAgence[]
  glossaire: Array<{ terme: string; definition: string }>
}

export const CAISSE_HUB: CaisseHub = buildHub()

function buildHub(): CaisseHub {
  const reg = getCaisseRegistry()
  return {
    synthese_ia: reg.synthese_ia,
    kpis: reg.kpis,
    positions: reg.positions,
    flux: reg.flux,
    mouvements: reg.flux,
    clotures: reg.clotures,
    rapprochements_momo: reg.rapprochements,
    transactions_momo: reg.transactions_momo,
    virements: reg.virements,
    glossaire: [
      {
        terme: 'Trésorerie vs Épargne',
        definition: 'Cette page suit la liquidité de l\'IMF (caisse physique, float Mixx By Yas & Flooz) pour opérer. L\'épargne réseau (/epargne) suit les comptes clients et leurs soldes.',
      },
      {
        terme: 'Liquidité disponible',
        definition: 'Somme caisse physique + float Mobile Money (Mixx By Yas + Flooz). Alignée sur les 11,1 M FCFA du réseau consolidé.',
      },
      {
        terme: 'Réserve obligatoire',
        definition: 'Seuil minimum BCEAO par agence. Un ratio < 120 % déclenche une alerte tension.',
      },
      {
        terme: 'Clôture journalière',
        definition: 'Comptage physique de la caisse en fin de journée. Écart = différence théorique / réel.',
      },
      {
        terme: 'Rapprochement MoMo',
        definition: 'Conciliation solde plateforme Mixx By Yas / Flooz vs comptabilité Prospera. Écarts = transactions non lettrées.',
      },
    ],
  }
}

export function getCaisseHub(): CaisseHub {
  return CAISSE_HUB
}

function resolveAgenceNom(agenceId: string): string {
  return AGENCES.find(a => a.id === agenceId)?.nom_court ?? agenceId
}

/** Vue RA / GP — caisse d'une seule agence (pas la trésorerie réseau DAF) */
export function getCaisseHubForAgence(agenceId: string): CaisseHub {
  const base = getCaisseHub()
  const agenceNom = resolveAgenceNom(agenceId)

  const positions = base.positions.filter(
    p => p.agence_id === agenceId || p.agence === agenceNom,
  )
  const pos = positions[0]
  if (!pos) return { ...base, positions: [], flux: [], mouvements: [], clotures: [], transactions_momo: [], virements: [], kpis: { ...base.kpis, liquidite_totale_fcfa: 0, agences_non_cloturees: 0, agences_en_tension: 0 } }

  const flux = base.flux.filter(f => f.agence === agenceNom)
  const clotures = base.clotures.filter(c => c.agence_id === agenceId || c.agence === agenceNom)
  const transactions_momo = base.transactions_momo.filter(t => t.agence === agenceNom)
  const virements = base.virements.filter(
    v => v.emetteur === agenceNom || v.beneficiaire === agenceNom,
  )

  const entrees = flux.filter(f => f.sens === 'ENTREE').reduce((s, f) => s + f.montant_fcfa, 0)
  const sorties = flux.filter(f => f.sens === 'SORTIE').reduce((s, f) => s + f.montant_fcfa, 0)
  const cloture = clotures[0]
  const momoEcart = transactions_momo
    .filter(t => t.statut === 'NON_LETTRE')
    .reduce((s, t) => s + t.montant_fcfa, 0)

  const rapprochements_momo: RapprochementMomo[] = [
    {
      id: `RPM-${agenceId}-MIXX`,
      operateur: 'MIXX',
      date: '28/05/2026',
      solde_plateforme_fcfa: pos.momo_mixx_fcfa + momoEcart,
      solde_compta_fcfa: pos.momo_mixx_fcfa,
      ecart_fcfa: momoEcart,
      transactions_non_rapprochees: transactions_momo.length,
      statut: momoEcart > 0 ? 'ECART' : 'OK',
      suggestion_ia: momoEcart > 0
        ? `Lettrer ${transactions_momo.length} opération(s) Mixx By Yas non rapprochée(s) — ${(momoEcart / 1000).toFixed(0)} k FCFA`
        : 'Rapprochement Mixx By Yas conforme pour l\'agence',
      derniere_sync: '28/05/2026 06:00',
    },
    {
      id: `RPM-${agenceId}-FLOOZ`,
      operateur: 'FLOOZ',
      date: '28/05/2026',
      solde_plateforme_fcfa: pos.momo_flooz_fcfa,
      solde_compta_fcfa: pos.momo_flooz_fcfa,
      ecart_fcfa: 0,
      transactions_non_rapprochees: 0,
      statut: 'OK',
      suggestion_ia: 'Flooz — aucun écart sur le périmètre agence',
      derniere_sync: '28/05/2026 06:00',
    },
  ]

  const liquidite = pos.total_disponible_fcfa
  const ratio = pos.reserve_obligatoire_fcfa > 0
    ? Math.round((liquidite / pos.reserve_obligatoire_fcfa) * 100)
    : 100

  const synthese_ia = cloture?.statut === 'ECART'
    ? `Caisse ${agenceNom} : liquidité ${(liquidite / 1_000_000).toFixed(1)} M FCFA (ratio couverture ${pos.ratio_couverture_pct} %). Clôture J-1 avec écart ${formatK(cloture.ecart_fcfa)} FCFA — investigation requise. ${pos.decaissements_prevus_jour_fcfa > 0 ? `Décaissements prévus : ${formatK(pos.decaissements_prevus_jour_fcfa)} FCFA.` : ''} Flux net jour : ${entrees >= sorties ? '+' : ''}${formatK(entrees - sorties)} FCFA.`
    : cloture?.statut === 'OUVERTE'
      ? `Caisse ${agenceNom} : ${(liquidite / 1_000_000).toFixed(1)} M FCFA disponibles. Clôture du jour en cours — valider le comptage physique avant 18h. Entrées ${formatK(entrees)} · sorties ${formatK(sorties)} FCFA.`
      : `Caisse ${agenceNom} : liquidité ${(liquidite / 1_000_000).toFixed(1)} M FCFA · couverture ${pos.ratio_couverture_pct} %. Clôture J-1 validée. ${virements.length ? `Virement inter-agence ${formatK(virements[0].montant_fcfa)} FCFA ${virements[0].statut === 'EXECUTE' ? 'exécuté' : 'en attente'}.` : 'Aucun virement inter-agence aujourd\'hui.'}`

  return {
    ...base,
    synthese_ia,
    kpis: {
      liquidite_totale_fcfa: liquidite,
      caisse_physique_fcfa: pos.caisse_physique_fcfa,
      float_momo_fcfa: pos.momo_mixx_fcfa + pos.momo_flooz_fcfa,
      entrees_jour_fcfa: entrees,
      sorties_jour_fcfa: sorties,
      ecart_cloture_fcfa: Math.abs(cloture?.ecart_fcfa ?? 0),
      momo_ecart_fcfa: momoEcart,
      agences_non_cloturees: cloture && (cloture.statut === 'OUVERTE' || cloture.statut === 'ECART') ? 1 : 0,
      ratio_liquidite_pct: ratio,
      agences_en_tension: pos.statut !== 'OK' ? 1 : 0,
    },
    positions,
    flux,
    mouvements: flux,
    clotures,
    rapprochements_momo,
    transactions_momo,
    virements,
    glossaire: base.glossaire.map(g =>
      g.terme === 'Liquidité disponible'
        ? { ...g, definition: `Somme caisse physique + float MoMo de l'agence ${agenceNom} uniquement.` }
        : g.terme === 'Trésorerie vs Épargne'
          ? { ...g, definition: 'Liquidité opérationnelle de votre agence (guichet + MoMo). Les comptes épargne clients sont sur /epargne.' }
          : g,
    ),
  }
}

function formatK(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M` : `${Math.round(n / 1000)} k`
}
