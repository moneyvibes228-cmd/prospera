'use client'

import { useParams } from 'next/navigation'
import { SecteurDgView } from '@/components/secteurs/SecteurDgView'

export default function SecteurDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  return <SecteurDgView slug={slug} />
}
