/**
 * Génération déterministe des données enrichies pour tout dossier crédit.
 */
import { AGENCES } from '@/lib/agences'
import { TERRAIN_COMMERCIAL } from '@/lib/equipe-terrain-data'
import type { RapportCC } from '@/lib/mockMicrofinance'
import type {
  Cautionnaire,
  EnrichissementDossier,
  Garantie,
  IdentiteClientEnrichi,
  LocalisationPoint,
  PretAnterieur,
  SentimentDossier,
  TransactionCompte,
} from '@/lib/dossier-enrichissement'

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number, i = 0): T {
  return arr[(seed + i) % arr.length]
}

function agenceForLocalite(localite: string): string {
  const ag = AGENCES.find(a =>
    a.nom_court === localite
    || localite.includes(a.nom_court.split(' ')[0]),
  )
  return ag?.nom_court ?? localite
}

function agentForAgence(agenceNom: string): string {
  const ag = AGENCES.find(a => a.nom_court === agenceNom)
  const agent = TERRAIN_COMMERCIAL.find(a => a.agence_id === ag?.id && a.role === 'GP')
    ?? TERRAIN_COMMERCIAL.find(a => a.agence_id === ag?.id)
  return agent?.nom ?? 'Agent terrain'
}

function buildIdentite(d: RapportCC, seed: number): IdentiteClientEnrichi {
  const femme = /a$|wa$|é$|e$|i$|Akossiwa|Mawuena|Adjoa|Afi|Enyonam/i.test(d.client.prenom)
  const anneeNaiss = 2026 - d.client.age
  const moisJour = 3 + (seed % 20)
  const mois = String(1 + (seed % 12)).padStart(2, '0')
  const jour = String(moisJour).padStart(2, '0')
  const situations = d.score_consolide >= 70
    ? ['Marié(e)', 'Mariée', 'Marié']
    : ['Célibataire', 'Marié(e)', 'Union libre']
  const liens = ['Époux/se', 'Frère', 'Sœur', 'Fils', 'Fille', 'Cousin(e)', 'Ami(e) proche']
  const prenomsUrg = ['Koffi', 'Abla', 'Komla', 'Edem', 'Akua', 'Mawu', 'Sena', 'Yawa']
  const nomsUrg = ['Mensah', 'Lawson', 'Tétévi', 'Kpodar', 'Dossou', 'Agbeko', 'Sodji']

  const clientDepuis = d.score_consolide >= 75
    ? String(2012 + (seed % 8))
    : d.score_consolide >= 55
      ? String(2018 + (seed % 5))
      : String(2022 + (seed % 3))

  return {
    genre: femme ? 'F' : 'M',
    date_naissance: `${jour}/${mois}/${anneeNaiss}`,
    situation_matrimoniale: pick(situations, seed),
    personnes_charge: d.score_consolide >= 70 ? 2 + (seed % 4) : 0 + (seed % 3),
    cni: `N° ${4000 + (seed % 5999)} ${5000 + (seed % 4999)} ${1000 + (seed % 8999)}`,
    whatsapp: d.client.telephone,
    telephone_secondaire: d.client.telephone.replace(/\d{2}$/, String(10 + (seed % 89)).padStart(2, '0')),
    client_depuis: clientDepuis,
    contact_urgence: {
      prenom: pick(prenomsUrg, seed, 1),
      nom: d.client.nom === pick(nomsUrg, seed) ? pick(nomsUrg, seed, 2) : pick(nomsUrg, seed),
      lien: pick(liens, seed, 3),
      telephone: `+228 ${90 + (seed % 9)} ${String(10 + (seed % 89)).padStart(2, '0')} ${String(10 + (seed % 89)).padStart(2, '0')} ${String(10 + (seed % 89)).padStart(2, '0')}`,
    },
  }
}

function buildLocalisations(d: RapportCC, agence: string, seed: number): LocalisationPoint[] {
  const verifie = d.detail_dimensions.find(x => x.code === 'D6')?.active ?? d.score_consolide >= 50
  return [
    {
      type: 'DOMICILE',
      adresse: `Quartier ${pick(['Tokoin', 'Agbodrafo', 'Gbossimé', 'Assigamé', 'Zongo', 'Centre-ville'], seed)}, ${d.client.localite}`,
      quartier: d.client.localite,
      verifie_terrain: verifie,
      distance_agence_km: Number((0.8 + (seed % 45) / 10).toFixed(1)),
    },
    {
      type: 'TRAVAIL',
      adresse: d.client.activite.slice(0, 72),
      quartier: agence,
      verifie_terrain: verifie && d.score_consolide >= 55,
      distance_agence_km: Number((1.2 + (seed % 35) / 10).toFixed(1)),
    },
  ]
}

