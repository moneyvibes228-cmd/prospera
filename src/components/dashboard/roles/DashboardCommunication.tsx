'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Sparkles, Target, TrendingUp, TrendingDown, Bell, ChevronDown,
  MessageSquare, Globe, Megaphone, Heart, Star, BarChart3,
  Wallet, Activity, AlertTriangle, CheckCircle2, MapPin, Users,
  Calendar, ArrowRight, Bot, Crosshair, Radio, Award, Map,
  Zap, BarChart2, Navigation,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import { MOCK_COMMUNICATION_HOME } from '@/lib/mockMicrofinance'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { formatFcfa } from '@/lib/utils'

// Chargement dynamique de la carte Leaflet (SSR incompatible)
const AgenceMap = dynamic(
  () => import('@/components/dashboard/AgenceMap').then(m => m.AgenceMap),
  { ssr: false, loading: () => (
    <div className="h-[480px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 text-sm gap-2 border border-slate-200">
      <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      Chargement de la carte...
    </div>
  )},
)

// =============================================================================
//   STYLE MAPS
// =============================================================================
const TONE_DOT: Record<string, string> = {
  positif:   'bg-green-500',
  negatif:   'bg-red-500',
  attention: 'bg-orange-500',
  critique:  'bg-red-700',
  info:      'bg-blue-500',
}
const TONE_BG: Record<string, string> = {
  positif:   'bg-green-50  border-green-200',
  negatif:   'bg-red-50    border-red-200',
  attention: 'bg-orange-50 border-orange-200',
  critique:  'bg-red-100   border-red-400',
  info:      'bg-blue-50   border-blue-200',
}
const TONE_TEXT: Record<string, string> = {
  positif:   'text-green-700',
  negatif:   'text-red-700',
  attention: 'text-orange-700',
  critique:  'text-red-800',
  info:      'text-blue-700',
}
const COVER_STAT: Record<string, { bg: string; text: string; dot: string }> = {
  BON:     { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  NORMAL:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  TENSION: { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
}
const POT_COLORS: Record<string, { badge: string; bar: string }> = {
  TRES_ELEVE: { badge: 'bg-red-100 text-red-700',     bar: 'bg-red-500'    },
  ELEVE:      { badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500'},
  MODERE:     { badge: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500'},
}
const SEVERITE_STYLE: Record<string, string> = {
  CRITIQUE: 'border-red-400   bg-red-50   text-red-900',
  HAUTE:    'border-orange-400 bg-orange-50 text-orange-900',
  MOYENNE:  'border-yellow-400 bg-yellow-50 text-yellow-900',
}
const CAT_BADGE: Record<string, string> = {
  LEADS:     'bg-indigo-100 text-indigo-700',
  RETENTION: 'bg-pink-100   text-pink-700',
  DIGITAL:   'bg-blue-100   text-blue-700',
  BUDGET:    'bg-amber-100  text-amber-700',
}
const STATUT_CAMP: Record<string, string> = {
  ACTIVE:   'bg-green-100 text-green-700',
  TERMINEE: 'bg-slate-100 text-slate-600',
}
const PRIO_STYLE: Record<string, string> = {
  HAUTE:  'bg-red-100    text-red-700',
  MODERE: 'bg-yellow-100 text-yellow-800',
}
const POTENTIEL_STYLE: Record<string, { bg: string; text: string }> = {
  TRES_ELEVE: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  ELEVE:      { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  MODERE:     { bg: 'bg-yellow-100',  text: 'text-yellow-700'  },
}
const STATUT_EVENT: Record<string, string> = {
  CONFIRME:  'bg-green-100  text-green-700',
  PLANIFIE:  'bg-blue-100   text-blue-700',
  EN_COURS:  'bg-amber-100  text-amber-700',
  EN_PREP:   'bg-slate-100  text-slate-600',
}
const CANAL_ICON: Record<string, React.ElementType> = {
  TRES_ELEVE: Star,
  ELEVE:      TrendingUp,
  MODERE:     Target,
}
const SEG_COLORS = ['#14b8a6','#16a34a','#f97316','#6366f1','#a855f7','#eab308']

// =============================================================================
//   MAIN COMPONENT
// =============================================================================
export default function DashboardCommunication() {
  const d = MOCK_COMMUNICATION_HOME
  const [openSynthese, setOpenSynthese] = useState(true)
  const [activeTab, setActiveTab] = useState<'acquisition' | 'chatbot' | 'campagnes' | 'presence' | 'fidelisation' | 'couverture' | 'marche' | 'budget' | 'instit'>('acquisition')

  return (
    <div className="space-y-5">

      {/* =====================================================================
          SYNTHÈSE IA — Copilote Marketing
          ===================================================================== */}
      <section className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border border-violet-200 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setOpenSynthese(v => !v)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/30 transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-violet-700 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">Synthèse IA — Communication & Marketing</h2>
                <AiBadge variant="small" pulse />
              </div>
              <p className="text-xs text-slate-500">Générée {d.synthese_ia.date_generation}</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSynthese ? 'rotate-180' : ''}`} />
        </button>

        {openSynthese && (
          <div className="px-4 sm:px-5 pb-5 space-y-4">

            {/* Intro */}
            <p className="text-sm text-slate-800 font-medium border-l-4 border-violet-500 pl-3 italic leading-relaxed">
              {d.synthese_ia.intro}
            </p>

            {/* KPIs clés synthèse */}
            {d.synthese_ia.kpis_cles && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {d.synthese_ia.kpis_cles.map((k: any, i: number) => (
                  <div key={i} className="bg-white/80 rounded-xl border border-violet-100 p-2.5 text-xs">
                    <div className="text-slate-500 text-[10px] font-medium uppercase tracking-wide mb-0.5">{k.label}</div>
                    <div className="font-bold text-slate-900 text-sm">{k.valeur}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-slate-400 text-[10px]">{k.note}</span>
                      <span className={`text-[10px] font-bold ${k.tendance === 'HAUSSE' ? 'text-emerald-600' : k.tendance === 'BAISSE' ? 'text-red-600' : 'text-slate-500'}`}>{k.delta}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Signaux — grille colorée selon le tone */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Signaux détectés
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {d.synthese_ia.points.map((p: any, i: number) => (
                  <div key={i} className={`rounded-xl border p-3 ${TONE_BG[p.tone] ?? 'bg-white border-slate-200'}`}>
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TONE_DOT[p.tone]}`} />
                      <span className={`text-xs font-medium leading-snug ${TONE_TEXT[p.tone] ?? 'text-slate-700'}`}>{p.texte}</span>
                    </div>
                    {p.action && (
                      <div className="ml-4 text-[11px] font-semibold text-slate-600 bg-white/80 rounded-lg px-2 py-1 border border-white">
                        → {p.action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Analyses stratégiques */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {d.synthese_ia.analyse_territoire && (
                <div className="bg-white rounded-xl p-3 border border-emerald-200">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Map className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Territoire</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{d.synthese_ia.analyse_territoire}</p>
                </div>
              )}
              {d.synthese_ia.analyse_canaux && (
                <div className="bg-white rounded-xl p-3 border border-indigo-200">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Radio className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Canaux</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{d.synthese_ia.analyse_canaux}</p>
                </div>
              )}
              {d.synthese_ia.analyse_concurrence && (
                <div className="bg-white rounded-xl p-3 border border-red-200">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Concurrence</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{d.synthese_ia.analyse_concurrence}</p>
                </div>
              )}
            </div>

            {/* Priorités IA */}
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-violet-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-violet-700" />
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Plan d'action IA — {d.synthese_ia.priorites.length} priorités</span>
              </div>
              <ol className="space-y-2">
                {d.synthese_ia.priorites.map((p, i) => {
                  const isUrgent = p.startsWith('URGENT')
                  return (
                    <li key={i} className={`flex items-start gap-2.5 ${isUrgent ? 'bg-red-50 rounded-lg px-2 py-1.5 border border-red-200' : ''}`}>
                      <span className={`w-5 h-5 ${isUrgent ? 'bg-red-600' : 'bg-violet-700'} text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5`}>{i + 1}</span>
                      <span className={`text-xs leading-snug ${isUrgent ? 'text-red-800 font-semibold' : 'text-slate-700'}`}>{p}</span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          KPIs EXÉCUTIFS — 3 rangées
          ===================================================================== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-700" />
            Tableau de bord Marketing
          </h2>
          <ExportButton filename="rapport-marketing" size="sm" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <MiniKpi label="Leads mois"        value={d.kpis.leads_mois}                       sub="générés"        color="bg-indigo-600" />
          <MiniKpi label="Convertis"         value={d.kpis.leads_convertis}                  sub="clients gagnés" color="bg-emerald-600" />
          <MiniKpi label="Conversion"        value={`${d.kpis.taux_conversion_pct}%`}        sub="taux"           color="bg-teal-600" />
          <MiniKpi label="CAC"               value={formatFcfa(d.kpis.cac_moyen)}            sub={`obj. ${formatFcfa(d.kpis.cac_objectif)}`} color={d.kpis.cac_moyen <= d.kpis.cac_objectif ? 'bg-green-600' : 'bg-orange-500'} />
          <MiniKpi label="NPS"               value={d.kpis.nps}                              sub={`+${d.kpis.nps_evolution} pts`} color="bg-purple-600" />
          <MiniKpi label="Rétention"         value={`${d.kpis.taux_retention_pct}%`}         sub={`obj. ${d.kpis.objectif_retention_pct}%`} color={d.kpis.taux_retention_pct >= d.kpis.objectif_retention_pct ? 'bg-green-600' : 'bg-red-500'} />
          <MiniKpi label="Chatbot leads"     value={d.kpis.chatbot_leads_crees}              sub="ce mois auto."  color="bg-cyan-600" />
          <MiniKpi label="Non assignés"      value={d.kpis.leads_non_assignes}               sub="urgence"        color="bg-red-600" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
          <MiniKpi label="Pipeline valorisé" value={formatFcfa(d.kpis.pipeline_valeur)}      sub="FCFA"           color="bg-violet-600" />
          <MiniKpi label="Budget consommé"   value={`${d.kpis.budget_consomme / 1000}k / ${d.kpis.budget_mois_total / 1000}k`} sub={`${Math.round((d.kpis.budget_consomme/d.kpis.budget_mois_total)*100)}%`} color="bg-slate-600" />
          <MiniKpi label="ROI global"        value={`${d.kpis.budget_roi_global}x`}          sub="ce mois"        color="bg-amber-600" />
          <MiniKpi label="LTV moyen"         value={formatFcfa(d.kpis.ltv_moyen)}            sub="par client"     color="bg-pink-600" />
        </div>
      </section>

      {/* Alertes en haut (urgences) */}
      {d.alertes.filter(a => a.severite === 'CRITIQUE').length > 0 && (
        <section className="space-y-2">
          {d.alertes.filter(a => a.severite === 'CRITIQUE').map((a, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border-l-4 ${SEVERITE_STYLE[a.severite]}`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${CAT_BADGE[a.cat]}`}>{a.cat}</span>
                  <span className="text-xs font-bold">{a.titre}</span>
                </div>
                <span className="text-xs opacity-80">{a.detail}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* =====================================================================
          TABS PRINCIPAUX
          ===================================================================== */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          <Tb label="Acquisition"  icon={<Crosshair   className="w-4 h-4" />} color="indigo"  active={activeTab === 'acquisition'}   onClick={() => setActiveTab('acquisition')} />
          <Tb label="Chatbot IA"   icon={<Bot          className="w-4 h-4" />} color="cyan"    active={activeTab === 'chatbot'}        onClick={() => setActiveTab('chatbot')} />
          <Tb label="Campagnes"    icon={<Megaphone    className="w-4 h-4" />} color="amber"   active={activeTab === 'campagnes'}      onClick={() => setActiveTab('campagnes')} />
          <Tb label="Présence"     icon={<Globe        className="w-4 h-4" />} color="blue"    active={activeTab === 'presence'}       onClick={() => setActiveTab('presence')} />
          <Tb label="Fidélisation" icon={<Heart        className="w-4 h-4" />} color="pink"    active={activeTab === 'fidelisation'}   onClick={() => setActiveTab('fidelisation')} />
          <Tb label="Couverture"   icon={<Map          className="w-4 h-4" />} color="teal"    active={activeTab === 'couverture'}     onClick={() => setActiveTab('couverture')} />
          <Tb label="Marché"       icon={<MapPin       className="w-4 h-4" />} color="emerald" active={activeTab === 'marche'}         onClick={() => setActiveTab('marche')} />
          <Tb label="Budget"       icon={<Wallet       className="w-4 h-4" />} color="violet"  active={activeTab === 'budget'}         onClick={() => setActiveTab('budget')} />
          <Tb label="Institutionnel" icon={<Calendar   className="w-4 h-4" />} color="slate"   active={activeTab === 'instit'}         onClick={() => setActiveTab('instit')} />
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === 'acquisition'   && <TabAcquisition   data={d} />}
          {activeTab === 'chatbot'       && <TabChatbot        data={d} />}
          {activeTab === 'campagnes'     && <TabCampagnes      data={d} />}
          {activeTab === 'presence'      && <TabPresence       data={d} />}
          {activeTab === 'fidelisation'  && <TabFidelisation   data={d} />}
          {activeTab === 'couverture'    && <TabCouverture     data={d} />}
          {activeTab === 'marche'        && <TabMarche         data={d} />}
          {activeTab === 'budget'        && <TabBudget         data={d} />}
          {activeTab === 'instit'        && <TabInstitutionnel data={d} />}
        </div>
      </section>

      {/* =====================================================================
          ALERTES COMPLÈTES (non-critiques)
          ===================================================================== */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">Toutes les alertes</h3>
            <AiBadge variant="small" />
          </div>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{d.alertes.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {d.alertes.map((a, i) => (
            <div key={i} className={`p-3 border-l-4 ${SEVERITE_STYLE[a.severite] || 'bg-slate-50 border-slate-300'}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${CAT_BADGE[a.cat]}`}>{a.cat}</span>
                <span className={`text-[9px] font-bold px-1.5 rounded py-0.5 ${a.severite === 'CRITIQUE' ? 'bg-red-600 text-white' : a.severite === 'HAUTE' ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>{a.severite}</span>
              </div>
              <div className="text-xs font-semibold leading-tight">{a.titre}</div>
              <div className="text-xs opacity-80 mt-0.5 leading-snug">{a.detail}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

// =============================================================================
//   TAB — Acquisition & Leads
// =============================================================================
function TabAcquisition({ data }: { data: typeof MOCK_COMMUNICATION_HOME }) {
  const { acquisition } = data
  return (
    <div className="space-y-5">
      {/* Funnel visuel */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
          Funnel d'acquisition — ce mois
        </h4>
        <div className="space-y-2">
          {acquisition.funnel.map((s, i) => {
            const pct = Math.round((s.count / acquisition.funnel[0].count) * 100)
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-36 text-xs font-semibold text-slate-700 text-right shrink-0">{s.etape}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-7 overflow-hidden">
                  <div className="h-full rounded-full flex items-center px-3 transition-all" style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: s.couleur }}>
                    <span className="text-white text-xs font-bold">{s.count}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 w-10 shrink-0">{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Par agence + canaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Leads par agence</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Agence</th>
                  <th className="text-center px-2 py-2 font-semibold">Leads</th>
                  <th className="text-center px-2 py-2 font-semibold">Conv.</th>
                  <th className="text-center px-2 py-2 font-semibold">Taux</th>
                  <th className="text-right px-3 py-2 font-semibold">Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {acquisition.par_agence.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">{a.agence}</td>
                    <td className="px-2 py-2 text-center text-slate-700">{a.leads}</td>
                    <td className="px-2 py-2 text-center text-slate-700">{a.convertis}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`font-bold ${a.taux >= 40 ? 'text-emerald-700' : a.taux >= 25 ? 'text-yellow-700' : 'text-red-700'}`}>{a.taux}%</span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatFcfa(a.pipeline)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Performance par canal</h4>
          <div className="space-y-2">
            {[...acquisition.canaux].sort((a, b) => b.taux - a.taux).map((c, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">{c.canal}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black ${c.taux >= 50 ? 'text-emerald-700' : c.taux >= 30 ? 'text-yellow-700' : 'text-red-700'}`}>{c.taux}%</span>
                    <span className={`text-[10px] font-bold ${c.trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{c.trend > 0 ? '↑' : '↓'}{Math.abs(c.trend)}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full" style={{ width: `${c.taux}%`, backgroundColor: c.taux >= 50 ? '#16a34a' : c.taux >= 30 ? '#f97316' : '#dc2626' }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{c.leads} leads · {c.convertis} conv.</span>
                  <span className={c.cout_lead === 0 ? 'text-emerald-600 font-bold' : ''}>{c.cout_lead === 0 ? '🆓 Gratuit' : `${c.cout_lead.toLocaleString()} FCFA/lead`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline leads avec statut assignation */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          Pipeline leads — {acquisition.leads_pipeline.filter(l => !l.assigne).length} non assignés
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Prospect</th>
                <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Source</th>
                <th className="text-center px-2 py-2 font-semibold">Score</th>
                <th className="text-left px-3 py-2 font-semibold hidden md:table-cell">Besoin</th>
                <th className="text-center px-2 py-2 font-semibold">Assigné</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {acquisition.leads_pipeline.map((l, i) => (
                <tr key={i} className={`hover:bg-slate-50 ${!l.assigne ? 'bg-red-50/40' : ''}`}>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-900">{l.nom}</div>
                    <div className="text-[10px] text-slate-500">{l.agence}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-600 hidden sm:table-cell">{l.source}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`font-black text-sm ${l.score >= 80 ? 'text-emerald-700' : l.score >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>{l.score}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 hidden md:table-cell text-[11px]">{l.besoin}</td>
                  <td className="px-2 py-2 text-center">
                    {l.assigne
                      ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{l.agent}</span>
                      : <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold animate-pulse">À assigner !</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
//   TAB — Chatbot WhatsApp IA
// =============================================================================
function TabChatbot({ data }: { data: typeof MOCK_COMMUNICATION_HOME }) {
  const cb = data.chatbot
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <KpiCard label="Conversations mois" value={cb.conversations_mois}        color="text-cyan-700"    bg="bg-cyan-50" />
        <KpiCard label="Leads créés auto."  value={cb.leads_crees_mois}          color="text-emerald-700" bg="bg-emerald-50" />
        <KpiCard label="Résolution auto."   value={`${cb.taux_resolution_auto_pct}%`} color="text-indigo-700" bg="bg-indigo-50" />
        <KpiCard label="En attente"         value={cb.leads_en_attente}           color="text-red-700"     bg="bg-red-50" sub="à traiter" />
        <KpiCard label="Conversations jour" value={cb.conversations_jour}         color="text-blue-700"    bg="bg-blue-50" />
        <KpiCard label="Leads aujourd'hui"  value={cb.leads_crees_jour}           color="text-teal-700"    bg="bg-teal-50" />
        <KpiCard label="Tps réponse moy."   value={`${cb.temps_reponse_moy_min}min`} color="text-slate-700" bg="bg-slate-50" />
        <KpiCard label="Satisfaction"       value={`${cb.satisfaction_score}/5`}  color="text-amber-700"   bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Heatmap horaire */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-600" />
            Pic d'activité (leads / heure)
          </h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={cb.heatmap_heure}>
              <XAxis dataKey="h" tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="n" fill="#06b6d4" radius={[2, 2, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-slate-500 text-center mt-1">Pic 19h-21h — Renforcer la réponse humaine à ces heures</p>
        </div>

        {/* Top sujets */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Top sujets demandés</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={cb.top_sujets} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey="sujet" tick={{ fontSize: 10 }} width={130} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Conversations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statuts conversations */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Statuts du pipeline chatbot</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {cb.statuts_conv.map((s, i) => {
            const colors = ['bg-emerald-50 text-emerald-700', 'bg-blue-50 text-blue-700', 'bg-red-50 text-red-700', 'bg-slate-50 text-slate-700']
            return (
              <div key={i} className={`rounded-lg p-3 text-center ${colors[i % colors.length]}`}>
                <div className="text-xl font-black">{s.count}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5">{s.statut}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Conversations récentes */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Conversations récentes</h4>
        <div className="space-y-2">
          {cb.conversations_recentes.map((c, i) => (
            <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="w-10 text-xs font-bold text-slate-500 shrink-0">{c.heure}</div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800">{c.nom}</div>
                <div className="text-xs text-slate-600 italic mt-0.5">"{c.message}"</div>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${c.statut === 'TRANSFERE' ? 'bg-green-100 text-green-700' : c.statut === 'LEAD_CREE' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {c.statut.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
//   TAB — Campagnes
// =============================================================================
function TabCampagnes({ data }: { data: typeof MOCK_COMMUNICATION_HOME }) {
  return (
    <div className="space-y-5">
      {/* Campagnes actives */}
      <div className="space-y-3">
        {data.campagnes.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{c.nom}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUT_CAMP[c.statut]}`}>{c.statut}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{c.type} · Fin {c.fin}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-600">{c.roi}x</div>
                <div className="text-[10px] text-slate-500">ROI</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
              {[
                { l: 'Envoyés',    v: c.envois },
                { l: 'Ouvertures', v: `${c.ouvertures} (${c.ouv_pct}%)` },
                { l: 'Clics',      v: c.clics },
                { l: 'Conversions',v: c.conversions },
                { l: 'Revenu',     v: formatFcfa(c.revenu_genere) },
              ].map(m => (
                <div key={m.l} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                  <div className="text-sm font-bold text-slate-800">{m.v}</div>
                  <div className="text-[10px] text-slate-500">{m.l}</div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-slate-600">Budget : {formatFcfa(c.depense)} / {formatFcfa(c.budget)}</div>
                <div className="w-32 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.round((c.depense/c.budget)*100)}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-2 bg-indigo-50 rounded-lg p-2.5 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-800">{c.ia_note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommandations IA */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-4 h-4 text-amber-700" />
          <h4 className="text-sm font-bold text-amber-900">Campagnes recommandées par l'IA — Juin 2026</h4>
          <AiBadge variant="small" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.campagnes_ia.map((r, i) => (
            <div key={i} className="bg-white rounded-xl border border-amber-100 p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-slate-900">{r.titre}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{r.canal} · Budget {formatFcfa(r.budget)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-emerald-600">{r.roi_estime}x</div>
                  <div className="text-[10px] text-slate-400">ROI estimé</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-1.5">{r.desc}</p>
              <div className="text-xs text-violet-700 font-semibold">🎯 {r.cible}</div>
              <div className="text-[10px] text-slate-400 mt-1">Confiance IA : {r.confidence}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
//   TAB — Présence digitale
// =============================================================================
function TabPresence({ data }: { data: typeof MOCK_COMMUNICATION_HOME }) {
  const p = data.presence_digitale
  const scorePct = (p.score_global / p.score_cible) * 100
  return (
    <div className="space-y-4">
      {/* Score global */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">Score présence digitale globale</div>
            <div className="flex items-end gap-2">
              <div className="text-5xl font-black text-violet-300">{p.score_global}</div>
              <div className="text-slate-400 mb-1">/100</div>
            </div>
            <div className="text-xs text-slate-300 mt-1">Objectif : {p.score_cible} · <span className="text-green-400">+{p.evolution_pts}pts ce mois</span></div>
          </div>
          <div className="text-right">
            <div className="w-24 h-24 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#334155" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#a78bfa" strokeWidth="3"
                  strokeDasharray={`${(scorePct * 94.2) / 100} 94.2`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-black">{Math.round(scorePct)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 canaux digitaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Google Maps */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" /> Google Maps
            </h5>
            <span className="text-amber-500 font-bold text-sm">★ {p.google_maps.note}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{p.google_maps.avis}</div><div className="text-[10px] text-slate-500">Avis</div></div>
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{(p.google_maps.vues_mois/1000).toFixed(1)}k</div><div className="text-[10px] text-slate-500">Vues</div></div>
            <div className="bg-red-50 rounded p-1.5"><div className="font-bold text-red-700">{p.google_maps.avis_sans_reponse}</div><div className="text-[10px] text-red-600">Sans réponse</div></div>
          </div>
          <div className="space-y-1.5 mt-2">
            {p.google_maps.derniers_avis.slice(0, 2).map((a, i) => (
              <div key={i} className="text-xs text-slate-600 italic bg-slate-50 rounded p-2">
                <span className="font-bold text-slate-800">{a.auteur}</span> {'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)} — "{a.texte.substring(0, 60)}..."
              </div>
            ))}
          </div>
        </div>

        {/* Facebook */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-bold text-slate-900">Facebook</h5>
            <span className="text-blue-600 font-bold text-sm">{p.facebook.followers.toLocaleString()} abonnés</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{p.facebook.engagement_pct}%</div><div className="text-[10px] text-slate-500">Engagement</div></div>
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{(p.facebook.portee_mois/1000).toFixed(1)}k</div><div className="text-[10px] text-slate-500">Portée</div></div>
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{p.facebook.posts_mois}</div><div className="text-[10px] text-slate-500">Posts</div></div>
          </div>
          <div className="text-[11px] text-slate-600 bg-blue-50 rounded p-2">📌 Meilleur post : {p.facebook.meilleur_post}</div>
        </div>

        {/* WhatsApp Business */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-green-600" /> WhatsApp Business
            </h5>
            <span className="text-green-600 font-bold text-sm">{p.whatsapp_business.contacts_opt_in} contacts</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{p.whatsapp_business.broadcasts_mois}</div><div className="text-[10px] text-slate-500">Broadcasts</div></div>
            <div className="bg-green-50 rounded p-1.5"><div className="font-bold text-green-700">{p.whatsapp_business.taux_lecture_pct}%</div><div className="text-[10px] text-slate-500">Lecture</div></div>
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{p.whatsapp_business.reponses}</div><div className="text-[10px] text-slate-500">Réponses</div></div>
          </div>
        </div>

        {/* Site web */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" /> Site web
            </h5>
            {!p.site_web.formulaire_contact && (
              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">⚠ Sans formulaire</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{p.site_web.visites_mois.toLocaleString()}</div><div className="text-[10px] text-slate-500">Visites</div></div>
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{p.site_web.bounce_rate_pct}%</div><div className="text-[10px] text-slate-500">Bounce</div></div>
            <div className="bg-slate-50 rounded p-1.5"><div className="font-bold">{p.site_web.leads_generes}</div><div className="text-[10px] text-slate-500">Leads</div></div>
          </div>
        </div>
      </div>

      {/* Recommandations IA */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          Plan d'action IA pour améliorer la présence
        </h4>
        <div className="space-y-2">
          {p.recommandations_ia.map((r, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${PRIO_STYLE[r.priorite]}`}>{r.priorite}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900">{r.axe} :</span>
                <span className="text-xs text-slate-600"> {r.action}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
//   TAB — Fidélisation & Réputation
// =============================================================================
function TabFidelisation({ data }: { data: typeof MOCK_COMMUNICATION_HOME }) {
  const f = data.fidelisation
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <KpiCard label="Taux rétention"  value={`${f.taux_retention_pct}%`}      color={f.taux_retention_pct >= f.objectif_retention_pct ? 'text-emerald-700' : 'text-red-700'}  bg={f.taux_retention_pct >= f.objectif_retention_pct ? 'bg-emerald-50' : 'bg-red-50'} sub={`obj. ${f.objectif_retention_pct}%`} />
        <KpiCard label="NPS"             value={f.nps}                            color="text-purple-700"  bg="bg-purple-50"  sub={`+${f.nps_evolution_pts} pts`} />
        <KpiCard label="Référrals mois"  value={f.referrals_mois}                 color="text-pink-700"    bg="bg-pink-50"    sub={`${f.taux_conv_referral_pct}% conv.`} />
        <KpiCard label="Ambassadeurs"    value={f.ambassadeurs_potentiels}         color="text-amber-700"   bg="bg-amber-50"   sub="potentiels" />
        <KpiCard label="Risque attrition" value={f.clients_a_risque_attrition}    color="text-red-700"     bg="bg-red-50"     sub="clients" />
        <KpiCard label="Clients perdus" value={data.kpis.clients_perdus_mois}     color="text-orange-700"  bg="bg-orange-50"  sub="ce mois" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NPS évolution */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Évolution NPS</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={f.nps_evolution}>
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis domain={[60, 80]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="nps" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} name="NPS" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Raisons départ */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Raisons de départ clients</h4>
          <div className="space-y-2">
            {f.raisons_depart.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-700 flex-1">{r.raison}</span>
                <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700 w-6">{r.count}</span>
              </div>
            ))}
          </div>

          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4 mb-2">Programme Ambassadeurs</h4>
          <div className="space-y-1.5">
            {f.ambassadeurs.map((a, i) => (
              <div key={i} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-xs border border-amber-100">
                <span className="font-semibold text-slate-900">{a.parrain}</span>
                <span className="text-slate-600">{a.filleuls} filleul{a.filleuls > 1 ? 's' : ''}</span>
                <span className="font-bold text-emerald-700">{formatFcfa(a.credits_generes)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clients à risque attrition */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          Clients à risque d'attrition — Action immédiate
        </h4>
        <div className="space-y-2">
          {f.clients_a_risque_attrition_liste.map((c, i) => (
            <div key={i} className="flex items-center gap-3 bg-red-50/60 rounded-lg p-3 border border-red-100">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${c.risque === 'HAUT' ? 'bg-red-600 text-white' : 'bg-orange-400 text-white'}`}>{c.risque}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900">{c.client}</div>
                <div className="text-[11px] text-slate-600">{c.signal}</div>
              </div>
              <button className="text-xs text-violet-700 font-bold hover:underline shrink-0">{c.action} →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
//   TAB — Zones & Marché
// =============================================================================
// =============================================================================
//   TAB — Couverture & Territoire (carte Leaflet + stats + IA)
// =============================================================================
function TabCouverture({ data }: { data: typeof MOCK_COMMUNICATION_HOME }) {
  const [selectedAgence, setSelectedAgence] = useState<string | null>(null)
  const cov = data.couverture_territoire

  return (
    <div className="space-y-5">

      {/* ── KPIs couverture ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="col-span-1 bg-teal-50 rounded-xl border border-teal-200 p-3 text-center">
          <div className="text-2xl font-black text-teal-700">{cov.taux_penetration_global_pct}%</div>
          <div className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide mt-0.5">Pénétration marché</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{cov.clients_actifs_reseau} / {cov.marche_total_estime} cibles</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center">
          <div className="text-2xl font-black text-red-700">{cov.prospects_non_couverts}</div>
          <div className="text-[10px] font-semibold text-red-600 uppercase tracking-wide mt-0.5">Prospects non couverts</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{cov.zones_vierges} zones vierges</div>
        </div>
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-3 text-center">
          <div className="text-2xl font-black text-indigo-700">{cov.agents_terrain_actifs}</div>
          <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mt-0.5">Agents terrain actifs</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Rayon moy. {cov.rayon_couverture_moy_km} km</div>
        </div>
        {cov.par_agence.map((ag: any) => {
          const s = COVER_STAT[ag.statut] ?? COVER_STAT.NORMAL
          return (
            <button
              key={ag.id}
              onClick={() => setSelectedAgence(selectedAgence === ag.id ? null : ag.id)}
              className={`rounded-xl border p-2.5 text-center transition-all hover:shadow-md ${selectedAgence === ag.id ? 'ring-2 ring-teal-400' : ''} ${s.bg} border-slate-200`}
            >
              <div className={`text-xs font-bold ${s.text} truncate`}>{ag.nom}</div>
              <div className="text-lg font-black text-slate-800 mt-0.5">{ag.penet_pct}%</div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                <span className="text-[10px] text-slate-600">{ag.clients} clients · PAR {ag.par_pct}%</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Carte principale Leaflet ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Map className="w-4 h-4 text-teal-600" />
            Carte couverture réseau — zones actives & expansion IA
            <AiBadge variant="small" label="Analyse territoire" confidence={88} />
          </h4>
          {selectedAgence && (
            <button
              onClick={() => setSelectedAgence(null)}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium underline"
            >
              ← Réseau complet
            </button>
          )}
        </div>
        <AgenceMap selectedAgenceId={selectedAgence} />
      </div>

      {/* ── Évolution taux pénétration ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Évolution pénétration marché (5 mois)
          </h5>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={cov.evolution_penetration}>
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" domain={[20, 40]} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Pénétration']} />
              <Line type="monotone" dataKey="penet_pct" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 4, fill: '#14b8a6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Performance agents par zone ─────────────────────────────────────── */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-indigo-600" /> Couverture agent — Lomé Centre & Adidogomé
          </h5>
          <div className="space-y-1.5">
            {cov.agents_par_zone.slice(0, 2).flatMap((az: any) =>
              az.agents.map((a: any, i: number) => (
                <div key={`${az.agence}-${i}`} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-800 flex-1 truncate">{a.nom}</span>
                  <span className="text-[10px] text-slate-500">{a.visites_sem} vis./sem</span>
                  <span className="text-[10px] text-slate-500">{a.clients} clients</span>
                  <div className="flex items-center gap-1 w-20">
                    <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${a.taux_couv >= 90 ? 'bg-emerald-500' : a.taux_couv >= 75 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${a.taux_couv}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold w-7 text-right ${a.taux_couv >= 90 ? 'text-emerald-700' : a.taux_couv >= 75 ? 'text-blue-700' : 'text-orange-700'}`}>{a.taux_couv}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Plan expansion IA ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-300 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-600" />
          <h5 className="text-sm font-bold text-amber-900">Plan d'expansion IA — 5 zones prioritaires identifiées</h5>
          <AiBadge variant="small" label="Analyse stratégique" confidence={85} pulse />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {cov.zones_expansion_ia.map((z: any, i: number) => {
            const pot = POT_COLORS[z.potentiel] ?? POT_COLORS.MODERE
            return (
              <div key={i} className="bg-white rounded-xl border border-amber-100 p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-sm font-bold text-slate-900 leading-tight block">{z.nom}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pot.badge}`}>{z.potentiel.replace('_', ' ')}</span>
                      {z.roi_mois_3 && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">ROI mois 3 ✓</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 shrink-0">{z.confidence}%</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-600">
                    <Users className="w-3 h-3" />
                    <span>{z.prospects} prospects</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Couverture actuelle : <span className={`font-bold ${z.couverture_pct === 0 ? 'text-red-600' : 'text-orange-600'}`}>{z.couverture_pct}%</span>
                  </div>
                </div>
                {/* Barre couverture */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                    <span>Couverture actuelle</span>
                    <span>{z.couverture_pct}% → objectif 100%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${pot.bar}`} style={{ width: `${Math.max(z.couverture_pct, 3)}%` }} />
                  </div>
                </div>
                <div className="bg-teal-50 rounded-lg px-2 py-1.5 border border-teal-100 text-[11px] font-semibold text-teal-800">
                  → {z.action}
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <span className="font-medium text-slate-700">Agence référente :</span>
                  <span>{z.agence_ref}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Couverture par agence — barres ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-emerald-600" /> Taux de pénétration marché par agence
        </h5>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={cov.par_agence} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 60]} />
            <YAxis dataKey="nom" type="category" tick={{ fontSize: 10 }} width={90} />
            <Tooltip formatter={(v: any) => [`${v}%`, 'Pénétration']} />
            <Bar dataKey="penet_pct" radius={[0, 6, 6, 0]} fill="#14b8a6">
              {cov.par_agence.map((_: any, i: number) => {
                const colors = ['#14b8a6', '#6366f1', '#ef4444', '#f97316', '#a855f7']
                return <Cell key={i} fill={colors[i % colors.length]} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-5 gap-2 mt-3">
          {cov.par_agence.map((ag: any) => {
            const s = COVER_STAT[ag.statut] ?? COVER_STAT.NORMAL
            return (
              <div key={ag.id} className={`rounded-lg p-2 text-center text-xs border ${s.bg} border-slate-200`}>
                <div className={`font-bold text-base ${s.text}`}>{ag.penet_pct}%</div>
                <div className="text-[10px] text-slate-600 truncate">{ag.nom.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-500">{ag.agents} agents</div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function TabMarche({ data }: { data: typeof MOCK_COMMUNICATION_HOME }) {
  const { marche } = data
  return (
    <div className="space-y-5">
      {/* Zones potentiel */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          Zones non couvertes à fort potentiel
        </h4>
        <div className="space-y-2">
          {marche.zones_potentiel.map((z, i) => {
            const s = POTENTIEL_STYLE[z.potentiel] || POTENTIEL_STYLE.MODERE
            return (
              <div key={i} className={`rounded-xl border p-3 ${s.bg} border-slate-200`}>
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-bold text-slate-900">{z.zone}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}>{z.potentiel.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-600">{z.prospects_estimes} prospects estimés · {z.couverture_pct}% couverts</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${s.text}`}>{z.confidence}% conf.</span>
                </div>
                <div className="text-xs text-slate-700 font-semibold">→ {z.action}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Segmentation clients */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Segmentation & Performance par segment</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={marche.segments_clients} dataKey="count" nameKey="segment" cx="50%" cy="50%" outerRadius={80} label={(e: any) => `${e.pct || Math.round((e.count / marche.segments_clients.reduce((s, c) => s + c.count, 0))*100)}%`}>
                {marche.segments_clients.map((_, i) => <Cell key={i} fill={SEG_COLORS[i % SEG_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {marche.segments_clients.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 text-xs">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: SEG_COLORS[i % SEG_COLORS.length] }} />
                <span className="flex-1 font-semibold text-slate-800">{s.segment}</span>
                <span className="text-slate-600">{s.count} clients</span>
                <span className={`font-bold ${s.taux_conv >= 60 ? 'text-emerald-700' : s.taux_conv >= 40 ? 'text-yellow-700' : 'text-slate-600'}`}>{s.taux_conv}%</span>
                <span className={`text-[10px] ${s.croissance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{s.croissance > 0 ? '+' : ''}{s.croissance}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
//   TAB — Budget & ROI
// =============================================================================
function TabBudget({ data }: { data: typeof MOCK_COMMUNICATION_HOME }) {
  const b = data.budget
  return (
    <div className="space-y-4">
      {/* KPIs budget */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <KpiCard label="Budget total"    value={formatFcfa(b.total_mois)}    color="text-slate-700"   bg="bg-slate-50" />
        <KpiCard label="Consommé"        value={formatFcfa(b.consomme)}      color="text-violet-700"  bg="bg-violet-50" sub={`${b.taux_consomme_pct}%`} />
        <KpiCard label="Restant"         value={formatFcfa(b.restant)}       color="text-emerald-700" bg="bg-emerald-50" />
        <KpiCard label="ROI global"      value={`${b.roi_global}x`}          color="text-amber-700"   bg="bg-amber-50" />
      </div>

      {/* Répartition budget */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Répartition par poste</h4>
        <div className="space-y-2">
          {b.repartition.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-32 text-xs font-semibold text-slate-700 shrink-0 text-right">{r.poste}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full flex items-center px-2" style={{ width: `${r.pct}%` }}>
                  <span className="text-white text-[10px] font-bold">{r.pct}%</span>
                </div>
              </div>
              <div className="w-20 text-xs text-slate-600 text-right shrink-0">{formatFcfa(r.consomme)} / {formatFcfa(r.budget)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Évolution mensuelle */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Dépenses & CAC sur 5 mois</h4>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={b.evolution_mensuelle}>
            <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v: number) => `${v/1000}k`} />
            <Tooltip formatter={(v: any, n: any) => [n === 'depense' ? formatFcfa(Number(v)) : `${v} leads`, n === 'depense' ? 'Dépenses' : 'Leads']} />
            <Bar dataKey="depense" fill="#7c3aed" radius={[4, 4, 0, 0]} name="depense" />
            <Bar dataKey="leads"   fill="#14b8a6" radius={[4, 4, 0, 0]} name="leads" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// =============================================================================
//   TAB — Communication institutionnelle
// =============================================================================
function TabInstitutionnel({ data }: { data: typeof MOCK_COMMUNICATION_HOME }) {
  const ci = data.communication_institutionnelle
  return (
    <div className="space-y-5">
      {/* Événements */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          Agenda événements & actions comm.
        </h4>
        <div className="space-y-2">
          {ci.evenements_prevus.map((e, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="text-xs font-bold text-slate-700 w-20 shrink-0">{e.date}</div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900">{e.titre}</div>
                <div className="text-[10px] text-slate-500">{e.type} · {e.lieu}</div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUT_EVENT[e.statut]}`}>{e.statut.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Partenariats */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          Partenariats actifs & en négociation
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Partenaire</th>
                <th className="text-left px-3 py-2 font-semibold">Type</th>
                <th className="text-left px-3 py-2 font-semibold">Valeur</th>
                <th className="text-center px-2 py-2 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ci.partenariats.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-semibold text-slate-900">{p.partenaire}</td>
                  <td className="px-3 py-2 text-slate-600">{p.type}</td>
                  <td className="px-3 py-2 text-slate-700 font-semibold">{p.valeur}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{p.statut.replace('_', ' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Publications planifiées */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-600" />
          Publications planifiées
        </h4>
        <div className="space-y-2">
          {ci.publications_planifiees.map((p, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 w-16 shrink-0">{p.date}</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold text-[10px] shrink-0">{p.canal}</span>
              <span className="flex-1 text-slate-700">{p.sujet}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.statut === 'A_PUBLIER' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{p.statut.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
//   SUB-COMPONENTS
// =============================================================================
function MiniKpi({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center mb-1.5`} />
      <div className="text-base font-black text-slate-900 leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  )
}

function KpiCard({ label, value, color, bg, sub }: { label: string; value: string | number; color: string; bg: string; sub?: string }) {
  return (
    <div className={`${bg} rounded-lg p-2.5 text-center`}>
      <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">{label}</div>
      <div className={`text-base sm:text-lg font-black ${color} leading-tight mt-0.5`}>{value}</div>
      {sub && <div className="text-[9px] text-slate-500">{sub}</div>}
    </div>
  )
}

function Tb({ label, icon, color, active, onClick }: { label: string; icon: React.ReactNode; color: string; active: boolean; onClick: () => void }) {
  const ac: Record<string, string> = {
    indigo: 'border-indigo-500 text-indigo-700', cyan:    'border-cyan-500   text-cyan-700',
    amber:  'border-amber-500  text-amber-700',  blue:    'border-blue-500   text-blue-700',
    pink:   'border-pink-500   text-pink-700',   emerald: 'border-emerald-500 text-emerald-700',
    violet: 'border-violet-500 text-violet-700', slate:   'border-slate-500  text-slate-700',
  }
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-3 border-b-2 font-semibold text-xs whitespace-nowrap transition ${
        active ? ac[color] : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}>
      {icon}{label}
    </button>
  )
}
