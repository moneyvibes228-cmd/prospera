'use client'

import { useState } from 'react'
import { Gavel, Scale, ThumbsUp, ThumbsDown } from 'lucide-react'
import type {
  AvisChargePayload,
  ComiteCreditPayload,
  DecisionRocPayload,
  WorkflowAction,
} from '@/types/credit-api'

interface Props {
  actions: WorkflowAction[]
  apiMode: boolean
  onAvisCharge: (p: AvisChargePayload) => Promise<void>
  onDecisionRoc: (p: DecisionRocPayload) => Promise<void>
  onComite: (p: ComiteCreditPayload) => Promise<void>
  montantDemande?: number
}

export function DossierCreditActions({
  actions,
  apiMode,
  onAvisCharge,
  onDecisionRoc,
  onComite,
  montantDemande = 0,
}: Props) {
  const [panel, setPanel] = useState<'avis' | 'roc' | 'comite' | null>(null)
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState('')
  const [montant, setMontant] = useState(String(montantDemande || ''))

  const canAvis = actions.includes('DONNER_AVIS_CC')
  const canRoc = actions.includes('DECISION_ROC')
  const canComite = actions.includes('VALIDER_COMITE')

  if (!canAvis && !canRoc && !canComite) return null

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    try {
      await fn()
      setPanel(null)
      setNotes('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <p className="text-xs font-bold text-slate-700">Actions workflow</p>

      <div className="flex flex-wrap gap-2">
        {canAvis && (
          <button
            type="button"
            onClick={() => setPanel(panel === 'avis' ? null : 'avis')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
          >
            <ThumbsUp size={14} />
            Avis chargé de crédit
          </button>
        )}
        {canRoc && (
          <button
            type="button"
            onClick={() => setPanel(panel === 'roc' ? null : 'roc')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
          >
            <Scale size={14} />
            Décision ROC
          </button>
        )}
        {canComite && (
          <button
            type="button"
            onClick={() => setPanel(panel === 'comite' ? null : 'comite')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 cursor-pointer"
          >
            <Gavel size={14} />
            Comité crédit
          </button>
        )}
      </div>

      {panel === 'avis' && (
        <div className="border border-slate-100 rounded-lg p-3 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes charge de crédit..."
            className="w-full text-xs border border-slate-200 rounded-lg p-2 min-h-[60px]"
          />
          <input
            type="number"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Montant suggéré"
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  onAvisCharge({
                    avis_favorable: true,
                    montant_suggere: Number(montant) || undefined,
                    notes_charge_credit: notes || undefined,
                  }),
                )
              }
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-green-600 text-white cursor-pointer disabled:opacity-50"
            >
              Favorable
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  onAvisCharge({
                    avis_favorable: false,
                    notes_charge_credit: notes || 'Refus CC',
                  }),
                )
              }
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-red-600 text-white cursor-pointer disabled:opacity-50"
            >
              <ThumbsDown size={12} className="inline mr-1" />
              Défavorable
            </button>
          </div>
        </div>
      )}

      {panel === 'roc' && (
        <div className="border border-slate-100 rounded-lg p-3 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes ROC..."
            className="w-full text-xs border border-slate-200 rounded-lg p-2 min-h-[60px]"
          />
          <input
            type="number"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Montant accordé"
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  onDecisionRoc({
                    approuve: true,
                    montant_accorde: Number(montant) || undefined,
                    notes_roc: notes || undefined,
                  }),
                )
              }
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-green-600 text-white cursor-pointer disabled:opacity-50"
            >
              Approuver → comité
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  onDecisionRoc({
                    approuve: false,
                    motif_refus: notes || 'Refus ROC',
                  }),
                )
              }
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-red-600 text-white cursor-pointer disabled:opacity-50"
            >
              Refuser
            </button>
          </div>
        </div>
      )}

      {panel === 'comite' && (
        <div className="border border-slate-100 rounded-lg p-3 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes comité..."
            className="w-full text-xs border border-slate-200 rounded-lg p-2 min-h-[60px]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  onComite({ favorable: true, notes_comite: notes || undefined }),
                )
              }
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-green-600 text-white cursor-pointer disabled:opacity-50"
            >
              Valider → gestion PF
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  onComite({ favorable: false, notes_comite: notes || 'Refus comité' }),
                )
              }
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-red-600 text-white cursor-pointer disabled:opacity-50"
            >
              Refuser
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
