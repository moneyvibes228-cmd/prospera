/**
 * Opérations / transactions / épargne / cash — dérivés du réseau et registres contrôle.
 */
import { AGENCES, RESEAU_CONSOLIDE } from './agences'
import {
  getMoisCourant,
  RESEAU_MENSUEL,
  variationMoM,
} from './mock-time-series'
import {
  REGISTRE_TRANSACTIONS_SUSPECTES,
  buildComptesDormants,
} from './mock-controle-interne-registry'

const TX_FACTOR = 54.7

function distributeByEncours(total: number): number[] {
  const weights = AGENCES.map(a => a.encours_fcfa)
  const sum = weights.reduce((s, w) => s + w, 0)
  const raw = weights.map(w => Math.round((w / sum) * total))
  const diff = total - raw.reduce((s, n) => s + n, 0)
  if (diff !== 0) raw[0] += diff
  return raw
}

function distributeMontants(total: number): number[] {
  const weights = AGENCES.map(a => a.collecte_mois)
  const sum = weights.reduce((s, w) => s + w, 0)
  const raw = weights.map(w => Math.round((w / sum) * total))
  const diff = total - raw.reduce((s, n) => s + n, 0)
  if (diff !== 0) raw[0] += diff
  return raw
}

export function buildTransactionsStats() {
  const m = getMoisCourant()
  const totalMois = Math.round(m.decaissements * TX_FACTOR)
  const montantMois = Math.round(m.collecte_fcfa * 8.2)
  const totalJour = Math.round(totalMois / 30)
  const montantJour = Math.round(montantMois / 30)
  const countsAgence = distributeByEncours(totalMois)
  const montantsAgence = distributeMontants(montantMois)

  const parType = {
    DECAISSEMENT_CREDIT: { count: Math.round(totalMois * 0.025), montant: RESEAU_CONSOLIDE.montant_decaisse_mois, pct: 20.2 },
    REMBOURSEMENT_CREDIT: { count: Math.round(totalMois * 0.578), montant: Math.round(montantMois * 0.529), pct: 52.9 },
    DEPOT_EPARGNE: { count: Math.round(totalMois * 0.278), montant: Math.round(montantMois * 0.151), pct: 15.1 },
    RETRAIT_EPARGNE: { count: Math.round(totalMois * 0.066), montant: Math.round(montantMois * 0.056), pct: 5.6 },
    TRANSFERT_INTERNE: { count: Math.round(totalMois * 0.017), montant: Math.round(montantMois * 0.035), pct: 3.5 },
    COMMISSION: { count: Math.round(totalMois * 0.025), montant: Math.round(montantMois * 0.007), pct: 0.7 },
    FRAIS_DOSSIER: { count: Math.round(totalMois * 0.01), montant: Math.round(montantMois * 0.001), pct: 0.1 },
  }

  return {
    total_jour: totalJour,
    total_semaine: totalJour * 7,
    total_mois: totalMois,
    montant_jour: montantJour,
    montant_semaine: montantJour * 7,
    montant_mois: montantMois,
    par_type: parType,
    par_canal: [
      { canal: 'Mixx By Yas', count: Math.round(totalMois * 0.578), montant: Math.round(montantMois * 0.563), pct: 56.3, color: '#fbbf24' },
      { canal: 'Flooz', count: Math.round(totalMois * 0.278), montant: Math.round(montantMois * 0.264), pct: 26.4, color: '#f97316' },
      { canal: 'Espèce', count: Math.round(totalMois * 0.295), montant: Math.round(montantMois * 0.173), pct: 17.3, color: '#94a3b8' },
    ],
    pct_mobile_money: 82.7,
    pct_especes: 17.3,
    par_agence: AGENCES.map((a, i) => ({
      agence: a.id,
      nom: a.nom_court,
      count: countsAgence[i],
      montant: montantsAgence[i],
      pct: totalMois > 0 ? Number(((countsAgence[i] / totalMois) * 100).toFixed(1)) : 0,
    })),
    par_heure: [
      { heure: '07h', count: Math.round(totalJour * 0.33) },
      { heure: '08h', count: Math.round(totalJour * 1.33) },
      { heure: '09h', count: Math.round(totalJour * 2.42) },
      { heure: '10h', count: Math.round(totalJour * 2.96) },
      { heure: '11h', count: Math.round(totalJour * 2.67) },
      { heure: '12h', count: Math.round(totalJour * 1.58) },
      { heure: '13h', count: Math.round(totalJour * 0.92) },
      { heure: '14h', count: Math.round(totalJour * 2.0) },
      { heure: '15h', count: Math.round(totalJour * 2.58) },
      { heure: '16h', count: Math.round(totalJour * 2.96) },
      { heure: '17h', count: Math.round(totalJour * 2.25) },
      { heure: '18h', count: Math.round(totalJour * 0.75) },
    ],
    echecs_mois: {
      total: Math.round(totalMois * 0.066),
      taux_echec_pct: 6.6,
      top_motifs: [
        { motif: 'Solde MoMo insuffisant', count: Math.round(totalMois * 0.025) },
        { motif: 'PIN erroné', count: Math.round(totalMois * 0.017) },
        { motif: 'Réseau indisponible', count: Math.round(totalMois * 0.013) },
        { motif: 'Compte bloqué', count: Math.round(totalMois * 0.007) },
        { motif: 'Numéro invalide', count: Math.round(totalMois * 0.004) },
      ],
    },
    evolution_7j: [
      { jour: 'Lun', count: Math.round(totalJour * 5.9), montant: Math.round(montantJour * 4.3) },
      { jour: 'Mar', count: Math.round(totalJour * 7.0), montant: Math.round(montantJour * 4.95) },
      { jour: 'Mer', count: Math.round(totalJour * 5.6), montant: Math.round(montantJour * 4.16) },
      { jour: 'Jeu', count: Math.round(totalJour * 7.9), montant: Math.round(montantJour * 5.81) },
      { jour: 'Ven', count: Math.round(totalJour * 8.4), montant: Math.round(montantJour * 6.56) },
      { jour: 'Sam', count: Math.round(totalJour * 4.0), montant: Math.round(montantJour * 2.61) },
      { jour: 'Dim', count: totalJour, montant: Math.round(montantJour * 0.54) },
    ],
  }
}

