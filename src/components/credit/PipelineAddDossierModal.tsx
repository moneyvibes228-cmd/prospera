'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { addDemoDossier } from '@/lib/credit-pipeline-demo-store'
import { AGENCE_RA } from '@/lib/ra-agence-hub'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
  defaultAgence?: string
}

export function PipelineAddDossierModal({ open, onClose, onCreated, defaultAgence }: Props) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [activite, setActivite] = useState('')
  const [montant, setMontant] = useState('')
  const [objet, setObjet] = useState('')

  if (!open) return null

  const agence = defaultAgence ?? AGENCE_RA.nom

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim() || !montant) return
    addDemoDossier({
      client_prenom: prenom.trim() || 'Client',
      client_nom: nom.trim(),
      activite: activite.trim() || 'Commerce',
      montant: Number(montant.replace(/\s/g, '')) || 0,
      objet: objet.trim() || 'Demande crédit',
      agence,
    })
    setPrenom('')
    setNom('')
    setActivite('')
    setMontant('')
    setObjet('')
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Nouvelle demande crédit</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Étape Soumis — agence {agence}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Prénom</span>
              <input
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                placeholder="Akossi"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Nom *</span>
              <input
                required
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                placeholder="Mensah"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Activité</span>
            <input
              value={activite}
              onChange={e => setActivite(e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              placeholder="Commerce détail"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Montant demandé (FCFA) *</span>
            <input
              required
              type="number"
              min={50000}
              step={10000}
              value={montant}
              onChange={e => setMontant(e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              placeholder="500000"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Objet du crédit</span>
            <textarea
              value={objet}
              onChange={e => setObjet(e.target.value)}
              rows={2}
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none"
              placeholder="Fonds de roulement, équipement…"
            />
          </label>
          <p className="text-[10px] text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            La demande agent est ajoutée automatiquement. Ensuite : pièces (Docs OK) → analyse CC → avis CC.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
            >
              Créer à Soumis
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
