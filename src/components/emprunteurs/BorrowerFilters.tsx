'use client'
import { Search } from 'lucide-react'
import type { BorrowerFilters as FiltersType } from '@/types'

interface BorrowerFiltersProps {
  filters: FiltersType
  search: string
  onFiltersChange: (f: FiltersType) => void
  onSearchChange: (s: string) => void
  /** Zone verrouillée (ex. responsable d'agence) */
  lockZone?: string
}

export function BorrowerFilters({ filters, search, onFiltersChange, onSearchChange, lockZone }: BorrowerFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-3">
      {/* Barre de recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select
          value={filters.statut ?? ''}
          onChange={e => onFiltersChange({ ...filters, statut: e.target.value || undefined })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="REMBOURSEMENT">En remboursement</option>
          <option value="RETARD">En retard</option>
          <option value="DEFAUT">Défaut</option>
          <option value="RESTRUCTURE">Restructuré</option>
          <option value="EVALUATION">Évaluation</option>
          <option value="INSTRUCTION">En instruction</option>
        </select>

        <select
          value={filters.zone ?? lockZone ?? ''}
          onChange={e => onFiltersChange({ ...filters, zone: e.target.value || undefined })}
          disabled={!!lockZone}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-50 disabled:text-slate-600"
        >
          <option value="">Toutes les zones</option>
          <option value="Lomé Centre">Lomé Centre</option>
          <option value="Adidogomé">Adidogomé</option>
          <option value="Bè Kpota">Bè Kpota</option>
        </select>

        <select
          value={filters.agentId ?? ''}
          onChange={e => onFiltersChange({ ...filters, agentId: e.target.value || undefined })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="">Tous les agents</option>
          <option value="1">Kofi Amavi</option>
          <option value="2">Akua Lawson</option>
          <option value="3">Edem Kpélim</option>
        </select>

        <select
          value={filters.scoreMin !== undefined ? `${filters.scoreMin}-${filters.scoreMax}` : ''}
          onChange={e => {
            const val = e.target.value
            if (!val) {
              onFiltersChange({ ...filters, scoreMin: undefined, scoreMax: undefined })
            } else {
              const [min, max] = val.split('-').map(Number)
              onFiltersChange({ ...filters, scoreMin: min, scoreMax: max })
            }
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="">Tous les scores</option>
          <option value="0-39">Critique (0–39)</option>
          <option value="40-69">À surveiller (40–69)</option>
          <option value="70-100">Sain (70+)</option>
        </select>
      </div>
    </div>
  )
}
