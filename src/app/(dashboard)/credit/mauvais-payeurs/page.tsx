'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MauvaisPayeursBlock } from '@/components/recouvrement/MauvaisPayeursBlock'
import { AGENCE_RA } from '@/lib/ra-agence-hub'

export default function MauvaisPayeursAgencePage() {
  return (
    <PageWrapper
      title="Mauvais payeurs"
      subtitle={`Fiches IA recouvrement — périmètre ${AGENCE_RA.nom}`}
    >
      <Link
        href="/credit"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 mb-4"
      >
        <ArrowLeft size={14} />
        Retour Crédit & Opérations
      </Link>
      <MauvaisPayeursBlock
        defaultAgence={AGENCE_RA.nom}
        lockAgence
        title={`Mauvais payeurs — ${AGENCE_RA.nom}`}
        detailFrom="/credit/mauvais-payeurs"
      />
    </PageWrapper>
  )
}
