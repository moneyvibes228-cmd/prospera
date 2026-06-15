'use client'
import dynamic from 'next/dynamic'
import {
  Activity, Target, TrendingUp, TrendingDown, Users, Bell, Wallet,
  MapPin, Building2, Lightbulb, Award, BarChart3,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { AgentCalendrierRcc } from '@/components/rcc/AgentCalendrierRcc'
import { CollecteSecteursRcc } from '@/components/rcc/CollecteSecteursRcc'
import { getRccHubData } from '@/lib/rcc-commercial-hub'
import { formatFcfa } from '@/lib/utils'

const MapCommercialCollecte = dynamic(() => import('@/components/rcc/MapCommercialCollecte'), { ssr: false })

const STATUT_AGENT: Record<string, string> = {
  BON: 'bg-green-100 text-green-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  SOUS_PERF: 'bg-orange-100 text-orange-700',
  INACTIF: 'bg-red-100 text-red-700',
}

const SEVERITE_BORDER: Record<string, string> = {
  CRITIQUE: 'border-red-400 bg-red-50 text-red-900',
  HAUTE: 'border-orange-400 bg-orange-50 text-orange-900',
  MOYENNE: 'border-yellow-400 bg-yellow-50 text-yellow-900',
  INFO: 'border-blue-400 bg-blue-50 text-blue-900',
}

const SEVERITE_PILL: Record<string, string> = {
  CRITIQUE: 'bg-red-600 text-white',
  HAUTE: 'bg-orange-500 text-white',
  MOYENNE: 'bg-yellow-400 text-yellow-900',
  INFO: 'bg-blue-500 text-white',
}

const CAT_COLOR: Record<string, string> = {
  COMMERCIAL: 'bg-purple-100 text-purple-700',
  COLLECTE: 'bg-teal-100 text-teal-700',
  EQUIPE: 'bg-blue-100 text-blue-700',
}

const TENDANCE_ICON = {
  HAUSSE: TrendingUp,
  BAISSE: TrendingDown,
  STABLE: Activity,
}

export default function DashboardResponsableCommercial() {
  const hub = getRccHubData()
  const { kpis_commercial: kc, kpis_collecte: kco, kpis_equipe: ke } = hub
  const obj = hub.objectifs

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Bonjour {(hub.agent?.nom ?? 'Responsable').split(' ')[0]} — Commercial & Collecte
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {hub.agent?.perimetre ?? 'Réseau'} · collecte {kco?.taux_collecte_pct ?? 0}% · {ke?.agents_actifs ?? 0} agents actifs ·
            {kc.nouveaux_clients_mois} nouveaux clients ce mois
          </p>
        </div>
        <ExportButton label="Exporter rapport réseau" filename="rapport_rcc" />
      </div>

      {/* Synthèse IA enrichie */}
      <RapportIAGlobal
        rapport={hub.rapport}
        accentColor="teal"
        analyseLabel="Responsable Commerciale & Collecte — Réseau"
      />

      {/* KPIs — Commercial · Collecte · Équipe */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-fuchsia-700" />
          <h2 className="text-sm font-bold text-slate-900">Santé commerciale & collecte — temps réel</h2>
          <AiBadge variant="small" pulse />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiBlock title="Commercial" icon={Target} gradient="from-purple-600 to-fuchsia-700">
            <KpiWhite label="Nouveaux clients" value={kc.nouveaux_clients_jour} sub="aujourd'hui" />
            <KpiWhite label="Objectif mois" value={`${kc.objectif_commercial_pct}%`} sub={`${kc.nouveaux_clients_mois}/${kc.objectif_clients_mois}`} />
            <KpiWhite label="Prospects actifs" value={kc.prospects_actifs} sub="en cours" />
            <KpiWhite label="Conversion" value={`${kc.taux_conversion_pct}%`} sub="mensuel" bright />
          </KpiBlock>
          <KpiBlock title="Collecte" icon={Wallet} gradient="from-teal-600 to-emerald-700">
            <KpiWhite label="Réalisé jour" value={formatFcfa(kco.collecte_jour_realise)} sub="FCFA" />
            <KpiWhite label="Taux collecte" value={`${kco.taux_collecte_pct}%`} sub="du jour" />
            <KpiWhite label="Promesses" value={kco.promesses_paiement_jour} sub={formatFcfa(kco.promesses_montant)} />
            <KpiWhite label="Retards" value={kco.retards_collecte} sub="clients" alert />
          </KpiBlock>
          <KpiBlock title="Équipe" icon={Users} gradient="from-blue-600 to-indigo-700">
            <KpiWhite label="Agents actifs" value={ke.agents_actifs} sub="terrain" />
            <KpiWhite label="Visites" value={`${ke.visites_realisees_jour}/${ke.visites_objectif_jour}`} sub="aujourd'hui" />
            <KpiWhite label="Sous-perf." value={ke.agents_sous_performance} sub="agents" alert />
            <KpiWhite label="Productivité" value={`${ke.productivite_moy_pct}%`} sub="moyenne" bright />
          </KpiBlock>
        </div>
      </section>

      {/* Propositions IA */}
      <section className="bg-gradient-to-br from-fuchsia-50 to-purple-50 border border-fuchsia-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-fuchsia-700" />
          <h2 className="text-sm font-bold text-slate-900">Propositions IA — actions prioritaires</h2>
          <AiBadge variant="small" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hub.propositions_ia.map(p => (
            <div key={p.priorite} className="bg-white rounded-lg border border-fuchsia-100 p-3 hover:shadow-sm transition-shadow duration-200">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 bg-fuchsia-700 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                  {p.priorite}
                </span>
                <div>
                  <p className="text-xs text-slate-800 font-medium leading-snug">{p.action}</p>
                  <p className="text-[10px] text-teal-700 font-bold mt-1">{p.impact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Analyse par agence */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Building2 size={15} className="text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Analyse par agence — commercial & collecte</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                <th className="text-left px-4 py-2.5 font-bold">Agence</th>
                <th className="text-left px-2 py-2.5 font-bold">Responsable</th>
                <th className="text-center px-2 py-2.5 font-bold">Score</th>
                <th className="text-right px-2 py-2.5 font-bold">Collecte</th>
                <th className="text-center px-2 py-2.5 font-bold">Signatures</th>
                <th className="text-center px-2 py-2.5 font-bold">Conv. leads</th>
                <th className="text-center px-2 py-2.5 font-bold">Remb.</th>
                <th className="text-center px-2 py-2.5 font-bold">Tendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {hub.agences.map(a => {
                const collectePct = Math.round(a.collecte_mois / a.collecte_objectif * 100)
                const TIcon = TENDANCE_ICON[a.tendance === 'HAUSSE' ? 'HAUSSE' : a.tendance === 'BAISSE' ? 'BAISSE' : 'STABLE']
                return (
                  <tr key={a.agence_id} className={`hover:bg-slate-50 ${a.score_commercial < 65 ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{a.agence}</td>
                    <td className="px-2 py-2.5 text-slate-600">{a.responsable}</td>
                    <td className="px-2 py-2.5 text-center">
                      <span className={`font-black ${a.score_commercial >= 80 ? 'text-green-700' : a.score_commercial >= 65 ? 'text-blue-700' : 'text-red-700'}`}>
                        {a.score_commercial}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <span className="font-bold text-teal-700">{formatFcfa(a.collecte_mois)}</span>
                      <span className={`ml-1 text-[10px] ${collectePct < 75 ? 'text-red-600' : 'text-slate-500'}`}>({collectePct}%)</span>
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold">{a.signatures_mois}/{a.objectif_signatures}</td>
                    <td className="px-2 py-2.5 text-center">{a.conv_leads_pct}%</td>
                    <td className="px-2 py-2.5 text-center">{a.taux_remboursement}%</td>
                    <td className="px-2 py-2.5 text-center">
                      <TIcon size={14} className={`inline ${a.tendance === 'HAUSSE' ? 'text-green-600' : a.tendance === 'BAISSE' ? 'text-red-600' : 'text-slate-400'}`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Carte zones + calendrier agents */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Zones contrôlées & collecte terrain</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-500/20" /> Zone OK</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-600" /> Point collecte</span>
            </div>
          </div>
          <div className="h-[340px]">
            <MapCommercialCollecte zones={hub.zones} points={hub.points_collecte} />
          </div>
          <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-2">
            {hub.zones.map(z => (
              <span key={z.id} className="text-[10px] px-2 py-0.5 rounded-full border font-medium" style={{ borderColor: z.couleur, color: z.couleur }}>
                {z.nom} · {Math.round(z.collecte_jour / z.objectif_jour * 100)}%
              </span>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <Activity size={15} className="text-fuchsia-600" />
            <h3 className="text-sm font-bold text-slate-900">Calendrier agents — aujourd&apos;hui</h3>
          </div>
          <AgentCalendrierRcc agents={hub.agents_calendrier} />
        </div>
      </section>

      {/* Équipe commerciale & collecte */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Award size={15} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Équipe commerciale & collecte — performance du jour</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                <th className="text-left px-4 py-2.5 font-bold">#</th>
                <th className="text-left px-2 py-2.5 font-bold">Agent</th>
                <th className="text-center px-2 py-2.5 font-bold hidden sm:table-cell">Badge</th>
                <th className="text-right px-2 py-2.5 font-bold">Collecte</th>
                <th className="text-center px-2 py-2.5 font-bold hidden sm:table-cell">Prospection</th>
                <th className="text-center px-2 py-2.5 font-bold hidden sm:table-cell">Conversion</th>
                <th className="text-center px-2 py-2.5 font-bold">Retards</th>
                <th className="text-center px-2 py-2.5 font-bold">Perf.</th>
                <th className="text-center px-2 py-2.5 font-bold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...(hub.equipe ?? [])].sort((a, b) => (b.perf_pct ?? 0) - (a.perf_pct ?? 0)).map((a, i) => {
                const statut = a.statut ?? 'NORMAL'
                const perf = a.perf_pct ?? 0
                return (
                <tr key={a.agent ?? i} className={`hover:bg-slate-50 ${statut === 'INACTIF' || statut === 'SOUS_PERF' ? 'bg-orange-50/30' : ''}`}>
                  <td className="px-4 py-2 font-black text-slate-400">{i + 1}</td>
                  <td className="px-2 py-2 font-bold text-slate-800">{a.agent}</td>
                  <td className="px-2 py-2 text-center hidden sm:table-cell">
                    {a.badge && <span className="text-[10px] font-bold text-amber-600">{a.badge}</span>}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-teal-700">{formatFcfa(a.collecte)}</td>
                  <td className="px-2 py-2 text-center hidden sm:table-cell">{a.prospection}</td>
                  <td className="px-2 py-2 text-center hidden sm:table-cell">{a.conversion}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`font-bold ${a.retard >= 6 ? 'text-red-700' : a.retard >= 3 ? 'text-orange-700' : 'text-slate-700'}`}>{a.retard}</span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-10 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${perf >= 80 ? 'bg-green-500' : perf >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, perf)}%` }}
                        />
                      </div>
                      <span className="font-bold text-[10px]">{perf}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUT_AGENT[statut] ?? STATUT_AGENT.NORMAL}`}>
                      {statut.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </section>

      {/* Objectifs + tendance + alertes */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-fuchsia-700" />
            Objectifs du mois
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Collecte', val: obj.collecte, fmt: 'fcfa' as const },
              { label: 'Nvx clients', val: obj.nouveaux_clients, fmt: 'count' as const },
              { label: 'Conversion', val: obj.taux_conversion, fmt: 'pct' as const },
              { label: 'Visites', val: obj.visites_terrain, fmt: 'count' as const },
            ].map((o, i) => (
              <ObjCard key={i} label={o.label} pct={o.val.pct} realise={o.val.realise} objectif={o.val.objectif} fmt={o.fmt} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-teal-600" />
            Tendance collecte (6 sem.)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={hub.collecte_tendance}>
              <XAxis dataKey="sem" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v) => formatFcfa(Number(v))} />
              <ReferenceLine y={20_000_000} stroke="#94a3b8" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="collecte" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} name="Collecte" />
              <Line type="monotone" dataKey="objectif" stroke="#e2e8f0" strokeWidth={1.5} dot={false} name="Objectif" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900">Alertes</h3>
            </div>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{hub.alertes.length}</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
            {hub.alertes.slice(0, 5).map((a, i) => (
              <div key={i} className={`p-3 border-l-4 ${SEVERITE_BORDER[a.severite]}`}>
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${CAT_COLOR[a.cat]}`}>{a.cat}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${SEVERITE_PILL[a.severite]}`}>{a.severite}</span>
                </div>
                <div className="text-[11px] font-semibold leading-tight">{a.titre}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collecte par secteur d'activité */}
      <CollecteSecteursRcc secteurs={hub.collecte_par_secteur} />
    </div>
  )
}

function KpiBlock({ title, icon: Icon, gradient, children }: {
  title: string; icon: React.ElementType; gradient: string; children: React.ReactNode
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-white shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 opacity-80" />
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  )
}

function KpiWhite({ label, value, sub, bright, alert }: {
  label: string; value: string | number; sub?: string; bright?: boolean; alert?: boolean
}) {
  return (
    <div className="bg-white/20 rounded-lg p-2 text-center">
      <div className="text-[9px] uppercase tracking-wider opacity-70 font-semibold">{label}</div>
      <div className={`text-sm font-black mt-0.5 ${bright ? 'text-yellow-300' : alert ? 'text-red-300' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-[9px] opacity-60">{sub}</div>}
    </div>
  )
}

function ObjCard({ label, pct, realise, objectif, fmt }: {
  label: string; pct: number; realise: number; objectif: number; fmt: 'fcfa' | 'count' | 'pct'
}) {
  const val = fmt === 'fcfa' ? formatFcfa(realise) : fmt === 'pct' ? `${realise}%` : realise
  const objVal = fmt === 'fcfa' ? formatFcfa(objectif) : fmt === 'pct' ? `${objectif}%` : objectif
  return (
    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
      <div className="text-[10px] font-bold text-slate-500 uppercase">{label}</div>
      <div className="text-sm font-black text-slate-900 mt-0.5">{val}</div>
      <div className="text-[10px] text-slate-500">Obj. {objVal}</div>
      <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}
