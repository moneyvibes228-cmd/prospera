'use client'

import { useState, useMemo } from 'react'
import {
  Wallet, Receipt, BookOpen, TrendingDown, AlertTriangle,
  Sparkles, Building2, Calendar, Scale, BarChart3, CheckCircle2, Target,
  Clock, ArrowDownRight, ArrowUpRight,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import {
  buildSyntheseComptabiliteDG, buildAnalysesComptabiliteIA,
  getComptesTresorerie, getEcrituresJournal, getBalanceGenerale,
  getPrevisionsTresorerie, getCreancesComptables, getRapprochements,
  getCompteResultat, getSuspensComptables, getDecisionsComptaDG,
  getReferentielCompta,
  STATUT_ECRITURE_STYLE, STATUT_RAPPROCHEMENT_STYLE,
  type VueComptabiliteDG, type CompteTresorerie, type EcritureJournal,
  type BalanceLigne, type CreanceComptable, type PrevisionTresorerie,
  type RapprochementCompta,
} from '@/lib/comptabilite-dg-builder'

const VUE_TABS: { id: VueComptabiliteDG; label: string; icon: typeof Wallet }[] = [
  { id: 'tresorerie', label: 'Trésorerie & flux', icon: Wallet },
  { id: 'journal', label: 'Journal', icon: Receipt },
  { id: 'balance', label: 'Balance SYSCOHADA', icon: Scale },
  { id: 'creances', label: 'Créances clients', icon: TrendingDown },
  { id: 'resultat', label: 'Compte de résultat', icon: BarChart3 },
  { id: 'rapprochement', label: 'Rapprochements', icon: BookOpen },
]

const ANALYSE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

type DetailType = 'treso' | 'ecriture' | 'balance' | 'creance' | 'prevision' | 'rapprochement' | null

function Sparkline7j({ data, color = 'bg-emerald-400' }: { data: number[]; color?: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return (
    <div className="flex items-end gap-0.5 h-5">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm min-w-[3px] ${color}`}
          style={{ height: `${Math.max(20, ((v - min) / range) * 100)}%` }}
        />
      ))}
    </div>
  )
}

export function ComptabiliteView() {
  const ref = getReferentielCompta()
  const synthese = useMemo(() => buildSyntheseComptabiliteDG(), [])
  const analyses = useMemo(() => buildAnalysesComptabiliteIA(synthese), [synthese])
  const decisions = useMemo(() => getDecisionsComptaDG(), [])
  const suspens = useMemo(() => getSuspensComptables(), [])

  const [vue, setVue] = useState<VueComptabiliteDG>('tresorerie')
  const [detailType, setDetailType] = useState<DetailType>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const comptesTreso = getComptesTresorerie()
  const ecritures = getEcrituresJournal()
  const balance = getBalanceGenerale()
  const previsions = getPrevisionsTresorerie()
  const creances = getCreancesComptables()
  const rapprochements = getRapprochements()
  const resultat = getCompteResultat()

  const select = (type: DetailType, id: string) => {
    setDetailType(type)
    setSelectedId(id)
  }

  const selectedTreso = comptesTreso.find(t => t.id === selectedId) ?? null
  const selectedEcr = ecritures.find(e => e.id === selectedId) ?? null
  const selectedBalance = balance.find(b => b.compte === selectedId) ?? null
  const selectedCreance = creances.find(c => c.client_id === selectedId) ?? null
  const selectedPrev = previsions.find((_, i) => `prev-${i}` === selectedId) ?? null
  const selectedRap = rapprochements.find(r => r.id === selectedId) ?? null

  const ecrituresJour = ecritures.filter(e => e.date === '2026-06-11')

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Comptabilité & Finance"
        subtitle={`Vue DAF — ${ref.norme} · ${ref.entite} · ${ref.periode}`}
        badge={`Clôture J-${synthese.jours_cloture}`}
      />

      {/* KPIs cliquables */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          {
            label: 'Trésorerie consolidée', value: formatFcfa(synthese.tresorerie_totale),
            color: 'text-emerald-700', sub: '3 comptes · banque + caisses',
            onClick: () => { setVue('tresorerie'); setDetailType(null); setSelectedId(null) },
          },
          {
            label: 'Encours clients (411)', value: formatFcfa(synthese.encours_clients),
            color: 'text-amber-700', sub: `${synthese.pct_creances_retard}% > 30j`,
            onClick: () => { setVue('creances'); setDetailType(null); setSelectedId(null) },
          },
          {
            label: 'Créances > 30j', value: formatFcfa(synthese.creances_retard_30j),
            color: 'text-red-600', sub: 'Kiosque + Adidogomé',
            onClick: () => { setVue('creances'); const k = creances.find(c => c.jours_retard > 30); if (k) select('creance', k.client_id) },
          },
          {
            label: 'Écritures du jour', value: String(synthese.ecritures_jour),
            color: 'text-violet-700', sub: `${ecritures.length} sur la période`,
            onClick: () => { setVue('journal'); setDetailType(null); setSelectedId(null) },
          },
          {
            label: 'Marge brute', value: `${synthese.marge_brute_pct}%`,
            color: synthese.marge_brute_pct < 25 ? 'text-orange-600' : 'text-emerald-600',
            sub: 'Objectif 25%',
            onClick: () => { setVue('resultat'); setDetailType(null); setSelectedId(null) },
          },
          {
            label: 'Résultat net (mois)', value: formatFcfa(synthese.resultat_net_mois),
            color: 'text-slate-900', sub: 'Avant impôts',
            onClick: () => { setVue('resultat'); setDetailType(null); setSelectedId(null) },
          },
          {
            label: 'Rapprochements', value: `${synthese.rapprochement_pct}%`,
            color: 'text-blue-700', sub: 'Banque + caisses',
            onClick: () => { setVue('rapprochement'); setDetailType(null); setSelectedId(null) },
          },
          {
            label: 'Suspens critiques', value: String(synthese.suspens_critiques),
            color: synthese.suspens_critiques > 0 ? 'text-red-600' : 'text-emerald-600',
            sub: `${synthese.ecritures_attente} écriture attente`,
            onClick: () => { const e = ecritures.find(x => x.statut === 'ATTENTE_VALIDATION'); if (e) { setVue('journal'); select('ecriture', e.id) } },
          },
        ].map((k, i) => (
          <button key={i} type="button" onClick={k.onClick}
            className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-left hover:border-amber-300 hover:shadow-md transition-all">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-sm font-black mt-0.5 ${k.color}`}>{k.value}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">{k.sub}</div>
          </button>
        ))}
      </div>

      {/* Synthèse DAF + suspens */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} className="text-violet-600" />
            <span className="text-sm font-bold text-violet-900">DAF Copilot — synthèse exécutive</span>
          </div>
          <p className="text-sm text-violet-900 leading-relaxed">
            Trésorerie {formatFcfa(synthese.tresorerie_totale)} stable. Pic sortie <strong>J+5</strong> (réappro huile 5L + riz maritime, -28,6 M).
            Créances &gt; 30j = <strong>{synthese.pct_creances_retard}%</strong> du poste client ({formatFcfa(synthese.creances_retard_30j)}).
            Marge brute <strong>{synthese.marge_brute_pct}%</strong> sous objectif. Provision Kiosque 1,42 M en attente validation DG.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-900">Suspens & points d&apos;attention</span>
          </div>
          <div className="space-y-1.5">
            {suspens.map(s => (
              <div key={s.id} className={`text-xs p-2 rounded-lg ${s.statut === 'CRITIQUE' ? 'bg-red-100 text-red-800' : 'bg-white text-amber-800'}`}>
                <span className="font-bold">{s.libelle}</span> — {formatFcfa(s.montant)} · {s.action}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Décisions DG */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-amber-600" />
          <h3 className="text-sm font-bold text-slate-800">5 décisions DG — comptabilité & trésorerie</h3>
        </div>
        <div className="grid md:grid-cols-5 gap-2">
          {decisions.map(d => (
            <div key={d.priorite} className="border border-slate-100 rounded-lg p-3 text-xs hover:border-amber-200 transition-colors">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-black text-[10px] flex items-center justify-center mb-1.5">{d.priorite}</div>
              <div className="font-bold text-slate-800">{d.titre}</div>
              <div className="text-slate-500 mt-1">{d.impact}</div>
              <div className="text-amber-700 font-semibold mt-1.5">→ {d.decision}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Onglets + contenu principal */}
      <div className="flex flex-wrap gap-1.5">
        {VUE_TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} type="button" onClick={() => { setVue(t.id); setDetailType(null); setSelectedId(null) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${vue === t.id ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <Icon size={13} /> {t.label}
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">

          {/* TRÉSORERIE */}
          {vue === 'tresorerie' && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Comptes de trésorerie — cliquez pour le détail</h3>
                  <span className="text-xs text-slate-400">Total {formatFcfa(synthese.tresorerie_totale)}</span>
                </div>
                {comptesTreso.map(t => (
                  <button key={t.id} type="button" onClick={() => select('treso', t.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${selectedId === t.id && detailType === 'treso' ? 'bg-emerald-50 border-l-4 border-l-emerald-400' : ''}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <Wallet size={16} className={t.type === 'BANQUE' ? 'text-blue-600' : 'text-emerald-600'} />
                      <span className="font-semibold text-sm flex-1 min-w-[180px]">{t.libelle}</span>
                      {t.entrepot && <span className="text-[10px] text-slate-400">{t.entrepot}</span>}
                      <span className="font-black text-sm text-emerald-700 w-28 text-right">{formatFcfa(t.solde)}</span>
                      <span className="text-[10px] text-emerald-600 w-24 text-right flex items-center justify-end gap-0.5">
                        <ArrowUpRight size={10} /> +{formatFcfa(t.entrees_jour)}
                      </span>
                      <span className="text-[10px] text-red-500 w-24 text-right flex items-center justify-end gap-0.5">
                        <ArrowDownRight size={10} /> -{formatFcfa(t.sorties_jour)}
                      </span>
                      <div className="w-20 hidden sm:block"><Sparkline7j data={t.evolution_7j} /></div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">Prévision flux 7 jours — cliquez un jour</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="text-left p-2.5">Date</th>
                        <th className="text-right p-2.5">Entrées</th>
                        <th className="text-right p-2.5">Sorties</th>
                        <th className="text-right p-2.5">Solde fin</th>
                        <th className="text-left p-2.5">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previsions.map((p, i) => (
                        <tr key={i} onClick={() => select('prevision', `prev-${i}`)}
                          className={`border-t border-slate-50 cursor-pointer hover:bg-slate-50 ${selectedId === `prev-${i}` && detailType === 'prevision' ? 'bg-amber-50' : ''} ${p.alerte ? 'bg-red-50/50' : ''}`}>
                          <td className="p-2.5 font-medium">{p.date}</td>
                          <td className="p-2.5 text-right text-emerald-600">+{formatFcfa(p.entrees)}</td>
                          <td className="p-2.5 text-right text-red-600">-{formatFcfa(p.sorties)}</td>
                          <td className="p-2.5 text-right font-bold">{formatFcfa(p.solde_fin)}</td>
                          <td className="p-2.5 text-slate-500">
                            {p.alerte && <AlertTriangle size={11} className="inline text-red-500 mr-1" />}
                            {p.commentaire ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* JOURNAL */}
          {vue === 'journal' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Journal comptable — {ecrituresJour.length} écritures aujourd&apos;hui</h3>
                <span className="text-[10px] text-slate-400">VT ventes · BQ banque · AC achats · OD divers · CA caisse</span>
              </div>
              {ecritures.map(e => (
                <button key={e.id} type="button" onClick={() => select('ecriture', e.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${selectedId === e.id && detailType === 'ecriture' ? 'bg-violet-50 border-l-4 border-l-violet-400' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 w-20">{e.date}</span>
                    <span className="text-[10px] font-bold text-violet-600 w-8">{e.journal}</span>
                    <span className="font-mono text-[10px] w-24">{e.piece}</span>
                    <span className="font-medium text-sm flex-1 min-w-[160px]">{e.libelle}</span>
                    <span className="font-bold text-sm w-24 text-right">{formatFcfa(e.montant)}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUT_ECRITURE_STYLE[e.statut]}`}>{e.statut.replace(/_/g, ' ')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* BALANCE */}
          {vue === 'balance' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Balance générale — {ref.norme}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left p-2.5">Compte</th>
                      <th className="text-left p-2.5">Libellé</th>
                      <th className="text-right p-2.5">Débit mois</th>
                      <th className="text-right p-2.5">Crédit mois</th>
                      <th className="text-right p-2.5">Solde</th>
                      <th className="text-center p-2.5">Sens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.map(b => (
                      <tr key={b.compte} onClick={() => select('balance', b.compte)}
                        className={`border-t border-slate-50 cursor-pointer hover:bg-slate-50 ${selectedId === b.compte && detailType === 'balance' ? 'bg-blue-50' : ''}`}>
                        <td className="p-2.5 font-mono font-bold">{b.compte}</td>
                        <td className="p-2.5">
                          {b.libelle}
                          {b.alerte && <span className="block text-[9px] text-red-600 mt-0.5">{b.alerte}</span>}
                        </td>
                        <td className="p-2.5 text-right">{b.debit_mois > 0 ? formatFcfa(b.debit_mois) : '—'}</td>
                        <td className="p-2.5 text-right">{b.credit_mois > 0 ? formatFcfa(b.credit_mois) : '—'}</td>
                        <td className="p-2.5 text-right font-bold">{formatFcfa(b.solde)}</td>
                        <td className="p-2.5 text-center font-bold">{b.sens}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CRÉANCES */}
          {vue === 'creances' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Poste clients 411 — détail auxiliaire</h3>
                <span className="text-xs text-red-600 font-bold">Total {formatFcfa(synthese.encours_clients)}</span>
              </div>
              {creances.map(c => (
                <button key={c.client_id} type="button" onClick={() => select('creance', c.client_id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${selectedId === c.client_id && detailType === 'creance' ? 'bg-red-50 border-l-4 border-l-red-400' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 w-16">{c.compte_aux}</span>
                    <span className="font-semibold text-sm flex-1 min-w-[140px]">{c.client_nom}</span>
                    <span className="text-[10px] text-slate-400">{c.commercial}</span>
                    <span className="font-bold text-sm w-24 text-right">{formatFcfa(c.reste)}</span>
                    <span className={`text-xs w-12 text-center font-bold ${c.jours_retard > 30 ? 'text-red-600' : c.jours_retard > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {c.jours_retard > 0 ? `${c.jours_retard}j` : '—'}
                    </span>
                    {c.provision_pct > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">Prov. {c.provision_pct}%</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* RÉSULTAT */}
          {vue === 'resultat' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Compte de résultat simplifié — Juin 2026</h3>
              <div className="space-y-1">
                {resultat.map((l, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs ${
                    l.section === 'MARGE' ? 'bg-emerald-50 font-bold' :
                    l.section === 'RESULTAT' ? 'bg-amber-50 font-black text-base py-3' :
                    l.section === 'PRODUITS' ? 'text-emerald-700' : 'text-slate-700'
                  }`}>
                    <span>{l.libelle}</span>
                    <div className="flex gap-6 text-right">
                      <span className="w-28 font-bold">{formatFcfa(l.montant_mois)}</span>
                      <span className="w-28 text-slate-400">YTD {formatFcfa(l.montant_ytd)}</span>
                      {l.pct_ca != null && <span className="w-12 text-slate-400">{l.pct_ca}% CA</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RAPPROCHEMENT */}
          {vue === 'rapprochement' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Rapprochements bancaires & caisses</h3>
              </div>
              {rapprochements.map(r => (
                <button key={r.id} type="button" onClick={() => select('rapprochement', r.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${selectedId === r.id && detailType === 'rapprochement' ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <BookOpen size={14} className="text-blue-600" />
                    <span className="font-semibold text-sm flex-1">{r.banque}</span>
                    <span className="font-mono text-[10px]">{r.compte}</span>
                    <span className="text-xs">Compta {formatFcfa(r.solde_comptable)}</span>
                    <span className="text-xs">Relevé {formatFcfa(r.solde_releve)}</span>
                    <span className={`text-xs font-bold ${r.ecart === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      Écart {formatFcfa(r.ecart)}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUT_RAPPROCHEMENT_STYLE[r.statut]}`}>{r.statut}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar analyses IA */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-900">DAF Copilot — analyses</h3>
            </div>
            <div className="space-y-2">
              {analyses.map((a, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${ANALYSE_STYLE[a.severite]}`}>
                  <div className="font-bold">{a.titre}</div>
                  <div className="text-[10px] opacity-90 mt-0.5">{a.detail}</div>
                  <div className="text-[10px] font-semibold mt-1 text-slate-700">→ {a.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fiches détaillées au clic */}
      {detailType === 'treso' && selectedTreso && (
        <DetailTresorerie compte={selectedTreso} />
      )}
      {detailType === 'ecriture' && selectedEcr && (
        <DetailEcriture ecriture={selectedEcr} />
      )}
      {detailType === 'balance' && selectedBalance && (
        <DetailBalance ligne={selectedBalance} ecritures={ecritures} />
      )}
      {detailType === 'creance' && selectedCreance && (
        <DetailCreance creance={selectedCreance} />
      )}
      {detailType === 'prevision' && selectedPrev && (
        <DetailPrevision prevision={selectedPrev} />
      )}
      {detailType === 'rapprochement' && selectedRap && (
        <DetailRapprochement rapprochement={selectedRap} />
      )}
    </div>
  )
}

function DetailTresorerie({ compte }: { compte: CompteTresorerie }) {
  return (
    <div className="bg-white rounded-xl border-2 border-emerald-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Wallet size={24} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900">{compte.libelle}</h3>
          <p className="text-sm text-slate-500">{compte.type} {compte.entrepot && `· ${compte.entrepot}`}</p>
        </div>
        <AiBadge variant="small" label="Solde" confidence={95} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {[
          { label: 'Solde actuel', value: formatFcfa(compte.solde), color: 'text-emerald-700' },
          { label: 'Entrées du jour', value: `+${formatFcfa(compte.entrees_jour)}`, color: 'text-emerald-600' },
          { label: 'Sorties du jour', value: `-${formatFcfa(compte.sorties_jour)}`, color: 'text-red-600' },
          { label: 'Flux net jour', value: formatFcfa(compte.entrees_jour - compte.sorties_jour), color: 'text-slate-800' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-2.5">
            <div className="text-slate-400">{k.label}</div>
            <div className={`font-bold text-sm ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Évolution 7 jours (M FCFA)</div>
        <Sparkline7j data={compte.evolution_7j} color="bg-emerald-500" />
        <div className="flex justify-between text-[9px] text-slate-400 mt-1">
          <span>J-6</span><span>Aujourd&apos;hui</span>
        </div>
      </div>
      {compte.alerte && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle size={14} /> {compte.alerte}
        </div>
      )}
    </div>
  )
}

function DetailEcriture({ ecriture }: { ecriture: EcritureJournal }) {
  const totalDebit = ecriture.lignes.reduce((s, l) => s + l.debit, 0)
  const totalCredit = ecriture.lignes.reduce((s, l) => s + l.credit, 0)
  return (
    <div className="bg-white rounded-xl border-2 border-violet-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center">
          <Receipt size={24} className="text-violet-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900">{ecriture.piece}</h3>
          <p className="text-sm text-slate-500">{ecriture.libelle}</p>
          <p className="text-xs text-slate-400 mt-1">Journal {ecriture.journal} · {ecriture.date} · {ecriture.source} · {ecriture.auteur}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-bold h-fit ${STATUT_ECRITURE_STYLE[ecriture.statut]}`}>
          {ecriture.statut.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left p-2.5">Compte</th>
              <th className="text-left p-2.5">Libellé</th>
              <th className="text-right p-2.5">Débit</th>
              <th className="text-right p-2.5">Crédit</th>
            </tr>
          </thead>
          <tbody>
            {ecriture.lignes.map((l, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="p-2.5 font-mono font-bold">{l.compte}</td>
                <td className="p-2.5">{l.libelle}</td>
                <td className="p-2.5 text-right">{l.debit > 0 ? formatFcfa(l.debit) : '—'}</td>
                <td className="p-2.5 text-right">{l.credit > 0 ? formatFcfa(l.credit) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold">
            <tr>
              <td colSpan={2} className="p-2.5 text-right">Totaux</td>
              <td className="p-2.5 text-right">{formatFcfa(totalDebit)}</td>
              <td className="p-2.5 text-right">{formatFcfa(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {ecriture.statut === 'ATTENTE_VALIDATION' && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
          <Clock size={14} />
          Écriture en attente validation DG — impact résultat juin si approuvée ({formatFcfa(ecriture.montant)}).
        </div>
      )}
    </div>
  )
}

function DetailBalance({ ligne, ecritures }: { ligne: BalanceLigne; ecritures: EcritureJournal[] }) {
  const mouvements = ecritures.flatMap(e =>
    e.lignes.filter(l => l.compte.startsWith(ligne.compte.slice(0, 4)) || l.compte === ligne.compte)
      .map(l => ({ ...l, piece: e.piece, date: e.date, libelle_ecriture: e.libelle }))
  )
  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
          <Scale size={24} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900 font-mono">{ligne.compte}</h3>
          <p className="text-sm text-slate-500">Classe {ligne.classe} — {ligne.libelle}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-slate-900">{formatFcfa(ligne.solde)}</div>
          <div className="text-xs text-slate-400">Solde {ligne.sens === 'D' ? 'débiteur' : 'créditeur'}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {[
          { label: 'Débit du mois', value: formatFcfa(ligne.debit_mois) },
          { label: 'Crédit du mois', value: formatFcfa(ligne.credit_mois) },
          { label: 'Variation', value: ligne.variation_pct != null ? `${ligne.variation_pct > 0 ? '+' : ''}${ligne.variation_pct}%` : '—' },
          { label: 'Sens', value: ligne.sens },
        ].map((k, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-2.5">
            <div className="text-slate-400">{k.label}</div>
            <div className="font-bold">{k.value}</div>
          </div>
        ))}
      </div>
      {ligne.alerte && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle size={14} /> {ligne.alerte}
        </div>
      )}
      {mouvements.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Mouvements récents sur ce compte</div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Pièce</th>
                  <th className="text-left p-2">Libellé</th>
                  <th className="text-right p-2">Débit</th>
                  <th className="text-right p-2">Crédit</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map((m, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-2">{m.date}</td>
                    <td className="p-2 font-mono">{m.piece}</td>
                    <td className="p-2">{m.libelle}</td>
                    <td className="p-2 text-right">{m.debit > 0 ? formatFcfa(m.debit) : '—'}</td>
                    <td className="p-2 text-right">{m.credit > 0 ? formatFcfa(m.credit) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailCreance({ creance }: { creance: CreanceComptable }) {
  return (
    <div className="bg-white rounded-xl border-2 border-red-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
          <Building2 size={24} className="text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900">{creance.client_nom}</h3>
          <p className="text-sm text-slate-500">Compte auxiliaire {creance.compte_aux} · Commercial {creance.commercial}</p>
        </div>
        <AiBadge variant="small" label="Risque" confidence={creance.provision_pct > 30 ? 85 : 60} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        {[
          { label: 'Montant facturé', value: formatFcfa(creance.montant) },
          { label: 'Encaissé', value: formatFcfa(creance.paye), color: 'text-emerald-600' },
          { label: 'Reste dû', value: formatFcfa(creance.reste), color: 'text-red-600' },
          { label: 'Retard', value: creance.jours_retard > 0 ? `${creance.jours_retard} jours` : 'À jour', color: creance.jours_retard > 30 ? 'text-red-600' : undefined },
          { label: 'Provision proposée', value: creance.provision_pct > 0 ? `${creance.provision_pct}% (${formatFcfa(Math.round(creance.reste * creance.provision_pct / 100))})` : 'Aucune' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-2.5">
            <div className="text-slate-400">{k.label}</div>
            <div className={`font-bold ${k.color ?? ''}`}>{k.value}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Factures liées</div>
        <div className="flex flex-wrap gap-2">
          {creance.factures.map(f => (
            <span key={f} className="text-xs font-mono bg-slate-100 px-2 py-1 rounded-lg">{f}</span>
          ))}
        </div>
      </div>
      {creance.jours_retard > 30 && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle size={14} />
          Créance en retard critique — aligner comptabilité (provision) + pipeline relances + blocage crédit.
        </div>
      )}
    </div>
  )
}

function DetailPrevision({ prevision }: { prevision: PrevisionTresorerie }) {
  const net = prevision.entrees - prevision.sorties
  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center">
          <Calendar size={24} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900">Flux trésorerie — {prevision.date}</h3>
          {prevision.commentaire && <p className="text-sm text-slate-500">{prevision.commentaire}</p>}
        </div>
        {prevision.alerte && <AlertTriangle size={20} className="text-red-500" />}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {[
          { label: 'Entrées prévues', value: `+${formatFcfa(prevision.entrees)}`, color: 'text-emerald-600', icon: ArrowUpRight },
          { label: 'Sorties prévues', value: `-${formatFcfa(prevision.sorties)}`, color: 'text-red-600', icon: ArrowDownRight },
          { label: 'Flux net', value: formatFcfa(net), color: net >= 0 ? 'text-emerald-700' : 'text-red-700' },
          { label: 'Solde fin de journée', value: formatFcfa(prevision.solde_fin), color: 'text-slate-900' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-2.5">
            <div className="text-slate-400 flex items-center gap-1">{k.icon && <k.icon size={10} />} {k.label}</div>
            <div className={`font-bold text-sm ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>
      {prevision.alerte && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <strong>Alerte DAF Copilot :</strong> Pic de sortie ce jour — réapprovisionnement huile 5L et riz maritime.
          Anticiper négociation délai fournisseur ou report commandes non critiques.
        </div>
      )}
    </div>
  )
}

function DetailRapprochement({ rapprochement }: { rapprochement: RapprochementCompta }) {
  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
          {rapprochement.statut === 'POINTE'
            ? <CheckCircle2 size={24} className="text-emerald-600" />
            : <BookOpen size={24} className="text-blue-600" />}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900">{rapprochement.banque}</h3>
          <p className="text-sm text-slate-500">Compte {rapprochement.compte} · Période {rapprochement.periode}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-bold h-fit ${STATUT_RAPPROCHEMENT_STYLE[rapprochement.statut]}`}>
          {rapprochement.statut}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {[
          { label: 'Solde comptable', value: formatFcfa(rapprochement.solde_comptable) },
          { label: 'Solde relevé', value: formatFcfa(rapprochement.solde_releve) },
          { label: 'Écart', value: formatFcfa(rapprochement.ecart), color: rapprochement.ecart === 0 ? 'text-emerald-600' : 'text-red-600' },
          { label: 'Opérations non pointées', value: String(rapprochement.operations_non_pointees) },
        ].map((k, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-2.5">
            <div className="text-slate-400">{k.label}</div>
            <div className={`font-bold ${k.color ?? ''}`}>{k.value}</div>
          </div>
        ))}
      </div>
      {rapprochement.ecart > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle size={14} />
          Écart de {formatFcfa(rapprochement.ecart)} — {rapprochement.operations_non_pointees} opération(s) à pointer sous 48h.
        </div>
      )}
    </div>
  )
}
