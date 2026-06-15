/** Génération conformité BCEAO — alignée portefeuille crédit réseau Prospera */

import { AGENCES, RESEAU_CONSOLIDE } from '@/lib/agences'
import { getAllPretsActifs } from '@/lib/core-banking-registry'
import { buildConformiteBceao } from '@/lib/mock-conformite-bceao-builder'
import type {
  ClasseBceao,
  ClassificationClient,
  ConformiteLbcFt,
  ExportRegulateur,
  ProvisionAgence,
} from '@/lib/conformite-hub'

const PROVISION_PCT: Record<ClasseBceao, number> = {
  NORMAL: 1,
  SOUS_SURVEILLANCE: 10,
  DOUTEUX: 50,
  COMPROMISES: 80,
  CONTENTIEUX: 100,
}

const CLASSE_ORDER: ClasseBceao[] = [
  'NORMAL',
  'SOUS_SURVEILLANCE',
  'DOUTEUX',
  'COMPROMISES',
  'CONTENTIEUX',
]

function seeded(n: number, mod: number): number {
  return ((n * 9301 + 49297) % 233280) % mod
}

interface ClasseResult {
  classe: ClasseBceao
  jours: number
  motif: string
  precedente: ClasseBceao
}

function classeFromPret(
  ref: string,
  client: string,
  statut: string,
  joursRetard: number | undefined,
  idx: number,
): ClasseResult {
  if (ref === 'DC-2789' || client === 'Kwami Ekpé') {
    return {
      classe: 'COMPROMISES',
      jours: 45,
      motif: 'J+45 → COMPROMISES (BCEAO art. 42 — 3 impayés consécutifs)',
      precedente: 'DOUTEUX',
    }
  }
  if (ref === 'DC-2912' || client === 'Afi Togbedji') {
    return {
      classe: 'NORMAL',
      jours: 0,
      motif: 'Stable — historique MoMo excellent, aucun incident',
      precedente: 'NORMAL',
    }
  }
  if (client === 'Togbui Apedo') {
    return {
      classe: 'CONTENTIEUX',
      jours: 62,
      motif: 'Contentieux ouvert — provision intégrale (huissier mandaté)',
      precedente: 'COMPROMISES',
    }
  }

  const j = joursRetard ?? 0

  if (statut === 'DECAISSE' || (statut === 'EN_COURS' && j === 0)) {
    return {
      classe: 'NORMAL',
      jours: 0,
      motif: 'Performant — échéances à jour',
      precedente: 'NORMAL',
    }
  }

  if (statut === 'RESTRUCTURE') {
    const migrated = seeded(idx, 4) === 0
    return {
      classe: 'SOUS_SURVEILLANCE',
      jours: j || 28 + seeded(idx, 15),
      motif: 'Restructuration active — surveillance renforcée IA',
      precedente: migrated ? 'DOUTEUX' : 'SOUS_SURVEILLANCE',
    }
  }

  if (j >= 360 || (statut === 'IMPAYE' && j > 180)) {
    return {
      classe: 'CONTENTIEUX',
      jours: j,
      motif: `J+${j} — contentieux / créance irrécouvrable`,
      precedente: 'COMPROMISES',
    }
  }
  if (j >= 181) {
    return {
      classe: 'COMPROMISES',
      jours: j,
      motif: `J+${j} → COMPROMISES (provision 80 %)`,
      precedente: 'DOUTEUX',
    }
  }
  if (j >= 91) {
    return {
      classe: 'DOUTEUX',
      jours: j,
      motif: `J+${j} → DOUTEUX (provision 50 %)`,
      precedente: 'SOUS_SURVEILLANCE',
    }
  }
  if (j >= 31) {
    const migrated = seeded(idx, 3) === 0
    return {
      classe: 'SOUS_SURVEILLANCE',
      jours: j,
      motif: migrated
        ? `Migration NORMAL → SOUS_SURVEILLANCE (J+${j}, secteur Commerce)`
        : `J+${j} — sous surveillance renforcée`,
      precedente: migrated ? 'NORMAL' : 'SOUS_SURVEILLANCE',
    }
  }
  if (j >= 1) {
    return {
      classe: 'NORMAL',
      jours: j,
      motif: `J+${j} — maintien NORMAL (historique remboursement OK)`,
      precedente: 'NORMAL',
    }
  }

  return { classe: 'NORMAL', jours: 0, motif: 'Performant', precedente: 'NORMAL' }
}

