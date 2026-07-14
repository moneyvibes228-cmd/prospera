'use client'
import { DashboardByRole } from '@distributeur/components/dashboard/DashboardByRole'
import { useAuth } from '@distributeur/contexts/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  return <DashboardByRole role={user.role} />
}
