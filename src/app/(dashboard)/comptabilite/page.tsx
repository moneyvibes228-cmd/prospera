import { PageWrapper } from '@/components/layout/PageWrapper'
import { ComptabiliteView } from '@/components/comptabilite/ComptabiliteView'

export default function ComptabilitePage() {
  return (
    <PageWrapper
      title="Comptabilité IMF"
      subtitle="SYSCOHADA révisé · Balance générale · Journal · Grand livre · Compte de résultat · Rapprochement bancaire BCEAO"
    >
      <ComptabiliteView />
    </PageWrapper>
  )
}
