'use client'
import { MapPin, TrendingUp, Trophy, Smartphone, CheckCircle, Clock, XCircle, AlertTriangle, Flame, Star, Mic, WifiOff, RefreshCw, Navigation } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MOCK_COMMERCIAL, OBJECTIFS_COMMERCIAL } from '@/lib/mockDataByRole'
import { AiBadge } from '../AiBadge'
import { KpiCard } from '../KpiCard'
import { formatFcfa } from '@/lib/utils'
import { ObjectifsPanel } from '../ObjectifsPanel'

const STATUT_STYLE: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  POSITIVE:     { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50'  },
  NEGATIVE:     { icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50'    },
  SANS_REPONSE: { icon: Clock,       color: 'text-slate-400',  bg: 'bg-slate-50'  },
}

const BADGE_STYLE: Record<string, string> = {
  OR:       'bg-yellow-100 text-yellow-700 border-yellow-300 font-bold',
  ARGENT:   'bg-slate-200 text-slate-700 border-slate-300 font-bold',
  BRONZE:   'bg-orange-100 text-orange-700 border-orange-300 font-bold',
  RECRUTEUR:'bg-blue-100 text-blue-700 border-blue-300',
  RELEVE:   'bg-purple-100 text-purple-700 border-purple-300',
  SEMAINE:  'bg-teal-100 text-teal-700 border-teal-300',
}

const ZONE_STATUT: Record<string, string> = {
  FAIT:     'bg-green-100 text-green-700',
  EN_COURS: 'bg-blue-100 text-blue-700 animate-pulse',
  PLANIFIE: 'bg-slate-100 text-slate-500',
}

export function DashboardCommercial() {
  const d = MOCK_COMMERCIAL

  const visitePct   = Math.round((d.kpis.visites_aujourd_hui / d.kpis.objectif_jour) * 100)
  const collectePct = Math.round((d.kpis.collecte_aujourd_hui / d.kpis.collecte_objectif_jour) * 100)
  const pointsPct   = Math.round((d.kpis.points_semaine / d.kpis.points_objectif) * 100)

  return (
    <div className="space-y-5">
      <ObjectifsPanel objectifs={OBJECTIFS_COMMERCIAL} prenom="Edem" />


      {/* ── KPIs principaux ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Visites aujourd'hui" value={`${d.kpis.visites_aujourd_hui}/${d.kpis.objectif_jour}`}
          icon={MapPin} colorScheme="teal"
          subtext={`${d.kpis.visites_semaine}/${d.kpis.objectif_semaine} cette semaine`} />
        <KpiCard title="Collecte du jour" value={formatFcfa(d.kpis.collecte_aujourd_hui)}
          icon={Smartphone} colorScheme="blue"
          subtext={`Objectif ${formatFcfa(d.kpis.collecte_objectif_jour)}`} />
        <KpiCard title="Classement équipe" value={`#${d.kpis.classement_equipe} / ${d.kpis.total_agents}`}
          icon={Trophy} colorScheme="orange"
          subtext={`${d.kpis.prospects_positifs} prospects positifs`} />
        <KpiCard title="Streak actif 🔥" value={`${d.kpis.streak_jours} jours`}
          icon={Flame} colorScheme="red"
          subtext={`${d.kpis.points_semaine} pts · conv. ${(d.kpis.taux_conversion * 100).toFixed(0)}%`} />
      </div>

      {/* ── Barres de progression objectifs ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Progression objectifs du jour</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Visites terrain',  pct: visitePct,   val: `${d.kpis.visites_aujourd_hui}/${d.kpis.objectif_jour}`,  color: '#14b8a6' },
            { label: 'Collecte Mobile Money', pct: collectePct, val: `${formatFcfa(d.kpis.collecte_aujourd_hui)}`, color: '#3b82f6' },
            { label: 'Points gamification',  pct: pointsPct,   val: `${d.kpis.points_semaine} pts`,  color: '#f97316' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-700 font-medium">{item.label}</span>
                <span className="font-bold" style={{ color: item.pct >= 100 ? '#16a34a' : item.color }}>{item.pct}%</span>
              </div>
              <div className="bg-slate-100 rounded-full h-3">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(item.pct, 100)}%`, backgroundColor: item.pct >= 100 ? '#16a34a' : item.color }} />
              </div>
              <div className="text-xs text-slate-500 mt-1">{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* ── Plan de tournée ── */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Plan de tournée du jour — IA</h3>
              <AiBadge variant="small" label="Optimisé zone + conversion" />
              <span className="ml-auto">
                <AiBadge variant="small" label="Offline OK" />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Revisit auto · détection doublons GPS 50m · navigation intégrée</p>
          </div>
          <div className="divide-y divide-slate-50">
            {d.plan_tournee.map((z, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-shrink-0 w-14 text-xs font-mono text-slate-400">{z.heure}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{z.zone}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ZONE_STATUT[z.statut]}`}>{z.statut.replace('_', ' ')}</span>
                  </div>
                  {z.visitees > 0 && (
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span>{z.visitees} visites</span>
                      <span className="text-green-600 font-medium">{formatFcfa(z.collecte)}</span>
                      <span className="text-slate-400">{z.distance}</span>
                    </div>
                  )}
                  {z.visitees === 0 && <p className="text-xs text-slate-400 mt-0.5">{z.distance} de la position actuelle</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Défis actifs ── */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              <h3 className="text-sm font-semibold text-slate-900">Défis actifs</h3>
            </div>
            <div className="space-y-3">
              {d.defis_actifs.map((defi, i) => {
                const pct = Math.min(Math.round((defi.realise / defi.objectif) * 100), 100)
                return (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-800">{defi.titre}</span>
                      <span className="text-xs text-teal-600 font-bold">{pct}%</span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-1.5 mb-1.5">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#16a34a' : '#14b8a6' }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Récompense : <span className="text-yellow-600 font-medium">{defi.recompense}</span></span>
                      <span>{defi.deadline}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Badges obtenus */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Badges obtenus ce mois</h3>
            <div className="flex flex-wrap gap-2">
              {d.kpis.badges.map(badge => (
                <span key={badge} className={`text-xs px-2.5 py-1 rounded-full border ${BADGE_STYLE[badge] ?? 'bg-slate-100 text-slate-500'}`}>
                  {badge === 'OR' ? '🥇' : badge === 'ARGENT' ? '🥈' : badge === 'BRONZE' ? '🥉' : '🏆'} {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Visites récentes + Classement ── */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Visites récentes — terrain</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {d.visites_recentes.map((v, i) => {
              const s = STATUT_STYLE[v.statut]
              const Icon = s.icon
              return (
                <div key={i} className={`flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors ${v.doublon_alerte ? 'bg-orange-50/50' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${s.bg}`}>
                    <Icon size={15} className={s.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{v.nom}</span>
                      <span className="text-xs text-slate-400">{v.activite}</span>
                      {v.doublon_alerte && (
                        <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <AlertTriangle size={10} /> Doublon GPS
                        </span>
                      )}
                      {!v.gps_valide && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">GPS non validé</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{v.methode} · {v.heure} · {v.notes}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Classement équipe */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Classement équipe — semaine</h3>
          <div className="space-y-3">
            {d.classement_equipe.map(a => (
              <div key={a.rang} className={`p-3 rounded-xl border ${a.rang === 1 ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    a.rang === 1 ? 'bg-yellow-400 text-white' :
                    a.rang === 2 ? 'bg-slate-400 text-white' :
                    a.rang === 3 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>{a.rang}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{a.nom}</span>
                      {a.badge && <span className={`text-xs px-1.5 py-0.5 rounded border ${BADGE_STYLE[a.badge]}`}>{a.badge}</span>}
                      <span className="text-xs text-orange-600 font-medium ml-auto">🔥{a.streak}j</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.zone} · {a.visites} visites · conv. {(a.conv * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">{a.positives} positives</span>
                  <span className="font-bold text-teal-700">{formatFcfa(a.collecte)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Voice to CRM */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Mic size={16} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold">Voice-to-CRM IA</div>
              <div className="text-xs text-indigo-200">Dictez votre CR après chaque visite · L'IA extrait les infos clés et met à jour la fiche automatiquement</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
              <Mic size={11} /> Dicter
            </button>
            <button className="text-xs bg-orange-500/80 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
              <WifiOff size={11} /> Mode Offline
            </button>
          </div>
        </div>
      </div>

      {/* ── Statistiques 7 jours ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Activité des 7 derniers jours</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={d.stats_7j} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v, n) => [n === 'collecte' ? formatFcfa(Number(v)) : `${Number(v)} visites`, n === 'collecte' ? 'Collecte' : 'Visites']} />
            <Bar dataKey="visites" fill="#14b8a6" radius={[3, 3, 0, 0]} name="Visites" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Ready to Revisit — Prospects à relancer ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-700">Ready to Revisit — Prospects tièdes IA</h3>
            <AiBadge variant="small" label="Scoring conversion" />
          </div>
          <span className="text-xs text-slate-400">{d.ready_to_revisit.length} à recontacter</span>
        </div>
        <div className="p-4 space-y-2">
          {d.ready_to_revisit.map((p, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${p.score_conversion >= 70 ? 'bg-green-100 text-green-700' : p.score_conversion >= 55 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                {p.score_conversion}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{p.nom}</span>
                  <span className="text-xs text-slate-400">{p.zone}</span>
                  <span className="text-xs text-orange-600 font-medium">+{p.jours_attente}j d'attente</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <AiBadge variant="inline" label="IA" />
                  <span className="text-xs text-slate-500">{p.ia_conseil}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <span className="text-[10px] text-slate-400">Dernière visite : {p.derniere_visite}</span>
                <button className={`text-xs text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors ${p.canal_suggere === 'Visite terrain' ? 'bg-orange-600 hover:bg-orange-700' : p.canal_suggere === 'Appel' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
                  {p.canal_suggere}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Détection GPS doublon — anti-collision agents ── */}
      <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-orange-50">
          <div className="flex items-center gap-2">
            <Navigation size={14} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-800">Détection GPS — Anti-collision agents terrain</h3>
            <AiBadge variant="small" label="Rayon 50m" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          {d.detection_gps_doublon.map((g, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <AlertTriangle size={14} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800">{g.adresse}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Visité par <span className="font-medium text-orange-700">{g.autre_agent}</span> le {g.date_visite} · Distance : <span className="font-bold text-orange-700">{g.distance_m}m</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <AiBadge variant="inline" label="IA" />
                  <span className="text-xs text-orange-700 font-medium">{g.action_ia}</span>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 px-1 pt-1">
            L'IA détecte automatiquement quand deux agents sont à moins de 50m du même prospect pour éviter les doublons de contact.
          </p>
        </div>
      </div>

    </div>
  )
}
