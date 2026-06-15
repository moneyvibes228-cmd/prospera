'use client'

import { useState } from 'react'
import { Scale, Shield, FileText, Calculator, ShieldAlert } from 'lucide-react'
import { getConformiteHub, type ClasseBceao } from '@/lib/conformite-hub'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ConformiteTables, ConformiteRepartitionBar, CLASSE_LABEL } from '@/components/conformite/ConformiteTables'
import { formatFcfa, cn } from '@/lib/utils'

type Tab = 'classification' | 'provisions' | 'lbc_ft' | 'exports'

/** Conformité BCEAO — version mock standard */
export function ConformiteView() {
  const hub = getConformiteHub()
  const k = hub.kpis
  const lbc = hub.lbc_ft
  const [tab, setTab] = useState<Tab>('classification')
  const [classeFilter, setClasseFilter] = useState<ClasseBceao | ''>('')

  return (
    <>
      <ModuleSyntheseIA texte={hub.synthese_ia} titre="Synthèse IA — Conformité BCEAO" variant="blue" />
      <ModuleKpiGrid
        cols={6}
        items={[
          { label: 'PAR 30', value: `${k.par_30_pct}%`, highlight: k.par_30_pct > 8 ? 'orange' : 'teal' },
          { label: 'PAR 90', value: `${k.par_90_pct}%` },
          { label: 'Provisions', value: formatFcfa(k.provisions_totales_fcfa), highlight: 'teal' },
          { label: 'Couverture', value: `${k.taux_couverture_pct}%` },
          { label: 'Migrations/mois', value: String(k.migrations_mois), highlight: 'orange' },
          { label: 'Dossiers', value: String(k.total_dossiers) },
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Calculator size={18} className="text-teal-600" />
          <span className="font-semibold text-slate-900">Moteur de classification IA</span>
          <AiBadge variant="small" pulse />
        </div>
        <p className="text-sm text-slate-600 mb-3">{hub.calcul_ia.methode} — calcul du {hub.calcul_ia.date_calcul}</p>
        <div className="grid md:grid-cols-5 gap-2">
          {hub.calcul_ia.regles_appliquees.map(r => (
            <div key={r.classe} className="text-xs bg-slate-50 rounded-lg p-2 border border-slate-100">
              <div className="font-mono text-slate-500">{r.tranche}</div>
              <div className="font-bold text-slate-800 mt-0.5">{CLASSE_LABEL[r.classe]}</div>
              <div className="text-red-600 font-medium">{r.provision_pct} %</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-2">
        {([
          { id: 'classification' as const, label: `Classification (${k.total_dossiers})`, icon: Shield },
          { id: 'provisions' as const, label: 'Provisions', icon: Scale },
          { id: 'lbc_ft' as const, label: `LBC/FT (${lbc.kpis.operations_suspectes_mois})`, icon: ShieldAlert },
          { id: 'exports' as const, label: 'Exports', icon: FileText },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setClasseFilter('') }}
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

      {tab === 'classification' && (
        <ConformiteRepartitionBar hub={hub} activeClasse={classeFilter} onSelect={setClasseFilter} />
      )}

      <ConformiteTables
        hub={hub}
        tab={tab}
        classeFilter={classeFilter}
        onClasseFilter={setClasseFilter}
      />
    </>
  )
}
