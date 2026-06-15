'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, FileText, Search } from 'lucide-react'
import {
  ApiEmptyState,
  ApiErrorState,
  ApiLoadingState,
  ApiPageShell,
  ApiSearchBar,
  ApiSection,
  ApiStatGrid,
  statutPillClass,
} from '@/components/api-ui'
import { useDossiersCreditListStrict } from '@/hooks/useCreditPhase2Strict'
import { formatFcfa } from '@/lib/utils'

export function DossiersCreditListViewWithApi() {
  const { items, state, error, reload } = useDossiersCreditListStrict()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      (d) =>
        d.reference.toLowerCase().includes(q) ||
        d.client.nom.toLowerCase().includes(q) ||
        d.client.prenom.toLowerCase().includes(q),
    )
  }, [items, search])

  const stats = useMemo(() => {
    const enAnalyse = items.filter((d) => String(d.statut).includes('ANALYSE')).length
    const enGestion = items.filter((d) => String(d.statut).includes('GESTION')).length
    return [
      { label: 'Total dossiers', value: String(items.length) },
      { label: 'En analyse', value: String(enAnalyse), tone: 'warning' as const },
      { label: 'En gestion', value: String(enGestion), tone: 'success' as const },
      {
        label: 'Montant cumulé',
        value: formatFcfa(
          items.reduce((s, d) => s + (Number(d.montant_demande) || 0), 0),
        ).replace(' FCFA', ''),
        hint: 'FCFA demandés',
      },
    ]
  }, [items])

  if (state === 'loading') {
    return (
      <ApiPageShell
        title="Dossiers crédit"
        subtitle="Liste des demandes de crédit en cours."
        endpoint="GET /dossiers-credit"
      >
        <ApiLoadingState label="Chargement des dossiers crédit…" />
      </ApiPageShell>
    )
  }
  if (state === 'error') {
    return (
      <ApiPageShell
        title="Dossiers crédit"
        endpoint="GET /dossiers-credit"
        onRefresh={() => void reload()}
      >
        <ApiErrorState message={error ?? 'Erreur'} onRetry={() => void reload()} />
      </ApiPageShell>
    )
  }

  return (
    <ApiPageShell
      title="Dossiers crédit"
      subtitle="Liste des demandes de crédit, workflow et fiches détaillées — données backend en temps réel."
      endpoint="GET /dossiers-credit"
      onRefresh={() => void reload()}
    >
      <ApiStatGrid items={stats} />

      <ApiSection title="Filtrer">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ApiSearchBar value={search} onChange={setSearch} placeholder="Référence, nom client…" />
          </div>
        </div>
      </ApiSection>

      {filtered.length === 0 ? (
        <ApiEmptyState
          title="Aucun dossier"
          description={search ? 'Aucun résultat pour cette recherche.' : 'Aucun dossier pour le moment.'}
        />
      ) : (
        <ul className="grid gap-3">
          {filtered.map((d) => {
            const montant = Number(d.montant_demande) || 0
            const statut = String(d.statut)
            return (
              <li key={d.id}>
                <Link
                  href={`/credit/dossiers-with-api/${d.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-100 transition-colors duration-200">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-400">{d.reference}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statutPillClass(statut)}`}
                      >
                        {statut.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-base font-bold text-slate-900 truncate">
                      {d.client.prenom} {d.client.nom}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{formatFcfa(montant)}</p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-slate-300 group-hover:text-teal-600 shrink-0 transition-colors duration-200"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </ApiPageShell>
  )
}
