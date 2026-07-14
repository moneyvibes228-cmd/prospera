'use client'
import { useMemo, useState } from 'react'
import { CalendarClock, Building2 } from 'lucide-react'
import { cn, formatFcfa } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { FicheFournisseur } from './FicheFournisseur'
import {
  REGISTRE_FOURNISSEURS, STATUT_FOURNISSEUR_STYLE,
  DETTE_FOURNISSEURS_TOTALE, DETTE_FOURNISSEURS_ECHUE,
} from '@/lib/registries/fournisseurs-registry'
import { buildEcheancierFournisseurs } from '@/lib/reappro-engine'

const TRANCHE_COULEUR: Record<string, string> = {
  ECHU: '#dc2626',
  'J+7': '#ea580c',
  'J+15': '#d97706',
  'J+30': '#0891b2',
  AU_DELA: '#64748b',
}

export function FournisseursView() {
  const echeancier = useMemo(() => buildEcheancierFournisseurs(), [])
  const [selectionne, setSelectionne] = useState<string | null>(null)

  const fournisseurs = useMemo(
    () => [...REGISTRE_FOURNISSEURS].sort((a, b) => b.encours_du - a.encours_du),
    [],
  )

  const totalEcheancier = echeancier.reduce((s, t) => s + t.montant, 0)

  return (
    <div className="space-y-4">
      {/* Échéancier de la dette — ce qui sort à J+7 / J+15 / J+30 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock size={15} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Échéancier de la dette fournisseurs</h3>
          <AiBadge variant="small" label="Vue DAF" />
          <span className="text-xs text-slate-400 ml-auto">
            {formatFcfa(DETTE_FOURNISSEURS_TOTALE)} dus · {formatFcfa(DETTE_FOURNISSEURS_ECHUE)} échus
          </span>
        </div>

        <div className="space-y-2.5">
          {echeancier.map(t => {
            const pct = totalEcheancier > 0 ? Math.round((t.montant / totalEcheancier) * 100) : 0
            const couleur = TRANCHE_COULEUR[t.tranche]
            return (
              <div key={t.tranche}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: couleur }} />
                    <span className="font-medium text-slate-700">{t.label}</span>
                    <span className="text-[10px] text-slate-400 truncate hidden md:inline">
                      {t.fournisseurs.slice(0, 3).join(' · ')}
                      {t.fournisseurs.length > 3 && ` +${t.fournisseurs.length - 3}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-slate-800">{formatFcfa(t.montant)}</span>
                    <span className="font-bold tabular-nums" style={{ color: couleur }}>{pct}%</span>
                  </div>
                </div>
                <div className="bg-slate-100 rounded-full h-2">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: couleur }} />
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          Un fournisseur non payé livre en retard : la dette échue est la première cause des ruptures du mois.
        </p>
      </div>

      {/* Liste fournisseurs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Building2 size={15} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Panel fournisseurs</h3>
          <span className="text-[10px] text-slate-400 ml-auto">{fournisseurs.length} référencés</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2.5">Fournisseur</th>
                <th className="text-left p-2.5 hidden md:table-cell">Familles</th>
                <th className="text-center p-2.5">Statut</th>
                <th className="text-right p-2.5">Encours dû</th>
                <th className="text-right p-2.5">dont échu</th>
                <th className="text-right p-2.5">Délai réel</th>
                <th className="text-right p-2.5">Fiabilité</th>
              </tr>
            </thead>
            <tbody>
              {fournisseurs.map(f => {
                const st = STATUT_FOURNISSEUR_STYLE[f.statut]
                const retard = f.delai_reel_moyen_j - f.delai_livraison_j
                return (
                  <tr key={f.id}
                    onClick={() => setSelectionne(prev => prev === f.id ? null : f.id)}
                    className={cn('border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors',
                      selectionne === f.id && 'bg-amber-50')}>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-800">{f.nom}</div>
                      <div className="font-mono text-[10px] text-slate-400">{f.code} · {f.pays}</div>
                    </td>
                    <td className="p-2.5 text-slate-500 hidden md:table-cell">{f.categories.join(', ')}</td>
                    <td className="p-2.5 text-center">
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', st.className)}>{st.label}</span>
                    </td>
                    <td className="p-2.5 text-right font-bold tabular-nums">{formatFcfa(f.encours_du)}</td>
                    <td className={cn('p-2.5 text-right font-bold tabular-nums',
                      f.encours_echu > 0 ? 'text-red-600' : 'text-slate-300')}>
                      {f.encours_echu > 0 ? formatFcfa(f.encours_echu) : '—'}
                    </td>
                    <td className={cn('p-2.5 text-right tabular-nums font-bold',
                      retard > 2 ? 'text-red-600' : 'text-emerald-600')}>
                      {f.delai_reel_moyen_j} j
                      <span className="text-[10px] text-slate-400 font-normal"> / {f.delai_livraison_j}</span>
                    </td>
                    <td className={cn('p-2.5 text-right font-black tabular-nums',
                      f.score_fiabilite >= 80 ? 'text-emerald-600' : f.score_fiabilite >= 60 ? 'text-amber-600' : 'text-red-600')}>
                      {f.score_fiabilite}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2 bg-slate-50 text-[10px] text-slate-500">
          Cliquez sur un fournisseur pour ouvrir sa fiche — conditions, dette, produits, comparatif prix.
        </div>
      </div>

      {selectionne && <FicheFournisseur fournisseurId={selectionne} />}
    </div>
  )
}
