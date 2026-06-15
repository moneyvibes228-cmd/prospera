// Données enrichies dossier — transactions, localisation, cautions, historique prêts

import { DOSSIERS_ANALYSE_CC, type RapportCC } from '@/lib/mockMicrofinance'
import {
  buildEnrichissementFromRapport,
  mergeEnrichissement,
} from '@/lib/dossier-enrichissement-builder'

export type SentimentDossier = 'POSITIF' | 'NEUTRE' | 'NEGATIF' | 'CRITIQUE'

export interface LocalisationPoint {
  type: 'DOMICILE' | 'TRAVAIL'
  adresse: string
  quartier: string
  verifie_terrain: boolean
  distance_agence_km?: number
}

export interface TransactionCompte {
  date: string
  type: 'DEPOT' | 'RETRAIT' | 'VIREMENT' | 'FRAIS' | 'MOMO'
  montant: number
  libelle: string
  solde_apres: number
  flag?: 'INHABITUEL' | 'SUSPECT' | 'NORMAL'
}

export interface Cautionnaire {
  nom: string
  lien: string
  telephone: string
  revenus_declares: number
  engagement_fcfa: number
  solvable: boolean
}

export interface Garantie {
  type: string
  description: string
  valeur_estimee: number
  couverture_pct: number
}

export interface PretAnterieur {
  reference: string
  montant: number
  date_octroi: string
  date_cloture: string
  duree_remboursement_j: number
  par_atteint: boolean
  retards: { jours: number; motif: string }[]
  anomalies: string[]
}

export interface ContactUrgenceEnrichi {
  prenom: string
  nom: string
  lien: string
  telephone: string
}

export interface IdentiteClientEnrichi {
  genre?: 'M' | 'F'
  date_naissance?: string
  situation_matrimoniale?: string
  personnes_charge?: number
  cni?: string
  whatsapp?: string
  telephone_secondaire?: string
  client_depuis?: string
  contact_urgence: ContactUrgenceEnrichi
}

export interface EnrichissementDossier {
  agence: string
  agent_terrain: string
  etoiles: 1 | 2 | 3
  resume: string
  sentiment: SentimentDossier
  avis_cc?: { decision: string; commentaire: string; date: string; charge: string }
  identite_client?: IdentiteClientEnrichi
  localisations: LocalisationPoint[]
  transactions: TransactionCompte[]
  cautionnaires: Cautionnaire[]
  garanties: Garantie[]
  prets_anterieurs: PretAnterieur[]
  analyse_prospera_ia_etendue: {
    transactions: string
    comportement: string
    macro_economie: string
    saison: string
    recouvrement: string
    saturation_secteur: string
  }
}

