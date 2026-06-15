import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProduitsView } from '@/components/produits/ProduitsView'

export default function ProduitsPage() {
  return (
    <PageWrapper
      title="Catalogue produits"
      subtitle="Crédit · Épargne · Tontine · Frais · Assurances"
    >
      <ProduitsView />
    </PageWrapper>
  )
}
