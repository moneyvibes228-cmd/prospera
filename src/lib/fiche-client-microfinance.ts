/**
 * Fiche client microfinance complète — identité, KYC, activité, crédits, échéancier,
 * garanties, recouvrement, conformité BCEAO. Alimente /dashboard/credit/clients/[id].
 */

import { getClientRisqueById, type ClientRisqueDetail, type PaiementRecent } from '@/lib/dec-vue360'
import {
  buildEcheancierCoherent,
  countImpayesEcheancier,
  resolveEncoursCredit,
  resolveNbImpayes,
} from '@/lib/credit-echeancier-builder'
import { getAllComptesEpargne } from '@/lib/epargne-registry'
import type { TypeCompteEpargne } from '@/lib/epargne-hub'

export interface ContactUrgence {
  prenom: string
  nom: string
  lien: string
  telephone: string
}

export interface IdentiteClient {
  prenom: string
  nom: string
  genre: 'F' | 'M'
  date_naissance: string
  age: number
  nationalite: string
  situation_matrimoniale: string
  personnes_charge: number
  cni: string
  cni_delivrance: string
  cni_lieu: string
  adresse_domicile: string
  adresse_activite: string
  gps: { lat: number; lng: number }
  telephone_principal: string
  telephone_secondaire?: string
  whatsapp: string
  email?: string
  contact_urgence: ContactUrgence
}

export interface ActiviteEconomique {
  secteur: string
  sous_secteur: string
  description: string
  anciennete_annees: number
  lieu_exercice: string
  numero_stand?: string
  effectif: number
  ca_mensuel_fcfa: number
  charges_mensuelles_fcfa: number
  marge_nette_fcfa: number
  saisonnalite: string
  concurrence: string
}

export interface CompteEpargneLie {
  numero: string
  produit: string
  solde_fcfa: number
  statut: 'ACTIF' | 'DORMANT' | 'BLOQUE'
  dernier_mouvement: string
}

export interface DocumentKyc {
  type: string
  reference?: string
  statut: 'VALIDE' | 'EXPIRE' | 'MANQUANT' | 'EN_ATTENTE'
  date_depot?: string
  date_expiration?: string
}

/** Pièces KYC obligatoires — fiche visite terrain uniquement si demande de crédit */
export function buildKycClient(
  hasDemandeCredit: boolean,
  cniReference: string,
  dateDepot = '15/03/2023',
): DocumentKyc[] {
  const ref = cniReference.replace(/^N°\s*/, '').trim()
  const docs: DocumentKyc[] = [
    { type: 'CNI', reference: ref, statut: 'VALIDE', date_depot: dateDepot, date_expiration: '12/06/2034' },
    { type: 'Justificatif domicile', statut: 'VALIDE', date_depot: dateDepot },
    { type: 'Photo client', statut: 'VALIDE', date_depot: dateDepot },
  ]
  if (hasDemandeCredit) {
    docs.push({ type: 'Fiche visite terrain (RA/GP)', statut: 'VALIDE', date_depot: dateDepot })
  }
  return docs
}

/** @deprecated Utiliser buildKycClient() */
export const KYC_CHECKLIST_TOGO: DocumentKyc[] = buildKycClient(true, '0000 0000 0000')

export interface GarantieClient {
  type: 'STOCK' | 'MATERIEL' | 'CAUTION' | 'HYPOTHEQUE' | 'DEPOT_GAGE'
  description: string
  valeur_estimee_fcfa: number
  couverture_pct: number
  statut: 'ACTIF' | 'REALISE' | 'INSUFFISANT' | 'MANQUANT'
  contact?: string
}

/** Minimum réglementaire Prospera — 2 cautionnaires solidaires par dossier */
export const MIN_CAUTIONNAIRES = 2

export interface Cautionnaire {
  ordre: number
  prenom: string
  nom: string
  lien: string
  telephone: string
  contact_urgence: ContactUrgence
  profession?: string
  cni?: string
  revenu_mensuel_fcfa: number
  statut: 'ACTIF' | 'APPELE' | 'INJOIGNABLE' | 'REALISE' | 'REFUSE'
  date_engagement: string
  montant_engagement_fcfa: number
}

export interface ExigenceGarantie {
  libelle: string
  obligatoire: boolean
  statut: 'OK' | 'MANQUANT' | 'PARTIEL' | 'NON_REQUIS'
  detail?: string
}

export interface ReglementGarantiesCredit {
  montant_credit_fcfa: number
  min_cautionnaires: number
  nb_cautionnaires_valides: number
  conforme: boolean
  exigences: ExigenceGarantie[]
  couverture_totale_pct: number
  synthese: string
}

/** Barème garanties complémentaires selon le montant du crédit (IMF Togo) */
export function getExigencesParMontant(montant: number): Array<{ libelle: string; obligatoire: boolean }> {
  const exigences: Array<{ libelle: string; obligatoire: boolean }> = [
    { libelle: `${MIN_CAUTIONNAIRES} cautionnaires solidaires minimum`, obligatoire: true },
  ]
  if (montant > 300_000) {
    exigences.push({ libelle: 'Dépôt de garantie 10 % du montant', obligatoire: true })
  }
  if (montant > 500_000) {
    exigences.push({ libelle: 'Garantie réelle (stock, matériel ou nantissement) ≥ 30 %', obligatoire: true })
  }
  if (montant > 1_000_000) {
    exigences.push({ libelle: 'Dépôt de garantie 15 % du montant (remplace 10 %)', obligatoire: true })
    exigences.push({ libelle: 'Garantie réelle ≥ 50 % du montant', obligatoire: true })
  }
  return exigences
}

export function buildReglementGaranties(
  montant: number,
  cautionnaires: Cautionnaire[],
  garanties: GarantieClient[],
): ReglementGarantiesCredit {
  const valides = cautionnaires.filter(c => c.statut === 'ACTIF' || c.statut === 'REALISE')
  const nbValides = valides.length
  const depotPct = montant > 1_000_000 ? 15 : montant > 300_000 ? 10 : 0
  const depotRequis = depotPct > 0 ? Math.round(montant * depotPct / 100) : 0
  const depotGarantie = garanties.find(g => g.type === 'DEPOT_GAGE')
  const garantieReelle = garanties.filter(g => ['STOCK', 'MATERIEL', 'HYPOTHEQUE'].includes(g.type))
  const valeurReelle = garantieReelle.reduce((s, g) => s + g.valeur_estimee_fcfa, 0)
  const pctReelle = montant > 0 ? Math.round((valeurReelle / montant) * 100) : 0
  const seuilReel = montant > 1_000_000 ? 50 : montant > 500_000 ? 30 : 0

  const exigences: ExigenceGarantie[] = getExigencesParMontant(montant).map(ex => {
    if (ex.libelle.includes('cautionnaires')) {
      const ok = nbValides >= MIN_CAUTIONNAIRES
      return {
        ...ex,
        statut: ok ? 'OK' : nbValides === 1 ? 'PARTIEL' : 'MANQUANT',
        detail: `${nbValides}/${MIN_CAUTIONNAIRES} cautionnaire(s) valide(s)`,
      }
    }
    if (ex.libelle.includes('Dépôt')) {
      if (depotRequis === 0) return { ...ex, statut: 'NON_REQUIS' as const }
      if (!depotGarantie || depotGarantie.statut === 'MANQUANT') {
        return { ...ex, statut: 'MANQUANT' as const, detail: `${depotRequis.toLocaleString('fr-FR')} FCFA requis (${depotPct} %)` }
      }
      if (depotGarantie.valeur_estimee_fcfa < depotRequis) {
        return { ...ex, statut: 'PARTIEL' as const, detail: `${formatFcfaInline(depotGarantie.valeur_estimee_fcfa)} / ${formatFcfaInline(depotRequis)}` }
      }
      return { ...ex, statut: 'OK' as const, detail: formatFcfaInline(depotGarantie.valeur_estimee_fcfa) }
    }
    if (ex.libelle.includes('Garantie réelle')) {
      if (seuilReel === 0) return { ...ex, statut: 'NON_REQUIS' as const }
      if (valeurReelle === 0) {
        return { ...ex, statut: 'MANQUANT' as const, detail: `≥ ${seuilReel} % (${formatFcfaInline(Math.round(montant * seuilReel / 100))})` }
      }
      if (pctReelle < seuilReel) {
        return { ...ex, statut: 'PARTIEL' as const, detail: `${pctReelle} % — seuil ${seuilReel} %` }
      }
      return { ...ex, statut: 'OK' as const, detail: `${pctReelle} % (${formatFcfaInline(valeurReelle)})` }
    }
    return { ...ex, statut: 'OK' as const }
  })

  const couvertureCautions = Math.min(100, valides.length >= MIN_CAUTIONNAIRES ? 100 : Math.round((nbValides / MIN_CAUTIONNAIRES) * 50))
  const couvertureDepot = depotGarantie && depotRequis > 0
    ? Math.min(100, Math.round((depotGarantie.valeur_estimee_fcfa / depotRequis) * 100))
    : depotRequis === 0 ? 100 : 0
  const couvertureReelle = seuilReel > 0 ? Math.min(100, Math.round((pctReelle / seuilReel) * 100)) : 100
  const couverture_totale_pct = Math.round((couvertureCautions * 0.5 + couvertureDepot * 0.2 + couvertureReelle * 0.3))
  const conforme = exigences.filter(e => e.obligatoire).every(e => e.statut === 'OK')

  const synthese = conforme
    ? `Dossier conforme au barème Prospera pour ${formatFcfaInline(montant)} : ${MIN_CAUTIONNAIRES} cautionnaires et garanties complémentaires satisfaits.`
    : `Non-conformité garanties : ${exigences.filter(e => e.obligatoire && e.statut !== 'OK').map(e => e.libelle.split('(')[0].trim()).join(' · ')}. Décaissement ou renouvellement bloqué tant que le dossier n'est pas régularisé.`

  return {
    montant_credit_fcfa: montant,
    min_cautionnaires: MIN_CAUTIONNAIRES,
    nb_cautionnaires_valides: nbValides,
    conforme,
    exigences,
    couverture_totale_pct,
    synthese,
  }
}