/** Affinements manuels (textes IA, adresses terrain vérifiées) — le reste est généré */
const OVERRIDES: Record<string, Partial<EnrichissementDossier>> = {
  'DOS-2026-0241': {
    agence: 'Lomé Centre',
    agent_terrain: 'Mensah Kodjo',
    resume: 'Commerçante expérimentée, taux effort confortable. Cautions à 70%.',
    localisations: [
      { type: 'DOMICILE', adresse: 'Rue du Commerce, Tokoin', quartier: 'Tokoin', verifie_terrain: true, distance_agence_km: 2.1 },
      { type: 'TRAVAIL', adresse: 'Étal N°47, Marché de Lomé', quartier: 'Lomé Centre', verifie_terrain: true, distance_agence_km: 0.8 },
    ],
    analyse_prospera_ia_etendue: {
      transactions: 'Flux cohérent commerce. 1 retrait inhabituel (200k) lié à achat stock — facture vérifiée.',
      comportement: 'Dépôts réguliers lun-sam. Cliente présente à chaque échéance.',
      macro_economie: 'Inflation alimentaire +4,2% · pouvoir d\'achat stable marché Lomé.',
      saison: 'Mai-juin pic mangues · juillet-août basse saison.',
      recouvrement: 'Aucun impayé actif · 1 retard <7j pardonné en 2024.',
      saturation_secteur: 'Commerce fruits = 37,7% portefeuille Lomé Centre — seuil 35% dépassé.',
    },
  },
  'DOS-2026-0250': {
    agence: 'Lomé Centre',
    agent_terrain: 'Yawo Adjavon',
    resume: 'Importateur PME — bon CA mais endettement externe signalé.',
    localisations: [
      { type: 'DOMICILE', adresse: 'Bd du 13 Janvier, Appart 4B', quartier: 'Adidogomé', verifie_terrain: true, distance_agence_km: 4.5 },
      { type: 'TRAVAIL', adresse: 'Entrepôt Zone portuaire, Rue des Douanes', quartier: 'Lomé Port', verifie_terrain: true, distance_agence_km: 3.2 },
    ],
    analyse_prospera_ia_etendue: {
      transactions: 'Dépôt 1,2M 48h avant analyse — INHABITUEL mais justifié par proforma import.',
      comportement: 'Client actif 3 ans · 2 retards douane sur crédit en cours.',
      macro_economie: 'Coûts import +8% YoY · marges compressées.',
      saison: 'Pic rentrée scolaire et fin d\'année.',
      recouvrement: '1 retard J+12 résolu · surveillance active.',
      saturation_secteur: 'Import/textile = 22% portefeuille — acceptable.',
    },
  },
  'DOS-2026-0228': {
    agence: 'Hédzranawoé',
    agent_terrain: 'Elom Komlavi',
    identite_client: {
      genre: 'M',
      date_naissance: '14/03/1975',
      situation_matrimoniale: 'Marié',
      personnes_charge: 5,
      cni: 'N° 9876 5432 0012',
      whatsapp: '+228 90 56 78 90',
      telephone_secondaire: '+228 91 22 33 44',
      client_depuis: '2014',
      contact_urgence: { prenom: 'Abla', nom: 'Mensah', lien: 'Épouse', telephone: '+228 91 44 55 66' },
    },
    localisations: [
      { type: 'DOMICILE', adresse: 'Quartier Agbodrafo, Maison familiale', quartier: 'Hédzranawoé', verifie_terrain: true, distance_agence_km: 1.2 },
      { type: 'TRAVAIL', adresse: 'Parcelle 1.2 ha — Route de Kpalimé km 4', quartier: 'Hédzranawoé', verifie_terrain: true, distance_agence_km: 4.0 },
    ],
    transactions: [
      { date: '20/05', type: 'DEPOT', montant: 180_000, libelle: 'Vente récolte tomates — marché Lomé', solde_apres: 1_065_000, flag: 'NORMAL' },
      { date: '15/05', type: 'RETRAIT', montant: 95_000, libelle: 'Engrais NPK + intrants', solde_apres: 885_000, flag: 'NORMAL' },
      { date: '01/05', type: 'DEPOT', montant: 320_000, libelle: 'Vente gros marché Adidogomé', solde_apres: 980_000, flag: 'NORMAL' },
      { date: '22/04', type: 'DEPOT', montant: 195_000, libelle: 'Règlement coopérative agricole', solde_apres: 660_000, flag: 'NORMAL' },
      { date: '08/04', type: 'DEPOT', montant: 265_000, libelle: 'Récolte tomates intermédiaire', solde_apres: 465_000, flag: 'NORMAL' },
      { date: '24/03', type: 'RETRAIT', montant: 40_000, libelle: 'Semences + main d\'œuvre', solde_apres: 200_000, flag: 'NORMAL' },
      { date: '10/03', type: 'DEPOT', montant: 185_000, libelle: 'Vente piment sec — saison sèche', solde_apres: 240_000, flag: 'NORMAL' },
    ],
    analyse_prospera_ia_etendue: {
      transactions: '7 mouvements / 3 mois · 71% dépôts · solde 240k → 1,065M FCFA.',
      comportement: 'Client fidèle 12 ans · ponctualité excellente.',
      macro_economie: 'Prix tomates +12% vs N-1.',
      saison: 'Campagne saison sèche — timing optimal.',
      recouvrement: 'Historique impeccable · 1 retard météo 2024.',
      saturation_secteur: 'Agriculture Hédzranawoé = 13,6% — normal.',
    },
  },
  'DOS-2026-0235': {
    agence: 'Adidogomé',
    agent_terrain: 'Sena Dossou',
    localisations: [
      { type: 'DOMICILE', adresse: 'Rue des Artisans, Lot 12', quartier: 'Adidogomé', verifie_terrain: true, distance_agence_km: 0.5 },
      { type: 'TRAVAIL', adresse: 'Atelier Mawuena Couture', quartier: 'Adidogomé', verifie_terrain: true, distance_agence_km: 0.5 },
    ],
    analyse_prospera_ia_etendue: {
      transactions: 'Flux réguliers · épargne +18% sur 6 mois.',
      comportement: 'Cliente modèle · 2 employés stables.',
      macro_economie: 'Artisanat stable · demande uniformes Q3.',
      saison: 'Pic rentrée scolaire.',
      recouvrement: '0 impayé sur 4 crédits.',
      saturation_secteur: 'Artisanat Adidogomé = 18% — sous seuil.',
    },
  },
  'DOS-2026-0243': {
    agence: 'Lomé Centre',
    agent_terrain: 'Yawo Adjavon',
    resume: 'Groupe solidaire marché — dossier en instruction CC.',
  },
  'DOS-2026-0246': {
    agence: 'Lomé Centre',
    agent_terrain: 'Yawo Adjavon',
    resume: 'Salon coiffure — dossier soumis, pièces en vérification.',
    analyse_prospera_ia_etendue: {
      transactions: 'Dépôt 200k suspect 48h avant analyse — gonflement artificiel probable.',
      comportement: 'Profil jeune · duplication prématurée salon.',
      macro_economie: 'Secteur coiffure compétitif Lomé.',
      saison: 'Pic fêtes · sinon stable.',
      recouvrement: 'PD 51% · aucun historique IMF.',
      saturation_secteur: 'Services beauté — saturation modérée.',
    },
  },
  'DOS-2026-0247': {
    agence: 'Lomé Centre',
    agent_terrain: 'Yawo Adjavon',
    resume: 'Cosmétiques — avis CC favorable, prêt pour transmission ROC.',
  },
  'DOS-2026-0248': {
    agence: 'Lomé Centre',
    agent_terrain: 'Kofi Amavi',
    resume: 'Salon beauté — dossier complet, prêt pour analyse CC.',
  },
  'DOS-2026-0238': {
    agence: 'Bè Kpota',
    agent_terrain: 'Kossi Adjavon',
    analyse_prospera_ia_etendue: {
      transactions: 'Revenus MoMo volatils · retraits carburant fréquents.',
      comportement: 'Nouveau client IMF · sans caution solidaire.',
      macro_economie: 'Demande transport stable hors pluies.',
      saison: 'Juin-sept : -40% activité pluies.',
      recouvrement: 'Pas d\'historique · profil risqué.',
      saturation_secteur: 'Transport zem — 3 dossiers comparables.',
    },
  },
}

