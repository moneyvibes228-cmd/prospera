/**
 * Facturation & Créances DG — créances, impayés, grille prix, analyses IA.
 */
import type { Facture, FactureStatut } from '@distributeur/types'
import { REGISTRE_FACTURES, GRILLE_PRIX_ENTREPRISE } from './registries/factures-registry'

export type VueFacturationDG = 'consolide' | 'impayees' | 'retard' | 'emises' | 'payees' | 'partenaires' | 'enseigne'

export interface ClientImpayeurDG {
  pdv_id: string
  pdv_nom: string
  zone: string
  commercial: string
  nb_factures_impayees: number
  creance_totale: number
  plus_ancien_retard_j: number
  plafond_credit: number
  depassement_plafond: boolean
  score_risque_ia: number
  facture_ids: string[]
}

export interface FactureDG extends Facture {
  reste_a_payer: number
  pct_paye: number
  niveau_risque: 'CRITIQUE' | 'ELEVE' | 'MODERE' | 'FAIBLE'
}

export interface SyntheseFacturationDG {
  total_factures: number
  ca_facture_mois: number
  ca_encaisse_mois: number
  creances_ouvertes: number
  impayes_retard: number
  factures_retard: number
  factures_partielles: number
  delai_moyen_encaissement_j: number
  taux_recouvrement_pct: number
  marge_facturee_moy_pct: number
  clients_a_risque: number
}

export interface AnalyseFacturationIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  action: string
}

export interface CommercialRecouvrementDG {
  commercial: string
  factures_emises: number
  ca_facture: number
  impayes: number
  taux_recouvrement_pct: number
  clients_a_risque: number
}

const STATUT_LABEL: Record<FactureStatut, string> = {
  BROUILLON: 'Brouillon',
  EMISE: 'Émise',
  PARTIELLE: 'Partielle',
  PAYEE: 'Payée',
  EN_RETARD: 'En retard',
}

function niveauRisque(f: Facture): FactureDG['niveau_risque'] {
  const score = f.score_risque_ia ?? 70
  const reste = f.montant - f.paye
  if (f.jours_retard > 30 || score < 35 || reste > (f.plafond_credit ?? Infinity)) return 'CRITIQUE'
  if (f.jours_retard > 14 || score < 55) return 'ELEVE'
  if (f.jours_retard > 0 || f.statut === 'PARTIELLE') return 'MODERE'
  return 'FAIBLE'
}

export function buildFacturesDG(factures: Facture[] = REGISTRE_FACTURES): FactureDG[] {
  return factures.map(f => {
    const reste = f.montant - f.paye
    return {
      ...f,
      reste_a_payer: reste,
      pct_paye: f.montant > 0 ? Math.round((f.paye / f.montant) * 100) : 0,
      niveau_risque: niveauRisque(f),
    }
  })
}

export function buildSyntheseFacturationDG(factures: FactureDG[]): SyntheseFacturationDG {
  const caMois = factures.reduce((s, f) => s + f.montant, 0)
  const encaisse = factures.reduce((s, f) => s + f.paye, 0)
  const creances = factures.reduce((s, f) => s + f.reste_a_payer, 0)
  const retard = factures.filter(f => f.statut === 'EN_RETARD' || (f.statut === 'PARTIELLE' && f.jours_retard > 0))
  const impayesRetard = retard.reduce((s, f) => s + f.reste_a_payer, 0)
  const payees = factures.filter(f => f.statut === 'PAYEE')
  const delais = payees.map(f => {
    if (!f.date_emission || !f.dernier_paiement) return 25
    const d1 = new Date(f.date_emission).getTime()
    const d2 = new Date(f.dernier_paiement).getTime()
    return Math.max(1, Math.round((d2 - d1) / 86400000))
  })

  const clientsRisque = new Set(
    factures.filter(f => f.niveau_risque === 'CRITIQUE' || f.niveau_risque === 'ELEVE').map(f => f.pdv_id)
  )

  return {
    total_factures: factures.length,
    ca_facture_mois: caMois,
    ca_encaisse_mois: encaisse,
    creances_ouvertes: creances,
    impayes_retard: impayesRetard,
    factures_retard: factures.filter(f => f.statut === 'EN_RETARD').length,
    factures_partielles: factures.filter(f => f.statut === 'PARTIELLE').length,
    delai_moyen_encaissement_j: delais.length ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length) : 28,
    taux_recouvrement_pct: caMois > 0 ? Math.round((encaisse / caMois) * 1000) / 10 : 0,
    marge_facturee_moy_pct: Math.round(factures.reduce((s, f) => s + (f.marge_facture_pct ?? 15), 0) / factures.length * 10) / 10,
    clients_a_risque: clientsRisque.size,
  }
}

