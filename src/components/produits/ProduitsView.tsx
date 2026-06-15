'use client'
import { useState } from 'react'
import { Package, CreditCard, PiggyBank, Users, Receipt, Shield } from 'lucide-react'
import { getProduitsHub, type FamilleProduit } from '@/lib/produits-hub'
import { formatFcfa } from '@/lib/utils'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { cn } from '@/lib/utils'

const FAMILLE_ICON: Record<FamilleProduit, React.ElementType> = {
  CREDIT: CreditCard,
  EPARGNE: PiggyBank,
  TONTINE: Users,
  FRAIS: Receipt,
  ASSURANCE: Shield,
}

const FAMILLE_STYLE: Record<FamilleProduit, string> = {
  CREDIT: 'bg-indigo-100 text-indigo-800',
  EPARGNE: 'bg-blue-100 text-blue-800',
  TONTINE: 'bg-pink-100 text-pink-800',
  FRAIS: 'bg-slate-100 text-slate-700',
  ASSURANCE: 'bg-emerald-100 text-emerald-800',
}

export function ProduitsView() {
  const hub = getProduitsHub()
  const [famille, setFamille] = useState<FamilleProduit | 'ALL'>('ALL')

  const list = famille === 'ALL' ? hub.produits : hub.produits.filter((p) => p.famille === famille)

  return (
    <>
      <ModuleSyntheseIA texte={hub.synthese_ia} titre="Synthèse IA — Catalogue produits" variant="teal" />
      <ModuleKpiGrid
        cols={4}
        items={[
          { label: 'Produits actifs', value: String(hub.kpis.produits_actifs), highlight: 'teal' },
          { label: 'Encours total', value: formatFcfa(hub.kpis.encours_total_fcfa) },
          { label: 'Souscriptions/mois', value: String(hub.kpis.nouveaux_souscriptions_mois) },
          { label: 'Utilisation', value: `${hub.kpis.taux_utilisation_pct}%` },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {hub.repartition_famille.map((r) => {
          const Icon = FAMILLE_ICON[r.famille]
          return (
            <button
              key={r.famille}
              type="button"
              onClick={() => setFamille(r.famille)}
              className={cn(
                'p-4 rounded-xl border text-left transition-colors duration-200 cursor-pointer',
                famille === r.famille ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-300',
              )}
            >
              <Icon size={20} className="text-teal-600 mb-2" />
              <div className="text-xs font-bold text-slate-500">{r.famille}</div>
              <div className="text-lg font-black text-slate-900">{r.count}</div>
              <div className="text-[10px] text-slate-500">{formatFcfa(r.encours_fcfa)}</div>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setFamille('ALL')}
          className={cn(
            'p-4 rounded-xl border text-left transition-colors cursor-pointer',
            famille === 'ALL' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-300',
          )}
        >
          <Package size={20} className="text-slate-600 mb-2" />
          <div className="text-xs font-bold text-slate-500">Tous</div>
          <div className="text-lg font-black">{hub.produits.length}</div>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((p) => {
          const Icon = FAMILLE_ICON[p.famille]
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-300 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className={cn('p-2.5 rounded-lg', FAMILLE_STYLE[p.famille])}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-teal-700">{p.code}</span>
                    <span className="font-bold text-slate-900">{p.nom}</span>
                    {!p.actif && <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">Inactif</span>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{p.description}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-600">
                    {p.taux_annuel_pct != null && <span>Taux {p.taux_annuel_pct}%</span>}
                    {p.montant_min_fcfa != null && <span>Min {formatFcfa(p.montant_min_fcfa)}</span>}
                    {p.montant_max_fcfa != null && <span>Max {formatFcfa(p.montant_max_fcfa)}</span>}
                    {p.frais_dossier_pct != null && <span>Frais {p.frais_dossier_pct}%</span>}
                    {p.garantie_groupe && <span className="text-indigo-600 font-medium">Groupe</span>}
                    {p.assurance_obligatoire && <span className="text-emerald-600 font-medium">Assurance req.</span>}
                  </div>
                  <div className="mt-3 flex justify-between items-end">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Encours</div>
                      <div className="font-black text-teal-700">{formatFcfa(p.encours_fcfa)}</div>
                      <div className="text-xs text-slate-500">{p.clients_actifs} clients</div>
                    </div>
                  </div>
                  {p.suggestion_ia && (
                    <p className="mt-3 text-xs p-2 bg-teal-50 border border-teal-100 rounded-lg text-teal-900">
                      <AiBadge variant="inline" label="IA" /> {p.suggestion_ia}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
