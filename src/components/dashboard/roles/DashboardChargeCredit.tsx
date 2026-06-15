'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, Clock, CheckCircle2, AlertTriangle, Target, Award,
  ArrowRight, Inbox, History, ShieldAlert, Zap, AlertCircle,
  TrendingUp, Activity, Calendar, ChevronRight,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { getCcHubData, CC_CALENDRIER_REFERENCE } from '@/lib/cc-credit-hub'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { formatFcfa } from '@/lib/utils'

const CLASSE_STYLE: Record<string, string> = {
  PERFORMANT: 'bg-green-100 text-green-700',
  SOUS_SURVEILLANCE: 'bg-orange-100 text-orange-700',
  DOUTEUX: 'bg-red-100 text-red-700',
}

const ETAPE_LABEL: Record<string, string> = {
  SOUMIS: 'Soumis', DOSSIER_COMPLET: 'Docs OK', EN_ANALYSE: 'Analyse CC',
  VALIDE_CHARGE: 'Validé CC', EN_ANALYSE_ROC: 'Chez ROC',
}

const ETAPE_STYLE: Record<string, string> = {
  SOUMIS: 'bg-blue-100 text-blue-700', DOSSIER_COMPLET: 'bg-indigo-100 text-indigo-700',
  EN_ANALYSE: 'bg-purple-100 text-purple-700', VALIDE_CHARGE: 'bg-teal-100 text-teal-700',
  EN_ANALYSE_ROC: 'bg-amber-100 text-amber-700',
}

const PRIORITE_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-600 text-white animate-pulse',
  HAUTE: 'bg-orange-500 text-white',
  NORMALE: 'bg-slate-100 text-slate-600',
}

const DECISION_STYLE: Record<string, string> = {
  APPROUVER: 'bg-green-100 text-green-700',
  APPROUVER_REDUIT: 'bg-teal-100 text-teal-700',
  DEMANDER_GARANTIES: 'bg-orange-100 text-orange-700',
  REFUSER: 'bg-red-100 text-red-700',
}

