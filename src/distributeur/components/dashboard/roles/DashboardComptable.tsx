'use client'
import { BookOpen, AlertOctagon, Landmark } from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { PerformancePostePanel } from '@distributeur/components/dashboard/PerformancePostePanel'
import { FacturesAchatPanel } from '@distributeur/components/comptabilite/FacturesAchatPanel'
import { useAuth } from '@distributeur/contexts/AuthContext'
import {
  ECRITURES_JOURNAL, SUSPENS_COMPTABLES, RAPPROCHEMENTS,
} from '@distributeur/lib/registries/comptabilite-registry'
import { cn, formatFcfa } from '@distributeur/lib/utils'

export function DashboardComptable() {
  const { user } = useAuth()

  const aValider = ECRITURES_JOURNAL.filter(e => e.statut === 'ATTENTE_VALIDATION' || e.statut === 'BROUILLON')
  const suspens = SUSPENS_COMPTABLES
  const rapprochementsEnEcart = RAPPROCHEMENTS.filter(r => r.statut === 'ECART' || r.statut === 'EN_COURS')

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Comptabilité"
        subtitle={`${user?.zone ?? 'Siège'} — saisie, rapprochement et suspens`}
        badge="Temps réel"
      />

      <PerformancePostePanel role="COMPTABLE" />

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Écritures à traiter</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {aValider.length}
            </span>
          </div>
          {aValider.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Aucune écriture en attente — journal à jour.</p>
          ) : (
            <div className="space-y-1">
              {aValider.map(e => (
                <div key={e.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <span className="font-mono text-slate-400">{e.piece}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="font-medium text-slate-800">{e.libelle}</span>
                    <span className="text-slate-400 ml-2">{e.journal}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-slate-700 tabular-nums">{formatFcfa(e.montant)} F</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold',
                      e.statut === 'ATTENTE_VALIDATION' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600',
                    )}>
                      {e.statut === 'ATTENTE_VALIDATION' ? 'À valider' : 'Brouillon'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertOctagon size={15} className="text-red-600" />
              <h3 className="text-sm font-semibold text-slate-900">Suspens ouverts</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {suspens.length}
              </span>
            </div>
            <div className="space-y-2">
              {suspens.map(s => (
                <div key={s.id} className={cn(
                  'rounded-lg border p-3',
                  s.statut === 'CRITIQUE' ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-slate-50/50',
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-800">{s.libelle}</p>
                    <span className="text-xs font-black text-slate-800 shrink-0 tabular-nums">{formatFcfa(s.montant)} F</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {s.anciennete_j} j · {s.action}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Landmark size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Rapprochements bancaires</h3>
            </div>
            {rapprochementsEnEcart.length === 0 ? (
              <p className="text-xs text-slate-400">Tous les comptes sont pointés.</p>
            ) : (
              <div className="space-y-1">
                {rapprochementsEnEcart.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800">{r.banque}</span>
                      <span className="text-slate-400 ml-2">{r.operations_non_pointees} op. non pointées</span>
                    </div>
                    <span className={cn('font-bold tabular-nums shrink-0', r.ecart === 0 ? 'text-slate-500' : 'text-red-600')}>
                      écart {formatFcfa(r.ecart)} F
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Le pendant achat des factures de vente — c'est lui qui alimente la dette 401100 */}
      <div className="mt-6">
        <FacturesAchatPanel />
      </div>
    </div>
  )
}
