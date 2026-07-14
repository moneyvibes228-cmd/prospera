/**
 * Builders conquête — transforment le registre en les 4 lectures dont un prospecteur
 * a réellement besoin, et qu'un tableau de PDV ne donne jamais :
 *
 *   1. l'entonnoir      où le carnet fuit, étape par étape
 *   2. la cohorte       ce que ses ouvertures sont devenues 3 mois après
 *   3. la passation     les PDV qu'il a ouverts et que plus personne ne visite
 *   4. les alertes      les garde-fous franchis, avec le montant que ça coûte
 */
import {
  ETAPES_TUNNEL, ETAPE_LABEL, REGLES_CONQUETE,
  type Ouverture, type Prospect, type ZoneConquete, type EtapeConquete,
} from './registries/prospection-registry'

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entonnoir de conquête
// ─────────────────────────────────────────────────────────────────────────────

export interface EtageEntonnoir {
  etape: EtapeConquete
  label: string
  /** Prospects ayant atteint **au moins** cette étape. */
  atteint: number
  /** Part du recensement initial encore en vie à cette étape. */
  pct_du_recense: number
  /** Dossiers actuellement posés sur cette étape. */
  en_cours: number
  /**
   * Dossiers qui stagnent ici au-delà du seuil de relance.
   *
   * Attention : ce n'est pas l'écart entre deux étages. Un carnet est un instantané —
   * un dossier recensé hier n'est pas « perdu » parce qu'il n'est pas encore qualifié.
   * Le seul signal exploitable, c'est l'ancienneté : un dossier immobile depuis plus de
   * trois semaines est en train de mourir, quelle que soit l'étape où il est assis.
   */
  bloques: number
}

export interface MotifPerte {
  motif: string
  nombre: number
  /** Une perte face à un concurrent exclusif s'accepte. Une perte par abandon, non. */
  evitable: boolean
}

export interface EntonnoirConquete {
  etages: EtageEntonnoir[]
  perdus: number
  motifs_perte: MotifPerte[]
  /** L'étape où le plus de dossiers stagnent — c'est là que le travail est en panne. */
  goulot: EtageEntonnoir | null
}

const RANG_ETAPE: Record<EtapeConquete, number> = {
  RECENSE: 0, QUALIFIE: 1, PREMIER_CONTACT: 2, OFFRE_ENVOYEE: 3, PREMIERE_COMMANDE: 4, PERDU: -1,
}

/** Une perte est évitable si personne d'autre n'en est la cause — c'est le suivi qui a lâché. */
function perteEvitable(motif: string): boolean {
  return !/exclusiv|concurrent/i.test(motif)
}

