import { PageWrapper } from '@/components/layout/PageWrapper'
import { CaisseViewWithApi } from '@/components/caisse/CaisseViewWithApi'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'

export default function CaissePageWithApi() {
  return (
    <PageWrapper
      title="Caisse & trésorerie"
      subtitle="Mouvements · clôture · validation MoMo"
    >
      <ApiVersionBanner apiPath="/caisse-with-api" />
      <CaisseViewWithApi />
    </PageWrapper>
  )
}