function formatFcfaInline(n: number): string {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

const PRENOMS_FEMININS = new Set([
  'Akossiwa', 'Yawa', 'Mawuena', 'Afi', 'Enyonam', 'Abla', 'Akouvi', 'Elinam', 'Kafui',
  'Adjoa', 'Ama', 'Sena', 'Akossi', 'Sika', 'Ahou', 'Edoh', 'Amivi', 'Efua', 'Dzifa',
])

const PRENOMS_CAUTION = ['Koffi', 'Akua', 'Edem', 'Afi', 'Komi', 'Mawu', 'Sena', 'Kodjo', 'Ama', 'Yao']
const NOMS_CAUTION = ['Mensah', 'Lawson', 'Kpélim', 'Attivor', 'Atsu', 'Adjovi', 'Dossou', 'Amavi', 'Koffi', 'Ble']
const LIENS_CAUTION = ['Frère / sœur', 'Conjoint(e)', 'Parent', 'Ami proche', 'Collègue activité', 'Voisin']
const LIENS_URGENCE = ['Conjoint(e)', 'Frère', 'Sœur', 'Père', 'Mère', 'Ami proche', 'Collègue']
const SITUATIONS_MATRIMONIALES = ['Marié(e)', 'Célibataire', 'Divorcé(e)', 'Veuf(ve)'] as const
const PREFECTURES = ['Préfecture du Golfe — Lomé', 'Préfecture des Lacs — Aného', 'Préfecture du Moyen-Mono — Tsévié', 'Préfecture de Kloto — Kpalimé']

function seedClient(clientId: string): number {
  return parseInt(clientId.replace(/\D/g, ''), 10) || 1
}

function splitNomComplet(nomComplet: string): { prenom: string; nom: string } {
  const parts = nomComplet.trim().split(/\s+/)
  if (parts.length <= 1) return { prenom: parts[0] ?? 'Client', nom: parts[0] ?? 'Prospera' }
  return { prenom: parts[0], nom: parts.slice(1).join(' ') }
}

function telTogo(seed: number, offset: number): string {
  const a = 90 + ((seed + offset * 3) % 8)
  const b = String(10 + ((seed * 7 + offset) % 80)).padStart(2, '0')
  const c = String(20 + ((seed * 11 + offset * 5) % 70)).padStart(2, '0')
  const d = String(30 + ((seed * 13 + offset * 7) % 60)).padStart(2, '0')
  return `+228 ${a} ${b} ${c} ${d}`
}

function personnesChargePourSituation(situation: string, seed: number): number {
  switch (situation) {
    case 'Marié(e)': return 1 + (seed % 4)
    case 'Divorcé(e)': return 1 + (seed % 2)
    case 'Veuf(ve)': return 1 + (seed % 3)
    default: return seed % 2
  }
}

function buildCni(clientId: string): { numero: string; delivrance: string; lieu: string } {
  const seed = seedClient(clientId)
  const a = String(1000 + (seed % 8999)).padStart(4, '0')
  const b = String(1000 + ((seed * 3) % 8999)).padStart(4, '0')
  const c = String(1000 + ((seed * 7) % 8999)).padStart(4, '0')
  const mois = String(1 + (seed % 12)).padStart(2, '0')
  const annee = 2018 + (seed % 6)
  return {
    numero: `N° ${a} ${b} ${c}`,
    delivrance: `${mois}/${String(annee).slice(-2)}/${annee}`,
    lieu: PREFECTURES[seed % PREFECTURES.length],
  }
}

function buildContactUrgenceClient(
  clientPrenom: string,
  clientNom: string,
  seed: number,
  situation: string,
): ContactUrgence {
  const lien = situation === 'Marié(e)' ? 'Conjoint(e)' : LIENS_URGENCE[(seed + 2) % LIENS_URGENCE.length]
  const prenomUrg = PRENOMS_CAUTION[(seed + 5) % PRENOMS_CAUTION.length]
  const nomUrg = seed % 3 === 0 ? clientNom : NOMS_CAUTION[(seed + 3) % NOMS_CAUTION.length]
  return {
    prenom: prenomUrg,
    nom: nomUrg,
    lien,
    telephone: telTogo(seed, 9),
  }
}

/** Identité complète obligatoire pour tout client IMF */
export function buildIdentiteClient(
  clientId: string,
  base: Pick<ClientRisqueDetail, 'nom' | 'telephone' | 'localite' | 'agence'>,
): IdentiteClient {
  const seed = seedClient(clientId)
  const { prenom, nom } = splitNomComplet(base.nom)
  const genre: 'F' | 'M' = PRENOMS_FEMININS.has(prenom) ? 'F' : 'M'
  const situation = SITUATIONS_MATRIMONIALES[seed % SITUATIONS_MATRIMONIALES.length]
  const age = 26 + (seed % 24)
  const jour = String(1 + (seed % 28)).padStart(2, '0')
  const mois = String(1 + ((seed * 3) % 12)).padStart(2, '0')
  const anneeNaissance = 2026 - age
  const cni = buildCni(clientId)

  return {
    prenom,
    nom,
    genre,
    date_naissance: `${jour}/${mois}/${anneeNaissance}`,
    age,
    nationalite: 'Togolaise',
    situation_matrimoniale: situation,
    personnes_charge: personnesChargePourSituation(situation, seed),
    cni: cni.numero,
    cni_delivrance: cni.delivrance,
    cni_lieu: cni.lieu,
    adresse_domicile: `${base.localite} — ${base.agence}`,
    adresse_activite: base.localite,
    gps: { lat: 6.12 + (seed % 80) / 1000, lng: 1.20 + (seed % 60) / 1000 },
    telephone_principal: base.telephone,
    whatsapp: base.telephone,
    contact_urgence: buildContactUrgenceClient(prenom, nom, seed, situation),
  }
}

function makeCautionnaire(
  ordre: number,
  prenom: string,
  nom: string,
  lien: string,
  telephone: string,
  contactUrgence: ContactUrgence,
  revenu: number,
  dateEngagement: string,
  montant: number,
  statut: Cautionnaire['statut'] = 'ACTIF',
  extras?: { profession?: string; cni?: string },
): Cautionnaire {
  return {
    ordre,
    prenom,
    nom,
    lien,
    telephone,
    contact_urgence: contactUrgence,
    revenu_mensuel_fcfa: revenu,
    date_engagement: dateEngagement,
    montant_engagement_fcfa: montant,
    statut,
    ...extras,
  }
}

function formatDateEngagement(raw: string): string {
  if (/^\d{2}\/\d{4}$/.test(raw.trim())) return `01/${raw.trim()}`
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw.trim())) return raw.trim()
  return raw.trim() || '01/03/2023'
}

/** Cautionnaires solidaires — uniquement pour dossiers crédit (min. 2) */
export function buildCautionnairesFallback(
  montant: number,
  clientNom: string,
  dateEngagement: string,
  clientId: string,
): Cautionnaire[] {
  const seed = seedClient(clientId)
  const engagement = formatDateEngagement(dateEngagement)

  const revenu1 = Math.round(montant * 0.35 + (seed % 5) * 25_000)
  const revenu2 = Math.round(montant * 0.28 + ((seed + 3) % 5) * 20_000)

  return [
    makeCautionnaire(
      1,
      PRENOMS_CAUTION[seed % PRENOMS_CAUTION.length],
      NOMS_CAUTION[(seed + 1) % NOMS_CAUTION.length],
      LIENS_CAUTION[seed % LIENS_CAUTION.length],
      telTogo(seed, 1),
      {
        prenom: PRENOMS_CAUTION[(seed + 4) % PRENOMS_CAUTION.length],
        nom: NOMS_CAUTION[(seed + 5) % NOMS_CAUTION.length],
        lien: 'Conjoint(e)',
        telephone: telTogo(seed, 11),
      },
      revenu1,
      engagement,
      montant,
      'ACTIF',
      { profession: 'Commerçant(e) indépendant(e)', cni: buildCni(`${clientId}-C1`).numero.replace('N° ', '') },
    ),
    makeCautionnaire(
      2,
      PRENOMS_CAUTION[(seed + 2) % PRENOMS_CAUTION.length],
      NOMS_CAUTION[(seed + 3) % NOMS_CAUTION.length],
      LIENS_CAUTION[(seed + 1) % LIENS_CAUTION.length],
      telTogo(seed, 2),
      {
        prenom: PRENOMS_CAUTION[(seed + 6) % PRENOMS_CAUTION.length],
        nom: NOMS_CAUTION[(seed + 7) % NOMS_CAUTION.length],
        lien: 'Parent',
        telephone: telTogo(seed, 12),
      },
      revenu2,
      engagement,
      montant,
      seed % 5 === 0 ? 'INJOIGNABLE' : 'ACTIF',
      { profession: 'Fonctionnaire / salarié', cni: buildCni(`${clientId}-C2`).numero.replace('N° ', '') },
    ),
  ]
}