export function buildEpargneStats() {
  const m = getMoisCourant()
  const dormants = buildComptesDormants()
  const totalComptes = m.emprunteurs + 99
  const actifs = totalComptes - dormants.total
  const encoursTotal = Math.round(m.encours_fcfa * 0.283)

  const parAgence = AGENCES.map(a => ({
    agence_id: a.id,
    nom: a.nom_court,
    count: Math.round(totalComptes * (a.emprunteurs_actifs / m.emprunteurs)),
    encours: Math.round(encoursTotal * (a.encours_fcfa / m.encours_fcfa)),
  }))

  const depotsMontant = Math.round(m.collecte_fcfa * 1.24)
  const retraitsMontant = Math.round(depotsMontant * 0.37)

  return {
    total_comptes: totalComptes,
    actifs,
    dormants: dormants.total,
    clotures_mois: 12,
    encours_epargne_total: encoursTotal,
    ticket_moyen: actifs > 0 ? Math.round(encoursTotal / actifs) : 0,
    par_type: [
      { type: 'INDIVIDUEL', label: 'Individuel', count: Math.round(totalComptes * 0.495), encours: Math.round(encoursTotal * 0.49), pct: 49.0, color: '#14b8a6' },
      { type: 'GROUPE_FEMMES', label: 'Groupe femmes', count: Math.round(totalComptes * 0.237), encours: Math.round(encoursTotal * 0.297), pct: 29.7, color: '#ec4899' },
      { type: 'TONTINE', label: 'Tontine', count: Math.round(totalComptes * 0.164), encours: Math.round(encoursTotal * 0.142), pct: 14.2, color: '#f97316' },
      { type: 'SCOLAIRE', label: 'Scolarité', count: Math.round(totalComptes * 0.063), encours: Math.round(encoursTotal * 0.05), pct: 5.0, color: '#3b82f6' },
      { type: 'SANTE', label: 'Urgence santé', count: Math.round(totalComptes * 0.042), encours: Math.round(encoursTotal * 0.021), pct: 2.1, color: '#dc2626' },
    ],
    par_agence: parAgence,
    flux_mois: {
      depots_count: Math.round(totalComptes * 2.13),
      depots_montant: depotsMontant,
      retraits_count: Math.round(totalComptes * 0.51),
      retraits_montant: retraitsMontant,
      solde_net: depotsMontant - retraitsMontant,
      croissance_pct: Number(variationMoM('collecte_fcfa').toFixed(1)),
    },
    top_epargnants: [
      { client: 'Sika Adjovi', agence: 'AG-001', type: 'INDIVIDUEL' as const, solde: Math.round(encoursTotal * 0.026), anciennete_mois: 38 },
      { client: 'Groupe Soleil', agence: 'AG-001', type: 'GROUPE_FEMMES' as const, solde: Math.round(encoursTotal * 0.021), anciennete_mois: 24 },
      { client: 'Mensah Folly', agence: 'AG-002', type: 'INDIVIDUEL' as const, solde: Math.round(encoursTotal * 0.015), anciennete_mois: 18 },
      { client: 'Groupe Victoire', agence: 'AG-004', type: 'GROUPE_FEMMES' as const, solde: Math.round(encoursTotal * 0.014), anciennete_mois: 14 },
      { client: 'Akouvi Senou', agence: 'AG-005', type: 'INDIVIDUEL' as const, solde: Math.round(encoursTotal * 0.011), anciennete_mois: 12 },
    ],
    evolution_12_mois: RESEAU_MENSUEL.map((x, i) => ({
      mois: x.label,
      depots: Math.round(x.collecte_fcfa * 1.24),
      retraits: Math.round(x.collecte_fcfa * 0.46),
      encours: Math.round(x.encours_fcfa * 0.283),
      nb_comptes: x.emprunteurs + 99 - (RESEAU_MENSUEL.length - 1 - i) * 2,
    })),
    alertes_epargne: [
      { type: 'Comptes dormants > 6 mois', count: dormants.total, action: dormants.action_recommandee },
      { type: 'Retraits massifs détectés', count: REGISTRE_TRANSACTIONS_SUSPECTES.filter(t => t.motif.includes('retrait')).length || 4, action: 'Vérifier raison + proposer plan de réinvestissement' },
      { type: 'Comptes éligibles crédit', count: Math.round(actifs * 0.17), action: 'Proposer microcrédit garanti par épargne (1.5× solde)' },
    ],
    dormants_detail: dormants.repartition,
    encours_dormants: dormants.encours_total,
  }
}

