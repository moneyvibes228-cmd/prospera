/**
 * Registre unique — clients à risque, dossiers bloqués, activité agents.
 * Source de vérité pour RISQUE_AVANCE, dec-vue360, MOCK_ROC_HOME, risque-hub.
 */
import { AGENCES, RESEAU_CONSOLIDE } from './agences'
import { getMoisCourant } from './mock-time-series'
import { SECTEURS } from './portefeuille-reseau'

export interface ClientRisqueSeed {
  id: string
  nom: string
  agence: string
  agent: string
  encours: number
  score_ia: number
  pd_pct: number
  el: number
  jours_retard: number
  action: string
}

export interface DossierBloqueSeed {
  id: string
  client: string
  montant: number
  etape: string
  bloque_depuis_h: number
  raison: string
  agent: string
  agence: string
  statut_workflow: string
}

export interface AgentActiviteSeed {
  agent: string
  agence: string
  dossiers_traites_mois: number
  dossiers_approuves_mois: number
}

/** 10 clients à risque — ordre = priorité DEC (triée par pd_pct desc à l'affichage) */
export const REGISTRE_CLIENTS_RISQUE: ClientRisqueSeed[] = [
  { id: 'CL-1042', nom: 'Komlan Attivor', agence: 'Bè Kpota', agent: 'Kossi Adjavon', encours: 850_000, score_ia: 38, pd_pct: 62, el: 421_400, jours_retard: 87, action: 'Mise en demeure J+30' },
  { id: 'CL-1018', nom: 'Yawa Dossou', agence: 'Bè Kpota', agent: 'Afi Lawson', encours: 620_000, score_ia: 42, pd_pct: 58, el: 287_280, jours_retard: 64, action: 'Restructuration proposée' },
  { id: 'CL-1067', nom: 'Edem Bessan', agence: 'Hédzranawoé', agent: 'Mawu Hotor', encours: 480_000, score_ia: 45, pd_pct: 54, el: 207_360, jours_retard: 48, action: 'Visite urgente' },
  { id: 'CL-1003', nom: 'Togbui Apedo', agence: 'Bè Kpota', agent: 'Kossi Adjavon', encours: 1_200_000, score_ia: 47, pd_pct: 51, el: 489_600, jours_retard: 42, action: 'Contentieux à étudier' },
  { id: 'CL-1029', nom: 'Mensah Folly', agence: 'Lomé Centre', agent: 'Yawo Adjavon', encours: 540_000, score_ia: 51, pd_pct: 47, el: 200_880, jours_retard: 35, action: 'Plan apurement' },
  { id: 'CL-1058', nom: 'Adjoa Klutse', agence: 'Hédzranawoé', agent: 'Elom Komlavi', encours: 380_000, score_ia: 54, pd_pct: 44, el: 134_064, jours_retard: 28, action: 'Relance WhatsApp' },
  { id: 'CL-1071', nom: 'Sika Adjovi', agence: 'Adidogomé', agent: 'Sena Dossou', encours: 720_000, score_ia: 56, pd_pct: 42, el: 241_920, jours_retard: 22, action: 'Visite suivi' },
  { id: 'CL-1093', nom: 'Mawuena Hotor', agence: 'Kpalimé', agent: 'Selom Agbeko', encours: 290_000, score_ia: 58, pd_pct: 39, el: 90_480, jours_retard: 18, action: 'Relance téléphone' },
  { id: 'CL-1112', nom: 'Akouvi Senou', agence: 'Kpalimé', agent: 'Ama Fiagbé', encours: 410_000, score_ia: 61, pd_pct: 36, el: 118_080, jours_retard: 14, action: 'Surveillance' },
  { id: 'CL-1124', nom: 'Kossi Dzigbodi', agence: 'Lomé Centre', agent: 'Mensah Kodjo', encours: 680_000, score_ia: 62, pd_pct: 35, el: 190_400, jours_retard: 11, action: 'Surveillance' },
]

