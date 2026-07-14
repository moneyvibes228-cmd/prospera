'use client'

import { useMemo } from 'react'
import {
  Truck, AlertTriangle, Weight, Box, Route, Banknote, TrendingUp, MapPin,
} from 'lucide-react'
import { cn, formatFcfa } from '@/lib/utils'
import { buildBonsPreparation } from '@/lib/picking-engine'
import { buildPlanExpedition, SEUIL_REMPLISSAGE_RENTABLE } from '@/lib/expedition-engine'

export function ExpeditionPanel({ entrepot }: { entrepot: string }) {
  const bons = useMemo(() => buildBonsPreparation([entrepot]), [entrepot])
  const plan = useMemo(() => buildPlanExpedition(entrepot, bons), [entrepot, bons])

  return (
    <div className="space-y-5">
      {/* Bandeau : ce que coûte la journée de transport */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tournées du jour', value: String(plan.tournees.length), icon: Route, color: 'text-slate-800' },
          {
            label: 'Remplissage moyen',
            value: `${plan.remplissage_moyen_pct} %`,
            icon: Box,
            color: plan.remplissage_moyen_pct >= SEUIL_REMPLISSAGE_RENTABLE ? 'text-emerald-600' : 'text-amber-600',
          },
          { label: 'Coût transport', value: `${formatFcfa(plan.cout_total)} F`, icon: Banknote, color: 'text-slate-800' },
          { label: 'Économisé par regroupement', value: `${formatFcfa(plan.economie_regroupement)} F`, icon: TrendingUp, color: 'text-emerald-600' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <Icon size={11} /> {k.label}
              </div>
              <div className={cn('text-base font-black mt-1', k.color)}>{k.value}</div>
            </div>
          )
        })}
      </div>

      {plan.alertes.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
            <AlertTriangle size={14} /> Arbitrages transport
          </h3>
          <ul className="space-y-1.5">
            {plan.alertes.map((a, i) => (
              <li key={i} className="text-xs text-amber-900/90 flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">•</span> {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tournées */}
      <div className="space-y-3">
        {plan.tournees.map(tournee => (
          <div key={tournee.id} className={cn(
            'rounded-xl border bg-white overflow-hidden',
            tournee.rentable ? 'border-slate-200' : 'border-amber-300',
          )}>
            <div className="p-4 border-b border-slate-100">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    tournee.rentable ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
                  )}>
                    <Truck size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {tournee.camion.immatriculation}
                      <span className="text-[10px] font-medium text-slate-400 ml-2 uppercase">{tournee.camion.type}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {tournee.camion.chauffeur} · départ {tournee.depart} · retour ~{tournee.retour_estime} ·{' '}
                      {tournee.arrets.length} arrêt{tournee.arrets.length > 1 ? 's' : ''} · {tournee.distance_km} km
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={cn(
                    'text-2xl font-black tabular-nums',
                    tournee.rentable ? 'text-emerald-600' : 'text-amber-600',
                  )}>
                    {tournee.remplissage_pct} %
                  </div>
                  <div className="text-[10px] text-slate-400">
                    saturé en {tournee.contrainte_saturante.toLowerCase()}
                  </div>
                </div>
              </div>

              {/* Double contrainte : poids ET volume — ce n'est jamais la même qui sature */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1"><Weight size={10} /> Poids</span>
                    <span className="font-bold tabular-nums text-slate-600">
                      {tournee.poids_kg.toLocaleString('fr-FR')} / {tournee.camion.charge_utile_kg.toLocaleString('fr-FR')} kg
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', tournee.contrainte_saturante === 'POIDS' ? 'bg-slate-800' : 'bg-slate-400')}
                      style={{ width: `${Math.min(100, tournee.remplissage_poids_pct)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1"><Box size={10} /> Volume</span>
                    <span className="font-bold tabular-nums text-slate-600">
                      {tournee.volume_m3} / {tournee.camion.volume_utile_m3} m³
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', tournee.contrainte_saturante === 'VOLUME' ? 'bg-slate-800' : 'bg-slate-400')}
                      style={{ width: `${Math.min(100, tournee.remplissage_volume_pct)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-3 text-[11px]">
                <span className="text-slate-500">
                  Coût tournée <span className="font-bold text-slate-800">{tournee.cout_fcfa.toLocaleString('fr-FR')} F</span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">
                  soit <span className="font-bold text-slate-800">{tournee.cout_par_palette.toLocaleString('fr-FR')} F</span> par palette livrée
                </span>
              </div>

              {tournee.recommandation && (
                <p className="text-[11px] text-amber-800 font-medium mt-2.5 flex items-start gap-1.5 bg-amber-50 rounded-lg p-2">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {tournee.recommandation}
                </p>
              )}
            </div>

            {/* Feuille de route */}
            <div className="divide-y divide-slate-50">
              {tournee.arrets.map(arret => (
                <div key={arret.ordre} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 shrink-0">
                    {arret.ordre}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{arret.pdv_nom}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin size={9} /> {arret.zone} · {arret.distance_km} km · {arret.commande_ref}
                    </div>
                  </div>
                  {arret.encaissement_attendu != null && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                      encaisser {formatFcfa(arret.encaissement_attendu)} F
                    </span>
                  )}
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-700 tabular-nums">{arret.eta}</div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      {arret.poids_kg} kg · {arret.palettes} pal.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {plan.tournees.length === 0 && (
          <p className="text-xs text-slate-400 py-6">Aucune tournée à composer — rien à expédier aujourd&apos;hui.</p>
        )}
      </div>
    </div>
  )
}