export function buildCashParAgence() {
  const liquidite = getMoisCourant().liquidite_fcfa
  const weights = AGENCES.map(a => a.encours_fcfa)
  const sum = weights.reduce((s, w) => s + w, 0)
  const cashList = weights.map(w => Math.round((w / sum) * liquidite * 1.4))

  const minReq = [2_000_000, 1_500_000, 1_200_000, 1_200_000, 1_000_000]
  const maxSec = [6_000_000, 4_000_000, 3_500_000, 5_500_000, 3_500_000]

  return AGENCES.map((a, i) => {
    let cash = cashList[i]
    const niveau = a.par_courant >= 10 ? 'CRITIQUE_BAS' as const
      : a.par_courant >= 9 ? 'TENSION' as const
      : cash > maxSec[i] ? 'EXCEDENT' as const
      : 'NORMAL' as const

    // Trésorerie sous le minimum quand PAR élevé (sinon montant transfert = 0 incohérent)
    if (niveau === 'CRITIQUE_BAS') {
      cash = Math.min(cash, Math.round(minReq[i] * 0.82))
    } else if (niveau === 'TENSION') {
      cash = Math.min(cash, Math.round(minReq[i] * 0.92))
    }

    const decPrev = Math.round(a.encours_fcfa * 0.028)
    const montant_transfert = montantTransfertRecommandeAgence({
      niveau,
      cash_disponible: cash,
      cash_minimum_requis: minReq[i],
      decaissements_prevus_jour: decPrev,
    })

    return {
      agence_id: a.id,
      agence_nom: a.nom_court,
      cash_disponible: cash,
      cash_minimum_requis: minReq[i],
      cash_maximum_securise: maxSec[i],
      prevision_24h: Math.round(cash * 0.88),
      decaissements_prevus_jour: decPrev,
      niveau,
      montant_transfert_recommande: montant_transfert,
      action_recommandee: niveau === 'CRITIQUE_BAS'
        ? `URGENT — virement ${Math.round(montant_transfert / 1000)}k ce matin avant 10h`
        : niveau === 'TENSION'
          ? `Virement ${Math.round(montant_transfert / 1000)}k depuis siège ce matin`
          : niveau === 'EXCEDENT'
            ? `Rapatrier ${Math.round((cash - maxSec[i]) / 1000)}k vers siège (excédent)`
            : undefined,
    }
  })
}

