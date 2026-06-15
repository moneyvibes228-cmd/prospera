'use client'

import { useCallback, useEffect, useState } from 'react'
import { API_CREDIT_PHASE2_ENABLED } from '@/lib/api-config'
import { gestionPortefeuille } from '@/lib/api-gestion-portefeuille'
import { mockMauvaisPayeursGp, mockPortefeuilleGp } from '@/lib/gp-portefeuille-api-mock'
import type { PortefeuilleGpDossier } from '@/types/gestion-portefeuille'

function unwrapList<T>(data: T[] | { data: T[] }): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: T[] }).data)) {
    return (data as { data: T[] }).data
  }
  return []
}

export function usePortefeuilleGp(mode: 'tous' | 'mauvais' = 'tous') {
  const [items, setItems] = useState<PortefeuilleGpDossier[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'api' | 'mock'>('mock')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (API_CREDIT_PHASE2_ENABLED) {
      try {
        const res =
          mode === 'mauvais'
            ? await gestionPortefeuille.mauvaisPayeurs()
            : await gestionPortefeuille.portefeuille()
        setItems(unwrapList(res.data as PortefeuilleGpDossier[] | { data: PortefeuilleGpDossier[] }))
        setSource('api')
        setLoading(false)
        return
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur portefeuille API')
      }
    }
    setItems(mode === 'mauvais' ? mockMauvaisPayeursGp() : mockPortefeuilleGp())
    setSource('mock')
    setLoading(false)
  }, [mode])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, loading, source, error, reload, apiEnabled: API_CREDIT_PHASE2_ENABLED }
}
