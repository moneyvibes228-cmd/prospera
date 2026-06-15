'use client'

import { getCaisseHub } from '@/lib/caisse-hub'
import { CaisseTables } from '@/components/caisse/CaisseTables'

/** Rapprochement MoMo — délégué aux tableaux trésorerie */
export function MomoValidationPanel() {
  const hub = getCaisseHub()
  return <CaisseTables hub={hub} tab="momo" />
}
