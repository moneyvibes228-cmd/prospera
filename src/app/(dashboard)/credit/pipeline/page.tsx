'use client'
import { Suspense } from 'react'
import { PipelineCreditKanban } from '@/components/dashboard/PipelineCreditKanban'
import {
  buildCcPipelineStages,
  buildRaPipelineStages,
  buildRocPipelineStages,
  getCcPipelineTotals,
  getRaPipelineTotals,
  getRocPipelineTotals,
} from '@/lib/credit-pipeline-roc'
import { AGENCE_RA } from '@/lib/ra-agence-hub'
import { useAuth } from '@/contexts/AuthContext'
import { isCcRole, isRaRole } from '@/lib/credit-decisions'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'
import { MockVersionBanner } from '@/components/routing/MockVersionBanner'

export default function PipelineCreditPage() {
  const { user } = useAuth()
  const isCc = isCcRole(user?.role)
  const isRa = isRaRole(user?.role)

  if (isRa) {
    const totals = getRaPipelineTotals(buildRaPipelineStages(AGENCE_RA.nom))
    return (
      <div className="flex flex-col h-full">
        <Suspense>
          <ApiVersionRedirect mockPath="/credit/pipeline" />
        </Suspense>
        <div className="px-6 pt-5 pb-3 shrink-0">
          <MockVersionBanner mockPath="/credit/pipeline" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pipeline crédit — {AGENCE_RA.nom}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totals.soumis} soumis · {totals.docsOk} docs OK · {totals.enAnalyse} en analyse · {totals.validesCc} validé CC
          </p>
        </div>
        <div className="px-6 flex-1 min-h-0">
          <PipelineCreditKanban />
        </div>
      </div>
    )
  }

  if (isCc) {
    const totals = getCcPipelineTotals(buildCcPipelineStages())
    return (
      <div className="flex flex-col h-full">
        <Suspense>
          <ApiVersionRedirect mockPath="/credit/pipeline" />
        </Suspense>
        <div className="px-6 pt-5 pb-3 shrink-0">
          <MockVersionBanner mockPath="/credit/pipeline" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pipeline crédit — CC</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totals.soumis} soumis · {totals.docsOk} docs OK · {totals.enAnalyse} en analyse · {totals.validesCc} validé CC
          </p>
        </div>
        <div className="px-6 flex-1 min-h-0">
          <PipelineCreditKanban />
        </div>
      </div>
    )
  }

  const { enAttenteRoc } = getRocPipelineTotals(buildRocPipelineStages())

  return (
    <div className="flex flex-col h-full">
      <Suspense>
        <ApiVersionRedirect mockPath="/credit/pipeline" />
      </Suspense>
      <div className="px-6 pt-5 pb-3 shrink-0">
        <MockVersionBanner mockPath="/credit/pipeline" />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pipeline crédit</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {enAttenteRoc} dossier(s) en validation ROC
        </p>
      </div>
      <div className="px-6 flex-1 min-h-0">
        <PipelineCreditKanban />
      </div>
    </div>
  )
}
