'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'
import { phasesAd } from '@/lib/api-phases-ad'
import { API_PHASES_AD_ENABLED } from '@/lib/api-config'
import { useTransactionsList } from '@/hooks/usePhasesAd'
import { PhasesAdDataBanner } from '@/components/phases-ad/PhasesAdDataBanner'
import { formatFcfa } from '@/lib/utils'

type TxRow = {
  id?: string
  type?: string
  montant_fcfa?: number
  montant?: number
  client_nom?: string
  statut?: string
  createdAt?: string
}

export function CaisseGuichetPanel() {
  const { data: pending, source, reload } = useTransactionsList({
    type: 'MOBILE',
    statut: 'EN_ATTENTE',
  })
  const [type, setType] = useState<'DEPOT' | 'RETRAIT'>('DEPOT')
  const [montant, setMontant] = useState('')
  const [clientId, setClientId] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const rows = (pending ?? []) as TxRow[]

  async function submitGuichet() {
    if (!API_PHASES_AD_ENABLED) {
      setMsg('Service temporairement indisponible. Réessayez plus tard.')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      await phasesAd.transactions.create({
        type,
        canal: 'GUICHET',
        montant_fcfa: Number(montant),
        client_id: clientId || undefined,
      })
      setMontant('')
      setClientId('')
      setMsg('Transaction enregistrée')
      void reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
      <PhasesAdDataBanner source={source} endpoint="GET /transactions · POST /transactions" compact />
      <h3 className="text-sm font-bold text-slate-900 mb-3">Guichet — saisie & file d&apos;attente</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => setType('DEPOT')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${type === 'DEPOT' ? 'bg-teal-600 text-white' : 'bg-slate-100'}`}
        >
          <ArrowDownLeft size={14} className="inline mr-1" />
          Dépôt
        </button>
        <button
          type="button"
          onClick={() => setType('RETRAIT')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${type === 'RETRAIT' ? 'bg-orange-600 text-white' : 'bg-slate-100'}`}
        >
          <ArrowUpRight size={14} className="inline mr-1" />
          Retrait
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        <input
          type="number"
          placeholder="Montant FCFA"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="ID client (optionnel)"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={busy || !montant}
          onClick={() => void submitGuichet()}
          className="flex items-center justify-center gap-2 bg-teal-600 text-white rounded-lg py-2 text-sm font-bold disabled:opacity-50"
        >
          <Plus size={16} />
          Enregistrer
        </button>
      </div>
      {msg && <p className="text-xs text-slate-600 mb-2">{msg}</p>}
      {rows.length > 0 && (
        <div className="border-t border-slate-100 pt-3 mt-3">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">En attente validation ({rows.length})</div>
          <ul className="divide-y divide-slate-50 text-sm">
            {rows.slice(0, 8).map((t, i) => (
              <li key={t.id ?? i} className="py-2 flex justify-between">
                <span>{t.client_nom ?? t.type ?? 'Transaction'}</span>
                <span className="font-bold">{formatFcfa(t.montant_fcfa ?? t.montant ?? 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