function isCautionnaireComplet(c: Cautionnaire): boolean {
  return Boolean(c.prenom && c.nom && c.contact_urgence?.telephone && c.revenu_mensuel_fcfa > 0 && c.date_engagement !== '—')
}

function isCreditActifClient(
  c: CreditDetaille,
  baseCredit: ClientRisqueDetail['credits'][number] | undefined,
): boolean {
  if (baseCredit) {
    return baseCredit.encours > 0 || baseCredit.statut === 'EN_RETARD' || baseCredit.statut === 'ACTIF'
  }
  return c.encours_fcfa > 0 || c.statut === 'EN_RETARD' || c.statut === 'ACTIF'
}

function normalizeCreditsDetail(
  credits: CreditDetaille[],
  base: ClientRisqueDetail,
): CreditDetaille[] {
  const creditActifRef = base.credits.find(cr => cr.encours > 0 || cr.statut === 'EN_RETARD')?.reference

  return credits.map(c => {
    const baseCredit = base.credits.find(cr => cr.reference === c.reference)
    const cautionnaires = c.cautionnaires.length >= MIN_CAUTIONNAIRES && c.cautionnaires.every(isCautionnaireComplet)
      ? c.cautionnaires
      : buildCautionnairesFallback(c.montant_decaisse_fcfa, base.nom, c.date_decaissement, base.id)
    const nbEcheancier = c.echeancier.length > 0 ? countImpayesEcheancier(c.echeancier) : c.nb_impayes
    const soldeEcheancier = c.echeancier.length > 0 ? c.echeancier[c.echeancier.length - 1]!.solde_apres_fcfa : undefined
    const actif = isCreditActifClient(c, baseCredit)
    const estCreditPrincipal = c.reference === creditActifRef
    const nbImpayes = resolveNbImpayes(
      estCreditPrincipal ? base.echeances_impayees : 0,
      nbEcheancier,
      actif,
    )
    const encoursSource = baseCredit?.encours ?? c.encours_fcfa
    const encoursFcfa = resolveEncoursCredit(encoursSource, c.montant_decaisse_fcfa, soldeEcheancier)
    return {
      ...c,
      nb_impayes: nbImpayes,
      encours_fcfa: encoursFcfa,
      capital_restant_du_fcfa: encoursFcfa,
      cautionnaires,
      reglement_garanties: buildReglementGaranties(c.montant_decaisse_fcfa, cautionnaires, c.garanties),
    }
  })
}

function normalizeFicheClient(
  clientId: string,
  base: ClientRisqueDetail,
  fiche: FicheEnrichieInput & Partial<ClientRisqueDetail>,
): FicheEnrichieInput {
  const hasCredit = base.credits.length > 0
  const identite = fiche.identite?.date_naissance && fiche.identite.date_naissance !== '—'
    ? {
        ...fiche.identite,
        contact_urgence: fiche.identite.contact_urgence?.prenom
          ? fiche.identite.contact_urgence
          : buildIdentiteClient(clientId, base).contact_urgence,
      }
    : buildIdentiteClient(clientId, base)

  const dateDepot = fiche.client_depuis && fiche.client_depuis !== '—' ? fiche.client_depuis : '15/03/2023'

  return {
    ...fiche,
    identite,
    kyc: buildKycClient(hasCredit, identite.cni, dateDepot),
    credits_detail: normalizeCreditsDetail(fiche.credits_detail ?? [], base),
    client_depuis: fiche.client_depuis && fiche.client_depuis !== '—' ? fiche.client_depuis : dateDepot,
  }
}

export function buildGarantiesComplementaires(montant: number): GarantieClient[] {
  const items: GarantieClient[] = []
  if (montant > 300_000) {
    const depot = Math.round(montant * (montant > 1_000_000 ? 0.15 : 0.10))
    items.push({
      type: 'DEPOT_GAGE',
      description: `Dépôt de garantie ${montant > 1_000_000 ? '15' : '10'} % — compte épargne bloqué`,
      valeur_estimee_fcfa: depot,
      couverture_pct: montant > 1_000_000 ? 15 : 10,
      statut: 'MANQUANT',
    })
  }
  if (montant > 500_000) {
    items.push({
      type: 'STOCK',
      description: 'Inventaire stock / matériel d\'activité (garantie réelle)',
      valeur_estimee_fcfa: Math.round(montant * 0.35),
      couverture_pct: 35,
      statut: 'INSUFFISANT',
    })
  }
  return items
}

export interface EcheanceCredit {
  numero: number
  date_echeance: string
  capital_fcfa: number
  interet_fcfa: number
  total_fcfa: number
  statut: 'PAYE' | 'PARTIEL' | 'IMPAYE' | 'A_VENIR'
  date_paiement?: string
  montant_paye_fcfa?: number
  solde_apres_fcfa: number
  retard_jours?: number
}

export interface CreditDetaille {
  reference: string
  produit: string
  montant_decaisse_fcfa: number
  encours_fcfa: number
  capital_restant_du_fcfa: number
  interets_courus_fcfa: number
  penalites_fcfa: number
  taux_annuel_pct: number
  duree_mois: number
  mensualite_fcfa: number
  date_decaissement: string
  date_fin_prevue: string
  statut: string
  canal_decaissement: string
  nb_impayes: number
  echeancier: EcheanceCredit[]
  cautionnaires: Cautionnaire[]
  reglement_garanties: ReglementGarantiesCredit
  garanties: GarantieClient[]
}

export interface ActionRecouvrement {
  date: string
  heure?: string
  type: 'RELANCE_SMS' | 'RELANCE_WA' | 'APPEL' | 'VISITE' | 'COURRIER' | 'MISE_EN_DEMEURE' | 'CONTENTIEUX'
  canal: string
  agent: string
  resultat: string
  montant_promis_fcfa?: number
  prochaine_action?: string
}

export interface ScoreFacteur {
  libelle: string
  poids_pct: number
  note: number
  contribution: number
  statut: 'FORT' | 'MOYEN' | 'FAIBLE' | 'CRITIQUE'
  explication: string
}

export interface ScoreExplication {
  score: number
  modele: string
  version: string
  synthese: string
  facteurs: ScoreFacteur[]
}

export interface PdExplication {
  pd_pct: number
  modele: string
  version: string
  synthese: string
  formule_el: string
  facteurs: ScoreFacteur[]
}

export interface IndicateurRisque {
  score_ia: number
  score_cbi: number
  pd_pct: number
  lgd_pct: number
  el_fcfa: number
  classe_bceao: string
  classe_precedente: string
  provision_pct: number
  provision_fcfa: number
  migration_mois: boolean
  dti_pct: number
  ratio_encours_revenu: number
  explication_score_ia: ScoreExplication
  explication_score_cbi: ScoreExplication
  explication_pd: PdExplication
}

type IndicateurRisqueSeed = Omit<IndicateurRisque, 'explication_score_ia' | 'explication_score_cbi' | 'explication_pd'>

