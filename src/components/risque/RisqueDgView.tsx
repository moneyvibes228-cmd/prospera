'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, AlertTriangle, TrendingDown, Layers, Users, FileWarning,
  ArrowRight, LayoutDashboard, Scale,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getRisqueHub } from '@/lib/risque-hub'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { RisqueTables } from '@/components/risque/RisqueTables'
import { formatFcfa, cn } from '@/lib/utils'

type Tab = 'clients' | 'dossiers'

export function RisqueDgView() {
  const hub = getRisqueHub()
  const [tab, setTab] = useState<Tab>('clients')
  const el = hub.el_vs_provisions

  const chartData = el.evolution_6m.map(e => ({
    mois: e.mois.replace(' 26', ''),
    EL: e.el / 1_000_000,
    Provisions: e.provisions / 1_000_000,
  }))

  return (
    <PageWrapper
      title="Analyse risque & PAR"
      subtitle="Profondeur analytique · Décisions DG · Complément du tableau de bord"
      actions={<ExportButton label="Exporter analyse risque" filename="analyse_risque_dg" size="sm" />}
    >
      {/* Lien dashboard — pas de duplication KPIs */}
      <Link
        href="/dashboard"
        className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-colors cursor-pointer group"
      >
        <LayoutDashboard size={20} className="text-teal-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 group-hover:text-teal-800">
            Indicateurs synthétiques sur le Tableau de bord
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            PAR {hub.reference_dashboard.par_30_reseau} % · Encours {formatFcfa(hub.reference_dashboard.encours_total_fcfa)} · Évolution mensuelle — cette page approfondit l&apos;analyse, sans répéter les KPIs.
          </div>
        </div>
        <ArrowRight size={16} className="text-slate-400 group-hover:text-teal-600 shrink-0" />
      </Link>

      {/* Memo DG */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={18} className="text-red-700" />
          <h2 className="text-sm font-bold text-slate-900">Memo risque — lecture DG</h2>
          <AiBadge variant="small" label="Analyse approfondie" />
        </div>
        <p className="text-sm text-slate-800 leading-relaxed">{hub.synthese_memo}</p>
      </div>

      {/* Expected Loss vs Provisions — unique to this page */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Expected Loss vs Provisions constituées</h3>
          </div>
          {el.ecart_fcfa > 0 && (
            <span className="text-xs font-semibold text-red-800 bg-red-100 px-3 py-1 rounded-lg">
              Écart {formatFcfa(el.ecart_fcfa)} à combler
            </span>
          )}
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-600 mb-4">
            L&apos;Expected Loss (EL) est la perte probable du portefeuille selon le modèle CBI v5.
            Si les provisions comptables sont inférieures à l&apos;EL, le bilan est techniquement surévalué — point de vigilance BCEAO.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-5">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Expected Loss</div>
              <div className="text-xl font-black text-red-700">{formatFcfa(el.el_total_fcfa)}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Provisions</div>
              <div className="text-xl font-black text-slate-900">{formatFcfa(el.provisions_constituees_fcfa)}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Couverture EL</div>
              <div className={cn('text-xl font-black', el.couverture_pct >= 100 ? 'text-emerald-600' : 'text-amber-600')}>
                {el.couverture_pct} %
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" M" />
              <Tooltip formatter={(v) => `${Number(v).toFixed(2)} M FCFA`} />
              <Legend />
              <Bar dataKey="EL" name="Expected Loss" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Provisions" name="Provisions" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <ReferenceLine y={el.el_total_fcfa / 1_000_000} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'EL actuel', fontSize: 9, position: 'right' }} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase text-slate-500 border-b">
                  <th className="py-2 font-bold">Agence</th>
                  <th className="py-2 font-bold text-right">EAD</th>
                  <th className="py-2 font-bold text-right">EL</th>
                  <th className="py-2 font-bold text-right">EL %</th>
                </tr>
              </thead>
              <tbody>
                {el.par_agence.map(a => (
                  <tr key={a.agence} className={cn('border-b border-slate-50', a.el_pct > 5 && 'bg-red-50/40')}>
                    <td className="py-2 font-medium">{a.nom}</td>
                    <td className="py-2 text-right">{formatFcfa(a.ead)}</td>
                    <td className="py-2 text-right font-bold text-red-700">{formatFcfa(a.el)}</td>
                    <td className={cn('py-2 text-right font-bold', a.el_pct > 5 ? 'text-red-600' : 'text-slate-700')}>{a.el_pct} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Entonnoir aging */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Layers size={16} className="text-orange-600" />
          <h3 className="text-sm font-semibold text-slate-900">Entonnoir aging — migration du portefeuille</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-600 mb-4">
            Visualisez comment l&apos;encours se répartit par tranche de retard. L&apos;enjeu DG : limiter la migration vers J+30 (seuil BCEAO) et J+90 (contentieux).
          </p>
          <div className="space-y-2">
            {hub.aging_entonnoir.map((t, i) => {
              const isRisk = i >= 3
              return (
                <div key={t.tranche} className={cn('flex items-center gap-3 p-2 rounded-lg', isRisk && 'bg-red-50/50')}>
                  <div className="w-24 text-xs font-bold text-slate-700 shrink-0">{t.tranche}</div>
                  <div className="flex-1">
                    <div className="h-6 bg-slate-100 rounded-md overflow-hidden">
                      <div
                        className={cn('h-full rounded-md transition-all', isRisk ? 'bg-red-500' : i >= 2 ? 'bg-orange-400' : 'bg-emerald-500')}
                        style={{ width: `${Math.max(t.pct, 2)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-xs font-bold">{t.pct} %</div>
                  <div className="w-24 text-right text-xs text-slate-600">{t.count} doss.</div>
                  <div className="w-28 text-right text-xs font-medium hidden lg:block">{formatFcfa(t.encours_fcfa)}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-2">
            {hub.aging_entonnoir.filter((_, i) => i >= 2).map(t => (
              <div key={t.tranche} className="text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                <strong>{t.tranche} :</strong> {t.description}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risques structurels + scénarios */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Concentrations & alertes structurelles</h3>
          </div>
          <div className="space-y-2">
            {hub.concentrations.map(c => (
              <div key={c.cible} className={cn('p-3 rounded-lg border text-xs', c.alerte === 'CRITIQUE' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{c.type} — {c.cible}</span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', c.alerte === 'CRITIQUE' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900')}>{c.alerte}</span>
                </div>
                <div className="text-slate-600 mt-1">{c.metrique} : {c.valeur} (seuil {c.seuil})</div>
              </div>
            ))}
            {hub.hausses_defauts.map(h => (
              <div key={h.agent} className="p-3 rounded-lg border border-red-200 bg-red-50/50 text-xs">
                <strong>{h.agence}</strong> — {h.agent} : +{h.variation_pct} % défauts ({h.periode})
                <div className="text-slate-600 mt-0.5">{h.commentaire}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Scénarios PAR — prévisions IA</h3>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Deux trajectoires possibles selon l&apos;exécution des actions P1. Le tableau de bord affiche la tendance ; ici le DG arbitre le scénario.
          </p>
          <div className="space-y-2">
            {hub.previsions_par.map((p, i) => (
              <div key={`${p.mois}-${i}`} className={cn('p-3 rounded-lg border text-xs', p.par_prevu_pct > p.par_objectif_pct ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200')}>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{p.mois}</span>
                  <span className={cn('text-lg font-black', p.par_prevu_pct > p.par_objectif_pct ? 'text-red-600' : 'text-emerald-600')}>{p.par_prevu_pct} %</span>
                </div>
                <div className="text-slate-600 mt-1">{p.scenario}</div>
                <div className="text-[10px] text-slate-500 mt-1">Objectif {p.par_objectif_pct} % · Conf. {p.confidence} %</div>
              </div>
            ))}
          </div>
          {hub.secteurs_vigilance.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Secteurs sous vigilance</div>
              {hub.secteurs_vigilance.map(s => (
                <div key={s.nom} className="text-xs py-1.5 flex justify-between">
                  <span>{s.nom}</span>
                  <span className="font-bold text-orange-600">PAR {s.par_pct} %</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Décisions DG */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Décisions en attente — arbitrage DG</h3>
          <p className="text-xs text-slate-500 mt-1">Actions que seul le Directeur Général peut trancher cette semaine</p>
        </div>
        <div className="divide-y divide-slate-100">
          {hub.decisions_dg.map(d => (
            <div key={d.titre} className={cn('px-5 py-3 flex gap-3', d.priorite === 1 && 'bg-red-50/30')}>
              <span className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white', d.priorite === 1 ? 'bg-red-500' : d.priorite === 2 ? 'bg-orange-500' : 'bg-slate-400')}>
                P{d.priorite}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900">{d.titre}</div>
                <div className="text-xs text-slate-600 mt-0.5">{d.detail}</div>
                <div className="text-[10px] text-teal-700 mt-1">Impact : {d.impact} · Délai : {d.delai}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Glossaire */}
      <details className="bg-slate-50 rounded-xl border border-slate-200 mb-5 group">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors list-none">
          <BookOpen size={16} className="text-teal-600" />
          Comprendre le PAR et le risque crédit (guide DG)
        </summary>
        <div className="px-4 pb-4 grid md:grid-cols-2 gap-3">
          {hub.glossaire.map(g => (
            <div key={g.terme} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-teal-700">{g.terme}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{g.definition}</p>
              {g.seuil_dg && <p className="text-[10px] text-red-700 font-medium mt-1.5">{g.seuil_dg}</p>}
            </div>
          ))}
        </div>
      </details>

      {/* Tableaux détaillés */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('clients')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
            tab === 'clients' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200',
          )}
        >
          <Users size={16} />
          Clients à risque ({hub.clients_risque.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('dossiers')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
            tab === 'dossiers' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200',
          )}
        >
          <FileWarning size={16} />
          Dossiers bloqués ({hub.dossiers_bloques_dg.length})
        </button>
      </div>

      <RisqueTables hub={hub} tab={tab} />
    </PageWrapper>
  )
}
