/** Hub KYC — vérification identité, pièces jointes, conformité LBC/FT */

export type StatutKyc = 'COMPLET' | 'INCOMPLET' | 'EXPIRE' | 'EN_VERIFICATION' | 'REJETE'
export type TypeDocument = 'CNI' | 'PASSEPORT' | 'ATTESTATION_DOMICILE' | 'PHOTO' | 'CONTRAT' | 'JUSTIFICATIF_REVENU'

export interface DocumentKyc {
  id: string
  type: TypeDocument
  nom_fichier: string
  date_upload: string
  date_expiration?: string
  statut: 'VALIDE' | 'EN_ATTENTE' | 'REJETE' | 'EXPIRE'
  verifie_par?: string
  score_ocr_ia?: number
}

export interface DossierKyc {
  id: string
  client: string
  client_id: string
  niveau: 'SIMPLIFIE' | 'STANDARD' | 'RENFORCE'
  statut: StatutKyc
  score_conformite_ia: number
  date_derniere_maj: string
  agence: string
  alertes: string[]
  documents: DocumentKyc[]
}

export interface KycHub {
  synthese_ia: string
  kpis: {
    dossiers_complets: number
    dossiers_incomplets: number
    documents_expires: number
    en_verification: number
    taux_conformite_pct: number
  }
  dossiers: DossierKyc[]
  file_attente: Array<{ priorite: number; dossier_id: string; client: string; motif: string }>
}

export const KYC_HUB: KycHub = {
  synthese_ia:
    '14 dossiers incomplets bloquent décaissement (6,2 M FCFA). 8 CNI expirent sous 30 jours — relance automatique programmée. Anomalie OCR : 2 photos floues (DC-2918, CL-4421). Niveau renforcé requis pour 3 clients > 2 M FCFA encours.',
  kpis: {
    dossiers_complets: 2847,
    dossiers_incomplets: 14,
    documents_expires: 8,
    en_verification: 6,
    taux_conformite_pct: 94,
  },
  dossiers: [
    {
      id: 'KYC-8842',
      client: 'Yawo Adjavon',
      client_id: 'CL-8842',
      niveau: 'STANDARD',
      statut: 'INCOMPLET',
      score_conformite_ia: 62,
      date_derniere_maj: '27/05/2026',
      agence: 'Tokoin',
      alertes: ['Justificatif revenu manquant', 'Décaissement bloqué DC-2918'],
      documents: [
        { id: 'DOC1', type: 'CNI', nom_fichier: 'cni_adjavon.pdf', date_upload: '20/05/2026', date_expiration: '15/08/2028', statut: 'VALIDE', verifie_par: 'Elom Adjavon', score_ocr_ia: 96 },
        { id: 'DOC2', type: 'PHOTO', nom_fichier: 'photo_adjavon.jpg', date_upload: '20/05/2026', statut: 'REJETE', score_ocr_ia: 42 },
        { id: 'DOC3', type: 'JUSTIFICATIF_REVENU', nom_fichier: '', date_upload: '', statut: 'EN_ATTENTE' },
      ],
    },
    {
      id: 'KYC-9912',
      client: 'Afi Togbedji',
      client_id: 'CL-9912',
      niveau: 'RENFORCE',
      statut: 'COMPLET',
      score_conformite_ia: 94,
      date_derniere_maj: '15/05/2026',
      agence: 'Tokoin',
      alertes: [],
      documents: [
        { id: 'DOC4', type: 'CNI', nom_fichier: 'cni_togbedji.pdf', date_upload: '10/01/2026', date_expiration: '10/01/2031', statut: 'VALIDE', verifie_par: 'Séna Fiagbé', score_ocr_ia: 98 },
        { id: 'DOC5', type: 'ATTESTATION_DOMICILE', nom_fichier: 'domicile_togbedji.pdf', date_upload: '10/01/2026', statut: 'VALIDE', score_ocr_ia: 91 },
        { id: 'DOC6', type: 'CONTRAT', nom_fichier: 'contrat_dc2912.pdf', date_upload: '15/05/2026', statut: 'VALIDE', verifie_par: 'Elom Adjavon' },
      ],
    },
  ],
  file_attente: [
    { priorite: 1, dossier_id: 'KYC-8842', client: 'Yawo Adjavon', motif: 'Décaissement bloqué — photo à refaire' },
    { priorite: 2, dossier_id: 'KYC-4421', client: 'Enyonam Kpade', motif: 'CNI expire J+18' },
    { priorite: 3, dossier_id: 'KYC-7721', client: 'Komi Akléssoé', motif: 'Niveau renforcé — justificatifs' },
  ],
}

export function getKycHub(): KycHub {
  return KYC_HUB
}