function buildClassifications(): ClassificationClient[] {
  const prets = getAllPretsActifs()
  const extra: ClassificationClient[] = [
    {
      client_id: 'CL-4421',
      ref_pret: 'DC-2655',
      client: 'Togbui Apedo',
      agence: 'Bè Kpota',
      produit: 'Microcrédit',
      encours_fcfa: 240_000,
      jours_retard_max: 62,
      classe_calculee: 'CONTENTIEUX',
      classe_precedente: 'COMPROMISES',
      provision_pct: 100,
      provision_fcfa: 240_000,
      migration_ia: 'Contentieux ouvert — provision intégrale (huissier mandaté)',
      date_derniere_echeance: '27/03/2026',
    },
  ]

  const fromPrets = prets.map((p, i) => {
    const { classe, jours, motif, precedente } = classeFromPret(
      p.ref,
      p.client,
      p.statut,
      p.jours_retard,
      i,
    )
    const encours = p.solde_restant_fcfa
    const provisionPct = PROVISION_PCT[classe]
    return {
      client_id: `CL-${String(8800 + i).padStart(4, '0')}`,
      ref_pret: p.ref,
      client: p.client,
      agence: p.agence,
      produit: p.produit,
      encours_fcfa: encours,
      jours_retard_max: jours,
      classe_calculee: classe,
      classe_precedente: precedente,
      provision_pct: provisionPct,
      provision_fcfa: Math.round(encours * provisionPct / 100),
      migration_ia: motif,
      date_derniere_echeance: p.prochaine_echeance,
    }
  })

  const merged: ClassificationClient[] = [...fromPrets]
  if (!merged.some(c => c.client === 'Togbui Apedo')) {
    merged.push(extra[0])
  }

  return merged.sort((a, b) => {
    const order = { CONTENTIEUX: 0, COMPROMISES: 1, DOUTEUX: 2, SOUS_SURVEILLANCE: 3, NORMAL: 4 }
    const diff = order[a.classe_calculee] - order[b.classe_calculee]
    if (diff !== 0) return diff
    return b.jours_retard_max - a.jours_retard_max
  })
}

function buildRepartition(classes: ClassificationClient[]) {
  return CLASSE_ORDER.map(classe => {
    const items = classes.filter(c => c.classe_calculee === classe)
    return {
      classe,
      count: items.length,
      encours_fcfa: items.reduce((s, c) => s + c.encours_fcfa, 0),
      provision_fcfa: items.reduce((s, c) => s + c.provision_fcfa, 0),
    }
  })
}

function buildProvisionsAgences(classes: ClassificationClient[]): ProvisionAgence[] {
  return AGENCES.map(a => {
    const items = classes.filter(c => c.agence === a.nom_court)
    const encours = items.reduce((s, c) => s + c.encours_fcfa, 0)
    const provision = items.reduce((s, c) => s + c.provision_fcfa, 0)
    return {
      agence: a.nom_court,
      agence_id: a.id,
      encours_fcfa: encours || a.encours_fcfa,
      provision_totale_fcfa: provision,
      taux_provision_pct: encours > 0 ? Number(((provision / encours) * 100).toFixed(1)) : 0,
      par_30_pct: a.par_courant,
      statut_bceao: a.par_courant > 10 ? 'NON_CONFORME' as const : a.par_courant > 8 ? 'ATTENTION' as const : 'CONFORME' as const,
      dossiers_a_risque: items.filter(c => c.classe_calculee !== 'NORMAL').length,
    }
  })
}

