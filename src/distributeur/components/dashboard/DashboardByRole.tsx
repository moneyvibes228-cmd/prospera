'use client'
import type { UserRole } from '@distributeur/types'
import { DashboardDG } from './roles/DashboardDG'
import { DashboardDC } from './roles/DashboardDC'
import { DashboardRespVentes } from './roles/DashboardRespVentes'
import { DashboardSuperviseur } from './roles/DashboardSuperviseur'
import { DashboardCommercial } from './roles/DashboardCommercial'
import { DashboardFreelance } from './roles/DashboardFreelance'
import { DashboardProspection } from './roles/DashboardProspection'
import { DashboardStock } from './roles/DashboardStock'
import { DashboardGestEntrepot } from './roles/DashboardGestEntrepot'
import { DashboardFinance } from './roles/DashboardFinance'
import { DashboardComptable } from './roles/DashboardComptable'
import { DashboardMarketing } from './roles/DashboardMarketing'
import { DashboardRecouvrement } from './roles/DashboardRecouvrement'
import { DashboardGeneric } from './roles/DashboardGeneric'

interface Props { role: UserRole }

export function DashboardByRole({ role }: Props) {
  switch (role) {
    case 'DG': return <DashboardDG />
    case 'DC': return <DashboardDC />
    case 'RESP_VENTES': return <DashboardRespVentes />
    case 'SUPERVISEUR': return <DashboardSuperviseur />
    case 'COMMERCIAL': return <DashboardCommercial />
    case 'FREELANCE': return <DashboardFreelance />
    case 'PROSPECTION': return <DashboardProspection />
    case 'RESP_STOCK': return <DashboardStock />
    case 'GEST_ENTREPOT': return <DashboardGestEntrepot />
    case 'DAF': return <DashboardFinance />
    case 'COMPTABLE': return <DashboardComptable />
    case 'MARKETING': return <DashboardMarketing />
    case 'RECOUVREMENT': return <DashboardRecouvrement />
    default: return <DashboardGeneric />
  }
}
