'use client'
import { PipelineCreditKanbanWithApi } from '@/components/dashboard/PipelineCreditKanbanWithApi'
import { useAuth } from '@/contexts/AuthContext'
import { isCcRole, isRaRole } from '@/lib/credit-decisions'
import { AGENCE_RA } from '@/lib/ra-agence-hub'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'

export default function PipelineCreditPageWithApi() {
  const { user } = useAuth()
  const isCc = isCcRole(user?.role)
  const isRa = isRaRole(user?.role)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-3 shrink-0">
        <ApiVersionBanner apiPath="/credit/pipeline-with-api" />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Pipeline crédit{isRa ? ` — ${AGENCE_RA.nom}` : isCc ? ' — CC' : ''}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isRa
            ? 'Suivi agence — en analyse CC jusqu\'à validation CC'
            : 'Suivi des dossiers par étape'}
        </p>
      </div>
      <div className="px-6 flex-1 min-h-0">
        <PipelineCreditKanbanWithApi />
      </div>
    </div>
  )
}
