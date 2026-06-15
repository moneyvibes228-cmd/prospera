import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TerrainOfflinePanel } from '@/components/terrain/TerrainOfflinePanel'

export default function TerrainOfflinePage() {
  return (
    <PageWrapper
      title="Mode hors-ligne"
      subtitle="Synchronisation visites, collecte et documents KYC"
      actions={
        <Link
          href="/terrain"
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Retour terrain
        </Link>
      }
    >
      <TerrainOfflinePanel />
    </PageWrapper>
  )
}
