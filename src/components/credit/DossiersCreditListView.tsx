'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { mockListDossiersCredit } from '@/lib/credit-mock-workflow'
import { ChevronRight, Search } from 'lucide-react'
import { formatFcfa } from '@/lib/utils'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'

/** Liste dossiers — démo mock uniquement */
export function DossiersCreditListView() {
  const items = useMemo(() => mockListDossiersCredit(), [])
  const [search, setSearch] = useState('')

  const filtered = items.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.reference.toLowerCase().includes(q) ||
      d.client.nom.toLowerCase().includes(q) ||
      d.client.prenom.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <MockVersionBanner mockPath="/credit/dossiers" />
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Référence, client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 py-2 text-sm border border-slate-200 rounded-lg"
        />
      </div>
      <div className="grid gap-2">
        {filtered.map((d) => (
          <Link
            key={`${d.id}-${d.reference}`}
            href={`/credit/dossiers/${encodeURIComponent(d.id)}`}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-400 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono font-bold text-slate-400">{d.reference}</p>
              <p className="text-sm font-bold text-slate-900">
                {d.client.prenom} {d.client.nom}
              </p>
              <p className="text-xs text-slate-500">
                {formatFcfa(Number(d.montant_demande) || 0)} · {String(d.statut)}
              </p>
            </div>
            <ChevronRight size={18} className="text-teal-600 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
