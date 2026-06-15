'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Banknote, Target, Sparkles, TrendingDown, MapPin, UserX, CheckCircle2,
  BarChart3, Zap,
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { RecouvrementEquipesBlock } from '@/components/recouvrement/RecouvrementEquipesBlock'
import { MauvaisPayeursBlock } from '@/components/recouvrement/MauvaisPayeursBlock'
import { formatFcfa } from '@/lib/utils'
import { getRecouvrementHubData } from '@/lib/roc-recouvrement-hub'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'

const STATUT_AGENT: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-800 border-red-200',
  DEGRADE: 'bg-red-100 text-red-800 border-red-200',
  VIGILANCE: 'bg-orange-100 text-orange-800 border-orange-200',
}

const STATUT_AGENCE: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-700',
  TENSION: 'bg-orange-100 text-orange-700',
  OK: 'bg-blue-100 text-blue-700',
  EXCELLENT: 'bg-emerald-100 text-emerald-700',
}

export default function RecouvrementRocPage() {
  const router = useRouter()
  const hub = getRecouvrementHubData()
  const { kpis } = hub
  const maxCollecte = Math.max(...hub.evolution_semaine.map(e => e.objectif))

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [])

  return (
    <PageWrapper
      title="Recouvrement réseau"
      subtitle="Synthèse stratégique, équipes par agence, mauvais payeurs & plan d'action ROC"
    >
      <ApiVersionRedirect mockPath="/credit/recouvrement" />
      <MockVersionBanner mockPath="/credit/recouvrement" />
      {/* Synthèse IA */}
      <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-purple-700" />
          <span className="text-sm font-bold text-purple-900">Synthèse IA recouvrement</span>
          <AiBadge variant="small" label="Prospera AI" pulse />
        </div>
        <p className="text-sm text-purple-950 leading-relaxed">{hub.synthese_ia}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Taux jour</div>
          <div className={`text-3xl font-black mt-1 ${kpis.taux_atteint_pct < 60 ? 'text-red-600' : kpis.taux_atteint_pct < 75 ? 'text-orange-600' : 'text-teal-700'}`}>
            {kpis.taux_atteint_pct}%
          </div>
          <div className="text-[10px] text-red-600 font-bold mt-0.5">{kpis.ecart_pts} pts vs obj.</div>
          <div className="mt-2 bg-slate-100 rounded-full h-1.5">
            <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${kpis.taux_atteint_pct}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Collecté</div>
          <div className="text-lg font-black text-teal-700 mt-1">{formatFcfa(kpis.collecte_jour_fcfa)}</div>
          <div className="text-[10px] text-slate-500">/ {formatFcfa(kpis.objectif_jour_fcfa)}</div>
        </div>
        <div className="rounded-xl border border-orange-200 p-4 bg-orange-50/30">
          <div className="text-[10px] font-bold text-orange-600 uppercase">Non visités</div>
          <div className="text-2xl font-black text-orange-700 mt-1">{kpis.clients_non_visites}</div>
          <div className="text-[10px] text-slate-500">{kpis.clients_visites}/{kpis.clients_prevus}</div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <div className="text-[10px] font-bold text-blue-600 uppercase">Promesses</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{kpis.promesses_count}</div>
          <div className="text-[10px] text-slate-500">{formatFcfa(kpis.promesses_montant)}</div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4">
          <div className="text-[10px] font-bold text-emerald-600 uppercase">Honorées 7j</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{kpis.promesses_honorees_pct}%</div>
        </div>
        <div className="rounded-xl border border-red-200 p-4 bg-red-50/20">
          <div className="text-[10px] font-bold text-red-600 uppercase">Impayés top 6</div>
          <div className="text-lg font-black text-red-700 mt-1">{formatFcfa(kpis.impayes_reseau_fcfa)}</div>
        </div>
      </div>

      {/* Méthode / rendu / suggérée */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={15} className="text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">{hub.methode_actuelle.titre}</h3>
          </div>
          <p className="text-xs text-slate-600 mb-3">{hub.methode_actuelle.description}</p>
          <ul className="space-y-1.5">
            {hub.methode_actuelle.points.map((p, i) => (
              <li key={i} className="text-[11px] text-slate-600 flex gap-2"><span className="text-slate-400">•</span>{p}</li>
            ))}
          </ul>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={15} className="text-orange-600" />
            <h3 className="text-sm font-bold text-orange-900">{hub.rendu_actuel.titre}</h3>
          </div>
          <p className="text-xs text-orange-800 mb-3 font-semibold">{hub.rendu_actuel.description}</p>
          <ul className="space-y-1.5">
            {hub.rendu_actuel.points.map((p, i) => (
              <li key={i} className="text-[11px] text-orange-900 flex gap-2"><span className="text-orange-500">▸</span>{p}</li>
            ))}
          </ul>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-teal-700" />
            <h3 className="text-sm font-bold text-teal-900">{hub.methode_suggeree.titre}</h3>
            <AiBadge variant="small" label="IA" />
          </div>
          <p className="text-xs text-teal-800 mb-3">{hub.methode_suggeree.description}</p>
          <ul className="space-y-1.5">
            {hub.methode_suggeree.points.map((p, i) => (
              <li key={i} className="text-[11px] text-teal-900 flex gap-2">
                <CheckCircle2 size={11} className="text-teal-600 shrink-0 mt-0.5" />{p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mauvais payeurs — liste intégrée */}
      <div className="mb-10">
        <MauvaisPayeursBlock />
      </div>

      {/* Agents en souci */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-10 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <UserX size={16} className="text-red-600" />
          <h3 className="text-sm font-bold text-slate-900">Agents terrain en souci</h3>
          <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{hub.agents_en_souci.length}</span>
          <AiBadge variant="small" label="Sous-performance" />
        </div>
        <div className="divide-y divide-slate-100">
          {hub.agents_en_souci.map(a => (
            <div
              key={a.id}
              className={`p-5 hover:bg-slate-50 transition-colors duration-200 cursor-pointer ${a.statut === 'CRITIQUE' ? 'bg-red-50/20' : ''}`}
              onClick={() => router.push(`/credit/recouvrement/agents/${a.id}`)}
              onKeyDown={e => e.key === 'Enter' && router.push(`/credit/recouvrement/agents/${a.id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{a.nom}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${STATUT_AGENT[a.statut]}`}>{a.statut}</span>
                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-0.5"><MapPin size={10} />{a.zone}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    <span>Tx <strong className={a.taux_recouvrement < 55 ? 'text-red-600' : 'text-orange-600'}>{a.taux_recouvrement}%</strong></span>
                    <span>Visites <strong>{a.visites_jour}/{a.visites_obj}</strong></span>
                    <span>Collecte j <strong className="text-teal-700">{formatFcfa(a.collecte_jour)}</strong></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); document.getElementById('equipes')?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-100 cursor-pointer"
                >
                  Voir équipe agence ↓
                </button>
              </div>
              <p className="text-[11px] text-slate-600">{a.diagnostic_ia}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recouvrement par agence — résumé */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-10 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Banknote size={15} className="text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900">Recouvrement par agence — vue rapide</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {hub.agences.map(ag => (
            <div key={ag.agence_id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900">{ag.nom}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUT_AGENCE[ag.statut]}`}>{ag.statut}</span>
              </div>
              <div className={`text-2xl font-black ${ag.taux_pct < 60 ? 'text-red-600' : 'text-teal-700'}`}>{ag.taux_pct}%</div>
              <div className="text-[11px] text-slate-600 mt-1">
                Impayés <strong className="text-red-600">{formatFcfa(ag.impayes_fcfa)}</strong> · {ag.nb_agents} agents
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Équipes par agence — intégré */}
      <div className="mb-10">
        <RecouvrementEquipesBlock />
      </div>

      {/* Plan stratégique */}
      <div className="bg-slate-900 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-amber-400" />
          <h3 className="text-sm font-bold">Plan stratégique — semaine en cours</h3>
        </div>
        <div className="space-y-3">
          {hub.plan_strategique.map(p => (
            <div key={p.priorite} className="flex flex-wrap items-start gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-900 text-xs font-black flex items-center justify-center shrink-0">{p.priorite}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{p.action}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-400">
                  <span>{p.responsable}</span><span>·</span><span>{p.delai}</span><span>·</span>
                  <span className="text-emerald-400 font-bold">{p.impact_estime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
