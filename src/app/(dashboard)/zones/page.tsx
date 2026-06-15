'use client'

import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ApiPhase1Banner } from '@/components/phase1/ApiPhase1Banner'
import { ZoneAssignPanel } from '@/components/phase1/ZoneAssignPanel'
import { ZonesDgView } from '@/components/zones/ZonesDgView'
import { useZonesAgents } from '@/hooks/usePhase1'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'

const ZonesAgentsMap = dynamic(
  () => import('@/components/phase1/ZonesAgentsMap').then(m => ({ default: m.ZonesAgentsMap })),
  { ssr: false, loading: () => <div className="h-[420px] bg-slate-100 animate-pulse rounded-xl" /> },
)

function ZonesOperationalView() {
  const { data, isLoading } = useZonesAgents()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const agents = data?.agents ?? []
  const selected = agents.find(a => a.id === selectedId) ?? null

  return (
    <PageWrapper title="Zones terrain" subtitle="Affectation des zones agents — RCC">
      <ApiPhase1Banner />
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-3">
          {isLoading ? (
            <div className="h-[420px] bg-slate-100 animate-pulse rounded-xl" />
          ) : (
            <ZonesAgentsMap agents={agents} selectedAgentId={selectedId} onSelectAgent={setSelectedId} />
          )}
          <div className="flex flex-wrap gap-2">
            {agents.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedId(a.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedId === a.id
                    ? 'bg-fuchsia-700 text-white border-fuchsia-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {a.prenom} {a.nom}
                {!a.zone_affectee && <span className="ml-1 text-amber-600">(sans zone)</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <ZoneAssignPanel agent={selected} />
        </div>
      </div>
    </PageWrapper>
  )
}

export default function ZonesPage() {
  const { user } = useAuth()
  const isDg = user?.role === 'MANAGER'

  if (isDg) {
    return (
      <>
        <Suspense>
          <ApiVersionRedirect mockPath="/zones" />
        </Suspense>
        <ZonesDgView />
      </>
    )
  }

  return (
    <>
      <Suspense>
        <ApiVersionRedirect mockPath="/zones" />
      </Suspense>
      <ZonesOperationalView />
    </>
  )
}
