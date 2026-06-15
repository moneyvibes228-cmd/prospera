'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity, Target, Users, ChevronRight, FileText, MapPin, Wallet,
} from 'lucide-react'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { getRaHubData } from '@/lib/ra-agence-hub'
import { formatFcfa } from '@/lib/utils'

const PAGE_ICONS = {
  '/emprunteurs': Users,
  '/terrain': MapPin,
  '/credit': FileText,
  '/equipe': Target,
} as const

export function DashboardResponsableAgence() {
  const router = useRouter()
  const hub = getRaHubData()
  const d = hub

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Bonjour {hub.agence.responsable.split(' ')[0]} — {hub.agence.nom}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {hub.pilotage.emprunteurs_credit} emprunteurs actifs · {formatFcfa(d.kpis_activite.encours_agence)} encours · PAR 30j {d.kpis_credit.par_30_pct}% · {hub.pilotage.agents_terrain_actifs}/{hub.pilotage.agents_terrain} commerciaux terrain
          </p>
        </div>
        <ExportButton label="Exporter rapport agence" filename="rapport_agence" />
      </div>

      <RapportIAGlobal
        rapport={hub.rapport}
        accentColor="indigo"
        analyseLabel={`Agence ${hub.agence.nom}`}
      />

      {/* KPIs condensés */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-700" />
          <h2 className="text-sm font-bold text-slate-900">Indicateurs agence — temps réel</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <Kpi label="Emprunteurs" value={hub.pilotage.emprunteurs_credit} sub={`+${d.kpis_commercial.nouveaux_clients_mois} ce mois`} />
          <Kpi label="Encours" value={formatFcfa(d.kpis_activite.encours_agence)} small />
          <Kpi label="PAR 30" value={`${d.kpis_credit.par_30_pct}%`} alert={d.kpis_credit.par_30_pct > 8} />
          <Kpi label="Recouv." value={`${d.kpis_credit.taux_remboursement_pct}%`} ok />
          <Kpi label="Collecte j" value={formatFcfa(d.kpis_activite.depots_collectes_jour)} small />
          <Kpi label="Agents terrain" value={`${hub.pilotage.agents_terrain_actifs}/${hub.pilotage.agents_terrain}`} sub={hub.agents_terrain.length ? `couv. ${Math.round(hub.agents_terrain.reduce((s, a) => s + a.couverture_pct, 0) / hub.agents_terrain.length)}%` : undefined} />
          <Kpi label="Trans./j" value={d.kpis_activite.transactions_jour} />
          <Kpi
            label="Liquidité"
            value={formatFcfa(d.tresorerie.liquidite_agence ?? d.tresorerie.solde_caisse)}
            sub={`caisse ${formatFcfa(d.tresorerie.solde_caisse)}`}
            small
          />
        </div>
      </section>

      {/* Accès détail */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-blue-700" />
          <h2 className="text-sm font-bold text-slate-900">Pilotage détaillé</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hub.pilotage_pages.map(p => {
            const Icon = PAGE_ICONS[p.href as keyof typeof PAGE_ICONS] ?? Users
            return (
            <Link
              key={p.href}
              href={p.href}
              className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200">
                  <Icon className="w-4 h-4 text-blue-800" />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-200">{p.badge}</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mb-1">{p.label}</div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{p.desc}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 group-hover:text-blue-950">
                Ouvrir <ChevronRight size={12} />
              </span>
            </Link>
          )})}
        </div>
      </section>

      {/* Classement agents compact */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Classement agents terrain — aujourd&apos;hui</h3>
          </div>
          <button
            type="button"
            onClick={() => router.push('/equipe')}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer inline-flex items-center gap-1"
          >
            Équipe complète <ChevronRight size={11} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                <th className="text-left px-4 py-2.5 font-bold">#</th>
                <th className="text-left px-2 py-2.5 font-bold">Agent</th>
                <th className="text-center px-2 py-2.5 font-bold">Visites</th>
                <th className="text-right px-2 py-2.5 font-bold">Collecte</th>
                <th className="text-center px-2 py-2.5 font-bold">Couverture</th>
                <th className="text-center px-2 py-2.5 font-bold">Perf.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...hub.equipe_objectifs].sort((a, b) => b.performance_pct - a.performance_pct).map((a, i) => (
                <tr key={a.agent} className={`hover:bg-slate-50 ${a.statut === 'DEGRADE' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-2 font-black text-slate-400">{i + 1}</td>
                  <td className="px-2 py-2 font-bold text-slate-800">{a.agent}</td>
                  <td className="px-2 py-2 text-center text-slate-600">
                    {hub.agents_terrain.find(at => at.nom === a.agent)?.visites_jour ?? '—'}/
                    {hub.agents_terrain.find(at => at.nom === a.agent)?.visites_prevues ?? '—'}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-teal-700">{formatFcfa(a.collecte_jour)}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`font-bold ${(hub.agents_terrain.find(at => at.nom === a.agent)?.couverture_pct ?? 0) < 70 ? 'text-red-600' : 'text-green-700'}`}>
                      {hub.agents_terrain.find(at => at.nom === a.agent)?.couverture_pct ?? '—'}%
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center font-black">{a.performance_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
