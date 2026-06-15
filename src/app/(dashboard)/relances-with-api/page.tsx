import { PageWrapper } from '@/components/layout/PageWrapper'
import { RelancesViewWithApi } from '@/components/relances/RelancesViewWithApi'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'

export default function RelancesPageWithApi() {
  return (
    <PageWrapper title="Relances intelligentes" subtitle="Canaux · workflows · promesses de paiement">
      <ApiVersionBanner apiPath="/relances-with-api" />
      <RelancesViewWithApi />
    </PageWrapper>
  )
}