/** Dossiers pipeline bloqués — 6 entrées (DEC + ROC) */
export const REGISTRE_DOSSIERS_BLOQUES: DossierBloqueSeed[] = [
  { id: 'DOS-2407', client: 'Coop. Kpalimé Sud', montant: 3_200_000, etape: 'Comité crédit', bloque_depuis_h: 72, raison: 'Membre comité absent', agent: 'Ama Fiagbé', agence: 'Kpalimé', statut_workflow: 'EN_ATTENTE_COMITE' },
  { id: 'DOS-2412', client: 'GIE Femmes Marché', montant: 2_400_000, etape: 'Validation Direction', bloque_depuis_h: 96, raison: 'DEC en mission', agent: 'Edem Kpélim', agence: 'Lomé Centre', statut_workflow: 'EN_ATTENTE_DEC' },
  { id: 'DOS-2418', client: 'Mawuena PME', montant: 1_800_000, etape: 'Pièces complémentaires', bloque_depuis_h: 54, raison: 'Doc cadastre manquant', agent: 'Akua Lawson', agence: 'Adidogomé', statut_workflow: 'DOCS_INCOMPLETS' },
  { id: 'DOS-2421', client: 'Yao Tetevi', montant: 650_000, etape: 'Visite domicile', bloque_depuis_h: 60, raison: 'Client injoignable', agent: 'Elom Komlavi', agence: 'Hédzranawoé', statut_workflow: 'EN_VISITE' },
  { id: 'DOS-2026-0228', client: 'Folly Mensah', montant: 400_000, etape: 'EN_ANALYSE_ROC', bloque_depuis_h: 48, raison: 'En attente validation ROC', agent: 'Kofi Amavi', agence: 'Lomé Centre', statut_workflow: 'EN_ANALYSE_ROC' },
  { id: 'DOS-2026-0214', client: 'Akossiwa Téfé', montant: 320_000, etape: 'EN_ANALYSE', bloque_depuis_h: 72, raison: 'Pièces complémentaires manquantes', agent: 'Kossi Adjavon', agence: 'Bè Kpota', statut_workflow: 'EN_ANALYSE' },
]

/** Activité crédit par agent — base pour alertes concentration */
export const REGISTRE_AGENT_ACTIVITE: AgentActiviteSeed[] = [
  { agent: 'Edem Kpélim', agence: 'Bè Kpota', dossiers_traites_mois: 38, dossiers_approuves_mois: 24 },
  { agent: 'Akua Lawson', agence: 'Adidogomé', dossiers_traites_mois: 31, dossiers_approuves_mois: 14 },
  { agent: 'Kofi Amavi', agence: 'Lomé Centre', dossiers_traites_mois: 28, dossiers_approuves_mois: 13 },
  { agent: 'Ama Fiagbé', agence: 'Kpalimé', dossiers_traites_mois: 22, dossiers_approuves_mois: 10 },
  { agent: 'Komi Atsu', agence: 'Hédzranawoé', dossiers_traites_mois: 18, dossiers_approuves_mois: 8 },
]

export type TopClientRisque = ClientRisqueSeed

export type DossierBloqueResume = Pick<
  DossierBloqueSeed,
  'id' | 'client' | 'montant' | 'etape' | 'bloque_depuis_h' | 'raison' | 'agent' | 'agence'
>

export function buildTopClientsRisque(limit = 10): TopClientRisque[] {
  return [...REGISTRE_CLIENTS_RISQUE]
    .sort((a, b) => b.pd_pct - a.pd_pct || b.jours_retard - a.jours_retard)
    .slice(0, limit)
}

export function buildDossiersBloques48h(minHeures = 48): DossierBloqueResume[] {
  return REGISTRE_DOSSIERS_BLOQUES
    .filter(d => d.bloque_depuis_h >= minHeures)
    .sort((a, b) => b.bloque_depuis_h - a.bloque_depuis_h)
    .map(({ statut_workflow: _, ...rest }) => rest)
}

export function buildDossiersBloquesRoc() {
  return REGISTRE_DOSSIERS_BLOQUES.map(d => ({
    reference: d.id,
    client: d.client,
    agence: d.agence,
    montant: d.montant,
    etape: d.etape,
    bloque_depuis_h: d.bloque_depuis_h,
    blocage_raison: d.raison,
  }))
}

