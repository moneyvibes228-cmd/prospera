'use client'

import { useState } from 'react'
import { Vault, Lock, Smartphone, Layers, ArrowLeftRight } from 'lucide-react'
import { getCaisseHub, getCaisseHubForAgence } from '@/lib/caisse-hub'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { CaisseTables } from '@/components/caisse/CaisseTables'
import { formatFcfa, cn } from '@/lib/utils'

type Tab = 'position' | 'flux' | 'clotures' | 'momo' | 'virements'

/** Trésorerie réseau (DAF) ou caisse agence (RA). Voir `CaisseViewWithApi`. */
export function CaisseView({ agenceId }: { agenceId?: string }) {
  const hub = agenceId ? getCaisseHubForAgence(agenceId) : getCaisseHub()
  const isAgenceScope = Boolean(agenceId)
  const agenceNom = hub.positions[0]?.agence ?? ''
  const k = hub.kpis
  const [tab, setTab] = useState<Tab>('position')

  return (
    <>
      <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
        {isAgenceScope ? (
          <>
            <strong>Caisse agence — {agenceNom}</strong> — liquidité opérationnelle (guichet, Mixx By Yas, Flooz). Périmètre limité à votre agence.
          </>
        ) : (
          <>
            <strong>Trésorerie opérationnelle</strong> — liquidité IMF (caisse, Mixx By Yas, Flooz). Les comptes épargne clients sont sur /epargne.
          </>
        )}
      </div>
      <ModuleSyntheseIA
        texte={hub.synthese_ia}
        variant="amber"
        titre={isAgenceScope ? `Synthèse IA — Caisse ${agenceNom}` : 'Synthèse IA — Trésorerie réseau'}
      />
      <ModuleKpiGrid
        cols={6}
        items={[
          { label: isAgenceScope ? 'Liquidité agence' : 'Liquidité totale', value: formatFcfa(k.liquidite_totale_fcfa), highlight: 'teal' },
          { label: 'Entrées jour', value: formatFcfa(k.entrees_jour_fcfa), highlight: 'teal' },
          { label: 'Sorties jour', value: formatFcfa(k.sorties_jour_fcfa) },
          { label: 'Écart clôture', value: formatFcfa(k.ecart_cloture_fcfa), highlight: k.ecart_cloture_fcfa > 0 ? 'red' : undefined },
          { label: 'Écart MoMo', value: formatFcfa(k.momo_ecart_fcfa), highlight: k.momo_ecart_fcfa > 0 ? 'orange' : undefined },
          isAgenceScope
            ? { label: 'Couverture réserve', value: `${hub.positions[0]?.ratio_couverture_pct ?? '—'} %`, highlight: (hub.positions[0]?.ratio_couverture_pct ?? 200) < 120 ? 'orange' : 'teal' }
            : { label: 'Ag. non clôt.', value: String(k.agences_non_cloturees), highlight: 'orange' },
        ]}
      />

      <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-2">
        {([
          { id: 'position' as const, label: 'Position', icon: Layers },
          { id: 'flux' as const, label: 'Flux jour', icon: WalletIcon },
          { id: 'clotures' as const, label: 'Clôtures', icon: Lock },
          { id: 'momo' as const, label: 'MoMo', icon: Smartphone },
          { id: 'virements' as const, label: 'Virements', icon: ArrowLeftRight },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200',
              tab === t.id ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <CaisseTables hub={hub} tab={tab} />
    </>
  )
}

function WalletIcon(props: { size?: number }) {
  return <Vault {...props} />
}
