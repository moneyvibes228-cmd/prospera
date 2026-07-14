'use client'
import Link from 'next/link'
import { useMemo } from 'react'
import { MapPin, ShoppingCart, TrendingUp, Wallet, ArrowRight, Clock, AlertTriangle } from 'lucide-react'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PerformancePostePanel } from '@/components/dashboard/PerformancePostePanel'
import { useAuth } from '@/contexts/AuthContext'
import { getCommandesHub, getPdvHub } from '@/lib/mock-distribution'
import { useHubContext } from '@/lib/use-hub-context'
import { getTourneeHub, DATE_AUJOURDHUI, MOTIF_VISITE_STYLE, STATUT_VISITE_STYLE } from '@/lib/tournee-hub'
import { formatFcfa } from '@/lib/utils'

export function DashboardFreelance() {
  const { user } = useAuth()
  const ctx = useHubContext()
  const { commandes: mesCommandes, caSociete, caClient, margeFreelance: margeJour } = getCommandesHub(ctx)
  const { points: mesPdv } = getPdvHub(ctx)
  const hub = useMemo(() => getTourneeHub(ctx), [ctx])

  const stats = hub.statsJour(DATE_AUJOURDHUI)
  const prochaine = hub.prochaineVisite

  // Le freelance porte lui-même le risque client : son encours est son problème, pas celui du siège.
  const encours = mesPdv.reduce((s, p) => s + p.creance, 0)
  const clientsEnRetard = mesPdv.filter(p => p.creance > 0 && p.creance_jours > 15)

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title={`Bonjour ${user?.nom?.split(' ')[0]}`}
        subtitle="Commercial freelance — votre portefeuille, vos prix client"
        badge="Portefeuille isolé"
      />

      <div className="mb-6 bg-lime-50 border border-lime-200 rounded-xl p-4 text-sm text-lime-900">
        Vous travaillez avec les produits <strong>{user?.entreprise ?? 'la société'}</strong> au tarif grossiste. Les <strong>prix affichés à vos clients</strong> sont les vôtres — la société ne voit pas votre marge.
      </div>

      <PerformancePostePanel role="FREELANCE" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Mes points de vente" value={String(mesPdv.length)} icon={MapPin} accent="bg-lime-50 text-lime-700" />
        <KpiCard label="Commandes du jour" value={String(mesCommandes.length)} icon={ShoppingCart} accent="bg-blue-50 text-blue-600" />
        <KpiCard label="CA client (vos prix)" value={`${formatFcfa(caClient)} F`} icon={TrendingUp} trend="up" />
        <KpiCard label="Ma marge du jour" value={`${formatFcfa(margeJour)} F`} sub={`Coût société : ${formatFcfa(caSociete)} F`} icon={Wallet} accent="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Ma tournée du jour</h3>
              <p className="text-[11px] text-slate-400">
                {stats.visites_faites} / {stats.visites_planifiees} visites faites
                {prochaine && ` · prochain arrêt ${prochaine.heure}`}
              </p>
            </div>
            <Link href="/mon-activite" className="flex items-center gap-1 text-xs font-semibold text-lime-700 hover:text-lime-800">
              Mon agenda <ArrowRight size={12} />
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
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Wallet size={13} />
              <span className="text-xs font-semibold">Mon encours client</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatFcfa(encours)} F</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Ce que vos clients vous doivent — vous portez ce risque, pas la société.
            </div>
          </div>

          {clientsEnRetard.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-1.5 text-red-800 font-semibold text-xs mb-2">
                <AlertTriangle size={13} /> {clientsEnRetard.length} client(s) en retard
              </div>
              {clientsEnRetard.slice(0, 4).map(p => (
                <div key={p.id} className="flex justify-between text-[11px] py-1 text-red-900">
                  <span className="truncate">{p.nom}</span>
                  <span className="font-semibold shrink-0 ml-2">{p.creance_jours} j</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Clock size={13} />
              <span className="text-xs font-semibold">Encaissé aujourd&apos;hui</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatFcfa(stats.encaisse)} F</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold mb-3">Mes clients</h3>
        {mesPdv.map(pdv => (
          <div key={pdv.id} className="flex justify-between text-xs py-2 border-b border-slate-100 last:border-0">
            <span className="font-medium">{pdv.nom}</span>
            <span className="text-slate-500">CA {formatFcfa(pdv.ca_mois)} F</span>
          </div>
        ))}
      </div>
    </div>
  )
}
