import { buildEcheancierCoherent, countImpayesEcheancier, echuesDansContrat } from '../src/lib/credit-echeancier-builder'
import { getFicheClientMicrofinance } from '../src/lib/fiche-client-microfinance'
import { REGISTRE_CLIENTS_RISQUE } from '../src/lib/mock-risque-registry'

const extra = ['EMP-001-0001', 'CL-CO-VFL-004']
const ids = [...REGISTRE_CLIENTS_RISQUE.map(c => c.id), ...extra]

let fails = 0
for (const id of ids) {
  const f = getFicheClientMicrofinance(id)
  if (!f) {
    console.log('MISSING', id)
    fails++
    continue
  }
  const cr = f.credits_detail.find(x => x.encours_fcfa > 0 || x.statut === 'EN_RETARD') ?? f.credits_detail[0]
  const nbEch = cr?.echeancier ? countImpayesEcheancier(cr.echeancier) : 0
  const encoursOk = f.jours_retard === 0 || f.encours > 0
  const impOk = f.jours_retard === 0 || f.echeances_impayees === nbEch
  const actifOk = f.jours_retard === 0 || f.credits_detail.some(x => x.encours_fcfa > 0 || x.statut === 'EN_RETARD')
  const ok = encoursOk && impOk && actifOk
  if (!ok) fails++
  console.log(`${ok ? 'OK' : 'FAIL'} ${id} enc=${f.encours} imp=${f.echeances_impayees}/${nbEch} actifs=${f.credits_detail.filter(x => x.encours_fcfa > 0 || x.statut === 'EN_RETARD').length}`)
}

const ech = buildEcheancierCoherent({
  montant: 620_000,
  encours: 620_000,
  date_decaissement: '01/2025',
  mensualite: 68_889,
  jours_retard: 64,
  echeances_impayees: 2,
})
console.log('CL-1018 ech cap', echuesDansContrat('01/2025', 12), 'rows', ech.length, 'imp', countImpayesEcheancier(ech))
console.log('fails', fails)
process.exit(fails > 0 ? 1 : 0)
