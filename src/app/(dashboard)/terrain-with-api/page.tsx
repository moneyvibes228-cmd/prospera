'use client'
import Link from 'next/link'
import { Plus, MapPin } from 'lucide-react'
import { TerrainOfflineBanner } from '@/components/terrain/TerrainOfflineBanner'
import { MaZoneCard } from '@/components/phase1/MaZoneCard'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TerrainRaBlock } from '@/components/ra/TerrainRaBlock'
import { AgentMissionsPanelWithApi } from '@/components/terrain/AgentMissionsPanelWithApi'
import { useAuth } from '@/contexts/AuthContext'
import { useVisitsStrict } from '@/hooks/useVisitsStrict'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'
import {
  ApiErrorState,
  ApiPageShell,
} from '@/components/api-ui'
import dynamic from 'next/dynamic'

const MapTerrain = dynamic(() => import('@/components/terrain/MapTerrain'), { ssr: false })

export default function TerrainPageWithApi() {
  const { user } = useAuth()
  const { data: visits, isLoading, isError, error, refetch } = useVisitsStrict()
  const isRa = user?.role === 'GESTIONNAIRE'
  const isAgent = user?.role === 'AGENT_TERRAIN'
  const showMaZone =
    isAgent || user?.role === 'COLLECTRICE' || user?.role === 'COMMERCIAL'

  if (isRa) {
    return (
      <PageWrapper title="Terrain & Agents" subtitle="Carte micro-zones, clients et visites">
        <ApiVersionBanner apiPath="/terrain-with-api" />
        <TerrainRaBlock />
      </PageWrapper>
    )
  }

  if (isLoading) return <LoadingSpinner message="Chargement des visites…" />

  if (isError) {
    return (
      <PageWrapper title="Terrain & Visites" subtitle="Suivi des visites et micro-zones">
        <ApiVersionBanner apiPath="/terrain-with-api" />
        <ApiPageShell title="Carte terrain" endpoint="GET /visites" onRefresh={() => void refetch()}>
          <ApiErrorState
            message={error instanceof Error ? error.message : 'Erreur chargement visites'}
            onRetry={() => void refetch()}
          />
        </ApiPageShell>
      </PageWrapper>
    )
  }

  const data = visits ?? []

  return (
    <PageWrapper title="Terrain & Visites" subtitle="Suivi des visites et micro-zones">
      <ApiVersionBanner apiPath="/terrain-with-api" />
      <ApiPageShell
        title="Carte terrain & visites"
        subtitle={`${data.length} visite(s) planifiée(s) ou réalisée(s).`}
        endpoint="GET /visites"
        onRefresh={() => void refetch()}
      >
        {showMaZone && <MaZoneCard />}
        {isAgent && <AgentMissionsPanelWithApi />}
        <TerrainOfflineBanner />
        <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[320px]">
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
            <MapTerrain visits={data} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link
            href="/terrain/nouvelle-visite"
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors duration-200 cursor-pointer"
          >
            <Plus size={16} /> Nouvelle visite
          </Link>
          <Link
            href="/terrain"
            className="flex items-center gap-2 text-sm text-slate-600 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
          >
            <MapPin size={16} /> Carte complète
          </Link>
        </div>
      </ApiPageShell>
    </PageWrapper>
  )
}
