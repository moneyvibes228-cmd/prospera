/**
 * Workflow combos stock : validation DG → file marketing → campagne.
 */
import type { CampagneMarketing, ProduitCampagneDetail } from './registries/marketing-registry'
import type { ComboStockIA } from './marketing-combo-stock-builder'

export const REMISE_SEUIL_DG = 12

export type ComboWorkflowStatut = 'EN_ATTENTE_DG' | 'VALIDEE' | 'CAMPAGNE_CREEE'

export interface ComboQueueEntry {
  comboId: string
  statut: ComboWorkflowStatut
  validatedAt?: string
  validatedBy?: 'DG' | 'AUTO'
  campagneId?: string
  campagneCreeeAt?: string
}

export interface CampagneFromCombo extends CampagneMarketing {
  source_combo_id: string
}

const STORAGE_QUEUE = 'prospera-combo-queue'
const STORAGE_CAMPAGNES = 'prospera-combo-campagnes'

export function needsDgValidation(combo: ComboStockIA): boolean {
  return (
    combo.remise_lent_pct >= REMISE_SEUIL_DG
    || combo.severite === 'CRITIQUE'
    || combo.type === 'PROMO_CHOC'
  )
}

export function getComboWorkflowStatut(
  combo: ComboStockIA,
  entry?: ComboQueueEntry,
): ComboWorkflowStatut | 'AUTO_DISPONIBLE' {
  if (entry?.statut === 'CAMPAGNE_CREEE') return 'CAMPAGNE_CREEE'
  if (entry?.statut === 'VALIDEE') return 'VALIDEE'
  if (entry?.statut === 'EN_ATTENTE_DG') return 'EN_ATTENTE_DG'
  if (needsDgValidation(combo)) return 'EN_ATTENTE_DG'
  return 'AUTO_DISPONIBLE'
}

export function isEligibleForMarketing(
  combo: ComboStockIA,
  entry?: ComboQueueEntry,
): boolean {
  const statut = getComboWorkflowStatut(combo, entry)
  return statut === 'VALIDEE' || statut === 'AUTO_DISPONIBLE'
}

export function loadComboQueue(): ComboQueueEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_QUEUE)
    return raw ? (JSON.parse(raw) as ComboQueueEntry[]) : []
  } catch {
    return []
  }
}

export function saveComboQueue(queue: ComboQueueEntry[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_QUEUE, JSON.stringify(queue))
}

export function loadCampagnesFromCombos(): CampagneFromCombo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_CAMPAGNES)
    return raw ? (JSON.parse(raw) as CampagneFromCombo[]) : []
  } catch {
    return []
  }
}

export function saveCampagnesFromCombos(campagnes: CampagneFromCombo[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_CAMPAGNES, JSON.stringify(campagnes))
}

function produitsDetailFromCombo(combo: ComboStockIA): ProduitCampagneDetail[] {
  const moteurs: ProduitCampagneDetail[] = combo.moteurs.map(m => ({
    reference: m.reference,
    nom: m.nom,
    prix_grossiste_fcfa: m.prix_fcfa,
    unite: 'u.',
    role: 'Produit moteur — condition d\'achat du combo',
    objectif_unites: Math.round(m.sorties_mois * 0.1),
    marge_pct: combo.marge_combo_pct + 2,
  }))

  const lent: ProduitCampagneDetail = {
    reference: combo.lent.reference,
    nom: combo.lent.nom,
    prix_grossiste_fcfa: combo.lent.prix_fcfa,
    prix_promo_fcfa: combo.prix_lent_promo_fcfa,
    remise_pct: combo.remise_lent_pct,
    unite: 'u.',
    role: 'SKU lent — promo conditionnelle si panier moteur',
    objectif_unites: combo.stock_a_liberer_unites,
    marge_pct: combo.marge_combo_pct,
  }

  return [...moteurs, lent]
}

export function comboToCampagne(combo: ComboStockIA): CampagneFromCombo {
  const now = new Date()
  const id = `camp-combo-${combo.id}-${now.getTime()}`
  const dateDebut = now.toISOString().slice(0, 10)
  const fin = new Date(now)
  fin.setDate(fin.getDate() + 14)
  const budget = Math.round(combo.contacts_cibles * 5_500)

  return {
    id,
    source_combo_id: combo.id,
    nom: combo.nom,
    objectif: `Écouler ${combo.stock_a_liberer_unites.toLocaleString('fr-FR')} u. de ${combo.lent.nom.split(' ').slice(0, 3).join(' ')} via combo moteur+lent`,
    but_campagne: `Libérer le stock lent (${combo.lent.rotation_jours}j rotation, coût ${Math.round(combo.cout_evite_mois_fcfa / 1000)} K/mois) en attachant une remise -${combo.remise_lent_pct}% UNIQUEMENT si le client commande ${combo.moteurs.map(m => m.nom.split(' ')[0]).join(' + ')}. But : ${combo.contacts_cibles} contacts · CA potentiel combo · marge préservée sur moteurs.`,
    offre: combo.offre,
    produits_detail: produitsDetailFromCombo(combo),
    canal: 'WHATSAPP',
    statut: 'PLANIFIEE',
    zone: combo.zone,
    segment: `PDV actifs — combo écoulement ${combo.lent.categorie}`,
    produits_cibles: [combo.lent.nom, ...combo.moteurs.map(m => m.nom)],
    date_debut: dateDebut,
    date_fin: fin.toISOString().slice(0, 10),
    cibles: combo.contacts_cibles,
    contactes: 0,
    ouverts: 0,
    repondus: 0,
    convertis: 0,
    ca_genere: 0,
    cout_campagne: 0,
    marge_generee: 0,
    budget_max: budget,
    commercial_assigne: combo.zone.includes('Kara') ? 'Komlan Tetteh' : 'Mawuena Agbodjan',
    synthese_ia: combo.explication,
    recommandation_ia: `Campagne générée depuis combo IA ${combo.id}. Lancer WhatsApp sous 48h — priorité ${combo.priorite}. Ne pas appliquer la remise sans le panier moteur.`,
    alerte: combo.severite === 'CRITIQUE'
      ? `Remise -${combo.remise_lent_pct}% validée DG — surveiller marge combo (~${combo.marge_combo_pct}%)`
      : undefined,
  }
}

