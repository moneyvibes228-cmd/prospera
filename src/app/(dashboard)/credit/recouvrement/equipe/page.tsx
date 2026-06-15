'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EquipeRecouvrementRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/credit/recouvrement')
  }, [router])
  return null
}
