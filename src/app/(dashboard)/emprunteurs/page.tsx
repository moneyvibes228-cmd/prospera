'use client'
import { useState, useMemo } from 'react'
import { UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { BorrowerTable } from '@/components/emprunteurs/BorrowerTable'
import { BorrowerFilters } from '@/components/emprunteurs/BorrowerFilters'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useBorrowers } from '@/hooks/useBorrowers'
import { PortfolioEmprunteursView } from '@/components/gp/PortfolioEmprunteursView'
import { GP_BORROWER_IDS } from '@/lib/gp-portefeuille-hub'
import { AGENCE_RA } from '@/lib/ra-agence-hub'
import { AGENCES } from '@/lib/agences'
import type { BorrowerFilters as FiltersType, Borrower } from '@/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const TABS = [
  { id: 'tous',      label: 'Tous',      filter: null },
  { id: 'critiques', label: 'Critiques', filter: (b: Borrower) => b.score_ia < 40 },
  { id: 'retard',    label: 'En retard', filter: (b: Borrower) => b.retard_jours > 0 },
  { id: 'sains',     label: 'Sains',     filter: (b: Borrower) => b.score_ia >= 70 },
]

export default function EmprunteursPage() {
  const { user } = useAuth()
  const isRa = user?.role === 'GESTIONNAIRE'
  const isGp = user?.role === 'GESTIONNAIRE_PORTEFEUILLE'
  const zoneAgence = isRa ? AGENCE_RA.nom : undefined

  const [filters, setFilters] = useState<FiltersType>(() =>
    zoneAgence ? { zone: zoneAgence } : {}
  )
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('nom')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [activeTab, setActiveTab] = useState('tous')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useBorrowers(filters)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let items = data ?? []

    if (isGp) {
      const ids = new Set(GP_BORROWER_IDS as readonly string[])
      items = items.filter(b => ids.has(b.id))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(b => b.nom.toLowerCase().includes(q))
    }

    const tab = TABS.find(t => t.id === activeTab)
    if (tab?.filter) {
      items = items.filter(tab.filter)
    }

    items = [...items].sort((a, b) => {
      let va: string | number = a[sortKey as keyof Borrower] as string | number
      let vb: string | number = b[sortKey as keyof Borrower] as string | number
      if (sortKey === 'agent') {
        va = a.agent?.nom ?? ''
        vb = b.agent?.nom ?? ''
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return items
  }, [data, search, activeTab, sortKey, sortDir, isGp])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const agenceRef = isRa && zoneAgence ? AGENCES.find(a => a.nom_court === zoneAgence) : undefined
  const totalAffiche = isRa && agenceRef ? agenceRef.emprunteurs_actifs : filtered.length

  if (isLoading) return <LoadingSpinner message="Chargement des emprunteurs..." />

  if (isGp) {
    return (
      <PageWrapper
        title="Mes clients"
        subtitle="300 clients Lomé Centre · fiches et mauvais payeurs agence"
      >
        <PortfolioEmprunteursView />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={`Emprunteurs (${totalAffiche})${isRa ? ` — ${AGENCE_RA.nom}` : ''}`}
      subtitle={isRa ? 'Clients emprunteurs de votre agence — fiches et recouvrement' : 'Gestion du portefeuille clients'}
      actions={
        !isRa ? (
          <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <UserPlus size={16} />
            Nouveau emprunteur
          </button>
        ) : undefined
      }
    >
      <BorrowerFilters
        filters={filters}
        search={search}
        onFiltersChange={f => {
          setFilters(isRa && zoneAgence ? { ...f, zone: zoneAgence } : f)
          setPage(1)
        }}
        onSearchChange={s => { setSearch(s); setPage(1) }}
        lockZone={isRa ? zoneAgence : undefined}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map(tab => {
          const count = tab.filter
            ? (data ?? []).filter(tab.filter).length
            : (data ?? []).length
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1) }}
              className={cn(
                'px-4 py-2 text-sm rounded-lg font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      <BorrowerTable
        data={paginated}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} emprunteurs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-700 font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
