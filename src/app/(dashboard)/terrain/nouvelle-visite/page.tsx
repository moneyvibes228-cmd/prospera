'use client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const VisitForm = dynamic(
  () => import('@/components/terrain/VisitForm').then(m => ({ default: m.VisitForm })),
  { ssr: false }
)

export default function NouvelleVisitePage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/terrain"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
        <span className="text-slate-300">/</span>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Nouvelle visite terrain</h1>
          <p className="text-sm text-slate-500 mt-0.5">Enregistrer une visite avec localisation GPS</p>
        </div>
      </div>
      <VisitForm />
    </div>
  )
}
