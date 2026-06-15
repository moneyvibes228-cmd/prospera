'use client'
import type { UserRole } from '@/types'
import { DashboardResponsableAgence } from './roles/DashboardResponsableAgence'
import { DashboardGestionnairePortefeuille } from './roles/DashboardGestionnairePortefeuille'
import DashboardTerrain from './roles/DashboardTerrain'
import { DashboardCommercial } from './roles/DashboardCommercial'
import DashboardResponsableCommercial from './roles/DashboardResponsableCommercial'
import DashboardCommunication from './roles/DashboardCommunication'
import { DashboardChargeCredit } from './roles/DashboardChargeCredit'
import { DashboardResponsableCredit } from './roles/DashboardResponsableCredit'
import { DashboardCreditRisque } from './roles/DashboardCreditRisque'
import { DashboardFinancesComplet } from './roles/DashboardFinancesComplet'
import { DashboardAuditeur } from './roles/DashboardAuditeur'
import { DashboardDAF } from './roles/DashboardDAF'
import { DashboardManager } from './roles/DashboardManager'
import { DashboardResponsableAgenceWithApi } from './roles/DashboardResponsableAgenceWithApi'
import { DashboardGestionnairePortefeuilleWithApi } from './roles/DashboardGestionnairePortefeuilleWithApi'
import DashboardTerrainWithApi from './roles/DashboardTerrainWithApi'
import DashboardResponsableCommercialWithApi from './roles/DashboardResponsableCommercialWithApi'
import { DashboardChargeCreditWithApi } from './roles/DashboardChargeCreditWithApi'
import { DashboardResponsableCreditWithApi } from './roles/DashboardResponsableCreditWithApi'

interface Props {
  role: UserRole
  /** true = composants *WithApi (données backend) */
  apiMode?: boolean
}

export function DashboardByRole({ role, apiMode = false }: Props) {
  if (apiMode) {
    switch (role) {
      case 'MANAGER':
        return <DashboardManager />
      case 'GESTIONNAIRE':
        return <DashboardResponsableAgenceWithApi />
      case 'GESTIONNAIRE_PORTEFEUILLE':
        return <DashboardGestionnairePortefeuilleWithApi />
      case 'AGENT_TERRAIN':
      case 'COLLECTRICE':
        return <DashboardTerrainWithApi />
      case 'COMMERCIAL':
        return <DashboardCommercial />
      case 'RESPONSABLE_COMMERCIAL':
        return <DashboardResponsableCommercialWithApi />
      case 'CREDIT':
        return <DashboardChargeCreditWithApi />
      case 'RESPONSABLE_CREDIT':
        return <DashboardResponsableCreditWithApi />
      case 'RISQUE':
        return <DashboardCreditRisque />
      case 'RELANCE':
      case 'COMPTABLE':
      case 'PAIE':
        return <DashboardFinancesComplet />
      case 'AUDITEUR':
        return <DashboardAuditeur />
      case 'DAF':
        return <DashboardDAF />
      case 'COMMUNICATION':
        return <DashboardCommunication />
      default:
        return <DashboardManager />
    }
  }

  switch (role) {
    case 'MANAGER':
      return <DashboardManager />
    case 'GESTIONNAIRE':
      return <DashboardResponsableAgence />
    case 'GESTIONNAIRE_PORTEFEUILLE':
      return <DashboardGestionnairePortefeuille />
    case 'AGENT_TERRAIN':
    case 'COLLECTRICE':
      return <DashboardTerrain />
    case 'COMMERCIAL':
      return <DashboardCommercial />
    case 'RESPONSABLE_COMMERCIAL':
      return <DashboardResponsableCommercial />
    case 'CREDIT':
      return <DashboardChargeCredit />
    case 'RESPONSABLE_CREDIT':
      return <DashboardResponsableCredit />
    case 'RISQUE':
      return <DashboardCreditRisque />
    case 'RELANCE':
    case 'COMPTABLE':
    case 'PAIE':
      return <DashboardFinancesComplet />
    case 'AUDITEUR':
      return <DashboardAuditeur />
    case 'DAF':
      return <DashboardDAF />
    case 'COMMUNICATION':
      return <DashboardCommunication />
    default:
      return <DashboardManager />
  }
}