export function buildTopImpayeurs(factures: FactureDG[]): ClientImpayeurDG[] {
  const byClient = new Map<string, FactureDG[]>()
  for (const f of factures) {
    if (f.reste_a_payer <= 0) continue
    const key = f.pdv_id ?? f.pdv_nom
    const list = byClient.get(key) ?? []
    list.push(f)
    byClient.set(key, list)
  }

  return [...byClient.entries()]
    .map(([, list]) => {
      const first = list[0]!
      const creance = list.reduce((s, f) => s + f.reste_a_payer, 0)
      const plafond = first.plafond_credit ?? 0
      return {
        pdv_id: first.pdv_id ?? '',
        pdv_nom: first.pdv_nom,
        zone: first.zone ?? '—',
        commercial: first.commercial ?? '—',
        nb_factures_impayees: list.filter(f => f.statut === 'EN_RETARD' || f.statut === 'PARTIELLE').length,
        creance_totale: creance,
        plus_ancien_retard_j: Math.max(...list.map(f => f.jours_retard)),
        plafond_credit: plafond,
        depassement_plafond: plafond > 0 && creance > plafond,
        score_risque_ia: first.score_risque_ia ?? 50,
        facture_ids: list.map(f => f.id),
      }
    })
    .sort((a, b) => b.creance_totale - a.creance_totale)
}

export function buildRecouvrementParCommercial(factures: FactureDG[]): CommercialRecouvrementDG[] {
  const byCom = new Map<string, FactureDG[]>()
  for (const f of factures) {
    const com = f.commercial ?? '—'
    if (com === '—') continue
    const list = byCom.get(com) ?? []
    list.push(f)
    byCom.set(com, list)
  }

  return [...byCom.entries()].map(([commercial, list]) => {
    const ca = list.reduce((s, f) => s + f.montant, 0)
    const impayes = list.reduce((s, f) => s + f.reste_a_payer, 0)
    const encaisse = list.reduce((s, f) => s + f.paye, 0)
    return {
      commercial,
      factures_emises: list.length,
      ca_facture: ca,
      impayes,
      taux_recouvrement_pct: ca > 0 ? Math.round((encaisse / ca) * 1000) / 10 : 100,
      clients_a_risque: new Set(list.filter(f => f.niveau_risque === 'CRITIQUE' || f.niveau_risque === 'ELEVE').map(f => f.pdv_id)).size,
    }
  }).sort((a, b) => b.impayes - a.impayes)
}

