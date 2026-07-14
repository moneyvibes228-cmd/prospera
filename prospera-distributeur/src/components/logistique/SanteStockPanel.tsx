'use client'

import { useMemo, useState } from 'react'
import {
  Hourglass, Snowflake, Skull, PackageX, Megaphone, TrendingDown, Banknote,
} from 'lucide-react'
import { cn, formatFcfa } from '@/lib/utils'
import { buildSanteStock, type ProblemeStock } from '@/lib/transferts-engine'
import { RapportExportBar } from '@/components/shared/RapportExportBar'
import { PlanLiquidationPanel } from './PlanLiquidationPanel'

const PROBLEME_STYLE: Record<ProblemeStock, { label: string; className: string; icon: typeof Hourglass }> = {
  SURSTOCK: { label: 'Surstock', className: 'bg-amber-100 text-amber-800', icon: Hourglass },
  DORMANT: { label: 'Dormant', className: 'bg-slate-200 text-slate-600', icon: PackageX },
  DLC_COURTE: { label: 'DLC menacée', className: 'bg-red-100 text-red-700', icon: Snowflake },
  OBSOLETE: { label: 'Obsolète', className: 'bg-slate-800 text-white', icon: Skull },
}

/**
 * L'autre moitié du métier de responsable stock, celle que personne ne regarde :
 * un distributeur ne meurt pas que de ruptures, il meurt aussi de son surstock.
 */
export function SanteStockPanel({ entrepots }: { entrepots: string[] }) {
  const sites = useMemo(() => buildSanteStock(entrepots), [entrepots])
  const [filtre, setFiltre] = useState<ProblemeStock | 'tous'>('tous')
  const [ouvert, setOuvert] = useState<string | null>(null)

  const capitalTotal = sites.reduce((s, x) => s + x.capital_immobilise_total, 0)
  const perteTotale = sites.reduce((s, x) => s + x.perte_potentielle, 0)
  const alertes = sites.flatMap(s => s.alertes)
  const filtrees = filtre === 'tous' ? alertes : alertes.filter(a => a.probleme === filtre)

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Banknote size={15} className="text-amber-600" /> L&apos;argent qui dort
          </h3>
          <RapportExportBar
            nomFichier="sante-stock"
            colonnes={['Produit', 'Référence', 'Entrepôt', 'Problème', 'Gravité', 'Stock (u)', 'Couverture (j)', 'DLC (j)', 'Capital immobilisé (FCFA)', 'Perte si inaction (FCFA)', 'Action']}
            getLignes={() =>
              alertes.map(a => [
                a.produit_nom,
                a.produit_ref,
                a.entrepot,
                PROBLEME_STYLE[a.probleme].label,
                a.gravite,
                a.stock,
                a.couverture_jours > 900 ? 'aucune rotation' : Math.round(a.couverture_jours),
                a.jours_avant_peremption ?? '',
                a.capital_immobilise,
                a.perte_si_inaction,
                a.action,
              ])
            }
          />
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Le stock coûte environ <span className="font-bold text-slate-700">22 % de sa valeur par an</span> —
          financement, place, assurance, casse, obsolescence. Une palette qui dort douze mois a donc
          consommé un quart de ce qu&apos;elle vaut, sans jamais rien rapporter.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3.5">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[10px] text-slate-400 font-medium">Capital immobilisé</div>
            <div className="text-base font-black text-slate-900 mt-0.5">{formatFcfa(capitalTotal)} F</div>
            <div className="text-[10px] text-slate-400">au coût d&apos;achat</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-[10px] text-red-600 font-medium">Perte si rien n&apos;est fait</div>
            <div className="text-base font-black text-red-700 mt-0.5">{formatFcfa(perteTotale)} F</div>
            <div className="text-[10px] text-red-500">portage, décote, péremption</div>
          </div>
          {sites.map(site => (
            <div key={site.entrepot} className="bg-slate-50 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 font-medium">{site.entrepot} — part dormante</div>
              <div className={cn(
                'text-base font-black mt-0.5',
                site.part_dormante_pct > 25 ? 'text-red-600' : site.part_dormante_pct > 12 ? 'text-amber-600' : 'text-emerald-600',
              )}>
                {site.part_dormante_pct} %
              </div>
              <div className="text-[10px] text-slate-400">
                {site.sku_surstock} surstock · {site.sku_dormant} dormantes · {site.sku_dlc_courte} DLC
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltre('tous')}
          className={cn(
            'text-[10px] font-bold px-2.5 py-1 rounded-lg',
            filtre === 'tous' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
          )}
        >
          Toutes ({alertes.length})
        </button>
        {(Object.keys(PROBLEME_STYLE) as ProblemeStock[]).map(p => {
          const n = alertes.filter(a => a.probleme === p).length
          if (n === 0) return null
          return (
            <button
              key={p}
              type="button"
              onClick={() => setFiltre(p)}
              className={cn(
                'text-[10px] font-bold px-2.5 py-1 rounded-lg',
                filtre === p ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {PROBLEME_STYLE[p].label} ({n})
            </button>
          )
        })}
      </div>

      <div className="space-y-2.5">
        {filtrees.map(a => {
          const style = PROBLEME_STYLE[a.probleme]
          const Icon = style.icon
          return (
            <div key={`${a.entrepot}-${a.produit_ref}`} className={cn(
              'rounded-xl border bg-white p-4',
              a.gravite === 'CRITIQUE' ? 'border-red-200' : 'border-slate-200',
            )}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', style.className)}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{a.produit_nom}</span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', style.className)}>
                        {style.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{a.entrepot}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                      {a.stock.toLocaleString('fr-FR')} u. en stock ·{' '}
                      {a.couverture_jours > 900 ? 'aucune rotation' : `${Math.round(a.couverture_jours)} j de couverture`}
                      {a.jours_avant_peremption != null && ` · DLC ${a.jours_avant_peremption} j`}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-red-600 tabular-nums flex items-center gap-1 justify-end">
                    <TrendingDown size={13} /> {formatFcfa(a.perte_si_inaction)} F
                  </div>
                  <div className="text-[10px] text-slate-400">
                    sur {formatFcfa(a.capital_immobilise)} F immobilisés
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 mt-2.5">{a.diagnostic}</p>
              <p className="text-[11px] font-semibold text-slate-800 mt-1.5">→ {a.action}</p>

              {a.destockage_suggere && (
                ouvert === `${a.entrepot}-${a.produit_ref}`
                  ? <PlanLiquidationPanel alerte={a} />
                  : (
                    <button
                      type="button"
                      onClick={() => setOuvert(`${a.entrepot}-${a.produit_ref}`)}
                      className="mt-2.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Megaphone size={12} /> Voir le plan de sortie — 5 scénarios chiffrés
                    </button>
                  )
              )}
            </div>
          )
        })}

        {filtrees.length === 0 && (
          <p className="text-xs text-slate-400 py-6 text-center">
            Aucune référence en souffrance — le stock tourne.
          </p>
        )}
      </div>
    </div>
  )
}
