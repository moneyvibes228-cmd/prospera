'use client'
import { useState } from 'react'
import {
  MessageSquare, TrendingUp, MapPin, Zap, Bot, Users, Star, Globe, Smartphone,
  ArrowUp, ArrowDown, Target, Megaphone, Heart, BarChart2, Award, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
} from 'recharts'
import { MOCK_MARKETING, OBJECTIFS_MARKETING } from '@/lib/mockDataByRole'
import { KpiCard } from '../KpiCard'
import { AiBadge } from '../AiBadge'
import { AiInsightPanel } from '../AiInsightPanel'
import { ObjectifsPanel } from '../ObjectifsPanel'
import { formatFcfa } from '@/lib/utils'

const d = MOCK_MARKETING

const TABS = [
  { id: 'synthese',  label: 'Synthèse',    icon: BarChart2 },
  { id: 'chatbot',   label: 'Chatbot IA',  icon: Bot },
  { id: 'pipeline',  label: 'Pipeline CRM',icon: Target },
  { id: 'campagnes', label: 'Campagnes',   icon: Megaphone },
  { id: 'presence',  label: 'Présence',    icon: Globe },
  { id: 'fidelite',  label: 'Fidélité',    icon: Heart },
] as const
type TabId = typeof TABS[number]['id']

