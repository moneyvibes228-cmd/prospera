'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2, Banknote, Zap, Activity, ChevronRight, ChevronDown,
  XCircle, Ban, FileX, Wifi, Wrench, AlertTriangle, Sparkles,
  CheckCircle2, Clock, Users, ArrowRight, ShieldAlert, TrendingUp,
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import { getReseauHubData } from '@/lib/roc-reseau-hub'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'
import type { AgenceFicheReseau } from '@/lib/roc-reseau-hub'

const STATUT_PAR: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-700 border-red-200',
  TENSION: 'bg-orange-100 text-orange-700 border-orange-200',
  NORMAL: 'bg-blue-100 text-blue-700 border-blue-200',
  BON: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const CASH_NIVEAU: Record<string, string> = {
  CRITIQUE_BAS: 'bg-red-100 text-red-800 border-red-200',
  TENSION: 'bg-orange-100 text-orange-800 border-orange-200',
  NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
  EXCEDENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

const CASH_LABEL: Record<string, string> = {
  CRITIQUE_BAS: 'Critique',
  TENSION: 'Tension',
  NORMAL: 'Normal',
  EXCEDENT: 'Excédent',
}

const SEV: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-800 border-red-200',
  HAUTE: 'bg-orange-100 text-orange-800 border-orange-200',
  MODEREE: 'bg-amber-100 text-amber-800 border-amber-200',
}

const TENDANCE: Record<string, string> = {
  POSITIF: 'text-emerald-600',
  STABLE: 'text-slate-500',
  ALERTE: 'text-red-600',
}

