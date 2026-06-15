'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wallet, TrendingUp, CheckCircle2, Users, Target, Award,
  ArrowRight, MapPin, Activity, Phone, Layers, FileText,
  Route, Trophy, Sparkles, Clock,
} from 'lucide-react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { PortfolioClientGrid } from '@/components/gp/PortfolioClientGrid'
import { getGpHubData } from '@/lib/gp-portefeuille-hub'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { formatFcfa } from '@/lib/utils'

const SEGMENT_COLORS: Record<string, string> = {
  green: '#16a34a', yellow: '#eab308', red: '#dc2626',
  slate: '#64748b', purple: '#9333ea', blue: '#3b82f6',
}

const AGING_BG: Record<string, string> = {
  yellow: 'bg-yellow-100 border-yellow-300',
  orange: 'bg-orange-100 border-orange-300',
  red:    'bg-red-100 border-red-300',
  rose:   'bg-rose-200 border-rose-400',
}

const AGING_TEXT: Record<string, string> = {
  yellow: 'text-yellow-700', orange: 'text-orange-700',
  red: 'text-red-700', rose: 'text-rose-900',
}

const BADGE_ICON_COLOR: Record<string, string> = {
  OR: 'text-amber-500', ARGENT: 'text-slate-400', BRONZE: 'text-orange-600',
}

const STATUT_VISITE: Record<string, { bg: string; text: string; label: string }> = {
  PREVUE:   { bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'Prévue' },
  EFFECTUE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Effectuée' },
  MANQUEE:  { bg: 'bg-red-100',   text: 'text-red-700',   label: 'Manquée' },
}

const RESULTAT_LABEL: Record<string, string> = {
  PAIEMENT_OK: 'Paiement OK', PROMESSE: 'Promesse', INJOIGNABLE: 'Injoignable',
}

