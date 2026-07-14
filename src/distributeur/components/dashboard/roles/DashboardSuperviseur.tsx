'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { Route, Clock, Banknote, ArrowRight } from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { PerformancePostePanel } from '@distributeur/components/dashboard/PerformancePostePanel'
import { ValidationsPanel } from '@distributeur/components/validations/ValidationsPanel'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useHubContext } from '@distributeur/lib/use-hub-context'
import { getDashboardHub } from '@distributeur/lib/mock-distribution'
import { getPerimetre } from '@distributeur/lib/perimetre'
import { buildTournees } from '@distributeur/lib/tournees-builder'
import { cn, formatFcfa } from '@distributeur/lib/utils'

/**
 * Le superviseur ouvre sa journée sur trois choses : ce qu'il doit arbitrer
 * maintenant, où en sont ses tournées, et quels PDV de SA zone décrochent.
 * Aucun agrégat réseau — ce n'est pas son périmètre.
 */
export function DashboardSuperviseur() {
  const { user } = useAuth()
  const ctx = useHubContext()
  const perimetre = useMemo(() => getPerimetre(user ?? undefined), [user])
  const { pdv } = getDashboardHub(ctx)
  const tournees = useMemo(() => buildTournees(perimetre), [perimetre])

  const nonVisites = [...pdv.points]
    .filter(p => p.derniere_commande && p.derniere_commande !== '—')
    .sort((a, b) => a.derniere_commande.localeCompare(b.derniere_commande))
    .slice(0, 6)

  const ecart = Math.abs(tournees.ecart_caisse_total)

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Supervision de zone"
        subtitle={`${perimetre.libelle} — ${perimetre.equipe.length} commerciaux · ${pdv.total} points de vente`}
        badge="Temps réel"
      />

      <PerformancePostePanel role="SUPERVISEUR" />

      <div className="grid lg:grid-cols-2 gap-4">
        <ValidationsPanel niveau="SUPERVISEUR" zones={perimetre.zones} compact />

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Route size={15} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-900">Tournées du jour</h3>
              <Link href="/distributeur/tournees" className="ml-auto text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5">
                Ouvrir <ArrowRight size={10} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Couverture PJP" value={`${tournees.couverture_pjp} %`} bon={tournees.couverture_pjp >= 95} />
              <Stat label="Strike rate" value={`${tournees.strike_rate} %`} bon={tournees.strike_rate >= 50} />
              <Stat
                label="Écart de caisse"
                value={ecart === 0 ? '0 F' : `−${formatFcfa(ecart)} F`}
                bon={ecart === 0}
              />
            </div>

            {tournees.commerciaux_en_ecart > 0 && (
              <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-2">
                <Banknote size={12} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-900">
                  <strong>{tournees.commerciaux_en_ecart} commercial(aux) en écart de caisse.</strong>{' '}
                  Rapprochement des reçus terrain à faire avant la remise du soir.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">PDV les plus anciens sans commande</h3>
              <AiBadge variant="small" />
            </div>
            {nonVisites.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Aucun PDV en retard de commande.</p>
            ) : (
              <div className="space-y-1">
                {nonVisites.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800">{p.nom}</span>
                      <span className="text-slate-400 ml-2">{p.commercial}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-500">{p.derniere_commande}</span>
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        p.score_ia >= 70 ? 'bg-emerald-100 text-emerald-700'
                          : p.score_ia >= 40 ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700',
                      )}>
                        score {p.score_ia}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, bon }: { label: string; value: string; bon: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2.5">
      <div className={cn('text-lg font-black tabular-nums', bon ? 'text-emerald-600' : 'text-red-600')}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
