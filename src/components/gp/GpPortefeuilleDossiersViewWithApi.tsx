'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, Wallet } from 'lucide-react'
import {
  ApiEmptyState,
  ApiErrorState,
  ApiLoadingState,
  ApiPageShell,
  ApiSearchBar,
  ApiSection,
  ApiStatGrid,
} from '@/components/api-ui'
import { usePortefeuilleGpStrict } from '@/hooks/useCreditPhase2Strict'
import { formatFcfa } from '@/lib/utils'

export function GpPortefeuilleDossiersViewWithApi() {
  const [tab, setTab] = useState<'tous' | 'mauvais'>('tous')
  const { items, state, error, reload } = usePortefeuilleGpStrict(tab)
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
    const retard = items.filter((d) => d.en_retard).length
    const mauvais = items.filter((d) => d.est_mauvais_payeur).length
    return [
      { label: 'Dossiers actifs', value: String(items.length) },
      { label: 'En retard', value: String(retard), tone: 'warning' as const },
      { label: 'Mauvais payeurs', value: String(mauvais), tone: 'danger' as const },
      {
        label: 'Encours mensuel',
        value: formatFcfa(items.reduce((s, d) => s + (Number(d.mensualite) || 0), 0)).replace(
          ' FCFA',
          '',
        ),
        hint: 'FCFA / mois',
      },
    ]
  }, [items])

  if (state === 'loading') {
    return (
      <ApiPageShell
        title="Mon portefeuille crédit"
        subtitle="Dossiers en gestion et suivi recouvrement."
        endpoint="GET /gestion-portefeuille/portefeuille"
      >
        <ApiLoadingState label="Chargement du portefeuille…" />
      </ApiPageShell>
    )
  }
  if (state === 'error') {
    return (
      <ApiPageShell
        title="Mon portefeuille crédit"
        endpoint="GET /gestion-portefeuille/portefeuille"
        onRefresh={() => void reload()}
      >
        <ApiErrorState message={error ?? 'Erreur portefeuille'} onRetry={() => void reload()} />
      </ApiPageShell>
    )
  }

  const endpoint =
    tab === 'mauvais'
      ? 'GET /gestion-portefeuille/mauvais-payeurs'
      : 'GET /gestion-portefeuille/portefeuille'

  return (
    <ApiPageShell
      title="Mon portefeuille crédit"
      subtitle="Dossiers en gestion, relances, promesses et encaissements — gestion portefeuille GP."
      endpoint={endpoint}
      onRefresh={() => void reload()}
    >
      <ApiStatGrid items={stats} />

      <ApiSection title="Filtrer le portefeuille" description={endpoint}>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            type="button"
            onClick={() => setTab('tous')}
            className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-colors duration-200 ${
              tab === 'tous'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tout le portefeuille
          </button>
          <button
            type="button"
            onClick={() => setTab('mauvais')}
            className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-colors duration-200 ${
              tab === 'mauvais'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mauvais payeurs
          </button>
        </div>
        <ApiSearchBar value={search} onChange={setSearch} placeholder="Référence, nom client…" />
      </ApiSection>

      {filtered.length === 0 ? (
        <ApiEmptyState
          title="Portefeuille vide"
          description={search ? 'Aucun résultat pour cette recherche.' : 'Aucun dossier en gestion.'}
        />
      ) : (
        <ul className="grid gap-3">
          {filtered.map((d) => (
            <li key={d.dossier_id}>
              <Link
                href={`/credit/dossiers-with-api/${d.dossier_id}`}
                className={`group flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  d.est_mauvais_payeur
                    ? 'border-red-200/80 hover:border-red-300'
                    : 'border-slate-200/80 hover:border-teal-300'
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
                    d.est_mauvais_payeur
                      ? 'bg-red-50 text-red-600 group-hover:bg-red-100'
                      : 'bg-teal-50 text-teal-700 group-hover:bg-teal-100'
                  }`}
                >
                  {d.est_mauvais_payeur ? <AlertTriangle size={20} /> : <Wallet size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] font-bold text-slate-400">{d.reference}</p>
                  <p className="text-base font-bold text-slate-900 truncate">
                    {d.client.prenom} {d.client.nom}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {d.mensualite != null && <>Mensualité {formatFcfa(d.mensualite)} · </>}
                    {d.en_retard ? (
                      <span className="text-red-600 font-semibold">
                        Retard {d.jours_retard ?? '?'} j
                      </span>
                    ) : (
                      <span className="text-emerald-600">À jour</span>
                    )}
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-slate-300 group-hover:text-teal-600 shrink-0 transition-colors duration-200"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ApiPageShell>
  )
}
