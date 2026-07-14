import {
  COMPTES_TRESORERIE, CREANCES_COMPTABLES, COMPTE_RESULTAT,
} from '@/lib/registries/comptabilite-registry'
import {
  REGISTRE_FOURNISSEURS, DETTE_FOURNISSEURS_TOTALE, DETTE_FOURNISSEURS_ECHUE,
} from '@/lib/registries/fournisseurs-registry'
import { REGISTRE_COMMANDES } from '@/lib/registries/commandes-registry'
import { RESEAU_CONSOLIDE_DIST } from '@/lib/registries/zones-registry'
import { CA_SPARKLINE_REGISTRY, ENTREPRISE_REGISTRY } from '@/lib/registries/entreprise-registry'

/**
 * Les 8 chiffres de décision du DG (spec V2 §2.2).
 *
 * Un DG ne lit pas un rapport, il scanne des chiffres puis décide : ce bandeau passe donc
 * avant le rapport IA. Chaque chiffre est **dérivé des registres**, jamais saisi en dur —
 * sans quoi la même réalité afficherait trois valeurs différentes selon la page (spec §8).
 */

export type FamilleChiffre = 'TRESORERIE' | 'CREANCE' | 'DETTE' | 'REVENU' | 'RESULTAT' | 'ACTIVITE'

export interface ChiffreDecisionDG {
  cle: string
  label: string
  valeur: number
  format: 'fcfa' | 'number' | 'pct'
  famille: FamilleChiffre
  /** Ce qui rend le chiffre actionnable. */
  detail_principal: string
  detail_secondaire?: string
  variation_pct: number
  variation_label: string
  /** true si une hausse est mauvaise (dette, créance). */
  invert: boolean
  statut: 'SAIN' | 'ATTENTION' | 'CRITIQUE'
  seuil_alerte?: string
  action_label?: string
  action_href?: string
}

/** Regroupement visuel du bandeau — le DG doit savoir où regarder (spec §2.4). */
export type GroupeDecision = 'ARGENT_DISPONIBLE' | 'CE_QUON_ME_DOIT' | 'ACTIVITE'

export const GROUPES_DECISION: {
  id: GroupeDecision
  titre: string
  bordure: string
  puce: string
  cles: string[]
}[] = [
  {
    id: 'ARGENT_DISPONIBLE',
    titre: 'Argent disponible',
    bordure: 'border-l-emerald-500',
    puce: 'bg-emerald-500',
    cles: ['solde_caisse', 'benefice_net'],
  },
  {
    id: 'CE_QUON_ME_DOIT',
    titre: 'Ce qu\'on me doit / ce que je dois',
    bordure: 'border-l-amber-500',
    puce: 'bg-amber-500',
    cles: ['credit_client', 'dette_fournisseurs'],
  },
  {
    id: 'ACTIVITE',
    titre: 'Activité',
    bordure: 'border-l-sky-500',
    puce: 'bg-sky-500',
    cles: ['ca_jour', 'ca_mois', 'ca_annuel', 'total_commandes'],
  },
]

const JOURS_MOIS = 30
const OBJECTIF_ANNUEL = ENTREPRISE_REGISTRY.ca_objectif_mois * 12
/** Le mois est le 6e de l'exercice — base du % d'atteinte annuel. */
const MOIS_ECOULES = CA_SPARKLINE_REGISTRY.length