function clampScore(n: number, min = 5, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function statutFacteur(note: number): ScoreFacteur['statut'] {
  if (note >= 75) return 'FORT'
  if (note >= 55) return 'MOYEN'
  if (note >= 35) return 'FAIBLE'
  return 'CRITIQUE'
}

function ajusterContributions(facteurs: ScoreFacteur[], scoreCible: number): ScoreFacteur[] {
  const total = facteurs.reduce((s, f) => s + f.contribution, 0)
  if (total === 0 || total === scoreCible) return facteurs
  const ratio = scoreCible / total
  return facteurs.map(f => ({
    ...f,
    contribution: Math.round(f.contribution * ratio),
  }))
}

/** Détail Score IA Prospera — modèle interne XGBoost */
export function buildExplicationScoreIA(
  base: Pick<ClientRisqueDetail, 'score_ia' | 'jours_retard' | 'echeances_impayees' | 'score_evolution' | 'visites' | 'classe_bceao'>,
  activite: Pick<ActiviteEconomique, 'anciennete_annees' | 'ca_mensuel_fcfa' | 'marge_nette_fcfa' | 'secteur'>,
  ind: Pick<IndicateurRisque, 'dti_pct' | 'ratio_encours_revenu'>,
): ScoreExplication {
  const poids = { remb: 35, cap: 25, act: 20, gar: 10, trend: 10 }

  let noteRemb = 100 - Math.min(85, base.jours_retard) - base.echeances_impayees * 10
  noteRemb = clampScore(noteRemb)

  let noteCap = 75
  if (ind.dti_pct <= 25) noteCap += 12
  else if (ind.dti_pct <= 33) noteCap += 4
  else noteCap -= Math.min(30, ind.dti_pct - 33)
  if (ind.ratio_encours_revenu <= 2) noteCap += 10
  else if (ind.ratio_encours_revenu <= 3) noteCap += 0
  else noteCap -= Math.min(25, (ind.ratio_encours_revenu - 3) * 8)
  noteCap = clampScore(noteCap)

  const margePct = activite.ca_mensuel_fcfa > 0
    ? Math.round((activite.marge_nette_fcfa / activite.ca_mensuel_fcfa) * 100)
    : 0
  let noteAct = 45 + Math.min(18, activite.anciennete_annees * 3)
  noteAct += margePct >= 25 ? 15 : margePct >= 15 ? 6 : -8
  if (base.visites.some(v => v.statut === 'POSITIVE')) noteAct += 10
  if (base.visites.some(v => v.statut === 'NEGATIVE' || v.statut === 'SANS_REPONSE')) noteAct -= 10
  noteAct = clampScore(noteAct)

  const noteGar = base.classe_bceao === 'NORMAL' ? 88
    : base.classe_bceao === 'SOUS_SURVEILLANCE' ? 62
      : base.classe_bceao === 'DOUTEUX' ? 38
        : 18

  const evo = base.score_evolution
  const delta = evo.length >= 2 ? evo[evo.length - 1]!.score - evo[0]!.score : 0
  const noteTrend = clampScore(72 + delta)

  const facteursBruts: ScoreFacteur[] = [
    {
      libelle: 'Comportement de remboursement',
      poids_pct: poids.remb,
      note: noteRemb,
      contribution: Math.round(noteRemb * poids.remb / 100),
      statut: statutFacteur(noteRemb),
      explication: base.jours_retard > 0
        ? `Retard J+${base.jours_retard}${base.echeances_impayees > 0 ? ` · ${base.echeances_impayees} impayé(s)` : ''} — pénalise fortement le score`
        : 'Échéances honorées — comportement conforme',
    },
    {
      libelle: 'Capacité financière',
      poids_pct: poids.cap,
      note: noteCap,
      contribution: Math.round(noteCap * poids.cap / 100),
      statut: statutFacteur(noteCap),
      explication: `DTI ${ind.dti_pct} %${ind.dti_pct > 33 ? ' (seuil dépassé)' : ''} · ratio encours/revenu ${ind.ratio_encours_revenu}×`,
    },
    {
      libelle: 'Qualité de l\'activité',
      poids_pct: poids.act,
      note: noteAct,
      contribution: Math.round(noteAct * poids.act / 100),
      statut: statutFacteur(noteAct),
      explication: `${activite.secteur} · ${activite.anciennete_annees} an(s) · marge ${margePct} %${base.visites.some(v => v.statut === 'POSITIVE') ? ' · visite terrain favorable' : ''}`,
    },
    {
      libelle: 'Garanties & classification',
      poids_pct: poids.gar,
      note: noteGar,
      contribution: Math.round(noteGar * poids.gar / 100),
      statut: statutFacteur(noteGar),
      explication: `Classe BCEAO ${base.classe_bceao.replace('_', ' ')} — couverture et dossier KYC intégrés au modèle`,
    },
    {
      libelle: 'Tendance 6 mois',
      poids_pct: poids.trend,
      note: noteTrend,
      contribution: Math.round(noteTrend * poids.trend / 100),
      statut: statutFacteur(noteTrend),
      explication: delta < -10
        ? `Score en baisse de ${Math.abs(delta)} pts sur 6 mois — signal précoce de dégradation`
        : delta > 5
          ? `Score en hausse de ${delta} pts — amélioration récente`
          : 'Évolution stable sur la période',
    },
  ]

  const facteurs = ajusterContributions(facteursBruts, base.score_ia)
  const facteurFaible = [...facteurs].sort((a, b) => a.note - b.note)[0]

  return {
    score: base.score_ia,
    modele: 'Prospera XGBoost',
    version: 'v3.2',
    synthese: facteurFaible
      ? `Score ${base.score_ia}/100 — principalement tiré par « ${facteurFaible.libelle.toLowerCase()} » (${facteurFaible.explication.split('—')[0]?.trim() || facteurFaible.explication}).`
      : `Score ${base.score_ia}/100.`,
    facteurs,
  }
}

/** Détail Score CBI — modèle réglementaire BCEAO v5 */
export function buildExplicationScoreCBI(
  base: Pick<ClientRisqueDetail, 'score_ia' | 'jours_retard' | 'echeances_impayees' | 'classe_bceao'>,
  activite: Pick<ActiviteEconomique, 'ca_mensuel_fcfa' | 'marge_nette_fcfa' | 'secteur'>,
  ind: Pick<IndicateurRisque, 'dti_pct' | 'ratio_encours_revenu' | 'score_cbi' | 'migration_mois' | 'classe_precedente'>,
): ScoreExplication {
  const poids = { dti: 30, hist: 25, rev: 20, ret: 15, sect: 10 }
  const scoreCbi = ind.score_cbi

  let noteDti = ind.dti_pct <= 25 ? 90 : ind.dti_pct <= 33 ? 78 : ind.dti_pct <= 45 ? 52 : 28
  noteDti = clampScore(noteDti)

  let noteHist = base.classe_bceao === 'NORMAL' ? 92
    : base.classe_bceao === 'SOUS_SURVEILLANCE' ? 68
      : base.classe_bceao === 'DOUTEUX' ? 42
        : 22
  if (ind.migration_mois && ind.classe_precedente === 'NORMAL') noteHist -= 15
  noteHist = clampScore(noteHist)

  const margePct = activite.ca_mensuel_fcfa > 0
    ? Math.round((activite.marge_nette_fcfa / activite.ca_mensuel_fcfa) * 100)
    : 0
  let noteRev = 55 + (margePct >= 25 ? 25 : margePct >= 15 ? 12 : -5)
  if (ind.ratio_encours_revenu <= 2.5) noteRev += 10
  else if (ind.ratio_encours_revenu > 4) noteRev -= 15
  noteRev = clampScore(noteRev)

  let noteRet = 95 - Math.min(80, base.jours_retard) - base.echeances_impayees * 8
  noteRet = clampScore(noteRet)

  const secteursRisque = ['Commerce', 'Services']
  let noteSect = secteursRisque.includes(activite.secteur) ? 58 : 72
  if (base.jours_retard === 0) noteSect += 15
  noteSect = clampScore(noteSect)

  const facteursBruts: ScoreFacteur[] = [
    {
      libelle: 'Taux d\'endettement (DTI)',
      poids_pct: poids.dti,
      note: noteDti,
      contribution: Math.round(noteDti * poids.dti / 100),
      statut: statutFacteur(noteDti),
      explication: ind.dti_pct <= 33
        ? `DTI ${ind.dti_pct} % — conforme au plafond CBI v5 (33 %)`
        : `DTI ${ind.dti_pct} % — au-dessus du plafond réglementaire CBI v5 (33 %)`,
    },
    {
      libelle: 'Historique crédit BCEAO',
      poids_pct: poids.hist,
      note: noteHist,
      contribution: Math.round(noteHist * poids.hist / 100),
      statut: statutFacteur(noteHist),
      explication: ind.migration_mois
        ? `Migration ${ind.classe_precedente.replace('_', ' ')} → ${base.classe_bceao.replace('_', ' ')} ce mois`
        : `Classe stable : ${base.classe_bceao.replace('_', ' ')}`,
    },
    {
      libelle: 'Revenus & marge d\'activité',
      poids_pct: poids.rev,
      note: noteRev,
      contribution: Math.round(noteRev * poids.rev / 100),
      statut: statutFacteur(noteRev),
      explication: `Marge nette ${margePct} % · ratio encours/revenu ${ind.ratio_encours_revenu}×`,
    },
    {
      libelle: 'Retard & impayés',
      poids_pct: poids.ret,
      note: noteRet,
      contribution: Math.round(noteRet * poids.ret / 100),
      statut: statutFacteur(noteRet),
      explication: base.jours_retard > 0
        ? `J+${base.jours_retard}${base.echeances_impayees > 0 ? ` · ${base.echeances_impayees} impayé(s) comptabilisé(s)` : ''}`
        : 'Aucun retard enregistré',
    },
    {
      libelle: 'Secteur & profil zone',
      poids_pct: poids.sect,
      note: noteSect,
      contribution: Math.round(noteSect * poids.sect / 100),
      statut: statutFacteur(noteSect),
      explication: `Secteur ${activite.secteur} — barème CBI ajusté au profil microfinance Togo`,
    },
  ]

  const facteurs = ajusterContributions(facteursBruts, scoreCbi)
  const ecartCbi = scoreCbi - base.score_ia

  return {
    score: scoreCbi,
    modele: 'CBI BCEAO',
    version: 'v5.0',
    synthese: ecartCbi >= 0
      ? `Score CBI ${scoreCbi}/100 (+${ecartCbi} vs IA) — le volet réglementaire (DTI, classe BCEAO) ${ind.dti_pct > 33 || base.classe_bceao !== 'NORMAL' ? 'modère le profil' : 'confirme le profil'}.`
      : `Score CBI ${scoreCbi}/100 (${ecartCbi} vs IA) — profil légèrement mieux noté côté réglementaire.`,
    facteurs,
  }
}

function ajusterContributionsPct(facteurs: ScoreFacteur[], ciblePct: number): ScoreFacteur[] {
  const total = facteurs.reduce((s, f) => s + f.contribution, 0)
  if (total === 0 || total === ciblePct) return facteurs
  const ratio = ciblePct / total
  return facteurs.map(f => ({
    ...f,
    contribution: Math.round(f.contribution * ratio * 10) / 10,
  }))
}

function statutRisquePd(intensite: number): ScoreFacteur['statut'] {
  if (intensite >= 70) return 'CRITIQUE'
  if (intensite >= 50) return 'FAIBLE'
  if (intensite >= 30) return 'MOYEN'
  return 'FORT'
}

/** Détail PD — probabilité de défaut (modèle IFRS 9 / BCEAO) */
export function buildExplicationPD(
  base: Pick<ClientRisqueDetail, 'score_ia' | 'jours_retard' | 'echeances_impayees' | 'classe_bceao' | 'encours' | 'alertes_ia'>,
  activite: Pick<ActiviteEconomique, 'secteur'>,
  ind: Pick<IndicateurRisque, 'pd_pct' | 'lgd_pct' | 'el_fcfa' | 'migration_mois' | 'classe_precedente' | 'ratio_encours_revenu' | 'dti_pct'>,
): PdExplication {
  const poids = { remb: 35, score: 25, bceao: 25, expo: 15 }

  const intensiteRemb = clampScore(
    Math.min(95, base.jours_retard * 1.4 + base.echeances_impayees * 18),
  )
  const intensiteScore = clampScore(100 - base.score_ia)
  let intensiteBceao = base.classe_bceao === 'CONTENTIEUX' ? 92
    : base.classe_bceao === 'DOUTEUX' ? 72
      : base.classe_bceao === 'SOUS_SURVEILLANCE' ? 48
        : 18
  if (ind.migration_mois) intensiteBceao = clampScore(intensiteBceao + 12)

  let intensiteExpo = 25
  if (ind.ratio_encours_revenu > 3) intensiteExpo += 35
  else if (ind.ratio_encours_revenu > 2) intensiteExpo += 20
  if (base.encours > 1_000_000) intensiteExpo += 15
  if (ind.dti_pct > 33) intensiteExpo += 10
  if (base.alertes_ia.some(a => a.severite === 'CRITIQUE' || a.message.toLowerCase().includes('fraude'))) {
    intensiteExpo = clampScore(intensiteExpo + 25)
  }
  intensiteExpo = clampScore(intensiteExpo)

  const facteursBruts: ScoreFacteur[] = [
    {
      libelle: 'Comportement de remboursement',
      poids_pct: poids.remb,
      note: intensiteRemb,
      contribution: Math.round(intensiteRemb * poids.remb / 100 * 10) / 10,
      statut: statutRisquePd(intensiteRemb),
      explication: base.jours_retard > 0
        ? `Retard J+${base.jours_retard}${base.echeances_impayees > 0 ? ` · ${base.echeances_impayees} impayé(s)` : ''} — principal moteur du risque de défaut`
        : 'Historique de paiement régulier — risque de défaut atténué',
    },
    {
      libelle: 'Score IA Prospera (calibrage)',
      poids_pct: poids.score,
      note: intensiteScore,
      contribution: Math.round(intensiteScore * poids.score / 100 * 10) / 10,
      statut: statutRisquePd(intensiteScore),
      explication: `Score ${base.score_ia}/100 → risque inverse ${intensiteScore} % — corrélation calibrée sur 12 mois de défauts réseau`,
    },
    {
      libelle: 'Classification BCEAO',
      poids_pct: poids.bceao,
      note: intensiteBceao,
      contribution: Math.round(intensiteBceao * poids.bceao / 100 * 10) / 10,
      statut: statutRisquePd(intensiteBceao),
      explication: ind.migration_mois
        ? `Migration ${ind.classe_precedente.replace('_', ' ')} → ${base.classe_bceao.replace('_', ' ')} — signal de dégradation`
        : `Classe ${base.classe_bceao.replace('_', ' ')} — barème prudentiel appliqué`,
    },
    {
      libelle: 'Exposition & signaux',
      poids_pct: poids.expo,
      note: intensiteExpo,
      contribution: Math.round(intensiteExpo * poids.expo / 100 * 10) / 10,
      statut: statutRisquePd(intensiteExpo),
      explication: `Encours ${formatFcfaInline(base.encours)} · ratio ${ind.ratio_encours_revenu}× · ${activite.secteur}${base.alertes_ia.some(a => a.severite === 'CRITIQUE') ? ' · alerte critique active' : ''}`,
    },
  ]

  const facteurs = ajusterContributionsPct(facteursBruts, ind.pd_pct)
  const facteurDominant = [...facteurs].sort((a, b) => b.contribution - a.contribution)[0]

  return {
    pd_pct: ind.pd_pct,
    modele: 'PD IFRS 9',
    version: 'v2.1',
    synthese: facteurDominant
      ? `PD ${ind.pd_pct} % — principalement portée par « ${facteurDominant.libelle.toLowerCase()} » (${facteurDominant.explication.split('—')[0]?.trim() || facteurDominant.explication}).`
      : `PD ${ind.pd_pct} %.`,
    formule_el: `EL = PD (${ind.pd_pct} %) × LGD (${ind.lgd_pct} %) × Encours (${formatFcfaInline(base.encours)}) → ${formatFcfaInline(ind.el_fcfa)} estimée`,
    facteurs,
  }
}

function enrichIndicateursRisque(
  base: ClientRisqueDetail,
  activite: ActiviteEconomique,
  ind: IndicateurRisqueSeed,
): IndicateurRisque {
  return {
    ...ind,
    explication_score_ia: buildExplicationScoreIA(base, activite, ind),
    explication_score_cbi: buildExplicationScoreCBI(base, activite, ind),
    explication_pd: buildExplicationPD(base, activite, ind),
  }
}

/** Synthèse IA — contexte marché & analyse financière (onglet Activité) */
export interface AnalyseActiviteIA {
  date_generation: string
  confiance_pct: number
  contexte_marche: string
  analyse_financiere: string
  points_cles: string[]
  chiffres: {
    ca_mensuel_fcfa: number
    charges_mensuelles_fcfa: number
    marge_nette_fcfa: number
    marge_pct: number
    ratio_encours_revenu: number
    dti_pct: number
  }
}

export interface FicheClientMicrofinance extends ClientRisqueDetail {
  identite: IdentiteClient
  activite_detail: ActiviteEconomique
  analyse_activite_ia: AnalyseActiviteIA
  client_depuis: string
  numero_adherent: string
  comptes_epargne: CompteEpargneLie[]
  kyc: DocumentKyc[]
  credits_detail: CreditDetaille[]
  recouvrement: ActionRecouvrement[]
  indicateurs_risque: IndicateurRisque
  decision_dec: {
    recommandation: string
    delai: string
    prochaine_echeance_dec: string
    comite_requis: boolean
  }
}

type FicheEnrichieOverride = Omit<FicheClientMicrofinance, keyof ClientRisqueDetail | 'indicateurs_risque'> & {
  indicateurs_risque: IndicateurRisqueSeed
}

type FicheEnrichieInput = FicheEnrichieOverride | Omit<FicheClientMicrofinance, keyof ClientRisqueDetail>

function produitEpargneLabel(type: TypeCompteEpargne): string {
  const labels: Record<TypeCompteEpargne, string> = {
    VUE: 'Compte courant épargne',
    DAT: 'Dépôt à terme',
    TONTINE: 'Compte tontine',
    BLOQUE: 'Compte épargne bloqué (garantie)',
  }
  return labels[type]
}

function seedFromClientId(clientId: string): number {
  const num = parseInt(clientId.replace(/\D/g, ''), 10) || 1
  return num % 100
}

/**
 * Règle métier IMF : tout emprunteur possède au minimum un compte épargne
 * (ouverture obligatoire à l'adhésion, souvent lié au dépôt de garantie).
 */
export function buildComptesEpargneClient(
  clientId: string,
  base: Pick<ClientRisqueDetail, 'nom' | 'encours' | 'jours_retard' | 'secteur' | 'agence' | 'mensualite'>,
): CompteEpargneLie[] {
  const fromRegistry = getAllComptesEpargne().filter(
    c => c.client.toLowerCase() === base.nom.toLowerCase(),
  )
  if (fromRegistry.length > 0) {
    return fromRegistry.map(c => ({
      numero: c.numero,
      produit: produitEpargneLabel(c.type),
      solde_fcfa: c.solde_fcfa,
      statut: c.statut,
      dernier_mouvement: c.dernier_mouvement,
    }))
  }

  const seed = seedFromClientId(clientId)
  const suffix = clientId.replace('CL-', '')
  const soldePrincipal = Math.round(
    Math.max(base.mensualite * 2, base.encours * (0.08 + (seed % 55) / 100)),
  )
  const statutPrincipal: CompteEpargneLie['statut'] =
    base.jours_retard >= 90 ? 'DORMANT'
      : base.jours_retard >= 45 ? (seed % 2 === 0 ? 'DORMANT' : 'ACTIF')
        : seed % 7 === 0 ? 'DORMANT' : 'ACTIF'

  const dernierMouvement =
    base.jours_retard >= 60 ? `${String(10 + seed % 18).padStart(2, '0')}/02/2026`
      : base.jours_retard >= 20 ? `${String(5 + seed % 20).padStart(2, '0')}/04/2026`
        : `${String(20 + seed % 8).padStart(2, '0')}/05/2026`

  const comptes: CompteEpargneLie[] = [
    {
      numero: `EP-${suffix}-001`,
      produit: 'Compte courant épargne',
      solde_fcfa: Math.max(25_000, soldePrincipal),
      statut: statutPrincipal,
      dernier_mouvement: dernierMouvement,
    },
  ]

  if (base.encours > 300_000) {
    const depotGage = Math.round(base.encours * (base.encours > 1_000_000 ? 0.15 : 0.10))
    comptes.push({
      numero: `EP-${suffix}-002`,
      produit: base.encours > 800_000 ? 'Dépôt à terme 6 mois' : 'Compte épargne bloqué (garantie)',
      solde_fcfa: depotGage,
      statut: base.jours_retard >= 60 ? 'BLOQUE' : 'ACTIF',
      dernier_mouvement: base.jours_retard >= 30 ? '—' : dernierMouvement,
    })
  }

  if (base.secteur === 'Agriculture' || base.secteur === 'Agroalimentaire') {
    comptes.push({
      numero: `EP-${suffix}-T01`,
      produit: 'Compte tontine agricole',
      solde_fcfa: Math.round(base.mensualite * (2 + seed % 4)),
      statut: base.jours_retard >= 30 ? 'DORMANT' : 'ACTIF',
      dernier_mouvement: dernierMouvement,
    })
  }

  return comptes
}

function ensureComptesEpargne(
  clientId: string,
  base: ClientRisqueDetail,
  comptes: CompteEpargneLie[],
): CompteEpargneLie[] {
  return comptes.length > 0 ? comptes : buildComptesEpargneClient(clientId, base)
}

const FICHES_ENRICHIES: Partial<Record<string, FicheEnrichieOverride>> = {
  'CL-1042': buildKomlanAttivor(),
}

function buildKomlanAttivor(): FicheEnrichieOverride {
  const echeancier: EcheanceCredit[] = [
    { numero: 1, date_echeance: '15/09/2024', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '14/09/2024', montant_paye_fcfa: 94_444, solde_apres_fcfa: 779_167 },
    { numero: 2, date_echeance: '15/10/2024', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '15/10/2024', montant_paye_fcfa: 94_444, solde_apres_fcfa: 708_334 },
    { numero: 3, date_echeance: '15/11/2024', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '16/11/2024', montant_paye_fcfa: 94_444, solde_apres_fcfa: 637_501 },
    { numero: 4, date_echeance: '15/12/2024', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '15/12/2024', montant_paye_fcfa: 94_444, solde_apres_fcfa: 566_668 },
    { numero: 5, date_echeance: '15/01/2025', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '18/01/2025', montant_paye_fcfa: 94_444, solde_apres_fcfa: 495_835, retard_jours: 3 },
    { numero: 6, date_echeance: '15/02/2025', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '15/02/2025', montant_paye_fcfa: 94_444, solde_apres_fcfa: 425_002 },
    { numero: 7, date_echeance: '15/03/2025', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '20/03/2025', montant_paye_fcfa: 94_444, solde_apres_fcfa: 354_169, retard_jours: 5 },
    { numero: 8, date_echeance: '15/04/2025', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '15/04/2025', montant_paye_fcfa: 94_444, solde_apres_fcfa: 283_336 },
    { numero: 9, date_echeance: '15/05/2025', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '22/05/2025', montant_paye_fcfa: 94_444, solde_apres_fcfa: 212_503, retard_jours: 7 },
    { numero: 10, date_echeance: '15/12/2025', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'PAYE', date_paiement: '15/12/2025', montant_paye_fcfa: 94_444, solde_apres_fcfa: 141_670 },
    { numero: 11, date_echeance: '15/01/2026', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'IMPAYE', solde_apres_fcfa: 141_670, retard_jours: 87 },
    { numero: 12, date_echeance: '15/02/2026', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'IMPAYE', solde_apres_fcfa: 141_670, retard_jours: 56 },
    { numero: 13, date_echeance: '15/03/2026', capital_fcfa: 70_833, interet_fcfa: 23_611, total_fcfa: 94_444, statut: 'IMPAYE', solde_apres_fcfa: 141_670, retard_jours: 28 },
  ]

  return {
    identite: {
      prenom: 'Komlan',
      nom: 'Attivor',
      genre: 'M',
      date_naissance: '15/03/1992',
      age: 34,
      nationalite: 'Togolaise',
      situation_matrimoniale: 'Marié(e)',
      personnes_charge: 3,
      cni: 'N° 1234 5678 9012',
      cni_delivrance: '12/06/2020',
      cni_lieu: 'Préfecture du Golfe — Lomé',
      adresse_domicile: 'Lot 247, cité des Commerçants, Adidogomé — BP 127 Lomé',
      adresse_activite: 'Stand B-47, marché de Bè Kpota, face entrée principale',
      gps: { lat: 6.1782, lng: 1.1954 },
      telephone_principal: '+228 90 44 55 66',
      telephone_secondaire: '+228 79 44 55 66',
      whatsapp: '+228 90 44 55 66',
      contact_urgence: { prenom: 'Akossi', nom: 'Attivor', lien: 'Sœur', telephone: '+228 97 12 34 56' },
    },
    activite_detail: {
      secteur: 'Commerce',
      sous_secteur: 'Vente vêtements & accessoires',
      description: 'Commerce de détail vêtements femmes, enfants et accessoires (sacs, bijoux fantaisie). Approvisionnement grossistes Lomé-Accra 2×/mois.',
      anciennete_annees: 8,
      lieu_exercice: 'Marché de Bè Kpota — stand couvert',
      numero_stand: 'B-47',
      effectif: 2,
      ca_mensuel_fcfa: 420_000,
      charges_mensuelles_fcfa: 280_000,
      marge_nette_fcfa: 140_000,
      saisonnalite: 'Pic décembre–janvier (fêtes) · creux mars–avril',
      concurrence: '3 stands similaires même allée — pression prix',
    },
    client_depuis: '14/03/2022',
    numero_adherent: 'ADH-BK-2018-1042',
    comptes_epargne: [
      { numero: 'EP-1042-001', produit: 'Compte courant épargne', solde_fcfa: 12_500, statut: 'DORMANT', dernier_mouvement: '08/10/2025' },
      { numero: 'EP-1042-002', produit: 'Dépôt à terme 6 mois', solde_fcfa: 0, statut: 'BLOQUE', dernier_mouvement: '—' },
    ],
    kyc: buildKycClient(true, 'N° 1234 5678 9012', '14/03/2022'),
    credits_detail: [
      {
        reference: 'CR-2024-089',
        produit: 'Microcrédit individuel — Commerce',
        montant_decaisse_fcfa: 850_000,
        encours_fcfa: 850_000,
        capital_restant_du_fcfa: 778_340,
        interets_courus_fcfa: 52_160,
        penalites_fcfa: 19_500,
        taux_annuel_pct: 18,
        duree_mois: 12,
        mensualite_fcfa: 94_444,
        date_decaissement: '08/08/2024',
        date_fin_prevue: '15/07/2025',
        statut: 'EN_RETARD',
        canal_decaissement: 'Virement agence → caisse',
        nb_impayes: 3,
        echeancier,
        cautionnaires: [],
        garanties: [
          {
            type: 'STOCK',
            description: 'Stock marchandises stand B-47 (inventaire 12/2025)',
            valeur_estimee_fcfa: 400_000,
            couverture_pct: 47,
            statut: 'INSUFFISANT',
          },
          {
            type: 'DEPOT_GAGE',
            description: 'Dépôt de garantie 10 % — compte EP-1042-002 (bloqué)',
            valeur_estimee_fcfa: 0,
            couverture_pct: 0,
            statut: 'MANQUANT',
          },
        ],
        reglement_garanties: buildReglementGaranties(850_000, [], [
          { type: 'STOCK', description: 'Stock B-47', valeur_estimee_fcfa: 400_000, couverture_pct: 47, statut: 'INSUFFISANT' },
          { type: 'DEPOT_GAGE', description: 'Dépôt 10 %', valeur_estimee_fcfa: 0, couverture_pct: 0, statut: 'MANQUANT' },
        ]),
      },
      {
        reference: 'CR-2023-044',
        produit: 'Microcrédit individuel — Commerce (1er cycle)',
        montant_decaisse_fcfa: 400_000,
        encours_fcfa: 0,
        capital_restant_du_fcfa: 0,
        interets_courus_fcfa: 0,
        penalites_fcfa: 0,
        taux_annuel_pct: 18,
        duree_mois: 10,
        mensualite_fcfa: 44_444,
        date_decaissement: '15/03/2023',
        date_fin_prevue: '15/01/2024',
        statut: 'CLOTURE',
        canal_decaissement: 'Espèces guichet',
        nb_impayes: 0,
        echeancier: [],
        cautionnaires: [],
        garanties: [
          {
            type: 'DEPOT_GAGE',
            description: 'Dépôt de garantie 10 % — libéré à clôture',
            valeur_estimee_fcfa: 40_000,
            couverture_pct: 10,
            statut: 'REALISE',
          },
        ],
        reglement_garanties: buildReglementGaranties(400_000, [], [
          { type: 'DEPOT_GAGE', description: 'Dépôt 10 %', valeur_estimee_fcfa: 40_000, couverture_pct: 10, statut: 'REALISE' },
        ]),
      },
    ],
    recouvrement: [
      { date: '28/05/2026', type: 'RELANCE_SMS', canal: 'SMS', agent: 'Système Prospera', resultat: 'Non livré — numéro injoignable', prochaine_action: 'Visite domicile 29/05' },
      { date: '21/05/2026', type: 'MISE_EN_DEMEURE', canal: 'Courrier AR', agent: 'Service juridique', resultat: 'Rédigée — envoi prévu 30/05', prochaine_action: 'Signature DG' },
      { date: '12/05/2026', type: 'APPEL', canal: 'Téléphone', agent: 'Edem Kpélim', resultat: 'Pas de réponse — messagerie pleine', prochaine_action: 'Relance WhatsApp' },
      { date: '10/05/2026', type: 'VISITE', canal: 'Terrain', agent: 'Edem Kpélim', resultat: 'Domicile fermé — voisins: déménagement temporaire vers Agoè', prochaine_action: 'Vérifier stand marché' },
      { date: '22/04/2026', type: 'VISITE', canal: 'Terrain', agent: 'Edem Kpélim', resultat: 'Stand fermé — stock partiellement retiré', prochaine_action: 'Rappel client' },
      { date: '15/04/2026', type: 'RELANCE_WA', canal: 'WhatsApp', agent: 'Edem Kpélim', resultat: 'Lu sans réponse', prochaine_action: 'Appel téléphonique' },
      { date: '15/03/2026', type: 'APPEL', canal: 'Téléphone', agent: 'Edem Kpélim', resultat: 'Promesse paiement 20/03 — non honorée', montant_promis_fcfa: 94_444 },
      { date: '01/03/2026', type: 'RELANCE_SMS', canal: 'SMS', agent: 'Système Prospera', resultat: 'Délivré — pas de retour' },
      { date: '15/02/2026', heure: '11:22', type: 'APPEL', canal: 'Mixx By Yas', agent: 'Guichet Bè Kpota', resultat: 'Paiement partiel 47 222 FCFA reçu', montant_promis_fcfa: 47_222 },
    ],
    indicateurs_risque: {
      score_ia: 38,
      score_cbi: 41,
      pd_pct: 62,
      lgd_pct: 55,
      el_fcfa: 421_400,
      classe_bceao: 'DOUTEUX',
      classe_precedente: 'SOUS_SURVEILLANCE',
      provision_pct: 50,
      provision_fcfa: 425_000,
      migration_mois: true,
      dti_pct: 67,
      ratio_encours_revenu: 6.1,
    },
    decision_dec: {
      recommandation: 'Mise en demeure formelle sous 48h. Si absence de régularisation totale ou plan signé sous 15 jours → orientation contentieux + saisie stock + appel des 2 cautionnaires solidaires (Akossi Attivor + Mawulé Koffi).',
      delai: '15 jours ouvrés',
      prochaine_echeance_dec: '02/06/2026 — Comité crédit agressif',
      comite_requis: true,
    },
    analyse_activite_ia: {
      date_generation: '28/05/2026 à 06:12',
      confiance_pct: 84,
      contexte_marche:
        'Le stand B-47 du marché de Bè Kpota évolue dans un segment très concurrentiel : trois stands similaires sur la même allée exercent une pression prix permanente sur les vêtements et accessoires. La demande est structurellement cyclique — pic décembre-janvier (fêtes, rentrée scolaire) et creux mars-avril — ce qui complique la régularité des remboursements sur un crédit à mensualité fixe. Les visites terrain de fin avril et mai signalent une activité en ralentissement : stand fermé à plusieurs reprises, stock partiellement retiré, voire déménagement temporaire vers Agoè évoqué par le voisinage. L\'approvisionnement grossistes Lomé–Accra (deux fois par mois) expose le client aux variations de prix et aux coûts de transport. Prospera IA estime une baisse de trafic client de 25 à 35 % par rapport au T4 2025 sur ce créneau.',
      analyse_financiere:
        'Revenus déclarés de 420 000 FCFA/mois pour un encours de 850 000 FCFA. La marge nette affichée de 140 000 FCFA (33 % du CA) paraît cohérente sur le papier, mais le ratio encours/revenu net disponible atteint 6,1× — très au-dessus du seuil de confort microfinance (≤ 3×). Avec une mensualité de 94 444 FCFA, le taux d\'effort représente 67 % du revenu net déclaré, largement supérieur au plafond CBI v5 (33 %). Les trois impayés depuis janvier 2026 et le paiement partiel du 15/02 confirment une dégradation réelle de la capacité de remboursement, probablement sous-estimée lors de l\'analyse initiale d\'août 2024. L\'épargne dormante (12 500 FCFA) et l\'absence de flux récents renforcent le signal de tension de trésorerie. Recommandation IA : contre-visite avec inventaire stock valorisé et re-déclaration CA sur base carnet de ventes avant toute restructuration.',
      points_cles: [
        'Concurrence locale forte — pression prix sur l\'allée B-47',
        'Activité en ralentissement confirmée par visites GP (stand fermé, stock retiré)',
        'Taux d\'effort 67 % — seuil CBI v5 dépassé',
        '3 impayés consécutifs — capacité réelle inférieure aux déclarations',
      ],
      chiffres: {
        ca_mensuel_fcfa: 420_000,
        charges_mensuelles_fcfa: 280_000,
        marge_nette_fcfa: 140_000,
        marge_pct: 33,
        ratio_encours_revenu: 6.1,
        dti_pct: 67,
      },
    },
  }
}

function formatFcfaShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`
  return `${Math.round(n / 1_000)} k`
}

export function buildAnalyseActiviteIA(
  base: Pick<ClientRisqueDetail, 'encours' | 'mensualite' | 'jours_retard' | 'echeances_impayees' | 'secteur' | 'localite'>,
  activite: ActiviteEconomique,
  indicateurs: Pick<IndicateurRisque, 'ratio_encours_revenu' | 'dti_pct'>,
): AnalyseActiviteIA {
  const margePct = activite.ca_mensuel_fcfa > 0
    ? Math.round((activite.marge_nette_fcfa / activite.ca_mensuel_fcfa) * 100)
    : 0
  const effortOk = indicateurs.dti_pct <= 33
  const ratioOk = indicateurs.ratio_encours_revenu <= 3

  const contexte_marche =
    `Activité ${activite.sous_secteur.toLowerCase()} (${activite.secteur}) à ${activite.lieu_exercice || base.localite}, ` +
    `ancienneté ${activite.anciennete_annees} an${activite.anciennete_annees > 1 ? 's' : ''}, effectif ${activite.effectif} personne(s). ` +
    `${activite.concurrence !== 'Non renseigné' ? activite.concurrence + '. ' : ''}` +
    `${activite.saisonnalite !== 'Non renseigné' ? 'Saisonnalité : ' + activite.saisonnalite + '. ' : ''}` +
    `Prospera IA croise les données secteur BCEAO, la zone ${base.localite} et l'historique de visites terrain pour estimer la dynamique commerciale actuelle.` +
    (base.jours_retard >= 30
      ? ` Signal d'alerte : retard J+${base.jours_retard} — vérifier si l'activité reste opérationnelle au lieu déclaré.`
      : '')

  const analyse_financiere =
    `CA mensuel déclaré ${formatFcfaShort(activite.ca_mensuel_fcfa)} FCFA, charges ${formatFcfaShort(activite.charges_mensuelles_fcfa)} FCFA, ` +
    `marge nette ${formatFcfaShort(activite.marge_nette_fcfa)} FCFA (${margePct} %). ` +
    `Encours ${formatFcfaShort(base.encours)} FCFA — ratio encours/revenu net ${indicateurs.ratio_encours_revenu}×` +
    `${ratioOk ? ', dans la zone de confort.' : ', au-dessus du seuil recommandé (≤ 3×).'} ` +
    `Mensualité ${formatFcfaShort(base.mensualite)} FCFA, taux d'effort ${indicateurs.dti_pct} %` +
    `${effortOk ? ' — conforme au plafond CBI v5 (33 %).' : ' — au-dessus du plafond CBI v5 (33 %).'}` +
    (base.echeances_impayees > 0
      ? ` ${base.echeances_impayees} échéance(s) impayée(s) confirment${base.jours_retard >= 60 ? ' une dégradation avérée' : ' une tension de trésorerie'} de la capacité de remboursement.`
      : ' Historique de remboursement régulier — profil compatible avec renouvellement.')

  const points_cles = [
    `Marge nette ${margePct} % — ${margePct >= 25 ? 'structure saine' : margePct >= 15 ? 'marge acceptable' : 'marge faible'}`,
    `Ratio encours/revenu ${indicateurs.ratio_encours_revenu}× — ${ratioOk ? 'confortable' : 'élevé'}`,
    `Taux d'effort ${indicateurs.dti_pct} % — ${effortOk ? 'conforme CBI v5' : 'seuil CBI v5 dépassé'}`,
    ...(base.echeances_impayees > 0 ? [`${base.echeances_impayees} impayé(s) — suivi GP renforcé`] : ['Remboursements à jour']),
  ]

  return {
    date_generation: '28/05/2026 à 06:00',
    confiance_pct: base.jours_retard >= 60 ? 78 : base.echeances_impayees > 0 ? 82 : 88,
    contexte_marche,
    analyse_financiere,
    points_cles,
    chiffres: {
      ca_mensuel_fcfa: activite.ca_mensuel_fcfa,
      charges_mensuelles_fcfa: activite.charges_mensuelles_fcfa,
      marge_nette_fcfa: activite.marge_nette_fcfa,
      marge_pct: margePct,
      ratio_encours_revenu: indicateurs.ratio_encours_revenu,
      dti_pct: indicateurs.dti_pct,
    },
  }
}

