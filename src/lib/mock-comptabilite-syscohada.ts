/**
 * Comptabilité IMF — plan SYSCOHADA révisé (système minimal) + contrôles BCEAO.
 * Source de vérité démo pour l’onglet Comptabilité DAF.
 */
import { AGENCES } from './agences'
import { buildEpargneStats } from './mock-operations-registry'
import { getMoisCourant } from './mock-time-series'

export type NatureCompte = 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT' | 'DOTATION'
export type SensSolde = 'D' | 'C'
export type StatutEcriture = 'VALIDEE' | 'BROUILLON' | 'ATTENTE_VALIDATION'
export type JournalCode = 'AN' | 'OD' | 'BQ' | 'CA' | 'CR' | 'VT'
export type StatutRapprochement = 'POINTE' | 'EN_COURS' | 'ECART'

export interface BalanceLigne {
  compte: string
  libelle: string
  classe: number
  nature: NatureCompte
  debit_mois: number
  credit_mois: number
  solde_n: number
  solde_n1: number
  sens_solde_n: SensSolde
}

export interface LigneEcriture {
  compte: string
  libelle: string
  debit: number
  credit: number
}

export interface EcritureJournal {
  id: string
  date: string
  journal: JournalCode
  piece: string
  libelle: string
  lignes: LigneEcriture[]
  statut: StatutEcriture
  auteur: string
  agence?: string
}

export interface MouvementGrandLivre {
  date: string
  piece: string
  libelle: string
  debit: number
  credit: number
  solde_progressif: number
}

export interface GrandLivreCompte {
  compte: string
  libelle: string
  solde_initial: number
  sens_initial: SensSolde
  mouvements: MouvementGrandLivre[]
  total_debit: number
  total_credit: number
  solde_final: number
  sens_final: SensSolde
}

export interface LigneCompteResultat {
  compte: string
  libelle: string
  niveau: 1 | 2 | 3
  montant_mois: number
  montant_ytd: number
  section: 'PRODUITS' | 'CHARGES_EXPLOITATION' | 'CHARGES_FINANCIERES' | 'DOTATIONS_PROVISIONS' | 'RESULTAT'
}

export interface OperationRapprochement {
  date: string
  libelle: string
  montant: number
  sens: 'DEBIT_BANQUE' | 'CREDIT_BANQUE'
  pointage: boolean
  ref_compta?: string
}

export interface RapprochementBancaire {
  id: string
  compte: string
  libelle: string
  banque: string
  periode: string
  solde_comptable: number
  solde_releve: number
  ecart: number
  statut: StatutRapprochement
  date_releve: string
  operations_non_pointees: OperationRapprochement[]
  releve_bancaire: OperationRapprochement[]
}

export interface SuspensComptable {
  compte: string
  solde: number
  age_jours: number
  statut: 'CRITIQUE' | 'ANOMALIE' | 'A_JUSTIFIER' | 'OK'
  note: string
}

export interface PortefeuilleComptaRef {
  dossiers_credit_actifs: number
  comptes_epargne_total: number
  comptes_epargne_actifs: number
  comptes_epargne_dormants: number
  auxiliaires_411: number
  auxiliaires_521: number
}

export interface PlanComptableRef {
  comptes_parametres: number
  comptes_mouvementes_mai: number
  comptes_extraits_balance: number
}

export interface ComptePlanMinimal {
  numero: string
  libelle: string
  classe: number
}

export interface ComptabiliteSyscohadaImf {
  operations: {
    balance_desequilibres: number
    journal_entries_mois: number
    derniere_cloture: string
    prochaine_cloture: string
    ecritures_attente: number
    rapprochements_a_finaliser: number
    cloture_dans_jours: number
    suspens_comptables: SuspensComptable[]
  }
  referentiel: {
    norme: string
    plan: string
    exercice: string
    periode: string
    devise: string
    agences: string[]
    portefeuille: PortefeuilleComptaRef
    plan_stats: PlanComptableRef
    plan_comptable_complet: ComptePlanMinimal[]
  }
  balance_generale: {
    date_arrete: string
    total_debit_mois: number
    total_credit_mois: number
    equilibre: boolean
    lignes: BalanceLigne[]
    comptes_mouvementes: number
  }
  journal: {
    periode: string
    ecritures: EcritureJournal[]
  }
  grand_livre: GrandLivreCompte[]
  compte_resultat_detaille: {
    periode: string
    lignes: LigneCompteResultat[]
    total_produits: number
    total_charges: number
    total_dotations: number
    resultat_net: number
  }
  rapprochements: RapprochementBancaire[]
}

function sumBalance(lignes: BalanceLigne[], nature: NatureCompte, sens: SensSolde): number {
  return lignes
    .filter(l => l.nature === nature && l.sens_solde_n === sens)
    .reduce((s, l) => s + l.solde_n, 0)
}

const PLAN_COMPTES_PARAMETRES = 128

function mouvementsMoisDepuisEncours(encours: number, ratio = 0.032): { debit_mois: number; credit_mois: number } {
  const total = Math.max(Math.round(encours * ratio), 80_000)
  return { debit_mois: Math.round(total * 0.56), credit_mois: Math.round(total * 0.44) }
}

