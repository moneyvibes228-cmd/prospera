/**
 * Portefeuille réseau — dérivé de RESEAU_CONSOLIDE (agences.ts).
 * Règle métier mock : 1 emprunteur = 1 client = 1 dossier crédit actif.
 */
import { RESEAU_CONSOLIDE } from './agences'
import { buildExpectedLossEvolution6Mois } from './mock-time-series'

export interface SecteurStats {
  nom: string
  icone: string
  nb_dossiers: number
  encours: number
  par_30j_pct: number
  expected_loss: number
  taux_remboursement: number
  croissance_mensuelle_pct: number
  ticket_moyen: number
  saisonalite: 'STABLE' | 'SAISONNIER' | 'CYCLIQUE'
  sous_secteurs: { nom: string; count: number; par: number }[]
  alerte_concentration: boolean
  color: string
}

const PROVISIONS = {
  constituees: 4_200_000,
  a_constituer: 5_380_000,
  ecart: 1_180_000,
} as const

/** Répartition BCEAO de référence (ratios) — recalée sur le portefeuille réel */
const BCEAO_BASE = {
  classes: [
    { code: 'PERFORMANT', label: 'Performant', count: 152, encours: 68_400_000, provision_taux: 0, color: '#16a34a', score_range: '75-100' },
    { code: 'SOUS_SURVEILLANCE', label: 'Sous surveillance', count: 28, encours: 14_800_000, provision_taux: 10, color: '#f97316', score_range: '55-74' },
    { code: 'DOUTEUX', label: 'Douteux', count: 18, encours: 8_200_000, provision_taux: 25, color: '#dc2626', score_range: '35-54' },
    { code: 'COMPROMIS', label: 'Compromis', count: 7, encours: 2_900_000, provision_taux: 50, color: '#991b1b', score_range: '15-34' },
    { code: 'PERTE', label: 'Perte', count: 2, encours: 400_000, provision_taux: 100, color: '#1f2937', score_range: '0-14' },
  ],
  base_dossiers: 207,
  base_encours: 94_700_000,
} as const

/** Secteurs de référence (ratios) — métadonnées + proportions */
const SECTEURS_BASE: SecteurStats[] = [
  {
    nom: 'Commerce', icone: '🛒', nb_dossiers: 78, encours: 32_400_000, par_30j_pct: 7.8,
    expected_loss: 1_240_000, taux_remboursement: 92.4, croissance_mensuelle_pct: 4.2,
    ticket_moyen: 415_385, saisonalite: 'STABLE', alerte_concentration: true, color: '#14b8a6',
    sous_secteurs: [
      { nom: 'Vente fruits/légumes', count: 28, par: 6.4 },
      { nom: 'Vente vêtements', count: 19, par: 8.2 },
      { nom: 'Vente cosmétiques', count: 12, par: 9.1 },
      { nom: 'Vente électronique', count: 11, par: 11.4 },
      { nom: 'Vente alimentaire', count: 8, par: 5.2 },
    ],
  },
  {
    nom: 'Agriculture', icone: '🌾', nb_dossiers: 42, encours: 18_900_000, par_30j_pct: 11.4,
    expected_loss: 2_180_000, taux_remboursement: 86.2, croissance_mensuelle_pct: -1.8,
    ticket_moyen: 450_000, saisonalite: 'SAISONNIER', alerte_concentration: false, color: '#22c55e',
    sous_secteurs: [
      { nom: 'Maraîchage', count: 18, par: 9.4 },
      { nom: 'Élevage', count: 12, par: 13.2 },
      { nom: 'Pêche', count: 8, par: 14.1 },
      { nom: 'Céréales', count: 4, par: 8.8 },
    ],
  },
  {
    nom: 'Artisanat', icone: '🛠️', nb_dossiers: 34, encours: 12_800_000, par_30j_pct: 6.2,
    expected_loss: 480_000, taux_remboursement: 94.1, croissance_mensuelle_pct: 6.4,
    ticket_moyen: 376_470, saisonalite: 'STABLE', alerte_concentration: false, color: '#f97316',
    sous_secteurs: [
      { nom: 'Couture', count: 14, par: 5.1 },
      { nom: 'Menuiserie', count: 8, par: 6.8 },
      { nom: 'Coiffure', count: 7, par: 7.4 },
      { nom: 'Cordonnerie', count: 5, par: 5.9 },
    ],
  },
  {
    nom: 'Services', icone: '💼', nb_dossiers: 22, encours: 9_400_000, par_30j_pct: 5.4,
    expected_loss: 290_000, taux_remboursement: 95.2, croissance_mensuelle_pct: 8.1,
    ticket_moyen: 427_273, saisonalite: 'STABLE', alerte_concentration: false, color: '#3b82f6',
    sous_secteurs: [
      { nom: 'Réparation téléphone', count: 8, par: 4.2 },
      { nom: 'Photocopie/saisie', count: 6, par: 6.1 },
      { nom: 'Garage moto', count: 5, par: 5.8 },
      { nom: 'Multimédia', count: 3, par: 6.4 },
    ],
  },
  {
    nom: 'Transport', icone: '🚗', nb_dossiers: 16, encours: 8_200_000, par_30j_pct: 9.8,
    expected_loss: 920_000, taux_remboursement: 88.4, croissance_mensuelle_pct: 2.1,
    ticket_moyen: 512_500, saisonalite: 'STABLE', alerte_concentration: false, color: '#6366f1',
    sous_secteurs: [
      { nom: 'Taxi-moto (zem)', count: 9, par: 11.2 },
      { nom: 'Tricycle', count: 4, par: 8.4 },
      { nom: 'Voiture taxi', count: 3, par: 7.9 },
    ],
  },
  {
    nom: 'Restauration', icone: '🍲', nb_dossiers: 14, encours: 5_800_000, par_30j_pct: 8.4,
    expected_loss: 540_000, taux_remboursement: 91.2, croissance_mensuelle_pct: 5.4,
    ticket_moyen: 414_286, saisonalite: 'STABLE', alerte_concentration: false, color: '#a855f7',
    sous_secteurs: [
      { nom: 'Bar / buvette', count: 6, par: 9.8 },
      { nom: 'Restaurant', count: 4, par: 7.2 },
      { nom: 'Vente à emporter', count: 4, par: 7.4 },
    ],
  },
  {
    nom: 'Éducation', icone: '📚', nb_dossiers: 8, encours: 3_200_000, par_30j_pct: 4.2,
    expected_loss: 120_000, taux_remboursement: 96.4, croissance_mensuelle_pct: 12.4,
    ticket_moyen: 400_000, saisonalite: 'CYCLIQUE', alerte_concentration: false, color: '#eab308',
    sous_secteurs: [
      { nom: 'Frais scolarité enfants', count: 5, par: 3.8 },
      { nom: 'Formation pro', count: 3, par: 4.9 },
    ],
  },
  {
    nom: 'Santé', icone: '🏥', nb_dossiers: 6, encours: 1_700_000, par_30j_pct: 12.4,
    expected_loss: 340_000, taux_remboursement: 84.2, croissance_mensuelle_pct: 18.2,
    ticket_moyen: 283_333, saisonalite: 'CYCLIQUE', alerte_concentration: false, color: '#dc2626',
    sous_secteurs: [
      { nom: 'Urgence médicale', count: 4, par: 14.1 },
      { nom: 'Pharmacie', count: 2, par: 8.4 },
    ],
  },
]

