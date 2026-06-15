'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { phasesAd } from '@/lib/api-phases-ad'
import { useTransactionsListStrict } from '@/hooks/usePhasesAdStrict'
import { ApiErrorState, ApiLoadingState } from '@/components/api-ui'
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

/** Guichet caisse — API strict */
export function CaisseGuichetPanelWithApi() {
  const { data: pending, state, error, reload } = useTransactionsListStrict({
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

  if (state === 'loading') return <ApiLoadingState label="Chargement file guichet…" />
  if (state === 'error') {
    return (
      <ApiErrorState
        message={error ?? 'Erreur transactions'}
        onRetry={() => void reload()}
      />
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 mb-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-3">Guichet — saisie & file d&apos;attente</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => setType('DEPOT')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 ${
            type === 'DEPOT' ? 'bg-teal-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
          }`}
        >
          <ArrowDownLeft size={14} className="inline mr-1" />
          Dépôt
        </button>
        <button
          type="button"
          onClick={() => setType('RETRAIT')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 ${
            type === 'RETRAIT' ? 'bg-orange-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
          }`}
        >
          <ArrowUpRight size={14} className="inline mr-1" />
          Retrait
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="number"
          placeholder="Montant FCFA"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px]"
        />
        <input
          type="text"
          placeholder="ID client (opt.)"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px]"
        />
        <button
          type="button"
          disabled={busy || !montant}
          onClick={() => void submitGuichet()}
          className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 cursor-pointer hover:bg-teal-700 transition-colors duration-200"
        >
          Enregistrer
        </button>
      </div>
      {msg && <p className="text-xs text-teal-700 mb-2">{msg}</p>}
      {rows.length > 0 ? (
        <ul className="divide-y divide-slate-100 text-sm">
          {rows.map((r, i) => (
            <li key={r.id ?? i} className="py-2 flex justify-between">
              <span>{r.client_nom ?? r.type ?? '—'}</span>
              <span className="font-bold">{formatFcfa(r.montant_fcfa ?? r.montant ?? 0)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Aucune transaction en attente</p>
      )}
    </div>
  )
}
