'use client'
import Link from 'next/link'
import { useMemo } from 'react'
import { MapPin, ShoppingCart, Target, Clock, Navigation, ArrowRight, AlertTriangle } from 'lucide-react'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PerformancePostePanel } from '@/components/dashboard/PerformancePostePanel'
import { useAuth } from '@/contexts/AuthContext'
import { useHubContext } from '@/lib/use-hub-context'
import { getTourneeHub, DATE_AUJOURDHUI, MOTIF_VISITE_STYLE, STATUT_VISITE_STYLE } from '@/lib/tournee-hub'
import { getPdvHub } from '@/lib/pdv-hub'
import { formatFcfa } from '@/lib/utils'

export function DashboardCommercial() {
  const { user } = useAuth()
  const ctx = useHubContext()
  const hub = useMemo(() => getTourneeHub(ctx), [ctx])
  const { points: mesPdv } = useMemo(() => getPdvHub(ctx), [ctx])

  const stats = hub.statsJour(DATE_AUJOURDHUI)
  const restantes = hub.aujourdhui.filter(v => v.statut !== 'FAITE').length
  const prochaine = hub.prochaineVisite
  const impayes = hub.aujourdhui.filter(v => v.motif === 'RELANCE_IMPAYE' && v.statut !== 'FAITE')

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title={`Bonjour ${user?.nom?.split(' ')[0]}`}
        subtitle={`Tournée du jour — ${user?.zone}`}
        badge="Mode offline OK"
      />

      <PerformancePostePanel role="COMMERCIAL" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Visites aujourd'hui"
          value={`${stats.visites_faites} / ${stats.visites_planifiees}`}
          sub={restantes > 0 ? `${restantes} arrêt(s) restants` : 'Tournée terminée ✓'}
          icon={MapPin}
          trend={restantes === 0 ? 'up' : 'neutral'}
        />
        <KpiCard
          label="Commandes prises"
          value={String(stats.commandes)}
          sub={`${stats.taux_reussite_pct}% de transformation`}
          icon={ShoppingCart}
          accent="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="CA généré"
          value={`${formatFcfa(stats.ca_genere)} F`}
          icon={Target}
          trend="up"
        />
        <KpiCard
          label="Prochaine visite"
          value={prochaine?.heure ?? '—'}
          sub={prochaine?.pdv_nom ?? 'Plus rien de prévu'}
          icon={Clock}
          accent="bg-violet-50 text-violet-600"
        />
      </div>

      {impayes.length > 0 && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>{impayes.length} relance(s) impayé à traiter dans la tournée</strong> — {impayes.map(v => v.pdv_nom).join(', ')}.
            Ces arrêts passent en tête : on encaisse avant de reprendre une commande.
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Ma tournée du jour</h3>
            <Link href="/mon-activite" className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700">
              Voir l&apos;agenda <ArrowRight size={12} />
            </Link>
          </div>

          {hub.aujourdhui.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">Aucune visite planifiée aujourd&apos;hui.</div>
          ) : (
            hub.aujourdhui.map(v => {
              const motif = MOTIF_VISITE_STYLE[v.motif]
              const statut = STATUT_VISITE_STYLE[v.statut]
              return (
                <div key={v.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-400 w-10 shrink-0">{v.heure}</span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${motif.dot}`} />
                  <span className="flex-1 min-w-0 text-sm font-medium text-slate-900 truncate">{v.pdv_nom}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${motif.className}`}>{motif.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ring-1 ring-inset shrink-0 ${statut.className}`}>{statut.label}</span>
                </div>
              )
            })
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
            <div className="flex items-center gap-1.5 font-semibold mb-1">
              <Navigation size={14} /> Tournée IA optimisée
            </div>
            {hub.aujourdhui.length} arrêts ordonnés par priorité et proximité
            {impayes.length > 0 ? `, dont ${impayes.length} relance(s) impayé` : ''}.
            Vous suivez {mesPdv.length} points de vente au total.
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold mb-1 text-slate-800">Encaissé sur le terrain</h3>
            <div className="text-2xl font-bold text-slate-900">{formatFcfa(stats.encaisse)} F</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Créances soldées pendant vos visites du jour</div>
          </div>
        </div>
      </div>
    </div>
  )
}
