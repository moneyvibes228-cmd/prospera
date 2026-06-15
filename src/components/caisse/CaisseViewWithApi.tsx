'use client'

import { useState } from 'react'
import { Wallet, Lock, Smartphone, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useTransactionStatsCaisseStrict } from '@/hooks/usePhasesAdStrict'
import {
  ApiErrorState,
  ApiLoadingState,
  ApiPageShell,
} from '@/components/api-ui'
import { MomoValidationPanelWithApi } from '@/components/caisse/MomoValidationPanelWithApi'
import { CaisseGuichetPanelWithApi } from '@/components/caisse/CaisseGuichetPanelWithApi'
import { formatFcfa } from '@/lib/utils'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { cn } from '@/lib/utils'

export function CaisseViewWithApi() {
  const { data: caisseStats, state, error, reload } = useTransactionStatsCaisseStrict()
  const [tab, setTab] = useState<'mouvements' | 'clotures' | 'momo'>('mouvements')

  if (state === 'loading') {
    return (
      <ApiPageShell title="Caisse & trésorerie" endpoint="GET /transactions/stats/caisse">
        <ApiLoadingState label="Chargement caisse…" />
      </ApiPageShell>
    )
  }

  if (state === 'error') {
    return (
      <ApiPageShell title="Caisse & trésorerie" endpoint="GET /transactions/stats/caisse" onRefresh={() => void reload()}>
        <ApiErrorState message={error ?? 'Erreur caisse'} onRetry={() => void reload()} />
      </ApiPageShell>
    )
  }

  const recentes = caisseStats?.transactions_recentes ?? []

  return (
    <ApiPageShell
      title="Caisse & trésorerie"
      subtitle="Mouvements, clôture journalière et rapprochement MoMo — données backend."
      endpoint="GET /transactions/stats/caisse"
      onRefresh={() => void reload()}
    >
      {tab !== 'momo' && <CaisseGuichetPanelWithApi />}
      <ModuleSyntheseIA
        texte={caisseStats?.libelle ?? 'Synthèse caisse et trésorerie'}
        variant="amber"
        titre="Synthèse IA — Caisse & trésorerie"
      />
      <ModuleKpiGrid
        cols={6}
        items={[
          { label: 'Solde net jour', value: formatFcfa(caisseStats?.solde_net_jour_fcfa ?? 0), highlight: 'teal' },
          { label: 'Entrées jour', value: formatFcfa(caisseStats?.montant_depots_jour_fcfa ?? 0), highlight: 'teal' },
          { label: 'Sorties jour', value: formatFcfa(caisseStats?.montant_retraits_jour_fcfa ?? 0) },
          { label: 'Dépôts', value: String(caisseStats?.depots_jour ?? 0) },
          { label: 'Retraits', value: String(caisseStats?.retraits_jour ?? 0) },
          { label: 'Canal', value: caisseStats?.type ?? 'AGENCE', sub: caisseStats?.libelle },
        ]}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { id: 'mouvements' as const, label: 'Mouvements', icon: Wallet },
          { id: 'clotures' as const, label: 'Clôture journalière', icon: Lock },
          { id: 'momo' as const, label: 'Rapprochement MoMo', icon: Smartphone },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors duration-200',
              tab === t.id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mouvements' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 shadow-sm overflow-hidden">
          {recentes.length === 0 ? (
            <p className="text-sm text-slate-500 p-6 text-center">Aucun mouvement récent</p>
          ) : (
            recentes.map((m, i) => {
              const row = m as Record<string, unknown>
              const type = String(row.type ?? '')
              const isEntree = type.includes('DEPOT') || type.includes('ENTREE')
              return (
                <div
                  key={String(row.id ?? i)}
                  className="p-4 flex flex-wrap items-center gap-4 hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                >
                  <div className={cn('p-2 rounded-lg', isEntree ? 'bg-emerald-100' : 'bg-orange-100')}>
                    {isEntree ? (
                      <ArrowDownLeft size={18} className="text-emerald-700" />
                    ) : (
                      <ArrowUpRight size={18} className="text-orange-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium text-slate-900">{String(row.libelle ?? row.client_nom ?? type)}</div>
                    <div className="text-xs text-slate-500">{String(row.createdAt ?? row.date ?? '—')}</div>
                  </div>
                  <div className="font-bold text-slate-900 tabular-nums">
                    {formatFcfa(Number(row.montant_fcfa ?? row.montant) || 0)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'clotures' && (
        <p className="text-sm text-slate-500 p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center">
          Clôtures journalières — endpoint dédié à brancher côté backend.
        </p>
      )}

      {tab === 'momo' && <MomoValidationPanelWithApi />}
    </ApiPageShell>
  )
}
