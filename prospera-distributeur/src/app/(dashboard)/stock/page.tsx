import { Suspense } from 'react'
import { StockLogistiqueView } from '@/components/stock/StockLogistiqueView'

export default function Page() {
  return (
    <Suspense>
      <StockLogistiqueView />
    </Suspense>
  )
}