function normalizeCanal(canal: string): string {
  return canal
    .replace(/MTN MoMo/gi, 'Mixx By Yas')
    .replace(/Moov MoMo/gi, 'Flooz')
    .replace(/Orange Money/gi, 'Flooz')
}

function buildFallbackVisites(base: ClientRisqueDetail): ClientRisqueDetail['visites'] {
  if (base.visites.length > 0) return base.visites
  const commercial = base.agent_commercial ?? base.agent
  const seed = seedFromClientId(base.id)

  if (base.jours_retard > 0) {
    return [
      {
        date: '22/05/2026',
        agent: commercial,
        statut: base.jours_retard > 21 ? 'NEGATIVE' : 'POSITIVE',
        commentaire: base.jours_retard > 21
          ? 'Visite recouvrement — client absent, activité non confirmée'
          : 'Visite terrain — activité confirmée, promesse de paiement',
      },
      {
        date: `${String(8 + seed % 12).padStart(2, '0')}/05/2026`,
        agent: commercial,
        statut: 'POSITIVE',
        commentaire: 'Contrôle GPS conforme — adresse activité vérifiée',
      },
    ]
  }

  return [
    {
      date: '20/05/2026',
      agent: commercial,
      statut: 'POSITIVE',
      commentaire: 'Visite suivi trimestriel — activité stable, stock correct',
    },
    {
      date: `${String(5 + seed % 15).padStart(2, '0')}/04/2026`,
      agent: commercial,
      statut: 'POSITIVE',
      commentaire: 'Visite domicile — conformité GPS OK, client performant',
    },
  ]
}

