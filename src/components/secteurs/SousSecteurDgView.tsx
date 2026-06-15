'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, AlertTriangle, BookOpen, Scale, CheckCircle2,
  Building2, TrendingUp, Target,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { getSousSecteurHub, type AgenceSousSecteur, type AgentEquipeSecteur } from '@/lib/sous-secteur-hub'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { SousSecteurTables } from '@/components/secteurs/SousSecteurTables'
import { formatFcfa, cn } from '@/lib/utils'

interface Props {
  secteurSlug: string
  sousSlug: string
}

function agentsRoleLabel(equipe: AgenceSousSecteur['equipe'], role: AgentEquipeSecteur['role']) {
  const list = equipe.filter(e => e.role === role).map(e => e.nom)
  return list.length ? list.join(', ') : '—'
}

export function SousSecteurDgView({ secteurSlug, sousSlug }: Props) {
  const router = useRouter()
  const hub = getSousSecteurHub(secteurSlug, sousSlug)

  if (!hub) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Sous-secteur introuvable.</p>
        <button type="button" onClick={() => router.back()} className="text-teal-600 text-sm mt-2 cursor-pointer">← Retour</button>
      </div>
    )
  }

  const { secteur, sous: ss, kpis } = hub
  const chartHist = hub.historique_6m.map(h => ({ ...h, encoursM: h.encours / 1_000_000 }))
  const agenceChart = hub.agences.map(a => ({
    nom: a.agence.length > 10 ? a.agence.slice(0, 9) + '…' : a.agence,
    dossiers: a.dossiers,
    par: a.par,
  }))

  return (
    <PageWrapper
      title={ss.nom}
      subtitle={`${secteur.nom} · ${kpis.total_dossiers} dossiers · ${formatFcfa(kpis.encours_fcfa)} · ${kpis.part_secteur_pct} % du secteur`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/secteurs/${secteurSlug}`)}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            <ArrowLeft size={14} /> {secteur.nom}
          </button>
          <ExportButton label="Exporter sous-secteur" filename={`sous_secteur_${sousSlug}`} size="sm" />
        </div>
      }
    >
      <div className="flex flex-wrap gap-2 mb-5 -mt-2">
        <AiBadge variant="small" label="Analyse sous-secteur DG" />
        {kpis.dossiers_en_retard > 0 && (
          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-red-100 text-red-700">
            {kpis.dossiers_en_retard} en retard
          </span>
        )}
      </div>

      <Link
        href={`/dashboard/secteurs/${secteurSlug}`}
        className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-colors cursor-pointer group"
      >
        <Target size={20} className="text-teal-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 group-hover:text-teal-800">
            Vue secteur {secteur.nom}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            Benchmark sectoriel & concentration BCEAO — ici le détail granulaire des {kpis.total_dossiers} dossiers {ss.nom}.
          </div>
        </div>
        <ArrowRight size={16} className="text-slate-400 group-hover:text-teal-600 shrink-0" />
      </Link>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-5 mb-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={18} className="text-teal-300" />
          <h2 className="text-sm font-bold">Memo sous-secteur — lecture DG</h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-100">{hub.synthese_memo}</p>
        <p className="text-sm text-teal-200 font-medium mt-3">→ {ss.ia_analyse.split('.').slice(-2).join('.').trim() || ss.ia_analyse}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Dossiers actifs', value: String(kpis.total_dossiers), sub: `${hub.agences.length} agences`, color: 'text-slate-900' },
          { label: 'Encours total', value: formatFcfa(kpis.encours_fcfa), sub: `Ticket moy. ${formatFcfa(kpis.ticket_moyen)}`, color: 'text-slate-900' },
          { label: 'PAR sous-secteur', value: `${kpis.par_pct} %`, sub: `${kpis.dossiers_en_retard} dossiers en retard`, color: kpis.par_pct > 10 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Part réseau', value: `${kpis.part_reseau_pct} %`, sub: `Remb. ${kpis.taux_remboursement} %`, color: 'text-teal-700' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-500">{k.label}</div>
            <div className={cn('text-xl font-black mt-1', k.color)}>{k.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Répartition par agence — {kpis.total_dossiers} dossiers</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agenceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nom" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="dossiers" name="Dossiers" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase text-slate-500 border-b">
                  <th className="py-2 font-bold">Agence</th>
                  <th className="py-2 font-bold text-center">Dossiers</th>
                  <th className="py-2 font-bold text-right">Encours</th>
                  <th className="py-2 font-bold text-center">PAR</th>
                  <th className="py-2 font-bold">RA</th>
                  <th className="py-2 font-bold">Commerciaux</th>
                  <th className="py-2 font-bold">GP</th>
                </tr>
              </thead>
              <tbody>
                {hub.agences.map(a => (
                  <tr key={a.agence_id} className="border-b border-slate-50">
                    <td className="py-2 font-bold">{a.agence}</td>
                    <td className="py-2 text-center font-bold">{a.dossiers}</td>
                    <td className="py-2 text-right">{formatFcfa(a.encours)}</td>
                    <td className={cn('py-2 text-center font-bold', a.par > 10 ? 'text-red-600' : 'text-emerald-600')}>{a.par} %</td>
                    <td className="py-2 text-slate-700">{agentsRoleLabel(a.equipe, 'RA')}</td>
                    <td className="py-2 text-slate-600">{agentsRoleLabel(a.equipe, 'COM')}</td>
                    <td className="py-2 text-slate-600 font-medium">{agentsRoleLabel(a.equipe, 'GP')}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-center">{hub.agences.reduce((s, a) => s + a.dossiers, 0)}</td>
                  <td className="py-2 text-right">{formatFcfa(hub.agences.reduce((s, a) => s + a.encours, 0))}</td>
                  <td className="py-2 text-center">{kpis.par_pct} %</td>
                  <td className="py-2" colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">Évolution 6 mois</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartHist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} unit=" M" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v, name) => (name === 'PAR %' ? `${Number(v)} %` : `${Number(v).toFixed(1)} M`)} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="encoursM" name="Encours" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="par" name="PAR %" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 text-[10px] text-slate-500 text-center">
            Dossiers Mai : {hub.historique_6m[5]?.dossiers} (stable vs {kpis.total_dossiers} actuels)
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {ss.risques.length > 0 && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <h3 className="text-xs font-bold text-red-800 uppercase mb-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Risques identifiés
            </h3>
            <ul className="space-y-1">
              {ss.risques.map((r, i) => <li key={i} className="text-sm text-red-900">· {r}</li>)}
            </ul>
          </div>
        )}
        {ss.opportunites.length > 0 && (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <h3 className="text-xs font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> Opportunités
            </h3>
            <ul className="space-y-1">
              {ss.opportunites.map((o, i) => <li key={i} className="text-sm text-emerald-900">· {o}</li>)}
            </ul>
            <p className="text-xs text-emerald-700 mt-2 font-medium">{kpis.renouvellements_eligibles} dossiers éligibles renouvellement</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Décisions DG — sous-secteur</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {hub.decisions_dg.map(d => (
            <div key={d.titre} className={cn('px-5 py-3 flex gap-3', d.priorite === 1 && 'bg-teal-50/30')}>
              <span className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white', d.priorite === 1 ? 'bg-teal-600' : d.priorite === 2 ? 'bg-indigo-500' : 'bg-slate-400')}>
                P{d.priorite}
              </span>
              <div>
                <div className="text-sm font-bold text-slate-900">{d.titre}</div>
                <div className="text-xs text-slate-600 mt-0.5">{d.detail}</div>
                <div className="text-[10px] text-teal-700 mt-1">Impact : {d.impact} · Délai : {d.delai}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <details className="bg-slate-50 rounded-xl border border-slate-200 mb-5 group">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors list-none">
          <BookOpen size={16} className="text-teal-600" />
          Comprendre les indicateurs sous-secteur
        </summary>
        <div className="px-4 pb-4 grid md:grid-cols-3 gap-3">
          {hub.glossaire.map(g => (
            <div key={g.terme} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-teal-700">{g.terme}</div>
              <p className="text-xs text-slate-600 mt-1">{g.definition}</p>
            </div>
          ))}
        </div>
      </details>

      <h3 className="text-sm font-bold text-slate-900 mb-3">
        Registre dossiers — {kpis.total_dossiers} fiches
      </h3>
      <SousSecteurTables hub={hub} />
    </PageWrapper>
  )
}