const EXPORTS: ExportRegulateur[] = [
  { id: 'EXP-1', type: 'BCEAO_MENSUEL', periode: 'Mai 2026', date_generation: '05/05/2026', date_echeance: '02/06/2026', statut: 'ENVOYE', taille_ko: 2100, conformite_ia_pct: 97, description: 'Situation mensuelle des SFD — encours, PAR, provisions' },
  { id: 'EXP-2', type: 'BCEAO_MENSUEL', periode: 'Juin 2026', date_generation: '—', date_echeance: '02/07/2026', statut: 'GENERE', taille_ko: 0, conformite_ia_pct: 0, description: 'À générer avant le 02/07 — J-5 : 27/06' },
  { id: 'EXP-3', type: 'PAR_TRIMESTRIEL', periode: 'T2 2026', date_generation: '15/05/2026', date_echeance: '30/06/2026', statut: 'VALIDE', taille_ko: 1240, conformite_ia_pct: 98, description: 'PAR 30/60/90 consolidé — rapport trimestriel BCEAO' },
  { id: 'EXP-4', type: 'SITUATION_LIQUIDITE', periode: 'Hebdo S22', date_generation: '27/05/2026', date_echeance: '28/05/2026', statut: 'VALIDE', taille_ko: 420, conformite_ia_pct: 100, description: 'Ratio liquidité à court terme — seuil réglementaire 100 %' },
  { id: 'EXP-5', type: 'LBC_FT', periode: 'Mai 2026', date_generation: '26/05/2026', date_echeance: '05/06/2026', statut: 'ENVOYE', taille_ko: 890, conformite_ia_pct: 96, description: 'Déclaration LBC/FT — opérations suspectes et KYC' },
  { id: 'EXP-6', type: 'BCEAO_MENSUEL', periode: 'Avril 2026', date_generation: '03/04/2026', date_echeance: '02/05/2026', statut: 'VALIDE', taille_ko: 2050, conformite_ia_pct: 99, description: 'Archivé — conforme sans réserve' },
]

