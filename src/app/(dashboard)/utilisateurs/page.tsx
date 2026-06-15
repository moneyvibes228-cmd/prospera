import { PageWrapper } from '@/components/layout/PageWrapper'
import { UtilisateursView } from '@/components/admin/UtilisateursView'

export default function UtilisateursPage() {
  return (
    <PageWrapper
      title="Gestion utilisateurs"
      subtitle="RBAC · Zones d'affectation · MFA · Journal d'accès"
    >
      <UtilisateursView />
    </PageWrapper>
  )
}
