'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  Bell, MessageCircle, Phone, MapPin, Sparkles, Zap, Clock,
  AlertTriangle, ChevronRight, Bot, Mail, Search,
  Send, Wallet, HandCoins, ShieldAlert, Lock, Unlock, History as HistoryIcon,
  Route as RouteIcon, Navigation,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useRecouvrementWorkflow } from '@distributeur/contexts/RecouvrementWorkflowContext'
import { getRelancesHub } from '@distributeur/lib/mock-distribution'
import { useHubContext } from '@distributeur/lib/use-hub-context'
import { getPdvById } from '@distributeur/lib/registries/pdv-registry'
import { EVENEMENT_LABEL, type CanalRelance, type EvenementRecouvrementType } from '@distributeur/lib/recouvrement-workflow'
import { formatFcfa } from '@distributeur/lib/utils'
import { optimiserItineraire, lienNavigationMulti, formatDuree } from '@distributeur/lib/itineraire-builder'
import type { CarteMarker } from '@distributeur/components/shared/CartePerimetreTerrain'

const CarteDebiteurs = dynamic(() => import('@distributeur/components/shared/CartePerimetreTerrain'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[300px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
      Chargement de la carte débiteurs…
    </div>
  ),
})
import {
  buildRelancesDG, buildPipelineColonnes, buildSyntheseRelancesDG,
  buildAnalysesRelancesIA, filterRelancesType, getReglesAutomation,
  getRelancesAgingBuckets, getRelancesParZone,
  TYPE_RELANCES_LABEL, PRIORITE_STYLE, CANAL_LABEL,
  type RelanceDG, type VuePipelineDG,
} from '@distributeur/lib/relances-dg-builder'

const CANAL_ICON: Record<string, typeof MessageCircle> = {
  WHATSAPP: MessageCircle,
  SMS: Phone,
  VISITE: MapPin,
  APPEL: Phone,
  EMAIL: Mail,
}

const VUE_TABS: { id: VuePipelineDG; label: string }[] = [
  { id: 'impayes', label: 'Recouvrement impayés' },
  { id: 'reappro', label: 'Réapprovisionnement' },
  { id: 'prospection', label: 'Prospection' },
  { id: 'tous', label: 'Tous les flux' },
]

const ANALYSE_ACCENT = {
  CRITIQUE: 'border-l-red-500 bg-red-50/80',
  HAUTE: 'border-l-orange-500 bg-orange-50/80',
  MODEREE: 'border-l-sky-500 bg-sky-50/80',
}

const COL_WIDTH = 280
const MAX_CARDS_COL = 10