function buildLbcFt(): ConformiteLbcFt {
  return {
    synthese_ia:
      'Conformité LBC/FT globalement satisfaisante (KYC 94,2 %). 1 déclaration de soupçon (DS) transmise au CENTIF le 22/05 (Togbui Apedo — flux atypiques). 2 opérations en analyse dont retrait épargne suspect Adidogomé (850 k). Compte EP-4421 gelé. 14 dossiers KYC incomplets bloquent 6,2 M FCFA de décaissements. Formation LBC/FT : 100 % agents. Prochain rapport mensuel CENTIF : 05/06/2026.',
    referent_reglementaire: 'Instruction BCEAO n°008-05-2012 · Loi n°2018-006 (LBC/FT Togo) · CENTIF-Togo',
    kpis: {
      taux_kyc_pct: 94.2,
      dossiers_incomplets: 14,
      operations_suspectes_mois: 5,
      ds_transmises: 1,
      ds_en_analyse: 2,
      comptes_geles: 2,
      ppe_identifies: 3,
      agents_formes_pct: 100,
      dernier_rapport_centif: '26/05/2026 — Mai 2026 (envoyé)',
      prochain_rapport_centif: '05/06/2026',
    },
    operations_suspectes: [
      { id: 'LBC-001', date: '27/05/2026', heure: '14:22', client: 'Yawo Adjavon', client_id: 'CL-8842', agence: 'Adidogomé', montant_fcfa: 850_000, type_operation: 'Retrait épargne massif J+1', motif_alerte: 'Dépôt 800 k hier + retrait 850 k aujourd\'hui — compte ouvert < 30 j', statut: 'GEL_FONDS', niveau_risque: 'CRITIQUE', detecte_par: 'Moteur IA Prospera' },
      { id: 'LBC-002', date: '22/05/2026', heure: '09:15', client: 'Togbui Apedo', client_id: 'CL-1003', agence: 'Bè Kpota', montant_fcfa: 1_200_000, type_operation: 'Fractionnement remboursements', motif_alerte: '3 paiements < 50 k même jour — pattern structuration', statut: 'DS_TRANSMISE', niveau_risque: 'ELEVE', reference_centif: 'DS-TG-2026-0142', detecte_par: 'Conformité + Edem Kpélim' },
      { id: 'LBC-003', date: '20/05/2026', heure: '16:40', client: 'Inconnu', client_id: '—', agence: 'Lomé Centre', montant_fcfa: 2_400_000, type_operation: 'Tentative décaissement', motif_alerte: 'Numéro Mixx By Yas blacklisté CENTIF — refus automatique', statut: 'CLASSEE', niveau_risque: 'ELEVE', detecte_par: 'Système paiement' },
      { id: 'LBC-004', date: '18/05/2026', heure: '11:05', client: 'Mensah Kodjo', client_id: 'CL-3310', agence: 'Bè Kpota', montant_fcfa: 450_000, type_operation: 'Virement tiers répétés', motif_alerte: '5 virements vers même bénéficiaire non client — 7 jours', statut: 'EN_ANALYSE', niveau_risque: 'MOYEN', detecte_par: 'Audit trail' },
      { id: 'LBC-005', date: '12/05/2026', heure: '08:30', client: 'Coop. Tabligbo', client_id: 'CL-4421', agence: 'Kpalimé', montant_fcfa: 3_200_000, type_operation: 'Décaissement groupe', motif_alerte: 'Bénéficiaire final ≠ membres déclarés — due diligence renforcée', statut: 'EN_ANALYSE', niveau_risque: 'MOYEN', detecte_par: 'Charge crédit Kpalimé' },
    ],
    declarations_centif: [
      { id: 'CENTIF-DS-0142', type: 'DS', date: '22/05/2026', client: 'Togbui Apedo', montant_fcfa: 1_200_000, statut: 'TRANSMISE', reference: 'DS-TG-2026-0142', delai_reponse: '60 jours', description: 'Fractionnement paiements + signaux fraude pré-RDV' },
      { id: 'CENTIF-RM-0526', type: 'RAPPORT_MENSUEL', date: '26/05/2026', statut: 'TRANSMISE', reference: 'RM-PROSPERA-052026', description: 'Rapport mensuel LBC/FT — 5 alertes, 1 DS, 2 gels' },
      { id: 'CENTIF-DA-0518', type: 'DA', date: '18/05/2026', statut: 'NEANT', reference: 'DA-052026-NEANT', description: 'Déclaration automatique — aucune opération > seuil 5 M FCFA' },
      { id: 'CENTIF-GEL-001', type: 'GEL_AVOIRS', date: '27/05/2026', client: 'Yawo Adjavon', montant_fcfa: 850_000, statut: 'ACCUSEE', reference: 'GEL-INT-2026-008', description: 'Gel interne en attente DS — compte EP-8842' },
    ],
    controles: [
      { libelle: 'Listes sanctions (ONU / OFAC / UE)', statut: 'CONFORME', valeur: '0 correspondance', seuil: '0 alerte', derniere_verification: '28/05/2026 06:00' },
      { libelle: 'Screening PPE (Personnes politiquement exposées)', statut: 'CONFORME', valeur: '3 PPE identifiés — DD renforcée active', seuil: '100 % revus', derniere_verification: '28/05/2026' },
      { libelle: 'Taux complétude KYC réseau', statut: 'ATTENTION', valeur: '94,2 %', seuil: '≥ 95 %', derniere_verification: '28/05/2026' },
      { libelle: 'Formation LBC/FT agents (12 mois)', statut: 'CONFORME', valeur: '12/12 agents (100 %)', seuil: '100 %', derniere_verification: '15/01/2026' },
      { libelle: 'Conservation pièces KYC', statut: 'CONFORME', valeur: '5 ans minimum respecté', seuil: 'Loi 2018-006', derniere_verification: '28/05/2026' },
      { libelle: 'Délai transmission DS au CENTIF', statut: 'CONFORME', valeur: 'DS-0142 transmise J+1', seuil: 'Sans retard', derniere_verification: '22/05/2026' },
      { libelle: 'Registre des opérations suspectes', statut: 'CONFORME', valeur: '5 entrées mai 2026', seuil: 'Complet', derniere_verification: '28/05/2026' },
      { libelle: 'Déclaration mensuelle CENTIF', statut: 'CONFORME', valeur: 'Mai 2026 envoyé 26/05', seuil: 'Avant le 5 du mois', derniere_verification: '26/05/2026' },
    ],
    par_agence: AGENCES.map(a => ({
      agence: a.nom_court,
      agence_id: a.id,
      kyc_complet_pct: a.nom_court === 'Bè Kpota' ? 89.5 : a.nom_court === 'Adidogomé' ? 91.2 : 95 + seeded(a.id.charCodeAt(0), 4),
      dossiers_incomplets: a.nom_court === 'Bè Kpota' ? 5 : a.nom_court === 'Adidogomé' ? 4 : seeded(a.id.charCodeAt(0), 3),
      alertes_ouvertes: a.nom_court === 'Bè Kpota' ? 3 : a.nom_court === 'Adidogomé' ? 2 : seeded(a.id.charCodeAt(0), 2),
      ds_mois: a.nom_court === 'Bè Kpota' ? 1 : 0,
      formations_a_jour_pct: 100,
    })),
    dossiers_kyc_prioritaires: [
      { client_id: 'CL-8842', client: 'Yawo Adjavon', agence: 'Adidogomé', niveau: 'RENFORCE', motif: 'Compte gelé — retrait suspect 850 k · KYC niveau 1 insuffisant', montant_bloque_fcfa: 850_000, statut: 'BLOQUE' },
      { client_id: 'CL-1003', client: 'Togbui Apedo', agence: 'Bè Kpota', niveau: 'RENFORCE', motif: 'DS CENTIF transmise — pièces RCCM manquantes', montant_bloque_fcfa: 1_200_000, statut: 'BLOQUE' },
      { client_id: 'CL-2918', client: 'Mawuena Hotor', agence: 'Lomé Centre', niveau: 'STANDARD', motif: 'Photo OCR rejetée + justificatif revenu absent', montant_bloque_fcfa: 620_000, statut: 'A_RELANCER' },
      { client_id: 'CL-3310', client: 'Mensah Kodjo', agence: 'Bè Kpota', niveau: 'STANDARD', motif: 'Virements tiers — due diligence complémentaire', statut: 'EN_COURS' },
      { client_id: 'CL-4421', client: 'Coop. Tabligbo', agence: 'Kpalimé', niveau: 'RENFORCE', motif: 'Décaissement groupe 3,2 M — bénéficiaires finaux à vérifier', montant_bloque_fcfa: 3_200_000, statut: 'EN_COURS' },
    ],
    referentiel: [
      { terme: 'CENTIF', definition: 'Cellule Nationale de Traitement des Informations Financières du Togo — autorité de réception des DS.' },
      { terme: 'DS', definition: 'Déclaration de Soupçon — signalement obligatoire d\'une opération suspecte, sans information au client.' },
      { terme: 'DA', definition: 'Déclaration Automatique — opérations > seuil réglementaire (5 M FCFA au Togo).' },
      { terme: 'Due diligence renforcée', definition: 'Obligatoire pour PPE, clients à haut risque, opérations complexes ou pays non coopératifs.' },
      { terme: 'Gel des avoirs', definition: 'Mesure conservatoire — blocage des fonds en attendant décision CENTIF/justice.' },
    ],
  }
}

