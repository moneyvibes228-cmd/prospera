'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Circle, ClipboardCheck } from 'lucide-react'
import { API_CREDIT_PHASE2_ENABLED } from '@/lib/api-config'
import { creditPhase2 } from '@/lib/api-credit-phase2'
import type { InstructionCcChecklist } from '@/types/gestion-portefeuille'

interface Props {
  dossierId: string
}

const MOCK_CHECKLIST: InstructionCcChecklist = {
  cautionnaires_renseignes: true,
  toutes_visites_caution_effectuees: true,
  tous_dossiers_cautionnaires_recus: false,
  pret_pour_avis_cc: false,
  cautionnaires: [
    { id: 'caut-1', nom: 'Koffi', prenom: 'Jean', dossier_recu: false },
    { id: 'caut-2', nom: 'Mensah', prenom: 'Ama', dossier_recu: false },
  ],
}

export function InstructionCcPanel({ dossierId }: Props) {
  const [checklist, setChecklist] = useState<InstructionCcChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    if (API_CREDIT_PHASE2_ENABLED) {
      try {
        const res = await creditPhase2.dossiers.instructionCc(dossierId)
        setChecklist(res.data)
        setLoading(false)
        return
      } catch {
        setChecklist(MOCK_CHECKLIST)
      }
    } else {
      setChecklist(MOCK_CHECKLIST)
    }
    setLoading(false)
  }, [dossierId])

  useEffect(() => {
    void load()
  }, [load])

  async function markReceived(cautionId: string) {
    if (API_CREDIT_PHASE2_ENABLED) {
      await creditPhase2.dossiers.receptionDossierCaution(dossierId, cautionId, {
        dossier_recu: true,
        notes_reception: notes[cautionId] || 'Dossier reçu',
      })
    }
    void load()
  }

  if (loading || !checklist) {
    return <p className="text-sm text-slate-500">Chargement instruction CC…</p>
  }

  const items = [
    { ok: checklist.cautionnaires_renseignes, label: 'Cautionnaires renseignés' },
    { ok: checklist.toutes_visites_caution_effectuees, label: 'Visites caution effectuées' },
    { ok: checklist.tous_dossiers_cautionnaires_recus, label: 'Dossiers caution reçus' },
    { ok: checklist.pret_pour_avis_cc, label: 'Prêt pour avis CC' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <ClipboardCheck size={18} className="text-teal-600" />
        Instruction CC — checklist
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            {item.ok ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <Circle size={16} className="text-slate-300" />
            )}
            <span className={item.ok ? 'text-slate-800' : 'text-slate-500'}>{item.label}</span>
          </li>
        ))}
      </ul>

      {checklist.cautionnaires && checklist.cautionnaires.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Réception dossiers caution</p>
          {checklist.cautionnaires.map((c) => (
            <div key={c.id} className="border border-slate-100 rounded-lg p-3 text-sm">
              <p className="font-bold text-slate-900">
                {c.prenom} {c.nom}
                {c.dossier_recu && (
                  <span className="ml-2 text-[10px] text-emerald-700 font-bold">REÇU</span>
                )}
              </p>
              {!c.dossier_recu && (
                <>
                  <input
                    type="text"
                    placeholder="Notes réception"
                    value={notes[c.id] ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                    className="w-full mt-2 text-xs border border-slate-200 rounded px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => void markReceived(c.id)}
                    className="mt-2 text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    PATCH réception-dossier
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!checklist.pret_pour_avis_cc && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-1">
          L&apos;avis CC favorable sera refusé (400) tant que la checklist est incomplète.
        </p>
      )}
    </div>
  )
}
