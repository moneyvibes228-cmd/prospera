'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Route, Banknote, Target, AlertTriangle, Store, MapPin,
  Play, Pause, SkipBack, SkipForward, History,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { KpiCard } from '@/components/shared/KpiCard'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useHubContext } from '@/lib/use-hub-context'
import { scopeAuPerimetre } from '@/lib/hub-context'
import { getPerimetre } from '@/lib/perimetre'
import { buildTournees, type TourneeCommercial } from '@/lib/tournees-builder'
import { REGISTRE_VISITES, DATE_AUJOURDHUI } from '@/lib/registries/tournees-registry'
import { cn, formatFcfa } from '@/lib/utils'
import type { CarteMarker, CarteRoute } from '@/components/shared/CartePerimetreTerrain'

const CarteEquipe = dynamic(() => import('@/components/shared/CartePerimetreTerrain'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
      Chargement de la carte équipe…
    </div>
  ),
})

const PALETTE_COMMERCIAL = ['#14b8a6', '#3b82f6', '#f97316', '#84cc16', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308']

const STATUT_STYLE: Record<TourneeCommercial['statut'], { label: string; cls: string }> = {
  EN_COURS: { label: 'En tournée', cls: 'bg-emerald-100 text-emerald-700' },
  TERMINEE: { label: 'Terminée', cls: 'bg-slate-100 text-slate-600' },
  NON_DEMARREE: { label: 'Non démarrée', cls: 'bg-red-100 text-red-700' },
}

/**
 * Écran d'exécution du Superviseur de Zone : le plan de journée, le taux de
 * transformation des visites, et la caisse. Rien de tout cela n'existe sur
 * l'écran du DG — et c'est le seul écran où les écarts de caisse se voient.
 */
export function TourneesView() {
  const { user } = useAuth()
  const ctx = useHubContext()
  const perimetre = useMemo(() => getPerimetre(user ?? undefined), [user])
  const hub = useMemo(() => buildTournees(perimetre), [perimetre])

  const ecart = Math.abs(hub.ecart_caisse_total)

  // Visites du jour du périmètre, colorées par commercial + itinéraire par VRP.
  const visitesJourZone = useMemo(
    () => scopeAuPerimetre(REGISTRE_VISITES, ctx).filter(v => v.date === DATE_AUJOURDHUI),
    [ctx],
  )
  const couleurCommercial = useMemo(() => {
    const noms = [...new Set(visitesJourZone.map(v => v.commercial))]
    const map = new Map<string, string>()
    noms.forEach((nom, i) => map.set(nom, PALETTE_COMMERCIAL[i % PALETTE_COMMERCIAL.length]))
    return map
  }, [visitesJourZone])

  const carteMarkers = useMemo<CarteMarker[]>(
    () => visitesJourZone
      .filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lng))
      .map(v => ({
        id: v.id,
        lat: v.lat,
        lng: v.lng,
        nom: v.pdv_nom,
        couleur: v.statut === 'FAITE' ? '#10b981' : (couleurCommercial.get(v.commercial) ?? '#3b82f6'),
        rayon: 7,
        sousTitre: `${v.commercial} · ${v.heure}`,
        badge: v.statut === 'FAITE' ? 'Visité' : 'À visiter',
      })),
    [visitesJourZone, couleurCommercial],
  )

  const carteRoutes = useMemo<CarteRoute[]>(() => {
    const parCommercial = new Map<string, typeof visitesJourZone>()
    for (const v of visitesJourZone) {
      if (!Number.isFinite(v.lat) || !Number.isFinite(v.lng)) continue
      const arr = parCommercial.get(v.commercial) ?? []
      arr.push(v)
      parCommercial.set(v.commercial, arr)
    }
    return [...parCommercial.entries()].map(([nom, vs]) => ({
      couleur: couleurCommercial.get(nom),
      points: [...vs].sort((a, b) => a.ordre - b.ordre).map(v => ({ lat: v.lat, lng: v.lng })),
    }))
  }, [visitesJourZone, couleurCommercial])

  // ── Rejeu de la journée — timeline des positions d'un commercial ──────────
  const commerciauxDuJour = useMemo(
    () => [...new Set(visitesJourZone.map(v => v.commercial))].sort((a, b) => a.localeCompare(b)),
    [visitesJourZone],
  )
  const [rejeuCommercial, setRejeuCommercial] = useState<string | null>(null)
  const [pos, setPos] = useState(1)
  const [enLecture, setEnLecture] = useState(false)

  const visitesRejeu = useMemo(
    () => rejeuCommercial
      ? [...visitesJourZone]
        .filter(v => v.commercial === rejeuCommercial && Number.isFinite(v.lat) && Number.isFinite(v.lng))
        .sort((a, b) => a.ordre - b.ordre)
      : [],
    [visitesJourZone, rejeuCommercial],
  )

  // Réinitialise le curseur quand on change de commercial (ou qu'on quitte le rejeu).
  useEffect(() => {
    setPos(1)
    setEnLecture(false)
  }, [rejeuCommercial])

  // Boucle de lecture : avance d'un arrêt toutes les ~950 ms, s'arrête au dernier.
  useEffect(() => {
    if (!enLecture || visitesRejeu.length === 0) return
    if (pos >= visitesRejeu.length) {
      setEnLecture(false)
      return
    }
    const t = setTimeout(() => setPos(p => Math.min(visitesRejeu.length, p + 1)), 950)
    return () => clearTimeout(t)
  }, [enLecture, pos, visitesRejeu.length])

  const arretCourant = visitesRejeu[pos - 1]

  const rejeuMarkers = useMemo<CarteMarker[]>(
    () => visitesRejeu.map((v, i) => {
      const passe = i < pos - 1
      const courant = i === pos - 1
      return {
        id: v.id,
        lat: v.lat,
        lng: v.lng,
        nom: `${v.ordre}. ${v.pdv_nom}`,
        couleur: courant ? '#f97316' : passe ? '#10b981' : '#cbd5e1',
        rayon: courant ? 11 : 7,
        sousTitre: `${v.heure}${v.statut === 'FAITE' ? ' · visité' : ''}`,
        badge: courant ? 'Position actuelle' : passe ? 'Passé' : 'À venir',
      }
    }),
    [visitesRejeu, pos],
  )

  const rejeuRoutes = useMemo<CarteRoute[]>(() => {
    const pts = visitesRejeu.slice(0, pos).map(v => ({ lat: v.lat, lng: v.lng }))
    return pts.length >= 2 ? [{ points: pts, couleur: '#0d9488' }] : []
  }, [visitesRejeu, pos])

  const enRejeu = rejeuCommercial != null && visitesRejeu.length > 0

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Tournées & Cash"
        subtitle={`${perimetre.libelle} — plan de journée, transformation et remises d'espèces`}
        badge="Jour en cours"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={Route}
          label="Couverture du PJP"
          value={`${hub.couverture_pjp} %`}
          sub={`${hub.pjp_realise} visites sur ${hub.pjp_planifie} planifiées`}
          trend={hub.couverture_pjp >= 95 ? 'up' : 'down'}
          accent="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          icon={Target}
          label="Strike rate"
          value={`${hub.strike_rate} %`}
          sub="Visites transformées en commande — cible 50 %"
          trend={hub.strike_rate >= 50 ? 'up' : 'down'}
          accent="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          icon={Banknote}
          label="Espèces remises"
          value={`${formatFcfa(hub.cash_remis)} F`}
          sub={`sur ${formatFcfa(hub.cash_encaisse)} F encaissés`}
          trend={ecart === 0 ? 'up' : 'down'}
          accent="bg-amber-50 text-amber-600"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Écart de caisse"
          value={ecart === 0 ? '0 F' : `−${formatFcfa(ecart)} F`}
          sub={hub.commerciaux_en_ecart === 0 ? 'Caisse juste' : `${hub.commerciaux_en_ecart} commercial(aux) en écart`}
          trend={ecart === 0 ? 'up' : 'down'}
          accent={ecart === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
        />
      </div>

      {carteMarkers.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white mb-6">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 flex-wrap">
            <MapPin size={14} className="text-teal-600" />
            <span className="text-xs font-semibold text-slate-700">
              {enRejeu ? `Rejeu de la journée — ${rejeuCommercial}` : `Mon équipe sur le terrain — ${perimetre.libelle}`}
            </span>
            {!enRejeu && (
              <span className="text-[10px] text-slate-400">
                {carteMarkers.length} arrêts · {carteRoutes.length} tournées · itinéraires colorés par commercial
              </span>
            )}
            <label className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500">
              <History size={13} className="text-slate-400" />
              <span className="font-semibold">Rejeu</span>
              <select
                value={rejeuCommercial ?? ''}
                onChange={e => setRejeuCommercial(e.target.value || null)}
                className="text-[11px] font-medium border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option value="">Vue équipe (tous)</option>
                {commerciauxDuJour.map(nom => (
                  <option key={nom} value={nom}>{nom}</option>
                ))}
              </select>
            </label>
          </div>

          {enRejeu && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setEnLecture(false); setPos(1) }}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40"
                  disabled={pos <= 1}
                  title="Revenir au départ"
                >
                  <SkipBack size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pos >= visitesRejeu.length) { setPos(1); setEnLecture(true) }
                    else setEnLecture(l => !l)
                  }}
                  className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                  title={enLecture ? 'Pause' : 'Lecture'}
                >
                  {enLecture ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => { setEnLecture(false); setPos(p => Math.min(visitesRejeu.length, p + 1)) }}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40"
                  disabled={pos >= visitesRejeu.length}
                  title="Arrêt suivant"
                >
                  <SkipForward size={14} />
                </button>
              </div>

              <input
                type="range"
                min={1}
                max={visitesRejeu.length}
                value={pos}
                onChange={e => { setEnLecture(false); setPos(Number(e.target.value)) }}
                className="flex-1 min-w-[140px] accent-teal-600"
              />

              <div className="text-[11px] text-slate-600 tabular-nums whitespace-nowrap">
                <span className="font-bold text-slate-800">Arrêt {pos}/{visitesRejeu.length}</span>
                {arretCourant && (
                  <span className="text-slate-400"> · {arretCourant.heure} · {arretCourant.pdv_nom}</span>
                )}
              </div>
            </div>
          )}

          <div className="h-[360px]">
            <CarteEquipe
              markers={enRejeu ? rejeuMarkers : carteMarkers}
              routes={enRejeu ? rejeuRoutes : carteRoutes}
              selectedId={enRejeu ? arretCourant?.id ?? null : null}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Plan de journée par commercial</h3>
            <span className="text-[10px] text-slate-400 ml-auto">Trié par couverture croissante</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-bold">Commercial</th>
                  <th className="pb-2 font-bold text-right">PJP</th>
                  <th className="pb-2 font-bold text-right">Strike</th>
                  <th className="pb-2 font-bold text-right">Encaissé</th>
                  <th className="pb-2 font-bold text-right">Écart caisse</th>
                  <th className="pb-2 font-bold text-right">Sans remise</th>
                  <th className="pb-2 font-bold text-right">Statut</th>
                </tr>
              </thead>
              <tbody>
                {hub.tournees.map(t => (
                  <tr key={t.commercial} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5">
                      <div className="font-medium text-slate-800">{t.commercial}</div>
                      <div className="text-[10px] text-slate-400">
                        {t.derniere_position} · {t.km_parcourus} km
                        {t.type === 'FREELANCE' && <span className="ml-1 text-lime-600 font-bold">· freelance</span>}
                      </div>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      <span className={cn('font-bold', t.couverture_pjp >= 100 ? 'text-emerald-600' : t.couverture_pjp >= 80 ? 'text-slate-700' : 'text-red-600')}>
                        {t.pjp_realise}/{t.pjp_planifie}
                      </span>
                      <div className="text-[10px] text-slate-400">{t.couverture_pjp} %</div>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      <span className={cn('font-bold', t.strike_rate >= 50 ? 'text-emerald-600' : t.strike_rate >= 40 ? 'text-amber-600' : 'text-red-600')}>
                        {t.strike_rate} %
                      </span>
                      <div className="text-[10px] text-slate-400">{t.visites_avec_commande} cmd</div>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-slate-700">
                      {formatFcfa(t.cash_encaisse)} F
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {t.ecart_caisse < 0 ? (
                        <span className="font-black text-red-600">−{formatFcfa(Math.abs(t.ecart_caisse))} F</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">juste</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {t.jours_sans_remise > 0 ? (
                        <span className="font-bold text-red-600">{t.jours_sans_remise} j</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">0</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', STATUT_STYLE[t.statut].cls)}>
                        {STATUT_STYLE[t.statut].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-red-500" />
              <h3 className="text-sm font-semibold text-slate-900">Alertes du jour</h3>
              <AiBadge variant="small" />
            </div>
            {hub.alertes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Zone au vert — rien à signaler.</p>
            ) : (
              <div className="space-y-2">
                {hub.alertes.map((a, i) => (
                  <div key={i} className={cn(
                    'rounded-lg border p-2.5',
                    a.severite === 'CRITIQUE' ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/50',
                  )}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'text-[9px] font-black px-1.5 py-0.5 rounded',
                        a.severite === 'CRITIQUE' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white',
                      )}>
                        {a.severite}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{a.titre}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{a.commercial} — {a.detail}</p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">→ {a.action}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Store size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Exécution en magasin</h3>
            </div>
            <p className="text-[10px] text-slate-400 mb-3">
              Relevé des visites du jour — ce que le client voit en boutique.
            </p>
            <div className="space-y-2.5">
              {hub.execution.map(e => {
                const atteint = e.pct >= e.cible
                return (
                  <div key={e.critere}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-700">{e.critere}</span>
                      <span className={cn('font-bold tabular-nums', atteint ? 'text-emerald-600' : 'text-red-600')}>
                        {e.pct} % <span className="text-slate-300 font-normal">/ {e.cible} %</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', atteint ? 'bg-emerald-500' : 'bg-red-400')}
                        style={{ width: `${e.pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
