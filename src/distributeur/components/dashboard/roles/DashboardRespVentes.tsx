'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { Target, TrendingDown, TrendingUp, ArrowRight, Users } from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { PerformancePostePanel } from '@distributeur/components/dashboard/PerformancePostePanel'
import { ValidationsPanel } from '@distributeur/components/validations/ValidationsPanel'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useHubContext } from '@distributeur/lib/use-hub-context'
import { getDashboardHub } from '@distributeur/lib/mock-distribution'
import { getPerimetre } from '@distributeur/lib/perimetre'
import { buildObjectifs } from '@distributeur/lib/objectifs-builder'
import { cn, formatFcfa } from '@distributeur/lib/utils'

/**
 * Le responsable des ventes ouvre sa journée sur l'atterrissage de sa région
 * et sur les zones qui décrochent — pas sur les visites du jour. Il pilote
 * par zone, à travers ses superviseurs, et tranche ce qu'ils font remonter.
 */
export function DashboardRespVentes() {
  const { user } = useAuth()
  const ctx = useHubContext()
  const perimetre = useMemo(() => getPerimetre(user ?? undefined), [user])
  const objectifs = useMemo(() => buildObjectifs(perimetre), [perimetre])
  const { commerciaux } = getDashboardHub(ctx)

  const rentre = objectifs.ecart_projete >= 0
  const decrochent = objectifs.zones.filter(z => z.statut !== 'TIENT')

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Pilotage des ventes"
        subtitle={`${perimetre.libelle} — ${objectifs.zones.length} zones · ${commerciaux.commerciaux.length} commerciaux`}
        badge="Mois en cours"
      />

      <PerformancePostePanel role="RESP_VENTES" />

      <div className={cn(
        'rounded-xl border p-4 mb-4',
        rentre ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60',
      )}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {rentre ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-red-600" />}
              <h3 className="text-sm font-bold text-slate-900">
                {rentre ? 'La région atterrit au quota' : 'La région n’atterrit pas au quota'}
              </h3>
            </div>
            <p className="text-xs text-slate-700 mt-1.5">
              Atterrissage projeté <strong>{formatFcfa(objectifs.atterrissage)} F</strong> pour un quota de{' '}
              <strong>{formatFcfa(objectifs.quota)} F</strong> —{' '}
              <strong className={rentre ? 'text-emerald-700' : 'text-red-700'}>
                {rentre ? '+' : '−'}{formatFcfa(Math.abs(objectifs.ecart_projete))} F
              </strong>
              {decrochent.length > 0 && ` · ${decrochent.length} zone(s) sous quota`}
            </p>
          </div>
          <Link href="/distributeur/objectifs" className="shrink-0 text-[10px] font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
            Objectifs & Quotas <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Mes zones</h3>
            <span className="text-[10px] text-slate-400 ml-auto">Par écart projeté</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Chaque zone a un superviseur responsable de son exécution.
          </p>

          <div className="space-y-1">
            {objectifs.zones.map(z => (
              <div key={z.zone.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: z.zone.color }} />
                  <div>
                    <div className="font-medium text-slate-800">{z.zone.nom}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Users size={9} /> {z.superviseur} · {z.effectif} comm.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 tabular-nums">
                  <span className="text-slate-500">{formatFcfa(z.ca_realise)} F</span>
                  <span className={cn(
                    'font-bold w-16 text-right',
                    z.ecart_projete >= 0 ? 'text-emerald-600' : 'text-red-600',
                  )}>
                    {z.ecart_projete >= 0 ? '+' : '−'}{formatFcfa(Math.abs(z.ecart_projete))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ValidationsPanel niveau="RESP_VENTES" zones={perimetre.zones} compact />
      </div>
    </div>
  )
}
