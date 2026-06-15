import { PageWrapper } from '@/components/layout/PageWrapper'
import { KycView } from '@/components/kyc/KycView'

export default function KycPage() {
  return (
    <PageWrapper
      title="KYC & pièces jointes"
      subtitle="Vérification identité · OCR IA · Conformité LBC/FT · Niveaux simplifié / renforcé"
    >
      <KycView />
    </PageWrapper>
  )
}