export default function ReseauAgencesRocPage() {
  const router = useRouter()
  const hub = getReseauHubData()
  const [expanded, setExpanded] = useState<string | null>('AG-003')

  const cellStyle = (v: number, seuil: number) => {
    if (v > seuil * 1.3) return 'bg-red-500 text-white'
    if (v > seuil) return 'bg-orange-400 text-white'
    if (v > seuil * 0.7) return 'bg-yellow-300 text-yellow-900'
    return 'bg-emerald-200 text-emerald-800'
  }

  return (
    <PageWrapper
      title="Agences & opérations"
      subtitle="Pilotage réseau — trésorerie, PAR, contrôles quotidiens & actions ROC"
    >
      <ApiVersionRedirect mockPath="/credit/reseau" />
      <MockVersionBanner mockPath="/credit/reseau" />
      {/* Synthèse IA */}
      <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-indigo-700" />
          <span className="text-sm font-bold text-indigo-900">Compréhension IA — opérations réseau</span>
          <AiBadge variant="small" label="Prospera AI" pulse />
        </div>
        <p className="text-sm text-indigo-950 leading-relaxed">{hub.synthese_ia}</p>
      </div>

      {/* Alertes immédiates */}
      {hub.alertes_immediates.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border-2 border-red-200 bg-red-50/60">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={15} className="text-red-600" />
            <span className="text-xs font-bold text-red-900 uppercase tracking-wide">Alertes immédiates</span>
          </div>
          <ul className="space-y-1.5">
            {hub.alertes_immediates.map((a, i) => (
              <li key={i} className="text-xs text-red-900 flex gap-2 items-start">
                <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPIs réseau */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {hub.chiffres_cles.map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-[9px] font-bold text-slate-400 uppercase truncate">{k.label}</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">{k.valeur}</div>
            {k.commentaire && (
              <div className={`text-[9px] mt-0.5 font-semibold ${
                k.tendance === 'HAUSSE' && k.label.includes('PAR') ? 'text-red-600'
                  : k.tendance === 'BAISSE' ? 'text-emerald-600' : 'text-slate-500'
              }`}>
                {k.commentaire}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions prioritaires ROC */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">Actions ROC prioritaires</h2>
          <span className="text-[10px] text-slate-400 ml-auto">{hub.actions_prioritaires.length} actions du jour</span>
        </div>
        <div className="divide-y divide-slate-50">
          {hub.actions_prioritaires.map((a, i) => (
            <div key={i} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-slate-50 transition-colors duration-200">
              <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded w-fit ${
                a.priorite === 1 ? 'bg-red-100 text-red-700' : a.priorite === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>
                P{a.priorite}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900">{a.action}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{a.impact}</div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 shrink-0">
                <Clock size={11} />
                {a.delai}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activité jour + équipes compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">Activité opérationnelle du jour</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <OpKpi label="Transactions" value={hub.activite.transactions_jour} sub={formatFcfa(hub.activite.volume_transactionnel)} />
            <OpKpi label="Décaissements" value={hub.activite.decaissements_jour_count} sub={formatFcfa(hub.activite.decaissements_jour_montant)} />
            <OpKpi label="Remboursements" value="—" sub={formatFcfa(hub.activite.remboursements_jour_montant)} />
            <OpKpi label="Incidents" value={hub.activite.incidents_systeme_actifs} sub={`${hub.activite.tickets_p1} ticket P1`} alert={hub.activite.tickets_p1 > 0} />
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-slate-100">
            <MiniKpi label="Dossiers attente ROC" value={hub.kpis_ops.dossiers_a_valider} />
            <MiniKpi label="Dossiers bloqués" value={hub.kpis_ops.dossiers_bloques} alert />
            <MiniKpi label="Délai traitement" value={`${hub.kpis_ops.temps_traitement_h}h`} sub={`obj. ${hub.kpis_ops.temps_traitement_obj}h`} />
            <MiniKpi label="Opérations jour" value={hub.kpis_ops.operations_jour} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">Équipes réseau</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
              <div className="text-lg font-black text-slate-800">{hub.equipes.responsables_agence}</div>
              <div className="text-[9px] text-slate-500 font-bold uppercase">Resp. agence</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
              <div className="text-lg font-black text-slate-800">{hub.equipes.agents_terrain}</div>
              <div className="text-[9px] text-slate-500 font-bold uppercase">Agents terrain</div>
            </div>
          </div>
          <div className="space-y-2">
            {hub.equipes.charges_credit.map((cc, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 text-[11px]">
                <span className="font-semibold text-slate-800 flex-1">{cc.nom}</span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                  cc.charge === 'ELEVEE' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                }`}>{cc.charge}</span>
                <span className="text-slate-500">{cc.dossiers_actifs} doss.</span>
              </div>
            ))}
          </div>
          <Link
            href="/credit/recouvrement#equipes"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 mt-4 cursor-pointer hover:text-teal-900 transition-colors duration-200"
          >
            Performance agents terrain <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* Cash synthèse */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Banknote size={16} className="text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">Trésorerie inter-agences</h2>
          <span className="text-[10px] text-slate-400 ml-auto">MAJ {hub.cash_synthese.derniere_maj}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-50 border col-span-2 md:col-span-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total réseau</div>
            <div className="text-xl font-black">{formatFcfa(hub.cash_synthese.total_disponible)}</div>
          </div>
          <CashStat label="Critiques" count={hub.cash_synthese.agences_critiques} color="red" />
          <CashStat label="Tension" count={hub.cash_synthese.agences_tension} color="orange" />
          <CashStat label="Normales" count={hub.cash_synthese.agences_normales} color="blue" />
          <CashStat label="Excédent" count={hub.cash_synthese.agences_excedent} color="emerald" />
        </div>
        <div className="p-3 rounded-lg bg-red-50 border-2 border-red-200 flex gap-3 items-center">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-red-900">Transferts recommandés par l&apos;IA</div>
            <div className="text-lg font-black text-red-700">{formatFcfa(hub.cash_synthese.transferts_recommandes)}</div>
            <div className="text-[10px] text-red-700 mt-0.5">Tabligbo → Bè Kpota (700 k) + Siège → Bè Kpota (2 M) avant 10 h</div>
          </div>
        </div>
      </div>

      {/* Fiches agence détaillées */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">Fiches agence — analyse & actions</h2>
        </div>
        <div className="space-y-3">
          {hub.agences
            .sort((a, b) => (a.statut_par === 'CRITIQUE' ? -1 : 0) - (b.statut_par === 'CRITIQUE' ? -1 : 0))
            .map(ag => (
              <AgenceCard
                key={ag.agence_id}
                agence={ag}
                expanded={expanded === ag.agence_id}
                onToggle={() => setExpanded(expanded === ag.agence_id ? null : ag.agence_id)}
                cellStyle={cellStyle}
                router={router}
              />
            ))}
        </div>
      </div>

      {/* Points d'attention IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900">Points d&apos;attention IA</h2>
          </div>
          <div className="space-y-2">
            {hub.points_attention.map((p, i) => (
              <div key={i} className={`p-3 rounded-lg border ${SEV[p.severite]}`}>
                <div className="text-xs font-bold">{p.titre}</div>
                <div className="text-[11px] mt-1 opacity-90">{p.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap PAR compacte */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Zap size={16} className="text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900">Heatmap PAR réseau</h2>
            <Link href="/risque" className="text-[10px] font-bold text-teal-700 ml-auto cursor-pointer hover:underline">
              PAR & Risque →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                  <th className="text-left px-4 py-2.5 font-bold">Agence</th>
                  <th className="text-center px-2 py-2.5">1j</th>
                  <th className="text-center px-2 py-2.5">7j</th>
                  <th className="text-center px-2 py-2.5">30j</th>
                  <th className="text-center px-2 py-2.5">90j</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {hub.agences.map(a => (
                  <tr
                    key={a.agence_id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                    onClick={() => setExpanded(a.agence_id)}
                  >
                    <td className="px-4 py-2 text-xs font-semibold text-slate-800">{a.nom}</td>
                    <td className="px-2 py-2 text-center"><ParCell v={a.par.j1} seuil={12} cellStyle={cellStyle} /></td>
                    <td className="px-2 py-2 text-center"><ParCell v={a.par.j7} seuil={10} cellStyle={cellStyle} /></td>
                    <td className="px-2 py-2 text-center"><ParCell v={a.par.j30} seuil={8} cellStyle={cellStyle} /></td>
                    <td className="px-2 py-2 text-center"><ParCell v={a.par.j90} seuil={3} cellStyle={cellStyle} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contrôle opérationnel enrichi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Wrench size={16} className="text-slate-600" />
          <h2 className="text-sm font-bold text-slate-900">Contrôle opérationnel — diagnostic IA</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
            <ControleChip icon={XCircle} label="Échouées" value={`${hub.controle.transactions_echouees}/${hub.controle.transactions_total}`} style="red" />
            <ControleChip icon={Ban} label="Annulées" value={hub.controle.operations_annulees} style="orange" />
            <ControleChip icon={FileX} label="Incomplets" value={hub.controle.dossiers_incomplets} style="amber" />
            <ControleChip icon={Wifi} label="Agences actives" value={`${hub.controle.agences_actives}/${hub.controle.agences_actives + hub.controle.agences_offline}`} style="green" />
            <ControleChip icon={Wrench} label="Tickets" value={`${hub.controle.tickets_incidents_ouverts} (P1:${hub.controle.ticket_p1})`} style="red" />
          </div>
          {hub.controle_analyses.map((ca, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-bold text-slate-900 mb-1.5">{ca.label}</div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{ca.ia}</p>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                <ArrowRight size={13} className="text-teal-600 shrink-0 mt-0.5" />
                <span className="text-[11px] font-semibold text-teal-900">{ca.action}</span>
              </div>
            </div>
          ))}
          {hub.controle.derniere_anomalie && (
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <Clock size={11} />
              Dernière anomalie : {hub.controle.derniere_anomalie.detail} — {hub.controle.derniere_anomalie.heure}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

function AgenceCard({
  agence: ag, expanded, onToggle, cellStyle, router,
}: {
  agence: AgenceFicheReseau
  expanded: boolean
  onToggle: () => void
  cellStyle: (v: number, seuil: number) => string
  router: ReturnType<typeof useRouter>
}) {
  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors duration-200 ${
      ag.statut_par === 'CRITIQUE' ? 'border-red-200 bg-red-50/20' : 'border-slate-200 bg-white'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-3 text-left cursor-pointer hover:bg-slate-50/80 transition-colors duration-200"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{ag.nom}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${STATUT_PAR[ag.statut_par]}`}>{ag.statut_par}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              ag.statut_bceao === 'NON_CONFORME' ? 'bg-red-100 text-red-800 border-red-200'
                : ag.statut_bceao === 'ATTENTION' ? 'bg-orange-100 text-orange-800 border-orange-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              BCEAO {ag.statut_bceao === 'NON_CONFORME' ? 'NC' : ag.statut_bceao === 'ATTENTION' ? 'ATT.' : 'OK'}
            </span>
            <span className={`text-[9px] font-bold ${TENDANCE[ag.tendance]}`}>
              <TrendingUp size={10} className="inline mr-0.5" />
              {ag.tendance}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            Score santé {ag.score_sante}/100 · {ag.transactions_jour} trans. · Cash {CASH_LABEL[ag.cash.niveau]}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-black text-slate-800">{formatFcfa(ag.encours)}</div>
          <div className="text-[10px] text-slate-500">encours</div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
          {/* PAR + Cash row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">PAR agence</div>
              <div className="flex gap-2 flex-wrap">
                <ParBadge label="1j" v={ag.par.j1} seuil={12} cellStyle={cellStyle} />
                <ParBadge label="7j" v={ag.par.j7} seuil={10} cellStyle={cellStyle} />
                <ParBadge label="30j" v={ag.par.j30} seuil={8} cellStyle={cellStyle} />
                <ParBadge label="90j" v={ag.par.j90} seuil={3} cellStyle={cellStyle} />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cash & prévisions</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-50 border">
                  <div className="text-slate-500">Disponible</div>
                  <div className="font-black">{formatFcfa(ag.cash.cash_disponible)}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border">
                  <div className="text-slate-500">Minimum requis</div>
                  <div className="font-black">{formatFcfa(ag.cash.cash_minimum_requis)}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border">
                  <div className="text-slate-500">Prévision 24h</div>
                  <div className="font-black">{formatFcfa(ag.cash.prevision_24h)}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border">
                  <div className="text-slate-500">Décaiss. prévus</div>
                  <div className="font-black">{formatFcfa(ag.cash.decaissements_prevus_jour)}</div>
                </div>
              </div>
              <span className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded border ${CASH_NIVEAU[ag.cash.niveau]}`}>
                {CASH_LABEL[ag.cash.niveau]}
              </span>
              {ag.cash.action_recommandee && (
                <div className="mt-2 text-[11px] font-semibold text-red-700 flex gap-1.5 items-start">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  {ag.cash.action_recommandee}
                </div>
              )}
            </div>
          </div>

          {/* Analyse IA */}
          <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={12} className="text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-800 uppercase">Analyse IA</span>
            </div>
            <p className="text-[11px] text-indigo-950 leading-relaxed">{ag.analyse_ia}</p>
          </div>

          {/* Actions */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Actions recommandées</div>
            <ul className="space-y-1.5">
              {ag.actions_ia.map((action, i) => (
                <li key={i} className="flex gap-2 text-[11px] text-slate-800">
                  <CheckCircle2 size={13} className="text-teal-600 shrink-0 mt-0.5" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Liens */}
          <div className="flex flex-wrap gap-2 pt-2">
            {ag.liens.map((l, i) => (
              <Link
                key={i}
                href={l.href}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-[11px] font-bold text-teal-800 cursor-pointer hover:bg-teal-100 transition-colors duration-200"
              >
                {l.label} <ChevronRight size={11} />
              </Link>
            ))}
            <button
              type="button"
              onClick={() => router.push('/agences')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors duration-200"
            >
              Fiche agence <ChevronRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function OpKpi({ label, value, sub, alert }: { label: string; value: string | number; sub?: string; alert?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${alert ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
      <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
      <div className={`text-xl font-black mt-0.5 ${alert ? 'text-red-700' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  )
}

function MiniKpi({ label, value, sub, alert }: { label: string; value: string | number; sub?: string; alert?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-slate-400 uppercase font-bold">{label}</div>
      <div className={`text-sm font-black ${alert ? 'text-red-600' : 'text-slate-800'}`}>{value}</div>
      {sub && <div className="text-[9px] text-slate-500">{sub}</div>}
    </div>
  )
}

function CashStat({ label, count, color }: { label: string; count: number; color: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-50 border-red-100 text-red-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  }
  return (
    <div className={`p-3 rounded-lg border text-center ${colors[color]}`}>
      <div className="text-2xl font-black">{count}</div>
      <div className="text-[9px] font-bold uppercase">{label}</div>
    </div>
  )
}

function ParCell({ v, seuil, cellStyle }: { v: number; seuil: number; cellStyle: (v: number, s: number) => string }) {
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cellStyle(v, seuil)}`}>{v}%</span>
}

function ParBadge({ label, v, seuil, cellStyle }: { label: string; v: number; seuil: number; cellStyle: (v: number, s: number) => string }) {
  return (
    <div className="text-center">
      <div className={`text-[10px] font-bold px-2.5 py-1 rounded ${cellStyle(v, seuil)}`}>{v}%</div>
      <div className="text-[9px] text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function ControleChip({ icon: Icon, label, value, style }: {
  icon: React.ElementType
  label: string
  value: string | number
  style: 'red' | 'orange' | 'amber' | 'green'
}) {
  const colors = {
    red: 'bg-red-50 border-red-100 text-red-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    green: 'bg-green-50 border-green-100 text-green-700',
  }
  return (
    <div className={`flex flex-col items-center p-2.5 rounded-lg border ${colors[style]}`}>
      <Icon size={14} className="mb-1" />
      <div className="text-sm font-black">{value}</div>
      <div className="text-[9px] font-bold text-slate-600 text-center">{label}</div>
    </div>
  )
}
