/**
 * Vérifie la cohérence des données dashboard ROC (/dashboard).
 */
import { AGENCES } from '../src/lib/agences.ts'
import { buildParGranulaireReseau } from '../src/lib/credit-dossiers-stats.ts'
import { MOCK_ROC_HOME } from '../src/lib/mockMicrofinance.ts'
import { countDossiersBloques } from '../src/lib/mock-risque-registry.ts'
import { getMoisCourant } from '../src/lib/mock-time-series.ts'
import {
  assertRocParSeriesCoherent,
  buildRocEvolutionPar30,
  verifierCoherenceRocDashboard,
} from '../src/lib/roc-dashboard-hub.ts'
import { ROC_SYNTHESE_COMPLEMENT } from '../src/lib/roc-synthese-ia.ts'

const m = getMoisCourant()
const par = buildParGranulaireReseau()
let fails = 0

function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? 'OK' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) fails++
}

check('nb_prets_actifs = emprunteurs réseau', MOCK_ROC_HOME.kpis_credit_etendus.nb_prets_actifs === m.emprunteurs, `${MOCK_ROC_HOME.kpis_credit_etendus.nb_prets_actifs} vs ${m.emprunteurs}`)
check('par_30_pct = mois courant', MOCK_ROC_HOME.kpis_credit_etendus.par_30_pct === m.par_30, `${MOCK_ROC_HOME.kpis_credit_etendus.par_30_pct} vs ${m.par_30}`)
check('par_1/7 dérivés', MOCK_ROC_HOME.kpis_credit_etendus.par_1_pct === par.par_1.valeur_pct && MOCK_ROC_HOME.kpis_credit_etendus.par_7_pct === par.par_7.valeur_pct)
check('dossiers_bloques = registre', MOCK_ROC_HOME.kpis_operations.dossiers_bloques === countDossiersBloques())
check('collecte jour = remboursements KPI', MOCK_ROC_HOME.recouvrement_reseau.collecte_jour_fcfa === MOCK_ROC_HOME.kpis_credit_etendus.remboursements_jour_montant)
check('évolution PAR S19 = par_30 réseau', buildRocEvolutionPar30().at(-1)?.par_30 === m.par_30)
check('assertRocParSeriesCoherent', assertRocParSeriesCoherent())
check('verifierCoherenceRocDashboard', verifierCoherenceRocDashboard(MOCK_ROC_HOME))
check('15 agents terrain', MOCK_ROC_HOME.performance_agents.length === 15, String(MOCK_ROC_HOME.performance_agents.length))

const parKpi = MOCK_ROC_HOME.kpis_reseau.find(k => k.cle === 'par_30')
check('kpis_reseau PAR aligné', parKpi?.valeur === `${m.par_30}%`, String(parKpi?.valeur))

const obsolete = /Tsévié|Tabligbo|Tsevié/i
for (const a of MOCK_ROC_HOME.performance_agents) {
  check(`agent zone valide: ${a.agent}`, AGENCES.some(ag => ag.nom_court === a.zone) && !obsolete.test(a.zone), a.zone)
}
for (const p of MOCK_ROC_HOME.top_mauvais_payeurs) {
  check(`mauvais payeur agence: ${p.nom}`, AGENCES.some(ag => ag.nom_court === p.agence) && !obsolete.test(p.agence), p.agence)
}
for (const pt of MOCK_ROC_HOME.synthese_ia_narrative.points) {
  check('narrative sans anciens noms', !obsolete.test(pt.texte))
}

for (const ra of ROC_SYNTHESE_COMPLEMENT.recouvrement_agences) {
  const ag = AGENCES.find(a => a.id === ra.agence_id)
  check(`recouvrement agence ${ra.agence_id}`, ag?.nom_court === ra.nom, `${ra.nom}`)
}
check('ROC_SYNTHESE collecte = dashboard', ROC_SYNTHESE_COMPLEMENT.recouvrement_global.collecte_jour_fcfa === MOCK_ROC_HOME.recouvrement_reseau.collecte_jour_fcfa)
check('cash transferts libellé sans Tsévié', !/Tsévié|Tsevié/i.test(MOCK_ROC_HOME.cash_synthese.transferts_urgents_libelle ?? ''))
const urgentsCash = MOCK_ROC_HOME.cash_synthese.agences_critiques + MOCK_ROC_HOME.cash_synthese.agences_tension
check(
  'transferts montant > 0 si agences urgentes',
  urgentsCash === 0 || MOCK_ROC_HOME.cash_synthese.transferts_recommandes > 0,
  `${MOCK_ROC_HOME.cash_synthese.transferts_recommandes} FCFA`,
)

const bk = AGENCES.find(a => a.id === 'AG-003')!
const narrativeBk = MOCK_ROC_HOME.synthese_ia_narrative.points.find(p => p.texte.includes('Bè Kpota'))
check('narrative PAR Bè Kpota', narrativeBk?.texte.includes(String(bk.par_courant)) ?? false, `attendu ${bk.par_courant}%`)

console.log('\nRésumé mai 2026:', {
  emprunteurs: m.emprunteurs,
  encours_M: (m.encours_fcfa / 1_000_000).toFixed(2),
  par_30: m.par_30,
  par_bk: bk.par_courant,
  dossiers_bloques: countDossiersBloques(),
})
console.log('fails', fails)
process.exit(fails > 0 ? 1 : 0)