function buildFallbackRecouvrement(base: ClientRisqueDetail): ActionRecouvrement[] {
  const gp = base.agent_gp ?? '—'
  const commercial = base.agent_commercial ?? base.agent

  if (base.jours_retard > 0) {
    const actions: ActionRecouvrement[] = [
      {
        date: '28/05/2026',
        heure: '09:30',
        type: 'RELANCE_WA',
        canal: 'WhatsApp',
        agent: gp,
        resultat: `Relance échéance impayée — retard J+${base.jours_retard}`,
        prochaine_action: 'Visite terrain si non-paiement sous 7 jours',
      },
      {
        date: '24/05/2026',
        type: 'APPEL',
        canal: 'Téléphone',
        agent: gp,
        resultat: 'Promesse de paiement — à confirmer',
        prochaine_action: base.jours_retard >= 30 ? 'Escalade RA / contentieux' : 'Contrôle réception 02/06',
      },
    ]
    if (base.jours_retard >= 8) {
      actions.push({
        date: '18/05/2026',
        type: 'VISITE',
        canal: 'Terrain',
        agent: commercial,
        resultat: 'Visite recouvrement — contact établi sur site',
        prochaine_action: 'Relance GP si échéance non honorée',
      })
    }
    return actions
  }

  const actions: ActionRecouvrement[] = [
    {
      date: '28/05/2026',
      type: 'RELANCE_SMS',
      canal: 'SMS',
      agent: 'Système Prospera',
      resultat: 'Rappel échéance à venir — message délivré',
      prochaine_action: 'Contrôle paiement J+3 après échéance',
    },
  ]

  for (const p of base.paiements_recents.filter(pay => pay.montant > 0).slice(0, 2)) {
    actions.push({
      date: p.date,
      type: 'APPEL',
      canal: p.canal,
      agent: gp,
      resultat: p.type === 'REMBOURSEMENT'
        ? `Paiement reçu — ${p.montant.toLocaleString('fr-FR')} FCFA`
        : `${p.type} — ${p.montant.toLocaleString('fr-FR')} FCFA`,
    })
  }

  return actions
}

