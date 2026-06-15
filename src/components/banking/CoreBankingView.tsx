'use client'

import { useState } from 'react'
import { Banknote, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react'
import { getCoreBankingHub } from '@/lib/core-banking-hub'
import { formatFcfa } from '@/lib/utils'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { CoreBankingTables } from '@/components/banking/CoreBankingTables'
import { cn } from '@/lib/utils'

type Tab = 'prets' | 'decaissements' | 'echeancier' | 'refinancement'

/** Core banking — version mock. Voir `CoreBankingViewWithApi`. */
export function CoreBankingView() {
  const hub = getCoreBankingHub()
  const k = hub.kpis
  const [tab, setTab] = useState<Tab>('prets')

  return (
    <>
      <ModuleSyntheseIA texte={hub.synthese_ia} variant="teal" titre="Synthèse IA — Opérations bancaires" />
      <ModuleKpiGrid
        cols={6}
        items={[
          { label: 'Encours crédit', value: formatFcfa(k.encours_credit_fcfa), highlight: 'teal' },
          { label: 'Décaiss. jour', value: formatFcfa(k.decaissements_jour_fcfa) },
          { label: 'En attente', value: String(k.decaissements_en_attente), highlight: 'orange' },
          { label: 'Échéances jour', value: formatFcfa(k.echeances_jour_fcfa) },
          { label: 'Taux remb.', value: `${k.taux_remboursement_pct}%`, highlight: 'teal' },
          { label: 'Prêts actifs', value: String(k.total_prets) },
        ]}
      />

      <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-2">
        {([
          { id: 'prets' as const, label: `Prêts actifs (${k.total_prets})`, icon: Banknote },
          { id: 'decaissements' as const, label: `Décaissements (${hub.decaissements.length})`, icon: CheckCircle2 },
          { id: 'echeancier' as const, label: `Échéancier (${hub.echeancier_reseau.length})`, icon: Calendar },
          { id: 'refinancement' as const, label: `Refinancement (${hub.refinancement.length})`, icon: RefreshCw },
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

      <CoreBankingTables hub={hub} tab={tab} />
    </>
  )
}
