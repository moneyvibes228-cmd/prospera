'use client'
import { useMemo } from 'react'
import { Target, TrendingDown, TrendingUp, Percent, Network, Scale } from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { KpiCard } from '@distributeur/components/shared/KpiCard'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { getPerimetre } from '@distributeur/lib/perimetre'
import { buildObjectifs, type ZoneObjectif } from '@distributeur/lib/objectifs-builder'
import { cn, formatFcfa } from '@distributeur/lib/utils'

const STATUT_STYLE: Record<ZoneObjectif['statut'], { label: string; cls: string }> = {
  TIENT: { label: 'Tient', cls: 'bg-emerald-100 text-emerald-700' },
  JUSTE: { label: 'Juste', cls: 'bg-amber-100 text-amber-700' },
  DECROCHE: { label: 'Décroche', cls: 'bg-red-100 text-red-700' },
}

/**
 * Écran de résultat du Responsable des Ventes : l'atterrissage au quota,
 * l'allocation par zone et le mix de marge. Il pilote par zone — via ses
 * superviseurs — et jamais par commercial : ce n'est pas son niveau.
 */
export function ObjectifsView() {
  const { user } = useAuth()
  const perimetre = useMemo(() => getPerimetre(user ?? undefined), [user])
  const hub = useMemo(() => buildObjectifs(perimetre), [perimetre])

  const rentre = hub.ecart_projete >= 0

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Objectifs & Quotas"
        subtitle={`${perimetre.libelle} — atterrissage, allocation par zone et mix de marge`}
        badge="Mois en cours"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={Target}
          label="Réalisé / quota région"
          value={`${hub.atteinte_pct} %`}
          sub={`${formatFcfa(hub.ca_realise)} F sur ${formatFcfa(hub.quota)} F`}
          trend={hub.atteinte_pct >= 42 ? 'up' : 'down'}
          accent="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={rentre ? TrendingUp : TrendingDown}
          label="Atterrissage projeté"
          value={`${formatFcfa(hub.atterrissage)} F`}
          sub={rentre
            ? `+${formatFcfa(hub.ecart_projete)} F au-dessus du quota`
            : `−${formatFcfa(Math.abs(hub.ecart_projete))} F sous le quota`}
          trend={rentre ? 'up' : 'down'}
          accent={rentre ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
        />
        <KpiCard
          icon={Percent}
          label="Marge du mix"
          value={`${hub.marge_mix_pct} %`}
          sub={`Cible ${hub.marge_cible_pct} % — arbitrée sur les familles`}
          trend={hub.marge_mix_pct >= hub.marge_cible_pct ? 'up' : 'down'}
          accent="bg-violet-50 text-violet-600"
        />
        <KpiCard
          icon={Network}
          label="Distribution numérique"
          value={`${hub.dn_pct} %`}
          sub={`PDV ayant commandé ce mois · ${hub.effectif} commerciaux`}
          trend={hub.dn_pct >= 75 ? 'up' : 'down'}
          accent="bg-teal-50 text-teal-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Scale size={15} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Allocation par zone</h3>
          <span className="text-[10px] text-slate-400 ml-auto">Trié par écart projeté</span>
        </div>
        <p className="text-[10px] text-slate-400 mb-3">
          Vous pilotez par zone, via vos superviseurs. Le détail commercial par commercial appartient à leur niveau.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-bold">Zone / superviseur</th>
                <th className="pb-2 font-bold text-right">Réalisé</th>
                <th className="pb-2 font-bold text-right">Quota</th>
                <th className="pb-2 font-bold text-right">Atterrissage</th>
                <th className="pb-2 font-bold text-right">Rythme req. / j</th>
                <th className="pb-2 font-bold text-right">DN</th>
                <th className="pb-2 font-bold text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {hub.zones.map(z => (
                <tr key={z.zone.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: z.zone.color }} />
                      <div>
                        <div className="font-medium text-slate-800">{z.zone.nom}</div>
                        <div className="text-[10px] text-slate-400">
                          {z.superviseur} · {z.effectif} commerciaux
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-slate-700">
                    {formatFcfa(z.ca_realise)} F
                    <div className="text-[10px] text-slate-400">{z.atteinte_pct} %</div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-slate-500">{formatFcfa(z.quota)} F</td>
                  <td className="py-2.5 text-right tabular-nums">
                    <span className="font-bold text-slate-800">{formatFcfa(z.atterrissage)} F</span>
                    <div className={cn('text-[10px] font-bold', z.ecart_projete >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {z.ecart_projete >= 0 ? '+' : '−'}{formatFcfa(Math.abs(z.ecart_projete))} F
                    </div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    <span className="font-bold text-slate-700">{formatFcfa(z.rythme_requis_jour)} F</span>
                    <div className="text-[10px] text-slate-400">tenu : {formatFcfa(z.rythme_actuel_jour)} F</div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    <span className={cn('font-bold', z.dn_pct >= 75 ? 'text-emerald-600' : 'text-amber-600')}>
                      {z.dn_pct} %
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', STATUT_STYLE[z.statut].cls)}>
                      {STATUT_STYLE[z.statut].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Mix produit et marge</h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Part réalisée vs part cible. Le volume ne dit rien sans le mix : c&apos;est lui qui fait le mois.
          </p>

          <div className="space-y-3">
            {hub.mix.map(f => {
              const ecart = f.part_pct - f.part_cible_pct
              return (
                <div key={f.famille}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-700 font-medium">{f.famille}</span>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-slate-400">{formatFcfa(f.ca)} F</span>
                      <span className={cn('font-bold w-14 text-right', f.marge_pct >= 16.5 ? 'text-emerald-600' : 'text-red-600')}>
                        {f.marge_pct} %
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', ecart > 2 && f.marge_pct < 16.5 ? 'bg-red-400' : 'bg-blue-500')}
                      style={{ width: `${f.part_pct}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-slate-900"
                      style={{ left: `${f.part_cible_pct}%` }}
                      title={`Cible ${f.part_cible_pct} %`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {f.part_pct} % du CA · cible {f.part_cible_pct} %
                    {ecart > 2 && f.marge_pct < 16.5 && (
                      <span className="text-red-500 font-bold"> · sur-représentée et peu margée</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-indigo-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={15} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Arbitrages à rendre</h3>
            <AiBadge variant="small" />
          </div>

          {hub.arbitrages.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Toutes les zones atterrissent au quota.</p>
          ) : (
            <div className="space-y-2.5">
              {hub.arbitrages.map(a => (
                <div key={a.priorite} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-black w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center">
                      {a.priorite}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{a.titre}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{a.constat}</p>
                  <p className="text-[11px] text-indigo-800 mt-1.5 font-medium">→ {a.levier}</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">{a.impact}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
