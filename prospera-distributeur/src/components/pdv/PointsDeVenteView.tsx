'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Store, Building2, MapPin, Sparkles, Search, Filter,
  TrendingUp, TrendingDown, AlertTriangle, Wallet, Users, Target,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { getPdvHub } from '@/lib/mock-distribution'
import { useHubContext } from '@/lib/use-hub-context'
import { useAuth } from '@/contexts/AuthContext'
import {
  buildPdvListeSyntheseDG, buildPdvReseauSyntheseIA, enrichPdvListeItem, PIPELINE_STYLE,
} from '@/lib/pdv-rapport-builder'
import { formatFcfa, scoreBg } from '@/lib/utils'
import type { PipelineStage, TypeMagasin } from '@/types'

const PAGE_SIZE = 24
const ROLES_TERRAIN = new Set(['COMMERCIAL', 'FREELANCE', 'PROSPECTION'])

export function PointsDeVenteView() {
  const ctx = useHubContext()
  const { user } = useAuth()
  const isTerrain = !!user?.role && ROLES_TERRAIN.has(user.role)
  const perimetreLabel = isTerrain
    ? 'Mon portefeuille'
    : user?.role === 'SUPERVISEUR' || user?.role === 'RESP_VENTES'
      ? 'Mes zones'
      : 'Vue DG'
  const { points, pipelineLabels } = getPdvHub(ctx)

  const [search, setSearch] = useState('')
  const [filtreZone, setFiltreZone] = useState<string>('toutes')
  const [filtreType, setFiltreType] = useState<'tous' | TypeMagasin>('tous')
  const [filtrePipeline, setFiltrePipeline] = useState<string>('tous')
  const [page, setPage] = useState(1)

  const enrichis = useMemo(() => points.map(enrichPdvListeItem), [points])
  const synthese = useMemo(() => buildPdvListeSyntheseDG(points), [points])
  const reseauIA = useMemo(() => buildPdvReseauSyntheseIA(points), [points])

  const zones = useMemo(() => [...new Set(points.map(p => p.zone))].sort(), [points])

  const filtered = useMemo(() => {
    return enrichis
      .filter(p => {
        if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) && !p.zone.toLowerCase().includes(search.toLowerCase())) return false
        if (filtreZone !== 'toutes' && p.zone !== filtreZone) return false
        if (filtreType !== 'tous' && p.type_magasin !== filtreType) return false
        if (filtrePipeline !== 'tous' && p.pipeline !== filtrePipeline) return false
        return true
      })
      .sort((a, b) => b.ca_mois - a.ca_mois)
  }, [enrichis, search, filtreZone, filtreType, filtrePipeline])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, pageSafe])

  const ALERTE_STYLE = {
    CRITIQUE: 'bg-red-50 border-red-200 text-red-800',
    HAUTE: 'bg-orange-50 border-orange-200 text-orange-800',
    MODEREE: 'bg-amber-50 border-amber-200 text-amber-800',
  }

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Réseau clients & magasins"
        subtitle={`${perimetreLabel} — pipeline commercial, scoring IA, créances, évolution produits · fiche rapport par point`}
        badge={`${synthese.total} points · échantillon réseau 1 847`}
      />

      {/* Bandeau KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'CA réseau', value: formatFcfa(synthese.ca_total_mois), icon: TrendingUp, color: 'text-amber-600' },
          { label: 'Magasins enseigne', value: String(synthese.magasins_enseigne), icon: Building2, color: 'text-violet-600' },
          { label: 'Partenaires B2B', value: String(synthese.partenaires), icon: Users, color: 'text-slate-600' },
          { label: 'Impayés total', value: formatFcfa(synthese.impayes_total), icon: Wallet, color: 'text-red-600' },
          { label: 'À risque', value: String(synthese.a_risque), icon: AlertTriangle, color: 'text-orange-600' },
          { label: 'Prospection', value: String(synthese.prospection), icon: Store, color: 'text-sky-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mb-1">
              <k.icon size={11} className={k.color} /> {k.label}
            </div>
            <div className={`text-lg font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Synthèse exécutive IA — réseau global */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {reseauIA.alertes.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2">
            {reseauIA.alertes.map((a, i) => (
              <div key={i} className={`text-[10px] px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 ${ALERTE_STYLE[a.severite]}`}>
                <AlertTriangle size={11} /> <strong>{a.titre}</strong> — {a.detail}
              </div>
            ))}
          </div>
        )}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">{isTerrain ? 'Synthèse IA — mon portefeuille' : 'Synthèse exécutive IA — réseau'}</span>
            <AiBadge variant="small" label={isTerrain ? 'Analyse portefeuille' : 'Analyse réseau'} confidence={88} />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{reseauIA.synthese_ia}</p>
        </div>
        {reseauIA.actions_prioritaires.length > 0 && (
          <div className="px-5 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Target size={13} className="text-amber-600" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Actions prioritaires réseau</span>
            </div>
            <ul className="space-y-1.5">
              {reseauIA.actions_prioritaires.map((action, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Répartition zones */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3">Répartition par zone</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setFiltreZone('toutes'); setPage(1) }}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${filtreZone === 'toutes' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            Toutes ({synthese.total})
          </button>
          {synthese.zones.map(z => (
            <button key={z.nom} type="button" onClick={() => { setFiltreZone(z.nom); setPage(1) }}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${filtreZone === z.nom ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {z.nom} · {z.count} · {formatFcfa(z.ca)}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher client, zone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={12} className="text-slate-400" />
          {(['tous', 'PROPRE', 'PARTENAIRE'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setFiltreType(t); setPage(1) }}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${filtreType === t ? (t === 'PROPRE' ? 'bg-violet-100 text-violet-700' : t === 'PARTENAIRE' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800') : 'bg-slate-50 text-slate-400'}`}>
              {t === 'tous' ? 'Tous types' : t === 'PROPRE' ? 'Enseigne' : 'Partenaires'}
            </button>
          ))}
        </div>
        <select
          value={filtrePipeline}
          onChange={e => { setFiltrePipeline(e.target.value); setPage(1) }}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600"
        >
          <option value="tous">Tous pipelines</option>
          {(Object.keys(PIPELINE_STYLE) as PipelineStage[]).map(p => (
            <option key={p} value={p}>{pipelineLabels[p]}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} résultat(s)
          {filtered.length > PAGE_SIZE && ` · page ${pageSafe}/${totalPages}`}
        </span>
      </div>

      {/* Grille fiches */}
      <div className="grid md:grid-cols-2 gap-4">
        {paginated.map(pdv => {
          const pipe = PIPELINE_STYLE[pdv.pipeline]
          const isPropre = pdv.type_magasin === 'PROPRE'
          return (
            <Link key={pdv.id} href={`/points-de-vente/${pdv.id}`}
              className={`group bg-white rounded-xl border-2 p-4 hover:shadow-md transition-all ${pdv.pipeline === 'A_RISQUE' ? 'border-red-200 hover:border-red-300' : isPropre ? 'border-violet-100 hover:border-violet-300' : 'border-slate-200 hover:border-amber-300'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isPropre ? 'bg-violet-100 text-violet-600' : 'bg-amber-50 text-amber-600'}`}>
                  {isPropre ? <Building2 size={20} /> : <Store size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">{pdv.nom}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isPropre ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                      {isPropre ? 'ENSEIGNE' : 'PARTENAIRE'}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${pipe.className}`}>{pipe.label}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin size={10} />{pdv.zone} · {pdv.entrepot_source}
                    {pdv.commercial !== '—' && <> · {pdv.commercial}</>}
                  </div>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${scoreBg(pdv.score_ia)}`}>
                  <Sparkles size={10} className="inline" /> {pdv.score_ia}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100">
                <div>
                  <div className="text-[9px] text-slate-400">CA mois</div>
                  <div className="text-xs font-black text-slate-800">{pdv.ca_mois > 0 ? formatFcfa(pdv.ca_mois) : '—'}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">Évolution</div>
                  <div className={`text-xs font-bold flex items-center gap-0.5 ${pdv.ca_evolution_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {pdv.ca_evolution_pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {pdv.ca_evolution_pct > 0 ? '+' : ''}{pdv.ca_evolution_pct}%
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">Commandes</div>
                  <div className="text-xs font-bold text-slate-700">{pdv.commandes_mois}/mois</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">Créance</div>
                  <div className={`text-xs font-bold ${pdv.creance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {pdv.creance > 0 ? formatFcfa(pdv.creance) : 'OK'}
                  </div>
                </div>
              </div>

              {(pdv.produits_rupture > 0 || pdv.creance_jours > 30 || pdv.jours_inactif > 21) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pdv.creance_jours > 30 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold flex items-center gap-1">
                      <AlertTriangle size={9} /> Impayé {pdv.creance_jours}j
                    </span>
                  )}
                  {pdv.produits_rupture > 0 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">
                      {pdv.produits_rupture} rupture(s) SKU
                    </span>
                  )}
                  {pdv.jours_inactif > 21 && pdv.ca_mois > 0 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                      Inactif {pdv.jours_inactif}j
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 text-[10px] text-amber-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                {isTerrain ? 'Ouvrir la fiche client →' : 'Ouvrir le rapport DG →'}
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-400">Aucun point de vente ne correspond aux filtres.</div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 py-2">
          <button
            type="button"
            disabled={pageSafe <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft size={14} /> Précédent
          </button>
          <span className="text-xs text-slate-500">
            {(pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, filtered.length)} sur {filtered.length}
          </span>
          <button
            type="button"
            disabled={pageSafe >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
          >
            Suivant <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pt-2">
        <AiBadge variant="small" label="Scoring IA temps réel" />
        <span className="text-[10px] text-slate-400">Cliquez sur une fiche pour le rapport détaillé DG</span>
      </div>
    </div>
  )
}
