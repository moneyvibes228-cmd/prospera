'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MauvaisPayeursRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/credit/recouvrement#mauvais-payeurs')
  }, [router])
  return null
}
