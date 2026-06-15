'use client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'

export function AuditDetailPage({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <PageWrapper title={title} subtitle={subtitle}>
      <Link
        href="/audit"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-5 cursor-pointer hover:text-amber-950 transition-colors duration-200"
      >
        <ArrowLeft size={14} />
        Retour Audit & Conformité
      </Link>
      {children}
    </PageWrapper>
  )
}