function buildPlanComptableCompletImf(): ComptePlanMinimal[] {
  const base: ComptePlanMinimal[] = [
    { numero: '101100', libelle: 'Capital social', classe: 1 },
    { numero: '106100', libelle: 'Réserves légales', classe: 1 },
    { numero: '121000', libelle: 'Résultat exercice', classe: 1 },
    { numero: '161100', libelle: 'Emprunts établissements de crédit', classe: 1 },
    { numero: '165100', libelle: 'Dépôts de garantie reçus', classe: 1 },
    { numero: '241100', libelle: 'Matériel informatique', classe: 2 },
    { numero: '281100', libelle: 'Amort. matériel informatique', classe: 2 },
    { numero: '401100', libelle: 'Fournisseurs', classe: 4 },
    { numero: '419100', libelle: 'Provisions dépréciation créances', classe: 4 },
    { numero: '471100', libelle: 'Comptes d\'attente', classe: 4 },
    { numero: '512100', libelle: 'Ecobank siège', classe: 5 },
    { numero: '512200', libelle: 'BTCI agences', classe: 5 },
    { numero: '531100', libelle: 'Caisse siège', classe: 5 },
    { numero: '581100', libelle: 'Virements internes', classe: 5 },
    { numero: '521200', libelle: 'Dépôts à terme', classe: 5 },
    { numero: '521190', libelle: 'Dépôts dormants (> 6 mois)', classe: 5 },
  ]
  AGENCES.forEach((a, i) => {
    const s = String(i + 1)
    base.push(
      { numero: `41110${s}`, libelle: `Créances — ${a.nom_court}`, classe: 4 },
      { numero: `41610${s}`, libelle: `Souffrance — ${a.nom_court}`, classe: 4 },
      { numero: `52110${s}`, libelle: `Dépôts vue — ${a.nom_court}`, classe: 5 },
      { numero: `53110${s}`, libelle: `Caisse — ${a.nom_court}`, classe: 5 },
    )
  })
  const chargesProduits = [
    ['641100', 'Salaires', 6], ['641200', 'Charges sociales', 6], ['622100', 'Locations', 6],
    ['631100', 'Frais bancaires', 6], ['657100', 'Pertes créances', 6], ['661100', 'Intérêts emprunts', 6],
    ['701100', 'Intérêts crédits particuliers', 7], ['701200', 'Intérêts PME & groupes', 7],
    ['707100', 'Commissions', 7], ['771100', 'Produits divers', 7], ['871100', 'Dot. provisions', 8],
    ['891100', 'Dot. amortissements', 8],
  ] as const
  chargesProduits.forEach(([numero, libelle, classe]) => base.push({ numero, libelle, classe }))
  const fillers = [
    ['102100', 'Primes émission', 1], ['131100', 'Subventions', 1], ['151100', 'Provisions réglementées', 1],
    ['201100', 'Frais établissement', 2], ['211100', 'Terrains', 2], ['218100', 'Matériel bureau', 2],
    ['281200', 'Amort. bureau', 2], ['291100', 'Prov. immos', 2],
    ['403100', 'Fournisseurs effets', 4], ['408100', 'Fournisseurs factures', 4],
    ['421100', 'Personnel rémunérations', 4], ['425100', 'Avances personnel', 4],
    ['443100', 'État TVA', 4], ['444100', 'État impôts', 4],
    ['461100', 'Débiteurs divers', 4], ['462100', 'Créditeurs divers', 4],
    ['485100', 'Comptes transitoires', 4],
    ['514100', 'Chèques postaux', 5], ['515100', 'Virements en cours', 5],
    ['532100', 'Caisse mobile money', 5], ['541100', 'Valeurs en caisse', 5],
    ['551100', 'Titres placement', 5], ['571100', 'Caisse dépenses', 5],
    ['601100', 'Achats', 6], ['602100', 'Achats stockés', 6], ['604100', 'Achats études', 6],
    ['605100', 'Autres achats', 6], ['611100', 'Sous-traitance', 6], ['612100', 'Redevances', 6],
    ['613100', 'Locations', 6], ['614100', 'Charges locatives', 6], ['615100', 'Entretien', 6],
    ['616100', 'Primes assurance', 6], ['617100', 'Études', 6], ['618100', 'Documentation', 6],
    ['623100', 'Publicité', 6], ['624100', 'Transports', 6], ['625100', 'Déplacements', 6],
    ['626100', 'Frais postaux', 6], ['627100', 'Services bancaires', 6], ['628100', 'Télécom', 6],
    ['651100', 'Redevances crédit-bail', 6], ['658100', 'Charges diverses', 6],
    ['661200', 'Intérêts dettes', 6], ['671100', 'Charges exceptionnelles', 6],
    ['702100', 'Intérêts dépôts', 7], ['703100', 'Revenus titres', 7], ['704100', 'Commissions MoMo', 7],
    ['705100', 'Commissions transferts', 7], ['706100', 'Produits accessoires', 7],
    ['781100', 'Reprises provisions', 7], ['791100', 'Produits exceptionnels', 7],
    ['811100', 'Dot. immos', 8], ['821100', 'Dot. stocks', 8],
  ] as const
  fillers.forEach(([numero, libelle, classe]) => {
    if (base.length < PLAN_COMPTES_PARAMETRES) base.push({ numero, libelle, classe })
  })
  while (base.length < PLAN_COMPTES_PARAMETRES) {
    const n = base.length + 1
    base.push({ numero: `999${String(n).padStart(3, '0')}`, libelle: `Compte technique ${n}`, classe: 9 })
  }
  return base.slice(0, PLAN_COMPTES_PARAMETRES)
}