/** 6–8 mouvements sur 3 mois (≥2/mois), profil dépôts selon score */
function buildTransactions(d: RapportCC, seed: number): TransactionCompte[] {
  const montant = d.montant_demande
  const baseSolde = Math.round(montant * (0.35 + (seed % 20) / 100))
  const depositBias = d.score_consolide >= 75 ? 0.75 : d.score_consolide >= 55 ? 0.6 : 0.45
  const suspect = d.alertes_actives.some(a => a.code === 'DEPOT_PRE_RDV_SUSPECT')

  const slots: Array<{ mois: string; jour: number; kind: 'DEPOT' | 'RETRAIT' | 'MOMO' | 'VIREMENT' }> = [
    { mois: '03', jour: 8 + (seed % 5), kind: 'DEPOT' },
    { mois: '03', jour: 22 + (seed % 6), kind: depositBias > 0.5 ? 'RETRAIT' : 'DEPOT' },
    { mois: '04', jour: 6 + (seed % 8), kind: 'DEPOT' },
    { mois: '04', jour: 18 + (seed % 10), kind: 'DEPOT' },
    { mois: '05', jour: 3 + (seed % 5), kind: 'DEPOT' },
    { mois: '05', jour: 12 + (seed % 8), kind: 'RETRAIT' },
    { mois: '05', jour: 20 + (seed % 5), kind: depositBias >= 0.65 ? 'DEPOT' : 'MOMO' },
  ]

  if (suspect) {
    slots.push({ mois: '05', jour: 17, kind: 'DEPOT' })
  }

  const libellesDep = [
    'Encaissement activité', 'Vente clientèle', 'Dépôt MoMo', 'Règlement marché',
    'Apport trésorerie', 'Vente gros', 'Collecte journalière',
  ]
  const libellesRet = [
    'Achat stock', 'Intrants / matériel', 'Frais exploitation', 'Loyer local',
    'Carburant', 'Salaire aide',
  ]

  let solde = baseSolde
  const rows: TransactionCompte[] = []

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const isDep = slot.kind === 'DEPOT' || slot.kind === 'MOMO'
    const amt = isDep
      ? Math.round(montant * (0.08 + ((seed + i * 7) % 25) / 100))
      : Math.round(montant * (0.04 + ((seed + i * 5) % 12) / 100))

    if (isDep) solde += amt
    else solde = Math.max(25_000, solde - amt)

    const isSuspectDep = suspect && i === slots.length - 1 && isDep && amt > montant * 0.15
    rows.push({
      date: `${String(slot.jour).padStart(2, '0')}/${slot.mois}`,
      type: slot.kind === 'MOMO' ? 'MOMO' : slot.kind === 'VIREMENT' ? 'VIREMENT' : isDep ? 'DEPOT' : 'RETRAIT',
      montant: amt,
      libelle: isDep ? pick(libellesDep, seed, i) : pick(libellesRet, seed, i),
      solde_apres: solde,
      flag: isSuspectDep ? 'SUSPECT' : (d.score_consolide < 45 && !isDep && i === 2 ? 'INHABITUEL' : 'NORMAL'),
    })
  }

  return rows.sort((a, b) => {
    const [da, ma] = a.date.split('/').map(Number)
    const [db, mb] = b.date.split('/').map(Number)
    return ma !== mb ? ma - mb : da - db
  }).reverse()
}

function buildCautionnaires(d: RapportCC, seed: number): Cautionnaire[] {
  const montant = d.montant_demande
  const hasCaution = d.detail_dimensions.find(x => x.code === 'D5')
  const couvertureFaible = d.alertes_actives.some(a => a.code === 'CAUTIONS_INSUFFISANTES')

  if (couvertureFaible && d.score_consolide < 45) {
    return [{
      nom: '—',
      lien: 'Non renseigné',
      telephone: '—',
      revenus_declares: 0,
      engagement_fcfa: Math.round(montant * 0.1),
      solvable: false,
    }]
  }

  const n = d.score_consolide >= 70 ? 2 : 1
  const prenoms = ['Koffi', 'Abla', 'Komla', 'Edem', 'Akua', 'Mensah', 'Sena']
  const liens = ['Groupe solidaire', 'Commerçant voisin', 'Famille', 'Associé', 'Coopérative']
  const out: Cautionnaire[] = []

  for (let i = 0; i < n; i++) {
    const eng = Math.round(montant * (i === 0 ? 0.25 : 0.18))
    out.push({
      nom: `${pick(prenoms, seed, i)} ${pick(['Mensah', 'Lawson', 'Tétévi', 'Kpodar', 'Agbeko'], seed, i + 2)}`,
      lien: pick(liens, seed, i + 4),
      telephone: `+228 ${90 + ((seed + i) % 9)} ${20 + ((seed + i) % 70)} ${30 + ((seed + i) % 60)} ${40 + ((seed + i) % 50)}`,
      revenus_declares: Math.round(montant * (0.6 + ((seed + i) % 8) / 10)),
      engagement_fcfa: eng,
      solvable: d.score_consolide >= 50 || i === 0,
    })
  }

  if (d.client.secteur === 'Agriculture' && d.score_consolide >= 65) {
    out.push({
      nom: `Coopérative ${agenceForLocalite(d.client.localite)}`,
      lien: 'Caution institutionnelle',
      telephone: '+228 91 00 11 22',
      revenus_declares: 0,
      engagement_fcfa: Math.round(montant * 0.5),
      solvable: true,
    })
  }

  return out
}