function scaleIntegers(parts: number[], target: number): number[] {
  const total = parts.reduce((s, n) => s + n, 0)
  if (total === 0) return parts.map(() => 0)
  const raw = parts.map(n => (n / total) * target)
  const floored = raw.map(n => Math.floor(n))
  let remainder = target - floored.reduce((s, n) => s + n, 0)
  const order = raw
    .map((n, i) => ({ i, frac: n - Math.floor(n) }))
    .sort((a, b) => b.frac - a.frac)
  const result = [...floored]
  for (let k = 0; k < order.length && remainder > 0; k++) {
    result[order[k].i] += 1
    remainder -= 1
  }
  return result
}

function scaleEncours(parts: number[], target: number): number[] {
  const total = parts.reduce((s, n) => s + n, 0)
  if (total === 0) return parts.map(() => 0)
  const scaled = parts.map(n => Math.round((n / total) * target))
  const diff = target - scaled.reduce((s, n) => s + n, 0)
  if (diff !== 0) scaled[0] += diff
  return scaled
}

export function getPortefeuilleConsolide() {
  return {
    emprunteurs: RESEAU_CONSOLIDE.total_emprunteurs,
    encours: RESEAU_CONSOLIDE.encours_total,
    /** Alias explicite : 1 emprunteur = 1 dossier */
    dossiers: RESEAU_CONSOLIDE.total_emprunteurs,
  }
}

export function buildBceaoRepartition() {
  const { emprunteurs, encours } = getPortefeuilleConsolide()
  const counts = scaleIntegers(
    BCEAO_BASE.classes.map(c => c.count),
    emprunteurs,
  )
  const encoursList = scaleEncours(
    BCEAO_BASE.classes.map(c => c.encours),
    encours,
  )

  const classes = BCEAO_BASE.classes.map((c, i) => {
    const enc = encoursList[i]
    const cnt = counts[i]
    const provision_fcfa = Math.round(enc * (c.provision_taux / 100))
    return {
      code: c.code,
      label: c.label,
      count: cnt,
      encours: enc,
      pct_count: emprunteurs > 0 ? (cnt / emprunteurs) * 100 : 0,
      pct_encours: encours > 0 ? (enc / encours) * 100 : 0,
      provision_taux: c.provision_taux,
      provision_fcfa,
      color: c.color,
      score_range: c.score_range,
    }
  })

  return {
    classes,
    total_dossiers: emprunteurs,
    total_emprunteurs: emprunteurs,
    total_encours: encours,
    total_provisions_a_constituer: PROVISIONS.a_constituer,
    total_provisions_constituees: PROVISIONS.constituees,
    ecart_provisions: PROVISIONS.ecart,
  }
}

