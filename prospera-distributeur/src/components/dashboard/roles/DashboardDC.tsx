'use client'
import { Target, MapPin, ShoppingCart, Users } from 'lucide-react'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PerformancePostePanel } from '@/components/dashboard/PerformancePostePanel'
import { getDashboardHub } from '@/lib/mock-distribution'
import { formatFcfa } from '@/lib/utils'

export function DashboardDC() {
  const { entreprise, commandes, commerciaux } = getDashboardHub()

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader title="Pilotage Commercial" subtitle="Objectifs, tournées et performance équipes" badge="Temps réel" />

      <PerformancePostePanel role="DC" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="CA du jour" value={`${formatFcfa(commerciaux.commerciaux.reduce((s, c) => s + c.ca_jour, 0))} F`} icon={Target} trend="up" />
        <KpiCard label="Commandes du jour" value={String(entreprise.commandes_jour)} icon={ShoppingCart} accent="bg-blue-50 text-blue-600" />
        <KpiCard label="Visites terrain" value={String(commerciaux.commerciaux.reduce((s, c) => s + c.visites_jour, 0))} sub="Aujourd'hui" icon={MapPin} accent="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Commerciaux actifs" value={String(entreprise.commerciaux)} icon={Users} accent="bg-violet-50 text-violet-600" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold mb-3">Commandes récentes</h3>
        <div className="space-y-2">
          {commandes.commandes.map(cmd => (
            <div key={cmd.id} className="flex justify-between text-xs py-2 border-b border-slate-100">
              <div>
                <span className="font-mono text-slate-500">{cmd.reference}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="font-medium">{cmd.pdv_nom}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{formatFcfa(cmd.montant_societe)} F</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">{cmd.statut}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