let _cache: ReturnType<typeof buildAll> | null = null

function buildAll() {
  const classifications = buildClassifications()
  const repartition = buildRepartition(classifications)
  const provisions_agences = buildProvisionsAgences(classifications)
  const provisions_totales = classifications.reduce((s, c) => s + c.provision_fcfa, 0)
  const encours_total = classifications.reduce((s, c) => s + c.encours_fcfa, 0)
  const migrations = classifications.filter(c => c.classe_calculee !== c.classe_precedente).length
  const par30 = classifications.filter(c => c.jours_retard_max >= 1).length
  const par90 = classifications.filter(c => c.jours_retard_max >= 31).length
  const total = classifications.length

  const expectedLoss = repartition.reduce((s, r) => s + r.provision_fcfa, 0)
  const couverture = expectedLoss > 0 ? Math.min(100, Math.round((provisions_totales / expectedLoss) * 100)) : 100
  const bceao = buildConformiteBceao()
  const ratiosNc = bceao.ratios_reglementaires.filter(r => r.statut === 'NON_CONFORME').length

  return {
    classifications,
    repartition_classes: repartition,
    provisions_agences,
    kpis: {
      par_30_pct: Number(((par30 / total) * 100).toFixed(1)) || RESEAU_CONSOLIDE.par_moyen,
      par_90_pct: Number(((par90 / total) * 100).toFixed(1)) || 3.2,
      provisions_totales_fcfa: provisions_totales,
      taux_couverture_pct: couverture,
      migrations_mois: migrations,
      exports_en_attente: EXPORTS.filter(e => e.statut === 'GENERE').length,
      encours_total_fcfa: encours_total,
      total_dossiers: total,
      score_bceao: bceao.score_global,
      niveau_bceao: bceao.niveau,
      ratios_non_conformes: ratiosNc,
      jours_avant_rapport_bceao: bceao.jours_avant_rapport,
    },
    exports: EXPORTS,
    lbc_ft: buildLbcFt(),
    synthese_ia: `Classification recalculée 28/05 — ${migrations} migrations ce mois (dont secteur Commerce à Adidogomé). Provisions totales ${Math.round(provisions_totales / 1_000_000 * 10) / 10} M FCFA sur ${Math.round(encours_total / 1_000_000 * 10) / 10} M encours. Export BCEAO juin à générer avant 02/07. LBC/FT : 1 DS CENTIF transmise, 2 comptes gelés, KYC 94,2 % — action DG sur 14 dossiers incomplets.`,
  }
}

export function getConformiteRegistry() {
  if (!_cache) _cache = buildAll()
  return _cache
}

export { PROVISION_PCT, CLASSE_ORDER }
