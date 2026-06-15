'use client'
import { useRouter } from 'next/navigation'
import { Target, TrendingUp, TrendingDown, Sparkles, Briefcase, MapPin, ChevronRight } from 'lucide-react'
import { getRaHubData, type EquipeGpRA, type EquipeObjectifTerrain } from '@/lib/ra-agence-hub'
import { agentNomToId } from '@/lib/dg-vue360'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa, cn } from '@/lib/utils'

function agentFichePath(nom: string) {
  return `/dashboard/agents/${agentNomToId(nom)}`
}

const BADGE_STYLE: Record<string, string> = {
  OR: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  ARGENT: 'bg-slate-200 text-slate-600 border-slate-300',
  BRONZE: 'bg-orange-100 text-orange-700 border-orange-300',
}

/** Équipe RA — version mock. Voir `EquipeRaBlockWithApi`. */
export function EquipeRaBlock() {
  const router = useRouter()
  const hub = getRaHubData()
  const openAgentFiche = (nom: string) => router.push(agentFichePath(nom))
  const sortedTerrain = [...hub.equipe_objectifs].sort((a, b) => b.performance_pct - a.performance_pct)
  const meilleursTerrain = sortedTerrain.filter((a) => a.performance_pct >= 82)
  const piresTerrain = sortedTerrain.filter((a) => a.performance_pct < 70 || a.statut === 'DEGRADE')
  const moyTerrain =
    sortedTerrain.length > 0
      ? Math.round(sortedTerrain.reduce((s, a) => s + a.performance_pct, 0) / sortedTerrain.length)
      : 0
  const gpPrincipal = hub.equipe_gp[0]

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Résumé équipe — {hub.agence.nom}</h3>
          <AiBadge variant="small" label="Synthèse IA" />
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {hub.agence.nom} : {hub.agents_terrain.filter((a) => a.actif).length}/{hub.agents_terrain.length} commercial
          {hub.agents_terrain.length > 1 ? 'aux' : ''} terrain actif
          {hub.agents_terrain.length > 1 ? 's' : ''}
          {hub.equipe_gp.length > 0 && ` · ${hub.equipe_gp.length} GP (suivi crédit guichet)`}.
          Performance moyenne terrain {moyTerrain} %.
          {gpPrincipal &&
            ` GP ${gpPrincipal.agent.split(' ')[0]} : recouvrement ${gpPrincipal.recouvrement_pct} % · PAR ${gpPrincipal.par_30} %.`}
          {meilleursTerrain.length > 0 &&
            ` Top terrain : ${meilleursTerrain.map((a) => a.agent.split(' ')[0]).join(', ')}.`}
          {piresTerrain.length > 0 &&
            ` Alerte terrain : ${piresTerrain.map((a) => a.agent).join(', ')} — plan d'action requis.`}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-teal-100 bg-gradient-to-r from-teal-50/60 to-white flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-teal-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Commerciaux terrain — visites & collecte zone</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Prospection, visites clients et collecte sur le terrain — cliquez un agent pour sa fiche détaillée
              </p>
            </div>
          </div>
          <AiBadge variant="small" label="Visites · GPS · Collecte" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                <th className="text-left px-4 py-3 font-bold">#</th>
                <th className="text-left px-2 py-3 font-bold">Agent</th>
                <th className="text-left px-2 py-3 font-bold">Rôle</th>
                <th className="text-right px-2 py-3 font-bold">Portefeuille</th>
                <th className="text-right px-2 py-3 font-bold">Collecte jour</th>
                <th className="text-right px-2 py-3 font-bold">Obj. mois</th>
                <th className="text-center px-2 py-3 font-bold">Atteint</th>
                <th className="text-center px-2 py-3 font-bold">PAR 30</th>
                <th className="text-center px-2 py-3 font-bold">Perf.</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedTerrain.map((a, i) => (
                <tr
                  key={a.agent}
                  role="button"
                  tabIndex={0}
                  onClick={() => openAgentFiche(a.agent)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openAgentFiche(a.agent)
                    }
                  }}
                  className={cn(
                    'hover:bg-teal-50/60 cursor-pointer transition-colors group',
                    a.statut === 'DEGRADE' && 'bg-red-50/50',
                  )}
                >
                  <td className="px-4 py-3 font-black text-slate-400">{i + 1}</td>
                  <td className="px-2 py-3">
                    <div className="font-bold text-slate-900 group-hover:text-teal-700">{a.agent}</div>
                    {a.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${BADGE_STYLE[a.badge]}`}>
                        {a.badge}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-500">{a.role}</td>
                  <td className="px-2 py-3 text-right text-xs font-bold text-slate-700">{formatFcfa(a.portefeuille)}</td>
                  <td className="px-2 py-3 text-right font-bold text-teal-700">{formatFcfa(a.collecte_jour)}</td>
                  <td className="px-2 py-3 text-right text-xs text-slate-600">{formatFcfa(a.objectif_collecte_mois)}</td>
                  <td className="px-2 py-3 text-center">
                    <span
                      className={`font-bold ${a.objectif_atteint_pct >= 80 ? 'text-green-700' : a.objectif_atteint_pct >= 60 ? 'text-orange-600' : 'text-red-600'}`}
                    >
                      {a.objectif_atteint_pct}%
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span
                      className={`font-bold ${a.par_30 > 10 ? 'text-red-600' : a.par_30 > 8 ? 'text-orange-600' : 'text-slate-700'}`}
                    >
                      {a.par_30}%
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center font-black">{a.performance_pct}%</td>
                  <td className="pr-3 py-3">
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hub.equipe_gp.length > 0 && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-white flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-indigo-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Gestionnaire(s) de portefeuille — suivi crédit</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Relances échéances, promesses de paiement, qualité portefeuille — cliquez un GP pour sa fiche
                </p>
              </div>
            </div>
            <AiBadge variant="small" label="Recouvrement · Relances" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                  <th className="text-left px-4 py-3 font-bold">GP</th>
                  <th className="text-right px-2 py-3 font-bold">Clients suivis</th>
                  <th className="text-right px-2 py-3 font-bold">Encours</th>
                  <th className="text-right px-2 py-3 font-bold">Collecte mois</th>
                  <th className="text-center px-2 py-3 font-bold">Recouv.</th>
                  <th className="text-center px-2 py-3 font-bold">Obj. recouv.</th>
                  <th className="text-center px-2 py-3 font-bold">Relances/j</th>
                  <th className="text-center px-2 py-3 font-bold">Promesses/sem.</th>
                  <th className="text-center px-2 py-3 font-bold">À risque</th>
                  <th className="text-center px-2 py-3 font-bold">PAR 30</th>
                  <th className="text-center px-2 py-3 font-bold">Perf.</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {hub.equipe_gp.map((gp) => (
                  <tr
                    key={gp.agent}
                    role="button"
                    tabIndex={0}
                    onClick={() => openAgentFiche(gp.agent)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openAgentFiche(gp.agent)
                      }
                    }}
                    className={cn(
                      'hover:bg-indigo-50/60 cursor-pointer transition-colors group',
                      gp.statut === 'DEGRADE' && 'bg-red-50/50',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-700">{gp.agent}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">GP</span>
                        {gp.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${BADGE_STYLE[gp.badge]}`}>
                            {gp.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right font-medium text-slate-700">{gp.clients_suivis}</td>
                    <td className="px-2 py-3 text-right text-xs font-bold text-slate-700">{formatFcfa(gp.encours_fcfa)}</td>
                    <td className="px-2 py-3 text-right font-bold text-indigo-700">{formatFcfa(gp.collecte_mois_fcfa)}</td>
                    <td className="px-2 py-3 text-center">
                      <span
                        className={`font-bold ${gp.recouvrement_pct >= 90 ? 'text-green-700' : gp.recouvrement_pct >= 80 ? 'text-orange-600' : 'text-red-600'}`}
                      >
                        {gp.recouvrement_pct}%
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span
                        className={`font-bold ${gp.objectif_atteint_pct >= 95 ? 'text-green-700' : gp.objectif_atteint_pct >= 85 ? 'text-orange-600' : 'text-red-600'}`}
                      >
                        {gp.objectif_atteint_pct}%
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center font-medium text-slate-700">{gp.relances_jour}</td>
                    <td className="px-2 py-3 text-center font-medium text-slate-700">{gp.promesses_semaine}</td>
                    <td className="px-2 py-3 text-center">
                      <span className={`font-bold ${gp.clients_a_risque > 5 ? 'text-red-600' : gp.clients_a_risque > 2 ? 'text-orange-600' : 'text-slate-700'}`}>
                        {gp.clients_a_risque}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className={`font-bold ${gp.par_30 > 10 ? 'text-red-600' : gp.par_30 > 8 ? 'text-orange-600' : 'text-slate-700'}`}>
                        {gp.par_30}%
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center font-black">{gp.performance_pct}%</td>
                    <td className="pr-3 py-3">
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-green-800 flex items-center gap-2">
            <TrendingUp size={15} /> Meilleurs performers — terrain
          </h3>
          {meilleursTerrain.slice(0, 3).map((a) => (
            <TerrainIdeaCard key={a.agent} agent={a} variant="good" onOpen={() => openAgentFiche(a.agent)} />
          ))}
          {hub.equipe_gp.filter((g) => g.performance_pct >= 85).map((gp) => (
            <GpIdeaCard key={gp.agent} gp={gp} variant="good" onOpen={() => openAgentFiche(gp.agent)} />
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
            <TrendingDown size={15} /> Plans d&apos;action requis
          </h3>
          {piresTerrain.slice(0, 3).map((a) => (
            <TerrainIdeaCard key={a.agent} agent={a} variant="bad" onOpen={() => openAgentFiche(a.agent)} />
          ))}
          {hub.equipe_gp.filter((g) => g.statut === 'DEGRADE').map((gp) => (
            <GpIdeaCard key={gp.agent} gp={gp} variant="bad" onOpen={() => openAgentFiche(gp.agent)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TerrainIdeaCard({
  agent,
  variant,
  onOpen,
}: {
  agent: EquipeObjectifTerrain
  variant: 'good' | 'bad'
  onOpen?: () => void
}) {
  const bg = variant === 'good' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`rounded-xl border p-4 w-full text-left hover:ring-2 hover:ring-teal-300/50 transition-shadow cursor-pointer ${bg}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Target size={14} className={variant === 'good' ? 'text-green-600' : 'text-red-600'} />
        <span className="text-sm font-bold text-slate-900">{agent.agent}</span>
        <span className="text-[10px] font-bold text-teal-700">Commercial</span>
        <AiBadge variant="small" label="IA" />
      </div>
      <p className="text-xs text-slate-700">
        {variant === 'good'
          ? `Performance ${agent.performance_pct}% — maintenir le rythme visites & collecte zone.`
          : `Performance ${agent.performance_pct}% — coaching collecte et visites requis.`}
      </p>
    </button>
  )
}

function GpIdeaCard({
  gp,
  variant,
  onOpen,
}: {
  gp: EquipeGpRA
  variant: 'good' | 'bad'
  onOpen?: () => void
}) {
  const bg = variant === 'good' ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`rounded-xl border p-4 w-full text-left hover:ring-2 hover:ring-indigo-300/50 transition-shadow cursor-pointer ${bg}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Briefcase size={14} className={variant === 'good' ? 'text-indigo-600' : 'text-red-600'} />
        <span className="text-sm font-bold text-slate-900">{gp.agent}</span>
        <span className="text-[10px] font-bold text-indigo-700">GP</span>
        <AiBadge variant="small" label="IA" />
      </div>
      <ul className="space-y-1">
        {gp.idees_ia.slice(0, 2).map((idee, i) => (
          <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
            <span className="text-indigo-500 mt-0.5">•</span>
            {idee}
          </li>
        ))}
      </ul>
    </button>
  )
}