export function getEnrichissement(dossierId: string, rapport?: RapportCC): EnrichissementDossier {
  const d = rapport
    ?? DOSSIERS_ANALYSE_CC.find(x => x.dossier_id === dossierId || x.reference_dossier === dossierId)

  if (!d) {
    return {
      agence: '—', agent_terrain: '—', etoiles: 2, resume: 'Dossier en cours', sentiment: 'NEUTRE',
      localisations: [], transactions: [], cautionnaires: [], garanties: [], prets_anterieurs: [],
      analyse_prospera_ia_etendue: {
        transactions: '', comportement: '', macro_economie: '', saison: '', recouvrement: '', saturation_secteur: '',
      },
    }
  }

  const generated = buildEnrichissementFromRapport(d)
  return mergeEnrichissement(generated, OVERRIDES[dossierId])
}

export function getSentimentStyle(s: SentimentDossier) {
  const map = {
    POSITIF: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Positif', ring: 'ring-emerald-200' },
    NEUTRE:  { bg: 'bg-slate-100',   text: 'text-slate-700',   label: 'Neutre', ring: 'ring-slate-200' },
    NEGATIF: { bg: 'bg-orange-100',  text: 'text-orange-800', label: 'Vigilance', ring: 'ring-orange-200' },
    CRITIQUE:{ bg: 'bg-red-100',     text: 'text-red-800',    label: 'Critique', ring: 'ring-red-200' },
  }
  return map[s]
}

export { computeTxStats, couvertureGaranties } from '@/lib/dossier-enrichissement-builder'