export function DashboardGestionnairePortefeuille() {
  const router = useRouter()
  const hub = getGpHubData()
  const d = hub
  const [segmentSelected, setSegmentSelected] = useState<string | null>(null)

  const clientsPrioritaires = [...hub.clients]
    .sort((a, b) => {
      const prio = { CRITIQUE: 0, HAUT: 1, MOYEN: 2, FAIBLE: 3 }
      return prio[a.risque] - prio[b.risque] || b.retard_j - a.retard_j
    })
    .slice(0, 6)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Bonjour {hub.agent.nom.split(' ')[0]} — Mon portefeuille
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {d.kpis_portefeuille.clients_actifs} clients · {formatFcfa(d.kpis_portefeuille.valeur_portefeuille)} ·
            PAR 30 {d.kpis_qualite.par_30_pct}% · {d.kpis_qualite.clients_en_retard} en retard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/emprunteurs')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors duration-200 cursor-pointer shadow-sm"
          >
            <Users size={15} />
            Mes clients
            <ArrowRight size={15} />
          </button>
          <ExportButton label="Exporter portefeuille" filename="portefeuille_gp" />
        </div>
      </div>

      {/* Synthèse IA enrichie */}
      <RapportIAGlobal
        rapport={hub.rapport}
        accentColor="teal"
        analyseLabel="Mawunya Kpodzo · Lomé Centre"
      />

      {/* KPIs condensés */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-sky-600" />
          <h2 className="text-sm font-bold text-slate-900">Indicateurs portefeuille</h2>
          <AiBadge variant="small" label="Temps réel" pulse />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <Kpi label="Clients" value={d.kpis_portefeuille.clients_actifs} sub={`+${d.kpis_portefeuille.croissance_pct}%`} />
          <Kpi label="Encours" value={formatFcfa(d.kpis_portefeuille.encours_restant)} small />
          <Kpi label="PAR 30" value={`${d.kpis_qualite.par_30_pct}%`} alert={d.kpis_qualite.par_30_pct > 6} />
          <Kpi label="Recouv." value={`${d.kpis_qualite.taux_remboursement_pct}%`} ok />
          <Kpi label="En retard" value={d.kpis_qualite.clients_en_retard} alert />
          <Kpi label="Collecte j" value={formatFcfa(d.activite_quotidienne.collectes_jour_montant)} small ok />
          <Kpi label="Visites" value={`${d.activite_quotidienne.visites_realisees_jour}/${d.activite_quotidienne.visites_prevues_jour}`} />
          <Kpi label="À relancer" value={d.activite_quotidienne.clients_a_relancer} alert />
        </div>
      </section>

      {/* Suggestions IA rapides */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {hub.suggestions_globales.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-sm transition-all duration-200 cursor-default"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-sky-100 text-sky-800 rounded-full text-[10px] font-black flex items-center justify-center">
                {i + 1}
              </span>
              <Sparkles size={13} className="text-sky-600" />
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{s}</p>
          </div>
        ))}
      </section>

      {/* Vue clients moderne — cliquable vers fiches */}
      <PortfolioClientGrid
        clients={clientsPrioritaires}
        totalClients={d.kpis_portefeuille.clients_actifs}
      />

      {/* Aging + Segmentation */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Layers size={15} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">Aging — retards portefeuille</h3>
            <AiBadge variant="small" label="Vue critique" />
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {d.aging_portefeuille.map(a => (
                <div key={a.tranche} className={`p-3 rounded-xl border-2 ${AGING_BG[a.couleur]}`}>
                  <div className={`text-[10px] font-bold uppercase ${AGING_TEXT[a.couleur]}`}>{a.tranche}</div>
                  <div className={`text-2xl font-black mt-1 ${AGING_TEXT[a.couleur]}`}>{a.nombre}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{formatFcfa(a.montant)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users size={15} className="text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-900">Segmentation</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={d.segmentation} dataKey="nb" nameKey="categorie" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {d.segmentation.map((s, i) => (
                    <Cell key={i} fill={SEGMENT_COLORS[s.couleur]}
                      stroke={segmentSelected === s.categorie ? '#0f172a' : 'none'} strokeWidth={3}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSegmentSelected(segmentSelected === s.categorie ? null : s.categorie)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {d.segmentation.map(s => (
                <button
                  key={s.categorie}
                  type="button"
                  onClick={() => setSegmentSelected(segmentSelected === s.categorie ? null : s.categorie)}
                  className={`w-full text-left flex items-center gap-2 p-1.5 rounded text-[11px] transition-colors duration-200 cursor-pointer ${
                    segmentSelected === s.categorie ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: SEGMENT_COLORS[s.couleur] }} />
                  <span className="font-semibold text-slate-700 flex-1">{s.categorie}</span>
                  <span className="text-slate-500">{s.nb} · {s.pct}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recouvrement */}
      <div className="bg-gradient-to-br from-teal-50 to-sky-50 rounded-xl border border-teal-200 shadow-sm">
        <div className="px-5 py-4 border-b border-teal-100 flex items-center gap-2">
          <Wallet size={15} className="text-teal-700" />
          <h3 className="text-sm font-bold text-teal-900">Recouvrement — aujourd&apos;hui</h3>
          <AiBadge variant="small" label="Suivi temps réel" />
        </div>
        <div className="p-5 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-2">
            <MiniBox label="Objectif jour" valeur={formatFcfa(d.recouvrement.objectif_jour_fcfa)} />
            <MiniBox label="Recouvré" valeur={formatFcfa(d.recouvrement.recouvre_jour_fcfa)} highlight="success" />
            <div className="col-span-2 bg-white rounded-lg p-3 border border-teal-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Taux atteint</div>
              <div className="text-2xl font-black text-teal-700">{d.recouvrement.taux_atteint_pct}%</div>
              <div className="bg-slate-100 rounded-full h-2 mt-2">
                <div className="bg-teal-600 h-2 rounded-full transition-all duration-300" style={{ width: `${d.recouvrement.taux_atteint_pct}%` }} />
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-white rounded-lg border border-teal-100 overflow-hidden">
              <div className="px-3 py-2 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
                <CheckCircle2 size={12} className="text-teal-700" />
                <span className="text-[11px] font-bold text-teal-800">Promesses du jour</span>
              </div>
              <div className="divide-y divide-slate-50">
                {d.recouvrement.promesses_aujourdhui.map((p, i) => (
                  <div key={i} className="px-3 py-2.5 flex items-center gap-3 hover:bg-teal-50/30 transition-colors duration-200">
                    <Clock size={12} className="text-teal-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">{p.client}</div>
                      <div className="text-[10px] text-slate-500">Promis : {p.date_promesse}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">{formatFcfa(p.montant)}</div>
                      <div className={`text-[10px] font-bold ${p.confiance_pct >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                        {p.confiance_pct}% confiance
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terrain + Performance */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <MapPin size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Activité terrain — aujourd&apos;hui</h3>
            <AiBadge variant="small" label="Itinéraire IA" />
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MiniBox label="Visites" valeur={`${d.activite_terrain.visites_realisees_count}/${d.activite_terrain.visites_prevues_count}`} highlight="success" />
              <MiniBox label="Manquées" valeur={d.activite_terrain.visites_manquees_count} highlight="danger" />
              <MiniBox label="Temps moy." valeur={`${d.activite_terrain.temps_moyen_par_visite_min} min`} />
              <MiniBox label="Distance" valeur={`${d.activite_terrain.distance_parcourue_km} km`} />
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-50 max-h-[200px] overflow-y-auto">
              {d.activite_terrain.geo_points.map((g, i) => {
                const st = STATUT_VISITE[g.statut]
                return (
                  <div key={i} className="px-3 py-2 flex items-center gap-2 text-xs hover:bg-slate-50 transition-colors duration-200">
                    <Route size={11} className="text-slate-400 flex-shrink-0" />
                    <span className="flex-1 font-semibold text-slate-800 truncate">{g.client}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Award size={15} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">Ma performance — mois</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black text-slate-800">{d.performance.taux_atteinte_pct}%</span>
                <span className="text-xs text-slate-500">objectif mensuel</span>
              </div>
              <div className="bg-slate-200 rounded-full h-2">
                <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${d.performance.taux_atteinte_pct}%` }} />
              </div>
              <div className="text-[11px] text-teal-700 font-semibold mt-2">
                {formatFcfa(d.performance.realise_mois_fcfa)} / {formatFcfa(d.performance.objectif_mensuel_collecte_fcfa)}
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <Trophy size={28} className={BADGE_ICON_COLOR[d.performance.badge] ?? 'text-slate-400'} />
                <div>
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Classement GP</div>
                  <div className="text-2xl font-black text-amber-900">
                    #{d.performance.classement_agence} <span className="text-base text-amber-700">/ 8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Productivité 30j */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp size={15} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900">Productivité — 30 jours</h3>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={d.productivite_30j}>
              <XAxis dataKey="jour" tick={{ fontSize: 9 }} stroke="#94a3b8" interval={3} />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={v => `${v / 1000}k`} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }}
                formatter={value => [formatFcfa(Number(value)), '']} />
              <ReferenceLine y={300_000} stroke="#dc2626" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="collecte" stroke="#0d9488" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, small, alert, ok }: {
  label: string; value: string | number; sub?: string; small?: boolean; alert?: boolean; ok?: boolean
}) {
  const bg = alert ? 'bg-red-50 border-red-200 text-red-800' : ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-slate-200 text-slate-800'
  return (
    <div className={`rounded-xl border p-2.5 ${bg}`}>
      <div className="text-[9px] font-bold text-slate-500 uppercase truncate">{label}</div>
      <div className={`font-black mt-0.5 ${small ? 'text-sm' : 'text-lg'}`}>{value}</div>
      {sub && <div className="text-[9px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function MiniBox({ label, valeur, highlight }: { label: string; valeur: string | number; highlight?: 'success' | 'danger' }) {
  const colors = highlight === 'success' ? 'bg-green-50 border-green-200 text-green-700'
    : highlight === 'danger' ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-slate-50 border-slate-200 text-slate-800'
  return (
    <div className={`rounded-lg border p-2.5 ${colors}`}>
      <div className="text-[10px] font-bold text-slate-500 uppercase">{label}</div>
      <div className="text-lg font-black mt-0.5">{valeur}</div>
    </div>
  )
}
