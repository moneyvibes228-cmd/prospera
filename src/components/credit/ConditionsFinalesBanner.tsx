'use client'

import { Banknote } from 'lucide-react'
import { formatFcfa } from '@/lib/utils'
import type { ConditionsFinales } from '@/types/credit-api'
import type { DossierCreditDetail } from '@/types/credit-api'

interface Props {
  dossier: DossierCreditDetail
  conditions?: ConditionsFinales | null
}

export function ConditionsFinalesBanner({ dossier, conditions }: Props) {
  const mensualite =
    conditions?.mensualite ??
    (dossier.mensualite != null ? Number(dossier.mensualite) : null)
  const montant =
    conditions?.montant_accorde ??
    (dossier.montant_accorde != null ? Number(dossier.montant_accorde) : null)

  if (!mensualite && dossier.statut !== 'EN_GESTION' && dossier.statut !== 'CLOTURE') {
    return null
  }

  if (!mensualite) return null

  return (
    <div className="bg-gradient-to-r from-teal-600 to-emerald-700 rounded-xl p-4 text-white flex flex-wrap items-center gap-4">
      <Banknote size={28} className="opacity-90 shrink-0" />
      <div className="flex-1 min-w-[200px]">
        <p className="text-[10px] font-bold uppercase text-teal-100">Conditions finales — comité validé</p>
        <p className="text-lg font-black">
          Mensualité {formatFcfa(mensualite)}
          {conditions?.duree_mois && (
            <span className="text-sm font-semibold text-teal-100 ml-2">
              · {conditions.duree_mois} mois
            </span>
          )}
        </p>
        {montant != null && (
          <p className="text-xs text-teal-50 mt-0.5">
            Montant accordé {formatFcfa(montant)}
            {conditions?.taux_interet_mensuel_pct != null &&
              ` · taux ${conditions.taux_interet_mensuel_pct}%`}
          </p>
        )}
      </div>
    </div>
  )
}
