'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, Search } from 'lucide-react'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'
import { mockMauvaisPayeursGp, mockPortefeuilleGp } from '@/lib/gp-portefeuille-api-mock'
import { formatFcfa } from '@/lib/utils'

/** Portefeuille GP — démo mock uniquement */
export function GpPortefeuilleDossiersView() {
  const [tab, setTab] = useState<'tous' | 'mauvais'>('tous')
  const items = useMemo(
    () => (tab === 'mauvais' ? mockMauvaisPayeursGp() : mockPortefeuilleGp()),
    [tab],
  )
  const [search, setSearch] = useState('')

  const filtered = items.filter((d) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      d.reference.toLowerCase().includes(q) ||
      d.client.nom.toLowerCase().includes(q) ||
      d.client.prenom.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <MockVersionBanner mockPath="/portefeuille" />

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => setTab('tous')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors duration-200 ${
            tab === 'tous' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tout le portefeuille
        </button>
        <button
          type="button"
          onClick={() => setTab('mauvais')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors duration-200 ${
            tab === 'mauvais' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Mauvais payeurs
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
            key={d.dossier_id}
            href={`/credit/dossiers/${d.dossier_id}`}
            className={`flex items-center gap-3 bg-white border rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${
              d.est_mauvais_payeur ? 'border-red-200 hover:border-red-400' : 'border-slate-200 hover:border-sky-400'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-slate-400">{d.reference}</p>
              <p className="text-sm font-bold text-slate-900">
                {d.client.prenom} {d.client.nom}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {d.mensualite != null && <>Mensualité {formatFcfa(d.mensualite)} · </>}
                {d.en_retard ? (
                  <span className="text-red-600 font-semibold">Retard {d.jours_retard ?? '?'} j</span>
                ) : (
                  <span className="text-emerald-600">À jour</span>
                )}
              </p>
            </div>
            {d.est_mauvais_payeur && <AlertTriangle size={18} className="text-red-500 shrink-0" />}
            <ChevronRight size={18} className="text-sky-600 shrink-0" />
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-12">Aucun dossier en gestion</p>
      )}
    </div>
  )
}