function buildGaranties(d: RapportCC, seed: number): Garantie[] {
  const m = d.montant_demande
  const depot = Math.round(m * 0.1)
  const out: Garantie[] = [
    { type: 'Dépôt garantie', description: 'Épargne bloquée compte IMF', valeur_estimee: depot, couverture_pct: 10 },
  ]

  if (d.score_consolide >= 55) {
    out.unshift({
      type: 'Caution solidaire',
      description: `${d.detail_dimensions.find(x => x.code === 'D5')?.sous_dimensions[0]?.valeur ?? 'Cautionnaires'} — engagement croisé`,
      valeur_estimee: Math.round(m * (0.35 + (seed % 15) / 100)),
      couverture_pct: d.score_consolide >= 75 ? 70 : 45,
    })
  }

  if (d.client.secteur === 'Artisanat' || d.client.secteur === 'Commerce') {
    out.push({
      type: 'Matériel / stock',
      description: d.client.activite.slice(0, 50),
      valeur_estimee: Math.round(m * (0.8 + (seed % 20) / 100)),
      couverture_pct: Math.min(85, 40 + (seed % 30)),
    })
  }

  if (d.client.secteur === 'Transport') {
    out.push({
      type: 'Nantissement véhicule',
      description: 'Moto / véhicule activité',
      valeur_estimee: Math.round(m * 0.9),
      couverture_pct: 35,
    })
  }

  return out
}

function buildPretsAnterieurs(d: RapportCC, seed: number): PretAnterieur[] {
  const hist = d.detail_dimensions.find(x => x.code === 'D1')
  const cycles = hist?.sous_dimensions.find(s => s.key === 'cycles_anterieurs')?.valeur ?? ''
  const nMatch = cycles.match(/(\d+)/)
  const n = nMatch ? Math.min(4, parseInt(nMatch[1], 10)) : (d.score_consolide >= 70 ? 2 : d.score_consolide >= 50 ? 1 : 0)

  if (n === 0) return []

  const out: PretAnterieur[] = []
  for (let i = 0; i < n; i++) {
    const montant = Math.round(d.montant_demande * (0.5 + ((seed + i * 11) % 40) / 100))
    out.push({
      reference: `DOS-${2023 + (i % 3)}-${String(100 + seed % 900 + i * 17).padStart(4, '0')}`,
      montant,
      date_octroi: `${String(1 + ((seed + i) % 11)).padStart(2, '0')}/${2023 + i}`,
      date_cloture: i === 0 && d.score_consolide < 60 ? 'en cours' : `${String(6 + ((seed + i) % 5)).padStart(2, '0')}/${2024 + i}`,
      duree_remboursement_j: 240 + ((seed + i * 13) % 180),
      par_atteint: false,
      retards: d.score_consolide >= 75 ? [] : i === 0 ? [{ jours: 5 + (seed % 20), motif: 'Basse saison / trésorerie' }] : [],
      anomalies: d.score_consolide < 40 && i === 0 ? ['Solde négatif temporaire'] : [],
    })
  }
  return out
}

function buildAnalyseEtendue(d: RapportCC, txs: TransactionCompte[]): EnrichissementDossier['analyse_prospera_ia_etendue'] {
  const depots = txs.filter(t => t.type === 'DEPOT' || t.type === 'MOMO').length
  const ratio = txs.length ? Math.round((depots / txs.length) * 100) : 0
  const soldeFin = txs[0]?.solde_apres ?? 0
  const soldeDeb = txs.at(-1)?.solde_apres ?? 0
  const suspect = txs.some(t => t.flag === 'SUSPECT')

  return {
    transactions: txs.length >= 6
      ? `${txs.length} mouvements sur 3 mois (${depots} dépôts, ${ratio} %) — solde ${Math.round(soldeDeb / 1000)}k → ${Math.round(soldeFin / 1000)}k FCFA.${suspect ? ' Dépôt récent atypique à investiguer.' : ratio >= 65 ? ' Profil cohérent avec activité.' : ' Ratio retraits élevé — vigilance.'}`
      : 'Historique compte en cours de synchronisation.',
    comportement: d.analyse_prospera_ia.commentaire.slice(0, 180),
    macro_economie: 'Franc CFA stable · inflation alimentaire modérée (+4,2 %) · demande urbaine Lomé soutenue.',
    saison: d.client.secteur === 'Agriculture'
      ? 'Campagne saison sèche — pics dépôts post-récolte attendus.'
      : d.client.secteur === 'Commerce'
        ? 'Mai-juin : pic fruits · juillet-août basse saison.'
        : 'Activité relativement stable sur le trimestre.',
    recouvrement: `PD estimée ${d.probabilite_defaut_pct}% · classe ${d.classe_bceao}.`,
    saturation_secteur: d.alertes_actives.find(a => a.code === 'CONCENTRATION_SECTORIELLE')?.message ?? `Secteur ${d.client.secteur} — pas de signal saturation majeur.`,
  }
}

