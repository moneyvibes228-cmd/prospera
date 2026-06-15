import type { DossierCreditDetail } from '@/types/credit-api'
import type { RapportCcApi, RapportRocApi } from '@/types/credit-rapports-api'
import type { RapportCC, EtapeScore, DimensionCBI, ClasseBceao, AlerteActiveCC } from '@/lib/mockMicrofinance'
import { normalizeProsperaIaMode } from '@/lib/prospera-ia-credit'

const ETAPES: EtapeScore[] = ['SOUMIS', 'DOSSIER_COMPLET', 'EN_ANALYSE', 'VALIDE_CHARGE', 'EN_ANALYSE_ROC']

function asEtape(e: string): EtapeScore {
  return (ETAPES.includes(e as EtapeScore) ? e : 'EN_ANALYSE') as EtapeScore
}

function asClasse(c: string): ClasseBceao {
  const ok = ['PERFORMANT', 'SOUS_SURVEILLANCE', 'DOUTEUX', 'COMPROMIS', 'PERTE'] as const
  return ok.includes(c as ClasseBceao) ? (c as ClasseBceao) : 'SOUS_SURVEILLANCE'
}

const AXE_BY_KEY: Record<string, DimensionCBI['axe_5c']> = {
  D1: 'CHARACTER',
  D2: 'CHARACTER',
  D3: 'CAPACITY',
  D4: 'CAPITAL',
  D5: 'COLLATERAL',
  D6: 'CONDITIONS',
  D7: 'CONDITIONS',
  D8: 'CONDITIONS',
}

function mapDimensions(detail?: RapportCcApi['detail_dimensions']): DimensionCBI[] {
  if (!detail) return []
  return Object.entries(detail).map(([key, d]) => ({
    code: key,
    nom: key,
    score: d.score,
    max: d.max,
    pct: d.pct,
    active: d.active,
    axe_5c: AXE_BY_KEY[key] ?? 'CHARACTER',
    justification: d.justification,
    sous_dimensions: d.sous_dimensions ?? [],
  }))
}

/** Fusionne la réponse GET /rapport-cc avec le détail dossier pour alimenter RapportCcDossier */
export function mapApiRapportCcToRapportCC(
  api: RapportCcApi,
  dossierId: string,
  detail?: DossierCreditDetail | null,
  fallback?: RapportCC | null,
): RapportCC {
  const clientApi = api.client ?? fallback?.client
  const clientDetail = detail?.client

  return {
    dossier_id: api.dossier_id ?? dossierId,
    reference_dossier: api.reference_dossier ?? detail?.reference ?? fallback?.reference_dossier ?? dossierId,
    client: {
      id: clientApi?.id ?? clientDetail?.id ?? fallback?.client.id ?? '',
      nom: clientApi?.nom ?? clientDetail?.nom ?? fallback?.client.nom ?? '',
      prenom: clientApi?.prenom ?? clientDetail?.prenom ?? fallback?.client.prenom ?? '',
      telephone: clientApi?.telephone ?? clientDetail?.telephone ?? fallback?.client.telephone ?? '',
      secteur: clientApi?.secteur ?? clientDetail?.secteur ?? fallback?.client.secteur ?? '',
      activite: clientApi?.activite ?? clientDetail?.activite ?? fallback?.client.activite ?? '',
      age: clientApi?.age ?? fallback?.client.age ?? 0,
      localite: clientApi?.localite ?? fallback?.client.localite ?? '',
    },
    montant_demande: api.montant_demande ?? Number(detail?.montant_demande) ?? fallback?.montant_demande ?? 0,
    duree_mois: api.duree_mois ?? detail?.duree_mois ?? fallback?.duree_mois ?? 12,
    objet_credit: api.objet_credit ?? detail?.objet_credit ?? fallback?.objet_credit ?? '',
    date_creation: api.date_creation ?? detail?.date_soumission ?? fallback?.date_creation ?? '',
    etape_courante: asEtape(api.etape_courante),
    statut_dossier: api.statut_dossier ?? String(detail?.statut ?? fallback?.statut_dossier ?? ''),
    score_consolide: api.score_consolide,
    score_cbi: api.score_cbi,
    ajustement_prospera_ia: api.ajustement_claude,
    classe_bceao: asClasse(api.classe_bceao),
    probabilite_defaut_pct: api.probabilite_defaut_pct,
    evolution_score: (api.evolution_score ?? []).map((e, i) => ({
      etape: asEtape(String(e.etape)),
      score_consolide: e.score_consolide,
      date: e.date ?? fallback?.evolution_score[i]?.date ?? '',
    })),
    mapping_5c: api.mapping_5c ?? fallback?.mapping_5c ?? {
      CHARACTER: 0,
      CAPACITY: 0,
      CAPITAL: 0,
      COLLATERAL: 0,
      CONDITIONS: 0,
    },
    detail_dimensions: mapDimensions(api.detail_dimensions).length
      ? mapDimensions(api.detail_dimensions)
      : (fallback?.detail_dimensions ?? []),
    alertes_actives: (api.alertes_actives ?? fallback?.alertes_actives ?? []) as AlerteActiveCC[],
    analyse_prospera_ia: {
      mode: normalizeProsperaIaMode(
        api.mode_analyse ?? fallback?.analyse_prospera_ia.mode,
      ),
      commentaire:
        api.analyse_claude?.commentaire ?? fallback?.analyse_prospera_ia.commentaire ?? '',
      questions_a_poser:
        api.analyse_claude?.questions_a_poser ??
        fallback?.analyse_prospera_ia.questions_a_poser ??
        [],
      points_a_verifier:
        api.analyse_claude?.points_a_verifier ??
        fallback?.analyse_prospera_ia.points_a_verifier ??
        [],
      decision_suggeree: api.analyse_claude?.decision_suggeree as RapportCC['analyse_prospera_ia']['decision_suggeree'],
    },
    rappels_etape: api.rappels_etape ?? fallback?.rappels_etape ?? [],
    charge_credit: fallback?.charge_credit ?? { nom: 'Charge crédit', agence: detail?.agence?.nom ?? '—' },
  }
}

