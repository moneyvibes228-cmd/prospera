'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getAgentRecouvrementById } from '@/lib/roc-recouvrement-vue360'
import { BlocAnalyseIA } from '@/components/recouvrement/BlocAnalyseIA'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import { RecouvrementDrillBanner } from '@/components/recouvrement/RecouvrementDrillBanner'

const STATUT_STYLE: Record<string, string> = {
  BON: 'bg-green-100 text-green-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  DEGRADE: 'bg-red-100 text-red-700',
}

export default function AgentRecouvrementPage() {
  const params = useParams()
  const router = useRouter()
  const agent = getAgentRecouvrementById(params.id as string)

  if (!agent) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Agent introuvable.</p>
        <button type="button" onClick={() => router.back()} className="text-teal-600 text-sm mt-2">← Retour</button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <RecouvrementDrillBanner type="agent" id={params.id as string} />
      <button type="button" onClick={() => router.push('/credit/recouvrement')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Équipe recouvrement
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User size={18} className="text-teal-700" />
            <h1 className="text-xl font-black text-slate-900">{agent.nom}</h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUT_STYLE[agent.statut]}`}>{agent.statut}</span>
            <AiBadge variant="small" label="Analyse recouvrement" />
          </div>
          <p className="text-sm text-slate-500">Zone {agent.zone} · {agent.clients_actifs} clients · Portefeuille {formatFcfa(agent.portefeuille_fcfa)}</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black ${agent.taux_recouvrement >= 70 ? 'text-green-700' : agent.taux_recouvrement >= 50 ? 'text-orange-600' : 'text-red-700'}`}>
            {agent.taux_recouvrement}%
          </div>
          <div className="text-xs text-slate-500">Taux recouvrement</div>
        </div>
      </div>

      <BlocAnalyseIA
        titre={`Analyse IA recouvrement — ${agent.nom}`}
        contenu={agent.analyse_ia_equipe}
        variant={agent.statut === 'DEGRADE' ? 'alert' : 'default'}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Visites jour" value={`${agent.visites_jour}/${agent.visites_obj}`} alert={agent.visites_jour / agent.visites_obj < 0.8} />
        <Kpi label="Collecte jour" value={formatFcfa(agent.collecte_jour)} />
        <Kpi label="Retards J+7" value={String(agent.retards_j7)} alert={agent.retards_j7 >= 10} />
        <Kpi label="Clients actifs" value={String(agent.clients_actifs)} />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-green-800 mb-2">Points forts</h3>
            <ul className="text-sm space-y-1">
              {agent.points_forts.map(p => <li key={p} className="text-slate-700">✓ {p}</li>)}
              {agent.points_forts.length === 0 && <li className="text-slate-400 italic">—</li>}
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <h3 className="text-sm font-bold text-red-800 mb-2">Points faibles</h3>
            <ul className="text-sm space-y-1">
              {agent.points_faibles.map(p => <li key={p} className="text-slate-700">• {p}</li>)}
              {agent.points_faibles.length === 0 && <li className="text-slate-400 italic">Aucun signal critique</li>}
            </ul>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Collecte vs objectif (3 derniers jours)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={agent.evolution_collecte}>
                <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatFcfa(Number(v ?? 0))} />
                <Legend />
                <Bar dataKey="collecte" name="Collecté" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="objectif" name="Objectif" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {agent.clients_portefeuille.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Clients à risque — analyse recouvrement IA</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chaque client avec crédit actif et score de probabilité de remboursement</p>
          </div>
          <div className="divide-y divide-slate-100">
            {agent.clients_portefeuille.map(c => (
              <Link key={c.client_id} href={`/credit/recouvrement/clients/${c.client_id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 group-hover:text-teal-800">{c.nom}</div>
                  <div className="text-xs text-slate-500">{formatFcfa(c.encours)} encours · J+{c.retard_j} · {c.dernier_echange}</div>
                </div>
                <div className="text-center shrink-0">
                  <div className={`text-lg font-black ${c.score_ia < 35 ? 'text-red-600' : 'text-orange-600'}`}>{c.score_ia}</div>
                  <div className="text-[9px] text-slate-400">Score IA</div>
                </div>
                <div className="text-center shrink-0 w-16">
                  <div className={`text-sm font-bold ${c.probabilite_pct >= 40 ? 'text-orange-600' : 'text-red-600'}`}>{c.probabilite_pct}%</div>
                  <div className="text-[9px] text-slate-400">Prob. 30j</div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
      <div className="text-[10px] font-bold text-slate-400 uppercase">{label}</div>
      <div className={`text-lg font-black mt-1 ${alert ? 'text-red-700' : 'text-slate-800'}`}>{value}</div>
    </div>
  )
}
