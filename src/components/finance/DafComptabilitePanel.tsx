'use client'

import { useMemo, useState } from 'react'
import {
  Scale,
  BookOpen,
  FileSpreadsheet,
  Landmark,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Calculator,
} from 'lucide-react'
import type { MOCK_DAF_HOME } from '@/lib/mockMicrofinance'
import { formatFcfa } from '@/lib/utils'
import { getBalanceControles } from '@/lib/mock-comptabilite-syscohada'
import type { GrandLivreCompte, StatutEcriture } from '@/lib/mock-comptabilite-syscohada'

export type ComptabilitePanelData = {
  comptabilite: typeof MOCK_DAF_HOME.comptabilite
  bilan_consolide: typeof MOCK_DAF_HOME.bilan_consolide
}
type ComptaTab = 'synthese' | 'balance' | 'journal' | 'grand_livre' | 'resultat' | 'rapprochement'

const STATUT_ECRITURE: Record<StatutEcriture, string> = {
  VALIDEE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  BROUILLON: 'bg-slate-100 text-slate-700 border-slate-200',
  ATTENTE_VALIDATION: 'bg-amber-100 text-amber-800 border-amber-200',
}

function SubTab({
  label,
  icon,
  active,
  onClick,
  alert,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
  alert?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold whitespace-nowrap rounded-lg border transition-colors cursor-pointer ${
        active
          ? 'bg-cyan-800 text-white border-cyan-800'
          : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
      }`}
    >
      {icon}
      {label}
      {alert && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />}
    </button>
  )
}

function fmtSolde(n: number, sens: 'D' | 'C') {
  return `${formatFcfa(Math.abs(n))} ${sens}`
}

export function DafComptabilitePanel({
  d,
  defaultTab = 'balance',
}: {
  d: ComptabilitePanelData
  defaultTab?: ComptaTab
}) {
  const c = d.comptabilite
  const s = c.syscohada
  const b = d.bilan_consolide
  const [tab, setTab] = useState<ComptaTab>(defaultTab)
  const [classeFilter, setClasseFilter] = useState<number | 'all'>('all')
  const [glCompte, setGlCompte] = useState(s.grand_livre[0]?.compte ?? '512100')

  const balanceFiltree = useMemo(() => {
    if (classeFilter === 'all') return s.balance_generale.lignes
    return s.balance_generale.lignes.filter(l => l.classe === classeFilter)
  }, [classeFilter, s.balance_generale.lignes])

  const glActif: GrandLivreCompte | undefined = s.grand_livre.find(g => g.compte === glCompte)
  const controles = getBalanceControles(s.balance_generale.lignes)
  const ecrituresAttente = s.journal.ecritures.filter(e => e.statut === 'ATTENTE_VALIDATION')
  const rapNonPointes = s.rapprochements.filter(r => r.statut !== 'POINTE')

  return (
    <div className="space-y-4">
      {/* Référentiel SYSCOHADA */}
      <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/40">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase text-cyan-900 bg-white px-2 py-0.5 rounded border border-cyan-200">
            {s.referentiel.norme}
          </span>
          <span className="text-[10px] text-cyan-800">{s.referentiel.plan}</span>
          <span className="text-[10px] text-slate-600">
            Exercice {s.referentiel.exercice} · {s.referentiel.periode} · {s.referentiel.devise}
          </span>
        </div>
        <p className="text-[11px] text-slate-700 leading-relaxed">
          Bilan {b.statut} au {b.date_reference} — {c.journal_entries_mois.toLocaleString('fr-FR')} écritures en base
          (portefeuille : {s.referentiel.portefeuille.dossiers_credit_actifs} dossiers crédit ·{' '}
          {s.referentiel.portefeuille.comptes_epargne_total.toLocaleString('fr-FR')} comptes épargne dont{' '}
          {s.referentiel.portefeuille.comptes_epargne_actifs.toLocaleString('fr-FR')} actifs et{' '}
          {s.referentiel.portefeuille.comptes_epargne_dormants} dormants).
          Plan {s.referentiel.plan_stats.comptes_parametres} comptes · balance mai :{' '}
          {s.balance_generale.comptes_mouvementes} mouvementés ({s.referentiel.plan_stats.comptes_extraits_balance}{' '}
          lignes extrait, aux. 411 : {s.referentiel.portefeuille.auxiliaires_411} · aux. 521 :{' '}
          {s.referentiel.portefeuille.auxiliaires_521.toLocaleString('fr-FR')}).
          Clôture {c.prochaine_cloture} dans {c.cloture_dans_jours} j.
        </p>
      </div>

      {/* Sous-onglets compta */}
      <div className="flex flex-wrap gap-2">
        <SubTab label="Synthèse clôture" icon={<ClipboardList className="w-3.5 h-3.5" />} active={tab === 'synthese'} onClick={() => setTab('synthese')} alert={c.ecritures_attente > 0} />
        <SubTab label="Balance générale" icon={<Scale className="w-3.5 h-3.5" />} active={tab === 'balance'} onClick={() => setTab('balance')} />
        <SubTab label="Journal" icon={<BookOpen className="w-3.5 h-3.5" />} active={tab === 'journal'} onClick={() => setTab('journal')} alert={ecrituresAttente.length > 0} />
        <SubTab label="Grand livre" icon={<FileSpreadsheet className="w-3.5 h-3.5" />} active={tab === 'grand_livre'} onClick={() => setTab('grand_livre')} />
        <SubTab label="Compte de résultat" icon={<Calculator className="w-3.5 h-3.5" />} active={tab === 'resultat'} onClick={() => setTab('resultat')} />
        <SubTab label="Rapprochement bancaire" icon={<Landmark className="w-3.5 h-3.5" />} active={tab === 'rapprochement'} onClick={() => setTab('rapprochement')} alert={rapNonPointes.length > 0} />
      </div>

      {tab === 'synthese' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-yellow-700">{c.suspens_comptables.length}</div>
              <div className="text-[10px] font-semibold text-yellow-600 uppercase">Suspens</div>
            </div>
            <div className={`border rounded-xl p-3 text-center ${c.ecritures_attente > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
              <div className={`text-2xl font-black ${c.ecritures_attente > 0 ? 'text-orange-700' : 'text-green-700'}`}>{c.ecritures_attente}</div>
              <div className="text-[10px] font-semibold uppercase opacity-70">Écritures en attente</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-amber-700">{c.rapprochements_a_finaliser}</div>
              <div className="text-[10px] font-semibold text-amber-600 uppercase">Rapproch. à finaliser</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-red-700">{c.cloture_dans_jours}j</div>
              <div className="text-[10px] font-semibold text-red-600 uppercase">Avant clôture</div>
            </div>
          </div>
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-3">Pont portefeuille ↔ comptabilité</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-[11px]">
              <div className="bg-white rounded-lg border border-teal-100 p-2">
                <div className="font-black text-lg text-slate-900 tabular-nums">{s.referentiel.portefeuille.dossiers_credit_actifs}</div>
                <div className="text-slate-600 font-semibold">Dossiers crédit</div>
              </div>
              <div className="bg-white rounded-lg border border-teal-100 p-2">
                <div className="font-black text-lg text-slate-900 tabular-nums">{s.referentiel.portefeuille.comptes_epargne_total.toLocaleString('fr-FR')}</div>
                <div className="text-slate-600 font-semibold">Comptes épargne</div>
              </div>
              <div className="bg-white rounded-lg border border-teal-100 p-2">
                <div className="font-black text-lg text-emerald-800 tabular-nums">{s.referentiel.portefeuille.comptes_epargne_actifs.toLocaleString('fr-FR')}</div>
                <div className="text-slate-600 font-semibold">Épargne actifs</div>
              </div>
              <div className="bg-white rounded-lg border border-amber-100 p-2">
                <div className="font-black text-lg text-amber-800 tabular-nums">{s.referentiel.portefeuille.comptes_epargne_dormants}</div>
                <div className="text-slate-600 font-semibold">Épargne dormants</div>
              </div>
              <div className="bg-white rounded-lg border border-teal-100 p-2">
                <div className="font-black text-lg text-slate-900 tabular-nums">{s.referentiel.plan_stats.comptes_parametres}</div>
                <div className="text-slate-600 font-semibold">Plan comptable</div>
              </div>
              <div className="bg-white rounded-lg border border-teal-100 p-2">
                <div className="font-black text-lg text-cyan-900 tabular-nums">{s.balance_generale.comptes_mouvementes}</div>
                <div className="text-slate-600 font-semibold">Comptes mouvementés (mai)</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Checklist clôture mensuelle</h4>
            <ol className="space-y-2 text-xs">
              {[
                { ok: s.balance_generale.equilibre, label: `Mouvements mai équilibrés (D ${formatFcfa(s.balance_generale.total_debit_mois)} = C ${formatFcfa(s.balance_generale.total_credit_mois)})` },
                { ok: c.ecritures_attente === 0, label: `${c.ecritures_attente} écriture(s) en attente de validation` },
                { ok: c.rapprochements_a_finaliser === 0, label: `${c.rapprochements_a_finaliser} rapprochement(s) bancaire à finaliser` },
                { ok: c.suspens_comptables.every(x => x.statut === 'OK'), label: 'Comptes 471 / 401 lettrés' },
                { ok: b.equilibre_ok, label: 'Bilan : actif = passif' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  {step.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                  <span className={step.ok ? 'text-slate-600' : 'font-semibold text-slate-900'}>{step.label}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase">Suspens à régulariser</h4>
            {c.suspens_comptables.map((x, i) => (
              <div key={i} className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 text-xs ${x.statut === 'CRITIQUE' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                <span className="font-mono font-bold text-indigo-700">{x.compte}</span>
                <span className="font-bold tabular-nums">{formatFcfa(x.solde)}</span>
                <span className="text-slate-500">{x.age_jours} j</span>
                <span className="font-bold px-1.5 py-0.5 rounded border text-[10px]">{x.statut}</span>
                <span className="text-slate-600 flex-1 min-w-[200px]">{x.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'balance' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase">Balance générale — {s.balance_generale.date_arrete}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {s.balance_generale.comptes_mouvementes} comptes mouvementés sur {s.referentiel.plan_stats.comptes_parametres} au plan ·{' '}
                {balanceFiltree.length} ligne(s) affichée(s) · créances réseau ventilées par agence (411/416) · dépôts 521 par agence
                {controles.ecart !== 0 && (
                  <span className="text-red-600 font-semibold"> · Écart actif/passif {formatFcfa(controles.ecart)}</span>
                )}
              </p>
            </div>
            <select
              value={classeFilter}
              onChange={e => setClasseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="all">Toutes classes</option>
              {[1, 2, 4, 5, 6, 7, 8].map(cl => (
                <option key={cl} value={cl}>
                  Classe {cl}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-2 py-2 font-bold">Compte</th>
                  <th className="text-left px-2 py-2 font-bold min-w-[140px]">Libellé</th>
                  <th className="text-center px-2 py-2 font-bold">Cl.</th>
                  <th className="text-right px-2 py-2 font-bold">Débit mai</th>
                  <th className="text-right px-2 py-2 font-bold">Crédit mai</th>
                  <th className="text-right px-2 py-2 font-bold">Solde N</th>
                  <th className="text-right px-2 py-2 font-bold">Solde N-1</th>
                  <th className="text-center px-2 py-2 font-bold">Var.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {balanceFiltree.map((l, i) => {
                  const varPct =
                    l.solde_n1 !== 0 ? Math.round(((l.solde_n - l.solde_n1) / Math.abs(l.solde_n1)) * 1000) / 10 : 0
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-2 py-2 font-mono font-bold text-indigo-700">{l.compte}</td>
                      <td className="px-2 py-2 text-slate-800">{l.libelle}</td>
                      <td className="px-2 py-2 text-center text-slate-500">{l.classe}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-slate-700">{l.debit_mois > 0 ? formatFcfa(l.debit_mois) : '—'}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-slate-700">{l.credit_mois > 0 ? formatFcfa(l.credit_mois) : '—'}</td>
                      <td className="px-2 py-2 text-right tabular-nums font-semibold">{fmtSolde(l.solde_n, l.sens_solde_n)}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-slate-500">{fmtSolde(l.solde_n1, l.sens_solde_n)}</td>
                      <td className={`px-2 py-2 text-center font-bold ${varPct > 10 ? 'text-red-600' : varPct < -5 ? 'text-green-600' : 'text-slate-500'}`}>
                        {varPct > 0 ? '+' : ''}
                        {varPct}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-800">
                <tr>
                  <td colSpan={3} className="px-2 py-2">
                    Totaux mouvements mai
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatFcfa(s.balance_generale.total_debit_mois)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatFcfa(s.balance_generale.total_credit_mois)}</td>
                  <td colSpan={3} className="px-2 py-2 text-center">
                    {s.balance_generale.equilibre ? (
                      <span className="text-emerald-700">✓ Équilibre des écritures</span>
                    ) : (
                      <span className="text-red-700">Déséquilibre mouvements</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {tab === 'journal' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-600">
            Journal multi-codes : AN (à-nouveaux), OD (opérations diverses), BQ (banque), CA (caisse), CR (crédit).
            {ecrituresAttente.length > 0 && (
              <span className="font-semibold text-amber-800"> {ecrituresAttente.length} écriture(s) en attente de validation DAF.</span>
            )}
          </p>
          {s.journal.ecritures.map(ec => {
            const totalD = ec.lignes.reduce((s, l) => s + l.debit, 0)
            const totalC = ec.lignes.reduce((s, l) => s + l.credit, 0)
            return (
              <div key={ec.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-indigo-700">{ec.piece}</span>
                  <span className="text-slate-500">{ec.date}</span>
                  <span className="font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{ec.journal}</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded border text-[10px] ${STATUT_ECRITURE[ec.statut]}`}>{ec.statut.replace('_', ' ')}</span>
                  {ec.agence && <span className="text-slate-500">{ec.agence}</span>}
                  <span className="flex-1 font-medium text-slate-800">{ec.libelle}</span>
                  <span className="text-slate-400">{ec.auteur}</span>
                </div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-50">
                      <th className="text-left px-3 py-1.5 font-medium">Compte</th>
                      <th className="text-left px-3 py-1.5 font-medium">Libellé</th>
                      <th className="text-right px-3 py-1.5 font-medium">Débit</th>
                      <th className="text-right px-3 py-1.5 font-medium">Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ec.lignes.map((l, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-1.5 font-mono text-indigo-600">{l.compte}</td>
                        <td className="px-3 py-1.5">{l.libelle}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{l.debit > 0 ? formatFcfa(l.debit) : ''}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{l.credit > 0 ? formatFcfa(l.credit) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold">
                      <td colSpan={2} className="px-3 py-1.5 text-right">
                        Total pièce
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatFcfa(totalD)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatFcfa(totalC)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'grand_livre' && glActif && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Compte :</label>
            <select
              value={glCompte}
              onChange={e => setGlCompte(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 min-w-[280px]"
            >
              {s.grand_livre.map(g => (
                <option key={g.compte} value={g.compte}>
                  {g.compte} — {g.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100 text-xs flex flex-wrap gap-4">
            <span>
              Solde initial : <strong>{fmtSolde(glActif.solde_initial, glActif.sens_initial)}</strong>
            </span>
            <span>
              Solde final : <strong>{fmtSolde(glActif.solde_final, glActif.sens_final)}</strong>
            </span>
            <span>
              Mouvements : D {formatFcfa(glActif.total_debit)} / C {formatFcfa(glActif.total_credit)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Pièce</th>
                  <th className="text-left px-3 py-2">Libellé</th>
                  <th className="text-right px-3 py-2">Débit</th>
                  <th className="text-right px-3 py-2">Crédit</th>
                  <th className="text-right px-3 py-2">Solde prog.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {glActif.mouvements.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2">{m.date}</td>
                    <td className="px-3 py-2 font-mono text-indigo-600">{m.piece}</td>
                    <td className="px-3 py-2">{m.libelle}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.debit > 0 ? formatFcfa(m.debit) : ''}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.credit > 0 ? formatFcfa(m.credit) : ''}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatFcfa(m.solde_progressif)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'resultat' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase">
              Compte de résultat détaillé — {s.compte_resultat_detaille.periode} (SYSCOHADA)
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              Classe 7 produits · Classe 6 charges · Classe 8 dotations (871 provisions BCEAO, 891 amortissements)
            </p>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-3 py-2">Compte</th>
                <th className="text-left px-3 py-2">Libellé</th>
                <th className="text-right px-3 py-2">Mois</th>
                <th className="text-right px-3 py-2">YTD</th>
              </tr>
            </thead>
            <tbody>
              {s.compte_resultat_detaille.lignes.map((l, i) => (
                <tr
                  key={i}
                  className={`border-b border-slate-50 ${l.section === 'RESULTAT' ? 'bg-indigo-50 font-bold' : l.niveau === 1 ? 'bg-slate-50 font-semibold' : ''}`}
                >
                  <td className="px-3 py-2 font-mono text-indigo-600" style={{ paddingLeft: 8 + (l.niveau - 1) * 12 }}>
                    {l.compte}
                  </td>
                  <td className="px-3 py-2">{l.libelle}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${l.section.startsWith('CHARGE') || l.section === 'DOTATIONS_PROVISIONS' ? 'text-orange-700' : 'text-teal-700'}`}>
                    {l.section === 'RESULTAT' ? formatFcfa(l.montant_mois) : l.section.startsWith('CHARGE') || l.section === 'DOTATIONS_PROVISIONS' ? `(${formatFcfa(l.montant_mois)})` : formatFcfa(l.montant_mois)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">{formatFcfa(l.montant_ytd)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 text-[11px] font-bold">
              <tr>
                <td colSpan={2} className="px-3 py-2">
                  Synthèse
                </td>
                <td className="px-3 py-2 text-right text-teal-800">{formatFcfa(s.compte_resultat_detaille.total_produits)}</td>
                <td className="px-3 py-2" />
              </tr>
              <tr>
                <td colSpan={2} className="px-3 py-2">
                  Charges + dotations
                </td>
                <td className="px-3 py-2 text-right text-orange-800">
                  ({formatFcfa(s.compte_resultat_detaille.total_charges + s.compte_resultat_detaille.total_dotations)})
                </td>
                <td className="px-3 py-2" />
              </tr>
              <tr>
                <td colSpan={2} className="px-3 py-2">
                  Résultat net
                </td>
                <td className="px-3 py-2 text-right text-indigo-900">{formatFcfa(s.compte_resultat_detaille.resultat_net)}</td>
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tab === 'rapprochement' && (
        <div className="space-y-4">
          {s.rapprochements.map(rap => (
            <div key={rap.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${rap.statut === 'POINTE' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {rap.compte} — {rap.libelle}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {rap.banque} · Relevé du {rap.date_releve} · {rap.periode}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${rap.statut === 'POINTE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                  {rap.statut}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 text-center text-xs">
                <div className="bg-white p-3">
                  <div className="text-[10px] text-slate-500 uppercase">Solde comptable</div>
                  <div className="font-black text-slate-900 mt-1">{formatFcfa(rap.solde_comptable)}</div>
                </div>
                <div className="bg-white p-3">
                  <div className="text-[10px] text-slate-500 uppercase">Solde relevé</div>
                  <div className="font-black text-slate-900 mt-1">{formatFcfa(rap.solde_releve)}</div>
                </div>
                <div className="bg-white p-3">
                  <div className="text-[10px] text-slate-500 uppercase">Écart</div>
                  <div className={`font-black mt-1 ${rap.ecart === 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatFcfa(rap.ecart)}</div>
                </div>
                <div className="bg-white p-3">
                  <div className="text-[10px] text-slate-500 uppercase">Non pointées</div>
                  <div className="font-black text-amber-700 mt-1">{rap.operations_non_pointees.length}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                <div className="p-3">
                  <h5 className="text-[10px] font-bold text-slate-600 uppercase mb-2">Relevé bancaire</h5>
                  <table className="w-full text-[11px]">
                    <tbody>
                      {rap.releve_bancaire.map((op, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-1.5 text-slate-500 w-14">{op.date}</td>
                          <td className="py-1.5">{op.libelle}</td>
                          <td className="py-1.5 text-right tabular-nums font-semibold w-24">
                            {op.sens === 'DEBIT_BANQUE' ? '+' : '−'}
                            {formatFcfa(op.montant)}
                          </td>
                          <td className="py-1.5 w-8 text-center">{op.pointage ? '✓' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3">
                  <h5 className="text-[10px] font-bold text-amber-800 uppercase mb-2">Écarts / non rapprochés</h5>
                  {rap.operations_non_pointees.length === 0 ? (
                    <p className="text-xs text-emerald-700">Compte pointé — aucun écart.</p>
                  ) : (
                    <table className="w-full text-[11px]">
                      <tbody>
                        {rap.operations_non_pointees.map((op, i) => (
                          <tr key={i} className="border-b border-amber-50 bg-amber-50/50">
                            <td className="py-1.5 text-slate-500 w-14">{op.date}</td>
                            <td className="py-1.5">
                              {op.libelle}
                              {op.ref_compta && <div className="font-mono text-[10px] text-indigo-600">{op.ref_compta}</div>}
                            </td>
                            <td className="py-1.5 text-right tabular-nums font-bold text-red-700 w-24">{formatFcfa(op.montant)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
