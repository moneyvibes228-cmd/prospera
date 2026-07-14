'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@distributeur/components/layout/Sidebar'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { LoadingSpinner } from '@distributeur/components/shared/LoadingSpinner'
import { canAccess } from '@distributeur/lib/route-access'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const autorise = !!user && canAccess(user.role, pathname)

  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace('/distributeur/login')
    else if (!autorise) router.replace('/distributeur/dashboard')
  }, [user, isLoading, autorise, router])

  if (isLoading || !user || !autorise) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner message={isLoading ? 'Chargement...' : 'Redirection...'} />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 overflow-auto bg-slate-50">{children}</main>
    </div>
  )
}