/** Balance mai — encours et portefeuille alignés sur RESEAU_MENSUEL + épargne */
function buildBalanceLignesImfMai(): {
  lignes: BalanceLigne[]
  portefeuille: PortefeuilleComptaRef
  planComplet: ComptePlanMinimal[]
  creancesPerformantes: number
  creancesSouffrance: number
  encoursEpargneVue: number
} {
  const m = getMoisCourant()
  const epargne = buildEpargneStats()
  const encoursReseau = m.encours_fcfa
  const creancesSouffrance = Math.round(encoursReseau * (m.par_30 / 100))
  const creancesPerformantes = encoursReseau - creancesSouffrance
  const encoursEpargneVue = epargne.encours_epargne_total
  const depotsTerme = 564_000_000
  const sumEncoursAg = AGENCES.reduce((s, a) => s + a.encours_fcfa, 0)

  const portefeuille: PortefeuilleComptaRef = {
    dossiers_credit_actifs: m.emprunteurs,
    comptes_epargne_total: epargne.total_comptes,
    comptes_epargne_actifs: epargne.actifs,
    comptes_epargne_dormants: epargne.dormants,
    auxiliaires_411: m.emprunteurs,
    auxiliaires_521: epargne.total_comptes,
  }

  const lignes: BalanceLigne[] = [
    { compte: '101100', libelle: 'Capital social souscrit', classe: 1, nature: 'PASSIF', debit_mois: 0, credit_mois: 0, solde_n: 480_000_000, solde_n1: 480_000_000, sens_solde_n: 'C' },
    { compte: '106100', libelle: 'Réserves légales', classe: 1, nature: 'PASSIF', debit_mois: 0, credit_mois: 2_400_000, solde_n: 48_000_000, solde_n1: 45_600_000, sens_solde_n: 'C' },
    { compte: '121000', libelle: 'Résultat de l\'exercice', classe: 1, nature: 'PASSIF', debit_mois: 0, credit_mois: 18_400_000, solde_n: 18_400_000, solde_n1: 0, sens_solde_n: 'C' },
    { compte: '161100', libelle: 'Emprunts établissements de crédit', classe: 1, nature: 'PASSIF', debit_mois: 2_000_000, credit_mois: 0, solde_n: 280_000_000, solde_n1: 282_000_000, sens_solde_n: 'C' },
    { compte: '241100', libelle: 'Matériel informatique', classe: 2, nature: 'ACTIF', debit_mois: 1_200_000, credit_mois: 0, solde_n: 42_000_000, solde_n1: 40_800_000, sens_solde_n: 'D' },
    { compte: '281100', libelle: 'Amort. matériel informatique', classe: 2, nature: 'PASSIF', debit_mois: 0, credit_mois: 800_000, solde_n: 18_000_000, solde_n1: 17_200_000, sens_solde_n: 'C' },
    { compte: '419100', libelle: 'Provisions pour dépréciation créances', classe: 4, nature: 'PASSIF', debit_mois: 0, credit_mois: 1_180_000, solde_n: 28_400_000, solde_n1: 27_220_000, sens_solde_n: 'C' },
    { compte: '401100', libelle: 'Fournisseurs', classe: 4, nature: 'PASSIF', debit_mois: 120_000, credit_mois: 480_000, solde_n: 480_000, solde_n1: 520_000, sens_solde_n: 'C' },
    { compte: '471100', libelle: 'Comptes d\'attente — opérations diverses', classe: 4, nature: 'ACTIF', debit_mois: 200_000, credit_mois: 0, solde_n: 820_000, solde_n1: 620_000, sens_solde_n: 'D' },
    { compte: '512100', libelle: 'Ecobank — compte siège Lomé', classe: 5, nature: 'ACTIF', debit_mois: 48_200_000, credit_mois: 44_800_000, solde_n: 312_000_000, solde_n1: 298_000_000, sens_solde_n: 'D' },
    { compte: '512200', libelle: 'BTCI — compte agences réseau', classe: 5, nature: 'ACTIF', debit_mois: 22_100_000, credit_mois: 19_400_000, solde_n: 68_000_000, solde_n1: 65_200_000, sens_solde_n: 'D' },
    { compte: '531100', libelle: 'Caisse principale siège', classe: 5, nature: 'ACTIF', debit_mois: 8_400_000, credit_mois: 7_900_000, solde_n: 12_400_000, solde_n1: 11_900_000, sens_solde_n: 'D' },
    { compte: '581100', libelle: 'Virements internes', classe: 5, nature: 'ACTIF', debit_mois: 4_200_000, credit_mois: 4_200_000, solde_n: 0, solde_n1: 0, sens_solde_n: 'D' },
    { compte: '521200', libelle: 'Dépôts à terme & DAT', classe: 5, nature: 'PASSIF', debit_mois: 1_100_000, credit_mois: 2_400_000, solde_n: depotsTerme, solde_n1: depotsTerme - 1_300_000, sens_solde_n: 'C' },
    { compte: '521190', libelle: 'Dépôts dormants (> 6 mois)', classe: 5, nature: 'PASSIF', debit_mois: 12_000, credit_mois: 0, solde_n: epargne.encours_dormants, solde_n1: epargne.encours_dormants + 40_000, sens_solde_n: 'C' },
    { compte: '641100', libelle: 'Salaires personnel', classe: 6, nature: 'CHARGE', debit_mois: 8_400_000, credit_mois: 0, solde_n: 8_400_000, solde_n1: 8_200_000, sens_solde_n: 'D' },
    { compte: '641200', libelle: 'Charges sociales', classe: 6, nature: 'CHARGE', debit_mois: 1_800_000, credit_mois: 0, solde_n: 1_800_000, solde_n1: 1_750_000, sens_solde_n: 'D' },
    { compte: '622100', libelle: 'Locations & loyers', classe: 6, nature: 'CHARGE', debit_mois: 1_200_000, credit_mois: 0, solde_n: 1_200_000, solde_n1: 1_180_000, sens_solde_n: 'D' },
    { compte: '631100', libelle: 'Frais bancaires', classe: 6, nature: 'CHARGE', debit_mois: 420_000, credit_mois: 0, solde_n: 420_000, solde_n1: 380_000, sens_solde_n: 'D' },
    { compte: '657100', libelle: 'Pertes sur créances irrécouvrables', classe: 6, nature: 'CHARGE', debit_mois: 1_240_000, credit_mois: 0, solde_n: 1_240_000, solde_n1: 980_000, sens_solde_n: 'D' },
    { compte: '661100', libelle: 'Charges d\'intérêts emprunts', classe: 6, nature: 'CHARGE', debit_mois: 880_000, credit_mois: 0, solde_n: 880_000, solde_n1: 920_000, sens_solde_n: 'D' },
    { compte: '701100', libelle: 'Intérêts sur crédits — particuliers', classe: 7, nature: 'PRODUIT', debit_mois: 0, credit_mois: 24_800_000, solde_n: 24_800_000, solde_n1: 23_600_000, sens_solde_n: 'C' },
    { compte: '701200', libelle: 'Intérêts sur crédits — PME & groupes', classe: 7, nature: 'PRODUIT', debit_mois: 0, credit_mois: 12_400_000, solde_n: 12_400_000, solde_n1: 11_800_000, sens_solde_n: 'C' },
    { compte: '707100', libelle: 'Commissions & frais dossier', classe: 7, nature: 'PRODUIT', debit_mois: 0, credit_mois: 3_600_000, solde_n: 3_600_000, solde_n1: 3_400_000, sens_solde_n: 'C' },
    { compte: '771100', libelle: 'Produits divers de gestion', classe: 7, nature: 'PRODUIT', debit_mois: 0, credit_mois: 1_480_000, solde_n: 1_480_000, solde_n1: 1_200_000, sens_solde_n: 'C' },
    { compte: '871100', libelle: 'Dotations aux provisions créances', classe: 8, nature: 'DOTATION', debit_mois: 1_180_000, credit_mois: 0, solde_n: 1_180_000, solde_n1: 920_000, sens_solde_n: 'D' },
    { compte: '891100', libelle: 'Dotations aux amortissements', classe: 8, nature: 'DOTATION', debit_mois: 800_000, credit_mois: 0, solde_n: 800_000, solde_n1: 780_000, sens_solde_n: 'D' },
  ]

  AGENCES.forEach((a, i) => {
    const suffix = String(i + 1)
    const part = a.encours_fcfa / sumEncoursAg
    const solde411 = Math.round(creancesPerformantes * part)
    const solde416 = Math.round(creancesSouffrance * part)
    const epAg = epargne.par_agence.find(p => p.agence_id === a.id)
    const solde521 = epAg?.encours ?? Math.round(encoursEpargneVue * part)
    const mvt411 = mouvementsMoisDepuisEncours(solde411)
    const mvt416 = mouvementsMoisDepuisEncours(solde416, 0.045)
    const mvt521 = mouvementsMoisDepuisEncours(solde521, 0.038)
    const caisse = Math.round(2_400_000 + part * 9_800_000)
    const mvtCaisse = mouvementsMoisDepuisEncours(caisse, 0.85)

    lignes.push(
      {
        compte: `41110${suffix}`,
        libelle: `Créances clientèle — ${a.nom_court} (${a.emprunteurs_actifs} dossiers)`,
        classe: 4,
        nature: 'ACTIF',
        ...mvt411,
        solde_n: solde411,
        solde_n1: Math.round(solde411 * 0.985),
        sens_solde_n: 'D',
      },
      {
        compte: `41610${suffix}`,
        libelle: `Créances souffrance — ${a.nom_court} (PAR ${a.par_courant} %)`,
        classe: 4,
        nature: 'ACTIF',
        ...mvt416,
        solde_n: solde416,
        solde_n1: Math.round(solde416 * 0.97),
        sens_solde_n: 'D',
      },
      {
        compte: `52110${suffix}`,
        libelle: `Dépôts à vue — ${a.nom_court} (${epAg?.count ?? 0} comptes)`,
        classe: 5,
        nature: 'PASSIF',
        ...mvt521,
        solde_n: solde521,
        solde_n1: Math.round(solde521 * 0.992),
        sens_solde_n: 'C',
      },
      {
        compte: `53110${suffix}`,
        libelle: `Caisse agence — ${a.nom_court}`,
        classe: 5,
        nature: 'ACTIF',
        ...mvtCaisse,
        solde_n: caisse,
        solde_n1: Math.round(caisse * 0.96),
        sens_solde_n: 'D',
      },
    )
  })

  return {
    lignes,
    portefeuille,
    planComplet: buildPlanComptableCompletImf(),
    creancesPerformantes,
    creancesSouffrance,
    encoursEpargneVue,
  }
}

