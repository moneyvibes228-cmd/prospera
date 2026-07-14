import { Suspense } from 'react'
import { ApprovisionnementView } from '@distributeur/components/approvisionnement/ApprovisionnementView'

export default function Page() {
  return (
    <Suspense>
      <ApprovisionnementView />
    </Suspense>
  )
}