function PipelineCard({ r, selected, onClick }: { r: RelanceDG; selected: boolean; onClick: () => void }) {
  const Icon = CANAL_ICON[r.canal] ?? Bell
  const prio = r.priorite ? PRIORITE_STYLE[r.priorite] : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all hover:shadow-md ${selected ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200/60' : 'border-slate-200 bg-white hover:border-slate-300'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-[13px] text-slate-900 leading-snug">{r.pdv_nom}</span>
        {r.automate && <Bot size={12} className="text-indigo-500 shrink-0" aria-label="Automatisé" />}
      </div>
      {r.zone && (
        <div className="text-[11px] text-slate-500 mt-0.5 truncate">{r.zone}</div>
      )}
      {r.montant != null && r.montant > 0 && (
        <div className={`text-sm font-black mt-1.5 ${r.priorite === 'CRITIQUE' ? 'text-red-600' : 'text-slate-800'}`}>
          {formatFcfa(r.montant)}
        </div>
      )}
      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <Icon size={12} className="shrink-0" />
          {r.jours_retard ? (
            <span className="text-red-600 font-bold">Retard J+{r.jours_retard}</span>
          ) : (
            CANAL_LABEL[r.canal]
          )}
        </span>
        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
          IA {r.score_succes}%
        </span>
      </div>
      {prio && (r.priorite === 'CRITIQUE' || r.priorite === 'HAUTE') && (
        <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${prio.className}`}>
          {prio.label}
        </span>
      )}
    </button>
  )
}

export function RelancesView() {
  const ctx = useHubContext()
  const { relances: raw } = getRelancesHub(ctx)

  const [vue, setVue] = useState<VuePipelineDG>('impayes')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filtreZone, setFiltreZone] = useState<string>('toutes')
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set())
  const [masquerVides, setMasquerVides] = useState(true)

  const all = useMemo(() => buildRelancesDG(raw), [raw])
  const filteredBase = useMemo(() => filterRelancesType(all, vue), [all, vue])
  const filtered = useMemo(() => {
    return filteredBase.filter(r => {
      if (filtreZone !== 'toutes' && r.zone !== filtreZone) return false
      if (search && !r.pdv_nom.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [filteredBase, filtreZone, search])

  const colonnes = useMemo(() => buildPipelineColonnes(filtered), [filtered])
  const synthese = useMemo(() => buildSyntheseRelancesDG(filtered), [filtered])
  const analyses = useMemo(() => buildAnalysesRelancesIA(all), [all])
  const regles = useMemo(() => getReglesAutomation(), [])
  const aging = useMemo(() => getRelancesAgingBuckets(filteredBase), [filteredBase])
  const parZone = useMemo(() => getRelancesParZone(filteredBase), [filteredBase])

  const selected = all.find(r => r.id === selectedId) ?? null
  const agingMax = Math.max(1, ...aging.map(a => a.count))

  // Débiteurs géolocalisés (jointure PDV pour lat/lng) — taille ∝ montant, couleur ∝ priorité.
  const carteDebiteurs = useMemo<CarteMarker[]>(() => {
    if (vue !== 'impayes') return []
    const montants = filtered.map(r => r.montant ?? 0)
    const maxMontant = Math.max(1, ...montants)
    return filtered
      .filter(r => (r.montant ?? 0) > 0 && r.pdv_id)
      .map(r => {
        const pdv = r.pdv_id ? getPdvById(r.pdv_id) : undefined
        if (!pdv || !Number.isFinite(pdv.lat) || !Number.isFinite(pdv.lng)) return null
        const couleur = r.priorite === 'CRITIQUE' ? '#dc2626'
          : r.priorite === 'HAUTE' ? '#f97316'
          : '#64748b'
        return {
          id: r.id,
          lat: pdv.lat,
          lng: pdv.lng,
          nom: r.pdv_nom,
          couleur,
          rayon: 6 + Math.round(((r.montant ?? 0) / maxMontant) * 10),
          sousTitre: `${formatFcfa(r.montant ?? 0)} F${r.jours_retard ? ` · retard J+${r.jours_retard}` : ''}`,
          badge: r.zone,
        } as CarteMarker
      })
      .filter((m): m is CarteMarker => m !== null)
  }, [vue, filtered])

  // Tournée de recouvrement optimisée — les plus gros débiteurs, dans le trajet le plus court.
  const tourneeRecouvrement = useMemo(() => {
    const stops = [...carteDebiteurs]
      .sort((a, b) => (b.rayon ?? 0) - (a.rayon ?? 0))
      .slice(0, 9)
      .map(m => ({ id: m.id, lat: m.lat, lng: m.lng, nom: m.nom }))
    return optimiserItineraire(stops)
  }, [carteDebiteurs])

  function lancerTourneeRecouvrement() {
    const lien = lienNavigationMulti(tourneeRecouvrement.ordre)
    if (lien && typeof window !== 'undefined') window.open(lien, '_blank', 'noopener')
  }

  const colonnesVisibles = useMemo(() => {
    if (!masquerVides) return colonnes
    return colonnes.filter(c => c.relances.length > 0)
  }, [colonnes, masquerVides])

  const toggleColExpand = (etape: string) => {
    setExpandedCols(prev => {
      const next = new Set(prev)
      if (next.has(etape)) next.delete(etape)
      else next.add(etape)
      return next
    })
  }

  return (
    <div className="p-6 max-w-[100rem] space-y-4 min-h-screen flex flex-col">
      <PageHeader
        title="Pipeline relances & recouvrement"
        subtitle="Automation multi-canal · impayés · réappro · prospection"
        badge={`${synthese.en_cours} en cours · ${filtered.length} dossiers`}
      />

      {/* KPIs compacts */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { label: 'En cours', value: String(synthese.en_cours), color: 'text-amber-700' },
          { label: 'Montant en jeu', value: formatFcfa(synthese.montant_en_jeu), color: 'text-red-600' },
          { label: 'Résolues', value: String(synthese.resolues), color: 'text-emerald-600' },
          { label: 'Contentieux', value: String(synthese.contentieux), color: 'text-red-700' },
          { label: 'Recouvré mois', value: formatFcfa(synthese.montant_recouvre_mois), color: 'text-emerald-600' },
          { label: 'Taux réponse', value: `${synthese.taux_reponse_pct}%`, color: 'text-sky-600' },
          { label: 'Auto / jour', value: String(synthese.relances_auto_jour), color: 'text-indigo-600' },
          { label: 'Visites plan.', value: String(synthese.visites_planifiees), color: 'text-orange-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 px-3 py-2.5 shadow-sm">
            <div className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">{k.label}</div>
            <div className={`text-sm font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Règles automation — une ligne */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {regles.map((reg, i) => (
          <div key={i} className="shrink-0 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-[10px]">
            <Zap size={11} className="text-indigo-600 shrink-0" />
            <span className="font-bold text-indigo-900">{reg.declencheur}</span>
            <ChevronRight size={10} className="text-indigo-400" />
            <span className="text-slate-600">{reg.action} · {reg.delai}</span>
          </div>
        ))}
      </div>

      {/* Tabs + filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
          {VUE_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setVue(t.id); setSelectedId(null) }}
              className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all ${vue === t.id ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setFiltreZone('toutes')}
            className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${filtreZone === 'toutes' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            Toutes zones
          </button>
          {parZone.slice(0, 4).map(z => (
            <button
              key={z.zone}
              type="button"
              onClick={() => setFiltreZone(z.zone === filtreZone ? 'toutes' : z.zone)}
              className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${filtreZone === z.zone ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}
            >
              {z.zone} ({z.count})
            </button>
          ))}
        </div>
      </div>

      {/* Corps principal */}
      <div className="space-y-4 flex-1">
        {vue === 'impayes' && carteDebiteurs.length > 0 && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
              <MapPin size={14} className="text-red-600" />
              <span className="text-xs font-semibold text-slate-700">Débiteurs géolocalisés</span>
              <span className="ml-auto flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600" /> Critique</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Haute</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500" /> Normale</span>
                <span className="text-slate-400">· taille ∝ montant · clic → dossier</span>
              </span>
            </div>
            {tourneeRecouvrement.ordre.length >= 2 && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                <RouteIcon size={14} className="text-red-600 shrink-0" />
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold text-slate-700">Tournée de recouvrement</span> —{' '}
                  {tourneeRecouvrement.ordre.length} débiteurs · {tourneeRecouvrement.distance_km} km ·{' '}
                  {formatDuree(tourneeRecouvrement.duree_min)}
                  <span className="text-slate-400"> (trajet le plus court, plus gros montants d&apos;abord)</span>
                </div>
                <button
                  type="button"
                  onClick={lancerTourneeRecouvrement}
                  className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Navigation size={12} /> Lancer la tournée
                </button>
              </div>
            )}
            <div className="h-[340px]">
              <CarteDebiteurs
                markers={carteDebiteurs}
                routes={tourneeRecouvrement.ordre.length >= 2
                  ? [{ points: tourneeRecouvrement.ordre.map(s => ({ lat: s.lat, lng: s.lng })), couleur: '#dc2626' }]
                  : []}
                selectedId={selectedId}
                onSelect={id => setSelectedId(id)}
              />
            </div>
          </div>
        )}

        {/* Kanban pleine largeur — scroll horizontal */}
        <div className="bg-slate-100/60 rounded-2xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3 mb-3 px-1">
            <p className="text-xs text-slate-500">
              ← Faites défiler pour voir toutes les étapes du pipeline →
            </p>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={masquerVides}
                onChange={e => setMasquerVides(e.target.checked)}
                className="rounded border-slate-300"
              />
              Masquer colonnes vides
            </label>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {colonnesVisibles.map(col => {
              const expanded = expandedCols.has(col.etape)
              const cards = expanded ? col.relances : col.relances.slice(0, MAX_CARDS_COL)
              const reste = col.relances.length - cards.length

              return (
                <div
                  key={col.etape}
                  style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                  className={`snap-start rounded-xl border-2 ${col.couleur} flex flex-col max-h-[520px] shrink-0 shadow-sm`}
                >
                  <div className="px-3 py-3 border-b border-black/5 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase text-slate-800 tracking-wide">{col.label}</span>
                      <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full shadow-sm">
                        {col.relances.length}
                      </span>
                    </div>
                    {col.montant_total > 0 && (
                      <div className="text-xs text-slate-600 font-semibold mt-1">
                        {formatFcfa(col.montant_total)} en jeu
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
                    {col.relances.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-10">Aucun dossier</div>
                    ) : (
                      <>
                        {cards.map(r => (
                          <PipelineCard
                            key={r.id}
                            r={r}
                            selected={selectedId === r.id}
                            onClick={() => setSelectedId(prev => prev === r.id ? null : r.id)}
                          />
                        ))}
                        {reste > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleColExpand(col.etape)}
                            className="w-full py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-lg border border-dashed border-amber-200"
                          >
                            + {reste} autre{reste > 1 ? 's' : ''} dossier{reste > 1 ? 's' : ''}
                          </button>
                        )}
                        {expanded && col.relances.length > MAX_CARDS_COL && (
                          <button
                            type="button"
                            onClick={() => toggleColExpand(col.etape)}
                            className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700"
                          >
                            Réduire
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats + analyses IA */}
        <div className="space-y-4">
          <div className={`grid gap-4 ${vue === 'impayes' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {vue === 'impayes' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-bold text-slate-500 uppercase mb-3">Vieillissement impayés</div>
                <div className="grid grid-cols-4 gap-3">
                  {aging.map(a => (
                    <div key={a.label}>
                      <div className="text-xl font-black text-slate-800">{a.count}</div>
                      <div className="text-[11px] text-slate-500 mb-1.5">{a.label}</div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${a.color}`} style={{ width: `${(a.count / agingMax) * 100}%` }} />
                      </div>
                      {a.volume > 0 && (
                        <div className="text-[10px] text-slate-400 mt-1">{formatFcfa(a.volume)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-bold text-slate-500 uppercase mb-3">Répartition par zone</div>
              <div className="space-y-2">
                {parZone.slice(0, 6).map(z => (
                  <div key={z.zone} className="flex items-center gap-3 text-xs">
                    <span className="w-28 truncate text-slate-700 font-medium">{z.zone}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${parZone[0] ? (z.count / parZone[0].count) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold text-slate-800">{z.count}</span>
                    {z.critiques > 0 && (
                      <span className="text-[10px] text-red-600 font-bold whitespace-nowrap">{z.critiques} crit.</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-indigo-200 shadow-sm">
            <div className="px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Analyses IA recouvrement</h3>
            </div>
            <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analyses.map((a, i) => (
                <div key={i} className={`pl-3 pr-3 py-3 rounded-xl border border-slate-100 border-l-[3px] ${ANALYSE_ACCENT[a.severite]}`}>
                  <div className="font-bold text-slate-900 text-sm">{a.titre}</div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">{a.detail}</div>
                  <div className="text-xs font-semibold text-slate-800 mt-2">→ {a.action}</div>
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <DetailRelance selected={selected} onClose={() => setSelectedId(null)} />
          )}
        </div>
      </div>
    </div>
  )
}

const CANAUX_RELANCE: { value: CanalRelance; label: string; Icon: typeof MessageCircle }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp', Icon: MessageCircle },
  { value: 'SMS', label: 'SMS', Icon: Phone },
  { value: 'APPEL', label: 'Appel', Icon: Phone },
  { value: 'EMAIL', label: 'Email', Icon: Mail },
  { value: 'VISITE', label: 'Visite', Icon: MapPin },
]

type FormActive = 'RELANCE' | 'PAIEMENT' | 'PROMESSE' | null

function DetailRelance({ selected, onClose }: { selected: RelanceDG; onClose: () => void }) {
  const { user } = useAuth()
  const { etat, ajouterEvenement, annulerDernier, lastAction, clearLastAction } = useRecouvrementWorkflow()
  const { events, creditBloque } = etat(selected.id)

  const [form, setForm] = useState<FormActive>(null)
  const [canal, setCanal] = useState<CanalRelance>(selected.canal as CanalRelance ?? 'WHATSAPP')
  const [montant, setMontant] = useState('')
  const [echeance, setEcheance] = useState('')
  const [note, setNote] = useState('')

  const auteur = user?.nom ?? 'Recouvrement'

  function reset() {
    setForm(null); setMontant(''); setEcheance(''); setNote('')
  }

  function envoyerRelance() {
    ajouterEvenement(selected.id, 'RELANCE', auteur, { canal, note: note.trim() || undefined })
    reset()
  }
  function enregistrerPaiement() {
    if (!montant) return
    ajouterEvenement(selected.id, 'PAIEMENT', auteur, { montant: Number(montant), note: note.trim() || undefined })
    reset()
  }
  function enregistrerPromesse() {
    if (!echeance) return
    ajouterEvenement(selected.id, 'PROMESSE', auteur, {
      echeance, montant: montant ? Number(montant) : undefined, note: note.trim() || undefined,
    })
    reset()
  }
  function escalader() {
    ajouterEvenement(selected.id, 'ESCALADE', auteur)
  }
  function toggleCredit() {
    ajouterEvenement(selected.id, creditBloque ? 'DEBLOCAGE_CREDIT' : 'BLOCAGE_CREDIT', auteur)
  }

  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <Bell size={22} className="text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-black text-slate-900">{selected.pdv_nom}</h3>
            {creditBloque && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                <Lock size={10} /> Crédit bloqué
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {TYPE_RELANCES_LABEL[selected.type]} · {selected.zone}
            {selected.commercial && selected.commercial !== '—' && ` · ${selected.commercial}`}
          </p>
        </div>
        <AiBadge variant="small" label="Succès IA" confidence={selected.score_succes} />
      </div>
      {selected.synthese_ia && (
        <p className="text-sm text-slate-700 leading-relaxed mb-4">{selected.synthese_ia}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-4">
        {[
          { l: 'Montant', v: selected.montant ? formatFcfa(selected.montant) : '—' },
          { l: 'Retard', v: selected.jours_retard ? `J+${selected.jours_retard}` : '—', r: (selected.jours_retard ?? 0) > 30 },
          { l: 'Canal', v: CANAL_LABEL[selected.canal] },
          { l: 'Tentatives', v: String((selected.nb_tentatives ?? 0) + events.filter(e => e.type === 'RELANCE').length) },
        ].map(item => (
          <div key={item.l} className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400">{item.l}</div>
            <div className={`font-bold ${item.r ? 'text-red-600' : 'text-slate-800'}`}>{item.v}</div>
          </div>
        ))}
      </div>
      {selected.prochaine_action && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm mb-3">
          <Clock size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <span><strong>{selected.prochaine_action_date}</strong> — {selected.prochaine_action}</span>
        </div>
      )}
      {selected.priorite === 'CRITIQUE' && (
        <p className="text-sm text-red-700 font-medium flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
          <AlertTriangle size={14} /> Dossier critique — validation DG requise avant nouvelle livraison crédit.
        </p>
      )}

      {/* Journal des relances déjà réalisées (registre) */}
      {selected.historique && selected.historique.length > 0 && (
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <HistoryIcon size={13} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Journal des relances ({selected.historique.length})
            </span>
          </div>
          <ul className="space-y-1.5">
            {selected.historique.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-700">{h.date}</span>
                  <span className="text-slate-600"> · {h.action}</span>
                  {h.canal && <span className="text-slate-400"> · {CANAL_LABEL[h.canal] ?? h.canal}</span>}
                  <div className="text-[10px] text-slate-400">{h.auteur}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions métier */}
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={() => setForm(form === 'RELANCE' ? null : 'RELANCE')} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Send size={13} /> Envoyer relance
        </button>
        <button type="button" onClick={() => setForm(form === 'PAIEMENT' ? null : 'PAIEMENT')} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
          <Wallet size={13} /> Enregistrer paiement
        </button>
        <button type="button" onClick={() => setForm(form === 'PROMESSE' ? null : 'PROMESSE')} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
          <HandCoins size={13} /> Promesse
        </button>
        <button type="button" onClick={escalader} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50">
          <ShieldAlert size={13} /> Escalader
        </button>
        <button type="button" onClick={toggleCredit} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border ${creditBloque ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
          {creditBloque ? <><Unlock size={13} /> Débloquer crédit</> : <><Lock size={13} /> Bloquer crédit</>}
        </button>
      </div>

      {form === 'RELANCE' && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {CANAUX_RELANCE.map(c => (
              <button key={c.value} type="button" onClick={() => setCanal(c.value)} className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${canal === c.value ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}>
                <c.Icon size={11} /> {c.label}
              </button>
            ))}
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Message / note (facultatif)…" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
          <button type="button" onClick={envoyerRelance} className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">Envoyer la relance {CANAL_LABEL[canal]}</button>
        </div>
      )}

      {form === 'PAIEMENT' && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="relative">
            <input type="number" inputMode="numeric" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Montant encaissé" className="w-full pr-8 pl-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">F</span>
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Référence Mobile Money / note…" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          <button type="button" onClick={enregistrerPaiement} disabled={!montant} className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400">Enregistrer le paiement</button>
        </div>
      )}

      {form === 'PROMESSE' && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <label className="text-[11px] font-semibold text-slate-600">Date de règlement promise</label>
          <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Montant promis / note (facultatif)…" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
          <button type="button" onClick={enregistrerPromesse} disabled={!echeance} className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400">Enregistrer la promesse</button>
        </div>
      )}

      {/* Timeline du dossier */}
      {events.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <HistoryIcon size={13} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Vos actions sur ce dossier ({events.length})</span>
          </div>
          <ul className="space-y-1.5">
            {events.map(e => (
              <li key={e.id} className="flex items-start gap-2 text-xs">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-700">{EVENEMENT_LABEL[e.type as EvenementRecouvrementType]}</span>
                  {e.canal && <span className="text-slate-400"> · {CANAL_LABEL[e.canal]}</span>}
                  {e.montant != null && <span className="text-emerald-700 font-semibold"> · {formatFcfa(e.montant)} F</span>}
                  {e.echeance && <span className="text-amber-700"> · échéance {e.echeance}</span>}
                  {e.note && <span className="text-slate-500 italic"> — « {e.note} »</span>}
                  <div className="text-[10px] text-slate-400">
                    {new Date(e.date).toLocaleString('fr-FR')} · {e.auteur}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => annulerDernier(selected.id)} className="mt-2 text-[10px] text-slate-400 hover:text-slate-600">
            Annuler la dernière action
          </button>
        </div>
      )}

      <button type="button" onClick={onClose} className="mt-3 text-xs text-slate-400 hover:text-slate-600">
        Fermer le panneau
      </button>

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
