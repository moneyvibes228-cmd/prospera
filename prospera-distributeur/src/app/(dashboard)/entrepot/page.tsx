import { Suspense } from 'react'
import { EntrepotWorkspaceView } from '@/components/entrepot/EntrepotWorkspaceView'

export default function Page() {
  return (
    <Suspense>
      <EntrepotWorkspaceView />
    </Suspense>
  )
}
