'use client'
import Link from 'next/link'
import { WifiOff, ChevronRight } from 'lucide-react'
import { getTerrainOfflineHub } from '@/lib/terrain-offline-hub'

export function TerrainOfflineBanner() {
  const hub = getTerrainOfflineHub()
  const pending = hub.kpis.actions_en_attente

  return (
    <Link
      href="/terrain/offline"
      className="flex flex-wrap items-center gap-3 p-4 mb-6 bg-slate-900 text-white rounded-xl border border-slate-700 hover:border-teal-500 transition-colors duration-200 cursor-pointer group"
    >
      <WifiOff size={20} className="text-teal-400 flex-shrink-0" />
      <div className="flex-1 min-w-[200px]">
        <div className="font-semibold text-sm">Mode hors-ligne & synchronisation</div>
        <div className="text-xs text-slate-400 mt-0.5">
          {pending > 0
            ? `${pending} action(s) en attente de sync · Dernière sync ${hub.derniere_sync}`
            : `Tout synchronisé · Dernière sync ${hub.derniere_sync}`}
        </div>
      </div>
      {pending > 0 && (
        <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full">
          {pending}
        </span>
      )}
      <ChevronRight size={18} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
    </Link>
  )
}
