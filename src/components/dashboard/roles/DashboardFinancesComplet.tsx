'use client'
import { useState } from 'react'
import { CheckCircle, AlertTriangle, Download, RefreshCw, MessageSquare, Phone, Trophy, Smartphone, ArrowRight, TrendingUp, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { MOCK_FINANCES, OBJECTIFS_FINANCES } from '@/lib/mockDataByRole'
import { AGENCES } from '@/lib/agences'
import { AiBadge } from '../AiBadge'
import { KpiCard } from '../KpiCard'
import { formatFcfa } from '@/lib/utils'
import { ObjectifsPanel } from '../ObjectifsPanel'

const STRATEGIE_INFO: Record<string, { label: string; color: string; icon: typeof MessageSquare }> = {
  ESCALADE: { label: 'Escalade direction', color: 'bg-red-100 text-red-700',      icon: AlertTriangle },
  VISITE:   { label: 'Visite terrain',    color: 'bg-blue-100 text-blue-700',     icon: Phone },
  FERME:    { label: 'Relance ferme',     color: 'bg-orange-100 text-orange-700', icon: MessageSquare },
  DOUX:     { label: 'Rappel doux',       color: 'bg-slate-100 text-slate-600',   icon: MessageSquare },
}

const STATUT_TX: Record<string, string> = {
  RECONCILIEE: 'bg-green-100 text-green-700',
  A_VALIDER:   'bg-orange-100 text-orange-700',
  EN_ATTENTE:  'bg-blue-100 text-blue-700',
}

const BADGE_STYLE: Record<string, string> = {
  OR:     'bg-yellow-100 text-yellow-700 border-yellow-300',
  ARGENT: 'bg-slate-200 text-slate-600 border-slate-300',
  BRONZE: 'bg-orange-100 text-orange-700 border-orange-300',
}

export function DashboardFinancesComplet() {
  const d = MOCK_FINANCES
  const [onglet, setOnglet] = useState<'relance' | 'compta' | 'paie'>('relance')

  const pct_recouvrement = Math.round((d.kpis.encaisse_mois / d.kpis.creances_total) * 100)

  return (
    <div className="space-y-5">
      <ObjectifsPanel objectifs={OBJECTIFS_FINANCES} prenom="Ama" />


      {/* ── KPIs globaux ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Encaissé ce mois" value={formatFcfa(d.kpis.encaisse_mois)}
          icon={CheckCircle} colorScheme="teal"
          subtext={`${pct_recouvrement}% du total attendu`} />
        <KpiCard title="En retard / impayé" value={formatFcfa(d.kpis.en_retard)}
          icon={AlertTriangle} colorScheme="red"
          subtext={`${d.kpis.relances_en_attente} relances actives`} />
        <KpiCard title="Réconciliation MoMo" value={`${d.kpis.reconciliees_auto}/${d.kpis.transactions_momo}`}
          icon={RefreshCw} colorScheme="blue"
          subtext={`${d.kpis.a_valider_manuellement} à valider manuellement`} />
        <KpiCard title="Commissions agents" value={formatFcfa(d.kpis.commissions_mois)}
          icon={Trophy} colorScheme="orange"
          subtext={`Masse salariale : ${formatFcfa(d.kpis.masse_salariale)}`} />
      </div>

      {/* ── Barre progression recouvrement ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Recouvrement global — Mai 2026</h3>
          <div className="flex items-center gap-2">
          <AiBadge variant="small" label="Réconciliation auto" confidence={97} />
          <button className="flex items-center gap-1.5 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-teal-700 transition-colors">
            <Download size={12} /> Export SAGE ({d.kpis.export_sage_statut})
          </button>
        </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600">{formatFcfa(d.kpis.encaisse_mois)} encaissés</span>
              <span className="font-bold text-teal-700">{pct_recouvrement}%</span>
            </div>
            <div className="bg-slate-100 rounded-full h-4">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct_recouvrement}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Total créances : {formatFcfa(d.kpis.creances_total)}</span>
              <span className="text-red-600">En retard : {formatFcfa(d.kpis.en_retard)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Onglets Relance / Comptabilité / Paie ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          {([
            { id: 'relance', label: '🔔 Recouvrement', count: d.kpis.relances_en_attente },
            { id: 'compta',  label: '🧾 Comptabilité',  count: d.kpis.a_valider_manuellement },
            { id: 'paie',    label: '💰 Paie & KPIs',   count: d.kpis.agents_actifs_paie },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setOnglet(t.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${onglet === t.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t.label}
              {t.count > 0 && (
                <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ${onglet === t.id ? 'bg-white text-teal-700' : 'bg-red-500 text-white'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── ONGLET RELANCE ── */}
        {onglet === 'relance' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-8 space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">File de relances — stratégie IA dynamique</h3>
                {d.relances_actives.map(r => {
                  const strat = STRATEGIE_INFO[r.strategie]
                  const Icon = strat.icon
                  return (
                    <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow ${r.strategie === 'ESCALADE' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: r.score < 30 ? '#fee2e2' : r.score < 50 ? '#ffedd5' : r.score < 70 ? '#fef9c3' : '#f0fdf4', color: r.score < 30 ? '#b91c1c' : r.score < 50 ? '#c2410c' : r.score < 70 ? '#854d0e' : '#15803d' }}>
                        {r.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">{r.nom}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${strat.color}`}>{strat.label}</span>
                          <span className="text-xs text-red-600 font-bold">J+{r.retard}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                          <span>Éch. due : <span className="font-medium text-slate-700">{formatFcfa(r.montant_du)}</span></span>
                          <span>Crédit total : {formatFcfa(r.montant_credit)}</span>
                          <span>Via : {r.canal}</span>
                        </div>
                        {r.message_wa && <p className="text-xs text-green-700 font-medium mt-0.5">💬 {r.message_wa}</p>}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                          Envoyer WA
                        </button>
                        {(r.canal === 'WhatsApp' || r.canal === 'MTN MoMo' || r.score < 60) && (
                          <button className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                            <Smartphone size={10} /> Lien MoMo
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="col-span-12 lg:col-span-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Taux de réponse par canal</h3>
                {d.stats_canaux_relance.map(c => (
                  <div key={c.canal} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{c.canal}</span>
                      <span className="text-teal-600 font-bold">{c.taux}%</span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-2">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${c.taux}%` }} />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{c.reponses}/{c.envoyes} · Optimal : {c.meilleures_heures}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Stratégie de relance IA dynamique ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stratégie de relance IA dynamique — Situation → Action</h3>
                <AiBadge variant="small" label="Décision auto" confidence={87} />
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-medium">Situation détectée</th>
                      <th className="text-left px-3 py-2.5 font-medium">Action IA</th>
                      <th className="text-left px-3 py-2.5 font-medium">Canal</th>
                      <th className="text-center px-3 py-2.5 font-medium">Escalade</th>
                      <th className="text-center px-3 py-2.5 font-medium">Auto</th>
                      <th className="text-right px-3 py-2.5 font-medium">Taux succès</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {d.relance_strategie_ia.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-slate-700">{s.situation}</td>
                        <td className="px-3 py-2.5 text-slate-600">{s.action}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded font-medium ${s.canal.includes('WhatsApp') ? 'bg-green-100 text-green-700' : s.canal.includes('SMS') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {s.canal}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">{s.escalade ? <span className="text-orange-600 font-bold">Oui</span> : <span className="text-slate-400">—</span>}</td>
                        <td className="px-3 py-2.5 text-center">{s.automatique ? <span className="text-teal-600 font-bold">✓ IA</span> : <span className="text-slate-400">Manuel</span>}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`font-bold ${s.taux_succes >= 70 ? 'text-green-600' : s.taux_succes >= 45 ? 'text-orange-600' : 'text-red-600'}`}>{s.taux_succes}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Changement de canal IA ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Changement de canal intelligent — historique tentatives</h3>
                <AiBadge variant="small" label="Escalade auto IA" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {d.changement_canal_ia.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs font-semibold text-slate-800 mb-2">{c.emprunteur}</div>
                    <div className="space-y-1">
                      {c.tentatives.map((t, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.statut === 'ECHEC' ? 'bg-red-400' : t.statut === 'SANS_REPONSE' ? 'bg-orange-400' : 'bg-teal-400'}`} />
                          <span className="font-medium text-slate-600">{t.canal}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${t.statut === 'ECHEC' ? 'bg-red-100 text-red-600' : t.statut === 'EN_ATTENTE' ? 'bg-teal-100 text-teal-700 font-bold' : 'bg-orange-100 text-orange-600'}`}>{t.statut}</span>
                          <span className="text-slate-400 ml-auto">{t.heure}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ONGLET COMPTABILITÉ ── */}
        {onglet === 'compta' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Flux de trésorerie */}
              <div className="col-span-12 lg:col-span-8">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Flux de trésorerie — 7 derniers jours</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={d.flux_tresorerie} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatFcfa(Number(v))} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="recu" name="Reçu" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="retard" name="En retard" fill="#f97316" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Créances statuts */}
              <div className="col-span-12 lg:col-span-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Créances par statut</h3>
                <div className="space-y-2">
                  {d.creances_par_statut.map(c => (
                    <div key={c.statut} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{c.statut}</span>
                          <span className="font-bold text-slate-700">{c.count}</span>
                        </div>
                        <div className="text-xs text-slate-400">{formatFcfa(c.montant)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions MoMo */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Transactions Mobile Money récentes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-100">
                      <th className="text-left px-3 py-2.5 font-medium">Emprunteur</th>
                      <th className="text-right px-3 py-2.5 font-medium">Montant</th>
                      <th className="text-left px-3 py-2.5 font-medium">Canal</th>
                      <th className="text-left px-3 py-2.5 font-medium">Réf. MoMo</th>
                      <th className="text-left px-3 py-2.5 font-medium">Statut</th>
                      <th className="text-right px-3 py-2.5 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {d.transactions_momo_recentes.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-slate-800">{t.emprunteur}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-700">{formatFcfa(t.montant)}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">{t.canal}</td>
                        <td className="px-3 py-2.5 text-xs font-mono text-slate-400">{t.ref_momo ?? '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_TX[t.statut] ?? 'bg-slate-100 text-slate-500'}`}>{t.statut.replace('_', ' ')}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-slate-400">{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Répartition canaux */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {d.repartition_paiements.map(c => (
                  <div key={c.canal} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-lg font-bold text-slate-700">{c.pct}%</div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">{c.canal}</div>
                    <div className="text-xs text-slate-400">{c.transactions} tx · {formatFcfa(c.montant)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ONGLET PAIE ── */}
        {onglet === 'paie' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Performance agents — Mai 2026</h3>
                <AiBadge variant="small" label="GPS validé seulement" />
              </div>
              <span className="text-xs text-slate-500">Données objectives · non déclaratives</span>
            </div>
            <div className="space-y-3">
              {d.agents_paie.map(a => (
                <div key={a.rang} className={`p-4 rounded-xl border ${a.rang === 1 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'} shadow-sm`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      a.rang === 1 ? 'bg-yellow-400 text-white' : a.rang === 2 ? 'bg-slate-400 text-white' : a.rang === 3 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>{a.rang}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{a.agent}</span>
                        {a.badge && <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${BADGE_STYLE[a.badge]}`}>{a.badge}</span>}
                        <span className="text-xs text-slate-400">{a.zone}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-teal-700">{formatFcfa(a.commission)}</div>
                      <div className="text-xs text-green-600">+{formatFcfa(a.prime_qualite)} qualité</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Visites GPS', val: a.visites_gps, obj: a.visites_obj },
                      { label: 'Collecte', val: Math.round((a.collecte / a.collecte_obj) * 100), obj: 100, unit: '%' },
                      { label: 'Recouvrement', val: a.recouvrement, obj: 100, unit: '%' },
                      { label: 'Prospects', val: a.prospects, obj: 15 },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">{m.label}</span>
                          <span className="font-bold text-slate-700">{m.val}{m.unit ?? ''}</span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-2">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min((m.val / m.obj) * 100, 100)}%`,
                            backgroundColor: m.val >= m.obj * 0.9 ? '#16a34a' : m.val >= m.obj * 0.7 ? '#f97316' : '#dc2626'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Objectifs multi-niveaux ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-indigo-600" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Objectifs multi-niveaux — Mensuel · Trimestriel · Annuel</h3>
                <AiBadge variant="small" label="Suivi IA" />
              </div>
              <div className="space-y-4">
                {d.objectifs_agents_multiniveaux.map((ag, i) => (
                  <div key={ag.agent} className={`p-4 rounded-xl border ${i === 1 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`text-sm font-bold ${i === 1 ? 'text-red-700' : 'text-slate-700'}`}>{ag.agent}</div>
                      <span className="text-xs text-slate-400">— {ag.agence}</span>
                      {i === 1 && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold ml-auto">COACHING REQUIS</span>}
                    </div>
                    {[
                      { label: 'Mensuel', data: ag.mensuel, color: 'text-blue-700' },
                      { label: 'Trimestriel', data: ag.trimestriel, color: 'text-purple-700' },
                      { label: 'Annuel', data: ag.annuel, color: 'text-teal-700' },
                    ].map(niveau => (
                      <div key={niveau.label} className="mb-2">
                        <div className={`text-[10px] font-bold ${niveau.color} uppercase mb-1.5`}>{niveau.label}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {niveau.data.map(obj => (
                            <div key={obj.kpi} className={`p-2 rounded-lg text-center ${obj.statut === 'CRITIQUE' ? 'bg-red-100' : obj.statut === 'EN_AVANCE' ? 'bg-green-100' : obj.statut === 'EN_RETARD' ? 'bg-orange-100' : 'bg-white'}`}>
                              <div className={`text-sm font-bold ${obj.statut === 'CRITIQUE' ? 'text-red-700' : obj.statut === 'EN_AVANCE' ? 'text-green-700' : obj.statut === 'EN_RETARD' ? 'text-orange-700' : 'text-slate-700'}`}>{obj.pct}%</div>
                              <div className="text-[10px] text-slate-500 leading-tight">{obj.kpi}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
