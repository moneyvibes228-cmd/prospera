'use client'
import { useRouter } from 'next/navigation'
import { Wallet, TrendingUp, Users, AlertCircle, Sparkles, ChevronRight, Briefcase } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { EPARGNE_STATS } from '@/lib/mockMicrofinance'
import { ANALYSE_EPARGNE_IA, EPARGNANTS_DETAIL, getEpargnantByNom } from '@/lib/operationnel-vue360'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from './AiBadge'

function resolveClientRoute(clientId: string): string {
  if (clientId.startsWith('CL-')) return `/dashboard/operationnel/clients/${clientId}`
  return `/dashboard/operationnel/clients/${clientId}`
}

export function EpargneStats() {
  const router = useRouter()
  const d = EPARGNE_STATS
  const ia = ANALYSE_EPARGNE_IA

  const topWithDetail = d.top_epargnants.map(e => {
    const detail = EPARGNANTS_DETAIL.find(x => x.client === e.client) ?? getEpargnantByNom(e.client)
    return { ...e, detail }
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Wallet size={15} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Épargne — Comptes & flux</h3>
          <AiBadge variant="small" label="Analyse IA intégrée" />
        </div>
        <div className="text-xs text-slate-500">
          {d.total_comptes} comptes · <strong className="text-blue-700">{formatFcfa(d.encours_epargne_total)}</strong> d&apos;encours
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Analyse IA épargne */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} className="text-blue-600" />
            <span className="text-sm font-bold text-blue-900">Analyse IA — Module épargne</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{ia.synthese}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="font-bold text-slate-600 uppercase text-[10px] mb-1">Tendances</div>
              {ia.tendances.map((t, i) => (
                <div key={i} className="text-slate-700 mb-1">• {t}</div>
              ))}
            </div>
            <div>
              <div className="font-bold text-orange-600 uppercase text-[10px] mb-1">Risques</div>
              {ia.risques.map((r, i) => (
                <div key={i} className="text-slate-700 mb-1">• {r}</div>
              ))}
            </div>
            <div>
              <div className="font-bold text-green-700 uppercase text-[10px] mb-1">Opportunités</div>
              {ia.opportunites.map((o, i) => (
                <div key={i} className="text-slate-700 mb-1">• {o}</div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-3 text-xs font-semibold">
            <span className="text-blue-700">Ratio retrait/dépôt : {ia.ratio_retrait_depot}%</span>
            <span className="text-teal-700">Croissance encours 12m : +{ia.croissance_encours_12m_pct}%</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={12} className="text-blue-600" />
              <div className="text-xs text-blue-700 font-medium">Comptes actifs</div>
            </div>
            <div className="text-2xl font-black text-blue-800">{d.actifs}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">{d.dormants} dormants · {d.clotures_mois} clôturés ce mois</div>
          </div>
          <div className="p-3 bg-gradient-to-br from-teal-50 to-green-50 rounded-xl border border-teal-100">
            <div className="text-xs text-teal-700 font-medium">Solde net mois</div>
            <div className="text-2xl font-black text-teal-800">{formatFcfa(d.flux_mois.solde_net)}</div>
            <div className="text-[10px] text-teal-600 mt-0.5 flex items-center gap-1">
              <TrendingUp size={9} /> +{d.flux_mois.croissance_pct}%
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="text-xs text-purple-700 font-medium">Dépôts mois</div>
            <div className="text-2xl font-black text-purple-800">{formatFcfa(d.flux_mois.depots_montant)}</div>
            <div className="text-[10px] text-purple-600 mt-0.5">{d.flux_mois.depots_count} opérations</div>
          </div>
          <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <div className="text-xs text-orange-700 font-medium">Retraits mois</div>
            <div className="text-2xl font-black text-orange-800">{formatFcfa(d.flux_mois.retraits_montant)}</div>
            <div className="text-[10px] text-orange-600 mt-0.5">{d.flux_mois.retraits_count} opérations</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Par type de compte</h4>
            <div className="space-y-2">
              {d.par_type.map(t => (
                <div key={t.type} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-xs font-medium text-slate-700">{t.label}</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-slate-700">{t.count}</span>
                      <span className="text-slate-400 ml-1">({t.pct}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                      <div className="h-full rounded-full" style={{ width: `${t.pct * 2}%`, backgroundColor: t.color }} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{formatFcfa(t.encours)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Top 5 épargnants
              <span className="font-normal normal-case text-slate-400 ml-1">— secteur · clic fiche</span>
            </h4>
            <div className="space-y-2">
              {topWithDetail.map((e, i) => {
                const clientId = e.detail?.client_id
                const clickable = !!clientId
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && router.push(resolveClientRoute(clientId))}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                      clickable ? 'bg-slate-50 border-slate-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer group' : 'bg-slate-50 border-slate-100 opacity-80'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>#{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-800">{e.client}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 flex-wrap">
                        <span>{e.agence}</span>
                        {e.detail && (
                          <>
                            <span>·</span>
                            <Briefcase size={9} className="inline" />
                            <span className="text-blue-700 font-medium">{e.detail.secteur}</span>
                            <span className="hidden sm:inline">— {e.detail.activite}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="text-sm font-bold text-blue-700">{formatFcfa(e.solde)}</div>
                      {clickable && <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Évolution sur 12 mois</h4>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={d.evolution_12_mois} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradEncours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={v => formatFcfa(Number(v))} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="encours" name="Encours" stroke="#3b82f6" fill="url(#gradEncours)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <AlertCircle size={11} className="text-orange-500" /> Alertes & opportunités épargne
          </h4>
          <div className="space-y-1.5">
            {d.alertes_epargne.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <AlertCircle size={12} className="text-orange-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-orange-800">{a.type}</div>
                    <div className="text-[10px] text-orange-600 truncate">{a.action}</div>
                  </div>
                </div>
                <span className="text-base font-black text-orange-700 shrink-0">{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
