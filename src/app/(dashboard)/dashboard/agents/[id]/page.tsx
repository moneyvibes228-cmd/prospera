'use client'

import { useParams } from 'next/navigation'
import { getFicheAgentMicrofinance } from '@/lib/fiche-agent-microfinance'
import { FicheAgentMicrofinanceView } from '@/components/equipe/FicheAgentMicrofinance'

export default function AgentDetailPage() {
  const params = useParams()
  const agent = getFicheAgentMicrofinance(params.id as string)

  if (!agent) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-slate-600 font-medium">Agent introuvable.</p>
        <p className="text-sm text-slate-400 mt-1">Identifiant : {String(params.id)}</p>
      </div>
    )
  }

  return <FicheAgentMicrofinanceView agent={agent} />
}
