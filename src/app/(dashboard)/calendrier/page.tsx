'use client'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CalendrierCcBlock } from '@/components/cc/CalendrierCcBlock'
import { getCcHubData } from '@/lib/cc-credit-hub'

export default function CalendrierPage() {
  const hub = getCcHubData()

  return (
    <PageWrapper
      title="Planning crédit"
      subtitle={`Vue semaine · RDV, comités, échéances dossiers — ${hub.agent.nom}`}
    >
      <CalendrierCcBlock />
    </PageWrapper>
  )
}
