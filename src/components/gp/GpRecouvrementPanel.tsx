'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, HandCoins, History } from 'lucide-react'
import { API_CREDIT_PHASE2_ENABLED } from '@/lib/api-config'
import { creditPhase2 } from '@/lib/api-credit-phase2'
import { gestionPortefeuille } from '@/lib/api-gestion-portefeuille'
import type { WorkflowAction } from '@/types/credit-api'
import type {
  ActionRecouvrementLigne,
  EcheancierResume,
  PromessePaiement,
} from '@/types/gestion-portefeuille'
import type { EcheanceLigne } from '@/types/credit-api'
import { formatFcfa } from '@/lib/utils'

interface Props {
  dossierId: string
  actions: WorkflowAction[]
  mensualite?: number
  onPaid?: () => void
}

export function GpRecouvrementPanel({ dossierId, actions, mensualite, onPaid }: Props) {
  const [lignes, setLignes] = useState<EcheanceLigne[]>([])
  const [resume, setResume] = useState<EcheancierResume | null>(null)
  const [promesses, setPromesses] = useState<PromessePaiement[]>([])
  const [historique, setHistorique] = useState<ActionRecouvrementLigne[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const [payEcheanceId, setPayEcheanceId] = useState('')
  const [payMontant, setPayMontant] = useState('')
  const [promMontant, setPromMontant] = useState('')
  const [promDate, setPromDate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (API_CREDIT_PHASE2_ENABLED) {
        const [ech, res, prom, act] = await Promise.all([
          creditPhase2.dossiers.echeancier(dossierId),
          creditPhase2.dossiers.echeancierResume(dossierId).catch(() => null),
          gestionPortefeuille.listPromesses(dossierId).catch(() => ({ data: [] })),
          gestionPortefeuille.actions(dossierId).catch(() => ({ data: [] })),
        ])
        const echBody = ech.data as { lignes?: EcheanceLigne[] }
        setLignes(echBody.lignes ?? [])
        if (res) setResume(res.data)
        setPromesses(Array.isArray(prom.data) ? prom.data : [])
        setHistorique(Array.isArray(act.data) ? act.data : [])
      } else {
        setLignes([
          {
            id: 'ech-mock-1',
            numero: 1,
            date_echeance: '2026-06-15',
            montant: mensualite ?? 45_833,
            statut: 'A_VENIR',
          },
          {
            id: 'ech-mock-2',
            numero: 2,
            date_echeance: '2026-05-10',
            montant: mensualite ?? 45_833,
            statut: 'RETARD',
          },
        ])
        setResume({ en_retard: 1, montant_retard_fcfa: mensualite ?? 45_833 })
        setPromesses([])
        setHistorique([])
      }
    } finally {
      setLoading(false)
    }
  }, [dossierId, mensualite])

  useEffect(() => {
    void load()
  }, [load])

  async function handleRelance() {
    setMsg(null)
    if (API_CREDIT_PHASE2_ENABLED) {
      await gestionPortefeuille.relanceEmail(dossierId)
    }
    setMsg('Relance email envoyée.')
    void load()
  }

  async function handlePromesse() {
    setMsg(null)
    if (!promMontant || !promDate) return
    if (API_CREDIT_PHASE2_ENABLED) {
      await gestionPortefeuille.createPromesse(dossierId, {
        montant_promis: Number(promMontant),
        date_promesse: promDate,
      })
    }
    setMsg('Promesse enregistrée.')
    setPromMontant('')
    void load()
  }

  async function handlePayer() {
    setMsg(null)
    if (!payEcheanceId || !payMontant) return
    if (API_CREDIT_PHASE2_ENABLED) {
      await creditPhase2.dossiers.payerEcheance(dossierId, payEcheanceId, {
        montant_paye: Number(payMontant),
        canal: 'AGENCE',
        notes: 'Paiement guichet',
      })
    }
    setMsg('Paiement enregistré.')
    onPaid?.()
    void load()
  }

  if (loading) return <p className="text-sm text-slate-500">Chargement recouvrement…</p>

  return (
    <div className="space-y-4">
      {resume && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {resume.en_retard != null && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-2">
              <span className="text-red-600 font-bold">{resume.en_retard}</span> en retard
            </div>
          )}
          {resume.montant_retard_fcfa != null && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-2">
              Retard {formatFcfa(resume.montant_retard_fcfa)}
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <p className="text-[10px] font-bold text-slate-500 uppercase px-4 py-2 bg-slate-50">Échéancier</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-100">
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Date</th>
              <th className="text-right p-2">Montant</th>
              <th className="text-left p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.id} className="border-b border-slate-50">
                <td className="p-2">{l.numero}</td>
                <td className="p-2">{l.date_echeance}</td>
                <td className="p-2 text-right font-semibold">{formatFcfa(Number(l.montant))}</td>
                <td className="p-2">{l.statut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {actions.includes('PAYER_ECHEANCE') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
            <HandCoins size={14} /> Encaisser une échéance
          </p>
          <select
            value={payEcheanceId}
            onChange={(e) => setPayEcheanceId(e.target.value)}
            className="w-full text-xs border border-emerald-200 rounded-lg px-2 py-1.5"
          >
            <option value="">Échéance…</option>
            {lignes.map((l) => (
              <option key={l.id} value={l.id}>
                #{l.numero} — {l.statut} — {formatFcfa(Number(l.montant))}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Montant payé"
            value={payMontant}
            onChange={(e) => setPayMontant(e.target.value)}
            className="w-full text-xs border border-emerald-200 rounded-lg px-2 py-1.5"
          />
          <button
            type="button"
            onClick={() => void handlePayer()}
            className="w-full py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg cursor-pointer"
          >
            POST …/echeancier/:id/payer
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {actions.includes('ENVOYER_RELANCE_EMAIL') && (
          <button
            type="button"
            onClick={() => void handleRelance()}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg cursor-pointer"
          >
            <Mail size={12} /> Relance email
          </button>
        )}
      </div>

      {actions.includes('CREER_PROMESSE_PAIEMENT') && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-violet-900">Nouvelle promesse</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Montant"
              value={promMontant}
              onChange={(e) => setPromMontant(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1.5"
            />
            <input
              type="date"
              value={promDate}
              onChange={(e) => setPromDate(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1.5"
            />
          </div>
          <button
            type="button"
            onClick={() => void handlePromesse()}
            className="text-xs font-bold text-violet-800 hover:underline cursor-pointer"
          >
            Enregistrer promesse
          </button>
        </div>
      )}

      {promesses.length > 0 && (
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-700">Promesses actives</p>
          {promesses.map((p) => (
            <p key={p.id} className="text-slate-600">
              {formatFcfa(p.montant_promis)} — {p.date_promesse} — {p.statut}
            </p>
          ))}
        </div>
      )}

      {historique.length > 0 && (
        <div className="text-xs">
          <p className="font-bold text-slate-700 flex items-center gap-1 mb-2">
            <History size={12} /> Historique recouvrement
          </p>
          {historique.map((h) => (
            <p key={h.id} className="text-slate-600 border-b border-slate-100 py-1">
              {h.date} — {h.type} {h.libelle ? `· ${h.libelle}` : ''}
            </p>
          ))}
        </div>
      )}

      {msg && <p className="text-xs text-teal-800 bg-teal-50 rounded px-2 py-1">{msg}</p>}
    </div>
  )
}
