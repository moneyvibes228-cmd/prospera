'use client'
import { useMemo, useState } from 'react'
import { Settings2, History, Info } from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import type { NiveauAutomatisation } from '@distributeur/types'
import {
  REGISTRE_REGLES_REAPPRO, NIVEAU_AUTO_LABEL, JOURNAL_DECLENCHEMENTS,
} from '@distributeur/lib/registries/regles-reappro-registry'
import { REGISTRE_STOCK } from '@distributeur/lib/registries/stock-registry'
import { getFournisseurById } from '@distributeur/lib/registries/fournisseurs-registry'

const MODE_LABEL: Record<string, string> = {
  PREVISION_IA: 'Prévision IA',
  STOCK_CIBLE: 'Stock cible',
  QUANTITE_FIXE: 'Quantité fixe',
}

const NIVEAUX: NiveauAutomatisation[] = ['ALERTE_SEULE', 'PROPOSITION', 'AUTO_SI_SOUS_PLAFOND', 'AUTO_TOTAL']

export function ReglesReapproView() {
  const [filtreNiveau, setFiltreNiveau] = useState<NiveauAutomatisation | 'tous'>('tous')

  const regles = useMemo(() => REGISTRE_REGLES_REAPPRO.map(r => ({
    regle: r,
    produit: REGISTRE_STOCK.find(p => p.reference === r.produit_ref),
    fournisseur: r.fournisseur_prefere_id ? getFournisseurById(r.fournisseur_prefere_id) : undefined,
  })), [])

  const filtrees = filtreNiveau === 'tous'
    ? regles
    : regles.filter(r => r.regle.niveau_auto === filtreNiveau)

  const comptes = useMemo(() => {
    const map = new Map<NiveauAutomatisation, number>()
    for (const r of REGISTRE_REGLES_REAPPRO) {
      map.set(r.niveau_auto, (map.get(r.niveau_auto) ?? 0) + 1)
    }
    return map
  }, [])

  return (
    <div className="space-y-4">
      {/* Niveaux d'automatisation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 size={15} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Niveau d&apos;automatisation par produit</h3>
          <AiBadge variant="small" label={`${REGISTRE_REGLES_REAPPRO.length} règles`} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {NIVEAUX.map(niveau => {
            const meta = NIVEAU_AUTO_LABEL[niveau]
            const n = comptes.get(niveau) ?? 0
            return (
              <button key={niveau} type="button"
                onClick={() => setFiltreNiveau(prev => prev === niveau ? 'tous' : niveau)}
                className={cn('rounded-lg border p-3 text-left transition-all',
                  filtreNiveau === niveau ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 hover:border-slate-300')}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', meta.className)}>
                    {meta.label}
                  </span>
                  <span className="text-lg font-black text-slate-900">{n}</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">{meta.detail}</div>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          <Info size={12} className="mt-0.5 shrink-0" />
          <span>
            <strong className="text-slate-700">Proposition</strong> est le réglage par défaut : le moteur prépare
            la commande, un humain la valide. L&apos;envoi automatique reste réservé aux produits à rotation rapide
            dont le fournisseur est fiable, et toujours sous un plafond.
          </span>
        </div>
      </div>

      {/* Table des règles */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2.5">Produit</th>
                <th className="text-right p-2.5">Seuil</th>
                <th className="text-right p-2.5">Couverture min</th>
                <th className="text-right p-2.5">Stock cible</th>
                <th className="text-left p-2.5">Mode quantité</th>
                <th className="text-center p-2.5">Automatisation</th>
                <th className="text-right p-2.5">Plafond auto</th>
                <th className="text-left p-2.5">Valideur</th>
                <th className="text-left p-2.5 hidden lg:table-cell">Fournisseur préféré</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map(({ regle, produit, fournisseur }) => {
                const meta = NIVEAU_AUTO_LABEL[regle.niveau_auto]
                return (
                  <tr key={regle.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-2.5">
                      <div className="font-medium text-slate-800">{produit?.nom ?? regle.produit_ref}</div>
                      <div className="font-mono text-[10px] text-slate-400">{regle.produit_ref}</div>
                    </td>
                    <td className="p-2.5 text-right tabular-nums">{regle.seuil_stock.toLocaleString('fr-FR')}</td>
                    <td className="p-2.5 text-right tabular-nums">{regle.couverture_min_jours} j</td>
                    <td className="p-2.5 text-right tabular-nums">{regle.stock_cible.toLocaleString('fr-FR')}</td>
                    <td className="p-2.5 text-slate-600">{MODE_LABEL[regle.mode_quantite]}</td>
                    <td className="p-2.5 text-center">
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', meta.className)}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-2.5 text-right tabular-nums text-slate-600">
                      {regle.plafond_auto_fcfa > 0 ? formatFcfa(regle.plafond_auto_fcfa) : '—'}
                    </td>
                    <td className="p-2.5 text-slate-600">{regle.valideur_role.replace(/_/g, ' ')}</td>
                    <td className="p-2.5 text-slate-500 hidden lg:table-cell">
                      {fournisseur?.nom ?? '—'}
                      {fournisseur?.statut === 'SUSPENDU' && (
                        <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700 font-bold">suspendu</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Journal des déclenchements */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <History size={15} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Journal des déclenchements</h3>
          <span className="text-[10px] text-slate-400 ml-auto">traçabilité de l&apos;automatisation</span>
        </div>
        <div className="space-y-2">
          {JOURNAL_DECLENCHEMENTS.map(d => {
            const meta = NIVEAU_AUTO_LABEL[d.niveau_auto]
            return (
              <div key={d.id} className="flex items-start gap-3 text-xs py-2 border-b border-slate-100 last:border-0">
                <span className="font-mono text-[10px] text-slate-400 shrink-0 w-28">{d.date}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{d.produit_nom}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', meta.className)}>
                      {meta.label}
                    </span>
                    {d.commande_ref && (
                      <span className="font-mono text-[10px] text-slate-400">{d.commande_ref}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.resultat}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
