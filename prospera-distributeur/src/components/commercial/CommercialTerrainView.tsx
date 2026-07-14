'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  MapPin, Users, Target, TrendingUp, AlertTriangle, Sparkles,
  Navigation, CheckCircle2, XCircle, BarChart3, Wallet,
  Search, ChevronDown, ChevronUp, Medal,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa, scoreBg } from '@/lib/utils'
import {
  buildCommerciauxTerrainDG, buildVisitesPdvCarteStable, buildSyntheseTerrainDG,
  buildAnalysesTerrainIA, getCommercialClassement,
  type CommercialTerrainDG,
} from '@/lib/commercial-terrain-dg-builder'

const CarteCommercialDG = dynamic(() => import('@/components/commercial/CarteCommercialDG'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[420px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
      Chargement carte terrain…
    </div>
  ),
})

const STATUT_STYLE = {
  EN_TOURNEE: { label: 'En tournée', className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20' },
  BUREAU: { label: 'Bureau', className: 'bg-slate-500/10 text-slate-600 ring-slate-500/20' },
  PAUSE: { label: 'Pause', className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20' },
  ALERTE_GPS: { label: 'Alerte GPS', className: 'bg-red-500/10 text-red-700 ring-red-500/20' },
}

const ANALYSE_ACCENT = {
  CRITIQUE: 'border-l-red-500 bg-gradient-to-r from-red-50/80 to-white',
  HAUTE: 'border-l-orange-500 bg-gradient-to-r from-orange-50/80 to-white',
  MODEREE: 'border-l-sky-500 bg-gradient-to-r from-sky-50/80 to-white',
}

const TOP_N = 5
const TEAM_PREVIEW = 8

function avatarColor(c: CommercialTerrainDG): string {
  if (c.position.statut === 'ALERTE_GPS') return '#ef4444'
  if (c.type === 'FREELANCE') return '#65a30d'
  return '#0d9488'
}

function CommercialRow({ c, selected, onClick }: {
  c: CommercialTerrainDG
  selected: boolean
  onClick: () => void
}) {
  const st = STATUT_STYLE[c.position.statut]
  const visitesPct = Math.min(100, Math.round((c.visites_jour / Math.max(1, c.visites_objectif)) * 100))
  const couverturePct = c.couverture_secteur_pct

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all border-b border-slate-100 last:border-0 hover:bg-slate-50/80 ${selected ? 'bg-amber-50/90 ring-1 ring-inset ring-amber-200' : ''}`}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-sm"
        style={{ backgroundColor: avatarColor(c) }}
      >
        {c.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-sm text-slate-900 truncate">{c.nom}</span>
            {c.type === 'FREELANCE' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-lime-100 text-lime-800 font-bold">FL</span>
            )}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ring-1 ring-inset ${st.className}`}>{st.label}</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">{c.zone}</div>
        </div>
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 self-start ${scoreBg(c.score_ia)}`}>{c.score_ia}</div>

        <div className="col-span-2 grid grid-cols-2 gap-3 mt-0.5">
          <div>
            <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
              <span>Visites</span>
              <span className={visitesPct >= 100 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{c.visites_jour}/{c.visites_objectif}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${visitesPct >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${visitesPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
              <span>Couverture</span>
              <span className={couverturePct >= 85 ? 'text-emerald-600 font-semibold' : couverturePct >= 70 ? 'text-amber-600 font-semibold' : 'text-red-600 font-semibold'}>{couverturePct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${couverturePct >= 85 ? 'bg-emerald-500' : couverturePct >= 70 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${couverturePct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:block text-right shrink-0 w-24">
        <div className="text-[10px] text-slate-400">CA jour</div>
        <div className="text-xs font-bold text-slate-800">{formatFcfa(c.ca_jour)}</div>
      </div>
    </button>
  )
}

function RankRow({ rank, nom, value, highlight }: { rank: number; nom: string; value: string; highlight?: string }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  return (
    <div className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
      <span className="w-6 text-center text-xs font-bold text-slate-400">{medal ?? rank}</span>
      <span className="flex-1 text-xs text-slate-700 truncate">{nom}</span>
      <span className={`text-xs font-bold ${highlight ?? 'text-slate-800'}`}>{value}</span>
    </div>
  )
}

export function CommercialTerrainView() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusCarte, setFocusCarte] = useState<'lome' | 'nord'>('lome')
  const [showTour, setShowTour] = useState(true)
  const [teamSearch, setTeamSearch] = useState('')
  const [teamExpanded, setTeamExpanded] = useState(false)
  const [teamFilter, setTeamFilter] = useState<'tous' | 'alerte' | 'freelance'>('tous')

  const commerciaux = useMemo(() => buildCommerciauxTerrainDG(), [])
  const visites = useMemo(() => buildVisitesPdvCarteStable(), [])
  const synthese = useMemo(() => buildSyntheseTerrainDG(commerciaux), [commerciaux])
  const analyses = useMemo(() => buildAnalysesTerrainIA(commerciaux), [commerciaux])
  const classement = useMemo(() => getCommercialClassement(commerciaux), [commerciaux])

  const selected = commerciaux.find(c => c.id === selectedId) ?? null
  const visitesJour = visites.filter(v => v.visite_aujourdhui).length
  const visitesTotal = visites.length
  const couvertureVisitesPct = visitesTotal > 0 ? Math.round((visitesJour / visitesTotal) * 100) : 0

  const teamFiltered = useMemo(() => {
    return commerciaux
      .filter(c => {
        if (teamSearch && !c.nom.toLowerCase().includes(teamSearch.toLowerCase()) && !c.zone.toLowerCase().includes(teamSearch.toLowerCase())) return false
        if (teamFilter === 'alerte' && !c.alerte && c.score_ia >= 75) return false
        if (teamFilter === 'freelance' && c.type !== 'FREELANCE') return false
        return true
      })
      .sort((a, b) => b.score_ia - a.score_ia)
  }, [commerciaux, teamSearch, teamFilter])

  const teamVisible = teamExpanded ? teamFiltered : teamFiltered.slice(0, TEAM_PREVIEW)

  const kpis = [
    { label: 'Équipes', value: String(synthese.equipes_actives), icon: Users, color: 'text-slate-800' },
    { label: 'Visites jour', value: `${synthese.visites_jour}/${synthese.visites_objectif}`, sub: `${synthese.taux_visites_pct}% objectif`, color: synthese.taux_visites_pct >= 100 ? 'text-emerald-600' : 'text-amber-600', icon: Target },
    { label: 'CA terrain', value: formatFcfa(synthese.ca_jour_total), icon: TrendingUp, color: 'text-slate-800' },
    { label: 'Couverture', value: `${synthese.couverture_moyenne_pct}%`, color: synthese.couverture_moyenne_pct >= 85 ? 'text-emerald-600' : 'text-orange-600', icon: Navigation },
    { label: 'Impayés', value: String(synthese.impayes_a_relancer), color: 'text-red-600', icon: Wallet },
    { label: 'Alertes GPS', value: String(synthese.alertes_gps), color: synthese.alertes_gps > 0 ? 'text-red-600' : 'text-emerald-600', icon: BarChart3 },
  ]

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <PageHeader
        title="Pilotage commercial terrain"
        subtitle="Équipes en tournée, couverture secteurs et relances impayés"
        badge="Temps réel"
      />

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-2">
              {k.icon && <k.icon size={12} className="opacity-70" />}
              {k.label}
            </div>
            <div className={`text-xl font-black tracking-tight ${k.color}`}>{k.value}</div>
            {k.sub && <div className={`text-[10px] mt-0.5 font-medium ${k.color}`}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Carte + panneau latéral */}
      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <MapPin size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Carte terrain</h3>
                <p className="text-[10px] text-slate-500">Positions live & visites du jour</p>
              </div>
              <AiBadge variant="small" label="Live" pulse />
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(['lome', 'nord'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFocusCarte(f)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all ${focusCarte === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {f === 'lome' ? 'Grand Lomé' : 'Kara & Centrale'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowTour(v => !v)}
                className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all ${showTour ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Itinéraire
              </button>
            </div>
          </div>

          <div className="px-5 py-2 flex flex-wrap gap-4 text-[10px] text-slate-500 border-b border-slate-50">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Commercial</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-400" /> Visité</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Priorité</span>
          </div>

          <div className="flex-1 min-h-[420px] p-4 pt-2">
            <div className="h-full min-h-[400px] rounded-xl overflow-hidden ring-1 ring-slate-200/60">
              <CarteCommercialDG
                commerciaux={commerciaux}
                visites={visites}
                selectedId={selectedId}
                onSelect={setSelectedId}
                focus={focusCarte}
                showTour={showTour}
              />
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-100 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">Progression visites du jour</span>
                <span className="font-bold text-slate-800">{visitesJour}/{visitesTotal} PDV · {couvertureVisitesPct}%</span>
              </div>
              <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${couvertureVisitesPct}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-500" /> {visitesJour} visités</span>
              <span className="flex items-center gap-1.5"><XCircle size={13} className="text-slate-400" /> {visitesTotal - visitesJour} restants</span>
              <span className="flex items-center gap-1.5"><Medal size={13} className="text-amber-500" /> Top : {classement.top_performer.nom} ({classement.top_performer.score_ia})</span>
            </div>
          </div>
        </div>

        {/* Panneau IA */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex-1 flex flex-col min-h-[280px] max-h-[520px]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
              <Sparkles size={16} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Analyses IA</h3>
              <span className="ml-auto text-[10px] text-slate-400">{analyses.length} alerte(s)</span>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto flex-1">
              {analyses.map((a, i) => (
                <div key={i} className={`pl-3 pr-3 py-3 rounded-xl border border-slate-100 border-l-[3px] ${ANALYSE_ACCENT[a.severite]}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 leading-snug">{a.titre}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${a.severite === 'CRITIQUE' ? 'bg-red-100 text-red-700' : a.severite === 'HAUTE' ? 'bg-orange-100 text-orange-700' : 'bg-sky-100 text-sky-700'}`}>
                      {a.severite}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{a.detail}</p>
                  <p className="text-[10px] font-semibold text-slate-800 bg-white/60 rounded-lg px-2 py-1.5 border border-slate-100">
                    → {a.action}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {classement.a_coacher.length > 0 && (
            <div className="bg-white rounded-2xl border border-orange-200/80 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex items-center gap-2">
                <AlertTriangle size={15} className="text-orange-600" />
                <h3 className="text-sm font-bold text-orange-900">Coaching prioritaire</h3>
                <span className="ml-auto text-[10px] font-semibold text-orange-700 bg-white/80 px-2 py-0.5 rounded-full">
                  {classement.a_coacher.length} VRP
                </span>
              </div>
              <div className="divide-y divide-orange-50">
                {classement.a_coacher.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id)
                      setFocusCarte(c.zone.includes('Kara') || c.zone.includes('Centrale') ? 'nord' : 'lome')
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50/50 transition-colors flex gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                      style={{ backgroundColor: avatarColor(c) }}
                    >
                      {c.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{c.nom}</span>
                        <span className={`text-[10px] font-bold ${c.couverture_secteur_pct < 72 ? 'text-red-600' : 'text-amber-600'}`}>{c.couverture_secteur_pct}%</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{c.action_ia}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fiche sélectionnée */}
      {selected && (
        <div className="bg-gradient-to-br from-amber-50/50 via-white to-white rounded-2xl border border-amber-200/60 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-md" style={{ backgroundColor: avatarColor(selected) }}>
                {selected.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{selected.nom}</h3>
                <p className="text-sm text-slate-500">{selected.zone} · {selected.pdv_portefeuille} PDV · GPS {selected.gps_conformite_pct}%</p>
              </div>
            </div>
            <AiBadge variant="small" label="Synthèse IA" confidence={selected.score_ia} />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed mb-4 max-w-3xl">{selected.synthese_ia}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
            {[
              { label: 'CA mois', value: formatFcfa(selected.ca_mois) },
              { label: 'Évolution', value: `${selected.evolution_mois_pct > 0 ? '+' : ''}${selected.evolution_mois_pct}%`, color: selected.evolution_mois_pct >= 0 ? 'text-emerald-600' : 'text-red-600' },
              { label: 'Impayés', value: String(selected.impayes_a_relancer), color: 'text-red-600' },
              { label: 'Prospects', value: String(selected.prospects_actifs) },
              ...(selected.marge_jour ? [{ label: 'Marge jour', value: formatFcfa(selected.marge_jour), color: 'text-lime-700' }] : []),
            ].map(item => (
              <div key={item.label} className="bg-white/80 rounded-xl p-3 border border-slate-100">
                <div className="text-slate-400 text-[10px]">{item.label}</div>
                <div className={`font-bold ${item.color ?? 'text-slate-800'}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Équipes + classements */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900">Équipes commerciales</h3>
            <div className="relative flex-1 min-w-[140px] max-w-xs ml-auto">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher…"
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>
          <div className="px-4 py-2 flex gap-1.5 border-b border-slate-50">
            {(['tous', 'alerte', 'freelance'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setTeamFilter(f)}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold ${teamFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {f === 'tous' ? 'Tous' : f === 'alerte' ? 'À coacher' : 'Freelances'}
              </button>
            ))}
            <span className="text-[10px] text-slate-400 self-center ml-auto">{teamFiltered.length} VRP</span>
          </div>
          <div>
            {teamVisible.map(c => (
              <CommercialRow
                key={c.id}
                c={c}
                selected={selectedId === c.id}
                onClick={() => {
                  setSelectedId(prev => prev === c.id ? null : c.id)
                  setFocusCarte(c.zone.includes('Kara') || c.zone.includes('Centrale') ? 'nord' : 'lome')
                }}
              />
            ))}
          </div>
          {teamFiltered.length > TEAM_PREVIEW && (
            <button
              type="button"
              onClick={() => setTeamExpanded(v => !v)}
              className="w-full py-3 text-xs font-semibold text-amber-700 hover:bg-amber-50/50 border-t border-slate-100 flex items-center justify-center gap-1"
            >
              {teamExpanded ? <><ChevronUp size={14} /> Réduire</> : <><ChevronDown size={14} /> Voir les {teamFiltered.length - TEAM_PREVIEW} autres VRP</>}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {[
            { title: 'Top CA jour', rows: classement.par_ca.slice(0, TOP_N), fmt: (c: CommercialTerrainDG) => formatFcfa(c.ca_jour) },
            { title: 'Top couverture', rows: classement.par_couverture.slice(0, TOP_N), fmt: (c: CommercialTerrainDG) => `${c.couverture_secteur_pct}%`, hl: 'text-emerald-600' },
            { title: 'Top score IA', rows: classement.par_score.slice(0, TOP_N), fmt: (c: CommercialTerrainDG) => String(c.score_ia), hl: 'text-indigo-600' },
          ].map(block => (
            <div key={block.title} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">{block.title}</h4>
              {block.rows.map((c, i) => (
                <RankRow key={c.id} rank={i + 1} nom={c.nom} value={block.fmt(c)} highlight={block.hl} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