export function buildEnrichissementFromRapport(d: RapportCC): EnrichissementDossier {
  const seed = hashStr(d.dossier_id + d.client.id)
  const agence = agenceForLocalite(d.client.localite)
  const agent = agentForAgence(agence)
  const etoiles: 1 | 2 | 3 = d.score_consolide >= 75 ? 3 : d.score_consolide >= 55 ? 2 : 1
  const sentiment: SentimentDossier =
    d.classe_bceao === 'PERFORMANT' ? 'POSITIF' :
    d.classe_bceao === 'DOUTEUX' || d.classe_bceao === 'COMPROMIS' ? 'CRITIQUE' :
    d.alertes_actives.some(a => a.severite === 'CRITICAL') ? 'NEGATIF' : 'NEUTRE'

  const transactions = buildTransactions(d, seed)
  const identite_client = buildIdentite(d, seed)

  return {
    agence,
    agent_terrain: agent,
    etoiles,
    resume: d.analyse_prospera_ia.commentaire.slice(0, 100) || d.objet_credit.slice(0, 80),
    sentiment,
    identite_client,
    avis_cc: ['EN_ANALYSE_ROC', 'VALIDE_CHARGE'].includes(d.etape_courante)
      ? {
          decision: d.analyse_prospera_ia.decision_suggeree?.replaceAll('_', ' ') ?? 'FAVORABLE',
          commentaire: d.analyse_prospera_ia.commentaire.slice(0, 160),
          date: d.date_creation,
          charge: d.charge_credit.nom,
        }
      : undefined,
    localisations: buildLocalisations(d, agence, seed),
    transactions,
    cautionnaires: buildCautionnaires(d, seed),
    garanties: buildGaranties(d, seed),
    prets_anterieurs: buildPretsAnterieurs(d, seed),
    analyse_prospera_ia_etendue: buildAnalyseEtendue(d, transactions),
  }
}

/** Fusion : overrides manuels (textes IA affinés) par-dessus le généré */
export function mergeEnrichissement(
  base: EnrichissementDossier,
  override?: Partial<EnrichissementDossier>,
): EnrichissementDossier {
  if (!override) return base
  return {
    ...base,
    ...override,
    identite_client: override.identite_client
      ? { ...base.identite_client!, ...override.identite_client, contact_urgence: { ...base.identite_client!.contact_urgence, ...override.identite_client.contact_urgence } }
      : base.identite_client,
    localisations: override.localisations?.length ? override.localisations : base.localisations,
    transactions: override.transactions?.length ? override.transactions : base.transactions,
    cautionnaires: override.cautionnaires?.length ? override.cautionnaires : base.cautionnaires,
    garanties: override.garanties?.length ? override.garanties : base.garanties,
    prets_anterieurs: override.prets_anterieurs?.length ? override.prets_anterieurs : base.prets_anterieurs,
    analyse_prospera_ia_etendue: override.analyse_prospera_ia_etendue
      ? { ...base.analyse_prospera_ia_etendue, ...override.analyse_prospera_ia_etendue }
      : base.analyse_prospera_ia_etendue,
  }
}

export function computeTxStats(transactions: TransactionCompte[]) {
  if (!transactions.length) return null
  const depots = transactions.filter(t => t.type === 'DEPOT' || t.type === 'MOMO')
  const depotsPct = Math.round((depots.length / transactions.length) * 100)
  const soldeMax = Math.max(...transactions.map(t => t.solde_apres))
  const soldeMin = Math.min(...transactions.map(t => t.solde_apres))
  const totalDepots = depots.reduce((s, t) => s + t.montant, 0)
  const suspects = transactions.filter(t => t.flag === 'SUSPECT' || t.flag === 'INHABITUEL').length
  return { depotsPct, soldeMax, soldeMin, totalDepots, count: transactions.length, suspects }
}

export function couvertureGaranties(garanties: Garantie[]): number {
  return Math.min(100, garanties.reduce((s, g) => s + g.couverture_pct, 0))
}