function buildFallbackEcheancier(
  base: ClientRisqueDetail,
  credit: { montant: number; encours: number; date_decaissement: string },
  dureeMois = 12,
): EcheanceCredit[] {
  return buildEcheancierCoherent({
    montant: credit.montant,
    encours: credit.encours,
    date_decaissement: credit.date_decaissement,
    mensualite: base.mensualite,
    jours_retard: base.jours_retard,
    echeances_impayees: base.echeances_impayees,
    duree_mois: dureeMois,
  })
}

function buildFallbackFromBase(base: ClientRisqueDetail): Omit<FicheClientMicrofinance, keyof ClientRisqueDetail> {
  const provisionPct = base.classe_bceao === 'DOUTEUX' ? 50 : base.classe_bceao === 'CONTENTIEUX' ? 100 : base.classe_bceao === 'SOUS_SURVEILLANCE' ? 10 : 1
  const identite = buildIdentiteClient(base.id, base)
  const dateDepot = '15/03/2023'

  const creditActifRef = base.credits.find(cr => cr.encours > 0 || cr.statut === 'EN_RETARD')?.reference

  const credits_detail: CreditDetaille[] = base.credits.map(c => {
    const montant = c.montant
    const echeancier = c.encours > 0 || c.statut === 'EN_RETARD'
      ? buildFallbackEcheancier(base, c)
      : []
    const nbEcheancier = countImpayesEcheancier(echeancier)
    const soldeEcheancier = echeancier.length > 0 ? echeancier[echeancier.length - 1]!.solde_apres_fcfa : undefined
    const estCreditPrincipal = c.reference === creditActifRef
    const nbImpayes = resolveNbImpayes(
      estCreditPrincipal ? base.echeances_impayees : 0,
      nbEcheancier,
      c.encours > 0 || c.statut === 'EN_RETARD',
    )
    const encoursSync = resolveEncoursCredit(c.encours, montant, soldeEcheancier)
    const cautionnaires = buildCautionnairesFallback(montant, base.nom, c.date_decaissement, base.id)
    const garanties = buildGarantiesComplementaires(montant)
    const enRetard = c.statut === 'EN_RETARD' || base.jours_retard > 0 || nbImpayes > 0
    return {
      reference: c.reference,
      produit: `Microcrédit — ${base.secteur}`,
      montant_decaisse_fcfa: montant,
      encours_fcfa: encoursSync,
      capital_restant_du_fcfa: encoursSync,
      interets_courus_fcfa: enRetard ? Math.round(encoursSync * 0.06) : 0,
      penalites_fcfa: enRetard ? Math.round(base.mensualite * 0.15) : 0,
      taux_annuel_pct: 18,
      duree_mois: 12,
      mensualite_fcfa: base.mensualite,
      date_decaissement: c.date_decaissement,
      date_fin_prevue: '—',
      statut: enRetard ? 'EN_RETARD' : c.statut,
      canal_decaissement: 'Guichet agence',
      nb_impayes: nbImpayes,
      echeancier,
      cautionnaires,
      garanties,
      reglement_garanties: buildReglementGaranties(montant, cautionnaires, garanties),
    }
  })

  const activite_detail: ActiviteEconomique = {
      secteur: base.secteur,
      sous_secteur: base.activite.split('—')[0]?.trim() ?? base.activite,
      description: base.activite,
      anciennete_annees: 3,
      lieu_exercice: base.localite,
      effectif: 1,
      ca_mensuel_fcfa: Math.round(base.mensualite * 4.5),
      charges_mensuelles_fcfa: Math.round(base.mensualite * 3),
      marge_nette_fcfa: Math.round(base.mensualite * 1.5),
      saisonnalite: 'Non renseigné',
      concurrence: 'Non renseigné',
    }
  const ratioEncours = Number((base.encours / (base.mensualite * 4)).toFixed(1))
  const dtiPct = Math.round((base.mensualite / (base.mensualite * 4)) * 100)

  return {
    identite,
    activite_detail,
    client_depuis: dateDepot,
    numero_adherent: base.id.replace('CL-', 'ADH-'),
    comptes_epargne: buildComptesEpargneClient(base.id, base),
    kyc: buildKycClient(base.credits.length > 0, identite.cni, dateDepot),
    credits_detail,
    recouvrement: buildFallbackRecouvrement(base),
    indicateurs_risque: enrichIndicateursRisque(base, activite_detail, {
      score_ia: base.score_ia,
      score_cbi: base.score_ia + 3,
      pd_pct: base.pd_pct,
      lgd_pct: 45,
      el_fcfa: base.el,
      classe_bceao: base.classe_bceao,
      classe_precedente: 'NORMAL',
      provision_pct: provisionPct,
      provision_fcfa: Math.round(base.encours * provisionPct / 100),
      migration_mois: base.jours_retard >= 31,
      dti_pct: dtiPct,
      ratio_encours_revenu: ratioEncours,
    }),
    decision_dec: {
      recommandation: base.analyse_dec,
      delai: base.jours_retard >= 60 ? '15 jours' : '30 jours',
      prochaine_echeance_dec: '—',
      comite_requis: base.jours_retard >= 60 || base.pd_pct >= 50,
    },
    analyse_activite_ia: buildAnalyseActiviteIA(base, activite_detail, {
      ratio_encours_revenu: ratioEncours,
      dti_pct: dtiPct,
    }),
  }
}