/* ------------------------------------------------------------------ */
/* Campagnes issues des promotions fournisseurs                        */
/* ------------------------------------------------------------------ */

export interface PromoFournisseurCampagneInput {
  fournisseur_id: string
  fournisseur_nom: string
  remise_pct: number
  franco: number
  volume_a_ecouler: number
  economie_achat: number
  argumentaire: string
  produits: { reference: string; nom: string; stock: number; couverture_jours: number; prix: number }[]
}

/**
 * Transforme une opportunité « promo fournisseur » en vraie campagne d'écoulement,
 * de la même forme que les campagnes issues des combos stock : elle rejoint donc
 * l'onglet Campagnes, le funnel et le ROI, au lieu de rester un simple marqueur.
 */
export function promoFournisseurToCampagne(promo: PromoFournisseurCampagneInput): CampagneFromCombo {
  const now = new Date()
  const dateDebut = now.toISOString().slice(0, 10)
  const fin = new Date(now)
  fin.setDate(fin.getDate() + 21)

  const cibles = Math.max(20, promo.produits.length * 40)
  const budget = Math.round(cibles * 4_500)
  const produitPrincipal = promo.produits[0]

  const produits_detail: ProduitCampagneDetail[] = promo.produits.map((p, i) => ({
    reference: p.reference,
    nom: p.nom,
    prix_grossiste_fcfa: p.prix,
    unite: 'u.',
    role: i === 0
      ? `Surstock prioritaire — ${p.couverture_jours} j de couverture à écouler`
      : `Surstock — ${p.couverture_jours} j de couverture`,
    objectif_unites: Math.round(p.stock * 0.4),
    marge_pct: 12,
  }))

  return {
    id: `camp-fourn-${promo.fournisseur_id}-${now.getTime()}`,
    source_combo_id: `promo-fourn-${promo.fournisseur_id}`,
    nom: `Écoulement surstock — ${promo.fournisseur_nom}`,
    objectif: `Écouler ${promo.produits.length} référence${promo.produits.length > 1 ? 's' : ''} en surstock et déclencher la remise volume de ${promo.remise_pct} % sur le réassort`,
    but_campagne: `Libérer ${formatFcfaLocal(promo.volume_a_ecouler)} de capital immobilisé chez ${promo.fournisseur_nom}. `
      + `${promo.produits.length} référence${promo.produits.length > 1 ? 's' : ''} dorment avec plus de 45 j de couverture. `
      + `Écouler ce stock permet de repasser commande au-delà du franco de ${formatFcfaLocal(promo.franco)} et de capter ${promo.remise_pct} % de remise (~${formatFcfaLocal(promo.economie_achat)} d'économie d'achat).`,
    offre: produitPrincipal
      ? `Remise détaillant sur ${produitPrincipal.nom.split(' ').slice(0, 3).join(' ')} — déstockage volume`
      : 'Déstockage volume',
    produits_detail,
    canal: 'WHATSAPP',
    statut: 'PLANIFIEE',
    zone: 'Grand Lomé + réseau',
    segment: 'PDV actifs — sensibles au prix volume',
    produits_cibles: promo.produits.map(p => p.nom),
    date_debut: dateDebut,
    date_fin: fin.toISOString().slice(0, 10),
    cibles,
    contactes: 0,
    ouverts: 0,
    repondus: 0,
    convertis: 0,
    ca_genere: 0,
    cout_campagne: 0,
    marge_generee: 0,
    budget_max: budget,
    commercial_assigne: 'Mawuena Agbodjan',
    synthese_ia: promo.argumentaire,
    recommandation_ia: `Campagne générée depuis l'opportunité promo fournisseur ${promo.fournisseur_nom}. `
      + `Écouler le surstock d'abord, puis passer le réassort au-delà du franco pour capter la remise ${promo.remise_pct} %.`,
    alerte: promo.produits.some(p => p.couverture_jours > 90)
      ? 'Au moins une référence dépasse 90 j de couverture — prioriser son écoulement avant tout réassort.'
      : undefined,
  }
}

function formatFcfaLocal(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M`
  if (v >= 1_000) return `${Math.round(v / 1_000)} K`
  return String(v)
}

export function upsertQueueEntry(
  queue: ComboQueueEntry[],
  comboId: string,
  patch: Partial<ComboQueueEntry>,
): ComboQueueEntry[] {
  const idx = queue.findIndex(e => e.comboId === comboId)
  if (idx >= 0) {
    const next = [...queue]
    next[idx] = { ...next[idx], ...patch, comboId }
    return next
  }
  return [...queue, { comboId, statut: 'EN_ATTENTE_DG', ...patch }]
}