/** Mock ROC dérivé du rapport CC mock pour l’onglet ROC en mode démo */
export function mockRapportCcToRocApi(rapport: RapportCC): RapportRocApi {
  return {
    reference_dossier: rapport.reference_dossier,
    client: {
      nom: rapport.client.nom,
      prenom: rapport.client.prenom,
      telephone: rapport.client.telephone,
      secteur: rapport.client.secteur,
    },
    montant_demande: rapport.montant_demande,
    duree_mois: rapport.duree_mois,
    objet_credit: rapport.objet_credit,
    synthese_executive: rapport.analyse_prospera_ia.commentaire.slice(0, 400),
    score_final: rapport.score_consolide,
    score_cbi: rapport.score_cbi,
    ajustement_claude: rapport.ajustement_prospera_ia,
    classe_bceao: rapport.classe_bceao,
    probabilite_defaut_pct: rapport.probabilite_defaut_pct,
    expected_loss: {
      ead: rapport.montant_demande,
      pd_pct: rapport.probabilite_defaut_pct,
      lgd_pct: 45,
      perte_attendue_fcfa: Math.round(rapport.montant_demande * (rapport.probabilite_defaut_pct / 100) * 0.45),
      provision_reglementaire_fcfa: Math.round(rapport.montant_demande * 0.1),
      taux_provision_pct: 10,
    },
    evolution_score: rapport.evolution_score.map((e) => ({
      etape: e.etape,
      score_consolide: e.score_consolide,
    })),
    mapping_5c: rapport.mapping_5c,
    avis_charge_credit: {
      avis: 'Favorable',
      montant_suggere: rapport.montant_demande,
      notes_brutes: 'Synthèse mock dérivée du rapport CC',
    },
    alertes: rapport.alertes_actives,
    analyse_risque: {
      forces: ['Historique client stable'],
      faiblesses: rapport.alertes_actives.map((a) => a.message).slice(0, 3),
      risques_specifiques: [],
      recommandations_avant_decision: rapport.analyse_prospera_ia.points_a_verifier,
    },
    suggestion: {
      decision: rapport.analyse_prospera_ia.decision_suggeree ?? 'APPROUVER',
      montant_recommande: rapport.montant_demande,
      duree_recommandee: rapport.duree_mois,
      taux_recommande: 2.5,
      justification: 'Recommandation mock — activer API pour données ROC réelles',
    },
  }
}
