'use client'
import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { AiCopilotDrawer } from '@/components/ai/AiCopilotDrawer'
import { isCopilotEnabledForRole } from '@/lib/ai/copilot-questions'
import { ApiVersionRedirect } from '@/components/routing/ApiVersionRedirect'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner message="Chargement de la session..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner message="Redirection vers la connexion..." />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-screen">
      <Suspense fallback={null}>
        <ApiVersionRedirect />
      </Suspense>
      <Sidebar />
      <main className="flex-1 ml-60 overflow-auto bg-slate-50">
        {children}
      </main>
      {isCopilotEnabledForRole(user.role) && <AiCopilotDrawer user={user} />}
    </div>
  )
}