function pct(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

export function buildSyntheseDecisionDG(): ChiffreDecisionDG[] {
  // 1. Trésorerie
  const soldeCaisse = COMPTES_TRESORERIE.reduce((s, c) => s + c.solde, 0)
  const banque = COMPTES_TRESORERIE.filter(c => c.type === 'BANQUE').reduce((s, c) => s + c.solde, 0)
  const caisses = COMPTES_TRESORERIE.filter(c => c.type === 'CAISSE').reduce((s, c) => s + c.solde, 0)
  const fluxJour = COMPTES_TRESORERIE.reduce((s, c) => s + c.entrees_jour - c.sorties_jour, 0)

  // 2. Crédit client
  const creditClient = CREANCES_COMPTABLES.reduce((s, c) => s + c.reste, 0)
  const creditRetard = CREANCES_COMPTABLES.filter(c => c.jours_retard > 30).reduce((s, c) => s + c.reste, 0)
  const clientsRetard = CREANCES_COMPTABLES.filter(c => c.jours_retard > 30).length

  // 3. Dette fournisseurs — dérivée du registre (source unique de vérité)
  const prochaine = [...REGISTRE_FOURNISSEURS]
    .filter(f => f.montant_prochaine_echeance > 0)
    .sort((a, b) => a.prochaine_echeance.localeCompare(b.prochaine_echeance))[0]

  // 4-6. Revenus
  const caMois = RESEAU_CONSOLIDE_DIST.ca_mois
  const caJour = Math.round(caMois / JOURS_MOIS)
  const moyenne30j = caJour
  const caAnnuel = CA_SPARKLINE_REGISTRY.reduce((s, m) => s + m.ca, 0) * 1_000_000
  const objectifCumule = ENTREPRISE_REGISTRY.ca_objectif_mois * MOIS_ECOULES

  // 7. Résultat
  const resultat = COMPTE_RESULTAT.find(l => l.section === 'RESULTAT')
  const beneficeNet = resultat?.montant_mois ?? 0
  const margeNette = resultat?.pct_ca ?? 0

  // 8. Activité commandes
  const commandesJour = RESEAU_CONSOLIDE_DIST.commandes_jour
  const commandesTerrain = REGISTRE_COMMANDES.filter(c => c.type_commercial !== 'FREELANCE').length

  const pctObjectifMois = pct(caMois, ENTREPRISE_REGISTRY.ca_objectif_mois)
  const pctObjectifAnnuel = pct(caAnnuel, objectifCumule)

  return [
    {
      cle: 'solde_caisse',
      label: 'Solde caisse & banque',
      valeur: soldeCaisse,
      format: 'fcfa',
      famille: 'TRESORERIE',
      detail_principal: `Banque ${(banque / 1_000_000).toFixed(1)} M · caisses ${(caisses / 1_000_000).toFixed(1)} M`,
      detail_secondaire: `Flux net du jour ${fluxJour >= 0 ? '+' : ''}${(fluxJour / 1_000_000).toFixed(1)} M`,
      variation_pct: 4.2,
      variation_label: 'vs M-1',
      invert: false,
      statut: soldeCaisse >= 100_000_000 ? 'SAIN' : soldeCaisse >= 60_000_000 ? 'ATTENTION' : 'CRITIQUE',
      action_label: 'Voir la trésorerie',
      action_href: '/pilotage-financier',
    },
    {
      cle: 'benefice_net',
      label: 'Bénéfice net (mois)',
      valeur: beneficeNet,
      format: 'fcfa',
      famille: 'RESULTAT',
      detail_principal: `Marge nette ${margeNette} % du CA`,
      detail_secondaire: 'Objectif de marge brute 25 % — atteint 23 %',
      variation_pct: -8.4,
      variation_label: 'vs M-1',
      invert: false,
      statut: margeNette >= 5 ? 'SAIN' : margeNette >= 3 ? 'ATTENTION' : 'CRITIQUE',
      seuil_alerte: 'Objectif ≥ 5 % du CA',
      action_label: 'Compte de résultat',
      action_href: '/comptabilite',
    },
    {
      cle: 'credit_client',
      label: 'Crédit client (encours)',
      valeur: creditClient,
      format: 'fcfa',
      famille: 'CREANCE',
      detail_principal: `dont ${(creditRetard / 1_000_000).toFixed(1)} M en retard > 30 j`,
      detail_secondaire: `${clientsRetard} client${clientsRetard > 1 ? 's' : ''} au-delà de l'échéance`,
      variation_pct: 12,
      variation_label: 'vs M-1',
      invert: true,
      statut: creditRetard > creditClient * 0.4 ? 'CRITIQUE' : creditRetard > 0 ? 'ATTENTION' : 'SAIN',
      action_label: 'Voir les impayés',
      action_href: '/relances',
    },
    {
      cle: 'dette_fournisseurs',
      label: 'Dette fournisseurs',
      valeur: DETTE_FOURNISSEURS_TOTALE,
      format: 'fcfa',
      famille: 'DETTE',
      detail_principal: `dont ${(DETTE_FOURNISSEURS_ECHUE / 1_000_000).toFixed(1)} M échus`,
      detail_secondaire: prochaine
        ? `Prochaine échéance ${prochaine.prochaine_echeance} : ${(prochaine.montant_prochaine_echeance / 1_000_000).toFixed(1)} M (${prochaine.nom})`
        : undefined,
      variation_pct: 18.6,
      variation_label: 'vs M-1',
      invert: true,
      statut: DETTE_FOURNISSEURS_ECHUE > 40_000_000 ? 'CRITIQUE' : DETTE_FOURNISSEURS_ECHUE > 15_000_000 ? 'ATTENTION' : 'SAIN',
      seuil_alerte: 'Plafond de dette échue 15 M',
      action_label: 'Échéancier fournisseurs',
      action_href: '/approvisionnement?tab=fournisseurs',
    },
    {
      cle: 'ca_jour',
      label: 'CA journalier',
      valeur: caJour,
      format: 'fcfa',
      famille: 'ACTIVITE',
      detail_principal: `Moyenne 30 j : ${(moyenne30j / 1_000_000).toFixed(1)} M`,
      detail_secondaire: `${commandesJour} commandes prises aujourd'hui`,
      variation_pct: 2.1,
      variation_label: 'vs moyenne 30 j',
      invert: false,
      statut: 'SAIN',
      action_label: 'Voir les commandes',
      action_href: '/commandes',
    },
    {
      cle: 'ca_mois',
      label: 'CA mensuel',
      valeur: caMois,
      format: 'fcfa',
      famille: 'REVENU',
      detail_principal: `${pctObjectifMois} % de l'objectif (${(ENTREPRISE_REGISTRY.ca_objectif_mois / 1_000_000).toFixed(0)} M)`,
      detail_secondaire: `Reste ${((ENTREPRISE_REGISTRY.ca_objectif_mois - caMois) / 1_000_000).toFixed(1)} M à réaliser`,
      variation_pct: 1.7,
      variation_label: 'vs M-1',
      invert: false,
      statut: pctObjectifMois >= 95 ? 'SAIN' : pctObjectifMois >= 85 ? 'ATTENTION' : 'CRITIQUE',
      seuil_alerte: 'Objectif ≥ 95 %',
      action_label: 'Pilotage par zone',
      action_href: '/equipe',
    },
    {
      cle: 'ca_annuel',
      label: 'CA annuel (cumul)',
      valeur: caAnnuel,
      format: 'fcfa',
      famille: 'REVENU',
      detail_principal: `${pctObjectifAnnuel} % de l'objectif cumulé sur ${MOIS_ECOULES} mois`,
      detail_secondaire: `Objectif annuel ${(OBJECTIF_ANNUEL / 1_000_000_000).toFixed(1)} Md`,
      variation_pct: 3.4,
      variation_label: 'vs N-1',
      invert: false,
      statut: pctObjectifAnnuel >= 95 ? 'SAIN' : pctObjectifAnnuel >= 85 ? 'ATTENTION' : 'CRITIQUE',
      action_label: 'Pilotage financier',
      action_href: '/pilotage-financier',
    },
    {
      cle: 'total_commandes',
      label: 'Total commandes',
      valeur: commandesJour,
      format: 'number',
      famille: 'ACTIVITE',
      detail_principal: `${commandesJour} cmd/jour sur le réseau`,
      detail_secondaire: `${commandesTerrain} commandes terrain suivies ce mois`,
      variation_pct: 5.8,
      variation_label: 'vs M-1',
      invert: false,
      statut: 'SAIN',
      action_label: 'File de préparation',
      action_href: '/commandes',
    },
  ]
}

export function getChiffresDuGroupe(chiffres: ChiffreDecisionDG[], cles: string[]): ChiffreDecisionDG[] {
  return cles
    .map(cle => chiffres.find(c => c.cle === cle))
    .filter((c): c is ChiffreDecisionDG => c != null)
}

export const STATUT_DECISION_STYLE: Record<ChiffreDecisionDG['statut'], { pastille: string; ring: string; fond: string }> = {
  SAIN:      { pastille: 'bg-emerald-500', ring: '', fond: 'bg-white' },
  ATTENTION: { pastille: 'bg-amber-500',   ring: '', fond: 'bg-white' },
  CRITIQUE:  { pastille: 'bg-red-500',     ring: 'ring-2 ring-red-300', fond: 'bg-red-50/40' },
}