function Tab({ id, label, icon: Icon, active, onClick }: { id: string; label: string; icon: typeof BarChart2; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${active ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
      <Icon size={13} />
      {label}
    </button>
  )
}

// ── Onglet Synthèse ───────────────────────────────────────────────────────────
function TabSynthese() {
  return (
    <div className="space-y-5">
      <ObjectifsPanel objectifs={OBJECTIFS_MARKETING} prenom="Adjoa" />

      {/* KPIs ligne 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Leads ce mois" value={d.kpis.leads_mois} icon={TrendingUp} colorScheme="blue"
          subtext={`${d.kpis.leads_qualifies} qualifiés · ${d.kpis.leads_convertis} convertis`} variation={12} variationLabel="vs mois préc." />
        <KpiCard title="Taux conversion" value={`${d.kpis.taux_conversion}%`} icon={Zap} colorScheme="teal"
          subtext={`CAC moyen : ${d.kpis.cac_moyen.toLocaleString()} FCFA`} variation={5.2} />
        <KpiCard title="Pipeline en cours" value={formatFcfa(d.kpis.pipeline_valeur)} icon={Target} colorScheme="orange"
          subtext="Valeur estimée à convertir" />
        <KpiCard title="Score présence" value={`${d.kpis.score_presence_digitale}/100`} icon={Globe} colorScheme="blue"
          subtext="Objectif 85 — +5pts ce mois" variation={5} />
      </div>

      {/* KPIs ligne 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Nouveaux clients" value={d.kpis.nouveaux_clients_mois} icon={Users} colorScheme="teal"
          subtext={`${d.kpis.clients_perdus_mois} départs · Attrition ${100 - d.kpis.taux_retention}%`} />
        <KpiCard title="NPS" value={d.kpis.nps} icon={Star} colorScheme="teal"
          subtext="Score recommandation client" variation={4} />
        <KpiCard title="Parrainages mois" value={d.kpis.referrals_mois} icon={Heart} colorScheme="orange"
          subtext="Leads via référencement · 75% conv." variation={3} />
        <KpiCard title="Chatbot actif" value={`${d.kpis.chatbot_conversations} conv.`} icon={MessageSquare} colorScheme="blue"
          subtext={`${d.kpis.chatbot_leads_crees} leads · rép. ${d.kpis.temps_reponse_moyen_min}min`} />
      </div>

      {/* Funnel + Leads par agence */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Funnel d&apos;acquisition — mai 2026</h3>
            <AiBadge variant="small" label="Optimisé IA" />
          </div>
          <div className="space-y-2">
            {d.funnel.map((step, i) => {
              const pct = Math.round((step.count / d.funnel[0].count) * 100)
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{step.etape}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{step.count}</span>
                      <span className="text-slate-400 w-9 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full flex items-center transition-all" style={{ width: `${pct}%`, backgroundColor: step.color }}>
                      {pct > 18 && <span className="text-white text-[10px] font-bold ml-2">{step.count}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Taux global : <span className="font-bold text-teal-700">{d.kpis.taux_conversion}%</span></span>
            <span>LTV moyen : <span className="font-bold text-slate-700">{formatFcfa(d.kpis.ltv_moyen)}</span></span>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Leads & conversions par agence</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.leads_par_agence} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="agence" tick={{ fontSize: 10 }} width={85} />
              <Tooltip />
              <Bar dataKey="leads" name="Leads" radius={[0, 4, 4, 0]}>
                {d.leads_par_agence.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.6} />)}
              </Bar>
              <Bar dataKey="convertis" name="Convertis" radius={[0, 4, 4, 0]}>
                {d.leads_par_agence.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {d.leads_par_agence.map(ag => (
              <div key={ag.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.color }} />
                  <span className="text-slate-600">{ag.agence}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${ag.taux >= 50 ? 'text-green-600' : ag.taux >= 35 ? 'text-orange-600' : 'text-red-600'}`}>{ag.taux}% conv.</span>
                  <span className="text-slate-400">{formatFcfa(ag.pipeline)} pipeline</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IA Insights */}
      <AiInsightPanel titre="Insights IA Marketing" insights={d.ia_insights} collapsible />

      {/* Zones potentiel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Zones non couvertes — opportunités identifiées par l&apos;IA</h3>
          <AiBadge variant="small" label="Analyse territoire" confidence={85} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
          {d.zones_potentiel.map((z, i) => {
            const potStyle: Record<string, string> = {
              TRES_ELEVE: 'bg-red-50 border-red-200',
              ELEVE:      'bg-orange-50 border-orange-200',
              MODERE:     'bg-yellow-50 border-yellow-200',
            }
            const badgeStyle: Record<string, string> = {
              TRES_ELEVE: 'bg-red-100 text-red-700 border-red-200',
              ELEVE:      'bg-orange-100 text-orange-700 border-orange-200',
              MODERE:     'bg-yellow-100 text-yellow-700 border-yellow-200',
            }
            return (
              <div key={i} className={`p-3.5 rounded-xl border ${potStyle[z.potentiel]}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-800">{z.zone}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold whitespace-nowrap flex-shrink-0 ${badgeStyle[z.potentiel]}`}>
                    {z.potentiel.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Couverture actuelle : <span className="font-bold text-slate-700">{z.taux_couverture}%</span></span>
                  <span className="text-slate-500">~<span className="font-bold">{z.estimes}</span> prospects</span>
                </div>
                <div className="bg-slate-200 rounded-full h-1.5 mb-2">
                  <div className="h-full rounded-full bg-teal-500" style={{ width: `${z.taux_couverture}%` }} />
                </div>
                <p className="text-xs text-teal-700 font-medium">→ {z.action}</p>
                <div className="text-[10px] text-slate-400 mt-1">Conf. IA : {z.confidence}%</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Onglet Chatbot IA ─────────────────────────────────────────────────────────
function TabChatbot() {
  return (
    <div className="space-y-5">
      {/* Stats chatbot */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Chatbot IA WhatsApp — Prospera Bot</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-700 font-semibold">Actif 24h/24 — 7j/7</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Conversations mois', val: d.kpis.chatbot_conversations, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
            { label: 'Leads créés',         val: d.kpis.chatbot_leads_crees,   color: 'text-teal-700', bg: 'bg-teal-50 border-teal-100' },
            { label: 'Qualifiés auto',       val: d.chatbot_stats.qualifies_auto, color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
            { label: 'Transférés agent',    val: d.chatbot_stats.transferes_agent, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
            { label: 'Satisfaction',         val: `${d.chatbot_stats.satisfaction_score}/5`, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} p-3 rounded-xl border text-center`}>
              <div className={`text-2xl font-black ${item.color}`}>{item.val}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 mb-1">Taux résolution automatique</div>
            <div className="text-xl font-bold text-teal-700">{d.chatbot_stats.taux_resolution_auto}%</div>
            <div className="bg-slate-200 rounded-full h-1.5 mt-1">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${d.chatbot_stats.taux_resolution_auto}%` }} />
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 mb-1">Sujets les plus fréquents</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {d.chatbot_stats.sujets_top.map((s, i) => (
                <span key={i} className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full border border-teal-200">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap horaire */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Heatmap des leads entrants — par heure</h3>
          <AiBadge variant="small" label="Pic : 19h (21 leads)" />
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={d.chatbot_heatmap} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="heure" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="leads" name="Leads" radius={[3, 3, 0, 0]}>
              {d.chatbot_heatmap.map((entry, i) => (
                <Cell key={i} fill={entry.leads >= 15 ? '#0d9488' : entry.leads >= 8 ? '#14b8a6' : '#99f6e4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-400 text-center">
          💡 <span className="text-teal-700 font-medium">Envoyer les campagnes WA à 17h30</span> pour maximiser la portée pendant le pic 18h-21h
        </div>
      </div>

      {/* Conversations récentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Conversations récentes — aujourd&apos;hui</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {d.chatbot_conversations_recentes.map((conv, i) => {
            const statutStyle: Record<string, { bg: string; label: string }> = {
              LEAD_CREE:   { bg: 'bg-green-100 text-green-700',  label: 'Lead créé' },
              TRANSFERE:   { bg: 'bg-blue-100 text-blue-700',    label: 'Transféré' },
              QUALIFIE:    { bg: 'bg-teal-100 text-teal-700',    label: 'Qualifié' },
              REDIRIGE_GES:{ bg: 'bg-indigo-100 text-indigo-700',label: 'Vers gestionnaire' },
            }
            const st = statutStyle[conv.statut] ?? { bg: 'bg-slate-100 text-slate-500', label: conv.statut }
            return (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50">
                <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0 text-sm">💬</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">{conv.nom}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${st.bg}`}>{st.label}</span>
                    {conv.score && <span className="text-xs text-indigo-600 font-bold">Score {conv.score}</span>}
                    {conv.attribue_a && <span className="text-xs text-slate-400">→ {conv.attribue_a}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 italic">&ldquo;{conv.message}&rdquo;</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{conv.heure}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Onglet Pipeline CRM ───────────────────────────────────────────────────────
function TabPipeline() {
  const statutStyle: Record<string, string> = {
    CHAUD: 'bg-red-100 text-red-700 border-red-200',
    TIEDE: 'bg-orange-100 text-orange-700 border-orange-200',
    FROID: 'bg-slate-100 text-slate-500 border-slate-200',
  }
  const scoreColor = (s: number) => s >= 75 ? 'bg-green-100 text-green-700' : s >= 55 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'

  return (
    <div className="space-y-5">
      {/* Stats pipeline */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Leads actifs', val: d.leads_pipeline.length, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Valeur pipeline', val: formatFcfa(d.kpis.pipeline_valeur), color: 'text-teal-700', bg: 'bg-teal-50 border-teal-100' },
          { label: 'Score IA moy.', val: Math.round(d.leads_pipeline.reduce((s, l) => s + l.score, 0) / d.leads_pipeline.length), color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
        ].map(item => (
          <div key={item.label} className={`p-4 rounded-xl border text-center ${item.bg}`}>
            <div className={`text-2xl font-black ${item.color}`}>{item.val}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Liste leads */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Pipeline leads — scorés par l&apos;IA</h3>
          <AiBadge variant="small" label="XGBoost v2.4" confidence={91} />
        </div>
        <div className="divide-y divide-slate-50">
          {d.leads_pipeline.map(lead => (
            <div key={lead.id} className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${scoreColor(lead.score)}`}>
                {lead.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-semibold text-slate-800">{lead.nom}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${statutStyle[lead.statut]}`}>{lead.statut}</span>
                  <span className="text-xs text-slate-400">{lead.source}</span>
                  <span className="text-xs text-slate-400">{lead.zone}</span>
                </div>
                <p className="text-xs text-slate-600">{lead.besoin}{lead.montant_estim ? ` · ${formatFcfa(lead.montant_estim)} estimé` : ''}</p>
                <p className="text-xs text-slate-400 italic mt-0.5">💡 {lead.motif_ia}</p>
                <p className="text-xs text-teal-700 font-medium mt-1">→ {lead.suivant}</p>
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0">{lead.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Segments */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Analyse des segments clients</h3>
          <AiBadge variant="small" label="Segmentation IA" />
        </div>
        <div className="space-y-3">
          {d.segments.map(seg => (
            <div key={seg.segment} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-sm font-semibold text-slate-800">{seg.segment}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">{seg.count} leads</span>
                  <span className={`font-bold ${seg.taux_conv >= 60 ? 'text-green-600' : seg.taux_conv >= 40 ? 'text-orange-600' : 'text-slate-500'}`}>{seg.taux_conv}% conv.</span>
                  <span className="text-slate-400">{formatFcfa(seg.montant_moyen)}/crédit</span>
                  <span className="flex items-center gap-0.5 font-medium text-teal-600">
                    <TrendingUp size={10} />{seg.croissance}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-400">Canal préféré : <span className="font-medium text-slate-600">{seg.canal_pref}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Onglet Campagnes ──────────────────────────────────────────────────────────
function TabCampagnes() {
  return (
    <div className="space-y-5">
      {/* Campagnes actives */}
      <div className="space-y-4">
        {d.campagnes.map((c, i) => (
          <div key={i} className={`bg-white rounded-xl border-2 p-5 shadow-sm ${c.statut === 'ACTIVE' ? 'border-green-200' : 'border-slate-200 opacity-75'}`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-slate-900">{c.nom}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.statut === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>{c.statut}</span>
                  <span className="text-xs text-slate-400">{c.type}</span>
                </div>
                {c.statut === 'ACTIVE' && <div className="text-xs text-slate-400 mt-0.5">Se termine le {c.fin}</div>}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-black text-green-600">{c.roi}x</div>
                <div className="text-xs text-slate-400">ROI</div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
              {[
                { label: 'Envoyés',     val: c.envois },
                { label: 'Ouvertures', val: `${c.ouvertures} (${Math.round((c.ouvertures/c.envois)*100)}%)` },
                { label: 'Clics',       val: c.clics },
                { label: 'Conversions',val: c.conversions },
                { label: 'Revenu',      val: formatFcfa(c.revenu_genere) },
              ].map(m => (
                <div key={m.label} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                  <div className="text-sm font-bold text-slate-800">{m.val}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 flex items-start gap-2">
              <Zap size={12} className="text-indigo-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-700">{c.ia_note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommandations campagnes IA */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone size={15} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-900">Campagnes recommandées par l&apos;IA — juin 2026</h3>
          <AiBadge variant="small" label="Prédiction ROI" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {d.ia_recommandations_campagnes.map((r, i) => (
            <div key={i} className="bg-white rounded-xl border border-amber-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-bold text-slate-900">{r.titre}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{r.canal} · Budget {formatFcfa(r.budget)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-black text-green-600">{r.roi_estime}x</div>
                  <div className="text-[10px] text-slate-400">ROI estimé</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2">{r.desc}</p>
              <div className="text-xs text-teal-600 font-medium">🎯 {r.cible}</div>
              <div className="text-[10px] text-slate-400 mt-1">Conf. IA : {r.confidence}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance par canal */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Performance par canal d&apos;acquisition</h3>
        <div className="space-y-3">
          {[...d.performance_canaux].sort((a, b) => b.taux - a.taux).map((c, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-800">{c.canal}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-black text-sm ${c.taux >= 50 ? 'text-green-600' : c.taux >= 30 ? 'text-orange-600' : 'text-red-500'}`}>{c.taux}%</span>
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${c.trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {c.trend > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{Math.abs(c.trend)}%
                  </span>
                </div>
              </div>
              <div className="bg-slate-200 rounded-full h-2 mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${c.taux}%`, backgroundColor: c.taux >= 50 ? '#16a34a' : c.taux >= 30 ? '#f97316' : '#dc2626' }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{c.leads} leads · {c.convertis} conv. · pic {c.meilleure_heure}</span>
                <span className={c.cout_lead === 0 ? 'text-green-600 font-bold' : ''}>{c.cout_lead === 0 ? '🆓 Gratuit' : `${c.cout_lead.toLocaleString()} FCFA/lead`}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Onglet Présence digitale ──────────────────────────────────────────────────
function TabPresence() {
  const p = d.presence_digitale
  const scorePct = (p.score_global / p.score_cible) * 100
  return (
    <div className="space-y-5">
      {/* Score global */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">Score présence digitale globale</div>
            <div className="flex items-end gap-2">
              <div className="text-5xl font-black text-teal-400">{p.score_global}</div>
              <div className="text-slate-400 mb-1">/100</div>
            </div>
            <div className="text-xs text-slate-300 mt-1">Objectif : {p.score_cible} · <span className="text-green-400">+{p.evolution_pts}pts ce mois</span></div>
          </div>
          <div className="text-right">
            <div className="w-24 h-24 relative flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#14b8a6" strokeWidth="3"
                  strokeDasharray={`${scorePct} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute text-sm font-bold text-teal-400">{p.score_global}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 piliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Google Maps */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">📍</div>
            <h3 className="text-sm font-semibold text-slate-900">Google Maps</h3>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${p.google_maps.note >= 4.5 ? 'bg-green-100 text-green-700' : p.google_maps.note >= 4.0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
              ★ {p.google_maps.note}/5
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <div className="text-xl font-black text-slate-800">{p.google_maps.avis}</div>
              <div className="text-xs text-slate-400">Avis publiés</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <div className="text-xl font-black text-slate-800">{p.google_maps.vues_mois.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Vues ce mois</div>
            </div>
          </div>
          <div className={`mt-3 p-2.5 rounded-xl text-xs ${p.google_maps.profil_complet ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
            {p.google_maps.profil_complet ? '✓ Profil complet (photos, horaires, lien)' : '⚠ Profil incomplet — à compléter'}
          </div>
        </div>

        {/* Facebook */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">📘</div>
            <h3 className="text-sm font-semibold text-slate-900">Facebook / Meta</h3>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{p.facebook.engagement_pct}% engage.</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2 bg-slate-50 rounded-xl text-center">
              <div className="text-base font-black text-slate-800">{p.facebook.followers.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Followers</div>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl text-center">
              <div className="text-base font-black text-slate-800">{p.facebook.portee_mois.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Portée/mois</div>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl text-center">
              <div className="text-base font-black text-slate-800">{p.facebook.posts_mois}</div>
              <div className="text-xs text-slate-400">Posts/mois</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            🏆 Meilleur post : <span className="font-medium text-slate-700">{p.facebook.meilleur_post}</span>
          </div>
        </div>

        {/* WhatsApp Business */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">💬</div>
            <h3 className="text-sm font-semibold text-slate-900">WhatsApp Business</h3>
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">● Actif</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-xl text-center border border-green-100">
              <div className="text-xl font-black text-green-700">{p.whatsapp_business.contacts_opt_in}</div>
              <div className="text-xs text-slate-500">Contacts opt-in</div>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-center border border-green-100">
              <div className="text-xl font-black text-green-700">{p.whatsapp_business.taux_lecture}%</div>
              <div className="text-xs text-slate-500">Taux de lecture</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 text-center">{p.whatsapp_business.broadcasts_mois} broadcast(s) ce mois · {p.whatsapp_business.reponses} réponses reçues</div>
        </div>

        {/* Site web */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">🌐</div>
            <h3 className="text-sm font-semibold text-slate-900">Site Web</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2.5 bg-slate-50 rounded-xl text-center">
              <div className="text-lg font-black text-slate-800">{p.site_web.visites_mois}</div>
              <div className="text-xs text-slate-400">Visites/mois</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl text-center">
              <div className="text-lg font-black text-slate-800">{p.site_web.leads_generes}</div>
              <div className="text-xs text-slate-400">Leads générés</div>
            </div>
          </div>
          <div className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 border border-orange-100">
            ⚠ Taux de rebond {p.site_web.bounce_rate}% · Durée moy. {p.site_web.duree_moy} — formulaire de demande manquant
          </div>
        </div>
      </div>

      {/* Recommandations IA présence */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Zap size={14} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Plan d&apos;action présence digitale — recommandations IA</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {p.recommandations_ia.map((r, i) => {
            const prioStyle: Record<string, string> = {
              HAUTE:  'bg-red-100 text-red-700 border-red-200',
              ELEVE:  'bg-orange-100 text-orange-700 border-orange-200',
              MODERE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            }
            return (
              <div key={i} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-bold flex-shrink-0 ${prioStyle[r.priorite]}`}>{r.priorite}</span>
                <div>
                  <div className="text-xs font-semibold text-slate-700">{r.axe}</div>
                  <p className="text-xs text-slate-500 mt-0.5">{r.action}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Onglet Fidélisation ───────────────────────────────────────────────────────
function TabFidelite() {
  const r = d.retention
  return (
    <div className="space-y-5">
      {/* KPIs rétention */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-teal-100 p-4 text-center shadow-sm">
          <div className="text-3xl font-black text-teal-700">{r.taux}%</div>
          <div className="text-xs text-slate-400 mt-1">Taux de rétention</div>
        </div>
        <div className="bg-white rounded-xl border border-yellow-100 p-4 text-center shadow-sm">
          <div className="text-3xl font-black text-yellow-600">{r.nps}</div>
          <div className="text-xs text-slate-400 mt-1">Net Promoter Score</div>
          <div className="text-xs text-slate-400">{r.nps >= 70 ? '✓ Excellent' : r.nps >= 50 ? '→ Bon' : '⚠ À améliorer'}</div>
        </div>
        <div className="bg-white rounded-xl border border-indigo-100 p-4 text-center shadow-sm">
          <div className="text-3xl font-black text-indigo-700">{r.ambassadeurs_potentiels}</div>
          <div className="text-xs text-slate-400 mt-1">Ambassadeurs potentiels</div>
          <div className="text-xs text-slate-400">Score &gt;80 · actifs</div>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4 text-center shadow-sm">
          <div className="text-3xl font-black text-orange-600">{r.clients_a_risque_attrition}</div>
          <div className="text-xs text-slate-400 mt-1">À risque d&apos;attrition</div>
          <div className="text-xs text-red-500">Action IA recommandée</div>
        </div>
      </div>

      {/* Programme parrainage */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-pink-500" />
            <h3 className="text-sm font-semibold text-slate-900">Programme de parrainage — {r.referrals_mois} parrainages ce mois</h3>
          </div>
          <AiBadge variant="small" label="ROI ×0 — meilleur canal" />
        </div>
        <div className="divide-y divide-slate-50">
          {r.parrainage_actif.map((p, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-8 h-8 bg-pink-100 rounded-xl flex items-center justify-center text-sm">🌟</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{p.parrain}</div>
                <div className="text-xs text-slate-400">{p.filleuls} filleul{p.filleuls > 1 ? 's' : ''} converti{p.filleuls > 1 ? 's' : ''}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-teal-700">{formatFcfa(p.credits_generes)}</div>
                <div className="text-xs text-slate-400">crédits générés</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-pink-50 border-t border-pink-100">
          <p className="text-xs text-pink-700">💡 <span className="font-semibold">Lancer un programme structuré</span> : 500 FCFA par filleul converti → {r.ambassadeurs_potentiels} ambassadeurs identifiés = potentiel de {r.ambassadeurs_potentiels * 2} nouveaux leads/mois</p>
        </div>
      </div>

      {/* Avis Google */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Avis clients récents — Google Maps ★ {d.presence_digitale.google_maps.note}/5</h3>
          <span className="text-xs text-orange-600 font-medium">4 sans réponse — à traiter</span>
        </div>
        <div className="divide-y divide-slate-50">
          {r.avis_google.map((a, i) => (
            <div key={i} className="px-5 py-3.5 hover:bg-slate-50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800">{a.auteur}</span>
                <span className="text-yellow-500">{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</span>
                <span className="text-xs text-slate-400 ml-auto">{a.date}</span>
              </div>
              <p className="text-xs text-slate-600 italic">&ldquo;{a.texte}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>

      {/* Raisons de départ */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Analyse des départs — {d.kpis.clients_perdus_mois} clients perdus ce mois</h3>
        <div className="space-y-2.5">
          {r.raisons_departs.map((reason, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">{reason.raison}</span>
                <span className="text-slate-500">{reason.count} cas · {reason.pct}%</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2">
                <div className="h-full rounded-full bg-red-400" style={{ width: `${reason.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-700">
          💡 <span className="font-semibold">Action IA :</span> Contacter les 8 clients à risque d&apos;attrition identifiés avec une offre de rétention personnalisée (réduction frais, étalement remboursement).
        </div>
      </div>
    </div>
  )
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export function DashboardMarketing() {
  const [activeTab, setActiveTab] = useState<TabId>('synthese')

  return (
    <div className="space-y-4">
      {/* Bandeau en-tête */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-indigo-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Megaphone size={16} />
              <span className="text-sm font-bold">Dashboard Marketing & Acquisition — Prospera</span>
              <AiBadge label="IA active" pulse />
            </div>
            <p className="text-xs text-teal-200">
              {d.kpis.leads_mois} leads · {d.kpis.leads_convertis} convertis ({d.kpis.taux_conversion}%) · Pipeline {formatFcfa(d.kpis.pipeline_valeur)} · NPS {d.kpis.nps} · Présence digitale {d.kpis.score_presence_digitale}/100
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-black">{d.kpis.taux_retention}%</div>
            <div className="text-xs text-teal-200">Rétention réseau</div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <Tab key={tab.id} {...tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
        ))}
      </div>

      {/* Contenu onglet actif */}
      {activeTab === 'synthese'  && <TabSynthese />}
      {activeTab === 'chatbot'   && <TabChatbot />}
      {activeTab === 'pipeline'  && <TabPipeline />}
      {activeTab === 'campagnes' && <TabCampagnes />}
      {activeTab === 'presence'  && <TabPresence />}
      {activeTab === 'fidelite'  && <TabFidelite />}
    </div>
  )
}
