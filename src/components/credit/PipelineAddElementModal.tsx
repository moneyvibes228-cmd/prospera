'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import {
  addDemoElement,
  DEMO_STAGE_ELEMENT_OPTIONS,
  type DemoElementType,
} from '@/lib/credit-pipeline-demo-store'
import type { DemoAgenceStage } from '@/lib/credit-pipeline-demo-store'
import { DEMO_STAGE_LABELS } from '@/lib/credit-pipeline-demo-store'

interface Props {
  open: boolean
  onClose: () => void
  onAdded: () => void
  dossierId: string
  dossierRef: string
  client: string
  stageId: DemoAgenceStage
}

export function PipelineAddElementModal({
  open,
  onClose,
  onAdded,
  dossierId,
  dossierRef,
  client,
  stageId,
}: Props) {
  const options = DEMO_STAGE_ELEMENT_OPTIONS[stageId]
  const [selected, setSelected] = useState(0)
  const [customLabel, setCustomLabel] = useState('')
  const [score, setScore] = useState('72')

  if (!open || !options.length) return null

  const opt = options[selected] ?? options[0]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const label = customLabel.trim() || opt.defaultLabel
    const meta = opt.type === 'ANALYSE' ? score : opt.type === 'AVIS_CC' ? customLabel.trim() || 'Avis favorable' : undefined
    addDemoElement(dossierId, opt.type as DemoElementType, label, meta)
    setCustomLabel('')
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Ajouter un élément</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {dossierRef} · {client} · {DEMO_STAGE_LABELS[stageId]}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Type d&apos;élément</span>
            <select
              value={selected}
              onChange={e => setSelected(Number(e.target.value))}
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 cursor-pointer"
            >
              {options.map((o, i) => (
                <option key={`${o.type}-${i}`} value={i}>{o.label}</option>
              ))}
            </select>
          </label>
          {opt.type === 'ANALYSE' && (
            <label className="block">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Score consolidé /100</span>
              <input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={e => setScore(e.target.value)}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              />
            </label>
          )}
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              {opt.type === 'AVIS_CC' ? 'Commentaire avis CC' : 'Libellé / détail'}
            </span>
            <textarea
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              rows={2}
              placeholder={opt.defaultLabel}
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none"
            />
          </label>
          <button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
          >
            Enregistrer sur le dossier
          </button>
        </form>
      </div>
    </div>
  )
}