/** Plan comptable IMF — balance mai 2026 (cohérente bilan consolidé mock) */
export function buildComptabiliteSyscohadaImf(): ComptabiliteSyscohadaImf {
  const {
    lignes: balanceLignes,
    portefeuille,
    planComplet,
    creancesPerformantes,
    creancesSouffrance,
  } = buildBalanceLignesImfMai()

  const comptesMouvementes = balanceLignes.filter(l => l.debit_mois + l.credit_mois > 0).length
  const planStats: PlanComptableRef = {
    comptes_parametres: PLAN_COMPTES_PARAMETRES,
    comptes_mouvementes_mai: comptesMouvementes,
    comptes_extraits_balance: balanceLignes.length,
  }

  const journalEntriesMois = Math.round(
    portefeuille.dossiers_credit_actifs * 1.47 + portefeuille.comptes_epargne_actifs * 0.55,
  )

  const totalDebitMois = balanceLignes.reduce((s, l) => s + l.debit_mois, 0)
  const totalCreditMois = balanceLignes.reduce((s, l) => s + l.credit_mois, 0)

  const ecritures: EcritureJournal[] = [
    {
      id: 'EC-2026-1842',
      date: '21/05/2026',
      journal: 'CR',
      piece: 'DEC-AG003-0521',
      libelle: 'Décaissement crédit individuel — client Apedo',
      statut: 'VALIDEE',
      auteur: 'compta.ra.bk',
      agence: 'Bè Kpota',
      lignes: [
        { compte: '411103', libelle: 'Créance client Bè Kpota', debit: 350_000, credit: 0 },
        { compte: '512100', libelle: 'Ecobank siège', debit: 0, credit: 350_000 },
      ],
    },
    {
      id: 'EC-2026-1841',
      date: '21/05/2026',
      journal: 'BQ',
      piece: 'REM-MOMO-2105',
      libelle: 'Remboursement MoMo — Mensah Kodjo',
      statut: 'VALIDEE',
      auteur: 'auto.collecte',
      agence: 'Lomé Centre',
      lignes: [
        { compte: '512100', libelle: 'Ecobank siège', debit: 125_000, credit: 0 },
        { compte: '411101', libelle: 'Créance client Lomé Centre', debit: 0, credit: 125_000 },
      ],
    },
    {
      id: 'EC-2026-1838',
      date: '20/05/2026',
      journal: 'OD',
      piece: 'PROV-BCEAO-05',
      libelle: 'Dotation provisions BCEAO — classe douteux',
      statut: 'VALIDEE',
      auteur: 'daf.kaf',
      lignes: [
        { compte: '871100', libelle: 'Dotation provisions', debit: 1_180_000, credit: 0 },
        { compte: '419100', libelle: 'Provision créances', debit: 0, credit: 1_180_000 },
      ],
    },
    {
      id: 'EC-2026-1835',
      date: '20/05/2026',
      journal: 'OD',
      piece: 'PAIE-05-2026',
      libelle: 'Charges salariales mai — virement',
      statut: 'VALIDEE',
      auteur: 'paie.rh',
      lignes: [
        { compte: '641100', libelle: 'Salaires', debit: 8_400_000, credit: 0 },
        { compte: '512100', libelle: 'Ecobank siège', debit: 0, credit: 8_400_000 },
      ],
    },
    {
      id: 'EC-2026-1830',
      date: '19/05/2026',
      journal: 'CA',
      piece: 'CAISSE-1905-47',
      libelle: 'Dépôt espèces guichet — Lomé Centre',
      statut: 'VALIDEE',
      auteur: 'caisse.lc',
      agence: 'Lomé Centre',
      lignes: [
        { compte: '531100', libelle: 'Caisse', debit: 280_000, credit: 0 },
        { compte: '521100', libelle: 'Dépôt client', debit: 0, credit: 280_000 },
      ],
    },
    {
      id: 'EC-2026-1824',
      date: '18/05/2026',
      journal: 'OD',
      piece: 'PERTE-657-0418',
      libelle: 'Constat perte créance — dossier classé perte',
      statut: 'VALIDEE',
      auteur: 'daf.kaf',
      lignes: [
        { compte: '657100', libelle: 'Pertes créances', debit: 420_000, credit: 0 },
        { compte: '416100', libelle: 'Créances souffrance', debit: 0, credit: 420_000 },
      ],
    },
    {
      id: 'EC-2026-1820',
      date: '17/05/2026',
      journal: 'BQ',
      piece: 'VIR-INT-1617',
      libelle: 'Virement interne agence → siège',
      statut: 'VALIDEE',
      auteur: 'treso.auto',
      lignes: [
        { compte: '512100', libelle: 'Ecobank siège', debit: 1_500_000, credit: 0 },
        { compte: '512200', libelle: 'BTCI agences', debit: 0, credit: 1_500_000 },
      ],
    },
    {
      id: 'EC-2026-ATT-003',
      date: '21/05/2026',
      journal: 'OD',
      piece: 'AJUST-512-2105',
      libelle: 'Ajustement manuel trésorerie — sans pièce jointe',
      statut: 'ATTENTE_VALIDATION',
      auteur: 'kpade.j',
      lignes: [
        { compte: '512100', libelle: 'Ecobank siège', debit: 450_000, credit: 0 },
        { compte: '471100', libelle: 'Compte attente', debit: 0, credit: 450_000 },
      ],
    },
    {
      id: 'EC-2026-ATT-002',
      date: '20/05/2026',
      journal: 'OD',
      piece: 'REG-471-2005',
      libelle: 'Régularisation compte 471 — pièce manquante',
      statut: 'ATTENTE_VALIDATION',
      auteur: 'compta.siege',
      lignes: [
        { compte: '471100', libelle: 'Compte attente', debit: 320_000, credit: 0 },
        { compte: '401100', libelle: 'Fournisseur', debit: 0, credit: 320_000 },
      ],
    },
    {
      id: 'EC-2026-ATT-001',
      date: '19/05/2026',
      journal: 'AN',
      piece: 'AN-PROV-1905',
      libelle: 'A nouveau provisions — reprise partielle',
      statut: 'ATTENTE_VALIDATION',
      auteur: 'daf.kaf',
      lignes: [
        { compte: '419100', libelle: 'Provision', debit: 180_000, credit: 0 },
        { compte: '871100', libelle: 'Dotation', debit: 0, credit: 180_000 },
      ],
    },
  ]

  const ligne411Bk = balanceLignes.find(l => l.compte === '411103')
  const gl411: GrandLivreCompte = {
    compte: '411103',
    libelle: 'Créances clientèle — Bè Kpota',
    solde_initial: ligne411Bk ? Math.round(ligne411Bk.solde_n1) : 97_500_000,
    sens_initial: 'D',
    mouvements: [
      { date: '19/05', piece: 'REM-MOMO', libelle: 'Remb. Mensah Kodjo (LC→BK)', debit: 0, credit: 125_000, solde_progressif: (ligne411Bk?.solde_n1 ?? 97_500_000) - 125_000 },
      { date: '20/05', piece: 'REM-ESP', libelle: 'Remb. Yawo Adjavon', debit: 0, credit: 98_000, solde_progressif: (ligne411Bk?.solde_n1 ?? 97_500_000) - 223_000 },
      { date: '21/05', piece: 'DEC-AG003', libelle: 'Décaiss. Apedo', debit: 350_000, credit: 0, solde_progressif: (ligne411Bk?.solde_n1 ?? 97_500_000) + 127_000 },
      { date: '21/05', piece: 'INT-MAI', libelle: 'Intérêts courus mai', debit: ligne411Bk?.debit_mois ?? 3_200_000, credit: 0, solde_progressif: ligne411Bk?.solde_n ?? 99_700_000 },
    ],
    total_debit: ligne411Bk?.debit_mois ?? 3_200_000,
    total_credit: ligne411Bk?.credit_mois ?? 2_100_000,
    solde_final: ligne411Bk?.solde_n ?? 99_700_000,
    sens_final: 'D',
  }

  const gl512: GrandLivreCompte = {
    compte: '512100',
    libelle: 'Ecobank — compte siège Lomé',
    solde_initial: 298_000_000,
    sens_initial: 'D',
    mouvements: [
      { date: '17/05', piece: 'VIR-INT', libelle: 'Virement agences', debit: 1_500_000, credit: 0, solde_progressif: 299_500_000 },
      { date: '19/05', piece: 'REM-MOMO', libelle: 'Encaissement MoMo', debit: 125_000, credit: 0, solde_progressif: 299_625_000 },
      { date: '20/05', piece: 'PAIE-05', libelle: 'Paie mai', debit: 0, credit: 8_400_000, solde_progressif: 291_225_000 },
      { date: '21/05', piece: 'DEC-AG003', libelle: 'Décaissement', debit: 0, credit: 350_000, solde_progressif: 290_875_000 },
      { date: '21/05', piece: 'AJUST-OD', libelle: 'Ajust. attente (non validé)', debit: 450_000, credit: 0, solde_progressif: 312_000_000 },
    ],
    total_debit: 48_200_000,
    total_credit: 44_800_000,
    solde_final: 312_000_000,
    sens_final: 'D',
  }

  const gl471: GrandLivreCompte = {
    compte: '471100',
    libelle: 'Comptes d\'attente',
    solde_initial: 620_000,
    sens_initial: 'D',
    mouvements: [
      { date: '18/05', piece: 'OD-471-01', libelle: 'Opération non identifiée', debit: 200_000, credit: 0, solde_progressif: 820_000 },
      { date: '21/05', piece: 'AJUST-512', libelle: 'Contrepartie ajust. 512', debit: 0, credit: 450_000, solde_progressif: 370_000 },
    ],
    total_debit: 200_000,
    total_credit: 450_000,
    solde_final: 820_000,
    sens_final: 'D',
  }

  const crLignes: LigneCompteResultat[] = [
    { compte: '70', libelle: 'PRODUITS D\'EXPLOITATION', niveau: 1, montant_mois: 42_280_000, montant_ytd: 198_400_000, section: 'PRODUITS' },
    { compte: '701', libelle: 'Intérêts et produits assimilés', niveau: 2, montant_mois: 37_200_000, montant_ytd: 174_200_000, section: 'PRODUITS' },
    { compte: '701100', libelle: 'Intérêts crédits particuliers', niveau: 3, montant_mois: 24_800_000, montant_ytd: 116_400_000, section: 'PRODUITS' },
    { compte: '701200', libelle: 'Intérêts crédits PME & groupes', niveau: 3, montant_mois: 12_400_000, montant_ytd: 57_800_000, section: 'PRODUITS' },
    { compte: '707', libelle: 'Commissions perçues', niveau: 2, montant_mois: 3_600_000, montant_ytd: 16_800_000, section: 'PRODUITS' },
    { compte: '771', libelle: 'Produits divers', niveau: 2, montant_mois: 1_480_000, montant_ytd: 7_400_000, section: 'PRODUITS' },
    { compte: '66', libelle: 'CHARGES D\'EXPLOITATION', niveau: 1, montant_mois: 13_940_000, montant_ytd: 64_200_000, section: 'CHARGES_EXPLOITATION' },
    { compte: '641', libelle: 'Charges de personnel', niveau: 2, montant_mois: 10_200_000, montant_ytd: 47_600_000, section: 'CHARGES_EXPLOITATION' },
    { compte: '641100', libelle: 'Salaires', niveau: 3, montant_mois: 8_400_000, montant_ytd: 39_200_000, section: 'CHARGES_EXPLOITATION' },
    { compte: '641200', libelle: 'Charges sociales', niveau: 3, montant_mois: 1_800_000, montant_ytd: 8_400_000, section: 'CHARGES_EXPLOITATION' },
    { compte: '622', libelle: 'Services extérieurs', niveau: 2, montant_mois: 1_200_000, montant_ytd: 5_600_000, section: 'CHARGES_EXPLOITATION' },
    { compte: '631', libelle: 'Frais bancaires', niveau: 2, montant_mois: 420_000, montant_ytd: 1_960_000, section: 'CHARGES_EXPLOITATION' },
    { compte: '657', libelle: 'Pertes sur créances', niveau: 2, montant_mois: 1_240_000, montant_ytd: 4_800_000, section: 'CHARGES_EXPLOITATION' },
    { compte: '66F', libelle: 'CHARGES FINANCIÈRES', niveau: 1, montant_mois: 880_000, montant_ytd: 4_200_000, section: 'CHARGES_FINANCIERES' },
    { compte: '661100', libelle: 'Intérêts emprunts', niveau: 3, montant_mois: 880_000, montant_ytd: 4_200_000, section: 'CHARGES_FINANCIERES' },
    { compte: '87', libelle: 'DOTATIONS (classe 8)', niveau: 1, montant_mois: 1_980_000, montant_ytd: 8_600_000, section: 'DOTATIONS_PROVISIONS' },
    { compte: '871', libelle: 'Dotations provisions créances', niveau: 2, montant_mois: 1_180_000, montant_ytd: 5_200_000, section: 'DOTATIONS_PROVISIONS' },
    { compte: '891', libelle: 'Dotations amortissements', niveau: 2, montant_mois: 800_000, montant_ytd: 3_400_000, section: 'DOTATIONS_PROVISIONS' },
    { compte: 'RN', libelle: 'RÉSULTAT NET (après dotations)', niveau: 1, montant_mois: 18_400_000, montant_ytd: 98_600_000, section: 'RESULTAT' },
  ]

  const totalProduits = 42_280_000
  const totalCharges = 13_940_000 + 880_000
  const totalDotations = 1_980_000

  const rapprochements: RapprochementBancaire[] = [
    {
      id: 'RAP-512100',
      compte: '512100',
      libelle: 'Ecobank — compte siège Lomé',
      banque: 'Ecobank Togo',
      periode: 'Mai 2026',
      solde_comptable: 312_000_000,
      solde_releve: 311_550_000,
      ecart: 450_000,
      statut: 'EN_COURS',
      date_releve: '20/05/2026',
      operations_non_pointees: [
        { date: '21/05', libelle: 'Ajustement OD AJUST-512-2105 (kpade.j)', montant: 450_000, sens: 'DEBIT_BANQUE', pointage: false, ref_compta: 'EC-2026-ATT-003' },
        { date: '20/05', libelle: 'Frais tenue compte — non comptabilisé', montant: 12_500, sens: 'CREDIT_BANQUE', pointage: false },
      ],
      releve_bancaire: [
        { date: '19/05', libelle: 'VIR RECU AGENCES RESEAU', montant: 1_500_000, sens: 'DEBIT_BANQUE', pointage: true, ref_compta: 'EC-2026-1820' },
        { date: '19/05', libelle: 'REMBOURSEMENT MOMO BATCH', montant: 125_000, sens: 'DEBIT_BANQUE', pointage: true, ref_compta: 'EC-2026-1841' },
        { date: '20/05', libelle: 'VIR SALAIRES MAI', montant: 8_400_000, sens: 'CREDIT_BANQUE', pointage: true, ref_compta: 'EC-2026-1835' },
        { date: '21/05', libelle: 'DECAISSEMENT CREDIT APEDO', montant: 350_000, sens: 'CREDIT_BANQUE', pointage: true, ref_compta: 'EC-2026-1842' },
      ],
    },
    {
      id: 'RAP-512200',
      compte: '512200',
      libelle: 'BTCI — comptes agences',
      banque: 'BTCI',
      periode: 'Mai 2026',
      solde_comptable: 68_000_000,
      solde_releve: 68_000_000,
      ecart: 0,
      statut: 'POINTE',
      date_releve: '20/05/2026',
      operations_non_pointees: [],
      releve_bancaire: [
        { date: '17/05', libelle: 'VIR SORTANT VERS SIEGE', montant: 1_500_000, sens: 'CREDIT_BANQUE', pointage: true, ref_compta: 'EC-2026-1820' },
      ],
    },
  ]

  return {
    operations: {
      balance_desequilibres: 0,
      journal_entries_mois: journalEntriesMois,
      derniere_cloture: '30/04/2026',
      prochaine_cloture: '31/05/2026',
      ecritures_attente: 3,
      rapprochements_a_finaliser: 2,
      cloture_dans_jours: 7,
      suspens_comptables: [
        { compte: '401100 — Fournisseurs', solde: 480_000, age_jours: 45, statut: 'ANOMALIE', note: 'Facture en attente validation DG' },
        { compte: '471100 — Comptes attente', solde: 820_000, age_jours: 62, statut: 'CRITIQUE', note: 'Aucune justification depuis 62 jours' },
        { compte: '512100 — Banque (ajust.)', solde: 450_000, age_jours: 1, statut: 'A_JUSTIFIER', note: 'Ajustement manuel kpade.j — sans pièce' },
        { compte: '165100 — Dépôts garanties', solde: 120_000, age_jours: 15, statut: 'OK', note: 'Libération client Mensah en cours' },
      ],
    },
    referentiel: {
      norme: 'SYSCOHADA révisé',
      plan: 'Plan comptable des EES / IMF (système minimal BCEAO)',
      exercice: '2026',
      periode: 'Mai 2026',
      devise: 'FCFA',
      agences: ['Siège Lomé', 'Lomé Centre', 'Adidogomé', 'Bè Kpota', 'Hédzranawoé', 'Kpalimé'],
      portefeuille,
      plan_stats: planStats,
      plan_comptable_complet: planComplet,
    },
    balance_generale: {
      date_arrete: '31/05/2026',
      total_debit_mois: totalDebitMois,
      total_credit_mois: totalCreditMois,
      equilibre: Math.abs(totalDebitMois - totalCreditMois) < 1,
      lignes: balanceLignes,
      comptes_mouvementes: comptesMouvementes,
    },
    journal: {
      periode: 'Mai 2026',
      ecritures,
    },
    grand_livre: [gl512, gl411, gl471],
    compte_resultat_detaille: {
      periode: 'Mai 2026',
      lignes: crLignes,
      total_produits: totalProduits,
      total_charges: totalCharges,
      total_dotations: totalDotations,
      resultat_net: totalProduits - totalCharges - totalDotations,
    },
    rapprochements,
  }
}

/** Totaux balance pour contrôle actif / passif */
export function getBalanceControles(balance: BalanceLigne[]) {
  const actif = sumBalance(balance, 'ACTIF', 'D')
  const passif = sumBalance(balance, 'PASSIF', 'C')
  return { actif, passif, ecart: actif - passif }
}