export function buildSecteursPortefeuille(): SecteurStats[] {
  const { emprunteurs, encours } = getPortefeuilleConsolide()
  const dossiersScaled = scaleIntegers(
    SECTEURS_BASE.map(s => s.nb_dossiers),
    emprunteurs,
  )
  const encoursScaled = scaleEncours(
    SECTEURS_BASE.map(s => s.encours),
    encours,
  )
  const elScaled = scaleEncours(
    SECTEURS_BASE.map(s => s.expected_loss),
    Math.round(SECTEURS_BASE.reduce((s, x) => s + x.expected_loss, 0) * (encours / SECTEURS_BASE.reduce((s, x) => s + x.encours, 0))),
  )

  return SECTEURS_BASE.map((s, i) => {
    const nb = dossiersScaled[i]
    const enc = encoursScaled[i]
    const ssCounts = scaleIntegers(
      s.sous_secteurs.map(ss => ss.count),
      nb,
    )
    return {
      ...s,
      nb_dossiers: nb,
      encours: enc,
      expected_loss: elScaled[i],
      ticket_moyen: nb > 0 ? Math.round(enc / nb) : 0,
      sous_secteurs: s.sous_secteurs.map((ss, j) => ({
        ...ss,
        count: ssCounts[j],
      })),
    }
  })
}

export function buildExpectedLossPortefeuille() {
  const { encours } = getPortefeuilleConsolide()
  const bceao = buildBceaoRepartition()
  const elTotal = 2_944_000
  const scale = encours / BCEAO_BASE.base_encours

  return {
    ead_total: encours,
    pd_moyen_pct: 7.4,
    lgd_moyen_pct: 42.0,
    el_total: Math.round(elTotal * scale),
    el_pct_portefeuille: encours > 0 ? Math.round((elTotal * scale / encours) * 1000) / 10 : 0,
    par_classe: bceao.classes.map(c => ({
      classe: c.code,
      ead: c.encours,
      pd: c.code === 'PERFORMANT' ? 3.2 : c.code === 'SOUS_SURVEILLANCE' ? 18.4 : c.code === 'DOUTEUX' ? 38.6 : c.code === 'COMPROMIS' ? 64.2 : 95.0,
      lgd: c.code === 'PERFORMANT' ? 35 : c.code === 'SOUS_SURVEILLANCE' ? 45 : c.code === 'DOUTEUX' ? 52 : c.code === 'COMPROMIS' ? 68 : 85,
      el: Math.round(c.encours * 0.031 * scale),
    })),
    par_agence: [
      { agence: 'AG-001', nom: 'Lomé Centre', ead: 28_200_000, el: Math.round(612_000 * scale), el_pct: 2.17 },
      { agence: 'AG-002', nom: 'Adidogomé', ead: 22_100_000, el: Math.round(798_000 * scale), el_pct: 3.61 },
      { agence: 'AG-003', nom: 'Bè Kpota', ead: 17_400_000, el: Math.round(924_000 * scale), el_pct: 5.31 },
      { agence: 'AG-004', nom: 'Hédzranawoé', ead: 12_900_000, el: Math.round(412_000 * scale), el_pct: 3.19 },
      { agence: 'AG-005', nom: 'Kpalimé', ead: 4_850_000, el: Math.round(98_000 * scale), el_pct: 2.02 },
    ],
    evolution_6_mois: buildExpectedLossEvolution6Mois(),
  }
}

/** Vieillissement recalé pour que les montants = encours total */
export function buildPortefeuilleAging() {
  const base = RESEAU_CONSOLIDE.portefeuille_aging
  const { encours, emprunteurs } = getPortefeuilleConsolide()
  const baseMontant = base.reduce((s, t) => s + t.montant, 0)
  const montants = scaleEncours(
    base.map(t => t.montant),
    encours,
  )
  const counts = scaleIntegers(
    base.map(t => t.count),
    emprunteurs,
  )
  return base.map((t, i) => ({
    ...t,
    count: counts[i],
    montant: montants[i],
  }))
}

export const PORTEFEUILLE_AGING_RESEAU = buildPortefeuilleAging()
export const BCEAO_REPARTITION = buildBceaoRepartition()
export const SECTEURS = buildSecteursPortefeuille()
export const EXPECTED_LOSS = buildExpectedLossPortefeuille()
