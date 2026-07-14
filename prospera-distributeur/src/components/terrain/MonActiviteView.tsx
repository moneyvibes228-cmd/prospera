'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  ChevronLeft, ChevronRight, MapPin, Clock, Navigation, Sparkles,
  CheckCircle2, Target, Wallet, TrendingUp, CalendarDays, History, Route as RouteIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { KpiCard } from '@/components/shared/KpiCard'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { WorkflowToast } from '@/components/shared/WorkflowToast'
import type { CarteMarker } from '@/components/shared/CartePerimetreTerrain'
import { useAuth } from '@/contexts/AuthContext'
import { useTerrainWorkflow } from '@/contexts/TerrainWorkflowContext'
import { ClotureVisiteModal } from '@/components/terrain/ClotureVisiteModal'
import { useHubContext } from '@/lib/use-hub-context'
import {
  getTourneeHub, debutSemaine, addDays, libelleSemaine, libelleJour, DATE_AUJOURDHUI,
  STATUT_VISITE_STYLE, MOTIF_VISITE_STYLE, RESULTAT_VISITE_STYLE,
} from '@/lib/tournee-hub'
import { formatFcfa } from '@/lib/utils'
import {
  optimiserItineraire, distanceParcours, dureeParcours, lienNavigationMulti, formatDuree,
} from '@/lib/itineraire-builder'
import type { Visite } from '@/types'

const CarteTournee = dynamic(() => import('@/components/shared/CartePerimetreTerrain'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[280px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
      Chargement de la carte…
    </div>
  ),
})

const STATUT_COULEUR: Record<string, string> = {
  FAITE: '#10b981',
  EN_COURS: '#f59e0b',
  PLANIFIEE: '#3b82f6',
  REPORTEE: '#94a3b8',
  ANNULEE: '#cbd5e1',
}

type Onglet = 'JOUR' | 'SEMAINE' | 'HISTORIQUE'