export function buildAnalysesFacturationIA(
  factures: FactureDG[],
  impayeurs: ClientImpayeurDG[],
): AnalyseFacturationIA[] {
  const analyses: AnalyseFacturationIA[] = []

  const kiosque = impayeurs.find(c => c.pdv_nom === 'Kiosque Port')
  if (kiosque) {
    analyses.push({
      severite: 'CRITIQUE',
      titre: `Kiosque Port — ${kiosque.nb_factures_impayees} factures · ${(kiosque.creance_totale / 1_000_000).toFixed(1)} M impayés`,
      detail: `Plafond ${(kiosque.plafond_credit / 1_000_000).toFixed(1)} M dépassé (${(kiosque.creance_totale / 1_000_000).toFixed(1)} M) · retard max ${kiosque.plus_ancien_retard_j}j · score IA ${kiosque.score_risque_ia}/100 · 6 relances sans réponse`,
      action: 'Blocage livraison immédiat · mise en demeure · passage contentieux si pas de régularisation sous 7j.',
    })
  }

  const grossiste = impayeurs.find(c => c.pdv_nom === 'Grossiste Adidogomé')
  if (grossiste) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Grossiste Adidogomé — nouveau client, 0 F encaissé',
      detail: `2 factures ${(grossiste.creance_totale / 1_000_000).toFixed(1)} M · commercial Mawuena Ahi · 1ère grosse commande sans paiement initial`,
      action: 'Visite terrain obligatoire avant toute relivraison · réduire plafond crédit à 3 M.',
    })
  }

  const komlan = buildRecouvrementParCommercial(factures).find(c => c.commercial === 'Komlan Tetteh')
  if (komlan && komlan.impayes > 5_000_000) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Portefeuille Komlan Tetteh — concentration impayés',
      detail: `${(komlan.impayes / 1_000_000).toFixed(1)} M impayés · ${komlan.clients_a_risque} clients à risque · taux recouvrement ${komlan.taux_recouvrement_pct}%`,
      action: 'Plan recouvrement hebdo DG · bonus commercial lié au DSO < 35j.',
    })
  }

  const synthese = buildSyntheseFacturationDG(factures)
  analyses.push({
    severite: 'MODEREE',
    titre: `Taux recouvrement global ${synthese.taux_recouvrement_pct}%`,
    detail: `${(synthese.impayes_retard / 1_000_000).toFixed(1)} M en retard · délai moyen encaissement ${synthese.delai_moyen_encaissement_j}j · marge facturée ${synthese.marge_facturee_moy_pct}%`,
    action: 'Prioriser relances sur factures > 30j · automatiser relance J+3 via WhatsApp.',
  })

  const mama = factures.find(f => f.pdv_nom === 'Épicerie Mama T.' && f.statut === 'EN_RETARD')
  if (mama) {
    analyses.push({
      severite: 'MODEREE',
      titre: 'Épicerie Mama T. — 2 impayées récurrentes',
      detail: 'Historique irrégulier mais relation 3 ans · commande en préparation sous réserve crédit',
      action: 'Exiger acompte 50% avant prochaine livraison · plafond maintenu à 4 M.',
    })
  }

  return analyses
}

export function filterFacturesVue(factures: FactureDG[], vue: VueFacturationDG): FactureDG[] {
  if (vue === 'consolide') return factures
  if (vue === 'impayees') return factures.filter(f => f.reste_a_payer > 0)
  if (vue === 'retard') return factures.filter(f => f.statut === 'EN_RETARD' || (f.statut === 'PARTIELLE' && f.jours_retard > 0))
  if (vue === 'emises') return factures.filter(f => f.statut === 'EMISE')
  if (vue === 'payees') return factures.filter(f => f.statut === 'PAYEE')
  if (vue === 'partenaires') return factures.filter(f => f.type_magasin === 'PARTENAIRE')
  return factures.filter(f => f.type_magasin === 'PROPRE')
}

export function getGrillePrixEntreprise() {
  return GRILLE_PRIX_ENTREPRISE
}

export const STATUT_FACTURE_STYLE: Record<FactureStatut, string> = {
  BROUILLON: 'bg-slate-100 text-slate-600',
  EMISE: 'bg-blue-100 text-blue-700',
  PARTIELLE: 'bg-amber-100 text-amber-700',
  PAYEE: 'bg-emerald-100 text-emerald-700',
  EN_RETARD: 'bg-red-100 text-red-700',
}

export const RISQUE_STYLE: Record<FactureDG['niveau_risque'], { label: string; className: string }> = {
  CRITIQUE: { label: 'Critique', className: 'bg-red-100 text-red-700' },
  ELEVE: { label: 'Élevé', className: 'bg-orange-100 text-orange-700' },
  MODERE: { label: 'Modéré', className: 'bg-amber-100 text-amber-700' },
  FAIBLE: { label: 'Faible', className: 'bg-emerald-100 text-emerald-700' },
}

export { STATUT_LABEL }
