'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EquipesRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/credit/recouvrement#equipes')
  }, [router])
  return null
}