function VisiteCard({
  visite, freelance, onYAller, onCloturer,
}: {
  visite: Visite
  freelance: boolean
  onYAller: (v: Visite) => void
  onCloturer: (v: Visite) => void
}) {
  const statut = STATUT_VISITE_STYLE[visite.statut]
  const motif = MOTIF_VISITE_STYLE[visite.motif]
  const resultat = visite.resultat ? RESULTAT_VISITE_STYLE[visite.resultat] : null
  const enCours = visite.statut === 'EN_COURS'

  return (
    <div className={`rounded-xl border p-4 transition-shadow ${enCours ? 'border-amber-300 bg-amber-50/60 shadow-sm' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center shrink-0 w-12">
          <span className="text-sm font-bold text-slate-900">{visite.heure}</span>
          <span className="text-[10px] text-slate-400">{visite.duree_min} min</span>
        </div>

        <div className={`w-1 self-stretch rounded-full ${motif.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-slate-400">#{visite.ordre}</span>
            <span className="font-semibold text-sm text-slate-900 truncate">{visite.pdv_nom}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${motif.className}`}>{motif.label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ring-1 ring-inset ${statut.className}`}>{statut.label}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{visite.adresse} · {visite.zone}</span>
          </div>

          {visite.conseil_ia && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-700 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
              <Sparkles size={12} className="text-amber-500 shrink-0 mt-0.5" />
              <span>{visite.conseil_ia}</span>
            </div>
          )}

          {resultat && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${resultat.className}`}>{resultat.label}</span>
              {visite.montant_commande != null && (
                <span className="text-[11px] font-semibold text-slate-700">
                  {formatFcfa(visite.montant_commande)} F
                  {freelance && <span className="text-slate-400 font-normal"> (tarif société)</span>}
                </span>
              )}
              {visite.montant_encaisse != null && visite.montant_encaisse > 0 && (
                <span className="text-[11px] font-semibold text-teal-700">
                  Encaissé {formatFcfa(visite.montant_encaisse)} F
                </span>
              )}
              {visite.commentaire && <span className="text-[11px] text-slate-500 italic">« {visite.commentaire} »</span>}
            </div>
          )}
        </div>

        {(visite.statut === 'PLANIFIEE' || enCours) && (
          <button
            type="button"
            onClick={() => (enCours ? onCloturer(visite) : onYAller(visite))}
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-[11px] font-semibold transition-colors ${
              enCours ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            <Navigation size={12} />
            {enCours ? 'Clôturer' : 'Y aller'}
          </button>
        )}
      </div>
    </div>
  )
}

export function MonActiviteView() {
  const { user } = useAuth()
  const ctx = useHubContext()
  const hub = useMemo(() => getTourneeHub(ctx), [ctx])
  const { appliquer, demarrerVisite, cloturerVisite, lastAction, clearLastAction } = useTerrainWorkflow()

  const [onglet, setOnglet] = useState<Onglet>('JOUR')
  const [lundi, setLundi] = useState(() => debutSemaine(DATE_AUJOURDHUI))
  const [jourSelectionne, setJourSelectionne] = useState(DATE_AUJOURDHUI)
  const [visiteACloturer, setVisiteACloturer] = useState<Visite | null>(null)
  const [optimise, setOptimise] = useState(false)

  const aujourdhui = useMemo(() => appliquer(hub.aujourdhui), [appliquer, hub.aujourdhui])
  const prochaineVisite = useMemo(
    () => aujourdhui.find(v => v.statut === 'EN_COURS' || v.statut === 'PLANIFIEE'),
    [aujourdhui],
  )

  const carteMarkers = useMemo<CarteMarker[]>(
    () => aujourdhui
      .filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lng))
      .map(v => ({
        id: v.id,
        lat: v.lat,
        lng: v.lng,
        nom: `#${v.ordre} ${v.pdv_nom}`,
        couleur: STATUT_COULEUR[v.statut] ?? '#3b82f6',
        sousTitre: `${v.heure} · ${STATUT_VISITE_STYLE[v.statut].label}`,
        badge: v.motif ? MOTIF_VISITE_STYLE[v.motif].label : undefined,
      })),
    [aujourdhui],
  )

  // Arrêts encore à faire aujourd'hui, dans l'ordre de priorité métier reçu.
  const stopsRestants = useMemo(
    () => [...aujourdhui]
      .filter(v => v.statut === 'PLANIFIEE' || v.statut === 'EN_COURS')
      .filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lng))
      .sort((a, b) => a.ordre - b.ordre),
    [aujourdhui],
  )

  const enCoursId = useMemo(
    () => aujourdhui.find(v => v.statut === 'EN_COURS')?.id,
    [aujourdhui],
  )

  // Comparaison ordre priorité (reçu) vs meilleur trajet (plus proche voisin).
  const itineraire = useMemo(() => {
    const distancePriorite = distanceParcours(stopsRestants)
    const dureePriorite = dureeParcours(stopsRestants)
    const opt = optimiserItineraire(stopsRestants, enCoursId)
    const gainKm = Math.round((distancePriorite - opt.distance_km) * 10) / 10
    const gainPct = distancePriorite > 0 ? Math.round((gainKm / distancePriorite) * 100) : 0
    return { distancePriorite, dureePriorite, opt, gainKm, gainPct }
  }, [stopsRestants, enCoursId])

  const ordreAffiche = optimise ? itineraire.opt.ordre : stopsRestants

  const carteRoute = useMemo(
    () => ordreAffiche.map(v => ({ lat: v.lat, lng: v.lng })),
    [ordreAffiche],
  )
  const semaine = useMemo(
    () => hub.semaine(lundi).map(j => ({ ...j, visites: appliquer(j.visites) })),
    [appliquer, hub, lundi],
  )
  const statsSemaine = useMemo(() => hub.statsSemaine(lundi), [hub, lundi])
  const visitesJour = useMemo(() => appliquer(hub.parDate(jourSelectionne)), [appliquer, hub, jourSelectionne])
  const statsJour = useMemo(() => hub.statsJour(jourSelectionne), [hub, jourSelectionne])
  const historique = useMemo(() => appliquer(hub.historique(40)), [appliquer, hub])

  const freelance = user?.role === 'FREELANCE'
  const restantes = visitesJour.filter(v => v.statut === 'PLANIFIEE' || v.statut === 'EN_COURS').length

  function ouvrirNavigation(v: Visite) {
    demarrerVisite(v.id)
    if (typeof window !== 'undefined' && v.lat && v.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`, '_blank', 'noopener')
    }
  }

  function lancerItineraireComplet() {
    const lien = lienNavigationMulti(ordreAffiche)
    if (lien && typeof window !== 'undefined') {
      window.open(lien, '_blank', 'noopener')
    }
  }

  function changerSemaine(delta: number) {
    const nouveau = addDays(lundi, delta * 7)
    setLundi(nouveau)
    setJourSelectionne(nouveau)
    setOnglet('SEMAINE')
  }

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title="Mon activité"
        subtitle={`Votre agenda terrain — ${user?.zone}`}
        badge={freelance ? 'Portefeuille indépendant' : 'Mode offline OK'}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Visites cette semaine"
          value={`${statsSemaine.visites_faites} / ${statsSemaine.visites_planifiees}`}
          sub={restantes > 0 ? `${restantes} arrêt(s) restants aujourd'hui` : 'Tournée du jour terminée'}
          icon={MapPin}
          accent="bg-teal-50 text-teal-600"
        />
        <KpiCard
          label="Commandes prises"
          value={String(statsSemaine.commandes)}
          sub={`${statsSemaine.taux_reussite_pct}% de transformation`}
          icon={Target}
          trend={statsSemaine.taux_reussite_pct >= 55 ? 'up' : 'down'}
        />
        <KpiCard
          label={freelance ? 'CA société généré' : 'CA généré'}
          value={`${formatFcfa(statsSemaine.ca_genere)} F`}
          icon={TrendingUp}
          accent="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="Encaissé sur le terrain"
          value={`${formatFcfa(statsSemaine.encaisse)} F`}
          sub="Créances soldées en visite"
          icon={Wallet}
          accent="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="flex items-center gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        {([
          ['JOUR', 'Tournée du jour', Clock],
          ['SEMAINE', 'Semaine', CalendarDays],
          ['HISTORIQUE', 'Historique', History],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setOnglet(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              onglet === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {onglet === 'JOUR' && (
        <div className="space-y-3">
          {carteMarkers.length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
                <MapPin size={14} className="text-teal-600" />
                <span className="text-xs font-semibold text-slate-700">Ma tournée du jour</span>
                <span className="ml-auto flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> À visiter</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> En cours</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Faite</span>
                </span>
              </div>
              {stopsRestants.length >= 2 && (
                <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                  <RouteIcon size={14} className="text-teal-600 shrink-0" />
                  <div className="text-[11px] text-slate-600 min-w-0">
                    {optimise ? (
                      <>
                        <span className="font-bold text-teal-700">Meilleur trajet</span> — {itineraire.opt.distance_km} km ·{' '}
                        {formatDuree(itineraire.opt.duree_min)}
                        {itineraire.gainKm > 0 && (
                          <span className="text-emerald-600 font-semibold"> · −{itineraire.gainKm} km ({itineraire.gainPct}%)</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700">Ordre priorité</span> — {itineraire.distancePriorite} km ·{' '}
                        {formatDuree(itineraire.dureePriorite)}
                        {itineraire.gainKm > 0 && (
                          <span className="text-slate-400"> · le meilleur trajet économise {itineraire.gainKm} km</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setOptimise(o => !o)}
                      disabled={itineraire.gainKm <= 0}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        optimise ? 'bg-teal-600 text-white hover:bg-teal-700' : 'border border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      {optimise ? 'Trajet optimisé activé' : 'Optimiser le trajet'}
                    </button>
                    <button
                      type="button"
                      onClick={lancerItineraireComplet}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                    >
                      <Navigation size={12} /> Lancer l&apos;itinéraire ({stopsRestants.length})
                    </button>
                  </div>
                </div>
              )}
              <div className="h-[300px]">
                <CarteTournee markers={carteMarkers} routes={[{ points: carteRoute, couleur: optimise ? '#0d9488' : '#94a3b8' }]} />
              </div>
            </div>
          )}

          {prochaineVisite && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 flex items-center gap-3">
              <AiBadge />
              <div className="flex-1 text-sm text-slate-800">
                <strong>Prochain arrêt : {prochaineVisite.pdv_nom}</strong> à {prochaineVisite.heure} —{' '}
                {MOTIF_VISITE_STYLE[prochaineVisite.motif].label.toLowerCase()}. Tournée ordonnée par priorité,
                impayés et réclamations traités en premier.
              </div>
            </div>
          )}

          {aujourdhui.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Aucune visite planifiée aujourd&apos;hui.
            </div>
          ) : (
            aujourdhui.map(v => (
              <VisiteCard
                key={v.id}
                visite={v}
                freelance={freelance}
                onYAller={ouvrirNavigation}
                onCloturer={setVisiteACloturer}
              />
            ))
          )}
        </div>
      )}

      {onglet === 'SEMAINE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-3 py-2">
            <button type="button" onClick={() => changerSemaine(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-800">{libelleSemaine(lundi)}</span>
            <button type="button" onClick={() => changerSemaine(1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {semaine.map(jour => {
              const faites = jour.visites.filter(v => v.statut === 'FAITE').length
              const selected = jour.date === jourSelectionne
              return (
                <button
                  key={jour.date}
                  type="button"
                  onClick={() => setJourSelectionne(jour.date)}
                  className={`text-left rounded-xl border p-3 transition-all ${
                    selected ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-200'
                      : jour.estAujourdhui ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">{jour.label}</span>
                    <span className={`text-lg font-bold ${jour.estAujourdhui ? 'text-amber-600' : 'text-slate-900'}`}>{jour.numero}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {jour.visites.length === 0 ? 'Repos' : `${jour.visites.length} visite${jour.visites.length > 1 ? 's' : ''}`}
                  </div>
                  {jour.visites.length > 0 && (
                    <div className="mt-2 flex gap-0.5">
                      {jour.visites.map(v => (
                        <span
                          key={v.id}
                          title={`${v.heure} — ${v.pdv_nom}`}
                          className={`h-1.5 flex-1 rounded-full ${MOTIF_VISITE_STYLE[v.motif].dot} ${v.statut === 'FAITE' ? '' : 'opacity-30'}`}
                        />
                      ))}
                    </div>
                  )}
                  {jour.estPasse && jour.visites.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-1.5 font-semibold">
                      <CheckCircle2 size={10} /> {faites} faite{faites > 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800">{libelleJour(jourSelectionne)}</h3>
              <span className="text-xs text-slate-500">
                {statsJour.visites_planifiees} visite(s) · {statsJour.commandes} commande(s) · {formatFcfa(statsJour.ca_genere)} F
              </span>
            </div>
            <div className="space-y-3">
              {visitesJour.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  Pas de tournée ce jour-là.
                </div>
              ) : (
                visitesJour.map(v => (
                  <VisiteCard
                    key={v.id}
                    visite={v}
                    freelance={freelance}
                    onYAller={ouvrirNavigation}
                    onCloturer={setVisiteACloturer}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {onglet === 'HISTORIQUE' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">Date</th>
                <th className="text-left font-semibold px-4 py-2.5">Point de vente</th>
                <th className="text-left font-semibold px-4 py-2.5">Motif</th>
                <th className="text-left font-semibold px-4 py-2.5">Résultat</th>
                <th className="text-right font-semibold px-4 py-2.5">Montant</th>
              </tr>
            </thead>
            <tbody>
              {historique.map(v => {
                const resultat = v.resultat ? RESULTAT_VISITE_STYLE[v.resultat] : null
                const montant = (v.montant_commande ?? 0) + (v.montant_encaisse ?? 0)
                return (
                  <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{libelleJour(v.date)}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{v.pdv_nom}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${MOTIF_VISITE_STYLE[v.motif].className}`}>
                        {MOTIF_VISITE_STYLE[v.motif].label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {resultat && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${resultat.className}`}>{resultat.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                      {montant > 0 ? `${formatFcfa(montant)} F` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {visiteACloturer && (
        <ClotureVisiteModal
          visite={visiteACloturer}
          freelance={freelance}
          onClose={() => setVisiteACloturer(null)}
          onConfirm={payload => {
            cloturerVisite(visiteACloturer.id, payload)
            setVisiteACloturer(null)
          }}
        />
      )}

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
