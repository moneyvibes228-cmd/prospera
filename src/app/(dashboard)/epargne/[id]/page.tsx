'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CompteEpargneDetailView } from '@/components/epargne/CompteEpargneDetailView'
import { getCompteEpargneDetail } from '@/lib/epargne-compte-detail'

export default function CompteEpargnePage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? ''

  const detail = useMemo(() => getCompteEpargneDetail(id), [id])

  if (!detail) {
    return (
      <PageWrapper title="Compte introuvable" subtitle="Épargne">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-600 mb-4">Aucun compte épargne pour la référence « {id} ».</p>
          <Link href="/epargne" className="text-sm font-bold text-teal-700 hover:text-teal-900">
            ← Retour à l&apos;épargne
          </Link>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={detail.compte.client}
      subtitle={`${detail.compte.numero} · ${detail.produit.nom}`}
    >
      <CompteEpargneDetailView detail={detail} />
    </PageWrapper>
  )
}
