'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Target,
  ClipboardList,
  Scale,
  Landmark,
  FileText,
  Wallet,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { DAF_AUDIT_HOME } from '@/lib/mock-daf-audit'
import type { DafAuditHome } from '@/lib/mock-daf-audit'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'

const TONE_BG: Record<string, string> = {
  attention: 'bg-orange-50 border-orange-200',
  negatif: 'bg-red-50 border-red-200',
  positif: 'bg-green-50 border-green-200',
  info: 'bg-blue-50 border-blue-200',
}
const TONE_DOT: Record<string, string> = {
  attention: 'bg-orange-500',
  negatif: 'bg-red-500',
  positif: 'bg-green-500',
  info: 'bg-blue-400',
}
const MISSION_STYLE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-800 border-red-300',
  EN_COURS: 'bg-amber-100 text-amber-800 border-amber-200',
  PLANIFIE: 'bg-slate-100 text-slate-700 border-slate-200',
  OK: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}
const RATIO_STATUT: Record<string, string> = {
  CONFORME: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  ATTENTION: 'text-amber-800 bg-amber-50 border-amber-200',
  NON_CONFORME: 'text-red-800 bg-red-50 border-red-200',
}

function Tb({
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
      className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
        active ? 'border-cyan-700 text-cyan-800 bg-cyan-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
      {alert && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
    </button>
  )
}

function MiniKpi({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-3 text-white ${color}`}>
      <div className="text-xl font-black tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5 opacity-90">{label}</div>
      {sub && <div className="text-[10px] opacity-75 mt-0.5">{sub}</div>}
    </div>
  )
}

type TabId = 'synthese' | 'cloture' | 'bceao' | 'treso' | 'budget'

export function DafAuditView({ data = DAF_AUDIT_HOME }: { data?: DafAuditHome }) {
  const [openSynth, setOpenSynth] = useState(true)
  const [tab, setTab] = useState<TabId>('synthese')
  const d = data
  const hasUrgent = d.missions.some(m => m.statut === 'URGENT')

  return (
    <div className="space-y-5">
      <section className="bg-gradient-to-br from-cyan-50 via-teal-50 to-slate-50 border border-cyan-200 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenSynth(v => !v)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/30 transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-cyan-800 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">Synthèse IA — Audit financier DAF</h2>
                <AiBadge variant="small" pulse />
              </div>
              <p className="text-xs text-slate-500">Contrôle de gestion · clôture · prudentiel — {d.synthese.date_generation}</p>
            </div>
          </div>
        </button>
        {openSynth && (
          <div className="px-4 sm:px-5 pb-5 space-y-4">
            <p className="text-sm text-slate-800 border-l-4 border-cyan-600 pl-3 leading-relaxed">{d.synthese.intro}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {d.synthese.points.map((p, i) => (
                <div key={i} className={`rounded-xl border p-3 ${TONE_BG[p.tone] ?? 'bg-white border-slate-200'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TONE_DOT[p.tone]}`} />
                    <span className="text-xs text-slate-800 leading-snug">{p.texte}</span>
                  </div>
                  {p.action && (
                    <div className="ml-4 mt-1 text-[11px] font-semibold text-slate-600">→ {p.action}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-3 border border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-cyan-800" />
                <span className="text-xs font-bold text-cyan-800 uppercase">Priorités DAF (semaine)</span>
              </div>
              <ol className="space-y-2">
                {d.synthese.priorites.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="w-5 h-5 bg-cyan-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    {p}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-cyan-800" />
          Indicateurs de contrôle financier
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <MiniKpi label="Score BCEAO" value={`${d.kpis.score_bceao}/100`} sub={`${d.kpis.ratios_non_conformes} NC`} color="bg-teal-700" />
          <MiniKpi label="Suspens" value={d.kpis.suspens_count} sub={formatFcfa(d.kpis.suspens_montant_fcfa)} color="bg-amber-600" />
          <MiniKpi label="Clôture" value={`J-${d.kpis.cloture_jours}`} sub={`${d.kpis.ecritures_attente} écr. attente`} color="bg-cyan-800" />
          <MiniKpi label="Écart rapproch." value={formatFcfa(d.kpis.ecart_rapprochement_fcfa)} color={d.kpis.ecart_rapprochement_fcfa > 0 ? 'bg-red-600' : 'bg-green-600'} />
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          <Tb label="Synthèse missions" icon={<Target className="w-4 h-4" />} active={tab === 'synthese'} onClick={() => setTab('synthese')} alert={hasUrgent} />
          <Tb label="Clôture & compta" icon={<Scale className="w-4 h-4" />} active={tab === 'cloture'} onClick={() => setTab('cloture')} alert={d.kpis.suspens_count > 0} />
          <Tb label="Réglementaire" icon={<Landmark className="w-4 h-4" />} active={tab === 'bceao'} onClick={() => setTab('bceao')} alert={d.kpis.ratios_non_conformes > 0} />
          <Tb label="Trésorerie" icon={<Wallet className="w-4 h-4" />} active={tab === 'treso'} onClick={() => setTab('treso')} />
          <Tb label="Budget" icon={<FileText className="w-4 h-4" />} active={tab === 'budget'} onClick={() => setTab('budget')} alert={d.kpis.budget_alertes > 0} />
        </div>

        <div className="p-4 sm:p-5">
          {tab === 'synthese' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {d.missions.map(m => (
                  <div key={m.id} className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-white text-slate-600">{m.domaine}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${MISSION_STYLE[m.statut]}`}>{m.statut}</span>
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-sm font-bold text-slate-900">{m.titre}</div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{m.detail}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Échéance {m.echeance} · {m.responsable}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Modules liés</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {d.liens.map(l => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 hover:border-cyan-400 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-bold text-cyan-900">{l.label}</div>
                        <p className="text-[11px] text-slate-600">{l.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-cyan-800 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'cloture' && (
            <div className="space-y-4">
              <Link
                href="/comptabilite"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-800 hover:text-cyan-950"
              >
                Ouvrir la comptabilité SYSCOHADA <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Checklist clôture</h4>
                <ol className="space-y-2">
                  {d.checklist_cloture.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      {step.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span className={step.ok ? 'text-slate-600' : 'font-semibold text-slate-900'}>{step.label}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Suspens à régulariser</h4>
                {d.suspens_comptables.map((x, i) => (
                  <div
                    key={i}
                    className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 text-xs ${
                      x.statut === 'CRITIQUE' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <span className="font-mono font-bold text-indigo-700">{x.compte}</span>
                    <span className="font-bold tabular-nums">{formatFcfa(x.solde)}</span>
                    <span className="text-slate-500">{x.age_jours} j</span>
                    <span className="font-bold px-1.5 py-0.5 rounded border text-[10px]">{x.statut}</span>
                    <span className="text-slate-600 flex-1 min-w-[180px]">{x.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'bceao' && (
            <div className="space-y-4">
              <Link href="/conformite" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-800 hover:text-cyan-950">
                Module Conformité BCEAO complet <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="text-left px-3 py-2">Indicateur</th>
                      <th className="text-right px-3 py-2">Valeur</th>
                      <th className="text-right px-3 py-2">Seuil</th>
                      <th className="text-center px-3 py-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.ratios_bceao.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-800">{r.indicateur}</td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums">{r.valeur}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{r.seuil}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${RATIO_STATUT[r.statut]}`}>
                            {r.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'treso' && (
            <div className="space-y-4">
              <Link href="/caisse" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-800 hover:text-cyan-950">
                Caisse & trésorerie réseau <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <div className="space-y-2">
                {d.rapprochements.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{r.compte}</span>
                      <span className="text-slate-600 ml-2">{r.libelle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.ecart !== 0 && (
                        <span className="font-bold text-red-700 tabular-nums">Écart {formatFcfa(r.ecart)}</span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          r.statut === 'POINTE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {r.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Alertes trésorerie / finance</h4>
                {d.alertes_financieres
                  .filter(a => a.titre.toLowerCase().includes('cash') || a.titre.toLowerCase().includes('suspens') || a.titre.toLowerCase().includes('rapproch'))
                  .map((a, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-3 text-xs ${a.severite === 'HAUTE' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
                    >
                      <div className="font-bold text-slate-900">{a.titre}</div>
                      <p className="text-slate-600 mt-0.5">{a.detail}</p>
                      <p className="text-[10px] font-semibold text-cyan-800 mt-1">→ {a.action}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {tab === 'budget' && (
            <div className="space-y-4">
              <Link href="/finance" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-800 hover:text-cyan-950">
                Finance & Budget détaillé <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-600">
                    <tr>
                      <th className="text-left px-3 py-2">Poste</th>
                      <th className="text-right px-3 py-2">Budget</th>
                      <th className="text-right px-3 py-2">Réalisé</th>
                      <th className="text-right px-3 py-2">%</th>
                      <th className="text-center px-3 py-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.ecarts_budget.map((b, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{b.poste}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatFcfa(b.budget)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatFcfa(b.realise)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.pct}%</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              b.statut === 'ALERTE'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : b.statut === 'SURVEILLE'
                                  ? 'bg-orange-100 text-orange-800 border-orange-200'
                                  : 'bg-green-100 text-green-800 border-green-200'
                            }`}
                          >
                            {b.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