export function buildHaussesAnormalesDefauts() {
  const parReseau = getMoisCourant().par_30

  return AGENCES
    .map(a => {
      const variationPct = parReseau > 0
        ? Math.round(((a.par_courant - parReseau) / parReseau) * 100)
        : 0
      return {
        agence: a.nom_court,
        agent: a.responsable,
        variation_pct: variationPct,
        ecart_par: Number((a.par_courant - parReseau).toFixed(1)),
      }
    })
    .filter(x => x.ecart_par > 0.8)
    .sort((a, b) => b.variation_pct - a.variation_pct)
    .slice(0, 3)
    .map(x => ({
      agence: x.agence,
      agent: x.agent,
      variation_pct: x.variation_pct,
      periode: '14 derniers jours',
      alerte: x.variation_pct >= 25 ? 'CRITIQUE' as const : 'WARN' as const,
      commentaire: x.variation_pct >= 25
        ? 'Hausse anormale détectée — investigation requise'
        : 'Hausse modérée — surveiller',
    }))
}

export function buildConcentrationsSuspectes() {
  const encoursTotal = RESEAU_CONSOLIDE.encours_total
  const alerts: Array<{
    type: string
    cible: string
    metrique: string
    valeur: string
    seuil: string
    alerte: 'CRITIQUE' | 'WARN'
    score: number
  }> = []

  const topSecteur = [...SECTEURS].sort((a, b) => b.encours - a.encours)[0]
  if (topSecteur) {
    const pct = Math.round((topSecteur.encours / encoursTotal) * 100)
    if (pct >= 28 || topSecteur.alerte_concentration) {
      alerts.push({
        type: 'Secteur',
        cible: topSecteur.nom,
        metrique: 'Concentration encours',
        valeur: `${pct}%`,
        seuil: '30%',
        alerte: pct >= 35 ? 'CRITIQUE' : 'WARN',
        score: pct,
      })
    }
  }

  const agenceRisque = [...AGENCES].sort((a, b) => b.par_courant - a.par_courant)[0]
  if (agenceRisque) {
    const pct = Math.round((agenceRisque.encours_fcfa / encoursTotal) * 100)
    alerts.push({
      type: 'Géographie',
      cible: agenceRisque.nom_court,
      metrique: 'Encours / agence',
      valeur: `${pct}%`,
      seuil: '25%',
      alerte: agenceRisque.par_courant >= 10 ? 'WARN' : 'WARN',
      score: agenceRisque.par_courant,
    })
  }

  for (const act of REGISTRE_AGENT_ACTIVITE) {
    const taux = act.dossiers_traites_mois > 0
      ? act.dossiers_approuves_mois / act.dossiers_traites_mois
      : 0
    if (taux > 0.5) {
      alerts.push({
        type: 'Agent',
        cible: act.agent,
        metrique: 'Dossiers approuvés',
        valeur: `${act.dossiers_approuves_mois}/${act.dossiers_traites_mois} (${Math.round(taux * 100)}%)`,
        seuil: '50%',
        alerte: taux >= 0.6 ? 'CRITIQUE' : 'WARN',
        score: Math.round(taux * 100),
      })
    }
  }

  const agent = alerts.filter(a => a.type === 'Agent').sort((a, b) => b.score - a.score)[0]
  const secteur = alerts.filter(a => a.type === 'Secteur').sort((a, b) => b.score - a.score)[0]
  const geo = alerts.filter(a => a.type === 'Géographie')[0]

  return [agent, secteur, geo].filter(Boolean).map(({ score: _, ...rest }) => rest)
}

export function getRegistreClientById(id: string): ClientRisqueSeed | undefined {
  return REGISTRE_CLIENTS_RISQUE.find(c => c.id === id)
}

export function getRegistreDossierById(id: string): DossierBloqueSeed | undefined {
  return REGISTRE_DOSSIERS_BLOQUES.find(d => d.id === id)
}

export function countDossiersBloques(): number {
  return buildDossiersBloques48h().length
}

export function sumMontantDossiersBloques(): number {
  return buildDossiersBloques48h().reduce((s, d) => s + d.montant, 0)
}
