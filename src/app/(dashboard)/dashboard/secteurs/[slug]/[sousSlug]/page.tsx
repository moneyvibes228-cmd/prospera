'use client'

import { useParams } from 'next/navigation'
import { SousSecteurDgView } from '@/components/secteurs/SousSecteurDgView'

export default function SousSecteurDetailPage() {
  const params = useParams()
  const secteurSlug = params.slug as string
  const sousSlug = params.sousSlug as string

  return <SousSecteurDgView secteurSlug={secteurSlug} sousSlug={sousSlug} />
}
