import { PageWrapper } from '@/components/layout/PageWrapper'
import { GroupesView } from '@/components/groupes/GroupesView'

export default function GroupesPage() {
  return (
    <PageWrapper
      title="Groupes & solidarité"
      subtitle="Tontines · Garantie croisée · Réunions · Cohésion IA"
    >
      <GroupesView />
    </PageWrapper>
  )
}
