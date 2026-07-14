'use client'

import { use } from 'react'
import { PdvRapportView } from '@distributeur/components/pdv/PdvRapportView'

export default function PdvDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <PdvRapportView pdvId={id} />
}