/** Montant virement si agence en tension PAR + trésorerie insuffisante pour la journée */
export function montantTransfertRecommandeAgence(a: {
  niveau: 'CRITIQUE_BAS' | 'TENSION' | 'NORMAL' | 'EXCEDENT'
  cash_disponible: number
  cash_minimum_requis: number
  decaissements_prevus_jour: number
}): number {
  if (a.niveau !== 'CRITIQUE_BAS' && a.niveau !== 'TENSION') return 0
  const deficit = Math.max(0, a.cash_minimum_requis - a.cash_disponible)
  if (a.niveau === 'CRITIQUE_BAS') {
    return Math.max(2_000_000, deficit + 800_000)
  }
  return Math.max(1_500_000, deficit + 400_000)
}

export function buildCashGlobal() {
  const cash = buildCashParAgence()
  return {
    total_reseau: cash.reduce((s, a) => s + a.cash_disponible, 0),
    total_minimum_requis: cash.reduce((s, a) => s + a.cash_minimum_requis, 0),
    agences_critiques: cash.filter(a => a.niveau === 'CRITIQUE_BAS').length,
    agences_tension: cash.filter(a => a.niveau === 'TENSION').length,
    agences_excedent: cash.filter(a => a.niveau === 'EXCEDENT').length,
    transferts_recommandes_montant: cash.reduce((s, a) => s + a.montant_transfert_recommande, 0),
  }
}

/** Transactions récentes liées au registre TX suspectes + synthèse réseau */
export function buildTransactionsRecentesFromRegistry() {
  const txSuspectes = REGISTRE_TRANSACTIONS_SUSPECTES.slice(0, 12).map(t => ({
    id: t.id,
    date: t.date,
    heure: '14h30',
    type: 'DEPOT_EPARGNE' as const,
    canal: 'MTN_MOMO' as const,
    montant: t.montant,
    client: t.client,
    agence_id: AGENCES.find(a => a.nom_court === t.agence)?.id ?? 'AG-001',
    agent: t.agent,
    reference: t.id,
    statut: t.statut === 'RESOLUE' ? 'REUSSIE' as const : t.statut === 'BLOQUEE' ? 'ECHOUEE' as const : 'EN_ATTENTE' as const,
    motif_echec: t.statut === 'BLOQUEE' ? t.motif : undefined,
  }))
  return txSuspectes
}
