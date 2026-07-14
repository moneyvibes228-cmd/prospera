import { Suspense } from 'react'
import { FacturationShell } from '@/components/facturation/FacturationShell'

export default function Page() {
  return (
    <Suspense>
      <FacturationShell />
    </Suspense>
  )
}
