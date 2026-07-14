import type { EFactureMeta, EFactureStatut, Facture } from '@/types'
import { REGISTRE_FACTURES } from '@/lib/registries/factures-registry'

/**
 * E-facturation (spec V2 §4.2) — file de transmission vers la plateforme fiscale,
 * certification, rejets à corriger, archive légale (conservation 10 ans).
 *
 * Le statut est **dérivé de l'état de la facture** : une facture brouillon n'est pas
 * transmissible, une facture ancienne est déjà certifiée, une facture récente est en file.
 */

export const PLATEFORME = 'OTR_TOGO' as const

/** Empreinte d'intégrité du document — stable pour un même numéro de facture. */
function hashDocument(numero: string, montant: number): string {
  const base = `${numero}|${montant}|${PLATEFORME}`
  let h = 0
  for (let i = 0; i < base.length; i++) {
    h = (h * 31 + base.charCodeAt(i)) >>> 0
  }
  return h.toString(16).padStart(8, '0').toUpperCase().repeat(4).slice(0, 32)
}

/** Contenu du QR imprimé sur la facture — il doit permettre de retrouver la pièce. */
function qrPayload(f: Facture, certification: string): string {
  return [
    `OTR:${certification}`,
    `FAC:${f.numero}`,
    `TTC:${f.montant}`,
    `DATE:${f.date_emission ?? f.echeance}`,
  ].join(';')
}

/** Les rejets ont une cause : on la nomme, elle est corrigeable. */
const MOTIFS_REJET: Record<string, string> = {
  'FAC-2026-8821': 'Numéro d\'identification fiscale du client absent — le champ NIF est vide sur la fiche Kiosque Port.',
  'FAC-2026-8830': 'Montant TVA incohérent : 18 % attendus, 17,4 % déclarés après remise ligne non répercutée sur la TVA.',
  'FAC-2026-8825': 'Référence produit inconnue de la nomenclature fiscale sur 2 lignes — code douanier à renseigner.',
}

function statutPour(f: Facture, index: number): EFactureStatut {
  if (f.statut === 'BROUILLON') return 'NON_TRANSMISE'
  if (MOTIFS_REJET[f.numero]) return 'REJETEE'
  // Les factures anciennes sont revenues certifiées ; les plus récentes sont encore en file.
  const jours = f.jours_retard > 0 ? f.jours_retard : index
  if (jours >= 10) return 'CERTIFIEE'
  if (jours >= 3) return 'TRANSMISE'
  return 'EN_ATTENTE'
}

export function buildEFactureMeta(f: Facture, index = 0): EFactureMeta {
  const statut = statutPour(f, index)
  const certification = `OTR-2026-${f.numero.replace(/\D/g, '')}`

  const meta: EFactureMeta = {
    facture_id: f.id,
    statut,
    plateforme: PLATEFORME,
    tentatives: statut === 'REJETEE' ? 2 : statut === 'NON_TRANSMISE' ? 0 : 1,
    hash_document: hashDocument(f.numero, f.montant),
  }

  if (statut === 'REJETEE') {
    return { ...meta, motif_rejet: MOTIFS_REJET[f.numero], date_transmission: f.date_emission }
  }

  if (statut === 'TRANSMISE' || statut === 'CERTIFIEE') {
    return {
      ...meta,
      numero_certification: certification,
      date_transmission: f.date_emission,
      qr_code_payload: qrPayload(f, certification),
      archive_legale_url: statut === 'CERTIFIEE'
        ? `archive://otr/2026/${f.numero}.xml`
        : undefined,
    }
  }

  return meta
}

export interface FactureEFacture extends Facture {
  efacture: EFactureMeta
}

/** File de transmission complète — chaque facture porte son état e-facture. */
export function buildFileEFacture(): FactureEFacture[] {
  return REGISTRE_FACTURES.map((f, i) => ({
    ...f,
    type_document: 'FACTURE' as const,
    efacture: buildEFactureMeta(f, i),
  }))
}

export interface SyntheseEFacture {
  total: number
  certifiees: number
  transmises: number
  en_attente: number
  rejetees: number
  non_transmises: number
  taux_certification_pct: number
  montant_non_certifie: number
}

export function buildSyntheseEFacture(file: FactureEFacture[]): SyntheseEFacture {
  const compte = (s: EFactureStatut) => file.filter(f => f.efacture.statut === s).length
  const certifiees = compte('CERTIFIEE')
  const transmissibles = file.filter(f => f.efacture.statut !== 'NON_TRANSMISE').length

  return {
    total: file.length,
    certifiees,
    transmises: compte('TRANSMISE'),
    en_attente: compte('EN_ATTENTE'),
    rejetees: compte('REJETEE'),
    non_transmises: compte('NON_TRANSMISE'),
    taux_certification_pct: transmissibles > 0 ? Math.round((certifiees / transmissibles) * 100) : 0,
    montant_non_certifie: file
      .filter(f => f.efacture.statut !== 'CERTIFIEE')
      .reduce((s, f) => s + f.montant, 0),
  }
}

export const STATUT_EFACTURE_STYLE: Record<EFactureStatut, { label: string; className: string; pastille: string }> = {
  NON_TRANSMISE: { label: 'Non transmise', className: 'bg-slate-100 text-slate-600', pastille: 'bg-slate-400' },
  EN_ATTENTE:    { label: 'En file',       className: 'bg-sky-100 text-sky-700',     pastille: 'bg-sky-500' },
  TRANSMISE:     { label: 'Transmise',     className: 'bg-indigo-100 text-indigo-700', pastille: 'bg-indigo-500' },
  CERTIFIEE:     { label: 'Certifiée',     className: 'bg-emerald-100 text-emerald-700', pastille: 'bg-emerald-500' },
  REJETEE:       { label: 'Rejetée',       className: 'bg-red-100 text-red-700',     pastille: 'bg-red-500' },
}

/** Avoirs — notes de crédit liées aux retours (onglet DAF / comptable). */
export interface Avoir {
  id: string
  numero: string
  facture_ref: string
  pdv_nom: string
  motif: string
  montant_ht: number
  montant_ttc: number
  date: string
  statut: 'EMIS' | 'IMPUTE' | 'REMBOURSE'
}

export const REGISTRE_AVOIRS: Avoir[] = [
  {
    id: 'av-1', numero: 'AV-2026-0012', facture_ref: 'FAC-2026-8830', pdv_nom: 'Dépôt Agoè Plage',
    motif: 'Retour 12 cartons détergent — emballages endommagés au transport',
    montant_ht: 152_542, montant_ttc: 180_000, date: '2026-06-08', statut: 'IMPUTE',
  },
  {
    id: 'av-2', numero: 'AV-2026-0011', facture_ref: 'FAC-2026-8825', pdv_nom: 'Épicerie Mama T.',
    motif: 'Erreur de facturation — remise grossiste 5 % non appliquée sur 3 lignes',
    montant_ht: 118_644, montant_ttc: 140_000, date: '2026-06-04', statut: 'IMPUTE',
  },
  {
    id: 'av-3', numero: 'AV-2026-0010', facture_ref: 'FAC-2026-8810', pdv_nom: 'Kiosque Port',
    motif: 'Litige qualité — 8 bidons huile non conformes, retour accepté',
    montant_ht: 288_136, montant_ttc: 340_000, date: '2026-05-29', statut: 'EMIS',
  },
]
