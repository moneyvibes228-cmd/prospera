import { Suspense } from 'react'
import { EntrepotWorkspaceView } from '@distributeur/components/entrepot/EntrepotWorkspaceView'

export default function Page() {
  return (
    <Suspense>
      <EntrepotWorkspaceView />
    </Suspense>
  )
}
