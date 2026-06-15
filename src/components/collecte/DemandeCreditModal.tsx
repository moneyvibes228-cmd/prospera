'use client'
import { useState } from 'react'
import Link from 'next/link'
import { X, FileText, CheckCircle2 } from 'lucide-react'
import { saveDemandeCredit, type DemandeCreditSession } from '@/lib/clients-session'
import { createDossierCredit } from '@/hooks/useCreditPhase2'
import { API_CREDIT_PHASE2_ENABLED } from '@/lib/api-config'
import { formatFcfa } from '@/lib/utils'

const PRODUITS = [
  'Crédit Commerce',
  'Crédit PME',
  'Crédit Agricole',
  'Crédit Tontine',
  'Crédit Express',
]

interface Props {
  clientId: string
  clientNom: string
  onClose: () => void
  onSuccess: (demande: DemandeCreditSession) => void
}

export function DemandeCreditModal({ clientId, clientNom, onClose, onSuccess }: Props) {
  const [produit, setProduit] = useState(PRODUITS[0])
  const [montant, setMontant] = useState('500000')
  const [duree, setDuree] = useState('12')
  const [objet, setObjet] = useState('')
  const [done, setDone] = useState<DemandeCreditSession | null>(null)
  const [apiDossierId, setApiDossierId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    const objetFinal = objet.trim() || `Demande ${produit}`

    if (API_CREDIT_PHASE2_ENABLED) {
      try {
        const { dossier } = await createDossierCredit({
          clientId,
          montant_demande: Number(montant),
          duree_mois: Number(duree),
          objet_credit: objetFinal,
        })
        setApiDossierId(dossier.id)
        const demande = saveDemandeCredit({
          clientId,
          clientNom,
          produit,
          montant: Number(montant),
          duree_mois: Number(duree),
          objet: objetFinal,
        })
        demande.reference = dossier.reference
        setDone(demande)
        onSuccess(demande)
        return
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la création du dossier')
      } finally {
        setSubmitting(false)
      }
    }

    const demande = saveDemandeCredit({
      clientId,
      clientNom,
      produit,
      montant: Number(montant),
      duree_mois: Number(duree),
      objet: objetFinal,
    })
    setDone(demande)
    onSuccess(demande)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-pink-600" />
            <h2 className="text-sm font-bold text-slate-900">Demande de crédit</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <CheckCircle2 size={40} className="text-green-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900 mb-1">Demande enregistrée</p>
            <p className="text-xs text-slate-600 mb-4">
              Réf. <strong>{done.reference}</strong> · {formatFcfa(done.montant)} · {done.produit}
              <br />Transmise au Chargé de Crédit pour analyse.
            </p>
            {apiDossierId && (
              <Link
                href={`/credit/dossiers/${apiDossierId}`}
                className="block mb-3 text-xs font-semibold text-teal-700 hover:underline"
              >
                Ouvrir la fiche dossier
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <p className="text-xs text-slate-500">Client : <strong className="text-slate-800">{clientNom}</strong></p>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Produit</label>
              <select
                value={produit}
                onChange={e => setProduit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {PRODUITS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  required
                  min={50000}
                  step={10000}
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Durée (mois)</label>
                <input
                  type="number"
                  required
                  min={3}
                  max={36}
                  value={duree}
                  onChange={e => setDuree(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Objet du crédit</label>
              <textarea
                value={objet}
                onChange={e => setObjet(e.target.value)}
                rows={3}
                placeholder="Ex. Achat stock, équipement, fonds de roulement..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />
            </div>

            {submitError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors duration-200 disabled:opacity-60"
            >
              {submitting ? 'Envoi…' : 'Soumettre la demande'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
