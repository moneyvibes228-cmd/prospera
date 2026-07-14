import { Suspense } from 'react'
import { StockLogistiqueView } from '@distributeur/components/stock/StockLogistiqueView'

export default function Page() {
  return (
    <Suspense>
      <StockLogistiqueView />
    </Suspense>
  )
}
