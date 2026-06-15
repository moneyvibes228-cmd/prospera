'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Legend,
} from 'recharts'
import {
  Building2, Bell, ChevronRight, Scale, ShieldAlert, Target,
  TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AGENCES, AGENCES_DATA, RESEAU_CONSOLIDE } from '@/lib/agences'
import { RAPPORT_IA_DG, ANOMALIES_JOUR } from '@/lib/mockMicrofinance'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { SyntheseAgenceBlock } from '@/components/dashboard/SyntheseAgenceBlock'
import { KpiCardWithSparkline } from '@/components/dashboard/KpiCardWithSparkline'
import { DrillDownBreadcrumb, type DrillNode } from '@/components/dashboard/DrillDownBreadcrumb'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { AiInsightPanel } from '@/components/dashboard/AiInsightPanel'
import { AgencePhase1Panel } from '@/components/phase1/AgencePhase1Panel'
import { useAgencesApi } from '@/hooks/usePhase1'
import { formatFcfa } from '@/lib/utils'
import type { Agence } from '@/lib/agences'
import type { AgenceApi } from '@/types/phase1'

const CONFORMITE_STYLE = {
  CONFORME: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Conforme BCEAO' },
  ATTENTION: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'Attention' },
  NON_CONFORME: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Non conforme' },
}

const BCEAO_ORDER: Record<string, number> = { NON_CONFORME: 0, ATTENTION: 1, CONFORME: 2 }

function AgenceCard({
  agence,
  selected,
  onClick,
  rank,
}: {
  agence: Agence
  selected: boolean
  onClick: () => void
  rank: number
}) {
  const data = AGENCES_DATA[agence.id]
  const parColor = agence.par_courant > 10 ? 'text-red-600' : agence.par_courant > 8 ? 'text-orange-600' : 'text-green-600'
  const collectePct = Math.round((agence.collecte_mois / agence.collecte_objectif) * 100)
  const conf = data?.conformite_bceao
  const synthese = RAPPORT_IA_DG.synthese_agences?.find(s => s.agence_id === agence.id)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left w-full p-4 rounded-xl border-2 transition-all ${
        selected ? 'border-teal-400 bg-teal-50 shadow-md ring-2 ring-teal-200/50' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase">#{rank}</span>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: agence.color + '20', color: agence.color }}
          >
            {agence.initiales}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900 truncate">{agence.nom_court}</span>
            {conf && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${CONFORMITE_STYLE[conf.statut].bg} ${CONFORMITE_STYLE[conf.statut].text} ${CONFORMITE_STYLE[conf.statut].border}`}>
                {CONFORMITE_STYLE[conf.statut].label}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{agence.responsable} · {agence.emprunteurs_actifs} clients</div>
          {data && (
            <div className="text-[10px] font-bold mt-1" style={{ color: data.kpis.score_sante >= 80 ? '#16a34a' : data.kpis.score_sante >= 65 ? '#f97316' : '#dc2626' }}>
              Score santé {data.kpis.score_sante}/100
            </div>
          )}
        </div>
        {synthese?.tendance === 'ALERTE' && (
          <AlertTriangle size={16} className="text-red-500 shrink-0 animate-pulse" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-400">Encours</span>
          <div className="font-bold text-slate-800">{formatFcfa(agence.encours_fcfa)}</div>
        </div>
        <div>
          <span className="text-slate-400">PAR &gt;30j</span>
          <div className={`font-black ${parColor}`}>{agence.par_courant}%</div>
        </div>
        <div className="col-span-2">
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-slate-400">Collecte mois</span>
            <span className={`font-bold ${collectePct >= 90 ? 'text-green-600' : collectePct >= 70 ? 'text-orange-600' : 'text-red-600'}`}>{collectePct}%</span>
          </div>
          <div className="bg-slate-200 rounded-full h-1.5">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(collectePct, 100)}%`,
                backgroundColor: collectePct >= 90 ? '#16a34a' : collectePct >= 70 ? '#f97316' : '#dc2626',
              }}
            />
          </div>
        </div>
      </div>
    </button>
  )
}

