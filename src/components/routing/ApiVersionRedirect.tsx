'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getApiRouteForMockPath, getMockRouteForApiPath } from '@/lib/api-ui-switch'

type Props = {
  /** Route mock de référence (ex. `/credit/recouvrement`) — déduit du pathname si omis */
  mockPath?: string
}

/**
 * Redirige selon la session :
 * - session API → pages `-with-api`
 * - session mock → pages mock (sans `-with-api`)
 */
export function ApiVersionRedirect({ mockPath }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { sessionSource } = useAuth()

  useEffect(() => {
    if (!sessionSource) return

    const current = (pathname ?? '').split('?')[0]?.replace(/\/$/, '') || ''
    const q = searchParams.toString()
    const suffix = q ? `?${q}` : ''

    if (sessionSource === 'api') {
      if (getMockRouteForApiPath(current)) return
      const mockBase = mockPath ?? current
      const target = getApiRouteForMockPath(mockBase)
      if (target && current !== target) {
        router.replace(`${target}${suffix}`)
      }
      return
    }

    if (sessionSource === 'mock') {
      const target = getMockRouteForApiPath(current)
      if (target && current !== target) {
        router.replace(`${target}${suffix}`)
      }
    }
  }, [sessionSource, mockPath, pathname, router, searchParams])

  return null
}