export function buildEntonnoirConquete(prospects: Prospect[]): EntonnoirConquete {
  const actifs = prospects.filter(p => p.etape !== 'PERDU')
  const perdus = prospects.filter(p => p.etape === 'PERDU')
  const recense = actifs.length

  const etages: EtageEntonnoir[] = ETAPES_TUNNEL.map(etape => {
    const atteint = actifs.filter(p => RANG_ETAPE[p.etape] >= RANG_ETAPE[etape]).length
    const surLEtape = actifs.filter(p => p.etape === etape)
    return {
      etape,
      label: ETAPE_LABEL[etape],
      atteint,
      pct_du_recense: recense > 0 ? Math.round((atteint / recense) * 100) : 0,
      en_cours: surLEtape.length,
      bloques: surLEtape.filter(p => p.jours_dans_etape > REGLES_CONQUETE.jours_max_sans_contact).length,
    }
  })

  const parMotif = new Map<string, number>()
  for (const p of perdus) {
    const motif = p.motif_perte ?? 'Motif non renseigné'
    parMotif.set(motif, (parMotif.get(motif) ?? 0) + 1)
  }

  const goulot = etages
    .reduce<EtageEntonnoir | null>((pire, e) => (!pire || e.bloques > pire.bloques ? e : pire), null)

  return {
    etages,
    perdus: perdus.length,
    motifs_perte: [...parMotif.entries()]
      .map(([motif, nombre]) => ({ motif, nombre, evitable: perteEvitable(motif) }))
      .sort((a, b) => b.nombre - a.nombre),
    goulot: goulot && goulot.bloques > 0 ? goulot : null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Cohorte de survie — la redevabilité du poste
// ─────────────────────────────────────────────────────────────────────────────

export interface CohorteMois {
  mois: string
  ouvertures: number
  vivants: number
  dormants: number
  morts: number
  impayes: number
  /** null tant que la cohorte n'a pas 3 mois d'âge. */
  survie_m3_pct: number | null
}

export interface CohorteSurvie {
  total_ouvertures: number
  /** Ouvertures assez anciennes pour qu'on puisse juger : c'est sur elles seules qu'on calcule. */
  evaluables_m3: number
  vivants_m3: number
  survie_m3_pct: number
  reachat_m1_pct: number
  ouvertures_impayees: number
  montant_impaye: number
  cout_acquisition_total: number
  marge_cumulee_total: number
  /** Marge générée par les ouvertures − ce qu'elles ont coûté à acquérir. Peut être négatif. */
  valeur_nette: number
  par_mois: CohorteMois[]
}

const MOIS_LABEL: Record<string, string> = {
  '2026-01': 'Jan', '2026-02': 'Fév', '2026-03': 'Mar',
  '2026-04': 'Avr', '2026-05': 'Mai', '2026-06': 'Jui',
}

export function buildCohorteSurvie(ouvertures: Ouverture[]): CohorteSurvie {
  const evaluables = ouvertures.filter(o => o.reachat_m3 !== null)
  const vivantsM3 = evaluables.filter(o => o.reachat_m3 === true)
  const reachatM1 = ouvertures.filter(o => o.reachat_m1)
  const impayees = ouvertures.filter(o => o.sante === 'IMPAYE')

  const cout = ouvertures.reduce((s, o) => s + o.cout_acquisition, 0)
  const marge = ouvertures.reduce((s, o) => s + o.marge_cumulee, 0)
  const impaye = ouvertures.reduce((s, o) => s + o.impaye_fcfa, 0)

  const mois = [...new Set(ouvertures.map(o => o.mois_ouverture))].sort()
  const par_mois: CohorteMois[] = mois.map(m => {
    const lot = ouvertures.filter(o => o.mois_ouverture === m)
    const jugeables = lot.filter(o => o.reachat_m3 !== null)
    return {
      mois: MOIS_LABEL[m] ?? m,
      ouvertures: lot.length,
      vivants: lot.filter(o => o.sante === 'VIVANT').length,
      dormants: lot.filter(o => o.sante === 'DORMANT').length,
      morts: lot.filter(o => o.sante === 'MORT').length,
      impayes: lot.filter(o => o.sante === 'IMPAYE').length,
      survie_m3_pct: jugeables.length > 0
        ? Math.round((jugeables.filter(o => o.reachat_m3 === true).length / jugeables.length) * 100)
        : null,
    }
  })

  return {
    total_ouvertures: ouvertures.length,
    evaluables_m3: evaluables.length,
    vivants_m3: vivantsM3.length,
    survie_m3_pct: evaluables.length > 0 ? Math.round((vivantsM3.length / evaluables.length) * 100) : 0,
    reachat_m1_pct: ouvertures.length > 0 ? Math.round((reachatM1.length / ouvertures.length) * 100) : 0,
    ouvertures_impayees: impayees.length,
    montant_impaye: impaye,
    cout_acquisition_total: cout,
    marge_cumulee_total: marge,
    valeur_nette: marge - cout - impaye,
    par_mois,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. File de passation — les orphelins
// ─────────────────────────────────────────────────────────────────────────────

export interface LignePassation extends Ouverture {
  /** Ouvert depuis plus longtemps que le délai de passation : plus personne ne le visite. */
  orphelin: boolean
  jours_de_retard: number
}

/**
 * PDV ouverts, encore vivants, mais jamais transférés à un commercial de secteur.
 * C'est l'angle mort du poste : le prospecteur passe à la zone suivante, le PDV n'entre
 * dans aucune tournée, et il s'éteint. Les « 12 PDV sans passage commercial » que le DG
 * voit en alerte sortent d'ici.
 */
export function buildFilePassation(ouvertures: Ouverture[]): LignePassation[] {
  return ouvertures
    .filter(o => o.transfere_a === null && (o.sante === 'VIVANT' || o.sante === 'DORMANT'))
    .map(o => ({
      ...o,
      orphelin: o.jours_depuis_ouverture > REGLES_CONQUETE.jours_max_avant_passation,
      jours_de_retard: Math.max(0, o.jours_depuis_ouverture - REGLES_CONQUETE.jours_max_avant_passation),
    }))
    .sort((a, b) => b.jours_depuis_ouverture - a.jours_depuis_ouverture)
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Garde-fous
// ─────────────────────────────────────────────────────────────────────────────

export type GraviteAlerte = 'CRITIQUE' | 'HAUTE' | 'MOYENNE'

export interface AlerteConquete {
  id: string
  regle: string
  gravite: GraviteAlerte
  cible: string
  constat: string
  action: string
  /** Ce que la règle franchie a coûté, ou coûtera. */
  impact_fcfa?: number
}

const GRAVITE_RANG: Record<GraviteAlerte, number> = { CRITIQUE: 0, HAUTE: 1, MOYENNE: 2 }

export function buildAlertesConquete(prospects: Prospect[], ouvertures: Ouverture[]): AlerteConquete[] {
  const alertes: AlerteConquete[] = []
  const R = REGLES_CONQUETE

  // Crédit accordé au-delà du plafond sur une 1ʳᵉ commande — la faute qui coûte le plus cher.
  for (const o of ouvertures) {
    const aCredit = o.conditions_1re_commande !== 'COMPTANT'
    if (aCredit && o.ca_1re_commande > R.plafond_credit_1re_commande) {
      alertes.push({
        id: `alerte-credit-${o.id}`,
        regle: `Plafond crédit 1ʳᵉ commande — ${(R.plafond_credit_1re_commande / 1_000_000).toFixed(1)} M FCFA`,
        gravite: o.impaye_fcfa > 0 ? 'CRITIQUE' : 'HAUTE',
        cible: o.pdv_nom,
        constat: o.impaye_fcfa > 0
          ? `1ʳᵉ commande de ${(o.ca_1re_commande / 1_000_000).toFixed(2)} M à crédit ${o.conditions_1re_commande === 'CREDIT_30J' ? '30 j' : '7 j'}, sans historique de paiement. Jamais réglée.`
          : `1ʳᵉ commande de ${(o.ca_1re_commande / 1_000_000).toFixed(2)} M à crédit, au-delà du plafond.`,
        action: o.impaye_fcfa > 0
          ? 'Dossier au recouvrement. Exclure des campagnes promo tant que la créance court.'
          : 'Ramener sous plafond ou exiger un acompte de 50 %.',
        impact_fcfa: o.impaye_fcfa,
      })
    }
  }

  // Prospect au même profil que l'ouverture ratée — l'alerte qui empêche de recommencer.
  for (const p of prospects) {
    if (p.etape === 'PERDU') continue
    if (p.capacite_paiement === 'CREDIT_30J' && p.ca_estime_mois > R.plafond_credit_1re_commande * 2) {
      alertes.push({
        id: `alerte-risque-${p.id}`,
        regle: 'Profil à risque — gros volume à crédit 30 j',
        gravite: 'HAUTE',
        cible: p.nom,
        constat: `${(p.ca_estime_mois / 1_000_000).toFixed(1)} M/mois estimés, crédit 30 j demandé. Profil identique à une ouverture déjà impayée.`,
        action: 'Acompte 50 % obligatoire, ou validation DAF avant la 1ʳᵉ commande.',
      })
    }
  }

  // Zone trop loin pour être servie à marge positive.
  for (const p of prospects) {
    if (p.etape === 'PERDU') continue
    if (p.distance_depot_km > R.distance_max_rentable_km) {
      alertes.push({
        id: `alerte-distance-${p.id}`,
        regle: `Distance max rentable — ${R.distance_max_rentable_km} km`,
        gravite: 'MOYENNE',
        cible: p.nom,
        constat: `${p.distance_depot_km} km du dépôt : le coût de desserte dépasse la marge attendue.`,
        action: 'Ne pas engager sans dépôt relais ni commande groupée avec la zone.',
      })
    }
  }

  // Dossiers en train de pourrir faute de relance.
  for (const p of prospects) {
    if (p.etape === 'PERDU') continue
    if (p.jours_dans_etape > R.jours_max_sans_contact) {
      alertes.push({
        id: `alerte-dormant-${p.id}`,
        regle: `Dossier dormant — ${R.jours_max_sans_contact} j max dans une étape`,
        gravite: p.score_ia >= 60 ? 'HAUTE' : 'MOYENNE',
        cible: p.nom,
        constat: `${p.jours_dans_etape} j bloqué en « ${ETAPE_LABEL[p.etape]} »${p.motif_blocage ? ` — ${p.motif_blocage}` : ''}`,
        action: p.score_ia >= 60 ? 'Débloquer cette semaine : c\'est un dossier à fort potentiel.' : 'Clôturer — le dossier ne rembourse pas son coût d\'acquisition.',
      })
    }
  }

  // PDV ouverts que plus personne ne visite.
  const orphelins = buildFilePassation(ouvertures).filter(o => o.orphelin)
  if (orphelins.length > 0) {
    alertes.push({
      id: 'alerte-passation',
      regle: `Passation sous ${R.jours_max_avant_passation} j`,
      gravite: 'CRITIQUE',
      cible: `${orphelins.length} PDV ouverts`,
      constat: `${orphelins.length} PDV ouverts ne sont rattachés à aucune tournée — le plus ancien depuis ${Math.max(...orphelins.map(o => o.jours_depuis_ouverture))} j. Sans commercial de secteur, ils s'éteignent.`,
      action: 'Transférer au commercial de secteur — c\'est la cause n°1 de mortalité à M+3.',
    })
  }

  return alertes.sort((a, b) => GRAVITE_RANG[a.gravite] - GRAVITE_RANG[b.gravite])
}

// ─────────────────────────────────────────────────────────────────────────────
// Synthèse
// ─────────────────────────────────────────────────────────────────────────────

export interface SyntheseConquete {
  zones_en_conquete: number
  couverture_recensement_pct: number
  prospects_actifs: number
  prospects_bloques: number
  ouvertures_mois: number
  survie_m3_pct: number
  valeur_nette: number
  orphelins: number
  alertes_critiques: number
}

export function buildSyntheseConquete(
  zones: ZoneConquete[],
  prospects: Prospect[],
  ouvertures: Ouverture[],
): SyntheseConquete {
  const actives = zones.filter(z => z.statut !== 'ABANDONNEE')
  const recenses = actives.reduce((s, z) => s + z.pdv_recenses, 0)
  const estimes = actives.reduce((s, z) => s + z.pdv_estimes, 0)
  const cohorte = buildCohorteSurvie(ouvertures)
  const alertes = buildAlertesConquete(prospects, ouvertures)

  return {
    zones_en_conquete: zones.filter(z => z.statut === 'EN_CONQUETE').length,
    couverture_recensement_pct: estimes > 0 ? Math.round((recenses / estimes) * 100) : 0,
    prospects_actifs: prospects.filter(p => p.etape !== 'PERDU').length,
    prospects_bloques: prospects.filter(
      p => p.etape !== 'PERDU' && p.jours_dans_etape > REGLES_CONQUETE.jours_max_sans_contact,
    ).length,
    ouvertures_mois: ouvertures.filter(o => o.mois_ouverture === '2026-06').length,
    survie_m3_pct: cohorte.survie_m3_pct,
    valeur_nette: cohorte.valeur_nette,
    orphelins: buildFilePassation(ouvertures).filter(o => o.orphelin).length,
    alertes_critiques: alertes.filter(a => a.gravite === 'CRITIQUE').length,
  }
}
