'use client'
import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Map, Users, HeartPulse, Handshake, ShieldAlert, TrendingDown, ArrowRight, Store,
  MapPin, Crosshair, Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { WorkflowToast } from '@/components/shared/WorkflowToast'
import { useProspectionWorkflow } from '@/contexts/ProspectionWorkflowContext'
import { useHubContext } from '@/lib/use-hub-context'
import { getProspectionHub } from '@/lib/prospection-hub'
import type { CarteMarker } from '@/components/shared/CartePerimetreTerrain'
import {
  buildEntonnoirConquete, buildCohorteSurvie, buildFilePassation,
  buildAlertesConquete, buildSyntheseConquete,
  type AlerteConquete, type GraviteAlerte,
} from '@/lib/prospection-builder'
import {
  CAPACITE_LABEL, ETAPE_LABEL, REGLES_CONQUETE, SANTE_LABEL,
  type Prospect, type SanteOuverture, type StatutZone, type ZoneConquete,
} from '@/lib/registries/prospection-registry'
import { REGISTRE_COMMERCIAUX } from '@/lib/registries/commerciaux-registry'
import { cn, formatFcfa } from '@/lib/utils'

const CarteRecensement = dynamic(() => import('@/components/shared/CartePerimetreTerrain'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
      Chargement de la carte de recensement…
    </div>
  ),
})

type Vue = 'territoires' | 'prospects' | 'survie' | 'passation'

const VUE_TABS: { id: Vue; label: string; icon: React.ElementType }[] = [
  { id: 'territoires', label: 'Territoires', icon: Map },
  { id: 'prospects', label: 'Carnet de prospects', icon: Users },
  { id: 'survie', label: 'Ouvertures & survie', icon: HeartPulse },
  { id: 'passation', label: 'Passation', icon: Handshake },
]

const GRAVITE_STYLE: Record<GraviteAlerte, string> = {
  CRITIQUE: 'border-red-200 bg-red-50/70',
  HAUTE: 'border-amber-200 bg-amber-50/70',
  MOYENNE: 'border-slate-200 bg-slate-50/70',
}

const GRAVITE_BADGE: Record<GraviteAlerte, string> = {
  CRITIQUE: 'bg-red-100 text-red-700',
  HAUTE: 'bg-amber-100 text-amber-700',
  MOYENNE: 'bg-slate-200 text-slate-600',
}

const STATUT_ZONE_STYLE: Record<StatutZone, { label: string; badge: string }> = {
  A_RECENSER: { label: 'À recenser', badge: 'bg-slate-100 text-slate-600' },
  RECENSEMENT_EN_COURS: { label: 'Recensement en cours', badge: 'bg-sky-100 text-sky-700' },
  EN_CONQUETE: { label: 'En conquête', badge: 'bg-emerald-100 text-emerald-700' },
  COUVERTE: { label: 'Couverte', badge: 'bg-teal-100 text-teal-700' },
  ABANDONNEE: { label: 'Abandonnée', badge: 'bg-slate-200 text-slate-500' },
}

/** Couleur du point de zone sur la carte, selon son statut. */
const STATUT_ZONE_COULEUR: Record<StatutZone, string> = {
  A_RECENSER: '#94a3b8',
  RECENSEMENT_EN_COURS: '#0ea5e9',
  EN_CONQUETE: '#10b981',
  COUVERTE: '#14b8a6',
  ABANDONNEE: '#cbd5e1',
}

const SANTE_STYLE: Record<SanteOuverture, string> = {
  VIVANT: 'bg-emerald-100 text-emerald-700',
  DORMANT: 'bg-amber-100 text-amber-700',
  MORT: 'bg-slate-200 text-slate-600',
  IMPAYE: 'bg-red-100 text-red-700',
}

