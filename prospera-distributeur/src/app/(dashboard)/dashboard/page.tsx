'use client'
import { DashboardByRole } from '@/components/dashboard/DashboardByRole'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  return <DashboardByRole role={user.role} />
}
