import { PageWrapper } from '@/components/layout/PageWrapper'
import { CoreBankingViewWithApi } from '@/components/banking/CoreBankingViewWithApi'
import { ApiVersionBanner } from '@/components/routing/ApiVersionBanner'

export default function OperationsBancairesPageWithApi() {
  return (
    <PageWrapper title="Opérations bancaires" subtitle="Virements, prélèvements et mouvements clients">
      <ApiVersionBanner apiPath="/operations-bancaires-with-api" />
      <CoreBankingViewWithApi />
    </PageWrapper>
  )
}