function scoreStyle(score: number): string {
  if (score >= 70) return 'bg-emerald-100 text-emerald-700'
  if (score >= 45) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

function AlerteCard({ alerte }: { alerte: AlerteConquete }) {
  return (
    <div className={cn('rounded-xl border p-3', GRAVITE_STYLE[alerte.gravite])}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-bold text-slate-900">{alerte.cible}</p>
        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', GRAVITE_BADGE[alerte.gravite])}>
          {alerte.gravite}
        </span>
      </div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{alerte.regle}</p>
      <p className="text-xs text-slate-700">{alerte.constat}</p>
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/70">
        <ArrowRight size={11} className="text-slate-400 shrink-0" />
        <p className="text-xs font-medium text-slate-800">{alerte.action}</p>
      </div>
      {alerte.impact_fcfa ? (
        <p className="text-[11px] font-bold text-red-600 mt-1.5">
          Coût constaté : {formatFcfa(alerte.impact_fcfa)} FCFA
        </p>
      ) : null}
    </div>
  )
}

function ProspectRow({ p, onSelect, actif }: { p: Prospect; onSelect: () => void; actif: boolean }) {
  const bloque = p.etape !== 'PERDU' && p.jours_dans_etape > REGLES_CONQUETE.jours_max_sans_contact
  return (
    <button type="button" onClick={onSelect}
      className={cn('w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors',
        actif && 'bg-indigo-50/60')}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800 truncate">{p.nom}</span>
            {bloque && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                {p.jours_dans_etape} j bloqué
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {p.type_commerce} · {p.quartier} · {p.achalandage_jour} passages/j
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-medium text-slate-500 w-20 text-right">{CAPACITE_LABEL[p.capacite_paiement]}</span>
          <span className="text-xs text-slate-600 tabular-nums w-14 text-right">{formatFcfa(p.ca_estime_mois)}</span>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full w-14 text-center', scoreStyle(p.score_ia))}>
            {p.score_ia}
          </span>
        </div>
      </div>
    </button>
  )
}

export function ConqueteView() {
  const ctx = useHubContext()
  const { zones, prospects, ouvertures } = getProspectionHub(ctx)
  const [vue, setVue] = useState<Vue>('territoires')
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const selectedZone = zones.find(z => z.id === selectedZoneId) ?? null

  // ── Mode recensement — taper la carte crée un prospect géolocalisé ────────
  const {
    recensement, recenser, supprimer,
    transferts, transferer,
    lastAction, clearLastAction,
  } = useProspectionWorkflow()
  const [modeRecensement, setModeRecensement] = useState(false)

  // Les transferts (couche persistée) sont fusionnés par-dessus le registre :
  // un PDV transféré sort de la file de passation et cesse d'être orphelin.
  const ouverturesVue = useMemo(
    () => ouvertures.map(o => (transferts[o.id] ? { ...o, transfere_a: transferts[o.id] } : o)),
    [ouvertures, transferts],
  )

  // Points de zone (conquête) — tracés sur la carte, cliquables pour le détail.
  const zoneMarkers = useMemo<CarteMarker[]>(
    () => zones.map(z => ({
      id: z.id,
      lat: z.lat,
      lng: z.lng,
      nom: z.zone,
      couleur: STATUT_ZONE_COULEUR[z.statut],
      rayon: 13,
      sousTitre: `${z.pdv_recenses}/${z.pdv_estimes} recensés · ${z.pdv_ouverts} ouverts · ${z.distance_depot_km} km`,
      badge: STATUT_ZONE_STYLE[z.statut].label,
    })),
    [zones],
  )

  const recensementMarkers = useMemo<CarteMarker[]>(
    () => recensement.map(p => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      nom: p.nom,
      couleur: '#6366f1',
      rayon: 7,
      sousTitre: p.type_commerce ?? 'Commerce recensé',
      badge: 'Recensé',
    })),
    [recensement],
  )

  const carteMarkers = useMemo<CarteMarker[]>(
    () => [...zoneMarkers, ...recensementMarkers],
    [zoneMarkers, recensementMarkers],
  )

  function handleSelectMarker(id: string | null) {
    // Seuls les points de zone ouvrent le panneau de détail ; les points recensés
    // gardent leur simple popup.
    setSelectedZoneId(prev => (zones.some(z => z.id === id) ? (prev === id ? null : id) : prev))
  }

  function handleMapClick(lat: number, lng: number) {
    if (!modeRecensement) return
    const nom = window.prompt('Nom du commerce recensé (zone blanche) :')?.trim()
    if (!nom) return
    const type = window.prompt('Type de commerce (facultatif) :')?.trim() || undefined
    recenser({ nom, lat, lng, type_commerce: type, commercial: ctx.nom ?? 'Prospecteur' })
  }

  const synthese = buildSyntheseConquete(zones, prospects, ouverturesVue)
  const entonnoir = buildEntonnoirConquete(prospects)
  const cohorte = buildCohorteSurvie(ouverturesVue)
  const passation = buildFilePassation(ouverturesVue)
  const alertes = buildAlertesConquete(prospects, ouverturesVue)

  function handleTransferer(o: { id: string; pdv_nom: string; zone: string }) {
    const defaut = REGISTRE_COMMERCIAUX.find(
      c => c.zone === o.zone && c.type === 'SALARIE' && c.zone !== 'Prospection',
    )?.nom ?? ''
    const secteur = window.prompt(
      `Transférer « ${o.pdv_nom} » (${o.zone}) à quel commercial de secteur ?`,
      defaut,
    )?.trim()
    if (!secteur) return
    transferer({ ouvertureId: o.id, pdvNom: o.pdv_nom, secteur })
  }

  const maxEtage = entonnoir.etages[0]?.atteint || 1
  const maxCohorte = Math.max(1, ...cohorte.par_mois.map(m => m.ouvertures))

  const kpis = [
    { label: 'Zones en conquête', value: String(synthese.zones_en_conquete), color: 'text-slate-800' },
    { label: 'Recensement', value: `${synthese.couverture_recensement_pct}%`, color: 'text-sky-700' },
    { label: 'Prospects actifs', value: String(synthese.prospects_actifs), color: 'text-indigo-700' },
    { label: 'Dossiers bloqués', value: String(synthese.prospects_bloques), color: 'text-amber-700' },
    { label: 'Réachat M+1', value: `${cohorte.reachat_m1_pct}%`, color: cohorte.reachat_m1_pct >= 60 ? 'text-emerald-700' : 'text-amber-700' },
    { label: 'Survie M+3', value: `${synthese.survie_m3_pct}%`, color: synthese.survie_m3_pct >= 70 ? 'text-emerald-700' : 'text-red-600' },
    { label: 'PDV orphelins', value: String(synthese.orphelins), color: 'text-red-600' },
    {
      label: 'Valeur nette',
      value: `${synthese.valeur_nette < 0 ? '−' : ''}${formatFcfa(Math.abs(synthese.valeur_nette))}`,
      color: synthese.valeur_nette >= 0 ? 'text-emerald-700' : 'text-red-600',
    },
    { label: 'Alertes critiques', value: String(synthese.alertes_critiques), color: 'text-red-600' },
  ]

  return (
    <div className="p-6 max-w-7xl space-y-4">
      <PageHeader
        title="Conquête & Territoires"
        subtitle="Recenser une zone blanche · qualifier · convertir en 1ʳᵉ commande · passer la main"
        badge="Prospection"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-9 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{k.label}</p>
            <p className={cn('text-lg font-black mt-1', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {synthese.valeur_nette < 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 flex items-start gap-2">
          <TrendingDown size={15} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-xs text-red-900">
            <strong>Le portefeuille d&apos;ouvertures détruit de la valeur.</strong> {formatFcfa(cohorte.marge_cumulee_total)} F
            de marge cumulée, contre {formatFcfa(cohorte.cout_acquisition_total)} F de coût d&apos;acquisition
            et {formatFcfa(cohorte.montant_impaye)} F d&apos;impayés. Un compte ouvert n&apos;est pas un compte gagné.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {VUE_TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} type="button" onClick={() => setVue(t.id)}
              className={cn('flex items-center gap-1.5 text-[11px] px-4 py-2 rounded-lg font-semibold transition-colors',
                vue === t.id ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
              <Icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="grid xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-4">
          {/* ── Territoires ─────────────────────────────────────────────── */}
          {vue === 'territoires' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 flex-wrap">
                  <MapPin size={14} className="text-sky-600" />
                  <span className="text-xs font-semibold text-slate-700">Territoires & recensement terrain</span>
                  <span className="text-[10px] text-slate-400">
                    {zones.length} zone{zones.length > 1 ? 's' : ''} · {recensement.length} commerce{recensement.length > 1 ? 's' : ''} recensé{recensement.length > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModeRecensement(m => !m)}
                    className={cn(
                      'ml-auto flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors',
                      modeRecensement
                        ? 'bg-sky-600 text-white hover:bg-sky-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    <Crosshair size={13} />
                    {modeRecensement ? 'Mode recensement actif' : 'Activer le recensement'}
                  </button>
                </div>
                {modeRecensement && (
                  <p className="px-4 py-2 text-[11px] text-sky-800 bg-sky-50/70 border-b border-sky-100">
                    Tapez un point sur la carte pour créer un prospect géolocalisé à cet endroit.
                  </p>
                )}
                <div className={cn('h-[340px]', modeRecensement && 'cursor-crosshair')}>
                  <CarteRecensement
                    markers={carteMarkers}
                    selectedId={selectedZoneId}
                    onSelect={handleSelectMarker}
                    onMapClick={modeRecensement ? handleMapClick : undefined}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-400 uppercase tracking-wide">Zones :</span>
                  {([
                    ['EN_CONQUETE', 'En conquête'],
                    ['RECENSEMENT_EN_COURS', 'Recensement'],
                    ['A_RECENSER', 'À recenser'],
                    ['COUVERTE', 'Couverte'],
                    ['ABANDONNEE', 'Abandonnée'],
                  ] as [StatutZone, string][]).map(([statut, label]) => (
                    <span key={statut} className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_ZONE_COULEUR[statut] }} />
                      {label}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />Commerce recensé
                  </span>
                </div>
                {recensement.length > 0 && (
                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border-t border-slate-100">
                    {recensement.map(p => (
                      <div key={p.id} className="flex items-center gap-2 px-4 py-2">
                        <MapPin size={12} className="text-sky-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{p.nom}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {p.type_commerce ? `${p.type_commerce} · ` : ''}
                            {p.lat.toFixed(4)}, {p.lng.toFixed(4)} · {p.commercial}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => supprimer(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                          title="Retirer ce prospect recensé"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {zones.map(z => {
                const couverture = z.pdv_estimes > 0 ? Math.round((z.pdv_recenses / z.pdv_estimes) * 100) : 0
                const conversion = z.pdv_recenses > 0 ? Math.round((z.pdv_ouverts / z.pdv_recenses) * 100) : 0
                const tropLoin = z.distance_depot_km > REGLES_CONQUETE.distance_max_rentable_km
                const style = STATUT_ZONE_STYLE[z.statut]
                return (
                  <div key={z.id}
                    onClick={() => setSelectedZoneId(prev => (prev === z.id ? null : z.id))}
                    className={cn('bg-white rounded-xl border p-4 shadow-sm cursor-pointer transition-colors hover:border-slate-300',
                      z.statut === 'ABANDONNEE' && 'opacity-70',
                      selectedZoneId === z.id ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200')}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{z.zone}</h3>
                          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', style.badge)}>{style.label}</span>
                          {tropLoin && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                              {z.distance_depot_km} km &gt; seuil
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {z.distance_depot_km} km du dépôt · desserte {formatFcfa(z.cout_service_mois)} F/mois ·
                          potentiel {formatFcfa(z.potentiel_ca_mois)} F/mois
                          {z.concurrent_installe ? ` · concurrent : ${z.concurrent_installe}` : ' · aucun concurrent installé'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Recensement</span>
                          <span className="text-[11px] font-bold text-slate-700 tabular-nums">{z.pdv_recenses}/{z.pdv_estimes}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, couverture)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Conversion</span>
                          <span className="text-[11px] font-bold text-slate-700 tabular-nums">{z.pdv_ouverts}/{z.pdv_recenses}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={cn('h-full rounded-full', conversion >= 20 ? 'bg-emerald-500' : 'bg-amber-500')}
                            style={{ width: `${Math.min(100, conversion * 3)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Poids desserte</span>
                          <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                            {Math.round((z.cout_service_mois / z.potentiel_ca_mois) * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={cn('h-full rounded-full',
                            z.cout_service_mois / z.potentiel_ca_mois > 0.15 ? 'bg-red-500' : 'bg-emerald-500')}
                            style={{ width: `${Math.min(100, (z.cout_service_mois / z.potentiel_ca_mois) * 400)}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                      <AiBadge variant="small" />
                      <p className="text-xs text-slate-600 flex-1">{z.synthese_ia}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Carnet de prospects ─────────────────────────────────────── */}
          {vue === 'prospects' && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Entonnoir de conquête</h3>
                  <AiBadge variant="small" label="goulot détecté" />
                </div>
                <div className="space-y-2">
                  {entonnoir.etages.map(e => (
                    <div key={e.etape} className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-slate-500 w-28 shrink-0">{e.label}</span>
                      <div className="flex-1 h-6 rounded-md bg-slate-100 overflow-hidden relative">
                        <div className={cn('h-full rounded-md transition-all',
                          entonnoir.goulot?.etape === e.etape ? 'bg-red-400' : 'bg-indigo-400')}
                          style={{ width: `${Math.max(4, (e.atteint / maxEtage) * 100)}%` }} />
                        <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-bold text-white">
                          {e.atteint}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 tabular-nums w-10 text-right">{e.pct_du_recense}%</span>
                      <span className="text-[11px] font-semibold text-sky-600 tabular-nums w-16 text-right"
                        title="Dossiers actuellement sur cette étape">
                        {e.en_cours > 0 ? `${e.en_cours} en cours` : '—'}
                      </span>
                      <span className={cn('text-[11px] font-bold tabular-nums w-16 text-right',
                        e.bloques > 0 ? 'text-red-500' : 'text-slate-300')}
                        title="Dossiers immobiles depuis plus de 21 jours">
                        {e.bloques > 0 ? `${e.bloques} bloqué${e.bloques > 1 ? 's' : ''}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
                {entonnoir.goulot && (
                  <p className="text-xs text-red-800 bg-red-50 rounded-lg p-2.5 mt-3">
                    <strong>Goulot : « {entonnoir.goulot.label} »</strong> — {entonnoir.goulot.bloques} dossier
                    {entonnoir.goulot.bloques > 1 ? 's' : ''} y stagne{entonnoir.goulot.bloques > 1 ? 'nt' : ''} depuis
                    plus de {REGLES_CONQUETE.jours_max_sans_contact} jours. Le carnet ne manque pas de commerces :
                    il manque de relances.
                  </p>
                )}
                {entonnoir.motifs_perte.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      {entonnoir.perdus} dossiers perdus — par motif
                    </p>
                    <div className="space-y-1.5">
                      {entonnoir.motifs_perte.map(m => (
                        <div key={m.motif} className="flex items-start gap-2 text-xs">
                          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                            m.evitable ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600')}>
                            {m.evitable ? 'évitable' : 'structurel'}
                          </span>
                          <span className="text-slate-600 flex-1">{m.motif}</span>
                          <span className="text-slate-400 font-bold tabular-nums">×{m.nombre}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Carnet de terrain — {prospects.length} commerces</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Un prospect n&apos;est pas encore un point de vente : surface, achalandage, capacité de paiement.
                  </p>
                </div>
                {prospects.map(p => (
                  <ProspectRow key={p.id} p={p} actif={selectedProspect?.id === p.id}
                    onSelect={() => setSelectedProspect(selectedProspect?.id === p.id ? null : p)} />
                ))}
              </div>
            </>
          )}

          {/* ── Ouvertures & survie ─────────────────────────────────────── */}
          {vue === 'survie' && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900">Survie des ouvertures par cohorte</h3>
                  <AiBadge variant="small" />
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  La seule mesure honnête du poste : un PDV ouvert qui ne recommande pas à M+3 n&apos;a rien rapporté —
                  il a coûté son acquisition. Cohortes de moins de 3 mois : verdict en attente.
                </p>
                <div className="flex items-stretch gap-2 h-40">
                  {cohorte.par_mois.map(m => (
                    <div key={m.mois} className="flex-1 flex flex-col items-center">
                      <div className="flex-1 w-full flex items-end min-h-0">
                        <div
                          className="w-full flex flex-col-reverse gap-0.5 rounded-sm overflow-hidden"
                          style={{ height: `${Math.max(m.ouvertures > 0 ? 6 : 0, (m.ouvertures / maxCohorte) * 100)}%` }}
                        >
                          {m.vivants > 0 && <div className="w-full bg-emerald-400" style={{ flexGrow: m.vivants }} title={`${m.vivants} vivants`} />}
                          {m.dormants > 0 && <div className="w-full bg-amber-400" style={{ flexGrow: m.dormants }} title={`${m.dormants} dormants`} />}
                          {m.morts > 0 && <div className="w-full bg-slate-300" style={{ flexGrow: m.morts }} title={`${m.morts} morts`} />}
                          {m.impayes > 0 && <div className="w-full bg-red-500" style={{ flexGrow: m.impayes }} title={`${m.impayes} impayés`} />}
                        </div>
                      </div>
                      <span className="mt-1.5 text-[10px] font-bold text-slate-500">{m.mois}</span>
                      <span className={cn('text-[9px] font-bold tabular-nums',
                        m.survie_m3_pct === null ? 'text-slate-300'
                          : m.survie_m3_pct >= 70 ? 'text-emerald-600' : 'text-red-500')}>
                        {m.survie_m3_pct === null ? '—' : `${m.survie_m3_pct}%`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                  {[
                    ['bg-emerald-400', 'Vivant'], ['bg-amber-400', 'Dormant'],
                    ['bg-slate-300', 'Mort'], ['bg-red-500', 'Impayé'],
                  ].map(([c, l]) => (
                    <span key={l} className="inline-flex items-center gap-1.5">
                      <span className={cn('w-2.5 h-2.5 rounded-sm', c)} />{l}
                    </span>
                  ))}
                  <span className="ml-auto font-bold text-slate-600">
                    Survie M+3 : {cohorte.vivants_m3}/{cohorte.evaluables_m3} ouvertures jugeables — {cohorte.survie_m3_pct} %
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Détail des {ouverturesVue.length} ouvertures</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="text-left font-bold px-4 py-2">Point de vente</th>
                        <th className="text-left font-bold px-2 py-2">Ouvert</th>
                        <th className="text-right font-bold px-2 py-2">1ʳᵉ cmd</th>
                        <th className="text-left font-bold px-2 py-2">Conditions</th>
                        <th className="text-center font-bold px-2 py-2">M+1</th>
                        <th className="text-center font-bold px-2 py-2">M+3</th>
                        <th className="text-right font-bold px-2 py-2">Valeur nette</th>
                        <th className="text-left font-bold px-2 py-2">Transféré à</th>
                        <th className="text-left font-bold px-4 py-2">Santé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ouverturesVue.map(o => {
                        const net = o.marge_cumulee - o.cout_acquisition - o.impaye_fcfa
                        return (
                          <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{o.pdv_nom}</td>
                            <td className="px-2 py-2.5 text-slate-400">{o.mois_ouverture}</td>
                            <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">{formatFcfa(o.ca_1re_commande)}</td>
                            <td className="px-2 py-2.5">
                              <span className={cn('text-[10px] font-medium',
                                o.conditions_1re_commande === 'COMPTANT' ? 'text-slate-500' : 'text-amber-700')}>
                                {CAPACITE_LABEL[o.conditions_1re_commande]}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 text-center">{o.reachat_m1 ? '✓' : <span className="text-red-400">✕</span>}</td>
                            <td className="px-2 py-2.5 text-center">
                              {o.reachat_m3 === null ? <span className="text-slate-300">—</span>
                                : o.reachat_m3 ? '✓' : <span className="text-red-400">✕</span>}
                            </td>
                            <td className={cn('px-2 py-2.5 text-right tabular-nums font-bold',
                              net >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                              {net < 0 ? '−' : ''}{formatFcfa(Math.abs(net))}
                            </td>
                            <td className="px-2 py-2.5">
                              {o.transfere_a
                                ? <span className="text-[11px] text-slate-600">{o.transfere_a}</span>
                                : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Non assigné</span>}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', SANTE_STYLE[o.sante])}>
                                {SANTE_LABEL[o.sante]}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Passation ───────────────────────────────────────────────── */}
          {vue === 'passation' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Handshake size={15} className="text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    File de passation — {passation.length} PDV sans commercial de secteur
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Le prospecteur ouvre, le commercial de secteur entretient. Tant que le transfert n&apos;est pas fait,
                  le PDV n&apos;entre dans aucune tournée — délai cible : {REGLES_CONQUETE.jours_max_avant_passation} j.
                </p>
              </div>
              {passation.length === 0 ? (
                <p className="text-xs text-slate-400 p-4">Aucun PDV en attente de transfert.</p>
              ) : passation.map(o => (
                <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Store size={14} className={o.orphelin ? 'text-red-500 shrink-0' : 'text-slate-400 shrink-0'} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{o.pdv_nom}</p>
                      <p className="text-[11px] text-slate-400">
                        {o.zone} · ouvert il y a {o.jours_depuis_ouverture} j · marge cumulée {formatFcfa(o.marge_cumulee)} F
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', SANTE_STYLE[o.sante])}>
                      {SANTE_LABEL[o.sante]}
                    </span>
                    {o.orphelin ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        orphelin · +{o.jours_de_retard} j
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        {REGLES_CONQUETE.jours_max_avant_passation - o.jours_depuis_ouverture} j restants
                      </span>
                    )}
                    <button type="button"
                      onClick={() => handleTransferer(o)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors">
                      Transférer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Colonne latérale ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {selectedZone && (
            <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: STATUT_ZONE_COULEUR[selectedZone.statut] }} />
                  <h3 className="text-sm font-bold text-slate-900">{selectedZone.zone}</h3>
                </div>
                <button type="button" onClick={() => setSelectedZoneId(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600">fermer</button>
              </div>
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', STATUT_ZONE_STYLE[selectedZone.statut].badge)}>
                {STATUT_ZONE_STYLE[selectedZone.statut].label}
              </span>
              <dl className="space-y-1.5 text-xs mt-3">
                {[
                  ['Recensement', `${selectedZone.pdv_recenses}/${selectedZone.pdv_estimes} commerces`],
                  ['Ouverts', String(selectedZone.pdv_ouverts)],
                  ['Distance dépôt', `${selectedZone.distance_depot_km} km`],
                  ['Coût desserte', `${formatFcfa(selectedZone.cout_service_mois)} F/mois`],
                  ['Potentiel', `${formatFcfa(selectedZone.potentiel_ca_mois)} F/mois`],
                  ['Concurrent', selectedZone.concurrent_installe ?? 'Aucun'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-slate-400">{k}</dt>
                    <dd className="font-medium text-slate-700 text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <AiBadge variant="small" />
                </div>
                <p className="text-xs text-emerald-900">{selectedZone.synthese_ia}</p>
              </div>
            </div>
          )}
          {selectedProspect ? (
            <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-900">{selectedProspect.nom}</h3>
                <button type="button" onClick={() => setSelectedProspect(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600">fermer</button>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                {ETAPE_LABEL[selectedProspect.etape]} · {selectedProspect.jours_dans_etape} j · {selectedProspect.zone}
              </p>
              <dl className="space-y-1.5 text-xs">
                {[
                  ['Type', selectedProspect.type_commerce],
                  ['Surface', `${selectedProspect.surface_m2} m²`],
                  ['Achalandage', `${selectedProspect.achalandage_jour} passages/j`],
                  ['CA estimé', `${formatFcfa(selectedProspect.ca_estime_mois)} F/mois`],
                  ['Paiement', CAPACITE_LABEL[selectedProspect.capacite_paiement]],
                  ['Distance dépôt', `${selectedProspect.distance_depot_km} km`],
                  ['Concurrent', selectedProspect.concurrent_fournisseur ?? 'Aucun'],
                  ['Dernier contact', selectedProspect.dernier_contact],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-slate-400">{k}</dt>
                    <dd className="font-medium text-slate-700 text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              {selectedProspect.motif_blocage && (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1">Blocage</p>
                  <p className="text-xs text-amber-900">{selectedProspect.motif_blocage}</p>
                </div>
              )}
              {selectedProspect.motif_perte && (
                <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Motif de perte</p>
                  <p className="text-xs text-slate-700">{selectedProspect.motif_perte}</p>
                </div>
              )}
              <div className="mt-3 rounded-lg bg-indigo-50 border border-indigo-200 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <AiBadge variant="small" />
                </div>
                <p className="text-xs text-indigo-900">{selectedProspect.synthese_ia}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5">
                <ArrowRight size={12} className="text-slate-400 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-slate-800">{selectedProspect.prochaine_action}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={14} className="text-slate-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Garde-fous</h3>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600">
                <li>· 1ʳᵉ commande à crédit plafonnée à {formatFcfa(REGLES_CONQUETE.plafond_credit_1re_commande)} F</li>
                <li>· Au-delà de {REGLES_CONQUETE.distance_max_rentable_km} km, la desserte mange la marge</li>
                <li>· Un dossier sans contact depuis {REGLES_CONQUETE.jours_max_sans_contact} j est en train de mourir</li>
                <li>· Passation au secteur sous {REGLES_CONQUETE.jours_max_avant_passation} j après l&apos;ouverture</li>
              </ul>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-red-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Règles franchies · {alertes.length}
              </h3>
            </div>
            {alertes.map(a => <AlerteCard key={a.id} alerte={a} />)}
          </div>
        </div>
      </div>

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