export function buildFicheClientMicrofinance(base: ClientRisqueDetail): FicheClientMicrofinance {
  const id = base.id
  const enrichi = FICHES_ENRICHIES[id]
  const normalized = normalizeFicheClient(
    id,
    base,
    enrichi ?? buildFallbackFromBase(base),
  )

  const creditActifRef = base.credits.find(cr => cr.encours > 0 || cr.statut === 'EN_RETARD')?.reference
  const creditDetailActif = normalized.credits_detail?.find(c => c.reference === creditActifRef)
    ?? normalized.credits_detail?.find(c => c.encours_fcfa > 0 || c.statut === 'EN_RETARD')
    ?? normalized.credits_detail?.[0]

  const indicateurs_risque = enrichIndicateursRisque(base, normalized.activite_detail, {
    ...normalized.indicateurs_risque,
    score_ia: base.score_ia,
    classe_bceao: base.classe_bceao,
  })

  return {
    ...base,
    ...normalized,
    indicateurs_risque,
    encours: base.encours > 0 ? base.encours : (creditDetailActif?.encours_fcfa ?? 0),
    echeances_impayees: base.echeances_impayees > 0
      ? base.echeances_impayees
      : (creditDetailActif?.nb_impayes ?? 0),
    visites: base.visites.length > 0 ? base.visites : buildFallbackVisites(base),
    comptes_epargne: ensureComptesEpargne(id, base, normalized.comptes_epargne ?? []),
    paiements_recents: base.paiements_recents.map((p: PaiementRecent) => ({
      ...p,
      canal: normalizeCanal(p.canal),
    })),
  }
}

export function getFicheClientMicrofinance(id: string): FicheClientMicrofinance | undefined {
  const base = getClientRisqueById(id)
  if (!base) return undefined
  return buildFicheClientMicrofinance(base)
}
