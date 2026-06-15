'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, LayoutGrid, List, Sparkles, AlertTriangle, Users } from 'lucide-react'
import { BorrowerTable } from '@/components/emprunteurs/BorrowerTable'
import { PortfolioClientGrid } from '@/components/gp/PortfolioClientGrid'
import {
  getGpAllClients,
  getGpMauvaisPayeurs,
  getGpHubData,
  GP_BORROWER_IDS,
} from '@/lib/gp-portefeuille-hub'
import { useBorrowers } from '@/hooks/useBorrowers'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Borrower } from '@/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 24

type TabId = 'tous' | 'mauvais'

export function PortfolioEmprunteursView() {
  const hub = getGpHubData()
  const allClients = useMemo(() => getGpAllClients(), [])
  const mauvaisPayeurs = useMemo(() => getGpMauvaisPayeurs(), [])

  const [activeTab, setActiveTab] = useState<TabId>('tous')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useBorrowers()

  const portfolioBorrowers = useMemo(() => {
    const ids = new Set(GP_BORROWER_IDS as readonly string[])
    return (data ?? []).filter(b => ids.has(b.id))
  }, [data])

  const filteredClients = useMemo(() => {
    const list = activeTab === 'mauvais'
      ? [...mauvaisPayeurs].sort((a, b) => b.retard_j - a.retard_j)
      : allClients
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      c => c.nom.toLowerCase().includes(q) || c.telephone.includes(q) || c.zone.toLowerCase().includes(q),
    )
  }, [allClients, mauvaisPayeurs, activeTab, search])

  const tableData = useMemo(() => {
    const ids = new Set(filteredClients.map(c => c.borrowerId))
    let items = portfolioBorrowers.filter(b => ids.has(b.id))
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(b => b.nom.toLowerCase().includes(q))
    }
    return items
  }, [filteredClients, portfolioBorrowers, search])

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE))
  const paginatedClients = filteredClients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (isLoading) return <LoadingSpinner message="Chargement de votre portefeuille..." />

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-xl p-4 text-white">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold mb-1">Portefeuille agence Lomé Centre — {hub.agent.nom}</div>
            <p className="text-xs text-sky-50 leading-relaxed">
              {allClients.length} clients · {mauvaisPayeurs.length} mauvais payeurs · PAR 30 {hub.kpis_qualite.par_30_pct}% ·
              recouvrement {hub.kpis_qualite.taux_remboursement_pct}%.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setActiveTab('tous'); setPage(1) }}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors duration-200 cursor-pointer',
            activeTab === 'tous' ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300',
          )}
        >
          <Users size={14} />
          Tous les clients ({allClients.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('mauvais'); setPage(1) }}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors duration-200 cursor-pointer',
            activeTab === 'mauvais' ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-red-300',
          )}
        >
          <AlertTriangle size={14} />
          Mauvais payeurs ({mauvaisPayeurs.length})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-colors duration-200 cursor-pointer',
              viewMode === 'grid' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50',
            )}
            aria-label="Vue grille"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'p-2 rounded-md transition-colors duration-200 cursor-pointer',
              viewMode === 'table' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50',
            )}
            aria-label="Vue tableau"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} affiché{filteredClients.length > 1 ? 's' : ''}
        {activeTab === 'mauvais' ? ' · triés par retard décroissant' : ''}
      </p>

      {viewMode === 'grid' ? (
        <>
          <PortfolioClientGrid clients={paginatedClients} showHeader={false} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer transition-colors duration-200"
              >
                Précédent
              </button>
              <span className="text-sm text-slate-600">{page} / {totalPages}</span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer transition-colors duration-200"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      ) : (
        <BorrowerTable data={tableData as Borrower[]} sortKey="nom" sortDir="asc" onSort={() => {}} />
      )}

      <p className="text-center text-xs text-slate-400">
        Agence Lomé Centre · {allClients.length} clients ·{' '}
        <Link href="/relances" className="text-sky-600 hover:text-sky-800 font-medium cursor-pointer">
          Relances à traiter
        </Link>
        {' · '}
        <Link href="/terrain" className="text-sky-600 hover:text-sky-800 font-medium cursor-pointer">
          Carte terrain
        </Link>
      </p>
    </div>
  )
}