function AgenceDetailPanel({ agence }: { agence: Agence }) {
  const detail = AGENCES_DATA[agence.id]
  const synthese = RAPPORT_IA_DG.synthese_agences?.find(s => s.agence_id === agence.id)
  const parHistorique = detail?.par_historique ?? []
  const forecast = detail?.forecast ?? []

  if (!detail) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-slate-900">{agence.nom}</h3>
            <p className="text-sm text-slate-500">Responsable : {agence.responsable}</p>
          </div>
          {detail.conformite_bceao && (
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border shrink-0 ${CONFORMITE_STYLE[detail.conformite_bceao.statut].bg} ${CONFORMITE_STYLE[detail.conformite_bceao.statut].text} ${CONFORMITE_STYLE[detail.conformite_bceao.statut].border}`}>
              {CONFORMITE_STYLE[detail.conformite_bceao.statut].label}
            </span>
          )}
        </div>
      </div>

      {synthese && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <SyntheseAgenceBlock ag={synthese} variant="light" showHeader={false} />
        </div>
      )}

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricBox label="Encours" value={formatFcfa(agence.encours_fcfa)} />
          <MetricBox label="PAR actuel" value={`${agence.par_courant}%`} alert={agence.par_courant > 10} warn={agence.par_courant > 8} />
          <MetricBox label="Remboursement" value={`${agence.taux_remboursement}%`} good={agence.taux_remboursement >= 93} />
          <MetricBox label="Score santé" value={`${detail.kpis.score_sante}/100`} good={detail.kpis.score_sante >= 80} warn={detail.kpis.score_sante < 65} />
        </div>

        {parHistorique.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-700">Évolution PAR</span>
              <AiBadge variant="small" label="5 mois" />
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart
                data={[
                  ...parHistorique,
                  ...forecast.map(f => ({ mois: f.mois.slice(0, 3), par_30j: f.par_prevu })),
                ]}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} unit="%" domain={[0, 'auto']} />
                <Tooltip formatter={(v) => [`${v}%`, 'PAR']} />
                <ReferenceLine y={10} stroke="#dc2626" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="par_30j" stroke="#dc2626" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {detail.conformite_bceao && (
          <div className="rounded-lg border border-slate-100 p-3 bg-slate-50">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Scale size={13} className="text-teal-600" />
              Conformité BCEAO
            </div>
            <div className="space-y-1.5">
              {detail.conformite_bceao.items.map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  {item.ok ? (
                    <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                  ) : (
                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                  )}
                  <span className={item.ok ? 'text-slate-600' : 'text-red-700 font-medium'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {detail.alertes.length > 0 && (
          <div>
            <div className="text-xs font-bold text-red-700 uppercase mb-2">Actions prioritaires</div>
            <div className="space-y-2">
              {detail.alertes.slice(0, 3).map((al, i) => (
                <div key={i} className={`text-xs p-2.5 rounded-lg border ${al.urgence === 'HAUTE' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                  <div className="font-bold text-slate-800">{al.type}</div>
                  <p className="text-slate-600 mt-0.5">{al.detail}</p>
                  <p className="text-teal-700 font-semibold mt-1">→ {al.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {detail.agents_performance.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase mb-2">Équipe agence</div>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Agent</th>
                    <th className="px-2 py-1.5 text-left font-medium">Rôle</th>
                    <th className="px-2 py-1.5 text-right font-medium">Visites</th>
                    <th className="px-2 py-1.5 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {detail.agents_performance.map(a => (
                    <tr key={a.agent}>
                      <td className="px-2 py-1.5 font-medium text-slate-800">{a.agent}</td>
                      <td className="px-2 py-1.5 text-slate-500">{a.role ?? '—'}</td>
                      <td className="px-2 py-1.5 text-right text-slate-600">
                        {a.visites === 0 && (a.role?.includes('Resp') || a.role?.includes('agence')) ? (
                          <span className="text-indigo-600 font-medium">Pilotage</span>
                        ) : a.visites}
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-slate-700">{a.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detail.ia_insights.length > 0 && (
          <AiInsightPanel
            titre="Analyse IA agence"
            insights={detail.ia_insights}
            collapsible
          />
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <Link href="/conformite" className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 px-2.5 py-1.5 bg-teal-50 rounded-lg">
            <Scale size={12} /> Conformité
          </Link>
          <Link href="/risque" className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:text-orange-900 px-2.5 py-1.5 bg-orange-50 rounded-lg">
            <ShieldAlert size={12} /> PAR & Risque
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900">
            Tableau de bord <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function MetricBox({
  label,
  value,
  alert,
  warn,
  good,
}: {
  label: string
  value: string
  alert?: boolean
  warn?: boolean
  good?: boolean
}) {
  const color = alert ? 'text-red-600' : warn ? 'text-orange-600' : good ? 'text-green-600' : 'text-slate-800'
  return (
    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
      <div className={`text-sm font-black ${color}`}>{value}</div>
    </div>
  )
}

export function AgencesDgView() {
  const { data: agencesApi, refetch } = useAgencesApi()
  const [selected, setSelected] = useState<Agence | null>(null)
  const [selectedApi, setSelectedApi] = useState<AgenceApi | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)

  const anomaliesCritiques = ANOMALIES_JOUR.filter(a => a.severite === 'CRITIQUE')
  const prioritesP1 = RAPPORT_IA_DG.recommandations.filter(r => r.priorite === 1)

  const rankedAgences = useMemo(() => {
    return [...AGENCES].sort((a, b) => {
      const confA = AGENCES_DATA[a.id]?.conformite_bceao.statut ?? 'CONFORME'
      const confB = AGENCES_DATA[b.id]?.conformite_bceao.statut ?? 'CONFORME'
      const orderDiff = (BCEAO_ORDER[confA] ?? 2) - (BCEAO_ORDER[confB] ?? 2)
      if (orderDiff !== 0) return orderDiff
      return b.par_courant - a.par_courant
    })
  }, [])

  const parComparatif = useMemo(
    () => rankedAgences.map(a => ({
      nom: a.nom_court,
      par: a.par_courant,
      fill: a.par_courant > 10 ? '#dc2626' : a.par_courant > 8 ? '#f97316' : '#14b8a6',
    })),
    [rankedAgences],
  )

  const parSparkline = RESEAU_CONSOLIDE.par_historique.map(h => h.par_30j)
  const collectePct = Math.round((RESEAU_CONSOLIDE.collecte_totale / RESEAU_CONSOLIDE.collecte_objectif) * 100)

  const drillPath: DrillNode[] = useMemo(() => {
    if (!selected) return []
    return [{ level: 'AGENCE', id: selected.id, label: selected.nom_court, sublabel: `${selected.emprunteurs_actifs} clients` }]
  }, [selected])

  const listAgences =
    agencesApi?.source === 'api' && agencesApi.data.length > 0 ? agencesApi.data : null

  return (
    <PageWrapper
      title="Pilotage réseau"
      subtitle={`${RESEAU_CONSOLIDE.total_agences} agences · ${RESEAU_CONSOLIDE.total_emprunteurs} emprunteurs · Vue direction`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="text-center">
              <div className="text-xl font-black text-orange-500">{RESEAU_CONSOLIDE.score_sante_reseau}</div>
              <div className="text-[9px] text-slate-400 uppercase">Score réseau</div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-[10px] text-slate-600 max-w-[100px]">
              <span className="font-semibold text-orange-600">Attention</span>
              <span className="block text-slate-500">Bè Kpota hors conformité</span>
            </div>
          </div>
          {anomaliesCritiques.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <Bell size={13} />
              {anomaliesCritiques.length} alertes critiques
            </span>
          )}
          <ExportButton label="Exporter rapport réseau" filename="pilotage_reseau" size="sm" />
        </div>
      }
    >
      <RapportIAGlobal rapport={RAPPORT_IA_DG} accentColor="teal" analyseLabel="Pilotage réseau" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCardWithSparkline
          title="Encours total"
          value={RESEAU_CONSOLIDE.encours_total}
          format="fcfa"
          variation={6.1}
          variationLabel="vs avril"
          sparkline={[82, 84, 86, 88, 90, 94.7].map(v => v * 1_000_000)}
          sparklineLabels={['Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai']}
          colorScheme="teal"
        />
        <KpiCardWithSparkline
          title="PAR réseau >30j"
          value={RESEAU_CONSOLIDE.par_moyen}
          format="pct"
          variation={-14.6}
          variationLabel="vs avril"
          sparkline={parSparkline}
          sparklineLabels={RESEAU_CONSOLIDE.par_historique.map(h => h.mois)}
          colorScheme="red"
          invertVariation
        />
        <KpiCardWithSparkline
          title="Collecte mensuelle"
          value={collectePct}
          unit="% objectif"
          format="raw"
          variation={-4.2}
          variationLabel="vs cible"
          sparkline={RESEAU_CONSOLIDE.par_historique.map(h => Math.round(h.liquidite / 200_000))}
          sparklineLabels={RESEAU_CONSOLIDE.par_historique.map(h => h.mois)}
          colorScheme="orange"
          invertVariation
        />
        <KpiCardWithSparkline
          title="Conformité BCEAO"
          value={`${RESEAU_CONSOLIDE.agences_conformes}/${RESEAU_CONSOLIDE.total_agences}`}
          unit="agences"
          format="raw"
          sparkline={[2, 2, 3, 3, 3, 3]}
          sparklineLabels={['Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai']}
          colorScheme="green"
          badge={`${RESEAU_CONSOLIDE.agences_non_conformes} NC`}
        />
      </div>

      {prioritesP1.length > 0 && (
        <div className="mb-5 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-red-600" />
            <h2 className="text-sm font-bold text-slate-900">Décisions prioritaires — cette semaine</h2>
            <AiBadge variant="small" label="P1 IA" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prioritesP1.map((rec, i) => (
              <div key={i} className="flex gap-3 p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                <span className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  P{rec.priorite}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{rec.action}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-[10px]">
                    <span className="text-teal-700 font-bold">{rec.impact_estime}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{rec.delai}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DrillDownBreadcrumb
        path={drillPath}
        onNavigate={() => setSelected(null)}
        onReset={() => setSelected(null)}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-5">
        <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-red-600" />
              <h2 className="text-sm font-bold text-slate-900">Comparatif PAR par agence</h2>
            </div>
            <span className="text-[10px] text-red-600 font-bold">Seuil BCEAO 10%</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={parComparatif} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 14]} unit="%" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="nom" width={80} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'PAR']} />
              <ReferenceLine x={10} stroke="#dc2626" strokeDasharray="4 2" />
              <Bar dataKey="par" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> &lt;8%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> 8–10%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &gt;10%</span>
          </div>
        </div>

        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Building2 size={15} className="text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Classement agences — priorité d&apos;intervention</h2>
            <AiBadge variant="small" label="Tri IA" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-bold">#</th>
                  <th className="px-4 py-2.5 font-bold">Agence</th>
                  <th className="px-4 py-2.5 font-bold">PAR</th>
                  <th className="px-4 py-2.5 font-bold">Score</th>
                  <th className="px-4 py-2.5 font-bold">BCEAO</th>
                  <th className="px-4 py-2.5 font-bold">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {rankedAgences.map((a, idx) => {
                  const data = AGENCES_DATA[a.id]
                  const synthese = RAPPORT_IA_DG.synthese_agences?.find(s => s.agence_id === a.id)
                  const conf = data?.conformite_bceao
                  const isSelected = selected?.id === a.id
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelected(prev => (prev?.id === a.id ? null : a))}
                      className={`border-t border-slate-100 cursor-pointer transition-colors ${isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{a.nom_court}</div>
                        <div className="text-[10px] text-slate-400">{a.responsable}</div>
                      </td>
                      <td className={`px-4 py-3 font-black ${a.par_courant > 10 ? 'text-red-600' : a.par_courant > 8 ? 'text-orange-600' : 'text-green-600'}`}>
                        {a.par_courant}%
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700">{data?.kpis.score_sante ?? '—'}</td>
                      <td className="px-4 py-3">
                        {conf && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${CONFORMITE_STYLE[conf.statut].bg} ${CONFORMITE_STYLE[conf.statut].text} ${CONFORMITE_STYLE[conf.statut].border}`}>
                            {CONFORMITE_STYLE[conf.statut].label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {synthese?.tendance === 'POSITIF' && <TrendingUp size={14} className="text-green-600" />}
                        {synthese?.tendance === 'ALERTE' && <AlertTriangle size={14} className="text-red-500" />}
                        {synthese?.tendance === 'STABLE' && <span className="text-slate-400 text-xs">Stable</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Vue réseau — sélection agence</h2>
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-auto text-xs text-teal-600 font-medium hover:underline"
              >
                ← Tout le réseau
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listAgences
              ? listAgences.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedApi(prev => (prev?.id === a.id ? null : a))
                      const mock = AGENCES.find(m => m.nom === a.nom || m.ville === a.ville)
                      setSelected(mock ?? null)
                    }}
                    className={`text-left w-full p-4 rounded-xl border-2 transition-all ${
                      selectedApi?.id === a.id ? 'border-teal-400 bg-teal-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{a.nom}</div>
                    <div className="text-[11px] text-slate-500">{a.ville}</div>
                  </button>
                ))
              : rankedAgences.map((a, idx) => (
                  <AgenceCard
                    key={a.id}
                    agence={a}
                    rank={idx + 1}
                    selected={selected?.id === a.id}
                    onClick={() => {
                      setSelected(prev => (prev?.id === a.id ? null : a))
                      setSelectedApi(null)
                    }}
                  />
                ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          {selected ? (
            <AgenceDetailPanel agence={selected} />
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-xl border border-dashed border-slate-200 p-8 text-center sticky top-4">
              <Building2 size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">Sélectionnez une agence</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Cliquez sur une agence ou une ligne du classement pour voir l&apos;analyse détaillée, les alertes et les actions recommandées.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(AGENCES.find(a => a.id === 'AG-003') ?? null)}
                  className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100"
                >
                  Voir Bè Kpota (priorité)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdmin(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
        >
          <span className="text-xs font-semibold text-slate-600">Administration réseau (création agence, objectifs)</span>
          {showAdmin ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>
        {showAdmin && (
          <div className="p-4 border-t border-slate-200">
            <AgencePhase1Panel selected={selectedApi} onCreated={() => refetch()} />
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