export function DashboardChargeCredit() {
  const router = useRouter()
  const hub = getCcHubData()
  const d = hub
  const obj = hub.objectifs_jour
  const [filterPriorite, setFilterPriorite] = useState<'all' | 'CRITIQUE' | 'HAUTE'>('all')

  const fileFiltree = filterPriorite === 'all'
    ? d.ma_file_aujourdhui
    : d.ma_file_aujourdhui.filter(f => f.priorite === filterPriorite)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Bonjour {hub.agent.nom.split(' ')[0]} — Analyse crédit
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Chargé de Crédit · {d.mes_kpis.en_attente_total} dossiers en attente ·
            objectif {obj.decisions_cible} décisions aujourd&apos;hui · délai cible {obj.delai_objectif_h} h
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/credit/analyse')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 cursor-pointer"
          >
            <FileText size={15} />
            Analyse dossiers
            <ArrowRight size={15} />
          </button>
          <ExportButton label="Exporter ma journée" filename="dashboard_cc" />
        </div>
      </div>

      {/* Synthèse IA */}
      <RapportIAGlobal
        rapport={hub.rapport}
        accentColor="indigo"
        analyseLabel="Chargé de Crédit — Objectifs du jour"
      />

      {/* Objectifs du jour — KPIs explicites */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Objectifs du jour — KPIs opérationnels</h2>
          <AiBadge variant="small" label="Temps réel" pulse />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <Kpi label="Décisions" value={`${obj.decisions_faites}/${obj.decisions_cible}`} sub="Objectif jour" alert={obj.decisions_faites < obj.decisions_cible} />
          <Kpi label="En attente" value={d.mes_kpis.en_attente_total} sub={`${obj.dossiers_prioritaires} prioritaires`} />
          <Kpi label="Délai moyen" value={`${obj.delai_actuel_h} h`} sub={`Obj. ${obj.delai_objectif_h} h`} alert={obj.delai_actuel_h > obj.delai_objectif_h} />
          <Kpi label="Alertes CBI" value={obj.alertes_cbi_critiques} alert />
          <Kpi label="Transmis ROC" value={obj.transmissions_roc_prevues} sub="À valider" />
          <Kpi label="Taux approb." value={`${d.mes_kpis.taux_approbation_perso}%`} ok />
          <Kpi label="Score moyen" value={`${d.mes_kpis.score_moyen_attribue}/100`} />
          <Kpi label="Qualité" value={`${d.mes_kpis.qualite_decisions_pct}%`} ok sub="6 mois" />
        </div>
      </section>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink href="/credit/analyse" icon={FileText} label="Analyse dossiers" desc="Workspace CBI v5 · décision par dossier" badge={`${d.mes_kpis.en_attente_total} en file`} />
        <QuickLink href="/credit/pipeline" icon={Inbox} label="Pipeline crédit" desc="Soumis → Docs OK → Analyse CC → Validé CC" badge="4 étapes agence" />
        <QuickLink href="/calendrier" icon={Calendar} label="Calendrier" desc="RDV · échéances · pièces manquantes" badge={`${hub.calendrier.length} événements`} />
      </div>

      {/* File dossiers + alertes CBI */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Inbox size={15} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Ma file — dossiers à traiter</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {(['all', 'CRITIQUE', 'HAUTE'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterPriorite(f)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors duration-200 cursor-pointer ${
                    filterPriorite === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? 'Tous' : f}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-auto">
            {fileFiltree.map(f => (
              <button
                key={f.reference}
                type="button"
                onClick={() => router.push(`/credit/analyse?ref=${encodeURIComponent(f.reference)}`)}
                className="w-full text-left px-5 py-3 hover:bg-indigo-50/30 transition-colors duration-200 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{f.reference}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ETAPE_STYLE[f.etape]}`}>{ETAPE_LABEL[f.etape]}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${CLASSE_STYLE[f.classe]}`}>{f.classe}</span>
                      {f.priorite !== 'NORMALE' && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${PRIORITE_STYLE[f.priorite]}`}>{f.priorite}</span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-800">{f.client}</div>
                    <div className="text-[11px] text-slate-500">{f.activite} · {formatFcfa(f.montant)} · {f.attente_h}h attente</div>
                    <div className="text-[11px] text-indigo-700 font-medium mt-1">{f.prochaine_action}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xl font-black ${f.score >= 75 ? 'text-green-600' : f.score >= 55 ? 'text-orange-600' : f.score > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                      {f.score > 0 ? f.score : '—'}
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 ml-auto mt-1" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-orange-200 shadow-sm">
            <div className="px-4 py-3 border-b border-orange-100 bg-orange-50 flex items-center gap-2">
              <ShieldAlert size={14} className="text-orange-600" />
              <h3 className="text-xs font-bold text-orange-900">Alertes CBI v5</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[280px] overflow-auto">
              {d.mes_alertes_cbi.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => router.push(`/credit/analyse?ref=${encodeURIComponent(a.dossier)}`)}
                  className="w-full text-left px-4 py-2.5 hover:bg-orange-50/40 cursor-pointer transition-colors duration-200"
                >
                  <div className="text-[9px] font-bold text-slate-500">{a.dossier}</div>
                  <div className="text-xs font-bold text-slate-800">{a.client}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{a.detail}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Calendar size={14} className="text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900">Aujourd&apos;hui — extrait calendrier</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {hub.calendrier.filter(e => e.date === CC_CALENDRIER_REFERENCE).slice(0, 4).map(evt => (
                <div key={evt.id} className="px-4 py-2.5 text-xs">
                  <span className="font-mono font-bold text-indigo-700">{evt.heure}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span className="font-semibold text-slate-800">{evt.titre}</span>
                </div>
              ))}
            </div>
            <Link href="/calendrier" className="block px-4 py-2 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer">
              Voir calendrier complet →
            </Link>
          </div>
        </div>
      </div>

      {/* Workflow + productivité */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Activity size={15} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Workflow — mes dossiers par étape</h3>
          </div>
          <div className="p-5 flex items-center gap-2 overflow-x-auto">
            {d.workflow_perso.map((step, i) => (
              <div key={step.etape} className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 min-w-[130px]">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">{step.etape}</div>
                  <div className="text-2xl font-black text-slate-800">{step.count}</div>
                  <div className={`text-[10px] font-bold ${step.delta_jour > 0 ? 'text-green-600' : step.delta_jour < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {step.delta_jour > 0 ? '+' : ''}{step.delta_jour} / jour
                  </div>
                </div>
                {i < d.workflow_perso.length - 1 && <ChevronRight size={16} className="text-slate-300" />}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Award size={15} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">Moi vs équipe CC</h3>
          </div>
          <div className="p-5 space-y-2 text-xs">
            {[
              { label: 'Score moyen', moi: d.vs_equipe.mon_score_moy, equ: d.vs_equipe.equipe_score_moy, unit: '' },
              { label: 'Délai (h)', moi: d.vs_equipe.mon_delai_h, equ: d.vs_equipe.equipe_delai_h, unit: 'h', lowerBetter: true },
              { label: 'Approbation', moi: d.vs_equipe.mon_taux_approb, equ: d.vs_equipe.equipe_taux_approb, unit: '%' },
              { label: 'Qualité', moi: d.vs_equipe.ma_qualite, equ: d.vs_equipe.equipe_qualite, unit: '%' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                <span className="text-slate-600 font-medium">{m.label}</span>
                <span className="font-black text-indigo-700">{m.moi}{m.unit}</span>
                <span className="text-slate-400">équipe {m.equ}{m.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Productivité 7j */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp size={15} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900">Productivité — 7 derniers jours</h3>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={d.productivite_7j}>
              <XAxis dataKey="jour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="approuves" stackId="a" fill="#16a34a" name="Approuvés" />
              <Bar dataKey="refuses" stackId="a" fill="#dc2626" name="Refusés" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historique décisions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <History size={15} className="text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Dernières décisions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                <th className="text-left px-4 py-2.5 font-bold">Date</th>
                <th className="text-left px-2 py-2.5 font-bold">Dossier</th>
                <th className="text-left px-2 py-2.5 font-bold">Client</th>
                <th className="text-center px-2 py-2.5 font-bold">Décision</th>
                <th className="text-right px-2 py-2.5 font-bold">Montant</th>
                <th className="text-center px-2 py-2.5 font-bold">Qualité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {d.historique_decisions.slice(0, 5).map((h, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-xs text-slate-500">{h.date}</td>
                  <td className="px-2 py-2 text-[10px] font-mono">{h.dossier}</td>
                  <td className="px-2 py-2 text-xs font-semibold">{h.client}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${DECISION_STYLE[h.decision] ?? 'bg-slate-100'}`}>
                      {h.decision.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right text-xs font-bold">{formatFcfa(h.montant)}</td>
                  <td className="px-2 py-2 text-center">
                    {h.qualite === 'OK'
                      ? <CheckCircle2 size={14} className="text-green-600 mx-auto" />
                      : <AlertCircle size={14} className="text-orange-600 mx-auto" />}
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

function Kpi({ label, value, sub, alert, ok }: {
  label: string; value: string | number; sub?: string; alert?: boolean; ok?: boolean
}) {
  const bg = alert ? 'bg-red-50 border-red-200' : ok ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
  return (
    <div className={`rounded-xl border p-2.5 ${bg}`}>
      <div className="text-[9px] font-bold text-slate-500 uppercase truncate">{label}</div>
      <div className={`font-black mt-0.5 text-lg ${alert ? 'text-red-800' : ok ? 'text-green-800' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-[9px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function QuickLink({ href, icon: Icon, label, desc, badge }: {
  href: string; icon: typeof FileText; label: string; desc: string; badge: string
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center group-hover:bg-indigo-100 transition-colors duration-200">
          <Icon className="w-4 h-4 text-indigo-700" />
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-800 border-indigo-200">{badge}</span>
      </div>
      <div className="text-sm font-bold text-slate-900 mb-1">{label}</div>
      <p className="text-[11px] text-slate-500">{desc}</p>
    </Link>
  )
}
