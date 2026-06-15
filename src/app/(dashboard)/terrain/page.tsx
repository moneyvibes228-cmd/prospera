'use client'
import Link from 'next/link'
import { Suspense } from 'react'
import { Plus, MapPin, WifiOff } from 'lucide-react'
import { TerrainOfflineBanner } from '@/components/terrain/TerrainOfflineBanner'
import { MaZoneCard } from '@/components/phase1/MaZoneCard'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TerrainRaBlock } from '@/components/ra/TerrainRaBlock'
import { AgentMissionsPanel } from '@/components/terrain/AgentMissionsPanel'
import { GpTerrainView } from '@/components/gp/GpTerrainView'
import { useAuth } from '@/contexts/AuthContext'
import { useVisits } from '@/hooks/useVisits'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'
import dynamic from 'next/dynamic'

const MapTerrain = dynamic(() => import('@/components/terrain/MapTerrain'), { ssr: false })

const AGENT_COLORS = [
  { nom: 'Kofi Amavi', color: '#2563eb', bg: 'bg-blue-500' },
  { nom: 'Akua Lawson', color: '#16a34a', bg: 'bg-green-600' },
  { nom: 'Edem Kpélim', color: '#f97316', bg: 'bg-orange-500' },
]

export default function TerrainPage() {
  const { user } = useAuth()
  const { data: visits, isLoading } = useVisits()
  const isRa = user?.role === 'GESTIONNAIRE'
  const isGp = user?.role === 'GESTIONNAIRE_PORTEFEUILLE'
  const isAgent = user?.role === 'AGENT_TERRAIN'
  const showMaZone =
    isAgent || user?.role === 'COLLECTRICE' || user?.role === 'COMMERCIAL'

  if (isGp) {
    return (
      <PageWrapper
        title="Terrain — Lomé Centre"
        subtitle="Localisation des 300 clients · relances prioritaires"
      >
        <Suspense>
          <ApiVersionRedirect mockPath="/terrain" />
        </Suspense>
        <MockVersionBanner mockPath="/terrain" />
        <GpTerrainView />
      </PageWrapper>
    )
  }

  if (isRa) {
    return (
      <PageWrapper
        title="Terrain & Agents"
        subtitle="Couverture micro-zones, visites du jour et périmètres commerciaux — votre agence"
      >
        <Suspense>
          <ApiVersionRedirect mockPath="/terrain" />
        </Suspense>
        <MockVersionBanner mockPath="/terrain" />
        <TerrainRaBlock />
      </PageWrapper>
    )
  }

  if (isLoading) return <LoadingSpinner message="Chargement des visites..." />

  const data = visits ?? []

  return (
    <PageWrapper title="Terrain & Visites" subtitle="Suivi des visites et micro-zones">
      <Suspense>
        <ApiVersionRedirect mockPath="/terrain" />
      </Suspense>
      <MockVersionBanner mockPath="/terrain" />
      {showMaZone && <MaZoneCard />}
      {isAgent && <AgentMissionsPanel />}
      <TerrainOfflineBanner />
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        <div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Aujourd&apos;hui</h3>
            <div className="text-sm font-bold text-slate-900">{data.length} visites</div>
          </div>
          {AGENT_COLORS.map((a) => (
            <div key={a.nom} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${a.bg}`} />
              <span className="text-slate-700">{a.nom}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200">
          <MapTerrain visits={data} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href="/terrain/offline"
          className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-lg text-sm"
        >
          <WifiOff size={16} /> Hors-ligne
        </Link>
        <Link
          href="/terrain/nouvelle-visite"
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={16} /> Nouvelle visite
        </Link>
        <Link href="/terrain/historique" className="flex items-center gap-2 text-teal-700 text-sm px-4 py-2">
          <MapPin size={16} /> Historique
        </Link>
      </div>
    </PageWrapper>
  )
}
